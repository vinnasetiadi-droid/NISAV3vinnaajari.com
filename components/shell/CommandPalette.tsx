"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  HardDrive,
  Home,
  MessageSquare,
  MessageSquarePlus,
  Moon,
  Search,
  Sun,
  Trash2,
} from "lucide-react";
import { Modal } from "@/components/ui";
import { useDB } from "@/lib/store";
import { cn } from "@/lib/utils";

export function CommandPalette() {
  const open = useDB((s) => s.paletteOpen);
  const setOpen = useDB((s) => s.setPaletteOpen);
  const theme = useDB((s) => s.theme);
  const setTheme = useDB((s) => s.setTheme);
  const setActive = useDB((s) => s.setActive);
  const newConversation = useDB((s) => s.newConversation);
  const setShowArchived = useDB((s) => s.setShowArchived);
  const clearAll = useDB((s) => s.clearAll);
  const sessionUserId = useDB((s) => s.sessionUserId);
  const data = useDB((s) =>
    s.sessionUserId ? s.data[s.sessionUserId] : undefined
  );
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hover, setHover] = useState(0);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useDB.getState().paletteOpen);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [setOpen]);

  useEffect(() => {
    if (open) {
      setQ("");
      setHover(0);
    }
  }, [open]);

  const actions = useMemo(
    () => [
      {
        icon: MessageSquarePlus,
        label: "New chat",
        run: () => {
          setActive(null);
          router.push("/app");
        },
      },
      {
        icon: Home,
        label: "Go home",
        run: () => {
          setActive(null);
          router.push("/app");
        },
      },
      {
        icon: HardDrive,
        label: "Open Drive",
        run: () => router.push("/app/drive"),
      },
      {
        icon: theme === "dark" ? Sun : Moon,
        label: theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
        run: () => setTheme(theme === "dark" ? "light" : "dark"),
      },
      {
        icon: Archive,
        label: "View archived conversations",
        run: () => {
          setShowArchived(true);
          router.push("/app");
        },
      },
      {
        icon: Trash2,
        label: "Clear all conversations",
        run: () => {
          if (confirm("Delete all conversations?")) clearAll();
        },
      },
    ],
    [theme, newConversation, router, setActive, setTheme, setShowArchived, clearAll]
  );

  if (!open || !sessionUserId) return null;

  const ql = q.toLowerCase();
  const filteredActions = actions.filter((a) =>
    a.label.toLowerCase().includes(ql)
  );
  const convs = (data?.conversations || [])
    .filter((c) => !c.archived && c.title.toLowerCase().includes(ql))
    .slice(0, 6);
  const rows = [
    ...filteredActions.map((a) => ({ type: "action" as const, a })),
    ...convs.map((c) => ({ type: "conv" as const, c })),
  ];

  const runRow = (r: (typeof rows)[number]) => {
    setOpen(false);
    if (r.type === "action") r.a.run();
    else {
      setActive(r.c.id);
      router.push("/app");
    }
  };

  return (
    <Modal onClose={() => setOpen(false)} className="w-[560px] max-w-[92vw] p-0">
      <div className="flex items-center gap-3 border-b border-slate-200/60 px-5 py-4 dark:border-white/10">
        <Search size={17} className="text-slate-400" />
        <input
          autoFocus
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setHover(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setHover((h) => Math.min(h + 1, rows.length - 1));
            if (e.key === "ArrowUp") setHover((h) => Math.max(h - 1, 0));
            if (e.key === "Enter" && rows[hover]) runRow(rows[hover]);
          }}
          placeholder="Search conversations & commands…"
          className="flex-1 bg-transparent text-[15px] text-slate-800 placeholder:text-slate-400 dark:text-slate-100"
        />
        <kbd>esc</kbd>
      </div>
      <div className="nice-scroll max-h-[380px] overflow-y-auto p-2">
        {rows.length === 0 && (
          <div className="px-4 py-8 text-center text-[13.5px] text-slate-400">
            No results for “{q}”.
          </div>
        )}
        {filteredActions.length > 0 && (
          <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Actions
          </div>
        )}
        {rows.map((r, i) => (
          <button
            key={i}
            onMouseEnter={() => setHover(i)}
            onClick={() => runRow(r)}
            className={cn(
              "flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13.5px] text-slate-700 dark:text-slate-200",
              i === hover && "bg-brand-500/10 dark:bg-white/10"
            )}
          >
            {r.type === "action" ? (
              <>
                <r.a.icon size={16} className="text-slate-400" />
                {r.a.label}
              </>
            ) : (
              <>
                <MessageSquare size={16} className="text-slate-400" />
                <span className="truncate">{r.c.title}</span>
              </>
            )}
          </button>
        ))}
        {convs.length > 0 && (
          <div className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {/* separator label rendered above rows already merged; keep simple */}
          </div>
        )}
      </div>
    </Modal>
  );
}
