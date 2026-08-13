"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ChevronDown,
  FileText,
  FlaskConical,
  Globe,
  Mail,
  Plus,
  Puzzle,
} from "lucide-react";
import { ToastProvider } from "@/components/ui";
import { LoginModal } from "@/components/landing/LoginModal";
import { ChatView } from "@/components/chat/ChatView";
import { ArtifactPanel } from "@/components/artifact/ArtifactPanel";
import { sendMessage } from "@/lib/engine";
import { sha256 } from "@/lib/utils";
import { GradSparkle } from "@/components/GradSparkle";
import { COMMANDS } from "@/lib/registry";
import { useDB } from "@/lib/store";

const EXAMPLES = [
  "Create a 5th-grade science quiz about photosynthesis.",
  "Build a fun anagram game about the solar system.",
  "Help me write a professional email to my professor.",
  "Draft a realistic 30-day study plan for my exam.",
  "Summarize a long document into key points.",
];

const IDEAS = [
  {
    icon: FlaskConical,
    label: "Print-ready photosynthesis quiz",
    prompt: "/quiz create practice questions about photosynthesis",
  },
  {
    icon: Puzzle,
    label: "Solar system anagram game",
    prompt: "/anagram create one about the solar system",
  },
  {
    icon: Mail,
    label: "Professional email in seconds",
    prompt: "Help me write a professional email to my professor.",
  },
  {
    icon: CalendarDays,
    label: "30-day study plan",
    prompt: "Create a 30-day study plan for exam prep.",
  },
  {
    icon: FileText,
    label: "Summarize any document",
    prompt: "Summarize my Drive document into key points.",
  },
];

