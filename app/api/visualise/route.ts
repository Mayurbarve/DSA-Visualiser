import { getProblem } from "@/lib/leetcode";
import { chatJson } from "@/lib/llm";
import { toErrorResponse } from "@/lib/normalise";
import { visualisationMessages } from "@/lib/prompts";
import { normaliseTrace } from "@/lib/viz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      slug?: string;
      tier?: string;
      title?: string;
      code?: string;
      idea?: string;
      manualCode?: string;
    };
    if (!body.slug) return Response.json({ error: "Missing problem slug." }, { status: 400 });

    const tier = ["brute", "better", "optimal"].includes(body.tier ?? "") ? body.tier! : "optimal";
    const problem = await getProblem(body.slug);

    // Use manual code if provided, otherwise generate from model
    const code = body.manualCode || (body.code?.slice(0, 4000) || undefined);
    const idea = body.manualCode ? body.manualCode : (body.idea || undefined);

    const raw = await chatJson(
      visualisationMessages(problem, {
        tier,
        title: body.title || (tier === "brute" ? "brute force" : tier === "better" ? "better" : "optimal solution"),
        code,
        idea,
      }),
      { maxTokens: 24000, temperature: 0.3, timeoutMs: 240000 },
    );

    return Response.json({ trace: normaliseTrace(raw) }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    return toErrorResponse(err);
  }
}
