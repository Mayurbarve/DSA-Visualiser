import Link from "next/link";
import { Nav } from "@/components/site/Nav";
import { VizPlayer } from "@/components/viz/VizPlayer";
import { DEMO_TRACE } from "@/lib/viz";
import { ArrowRight } from "@/components/ui/Icons";

const DEMO_CODE = `def bubble_sort(nums):
    n = len(nums)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if nums[j] > nums[j + 1]:
                nums[j], nums[j + 1] = nums[j + 1], nums[j]
    return nums`;

const CAPABILITIES = [
  { name: "Arrays & strings", body: "Cells, indices, two pointers, sliding windows, prefix ranges." },
  { name: "Hash maps & sets", body: "Live key → value chips that grow as the algorithm inserts." },
  { name: "Linked lists", body: "Node boxes, arrows, slow/fast and prev/curr/next pointers." },
  { name: "Trees", body: "Real layout with highlighted nodes and root-to-leaf pointers." },
  { name: "Graphs", body: "Directed or undirected edges, weights, BFS/DFS frontiers." },
  { name: "Stacks & queues", body: "Push/pop from the top, front/back of a deque or monotonic stack." },
];

export const metadata = {
  title: "Visualise — AlgoAtlas",
  description: "See how the frame-by-frame algorithm renderer works before you point it at a problem.",
};

export default function VisualisePage() {
  return (
    <main className="flex min-h-screen justify-center bg-paper px-3 py-4 sm:px-5 sm:py-6 lg:py-9">
      <div className="frame w-full max-w-[1200px] overflow-hidden bg-white">
        <section className="hero-surface relative text-white">
          <Nav />
          <div className="relative z-10 px-6 pb-28 pt-10 sm:px-10 lg:px-14">
            <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/55">
              the renderer
            </span>
            <h1 className="mt-4 text-[clamp(2rem,4.4vw,3.1rem)] font-extrabold leading-[1.05] tracking-[-0.03em]">
              Watch the pointers
              <br />
              move, not the lecture.
            </h1>
            <p className="mt-3 max-w-xl text-[13px] leading-relaxed text-white/55">
              Every generated problem turns into a sequence of frames. Each frame is a snapshot of the data structures plus
              the exact line of code that produced it. Here is a bubble sort running on the same engine.
            </p>
          </div>
        </section>

        <section className="relative z-20 -mt-[70px] rounded-t-[34px] bg-white px-5 pb-14 pt-7 sm:px-8 lg:px-12">
          <VizPlayer trace={DEMO_TRACE} code={DEMO_CODE} />

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CAPABILITIES.map((c) => (
              <div key={c.name} className="rounded-[14px] border border-line p-4">
                <p className="text-[12.5px] font-extrabold tracking-tight text-ink">{c.name}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-ink/50">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-[18px] bg-mist/60 px-5 py-5">
            <p className="max-w-md text-[12.5px] leading-relaxed text-ink/60">
              Ready to see your own problem? Open any LeetCode number and hit <span className="font-bold text-ink">Visualise</span> —
              brute, better and optimal runs are all renderable.
            </p>
            <Link
              href="/problem/1"
              className="inline-flex items-center gap-2 rounded-[12px] bg-ink px-4 py-2.5 text-[11.5px] font-extrabold text-white transition hover:bg-ink-soft"
            >
              Try problem #1
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
