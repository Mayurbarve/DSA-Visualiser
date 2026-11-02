"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { VizStage } from "./VizStage";
import type { VizTrace } from "@/lib/viz";
import { Pause, Play, Reset, SkipBack, SkipForward } from "@/components/ui/Icons";

export function VizPlayer({ trace, code }: { trace: VizTrace; code?: string }) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const activeRef = useRef<HTMLDivElement>(null);
  const codeBoxRef = useRef<HTMLPreElement>(null);

  const total = trace.frames.length;
  const frame = trace.frames[Math.min(index, total - 1)];
  const lines = useMemo(() => (code ? code.replace(/\s+$/, "").split("\n") : []), [code]);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [trace]);

  useEffect(() => {
    if (!playing) return;
    if (index >= total - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => setIndex((i) => Math.min(i + 1, total - 1)), 1150 / speed);
    return () => window.clearTimeout(id);
  }, [playing, index, total, speed]);

  useEffect(() => {
    if (!frame?.codeLine || !codeBoxRef.current) return;
    const el = codeBoxRef.current.querySelector<HTMLElement>(`[data-line="${frame.codeLine}"]`);
    if (el) {
      const box = codeBoxRef.current;
      const top = el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2;
      box.scrollTo({ top: Math.max(top, 0), behavior: "smooth" });
    }
  }, [frame?.codeLine]);

  if (!frame) return null;

  return (
    <div className="overflow-hidden rounded-[22px] border border-line bg-white">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-[15px] font-extrabold tracking-tight text-ink">{trace.title}</h3>
            {trace.approach ? (
              <span className="rounded-full bg-violet/10 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide text-violet">
                {trace.approach}
              </span>
            ) : null}
          </div>
          {trace.summary ? <p className="mt-1 max-w-2xl text-[11.5px] leading-relaxed text-ink/50">{trace.summary}</p> : null}
        </div>
        <span className="rounded-full bg-mist px-2.5 py-1 font-mono text-[10.5px] font-semibold text-ink/55">
          {index + 1} / {total}
        </span>
      </div>

      <div className={`grid gap-4 p-4 ${lines.length ? "lg:grid-cols-[1.3fr_1fr]" : ""}`}>
        <div>
          <div className="relative flex min-h-[280px] items-center justify-center rounded-[16px] bg-[#fafafb] p-5 ring-1 ring-line/70">
            <VizStage structures={frame.structures} vars={frame.vars} />
          </div>

          <div className="mt-3 flex items-start gap-3 rounded-[14px] bg-mist/70 px-3.5 py-3" ref={activeRef}>
            <span className="mt-[1px] grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ink font-mono text-[10px] font-semibold text-lime">
              {index + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[12.5px] font-semibold leading-snug text-ink">{frame.caption || "…"}</p>
              {frame.callout ? (
                <p className="mt-1 border-l-2 border-violet/40 pl-2 text-[11px] leading-snug text-violet/80">{frame.callout}</p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIndex(0);
                setPlaying(false);
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/50 transition hover:border-ink/25 hover:text-ink"
              aria-label="Restart"
            >
              <Reset className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(i - 1, 0))}
              disabled={index === 0}
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/60 transition enabled:hover:border-ink/25 enabled:hover:text-ink disabled:opacity-35"
              aria-label="Previous step"
            >
              <SkipBack className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                if (index >= total - 1) setIndex(0);
                setPlaying((p) => !p);
              }}
              className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[11.5px] font-bold text-white transition hover:bg-ink-soft"
            >
              {playing ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              {playing ? "Pause" : index >= total - 1 ? "Replay" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(i + 1, total - 1))}
              disabled={index >= total - 1}
              className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink/60 transition enabled:hover:border-ink/25 enabled:hover:text-ink disabled:opacity-35"
              aria-label="Next step"
            >
              <SkipForward className="h-3.5 w-3.5" />
            </button>

            <input
              type="range"
              min={0}
              max={Math.max(total - 1, 0)}
              value={index}
              onChange={(e) => {
                setPlaying(false);
                setIndex(Number(e.target.value));
              }}
              className="mx-1 h-1.5 min-w-[90px] flex-1 cursor-pointer appearance-none rounded-full bg-line accent-violet"
              aria-label="Step slider"
            />

            <button
              type="button"
              onClick={() => setSpeed((s) => (s === 0.5 ? 1 : s === 1 ? 2 : 0.5))}
              className="rounded-full border border-line px-2.5 py-1.5 font-mono text-[10px] font-semibold text-ink/55 transition hover:border-ink/25 hover:text-ink"
            >
              {speed}×
            </button>
          </div>
        </div>

        {lines.length ? (
          <div className="overflow-hidden rounded-[16px] bg-[#24282f]">
            <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">code</span>
              {frame.codeLine ? (
                <span className="font-mono text-[9.5px] text-lime/80">line {frame.codeLine}</span>
              ) : null}
            </div>
            <pre ref={codeBoxRef} className="scrollbar-slim code-surface max-h-[430px] overflow-auto py-2 text-[11.5px] leading-[1.65]">
              {lines.map((line, i) => {
                const active = frame.codeLine === i + 1;
                return (
                  <div
                    key={i}
                    data-line={i + 1}
                    className={`flex gap-3 px-3 ${active ? "border-l-2 border-lime bg-lime/10" : "border-l-2 border-transparent"}`}
                  >
                    <span className={`w-5 shrink-0 select-none text-right font-mono ${active ? "text-lime/80" : "text-white/25"}`}>
                      {i + 1}
                    </span>
                    <code className={`whitespace-pre ${active ? "text-white" : "text-white/70"}`}>{line || " "}</code>
                  </div>
                );
              })}
            </pre>
          </div>
        ) : null}
      </div>

      {trace.result ? (
        <div className="flex items-center gap-2 border-t border-line bg-mist/50 px-5 py-2.5">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-ink/40">result</span>
          <span className="font-mono text-[11.5px] font-semibold text-ink">{trace.result}</span>
        </div>
      ) : null}
    </div>
  );
}
