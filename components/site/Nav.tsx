"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu } from "@/components/ui/Icons";
import { useState } from "react";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/problems", label: "Problems" },
  { href: "/visualise", label: "Visualise" },
  { href: "/problems?tag=Dynamic%20Programming", label: "Sheets" },
  { href: "/problems?track=system-design", label: "System Design", soon: true },
];

export function Brand({ tone = "light" }: { tone?: "light" | "dark" }) {
  const text = tone === "light" ? "text-white" : "text-ink";
  const border = tone === "light" ? "border-white/35" : "border-ink/25";
  return (
    <Link href="/" className="group flex items-center gap-3">
      <span
        className={`grid h-11 w-11 place-items-center rounded-[11px] border ${border} ${text} transition group-hover:border-lime`}
      >
        <span className="text-[15px] font-extrabold leading-none tracking-tight">AA</span>
        <span className="mt-0.5 text-[7px] font-semibold uppercase tracking-[0.18em] opacity-70">learn</span>
      </span>
      <span className={`hidden text-[15px] font-extrabold tracking-tight sm:block ${text}`}>
        Algo<span className="opacity-50">Atlas</span>
      </span>
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-30 px-6 pt-6 sm:px-10 lg:px-14">
      <div className="flex items-center justify-between gap-6">
        <Brand />

        <nav className="hidden items-center gap-8 lg:flex">
          {LINKS.map((link) => {
            const target = link.href.split("?")[0];
            const active = !link.soon && (target === "/" ? pathname === "/" : pathname === target || pathname.startsWith(`${target}/`));
            return (
              <Link
                key={link.label}
                href={link.href}
                className={`relative text-[13.5px] font-semibold tracking-tight transition ${
                  active ? "text-white" : "text-white/60 hover:text-white"
                }`}
              >
                {link.label}
                {link.soon ? (
                  <span className="ml-1.5 align-middle rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white/60">
                    soon
                  </span>
                ) : null}
                {active ? <span className="absolute -bottom-2 left-1/2 h-[2px] w-6 -translate-x-1/2 rounded-full bg-coral" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button className="hidden text-[13.5px] font-semibold text-white/70 transition hover:text-white sm:block" type="button">
            Log in
          </button>
          <button
            type="button"
            className="rounded-full border border-white/40 px-5 py-2.5 text-[13px] font-semibold text-white transition hover:border-white hover:bg-white/10"
          >
            Sign Up
          </button>
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((v) => !v)}
            className="grid h-10 w-10 place-items-center rounded-full border border-white/30 text-white lg:hidden"
          >
            <Menu />
          </button>
        </div>
      </div>

      {open ? (
        <div className="mt-4 grid gap-1 rounded-2xl border border-white/12 bg-ink-deep/95 p-3 lg:hidden">
          {LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-2.5 text-sm font-semibold text-white/75 hover:bg-white/8 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
      ) : null}
    </header>
  );
}

export function BackLink({ href = "/problems", label = "All problems" }: { href?: string; label?: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-white/60 transition hover:text-white"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      {label}
    </Link>
  );
}
