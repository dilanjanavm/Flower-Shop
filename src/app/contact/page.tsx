"use client";

import { useState } from "react";
import { settings } from "@/lib/mock/delivery";
import { useStore } from "@/lib/store";
import { Field } from "@/components/ui/bits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

export default function ContactPage() {
  const { toast } = useStore();
  const [f, setF] = useState({ name: "", email: "", topic: "Order question", message: "" });
  const valid = f.name && /\S+@\S+/.test(f.email) && f.message.length > 10;

  return (
    <div className="container-x pt-12">
      <div className="grid gap-12 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <p className="eyebrow">Contact</p>
          <h1 className="h-display mt-3 text-5xl sm:text-6xl">We&apos;d love to hear from you</h1>
          <p className="mt-4 text-muted">Questions about an order, a wedding or an event? Send us a message or drop by the studio.</p>
          <ul className="mt-10 space-y-5">
            {[
              { icon: "pin" as const, label: "Studio", value: settings.shop.address },
              { icon: "phone" as const, label: "Phone", value: settings.shop.phone },
              { icon: "whatsapp" as const, label: "WhatsApp", value: settings.shop.whatsapp },
              { icon: "mail" as const, label: "Email", value: settings.shop.email },
              { icon: "clock" as const, label: "Hours", value: settings.shop.hours },
            ].map((c) => (
              <li key={c.label} className="flex items-center gap-4">
                <span className="grid h-12 w-12 place-items-center rounded-full bg-blush-50 text-blush-600"><Icon name={c.icon} size={20} /></span>
                <div><p className="text-xs uppercase tracking-wider text-muted">{c.label}</p><p className="font-medium">{c.value}</p></div>
              </li>
            ))}
          </ul>
        </div>
        <form
          className="card space-y-4 p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            if (!valid) return;
            setF({ name: "", email: "", topic: "Order question", message: "" });
            toast({ title: "Message sent", body: "We usually reply within a few hours.", tone: "success" });
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your name"><input className="field" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
            <Field label="Email"><input className="field" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
          </div>
          <Field label="Topic">
            <select className="field" value={f.topic} onChange={(e) => setF({ ...f, topic: e.target.value })}>
              {["Order question", "Wedding or event", "Corporate orders", "Feedback", "Something else"].map((t) => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Message"><textarea className="field resize-none" rows={6} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} /></Field>
          <Button size="lg" className="w-full" disabled={!valid}><Icon name="mail" size={18} /> Send message</Button>
        </form>
      </div>
    </div>
  );
}
