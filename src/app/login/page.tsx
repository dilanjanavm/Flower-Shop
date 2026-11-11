"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { cn, normalisePhone } from "@/lib/format";
import { AuthShell, OtpInput } from "@/components/account/AuthShell";
import { Field } from "@/components/ui/bits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/account";
  const { login } = useStore();
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [phone, setPhone] = useState("");
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const done = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 600));
    login(id.includes("@") ? id : undefined);
    router.push(next);
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || pw.length < 8) return setErr("Enter your email or mobile and your password (8+ characters).");
    setErr("");
    void done();
  };

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders, upload slips and see your quotations.">
      <Button variant="outline" className="w-full" onClick={() => void done()}>
        <Icon name="google" size={18} /> Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-4 text-xs text-faint"><span className="h-px flex-1 bg-line" />or<span className="h-px flex-1 bg-line" /></div>

      <div className="mb-6 grid grid-cols-2 rounded-full bg-sand p-1 text-sm">
        {(["password", "otp"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setErr(""); }} className={cn("rounded-full py-2 transition", mode === m ? "bg-paper font-medium shadow-sm" : "text-muted")}>
            {m === "password" ? "Password" : "SMS code"}
          </button>
        ))}
      </div>

      {mode === "password" ? (
        <form onSubmit={submitPassword} className="space-y-4">
          <Field label="Email or mobile">
            <input className="field" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" placeholder="you@example.com or 077…" />
          </Field>
          <Field label="Password">
            <div className="relative">
              <input className="field pr-12" type={show ? "text" : "password"} value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
              <button type="button" onClick={() => setShow((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink" aria-label={show ? "Hide password" : "Show password"}>
                <Icon name="eye" size={18} />
              </button>
            </div>
          </Field>
          <div className="flex justify-end"><Link href="/forgot-password" className="text-sm text-muted underline-offset-4 hover:text-ink hover:underline">Forgot password?</Link></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
          <Button size="lg" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
        </form>
      ) : (
        <div className="space-y-4">
          {!sent ? (
            <>
              <Field label="Mobile number" error={err || undefined}>
                <input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="077 123 4567" />
              </Field>
              <Button size="lg" className="w-full" onClick={() => { if (!normalisePhone(phone)) return setErr("Enter a valid Sri Lankan mobile number"); setErr(""); setSent(true); setCooldown(60); }}>Send code</Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted">We sent a 6-digit code to <strong className="text-ink">{normalisePhone(phone)}</strong>. It expires in 5 minutes.</p>
              <OtpInput value={code} onChange={setCode} />
              <Button size="lg" className="w-full" disabled={code.length < 6 || busy} onClick={() => void done()}>{busy ? "Verifying…" : "Verify & sign in"}</Button>
              <button disabled={cooldown > 0} onClick={() => setCooldown(60)} className="w-full text-center text-sm text-muted disabled:opacity-60">
                {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
              </button>
            </>
          )}
        </div>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        New to Sithuliya Flora? <Link href={`/register?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline underline-offset-4">Create an account</Link>
      </p>
      <p className="mt-3 text-center text-xs text-faint">Demo: any email + 8-character password signs you in.</p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
