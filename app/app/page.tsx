"use client";

import { useRef, useState } from "react";
import { HomeView } from "@/components/chat/HomeView";
import { ChatView } from "@/components/chat/ChatView";
import { ArtifactPanel } from "@/components/artifact/ArtifactPanel";
import { sendMessage } from "@/lib/engine";
import { useDB } from "@/lib/store";

export default function AppPage() {
  const s = useDB();
  const data = s.d();
  const [expandArtifact, setExpandArtifact] = useState(false);
  const [panelW, setPanelW] = useState<number | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Drag pembatas kiri panel artifact untuk melebarkan/mengecilkan. */
  const startPanelResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW =
      panelRef.current?.getBoundingClientRect().width || window.innerWidth * 0.52;
    const onMove = (ev: MouseEvent) => {
      const w = Math.min(
        window.innerWidth - 480,
        Math.max(380, startW + (startX - ev.clientX))
      );
      setPanelW(w);
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  // Prompt dari landing tidak dikirim otomatis — user mendarat di home
  // (Welcome Back) dan promptnya sudah terisi di input (lihat HomeView).
  const conv = data.conversations.find((c) => c.id === s.activeConvId) || null;
  const artifact = s.openArtifactId
    ? data.artifacts.find((a) => a.id === s.openArtifactId)
    : null;

  return (
    <>
      <main className="flex min-w-0 flex-1">
        {conv && !(artifact && expandArtifact) ? (
          <ChatView conv={conv} />
        ) : artifact && expandArtifact ? null : (
          <HomeView
            onSend={(t, files) => {
              sendMessage(t, { attachments: files });
              files.forEach((f) =>
                useDB.getState().addFile({
                  name: f.name,
                  size: f.size,
                  mime: f.mime,
                  category: "attachment",
                  dataUrl: f.dataUrl,
                  text: f.text,
                })
              );
            }}
          />
        )}
        {artifact && (
          <div
            ref={panelRef}
            style={
              !expandArtifact && panelW ? { width: panelW } : undefined
            }
            className={
              expandArtifact
                ? "flex min-w-0 flex-1"
                : panelW
                ? "relative hidden shrink-0 md:flex"
                : "relative hidden w-[52%] min-w-[420px] max-w-[900px] md:flex"
            }
          >
            {!expandArtifact && (
              <div
                onMouseDown={startPanelResize}
                className="group absolute -left-[3px] top-0 z-40 h-full w-[7px] cursor-col-resize"
              >
                <div className="absolute left-[2px] top-1/2 h-16 w-[3px] -translate-y-1/2 rounded-full transition group-hover:bg-slate-400/50 dark:group-hover:bg-white/25" />
              </div>
            )}
            <ArtifactPanel
              artifactId={artifact.id}
              expanded={expandArtifact}
              onToggleExpand={() => setExpandArtifact((v) => !v)}
              onClose={() => {
                s.setOpenArtifact(null);
                setExpandArtifact(false);
              }}
            />
          </div>
        )}
      </main>
    </>
  );
}
