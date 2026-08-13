"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Artifact,
  Conversation,
  DriveFile,
  Folder,
  Message,
  ModeId,
  Project,
  User,
  UserData,
} from "./types";
import { estimateTokens, uid } from "./utils";

const emptyData = (): UserData => ({
  conversations: [],
  artifacts: [],
  files: [],
  folders: [],
  projects: [],
  recent: [],
});

interface Health {
  live: boolean;
  model: string;
}

interface DBState {
  users: User[];
  sessionUserId: string | null;
  data: Record<string, UserData>;
  theme: "light" | "dark";
  activeConvId: string | null;

  // volatile UI (persisted harmlessly)
  openArtifactId: string | null;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  aiModel: string;
  selectMode: boolean;
  selectedIds: string[];
  showArchived: boolean;
  filterProjectId: string | null;
  paletteOpen: boolean;
  health: Health | null;

  // ---- auth ----
  signUp: (u: { name: string; email: string; pass: string }) => string | null;
  signIn: (email: string, pass: string) => string | null;
  signOut: () => void;

  // ---- helpers ----
  me: () => User | null;
  d: () => UserData;
  patchData: (fn: (d: UserData) => UserData) => void;

  // ---- conversations ----
  newConversation: (mode?: ModeId) => Conversation;
  setActive: (id: string | null) => void;
  appendMsg: (convId: string, msg: Message) => void;
  patchMsg: (convId: string, msgId: string, patch: Partial<Message>) => void;
  patchConv: (convId: string, patch: Partial<Conversation>) => void;
  setMessages: (convId: string, messages: Message[]) => void;
  deleteConv: (id: string) => void;
  archiveConv: (id: string, val: boolean) => void;
  clearAll: () => void;
  recomputeTokens: (convId: string) => void;

  // ---- projects ----
  addProject: (name: string) => void;
  moveToProject: (convId: string, projectId: string | null) => void;

  // ---- artifacts ----
  addArtifact: (a: {
    title: string;
    html: string;
    kind: "document" | "game";
    convId?: string | null;
  }) => Artifact;
  addArtifactVersion: (id: string, html: string) => void;
  renameArtifact: (id: string, title: string) => void;
  deleteArtifact: (id: string) => void;

  // ---- drive ----
  addFile: (f: Omit<DriveFile, "id" | "createdAt">) => DriveFile;
  deleteFile: (id: string) => void;
  addFolder: (name: string) => void;
  addRecent: (text: string) => void;

  // ---- ui ----
  setTheme: (t: "light" | "dark") => void;
  setOpenArtifact: (id: string | null) => void;
  setSidebarCollapsed: (v: boolean) => void;
  setSidebarWidth: (w: number) => void;
  setAiModel: (m: string) => void;
  setSelectMode: (v: boolean) => void;
  toggleSelected: (id: string) => void;
  setShowArchived: (v: boolean) => void;
  setFilterProject: (id: string | null) => void;
  setPaletteOpen: (v: boolean) => void;
  setHealth: (h: Health) => void;
}

