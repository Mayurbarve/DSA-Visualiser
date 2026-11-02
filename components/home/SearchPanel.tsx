"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ChevronDown, Globe, SearchIcon } from "@/components/ui/Icons";
import { LANGUAGE_OPTIONS } from "@/lib/types";

const QUICK = ["1", "121", "42", "200", "76"];

export function SearchPanel({ size = "lg" }: { size?: "lg" | "sm" }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [language, setLanguage] = useState("python3");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("aa:lang");
    if (saved && LANGUAGE_OPTIONS.some((l) => l.id === saved)) setLanguage(saved);
  }, []);

  function go(raw: string) {
    const q = raw.trim();
    if (!q) {
      setError("Enter a problem number, like 1 or 121.");
      inputRef.current?.focus();
      return;
    }
    setError("");
    window.localStorage.setItem("aa:lang", language);
    router.push(`/problem/${encodeURIComponent(q)}?lang=${language}`);
  }

  return (
    <div className={size === "lg" ? "w-full" : "w-full max-w-xl"}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          go(value);
        }}
        className={`flex flex-col gap-2 rounded-[26px] bg-white p-2 shadow-[0_24px_50px_-28px_rgba(20,23,29,0.7)] sm:flex-row sm:items-center ${
          size === "sm" ? "sm:rounded-2xl" : ""
        }`}
      >
        <label className="flex min-w-0 flex-1 cursor-text items-center gap-3 rounded-[20px] px-3 py-2.5 transition focus-within:bg-mist/70">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-violet">
            <SearchIcon className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-haze">Problem number</span>
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError("");
              }}
              placeholder="1 · 121 · trapping-rain-water"
              className="w-full min-w-0 bg-transparent text-[14px] font-bold text-ink outline-none placeholder:font-medium placeholder:text-haze/80"
              aria-label="LeetCode problem number or name"
            />
          </span>
        </label>

        <div className="hidden h-9 w-px bg-line sm:block" />

        <label className="relative flex cursor-pointer items-center gap-3 rounded-[20px] px-3 py-2.5 transition hover:bg-mist/60 sm:w-[168px]">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mist text-coral-deep">
            <Globe className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[9.5px] font-bold uppercase tracking-[0.14em] text-haze">Language</span>
            <span className="flex items-center gap-1 text-[14px] font-bold text-ink">
              {LANGUAGE_OPTIONS.find((l) => l.id === language)?.label}
              <ChevronDown className="h-3.5 w-3.5 text-ink/50" />
            </span>
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none opacity-0"
            aria-label="Preferred language"
          >
            {LANGUAGE_OPTIONS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className={`group flex items-center justify-center gap-2 rounded-[18px] bg-violet px-6 py-3.5 text-[13.5px] font-bold text-white transition hover:bg-violet-soft active:scale-[0.99] ${
            size === "lg" ? "sm:min-w-[132px]" : ""
          }`}
        >
          Search
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] text-white/45">
        <span className="font-semibold uppercase tracking-[0.12em] text-[10px] text-white/40">Try</span>
        {QUICK.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => go(n)}
            className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 font-mono text-[11px] text-white/70 transition hover:border-lime/60 hover:text-lime"
          >
            #{n}
          </button>
        ))}
        <span className="hidden sm:inline">or any title — “merge intervals”, “lru cache”</span>
      </div>

      {error ? <p className="mt-2 text-[12.5px] font-semibold text-coral">{error}</p> : null}
    </div>
  );
}
