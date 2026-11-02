import { getProblem } from "@/lib/leetcode";
import { chatJson } from "@/lib/llm";
import { normaliseSolutions, toErrorResponse } from "@/lib/normalise";
import { solutionsMessages } from "@/lib/prompts";
import { normaliseLanguage } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: string; language?: string };
    if (!body.slug) return Response.json({ error: "Missing problem slug." }, { status: 400 });

    const language = normaliseLanguage(body.language);
    const problem = await getProblem(body.slug);
    const raw = await chatJson(solutionsMessages(problem, language), { maxTokens: 12000, temperature: 0.2, timeoutMs: 180000 });

    return Response.json({ solutions: normaliseSolutions(raw), language }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
