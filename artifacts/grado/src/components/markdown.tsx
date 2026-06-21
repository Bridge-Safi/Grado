import React from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

function parseInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2]) nodes.push(<strong key={key++} className="font-bold text-white"><em>{m[2]}</em></strong>);
    else if (m[3]) nodes.push(<strong key={key++} className="font-semibold text-white">{m[3]}</strong>);
    else if (m[4]) nodes.push(<em key={key++} className="italic text-[#C8C8E8]">{m[4]}</em>);
    else if (m[5]) nodes.push(<code key={key++} className="px-1.5 py-0.5 rounded bg-[#1e1e2e] text-[#a0a0ff] font-mono text-[0.85em] border border-[#2a2a3a]">{m[5]}</code>);
    else if (m[6]) nodes.push(<a key={key++} href={m[7]} target="_blank" rel="noopener noreferrer" className="text-[#7B7BFF] underline underline-offset-2 hover:text-[#a0a0ff]">{m[6]}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function parseTable(lines: string[]): React.ReactNode | null {
  if (lines.length < 2) return null;
  const sep = lines[1];
  if (!/^\|?[\s\-:]+(\|[\s\-:]+)*\|?$/.test(sep.trim())) return null;
  const parseRow = (line: string) =>
    line.replace(/^\||\|$/g, "").split("|").map(c => c.trim());
  const headers = parseRow(lines[0]);
  const rows = lines.slice(2).map(parseRow);
  return (
    <div className="overflow-x-auto my-3 rounded-xl border border-[#2a2a38]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-[#1a1a28]">
            {headers.map((h, i) => (
              <th key={i} className="px-4 py-2.5 text-left font-semibold text-[#C8C8E8] border-b border-[#2a2a38] whitespace-nowrap">
                {parseInline(h)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={ri % 2 === 0 ? "bg-[#050505]" : "bg-[#13131c]"}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-2 text-[#C0C0D8] border-b border-[#1e1e2a] last:border-b-0">
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type Block =
  | { type: "h1" | "h2" | "h3" | "h4"; text: string }
  | { type: "hr" }
  | { type: "blockquote"; text: string }
  | { type: "code"; lang: string; code: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "table"; lines: string[] }
  | { type: "paragraph"; text: string };

function parseBlocks(markdown: string): Block[] {
  const blocks: Block[] = [];
  const lines = markdown.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // closing ```
      blocks.push({ type: "code", lang, code: codeLines.join("\n") });
      continue;
    }

    // HR
    if (/^[\-\*_]{3,}\s*$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Headers
    const h1 = line.match(/^#\s+(.+)/);
    const h2 = line.match(/^##\s+(.+)/);
    const h3 = line.match(/^###\s+(.+)/);
    const h4 = line.match(/^####\s+(.+)/);
    if (h4) { blocks.push({ type: "h4", text: h4[1] }); i++; continue; }
    if (h3) { blocks.push({ type: "h3", text: h3[1] }); i++; continue; }
    if (h2) { blocks.push({ type: "h2", text: h2[1] }); i++; continue; }
    if (h1) { blocks.push({ type: "h1", text: h1[1] }); i++; continue; }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join("\n") });
      continue;
    }

    // Unordered list
    if (/^[\-\*\+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[\-\*\+]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[\-\*\+]\s/, ""));
        i++;
      }
      blocks.push({ type: "ul", items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push({ type: "ol", items });
      continue;
    }

    // Table detection
    if (/^\|/.test(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      const table = parseTable(tableLines);
      if (table) {
        blocks.push({ type: "table", lines: tableLines });
      } else {
        // Not a real table, treat as paragraph
        blocks.push({ type: "paragraph", text: tableLines.join("\n") });
      }
      continue;
    }

    // Empty line — skip
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — accumulate until empty line or special block
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^[#>\-\*\+]/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^\d+\./.test(lines[i]) &&
      !/^[\-\*_]{3,}/.test(lines[i].trim()) &&
      !/^\|/.test(lines[i])
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      blocks.push({ type: "paragraph", text: paraLines.join("\n") });
    }
  }

  return blocks;
}

export function MarkdownRenderer({ content }: { content: string }) {
  const blocks = parseBlocks(content);

  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "h1":
            return <h1 key={idx} className="text-2xl font-bold text-white mt-4 mb-1 leading-tight">{parseInline(block.text)}</h1>;
          case "h2":
            return <h2 key={idx} className="text-xl font-bold text-white mt-3 mb-1 leading-tight">{parseInline(block.text)}</h2>;
          case "h3":
            return <h3 key={idx} className="text-base font-semibold text-[#E0E0FF] mt-2.5 mb-0.5 leading-tight">{parseInline(block.text)}</h3>;
          case "h4":
            return <h4 key={idx} className="text-sm font-semibold text-[#C8C8E8] mt-2 mb-0.5">{parseInline(block.text)}</h4>;
          case "hr":
            return <hr key={idx} className="border-[#2a2a38] my-3" />;
          case "blockquote":
            return (
              <blockquote key={idx} className="border-l-2 border-[#5B5BD6]/50 pl-4 my-2 text-[#9090B8] italic">
                {block.text.split("\n").map((l, j) => <p key={j}>{parseInline(l)}</p>)}
              </blockquote>
            );
          case "code":
            return <CodeBlock key={idx} language={block.lang} code={block.code} />;
          case "ul":
            return (
              <ul key={idx} className="space-y-1 pl-0">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[#C0C0D8]">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-[#5B5BD6]/60 shrink-0" />
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={idx} className="space-y-1 pl-0">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5 text-[#C0C0D8]">
                    <span className="shrink-0 min-w-[1.25rem] text-right text-[#5B5BD6] font-semibold text-xs mt-0.5">{j + 1}.</span>
                    <span>{parseInline(item)}</span>
                  </li>
                ))}
              </ol>
            );
          case "table":
            return <div key={idx}>{parseTable(block.lines)}</div>;
          case "paragraph":
            return (
              <p key={idx} className="text-[#C8C8E0] leading-relaxed">
                {block.text.split("\n").map((line, j, arr) => (
                  <React.Fragment key={j}>
                    {parseInline(line)}
                    {j < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
              </p>
            );
        }
      })}
    </div>
  );
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="rounded-xl overflow-hidden bg-[#000000] border border-[#2a2a38] my-2">
      <div className="flex items-center justify-between px-4 py-2 bg-[#050505] border-b border-[#2a2a38]">
        <span className="text-xs text-[#8888A8] font-mono">{language || "code"}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-[#8888A8] hover:text-white" onClick={handleCopy}>
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
        </Button>
      </div>
      <div className="p-4 overflow-x-auto text-xs font-mono text-[#E8E8F0] leading-relaxed">
        <pre><code>{code}</code></pre>
      </div>
    </div>
  );
}
