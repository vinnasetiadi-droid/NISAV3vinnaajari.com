"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  CornerUpLeft,
  Download,
  FileText,
  HelpCircle,
  Paperclip,
  Quote,
} from "lucide-react";
import { Spinner, useToast } from "@/components/ui";
import { Markdown } from "@/lib/markdown";
import { submitAnswers } from "@/lib/engine";
import { useDB } from "@/lib/store";
import { cn, downloadText } from "@/lib/utils";
import type { Message } from "@/lib/types";
import { REPLY_SUGGESTIONS } from "@/lib/registry";
import { OrbVideo } from "@/components/OrbVideo";

/* ---------------- user bubble ---------------- */

export function UserBubble({ msg }: { msg: Message }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[72%]">
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="mb-1.5 flex flex-wrap justify-end gap-1.5">
            {msg.attachments.map((a, i) => (
              <span
                key={i}
                className="glass flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] text-slate-500 dark:text-slate-300"
              >
                <Paperclip size={11} />
                {a.name}
              </span>
            ))}
          </div>
        )}
        <div className="whitespace-pre-wrap rounded-[20px] rounded-br-md bg-gradient-to-br from-brand-500 to-brand-600 px-4.5 px-5 py-3 text-[14px] leading-relaxed text-white shadow-glass">
          {msg.content}
        </div>
      </div>
    </div>
  );
}

/* ---------------- assistant ---------------- */

const THINKING_WORDS = [
  "Thinking…",
  "Menimbang…",
  "Meracik…",
  "Menyusun…",
  "Mengulik…",
  "Membayangkan…",
  "Menelaah…",
  "Memoles…",
  "Merangkai…",
  "Berkelana…",
];

export function AssistantMessage({
  msg,
  onQuote,
  onReply,
}: {
  msg: Message;
  onQuote: (t: string) => void;
  onReply: () => void;
}) {
  const toast = useToast();
  const waiting = msg.status === "pending" && !msg.content;
  const [word, setWord] = useState("Thinking…");

  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => {
      setWord((prev) => {
        let next = prev;
        while (next === prev)
          next =
            THINKING_WORDS[Math.floor(Math.random() * THINKING_WORDS.length)];
        return next;
      });
    }, 1800);
    return () => clearInterval(t);
  }, [waiting]);

  if (waiting)
    return (
      <div className="flex items-center gap-3.5 py-1">
        {/* avatar orb NISA */}
        <div className="relative h-10 w-10 shrink-0 animate-pulse overflow-hidden rounded-full bg-white [mask-image:radial-gradient(circle_closest-side,black_84%,transparent_100%)] dark:bg-[#04060b] dark:[mask-image:none] [animation-duration:2.4s]">
          <OrbVideo />
        </div>
        <div key={word} className="shimmer-text animate-rise text-[16px] font-medium">
          {word}
        </div>
      </div>
    );

  return (
    <div className="group">
      <Markdown text={msg.content} />
      {msg.statusLine && msg.status === "streaming" && (
        <div className="mt-2 flex items-center gap-2 text-[12.5px] text-slate-400">
          <Spinner className="h-3.5 w-3.5" />
          {msg.statusLine}
        </div>
      )}
      {msg.status === "stopped" && (
        <div className="mt-1 text-[12px] italic text-slate-400">
          ⏹ dihentikan
        </div>
      )}
      {msg.artifactId && <ArtifactCard artifactId={msg.artifactId} />}
      {(msg.status === "done" || msg.status === "stopped") && (
        <div className="mt-1.5 flex gap-1 opacity-0 transition group-hover:opacity-100">
          <MsgAction
            icon={<Copy size={12.5} />}
            label="Copy"
            onClick={() => {
              navigator.clipboard.writeText(msg.content);
              toast("Pesan disalin");
            }}
          />
          <MsgAction
            icon={<CornerUpLeft size={12.5} />}
            label="Reply"
            onClick={onReply}
          />
          <MsgAction
            icon={<Quote size={12.5} />}
            label="Quote"
            onClick={() => onQuote(msg.content)}
          />
        </div>
      )}
    </div>
  );
}

function MsgAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-[11.5px] text-slate-400 transition hover:bg-white/70 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
    >
      {icon}
      {label}
    </button>
  );
}

/* ---------------- artifact card ---------------- */

export function ArtifactCard({ artifactId }: { artifactId: string }) {
  const artifact = useDB((s) =>
    s.d().artifacts.find((a) => a.id === artifactId)
  );
  const setOpenArtifact = useDB((s) => s.setOpenArtifact);
  if (!artifact) return null;
  const latest = artifact.versions[artifact.versions.length - 1];

  return (
    <div className="glass mt-3 flex max-w-[440px] items-center gap-3.5 rounded-2xl p-3.5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-400 to-blue-500 text-white shadow-glass">
        <FileText size={18} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-semibold text-slate-700 dark:text-slate-200">
          {artifact.title}
        </div>
        <div className="text-[12px] text-slate-400">
          {artifact.kind === "game" ? "Game" : "Document"} artifact · Version{" "}
          {artifact.versions.length}
        </div>
      </div>
      <button
        onClick={() => setOpenArtifact(artifactId)}
        className="rounded-full border border-slate-300/70 bg-white/70 px-4 py-1.5 text-[12.5px] font-semibold text-slate-600 transition hover:bg-white dark:border-white/15 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/20"
      >
        Open
      </button>
      <button
        title="Download"
        onClick={() =>
          downloadText(
            artifact.title.replace(/[^\w\s-]/g, "").trim() + ".html",
            latest.html
          )
        }
        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-600 dark:hover:bg-white/10"
      >
        <Download size={15} />
      </button>
    </div>
  );
}

/* ---------------- elicitation card ---------------- */

export function ElicitationCard({
  convId,
  msg,
}: {
  convId: string;
  msg: Message;
}) {
  const elic = msg.elicitation!;
  const setMsgPatch = useDB((s) => s.patchMsg);
  const [step, setStep] = useState(0);
  const [hover, setHover] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [custom, setCustom] = useState("");

  const total = elic.questions.length;
  const q = elic.questions[Math.min(step, total - 1)];

  const pick = (val: string) => {
    const next = { ...answers, [q.id]: val };
    setAnswers(next);
    setCustom("");
    setHover(0);
    if (step < total - 1) {
      setStep(step + 1);
    } else {
      submitAnswers(
        convId,
        msg.id,
        elic.questions.map((qq) => ({ q: qq.q, a: next[qq.id] || qq.options[0] }))
      );
    }
  };

  if (elic.answered) return null;

  return (
    <div
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.target as HTMLElement).tagName === "INPUT") return;
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setHover((h) => Math.min(h + 1, q.options.length - 1));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setHover((h) => Math.max(h - 1, 0));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          pick(q.options[hover]);
        }
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= q.options.length) pick(q.options[n - 1]);
      }}
      className="glass mt-3 w-full rounded-3xl p-5 outline-none dark:bg-white/[0.05]"
    >
      {/* header: pertanyaan + tutup */}
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex-1 font-display text-[17px] font-medium text-slate-800 dark:text-slate-100"
          style={{ letterSpacing: "-0.02em" }}
        >
          {q.q}
        </div>
        <button
          title="Tutup"
          onClick={() =>
            setMsgPatch(convId, msg.id, {
              elicitation: { ...elic, answered: true },
            })
          }
          className="rounded-lg p-1 text-slate-400 transition hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          ✕
        </button>
      </div>

      {/* daftar opsi bernomor (ala Claude) */}
      <div className="space-y-1">
        {q.options.map((o, i) => (
          <button
            key={o}
            onMouseEnter={() => setHover(i)}
            onClick={() => pick(o)}
            className={cn(
              "flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-left transition",
              i === hover
                ? "bg-slate-900/[0.06] dark:bg-white/10"
                : "hover:bg-slate-900/[0.04] dark:hover:bg-white/5"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[13.5px] font-semibold",
                i === hover
                  ? "bg-white text-slate-800 dark:bg-white/15 dark:text-white"
                  : "bg-slate-900/[0.05] text-slate-400 dark:bg-white/[0.06]"
              )}
            >
              {i + 1}
            </span>
            <span className="flex-1 text-[14.5px] text-slate-700 dark:text-slate-200">
              {o}
            </span>
            {i === hover && (
              <CornerUpLeft
                size={15}
                className="rotate-180 text-slate-400"
              />
            )}
          </button>
        ))}

        {/* something else + skip */}
        <div className="flex w-full items-center gap-3.5 rounded-xl px-3 py-2 transition hover:bg-slate-900/[0.03] dark:hover:bg-white/5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900/[0.05] text-slate-400 dark:bg-white/[0.06]">
            ✎
          </span>
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === "Return") && custom.trim()) {
                e.preventDefault();
                pick(custom.trim());
              }
            }}
            placeholder="Something else"
            className="flex-1 bg-transparent py-1 text-[14.5px] text-slate-700 placeholder:text-slate-400 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <button
            onClick={() => pick(q.options[0])}
            className="rounded-xl bg-slate-900/[0.06] px-4 py-1.5 text-[13px] font-medium text-slate-600 transition hover:bg-slate-900/10 dark:bg-white/10 dark:text-slate-200 dark:hover:bg-white/15"
          >
            Skip
          </button>
        </div>
      </div>

      <div className="mt-3 text-center text-[12px] text-slate-400">
        ↑↓ to navigate · Enter to select · or type below
      </div>
    </div>
  );
}

