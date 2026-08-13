"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowUp,
  Bot,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  FlaskConical,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Mic,
  Paperclip,
  Plus,
  Puzzle,
  Scale,
  Send,
  Settings2,
  Sparkles,
  Square,
  X,
  Zap,
} from "lucide-react";
import { MenuShell, useOutside, useToast } from "@/components/ui";
import { GradSparkle } from "@/components/GradSparkle";
import { COMMANDS, MODES, TEMPLATES } from "@/lib/registry";
import { useDB } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { ModeId } from "@/lib/types";

export interface PendingFile {
  name: string;
  size: number;
  mime: string;
  text?: string;
  dataUrl?: string;
}

interface Props {
  placeholder: string;
  streaming?: boolean;
  onSend: (text: string, files: PendingFile[]) => void;
  onStop?: () => void;
  mode: ModeId;
  onMode: (m: ModeId) => void;
  showHints?: boolean;
  autoFocus?: boolean;
  inputId?: string;
  /** "pill" (default, dipakai di chat) atau "panel" (dashboard) */
  variant?: "pill" | "panel";
  /** teks awal (mis. prompt bawaan dari landing) */
  initialText?: string;
}

/** Satu menu gabungan (mode + templates + recent) + menu model. */
type Pop = null | "plus" | "plus-modes" | "plus-templates" | "modes-pill";

const MODE_ICONS: Record<ModeId, import("lucide-react").LucideIcon> = {
  auto: Sparkles,
  brainstorm: Lightbulb,
  comprehensive: Scale,
  deep: FlaskConical,
  plan: ListChecks,
  ringkas: Zap,
  socratic: GraduationCap,
};

/** Baris menu ala ChatGPT: icon + judul tebal + deskripsi abu satu baris. */
function PlusRow({
  icon,
  title,
  desc,
  right,
  highlight,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc?: string;
  right?: React.ReactNode;
  highlight?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition hover:bg-slate-900/[0.05] dark:hover:bg-white/[0.07]",
        highlight && "bg-slate-900/[0.05] dark:bg-white/[0.07]"
      )}
    >
      <span className="shrink-0 text-slate-700 dark:text-slate-200">{icon}</span>
      <span className="shrink-0 whitespace-nowrap text-[14px] font-medium text-slate-800 dark:text-slate-100">
        {title}
      </span>
      {desc && (
        <span className="min-w-0 flex-1 truncate text-[13.5px] text-slate-400">
          {desc}
        </span>
      )}
      {right && <span className="ml-auto shrink-0">{right}</span>}
    </button>
  );
}

function BackRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="mb-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-slate-500 transition hover:bg-slate-900/[0.04] dark:text-slate-400 dark:hover:bg-white/5"
    >
      <ChevronLeft size={15} /> {label}
    </button>
  );
}

