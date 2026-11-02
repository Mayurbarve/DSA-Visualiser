import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { listProblems, type ProblemSummary } from "@/lib/leetcode";
import { CURATED } from "@/lib/curated";
import { DifficultyPill } from "@/components/problem/shared";
import { ArrowRight, SearchIcon } from "@/components/ui/Icons";

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TAGS = [
  "Array",
  "String",
  "Hash Table",
  "Two Pointers",
  "Sliding Window",
  "Binary Search",
  "Linked List",
  "Stack",
  "Queue",
  "Tree",
  "Graph",
  "Dynamic Programming",
  "Heap (Priority Queue)",
  "Bit Manipulation",
];

function first(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

function buildHref(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== "") sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `/problems?${qs}` : "/problems";
}

export const metadata = {
  title: "Problem ladder — AlgoAtlas",
  description: "Browse thousands of LeetCode problems by difficulty and pattern, then open one to solve it visually.",
};

export default async function ProblemsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = first(sp.q);
  const difficulty = first(sp.difficulty);
  const tag = first(sp.tag);
  const page = Math.max(Number(first(sp.page) || 1) || 1, 1);

  let items: ProblemSummary[] = [];
  let total = 0;
  let failed = false;

  try {
    const data = await listProblems({
      search: query,
      difficulty,
      tag,
      page,
      limit: 24,
    });
    items = data.items;
    total = data.total;
  } catch {
    failed = true;
    const q = query.toLowerCase();
    items = CURATED.filter(
      (p) =>
        (!difficulty || p.difficulty === difficulty) &&
        (!tag || p.tags.includes(tag)) &&
        (!q || p.title.toLowerCase().includes(q) || p.number === q),
    );
    total = items.length;
  }

  const pages = Math.max(Math.ceil(total / 24), 1);

  return (
    <main className="flex min-h-screen justify-center bg-paper px-3 py-4 sm:px-5 sm:py-6 lg:py-9">
      <div className="frame w-full max-w-[1200px] overflow-hidden bg-white">
        <section className="hero-surface relative text-white">
          <Nav />
          <div className="relative z-10 px-6 pb-28 pt-10 sm:px-10 lg:px-14">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/55">
              {total.toLocaleString()} problems · live from LeetCode
            </span>
            <h1 className="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Pick the next thing
              <br />
              you want to break.
            </h1>
            <p className="mt-3 max-w-lg text-[13px] leading-relaxed text-white/55">
              Every problem opens with three solutions, a plain-English explanation, a visual run, its complexity and the
              companies that ask it.
            </p>

            <form method="get" className="mt-7 flex max-w-2xl flex-col gap-2 rounded-[22px] bg-white p-2 sm:flex-row">
              <label className="flex flex-1 items-center gap-3 rounded-[16px] px-3 py-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-full bg-mist text-violet">
                  <SearchIcon className="h-4 w-4" />
                </span>
                <input
                  name="q"
                  defaultValue={query}
                  placeholder="Search a title or number — “coins”, 200"
                  className="w-full min-w-0 bg-transparent text-[13.5px] font-bold text-ink outline-none placeholder:font-medium placeholder:text-haze"
                />
              </label>
              <select
                name="difficulty"
                defaultValue={difficulty}
                className="rounded-[14px] bg-mist px-3 py-3 text-[12px] font-bold text-ink/70 outline-none sm:w-[130px]"
              >
                <option value="">Any level</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
              {tag ? <input type="hidden" name="tag" value={tag} /> : null}
              <button type="submit" className="rounded-[14px] bg-violet px-5 py-3 text-[12.5px] font-bold text-white transition hover:bg-violet-soft">
                Filter
              </button>
            </form>
          </div>
        </section>

        <section className="relative z-20 -mt-[70px] rounded-t-[34px] bg-white px-6 pb-14 pt-7 sm:px-10 lg:px-14">
          <div className="scrollbar-slim -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <Link
              href={buildHref({ q: query, difficulty })}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                tag ? "bg-mist text-ink/55 hover:text-ink" : "bg-ink text-white"
              }`}
            >
              All patterns
            </Link>
            {TAGS.map((t) => (
              <Link
                key={t}
                href={buildHref({ q: query, difficulty, tag: tag === t ? "" : t })}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold transition ${
                  tag === t ? "bg-violet text-white" : "bg-mist text-ink/55 hover:text-ink"
                }`}
              >
                {t}
              </Link>
            ))}
          </div>

          {failed ? (
            <p className="mt-4 rounded-[12px] bg-coral/10 px-4 py-3 text-[11.5px] font-semibold text-[#8a3a2c]">
              LeetCode is not reachable from this machine right now — showing the curated ladder instead.
            </p>
          ) : null}

          {items.length === 0 ? (
            <div className="mt-10 rounded-[18px] border border-line bg-mist/40 px-6 py-12 text-center">
              <p className="text-[13px] font-bold text-ink">Nothing matched that filter.</p>
              <p className="mt-1 text-[11.5px] text-ink/50">Try a different pattern or clear the search.</p>
              <Link href="/problems" className="mt-4 inline-block rounded-[10px] bg-ink px-4 py-2 text-[11.5px] font-bold text-white">
                Reset filters
              </Link>
            </div>
          ) : (
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {items.map((p) => (
                <Link
                  key={p.slug}
                  href={`/problem/${p.number}`}
                  className="group flex items-start gap-3 rounded-[14px] border border-line bg-white px-4 py-3.5 transition hover:-translate-y-0.5 hover:border-ink/20 hover:shadow-[0_12px_24px_-18px_rgba(30,33,39,0.6)]"
                >
                  <span className="mt-0.5 font-mono text-[10.5px] font-semibold text-haze">#{p.number}</span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-[13px] font-extrabold tracking-tight text-ink">{p.title}</span>
                      {p.paidOnly ? (
                        <span className="shrink-0 rounded bg-[#f4c26b]/25 px-1.5 py-0.5 text-[8px] font-bold uppercase text-[#8a6414]">
                          pro
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <DifficultyPill value={p.difficulty} />
                      {p.tags.slice(0, 2).map((t) => (
                        <span key={t} className="rounded-full bg-mist px-2 py-0.5 text-[9px] font-semibold text-ink/45">
                          {t}
                        </span>
                      ))}
                      <span className="font-mono text-[9px] text-ink/30">{p.acceptance}</span>
                    </span>
                  </span>
                  <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-ink/20 transition group-hover:translate-x-0.5 group-hover:text-violet" />
                </Link>
              ))}
            </div>
          )}

          {pages > 1 ? (
            <div className="mt-7 flex items-center justify-between">
              <Link
                href={buildHref({ q: query, difficulty, tag, page: page - 1 })}
                aria-disabled={page <= 1}
                className={`rounded-[10px] border border-line px-3.5 py-2 text-[11.5px] font-bold ${
                  page <= 1 ? "pointer-events-none opacity-40" : "text-ink/65 hover:border-ink/25 hover:text-ink"
                }`}
              >
                Previous
              </Link>
              <span className="font-mono text-[10.5px] text-ink/40">
                page {page} of {pages.toLocaleString()}
              </span>
              <Link
                href={buildHref({ q: query, difficulty, tag, page: page + 1 })}
                aria-disabled={page >= pages}
                className={`rounded-[10px] border border-line px-3.5 py-2 text-[11.5px] font-bold ${
                  page >= pages ? "pointer-events-none opacity-40" : "text-ink/65 hover:border-ink/25 hover:text-ink"
                }`}
              >
                Next
              </Link>
            </div>
          ) : null}

          <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-[18px] bg-ink px-5 py-5">
            <p className="text-[12.5px] font-bold text-white">
              Have a number in mind already?
              <span className="ml-1.5 font-medium text-white/45">Type it on the home page and go.</span>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-[12px] bg-lime px-4 py-2.5 text-[11.5px] font-extrabold text-ink transition hover:bg-lime-deep"
            >
              Search by number
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
