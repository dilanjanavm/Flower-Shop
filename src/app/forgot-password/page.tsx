"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/account/AuthShell";
import { Field } from "@/components/ui/bits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { IMG } from "@/lib/mock/images";

export default function ForgotPasswordPage() {
  const [id, setId] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <AuthShell title="Reset your password" subtitle="We'll send a single-use reset link by email or SMS. It's valid for 30 minutes." image={IMG.whiteLily}>
      {sent ? (
        <div className="animate-fade-up rounded-3xl bg-sage-100 p-6 text-sage-700">
          <Icon name="mail" size={28} />
          <p className="mt-3 font-semibold">Check your inbox</p>
          <p className="mt-1 text-sm">If an account exists for <strong>{id}</strong>, a reset link is on its way. For your security, all other sessions will be signed out after you reset.</p>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); if (id.trim()) setSent(true); }} className="space-y-4">
          <Field label="Email or mobile"><input className="field" value={id} onChange={(e) => setId(e.target.value)} /></Field>
          <Button size="lg" className="w-full" disabled={!id.trim()}>Send reset link</Button>
        </form>
      )}
      <p className="mt-8 text-center text-sm text-muted"><Link href="/login" className="underline underline-offset-4">Back to sign in</Link></p>
    </AuthShell>
  );
}
