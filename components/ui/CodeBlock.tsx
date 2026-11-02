"use client";

import { useState } from "react";
import { Check, Copy } from "./Icons";

const KEYWORDS = new Set([
  "def","class","return","if","elif","else","for","while","in","not","and","or","is","None","True","False","import","from","as","with","try","except","finally","raise","yield","lambda","pass","break","continue","self","int","str","bool","float","list","dict","set","tuple","len","range","enumerate","zip","print","sorted","min","max","sum","abs","any","all","map","filter","append","pop","get","add","heappush","heappop","deque","defaultdict","Counter","inf","function","const","let","var","new","this","typeof","null","undefined","true","false","public","private","protected","static","final","void","boolean","char","double","long","short","byte","String","Integer","List","ArrayList","HashMap","HashSet","Map","Set","Queue","Deque","Stack","PriorityQueue","ArrayDeque","Arrays","Collections","string","vector","auto","struct","nullptr","unordered_map","unordered_set","priority_queue","pair","make_pair","size_t","unsigned","long long","template","typename","std","emplace_back","push_back","back","front","pop_back","swap","sort","reverse","begin","end","uint32_t","uint8_t","interface","implements","extends","enum","case","switch","default","do","goto","using","namespace","include","func","defer","chan","go","range","map[string]int","nil","panic","var",
]);

type Token = { text: string; cls?: string };

function tokenizeLine(line: string): Token[] {
  const trimmed = line.trimStart();
  if ((trimmed.startsWith("#") && !trimmed.startsWith("#include")) || trimmed.startsWith("//") || trimmed.startsWith("--")) {
    return [{ text: line, cls: "tok-com" }];
  }

  const tokens: Token[] = [];
  const regex =
    /(\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;

  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) tokens.push({ text: line.slice(last, match.index) });
    const [full, comment, str, num, word] = match;
    if (comment) tokens.push({ text: full, cls: "tok-com" });
    else if (str) tokens.push({ text: full, cls: "tok-str" });
    else if (num) tokens.push({ text: full, cls: "tok-num" });
    else if (word) {
      const next = line.slice(match.index + full.length).trimStart();
      const isCall = next.startsWith("(") && !KEYWORDS.has(word);
      tokens.push({ text: full, cls: KEYWORDS.has(word) ? "tok-key" : isCall ? "tok-fn" : undefined });
    } else tokens.push({ text: full });
    last = match.index + full.length;
  }
  if (last < line.length) tokens.push({ text: line.slice(last) });
  return tokens;
}

export function CodeBlock({
  code,
  language,
  maxHeight = "460px",
}: {
  code: string;
  language?: string;
  maxHeight?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\s+$/, "").split("\n");

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-[14px] bg-[#24282f]">
      <div className="flex items-center justify-between border-b border-white/8 px-3.5 py-2">
        <span className="font-mono text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/35">
          {language ?? "code"}
        </span>
        <button
          type="button"
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[10px] font-semibold text-white/45 transition hover:bg-white/8 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3 text-lime" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className="scrollbar-slim code-surface overflow-auto px-3 py-3 text-[11.8px] leading-[1.7]"
        style={{ maxHeight }}
      >
        <code>
          {lines.map((line, i) => (
            <div key={i} className="flex gap-3">
              <span className="w-5 shrink-0 select-none text-right font-mono text-white/20">{i + 1}</span>
              <span className="whitespace-pre">
                {tokenizeLine(line).map((t, j) => (
                  <span key={j} className={t.cls}>
                    {t.text}
                  </span>
                ))}
              </span>
            </div>
          ))}
        </code>
      </pre>
    </div>
  );
}
