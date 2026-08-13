"use client";

import { useEffect, useRef, useState } from "react";
import {
  Copy,
  FilePlus2,
  ListChecks,
  MoreHorizontal,
  Share2,
  Shrink,
} from "lucide-react";
import { MenuShell, useOutside, useToast } from "@/components/ui";
import { ChatInput, type PendingFile } from "./ChatInput";
import {
  AssistantMessage,
  ElicitationCard,
  ReplySuggestions,
  UserBubble,
  WorkingCard,
} from "./Messages";
import {
  compactConversation,
  isStreaming,
  runTLDR,
  sendMessage,
  stopStreaming,
  transcriptOf,
} from "@/lib/engine";
import { newDocHTML } from "@/lib/newDoc";
import { useDB } from "@/lib/store";
import { cn, fmtTokens } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

export function ChatView({ conv }: { conv: Conversation }) {
  const s = useDB();
  const toast = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [quote, setQuote] = useState("");
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useOutside(() => setMoreOpen(false));
  const streaming = isStreaming(conv);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conv.messages.length, conv.messages[conv.messages.length - 1]?.content]);

  const lastMsg = conv.messages[conv.messages.length - 1];
  const showSuggestions =
    lastMsg?.role === "assistant" &&
    lastMsg.kind === "text" &&
    lastMsg.status === "done";

  const focusInput = () => {
    (document.getElementById("chat-input") as HTMLTextAreaElement)?.focus();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      {/* header */}
      <div className="flex h-[52px] items-center gap-2 px-5">
        <h1 className="min-w-0 flex-1 truncate font-display text-[16px] font-medium text-slate-800 dark:text-slate-100">
          {conv.title}
        </h1>
        <HeaderBtn
          icon={<FilePlus2 size={14} />}
          label="New Doc"
          onClick={() => {
            const a = s.addArtifact({
              title: "New Document",
              html: newDocHTML(),
              kind: "document",
              convId: conv.id,
            });
            s.setOpenArtifact(a.id);
          }}
        />
        <HeaderBtn
          icon={<ListChecks size={14} />}
          label="Summarize"
          disabled={streaming || conv.messages.length === 0}
          onClick={() => runTLDR()}
        />
        <div ref={moreRef} className="relative">
          <HeaderBtn
            icon={<MoreHorizontal size={15} />}
            label=""
            onClick={() => setMoreOpen(!moreOpen)}
          />
          {moreOpen && (
            <MenuShell className="right-0 top-9 w-[180px] p-1.5">
              <MoreItem
                icon={<Copy size={14} />}
                label="Copy"
                onClick={() => {
                  navigator.clipboard.writeText(transcriptOf(conv));
                  toast("Transcript copied");
                  setMoreOpen(false);
                }}
              />
              <MoreItem
                icon={<Share2 size={14} />}
                label="Share"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `NISA — ${conv.title}\n\n${transcriptOf(conv)}`
                  );
                  toast("Transcript ready to share (copied)");
                  setMoreOpen(false);
                }}
              />
              <MoreItem
                icon={<Shrink size={14} />}
                label="Compact"
                onClick={() => {
                  if (compactConversation()) toast("Conversation compacted");
                  else toast("Nothing to compact yet");
                  setMoreOpen(false);
                }}
              />
            </MenuShell>
          )}
        </div>
      </div>

      {/* messages */}
      <div
        ref={scrollRef}
        className="nice-scroll min-h-0 flex-1 overflow-y-auto px-5"
      >
        <div className="mx-auto max-w-[820px] space-y-6 py-6">
          {conv.messages.map((m) => (
            <div key={m.id} className="animate-rise">
              {m.role === "user" ? (
                <UserBubble msg={m} />
              ) : m.kind === "working" ? (
                <WorkingCard msg={m} />
              ) : m.kind === "elicitation" ? (
                <div>
                  <AssistantMessage
                    msg={{ ...m, status: "done" }}
                    onQuote={() => {}}
                    onReply={focusInput}
                  />
                  <ElicitationCard convId={conv.id} msg={m} />
                </div>
              ) : (
                <AssistantMessage
                  msg={m}
                  onQuote={(t) => {
                    setQuote(t);
                    focusInput();
                  }}
                  onReply={focusInput}
                />
              )}
            </div>
          ))}
          {showSuggestions && !streaming && (
            <ReplySuggestions onPick={(t) => sendMessage(t)} />
          )}
        </div>
      </div>

      {/* input */}
      <div className="px-5 pb-3 pt-1">
        <div className="mx-auto max-w-[820px]">
          {quote && (
            <div className="glass mb-2 flex items-start gap-2 rounded-2xl px-4 py-2.5 text-[12.5px] text-slate-500 dark:text-slate-400">
              <span className="mt-0.5 shrink-0">❝</span>
              <span className="line-clamp-2 flex-1 italic">{quote}</span>
              <button
                onClick={() => setQuote("")}
                className="shrink-0 font-semibold hover:text-slate-700 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>
          )}
          <ChatInput
            inputId="chat-input"
            placeholder="Send a message…  (/ for agents, skills, tools)"
            streaming={streaming}
            onStop={() => stopStreaming(conv.id)}
            onSend={(t, files) => {
              const text = quote
                ? `> ${quote.split("\n").join("\n> ")}\n\n${t}`
                : t;
              setQuote("");
              sendMessage(text, { attachments: files });
              // persist attachments to Drive
              files.forEach((f) =>
                useDB.getState().addFile({
                  name: f.name,
                  size: f.size,
                  mime: f.mime,
                  category: "attachment",
                  dataUrl: f.dataUrl,
                  text: f.text,
                })
              );
            }}
            mode={conv.mode}
            onMode={(m) => s.patchConv(conv.id, { mode: m })}
            showHints
          />
        </div>
      </div>
    </div>
  );
}

function MoreItem({
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
      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-slate-600 transition hover:bg-slate-900/[0.04] dark:text-slate-300 dark:hover:bg-white/5"
    >
      {icon}
      {label}
    </button>
  );
}

function HeaderBtn({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-slate-500 transition hover:bg-white/60 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-slate-200",
        disabled && "cursor-not-allowed opacity-40"
      )}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </button>
  );
}
