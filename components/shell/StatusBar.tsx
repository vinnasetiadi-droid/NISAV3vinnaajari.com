"use client";

import { useCallback, useState } from "react";
import {
  HelpCircle,
  Moon,
  Search,
  Sun,
} from "lucide-react";
import { MenuShell, useOutside } from "@/components/ui";
import { SERVERS } from "@/lib/registry";
import { useDB } from "@/lib/store";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const theme = useDB((s) => s.theme);
  const setTheme = useDB((s) => s.setTheme);
  const setPaletteOpen = useDB((s) => s.setPaletteOpen);
  const health = useDB((s) => s.health);
  const [pop, setPop] = useState<"servers" | "help" | null>(null);
  const close = useCallback(() => setPop(null), []);
  const ref = useOutside(close);

  const online = SERVERS.filter((s) => s.online);
  const toolCount = online.reduce((n, s) => n + s.tools, 0);

  /** Ganti tema dengan animasi circular-reveal dari posisi klik (fallback: crossfade). */
  const toggleTheme = (e: React.MouseEvent) => {
    const next = theme === "dark" ? "light" : "dark";
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { ready: Promise<void> };
    };

    if (doc.startViewTransition) {
      const x = e.clientX;
      const y = e.clientY;
      const vt = doc.startViewTransition(() => setTheme(next));
      vt.ready.then(() => {
        const r = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${r}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 550,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      });
    } else {
      document.documentElement.classList.add("theme-anim");
      setTheme(next);
      setTimeout(
        () => document.documentElement.classList.remove("theme-anim"),
        500
      );
    }
  };

  return (
    <div className="relative z-40 flex h-8 shrink-0 items-center gap-3 border-t border-slate-200/70 bg-white/60 px-3 text-[12px] text-slate-500 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#070a10]/85 dark:text-slate-400">
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex items-center gap-2 rounded-lg px-2 py-0.5 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
      >
        <Search size={12.5} />
        Search &amp; commands
        <kbd>⌘K</kbd>
      </button>

      <div className="flex-1" />

      <div ref={ref} className="relative flex items-center gap-1.5">
        {pop === "help" && (
          <MenuShell className="bottom-9 right-24 w-[300px] p-4">
            <div className="mb-1 font-display text-[16px] font-semibold text-slate-800 dark:text-slate-100">
              NISA V.3
            </div>
            <p className="mb-3 text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
              Neural Interactive Systematic Assistant — your AI operating
              system.
            </p>
            <div className="mb-3 rounded-xl border border-slate-200/70 bg-white/50 px-3 py-2 text-[12px] dark:border-white/10 dark:bg-white/5">
              {health?.live ? (
                <span>
                  ● <b className="text-emerald-600">Live</b> — model{" "}
                  <code className="font-mono">{health.model}</code>
                </span>
              ) : (
                <span>
                  ● <b className="text-amber-600">Mode demo</b> — isi{" "}
                  <code className="font-mono">ANTHROPIC_API_KEY</code> di{" "}
                  <code className="font-mono">.env.local</code> untuk chat live
                </span>
              )}
            </div>
            <div className="space-y-1.5 text-[12px] text-slate-500 dark:text-slate-400">
              {[
                ["⌘K", "Search & commands"],
                ["Enter", "Kirim pesan"],
                ["Shift+Enter", "Baris baru"],
                ["/", "Agents, skills & tools"],
                ["@", "Sebut dokumen Drive"],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span>{v}</span>
                  <kbd>{k}</kbd>
                </div>
              ))}
            </div>
          </MenuShell>
        )}

        {pop === "servers" && (
          <MenuShell className="bottom-9 right-0 w-[320px] p-2">
            <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              MCP Servers
            </div>
            {SERVERS.map((s) => (
              <div
                key={s.name}
                className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-white/60 dark:hover:bg-white/5"
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    s.online ? "bg-emerald-500" : "bg-slate-400"
                  )}
                />
                <div className="flex-1">
                  <div className="font-mono text-[12.5px] font-medium text-slate-700 dark:text-slate-200">
                    {s.name}
                  </div>
                  <div className="text-[11.5px] text-slate-400">{s.desc}</div>
                </div>
                <span
                  className={cn(
                    "text-[11.5px]",
                    s.online ? "text-slate-500" : "text-slate-400 line-through"
                  )}
                >
                  {s.tools} tools
                </span>
              </div>
            ))}
          </MenuShell>
        )}

        <button
          onClick={() => setPop(pop === "help" ? null : "help")}
          className="rounded-lg p-1 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          title="Bantuan"
        >
          <HelpCircle size={14} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-1 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          title="Ganti tema"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          onClick={() => setPop(pop === "servers" ? null : "servers")}
          className="flex items-center gap-1.5 rounded-lg px-2 py-0.5 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {online.length}/{SERVERS.length} servers · {toolCount} tools
        </button>
      </div>
    </div>
  );
}
