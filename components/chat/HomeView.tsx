"use client";

import { useState } from "react";
import {
  FileText,
  FlaskConical,
  Puzzle,
} from "lucide-react";
import { ChatInput, type PendingFile } from "./ChatInput";
import { useToast } from "@/components/ui";
import { useDB } from "@/lib/store";
import { firstName, timeGreetingID } from "@/lib/utils";
import type { ModeId } from "@/lib/types";
import { OrbVideo } from "@/components/OrbVideo";

const FEATURES = [
  {
    icon: FlaskConical,
    title: "Kuis Generator",
    desc: "Latihan soal siap cetak lengkap dengan kunci jawaban.",
    prompt: "/quiz buatkan latihan soal tentang fotosintesis",
  },
  {
    icon: Puzzle,
    title: "Word Builder",
    desc: "Game anagram edukatif yang bisa langsung dimainkan.",
    prompt: "/anagram buatkan terkait tatasurya",
  },
  {
    icon: FileText,
    title: "Doc Assistant",
    desc: "Susun dokumen, email, dan ringkasan dalam sekejap.",
    prompt: "Bantu aku menyusun rencana belajar 30 hari yang realistis.",
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
  const name = firstName(me?.name || "teman");

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
        <nav className="hidden items-center gap-5 text-[13px] md:flex">
          <span className="font-semibold text-slate-800 dark:text-white">
            Dashboard
          </span>
          <button
            onClick={() => toast("Pengaturan ada di bar bawah (tema, servers)")}
            className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            Settings
          </button>
          <button
            onClick={() => toast("Klik ikon ? di bar bawah untuk bantuan")}
            className="text-slate-400 transition hover:text-slate-600 dark:hover:text-slate-200"
          >
            Help &amp; Support
          </button>
        </nav>
        <div className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-slate-500 text-[12.5px] font-semibold text-slate-700 dark:border-white dark:text-white">
          {name.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* hero */}
      <div className="mx-auto flex w-full max-w-[780px] flex-1 flex-col items-center justify-center py-10">
        {/* orb video */}
        <div className="enter-orb relative h-[118px] w-[118px] overflow-hidden rounded-full bg-white [mask-image:radial-gradient(circle_closest-side,black_84%,transparent_100%)] dark:bg-[#04060b] dark:[mask-image:none]">
          <OrbVideo smoothLoop />
        </div>

        <div className="enter-up mt-7 text-[13px] font-medium uppercase tracking-[0.35em] text-slate-500 [animation-delay:0.15s] dark:text-slate-300">
          Welcome back
        </div>
        <h1
          className="enter-up mt-2.5 text-center font-display text-[32px] font-medium text-slate-800 [animation-delay:0.25s] dark:text-white md:text-[38px]"
          style={{ letterSpacing: "-0.03em" }}
        >
          Selamat {timeGreetingID()}, {name}
        </h1>

        {/* prompt panel */}
        <div className="enter-up mt-9 w-full [animation-delay:0.38s]">
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

        {/* feature pills — satu tombol sederhana per fitur */}
        <div className="enter-up mt-5 flex flex-wrap items-center justify-center gap-2.5 [animation-delay:0.5s]">
          {FEATURES.map((f) => (
            <button
              key={f.title}
              onClick={() => onSend(f.prompt, [])}
              className="pill-glass px-4 py-2 text-[12.5px]"
            >
              <f.icon size={14} className="opacity-70" />
              {f.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