/* ---------------- working card ---------------- */

export function WorkingCard({ msg }: { msg: Message }) {
  return (
    <div>
      <div className="glass inline-block min-w-[240px] rounded-2xl p-4">
        <div className="mb-3 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider text-slate-400">
          <Spinner className="h-3.5 w-3.5" />
          Working
        </div>
        <div className="space-y-2.5">
          {(msg.steps || []).map((st, i) => (
            <div key={i} className="flex items-start gap-2.5">
              {st.done ? (
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0 text-brand-500"
                />
              ) : (
                <Spinner className="mt-0.5 h-4 w-4 shrink-0" />
              )}
              <div>
                <div className="text-[13.5px] font-medium text-slate-700 dark:text-slate-200">
                  {st.label}
                </div>
                {st.sub && (
                  <div className="mt-0.5 font-mono text-[12px] text-slate-400">
                    {st.sub}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      {msg.statusLine && (
        <div className="mt-3 flex items-center gap-2.5 pl-1">
          <Spinner className="h-3.5 w-3.5" />
          <div>
            <div className="shimmer-text text-[13.5px] font-medium">
              {msg.statusLine}
            </div>
            {msg.steps?.[1]?.sub && (
              <div className="text-[11.5px] text-slate-400">
                {msg.steps[1].label} — {msg.steps[1].sub}…
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------------- reply suggestions ---------------- */

export function ReplySuggestions({
  onPick,
}: {
  onPick: (t: string) => void;
}) {
  const [hidden, setHidden] = useState(false);
  return (
    <div className="mt-5">
      {!hidden && (
        <div className="flex flex-wrap gap-2">
          {REPLY_SUGGESTIONS.map((t) => (
            <button
              key={t}
              onClick={() => onPick(t)}
              className="glass rounded-full px-4 py-2 text-[12.5px] font-medium text-slate-600 transition hover:bg-white/90 dark:text-slate-300 dark:hover:bg-white/15"
            >
              {t}
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setHidden(!hidden)}
        className="mt-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/50 text-slate-400 backdrop-blur-md transition hover:text-slate-600 dark:border-white/10 dark:bg-white/5"
        title={hidden ? "Tampilkan saran" : "Sembunyikan saran"}
      >
        <ChevronDown
          size={14}
          className={cn("transition-transform", hidden && "rotate-180")}
        />
      </button>
    </div>
  );
}
