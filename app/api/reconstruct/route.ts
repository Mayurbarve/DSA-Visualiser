import { getProblem } from "@/lib/leetcode";
import { chatJson } from "@/lib/llm";
import { memo, forget } from "@/lib/llm-cache";
import { normaliseReconstruction, toErrorResponse } from "@/lib/normalise";
import { reconstructionMessages } from "@/lib/prompts";
import type { Reconstruction } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Writes a LeetCode-style practice question for a Premium-only problem,
 * whose official statement is locked behind LeetCode's subscription.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: string; refresh?: boolean };
    if (!body.slug) return Response.json({ error: "Missing problem slug." }, { status: 400 });

    const problem = await getProblem(body.slug);
    if (!problem.paidOnly && problem.statement.trim()) {
      return Response.json(
        { error: "This problem is not Premium-only, so its official statement is already shown." },
        { status: 400 },
      );
    }

    const key = `question:${problem.slug}`;
    if (body.refresh) forget(key);

    const { value: question, cached } = await memo<Reconstruction>(key, async () => {
      const raw = await chatJson(reconstructionMessages(problem), {
        maxTokens: 2600,
        temperature: 0.4,
        timeoutMs: 90000,
      });
      return normaliseReconstruction(raw);
    });

    return Response.json({ question, servedFromCache: cached }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
