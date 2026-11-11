"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useStore } from "@/lib/store";
import { OrderSummary, OrderTracker, PaymentPanel } from "@/components/account/OrderParts";
import { EmptyState } from "@/components/ui/bits";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

function Petals() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 14 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-[-10%] h-3 w-2.5 rounded-[60%_40%_60%_40%] bg-blush-300/80"
          style={{
            left: `${(i * 37) % 100}%`,
            animation: `petal-fall ${4 + (i % 5)}s ${i * 0.25}s ease-in forwards`,
            transform: `rotate(${i * 25}deg)`,
          }}
        />
      ))}
      <style>{`@keyframes petal-fall{0%{transform:translateY(0) rotate(0);opacity:0}10%{opacity:1}100%{transform:translateY(520px) rotate(320deg);opacity:0}}`}</style>
    </div>
  );
}

function OrderView() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const sp = useSearchParams();
  const { orders, hydrated } = useStore();
  const order = orders.find((o) => o.orderNumber === orderNumber);
  const isNew = sp.get("new") === "1";

  if (!hydrated) return <div className="container-x pt-10"><div className="skeleton h-64" /></div>;
  if (!order)
    return (
      <div className="container-x pt-16">
        <EmptyState icon="receipt" title="Order not found" body="Check the order number or sign in to see your orders." action={<ButtonLink href="/account/orders">My orders</ButtonLink>} />
      </div>
    );

  return (
    <div className="container-x pt-10">
      <section className="relative overflow-hidden rounded-[2.5rem] bg-blush-50 px-6 py-12 text-center sm:px-10">
        {isNew && <Petals />}
        <span className="relative mx-auto grid h-16 w-16 animate-pop place-items-center rounded-full bg-ink text-cream">
          <Icon name={order.orderStatus === "PENDING_PAYMENT" ? "bank" : "check"} size={28} strokeWidth={2} />
        </span>
        <p className="eyebrow relative mt-6">Order {order.orderNumber}</p>
        <h1 className="h-display relative mx-auto mt-3 max-w-2xl text-4xl sm:text-5xl">
          {isNew ? "Thank you — your order is placed" : order.orderStatus === "DELIVERED" ? "Delivered with love" : "Your order"}
        </h1>
        {order.orderStatus === "PENDING_PAYMENT" && (
          <p className="relative mx-auto mt-4 max-w-lg text-muted">Your slot is held. Transfer the total to our bank account and upload the slip below — we&apos;ll confirm by SMS once it&apos;s verified.</p>
        )}
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-8">
          <PaymentPanel order={order} />
          <OrderTracker order={order} />
        </div>
        <aside className="space-y-4">
          <OrderSummary order={order} />
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/account/orders/${order.id}`} className={buttonClass("outline", "md")}>Order details</Link>
            <Link href={`/track/${order.trackingToken}`} className={buttonClass("ghost", "md")}>Tracking link</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="container-x pt-10"><div className="skeleton h-64" /></div>}>
      <OrderView />
    </Suspense>
  );
}
