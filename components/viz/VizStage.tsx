import type { HighlightKind, VizStructure } from "@/lib/viz";

const CELL_KIND: Record<HighlightKind, string> = {
  active: "bg-violet text-white border-violet",
  compare: "bg-coral text-[#4a1f18] border-coral",
  match: "bg-lime text-ink border-lime",
  window: "bg-violet/10 text-ink border-violet/45",
  visited: "bg-ink/12 text-ink border-ink/25",
  sorted: "bg-lime/25 text-ink border-lime-deep/50",
  muted: "bg-mist text-ink/35 border-line",
  target: "bg-coral/20 text-ink border-coral",
  path: "bg-lime/20 text-ink border-lime-deep",
  rejected: "bg-mist text-ink/40 border-line line-through",
};

const POINTER_KIND: Record<HighlightKind, string> = {
  active: "bg-violet text-white",
  compare: "bg-coral text-[#4a1f18]",
  match: "bg-lime text-ink",
  window: "bg-violet/15 text-violet",
  visited: "bg-ink/15 text-ink",
  sorted: "bg-lime/30 text-ink",
  muted: "bg-mist text-ink/50",
  target: "bg-coral/25 text-[#8a3a2c]",
  path: "bg-lime/30 text-ink",
  rejected: "bg-mist text-ink/40",
};

function tone(kind?: HighlightKind) {
  return kind ? CELL_KIND[kind] : "bg-white text-ink border-line";
}

function label(text?: string) {
  if (!text) return null;
  return <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-ink/40">{text}</p>;
}

