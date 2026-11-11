"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { products } from "@/lib/mock/catalogue";
import { paymentStatusLabel } from "@/lib/status";
import { formatDateTime } from "@/lib/dates";
import { lkr } from "@/lib/format";
import { OrderSummary, OrderTimeline, OrderTracker, PaymentPanel } from "@/components/account/OrderParts";
import { Badge, EmptyState, Modal } from "@/components/ui/bits";
import { Button, ButtonLink } from "@/components/ui/Button";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { Icon } from "@/components/ui/Icon";
import { settings } from "@/lib/mock/delivery";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { orders, cancelOrder, addToCart, simulateAdvance, markReviewed, toast } = useStore();
  const order = orders.find((o) => o.id === id);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [invoice, setInvoice] = useState(false);

  if (!order) return <EmptyState icon="receipt" title="Order not found" action={<ButtonLink href="/account/orders">Back to orders</ButtonLink>} />;

  const reorder = () => {
    for (const it of order.items) {
      const p = products.find((x) => x.name === it.name);
      if (!p || !p.isAvailable) continue;
      const v = p.variants.find((x) => x.sizeTier === it.sizeTier) ?? p.variants[0];
      addToCart({ productId: p.id, slug: p.slug, name: p.name, image: p.images[0], qty: it.qty, unitPrice: it.unitPrice, config: { variantId: v.id, sizeTier: v.sizeTier, wrapId: "wrap-kraft", ribbonId: "rib-blush", addOnIds: [], cardMessage: "", senderName: "", isAnonymous: false } });
    }
  };

  const canAdvance = ["CONFIRMED", "PREPARING", "READY_FOR_DISPATCH", "OUT_FOR_DELIVERY"].includes(order.orderStatus);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/account/orders" className="flex items-center gap-1 text-sm text-muted hover:text-ink"><Icon name="arrowLeft" size={16} /> All orders</Link>
          <h1 className="mt-3 font-mono text-2xl sm:text-3xl">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-muted">Placed {formatDateTime(order.createdAt)} · Payment: <Badge tone={order.paymentStatus === "PAID" ? "sage" : "amber"}>{paymentStatusLabel[order.paymentStatus]}</Badge></p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.orderStatus === "PENDING_PAYMENT" && <Button variant="ghost" size="sm" onClick={() => cancelOrder(order.id)}>Cancel order</Button>}
          <Button variant="outline" size="sm" onClick={() => setInvoice(true)}><Icon name="file" size={15} /> Invoice</Button>
          <Button size="sm" onClick={reorder}><Icon name="bag" size={15} /> Reorder</Button>
        </div>
      </div>

      <PaymentPanel order={order} />
      <OrderTracker order={order} />

      {canAdvance && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-xs text-muted">
          <span>Demo only: the shop moves orders along in the admin panel.</span>
          <button onClick={() => simulateAdvance(order.id)} className="font-medium text-ink underline underline-offset-4">Advance status</button>
        </div>
      )}

      {(order.bouquetPhoto || order.podPhoto) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {order.bouquetPhoto && <figure className="card overflow-hidden"><FlowerImage src={order.bouquetPhoto} alt="Finished bouquet" className="aspect-[4/3]" sizes="400px" /><figcaption className="p-4 text-sm">Your finished bouquet</figcaption></figure>}
          {order.podPhoto && <figure className="card overflow-hidden"><FlowerImage src={order.podPhoto} alt="Proof of delivery" className="aspect-[4/3]" sizes="400px" /><figcaption className="p-4 text-sm">Proof of delivery</figcaption></figure>}
        </div>
      )}

      {order.orderStatus === "DELIVERED" && !order.reviewed && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-blush-50 p-5">
          <div><p className="font-semibold">How did we do?</p><p className="text-sm text-muted">Leave a verified review for this order.</p></div>
          <Button variant="primary" size="sm" onClick={() => setReviewOpen(true)}><Icon name="star" size={15} /> Write a review</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <OrderSummary order={order} />
        <OrderTimeline order={order} />
      </div>

      <Modal open={reviewOpen} onClose={() => setReviewOpen(false)} title="Write a review">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => setRating(n)} aria-label={`${n} stars`} className="text-amber-500 transition hover:scale-110">
              <Icon name="star" size={32} fill={n <= rating ? "currentColor" : "none"} />
            </button>
          ))}
        </div>
        <textarea className="field mt-4 resize-none" rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Tell others what you loved…" />
        <p className="mt-2 text-xs text-muted">Reviews are checked by our team before they appear.</p>
        <Button
          className="mt-5 w-full"
          disabled={body.trim().length < 10}
          onClick={() => {
            markReviewed(order.id);
            setReviewOpen(false);
            toast({ title: "Thank you!", body: "Your review is awaiting moderation.", tone: "success" });
          }}
        >
          Submit review
        </Button>
      </Modal>

      <Modal open={invoice} onClose={() => setInvoice(false)} title="Invoice" wide>
        <div className="rounded-2xl border border-line p-6 text-sm" id="invoice">
          <div className="flex items-start justify-between">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-word.png" alt="Sithuliya Flora" className="h-7" />
            <div className="text-right text-xs text-muted"><p>{settings.bank.accountName}</p><p>{settings.shop.address}</p><p>{settings.shop.email}</p></div>
          </div>
          <p className="mt-6 font-mono">Invoice · {order.orderNumber}</p>
          <p className="text-xs text-muted">{formatDateTime(order.createdAt)}</p>
          <table className="mt-4 w-full">
            <tbody>
              {order.items.map((i) => (
                <tr key={i.id} className="border-b border-line"><td className="py-2">{i.name} × {i.qty}</td><td className="py-2 text-right">{lkr(i.unitPrice * i.qty, { decimals: true })}</td></tr>
              ))}
              <tr><td className="pt-3 text-muted">Delivery</td><td className="pt-3 text-right">{lkr(order.deliveryFee + order.surcharge, { decimals: true })}</td></tr>
              {order.discount > 0 && <tr><td className="text-muted">Discount</td><td className="text-right">−{lkr(order.discount, { decimals: true })}</td></tr>}
              <tr><td className="pt-3 font-semibold">Total (LKR)</td><td className="pt-3 text-right font-semibold">{lkr(order.total, { decimals: true })}</td></tr>
            </tbody>
          </table>
          <p className="mt-4 text-xs text-muted">Paid by bank transfer · {paymentStatusLabel[order.paymentStatus]}</p>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setInvoice(false)}>Close</Button>
          <Button onClick={() => window.print()}><Icon name="file" size={16} /> Download PDF</Button>
        </div>
      </Modal>
    </div>
  );
}
