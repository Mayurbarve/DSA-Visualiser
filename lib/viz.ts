/* ------------------------------------------------------------------ *
 * Visual trace DSL
 *
 * The model never writes HTML or coordinates: it emits a sequence of
 * frames, and each frame carries generic "structures". The renderer turns
 * those into arrays, matrices, linked lists, trees, graphs, stacks,
 * queues and hash maps. That is what makes every algorithm drawable.
 * ------------------------------------------------------------------ */

export type Prim = string | number | boolean | null;

export type HighlightKind =
  | "active"
  | "compare"
  | "match"
  | "window"
  | "visited"
  | "sorted"
  | "muted"
  | "target"
  | "path"
  | "rejected";

const KINDS: HighlightKind[] = [
  "active",
  "compare",
  "match",
  "window",
  "visited",
  "sorted",
  "muted",
  "target",
  "path",
  "rejected",
];

export type CellHighlight = { index: number; kind?: HighlightKind };
export type Pointer = { name: string; index: number; kind?: HighlightKind };
export type Range = { from: number; to: number; label?: string; kind?: HighlightKind };

export type VizStructure =
  | {
      type: "array";
      label?: string;
      values: Prim[];
      highlights?: CellHighlight[];
      pointers?: Pointer[];
      ranges?: Range[];
    }
  | {
      type: "matrix";
      label?: string;
      rows: Prim[][];
      highlights?: { r: number; c: number; kind?: HighlightKind }[];
      rowLabels?: string[];
      colLabels?: string[];
    }
  | {
      type: "linkedlist";
      label?: string;
      nodes: { id: string; value: Prim; highlight?: HighlightKind; note?: string }[];
      next?: string | null;
      pointers?: { name: string; nodeId: string }[];
      cycle?: boolean;
    }
  | {
      type: "tree";
      label?: string;
      root: string;
      nodes: { id: string; value: Prim; left?: string | null; right?: string | null; highlight?: HighlightKind; note?: string }[];
      pointers?: { name: string; nodeId: string }[];
    }
  | {
      type: "graph";
      label?: string;
      directed?: boolean;
      weighted?: boolean;
      nodes: { id: string; value?: Prim; highlight?: HighlightKind }[];
      edges: { from: string; to: string; weight?: Prim; highlight?: HighlightKind; directed?: boolean }[];
      pointers?: { name: string; nodeId: string }[];
    }
  | { type: "stack"; label?: string; values: Prim[]; highlights?: CellHighlight[]; note?: string }
  | { type: "queue"; label?: string; values: Prim[]; highlights?: CellHighlight[]; note?: string }
  | { type: "hashmap"; label?: string; entries: { key: Prim; value: Prim; highlight?: HighlightKind }[] }
  | { type: "states"; label?: string; entries: { name: string; value: Prim; highlight?: HighlightKind }[] };

export type VizFrame = {
  caption: string;
  codeLine?: number;
  callout?: string;
  structures: VizStructure[];
  vars?: { name: string; value: Prim }[];
};

export type VizTrace = {
  title: string;
  approach: string;
  summary: string;
  frames: VizFrame[];
  result: string;
};

/* ------------------------------------------------------------------ */
/* normalisation (never trust model output)                            */
/* ------------------------------------------------------------------ */

function prim(v: unknown): Prim {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !Number.isFinite(v)) return String(v);
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) return v.map((x) => String(prim(x) ?? "")).join(",");
  const obj = v as Record<string, unknown>;
  if ("value" in obj) return prim(obj.value);
  if ("val" in obj) return prim(obj.val);
  return JSON.stringify(v);
}

function str(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  return fallback;
}

function kind(v: unknown): HighlightKind | undefined {
  return typeof v === "string" && (KINDS as string[]).includes(v) ? (v as HighlightKind) : undefined;
}

function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function idList(v: unknown): Record<string, unknown>[] {
  return arr(v).filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
}

