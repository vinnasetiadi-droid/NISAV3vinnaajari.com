"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";
import { useDB } from "@/lib/store";
import { sha256 } from "@/lib/utils";

export default function SignIn() {
  const router = useRouter();
  const signIn = useDB((s) => s.signIn);
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!email || !pass) return setErr("Isi email dan password dulu ya.");
    setBusy(true);
    const hashed = await sha256(pass);
    const res = signIn(email, hashed);
    setBusy(false);
    if (res) return setErr(res);
    router.replace("/app");
  };

  return (
    <AuthShell>
      <form
        onSubmit={submit}
        className="glass-dark animate-rise rounded-3xl p-7 md:p-8"
      >
        <h2 className="font-display text-[26px] font-semibold text-slate-100">Welcome back</h2>
        <p className="mb-6 mt-1 text-[13.5px] text-slate-400">
          Sign in to continue.
        </p>

        <div className="space-y-4">
          <Field label="Email">
            <input
              className={inputCls}
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input
                className={inputCls}
                placeholder="••••••••"
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
          </Field>
        </div>

        {err && (
          <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-2.5 text-[13px] text-red-300">
            {err}
          </div>
        )}

        <button
          disabled={busy}
          className="btn-gradient mt-6 w-full rounded-xl py-3 text-[14.5px] font-semibold disabled:opacity-60"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        <p className="mt-5 text-center text-[13px] text-slate-400">
          New here?{" "}
          <Link
            href="/auth/signup"
            className="font-medium text-brand-300 hover:text-brand-200"
          >
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
