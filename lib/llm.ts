export class LLMError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "LLMError";
    this.status = status;
  }
}

export const MODEL = process.env.OPENROUTER_MODEL || "google/gemma-4-26b-a4b-it:free";
export const SECOND_MODEL = process.env.OPENROUTER_SECOND_MODEL || "nvidia/nemotron-3-ultra-550b-a55b:free";
export const THIRD_MODEL = process.env.OPENROUTER_THIRD_MODEL || "cohere/north-mini-code:free";
export const FOURTH_MODEL = process.env.OPENROUTER_FOURTH_MODEL || "thinkingmachines/inkling:free";
export const FIFTH_MODEL = process.env.OPENROUTER_FIFTH_MODEL || "qwen/qwen3.8-27b:free";
export const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL?.trim() || "";
export const BASE_URL = process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

/**
 * Ordered attempt list: primary, secondary, tertiary, fourth, fifth, then fallbacks.
 * De-duplicated, blanks dropped.
 */
export function modelList(): string[] {
  const primary = MODEL;
  const secondary = SECOND_MODEL;
  const tertiary = THIRD_MODEL;
  const fourth = FOURTH_MODEL;
  const fifth = FIFTH_MODEL;
  const fallbacks = FALLBACK_MODEL
    .split(",")
    .map((m) => m.trim())
    .filter((m) => !!m);
  // De-duplicate while preserving order: primary, secondary, tertiary, fourth, fifth, then fallbacks
  const seen = new Set<string>();
  const result: string[] = [];
  const addIfNew = (m: string) => {
    if (!m || seen.has(m)) return;
    seen.add(m);
    result.push(m);
  };
  addIfNew(primary);
  addIfNew(secondary);
  addIfNew(tertiary);
  addIfNew(fourth);
  addIfNew(fifth);
  fallbacks.forEach(addIfNew);
  return result;
}

/**
 * Fetches a single model and returns its result or error.
 */
async function fetchModel(
  model: string,
  messages: Message[],
  opts: ChatOptions,
  apiKey: string
): Promise<{ success: boolean; content?: string; finishReason?: string; error?: Error }> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.25,
    max_tokens: opts.maxTokens ?? 3000,
    usage: { include: true },
  };
  if (opts.json) body.response_format = { type: "json_object" };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AlgoAtlas",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 120000),
      cache: "no-store",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    return { success: false, error: new Error(`Could not reach the model provider (${detail}). Try again in a moment.`) };
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      /* keep raw text */
    }
    const status = res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status;
    if (res.status === 402) {
      throw new LLMError(
        "The OpenRouter key has no credits left, so generation is paused. Add credits at openrouter.ai/credits, or set OPENROUTER_MODEL in .env.local to a model your key can use. Reading problems and the visualiser demo still work.",
        402,
      );
    }
    return { success: false, error: new Error(`Model request failed (${res.status}) on ${model}: ${message || "unknown error"}`) };
  }

  let payload: {
    choices?: {
      message?: { content?: string | null; reasoning?: string | null };
      finish_reason?: string;
    }[];
  };
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    return { success: false, error: new Error("The model provider stalled before finishing its answer. Try again, or use a smaller model.") };
  }
  const choice = payload.choices?.[0];
  const content = choice?.message?.content?.trim();
  const finishReason = choice?.finish_reason ?? "stop";

  if (!content) {
    return { success: false, error: new Error(finishReason === "length" ? "The model ran out of room before finishing. Try a shorter problem or retry." : "The model returned an empty response. Try again.") };
  }

  return { success: true, content, finishReason };
}

/**
 * Picks the fastest result from two parallel model calls.
 * Returns the content from whichever model finishes first.
 * If both fail, returns the second model's error (or first if second also fails).
 */
