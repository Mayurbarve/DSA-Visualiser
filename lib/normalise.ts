import { LeetCodeError } from "./leetcode";
import { LLMError } from "./llm";
import type { Approach, CompanyHit, SolutionPack, Tier } from "./types";

export function toErrorResponse(err: unknown): Response {
  if (err instanceof LeetCodeError || err instanceof LLMError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "Something went wrong.";
  console.error("[api]", err);
  return Response.json({ error: message }, { status: 500 });
}

const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v.trim() : fallback);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

const TIERS: Tier[] = ["brute", "better", "optimal"];
const FREQ: CompanyHit["frequency"][] = ["Very High", "High", "Medium", "Low"];

function normaliseApproach(raw: unknown, index: number): Approach {
  const o = (raw ?? {}) as Record<string, unknown>;
  const tier = TIERS.includes(o.tier as Tier) ? (o.tier as Tier) : TIERS[index] ?? "optimal";
  return {
    tier,
    title: str(o.title, index === 0 ? "Brute force" : index === 1 ? "Better" : "Optimal"),
    idea: str(o.idea, "No explanation returned."),
    time: str(o.time, "—"),
    space: str(o.space, "—"),
    code: str(o.code, ""),
    whenToUse: str(o.whenToUse) || undefined,
    pitfalls: list(o.pitfalls)
      .map((p) => str(p))
      .filter(Boolean)
      .slice(0, 4),
  };
}

export function normaliseSolutions(raw: unknown): SolutionPack {
  const o = (raw ?? {}) as Record<string, unknown>;
  const approaches = list(o.approaches)
    .slice(0, 4)
    .map(normaliseApproach)
    .filter((a) => a.code.length > 0);
  if (!approaches.length) throw new LLMError("The model returned no usable code. Please retry.", 502);

  const table = list(o.complexityTable)
    .map((row) => {
      const r = (row ?? {}) as Record<string, unknown>;
      return { approach: str(r.approach), time: str(r.time, "—"), space: str(r.space, "—"), note: str(r.note) || undefined };
    })
    .filter((r) => r.approach);

  return {
    overview: str(o.overview, "Here are three ways to solve this problem."),
    pattern: list(o.pattern)
      .map((p) => str(p))
      .filter(Boolean)
      .slice(0, 6),
    keyInsight: str(o.keyInsight),
    approaches,
    complexityTable: table.length
      ? table
      : approaches.map((a) => ({ approach: a.title, time: a.time, space: a.space })),
    companies: list(o.companies)
      .map((c) => {
        const co = (c ?? {}) as Record<string, unknown>;
        const name = str(co.name);
        const frequency = FREQ.includes(co.frequency as CompanyHit["frequency"])
          ? (co.frequency as CompanyHit["frequency"])
          : "Medium";
        return { name, frequency, note: str(co.note) || undefined };
      })
      .filter((c) => c.name)
      .slice(0, 9),
    followUps: list(o.followUps)
      .map((f) => str(f))
      .filter(Boolean)
      .slice(0, 6),
    relatedPatterns: list(o.relatedPatterns)
      .map((p) => str(p))
      .filter(Boolean)
      .slice(0, 6),
  };
}

export function normaliseExplanation(raw: unknown) {
  const o = (raw ?? {}) as Record<string, unknown>;
  const steps = list(o.steps)
    .map((s) => {
      const step = (s ?? {}) as Record<string, unknown>;
      return { title: str(step.title), detail: str(step.detail) };
    })
    .filter((s) => s.title || s.detail);

  const dry = (o.dryRun ?? {}) as Record<string, unknown>;

  return {
    tldr: str(o.tldr, "Here is the idea in plain words."),
    intuition: str(o.intuition),
    steps: steps.length ? steps : [{ title: "Walk the example", detail: str(o.intuition) }],
    dryRun: {
      input: str(dry.input),
      trace: list(dry.trace)
        .map((t) => str(t))
        .filter(Boolean)
        .slice(0, 14),
    },
    pitfalls: list(o.pitfalls)
      .map((p) => str(p))
      .filter(Boolean)
      .slice(0, 6),
    takeaway: str(o.takeaway),
  };
}
