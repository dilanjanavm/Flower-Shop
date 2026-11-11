import type { Metadata } from "next";
import { blackoutDates, deliveryZones, settings, timeSlots } from "@/lib/mock/delivery";
import { lkr } from "@/lib/format";
import { formatDate } from "@/lib/dates";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = { title: "Delivery & payment", description: "Delivery zones and fees, time slots, the 2-day lead time and how bank deposit payment works." };

const faqs = [
  { q: "Why do you need 2 days' notice?", a: "We buy and condition flowers for each order, then arrange them on the delivery day. Two days lets us do that properly — so there's no same-day or next-day delivery." },
  { q: "How do I pay?", a: "By bank deposit or online transfer to our account. After you place your order you'll see the bank details and amount. Upload a photo or PDF of the slip and we'll confirm your order once the owner verifies it." },
  { q: "What if I don't upload a slip?", a: `Orders without a slip are cancelled automatically ${settings.paymentWindowHours} hours after ordering (or earlier if the delivery date is close), and the slot is released. We'll send you a reminder halfway.` },
  { q: "Can I send flowers anonymously?", a: "Yes. Turn on 'Send anonymously' and your name won't appear on the card, the rider's view, the waybill or the tracking link." },
  { q: "What happens if nobody is home?", a: "The rider will call the recipient. If we still can't deliver, we'll contact you to arrange a new attempt." },
];

export default function DeliveryPage() {
  return (
    <div className="container-x pt-12">
      <p className="eyebrow">Delivery & payment</p>
      <h1 className="h-display mt-3 max-w-3xl text-5xl sm:text-6xl">Everything you need to know before you order</h1>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {[
          { icon: "calendar" as const, t: `${settings.leadTimeDays} days' notice`, b: "Every order — catalogue or custom — must be placed at least two days ahead." },
          { icon: "bank" as const, t: "Bank deposit only", b: "No card, cash on delivery or pay-later. Upload your slip and we verify it by hand." },
          { icon: "truck" as const, t: "Our own riders", b: "Delivered by our team with live tracking and a proof-of-delivery photo." },
        ].map((c) => (
          <div key={c.t} className="card p-6">
            <span className="grid h-12 w-12 place-items-center rounded-full bg-blush-50 text-blush-600"><Icon name={c.icon} size={22} /></span>
            <p className="mt-4 font-serif text-2xl">{c.t}</p>
            <p className="mt-1 text-sm text-muted">{c.b}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-3xl">Delivery zones & fees</h2>
          <div className="mt-5 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-paper">
            {deliveryZones.map((z) => (
              <div key={z.id} className="p-5">
                <div className="flex items-baseline justify-between">
                  <p className="font-semibold">{z.name}</p>
                  <p className="font-serif text-xl">{lkr(z.fee)}</p>
                </div>
                <p className="mt-1 text-sm text-muted">{z.cities.join(", ")}</p>
                {z.freeOver && <p className="mt-2 text-xs font-medium text-sage-700">Free over {lkr(z.freeOver)}</p>}
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted">Outside these areas? Choose store pickup, or contact us — we may be able to arrange a courier.</p>
        </section>
        <section>
          <h2 className="font-serif text-3xl">Time slots</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {timeSlots.map((s) => (
              <div key={s.code} className="rounded-3xl border border-line bg-paper p-5">
                <Icon name={s.code === "MIDNIGHT" ? "sparkle" : "clock"} className="text-blush-500" />
                <p className="mt-3 font-semibold">{s.label}</p>
                <p className="text-sm text-muted">{s.window}</p>
                {s.surcharge > 0 && <p className="mt-1 text-xs font-medium text-blush-600">+{lkr(s.surcharge)} surcharge</p>}
              </div>
            ))}
          </div>
          <h3 className="mt-8 font-semibold">Shop closed</h3>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            <li>Sundays (no deliveries)</li>
            {blackoutDates.map((b) => <li key={b.date}>{formatDate(b.date)} — {b.note}</li>)}
          </ul>
        </section>
      </div>

      <section className="mx-auto mt-20 max-w-3xl">
        <h2 className="text-center font-serif text-4xl">Questions</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium">
                {f.q}
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sand transition-transform duration-300 group-open:rotate-45"><Icon name="plus" size={16} /></span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
