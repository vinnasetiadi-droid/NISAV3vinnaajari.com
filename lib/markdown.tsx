import React from "react";

/** Tiny markdown renderer: headings, bold/italic/code, lists, fenced code, links. */

function inline(text: string, keyBase: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const k = `${keyBase}-${i++}`;
    if (tok.startsWith("**"))
      out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`"))
      out.push(
        <code
          key={k}
          className="rounded-md bg-slate-900/[0.07] px-1.5 py-0.5 font-mono text-[0.85em] dark:bg-white/10"
        >
          {tok.slice(1, -1)}
        </code>
      );
    else if (tok.startsWith("["))
      out.push(
        <a
          key={k}
          href={tok.match(/\(([^)]+)\)/)?.[1]}
          target="_blank"
          rel="noreferrer"
          className="text-brand-600 underline underline-offset-2 dark:text-brand-300"
        >
          {tok.match(/\[([^\]]+)\]/)?.[1]}
        </a>
      );
    else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Markdown({ text }: { text: string }) {
  const blocks: React.ReactNode[] = [];
  const lines = text.split("\n");
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("```")) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      blocks.push(
        <pre
          key={key++}
          className="nice-scroll my-2 overflow-x-auto rounded-xl bg-slate-900 p-4 font-mono text-[12.5px] leading-relaxed text-slate-100 dark:bg-black/50"
        >
          {buf.join("\n")}
        </pre>
      );
      continue;
    }

    if (/^#{1,3}\s/.test(line)) {
      const level = (line.match(/^#+/) as RegExpMatchArray)[0].length;
      const content = line.replace(/^#+\s*/, "");
      blocks.push(
        <div
          key={key++}
          className={
            level === 1
              ? "mb-1 mt-3 font-display text-xl font-semibold"
              : level === 2
              ? "mb-1 mt-3 font-display text-lg font-semibold"
              : "mb-0.5 mt-2 text-[15px] font-semibold"
          }
        >
          {inline(content, `h${key}`)}
        </div>
      );
      i++;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*[-*]\s+/, ""));
        i++;
      }
      blocks.push(
        <ul key={key++} className="my-1.5 space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j} className="list-disc marker:text-slate-400">
              {inline(it, `li${key}-${j}`)}
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s*\d+[.)]\s+/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-1.5 space-y-1 pl-5">
          {items.map((it, j) => (
            <li key={j} className="list-decimal marker:text-slate-400">
              {inline(it, `ol${key}-${j}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    if (line.trim() === "") {
      i++;
      continue;
    }

    // paragraph: gather until blank
    const buf: string[] = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^(#{1,3}\s|```|\s*[-*]\s+|\s*\d+[.)]\s+)/.test(lines[i])
    ) {
      buf.push(lines[i]);
      i++;
    }
    blocks.push(
      <p key={key++} className="my-1.5 leading-[1.7]">
        {buf.map((b, j) => (
          <React.Fragment key={j}>
            {j > 0 && <br />}
            {inline(b, `p${key}-${j}`)}
          </React.Fragment>
        ))}
      </p>
    );
  }

  return <div className="text-[14.5px]">{blocks}</div>;
}