function ArrayView({ s }: { s: Extract<VizStructure, { type: "array" }> }) {
  const pointers = s.pointers ?? [];
  const highlights = s.highlights ?? [];

  return (
    <div className="w-full">
      {label(s.label)}
      <div className="scrollbar-slim -mx-1 overflow-x-auto px-1 pb-1">
        <div className="flex min-w-max items-end gap-1.5">
          {s.values.map((v, i) => {
            const cellPointers = pointers.filter((p) => p.index === i);
            const h = highlights.find((x) => x.index === i);
            const inRange = (s.ranges ?? []).find((r) => i >= r.from && i <= r.to);
            return (
              <div key={i} className="flex flex-col items-center">
                <div className="flex h-7 flex-col justify-end gap-0.5">
                  {cellPointers.map((p) => (
                    <span
                      key={p.name}
                      className={`whitespace-nowrap rounded px-1.5 py-[1px] text-[9px] font-bold leading-tight ${
                        POINTER_KIND[p.kind ?? "active"]
                      }`}
                    >
                      {p.name}
                    </span>
                  ))}
                </div>
                <div
                  className={`grid h-11 min-w-[44px] place-items-center rounded-[8px] border px-2 font-mono text-[13px] font-semibold shadow-[0_1px_0_rgba(0,0,0,0.03)] transition-all duration-300 ${tone(
                    h?.kind,
                  )} ${inRange && !h ? "ring-2 ring-violet/25" : ""}`}
                >
                  {v === null ? "·" : String(v)}
                </div>
                <span className="mt-1 font-mono text-[9px] text-ink/30">{i}</span>
              </div>
            );
          })}
          {pointers
            .filter((p) => p.index >= s.values.length)
            .map((p) => (
              <div key={p.name} className="flex flex-col items-center">
                <div className="flex h-7 items-end">
                  <span className={`rounded px-1.5 py-[1px] text-[9px] font-bold ${POINTER_KIND[p.kind ?? "active"]}`}>{p.name}</span>
                </div>
                <div className="grid h-11 min-w-[30px] place-items-center rounded-[8px] border border-dashed border-line font-mono text-[10px] text-ink/30">
                  {p.index}
                </div>
                <span className="mt-1 text-[9px] text-transparent">.</span>
              </div>
            ))}
        </div>
        {(s.ranges ?? []).length ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {s.ranges!.map((r, i) => (
              <span key={i} className="rounded-full bg-violet/10 px-2 py-0.5 text-[9.5px] font-semibold text-violet">
                {r.label ?? "range"} [{r.from}…{r.to}]
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MatrixView({ s }: { s: Extract<VizStructure, { type: "matrix" }> }) {
  return (
    <div className="w-full">
      {label(s.label)}
      <div className="scrollbar-slim overflow-x-auto">
        <table className="border-separate border-spacing-1">
          <thead>
            {s.colLabels?.length ? (
              <tr>
                <th />
                {s.rows[0].map((_, c) => (
                  <th key={c} className="pb-0.5 font-mono text-[9px] font-medium text-ink/30">
                    {s.colLabels?.[c] ?? c}
                  </th>
                ))}
              </tr>
            ) : null}
          </thead>
          <tbody>
            {s.rows.map((row, r) => (
              <tr key={r}>
                <td className="pr-1 text-right font-mono text-[9px] text-ink/30">{s.rowLabels?.[r] ?? r}</td>
                {row.map((v, c) => {
                  const h = s.highlights?.find((x) => x.r === r && x.c === c);
                  return (
                    <td key={c}>
                      <div
                        className={`grid h-9 min-w-[38px] place-items-center rounded-[6px] border px-1.5 font-mono text-[12px] font-semibold transition-all duration-300 ${tone(
                          h?.kind,
                        )}`}
                      >
                        {v === null ? "·" : String(v)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function LinkedListView({ s }: { s: Extract<VizStructure, { type: "linkedlist" }> }) {
  return (
    <div className="w-full">
      {label(s.label)}
      <div className="scrollbar-slim overflow-x-auto pb-1">
        <div className="flex min-w-max items-center gap-1">
          {s.nodes.map((n, i) => {
            const ptrs = (s.pointers ?? []).filter((p) => p.nodeId === n.id);
            return (
              <div key={n.id} className="flex items-center gap-1">
                <div className="flex flex-col items-center">
                  <div className="flex h-6 flex-col justify-end">
                    {ptrs.map((p) => (
                      <span key={p.name} className="rounded bg-violet px-1.5 py-[1px] text-[9px] font-bold text-white">
                        {p.name}
                      </span>
                    ))}
                  </div>
                  <div
                    className={`grid h-11 min-w-[46px] place-items-center rounded-[8px] border font-mono text-[13px] font-semibold transition-all duration-300 ${tone(
                      n.highlight,
                    )}`}
                  >
                    {n.value === null ? "·" : String(n.value)}
                  </div>
                  {n.note ? <span className="mt-1 text-[9px] text-ink/40">{n.note}</span> : null}
                </div>
                {i < s.nodes.length - 1 ? (
                  <span className="mb-4 text-[13px] text-ink/30">→</span>
                ) : (
                  <span className="mb-4 font-mono text-[10px] text-ink/30">{s.cycle ? "⟲" : "∅"}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      {s.cycle ? <p className="mt-2 text-[10px] text-ink/45">cycle: tail points back into the list</p> : null}
    </div>
  );
}

const NODE_FILL: Record<HighlightKind, string> = {
  active: "#6a3bf0",
  compare: "#ef9080",
  match: "#b9e04e",
  window: "#efe9ff",
  visited: "#dfe3e8",
  sorted: "#e8f5c6",
  muted: "#f3f3f5",
  target: "#ffd9d2",
  path: "#e8f5c6",
  rejected: "#f3f3f5",
};

function nodeFills(kind?: HighlightKind) {
  const fill = kind ? NODE_FILL[kind] : "#ffffff";
  const dark = kind === "active";
  return { fill, text: dark ? "#ffffff" : "#2f343c", stroke: kind === "active" ? "#4d21c9" : "#d9dce1" };
}

function TreeView({ s }: { s: Extract<VizStructure, { type: "tree" }> }) {
  const map = new Map(s.nodes.map((n) => [n.id, n]));
  const positions = new Map<string, { x: number; y: number }>();
  const R = 19;
  const DX = 52;
  const DY = 62;
  const PAD = 26;
  let cursor = 0;
  let maxDepth = 0;

  const walk = (id: string | null | undefined, depth: number, seen: Set<string>) => {
    if (!id || seen.has(id)) return;
    const node = map.get(id);
    if (!node) return;
    seen.add(id);
    walk(node.left ?? undefined, depth + 1, seen);
    positions.set(id, { x: PAD + cursor * DX, y: PAD + depth * DY });
    cursor += 1;
    maxDepth = Math.max(maxDepth, depth);
    walk(node.right ?? undefined, depth + 1, seen);
  };
  walk(s.root, 0, new Set());

  const width = Math.max(PAD * 2 + cursor * DX, 200);
  const height = Math.max(PAD * 2 + maxDepth * DY, 120);
  const rootPos = positions.get(s.root);
  if (!rootPos) return null;

  return (
    <div className="w-full">
      {label(s.label)}
      <div className="scrollbar-slim overflow-x-auto">
        <svg width={width} height={height} className="min-w-full" role="img" aria-label="tree diagram">
          {s.nodes.map((n) => {
            const from = positions.get(n.id);
            if (!from) return null;
            return [n.left, n.right].map((childId, idx) => {
              if (!childId) return null;
              const to = positions.get(childId);
              if (!to) return null;
              return (
                <line
                  key={`${n.id}-${idx}`}
                  x1={from.x}
                  y1={from.y + R}
                  x2={to.x}
                  y2={to.y - R}
                  stroke="#d9dce1"
                  strokeWidth={1.6}
                />
              );
            });
          })}
          {s.nodes.map((n) => {
            const p = positions.get(n.id);
            if (!p) return null;
            const c = nodeFills(n.highlight);
            const ptr = (s.pointers ?? []).filter((x) => x.nodeId === n.id);
            return (
              <g key={n.id}>
                {ptr.length ? (
                  <text x={p.x} y={p.y - R - 7} textAnchor="middle" className="fill-violet text-[9px] font-bold">
                    {ptr.map((x) => x.name).join(", ")}
                  </text>
                ) : null}
                <circle cx={p.x} cy={p.y} r={R} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill={c.text} className="font-mono text-[11px] font-semibold">
                  {n.value === null ? "·" : String(n.value)}
                </text>
                {n.note ? (
                  <text x={p.x} y={p.y + R + 12} textAnchor="middle" className="fill-[#9aa1ab] text-[8.5px]">
                    {n.note}
                  </text>
                ) : null}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function GraphView({ s }: { s: Extract<VizStructure, { type: "graph" }> }) {
  const n = s.nodes.length;
  const R = 19;
  const SIZE = Math.max(280, Math.min(460, 70 + n * 44));
  const center = SIZE / 2;
  const radius = Math.max(60, center - 46);
  const positions = new Map<string, { x: number; y: number }>();

  s.nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    positions.set(node.id, { x: center + radius * Math.cos(angle), y: center + radius * Math.sin(angle) });
  });

  return (
    <div className="w-full">
      {label(s.label)}
      <div className="flex justify-center">
        <svg width={SIZE} height={SIZE} role="img" aria-label="graph diagram">
          <defs>
            <marker id="viz-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#b9bfc7" />
            </marker>
            <marker id="viz-arrow-hot" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6a3bf0" />
            </marker>
          </defs>
          {s.edges.map((e, i) => {
            const from = positions.get(e.from);
            const to = positions.get(e.to);
            if (!from || !to) return null;
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const len = Math.hypot(dx, dy) || 1;
            const ux = dx / len;
            const uy = dy / len;
            const directed = e.directed ?? s.directed;
            const x1 = from.x + ux * R;
            const y1 = from.y + uy * R;
            const x2 = to.x - ux * (R + 4);
            const y2 = to.y - uy * (R + 4);
            const hot = e.highlight === "active" || e.highlight === "path" || e.highlight === "compare";
            return (
              <g key={`e${i}`}>
                <line
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={hot ? "#6a3bf0" : "#d3d7dd"}
                  strokeWidth={hot ? 2.6 : 1.6}
                  markerEnd={directed ? (hot ? "url(#viz-arrow-hot)" : "url(#viz-arrow)") : undefined}
                />
                {e.weight !== undefined ? (
                  <text
                    x={(x1 + x2) / 2}
                    y={(y1 + y2) / 2 - 4}
                    textAnchor="middle"
                    className="fill-[#8a929d] text-[9px] font-semibold"
                  >
                    {String(e.weight)}
                  </text>
                ) : null}
              </g>
            );
          })}
          {s.nodes.map((node) => {
            const p = positions.get(node.id);
            if (!p) return null;
            const c = nodeFills(node.highlight);
            const ptr = (s.pointers ?? []).filter((x) => x.nodeId === node.id);
            return (
              <g key={node.id}>
                {ptr.length ? (
                  <text x={p.x} y={p.y - R - 7} textAnchor="middle" className="fill-violet text-[9px] font-bold">
                    {ptr.map((x) => x.name).join(", ")}
                  </text>
                ) : null}
                <circle cx={p.x} cy={p.y} r={R} fill={c.fill} stroke={c.stroke} strokeWidth={1.5} />
                <text x={p.x} y={p.y + 4} textAnchor="middle" fill={c.text} className="font-mono text-[10.5px] font-semibold">
                  {String(node.value ?? node.id)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

function StackView({ s }: { s: Extract<VizStructure, { type: "stack" }> }) {
  return (
    <div className="flex flex-col items-center">
      {label(s.label)}
      <div className="flex flex-col-reverse items-stretch gap-1">
        {s.values.map((v, i) => {
          const h = s.highlights?.find((x) => x.index === i);
          const isTop = i === s.values.length - 1;
          return (
            <div key={i} className="flex items-center gap-2">
              <div
                className={`grid h-9 w-24 place-items-center rounded-[6px] border font-mono text-[12px] font-semibold transition-all duration-300 ${tone(
                  h?.kind,
                )}`}
              >
                {v === null ? "·" : String(v)}
              </div>
              {isTop ? <span className="text-[9px] font-bold uppercase tracking-wide text-violet">top</span> : null}
            </div>
          );
        })}
      </div>
      <div className="mt-1 h-1.5 w-28 rounded-full bg-ink/15" />
      {s.values.length === 0 ? <span className="mt-2 text-[11px] text-ink/35">empty</span> : null}
      {s.note ? <p className="mt-2 text-[10px] text-ink/45">{s.note}</p> : null}
    </div>
  );
}

function QueueView({ s }: { s: Extract<VizStructure, { type: "queue" }> }) {
  return (
    <div className="w-full">
      {label(s.label)}
      <div className="scrollbar-slim overflow-x-auto pb-1">
        <div className="flex min-w-max items-end gap-1.5">
          {s.values.map((v, i) => {
            const h = s.highlights?.find((x) => x.index === i);
            return (
              <div key={i} className="flex flex-col items-center">
                <span className="mb-1 h-4 text-[9px] font-bold uppercase tracking-wide text-violet">
                  {i === 0 ? "front" : i === s.values.length - 1 ? "back" : ""}
                </span>
                <div
                  className={`grid h-11 min-w-[44px] place-items-center rounded-[8px] border px-2 font-mono text-[12px] font-semibold transition-all duration-300 ${tone(
                    h?.kind,
                  )}`}
                >
                  {v === null ? "·" : String(v)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {s.values.length === 0 ? <span className="text-[11px] text-ink/35">empty</span> : null}
      {s.note ? <p className="mt-2 text-[10px] text-ink/45">{s.note}</p> : null}
    </div>
  );
}

function HashmapView({ s }: { s: Extract<VizStructure, { type: "hashmap" }> }) {
  return (
    <div className="w-full">
      {label(s.label)}
      <div className="flex flex-wrap gap-1.5">
        {s.entries.length === 0 ? <span className="text-[11px] text-ink/35">empty map</span> : null}
        {s.entries.map((e, i) => (
          <span
            key={i}
            className={`flex items-center gap-1 rounded-[7px] border px-2 py-1 font-mono text-[11px] font-semibold transition-all duration-300 ${
              e.highlight === "match"
                ? "border-lime-deep bg-lime/25 text-ink"
                : e.highlight === "active"
                  ? "border-violet bg-violet text-white"
                  : e.highlight === "compare"
                    ? "border-coral bg-coral/20 text-ink"
                    : "border-line bg-white text-ink"
            }`}
          >
            <span className="opacity-55">{String(e.key)}</span>
            <span className="opacity-25">:</span>
            <span>{String(e.value)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function StatesView({ s }: { s: Extract<VizStructure, { type: "states" }> }) {
  return (
    <div className="w-full">
      {label(s.label)}
      <div className="grid gap-1.5 sm:grid-cols-2">
        {s.entries.map((e, i) => (
          <div
            key={i}
            className={`flex items-baseline justify-between gap-3 rounded-[7px] border px-2.5 py-1.5 font-mono text-[11px] ${
              e.highlight === "active" ? "border-violet/50 bg-violet/8" : "border-line bg-white"
            }`}
          >
            <span className="text-ink/50">{e.name}</span>
            <span className="font-semibold text-ink">{String(e.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function VizBlock({ structure }: { structure: VizStructure }) {
  switch (structure.type) {
    case "array":
      return <ArrayView s={structure} />;
    case "matrix":
      return <MatrixView s={structure} />;
    case "linkedlist":
      return <LinkedListView s={structure} />;
    case "tree":
      return <TreeView s={structure} />;
    case "graph":
      return <GraphView s={structure} />;
    case "stack":
      return <StackView s={structure} />;
    case "queue":
      return <QueueView s={structure} />;
    case "hashmap":
      return <HashmapView s={structure} />;
    case "states":
      return <StatesView s={structure} />;
    default:
      return null;
  }
}

export function VizStage({ structures, vars }: { structures: VizStructure[]; vars?: { name: string; value: unknown }[] }) {
  return (
    <div className="flex h-full w-full flex-col justify-center gap-5">
      <div className={`grid gap-4 ${structures.length > 1 ? "sm:grid-cols-2" : ""}`}>
        {structures.map((s, i) => (
          <div key={i}>
            <VizBlock structure={s} />
          </div>
        ))}
      </div>
      {vars?.length ? (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-line/70 pt-3">
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-ink/35">state</span>
          {vars.map((v) => (
            <span key={v.name} className="rounded-[6px] bg-white px-2 py-1 font-mono text-[10.5px] ring-1 ring-line">
              <span className="text-ink/45">{v.name}</span>
              <span className="mx-1 text-ink/25">=</span>
              <span className="font-semibold text-ink">{String(v.value)}</span>
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
