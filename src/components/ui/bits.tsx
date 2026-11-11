"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/format";
import { Icon, type IconName } from "./Icon";
import { useStore } from "@/lib/store";

export function Logo({ className, white }: { className?: string; white?: boolean }) {
  return (
    <Link href="/" aria-label="Sithuliya Flora — home" className={cn("inline-flex items-center gap-2", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={white ? "/brand/logo-mark-white.png" : "/brand/logo-mark.png"} alt="" className="h-7 w-auto sm:h-9" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={white ? "/brand/logo-word-white.png" : "/brand/logo-word.png"} alt="Sithuliya Flora" className="h-[18px] w-auto sm:h-7" />
    </Link>
  );
}

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: "neutral" | "blush" | "sage" | "ink" | "amber" | "red"; className?: string }) {
  const tones = {
    neutral: "bg-sand text-ink-soft",
    blush: "bg-blush-100 text-blush-700",
    sage: "bg-sage-100 text-sage-700",
    ink: "bg-ink text-cream",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-50 text-red-700",
  };
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wide", tones[tone], className)}>{children}</span>;
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-500" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={size} fill={i <= Math.round(value) ? "currentColor" : "none"} strokeWidth={1.4} />
      ))}
    </span>
  );
}

export function QtyStepper({ value, onChange, min = 1, max = 20, size = "md" }: { value: number; onChange: (n: number) => void; min?: number; max?: number; size?: "sm" | "md" }) {
  const h = size === "sm" ? "h-8" : "h-11";
  const w = size === "sm" ? "w-8" : "w-10";
  return (
    <div className={cn("inline-flex items-center rounded-full border border-line bg-paper", h)}>
      <button type="button" aria-label="Decrease" className={cn("grid h-full place-items-center rounded-full transition hover:bg-sand disabled:opacity-30", w)} disabled={value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="minus" size={14} />
      </button>
      <span className="min-w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase" className={cn("grid h-full place-items-center rounded-full transition hover:bg-sand disabled:opacity-30", w)} disabled={value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="plus" size={14} />
      </button>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, action, className }: { eyebrow?: string; title: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn("mb-8 flex flex-wrap items-end justify-between gap-4", className)}>
      <div>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 className="h-display text-3xl sm:text-4xl md:text-[2.75rem]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, body, action }: { icon: IconName; title: string; body?: string; action?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <span className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-blush-50 text-blush-600">
        <Icon name={icon} size={28} />
      </span>
      <h3 className="font-serif text-2xl">{title}</h3>
      {body && <p className="mt-2 max-w-sm text-sm text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 animate-fade-in bg-ink/40 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn("relative max-h-[92vh] w-full animate-fade-up overflow-y-auto rounded-t-[2rem] bg-paper p-6 shadow-[var(--shadow-lift)] sm:rounded-[2rem] sm:p-8", wide ? "max-w-2xl" : "max-w-md")}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="font-serif text-2xl">{title}</h3>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand" aria-label="Close dialog">
            <Icon name="close" size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Toaster() {
  const { toasts, dismissToast } = useStore();
  return (
    <div className="pointer-events-none fixed bottom-5 left-1/2 z-[80] flex w-[min(92vw,380px)] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-6 sm:translate-x-0" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex animate-fade-up items-start gap-3 rounded-2xl bg-ink px-4 py-3.5 text-cream shadow-[var(--shadow-lift)]">
          <span className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", t.tone === "error" ? "bg-red-500/90" : "bg-blush-400 text-ink")}>
            <Icon name={t.tone === "error" ? "alert" : "check"} size={14} strokeWidth={2.2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.body && <p className="mt-0.5 text-[13px] text-cream/70">{t.body}</p>}
          </div>
          <button onClick={() => dismissToast(t.id)} className="text-cream/60 hover:text-cream" aria-label="Dismiss">
            <Icon name="close" size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={cn("block", className)}>
      <span className="label">{label}</span>
      {children}
      {error ? <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span> : hint ? <span className="mt-1.5 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex w-full items-center justify-between gap-4 text-left">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", checked ? "bg-ink" : "bg-line")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-paper shadow transition-all duration-300 ease-[var(--ease-out-soft)]", checked ? "left-6" : "left-1")} />
      </span>
    </button>
  );
}
