"use client";

import { Suspense, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Clock,
  Code2,
  Download,
  FileText,
  FolderPlus,
  Folder as FolderIcon,
  Trash2,
  Upload,
} from "lucide-react";
import { Modal, useToast } from "@/components/ui";
import { ArtifactPanel } from "@/components/artifact/ArtifactPanel";
import { storageUsage, useDB } from "@/lib/store";
import { cn, downloadText, fmtBytes, timeAgo } from "@/lib/utils";
import type { DriveFile } from "@/lib/types";

const QUOTA = 5 * 1024 * 1024 * 1024; // 5 GB display quota

type Tab = "documents" | "artifacts" | "attachments";

/* ---------- kartu galeri ala Claude ---------- */

function GalleryCard({
  title,
  meta,
  preview,
  onOpen,
  actions,
}: {
  title: string;
  meta: string;
  preview: React.ReactNode;
  onOpen: () => void;
  actions?: React.ReactNode;
}) {
  return (
    <div className="group relative">
      <button
        onClick={onOpen}
        className="flex h-[250px] w-full flex-col overflow-hidden rounded-xl border border-slate-200/80 bg-white text-left transition hover:border-slate-300 dark:border-white/10 dark:bg-white/[0.03] dark:hover:border-white/25 dark:hover:bg-white/[0.05]"
      >
        {/* pratinjau konten */}
        <div className="relative min-h-0 w-full flex-1 overflow-hidden">
          {preview}
        </div>
        {/* meta bar */}
        <div className="w-full border-t border-slate-200/70 px-4 py-3 dark:border-white/[0.07]">
          <div className="line-clamp-2 text-[14px] font-medium leading-snug text-slate-800 dark:text-slate-100">
            {title}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[12px] text-slate-400 dark:text-slate-500">
            <Clock size={11} />
            {meta}
          </div>
        </div>
      </button>
      {actions && (
        <div className="absolute right-2.5 top-2.5 hidden gap-1 group-hover:flex">
          {actions}
        </div>
      )}
    </div>
  );
}

