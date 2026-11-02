# AlgoAtlas — full project review & handoff

> Purpose of this file: let any engineer or LLM understand the whole project without reading every source
> file first. It documents what the product does, how each feature is implemented, the exact data
> contracts between layers, the UI system, and the known traps.
>
> Last updated: generation uses a chain of free OpenRouter models
> (`google/gemma-4-26b-a4b-it:free` → `cohere/north-mini-code:free` →
> `nvidia/nemotron-3-ultra-550b-a55b:free`), a 2-minute cooldown for failed models, and per-route timeouts.

---

## 1. What this app is

A DSA learning cockpit built around a single loop:

1. The user types a **LeetCode problem number** (or slug/title/URL) on the home page.
2. The server **scrapes the real question** from LeetCode (statement, examples, tags, hints, acceptance,
   similar problems).
3. The user can **generate three solutions** with an LLM: brute force → better → optimal, in a chosen
   language, each with runnable LeetCode-ready code, complexity and pitfalls.
4. The user can ask for a **plain-English explanation** or a **frame-by-frame visualisation** of the
   algorithm.
5. The app also shows the **complexity table**, alternative approaches/patterns, follow-ups, and the
   **companies** that ask the problem.

Scope today is **DSA only**. LLD and HLD are presented in the UI as upcoming tracks ("Next"/"Soon") and are
not implemented.

Product name: **AlgoAtlas**. Brand mark: a bordered square with `AA` and a tiny `learn` caption.

---

## 2. Stack and runtime facts

| Area | Choice |
| --- | --- |
| Framework | Next.js **15.5.4**, App Router, no `src/` dir |
| React | 19.1 |
| Language | TypeScript (strict via default tsconfig) |
| Styling | Tailwind CSS **v4** (`@import "tailwindcss"` + `@theme` tokens in `app/globals.css`), plus a few hand-written component classes |
| Fonts | `next/font/google`: **Plus Jakarta Sans** (`--font-jakarta`) and **JetBrains Mono** (`--font-mono-code`) |
| Data source | LeetCode public **GraphQL** endpoint (server-side fetch, no auth) |
| LLM | **OpenRouter** chat completions, model from `OPENROUTER_MODEL` |
| State | React state + module-scope `globalThis` caches. **No database, no auth, no persistence.** |

Scripts: `npm run dev` (turbopack), `npm run build` (turbopack), `npm start`, `eslint`.

Environment (`.env.local`, git-ignored; template in `.env.example`):

```
OPENROUTER_API_KEY=sk-or-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
```

Optional: `NEXT_PUBLIC_APP_URL` is sent as `HTTP-Referer` to OpenRouter (defaults to
`http://localhost:3000`).

**Security model:** the API key is read only inside route handlers (`process.env`). It is never imported
into a client component, never returned by an API, and never logged.

---

## 3. Routes

### Pages

| Route | File | Kind | Notes |
| --- | --- | --- | --- |
| `/` | `app/page.tsx` | Server component | Marketing/landing + hero search + explainer sections |
| `/problems` | `app/problems/page.tsx` | Server component, reads `searchParams` | Browsable ladder with filters + pagination |
| `/problem/[id]` | `app/problem/[id]/page.tsx` | Server component (`async`), `generateMetadata` | Fetches the problem, renders dark header + `<Workspace/>` |
| `/visualise` | `app/visualise/page.tsx` | Server component | Renders the hand-written demo trace; always works without an API key |

`/problem/[id]` accepts a number (`1`), slug (`two-sum`), title (`Two%20Sum`) or full URL; resolution
happens in `lib/leetcode.ts`.

Next 15 specifics in use: `params` and `searchParams` are **Promises** and must be awaited.

### API routes (all `runtime = "nodejs"`, `dynamic = "force-dynamic"`)

**`GET /api/problem?q=`**
→ `{ problem: Problem }` or `{ error }` with status 400/404/429/502.

**`POST /api/solutions`**
body `{ slug, language }` → `{ solutions: SolutionPack, language }`.
Calls `getProblem(slug)` then the LLM with `solutionsMessages`, `maxTokens: 12000`, `temperature: 0.2`,
runs `normaliseSolutions`.

**`POST /api/explain`**
body `{ slug }` → `{ explanation: Explanation }`.
`maxTokens: 5000`, `temperature: 0.35`, `normaliseExplanation`.