export const useDB = create<DBState>()(
  persist(
    (set, get) => ({
      users: [],
      sessionUserId: null,
      data: {},
      theme: "dark",
      activeConvId: null,
      openArtifactId: null,
      sidebarCollapsed: false,
      sidebarWidth: 236,
      aiModel: "raa",
      selectMode: false,
      selectedIds: [],
      showArchived: false,
      filterProjectId: null,
      paletteOpen: false,
      health: null,

      signUp: ({ name, email, pass }) => {
        const em = email.trim().toLowerCase();
        if (get().users.some((u) => u.email === em))
          return "Email sudah terdaftar. Silakan sign in.";
        const user: User = {
          id: uid("u_"),
          name: name.trim(),
          email: em,
          pass,
          createdAt: Date.now(),
        };
        set((s) => ({
          users: [...s.users, user],
          sessionUserId: user.id,
          data: { ...s.data, [user.id]: emptyData() },
          activeConvId: null,
          sidebarCollapsed: true,
        }));
        return null;
      },

      signIn: (email, pass) => {
        const em = email.trim().toLowerCase();
        const user = get().users.find((u) => u.email === em);
        if (!user) return "Akun tidak ditemukan. Coba buat akun dulu.";
        if (user.pass !== pass) return "Password salah. Coba lagi ya.";
        set((s) => ({
          sessionUserId: user.id,
          data: s.data[user.id] ? s.data : { ...s.data, [user.id]: emptyData() },
          activeConvId: null,
          openArtifactId: null,
          sidebarCollapsed: true,
        }));
        return null;
      },

      signOut: () =>
        set({ sessionUserId: null, activeConvId: null, openArtifactId: null }),

      me: () => {
        const s = get();
        return s.users.find((u) => u.id === s.sessionUserId) || null;
      },

      d: () => {
        const s = get();
        return (s.sessionUserId && s.data[s.sessionUserId]) || emptyData();
      },

      patchData: (fn) =>
        set((s) => {
          if (!s.sessionUserId) return {};
          const cur = s.data[s.sessionUserId] || emptyData();
          return { data: { ...s.data, [s.sessionUserId]: fn(cur) } };
        }),

      newConversation: (mode = "auto") => {
        const conv: Conversation = {
          id: uid("c_"),
          title: "New chat",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          archived: false,
          projectId: get().filterProjectId,
          mode,
          messages: [],
          tokens: 0,
        };
        get().patchData((d) => ({
          ...d,
          conversations: [conv, ...d.conversations],
        }));
        set({ activeConvId: conv.id, openArtifactId: null });
        return conv;
      },

      setActive: (id) => set({ activeConvId: id, openArtifactId: null }),

      appendMsg: (convId, msg) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === convId
              ? { ...c, messages: [...c.messages, msg], updatedAt: Date.now() }
              : c
          ),
        })),

      patchMsg: (convId, msgId, patch) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === convId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === msgId ? { ...m, ...patch } : m
                  ),
                }
              : c
          ),
        })),

      patchConv: (convId, patch) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === convId ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        })),

      setMessages: (convId, messages) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === convId ? { ...c, messages } : c
          ),
        })),

      deleteConv: (id) => {
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.filter((c) => c.id !== id),
        }));
        if (get().activeConvId === id) set({ activeConvId: null });
      },

      archiveConv: (id, val) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === id ? { ...c, archived: val } : c
          ),
        })),

      clearAll: () => {
        get().patchData((d) => ({ ...d, conversations: [] }));
        set({ activeConvId: null });
      },

      recomputeTokens: (convId) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) => {
            if (c.id !== convId) return c;
            const chars = c.messages.reduce(
              (n, m) => n + (m.content?.length || 0),
              0
            );
            return { ...c, tokens: estimateTokens(chars) };
          }),
        })),

      addProject: (name) =>
        get().patchData((d) => ({
          ...d,
          projects: [
            ...d.projects,
            { id: uid("p_"), name, createdAt: Date.now() },
          ],
        })),

      moveToProject: (convId, projectId) =>
        get().patchData((d) => ({
          ...d,
          conversations: d.conversations.map((c) =>
            c.id === convId ? { ...c, projectId } : c
          ),
        })),

      addArtifact: ({ title, html, kind, convId }) => {
        const a: Artifact = {
          id: uid("a_"),
          title,
          kind,
          convId: convId ?? null,
          versions: [{ html, createdAt: Date.now() }],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        get().patchData((d) => ({ ...d, artifacts: [a, ...d.artifacts] }));
        return a;
      },

      addArtifactVersion: (id, html) =>
        get().patchData((d) => ({
          ...d,
          artifacts: d.artifacts.map((a) =>
            a.id === id
              ? {
                  ...a,
                  versions: [...a.versions, { html, createdAt: Date.now() }],
                  updatedAt: Date.now(),
                }
              : a
          ),
        })),

      renameArtifact: (id, title) =>
        get().patchData((d) => ({
          ...d,
          artifacts: d.artifacts.map((a) =>
            a.id === id ? { ...a, title } : a
          ),
        })),

      deleteArtifact: (id) => {
        get().patchData((d) => ({
          ...d,
          artifacts: d.artifacts.filter((a) => a.id !== id),
        }));
        if (get().openArtifactId === id) set({ openArtifactId: null });
      },

      addFile: (f) => {
        const file: DriveFile = { ...f, id: uid("f_"), createdAt: Date.now() };
        get().patchData((d) => ({ ...d, files: [file, ...d.files] }));
        return file;
      },

      deleteFile: (id) =>
        get().patchData((d) => ({
          ...d,
          files: d.files.filter((f) => f.id !== id),
        })),

      addFolder: (name) =>
        get().patchData((d) => ({
          ...d,
          folders: [
            ...d.folders,
            { id: uid("fd_"), name, createdAt: Date.now() },
          ],
        })),

      addRecent: (text) =>
        get().patchData((d) => ({
          ...d,
          recent: [text, ...d.recent.filter((r) => r !== text)].slice(0, 8),
        })),

      setTheme: (t) => {
        document.documentElement.classList.toggle("dark", t === "dark");
        set({ theme: t });
      },
      setOpenArtifact: (id) => set({ openArtifactId: id }),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      setSidebarWidth: (w) => set({ sidebarWidth: w }),
      setAiModel: (m) => set({ aiModel: m }),
      setSelectMode: (v) => set({ selectMode: v, selectedIds: [] }),
      toggleSelected: (id) =>
        set((s) => ({
          selectedIds: s.selectedIds.includes(id)
            ? s.selectedIds.filter((x) => x !== id)
            : [...s.selectedIds, id],
        })),
      setShowArchived: (v) => set({ showArchived: v }),
      setFilterProject: (id) => set({ filterProjectId: id }),
      setPaletteOpen: (v) => set({ paletteOpen: v }),
      setHealth: (h) => set({ health: h }),
    }),
    {
      name: "nisa-db-v3",
      version: 1,
      // v1: tema default berpindah ke dark — migrasikan data lama sekali.
      migrate: (persisted: any, version) => {
        if (version === 0 && persisted) persisted.theme = "dark";
        return persisted;
      },
      partialize: (s) => ({
        users: s.users,
        sessionUserId: s.sessionUserId,
        data: s.data,
        theme: s.theme,
        activeConvId: s.activeConvId,
        sidebarWidth: s.sidebarWidth,
        aiModel: s.aiModel,
      }),
    }
  )
);

/** Aggregate storage usage (bytes) per category. */
export function storageUsage(d: UserData) {
  const documents = d.files
    .filter((f) => f.category === "document")
    .reduce((n, f) => n + f.size, 0);
  const attachments = d.files
    .filter((f) => f.category === "attachment")
    .reduce((n, f) => n + f.size, 0);
  const artifacts = d.artifacts.reduce(
    (n, a) => n + a.versions.reduce((m, v) => m + v.html.length, 0),
    0
  );
  return { documents, attachments, artifacts, total: documents + attachments + artifacts };
}