function Landing() {
  const router = useRouter();
  const session = useDB((s) => s.sessionUserId);
  const [mounted, setMounted] = useState(false);
  const [text, setText] = useState("");
  const [exIdx, setExIdx] = useState(0);
  const [modal, setModal] = useState<null | "signup" | "signin">(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const guestGate = useDB((st) => st.guestGate);
  const activeConvId = useDB((st) => st.activeConvId);
  const me = useDB((st) => (st.sessionUserId ? st.me() : null));
  const isGuest = !!me?.email?.endsWith("@guest.nisa");
  const guestConv = useDB((st) =>
    st.sessionUserId
      ? st.d().conversations.find((c) => c.id === st.activeConvId) || null
      : null
  );
  const openArtifactId = useDB((st) => (st.sessionUserId ? st.openArtifactId : null));

  useEffect(() => {
    setMounted(true);
    sessionStorage.removeItem("nisa-pending");
  }, []);

  // guest kehabisan jatah 3 chat → wajib sign in
  useEffect(() => {
    if (guestGate) {
      setModal("signin");
      useDB.getState().setGuestGate(false);
    }
  }, [guestGate]);

  // Placeholder typewriter: ketik pelan → jeda → hapus → contoh berikutnya.
  const [ph, setPh] = useState("");
  useEffect(() => {
    let i = 0;
    let pos = 0;
    let deleting = false;
    let t: ReturnType<typeof setTimeout>;
    const tick = () => {
      const full = EXAMPLES[i];
      if (!deleting) {
        pos++;
        setPh(full.slice(0, pos));
        if (pos === full.length) {
          deleting = true;
          t = setTimeout(tick, 2300); // jeda baca
          return;
        }
        t = setTimeout(tick, 38);
      } else {
        pos--;
        setPh(full.slice(0, pos));
        if (pos === 0) {
          deleting = false;
          i = (i + 1) % EXAMPLES.length;
          setExIdx(i);
          t = setTimeout(tick, 400);
          return;
        }
        t = setTimeout(tick, 16);
      }
    };
    t = setTimeout(tick, 500);
    return () => clearTimeout(t);
  }, []);

  // menu fungsi saat mengetik "/"
  const slashMatch = text.match(/^\/([\w-]*)$/);
  const slashItems = slashMatch
    ? COMMANDS.filter((c) => c.id.includes(slashMatch[1].toLowerCase()))
    : [];

  const pickSlash = (id: string) => {
    setText(`/${id} `);
    taRef.current?.focus();
  };

  const generate = async (raw?: string) => {
    // Try-first: 3 kirim pertama gratis sebagai guest, ke-4 wajib sign in.
    const prompt = (raw ?? text).trim() || EXAMPLES[exIdx];
    const st = useDB.getState();
    if (!st.sessionUserId) {
      const pass = await sha256("nisa-guest");
      st.signUp({
        name: "Guest",
        email: `guest-${Date.now()}@guest.nisa`,
        pass,
      });
    }
    setText("");
    sendMessage(prompt);
  };

  return (
    <div className="bg-hero-dark relative min-h-screen overflow-hidden text-slate-200">
      {/* background video — fill seluruh halaman + overlay hitam 20% + vignette */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <video
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/30" />
        {/* gradient hitam dari bawah */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,0.5) 100%)",
          }}
        />
        {/* kubah cahaya biru melengkung dari bawah (ala referensi) */}
        <div
          className="absolute inset-x-0 bottom-0 h-[60vh]"
          style={{
            background:
              "radial-gradient(120% 105% at 50% 118%, rgba(59,140,255,0.6) 0%, rgba(10,112,255,0.32) 38%, rgba(10,80,220,0.12) 58%, transparent 74%)",
          }}
        />
      </div>

      {/* nav */}
      <header className="relative z-20 flex items-center gap-4 px-6 py-4 md:px-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-nisa.png" alt="NISA" className="h-7 w-auto" />
        <div className="flex-1" />
        <button className="hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13.5px] text-slate-300 transition hover:bg-white/5 md:flex">
          <Globe size={15} /> EN <ChevronDown size={13} />
        </button>
        {mounted && session ? (
          <Link
            href="/app"
            className="rounded-full bg-white px-5 py-2 text-[13.5px] font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Open App
          </Link>
        ) : (
          <button
            onClick={() => setModal("signin")}
            className="rounded-full bg-white px-5 py-2 text-[13.5px] font-semibold text-slate-900 transition hover:bg-slate-200"
          >
            Sign in
          </button>
        )}
      </header>

      {/* hero */}
      {mounted && isGuest && guestConv ? (
        /* ---------- mode coba-coba: chat sungguhan di halaman depan ---------- */
        <main className="relative z-10 mx-auto flex h-[calc(100vh-140px)] max-w-[1200px] gap-2.5 px-4 pt-2">
          <div className="glass-mac flex min-w-0 flex-1 overflow-hidden rounded-[26px]">
            <ChatView conv={guestConv} />
          </div>
          {openArtifactId && (
            <div className="hidden w-[46%] min-w-[380px] md:flex">
              <ArtifactPanel
                artifactId={openArtifactId}
                onClose={() => useDB.getState().setOpenArtifact(null)}
              />
            </div>
          )}
        </main>
      ) : (
      <main className="relative z-10 mx-auto flex max-w-[1060px] flex-col items-center px-5 pt-10 md:pt-14">
        <h1 className="bg-gradient-to-r from-white/40 via-white to-white/30 bg-clip-text font-display text-[56px] font-medium leading-none text-transparent md:text-[84px]">
          Ask NISA
        </h1>

        {/* prompt card */}
        <div className="glass-mac relative z-10 mt-10 w-full rounded-[26px] p-6 pb-4">
          <div className="relative">
            {/* overlay: /perintah tampil biru */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-[17px] leading-relaxed text-slate-100"
            >
              {(() => {
                const m = text.match(/^(\/[\w-]+)([\s\S]*)$/);
                return m ? (
                  <>
                    <span className="font-medium text-brand-300">{m[1]}</span>
                    {m[2]}
                  </>
                ) : (
                  text
                );
              })()}
            </div>
            <textarea
              ref={taRef}
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                const isEnter = e.key === "Enter" || e.key === "Return";
                if (slashItems.length > 0 && (e.key === "Tab" || (isEnter && !e.shiftKey))) {
                  e.preventDefault();
                  pickSlash(slashItems[0].id);
                  return;
                }
                if (isEnter && !e.shiftKey) {
                  e.preventDefault();
                  generate();
                }
              }}
              placeholder={ph}
              className="nice-scroll relative min-h-[88px] w-full resize-none bg-transparent text-[17px] leading-relaxed text-transparent caret-slate-100 placeholder:text-slate-500"
            />
          </div>
          <div className="mt-2 flex items-center gap-2.5">
            <button
              onClick={() => taRef.current?.focus()}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-slate-100 backdrop-blur-md transition hover:bg-white/20"
              title="Attach (after sign in)"
            >
              <Plus size={18} />
            </button>
            <div className="flex-1" />
            <button
              onClick={() => generate()}
              className="btn-aurora rounded-full px-7 py-2.5 text-[14.5px] font-semibold"
            >
              Generate
            </button>
          </div>

          {/* dropdown fungsi saat mengetik "/" */}
          {slashItems.length > 0 && (
            <div className="nice-scroll absolute inset-x-6 top-full z-30 mt-2 max-h-[280px] overflow-y-auto rounded-[26px] border border-white/10 bg-[#10141c]/95 p-1.5 shadow-pop backdrop-blur-xl">
              {slashItems.map((c) => (
                <button
                  key={c.id}
                  onClick={() => pickSlash(c.id)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-white/5"
                >
                  <GradSparkle size={15} className="shrink-0" />
                  <span className="font-mono text-[13px] font-medium text-slate-200">
                    {c.id}
                  </span>
                  <span
                    className={
                      c.type === "AGENT"
                        ? "rounded-md bg-white/10 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-slate-300"
                        : "rounded-md bg-brand-500/20 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-brand-300"
                    }
                  >
                    {c.type}
                  </span>
                  <span className="flex-1 truncate text-right text-[12px] text-slate-500">
                    {c.desc}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ideas */}
        <p className="mt-14 text-[13.5px] text-slate-500">
          No idea yet? Try one of these:
        </p>
        <div className="mb-16 mt-7 flex max-w-[820px] flex-wrap items-center justify-center gap-3">
          {IDEAS.map((idea) => (
            <button
              key={idea.label}
              onClick={() => {
                setText(idea.prompt);
                taRef.current?.focus();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.07] px-5 py-3 text-[13.5px] font-medium text-slate-100 shadow-[0_8px_28px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-white/30 hover:bg-white/[0.13]"
            >
              <idea.icon size={16} className="shrink-0 text-slate-300" />
              {idea.label}
            </button>
          ))}
        </div>

      </main>
      )}

      <footer className="fixed inset-x-0 bottom-2.5 z-10 text-center text-[12px] text-slate-600">
        © AJARI Technologies 2026
      </footer>

      <LoginModal
        key={modal || "closed"}
        open={modal !== null}
        onClose={() => setModal(null)}
        initialMode={modal || "signin"}
      />
    </div>
  );
}

export default function Root() {
  return (
    <ToastProvider>
      <Landing />
    </ToastProvider>
  );
}