function IconAction({
  title,
  onClick,
  danger,
  children,
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-lg border border-slate-200 bg-white/90 p-1.5 shadow-glass backdrop-blur dark:border-white/10 dark:bg-[#10141c]/90",
        danger
          ? "text-red-400 hover:text-red-600"
          : "text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

/* ---------- halaman ---------- */

function DrivePageInner() {
  const s = useDB();
  const data = s.d();
  const toast = useToast();
  const params = useSearchParams();
  const [tab, setTab] = useState<Tab>(
    (params.get("tab") as Tab) || "documents"
  );
  const [folderId, setFolderId] = useState<string | null>(null);
  const [openArt, setOpenArt] = useState<string | null>(null);
  const [openFile, setOpenFile] = useState<DriveFile | null>(null);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const usage = useMemo(() => storageUsage(data), [data]);

  const docs = data.files.filter((f) => f.category === "document");
  const atts = data.files.filter((f) => f.category === "attachment");

  const addUploads = async (list: FileList | File[] | null) => {
    if (!list) return;
    let added = 0;
    for (const f of Array.from(list)) {
      if (f.size > 2 * 1024 * 1024) {
        toast(`${f.name} skipped (max 2 MB for local storage)`);
        continue;
      }
      const isText =
        f.type.startsWith("text/") ||
        /\.(md|txt|csv|json|html?)$/i.test(f.name);
      const entry: any = {
        name: f.name,
        size: f.size,
        mime: f.type || "file",
        category: "document",
        folderId,
      };
      if (isText) entry.text = await f.text();
      else
        entry.dataUrl = await new Promise<string>((res) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result));
          r.readAsDataURL(f);
        });
      s.addFile(entry);
      added++;
    }
    if (added) toast(`${added} file${added > 1 ? "s" : ""} uploaded & indexed`);
  };

  const seg = (n: number) => `${Math.max(0, (n / QUOTA) * 100)}%`;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "documents", label: "Documents", count: docs.length },
    { id: "artifacts", label: "Artifacts", count: data.artifacts.length },
    { id: "attachments", label: "Attachments", count: atts.length },
  ];

  const visibleDocs = docs.filter((f) =>
    folderId ? f.folderId === folderId : true
  );

  /* pratinjau file: teks → snippet, gambar → thumbnail, lainnya → ikon */
  const filePreview = (f: DriveFile) => {
    if (f.text)
      return (
        <div className="fade-edge-b h-full w-full p-4">
          <p className="whitespace-pre-wrap break-words text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
            {f.text.slice(0, 700)}
          </p>
        </div>
      );
    if (f.dataUrl && f.mime.startsWith("image/"))
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={f.dataUrl}
          alt={f.name}
          className="h-full w-full object-cover"
        />
      );
    return (
      <div className="flex h-full w-full items-center justify-center">
        <FileText size={30} className="text-slate-300 dark:text-slate-600" />
      </div>
    );
  };

  const fileGrid = (files: DriveFile[], uploadedLabel: string) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {files.map((f) => (
        <GalleryCard
          key={f.id}
          title={f.name}
          meta={`${uploadedLabel} ${timeAgo(f.createdAt)} · ${fmtBytes(f.size)}`}
          preview={filePreview(f)}
          onOpen={() => setOpenFile(f)}
          actions={
            <>
              <IconAction
                title="Download"
                onClick={() => {
                  if (f.text) downloadText(f.name, f.text, f.mime);
                  else if (f.dataUrl) {
                    const a = document.createElement("a");
                    a.href = f.dataUrl;
                    a.download = f.name;
                    a.click();
                  }
                }}
              >
                <Download size={13} />
              </IconAction>
              <IconAction title="Delete" danger onClick={() => s.deleteFile(f.id)}>
                <Trash2 size={13} />
              </IconAction>
            </>
          }
        />
      ))}
    </div>
  );

  return (
    <main className="nice-scroll min-w-0 flex-1 overflow-y-auto">
      {/* header */}
      <div className="sticky top-0 z-20 flex items-center gap-3 px-7 py-4 backdrop-blur-sm">
        <h1
          className="font-display text-[20px] font-semibold text-slate-800 dark:text-slate-100"
          style={{ letterSpacing: "-0.02em" }}
        >
          Drive
        </h1>
        <div className="flex-1" />
        <span className="font-mono text-[12px] text-slate-400">
          {fmtBytes(usage.total)} / 5.0 GB
        </span>
      </div>

      <div className="mx-auto max-w-[1000px] px-7 pb-16">
        {/* storage card */}
        <div className="glass rounded-3xl p-5">
          <div className="flex items-baseline justify-between">
            <span className="text-[14.5px] font-semibold text-slate-700 dark:text-slate-200">
              Storage
            </span>
            <span className="font-mono text-[12.5px] text-brand-500">
              {fmtBytes(usage.total)} of 5.0 GB
            </span>
          </div>
          <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-slate-900/[0.08] dark:bg-white/10">
            <div className="bg-brand-500" style={{ width: seg(usage.documents) }} />
            <div className="bg-teal2" style={{ width: seg(usage.attachments) }} />
            <div className="bg-cyan-400" style={{ width: seg(usage.artifacts) }} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-5 text-[12px] text-slate-500 dark:text-slate-400">
            <Legend color="bg-brand-500" label="Documents" val={usage.documents} />
            <Legend color="bg-teal2" label="Attachments" val={usage.attachments} />
            <Legend color="bg-cyan-400" label="Artifacts" val={usage.artifacts} />
            <span className="ml-auto">{fmtBytes(QUOTA - usage.total)} free</span>
          </div>
        </div>

        {/* dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            addUploads(e.dataTransfer.files);
          }}
          className={cn(
            "mt-5 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed py-10 transition",
            drag
              ? "border-brand-400 bg-brand-500/10"
              : "border-slate-300/70 bg-white/30 dark:border-white/15 dark:bg-white/[0.03]"
          )}
        >
          <input
            ref={fileRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              addUploads(e.target.files);
              e.target.value = "";
            }}
          />
          <Upload size={22} className="mb-2 text-slate-400" />
          <div className="text-[14px] text-slate-600 dark:text-slate-300">
            Drag &amp; drop files here, or{" "}
            <button
              onClick={() => fileRef.current?.click()}
              className="font-semibold text-brand-500 hover:underline"
            >
              browse
            </button>
          </div>
          <div className="mt-1 text-[12.5px] text-slate-400">
            Documents are indexed automatically so you can ask about them.
          </div>
        </div>

        {/* tabs */}
        <div className="glass mt-6 inline-flex rounded-full p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setFolderId(null);
              }}
              className={cn(
                "flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium transition",
                tab === t.id
                  ? "bg-white text-slate-800 shadow-glass dark:bg-white/20 dark:text-white"
                  : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
              )}
            >
              {t.label}
              <span className="rounded-full bg-slate-900/[0.07] px-1.5 py-0.5 text-[10.5px] dark:bg-white/10">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* documents tab */}
        {tab === "documents" && (
          <div className="mt-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[14px] font-semibold text-slate-700 dark:text-slate-200">
                {folderId ? (
                  <button
                    onClick={() => setFolderId(null)}
                    className="hover:underline"
                  >
                    Drive
                  </button>
                ) : (
                  "Drive"
                )}
                {folderId && (
                  <span>
                    {" / "}
                    {data.folders.find((f) => f.id === folderId)?.name}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  const name = prompt("New folder name:");
                  if (name?.trim()) s.addFolder(name.trim());
                }}
                className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[12.5px] font-medium text-brand-600 transition hover:bg-brand-500/10 dark:text-brand-300"
              >
                <FolderPlus size={15} />
                New folder
              </button>
            </div>

            {!folderId && data.folders.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {data.folders.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFolderId(f.id)}
                    className="glass flex items-center gap-2.5 rounded-2xl p-3.5 text-left transition hover:-translate-y-0.5"
                  >
                    <FolderIcon size={18} className="shrink-0 text-amber-400" />
                    <span className="truncate text-[13px] font-medium text-slate-600 dark:text-slate-300">
                      {f.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {visibleDocs.length === 0 ? (
              <EmptyState text="This folder is empty. Upload files or create a folder." />
            ) : (
              fileGrid(visibleDocs, "Uploaded")
            )}
          </div>
        )}

        {/* artifacts tab — galeri ala Claude */}
        {tab === "artifacts" && (
          <div className="mt-6">
            {data.artifacts.length === 0 ? (
              <EmptyState text="No artifacts yet. Try /quiz or /anagram in chat." />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {data.artifacts.map((a) => (
                  <GalleryCard
                    key={a.id}
                    title={a.title}
                    meta={`Edited ${timeAgo(a.updatedAt)} · v${a.versions.length}`}
                    preview={
                      <div className="flex h-full w-full items-center justify-center">
                        <Code2
                          size={30}
                          className="text-slate-300 dark:text-slate-600"
                        />
                      </div>
                    }
                    onOpen={() => setOpenArt(a.id)}
                    actions={
                      <>
                        <IconAction
                          title="Download"
                          onClick={() =>
                            downloadText(
                              a.title.replace(/[^\w\s-]/g, "").trim() + ".html",
                              a.versions[a.versions.length - 1].html
                            )
                          }
                        >
                          <Download size={13} />
                        </IconAction>
                        <IconAction
                          title="Delete"
                          danger
                          onClick={() => s.deleteArtifact(a.id)}
                        >
                          <Trash2 size={13} />
                        </IconAction>
                      </>
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* attachments tab */}
        {tab === "attachments" && (
          <div className="mt-6">
            {atts.length === 0 ? (
              <EmptyState text="Attachments from chat will show up here." />
            ) : (
              fileGrid(atts, "Attached")
            )}
          </div>
        )}
      </div>

      {/* artifact viewer */}
      {openArt && (
        <Modal
          onClose={() => setOpenArt(null)}
          className="h-[86vh] w-[960px] max-w-[94vw] overflow-hidden p-0"
        >
          <ArtifactPanel
            artifactId={openArt}
            onClose={() => setOpenArt(null)}
            floating
          />
        </Modal>
      )}

      {/* file viewer */}
      {openFile && (
        <Modal
          onClose={() => setOpenFile(null)}
          className="flex h-[80vh] w-[820px] max-w-[94vw] flex-col overflow-hidden p-0"
        >
          <div className="flex items-center gap-3 border-b border-slate-200/70 px-5 py-3.5 dark:border-white/10">
            <FileText size={16} className="text-slate-400" />
            <span className="flex-1 truncate text-[14px] font-medium text-slate-800 dark:text-slate-100">
              {openFile.name}
            </span>
            <span className="text-[12px] text-slate-400">
              {fmtBytes(openFile.size)}
            </span>
            <button
              onClick={() => {
                if (openFile.text)
                  downloadText(openFile.name, openFile.text, openFile.mime);
                else if (openFile.dataUrl) {
                  const a = document.createElement("a");
                  a.href = openFile.dataUrl;
                  a.download = openFile.name;
                  a.click();
                }
              }}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <Download size={15} />
            </button>
          </div>
          <div className="nice-scroll min-h-0 flex-1 overflow-y-auto p-6">
            {openFile.text ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-[13.5px] leading-relaxed text-slate-700 dark:text-slate-300">
                {openFile.text}
              </pre>
            ) : openFile.dataUrl && openFile.mime.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={openFile.dataUrl}
                alt={openFile.name}
                className="mx-auto max-h-full rounded-xl"
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-400">
                <FileText size={28} />
                <span className="text-[13.5px]">
                  Preview not available — download to open.
                </span>
              </div>
            )}
          </div>
        </Modal>
      )}
    </main>
  );
}

function Legend({
  color,
  label,
  val,
}: {
  color: string;
  label: string;
  val: number;
}) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      {label} <span className="font-mono text-brand-500">{fmtBytes(val)}</span>
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center py-14 text-slate-400">
      <Clock size={22} className="mb-3" />
      <span className="text-[13.5px]">{text}</span>
    </div>
  );
}

export default function DrivePage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <DrivePageInner />
    </Suspense>
  );
}
