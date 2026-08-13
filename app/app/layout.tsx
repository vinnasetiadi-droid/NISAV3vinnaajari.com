"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { StatusBar } from "@/components/shell/StatusBar";
import { CommandPalette } from "@/components/shell/CommandPalette";
import { ToastProvider } from "@/components/ui";
import { useDB } from "@/lib/store";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const session = useDB((s) => s.sessionUserId);
  const theme = useDB((s) => s.theme);
  const setHealth = useDB((s) => s.setHealth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    // Belum login → kembali ke landing (pop-up login ada di sana), bukan halaman auth lama.
    if (mounted && !session) router.replace("/");
  }, [mounted, session, router]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, [setHealth]);

  if (!mounted || !session)
    return <div className="bg-app-light h-screen" />;

  return (
    <ToastProvider>
      <div className="bg-app-light flex h-screen overflow-hidden">
        {/* kolom kiri: sidebar floating + pill search/commands tepat di bawahnya */}
        <div className="flex min-h-0 shrink-0 flex-col gap-2 p-2.5 pr-0">
          <Suspense fallback={<div className="w-[236px] flex-1" />}>
            <Sidebar />
          </Suspense>
          <StatusBar />
        </div>
        <div className="flex min-h-0 min-w-0 flex-1">{children}</div>
        <CommandPalette />
      </div>
    </ToastProvider>
  );
}
