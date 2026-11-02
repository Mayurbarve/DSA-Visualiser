const GQL_ENDPOINT = "https://leetcode.com/graphql";

const LC_HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Referer: "https://leetcode.com/problemset/",
  Origin: "https://leetcode.com",
  Accept: "application/json",
};

export type Difficulty = "Easy" | "Medium" | "Hard";

export interface Problem {
  number: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  statement: string;
  examples: string;
  tags: string[];
  hints: string[];
  similar: { title: string; slug: string; difficulty: string }[];
  acceptance: string;
  snippet: string | null;
  url: string;
  paidOnly: boolean;
}

export interface ProblemSummary {
  number: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  paidOnly: boolean;
  acceptance: string;
  tags: string[];
}

export class LeetCodeError extends Error {
  status: number;
  constructor(message: string, status = 502) {
    super(message);
    this.name = "LeetCodeError";
    this.status = status;
  }
}

/* ------------------------------------------------------------------ */
/* tiny in-memory cache (survives hot reloads via globalThis)          */
/* ------------------------------------------------------------------ */

type Entry<T> = { at: number; data: T };
type CacheShape = {
  problems: Map<string, Entry<Problem>>;
  slugs: Map<string, Entry<string>>;
  lists: Map<string, Entry<{ total: number; items: ProblemSummary[] }>>;
};

const globalCache = globalThis as unknown as { __lcCache?: CacheShape };
const cache: CacheShape =
  globalCache.__lcCache ?? (globalCache.__lcCache = { problems: new Map(), slugs: new Map(), lists: new Map() });

const TTL = 1000 * 60 * 60; // 1 hour

function fresh<T>(entry: Entry<T> | undefined): entry is Entry<T> {
  return !!entry && Date.now() - entry.at < TTL;
}

/* ------------------------------------------------------------------ */
/* sourcing                                                            */
/* ------------------------------------------------------------------ */

async function gql<T>(query: string, variables: Record<string, unknown>, timeoutMs = 15000): Promise<T> {
  let lastError: unknown = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(GQL_ENDPOINT, {
        method: "POST",
        headers: LC_HEADERS,
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(timeoutMs),
        cache: "no-store",
      });

      if (res.status === 429) {
        lastError = new LeetCodeError("LeetCode is rate limiting us. Wait a few seconds and try again.", 429);
        await sleep(700 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new LeetCodeError(
          `LeetCode returned HTTP ${res.status}. ${body.slice(0, 120)}`.trim(),
          res.status === 403 ? 429 : 502,
        );
      }

      const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
      if (json.errors?.length) {
        throw new LeetCodeError(json.errors[0]?.message ?? "LeetCode rejected the query", 502);
      }
      if (!json.data) throw new LeetCodeError("LeetCode returned an empty payload", 502);
      return json.data;
    } catch (err) {
      lastError = err;
      if (err instanceof LeetCodeError && err.status !== 429) throw err;
      if (attempt === 1) break;
      await sleep(500);
    }
  }

  if (lastError instanceof LeetCodeError) throw lastError;
  const detail = lastError instanceof Error ? lastError.message : "unknown network error";
  throw new LeetCodeError(`Could not reach LeetCode (${detail}). Check the server's network access and retry.`, 502);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/* ------------------------------------------------------------------ */
/* html -> readable text                                               */
/* ------------------------------------------------------------------ */

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  le: "≤",
  ge: "≥",
  ne: "≠",
  times: "×",
  minus: "−",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

export function decodeEntities(input: string): string {
  return input.replace(/&(#[xX]?[0-9a-fA-F]+|[a-zA-Z]+);/g, (match, entity: string) => {
    if (entity.startsWith("#")) {
      const isHex = entity[1] === "x" || entity[1] === "X";
      const code = parseInt(isHex ? entity.slice(2) : entity.slice(1), isHex ? 16 : 10);
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff) {
        try {
          return String.fromCodePoint(code);
        } catch {
          return match;
        }
      }
      return match;
    }
    return ENTITIES[entity.toLowerCase()] ?? match;
  });
}

