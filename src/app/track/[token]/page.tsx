"use client";

import { useParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { timeSlots } from "@/lib/mock/delivery";
import { formatLong } from "@/lib/dates";
import { OrderTimeline, OrderTracker } from "@/components/account/OrderParts";
import { EmptyState } from "@/components/ui/bits";
import { ButtonLink } from "@/components/ui/Button";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { Icon } from "@/components/ui/Icon";

/**
 * Public tracking view (FR-ADMIN-05.4). Shows no prices and, when the order is
 * anonymous, nothing about the sender (SRS R1, R2).
 */
export default function PublicTrackPage() {
  const { token } = useParams<{ token: string }>();
  const { orders, hydrated } = useStore();
  const order = orders.find((o) => o.trackingToken === token);

  if (!hydrated) return <div className="container-x pt-10"><div className="skeleton h-72" /></div>;
  if (!order)
    return (
      <div className="container-x pt-16">
        <EmptyState icon="truck" title="Tracking link not found" body="This link may have expired. Check the latest SMS from Sithuliya Flora." action={<ButtonLink href="/track">Look up an order</ButtonLink>} />
      </div>
    );

  const slot = timeSlots.find((t) => t.code === order.timeSlot);
  const firstName = order.recipient.name.split(" ")[0];

  return (
    <div className="container-x max-w-4xl pt-10">
      <p className="eyebrow">Live tracking · {order.orderNumber}</p>
      <h1 className="h-display mt-3 text-4xl sm:text-5xl">Flowers for {firstName} 💐</h1>
      <p className="mt-3 text-muted">
        {order.isAnonymousSender ? "From a secret admirer" : order.senderName ? `From ${order.senderName}` : "Sent with love"} · {formatLong(order.deliveryDate)}, {slot?.window}
      </p>
      <div className="mt-8 space-y-6">
        <OrderTracker order={order} />
        {(order.bouquetPhoto || order.podPhoto) && (
          <div className="grid gap-4 sm:grid-cols-2">
            {order.bouquetPhoto && (
              <figure className="card overflow-hidden">
                <FlowerImage src={order.bouquetPhoto} alt="Finished bouquet" className="aspect-[4/3]" sizes="400px" />
                <figcaption className="flex items-center gap-2 p-4 text-sm"><Icon name="camera" size={16} /> Finished bouquet</figcaption>
              </figure>
            )}
            {order.podPhoto && (
              <figure className="card overflow-hidden">
                <FlowerImage src={order.podPhoto} alt="Proof of delivery" className="aspect-[4/3]" sizes="400px" />
                <figcaption className="flex items-center gap-2 p-4 text-sm"><Icon name="check" size={16} /> Proof of delivery</figcaption>
              </figure>
            )}
          </div>
        )}
        <OrderTimeline order={order} />
      </div>
    </div>
  );
}
