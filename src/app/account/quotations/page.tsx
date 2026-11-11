"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { lkr } from "@/lib/format";
import { formatDateTime, formatShort, timeLeft } from "@/lib/dates";
import { quoteStatusLabel, quoteStatusTone } from "@/lib/status";
import { Badge, EmptyState } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/Button";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { Icon } from "@/components/ui/Icon";

export default function QuotationsPage() {
  const { quotations } = useStore();
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-display text-4xl sm:text-5xl">My quotations</h1>
          <p className="mt-2 text-muted">Custom bouquet requests and the prices our florist sends back.</p>
        </div>
        <ButtonLink href="/custom-bouquet" size="sm"><Icon name="plus" size={15} /> New request</ButtonLink>
      </div>
      <div className="mt-8 space-y-4">
        {quotations.length === 0 && <EmptyState icon="quote" title="No quotation requests yet" body="Design a bouquet and we'll price it for you." action={<ButtonLink href="/custom-bouquet">Design a bouquet</ButtonLink>} />}
        {quotations.map((q, i) => (
          <Link key={q.id} href={`/account/quotations/${q.id}`} className="card group flex animate-fade-up flex-col gap-4 p-5 transition hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-center" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="grid grid-cols-2 gap-1">
              {q.items.slice(0, 4).map((it) => (
                <FlowerImage key={it.flowerId} src={it.image} alt="" className="h-10 w-10 rounded-lg" sizes="40px" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm">{q.requestNumber}</p>
                <Badge tone={quoteStatusTone[q.status]}>{quoteStatusLabel[q.status]}</Badge>
              </div>
              <p className="mt-1 truncate text-sm">{q.items.map((it) => `${it.qty} ${it.name}`).join(" · ")}</p>
              <p className="text-xs text-muted">Requested {formatDateTime(q.createdAt)} · for {formatShort(q.deliveryDate)}</p>
            </div>
            <div className="text-left sm:text-right">
              {q.status === "QUOTED" ? (
                <>
                  <p className="font-serif text-2xl">{lkr(q.quotedTotal ?? 0)}</p>
                  {q.validUntil && <p className="text-xs font-medium text-blush-600">Valid for {timeLeft(q.validUntil)}</p>}
                </>
              ) : q.status === "REQUESTED" ? (
                <p className="text-sm text-muted">Awaiting price{q.estimate ? ` · est. ${lkr(q.estimate)}` : ""}</p>
              ) : q.status === "ACCEPTED" ? (
                <p className="text-sm text-sage-700">Order {q.orderNumber}</p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
