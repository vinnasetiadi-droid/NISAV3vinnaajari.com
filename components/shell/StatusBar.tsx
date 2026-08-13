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
  const collapsed = useDB((s) => s.sidebarCollapsed);
  const convTokens = useDB((s) => {
    const c = s.d().conversations.find((x) => x.id === s.activeConvId);
    return c ? c.tokens : null;
  });
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
    <div
      className={cn(
        "glass-chat relative z-40 flex shrink-0 items-center gap-1 rounded-2xl px-2 py-1.5 text-[12px] text-slate-500 dark:text-slate-400",
        collapsed && "flex-col gap-1.5 py-2"
      )}
    >
      <button
        onClick={() => setPaletteOpen(true)}
        title="Search & commands (⌘K)"
        className={cn(
          "flex min-w-0 items-center gap-2 rounded-lg px-2 py-1 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200",
          collapsed ? "justify-center" : "flex-1"
        )}
      >
        <Search size={13} className="shrink-0" />
        {!collapsed && <span className="truncate">Search</span>}
        {!collapsed && <kbd>⌘K</kbd>}
      </button>

      <div
        ref={ref}
        className={cn(
          "relative flex items-center gap-1",
          collapsed && "flex-col gap-1.5"
        )}
      >
        {pop === "help" && (
          <MenuShell className="bottom-9 left-0 w-[300px] p-4">
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
                  ● <b className="text-amber-600">Demo mode</b> — set{" "}
                  <code className="font-mono">ANTHROPIC_API_KEY</code> in{" "}
                  <code className="font-mono">.env.local</code> for live chat
                </span>
              )}
            </div>
            {convTokens !== null && (
              <div className="mb-3 flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/50 px-3 py-2 text-[12px] dark:border-white/10 dark:bg-white/5">
                <span>Token usage (this chat)</span>
                <span className="font-mono text-slate-700 dark:text-slate-200">
                  {Math.round(convTokens / 100) / 10}k / 100k
                </span>
              </div>
            )}
            <div className="space-y-1.5 text-[12px] text-slate-500 dark:text-slate-400">
              {[
                ["⌘K", "Search & commands"],
                ["Enter", "Send message"],
                ["Shift+Enter", "New line"],
                ["/", "Agents, skills & tools"],
                ["@", "Mention Drive docs"],
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
          <MenuShell className="bottom-9 left-0 w-[320px] p-2">
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
          title="Help"
        >
          <HelpCircle size={14} />
        </button>
        <button
          onClick={toggleTheme}
          className="rounded-lg p-1 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
          title="Toggle theme"
        >
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
        </button>
        <button
          onClick={() => setPop(pop === "servers" ? null : "servers")}
          title={`${online.length}/${SERVERS.length} servers · ${toolCount} tools`}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 transition hover:bg-white/60 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {!collapsed && `${online.length}/${SERVERS.length}`}
        </button>
      </div>
    </div>
  );
}