**`POST /api/visualise`**
body `{ slug, tier?, title?, code?, idea? }` → `{ trace: VizTrace }`.
`tier` defaults to `optimal`. Code is optional: if the user already generated solutions, the client sends
the chosen approach's code so the trace can reference real line numbers. `maxTokens: 24000`,
`temperature: 0.3`, then `normaliseTrace`.

All routes wrap failures through `toErrorResponse` (`lib/normalise.ts`), which maps `LeetCodeError` /
`LLMError` to their status and everything else to 500 with a generic message. Responses use
`Cache-Control: no-store`.

---

## 4. LeetCode layer — `lib/leetcode.ts`

Endpoint: `POST https://leetcode.com/graphql` with browser-like headers (`User-Agent`, `Referer`
`https://leetcode.com/problemset/`, `Origin`, `Accept`).

`gql()` helpers:
- 15s timeout (`AbortSignal.timeout`), `cache: "no-store"`.
- Up to 2 attempts; a 429 waits 700ms×attempt; a 403 is remapped to 429 (datacenter IP blocking looks the
  same to the user).
- GraphQL `errors[]` are surfaced as `LeetCodeError`.

Caching: `globalThis.__lcCache` (survives hot reload) holding three Maps — `problems`, `slugs`, `lists` —
with a 1 hour TTL, entries `{ at, data }`.

Resolution (`resolveSlug`):
1. A `leetcode.com/problems/<slug>` URL is unwrapped.
2. Pure digits (or `123.`/`123-` prefix) → `findByNumber`.
3. Otherwise treat as title/slug → `questionList` with `filters.searchKeywords`, then prefer exact slug,
   slugified title, or exact title; else the first hit.

`findByNumber`: searches `searchKeywords: "<n>"` (limit 20) for an exact `questionFrontendId`, then falls
back to `skip = n - 1, limit 1` because the list is chronological — this catches numbers that keyword
search does not return. If neither matches, throws 404 with a friendly message.

`getProblem(slugOrQuery)`: resolves the slug, then queries
`questionFrontendId title titleSlug content difficulty exampleTestcases hints isPaidOnly stats topicTags
similarQuestions codeSnippets`. It maps to the `Problem` type:

```ts
interface Problem {
  number: string; title: string; slug: string;
  difficulty: "Easy" | "Medium" | "Hard";
  statement: string;        // HTML converted to plain text (with ``` fences)
  examples: string;         // raw exampleTestcases, newline separated
  tags: string[]; hints: string[];
  similar: { title: string; slug: string; difficulty: string }[];
  acceptance: string;       // from stats.acRate, e.g. "58.1%"
  snippet: string | null;   // python3 starter code (fallback cpp)
  url: string; paidOnly: boolean;
}
```

`htmlToText()` — the important bit for statement quality:
- `<pre>` blocks are extracted **first** into placeholders, entity-decoded, and re-emitted as fenced
  ```` ``` ```` blocks (leading newlines trimmed) so examples keep their formatting.
- `<sup>`/`<sub>` become `^x`/`_x`; `<img>` becomes `[image]` / `[image: alt]`.
- `<li>` becomes `"• "`; `</td>/<th>` becomes `" | "`; block tags become newlines; all remaining tags are
  stripped; entities decoded (named + numeric + hex); runs of blank lines collapsed to two.

`listProblems({ search, difficulty, tag, page, limit })` → `{ total, page, limit, items: ProblemSummary[] }`,
limit clamped 1..50, tags mapped to `filters.tags`. `popularProblems()` returns the first page.

**Known LeetCode constraint:** `companyTags` on the question query now returns `null` (LeetCode removed
public access). Companies therefore come from the LLM and are labelled approximate in the UI.

---

## 5. LLM layer — `lib/llm.ts` + `lib/prompts.ts`

```ts
export const MODEL          = process.env.OPENROUTER_MODEL          || "google/gemma-4-26b-a4b-it:free";
export const FALLBACK_MODEL = process.env.OPENROUTER_FALLBACK_MODEL || "";
export const BASE_URL       = process.env.OPENROUTER_BASE_URL       || "https://openrouter.ai/api/v1";
export function modelList(): string[]  // MODEL + comma-split fallbacks, deduped
export function attemptList(): string[] // modelList() minus models in cooldown
```