function normaliseStructure(input: unknown, index: number): VizStructure | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const type = str(raw.type).toLowerCase().replace(/[\s_-]/g, "");
  const label = raw.label ? str(raw.label) : undefined;

  if (type === "array" || type === "string" || type === "list" || type === "nums") {
    const rawValues = Array.isArray(raw.values)
      ? raw.values
      : Array.isArray(raw.items)
        ? raw.items
        : typeof raw.values === "string"
          ? raw.values.split("")
          : [];
    const values = rawValues.slice(0, 40).map(prim);
    if (!values.length) return null;
    const highlights = idList(raw.highlights)
      .map((h) => ({ index: Number(h.index ?? h.i), kind: kind(h.kind) }))
      .filter((h) => Number.isInteger(h.index) && h.index >= 0 && h.index < values.length);
    const pointers = idList(raw.pointers)
      .map((p) => ({
        name: str(p.name ?? p.label ?? "ptr"),
        index: Number(p.index ?? p.i),
        kind: kind(p.kind),
      }))
      .filter((p) => Number.isInteger(p.index) && p.index >= -1 && p.index <= values.length);
    const ranges = idList(raw.ranges)
      .map((r) => ({ from: Number(r.from), to: Number(r.to), label: r.label ? str(r.label) : undefined, kind: kind(r.kind) }))
      .filter((r) => Number.isInteger(r.from) && Number.isInteger(r.to) && r.to >= r.from);
    return {
      type: type === "string" ? "array" : "array",
      label: label ?? (type === "string" ? "string" : undefined),
      values,
      highlights: highlights.length ? highlights : undefined,
      pointers: pointers.length ? pointers : undefined,
      ranges: ranges.length ? ranges : undefined,
    };
  }

  if (type === "matrix" || type === "grid" || type === "2darray" || type === "table") {
    const rows = arr(raw.rows).slice(0, 14).map((r) => arr(r).slice(0, 18).map(prim));
    if (!rows.length) return null;
    const width = Math.max(...rows.map((r) => r.length));
    const padded = rows.map((r) => [...r, ...Array(Math.max(0, width - r.length)).fill(null)]);
    const highlights = idList(raw.highlights)
      .map((h) => ({ r: Number(h.r ?? h.row), c: Number(h.c ?? h.col), kind: kind(h.kind) }))
      .filter((h) => Number.isInteger(h.r) && Number.isInteger(h.c) && h.r >= 0 && h.c >= 0 && h.r < padded.length && h.c < width);
    return {
      type: "matrix",
      label,
      rows: padded,
      highlights: highlights.length ? highlights : undefined,
      rowLabels: arr(raw.rowLabels).map((x) => str(x)),
      colLabels: arr(raw.colLabels).map((x) => str(x)),
    };
  }

  if (type === "linkedlist" || type === "listnodes" || type === "linked") {
    const rawNodes = arr(raw.nodes);
    const values = rawNodes.length ? rawNodes : arr(raw.values);
    const nodes = values.slice(0, 24).map((n, i) => {
      if (n && typeof n === "object") {
        const o = n as Record<string, unknown>;
        return {
          id: str(o.id, `n${i}`),
          value: prim(o.value ?? o.val),
          highlight: kind(o.highlight),
          note: o.note ? str(o.note) : undefined,
        };
      }
      return { id: `n${i}`, value: prim(n), highlight: undefined, note: undefined };
    });
    if (!nodes.length) return null;
    const pointers = idList(raw.pointers).map((p) => ({ name: str(p.name, "ptr"), nodeId: str(p.nodeId ?? p.id) }));
    return {
      type: "linkedlist",
      label,
      nodes,
      next: raw.next === null ? null : raw.next ? str(raw.next) : undefined,
      pointers: pointers.length ? pointers : undefined,
      cycle: raw.cycle === true,
    };
  }

  if (type === "tree" || type === "bst" || type === "binarytree" || type === "heap" || type === "trie") {
    // Compact form: LeetCode level-order `values` (position i has children 2i+1 / 2i+2).
    if (Array.isArray(raw.values)) {
      const values = raw.values.slice(0, 63);
      const kept = values
        .map((v, i) => ({ v, i }))
        .filter((x) => x.v !== null && x.v !== undefined);
      if (!kept.length) return null;
      const highlighted = new Map<number, HighlightKind>();
      idList(raw.highlights).forEach((h) => {
        const idx = Number(h.index);
        const k = kind(h.kind);
        if (Number.isInteger(idx) && k) highlighted.set(idx, k);
      });
      const idxPointers = idList(raw.pointers).map((p) => ({ name: str(p.name, "ptr"), index: Number(p.index) }));

      const nodes = kept.map(({ v, i }) => {
        const leftIdx = 2 * i + 1;
        const rightIdx = 2 * i + 2;
        return {
          id: `n${i}`,
          value: prim(v),
          left: leftIdx < values.length && values[leftIdx] !== null ? `n${leftIdx}` : null,
          right: rightIdx < values.length && values[rightIdx] !== null ? `n${rightIdx}` : null,
          highlight: highlighted.get(i),
          note: undefined as string | undefined,
        };
      });
      const ids = new Set(nodes.map((n) => n.id));
      const pointers = idxPointers
        .map((p) => ({ name: p.name, nodeId: `n${p.index}` }))
        .filter((p) => ids.has(p.nodeId));

      return {
        type: "tree",
        label,
        root: "n0",
        nodes: nodes.map((n) => ({ ...n, left: n.left && ids.has(n.left) ? n.left : null, right: n.right && ids.has(n.right) ? n.right : null })),
        pointers: pointers.length ? pointers : undefined,
      };
    }

    const nodes = arr(raw.nodes)
      .filter((n): n is Record<string, unknown> => !!n && typeof n === "object")
      .slice(0, 40)
      .map((n, i) => ({
        id: str(n.id, `n${i}`),
        value: prim(n.value ?? n.val),
        left: n.left ? str(n.left) : n.left === null ? null : undefined,
        right: n.right ? str(n.right) : n.right === null ? null : undefined,
        highlight: kind(n.highlight),
        note: n.note ? str(n.note) : undefined,
      }));
    if (!nodes.length) return null;
    const ids = new Set(nodes.map((n) => n.id));
    const root = raw.root ? str(raw.root) : nodes[0].id;
    if (!ids.has(root)) return null;
    const pointers = idList(raw.pointers)
      .map((p) => ({ name: str(p.name, "ptr"), nodeId: str(p.nodeId ?? p.id) }))
      .filter((p) => ids.has(p.nodeId));
    return {
      type: "tree",
      label,
      root,
      nodes: nodes.map((n) => ({
        ...n,
        left: n.left && ids.has(n.left) ? n.left : null,
        right: n.right && ids.has(n.right) ? n.right : null,
      })),
      pointers: pointers.length ? pointers : undefined,
    };
  }

  if (type === "graph" || type === "dag" || type === "network") {
    const nodes = arr(raw.nodes)
      .filter((n): n is Record<string, unknown> => !!n && typeof n === "object")
      .slice(0, 32)
      .map((n, i) => ({ id: str(n.id, `n${i}`), value: n.value !== undefined ? prim(n.value) : undefined, highlight: kind(n.highlight) }));
    if (!nodes.length) return null;
    const ids = new Set(nodes.map((n) => n.id));
    const edges = arr(raw.edges)
      .filter((e): e is Record<string, unknown> => !!e && typeof e === "object")
      .map((e) => ({
        from: str(e.from ?? e.source ?? e.u),
        to: str(e.to ?? e.target ?? e.v),
        weight: e.weight !== undefined ? prim(e.weight) : undefined,
        highlight: kind(e.highlight),
        directed: typeof e.directed === "boolean" ? e.directed : undefined,
      }))
      .filter((e) => ids.has(e.from) && ids.has(e.to));
    const pointers = idList(raw.pointers)
      .map((p) => ({ name: str(p.name, "ptr"), nodeId: str(p.nodeId ?? p.id) }))
      .filter((p) => ids.has(p.nodeId));
    return {
      type: "graph",
      label,
      directed: raw.directed === true,
      weighted: raw.weighted === true || edges.some((e) => e.weight !== undefined),
      nodes,
      edges,
      pointers: pointers.length ? pointers : undefined,
    };
  }

  if (type === "stack") {
    const values = arr(raw.values).slice(0, 24).map(prim);
    const highlights = idList(raw.highlights)
      .map((h) => ({ index: Number(h.index), kind: kind(h.kind) }))
      .filter((h) => h.index >= 0 && h.index < values.length);
    return { type: "stack", label, values, highlights: highlights.length ? highlights : undefined, note: raw.note ? str(raw.note) : undefined };
  }

  if (type === "queue" || type === "deque" || type === "monotonicqueue") {
    const values = arr(raw.values).slice(0, 24).map(prim);
    const highlights = idList(raw.highlights)
      .map((h) => ({ index: Number(h.index), kind: kind(h.kind) }))
      .filter((h) => h.index >= 0 && h.index < values.length);
    return { type: "queue", label, values, highlights: highlights.length ? highlights : undefined, note: raw.note ? str(raw.note) : undefined };
  }

  if (type === "hashmap" || type === "map" || type === "dict" || type === "hashset" || type === "set") {
    const entries = arr(raw.entries)
      .slice(0, 24)
      .map((e) => {
        if (Array.isArray(e)) return { key: prim(e[0]), value: prim(e[1]), highlight: undefined };
        const o = (e ?? {}) as Record<string, unknown>;
        return {
          key: prim(o.key ?? o.k),
          value: type.includes("set") && o.value === undefined ? "✓" : prim(o.value ?? o.v),
          highlight: kind(o.highlight),
        };
      });
    if (!entries.length && raw.entries !== undefined) return { type: "hashmap", label, entries: [] };
    return entries.length ? { type: "hashmap", label, entries } : null;
  }

  if (type === "states" || type === "vars" || type === "variables" || type === "values") {
    const entries = arr(raw.entries)
      .slice(0, 16)
      .map((e) => {
        if (Array.isArray(e)) return { name: str(e[0]), value: prim(e[1]), highlight: undefined };
        const o = (e ?? {}) as Record<string, unknown>;
        return { name: str(o.name ?? o.key, "var"), value: prim(o.value), highlight: kind(o.highlight) };
      })
      .filter((e) => e.name);
    return entries.length ? { type: "states", label, entries } : null;
  }

  void index;
  return null;
}

