"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  Check,
  Folder,
  HardDrive,
  Home,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Pin,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { LogoWordmark } from "@/components/Logo";
import { IconBtn, MenuShell, Modal, useOutside } from "@/components/ui";
import { useDB } from "@/lib/store";
import { cn, dayGroup, timeAgo } from "@/lib/utils";
import type { Conversation } from "@/lib/types";

const GROUP_ORDER = ["TODAY", "YESTERDAY", "PREVIOUS 7 DAYS", "OLDER"] as const;


/** Baris empty-state seragam: ikon kecil + satu baris teks, rata kiri. */
function EmptyRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="mt-1 flex items-center gap-2.5 px-1 py-1.5 text-[13px] text-slate-500 dark:text-slate-500">
      <span className="shrink-0">{icon}</span>
      {text}
    </div>
  );
}

export function Sidebar() {
  const s = useDB();
  const me = s.me();
  const data = s.d();
  const router = useRouter();
  const pathname = usePathname();
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const [newProject, setNewProject] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const [archOpen, setArchOpen] = useState(false);
  const menuRef = useOutside(() => setMenuFor(null));

  // Active state mengikuti route + state aktual: Home hanya aktif saat benar-benar
  // di home view (tidak sedang membuka percakapan). Selalu tepat satu yang aktif.
  const onDrive = pathname.startsWith("/app/drive");
  const nav = [
    {
      icon: Home,
      label: "Home",
      active: !onDrive && !s.activeConvId,
      go: () => {
        s.setActive(null);
        router.push("/app");
      },
    },
    {
      icon: HardDrive,
      label: "Drive",
      active: onDrive,
      go: () => router.push("/app/drive"),
    },
  ];

  const convs = useMemo(() => {
    let list = data.conversations.filter((c) => c.archived === s.showArchived);
    if (s.filterProjectId)
      list = list.filter((c) => c.projectId === s.filterProjectId);
    return list;
  }, [data.conversations, s.showArchived, s.filterProjectId]);

  // ⌘B / Ctrl+B → toggle collapse
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        useDB.getState().setSidebarCollapsed(!useDB.getState().sidebarCollapsed);
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, []);

  /** Handle di tepi kanan: drag = resize, klik = collapse. */
  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = useDB.getState().sidebarWidth;
    let moved = false;
    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      useDB.getState().setSidebarWidth(Math.min(400, Math.max(190, startW + dx)));
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      if (!moved) useDB.getState().setSidebarCollapsed(true);
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const groups = useMemo(() => {
    const g: Record<string, Conversation[]> = {};
    for (const c of convs) {
      const k = dayGroup(c.updatedAt);
      (g[k] = g[k] || []).push(c);
    }
    return g;
  }, [convs]);

  /* ---------- collapsed ---------- */
  if (s.sidebarCollapsed) {
    return (
      <div className="flex w-[54px] shrink-0 flex-col items-center gap-2 py-4">
        <button
          onClick={() => s.setSidebarCollapsed(false)}
          className="mb-1 flex h-9 w-9 items-center justify-center"
          title="Buka sidebar"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/glyph-nisa.png" alt="NISA" className="h-7 w-auto" />
        </button>
        <IconBtn title="Buka sidebar" onClick={() => s.setSidebarCollapsed(false)}>
          <PanelLeft size={17} />
        </IconBtn>
        <IconBtn
          title="New chat"
          onClick={() => {
            s.patchData((d) => ({
              ...d,
              conversations: d.conversations.filter((c) => c.messages.length > 0),
            }));
            s.setActive(null);
            router.push("/app");
          }}
          className="bg-brand-500/15 text-brand-600 dark:text-brand-300"
        >
          <Plus size={17} />
        </IconBtn>
        <div className="mt-2 flex flex-col gap-1.5">
          {nav.map((n) => (
            <IconBtn key={n.label} title={n.label} onClick={n.go} active={n.active}>
              <n.icon size={16} />
            </IconBtn>
          ))}
        </div>
      </div>
    );
  }

  return (
    <aside
      style={{ width: s.sidebarWidth }}
      className="relative flex shrink-0 flex-col border-r border-slate-200/70 bg-white/60 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#070a10]/85"
    >
      {/* drag handle: klik = collapse (⌘B), drag = resize */}
      <div
        onMouseDown={startDrag}
        className="group absolute -right-[3px] top-0 z-30 h-full w-[7px] cursor-col-resize"
      >
        <div className="absolute right-[2px] top-1/2 h-16 w-[3px] -translate-y-1/2 rounded-full bg-transparent transition group-hover:bg-slate-400/50 dark:group-hover:bg-white/25" />
        <div className="pointer-events-none absolute left-4 top-14 hidden whitespace-nowrap rounded-xl bg-black/90 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-slate-100 shadow-pop group-hover:block">
          <div>
            Click to collapse <kbd>⌘B</kbd>
          </div>
          <div className="text-slate-400">Drag to resize</div>
        </div>
      </div>
      {/* logo row */}
      <div className="flex items-center gap-2.5 px-4 pb-1 pt-4">
        <LogoWordmark className="h-[22px]" />
        <div className="flex-1" />
        <IconBtn title="Tutup sidebar" onClick={() => s.setSidebarCollapsed(true)}>
          <PanelLeft size={15} />
        </IconBtn>
      </div>

      {/* new chat — tombol aurora seperti Generate di landing */}
      <div className="p-3 pb-2">
        <button
          onClick={() => {
            s.patchData((d) => ({
              ...d,
              conversations: d.conversations.filter((c) => c.messages.length > 0),
            }));
            s.setActive(null);
            router.push("/app");
          }}
          className="btn-aurora flex w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] font-semibold"
        >
          <Plus size={16} />
          New chat
        </button>
      </div>

      {/* features nav */}
      <div className="px-4 pt-4">
        <div className="pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Features
        </div>
        <div className="space-y-0.5">
          {nav.map((n) => (
            <button
              key={n.label}
              onClick={n.go}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] transition",
                n.active
                  ? "bg-white/80 font-semibold text-slate-800 shadow-glass dark:bg-white/10 dark:text-white dark:shadow-none"
                  : "text-slate-500 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/5"
              )}
            >
              <n.icon size={15} />
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {/* projects */}
      <div className="px-4 pb-1 pt-6">
        <div className="flex items-center justify-between">
          <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
            Projects
          </span>
          <button
            onClick={() => setNewProject(true)}
            className="rounded-md p-1 text-slate-400 hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/10"
            title="Project baru"
          >
            <Plus size={13} />
          </button>
        </div>
        {newProject && (
          <form
            className="mt-2 flex gap-1.5"
            onSubmit={(e) => {
              e.preventDefault();
              if (projectName.trim()) s.addProject(projectName.trim());
              setProjectName("");
              setNewProject(false);
            }}
          >
            <input
              autoFocus
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onBlur={() => setNewProject(false)}
              placeholder="Nama project…"
              className="w-full rounded-lg border border-white/60 bg-white/60 px-2.5 py-1.5 text-[12.5px] dark:border-white/10 dark:bg-white/10"
            />
          </form>
        )}
        {data.projects.length === 0 && !newProject && (
          <EmptyRow
            icon={<Pin size={14} className="-rotate-45" />}
            text="Pin projects to keep them here"
          />
        )}
        <div className="mt-1 space-y-0.5">
          {data.projects.map((p) => {
            const count = data.conversations.filter(
              (c) => c.projectId === p.id && !c.archived
            ).length;
            return (
              <button
                key={p.id}
                onClick={() =>
                  s.setFilterProject(s.filterProjectId === p.id ? null : p.id)
                }
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] text-slate-600 transition dark:text-slate-300",
                  s.filterProjectId === p.id
                    ? "bg-brand-500/10 text-brand-700 dark:bg-white/10 dark:text-brand-300"
                    : "hover:bg-white/60 dark:hover:bg-white/5"
                )}
              >
                <Folder size={14} className="text-slate-400" />
                <span className="flex-1 truncate text-left">{p.name}</span>
                <span className="text-[11px] text-slate-400">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* conversations */}
      <div className="nice-scroll fade-edge-b mt-1 flex-1 overflow-y-auto px-3 pb-3">
        <div className="px-1 pb-1 pt-5 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
          Your chats
        </div>
        {s.showArchived && (
          <div className="mx-1 mb-2 mt-1 rounded-xl border border-amber-300/40 bg-amber-100/40 px-3 py-2 text-[12px] text-amber-700 dark:border-amber-300/20 dark:bg-amber-400/10 dark:text-amber-300">
            Menampilkan arsip.{" "}
            <button
              className="font-semibold underline"
              onClick={() => s.setShowArchived(false)}
            >
              Kembali
            </button>
          </div>
        )}
        {convs.length === 0 && (
          <EmptyRow
            icon={<MessageSquare size={14} />}
            text={s.showArchived ? "No archived chats" : "Your chats show up here"}
          />
        )}
        {GROUP_ORDER.map((g) =>
          groups[g] ? (
            <div key={g} className="mb-2">
              <div className="px-1 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400/70">
                {g}
              </div>
              {groups[g].map((c) => (
                <div key={c.id} className="group relative">
                  {renaming === c.id ? (
                    <form
                      className="px-1 py-0.5"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (renameVal.trim())
                          s.patchConv(c.id, {
                            title: renameVal.trim(),
                            titleLocked: true,
                          });
                        setRenaming(null);
                      }}
                    >
                      <input
                        autoFocus
                        value={renameVal}
                        onChange={(e) => setRenameVal(e.target.value)}
                        onBlur={() => setRenaming(null)}
                        className="w-full rounded-lg border border-brand-300 bg-white/80 px-2.5 py-1.5 text-[13px] dark:bg-white/10"
                      />
                    </form>
                  ) : (
                    <button
                      onClick={() => {
                        if (s.selectMode) s.toggleSelected(c.id);
                        else {
                          s.setActive(c.id);
                          router.push("/app");
                        }
                      }}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13.5px] transition",
                        s.activeConvId === c.id && !s.selectMode
                          ? "bg-white/80 text-slate-800 shadow-glass dark:bg-white/10 dark:text-slate-100 dark:shadow-none"
                          : "text-slate-600 hover:bg-white/50 dark:text-slate-400 dark:hover:bg-white/5"
                      )}
                    >
                      {s.selectMode && (
                        <span
                          className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded-md border",
                            s.selectedIds.includes(c.id)
                              ? "border-brand-500 bg-brand-500 text-white"
                              : "border-slate-300 dark:border-white/20"
                          )}
                        >
                          {s.selectedIds.includes(c.id) && <Check size={11} />}
                        </span>
                      )}
                      <span className="flex-1 truncate">{c.title}</span>
                    </button>
                  )}

                  {!s.selectMode && renaming !== c.id && (
                    <button
                      onClick={() => setMenuFor(menuFor === c.id ? null : c.id)}
                      className="absolute right-1.5 top-1/2 hidden -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:bg-white/70 group-hover:block dark:hover:bg-white/10"
                    >
                      <MoreHorizontal size={15} />
                    </button>
                  )}

                  {menuFor === c.id && (
                    <div ref={menuRef}>
                      <MenuShell className="right-2 top-9 w-[190px] p-1.5">
                        <MenuItem
                          icon={<Pencil size={14} />}
                          label="Rename"
                          onClick={() => {
                            setRenameVal(c.title);
                            setRenaming(c.id);
                            setMenuFor(null);
                          }}
                        />
                        {data.projects.length > 0 && (
                          <div className="my-1 border-t border-slate-200/60 pt-1 dark:border-white/10">
                            <div className="px-2.5 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-slate-400">
                              Move to
                            </div>
                            {data.projects.map((p) => (
                              <MenuItem
                                key={p.id}
                                icon={<Folder size={14} />}
                                label={p.name}
                                onClick={() => {
                                  s.moveToProject(c.id, p.id);
                                  setMenuFor(null);
                                }}
                              />
                            ))}
                            {c.projectId && (
                              <MenuItem
                                icon={<X size={14} />}
                                label="No project"
                                onClick={() => {
                                  s.moveToProject(c.id, null);
                                  setMenuFor(null);
                                }}
                              />
                            )}
                          </div>
                        )}
                        <div className="my-1 border-t border-slate-200/60 dark:border-white/10" />
                        <MenuItem
                          icon={
                            c.archived ? (
                              <ArchiveRestore size={14} />
                            ) : (
                              <Archive size={14} />
                            )
                          }
                          label={c.archived ? "Restore" : "Archive"}
                          onClick={() => {
                            s.archiveConv(c.id, !c.archived);
                            setMenuFor(null);
                          }}
                        />
                        <MenuItem
                          icon={<Trash2 size={14} />}
                          label="Delete"
                          danger
                          onClick={() => {
                            s.deleteConv(c.id);
                            setMenuFor(null);
                          }}
                        />
                      </MenuShell>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null
        )}
      </div>

      {/* select-mode action bar */}
      {s.selectMode && (
        <div className="mx-3 mb-2 flex items-center gap-2 rounded-2xl border border-brand-300/50 bg-brand-500/10 px-3 py-2 text-[12.5px] dark:border-brand-400/30">
          <span className="flex-1 text-slate-600 dark:text-slate-300">
            {s.selectedIds.length} dipilih
          </span>
          <button
            title="Arsipkan"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-white/60 dark:hover:bg-white/10"
            onClick={() => {
              s.selectedIds.forEach((id) => s.archiveConv(id, true));
              s.setSelectMode(false);
            }}
          >
            <Archive size={15} />
          </button>
          <button
            title="Hapus"
            className="rounded-lg p-1.5 text-red-500 hover:bg-red-500/10"
            onClick={() => {
              if (confirm(`Hapus ${s.selectedIds.length} percakapan?`)) {
                s.selectedIds.forEach((id) => s.deleteConv(id));
                s.setSelectMode(false);
              }
            }}
          >
            <Trash2 size={15} />
          </button>
          <button
            className="rounded-lg px-2 py-1 font-medium text-slate-500 hover:bg-white/60 dark:hover:bg-white/10"
            onClick={() => s.setSelectMode(false)}
          >
            Batal
          </button>
        </div>
      )}

      {/* bottom */}
      <div className="border-t border-white/50 p-3 pt-2.5 dark:border-white/10">
        <button
          onClick={() => setArchOpen(true)}
          className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-slate-500 transition hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/5"
        >
          <Archive size={15} />
          View archived
        </button>
        {data.conversations.length > 0 && !s.showArchived && (
          <button
            onClick={() => setConfirmClear(true)}
            className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-[13px] text-slate-500 transition hover:bg-white/60 dark:text-slate-400 dark:hover:bg-white/5"
          >
            <Trash2 size={15} />
            Clear all chat
          </button>
        )}
        <div className="mt-1 flex items-center gap-2.5 rounded-xl px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-[1.5px] border-slate-500 text-[12.5px] font-semibold text-slate-700 dark:border-white dark:text-white">
            {(me?.name || "?").charAt(0).toUpperCase()}
          </div>
          <span className="flex-1 truncate text-[13px] text-slate-600 dark:text-slate-300">
            {me?.email}
          </span>
          <button
            title="Sign out"
            onClick={() => s.signOut()}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/60 hover:text-slate-600 dark:hover:bg-white/10"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
      {archOpen && (
        <Modal onClose={() => setArchOpen(false)} className="w-[460px] p-0">
          <div className="flex items-center justify-between px-6 pb-3 pt-5">
            <div
              className="font-display text-[17px] font-semibold text-slate-800 dark:text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Archived chats
            </div>
            <button
              onClick={() => setArchOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-200"
            >
              <X size={17} />
            </button>
          </div>
          {(() => {
            const archived = data.conversations
              .filter((c) => c.archived)
              .sort((a, b) => b.updatedAt - a.updatedAt);
            if (archived.length === 0)
              return (
                <div className="flex flex-col items-center px-6 pb-10 pt-6 text-center">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-white/10">
                    <Archive size={18} />
                  </div>
                  <div className="mt-3 text-[14px] font-medium text-slate-700 dark:text-slate-200">
                    No archived chats yet
                  </div>
                  <p className="mt-1 max-w-[300px] text-[12.5px] leading-relaxed text-slate-500 dark:text-slate-400">
                    Arsipkan percakapan lewat menu <b>⋯</b> di daftar chat —
                    nanti semuanya muncul di sini.
                  </p>
                </div>
              );
            return (
              <div className="nice-scroll max-h-[380px] overflow-y-auto px-3 pb-4">
                {archived.map((c) => (
                  <div
                    key={c.id}
                    className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-slate-100 dark:hover:bg-white/5"
                  >
                    <button
                      className="flex min-w-0 flex-1 flex-col text-left"
                      onClick={() => {
                        s.setActive(c.id);
                        setArchOpen(false);
                        router.push("/app");
                      }}
                    >
                      <span className="truncate text-[13.5px] text-slate-700 dark:text-slate-200">
                        {c.title}
                      </span>
                      <span className="text-[11.5px] text-slate-400">
                        Diarsipkan · {timeAgo(c.updatedAt)}
                      </span>
                    </button>
                    <div className="hidden shrink-0 items-center gap-1 group-hover:flex">
                      <button
                        title="Restore"
                        onClick={() => s.archiveConv(c.id, false)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-white/70 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-slate-200"
                      >
                        <ArchiveRestore size={15} />
                      </button>
                      <button
                        title="Delete permanently"
                        onClick={() => s.deleteConv(c.id)}
                        className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </Modal>
      )}
      {confirmClear && (
        <Modal onClose={() => setConfirmClear(false)} className="w-[380px] p-6">
          <div
            className="font-display text-[17px] font-semibold text-slate-800 dark:text-white"
            style={{ letterSpacing: "-0.02em" }}
          >
            Hapus semua chat?
          </div>
          <p className="mt-2 text-[13.5px] leading-relaxed text-slate-500 dark:text-slate-400">
            Semua percakapan (termasuk arsip) akan dihapus permanen. Artifact di
            Drive tetap aman.
          </p>
          <div className="mt-5 flex justify-end gap-2.5">
            <button
              onClick={() => setConfirmClear(false)}
              className="rounded-xl px-4 py-2 text-[13.5px] font-medium text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            >
              Batal
            </button>
            <button
              onClick={() => {
                s.clearAll();
                setConfirmClear(false);
              }}
              className="rounded-xl bg-red-500 px-4 py-2 text-[13.5px] font-semibold text-white transition hover:bg-red-600"
            >
              Hapus semua
            </button>
          </div>
        </Modal>
      )}
    </aside>
  );
}

function MenuItem({
  icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[13px]",
        danger
          ? "text-red-500 hover:bg-red-500/10"
          : "text-slate-600 hover:bg-slate-900/[0.05] dark:text-slate-300 dark:hover:bg-white/10"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