export function ChatInput({
  placeholder,
  streaming,
  onSend,
  onStop,
  mode,
  onMode,
  showHints,
  autoFocus,
  inputId,
  variant = "pill",
  initialText,
}: Props) {
  const [text, setText] = useState(initialText ?? "");
  const [files, setFiles] = useState<PendingFile[]>([]);
  const [pop, setPop] = useState<Pop>(null);
  const [slashIdx, setSlashIdx] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recent = useDB((s) => s.d().recent);
  const drive = useDB((s) => s.d());
  const toast = useToast();
  const closePop = useCallback(() => setPop(null), []);
  const popRef = useOutside(closePop);

  // slash menu
  const slashMatch = text.match(/^\/([\w-]*)$/);
  const slashItems = useMemo(() => {
    if (!slashMatch) return [];
    const q = slashMatch[1].toLowerCase();
    return COMMANDS.filter((c) => c.id.includes(q));
  }, [slashMatch]);

  // @ mention menu
  const mentionMatch = text.match(/@([\w-]*)$/);
  const mentionItems = useMemo(() => {
    if (!mentionMatch) return [];
    const q = mentionMatch[1].toLowerCase();
    const docs = drive.files
      .filter((f) => f.name.toLowerCase().includes(q))
      .map((f) => ({ name: f.name, type: "doc" as const }));
    const arts = drive.artifacts
      .filter((a) => a.title.toLowerCase().includes(q))
      .map((a) => ({ name: a.title, type: "artifact" as const }));
    return [...docs, ...arts].slice(0, 7);
  }, [mentionMatch, drive.files, drive.artifacts]);

  useEffect(() => setSlashIdx(0), [slashMatch?.[1]]);

  const recalcHeight = useCallback(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, []);

  useEffect(() => {
    recalcHeight();
  }, [text, recalcHeight]);

  useEffect(() => {
    window.addEventListener("resize", recalcHeight);
    return () => window.removeEventListener("resize", recalcHeight);
  }, [recalcHeight]);

  useEffect(() => {
    if (autoFocus) taRef.current?.focus();
  }, [autoFocus]);

  const doSend = () => {
    const t = text.trim();
    if (!t && files.length === 0) return;
    onSend(t, files);
    setText("");
    setFiles([]);
  };

  const pickSlash = (id: string) => {
    setText(`/${id} `);
    taRef.current?.focus();
  };

  const pickMention = (name: string) => {
    setText(text.replace(/@([\w-]*)$/, `@"${name}" `));
    taRef.current?.focus();
  };

  const addFiles = async (list: FileList | null) => {
    if (!list) return;
    const out: PendingFile[] = [...files];
    for (const f of Array.from(list)) {
      if (f.size > 2 * 1024 * 1024) {
        alert(`${f.name} is too large (max 2 MB for local storage).`);
        continue;
      }
      const isText =
        f.type.startsWith("text/") ||
        /\.(md|txt|csv|json|html?)$/i.test(f.name);
      const entry: PendingFile = { name: f.name, size: f.size, mime: f.type || "file" };
      if (isText) entry.text = await f.text();
      else
        entry.dataUrl = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.readAsDataURL(f);
        });
      out.push(entry);
    }
    setFiles(out);
  };

  const curMode = MODES.find((m) => m.id === mode) || MODES[0];

  // /perintah di awal teks di-highlight biru (overlay di belakang textarea transparan)
  const cmdMatch = text.match(/^(\/[\w-]+)([\s\S]*)$/);
  const overlayRef = useRef<HTMLDivElement>(null);

  const textareaEl = (
    <div className="relative min-w-0 flex-1">
      <div
        ref={overlayRef}
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-slate-800 dark:text-slate-100",
          variant === "panel"
            ? "px-1 pt-0.5 text-[15px] leading-relaxed"
            : "px-2 pb-0.5 text-[14.5px] leading-relaxed"
        )}
      >
        {cmdMatch ? (
          <>
            <span className="font-medium text-brand-600 dark:text-brand-300">
              {cmdMatch[1]}
            </span>
            {cmdMatch[2]}
          </>
        ) : (
          text
        )}
      </div>
      <textarea
        id={inputId}
        ref={taRef}
        rows={1}
        value={text}
        onScroll={(e) => {
          if (overlayRef.current)
            overlayRef.current.scrollTop = e.currentTarget.scrollTop;
        }}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          const isEnter = e.key === "Enter" || e.key === "Return";
          if (slashItems.length > 0) {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setSlashIdx((i) => Math.min(i + 1, slashItems.length - 1));
              return;
            }
            if (e.key === "ArrowUp") {
              e.preventDefault();
              setSlashIdx((i) => Math.max(i - 1, 0));
              return;
            }
            if (e.key === "Tab" || (isEnter && !e.shiftKey)) {
              e.preventDefault();
              pickSlash(slashItems[slashIdx].id);
              return;
            }
            if (e.key === "Escape") {
              setText(text + " ");
              return;
            }
          }
          if (isEnter && !e.shiftKey) {
            e.preventDefault();
            if (!streaming) doSend();
          }
        }}
        placeholder={placeholder}
        className={cn(
          "nice-scroll relative max-h-[200px] w-full resize-none bg-transparent text-transparent caret-slate-800 placeholder:text-slate-400 dark:caret-slate-100 dark:placeholder:text-slate-500",
          variant === "panel"
            ? "min-h-[52px] px-1 pt-0.5 text-[15px] leading-relaxed"
            : "px-2 pb-0.5 text-[14.5px] leading-relaxed"
        )}
      />
    </div>
  );

  /* ---------- gaya tombol (touch target ≥44px) ---------- */
  const circleBtn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-300/70 bg-white/70 text-slate-500 transition hover:bg-white dark:border-white/12 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10";
  const pillBtn =
    "flex min-h-[44px] items-center gap-1.5 rounded-full border border-slate-300/70 bg-white/70 px-4 text-[13px] font-medium text-slate-600 transition hover:bg-white dark:border-white/12 dark:bg-white/[0.05] dark:text-slate-300 dark:hover:bg-white/10";

  const menuPos =
    variant === "panel" ? "bottom-[72px]" : "bottom-full mb-2";

  const sectionLabel =
    "px-3 pb-1 pt-2 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400";
  const rowCls = (active?: boolean) =>
    cn(
      "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13.5px] transition",
      active
        ? "bg-brand-500/10 font-medium text-slate-800 dark:bg-white/10 dark:text-white"
        : "text-slate-600 hover:bg-slate-900/[0.04] dark:text-slate-300 dark:hover:bg-white/5"
    );

  return (
    <div className="relative w-full">
      {/* ---------- slash menu ---------- */}
      {slashItems.length > 0 && (
        <MenuShell className="bottom-full left-0 right-0 mb-2 max-h-[300px] overflow-y-auto p-1.5 nice-scroll">
          {slashItems.map((c, i) => (
            <button
              key={c.id}
              onMouseEnter={() => setSlashIdx(i)}
              onClick={() => pickSlash(c.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left",
                i === slashIdx && "bg-brand-500/10 dark:bg-white/10"
              )}
            >
              {c.type === "AGENT" ? (
                <Bot size={16} className="shrink-0 text-slate-400" />
              ) : (
                <GradSparkle size={16} className="shrink-0" />
              )}
              <span className="font-mono text-[13px] font-medium text-slate-700 dark:text-slate-200">
                {c.id}
              </span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide",
                  c.type === "AGENT"
                    ? "bg-slate-500/15 text-slate-500 dark:bg-white/10 dark:text-slate-300"
                    : "bg-brand-500/15 text-brand-600 dark:text-brand-300"
                )}
              >
                {c.type}
              </span>
              <span className="flex-1 truncate text-right text-[12px] text-slate-400">
                {c.desc}
              </span>
            </button>
          ))}
        </MenuShell>
      )}

      {/* ---------- mention menu ---------- */}
      {mentionItems.length > 0 && (
        <MenuShell className="bottom-full left-0 mb-2 w-[340px] p-1.5">
          <div className={sectionLabel}>Drive docs</div>
          {mentionItems.map((m, i) => (
            <button
              key={i}
              onClick={() => pickMention(m.name)}
              className={rowCls()}
            >
              {m.type === "doc" ? (
                <FileText size={15} className="text-slate-400" />
              ) : (
                <GradSparkle size={15} />
              )}
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </MenuShell>
      )}

      {/* ---------- menu + (gabungan attach/tools) ala ChatGPT ---------- */}
      {pop && (
        <div ref={popRef}>
          <MenuShell
            className={cn(
              "glass-chat nice-scroll max-h-[420px] overflow-y-auto rounded-3xl p-2",
              pop === "modes-pill" ? "w-[min(400px,92vw)]" : "w-[min(440px,92vw)]",
              variant === "panel" ? "bottom-[72px]" : "bottom-[64px]",
              pop === "modes-pill" ? "right-0" : "left-0"
            )}
          >
            {pop === "plus" && (
              <>
                <PlusRow
                  highlight
                  icon={<Paperclip size={17} />}
                  title="Add photos & files"
                  desc="Upload from computer"
                  onClick={() => {
                    setPop(null);
                    fileRef.current?.click();
                  }}
                />
                <PlusRow
                  icon={<FlaskConical size={17} />}
                  title="Quiz Generator"
                  desc="Print-ready quiz with answer key"
                  onClick={() => {
                    setText("/quiz ");
                    setPop(null);
                    taRef.current?.focus();
                  }}
                />
                <PlusRow
                  icon={<Puzzle size={17} />}
                  title="Word Builder"
                  desc="Playable anagram game"
                  onClick={() => {
                    setText("/anagram ");
                    setPop(null);
                    taRef.current?.focus();
                  }}
                />
                <PlusRow
                  icon={<Settings2 size={17} />}
                  title="Response mode"
                  right={
                    <span className="flex items-center gap-1.5 text-[13px] text-slate-400">
                      {curMode.name}
                      <ChevronRight size={15} />
                    </span>
                  }
                  onClick={() => setPop("plus-modes")}
                />
                <PlusRow
                  icon={<FileText size={17} />}
                  title="Templates"
                  desc="Starter prompts to fill in"
                  right={<ChevronRight size={15} className="text-slate-400" />}
                  onClick={() => setPop("plus-templates")}
                />
                <div className="px-3 pb-1 pt-2 text-[13px] text-slate-400">
                  Type / for agents, skills &amp; tools
                </div>
              </>
            )}

            {(pop === "plus-modes" || pop === "modes-pill") && (
              <>
                {pop === "plus-modes" && (
                  <BackRow label="Response mode" onClick={() => setPop("plus")} />
                )}
                {MODES.map((m) => {
                  const Icon = MODE_ICONS[m.id];
                  return (
                    <PlusRow
                      key={m.id}
                      icon={<Icon size={16} />}
                      title={m.name}
                      desc={m.desc}
                      right={
                        m.id === mode ? (
                          <Check size={14} className="text-brand-400" />
                        ) : undefined
                      }
                      onClick={() => {
                        onMode(m.id);
                        setPop(null);
                      }}
                    />
                  );
                })}
              </>
            )}

            {pop === "plus-templates" && (
              <>
                <BackRow label="Templates" onClick={() => setPop("plus")} />
                {TEMPLATES.map((t) => (
                  <PlusRow
                    key={t.name}
                    icon={<FileText size={16} />}
                    title={t.name}
                    onClick={() => {
                      setText(t.text);
                      setPop(null);
                      taRef.current?.focus();
                    }}
                  />
                ))}
              </>
            )}

          </MenuShell>
        </div>
      )}

      {/* ---------- attachments ---------- */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((f, i) => (
            <span
              key={i}
              className="glass flex items-center gap-2 rounded-full py-1 pl-3 pr-1.5 text-[12px] text-slate-600 dark:text-slate-300"
            >
              <Paperclip size={12} />
              {f.name}
              <button
                aria-label={`Remove attachment ${f.name}`}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="rounded-full p-0.5 hover:bg-slate-900/10 dark:hover:bg-white/10"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {variant === "panel" ? (
        /* ---------- panel (dashboard): 3 zona — kiri | tools+model | send ---------- */
        <div className="glow-ring relative rounded-[20px]">
        <div className="glass-chat relative z-10 rounded-[20px] p-4">
          <div className="flex items-start gap-2.5 px-1 pt-0.5">
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="aurora-ico" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#00ffff" />
                  <stop offset="55%" stopColor="#38b6ff" />
                  <stop offset="100%" stopColor="#0a70ff" />
                </linearGradient>
              </defs>
            </svg>
            <Sparkles
              size={17}
              stroke="url(#aurora-ico)"
              fill="url(#aurora-ico)"
              className="mt-1.5 shrink-0"
            />
            {textareaEl}
          </div>
          <div className="mt-3 flex items-center gap-2">
            {/* zona kiri: attach + mic */}
            <button
              aria-label="Add & tools"
              title="Add & tools"
              onClick={() => setPop(pop ? null : "plus")}
              className={cn(
                circleBtn,
                mode !== "auto" && "border-brand-400/50 text-brand-500 dark:text-brand-300"
              )}
            >
              <Plus size={17} />
            </button>
            <button
              aria-label="Voice"
              title="Voice"
              onClick={() => toast("Voice mode coming soon 🎙")}
              className={circleBtn}
            >
              <Mic size={15} />
            </button>

            <div className="flex-1" />


            <button
              aria-label="Response mode"
              title="Response mode"
              onClick={() => setPop(pop === "modes-pill" ? null : "modes-pill")}
              className={cn(
                "flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition hover:bg-slate-900/[0.05] dark:hover:bg-white/10",
                mode !== "auto"
                  ? "text-brand-500 dark:text-brand-300"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {curMode.name}
              <ChevronDown size={13} className="opacity-60" />
            </button>
            {/* zona paling kanan: send */}
            {streaming ? (
              <button
                aria-label="Stop"
                title="Stop"
                onClick={onStop}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-slate-700 dark:bg-white dark:text-ink"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                aria-label="Send"
                title="Send"
                onClick={doSend}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0a70ff] text-white shadow-[0_0_18px_rgba(10,112,255,0.45)] transition hover:bg-[#2a84ff] active:scale-95"
              >
                <Send size={15} className="-translate-x-[1px] translate-y-[1px]" />
              </button>
            )}
          </div>
        </div>
        </div>
      ) : (
        /* ---------- pill (chat): teks di atas, 3 zona di bawah ---------- */
        <div className="glass-chat flex flex-col rounded-[24px] px-3.5 pb-2.5 pt-3">
          <div className="flex px-1">{textareaEl}</div>
          <div className="mt-1.5 flex items-center gap-1.5">
            <button
              aria-label="Add & tools"
              title="Add & tools"
              onClick={() => setPop(pop ? null : "plus")}
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full transition",
                mode !== "auto"
                  ? "text-brand-400"
                  : "text-slate-400 hover:bg-slate-900/[0.05] hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
              )}
            >
              <Plus size={18} />
            </button>
            <div className="flex-1" />
            <button
              aria-label="Response mode"
              title="Response mode"
              onClick={() => setPop(pop === "modes-pill" ? null : "modes-pill")}
              className={cn(
                "flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition hover:bg-slate-900/[0.05] dark:hover:bg-white/10",
                mode !== "auto"
                  ? "text-brand-500 dark:text-brand-300"
                  : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              )}
            >
              {curMode.name}
              <ChevronDown size={13} className="opacity-60" />
            </button>
            {streaming ? (
              <button
                aria-label="Stop"
                title="Stop"
                onClick={onStop}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink text-white transition hover:bg-slate-700 dark:bg-white dark:text-ink"
              >
                <Square size={13} fill="currentColor" />
              </button>
            ) : (
              <button
                aria-label="Send"
                title="Send"
                onClick={doSend}
                disabled={!text.trim() && files.length === 0}
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition",
                  text.trim() || files.length
                    ? "bg-[#0a70ff] text-white shadow-[0_0_18px_rgba(10,112,255,0.45)] hover:bg-[#2a84ff] active:scale-95"
                    : "bg-brand-400/40 text-white/80 hover:bg-brand-500 hover:text-white"
                )}
              >
                <ArrowUp size={17} />
              </button>
            )}
          </div>
        </div>
      )}

      {showHints && (
        <div className="mt-2 text-center text-[11.5px] text-slate-400">
          Enter to send · Shift+Enter for a new line · / for agents &amp; tools ·
          @ for drive docs
        </div>
      )}
    </div>
  );
}
