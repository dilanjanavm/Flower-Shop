"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { normalisePhone } from "@/lib/format";
import { Field, Modal, Toggle } from "@/components/ui/bits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function ProfilePage() {
  const { user, updateProfile, toast, logout } = useStore();
  const [name, setName] = useState(user?.fullName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pw, setPw] = useState({ current: "", next: "" });
  const [del, setDel] = useState(false);
  if (!user) return null;

  const pwValid = pw.next.length >= 8 && /[a-z]/i.test(pw.next) && /\d/.test(pw.next);

  return (
    <div className="space-y-8">
      <h1 className="h-display text-4xl sm:text-5xl">Profile & settings</h1>

      <section className="card p-6">
        <h2 className="font-serif text-2xl">Your details</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Full name"><input className="field" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Email" hint={user.isVerified ? "Verified" : "Not verified"}><input className="field" value={user.email} disabled /></Field>
          <Field label="Mobile (+94)" error={phone && !normalisePhone(phone) ? "Use a Sri Lankan mobile number" : undefined}><input className="field" value={phone} onChange={(e) => setPhone(e.target.value)} /></Field>
        </div>
        <Button
          className="mt-5"
          disabled={!name.trim() || !normalisePhone(phone)}
          onClick={() => {
            updateProfile({ fullName: name.trim(), phone: normalisePhone(phone) ?? phone });
            toast({ title: "Profile updated", tone: "success" });
          }}
        >
          Save changes
        </Button>
      </section>

      <section className="card p-6">
        <h2 className="font-serif text-2xl">Notifications</h2>
        <div className="mt-5 space-y-4">
          <Toggle checked={user.prefs.sms} onChange={(v) => updateProfile({ prefs: { ...user.prefs, sms: v } })} label="SMS updates" description="Order status, payment and delivery messages" />
          <Toggle checked={user.prefs.email} onChange={(v) => updateProfile({ prefs: { ...user.prefs, email: v } })} label="Email updates" description="Receipts, quotations and invoices" />
          <Toggle checked={user.prefs.whatsapp} onChange={(v) => updateProfile({ prefs: { ...user.prefs, whatsapp: v } })} label="WhatsApp tracking link" />
          <Toggle checked={user.prefs.marketing} onChange={(v) => updateProfile({ prefs: { ...user.prefs, marketing: v } })} label="Seasonal offers" description="Optional — you can opt out anytime (PDPA)" />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="font-serif text-2xl">Change password</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Field label="Current password"><input type="password" className="field" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></Field>
          <Field label="New password" hint="At least 8 characters with a letter and a number"><input type="password" className="field" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></Field>
        </div>
        <Button className="mt-5" variant="outline" disabled={!pw.current || !pwValid} onClick={() => { setPw({ current: "", next: "" }); toast({ title: "Password changed", body: "Other devices have been signed out.", tone: "success" }); }}>Update password</Button>
      </section>

      <section className="rounded-[var(--radius-card)] border border-red-200 bg-red-50/50 p-6">
        <h2 className="font-serif text-2xl text-red-800">Delete account</h2>
        <p className="mt-2 text-sm text-red-800/80">We&apos;ll anonymise your personal data within 30 days. Order and payment records are kept for tax purposes.</p>
        <Button className="mt-4 bg-red-600! hover:bg-red-700!" onClick={() => setDel(true)}><Icon name="trash" size={16} /> Request deletion</Button>
      </section>

      <Modal open={del} onClose={() => setDel(false)} title="Delete your account?">
        <p className="text-sm text-muted">This can&apos;t be undone. Your saved addresses, reminders and quotations will be removed.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setDel(false)}>Keep account</Button>
          <Button className="bg-red-600! hover:bg-red-700!" onClick={() => { setDel(false); logout(); toast({ title: "Deletion requested", body: "We'll confirm by email." }); }}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