**Model chain.** `chatOnce()` loops over `attemptList()`: the primary model is tried first, and on a
recoverable failure it logs `[llm] <model> failed (…); falling back to <next>` and retries with the next
model. 400/401 are treated as fatal (a bad request or bad key fails on every model); everything else —
404 retired model, 402 no credits, 429 rate limit, 5xx outage, empty content, stalled body — falls
through. `OPENROUTER_FALLBACK_MODEL` is comma-separated, so the chain can be more than two deep; duplicate
slugs are removed. Every model currently configured is free ($0/request).

**Cooldown (circuit breaker).** `attemptList()` drops any model whose `cooldownUntil` is in the future.
A failure with status 402/404/429/502/504 sets a 2-minute cooldown for that model. This exists because a
rate-limited free primary otherwise costs a wasted round trip on *every* request and on every repair
attempt. If every model is cooling down the full chain is tried anyway, so the app never fails fast for
the wrong reason. The map lives in module scope and resets on server restart.

`requestModel(model, messages, opts, apiKey)` posts to `/chat/completions` with `temperature` (default
0.25), `max_tokens` (default 3000), `usage: { include: true }`, and
`response_format: { type: "json_object" }` when `json: true`. Error mapping:

- no key → 500 with "add it to .env.local";
- network failure → 504;
- **402** → clear "no credits left / switch model" message;
- 429 stays 429; 5xx becomes 502; other 4xx pass through;
- empty content → 502 ("ran out of room" when `finish_reason === "length"`);
- a throw while reading the body (stalled stream or truncated JSON) → 504 "provider stalled". That read is
  wrapped separately from the `fetch` call, because the abort signal also applies to the body stream and
  an unmapped `AbortError` used to surface as a raw 500.

**Per-call timeouts** live in the routes, not the default: solutions 180s, visualise 240s (traces are long),
and explain 120s.