export function normaliseFrame(input: unknown): VizFrame | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as Record<string, unknown>;
  const structures = arr(raw.structures)
    .map((s, i) => normaliseStructure(s, i))
    .filter((s): s is VizStructure => s !== null)
    .slice(0, 4);
  if (!structures.length) return null;

  const vars = arr(raw.vars ?? raw.variables)
    .slice(0, 10)
    .map((v) => {
      const o = (v ?? {}) as Record<string, unknown>;
      return { name: str(o.name ?? o.key), value: prim(o.value) };
    })
    .filter((v) => v.name);

  const codeLine = Number(raw.codeLine ?? raw.line);

  return {
    caption: str(raw.caption ?? raw.description, "").slice(0, 400),
    codeLine: Number.isInteger(codeLine) && codeLine > 0 ? codeLine : undefined,
    callout: raw.callout ? str(raw.callout).slice(0, 300) : undefined,
    structures,
    vars: vars.length ? vars : undefined,
  };
}

export function normaliseTrace(input: unknown): VizTrace {
  const raw = (input ?? {}) as Record<string, unknown>;
  const frames = arr(raw.frames ?? raw.steps)
    .map(normaliseFrame)
    .filter((f): f is VizFrame => f !== null)
    .slice(0, 80);

  if (!frames.length) {
    throw new Error("The model did not return any drawable frames. Please retry.");
  }

  return {
    title: str(raw.title, "Execution trace").slice(0, 140),
    approach: str(raw.approach, "").slice(0, 80),
    summary: str(raw.summary ?? raw.explanation, "").slice(0, 600),
    frames,
    result: raw.result ? str(raw.result).slice(0, 400) : "",
  };
}

