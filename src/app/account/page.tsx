"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { lkr } from "@/lib/format";
import { diffDays, formatShort, todayISO } from "@/lib/dates";
import { orderStatusLabel, orderStatusTone, quoteStatusLabel, quoteStatusTone } from "@/lib/status";
import { Badge } from "@/components/ui/bits";
import { Icon } from "@/components/ui/Icon";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { ButtonLink } from "@/components/ui/Button";

export default function AccountOverview() {
  const { user, orders, quotations, reminders } = useStore();
  if (!user) return null;
  const active = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.orderStatus));
  const needsPayment = orders.filter((o) => o.orderStatus === "PENDING_PAYMENT");
  const quoted = quotations.filter((q) => q.status === "QUOTED");
  const t = todayISO();
  const upcoming = [...reminders].filter((r) => r.date >= t).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="h-display text-4xl sm:text-5xl">Hello, {user.fullName.split(" ")[0]}</h1>
        <p className="mt-2 text-muted">Here&apos;s what&apos;s blooming in your account.</p>
      </div>

      {(needsPayment.length > 0 || quoted.length > 0) && (
        <div className="space-y-3">
          {needsPayment.map((o) => (
            <Link key={o.id} href={`/order/${o.orderNumber}`} className="flex items-center gap-4 rounded-3xl bg-amber-50 p-5 transition hover:shadow-[var(--shadow-soft)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-amber-100 text-amber-800"><Icon name="bank" /></span>
              <div className="flex-1 text-sm"><p className="font-semibold text-amber-900">Upload your bank slip for {o.orderNumber}</p><p className="text-amber-800/80">{lkr(o.total)} · your slot is held until the payment deadline</p></div>
              <Icon name="arrowRight" className="text-amber-800" />
            </Link>
          ))}
          {quoted.map((q) => (
            <Link key={q.id} href={`/account/quotations/${q.id}`} className="flex items-center gap-4 rounded-3xl bg-blush-50 p-5 transition hover:shadow-[var(--shadow-soft)]">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-blush-100 text-blush-700"><Icon name="sparkle" /></span>
              <div className="flex-1 text-sm"><p className="font-semibold text-blush-700">Your quotation {q.requestNumber} is ready</p><p className="text-blush-700/80">{lkr(q.quotedTotal ?? 0)} · review and accept to place the order</p></div>
              <Icon name="arrowRight" className="text-blush-700" />
            </Link>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Active orders", value: active.length, icon: "truck" as const },
          { label: "Open quotations", value: quotations.filter((q) => ["REQUESTED", "QUOTED"].includes(q.status)).length, icon: "quote" as const },
          { label: "Loyalty points", value: user.loyaltyPoints, icon: "sparkle" as const },
        ].map((s) => (
          <div key={s.label} className="card p-5">
            <Icon name={s.icon} className="text-blush-500" />
            <p className="mt-4 font-serif text-4xl">{s.value}</p>
            <p className="text-sm text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-2xl">Recent orders</h2>
          <Link href="/account/orders" className="link-underline text-sm">View all</Link>
        </div>
        <div className="space-y-3">
          {orders.slice(0, 3).map((o) => (
            <Link key={o.id} href={`/account/orders/${o.id}`} className="card flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
              <FlowerImage src={o.items[0]?.image ?? ""} alt="" className="h-16 w-14 shrink-0 rounded-xl" sizes="56px" />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{o.items[0]?.name}{o.items.length > 1 ? ` + ${o.items.length - 1} more` : ""}</p>
                <p className="text-xs text-muted">{o.orderNumber} · {formatShort(o.deliveryDate)}</p>
              </div>
              <Badge tone={orderStatusTone[o.orderStatus]}>{orderStatusLabel[o.orderStatus]}</Badge>
            </Link>
          ))}
          {orders.length === 0 && <p className="text-sm text-muted">No orders yet.</p>}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-2xl">Upcoming dates</h2>
            <Link href="/account/reminders" className="link-underline text-sm">Manage</Link>
          </div>
          <ul className="space-y-3">
            {upcoming.map((r) => (
              <li key={r.id} className="flex items-center gap-3">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-blush-50 text-center leading-none text-blush-700">
                  <span><span className="block font-serif text-lg">{Number(r.date.slice(8))}</span><span className="text-[10px] uppercase">{formatShort(r.date).split(" ").at(-1)}</span></span>
                </span>
                <div className="flex-1 text-sm"><p className="font-medium">{r.recipientName}&apos;s {r.occasion.toLowerCase()}</p><p className="text-xs text-muted">in {diffDays(t, r.date)} days</p></div>
                {diffDays(t, r.date) >= 2 && <Link href="/shop" className="text-xs font-medium text-blush-600">Send flowers</Link>}
              </li>
            ))}
            {upcoming.length === 0 && <p className="text-sm text-muted">No upcoming dates saved.</p>}
          </ul>
        </section>
        <section className="card flex flex-col justify-between bg-ink p-6 text-cream">
          <div>
            <p className="eyebrow text-blush-300!">Design your own</p>
            <h2 className="mt-3 font-serif text-3xl">Something special in mind?</h2>
            <p className="mt-2 text-sm text-cream/65">Pick the flowers and we&apos;ll send you a quotation.</p>
          </div>
          <ButtonLink href="/custom-bouquet" variant="blush" className="mt-6 self-start">Start a custom bouquet</ButtonLink>
        </section>
      </div>
    </div>
  );
}