/** Converts LeetCode's statement HTML into clean, renderable plain text. */
export function htmlToText(html: string): string {
  const codeBlocks: string[] = [];
  let rest = html ?? "";

  rest = rest.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner: string) => {
    const text = decodeEntities(
      inner
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, ""),
    )
      .replace(/\u00a0/g, " ")
      .replace(/^\n+/, "");
    codeBlocks.push(text.replace(/\s+$/g, ""));
    return `\n@@CODEBLOCK${codeBlocks.length - 1}@@\n`;
  });

  rest = rest.replace(/<sup[^>]*>([\s\S]*?)<\/sup>/gi, (_m, c: string) => `^${decodeEntities(c.replace(/<[^>]+>/g, ""))}`);
  rest = rest.replace(/<sub[^>]*>([\s\S]*?)<\/sub>/gi, (_m, c: string) => `_${decodeEntities(c.replace(/<[^>]+>/g, ""))}`);
  rest = rest.replace(/<img[^>]*?alt="([^"]*)"[^>]*>/gi, (_m, alt: string) => (alt ? `[image: ${alt}]` : "[image]"));
  rest = rest.replace(/<img[^>]*>/gi, "[image]");
  rest = rest.replace(/<li[^>]*>/gi, "\n• ");
  rest = rest.replace(/<\/(td|th)>/gi, " | ");
  rest = rest.replace(/<t[dh][^>]*>/gi, " ");
  rest = rest.replace(/<(p|div|h[1-6]|ul|ol|blockquote|table|tr|figure|figcaption)[^>]*>/gi, "\n");
  rest = rest.replace(/<\/(p|div|h[1-6]|ul|ol|blockquote|table|tr|figure|figcaption|li)>/gi, "\n");
  rest = rest.replace(/<br\s*\/?>/gi, "\n");
  rest = rest.replace(/<[^>]+>/g, "");
  rest = decodeEntities(rest).replace(/\u00a0/g, " ");
  rest = rest.replace(/@@CODEBLOCK(\d+)@@/g, (_m, i: string) => `\n\`\`\`\n${codeBlocks[Number(i)]}\n\`\`\`\n`);

  return rest
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/* ------------------------------------------------------------------ */
/* lookups                                                             */
/* ------------------------------------------------------------------ */

const LIST_FIELDS = `
  total: totalNum
  questions: data {
    questionFrontendId
    title
    titleSlug
    difficulty
    isPaidOnly
    acRate
    topicTags { name }
  }
`;

const QUESTION_LIST_QUERY = `
  query questionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
    questionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
      ${LIST_FIELDS}
    }
  }
`;

type RawListItem = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  isPaidOnly: boolean;
  acRate: number;
  topicTags: { name: string }[];
};

async function queryList(opts: {
  skip?: number;
  limit?: number;
  search?: string;
  difficulty?: string;
  tags?: string[];
}): Promise<{ total: number; items: ProblemSummary[] }> {
  const key = JSON.stringify(opts);
  const hit = cache.lists.get(key);
  if (fresh(hit)) return hit.data;

  const filters: Record<string, unknown> = {};
  if (opts.search) filters.searchKeywords = opts.search;
  if (opts.difficulty) filters.difficulty = opts.difficulty.toUpperCase();
  if (opts.tags?.length) filters.tags = opts.tags;

  const data = await gql<{ questionList: { total: number; questions: RawListItem[] } }>(QUESTION_LIST_QUERY, {
    categorySlug: "",
    limit: opts.limit ?? 20,
    skip: opts.skip ?? 0,
    filters,
  });

  const items = (data.questionList?.questions ?? []).map(toSummary);
  const payload = { total: data.questionList?.total ?? items.length, items };
  cache.lists.set(key, { at: Date.now(), data: payload });
  return payload;
}

function toSummary(raw: RawListItem): ProblemSummary {
  return {
    number: String(raw.questionFrontendId),
    title: raw.title,
    slug: raw.titleSlug,
    difficulty: normaliseDifficulty(raw.difficulty),
    paidOnly: !!raw.isPaidOnly,
    acceptance: typeof raw.acRate === "number" ? `${raw.acRate.toFixed(1)}%` : "—",
    tags: (raw.topicTags ?? []).map((t) => t.name),
  };
}