/* ------------------------------------------------------------------ */
/* a hand-written trace so the /visualise page always has something    */
/* to play with                                                       */
/* ------------------------------------------------------------------ */

function bubbleSortTrace(): VizTrace {
  const input = [5, 1, 4, 2, 8];
  const frames: VizFrame[] = [];
  const a = [...input];
  const sortedFrom = input.length;

  frames.push({
    caption: "Start: compare adjacent pairs and bubble the largest value to the right.",
    codeLine: 2,
    structures: [{ type: "array", label: "nums", values: [...a], pointers: [{ name: "i", index: 0 }] }],
    vars: [
      { name: "n", value: input.length },
      { name: "swaps", value: 0 },
    ],
    callout: "Bubble sort is O(n²) but the trace is easy to read — perfect for the first visual.",
  });

  let swaps = 0;
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      const compare = a[j] > a[j + 1];
      frames.push({
        caption: compare
          ? `nums[${j}]=${a[j]} > nums[${j + 1}]=${a[j + 1]} → swap.`
          : `nums[${j}]=${a[j]} ≤ nums[${j + 1}]=${a[j + 1]} → keep order.`,
        codeLine: 5,
        structures: [
          {
            type: "array",
            label: "nums",
            values: [...a],
            highlights: [
              { index: j, kind: "compare" },
              { index: j + 1, kind: "compare" },
            ],
            pointers: [
              { name: "j", index: j },
              { name: "j+1", index: j + 1 },
            ],
            ranges: i > 0 ? [{ from: a.length - i, to: a.length - 1, label: "sorted", kind: "sorted" }] : undefined,
          },
        ],
        vars: [
          { name: "pass", value: i + 1 },
          { name: "swaps", value: swaps },
        ],
      });

      if (compare) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        frames.push({
          caption: `Swapped → ${a.join(", ")}`,
          codeLine: 6,
          structures: [
            {
              type: "array",
              label: "nums",
              values: [...a],
              highlights: [
                { index: j, kind: "match" },
                { index: j + 1, kind: "match" },
              ],
              pointers: [{ name: "j", index: j }],
              ranges: i > 0 ? [{ from: a.length - i, to: a.length - 1, label: "sorted", kind: "sorted" }] : undefined,
            },
          ],
          vars: [{ name: "swaps", value: swaps }],
        });
      }
    }

    frames.push({
      caption: `Pass ${i + 1} done: ${a[a.length - 1 - i]} is locked at index ${a.length - 1 - i}.`,
      structures: [
        {
          type: "array",
          label: "nums",
          values: [...a],
          highlights: [{ index: a.length - 1 - i, kind: "sorted" }],
          ranges: [{ from: a.length - 1 - i, to: a.length - 1, label: "sorted", kind: "sorted" }],
        },
      ],
    });
  }
  void sortedFrom;

  frames.push({
    caption: "Array sorted.",
    structures: [{ type: "array", label: "nums", values: [...a], highlights: a.map((_, i) => ({ index: i, kind: "sorted" as const })) }],
    callout: `Total swaps: ${swaps}.`,
  });

  return {
    title: "Bubble sort — a full execution trace",
    approach: "O(n²) sorting",
    summary:
      "This is the same renderer every generated problem uses. Step through it, or press play: each frame is a snapshot of the data structure plus the pointers that moved.",
    frames,
    result: `[${a.join(", ")}]`,
  };
}

export const DEMO_TRACE: VizTrace = bubbleSortTrace();
