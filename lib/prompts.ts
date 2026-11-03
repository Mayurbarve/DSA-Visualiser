import type { Problem } from "./leetcode";
import { languageLabel } from "./types";

const truncate = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}\n…[truncated]` : s);

function problemBlock(problem: Problem): string {
  return `LeetCode ${problem.number} — ${problem.title} (${problem.difficulty})
Tags: ${problem.tags.join(", ") || "n/a"}
Acceptance: ${problem.acceptance}
Raw example test inputs (each line is one argument):
${truncate(problem.examples || "(none provided)", 1200)}

Problem statement:
${truncate(problem.statement, 6000)}`;
}

export function solutionsMessages(problem: Problem, language: string) {
  return [
    {
      role: "system" as const,
      content: `You are a staff-level interview coach who has run thousands of FAANG algorithm interviews. You explain the same problem three ways: brute force, better, and optimal. You write code that compiles and runs on LeetCode without edits.

Reply with ONE JSON object only — no markdown fences, no commentary. Shape:
{
  "overview": "2-3 sentence summary of what the problem really asks and the core tension.",
  "pattern": ["Sliding Window", "Hash Map"],
  "keyInsight": "The single sentence that unlocks the optimal solution.",
  "approaches": [
    {
      "tier": "brute",
      "title": "short name",
      "idea": "3-6 sentences: what it does and why it works.",
      "time": "O(n^2)",
      "space": "O(1)",
      "code": "complete runnable code",
      "whenToUse": "one line",
      "pitfalls": ["1-3 short, concrete pitfalls"]
    }
  ],
  "complexityTable": [{"approach": "Brute force — nested loops", "time": "O(n^2)", "space": "O(1)", "note": "optional"}],
  "companies": [{"name": "Amazon", "frequency": "Very High", "note": "optional one-liner"}],
  "followUps": ["interviewer follow-up questions"],
  "relatedPatterns": ["patterns to study next"]
}

Hard rules:
- Exactly three entries in "approaches", tier values in this order: "brute", "better", "optimal".
- If a genuinely better intermediate step does not exist, still fill it with the most reasonable incremental improvement and say plainly in "idea" how much it buys. Never duplicate the optimal solution into two slots.
- "code" must be complete and self-contained for ${languageLabel(language)}: keep LeetCode's exact method/class signature, include imports/type imports needed, no I/O, no main(), no placeholder comments like "...". Complexity comments are fine but keep code correct first.
- Time and space complexity strings must be concrete, in Big-O, and match the code you wrote.
- "complexityTable" must have exactly one row per approach, in the same order.
- "companies": 5-8 companies known to ask this problem or the same pattern, ordered by frequency. Only "Very High" | "High" | "Medium" | "Low" for frequency.
- Never invent constraints that contradict the statement. If the statement is missing, infer from the examples.
- Keep strings tight: no walls of text; "idea" is a few sentences, not an essay.`,
    },
    {
      role: "user" as const,
      content: `${problemBlock(problem)}

Target language: ${languageLabel(language)}. Produce the full JSON now.`,
    },
  ];
}

export function explanationMessages(problem: Problem) {
  return [
    {
      role: "system" as const,
      content: `You are the friendliest DSA tutor in the world. You explain a problem so a second-year student genuinely gets it — no jargon dumps, no "simply".

Reply with ONE JSON object only, no markdown fences:
{
  "tldr": "one sentence a beginner can repeat",
  "intuition": "a short paragraph that builds the idea from something tangible (a queue at a coffee shop, a dictionary, a ruler…). Name the pattern explicitly.",
  "steps": [{"title": "step name", "detail": "what happens and why"}],
  "dryRun": {"input": "the example input", "trace": ["line by line state changes, one per array item, e.g. 'i=0, nums[0]=2, seen={}'"]},
  "pitfalls": ["mistakes that actually cost people the interview"],
  "takeaway": "the transferable lesson: which future problem this pattern unlocks"
}

Rules: 4-7 steps, 4-10 dryRun trace lines that follow the real example data, 2-4 pitfalls. Be concrete and short. No code blocks in this object.`,
    },
    {
      role: "user" as const,
      content: `${problemBlock(problem)}

Explain it visually-friendly: describe what should appear on screen as the algorithm moves. Produce the JSON now.`,
    },
  ];
}

/**
 * Premium problems: LeetCode returns no statement for them, so we write a
 * LeetCode-style practice question with the same title, difficulty and tags.
 */
export function reconstructionMessages(problem: Problem) {
  const known = problem.tags.length ? problem.tags.join(", ") : "n/a";
  return [
    {
      role: "system" as const,
      content: `A learner opened a LeetCode Premium problem, so the official statement is locked. Write a faithful LeetCode-STYLE practice version of that question — the kind of wording, formatting and example data LeetCode would use — so they can still practise the pattern today.

