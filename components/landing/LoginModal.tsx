"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, X } from "lucide-react";
import { useToast } from "@/components/ui";
import { useDB } from "@/lib/store";
import { cn, sha256 } from "@/lib/utils";

/* ---- brand icons (inline, colored) ---- */

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.1 18.9 12 24 12c3.1 0 5.8 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C41.4 34.9 44 30 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.6 6.7a5.6 5.6 0 0 1-3.4-3.5c-.1-.4-.2-.8-.2-1.2h-3.5v13.6a2.9 2.9 0 1 1-2.1-2.8V9.2a6.4 6.4 0 1 0 5.6 6.4V8.9a9 9 0 0 0 4.6 1.3V6.8c-.3 0-.7 0-1-.1z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path
        fill="#1877F2"
        d="M24 12a12 12 0 1 0-13.9 11.9v-8.4h-3V12h3V9.4c0-3 1.8-4.7 4.6-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"
      />
    </svg>
  );
}

/* ---- modal ---- */

export function LoginModal({
  open,
  onClose,
  initialMode = "signin",
  variant = "default",
}: {
  open: boolean;
  onClose: () => void;
  initialMode?: "signup" | "signin";
  /** "default" = dari tombol Sign in · "limit" = jatah 3 chat gratis habis */
  variant?: "default" | "limit";
}) {
  const router = useRouter();
  const toast = useToast();
  const signUp = useDB((s) => s.signUp);
  const signIn = useDB((s) => s.signIn);
  const [mode, setMode] = useState<"signup" | "signin">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const social = () =>
    toast("Social login is not available in the demo yet — use email or Google 😊");

  // Demo: Google login instan — masuk dengan akun Google tiruan tanpa OAuth.
  const googleDemo = async () => {
    setBusy(true);
    const hashed = await sha256("nisa-google-demo");
    const gEmail = "zanjabila.google@gmail.com";
    let res = signIn(gEmail, hashed);
    if (res) res = signUp({ name: "Zanjabila", email: gEmail, pass: hashed });
    setBusy(false);
    if (res) return setErr(res);
    router.push("/app");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    // Demo: Sign in tanpa mengisi apa pun → langsung masuk dengan akun demo
    if (mode === "signin" && !email.trim() && !pass) return googleDemo();
    if (mode === "signup" && !name.trim())
      return setErr("Name cannot be empty.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setErr("Invalid email format.");
    if (pass.length < 8) return setErr("Password must be at least 8 characters.");
    setBusy(true);
    const hashed = await sha256(pass);
    const res =
      mode === "signup"
        ? signUp({ name, email, pass: hashed })
        : signIn(email, hashed);
    setBusy(false);
    if (res) return setErr(res);
    router.push("/app");
  };


  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="animate-rise grid w-full max-w-[960px] overflow-hidden rounded-[26px] border border-white/10 shadow-2xl md:grid-cols-2">
        {/* left preview pane — ilustrasi NISA */}
        <div className="relative hidden bg-[#0b0e14] md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={variant === "limit" ? "/gate-preview.png" : "/login-preview.png"}
            alt="Preview NISA"
            className="h-full w-full object-cover"
          />
          {variant === "limit" && (
            <div className="absolute inset-x-0 bottom-0 top-[46%] flex flex-col items-center px-10 text-center">
              <h2
                className="font-display text-[27px] font-semibold leading-tight text-white"
                style={{ letterSpacing: "-0.02em" }}
              >
                That&rsquo;s your 3 free chats!
              </h2>
              <p className="mt-3 max-w-[290px] text-[14px] leading-relaxed text-slate-300">
                Sign in to keep the conversation going — your chat stays right
                where you left it, and quizzes, games, and documents unlock too.
              </p>
            </div>
          )}
        </div>

        {/* right auth pane */}
        <div className="glass-mac-strong relative flex flex-col justify-center rounded-none border-0 px-8 py-10 md:px-12">
          <button
            onClick={onClose}
            className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-500 transition hover:bg-white/10 hover:text-slate-200"
          >
            <X size={20} />
          </button>

          <div className="mb-8 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo-nisa.png" alt="NISA" className="h-8 w-auto" />
          </div>
          {mode === "signin" && (
            <p className="-mt-3 mb-8 text-center text-[15px] text-slate-400">
              {variant === "limit"
                ? "Sign in to continue chatting — it's free."
                : "Welcome back — sign in to continue."}
            </p>
          )}

          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-slate-100 placeholder:text-slate-500 focus:border-brand-400"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}
            <input
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-slate-100 placeholder:text-slate-500 focus:border-brand-400"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <div className="relative">
              <input
                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-[14px] text-slate-100 placeholder:text-slate-500 focus:border-brand-400"
                placeholder="Password (min. 8 characters)"
                type={show ? "text" : "password"}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {show ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* slot error tinggi tetap — ukuran modal tidak berubah saat error muncul */}
            <div
              aria-live="polite"
              className="flex h-5 items-center justify-center text-[12.5px] text-red-300"
            >
              {err}
            </div>

            <button
              disabled={busy}
              className="w-full rounded-xl bg-[#0a70ff] py-3 text-[15px] font-semibold text-white transition hover:bg-[#2a84ff] disabled:opacity-60"
            >
              {busy
                ? "One moment…"
                : mode === "signup"
                ? "Create account"
                : "Sign in"}
            </button>

            <div className="pt-1 text-center text-[13px] text-slate-500">
              {mode === "signup"
                ? "Already have an account? "
                : "Don\u2019t have an account yet? "}
              <button
                type="button"
                onClick={() => {
                  setMode(mode === "signup" ? "signin" : "signup");
                  setErr(null);
                }}
                className="font-semibold text-brand-400 hover:text-brand-300"
              >
                {mode === "signup" ? "Sign in" : "Sign up"}
              </button>
            </div>

            {/* social sign-in: baris ikon di bawah */}
            <div className="flex items-center gap-3 pt-2 text-[12px] uppercase tracking-wider text-slate-600">
              <span className="h-px flex-1 bg-white/10" />
              or continue with
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                title="Continue with Google"
                onClick={googleDemo}
                disabled={busy}
                className="flex h-11 w-11 items-center justify-center rounded-full bg-white transition hover:bg-slate-200 disabled:opacity-60"
              >
                <GoogleIcon />
              </button>
              <button
                type="button"
                title="Continue with TikTok"
                onClick={social}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/[0.12]"
              >
                <TikTokIcon />
              </button>
              <button
                type="button"
                title="Continue with Facebook"
                onClick={social}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200 transition hover:bg-white/[0.12]"
              >
                <FacebookIcon />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