async function parallelFetch(
  model1: string,
  model2: string,
  messages: Message[],
  opts: ChatOptions,
  apiKey: string
): Promise<{ content: string; model: string; finishReason: string }> {
  let result1: { content: string; finishReason: string } | null = null;
  let result2: { content: string; finishReason: string } | null = null;
  let error1: Error | null = null;
  let error2: Error | null = null;

  // Race both models with a shared timeout
  // Shorter timeout encourages faster responses; models have 90s each
  const timeoutMs = opts.timeoutMs ?? 90000; // 90s for parallel calls
  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => abortCtrl.abort(), timeoutMs);

  try {
    // Fetch model 1
    const res1 = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AlgoAtlas",
      },
      body: JSON.stringify({
        model: model1,
        messages,
        temperature: opts.temperature ?? 0.25,
        max_tokens: opts.maxTokens ?? 3000,
        usage: { include: true },
      }),
      signal: abortCtrl.signal,
      cache: "no-store",
    });

    if (res1.ok) {
      const payload1: {
        choices?: { message?: { content?: string | null; reasoning?: string | null }; finish_reason?: string }[];
      } = await res1.json();
      const choice1 = payload1.choices?.[0];
      const content1 = choice1?.message?.content?.trim();
      const finishReason1 = choice1?.finish_reason ?? "stop";
      if (content1) {
        result1 = { content: content1, finishReason: finishReason1 };
      }
    } else {
      const text1 = await res1.text().catch(() => "");
      error1 = new Error(`Model ${model1} failed (${res1.status}): ${text1.slice(0, 200)}`);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      error1 = new Error(`Request timed out after ${timeoutMs}ms`);
    } else {
      error1 = err instanceof Error ? err : new Error(String(err));
    }
  }

  try {
    // Fetch model 2 (still within the same timeout window)
    const res2 = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AlgoAtlas",
      },
      body: JSON.stringify({
        model: model2,
        messages,
        temperature: opts.temperature ?? 0.25,
        max_tokens: opts.maxTokens ?? 3000,
        usage: { include: true },
      }),
      signal: abortCtrl.signal,
      cache: "no-store",
    });

    if (res2.ok) {
      const payload2: {
        choices?: { message?: { content?: string | null; reasoning?: string | null }; finish_reason?: string }[];
      } = await res2.json();
      const choice2 = payload2.choices?.[0];
      const content2 = choice2?.message?.content?.trim();
      const finishReason2 = choice2?.finish_reason ?? "stop";
      if (content2) {
        result2 = { content: content2, finishReason: finishReason2 };
      }
    } else {
      const text2 = await res2.text().catch(() => "");
      error2 = new Error(`Model ${model2} failed (${res2.status}): ${text2.slice(0, 200)}`);
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      error2 = new Error(`Request timed out after ${timeoutMs}ms`);
    } else {
      error2 = err instanceof Error ? err : new Error(String(err));
    }
  } finally {
    clearTimeout(timeoutId);
  }

  // Return the fastest result, or fall back to whichever has content
  if (result1 && result2) {
    // Both have results - return the first one (primary)
    return { content: result1.content, model: MODEL, finishReason: result1.finishReason };
  }
  if (result1) {
    return { content: result1.content, model: MODEL, finishReason: result1.finishReason };
  }
  if (result2) {
    return { content: result2.content, model: SECOND_MODEL, finishReason: result2.finishReason };
  }

  // Both failed - throw the first error
  throw error1 ?? new Error("Both models failed");
}

/**
 * Tries up to N models in parallel and returns the best result.
 * "Best" is determined by: (1) no truncation/length finish reason, (2) earliest finish,
 * (3) first successful model. Returns the content from the best model.
 */
