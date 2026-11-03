# Changelog

Every shipped version is a git tag (`alpha0.1`, `alpha0.2`, …) **and** a GitHub Release, so the history
stays browsable and any version can be checked out or downloaded as a zip from GitHub.

| Tag | Date | `package.json` | Headline |
| --- | --- | --- | --- |
| [`alpha0.1`](https://github.com/Mayurbarve/DSA-Visualiser/releases/tag/alpha0.1) | 2026-11-02 | `0.1.0-alpha0.1` | First base version: the full LeetCode cockpit |
| [`alpha0.2`](https://github.com/Mayurbarve/DSA-Visualiser/releases/tag/alpha0.2) | 2026-11-02 | `0.2.0-alpha0.2` | Premium handling + every tab in one request |

## Versioning scheme

- `alpha0.N` — one tag per shipped iteration, cut from `main` once the build is green.
- `package.json` version follows `0.N.0-alpha0.N`, so the running app and the tag never disagree.
- `alpha0.1` stays checkoutable forever; work for the next version happens on a branch so the previous
  tag is never rewritten.

## [alpha0.2] — 2026-11-02

### Added

- **Premium detection.** LeetCode's `isPaidOnly` is surfaced everywhere: a `pro` chip in the problem
  ladder, a `premium` pill in the problem header and workspace rail.
- **AI-written practice questions for Premium problems.** LeetCode returns no statement for them, so
  `POST /api/reconstruct` writes a LeetCode-style version of the same title, difficulty and topics —
  statement, 2–3 examples, constraints and a follow-up — clearly labelled as practice material, not the
  official wording. `components/problem/PremiumNotice.tsx` replaces the empty statement block.
- **One request for all five tabs.** `POST /api/bundle` returns solutions, explanation, the optimal
  visualisation trace, the practice question (Premium only) and the resulting complexity/company data
  together. Solutions and explanation generate in parallel; the trace follows and draws the optimal code.
  Each section failing is reported separately, so one bad model reply no longer blanks the page.
- **`lib/llm-cache.ts`** — six-hour memo per `slug + language`, plus in-flight de-duplication so two tabs
  opening the same problem share one generation. `refresh: true` (the **refresh all** button) bypasses it.
- **`lib/types.ts`** now holds the client/server contracts (`ProblemBundle`, `Reconstruction`,
  `BundleFailure`), and `normaliseReconstruction` keeps malformed model output from reaching React.

### Changed

- The workspace loads with every tab already generating, instead of a "Generate" button per tab; the old
  per-tab endpoints remain as regeneration actions.
- The statement accordion is hidden when LeetCode has no statement to show (Premium), instead of rendering
  an empty question box.
- Language switching now refreshes the whole bundle for the new language.
- Visible version: `0.2.0-alpha0.2`.

## [alpha0.1] — 2026-11-02

### Added

- First base version: LeetCode problem lookup by number, title or URL (GraphQL, server-side, no key).
- Three approaches (brute → better → optimal) with runnable, LeetCode-ready code in Python 3, Java, C++,
  JavaScript and Go; complexity table; company frequency; follow-ups.
- Plain-English explanation with a dry run, and a frame-by-frame visualisation trace rendered by a generic
  player (array, matrix, linked list, tree, graph, stack, queue, hashmap, DP states).
- Multi-model generation over OpenRouter: five configurable free models raced in parallel, fastest complete
  reply wins, then a best-of chain, then an ordered fallback chain with a cooldown on rate-limited models.
- Problem ladder with difficulty/pattern filters and a curated fallback when LeetCode is unreachable.