`extractJson<T>(raw)` — strips ```json fences, finds the first `{`/`[`, then scans with a
string/escape-aware, depth-balanced scanner and `JSON.parse`s the exact object. This tolerates prose
before/after the JSON.

`chatJson<T>(messages, opts)` — one call, parse; on failure it logs
`[llm] unparsable reply (finish=…, length=…): <400 chars>` and retries **once** with the bad content as an
assistant turn and a repair instruction. If `finish_reason === "length"` the repair instruction asks for a
much more compact, closed JSON object. Two failures → `LLMError("…malformed JSON twice…")`.

### Prompt contracts

`solutionsMessages(problem, language)` — system prompt is a senior FAANG coach. It demands one JSON object
with `overview`, `pattern[]`, `keyInsight`, `approaches[3]` (`tier` in order brute/better/optimal, `title`,
`idea`, `time`, `space`, `code`, `whenToUse`, `pitfalls[]`), `complexityTable[]`, `companies[]`
(`frequency` ∈ Very High | High | Medium | Low), `followUps[]`, `relatedPatterns[]`. Hard rules: exactly
three approaches, complete self-contained LeetCode-signature code with no I/O and no placeholders,
complexity strings must match the code, 5–8 companies, no invented constraints.

`explanationMessages(problem)` — friendly tutor voice; JSON `{ tldr, intuition, steps[{title, detail}],
dryRun{ input, trace[] }, pitfalls[], takeaway }`; 4–7 steps, 4–10 dry-run lines following the real
example, 2–4 pitfalls, no code blocks.

`visualisationMessages(problem, approach)` — the trace generator. The system prompt contains the **DSL**
(see §6), a strict output shape `{ title, approach, summary, frames[], result }`, and rules: 8–30 frames,
use the actual example input, every frame changes something, choose structures that match the algorithm,
pointers must be meaningful, `codeLine` must be a 1-based line inside the supplied code, present-tense
specific captions, stay under ~6000 tokens of JSON.

`problemBlock(problem)` (shared) includes number/title/difficulty, tags, acceptance, raw example test inputs
(≤1200 chars) and the statement (≤6000 chars).

**Token-budget note:** this family of models emits internal reasoning tokens that count against
`max_tokens`. Budgets were raised specifically because of truncation: solutions 12k, explain 5k,
visualise 24k. If output is ever truncated, raise those numbers before touching the prompt.

---

## 6. The visualisation engine

### Why a DSL

The model never writes SVG or coordinates and never produces animation code. It emits a **trace**: an
array of frames, each frame a snapshot of generic structures. `components/viz/VizStage.tsx` knows how to
draw each structure type. That is what makes "any algorithm" drawable with one renderer.

### Types (`lib/viz.ts`)

```ts
type Prim = string | number | boolean | null;
type HighlightKind =
  | "active" | "compare" | "match" | "window" | "visited"
  | "sorted" | "muted" | "target" | "path" | "rejected";

type VizStructure =
  | { type: "array"; label?; values: Prim[]; highlights?: {index, kind?}[];
      pointers?: {name, index, kind?}[]; ranges?: {from, to, label?, kind?}[] }
  | { type: "matrix"; label?; rows: Prim[][]; highlights?: {r, c, kind?}[];
      rowLabels?: string[]; colLabels?: string[] }
  | { type: "linkedlist"; label?; nodes: {id, value, highlight?, note?}[];
      next?: string | null; pointers?: {name, nodeId}[]; cycle?: boolean }
  | { type: "tree"; label?; root: string;
      nodes: {id, value, left?, right?, highlight?, note?}[]; pointers?: {name, nodeId}[] }
  | { type: "graph"; label?; directed?; weighted?;
      nodes: {id, value?, highlight?}[]; edges: {from, to, weight?, highlight?, directed?}[];
      pointers?: {name, nodeId}[] }
  | { type: "stack";  label?; values: Prim[]; highlights?: {index, kind?}[]; note? }
  | { type: "queue";  label?; values: Prim[]; highlights?: {index, kind?}[]; note? }
  | { type: "hashmap"; label?; entries: {key, value, highlight?}[] }
  | { type: "states";  label?; entries: {name, value, highlight?}[] };

type VizFrame  = { caption: string; codeLine?: number; callout?: string;
                   structures: VizStructure[]; vars?: {name, value}[] };
type VizTrace  = { title: string; approach: string; summary: string;
                   frames: VizFrame[]; result: string };
```

Note: strings are drawn as `array` (with a meaningful label); `stack.values[0]` is the **bottom**,
`queue.values[0]` is the **front**.

### Normalisation (`lib/viz.ts`) — never trust the model

`normaliseStructure` accepts aliases (`grid`, `2darray`, `list`, `bst`, `heap`, `trie`, `dag`, `map`,
`dict`, `set`, `vars`, …), coerces values with `prim()`, clamps sizes (arrays ≤40, matrix ≤14×18, nodes
≤24/40/32, entries ≤24), drops invalid indices/ids, and **drops the whole structure if it is unusable**.
Highlights/pointers are filtered against actual bounds; edge endpoints and tree children are validated
against node ids.

Trees have **two accepted input forms**:
- preferred compact form: `{ "values": [4,2,7,null,3] }` in LeetCode level order (index `i` → children
  `2i+1`, `2i+2`), with `highlights: [{index, kind}]` and `pointers: [{name, index}]`,
- long form: explicit `nodes[]` with `left`/`right` ids plus `root`.

`normaliseFrame` keeps at most 4 structures and 10 vars; `normaliseTrace` keeps at most 80 frames and
**throws** if none survive ("The model did not return any drawable frames").

`DEMO_TRACE` is a hand-written 20-ish frame bubble sort over `[5,1,4,2,8]`, produced by
`bubbleSortTrace()`. It must stay in sync with `DEMO_CODE` in `app/visualise/page.tsx`
(`codeLine` 2 = `n = len(nums)`, 5 = the `if`, 6 = the swap line).

### Rendering (`components/viz/VizStage.tsx`)

- `ArrayView` — vertical columns; pointer chips stack above the cell they point at (pointers may sit at
  `index === values.length` to mean "past the end"); index under each cell; ranges render as violet pills.
- `MatrixView` — `border-separate` table with optional row/col labels.
- `LinkedListView` — node boxes with `→` between them, `∅` or `⟲` at the tail, pointer chips above nodes.
- `TreeView` — SVG. Layout is an **in-order x-sweep**: recurse left, assign `x = PAD + cursor*52` and
  `y = PAD + depth*62`, recurse right; `width = PAD*2 + cursor*52`. Cycle-safe via a `seen` set.
- `GraphView` — SVG on a circle (`angle = 2πi/n − π/2`), edges shortened by the node radius, arrow markers
  when directed, weights at midpoints, highlight kinds `active/path/compare` turn the edge violet.
- `StackView` — column-reversed boxes with a `top` label and a base bar; `values[0]` at the bottom.
- `QueueView` — horizontal with `front` / `back` labels.
- `HashmapView` — key:value chips; `hashset` entries get value `✓`.
- `StatesView` — two-column name/value grid (DP tables, variables).
- `VizStage` wraps the structures (2-up grid when there are multiple) and a `state` chip row for `vars`.

Colour mapping for kinds lives in two lookup tables at the top of the file (`CELL_KIND`, `POINTER_KIND`)
plus `NODE_FILL` for SVG fills. Adding a kind means touching all three.

### Player (`components/viz/VizPlayer.tsx`)

Client component. Props: `trace`, optional `code`.
State: `index`, `playing`, `speed` (cycles 0.5× → 1× → 2×).
Behaviour:
- autoplay via `setTimeout` at `1150 / speed` ms, stops at the last frame (`Replay` restarts);
- resets to frame 0 when `trace` identity changes;
- the code panel is split by line, numbered, and the active `codeLine` gets a lime left border + highlight;
  a `useEffect` scrolls that line to the vertical centre of the code box;
- controls: restart, prev, play/pause, next, range slider, speed;
- footer strip shows `trace.result`;
- stage area is `min-h-[280px]` on `#fafafb`; caption + callout sit below it.

---

## 7. Client data flow in the problem workspace

`components/problem/Workspace.tsx` is the only stateful orchestrator. Props: `problem`, `initialLanguage`.

State: `tab` (`solutions | explain | visualise | complexity | companies`), `language`, `showStatement`,
`solutions` + `solutionsLanguage` + `solState` (`idle | loading | ready | error`) + `solError`,
`explanation` + `expState` + `expError`, `vizTier`, `traces` (partial map tier → trace), `vizState`,
`vizError`.

Nothing is generated automatically — every artifact starts from an explicit **GenerateCard** button. That
is deliberate: it avoids surprise token spend and matches the product's step-by-step framing. Results are
kept in component state, so switching tabs does not refetch.

`post<T>()` helper: `fetch` JSON → if `!res.ok` throw `Error(json.error)` → components render `ErrorCard`
with the server's message and a retry that re-invokes the same loader.

Interactions:
- **Solutions**: Generate → `SolutionView`. Changing the language re-runs generation if solutions exist
  (and clears traces). Regenerate button re-runs.
- **Explain**: Generate → `ExplainView`, whose CTA switches to Visualise and loads the optimal trace.
- **Visualise**: tier pills (all three always available; ones without code are marked `no code` and the
  prompt then relies on standard algorithm knowledge). Selecting a tier loads its trace if not cached.
  `VizPlayer` gets `code = approachFor(vizTier)?.code`.
- **Complexity / Companies**: reuse the solutions payload; if absent they show a GenerateCard that starts
  solution generation (so the user is never dead-ended).
- Statement card is collapsible, shows the converted statement (`Prose`), raw example inputs, and a
  `<details>` list of LeetCode hints.
- Language preference persists in `localStorage` under `aa:lang`.

`openVisualise(tier)` is the shared entry point used by per-approach buttons and the explain CTA.

---

## 8. Response normalisation (`lib/normalise.ts`)

`normaliseSolutions(raw)`: exactly the fields of `SolutionPack`; approaches kept only when `code` is
non-empty; tiers coerced into the three allowed values; `complexityTable` falls back to one row per
approach; companies filtered to known frequencies and capped at 9; throws `LLMError` if no approach has
code.

`normaliseExplanation(raw)`: coerces strings/arrays, guarantees at least one step, caps dry-run lines at
14 and pitfalls at 6.

This layer exists so a partially malformed model reply degrades into a usable UI instead of a crash.

---

## 9. UI system

### Design language

The home screen reproduces a supplied reference composition: a single large floating card on a grey page,
dark photographic hero on top, white content band overlapping it with large rounded top corners.

Tokens (`@theme` in `app/globals.css`):

| Token | Value | Role |
| --- | --- | --- |
| `paper` | `#c7c7cb` | page background behind the card |
| `ink` | `#2f343c` | primary dark surface / text |
| `ink-deep` | `#24282f` | deepest dark (code surfaces, footer band) |
| `ink-soft` | `#3b424b` | hover dark |
| `coral` | `#ef9080` | accent card, "brute force" tier, warnings |
| `lime` | `#b9e04e` | primary positive accent ("optimal", CTA on dark) |
| `violet` | `#6a3bf0` | primary action (Search button), links, "active" highlight |
| `mist` | `#f3f3f5` | quiet fills |
| `haze` | `#9aa1ab` | muted labels |
| `line` | `#e7e7ea` | borders |

Tier colours: brute `#ef9080`, better `#e6b64a`, optimal `#a3cc3a`.

Typography: Plus Jakarta Sans 400–800 for everything, weight 800 + tight tracking for headings, JetBrains
Mono for numbers, code and complexity strings. Hero H1 uses
`clamp(2.35rem, 5vw, 3.7rem)` with `leading-[1.03]` and `tracking-[-0.03em]`.

Radii/shape: outer `.frame` 44px (28px on mobile) with a deep two-layer shadow; cards 14–26px; buttons
fully rounded or 10–18px; section bands 26px.

Helper classes defined in `globals.css`: `.frame`, `.hero-surface` (layered slate gradient + a masked
blueprint grid pseudo-element), `.glass-card` / `.glass-card-dim` (glassy overlays for the hero cards),
`.hairline`, `.scrollbar-slim`, `.code-surface` + `.tok-*` syntax token colours, `.animate-rise`,
`.dot` (loading dots), `.skeleton` (shimmer).

### Page anatomy

**`/`** — dark hero: Nav (brand tile + links + Log in / Sign Up), violet `DSA` tile + "LeetCode cockpit"
badge, two-line H1 "Master Every / LeetCode Problem", subcopy, the white `SearchPanel` (problem number
field, language select, violet Search button) with quick-pick chips `#1 #121 #42 #200 #76` and a hint line,
then track links. Right side (desktop only): coral "Interview ready" card, glass "Watch it run" card with a
lime bolt and a 7-bar mini chart, dim "System Design" card, and a small "live generation" chip.
The white band (`-mt-[74px] rounded-t-[38px]`) holds a "today's pick" mini card (violet→coral thumbnail,
number badge, tags, title, complexity, difficulty, lime "Solve now") and four company pills.
Below: five-step loop, "Every structure, every algorithm" grid of 8 tiles, three track cards
(DSA live + LLD/HLD dashed), six curated problems, dark CTA band, footer.

**`/problems`** — dark hero with a count badge, big headline, and a white filter form (search, difficulty,
Filter). White sheet with horizontally scrolling pattern chips (14 tags), result cards (number, title,
`pro` badge, difficulty pill, two tags, acceptance, arrow), pagination, and a "search by number" CTA.
On LeetCode failure it shows a coral notice and falls back to filtering `CURATED` locally.

**`/problem/[id]`** — dark hero: back link, `#number`, difficulty pill, acceptance, tags, title, "Open on
LeetCode" button. On error the hero shows the message plus a compact SearchPanel and a curated fallback
grid. White sheet (`-mt-[56px] rounded-t-[34px]`) contains the Workspace.

**Workspace layout** — meta rail (number, difficulty, up to four tags, premium badge, acceptance, LeetCode
link) → tab pills + language selector → collapsible statement card → tab body. Sections use
`SectionTitle` (eyebrow + title + optional action).

**Solutions tab** — dark "the unlock" card (key insight + pattern chips) beside a white "in one breath"
overview; then one card per approach with tier chip, title, idea, time/space chips, `CodeBlock`, when-to-use,
pitfalls list and a "Visualise this approach" button; then a complexity table; then follow-ups and
"study next" chips.

**Explanation tab** — violet gradient TL;DR card, intuition card, numbered step timeline, dark dry-run panel
with mono trace lines, two tinted cards (pitfalls in coral, takeaway in lime), and a wide "Rather see it
move?" CTA.

**Visualise tab** — approach summary card with the three tier pills, loading/error states, then `VizPlayer`
and a regenerate strip.

**Complexity tab** — three time/space cards, a trade-off table, and a dark "say it like this" script that
quotes the generated complexities.

**Companies tab** — two-column company cards with a frequency bar (Very High 100 / High 72 / Medium 45 /
Low 22) and note, a "from public interview reports · approximate" disclaimer, and similar problems linking
to `/problem/<slug>?lang=`.

**`/visualise`** — dark hero, `VizPlayer` with `DEMO_TRACE` + code, six capability cards, and a CTA to
problem #1. This page is the guaranteed working demo when the LLM is unavailable.

### Shared UI atoms

- `components/ui/CodeBlock.tsx` — copy button, line numbers, and a small per-line tokenizer (comments,
  strings, numbers, keywords from a large set, call detection) rendered as React text nodes (no
  `dangerouslySetInnerHTML`).
- `components/ui/Prose.tsx` — `parseProse()` turns statement text into blocks: fenced code, bullet lists
  (`•`), headings (`Example n`, `Constraints`, `Follow up`, `Note`, `Explanation`, `Hint`), and paragraphs
  (`whitespace-pre-wrap`).
- `components/ui/Icons.tsx` — every icon is an inline SVG exported individually.
- `components/problem/shared.tsx` — `TIER_META`, `DifficultyPill`, `Card`, `SectionTitle`,
  `GenerateCard`, `LoadingCard` (skeleton + animated dots), `ErrorCard` (coral, with retry), `Tag`.

Accessibility/interaction notes: icon-only buttons carry `aria-label`; selects are native inputs made
invisible over a styled label; keyboard use of the slider/buttons works because they are real controls.
There is no dark mode (the design is light-on-grey with dark bands) and no toast system.

---

## 10. Verified behaviour and timing

Verified on the previous model, and the whole pipeline re-checked after switching:
`tsc --noEmit` clean, `next lint` clean, `npm run build` succeeds (7 routes, ~125 kB shared JS).
All four pages return 200.

Live API observations:
- `/api/problem` resolves `1`, `42`, `1143`, `two-sum`, `merge intervals`; unknown numbers return a 404
  message that the UI renders.
- `/api/solutions` (two-sum, Python 3) returns three tiers, 7–8 companies, a 3-row complexity table and
  follow-ups; a typical answer is 10–20s on a fast model.
- `/api/explain` (121) returns a full explanation in ~8–12s.
- `/api/visualise`: two-sum → `array` + `hashmap`, 8–9 frames, result `[0,1]`; 200 Number of Islands →
  `matrix`, 13 frames; 102 level order → `tree` + `queue`, 10 frames; 206 reverse list →
  `linkedlist` + `array`, result `[5,4,3,2,1]`.
- All nine structure renderers were smoke-tested by rendering a synthetic trace through the server
  renderer (temporary page, since removed).

**Model speed — measured on this machine, free tier, single run each:**

| Model | solutions (#1) | explain (#121) | visualise (#1) |
| --- | --- | --- | --- |
| `google/gemma-4-26b-a4b-it:free` (primary) | 429 in bursts; answers in ~2s when it is not limited | — | — |
| `cohere/north-mini-code:free` (fallback 1) | 20–33s, sometimes truncates at 12k | 9s | 21–60s (8 frames) |
| `nvidia/nemotron-3-ultra-550b-a55b:free` (fallback 2) | 83s | 26s | 21s (4 frames) |

Gemma 4 is fast when it responds (200 in ~2.1s on a small JSON prompt) but was upstream-rate-limited
(429) for most of the testing session, so real answers usually came from the fallbacks. One three-solution
request walked the entire chain and still returned 504 after ~170s under that load.

Both are $0. Latency on free tiers is provider-load dependent, so treat these as ranges, not constants.
Two observed tails worth knowing: the fast model once stalled past 120s on a trace (hence the 240s
visualise timeout), and on `#206` it truncated at the 12k budget, so the chain fell back to Nemotron and
the request still returned 200 in ~181s. The
Cohere model is the better default for code; the 550B model sometimes answers with fewer frames than the
prompt's 8–30 target (the renderer does not care — a 1-frame trace still plays). Switching model is an env
change only; the fallback chain means a dead slug degrades gracefully instead of breaking the app.

---

## 11. Traps and gotchas (read before editing)

1. **`next/font` weights.** Passing an explicit `weight: [...]` array to a variable Google font broke the
   Turbopack build ("next/font/google queries have exactly one entry"). Weights are intentionally omitted.
2. **Private folders.** Any `app/` directory starting with `_` is a private route and 404s. A temporary
   smoke-test page had to be named `vizcheck-tmp`, not `__vizcheck`.
3. **`max_tokens` includes reasoning.** These models bill internal reasoning against the output budget;
   low budgets produce empty content with `finish_reason: "length"`. That is why the three budgets are
   generous. The repair path also detects truncation and asks for a compact retry.
4. **Company tags are gone from LeetCode.** Do not try to scrape them; the LLM's list is labelled
   approximate on purpose.
5. **`https://leetcode.com/api/problems/all/` is 403.** Number → slug must go through GraphQL
   (`questionList` search + chronological skip fallback).
6. **Client components and SSR.** `VizPlayer`/`Workspace` are `"use client"` but still server-render once;
   therefore no `window`/`localStorage` access may run during render (`SearchPanel` reads `localStorage`
   inside `useEffect`).
7. **Demo trace and demo code must stay aligned**, otherwise the code panel highlights the wrong line.
8. **`normalise*` is the safety net.** If the UI ever crashes on model output, extend normalisation rather
   than sprinkling optional chaining in components.
9. **`.env.local` is git-ignored**; `.env.example` has a `.gitignore` exception (`!.env.example`). Never
   commit the key; rotate any key that was shared in plain text.
10. **Model names shown in the UI come from the server.** `app/page.tsx` and
   `app/problem/[id]/page.tsx` import `MODEL` and render it (hero chip, GenerateCard footer). If you add a
   model picker, thread the value from the server the same way instead of hardcoding a slug in a client
   component.
11. **The abort signal covers the response body, not just the headers.** Reading `res.json()` after a
   stalled stream throws outside the `fetch` try/catch, so it is wrapped separately and mapped to a 504.
   Any new network call added here needs the same two-layer handling.

---

## 12. Known limitations / sensible next steps

- Generation is not streamed; there is a skeleton + timing hint, nothing more. Streaming or SSE progress
  would be the biggest UX win.
- No persistence: reloading the page discards generated solutions/traces (LeetCode data is cached
  server-side for an hour).
- No auth, no saved problems, no progress tracking; the nav's Log in/Sign Up buttons are inert.
- Visualisations are LLM-authored, so depth (8–30 frames) and structure choice vary; there is no
  verification that a frame is factually the algorithm's next state.
- LLD/HLD tracks are placeholders.
- Multi-language support exists per request but is not cached per language on the server.

---

## 13. File map (what lives where)

```
app/
  layout.tsx                     root layout, fonts, metadata
  globals.css                    Tailwind v4 theme tokens + .frame/.hero-surface/glass/code/skeleton classes
  page.tsx                       home page (hero, cards, steps, structures, tracks, ladder, CTA, footer)
  problems/page.tsx              browse + filters + pagination (server component, searchParams)
  problem/[id]/page.tsx          problem shell: dark header, error fallback, Workspace
  visualise/page.tsx             demo player + DEMO_CODE + capability grid
  api/problem/route.ts           GET  scrape/resolve
  api/solutions/route.ts         POST three approaches (maxTokens 12000)
  api/explain/route.ts           POST plain-English explanation (maxTokens 5000)
  api/visualise/route.ts         POST trace (maxTokens 24000)
components/
  site/Nav.tsx                   Brand, Nav (client, mobile menu, active link), BackLink
  home/SearchPanel.tsx           client search form, language select, aa:lang persistence, quick chips
  problem/shared.tsx             TIER_META, DifficultyPill, Card, SectionTitle, GenerateCard,
                                 LoadingCard, ErrorCard, Tag
  problem/Workspace.tsx          the orchestrator: tabs, loaders, caches-in-state, statement card
  problem/SolutionView.tsx       insight card, per-approach cards, complexity table, follow-ups
  problem/ExplainView.tsx        tldr, intuition, step timeline, dry-run panel, pitfalls, CTA
  viz/VizStage.tsx               all nine structure renderers + colour tables
  viz/VizPlayer.tsx              playback controls, caption/callout, synced code panel
  ui/Icons.tsx                   inline SVG icon set
  ui/CodeBlock.tsx               copy + line numbers + mini tokenizer
  ui/Prose.tsx                   statement text → blocks (code, bullets, headings, paragraphs)
lib/
  leetcode.ts                    GraphQL client, slug resolution, HTML→text, TTL cache
  llm.ts                         OpenRouter client, extractJson, chatJson repair, error mapping
  prompts.ts                     the three prompt builders + visualisation DSL text
  viz.ts                         trace types, normalisation/clamping, DEMO_TRACE
  types.ts                       Tier/Approach/CompanyHit/SolutionPack/Explanation + languages
  normalise.ts                   toErrorResponse, normaliseSolutions, normaliseExplanation
  curated.ts                     CURATED ladder, TODAYS_PICK, COMPANY_LOGOS, VISUALISERS
.env.example                     key template (tracked; .env.local is not)
README.md                        setup + architecture summary
quickreview.md                   this document
```

If you only read two files before changing behaviour: `components/problem/Workspace.tsx` (the flow) and
`lib/viz.ts` (the visual contract).
