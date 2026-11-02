const HEADING = /^(example\s*\d+[a-z]?|constraints?|follow[- ]?up|note|explanation|hint[s]?)\b[^.]{0,40}$/i;

type Block =
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "code"; text: string }
  | { kind: "h"; text: string };

export function parseProse(text: string): Block[] {
  const lines = (text ?? "").split("\n");
  const blocks: Block[] = [];
  let para: string[] = [];
  let bullets: string[] = [];
  let code: string[] | null = null;

  const flushPara = () => {
    const joined = para.join("\n").trim();
    if (joined) blocks.push({ kind: "p", text: joined });
    para = [];
  };
  const flushBullets = () => {
    if (bullets.length) blocks.push({ kind: "ul", items: bullets });
    bullets = [];
  };
  const flushAll = () => {
    flushPara();
    flushBullets();
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");

    if (line.trim().startsWith("```")) {
      if (code) {
        blocks.push({ kind: "code", text: code.join("\n").trim() });
        code = null;
      } else {
        flushAll();
        code = [];
      }
      continue;
    }
    if (code) {
      code.push(raw);
      continue;
    }
    if (!line.trim()) {
      flushAll();
      continue;
    }
    if (/^\s*•/.test(line)) {
      flushPara();
      bullets.push(line.replace(/^\s*•\s?/, ""));
      continue;
    }
    if (HEADING.test(line.trim())) {
      flushAll();
      blocks.push({ kind: "h", text: line.trim() });
      continue;
    }
    flushBullets();
    para.push(line);
  }

  flushAll();
  if (code) blocks.push({ kind: "code", text: code.join("\n").trim() });

  return blocks;
}

export function Prose({ text, className = "" }: { text: string; className?: string }) {
  const blocks = parseProse(text);

  return (
    <div className={`text-[13px] leading-[1.72] text-ink/75 ${className}`}>
      {blocks.map((block, i) => {
        if (block.kind === "code") {
          return (
            <pre
              key={i}
              className="scrollbar-slim my-3 overflow-x-auto rounded-[10px] border border-line bg-mist/70 px-3.5 py-3 font-mono text-[11.5px] leading-relaxed text-ink/80"
            >
              {block.text}
            </pre>
          );
        }
        if (block.kind === "h") {
          return (
            <p key={i} className="mt-4 mb-1 text-[12.5px] font-extrabold tracking-tight text-ink first:mt-0">
              {block.text}
            </p>
          );
        }
        if (block.kind === "ul") {
          return (
            <ul key={i} className="my-2 space-y-1">
              {block.items.map((item, j) => (
                <li key={j} className="flex gap-2">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-violet/60" />
                  <span className="min-w-0">{item}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="my-2 whitespace-pre-wrap first:mt-0">
            {block.text}
          </p>
        );
      })}
    </div>
  );
}
