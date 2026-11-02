"use client";

import { ArrowRight, Bolt, BookIcon, Sparkle } from "@/components/ui/Icons";
import type { Explanation } from "@/lib/types";

export function ExplainView({ explanation, onVisualise }: { explanation: Explanation; onVisualise: () => void }) {
  return (
    <div className="space-y-5">
      <div className="relative overflow-hidden rounded-[18px] bg-gradient-to-br from-violet to-[#4d21c9] p-5 text-white">
        <span className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-coral/30 blur-2xl" />
        <div className="relative">
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-lime">
            <BookIcon className="h-3 w-3" />
            in one sentence
          </span>
          <p className="mt-2 text-[16px] font-extrabold leading-snug tracking-tight">{explanation.tldr}</p>
        </div>
      </div>

      <div className="rounded-[18px] border border-line bg-white p-5">
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink/35">build the intuition</span>
        <p className="mt-2 text-[13px] leading-[1.8] text-ink/70">{explanation.intuition}</p>
      </div>

      <div>
        <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink/35">step by step</span>
        <ol className="mt-3 space-y-2.5">
          {explanation.steps.map((step, i) => (
            <li key={i} className="relative flex gap-3 rounded-[14px] border border-line bg-white p-3.5">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mist font-mono text-[10.5px] font-bold text-violet">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[12.5px] font-extrabold tracking-tight text-ink">{step.title}</p>
                <p className="mt-1 text-[12px] leading-[1.7] text-ink/60">{step.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {explanation.dryRun.trace.length ? (
        <div className="overflow-hidden rounded-[18px] bg-ink">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">dry run</span>
            <span className="rounded-md bg-white/8 px-2 py-1 font-mono text-[10.5px] text-lime">
              input: {explanation.dryRun.input || "from the statement"}
            </span>
          </div>
          <div className="divide-y divide-white/6">
            {explanation.dryRun.trace.map((line, i) => (
              <div key={i} className="flex gap-3 px-4 py-2.5">
                <span className="w-4 shrink-0 font-mono text-[10px] text-white/30">{i + 1}</span>
                <span className="min-w-0 font-mono text-[11.5px] leading-relaxed text-white/75">{line}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-[16px] border border-coral/30 bg-coral/6 p-4">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#a4402f]">where people slip</span>
          <ul className="mt-2 space-y-1.5">
            {explanation.pitfalls.map((p, i) => (
              <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-ink/65">
                <span className="mt-[6px] h-1 w-1 shrink-0 rounded-full bg-coral" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-[16px] border border-lime-deep/30 bg-lime/10 p-4">
          <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#5d7a10]">
            <Sparkle className="h-3 w-3" />
            take this with you
          </span>
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink/70">{explanation.takeaway}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onVisualise}
        className="group flex w-full items-center justify-between rounded-[14px] border border-line bg-white px-4 py-3.5 text-left transition hover:border-violet/40 hover:bg-violet/5"
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-violet/10 text-violet">
            <Bolt className="h-4 w-4" />
          </span>
          <span>
            <span className="block text-[12.5px] font-extrabold text-ink">Rather see it move?</span>
            <span className="block text-[11px] text-ink/50">Turn this explanation into a frame-by-frame visual.</span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-ink/30 transition group-hover:translate-x-0.5 group-hover:text-violet" />
      </button>
    </div>
  );
}
