"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import type { Problem } from "@/lib/leetcode";
import { LANGUAGE_OPTIONS, type Explanation, type SolutionPack, type Tier } from "@/lib/types";
import type { VizTrace } from "@/lib/viz";
import { VizPlayer } from "@/components/viz/VizPlayer";
import { Prose } from "@/components/ui/Prose";
import { ArrowRight, Bolt, ChevronDown, External, Sparkle, XIcon as X } from "@/components/ui/Icons";
import {
  Card,
  DifficultyPill,
  ErrorCard,
  GenerateCard,
  LoadingCard,
  SectionTitle,
  TIER_META,
} from "./shared";
import { SolutionView } from "./SolutionView";
import { ExplainView } from "./ExplainView";

type Tab = "solutions" | "explain" | "visualise" | "complexity" | "companies";
type LoadState = "idle" | "loading" | "ready" | "error";

const TABS: { id: Tab; label: string }[] = [
  { id: "solutions", label: "Solutions" },
  { id: "explain", label: "Explanation" },
  { id: "visualise", label: "Visualise" },
  { id: "complexity", label: "Complexity" },
  { id: "companies", label: "Companies" },
];

async function post<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => ({}))) as { error?: string };
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json as T;
}

export function Workspace({
  problem,
  initialLanguage,
  model,
}: {
  problem: Problem;
  initialLanguage: string;
  model: string;
}) {
  const [tab, setTab] = useState<Tab>("solutions");
  const [language, setLanguage] = useState(initialLanguage);
  const [showStatement, setShowStatement] = useState(true);

  const [solutions, setSolutions] = useState<SolutionPack | null>(null);
  const [solutionsLanguage, setSolutionsLanguage] = useState<string | null>(null);
  const [solState, setSolState] = useState<LoadState>("idle");
  const [solError, setSolError] = useState("");

  const [explanation, setExplanation] = useState<Explanation | null>(null);
  const [expState, setExpState] = useState<LoadState>("idle");
  const [expError, setExpError] = useState("");

  const [vizTier, setVizTier] = useState<Tier>("optimal");
  const [traces, setTraces] = useState<Partial<Record<Tier, VizTrace>>>({});
  const [vizState, setVizState] = useState<LoadState>("idle");
  const [vizError, setVizError] = useState("");
  const [manualCode, setManualCode] = useState("");

  const approachFor = useCallback(
    (tier: Tier) => solutions?.approaches.find((a) => a.tier === tier) ?? null,
    [solutions],
  );

  const loadSolutions = useCallback(
    async (lang = language) => {
      setSolState("loading");
      setSolError("");
      try {
        const data = await post<{ solutions: SolutionPack; language: string }>("/api/solutions", {
          slug: problem.slug,
          language: lang,
        });
        setSolutions(data.solutions);
        setSolutionsLanguage(data.language);
        setTraces({});
        setSolState("ready");
      } catch (err) {
        setSolError(err instanceof Error ? err.message : "Generation failed.");
        setSolState("error");
      }
    },
    [language, problem.slug],
  );

  const loadExplanation = useCallback(async () => {
    setExpState("loading");
    setExpError("");
    try {
      const data = await post<{ explanation: Explanation }>("/api/explain", { slug: problem.slug });
      setExplanation(data.explanation);
      setExpState("ready");
    } catch (err) {
      setExpError(err instanceof Error ? err.message : "Generation failed.");
      setExpState("error");
    }
  }, [problem.slug]);

  const loadTrace = useCallback(
    async (tier: Tier) => {
      setVizState("loading");
      setVizError("");
      setVizTier(tier);
      try {
        const approach = approachFor(tier);
        const data = await post<{ trace: VizTrace }>("/api/visualise", {
          slug: problem.slug,
          tier,
          title: approach?.title,
          code: approach?.code,
          idea: approach?.idea,
        });
        setTraces((prev) => ({ ...prev, [tier]: data.trace }));
        setVizState("ready");
      } catch (err) {
        setVizError(err instanceof Error ? err.message : "Visualisation failed.");
        setVizState("error");
      }
    },
    [approachFor, problem.slug],
  );

  function openVisualise(tier: Tier) {
    setTab("visualise");
    setVizTier(tier);
    if (!traces[tier]) void loadTrace(tier);
  }

  function changeLanguage(next: string) {
    if (next === language) return;
    setLanguage(next);
    window.localStorage.setItem("aa:lang", next);
    setTraces({});
    if (solState === "ready" || solState === "loading") {
      setSolutions(null);
      void loadSolutions(next);
    }
  }

  const activeTrace = traces[vizTier];
  const activeCode = useMemo(() => approachFor(vizTier)?.code, [approachFor, vizTier]);

  return (
    <div className="px-5 pb-14 sm:px-8 lg:px-12">
      {/* meta rail */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[11px] font-semibold text-haze">#{problem.number}</span>
          <DifficultyPill value={problem.difficulty} />
          {problem.tags.slice(0, 4).map((t) => (
            <span key={t} className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold text-ink/50">
              {t}
            </span>
          ))}
          {problem.paidOnly ? (
            <span className="rounded-full bg-[#f4c26b]/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#8a6414]">
              premium
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[10.5px] font-semibold text-ink/40">
            acceptance <span className="font-mono text-ink/70">{problem.acceptance}</span>
          </span>
          <a
            href={problem.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-[10.5px] font-bold text-ink/50 transition hover:text-violet"
          >
            LeetCode <External className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* language + tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div className="scrollbar-slim -mx-1 flex max-w-full flex-1 gap-1 overflow-x-auto px-1">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`whitespace-nowrap rounded-full px-3.5 py-2 text-[11.5px] font-bold transition ${
                  active ? "bg-ink text-white" : "text-ink/50 hover:bg-mist hover:text-ink"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        <label className="relative flex cursor-pointer items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-[10.5px] font-bold text-ink/60 transition hover:border-ink/25">
          <span className="text-ink/35">lang</span>
          {LANGUAGE_OPTIONS.find((l) => l.id === language)?.label}
          <ChevronDown className="h-3 w-3 text-ink/40" />
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            aria-label="Solution language"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* statement */}
      <div className="mb-5 overflow-hidden rounded-[16px] border border-line bg-mist/25">
        <button
          type="button"
          onClick={() => setShowStatement((v) => !v)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-ink/45">
            <span className="grid h-5 w-5 place-items-center rounded-full bg-white text-[9px] text-violet ring-1 ring-line">?</span>
            The question
          </span>
          <span className="flex items-center gap-1.5 text-[10.5px] font-semibold text-ink/35">
            {showStatement ? "hide" : "show"}
            <ChevronDown className={`h-3.5 w-3.5 transition ${showStatement ? "rotate-180" : ""}`} />
          </span>
        </button>
        {showStatement ? (
          <div className="border-t border-line/70 px-4 pb-4 pt-2">
            {problem.statement ? (
              <Prose text={problem.statement} />
            ) : (
              <p className="py-2 text-[12px] text-ink/45">LeetCode did not return a statement for this problem.</p>
            )}
            {problem.examples ? (
              <div className="mt-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">example inputs</span>
                <pre className="scrollbar-slim mt-1.5 overflow-x-auto rounded-[10px] bg-white px-3 py-2.5 font-mono text-[11px] text-ink/70 ring-1 ring-line">
                  {problem.examples}
                </pre>
              </div>
            ) : null}
            {problem.hints.length ? (
              <details className="mt-3 rounded-[10px] bg-white/70 px-3 py-2 ring-1 ring-line">
                <summary className="cursor-pointer text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink/45">
                  {problem.hints.length} LeetCode hints
                </summary>
                <ul className="mt-2 space-y-1.5">
                  {problem.hints.map((h, i) => (
                    <li key={i} className="text-[11.5px] leading-relaxed text-ink/60">
                      <span className="mr-1.5 font-mono text-[9.5px] text-violet/70">h{i + 1}</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* ---------------------------------------------------------- tabs */}
      {tab === "solutions" ? (
        <div className="animate-rise">
          {solState === "idle" ? (
            <GenerateCard
              title="Three solutions, one click"
              body="Brute force → better → optimal, each with runnable code, the reasoning, and the complexity it costs. Generated for this exact problem statement."
              button="Generate solutions"
              footer={`model: ${model} · lang: ${LANGUAGE_OPTIONS.find((l) => l.id === language)?.label}`}
              onRun={() => void loadSolutions()}
            />
          ) : null}

          {solState === "loading" ? (
            <LoadingCard
              label="Writing brute force, better and optimal…"
              hint="Usually 5–20 seconds. The code is written to compile as-is."
            />
          ) : null}

          {solState === "error" ? <ErrorCard message={solError} onRetry={() => void loadSolutions()} /> : null}

          {solState === "ready" && solutions ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[10.5px] font-semibold text-ink/40">
                  generated for <span className="font-bold text-ink/70">{LANGUAGE_OPTIONS.find((l) => l.id === solutionsLanguage)?.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => void loadSolutions()}
                  className="text-[10.5px] font-bold text-violet hover:underline"
                >
                  Regenerate
                </button>
              </div>
              <SolutionView pack={solutions} language={solutionsLanguage ?? language} onVisualise={openVisualise} />
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "explain" ? (
        <div className="animate-rise">
          {expState === "idle" ? (
            <GenerateCard
              title="A teacher, not a textbook"
              body="A plain-English intuition, then the algorithm in numbered steps, a dry run on the real example and the mistakes that cost people offers."
              button="Explain simply"
              accent="lime"
              onRun={() => void loadExplanation()}
            />
          ) : null}
          {expState === "loading" ? <LoadingCard label="Building the explanation…" hint="No jargon. Promise." /> : null}
          {expState === "error" ? <ErrorCard message={expError} onRetry={() => void loadExplanation()} /> : null}
          {expState === "ready" && explanation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[10.5px] font-semibold text-ink/40">plain-English walkthrough</span>
                <button type="button" onClick={() => void loadExplanation()} className="text-[10.5px] font-bold text-violet hover:underline">
                  Regenerate
                </button>
              </div>
              <ExplainView explanation={explanation} onVisualise={() => openVisualise("optimal")} />
            </div>
          ) : null}
        </div>
      ) : null}

      {tab === "visualise" ? (
        <div className="animate-rise space-y-4">
          <Card className="!p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <SectionTitle eyebrow="frame by frame" title="Watch the algorithm think" />
                <p className="-mt-3 text-[11.5px] leading-relaxed text-ink/50">
                  Every frame is a real snapshot: pointers, highlights, the data structures and the line of code that just ran.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(["brute", "better", "optimal"] as Tier[]).map((tier) => {
                  const available = Boolean(solutions?.approaches.some((a) => a.tier === tier));
                  const active = vizTier === tier;
                  return (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => {
                        setVizTier(tier);
                        if (traces[tier]) return;
                        void loadTrace(tier);
                      }}
                      className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10.5px] font-bold transition ${
                        active ? `${TIER_META[tier].chip} ring-1 ring-inset ring-ink/10` : "bg-mist text-ink/45 hover:text-ink"
                      }`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${TIER_META[tier].dot}`} />
                      {TIER_META[tier].label}
                      {!available ? <span className="text-[8px] uppercase opacity-60">no code</span> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {vizState === "loading" ? (
            <LoadingCard
              label={`Drawing the ${TIER_META[vizTier].label.toLowerCase()} run…`}
              hint="Choosing the right structures and writing every frame."
            />
          ) : null}

          {vizState === "error" ? <ErrorCard message={vizError} onRetry={() => void loadTrace(vizTier)} /> : null}

          {activeTrace ? (
            <>
              <VizPlayer trace={activeTrace} code={activeCode} />
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-mist/60 px-4 py-3">
                <p className="text-[11px] text-ink/50">
                  Not seeing what you expected? Regenerate this run, or pick a different approach above.
                </p>
                <button
                  type="button"
                  onClick={() => void loadTrace(vizTier)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] bg-ink px-3 py-2 text-[11px] font-bold text-white transition hover:bg-ink-soft"
                >
                  <Bolt className="h-3 w-3" />
                  Regenerate run
                </button>
              </div>
            </>
          ) : null}

          {!activeTrace && vizState !== "loading" && vizState !== "error" ? (
            <GenerateCard
              title={`Visualise the ${TIER_META[vizTier].label.toLowerCase()} solution`}
              body="A frame-by-frame animation of the data structures — arrays, strings, maps, linked lists, trees, graphs, stacks and queues all render natively."
              button="Generate visualisation"
              onRun={() => void loadTrace(vizTier)}
            />
          ) : null}

          {solutions ? null : (
            <p className="text-center text-[10.5px] text-ink/40">
              Tip: generate the solutions tab first so the visual can highlight the exact code it is drawing.
            </p>
          )}
          {/* Manual code writer section - allows users to write their own code and visualise it */}
          {vizState !== "loading" && vizState !== "error" ? (
            <Card className="!p-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <SectionTitle eyebrow="custom" title="Write your own code" />
                  <p className="-mt-3 text-[11px] leading-relaxed text-ink/50">
                    Write your implementation and watch it visualise frame by frame.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <textarea
                    placeholder="function twoSum(nums, target) { const seen = new Map(); ... }"
                    rows={8}
                    className="w-full rounded-[12px] border border-ink/20 bg-ink/50 text-[12px] text-ink p-3 focus:outline-none focus:ring-2 focus:ring-violet/50 resize-y"
                    value={manualCode ?? ""}
                    onChange={(e) => setManualCode(e.target.value)}disabled={(vizState as LoadState) === "loading"}
                    />
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void loadTrace(vizTier)}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2.5 text-[11px] font-bold text-ink/70 transition:hover:border-violet/40 hover:bg-violet/5 hover:text-violet"
                    >
                      <Bolt className="h-3.5 w-3.5" />
                      Visualise My Code
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="group inline-flex w-full items-center justify-center rounded-[10px] border border-line px-3 py-2.5 text-[11px] font-bold text-ink/50 transition:hover:border-ink/40 hover:bg-mist/50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
            </div>
            </Card>
          ) : null}

          {solutions ? null : (
            <p className="text-center text-[10.5px] text-ink/40">
              Tip: generate the solutions tab first so the visual can highlight the exact code it is drawing.
            </p>
          )}
        </div>
      ) : null}

      {tab === "complexity" ? (
        <div className="animate-rise">
          {!solutions ? (
            <GenerateCard
              title="Complexity comes with the solutions"
              body="Generate the three approaches once and this tab fills with a time/space table, the reasoning behind each bound and the trade-offs to say out loud in an interview."
              button="Generate solutions"
              onRun={() => void loadSolutions()}
            />
          ) : (
            <div className="space-y-5">
              <SectionTitle eyebrow="the numbers" title="Time & space, approach by approach" />
              <div className="grid gap-3 sm:grid-cols-3">
                {solutions.approaches.map((a) => (
                  <div key={a.tier} className="rounded-[16px] border border-line bg-white p-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${TIER_META[a.tier].chip}`}>
                      {TIER_META[a.tier].label}
                    </span>
                    <p className="mt-2 text-[12.5px] font-extrabold tracking-tight text-ink">{a.title}</p>
                    <div className="mt-2.5 space-y-1 font-mono text-[11px]">
                      <p className="text-ink/70">
                        <span className="text-ink/35">time </span>
                        {a.time}
                      </p>
                      <p className="text-ink/55">
                        <span className="text-ink/35">space </span>
                        {a.space}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-hidden rounded-[16px] border border-line">
                <table className="w-full border-collapse text-left text-[11.5px]">
                  <thead>
                    <tr className="bg-mist/70 text-[9.5px] uppercase tracking-[0.12em] text-ink/45">
                      <th className="px-4 py-2.5 font-bold">Approach</th>
                      <th className="px-4 py-2.5 font-bold">Time</th>
                      <th className="px-4 py-2.5 font-bold">Space</th>
                      <th className="px-4 py-2.5 font-bold">Trade-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {solutions.complexityTable.map((row, i) => (
                      <tr key={i} className="border-t border-line">
                        <td className="px-4 py-2.5 font-bold text-ink">{row.approach}</td>
                        <td className="px-4 py-2.5 font-mono text-ink/70">{row.time}</td>
                        <td className="px-4 py-2.5 font-mono text-ink/55">{row.space}</td>
                        <td className="px-4 py-2.5 text-ink/55">{row.note ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-[16px] bg-ink p-5 text-white">
                <span className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-lime">
                  <Sparkle className="h-3 w-3" /> say it like this
                </span>
                <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-white/70">
                  “The brute force is {solutions.approaches[0]?.time} because {solutions.approaches[0]?.title.toLowerCase()}. We spend{" "}
                  {solutions.approaches[0]?.space} extra space. The optimal version drops to{" "}
                  {solutions.approaches[solutions.approaches.length - 1]?.time} by trading{" "}
                  {solutions.approaches[solutions.approaches.length - 1]?.space} space for a single pass.”
                </p>
              </div>
            </div>
          )}
          {/* Manual code writer section - allows users to write their own code and visualise it */}
          {vizState !== "loading" && vizState !== "error" ? (
            <Card className="!p-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <SectionTitle eyebrow="custom" title="Write your own code" />
                  <p className="-mt-3 text-[11px] leading-relaxed text-ink/50">
                    Write your implementation and watch it visualise frame by frame.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <textarea
                    placeholder="function twoSum(nums, target) { const seen = new Map(); ... }"
                    rows={8}
                    className="w-full rounded-[12px] border border-ink/20 bg-ink/50 text-[12px] text-ink p-3 focus:outline-none focus:ring-2 focus:ring-violet/50 resize-y"
                    value={manualCode ?? ""}
                    onChange={(e) => setManualCode(e.target.value)}disabled={(vizState as LoadState) === "loading"}
                    />
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void loadTrace(vizTier)}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2.5 text-[11px] font-bold text-ink/70 transition:hover:border-violet/40 hover:bg-violet/5 hover:text-violet"
                    >
                      <Bolt className="h-3.5 w-3.5" />
                      Visualise My Code
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="group inline-flex w-full items-center justify-center rounded-[10px] border border-line px-3 py-2.5 text-[11px] font-bold text-ink/50 transition:hover:border-ink/40 hover:bg-mist/50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
            </div>
            </Card>
          ) : null}

          {solutions ? null : (
            <p className="text-center text-[10.5px] text-ink/40">
              Tip: generate the solutions tab first so the visual can highlight the exact code it is drawing.
            </p>
          )}
        </div>
      ) : null}

      {tab === "companies" ? (
        <div className="animate-rise">
          {!solutions ? (
            <GenerateCard
              title="Who actually asks this?"
              body="Company frequency is generated alongside the solutions, based on public interview reports and the pattern behind this problem."
              button="Generate solutions"
              onRun={() => void loadSolutions()}
            />
          ) : (
            <div className="space-y-5">
              <SectionTitle
                eyebrow="interview signal"
                title="Companies that ask this problem"
                action={<span className="text-[10px] text-ink/40">approximate · public interview reports</span>}
              />

              <div className="grid gap-2.5 sm:grid-cols-2">
                {solutions.companies.map((c) => {
                  const score = c.frequency === "Very High" ? 100 : c.frequency === "High" ? 72 : c.frequency === "Medium" ? 45 : 22;
                  const bar =
                    c.frequency === "Very High" || c.frequency === "High" ? "bg-violet" : c.frequency === "Medium" ? "bg-coral" : "bg-ink/25";
                  return (
                    <div key={c.name} className="rounded-[14px] border border-line bg-white p-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <span className="flex items-center gap-2">
                          <span className="grid h-7 w-7 place-items-center rounded-md bg-mist text-[11px] font-extrabold text-ink/55">
                            {c.name[0]}
                          </span>
                          <span className="text-[12.5px] font-extrabold text-ink">{c.name}</span>
                        </span>
                        <span className="rounded-full bg-mist px-2 py-0.5 text-[9.5px] font-bold text-ink/50">{c.frequency}</span>
                      </div>
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-mist">
                        <div className={`h-full rounded-full ${bar}`} style={{ width: `${score}%` }} />
                      </div>
                      {c.note ? <p className="mt-2 text-[10.5px] leading-snug text-ink/45">{c.note}</p> : null}
                    </div>
                  );
                })}
              </div>

              {problem.similar.length ? (
                <div>
                  <SectionTitle eyebrow="near neighbours" title="Similar problems to grind next" />
                  <div className="grid gap-2 sm:grid-cols-2">
                    {problem.similar.slice(0, 8).map((s) => (
                      <Link
                        key={s.slug}
                        href={`/problem/${s.slug}?lang=${language}`}
                        className="group flex items-center justify-between gap-3 rounded-[12px] border border-line px-3.5 py-2.5 transition hover:border-ink/20 hover:bg-mist/40"
                      >
                        <span className="min-w-0 truncate text-[12px] font-bold text-ink">{s.title}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-full px-1.5 py-0.5 text-[8.5px] font-extrabold uppercase ${
                              s.difficulty === "Easy"
                                ? "bg-lime/25 text-[#5d7a10]"
                                : s.difficulty === "Medium"
                                  ? "bg-[#f4c26b]/25 text-[#8a6414]"
                                  : "bg-coral/25 text-[#a4402f]"
                            }`}
                          >
                            {s.difficulty}
                          </span>
                          <ArrowRight className="h-3 w-3 text-ink/25 transition group-hover:translate-x-0.5 group-hover:text-violet" />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
          {/* Manual code writer section - allows users to write their own code and visualise it */}
          {vizState !== "loading" && vizState !== "error" ? (
            <Card className="!p-4">
              <div className="flex flex-col space-y-4">
                <div>
                  <SectionTitle eyebrow="custom" title="Write your own code" />
                  <p className="-mt-3 text-[11px] leading-relaxed text-ink/50">
                    Write your implementation and watch it visualise frame by frame.
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <textarea
                    placeholder="function twoSum(nums, target) { const seen = new Map(); ... }"
                    rows={8}
                    className="w-full rounded-[12px] border border-ink/20 bg-ink/50 text-[12px] text-ink p-3 focus:outline-none focus:ring-2 focus:ring-violet/50 resize-y"
                    value={manualCode ?? ""}
                    onChange={(e) => setManualCode(e.target.value)}disabled={(vizState as LoadState) === "loading"}
                    />
                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={() => void loadTrace(vizTier)}
                      className="group inline-flex w-full items-center justify-center gap-2 rounded-[10px] border border-line px-3 py-2.5 text-[11px] font-bold text-ink/70 transition:hover:border-violet/40 hover:bg-violet/5 hover:text-violet"
                    >
                      <Bolt className="h-3.5 w-3.5" />
                      Visualise My Code
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualCode('')}
                      className="group inline-flex w-full items-center justify-center rounded-[10px] border border-line px-3 py-2.5 text-[11px] font-bold text-ink/50 transition:hover:border-ink/40 hover:bg-mist/50"
                    >
                      <X className="h-3.5 w-3.5" />
                      Clear
                      <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
            </div>
            </Card>
          ) : null}

          {solutions ? null : (
            <p className="text-center text-[10.5px] text-ink/40">
              Tip: generate the solutions tab first so the visual can highlight the exact code it is drawing.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
