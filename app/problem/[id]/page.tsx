import type { Metadata } from "next";
import Link from "next/link";
import { getProblem, type Problem } from "@/lib/leetcode";
import { normaliseLanguage } from "@/lib/types";
import { Nav, BackLink } from "@/components/site/Nav";
import { SearchPanel } from "@/components/home/SearchPanel";
import { Workspace } from "@/components/problem/Workspace";
import { DifficultyPill, ErrorCard } from "@/components/problem/shared";
import { ArrowRight, External } from "@/components/ui/Icons";
import { CURATED } from "@/lib/curated";
import { MODEL } from "@/lib/llm";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const problem = await getProblem(decodeURIComponent(id));
    return {
      title: `${problem.number}. ${problem.title} — AlgoAtlas`,
      description: `Brute force, better and optimal ${problem.title} solutions with a visual walkthrough.`,
    };
  } catch {
    return { title: `Problem ${decodeURIComponent(id)} — AlgoAtlas` };
  }
}

function ProblemHeader({ problem }: { problem: Problem }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-6">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono text-[12px] font-semibold text-white/40">#{problem.number}</span>
          <DifficultyPill value={problem.difficulty} />
          <span className="text-[10.5px] font-semibold text-white/40">acceptance {problem.acceptance}</span>
          {problem.paidOnly ? (
            <span className="rounded-full bg-[#f4c26b] px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#3d2c07]">
              premium
            </span>
          ) : null}
        </div>
        <h1 className="mt-2.5 text-[clamp(1.7rem,3.6vw,2.6rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
          {problem.title}
        </h1>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {problem.tags.map((t) => (
            <span key={t} className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-white/55">
              {t}
            </span>
          ))}
        </div>
      </div>
      <a
        href={problem.url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-2 rounded-full border border-white/25 px-4 py-2.5 text-[11.5px] font-bold text-white/75 transition hover:border-lime/60 hover:text-lime"
      >
        Open on LeetCode
        <External className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

export default async function ProblemPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const language = normaliseLanguage(typeof sp.lang === "string" ? sp.lang : undefined);
  const query = decodeURIComponent(id);

  let problem: Problem | null = null;
  let error: string | null = null;

  try {
    problem = await getProblem(query);
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load this problem.";
  }

  return (
    <main className="flex min-h-screen justify-center bg-paper px-3 py-4 sm:px-5 sm:py-6 lg:py-9">
      <div className="frame w-full max-w-[1200px] overflow-hidden bg-white">
        <section className="hero-surface relative text-white">
          <Nav />
          <div className="relative z-10 px-6 pb-24 pt-8 sm:px-10 lg:px-14">
            <BackLink />
            <div className="mt-6">{problem ? <ProblemHeader problem={problem} /> : null}</div>

            {error ? (
              <div className="mt-8 max-w-2xl">
                <h1 className="text-[clamp(1.7rem,3.6vw,2.5rem)] font-extrabold leading-tight tracking-[-0.03em] text-white">
                  We could not open “{query}”
                </h1>
                <p className="mt-2 text-[13px] leading-relaxed text-white/55">
                  LeetCode did not return that question. It may be premium-only, renamed, or the request was rate limited.
                </p>
              </div>
            ) : null}

            {error ? (
              <div className="mt-7 max-w-[560px]">
                <SearchPanel size="sm" />
              </div>
            ) : null}
          </div>
        </section>

        <section className="relative z-20 -mt-[56px] rounded-t-[34px] bg-white pt-2">
          {problem ? (
            <Workspace problem={problem} initialLanguage={language} model={MODEL} />
          ) : (
            <div className="space-y-6 px-5 py-8 sm:px-8 lg:px-12">
              <ErrorCard message={error ?? "Unknown error"} />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-violet">try one of these</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {CURATED.slice(0, 9).map((p) => (
                    <Link
                      key={p.slug}
                      href={`/problem/${p.number}?lang=${language}`}
                      className="group flex items-center gap-3 rounded-[12px] border border-line px-3.5 py-3 transition hover:border-ink/20 hover:bg-mist/50"
                    >
                      <span className="font-mono text-[10.5px] text-haze">#{p.number}</span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-bold text-ink">{p.title}</span>
                      <ArrowRight className="h-3 w-3 text-ink/25 transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
