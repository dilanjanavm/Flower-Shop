"use client";

import type { ReactNode } from "react";
import { FlowerImage } from "../ui/FlowerImage";
import { IMG } from "@/lib/mock/images";

export function AuthShell({ title, subtitle, children, image = IMG.womanBouquet }: { title: string; subtitle?: string; children: ReactNode; image?: string }) {
  return (
    <div className="container-x pt-8">
      <div className="grid overflow-hidden rounded-[2.5rem] bg-paper shadow-[var(--shadow-soft)] lg:grid-cols-2">
        <div className="relative hidden lg:block">
          <FlowerImage src={image} alt="" className="h-full min-h-[640px]" sizes="50vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
          <div className="absolute bottom-10 left-10 right-10 text-cream">
            <p className="font-serif text-4xl leading-tight">“Every bouquet is tied by hand, the morning it goes out.”</p>
            <p className="mt-3 text-sm text-cream/70">— The Sithuliya Flora studio</p>
          </div>
        </div>
        <div className="flex items-center justify-center p-6 py-12 sm:p-12">
          <div className="w-full max-w-md animate-fade-up">
            <h1 className="h-display text-4xl sm:text-5xl">{title}</h1>
            {subtitle && <p className="mt-3 text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function OtpInput({ value, onChange, length = 6 }: { value: string; onChange: (v: string) => void; length?: number }) {
  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={value[i] ?? ""}
          aria-label={`Digit ${i + 1}`}
          onChange={(e) => {
            const d = e.target.value.replace(/\D/g, "").slice(-1);
            const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, length);
            onChange(next);
            if (d && i < length - 1) document.getElementById(`otp-${i + 1}`)?.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !value[i] && i > 0) document.getElementById(`otp-${i - 1}`)?.focus();
          }}
          onPaste={(e) => {
            const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (t) {
              e.preventDefault();
              onChange(t);
            }
          }}
          className="h-14 w-full rounded-2xl border border-line bg-cream text-center font-serif text-2xl outline-none transition focus:border-ink focus:ring-4 focus:ring-blush-100"
        />
      ))}
    </div>
  );
}