function normaliseDifficulty(value: string | null | undefined): Difficulty {
  const v = (value ?? "").toLowerCase();
  if (v.startsWith("hard")) return "Hard";
  if (v.startsWith("med")) return "Medium";
  return "Easy";
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Resolves "1", "two-sum", "Two Sum" or a leetcode URL into a titleSlug. */
export async function resolveSlug(query: string): Promise<string> {
  const raw = query.trim();
  if (!raw) throw new LeetCodeError("Enter a LeetCode problem number or name.", 400);

  const cached = cache.slugs.get(raw.toLowerCase());
  if (fresh(cached)) return cached.data;

  const urlMatch = raw.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  const cleaned = urlMatch ? urlMatch[1] : raw;
  const numeric = cleaned.match(/^\d+$/)?.[0] ?? cleaned.match(/^(\d+)[.\-\s]/)?.[1];

  if (numeric) {
    const found = await findByNumber(numeric);
    cache.slugs.set(raw.toLowerCase(), { at: Date.now(), data: found });
    return found;
  }

  const searchTerm = cleaned.replace(/-/g, " ");
  const { items } = await queryList({ search: searchTerm, limit: 12 });
  const wanted = slugifyTitle(cleaned);

  const exact =
    items.find((i) => i.slug === cleaned.toLowerCase()) ??
    items.find((i) => i.slug === wanted) ??
    items.find((i) => slugifyTitle(i.title) === wanted) ??
    items.find((i) => i.title.toLowerCase() === searchTerm.toLowerCase());

  if (!exact) {
    throw new LeetCodeError(`No LeetCode problem matched “${raw}”. Try the problem number instead (for example 1 or 121).`, 404);
  }

  cache.slugs.set(raw.toLowerCase(), { at: Date.now(), data: exact.slug });
  return exact.slug;
}

async function findByNumber(num: string): Promise<string> {
  const { items } = await queryList({ search: num, limit: 20 });
  const exact = items.find((i) => i.number === num);
  if (exact) return exact.slug;

  // Numbers are chronological, so the offset usually lands on the exact problem.
  const offset = Number(num) - 1;
  if (Number.isFinite(offset) && offset >= 0) {
    const page = await queryList({ skip: offset, limit: 1 });
    const candidate = page.items[0];
    if (candidate?.number === num) return candidate.slug;
  }

  throw new LeetCodeError(`LeetCode has no question numbered ${num}. Double-check the number and try again.`, 404);
}

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionFrontendId
      title
      titleSlug
      content
      difficulty
      exampleTestcases
      hints
      isPaidOnly
      stats
      topicTags { name slug }
      similarQuestions
      codeSnippets { lang langSlug code }
    }
  }
`;

type RawQuestion = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  content: string | null;
  difficulty: string;
  exampleTestcases: string | null;
  hints: string[];
  isPaidOnly: boolean;
  stats: string | null;
  topicTags: { name: string }[];
  similarQuestions: string | null;
  codeSnippets: { lang: string; langSlug: string; code: string }[] | null;
};

export async function getProblem(query: string): Promise<Problem> {
  const slug = await resolveSlug(query);
  const hit = cache.problems.get(slug);
  if (fresh(hit)) return hit.data;

  const data = await gql<{ question: RawQuestion | null }>(QUESTION_QUERY, { titleSlug: slug });
  const q = data.question;
  if (!q) throw new LeetCodeError(`LeetCode has no problem at “${slug}”.`, 404);

  let acceptance = "—";
  try {
    const stats = JSON.parse(q.stats ?? "{}") as { acRate?: string };
    if (stats.acRate) acceptance = stats.acRate;
  } catch {
    /* ignore malformed stats */
  }

  let similar: Problem["similar"] = [];
  try {
    similar = (JSON.parse(q.similarQuestions ?? "[]") as { title: string; titleSlug: string; difficulty: string }[]).map(
      (s) => ({ title: s.title, slug: s.titleSlug, difficulty: s.difficulty }),
    );
  } catch {
    /* ignore */
  }

  const snippet =
    q.codeSnippets?.find((s) => s.langSlug === "python3")?.code ??
    q.codeSnippets?.find((s) => s.langSlug === "cpp")?.code ??
    null;

  const problem: Problem = {
    number: String(q.questionFrontendId),
    title: q.title,
    slug: q.titleSlug,
    difficulty: normaliseDifficulty(q.difficulty),
    statement: htmlToText(q.content ?? ""),
    examples: (q.exampleTestcases ?? "").trim(),
    tags: (q.topicTags ?? []).map((t) => t.name),
    hints: (q.hints ?? []).map((h) => htmlToText(h)),
    similar,
    acceptance,
    snippet,
    url: `https://leetcode.com/problems/${q.titleSlug}/`,
    paidOnly: !!q.isPaidOnly,
  };

  cache.problems.set(slug, { at: Date.now(), data: problem });
  return problem;
}

export async function listProblems(opts: {
  search?: string;
  difficulty?: string;
  tag?: string;
  page?: number;
  limit?: number;
}): Promise<{ total: number; page: number; limit: number; items: ProblemSummary[] }> {
  const limit = Math.min(Math.max(opts.limit ?? 24, 1), 50);
  const page = Math.max(opts.page ?? 1, 1);
  const { total, items } = await queryList({
    search: opts.search?.trim() || undefined,
    difficulty: opts.difficulty || undefined,
    tags: opts.tag ? [opts.tag] : undefined,
    skip: (page - 1) * limit,
    limit,
  });
  return { total, page, limit, items };
}

export async function popularProblems(limit = 24): Promise<ProblemSummary[]> {
  const { items } = await queryList({ limit });
  return items;
}
