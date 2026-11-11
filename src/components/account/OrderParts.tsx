"use client";

import { useEffect, useRef, useState } from "react";
import type { Order } from "@/lib/types";
import { settings, timeSlots } from "@/lib/mock/delivery";
import { cn, lkr } from "@/lib/format";
import { formatDateTime, formatLong, timeLeft } from "@/lib/dates";
import { orderStatusLabel, trackerIndex, trackerSteps } from "@/lib/status";
import { useStore } from "@/lib/store";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";
import { FlowerImage } from "../ui/FlowerImage";

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className={cn("truncate text-[15px] font-medium", mono && "font-mono tracking-wide")}>{value}</p>
      </div>
      <button
        onClick={() => {
          navigator.clipboard?.writeText(value.replace(/\s/g, label === "Account number" ? "" : " "));
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className={cn("flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-medium transition", copied ? "bg-sage-100 text-sage-700" : "bg-sand hover:bg-line")}
        aria-label={`Copy ${label}`}
      >
        <Icon name={copied ? "check" : "copy"} size={13} /> {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function useTick(ms = 30_000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set((n) => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}

/** Bank details + slip upload (FR-CUST-05.1 – 05.4). */
export function PaymentPanel({ order }: { order: Order }) {
  const { uploadSlip, toast, simulateAdvance } = useStore();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useTick();

  const pick = (f: File | undefined) => {
    if (!f) return;
    const okType = ["image/jpeg", "image/png", "application/pdf"].includes(f.type);
    if (!okType) return toast({ title: "Unsupported file", body: "Upload a JPG, PNG or PDF.", tone: "error" });
    if (f.size > 5 * 1024 * 1024) return toast({ title: "File too large", body: "Slips must be 5 MB or smaller.", tone: "error" });
    setFile(f);
    setPreview(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const submit = () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    let p = 0;
    // Simulates the pre-signed S3 upload (SRS 8.1 Uploads) before confirming the file key.
    const id = setInterval(() => {
      p = Math.min(100, p + 12);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        uploadSlip(order.id, file.name);
        setUploading(false);
        setFile(null);
        setPreview(null);
      }
    }, 90);
  };

  const awaiting = order.orderStatus === "PENDING_PAYMENT";
  const reviewing = order.orderStatus === "PAYMENT_REVIEW";
  const expired = new Date(order.paymentDueAt).getTime() < Date.now();

  if (!awaiting && !reviewing) return null;

  return (
    <section className="card overflow-hidden">
      <div className={cn("flex flex-wrap items-center justify-between gap-3 px-6 py-4", reviewing ? "bg-amber-50" : "bg-ink text-cream")}>
        <div className="flex items-center gap-3">
          <Icon name={reviewing ? "clock" : "bank"} size={20} />
          <p className="font-medium">{reviewing ? "We're verifying your payment" : "Complete your payment by bank deposit"}</p>
        </div>
        {awaiting && (
          <p className="text-sm">
            Pay before <strong>{formatDateTime(order.paymentDueAt)}</strong>
            <span className="ml-2 rounded-full bg-cream/15 px-2 py-0.5 text-xs">{timeLeft(order.paymentDueAt)} left</span>
          </p>
        )}
      </div>

      {reviewing ? (
        <div className="grid gap-4 p-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div className="text-sm">
            <p>
              Slip <strong>{order.slipFileName}</strong> received. The shop owner checks every slip by hand — you&apos;ll get an SMS as soon as it&apos;s approved.
            </p>
            <p className="mt-2 text-muted">Usually within 1–2 hours during shop hours ({settings.shop.hours}).</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => simulateAdvance(order.id)} title="Demo only — the Owner approves slips in the admin panel">
            <Icon name="sparkle" size={14} /> Demo: approve slip
          </Button>
        </div>
      ) : (
        <div className="grid gap-8 p-6 md:grid-cols-2">
          <div>
            <p className="label">Transfer exactly</p>
            <p className="font-serif text-4xl">{lkr(order.total, { decimals: true })}</p>
            <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-cream/60 px-4">
              <CopyRow label="Bank" value={settings.bank.bank} />
              <CopyRow label="Branch" value={settings.bank.branch} />
              <CopyRow label="Account name" value={settings.bank.accountName} />
              <CopyRow label="Account number" value={settings.bank.accountNumber} mono />
              <CopyRow label="Reference" value={order.orderNumber} mono />
            </div>
            <p className="mt-3 text-xs text-muted">Use your order number as the payment reference. We&apos;ve also sent these details by SMS and email.</p>
          </div>

          <div className="flex flex-col">
            <p className="label">Upload your slip</p>
            {order.slipRejectReason && (
              <div className="mb-3 flex items-start gap-2 rounded-2xl bg-red-50 p-3 text-sm text-red-700">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                <span>Your last slip was rejected: {order.slipRejectReason}. Please upload a new one.</span>
              </div>
            )}
            {expired ? (
              <div className="rounded-2xl bg-sand p-5 text-sm">The payment window has closed and this order will be cancelled. Please place a new order.</div>
            ) : (
              <>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
                  onDragLeave={() => setDrag(false)}
                  onDrop={(e) => { e.preventDefault(); setDrag(false); pick(e.dataTransfer.files?.[0]); }}
                  onClick={() => input.current?.click()}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
                  className={cn(
                    "relative flex min-h-48 flex-1 cursor-pointer flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed p-6 text-center transition-all duration-300",
                    drag ? "scale-[1.01] border-blush-500 bg-blush-50" : file ? "border-ink/30 bg-paper" : "border-line bg-cream/50 hover:border-ink/40",
                  )}
                >
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt="Slip preview" className="max-h-40 rounded-xl object-contain shadow" />
                  ) : file ? (
                    <Icon name="file" size={40} className="text-blush-600" />
                  ) : (
                    <span className="grid h-14 w-14 animate-float place-items-center rounded-full bg-paper text-blush-600 shadow-sm"><Icon name="upload" size={24} /></span>
                  )}
                  <p className="mt-3 text-sm font-medium">{file ? file.name : "Drop your slip here or tap to browse"}</p>
                  <p className="text-xs text-muted">{file ? `${(file.size / 1024).toFixed(0)} KB` : "JPG, PNG or PDF · up to 5 MB"}</p>
                  {uploading && (
                    <div className="absolute inset-x-6 bottom-4 h-1.5 overflow-hidden rounded-full bg-line">
                      <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${progress}%` }} />
                    </div>
                  )}
                  <input ref={input} type="file" accept="image/jpeg,image/png,application/pdf" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
                </div>
                <Button className="mt-4" disabled={!file || uploading} onClick={submit}>
                  <Icon name="upload" size={16} /> {uploading ? "Uploading…" : "Submit slip"}
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

/** Live tracker stepper (FR-CUST-06.1). */
export function OrderTracker({ order }: { order: Order }) {
  const idx = trackerIndex(order.orderStatus);
  const cancelled = order.orderStatus === "CANCELLED";
  const failed = order.orderStatus === "DELIVERY_FAILED";
  return (
    <div className="card p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="label mb-0">Status</p>
        <p className={cn("text-sm font-semibold", cancelled || failed ? "text-red-600" : "text-blush-700")}>{orderStatusLabel[order.orderStatus]}</p>
      </div>
      {cancelled ? (
        <p className="mt-4 rounded-2xl bg-sand p-4 text-sm text-muted">This order was cancelled{order.history.at(-1)?.note ? ` — ${order.history.at(-1)?.note}` : ""}.</p>
      ) : (
        <ol className="mt-6 grid grid-cols-5 gap-1">
          {trackerSteps.map((s, i) => {
            const done = i < idx || (i === idx && order.orderStatus === "DELIVERED");
            const active = i === idx && order.orderStatus !== "DELIVERED";
            return (
              <li key={s.key} className="relative flex flex-col items-center text-center">
                {i > 0 && (
                  <span className="absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2 overflow-hidden bg-line">
                    <span className={cn("block h-full bg-ink transition-all duration-1000 ease-[var(--ease-out-soft)]", i <= idx ? "w-full" : "w-0")} />
                  </span>
                )}
                <span
                  className={cn(
                    "relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs transition-all duration-500",
                    done ? "bg-ink text-cream" : active ? (failed ? "bg-red-500 text-white" : "bg-blush-400 text-ink ring-4 ring-blush-100") : "bg-sand text-faint",
                  )}
                >
                  {done ? <Icon name="check" size={14} strokeWidth={2.4} /> : active ? <span className="h-2 w-2 animate-ping rounded-full bg-current" /> : i + 1}
                </span>
                <span className={cn("mt-2 text-[11px] font-medium leading-tight sm:text-xs", i <= idx ? "text-ink" : "text-faint")}>{s.label}</span>
              </li>
            );
          })}
        </ol>
      )}
      {failed && <p className="mt-4 rounded-2xl bg-red-50 p-3 text-sm text-red-700">We couldn&apos;t complete the delivery. Our team will call you to arrange a new attempt.</p>}
    </div>
  );
}

export function OrderSummary({ order }: { order: Order }) {
  const slot = timeSlots.find((t) => t.code === order.timeSlot);
  return (
    <div className="card divide-y divide-line">
      <div className="grid gap-5 p-6 sm:grid-cols-2">
        <div>
          <p className="label">{order.fulfilment === "PICKUP" ? "Pickup" : "Delivery"}</p>
          <p className="font-medium">{formatLong(order.deliveryDate)}</p>
          <p className="text-sm text-muted">{slot?.label} · {slot?.window}</p>
        </div>
        <div>
          <p className="label">{order.fulfilment === "PICKUP" ? "Collected by" : "Recipient"}</p>
          <p className="font-medium">{order.recipient.name}</p>
          <p className="text-sm text-muted">{order.fulfilment === "PICKUP" ? settings.shop.address : `${order.recipient.line1}, ${order.recipient.city}`}</p>
        </div>
      </div>
      <ul className="space-y-4 p-6">
        {order.items.map((i) => (
          <li key={i.id} className="flex items-center gap-4">
            <FlowerImage src={i.image} alt="" className="h-16 w-14 rounded-xl" sizes="56px" />
            <div className="min-w-0 flex-1">
              <p className="font-medium">{i.name} <span className="text-muted">× {i.qty}</span></p>
              <p className="truncate text-xs text-muted">{i.detail}</p>
            </div>
            <p className="text-sm font-semibold">{lkr(i.unitPrice * i.qty)}</p>
          </li>
        ))}
      </ul>
      {order.cardMessage && (
        <div className="p-6">
          <p className="label">Card message</p>
          <p className="font-serif text-lg italic">“{order.cardMessage}”</p>
          <p className="mt-1 text-xs text-muted">— {order.isAnonymousSender ? "Anonymous" : order.senderName || "Unsigned"}</p>
        </div>
      )}
      <dl className="space-y-2 p-6 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{lkr(order.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{order.deliveryFee ? lkr(order.deliveryFee) : "Free"}</dd></div>
        {order.surcharge > 0 && <div className="flex justify-between"><dt className="text-muted">Midnight surcharge</dt><dd>{lkr(order.surcharge)}</dd></div>}
        {order.discount > 0 && <div className="flex justify-between text-sage-700"><dt>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</dt><dd>−{lkr(order.discount)}</dd></div>}
        <div className="flex items-baseline justify-between border-t border-line pt-3"><dt className="font-medium">Total</dt><dd className="font-serif text-2xl">{lkr(order.total)}</dd></div>
      </dl>
    </div>
  );
}

export function OrderTimeline({ order }: { order: Order }) {
  return (
    <div className="card p-6">
      <p className="label">Timeline</p>
      <ol className="relative mt-3 space-y-4 border-l border-line pl-5">
        {[...order.history].reverse().map((h, i) => (
          <li key={h.at + h.status} className="relative">
            <span className={cn("absolute -left-[26px] top-1 h-3 w-3 rounded-full ring-4 ring-paper", i === 0 ? "bg-blush-500" : "bg-line")} />
            <p className="text-sm font-medium">{orderStatusLabel[h.status]}</p>
            <p className="text-xs text-muted">{formatDateTime(h.at)}{h.note ? ` · ${h.note}` : ""}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
