"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthShell, Field, inputCls } from "@/components/auth/AuthShell";
import { useDB } from "@/lib/store";
import { sha256 } from "@/lib/utils";

export default function SignUp() {
  const router = useRouter();
  const signUp = useDB((s) => s.signUp);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [pass2, setPass2] = useState("");
  const [show, setShow] = useState(false);
  const [show2, setShow2] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!name.trim()) return setErr("Nama tidak boleh kosong.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))
      return setErr("Format email tidak valid.");
    if (pass.length < 8) return setErr("Password minimal 8 karakter.");
    if (pass !== pass2) return setErr("Konfirmasi password tidak cocok.");
    setBusy(true);
    const hashed = await sha256(pass);
    const res = signUp({ name, email, pass: hashed });
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
        <h2 className="font-display text-[26px] font-semibold text-slate-100">
          Create your account
        </h2>
        <p className="mb-6 mt-1 text-[13.5px] text-slate-400">
          Join and start in seconds.
        </p>

        <div className="space-y-4">
          <Field label="Name">
            <input
              className={inputCls}
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
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
                placeholder="At least 8 characters"
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
          <Field label="Confirm password">
            <div className="relative">
              <input
                className={inputCls}
                placeholder="Re-enter password"
                type={show2 ? "text" : "password"}
                value={pass2}
                onChange={(e) => setPass2(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShow2(!show2)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {show2 ? <EyeOff size={17} /> : <Eye size={17} />}
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
          {busy ? "Creating…" : "Create account"}
        </button>

        <p className="mt-5 text-center text-[13px] text-slate-400">
          Already have an account?{" "}
          <Link
            href="/auth/signin"
            className="font-medium text-brand-300 hover:text-brand-200"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
