"use client";

import { useState } from "react";
import { HelpCircle, Home, Settings } from "lucide-react";
import { ChatInput, type PendingFile } from "./ChatInput";
import { useToast } from "@/components/ui";
import { useDB } from "@/lib/store";
import { firstName, timeGreetingID } from "@/lib/utils";
import type { ModeId } from "@/lib/types";
import { OrbVideo } from "@/components/OrbVideo";

const FEATURES = [
  {
    title: "Photosynthesis Quiz",
    desc: "Print-ready 5th-grade quiz with answer key",
    prompt: "/quiz create practice questions about photosynthesis",
  },
  {
    title: "Solar System Game",
    desc: "Playable Word Builder anagrams for science class",
    prompt: "/anagram create one about the solar system",
  },
  {
    title: "Ecosystem Slides",
    desc: "Outline a 10-slide classroom presentation",
    prompt: "Outline a 10-slide presentation about ecosystems for middle school.",
  },
];

export function HomeView({
  onSend,
}: {
  onSend: (text: string, files: PendingFile[]) => void;
}) {
  const me = useDB((s) => s.me());
  const [mode, setMode] = useState<ModeId>("auto");
  const toast = useToast();
  const name = firstName(me?.name || "friend");

  // prompt dari landing (sebelum login) → prefill ke input, bukan auto-kirim
  const [prefill] = useState(() => {
    if (typeof window === "undefined") return "";
    const p = sessionStorage.getItem("nisa-pending") || "";
    sessionStorage.removeItem("nisa-pending");
    return p;
  });

  return (
    <div className="nice-scroll flex min-w-0 flex-1 flex-col overflow-y-auto px-6">
      {/* top bar (ala referensi) */}
      <div className="flex items-center gap-3 pt-4">
        <div className="flex-1" />
        <nav className="hidden items-center gap-1.5 md:flex">
          <span
            title="Dashboard"
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-800 dark:text-white"
          >
            <Home size={17} />
          </span>
          <button
            title="Settings"
            aria-label="Settings"
            onClick={() => toast("Settings live in the bottom bar (theme, servers)")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            <Settings size={17} />
          </button>
          <button
            title="Help & Support"
            aria-label="Help & Support"
            onClick={() => toast("Click the ? icon in the bottom bar for help")}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 transition hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
          >
            <HelpCircle size={17} />
          </button>
        </nav>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-slate-500 text-[12.5px] font-semibold text-slate-700 dark:border-white dark:text-white">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* hero */}
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-center py-10">
        {/* orb video */}
        <div className="relative flex items-center justify-center">
        <div className="enter-orb relative h-[118px] w-[118px] overflow-hidden rounded-full bg-white [mask-image:radial-gradient(circle_closest-side,black_84%,transparent_100%)] dark:bg-[#04060b] dark:[mask-image:none]">
          <OrbVideo smoothLoop />
          {/* logo AJARI menempel di tengah blob */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ajari-mark.png"
            alt=""
            className="absolute left-1/2 top-1/2 z-10 h-[74px] w-auto -translate-x-1/2 -translate-y-1/2 drop-shadow-[0_1px_6px_rgba(0,40,90,0.35)]"
          />
        </div>
        </div>

        <div className="enter-up mt-7 text-[14px] font-bold uppercase tracking-[0.35em] text-slate-500 [font-family:var(--font-brenda)] [animation-delay:0.15s] dark:text-slate-300">
          Welcome back
        </div>
        <h1
          className="enter-up mt-2.5 text-center font-display text-[32px] font-medium text-slate-800 [animation-delay:0.25s] dark:text-white md:text-[38px]"
          style={{ letterSpacing: "-0.03em" }}
        >
          Good {timeGreetingID()}, {name}
        </h1>

        {/* prompt panel — class animasi dilepas saat selesai:
            animasi opacity pada ancestor mengisolasi backdrop-filter menu di dalamnya */}
        <div
          className="enter-up mt-9 w-full [animation-delay:0.38s]"
          onAnimationEnd={(e) => e.currentTarget.classList.remove("enter-up")}
        >
          <ChatInput
            variant="panel"
            placeholder="Ask me anything…"
            initialText={prefill}
            onSend={onSend}
            mode={mode}
            onMode={setMode}
            autoFocus
          />
        </div>

        {/* pinned project cards — skenario penting, ala reference */}
        <div className="enter-up mt-5 grid w-full grid-cols-1 gap-3 [animation-delay:0.5s] sm:grid-cols-3">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => onSend(f.prompt, [])}
              className="glass-chat rounded-[26px] p-4 text-left transition hover:brightness-110 dark:hover:brightness-125"
            >
              <div className="text-[15px] font-semibold text-slate-800 dark:text-slate-100">
                {f.title}
              </div>
              <div className="mt-1.5 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                {f.desc}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
