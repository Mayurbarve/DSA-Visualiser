import { getProblem } from "@/lib/leetcode";
import { chatJson } from "@/lib/llm";
import { normaliseExplanation, toErrorResponse } from "@/lib/normalise";
import { explanationMessages } from "@/lib/prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: string };
    if (!body.slug) return Response.json({ error: "Missing problem slug." }, { status: 400 });

    const problem = await getProblem(body.slug);
    const raw = await chatJson(explanationMessages(problem), { maxTokens: 5000, temperature: 0.35, timeoutMs: 120000 });

    return Response.json({ explanation: normaliseExplanation(raw) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
