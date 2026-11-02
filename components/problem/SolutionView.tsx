"use client";

import { CodeBlock } from "@/components/ui/CodeBlock";
import { ArrowRight, Clock, Bolt, Sparkle } from "@/components/ui/Icons";
import { languageLabel, type SolutionPack, type Tier } from "@/lib/types";
import { SectionTitle, TIER_META } from "./shared";

export function SolutionView({
  pack,
  language,
  onVisualise,
}: {
  pack: SolutionPack;
  language: string;
  onVisualise: (tier: Tier) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 lg:grid-cols-[1.4fr_1fr]">
        <div className="relative overflow-hidden rounded-[18px] bg-ink p-5">
          <span className="absolute -right-10 -top-14 h-40 w-40 rounded-full bg-violet/35 blur-3xl" />
          <div className="relative">
            <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-lime">
              <Sparkle className="h-3 w-3" />
              the unlock
            </span>
            <p className="mt-2.5 text-[14px] font-bold leading-relaxed text-white">{pack.keyInsight || pack.overview}</p>
            {pack.pattern.length ? (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {pack.pattern.map((p) => (
                  <span key={p} className="rounded-full border border-white/15 px-2 py-0.5 text-[10px] font-semibold text-white/65">
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="rounded-[18px] border border-line bg-white p-5">
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-ink/35">in one breath</span>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink/65">{pack.overview}</p>
        </div>
      </div>

      <div className="space-y-4">
        {pack.approaches.map((approach) => {
          const meta = TIER_META[approach.tier];
          return (
            <div key={`${approach.tier}-${approach.title}`} className="overflow-hidden rounded-[18px] border border-line bg-white">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.1em] ${meta.chip}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <h3 className="text-[14.5px] font-extrabold tracking-tight text-ink">{approach.title}</h3>
                  </div>
                  <p className="mt-2 max-w-3xl text-[12.5px] leading-[1.7] text-ink/65">{approach.idea}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="flex items-center gap-1.5 rounded-full bg-mist px-2.5 py-1 font-mono text-[10.5px] font-semibold text-ink/70">
                    <Clock className="h-3 w-3 text-ink/40" />
                    {approach.time}
                  </span>
                  <span className="rounded-full bg-mist px-2.5 py-1 font-mono text-[10.5px] font-semibold text-ink/55">
                    space {approach.space}
                  </span>
                </div>
              </div>

              <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_280px]">
                <CodeBlock code={approach.code} language={languageLabel(language)} maxHeight="380px" />
                <div className="space-y-3">
                  {approach.whenToUse ? (
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">when to reach for it</span>
                      <p className="mt-1 text-[11.5px] leading-relaxed text-ink/60">{approach.whenToUse}</p>
                    </div>
                  ) : null}
                  {approach.pitfalls?.length ? (
                    <div>
                      <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">watch out</span>
                      <ul className="mt-1 space-y-1.5">
                        {approach.pitfalls.map((p, i) => (
                          <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-ink/60">
                            <span className={`mt-[6px] h-1 w-1 shrink-0 rounded-full ${meta.dot}`} />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => onVisualise(approach.tier)}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2.5 text-[11.5px] font-bold text-ink/70 transition hover:border-violet/40 hover:bg-violet/5 hover:text-violet"
                  >
                    <Bolt className="h-3.5 w-3.5" />
                    Visualise this approach
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div>
        <SectionTitle eyebrow="side by side" title="Complexity at a glance" />
        <div className="overflow-hidden rounded-[16px] border border-line">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-mist/70 text-[9.5px] uppercase tracking-[0.12em] text-ink/45">
                <th className="px-4 py-2.5 font-bold">Approach</th>
                <th className="px-4 py-2.5 font-bold">Time</th>
                <th className="px-4 py-2.5 font-bold">Space</th>
                <th className="hidden px-4 py-2.5 font-bold sm:table-cell">Why</th>
              </tr>
            </thead>
            <tbody>
              {pack.complexityTable.map((row, i) => (
                <tr key={i} className="border-t border-line text-[11.5px]">
                  <td className="px-4 py-2.5 font-bold text-ink">{row.approach}</td>
                  <td className="px-4 py-2.5 font-mono text-ink/70">{row.time}</td>
                  <td className="px-4 py-2.5 font-mono text-ink/55">{row.space}</td>
                  <td className="hidden px-4 py-2.5 text-ink/50 sm:table-cell">{row.note ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(pack.followUps.length || pack.relatedPatterns.length) ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {pack.followUps.length ? (
            <div className="rounded-[16px] border border-line bg-mist/40 p-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">likely follow-ups</span>
              <ul className="mt-2 space-y-1.5">
                {pack.followUps.map((f, i) => (
                  <li key={i} className="flex gap-2 text-[11.5px] leading-snug text-ink/65">
                    <span className="font-mono text-[10px] text-violet/70">Q{i + 1}</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {pack.relatedPatterns.length ? (
            <div className="rounded-[16px] border border-line bg-mist/40 p-4">
              <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">study next</span>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {pack.relatedPatterns.map((p) => (
                  <span key={p} className="rounded-full border border-line bg-white px-2.5 py-1 text-[10.5px] font-semibold text-ink/60">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
