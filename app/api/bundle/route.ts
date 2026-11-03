import { getProblem } from "@/lib/leetcode";
import { chatJson } from "@/lib/llm";
import { memo, forget } from "@/lib/llm-cache";
import { normaliseExplanation, normaliseReconstruction, normaliseSolutions, toErrorResponse } from "@/lib/normalise";
import { explanationMessages, reconstructionMessages, solutionsMessages, visualisationMessages } from "@/lib/prompts";
import { normaliseLanguage, type BundleFailure, type ProblemBundle, type Reconstruction, type SolutionPack } from "@/lib/types";

type GeneratedBundle = Omit<ProblemBundle, "servedFromCache" | "tookMs">;
import { normaliseTrace, type VizTrace } from "@/lib/viz";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * One request that fills every tab at once: solutions, explanation, the
 * optimal visualisation, and (for Premium-only problems) a LeetCode-style
 * practice question. Results are memoised per slug+language, so the second
 * visitor never waits on a free model.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { slug?: string; language?: string; refresh?: boolean };
    if (!body.slug) return Response.json({ error: "Missing problem slug." }, { status: 400 });

    const language = normaliseLanguage(body.language);
    const problem = await getProblem(body.slug);
    const key = `bundle:${problem.slug}:${language}`;
    if (body.refresh) forget(key);

    const startedAt = Date.now();
    const statementLocked = !problem.statement.trim();
    const premium = problem.paidOnly || statementLocked;

    const { value: bundle, cached } = await memo<GeneratedBundle>(key, async () => {
      const failures: BundleFailure[] = [];

      // Stage 1 — independent sections start together.
      const [solutionsResult, explanationResult, questionResult] = await Promise.allSettled([
        chatJson(solutionsMessages(problem, language), { maxTokens: 12000, temperature: 0.2, timeoutMs: 150000 }),
        chatJson(explanationMessages(problem), { maxTokens: 5000, temperature: 0.35, timeoutMs: 120000 }),
        statementLocked
          ? chatJson(reconstructionMessages(problem), { maxTokens: 2600, temperature: 0.4, timeoutMs: 90000 })
          : Promise.resolve(null),
      ]);

      let solutions: SolutionPack | null = null;
      if (solutionsResult.status === "fulfilled") {
        try {
          solutions = normaliseSolutions(solutionsResult.value);
        } catch (err) {
          failures.push({ section: "solutions", error: message(err) });
        }
      } else {
        failures.push({ section: "solutions", error: message(solutionsResult.reason) });
      }

      let explanation = null;
      if (explanationResult.status === "fulfilled") {
        try {
          explanation = normaliseExplanation(explanationResult.value);
        } catch (err) {
          failures.push({ section: "explanation", error: message(err) });
        }
      } else {
        failures.push({ section: "explanation", error: message(explanationResult.reason) });
      }

      let reconstruction: Reconstruction | null = null;
      if (statementLocked) {
        if (questionResult.status === "fulfilled" && questionResult.value) {
          try {
            reconstruction = normaliseReconstruction(questionResult.value);
          } catch (err) {
            failures.push({ section: "question", error: message(err) });
          }
        } else if (questionResult.status === "rejected") {
          failures.push({ section: "question", error: message(questionResult.reason) });
        }
      }

      // Stage 2 — the visualisation draws the optimal code, so it waits for it.
      let trace: VizTrace | null = null;
      const optimal = solutions?.approaches.find((a) => a.tier === "optimal") ?? solutions?.approaches.at(-1);
      try {
        const raw = await chatJson(
          visualisationMessages(problem, {
            tier: "optimal",
            title: optimal?.title || "optimal solution",
            code: optimal?.code,
            idea: optimal?.idea,
          }),
          { maxTokens: 24000, temperature: 0.3, timeoutMs: 180000 },
        );
        trace = normaliseTrace(raw);
      } catch (err) {
        failures.push({ section: "visualisation", error: message(err) });
      }

      const generated: GeneratedBundle = {
        slug: problem.slug,
        language,
        premium,
        statementLocked,
        solutions,
        explanation,
        trace,
        reconstruction,
        failures,
      };
      return generated;
    });

    return Response.json(
      { ...bundle, servedFromCache: cached, tookMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    return toErrorResponse(err);
  }
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : "Generation failed.";
}
