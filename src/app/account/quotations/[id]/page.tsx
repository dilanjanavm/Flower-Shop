"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { ribbons, taxonomies, wraps } from "@/lib/mock/catalogue";
import { timeSlots } from "@/lib/mock/delivery";
import { cn, lkr } from "@/lib/format";
import { formatDateTime, formatLong, timeLeft } from "@/lib/dates";
import { quoteStatusLabel, quoteStatusTone } from "@/lib/status";
import { Badge, EmptyState, Modal } from "@/components/ui/bits";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { Icon } from "@/components/ui/Icon";

const flow = ["REQUESTED", "QUOTED", "ACCEPTED"] as const;

export default function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { quotations, acceptQuote, declineQuote, cancelQuote, simulateOwnerQuote, toast } = useStore();
  const q = quotations.find((x) => x.id === id);
  const [confirmDecline, setConfirmDecline] = useState(false);
  const [accepting, setAccepting] = useState(false);

  if (!q) return <EmptyState icon="quote" title="Quotation not found" action={<ButtonLink href="/account/quotations">All quotations</ButtonLink>} />;

  const slot = timeSlots.find((t) => t.code === q.timeSlot);
  const stage = q.status === "ACCEPTED" ? 2 : q.status === "QUOTED" ? 1 : 0;
  const closed = ["DECLINED_BY_SHOP", "DECLINED_BY_CUSTOMER", "EXPIRED", "CANCELLED"].includes(q.status);

  const accept = async () => {
    setAccepting(true);
    await new Promise((r) => setTimeout(r, 700));
    const order = acceptQuote(q.id);
    setAccepting(false);
    if (!order) {
      toast({ title: "This quotation has expired", body: "You can send a new request.", tone: "error" });
      return;
    }
    router.push(`/order/${order.orderNumber}?new=1`);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/account/quotations" className="flex items-center gap-1 text-sm text-muted hover:text-ink"><Icon name="arrowLeft" size={16} /> All quotations</Link>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <h1 className="font-mono text-2xl sm:text-3xl">{q.requestNumber}</h1>
          <Badge tone={quoteStatusTone[q.status]}>{quoteStatusLabel[q.status]}</Badge>
        </div>
        <p className="mt-1 text-sm text-muted">Requested {formatDateTime(q.createdAt)}</p>
      </div>

      {!closed && (
        <ol className="card grid grid-cols-3 p-5">
          {["Request sent", "Price received", "Accepted & ordered"].map((label, i) => (
            <li key={label} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={cn("absolute right-1/2 top-4 h-0.5 w-full", i <= stage ? "bg-ink" : "bg-line")} />}
              <span className={cn("relative z-10 grid h-8 w-8 place-items-center rounded-full text-xs", i < stage || (i === 2 && stage === 2) ? "bg-ink text-cream" : i === stage ? "bg-blush-400 ring-4 ring-blush-100" : "bg-sand text-faint")}>
                {i < stage || (i === 2 && stage === 2) ? <Icon name="check" size={14} strokeWidth={2.4} /> : i + 1}
              </span>
              <span className="mt-2 text-xs font-medium">{label}</span>
            </li>
          ))}
        </ol>
      )}

      {q.status === "REQUESTED" && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-amber-50 p-5">
          <div className="flex items-start gap-3 text-sm text-amber-900">
            <Icon name="clock" className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Quotation pending</p>
              <p className="text-amber-800/80">Our florist is checking availability. You&apos;ll get an SMS and email when the price is ready.{q.estimate ? ` Indicative estimate: ${lkr(q.estimate)} (not final).` : ""}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => cancelQuote(q.id)}>Cancel request</Button>
            <Button variant="outline" size="sm" onClick={() => simulateOwnerQuote(q.id)} title="Demo only — the Owner sends quotations from the admin panel"><Icon name="sparkle" size={14} /> Demo: owner replies</Button>
          </div>
        </div>
      )}

      {q.status === "QUOTED" && (
        <section className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-ink px-6 py-4 text-cream">
            <p className="flex items-center gap-2 font-medium"><Icon name="sparkle" size={18} className="text-blush-300" /> Your quotation is ready</p>
            {q.validUntil && <p className="text-sm">Valid until {formatDateTime(q.validUntil)} <span className="ml-1 rounded-full bg-cream/15 px-2 py-0.5 text-xs">{timeLeft(q.validUntil)} left</span></p>}
          </div>
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_300px]">
            <div>
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="pb-2 font-semibold">Flower</th><th className="pb-2 text-right font-semibold">Qty</th><th className="pb-2 text-right font-semibold">Each</th><th className="pb-2 text-right font-semibold">Total</th></tr></thead>
                <tbody className="divide-y divide-line">
                  {q.items.map((it) => (
                    <tr key={it.flowerId}>
                      <td className="py-2.5"><span className="flex items-center gap-2"><FlowerImage src={it.image} alt="" className="h-8 w-8 rounded-lg" sizes="32px" />{it.name}</span></td>
                      <td className="py-2.5 text-right tabular-nums">{it.qty}</td>
                      <td className="py-2.5 text-right tabular-nums">{lkr(it.unitPrice ?? 0)}</td>
                      <td className="py-2.5 text-right tabular-nums">{lkr((it.unitPrice ?? 0) * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {q.quoteNote && (
                <div className="mt-6 rounded-2xl bg-blush-50 p-4 text-sm">
                  <p className="label">Note from the florist</p>
                  <p className="font-serif text-lg italic text-ink-soft">“{q.quoteNote}”</p>
                </div>
              )}
            </div>
            <div className="rounded-3xl bg-cream p-5">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Flowers</dt><dd>{lkr(q.itemsPrice ?? 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Wrapping</dt><dd>{lkr(q.wrappingPrice ?? 0)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd>{q.deliveryFee ? lkr(q.deliveryFee) : "Free"}</dd></div>
                {!!q.discount && <div className="flex justify-between text-sage-700"><dt>Discount</dt><dd>−{lkr(q.discount)}</dd></div>}
              </dl>
              <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span className="font-medium">Total</span><span className="font-serif text-3xl">{lkr(q.quotedTotal ?? 0)}</span></div>
              <Button className="mt-5 w-full" size="lg" onClick={accept} disabled={accepting}>{accepting ? "Creating order…" : "Accept & pay"}</Button>
              <Button className="mt-2 w-full" variant="ghost" onClick={() => setConfirmDecline(true)}>Decline</Button>
              <p className="mt-3 text-center text-xs text-muted">Accepting creates your order and shows our bank details.</p>
            </div>
          </div>
        </section>
      )}

      {q.status === "ACCEPTED" && q.orderNumber && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-sage-100 p-5 text-sage-700">
          <p className="flex items-center gap-2 font-medium"><Icon name="check" /> Accepted — order {q.orderNumber} created</p>
          <ButtonLink href={`/order/${q.orderNumber}`} size="sm">View order & pay</ButtonLink>
        </div>
      )}
      {q.status === "DECLINED_BY_SHOP" && <div className="rounded-3xl bg-red-50 p-5 text-sm text-red-700"><p className="font-semibold">The shop couldn&apos;t make this one</p><p>{q.declineReason ?? "Some flowers aren't available for your date."}</p></div>}
      {(q.status === "EXPIRED" || q.status === "DECLINED_BY_CUSTOMER" || q.status === "CANCELLED") && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-sand p-5 text-sm">
          <p>This request is closed. You can always send a new one.</p>
          <ButtonLink href="/custom-bouquet" size="sm" variant="outline">New request</ButtonLink>
        </div>
      )}

      <section className="card grid gap-6 p-6 sm:grid-cols-2">
        <div>
          <p className="label">Your selection</p>
          <ul className="space-y-1.5 text-sm">{q.items.map((it) => <li key={it.flowerId}>{it.qty} × {it.name}</li>)}</ul>
          <p className="mt-3 text-sm text-muted">
            {taxonomies.styles.find((s) => s.slug === q.style)?.name} · {wraps.find((w) => w.id === q.wrapId)?.name} wrap · {ribbons.find((r) => r.id === q.ribbonId)?.name} ribbon
          </p>
          {q.notes && <p className="mt-3 rounded-2xl bg-cream p-3 text-sm">{q.notes}</p>}
        </div>
        <div>
          <p className="label">{q.fulfilment === "PICKUP" ? "Pickup" : "Delivery"}</p>
          <p className="text-sm font-medium">{formatLong(q.deliveryDate)}</p>
          <p className="text-sm text-muted">{slot?.label} · {slot?.window}</p>
          <p className="mt-3 text-sm">{q.recipient.name} · {q.recipient.phone}</p>
          {q.fulfilment === "DELIVERY" && <p className="text-sm text-muted">{q.recipient.line1}, {q.recipient.city}</p>}
          {q.cardMessage && <p className="mt-3 font-serif italic">“{q.cardMessage}”</p>}
          {q.referencePhotos.length > 0 && (
            <div className="mt-3 flex gap-2">{q.referencePhotos.map((p, i) => <FlowerImage key={i} src={p} alt="Reference" className="h-16 w-16 rounded-xl" sizes="64px" />)}</div>
          )}
        </div>
      </section>

      <Modal open={confirmDecline} onClose={() => setConfirmDecline(false)} title="Decline this quotation?">
        <p className="text-sm text-muted">The request will be closed. You can always design a new bouquet later.</p>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <Button variant="outline" onClick={() => setConfirmDecline(false)}>Keep it</Button>
          <Button onClick={() => { declineQuote(q.id); setConfirmDecline(false); }}>Decline</Button>
        </div>
      </Modal>
    </div>
  );
}