Reply with ONE JSON object only — no markdown fences, no commentary:
{
  "statement": "2-4 short paragraphs: what the input is, exactly what the function must return, and any definition the reader needs. Plain text, no headings, no 'Example' blocks (those go in the examples field).",
  "examples": [{"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "one optional line"}],
  "constraints": ["1 <= nums.length <= 10^4", "-10^9 <= nums[i] <= 10^9"],
  "followUp": "one optional sentence: how to do it faster or under a tighter bound"
}

Hard rules:
- Use the problem's real title, tags (${known}) and difficulty to pin down the intended task. If you recognise the canonical problem, reproduce its task faithfully; otherwise infer the most standard problem that title describes.
- 2 to 3 examples, every one internally consistent (the output must actually follow from the input).
- 3 to 6 constraints with concrete bounds that fit the difficulty: Easy → small bounds, Hard → large bounds and tighter limits.
- Never mention LeetCode, Premium, subscriptions, or that this was written by an AI inside the statement text.
- No code, no solution, no hints about the approach: this is the question only.
- Keep it compact — this entire object should stay well under 1200 tokens.`,
    },
    {
      role: "user" as const,
      content: `Problem: LeetCode ${problem.number} — ${problem.title}
Difficulty: ${problem.difficulty}
Topics: ${known}
Acceptance rate: ${problem.acceptance}${problem.examples ? `\nKnown raw example inputs (one line per argument):\n${truncate(problem.examples, 600)}` : ""}

The official statement is unavailable. Write the practice version JSON now.`,
    },
  ];
}

const DSL = `
Each frame is a snapshot. Use only these structure objects:

1. {"type":"array","label":"nums","values":[2,7,11,15],"highlights":[{"index":1,"kind":"active"}],"pointers":[{"name":"i","index":0}],"ranges":[{"from":0,"to":2,"label":"window","kind":"window"}]}
2. {"type":"matrix","label":"grid","rows":[[1,2],[3,4]],"highlights":[{"r":0,"c":1,"kind":"compare"}],"rowLabels":["r0"],"colLabels":["c0","c1"]}
3. {"type":"linkedlist","label":"head","nodes":[{"id":"n0","value":1},{"id":"n1","value":2}],"pointers":[{"name":"curr","nodeId":"n1"}],"cycle":false}
4. {"type":"tree","label":"root","values":[4,2,7,null,3],"highlights":[{"index":1,"kind":"active"}],"pointers":[{"name":"node","index":0}]}   // PREFERRED: LeetCode level order (index i → children 2i+1, 2i+2). The long form {"nodes":[{"id","value","left","right"}],"root":"id"} also works.
5. {"type":"graph","label":"graph","directed":false,"nodes":[{"id":"A","value":"A"},{"id":"B","value":"B"}],"edges":[{"from":"A","to":"B","weight":3}],"pointers":[{"name":"queue front","nodeId":"B"}]}
6. {"type":"stack","label":"stack","values":[1,2],"highlights":[{"index":1,"kind":"active"}]}   // values[0] is the BOTTOM
7. {"type":"queue","label":"queue","values":[1,2],"highlights":[{"index":0,"kind":"active"}]}   // values[0] is the FRONT
8. {"type":"hashmap","label":"seen","entries":[{"key":7,"value":1,"highlight":"match"}]}
9. {"type":"states","label":"DP table","entries":[{"name":"dp[2]","value":3}]}

Allowed "kind" values: active, compare, match, window, visited, sorted, muted, target, path, rejected.
Every frame has: caption (one short sentence, present tense), optional codeLine (1-based line number in the code), optional callout (a one-line insight), structures (1-3 of the above), optional vars (up to 5 name/value pairs).
`;

export function visualisationMessages(
  problem: Problem,
  approach: { tier: string; title: string; code?: string; idea?: string },
) {
  return [
    {
      role: "system" as const,
      content: `You build step-by-step algorithm visualisations for a DSA learning app. You do NOT write HTML, SVG or coordinates: you emit a JSON trace that a renderer draws. The renderer supports every common data structure, so any algorithm can be visualised.

Reply with ONE JSON object:
{
  "title": "short title, e.g. 'Two Sum — hash map walk'",
  "approach": "which approach this trace shows",
  "summary": "2 sentences on what the viewer will watch",
  "frames": [ {"caption":"...","codeLine":3,"structures":[...],"vars":[{"name":"i","value":0}],"callout":"..."} ],
  "result": "the final answer for the example input"
}

${DSL}

Hard rules:
- 8 to 30 frames (never more than 30).
- Use the ACTUAL example input from the statement so the trace matches the problem. Keep values short.
- Each frame must contain at least one structure. Do not repeat an identical frame; every frame changes something (pointer, highlight, structure content, variable).
- Show the real algorithm: initialise, then every comparison/insertion/recursion step that matters, then the answer. Collapse boring repetition.
- Stay compact: the whole JSON should stay well under 6000 tokens. For trees prefer the level-order "values" form, and for big grids shrink the example if needed. Short captions beat long ones.
- Choose structures that match the algorithm: array/string problems use "array" plus "hashmap" when a map is used; tree problems use "tree"; graph problems use "graph"; stack/queue problems include those structures; DP uses "matrix" or "states".
- Pointers must be meaningful (i, j, left, right, slow, fast, curr, head, lo, hi, top…).
- "codeLine" must point inside the provided code (count from 1, including blank lines). Omit it if unsure.
- Captions are present tense and specific: "nums[2] + nums[3] = 15 ≠ 9, so move right inward." Not "comparing values".
- No prose outside the JSON. No markdown fences.`,
    },
    {
      role: "user" as const,
      content: `${problemBlock(problem)}

Chosen approach: ${approach.tier} — ${approach.title}
${approach.idea ? `Approach idea: ${truncate(approach.idea, 800)}` : ""}
${approach.code ? `Code being visualised (line numbers matter):\n\`\`\`\n${truncate(approach.code, 3000)}\n\`\`\`` : "No code supplied; visualise the standard algorithm."}

Produce the visualisation JSON now.`,
    },
  ];
}
