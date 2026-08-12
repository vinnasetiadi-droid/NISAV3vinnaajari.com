"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogoLockup } from "@/components/Logo";
import { useDB } from "@/lib/store";

const PILLS = [
  { label: "Workspace", color: "bg-cyan-300" },
  { label: "Research", color: "bg-brand-400" },
  { label: "Education", color: "bg-sky-300" },
];

export function AuthShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useDB((s) => s.sessionUserId);

  useEffect(() => {
    if (session) router.replace("/app");
  }, [session, router]);

  return (
    <div className="bg-hero-dark relative flex min-h-screen flex-col overflow-hidden text-slate-200">
      {/* floating glass blobs (Google Labs playfulness) */}
      <div className="pointer-events-none absolute -left-24 top-1/3 h-72 w-72 animate-blob rounded-full bg-brand-500/20 blur-3xl" />
      <div className="pointer-events-none absolute right-[8%] top-[16%] h-80 w-80 animate-blob rounded-full bg-teal2/15 blur-3xl [animation-delay:4s]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[35%] h-80 w-80 animate-blob rounded-full bg-brand-500/15 blur-3xl [animation-delay:8s]" />

      <header className="relative z-10 px-8 pt-7 md:px-12">
        <LogoLockup light />
      </header>

      <main className="relative z-10 flex flex-1 flex-col items-center gap-14 px-8 py-12 md:flex-row md:justify-between md:px-16 lg:px-24">
        <section className="max-w-xl">
          <h1 className="font-display text-[42px] font-semibold leading-tight text-slate-100 md:text-[52px]">
            Your AI{" "}
            <em className="text-gradient font-display italic">
              Operating System
            </em>
          </h1>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-slate-400">
            One workspace, many capabilities — from education to professional.
            Ask anything, create documents, and bring your knowledge along.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            {PILLS.map((p) => (
              <span
                key={p.label}
                className="glass-dark flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] font-medium text-slate-300"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${p.color}`} />
                {p.label}
              </span>
            ))}
          </div>
        </section>

        <section className="w-full max-w-[420px]">{children}</section>
      </main>

      <footer className="relative z-10 px-8 pb-6 text-[12px] text-slate-600 md:px-12">
        © NISA
      </footer>
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1.5 text-[12.5px] font-medium text-slate-300">
        {label}
      </div>
      {children}
    </label>
  );
}

export const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-slate-100 placeholder:text-slate-500 backdrop-blur-md transition focus:border-brand-400/60 focus:bg-white/[0.09]";