async function parallelFetchBest(
  models: string[],
  messages: Message[],
  opts: ChatOptions,
  apiKey: string
): Promise<{ content: string; model: string; finishReason: string }> {
  const timeoutMs = opts.timeoutMs ?? 240000; // 4 minutes for multiple models
  const abortCtrl = new AbortController();
  const timeoutId = setTimeout(() => abortCtrl.abort(), timeoutMs);

  // Track results from each model
  interface ModelResult {
    content: string;
    finishReason: string;
    model: string;
    length: number; // content length for ranking
    truncated: boolean; // whether finishReason === "length"
  }

  const modelResults: ModelResult[] = [];

  try {
    // Launch all model fetches in parallel
    const fetchPromises = models.map((model) =>
      fetchModel(model, messages, opts, apiKey).then((result) => {
        const truncated = result.finishReason === "length";
        return {
          content: result.content || "",
          finishReason: result.finishReason || "stop",
          model,
          length: result.content?.length || 0,
          truncated,
        };
      })
    );

    const results = await Promise.allSettled(fetchPromises);

    // Process results, skipping rejections/errors
    const successful: ModelResult[] = [];
    for (const result of results) {
      if (result.status === "fulfilled") {
        const r: ModelResult = result.value;
        if (!r.truncated) {
          successful.push(r);
        }
      }
    }

    // Also include any truncated results if no successful ones
    if (successful.length === 0) {
      for (const result of results) {
        if (result.status === "fulfilled") {
          const r: ModelResult = result.value;
          successful.push(r);
        }
      }
    }

    // Sort by: not truncated first, then by shortest content (likely more compact), then by model order
    successful.sort((a, b) => {
      // First: non-truncated vs truncated
      if (!a.truncated && b.truncated) return -1;
      if (a.truncated && !b.truncated) return 1;
      // Then: shorter content first (likely more complete/compact)
      if (a.length !== b.length) return a.length - b.length;
      // Finally: preserve original order
      return 0;
    });

    if (successful.length > 0) {
      const best = successful[0];
      return { content: best.content, model: best.model, finishReason: best.finishReason };
    }
  } catch (err) {
    console.warn(`[llm] parallel fetch best failed: ${(err as Error).message.slice(0, 200)}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Fallback: return first model's content if available, or throw
  throw new Error("All models failed to produce usable output");
}

/** Extracts the first balanced JSON object/array from a model reply. */
export function extractJson<T>(raw: string): T {
  let text = raw.trim();

  // strip markdown fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  const start = text.search(/[[{]/);
  if (start === -1) throw new Error("no JSON found in the response");

  const openChar = text[start];
  const closeChar = openChar === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === openChar) depth++;
    else if (ch === closeChar) {
      depth--;
      if (depth === 0) {
        const candidate = text.slice(start, i + 1);
        return JSON.parse(candidate) as T;
      }
    }
  }

  throw new Error("incomplete JSON in the response");
}

/** Calls the model and guarantees a parsed JSON payload, repairing once if needed. */
export async function chatJson<T>(messages: Message[], opts: ChatOptions = {}): Promise<T> {
  const first = await chatOnce(messages, { ...opts, json: true });
  try {
    return extractJson<T>(first.content);
  } catch {
    const truncated = first.finishReason === "length";
    console.warn(
      `[llm] unparsable reply (finish=${first.finishReason}, length=${first.content.length}): ${first.content.slice(0, 400)}`,
    );

    const repaired = await chatOnce(
      [
        ...messages,
        { role: "assistant", content: first.content.slice(0, 8000) },
        {
          role: "user",
          content: truncated
            ? "Your previous answer was CUT OFF before the JSON closed, so it was unusable. Re-send the complete, VALID, closed JSON object. Be far more compact: fewer frames/elements, shorter strings. No prose, no markdown fences."
            : "That reply was not valid JSON. Re-send ONLY the corrected JSON object. No prose, no markdown fences, no comments, no trailing commas. Every string must be properly escaped.",
        },
      ],
      { ...opts, json: true, temperature: 0.1 },
    );
    try {
      return extractJson<T>(repaired.content);
    } catch {
      console.warn(`[llm] repair failed (finish=${repaired.finishReason}): ${repaired.content.slice(0, 400)}`);
      throw new LLMError("The model produced malformed JSON twice. Please retry.", 502);
    }
  }
}

/** Single completion call against OpenRouter. Throws LLMError with a user-safe message. */
export async function chat(messages: Message[], opts: ChatOptions = {}): Promise<string> {
  return (await chatOnce(messages, opts)).content;
}

/**
 * Tries models in the chain: primary vs secondary in parallel (fastest wins),
 * then tertiary, fourth, fifth in order, with parallel best-response fallback.
 */
async function chatOnce(messages: Message[], opts: ChatOptions = {}): Promise<ChatResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new LLMError(
      "No OPENROUTER_API_KEY is configured on the server. Add it to .env.local and restart the app.",
      500,
    );
  }

  const models = modelList();
  const primary = MODEL;
  const secondary = SECOND_MODEL;

  // Strategy 1: Try primary vs secondary in parallel for fastest response
  try {
    const parallelResult = await parallelFetch(primary, secondary, messages, opts, apiKey);
    return { content: parallelResult.content, finishReason: parallelResult.finishReason };
  } catch (parallelErr) {
    // Parallel fetch failed, fall through to multi-model strategy
    console.warn(`[llm] primary vs secondary parallel fetch failed: ${(parallelErr as Error).message.slice(0, 140)}; trying multi-model chain`);
  }

  // Strategy 2: Try all models in the chain, picking the best response
  try {
    const bestResult = await parallelFetchBest(models, messages, opts, apiKey);
    return { content: bestResult.content, finishReason: bestResult.finishReason };
  } catch (multiErr) {
    console.warn(`[llm] multi-model best-response failed: ${(multiErr as Error).message.slice(0, 200)}; falling back to ordered chain`);
  }

  // Strategy 3: Ordered chain fallback
  let lastError: LLMError | null = null;

  for (let i = 0; i < models.length; i++) {
    try {
      const result = await requestModel(models[i], messages, opts, apiKey);
      return result;
    } catch (err) {
      if (!(err instanceof LLMError)) throw err;
      lastError = err as LLMError;
      const fatal = err.status === 400 || err.status === 401;
      if (fatal || i === models.length - 1) throw err;
      console.warn(`[llm] ${models[i]} failed (${err.message.slice(0, 140)}); falling back to ${models[i + 1]}`);
    }
  }

  throw lastError ?? new LLMError("No model is configured for generation.", 500);
}

type Message = { role: "system" | "user" | "assistant"; content: string };
type ChatOptions = {
  temperature?: number;
  maxTokens?: number;
  json?: boolean;
  timeoutMs?: number;
};

export function isConfigured(): boolean {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

type ChatResult = { content: string; finishReason: string };

/** Required for chatJson - requests a specific model */
async function requestModel(
  model: string,
  messages: Message[],
  opts: ChatOptions,
  apiKey: string,
): Promise<ChatResult> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: opts.temperature ?? 0.25,
    max_tokens: opts.maxTokens ?? 1500,
    // Keeps responses stable and cheap for a learning tool.
    usage: { include: true },
  };
  if (opts.json) body.response_format = { type: "json_object" };

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "AlgoAtlas",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs ?? 90000),
      cache: "no-store",
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "network error";
    throw new LLMError(`Could not reach the model provider (${detail}). Try again in a moment.`, 504);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text.slice(0, 300);
    try {
      const parsed = JSON.parse(text) as { error?: { message?: string } };
      if (parsed.error?.message) message = parsed.error.message;
    } catch {
      /* keep raw text */
    }
    const status = res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status;
    if (res.status === 402) {
      throw new LLMError(
        "The OpenRouter key has no credits left, so generation is paused. Add credits at openrouter.ai/credits, or set OPENROUTER_MODEL in .env.local to a model your key can use. Reading problems and the visualiser demo still work.",
        402,
      );
    }
    throw new LLMError(`Model request failed (${res.status}) on ${model}: ${message || "unknown error"}`, status);
  }

  let payload: {
    choices?: {
      message?: { content?: string | null; reasoning?: string | null };
      finish_reason?: string;
    }[];
  };
  try {
    payload = (await res.json()) as typeof payload;
  } catch {
    // Covers both malformed JSON and the abort signal firing while the body streams in.
    throw new LLMError("The model provider stalled before finishing its answer. Try again, or use a smaller model.", 504);
  }
  const choice = payload.choices?.[0];
  const content = choice?.message?.content?.trim();
  const finishReason = choice?.finish_reason ?? "stop";

  if (!content) {
    throw new LLMError(
      finishReason === "length"
        ? "The model ran out of room before finishing. Try a shorter problem or retry."
        : "The model returned an empty response. Try again.",
      502,
    );
  }

  return { content, finishReason };
}