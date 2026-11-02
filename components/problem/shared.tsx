"use client";

import type { ReactNode } from "react";
import { Alert, ArrowRight, Sparkle } from "@/components/ui/Icons";
import type { Tier } from "@/lib/types";

export const TIER_META: Record<Tier, { label: string; chip: string; dot: string; text: string }> = {
  brute: { label: "Brute force", chip: "bg-coral/18 text-[#9c4335]", dot: "bg-coral", text: "text-[#9c4335]" },
  better: { label: "Better", chip: "bg-[#f4c26b]/25 text-[#8a6414]", dot: "bg-[#e6b64a]", text: "text-[#8a6414]" },
  optimal: { label: "Optimal", chip: "bg-lime/25 text-[#5d7a10]", dot: "bg-lime-deep", text: "text-[#5d7a10]" },
};

export function DifficultyPill({ value }: { value: string }) {
  const cls =
    value === "Easy"
      ? "bg-lime/25 text-[#5d7a10]"
      : value === "Medium"
        ? "bg-[#f4c26b]/25 text-[#8a6414]"
        : "bg-coral/25 text-[#a4402f]";
  return (
    <span className={`rounded-full px-2.5 py-1 text-[9.5px] font-extrabold uppercase tracking-[0.1em] ${cls}`}>{value}</span>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-line bg-white p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow ? <span className="text-[9.5px] font-bold uppercase tracking-[0.18em] text-violet">{eyebrow}</span> : null}
        <h2 className="mt-1 text-[19px] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function GenerateCard({
  title,
  body,
  button,
  onRun,
  footer,
  accent = "violet",
}: {
  title: string;
  body: string;
  button: string;
  onRun: () => void;
  footer?: string;
  accent?: "violet" | "lime";
}) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-line bg-mist/50 p-6">
      <span
        className={`absolute -right-8 -top-10 h-32 w-32 rounded-full blur-2xl ${
          accent === "lime" ? "bg-lime/35" : "bg-violet/18"
        }`}
      />
      <div className="relative flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-md">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.14em] text-lime">
            <Sparkle className="h-2.5 w-2.5" />
            generated on demand
          </span>
          <h3 className="mt-3 text-[16px] font-extrabold tracking-tight text-ink">{title}</h3>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink/55">{body}</p>
          {footer ? <p className="mt-2 font-mono text-[10px] text-ink/35">{footer}</p> : null}
        </div>
        <button
          type="button"
          onClick={onRun}
          className="group inline-flex items-center gap-2 rounded-[14px] bg-ink px-5 py-3 text-[12.5px] font-bold text-white transition hover:bg-ink-soft active:scale-[0.99]"
        >
          {button}
          <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

export function LoadingCard({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-[20px] border border-line bg-white p-6">
      <div className="flex items-center gap-2.5">
        <span className="flex gap-1">
          <span className="dot h-1.5 w-1.5 rounded-full bg-violet" />
          <span className="dot h-1.5 w-1.5 rounded-full bg-coral" />
          <span className="dot h-1.5 w-1.5 rounded-full bg-lime" />
        </span>
        <span className="text-[12.5px] font-bold text-ink">{label}</span>
      </div>
      {hint ? <p className="mt-1 text-[11px] text-ink/45">{hint}</p> : null}
      <div className="mt-5 space-y-2.5">
        <div className="skeleton h-3.5 w-3/4 rounded-full" />
        <div className="skeleton h-3.5 w-full rounded-full" />
        <div className="skeleton h-3.5 w-5/6 rounded-full" />
        <div className="skeleton mt-4 h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-[20px] border border-coral/40 bg-coral/8 p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-coral/25 text-[#a4402f]">
          <Alert className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[12.5px] font-bold text-[#8a3a2c]">That did not go through</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[#8a3a2c]/80">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 rounded-[10px] bg-[#8a3a2c] px-3.5 py-2 text-[11.5px] font-bold text-white transition hover:bg-[#733023]"
            >
              Try again
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-line bg-white px-2.5 py-1 text-[10px] font-semibold text-ink/60">{children}</span>
  );
}
