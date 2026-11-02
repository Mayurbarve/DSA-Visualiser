import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { SearchPanel } from "@/components/home/SearchPanel";
import { ArrowRight, Bolt, ChevronDown, CodeIcon, Layers, Pin, Sparkle } from "@/components/ui/Icons";
import { COMPANY_LOGOS, CURATED, TODAYS_PICK, VISUALISERS } from "@/lib/curated";
import { MODEL } from "@/lib/llm";

const STEPS = [
  {
    n: "01",
    title: "Type the problem number",
    body: "Any LeetCode number, title or slug. No forms, no setup, no account.",
  },
  {
    n: "02",
    title: "We fetch the real question",
    body: "The statement, examples, tags and acceptance rate are pulled live from LeetCode.",
  },
  {
    n: "03",
    title: "Generate brute → better → optimal",
    body: "Three runnable solutions in your language, each with the reasoning behind it.",
  },
  {
    n: "04",
    title: "Explain it or watch it",
    body: "A calm plain-English walkthrough, or a frame-by-frame visual of the data structures.",
  },
  {
    n: "05",
    title: "See the depth",
    body: "Complexity table, alternative patterns and the companies that ask this problem.",
  },
];

const TRACKS = [
  {
    tag: "Live now",
    title: "DSA",
    body: "Arrays to graphs, all 3,000+ LeetCode problems, every classic algorithm.",
    live: true,
  },
  {
    tag: "Next",
    title: "LLD",
    body: "Object modelling, SOLID, design patterns — with UML you can step through.",
    live: false,
  },
  {
    tag: "Soon",
    title: "HLD",
    body: "Caching, queues, sharding and the trade-offs behind real system designs.",
    live: false,
  },
];

