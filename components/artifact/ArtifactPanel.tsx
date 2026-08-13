"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Code2,
  Download,
  ExternalLink,
  Maximize2,
  Minimize2,
  Pencil,
  Printer,
  X,
} from "lucide-react";
import { MenuShell, useOutside, useToast } from "@/components/ui";
import { useDB } from "@/lib/store";
import { cn, downloadText } from "@/lib/utils";

type View = "preview" | "code" | "editor";

export function ArtifactPanel({
  artifactId,
  onClose,
  floating,
  expanded,
  onToggleExpand,
}: {
  artifactId: string;
  onClose: () => void;
  floating?: boolean;
  expanded?: boolean;
  onToggleExpand?: () => void;
}) {
  const theme = useDB((s) => s.theme);
  const artifact = useDB((s) =>
    s.d().artifacts.find((a) => a.id === artifactId)
  );
  const addVersion = useDB((s) => s.addArtifactVersion);
  const toast = useToast();
  const [view, setView] = useState<View>("preview");
  const [vIdx, setVIdx] = useState<number>(-1); // -1 = latest
  const [vMenu, setVMenu] = useState(false);
  const [draft, setDraft] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const menuRef = useOutside(() => setVMenu(false));

  const versions = artifact?.versions || [];
  const idx = vIdx === -1 ? versions.length - 1 : vIdx;
  const html = versions[idx]?.html || "";

  useEffect(() => {
    setView("preview");
    setVIdx(-1);
  }, [artifactId]);

  const fileName = useMemo(
    () =>
      (artifact?.title || "artifact").replace(/[^\w\s-]/g, "").trim() + ".html",
    [artifact?.title]
  );

  if (!artifact) return null;

  return (
    <div
      /* chrome ikut tema: putih di light, gelap ala Claude di dark */
      className={cn(
        "flex min-w-0 flex-col overflow-hidden bg-white text-slate-700 dark:bg-[#0b0e14] dark:text-slate-200",
        floating
          ? "h-full w-full rounded-3xl border border-slate-200 dark:border-white/10"
          : "panel-in h-full flex-1 rounded-[26px] border border-slate-200/80 shadow-glass dark:border-white/10 dark:shadow-glass-dark"
      )}
    >
      {/* header */}
      <div className="flex items-center gap-3 border-b border-slate-200/70 px-4 py-2.5 dark:border-white/10">
        <span className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">
          Artifact
        </span>
        <span className="max-w-[220px] truncate text-[12.5px] text-slate-400">
          {artifact.title}
        </span>
        <div className="flex-1" />
        {onToggleExpand && (
          <button
            title={expanded ? "Minimize" : "Expand"}
            onClick={onToggleExpand}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
          >
            {expanded ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        )}
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
        >
          <X size={17} />
        </button>
      </div>

      {/* toolbar */}
      <div
        ref={menuRef}
        className="relative flex items-center gap-1.5 border-b border-slate-200/70 px-3 py-2 text-[12.5px] dark:border-white/10"
      >
        <button
          onClick={() => setVMenu(!vMenu)}
          className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-[12px] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
        >
          v{idx + 1}
          {versions.length > 1 && <ChevronDown size={12} />}
        </button>
        {vMenu && versions.length > 1 && (
          <MenuShell className="left-3 top-10 w-[160px] p-1.5">
            {versions.map((v, i) => (
              <button
                key={i}
                onClick={() => {
                  setVIdx(i === versions.length - 1 ? -1 : i);
                  setVMenu(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left font-mono text-[12px] text-slate-600 hover:bg-brand-500/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                v{i + 1}
                {i === idx && <Check size={12} className="text-brand-500" />}
              </button>
            ))}
          </MenuShell>
        )}

        <ToolBtn
          active={view === "editor"}
          onClick={() => {
            setDraft(html);
            setView(view === "editor" ? "preview" : "editor");
          }}
        >
          <Pencil size={13} /> Edit
        </ToolBtn>
        <ToolBtn
          active={view === "code"}
          onClick={() => setView(view === "code" ? "preview" : "code")}
        >
          <Code2 size={13} /> HTML
        </ToolBtn>

        <div className="flex-1" />

        <ToolBtn
          onClick={() => iframeRef.current?.contentWindow?.print()}
        >
          <Printer size={13} />
        </ToolBtn>
        <ToolBtn
          onClick={() => {
            const blob = new Blob([html], { type: "text/html" });
            window.open(URL.createObjectURL(blob), "_blank");
          }}
        >
          <ExternalLink size={13} />
        </ToolBtn>
        <ToolBtn onClick={() => downloadText(fileName, html)}>
          <Download size={13} />
        </ToolBtn>
      </div>

      {/* body */}
      <div className="min-h-0 flex-1 bg-slate-50/70 dark:bg-black/20">
        {view === "preview" && (
          /* beri jarak antara konten artifact dan bingkai panel */
          <div className="h-full p-4">
            <iframe
              ref={iframeRef}
              title={artifact.title}
              srcDoc={
                theme === "dark"
                  ? html.replace("<body", '<body data-theme="dark"')
                  : html
              }
              sandbox="allow-scripts allow-same-origin allow-modals allow-popups"
              className="h-full w-full rounded-xl border border-slate-200 bg-white dark:border-white/10"
            />
          </div>
        )}
        {view === "code" && (
          <pre className="nice-scroll h-full overflow-auto p-4 font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300">
            {html}
          </pre>
        )}
        {view === "editor" && (
          <div className="flex h-full flex-col">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="nice-scroll min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-[12px] leading-relaxed text-slate-700 dark:text-slate-300"
            />
            <div className="flex justify-end gap-2 border-t border-slate-200/70 p-3 dark:border-white/10">
              <button
                onClick={() => setView("preview")}
                className="rounded-full px-4 py-1.5 text-[12.5px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  addVersion(artifact.id, draft);
                  setVIdx(-1);
                  setView("preview");
                  toast(`Saved as v${versions.length + 1}`);
                }}
                className="btn-gradient rounded-full px-5 py-1.5 text-[12.5px] font-semibold"
              >
                Save as v{versions.length + 1}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ToolBtn({
  children,
  onClick,
  active,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-white/10",
        active &&
          "bg-brand-500/15 text-brand-600 dark:bg-brand-500/25 dark:text-brand-300"
      )}
    >
      {children}
    </button>
  );
}
