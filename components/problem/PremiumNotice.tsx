"use client";

import type { Problem } from "@/lib/leetcode";
import type { Reconstruction } from "@/lib/types";
import { Prose } from "@/components/ui/Prose";
import { Bolt, Sparkle } from "@/components/ui/Icons";

type LoadState = "idle" | "loading" | "ready" | "error";

/**
 * Premium-only problems return no statement from LeetCode. Instead of a dead
 * end, we say plainly that it is Premium and show a LeetCode-style practice
 * question written for the same title, difficulty and topics.
 */
export function PremiumNotice({
  problem,
  question,
  state,
  error,
  onGenerate,
}: {
  problem: Problem;
  question: Reconstruction | null;
  state: LoadState;
  error?: string;
  onGenerate: () => void;
}) {
  const hasOfficial = Boolean(problem.statement.trim());

  return (
    <div className="mb-5 overflow-hidden rounded-[18px] border border-[#e6b64a]/50 bg-[#f4c26b]/8">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e6b64a]/30 px-4 py-3.5">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#8a6414] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white">
            LeetCode Premium
          </span>
          <p className="mt-2 text-[12.5px] font-extrabold tracking-tight text-ink">
            {hasOfficial ? "This one is marked Premium on LeetCode." : "The official statement is locked on LeetCode."}
          </p>
          <p className="mt-1 max-w-xl text-[11.5px] leading-relaxed text-ink/55">
            {hasOfficial
              ? "You can still study it here: everything below is generated from the title, topics and acceptance rate."
              : "So you can still practise the pattern, a LeetCode-style version of this question is written from its title, topics and acceptance rate. It is practice material — not the original wording."}
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerate}
          disabled={state === "loading"}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[10px] bg-[#8a6414] px-3 py-2 text-[11px] font-bold text-white transition hover:bg-[#735313] disabled:opacity-60"
        >
          <Bolt className="h-3 w-3" />
          {state === "loading" ? "Writing…" : question ? "Rewrite question" : "Write a practice question"}
        </button>
      </div>

      {state === "loading" ? (
        <div className="px-4 py-4">
          <div className="flex items-center gap-2 text-[11.5px] font-bold text-ink/60">
            <span className="flex gap-1">
              <span className="dot h-1.5 w-1.5 rounded-full bg-[#e6b64a]" />
              <span className="dot h-1.5 w-1.5 rounded-full bg-violet" />
              <span className="dot h-1.5 w-1.5 rounded-full bg-lime" />
            </span>
            Writing a LeetCode-style version of this question…
          </div>
          <div className="mt-3 space-y-2">
            <div className="skeleton h-3 w-4/5 rounded-full" />
            <div className="skeleton h-3 w-full rounded-full" />
            <div className="skeleton h-3 w-3/5 rounded-full" />
          </div>
        </div>
      ) : null}

      {state === "error" ? (
        <p className="px-4 py-4 text-[11.5px] font-semibold text-[#8a3a2c]">{error || "Could not write the practice question."}</p>
      ) : null}

      {question ? (
        <div className="space-y-3.5 px-4 py-4">
          <div className="flex items-center gap-1.5">
            <Sparkle className="h-3 w-3 text-[#8a6414]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#8a6414]">
              AI-written practice version · not the official statement
            </span>
          </div>

          <Prose text={question.statement} />

          {question.examples.length ? (
            <div className="space-y-2">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">
                examples · {question.examples.length}
              </span>
              {question.examples.map((ex, i) => (
                <div key={i} className="rounded-[10px] bg-white px-3 py-2.5 ring-1 ring-line">
                  <span className="font-mono text-[9.5px] font-bold text-violet/70">example #{i + 1}</span>
                  <p className="mt-1 font-mono text-[11px] leading-relaxed text-ink/75">
                    <span className="text-ink/35">input </span>
                    {ex.input}
                  </p>
                  <p className="font-mono text-[11px] leading-relaxed text-ink/75">
                    <span className="text-ink/35">output </span>
                    {ex.output}
                  </p>
                  {ex.explanation ? <p className="mt-1 text-[10.5px] text-ink/45">{ex.explanation}</p> : null}
                </div>
              ))}
            </div>
          ) : null}

          {question.constraints.length ? (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">constraints</span>
              <ul className="mt-1.5 space-y-1">
                {question.constraints.map((c, i) => (
                  <li key={i} className="flex gap-2 font-mono text-[10.5px] leading-relaxed text-ink/60">
                    <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-[#e6b64a]" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {question.followUp ? (
            <p className="rounded-[10px] bg-white/70 px-3 py-2 text-[11px] leading-relaxed text-ink/55 ring-1 ring-line">
              <span className="font-bold text-ink/70">Follow up: </span>
              {question.followUp}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
