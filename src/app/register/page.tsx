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
import { IMG } from "@/lib/mock/images";

function RegisterForm() {
  const router = useRouter();
  const next = useSearchParams().get("next") ?? "/account";
  const { login, toast } = useStore();
  const [f, setF] = useState({ name: "", email: "", phone: "", pw: "", consent: false });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<"form" | "otp">("form");
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const strength = [f.pw.length >= 8, /[a-z]/i.test(f.pw), /\d/.test(f.pw), /[^a-z0-9]/i.test(f.pw)].filter(Boolean).length;

  // FR-AUTH-01.1 validation
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Record<string, string> = {};
    if (f.name.trim().split(" ").length < 2) er.name = "Please enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email";
    if (!normalisePhone(f.phone)) er.phone = "Use a Sri Lankan mobile, e.g. 077 123 4567";
    if (!(f.pw.length >= 8 && /[a-z]/i.test(f.pw) && /\d/.test(f.pw))) er.pw = "8+ characters with at least one letter and one number";
    if (f.email.toLowerCase() === "taken@example.lk") er.email = "An account with this email already exists";
    setErrors(er);
    if (Object.keys(er).length) return;
    setStage("otp");
    setCooldown(60);
  };

  const verify = () => {
    if (code !== "123456" && attempts < 4) {
      setAttempts((a) => a + 1);
      setCode("");
      toast({ title: "That code isn't right", body: `${4 - attempts} attempts left. (Demo code: 123456)`, tone: "error" });
      return;
    }
    login(f.email);
    router.push(next);
  };

  return (
    <AuthShell title={stage === "form" ? "Create your account" : "Verify your mobile"} subtitle={stage === "form" ? "Track orders, save addresses and get reminders for the dates that matter." : undefined} image={IMG.pinkWhiteRoseBouquet}>
      {stage === "form" ? (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Full name" error={errors.name}><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} autoComplete="name" /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Email" error={errors.email}><input className="field" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="email" /></Field>
            <Field label="Mobile (+94)" error={errors.phone}><input className="field" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" placeholder="077 123 4567" /></Field>
          </div>
          <Field label="Password" error={errors.pw}>
            <input className="field" type="password" value={f.pw} onChange={(e) => setF({ ...f, pw: e.target.value })} autoComplete="new-password" />
            <span className="mt-2 flex gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", i < strength ? (strength < 3 ? "bg-amber-400" : "bg-sage-500") : "bg-line")} />
              ))}
            </span>
          </Field>
          <label className="flex items-start gap-3 text-sm text-muted">
            <input type="checkbox" checked={f.consent} onChange={(e) => setF({ ...f, consent: e.target.checked })} className="mt-1 h-4 w-4 accent-[var(--color-ink)]" />
            <span>Send me seasonal offers (optional). I agree to the <Link href="/terms" className="underline">terms</Link> and <Link href="/privacy" className="underline">privacy policy</Link>.</span>
          </label>
          <Button size="lg" className="w-full">Create account</Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => { login(); router.push(next); }}><Icon name="google" size={18} /> Sign up with Google</Button>
        </form>
      ) : (
        <div className="space-y-5">
          <p className="text-sm text-muted">Enter the 6-digit code we sent to <strong className="text-ink">{normalisePhone(f.phone)}</strong>. Codes expire after 5 minutes.</p>
          <OtpInput value={code} onChange={setCode} />
          <Button size="lg" className="w-full" disabled={code.length < 6} onClick={verify}>Verify</Button>
          <div className="flex items-center justify-between text-sm">
            <button onClick={() => setStage("form")} className="text-muted hover:text-ink">← Edit details</button>
            <button disabled={cooldown > 0} onClick={() => setCooldown(60)} className="text-muted disabled:opacity-60">{cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}</button>
          </div>
          <p className="text-center text-xs text-faint">Demo code: 123456</p>
        </div>
      )}
      <p className="mt-8 text-center text-sm text-muted">Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-medium text-ink underline underline-offset-4">Sign in</Link></p>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