function CompanyPill({ name }: { name: string }) {
  return (
    <div className="flex h-[62px] items-center justify-center gap-2 rounded-[16px] bg-[#f4f4f6] px-4 transition hover:bg-[#eeeef1]">
      <span className="grid h-6 w-6 place-items-center rounded-md bg-white text-ink/60 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.05)]">
        <span className="text-[11px] font-extrabold">{name[0]}</span>
      </span>
      <span className="text-[15px] font-bold tracking-tight text-ink/65">{name}</span>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="flex min-h-screen justify-center bg-paper px-3 py-4 sm:px-5 sm:py-6 lg:py-9">
      <div className="frame relative w-full max-w-[1200px] overflow-hidden bg-white">
        {/* ------------------------------------------------ hero */}
        <section className="hero-surface relative text-white">
          <Nav />

          <div className="relative z-10 grid items-start gap-10 px-6 pb-32 pt-10 sm:px-10 lg:grid-cols-[1.02fr_0.98fr] lg:px-14 lg:pb-36 lg:pt-12">
            <div>
              <div className="mb-7 flex items-center gap-3">
                <span className="relative grid h-[62px] w-[104px] place-items-center overflow-hidden rounded-[16px] bg-gradient-to-br from-violet via-violet to-[#4d21c9] shadow-[0_18px_30px_-18px_rgba(106,59,240,0.9)]">
                  <span className="absolute -right-3 -top-4 h-12 w-12 rounded-full bg-white/15" />
                  <span className="absolute bottom-2 left-3 h-3 w-3 rounded-full bg-coral" />
                  <span className="text-[17px] font-extrabold tracking-tight">DSA</span>
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/60">
                  LeetCode cockpit
                </span>
              </div>

              <h1 className="text-[clamp(2.35rem,5vw,3.7rem)] font-extrabold leading-[1.03] tracking-[-0.03em]">
                Master Every
                <br />
                LeetCode Problem
              </h1>

              <p className="mt-5 max-w-[430px] text-[14.5px] leading-[1.65] text-white/60">
                Paste a problem number and watch it come apart — brute force to optimal, explained in
                plain English and animated step by step. Built for DSA today, LLD and HLD next.
              </p>

              <div className="mt-8 max-w-[540px]">
                <SearchPanel />
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-7">
                <Link href="/problems" className="group flex items-center gap-2 text-[13px] font-semibold text-white/85">
                  DSA track
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-white/25 transition group-hover:border-lime group-hover:text-lime">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </Link>
                <span className="flex items-center gap-2 text-[13px] font-semibold text-white/35">
                  System design
                  <span className="grid h-6 w-6 place-items-center rounded-full border border-white/12">
                    <ChevronDown className="h-3 w-3" />
                  </span>
                  <span className="rounded-full bg-lime/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-lime">
                    soon
                  </span>
                </span>
              </div>
            </div>

            {/* floating cards, mirroring the reference */}
            <div className="relative hidden h-[352px] lg:block">
              <div className="animate-rise absolute left-[10%] top-0 z-10 w-[214px] rotate-[1.4deg] rounded-[22px] bg-coral px-5 py-4 shadow-[0_26px_40px_-24px_rgba(239,144,128,0.85)]">
                <p className="text-[15.5px] font-extrabold leading-tight text-[#4a1f18]">
                  Interview
                  <br />
                  ready
                </p>
                <p className="mt-2 text-[11px] font-semibold text-[#4a1f18]/60">Brute · Better · Optimal</p>
              </div>

              <div className="glass-card animate-rise absolute left-0 top-[88px] z-20 w-[288px] rounded-[24px] p-5">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-lime text-ink">
                  <Bolt className="h-4 w-4" />
                </span>
                <p className="mt-4 text-[17px] font-extrabold tracking-tight text-white">Watch it run</p>
                <p className="mt-1.5 text-[12px] leading-relaxed text-white/55">
                  Arrays, strings, maps, trees, graphs, stacks &amp; queues — every pointer animated.
                </p>
                <div className="mt-4 flex items-center gap-1.5">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <span
                      key={i}
                      className={`h-5 flex-1 rounded-[4px] ${
                        i === 2 ? "bg-coral" : i === 3 ? "bg-lime" : i < 2 ? "bg-white/45" : "bg-white/12"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="glass-card-dim absolute right-0 top-[142px] z-10 w-[212px] rounded-[22px] p-5">
                <span className="grid h-9 w-9 place-items-center rounded-full border border-lime/40 text-lime/70">
                  <Layers className="h-4 w-4" />
                </span>
                <p className="mt-3 text-[15.5px] font-extrabold tracking-tight text-white/40">System Design</p>
                <p className="mt-1 text-[11px] leading-relaxed text-white/25">LLD · HLD tracks landing after DSA.</p>
              </div>

              <div className="absolute bottom-2 right-[6%] z-20 flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-[10.5px] font-semibold text-white/55">
                <Sparkle className="h-3 w-3 text-lime" />
                {MODEL} · live generation
              </div>
            </div>
          </div>
        </section>

        {/* ------------------------------------------------ white band */}
        <section className="relative z-20 -mt-[74px] rounded-t-[38px] bg-white px-6 pb-10 pt-8 sm:px-10 lg:px-14">
          <div className="grid items-center gap-6 lg:grid-cols-[330px_1fr]">
            <Link
              href={`/problem/${TODAYS_PICK.slug}?lang=python3`}
              className="group flex items-center gap-3 rounded-[18px] bg-white p-3 ring-1 ring-line transition hover:ring-ink/20"
            >
              <span className="relative grid h-[68px] w-[68px] shrink-0 place-items-center overflow-hidden rounded-[12px] bg-gradient-to-br from-[#5b34d6] via-[#7a4df0] to-[#f0907f]">
                <CodeIcon className="h-6 w-6 text-white/85" />
                <span className="absolute bottom-1 right-1 rounded bg-black/25 px-1 text-[8px] font-bold text-white">
                  #{TODAYS_PICK.number}
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1 text-[10px] font-semibold text-haze">
                  <Pin className="h-3 w-3 text-coral" />
                  LeetCode · {TODAYS_PICK.tags.join(" · ")}
                </span>
                <span className="mt-0.5 block truncate text-[13px] font-extrabold tracking-tight text-ink">
                  {TODAYS_PICK.title}
                </span>
                <span className="mt-0.5 block text-[10.5px] font-medium text-ink/45">{TODAYS_PICK.complexity}</span>
                <span className="mt-1.5 flex items-center gap-2">
                  <span className="text-[12px] font-extrabold text-ink">{TODAYS_PICK.difficulty}</span>
                  <span className="rounded-[5px] bg-lime px-2 py-[3px] text-[9px] font-extrabold uppercase tracking-wide text-ink/80 transition group-hover:bg-lime-deep">
                    Solve now
                  </span>
                </span>
              </span>
            </Link>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {COMPANY_LOGOS.map((c) => (
                <CompanyPill key={c} name={c} />
              ))}
            </div>
          </div>

          <p className="mt-4 text-center text-[10.5px] font-semibold uppercase tracking-[0.16em] text-haze lg:text-right">
            Company frequency shown per problem · from public interview reports
          </p>

          {/* ------------------------------------------------ how it works */}
          <div className="mt-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet">The loop</span>
              <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">
                Five steps from number to understanding
              </h2>
            </div>
            <Link
              href="/problems"
              className="group inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-[12px] font-bold text-ink/70 transition hover:border-ink/25 hover:text-ink"
            >
              Browse problems
              <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map((step) => (
              <li key={step.n} className="rounded-[18px] bg-mist/70 p-4 ring-1 ring-transparent transition hover:bg-white hover:ring-line">
                <span className="font-mono text-[11px] font-semibold text-violet/60">{step.n}</span>
                <p className="mt-2 text-[13.5px] font-extrabold tracking-tight text-ink">{step.title}</p>
                <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/50">{step.body}</p>
              </li>
            ))}
          </ol>

          {/* ------------------------------------------------ structures */}
          <div className="mt-12 rounded-[26px] bg-mist/60 p-5 sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-coral-deep">Visualiser coverage</span>
                <h2 className="mt-2 text-[24px] font-extrabold tracking-[-0.02em] text-ink">
                  Every structure, every algorithm
                </h2>
              </div>
              <Link href="/visualise" className="text-[12px] font-bold text-violet underline-offset-4 hover:underline">
                Open a live demo →
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {VISUALISERS.map((v) => (
                <div key={v.name} className="group rounded-[14px] bg-white p-3.5 ring-1 ring-line/80 transition hover:-translate-y-0.5 hover:ring-violet/30">
                  <span className="inline-grid h-8 min-w-8 place-items-center rounded-lg bg-ink px-2 font-mono text-[11px] font-semibold text-lime">
                    {v.glyph}
                  </span>
                  <p className="mt-2.5 text-[12.5px] font-extrabold text-ink">{v.name}</p>
                  <p className="mt-0.5 text-[10.5px] leading-snug text-ink/45">{v.detail}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ tracks */}
          <div className="mt-12">
            <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink">Two tracks, one brain</h2>
            <p className="mt-1.5 max-w-xl text-[12.5px] leading-relaxed text-ink/50">
              DSA is fully live. LLD and HLD reuse the same explain-and-visualise engine, so the habit you build
              here carries straight into system design rounds.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {TRACKS.map((t) =>
                t.live ? (
                  <Link
                    key={t.title}
                    href="/problems"
                    className="group relative overflow-hidden rounded-[22px] bg-ink p-5 text-white transition hover:-translate-y-0.5"
                  >
                    <span className="absolute -right-6 -top-8 h-24 w-24 rounded-full bg-violet/40 blur-2xl" />
                    <span className="rounded-full bg-lime px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink">
                      {t.tag}
                    </span>
                    <p className="mt-5 text-[26px] font-extrabold tracking-tight">{t.title}</p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-white/55">{t.body}</p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-[11.5px] font-bold text-lime">
                      Start solving <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                ) : (
                  <div key={t.title} className="rounded-[22px] border border-dashed border-line bg-white p-5">
                    <span className="rounded-full bg-mist px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] text-ink/40">
                      {t.tag}
                    </span>
                    <p className="mt-5 text-[26px] font-extrabold tracking-tight text-ink/35">{t.title}</p>
                    <p className="mt-1.5 text-[11.5px] leading-relaxed text-ink/40">{t.body}</p>
                    <span className="mt-4 inline-block text-[11px] font-bold uppercase tracking-[0.1em] text-ink/25">
                      In the build queue
                    </span>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* ------------------------------------------------ popular ladder */}
          <div className="mt-12">
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-[24px] font-extrabold tracking-[-0.02em] text-ink">Start where everyone starts</h2>
              <span className="hidden text-[11px] font-semibold text-haze sm:block">curated interview ladder</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CURATED.slice(0, 6).map((p) => (
                <Link
                  key={p.slug}
                  href={`/problem/${p.number}?lang=python3`}
                  className="group flex items-center gap-3 rounded-[14px] border border-line px-3.5 py-3 transition hover:border-ink/20 hover:bg-mist/50"
                >
                  <span className="font-mono text-[11px] font-semibold text-haze">#{p.number}</span>
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-bold text-ink">{p.title}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide ${
                      p.difficulty === "Easy"
                        ? "bg-lime/25 text-[#5d7a10]"
                        : p.difficulty === "Medium"
                          ? "bg-[#f4c26b]/25 text-[#8a6414]"
                          : "bg-coral/25 text-[#a4402f]"
                    }`}
                  >
                    {p.difficulty}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* ------------------------------------------------ CTA */}
          <div className="relative mt-12 overflow-hidden rounded-[26px] bg-ink px-6 py-8 sm:px-9">
            <span className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-violet/30 blur-3xl" />
            <span className="absolute -bottom-20 right-10 h-48 w-48 rounded-full bg-coral/20 blur-3xl" />
            <div className="relative flex flex-wrap items-center justify-between gap-6">
              <div>
                <h3 className="text-[24px] font-extrabold tracking-tight text-white">Your next problem is one number away.</h3>
                <p className="mt-1.5 text-[12.5px] text-white/50">No sign-up. Type a number, pick a language, go.</p>
              </div>
              <Link
                href="/problem/1?lang=python3"
                className="inline-flex items-center gap-2 rounded-[16px] bg-lime px-5 py-3 text-[13px] font-extrabold text-ink transition hover:bg-lime-deep"
              >
                Open problem #1
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <footer className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6 pb-2">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-[8px] border border-ink/20 text-[11px] font-extrabold text-ink">AA</span>
              <span className="text-[11.5px] font-semibold text-ink/45">
                AlgoAtlas · DSA today, LLD &amp; HLD next
              </span>
            </div>
            <div className="flex items-center gap-5 text-[11.5px] font-semibold text-ink/45">
              <Link href="/problems" className="hover:text-ink">
                Problems
              </Link>
              <Link href="/visualise" className="hover:text-ink">
                Visualise
              </Link>
              <a href="https://leetcode.com/problemset/" target="_blank" rel="noreferrer" className="hover:text-ink">
                LeetCode
              </a>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
