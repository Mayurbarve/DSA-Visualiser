# AlgoAtlas — a LeetCode cockpit for DSA

**Version: `alpha0.2`** — one request now fills every tab at once, and Premium-only problems get a
LeetCode-style practice question instead of a dead end.

Base version `alpha0.1` is preserved as the git tag `alpha0.1` (see [CHANGELOG.md](CHANGELOG.md)).

Type a LeetCode problem number, get the real problem, three solutions (brute → better → optimal), a
plain-English explanation, a frame-by-frame visualisation of the data structures, the complexity
table, and the companies that ask it.

Built for DSA today; the same explain-and-visualise engine is meant to carry LLD and HLD next.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript + Tailwind v4
- **LeetCode GraphQL** scraped server-side (no API key needed)
- **OpenRouter** for generation — several free models raced in parallel, fastest reply wins
  (any OpenRouter model works)

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in the key
npm run dev                  # http://localhost:3000
```

`.env.local`:

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=google/gemma-4-26b-a4b-it:free
OPENROUTER_SECOND_MODEL=cohere/north-mini-code:free
OPENROUTER_THIRD_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_FOURTH_MODEL=thinkingmachines/inkling:free
OPENROUTER_FIFTH_MODEL=qwen/qwen3.8-27b:free
OPENROUTER_FALLBACK_MODEL=cohere/north-mini-code:free,nvidia/nemotron-3-ultra-550b-a55b:free
```

The key is read only by the server-side route handlers and is never sent to the browser. `.env.local`
is git-ignored — rotate any key that has been shared in plain text.

> **Models.** Generation uses up to five free models (`OPENROUTER_MODEL` … `OPENROUTER_FIFTH_MODEL`). The
> primary and secondary are raced in parallel and the fastest reply is used; if both fail, all configured
> models are raced again and the best complete reply wins; only then does an ordered chain run.
> `OPENROUTER_FALLBACK_MODEL` appends extra slugs to that chain as a comma-separated list. Failover covers 404/retired models, 402/no-credits, 429 rate limits, 5xx
> and empty or stalled answers; 400/401 are fatal because every model would fail the same way. A model that
> fails with one of those statuses is skipped for 2 minutes, so a rate-limited primary costs one round trip
> instead of blocking every request.
>
> **Measured on this machine (free tier, $0):** Gemma 4 returns 429 in bursts upstream — during testing it
> was rate limited most of the time, so real answers came from the fallbacks. Explanations answered in ~9s,
> but one three-solution request needed the whole chain and still ended in a 504 after ~170s. Free-tier
> latency is genuinely load-dependent; a paid slug (`qwen/qwen3-coder` measured 10–13s) is the fix if the
> waits bother you. Scraping, browsing and the `/visualise` demo work with no key at all.

## The five-step flow

1. **Ask for a number.** The home page search takes `1`, `121`, `two-sum`, a title, or a full LeetCode URL.
2. **Fetch the question.** `GET /api/problem?q=…` resolves the number to a slug, then pulls the statement,
   examples, tags, hints, acceptance rate and similar problems, converting LeetCode's HTML into readable text.
   Premium-only questions come back with no statement, and are flagged `premium` everywhere they appear.
3. **Everything at once.** `POST /api/bundle` returns solutions, explanation, the optimal visualisation trace,
   and — for Premium problems — a LeetCode-style practice question, in a single request. Solutions and the
   explanation are generated in parallel, the trace follows immediately because it draws the optimal code.
   Switching tabs never waits on a model again.
4. **Per-tab regeneration.** `POST /api/solutions`, `POST /api/explain`, `POST /api/visualise` and
   `POST /api/reconstruct` each regenerate one section, for when a single answer was not good enough.
5. **Depth.** Complexity tab and Companies tab arrive with the bundle (approximate, from public interview
   reports — LeetCode no longer exposes company tags publicly).

## Premium questions

LeetCode returns `content: null` for Premium-only problems, so there is nothing to explain without a
subscription. Those problems now show a labelled banner instead of an empty statement, and
`POST /api/reconstruct` (also folded into the bundle) writes a **LeetCode-style practice version** of the same
title, difficulty and topics: statement, examples, constraints and follow-up. It is clearly marked as
AI-written practice material, never presented as the official wording.

## Why the second visit is instant

`lib/llm-cache.ts` memoises generated bundles per `slug + language` for six hours and collapses concurrent
requests for the same key into a single generation, so two tabs opening one problem cost one round of model
calls, not two. A `refresh: true` field (the **refresh all** button) bypasses the cache; the per-tab
regenerate buttons always bypass it.

## How "every algorithm" is visualised

The model never writes SVG or coordinates. It emits a **trace** of frames, and each frame carries generic
structures that the renderer knows how to draw:

| structure | draws |
| --- | --- |
| `array` | cells, indices, highlights, pointers, windows/ranges |
| `matrix` | grids with row/col labels and cell highlights |
| `linkedlist` | node boxes, arrows, named pointers, cycles |
| `tree` | real layered layout, node highlights, pointers (level-order or explicit nodes) |
| `graph` | directed/undirected edges, weights, frontier pointers |
| `stack` / `queue` | push/pop and front/back with highlights |
| `hashmap` | live key → value chips |
| `states` | named variables such as `dp[i]` |

That is why bubble sort, binary search, DFS on a grid, LRU cache and a tree traversal all render through the
same player: the trace is data, not hand-built animation. `/visualise` shows the engine on a hand-written
bubble sort, so it always works even without an API key.

Model output is normalised and clamped before it reaches React (`lib/viz.ts`), so malformed frames are dropped
instead of crashing the page. If the model returns invalid or truncated JSON, the server repairs once with a
compactness instruction before failing.

## Layout

```
app/
  page.tsx              home (hero, search, steps, structures, tracks)
  problems/page.tsx     browsable ladder with difficulty/pattern filters
  problem/[id]/page.tsx problem shell: statement + workspace
  visualise/page.tsx    renderer demo
  api/{problem,solutions,explain,visualise,bundle,reconstruct}/route.ts
components/
  problem/              workspace tabs, solution cards, explain view, premium notice
  viz/                  VizPlayer + VizStage (all structure renderers)
  ui/                   code block, prose, icons
lib/
  leetcode.ts           GraphQL scraping, HTML→text, cache
  llm.ts                OpenRouter client, JSON repair, model racing
  llm-cache.ts          memoised bundles + in-flight dedupe
  prompts.ts            solution / explanation / trace / practice-question prompts
  viz.ts                trace schema + normalisation + demo trace
  normalise.ts          response shaping and error mapping
  types.ts              shared client/server types (SolutionPack, ProblemBundle, …)
```

## Notes & limits

- LeetCode can rate-limit or block datacenter IPs. Failures surface as a readable error with retry, and the
  problems page falls back to a curated ladder.
- Premium-only problems return no statement; the UI marks them `premium` and offers an AI-written
  LeetCode-style practice question instead of the locked text.
- Company frequency is model knowledge, not a live LeetCode field, and is labelled as approximate.
- A cold bundle is limited by the slowest of solutions / explanation; free-model latency is load-dependent.
  Warm bundles (same problem + language within six hours) return immediately from the server cache.
- The cache is per server process (in-memory). On a serverless/edge deploy it is per isolate, so treat it as a
  speed-up, not a guarantee.
