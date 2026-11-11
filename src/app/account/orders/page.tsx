"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { cn, lkr } from "@/lib/format";
import { formatDate, formatShort } from "@/lib/dates";
import { orderStatusLabel, orderStatusTone } from "@/lib/status";
import { Badge, EmptyState } from "@/components/ui/bits";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const filters = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

export default function OrdersPage() {
  const { orders } = useStore();
  const [f, setF] = useState("all");
  const list = orders.filter((o) =>
    f === "all" ? true : f === "delivered" ? o.orderStatus === "DELIVERED" : f === "cancelled" ? o.orderStatus === "CANCELLED" : !["DELIVERED", "CANCELLED"].includes(o.orderStatus),
  );

  return (
    <div>
      <h1 className="h-display text-4xl sm:text-5xl">Orders</h1>
      <div className="mt-6 flex gap-2">
        {filters.map((x) => (
          <button key={x.key} onClick={() => setF(x.key)} className={cn("rounded-full px-4 py-2 text-sm transition", f === x.key ? "bg-ink text-cream" : "bg-sand hover:bg-line")}>{x.label}</button>
        ))}
      </div>
      <div className="mt-6 space-y-4">
        {list.length === 0 && <EmptyState icon="receipt" title="No orders here" action={<ButtonLink href="/shop">Shop bouquets</ButtonLink>} />}
        {list.map((o, i) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="card group flex animate-fade-up flex-col gap-4 p-5 transition hover:shadow-[var(--shadow-lift)] sm:flex-row sm:items-center" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex -space-x-4">
              {o.items.slice(0, 3).map((it) => (
                <FlowerImage key={it.id} src={it.image} alt="" className="h-20 w-16 rounded-2xl ring-4 ring-paper" sizes="64px" />
              ))}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm">{o.orderNumber}</p>
                <Badge tone={orderStatusTone[o.orderStatus]}>{orderStatusLabel[o.orderStatus]}</Badge>
                {o.orderType === "CUSTOM" && <Badge tone="blush">Custom</Badge>}
              </div>
              <p className="mt-1 truncate font-medium">{o.items.map((i) => i.name).join(", ")}</p>
              <p className="text-xs text-muted">Placed {formatDate(o.createdAt)} · {o.fulfilment === "PICKUP" ? "Pickup" : "Delivery"} {formatShort(o.deliveryDate)} · for {o.recipient.name}</p>
            </div>
            <div className="flex items-center gap-4 sm:flex-col sm:items-end">
              <p className="font-serif text-2xl">{lkr(o.total)}</p>
              <span className="flex items-center gap-1 text-xs font-medium text-muted transition group-hover:text-ink">Details <Icon name="arrowRight" size={14} /></span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
