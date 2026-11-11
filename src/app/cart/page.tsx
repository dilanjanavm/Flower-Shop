"use client";

import Link from "next/link";
import { useStore, describeConfig } from "@/lib/store";
import { cartSubtotal } from "@/lib/pricing";
import { lkr } from "@/lib/format";
import { formatLong } from "@/lib/dates";
import { firstAvailableDate } from "@/lib/mock/delivery";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { Icon } from "@/components/ui/Icon";
import { EmptyState, QtyStepper } from "@/components/ui/bits";
import { ButtonLink, buttonClass } from "@/components/ui/Button";

export default function CartPage() {
  const { cart, updateQty, removeLine, hydrated } = useStore();
  const subtotal = cartSubtotal(cart);

  return (
    <div className="container-x pt-10">
      <h1 className="h-display text-5xl sm:text-6xl">Your bag</h1>
      {!hydrated ? (
        <div className="mt-10 space-y-4">
          <div className="skeleton h-32" />
          <div className="skeleton h-32" />
        </div>
      ) : cart.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon="bag" title="Your bag is empty" body="Browse our bouquets or design something of your own." action={<ButtonLink href="/shop">Shop bouquets</ButtonLink>} />
        </div>
      ) : (
        <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
          <ul className="divide-y divide-line border-y border-line">
            {cart.map((l) => (
              <li key={l.id} className="flex gap-5 py-6">
                <Link href={`/product/${l.slug}`} className="shrink-0">
                  <FlowerImage src={l.image} alt={l.name} className="h-36 w-28 rounded-2xl sm:h-40 sm:w-32" sizes="128px" />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Link href={`/product/${l.slug}`} className="font-serif text-2xl hover:underline">{l.name}</Link>
                      <p className="mt-1 text-sm text-muted">{describeConfig(l)}</p>
                    </div>
                    <p className="font-semibold">{lkr(l.unitPrice * l.qty)}</p>
                  </div>
                  {l.config.cardMessage ? (
                    <p className="mt-3 max-w-md rounded-2xl bg-paper px-4 py-3 font-serif text-[15px] italic text-ink-soft">
                      “{l.config.cardMessage}”
                      <span className="mt-1 block font-sans text-xs not-italic text-muted">— {l.config.isAnonymous ? "Anonymous" : l.config.senderName || "No signature"}</span>
                    </p>
                  ) : (
                    <p className="mt-3 text-xs text-muted">No card message</p>
                  )}
                  <div className="mt-auto flex items-center justify-between pt-4">
                    <QtyStepper value={l.qty} onChange={(n) => updateQty(l.id, n)} size="sm" />
                    <button onClick={() => removeLine(l.id)} className="flex items-center gap-1.5 text-sm text-muted transition hover:text-red-600">
                      <Icon name="trash" size={16} /> Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card p-6">
              <h2 className="font-serif text-2xl">Summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd className="font-medium">{lkr(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Delivery</dt><dd className="text-muted">Calculated at checkout</dd></div>
              </dl>
              <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
                <span className="font-medium">Estimated total</span>
                <span className="font-serif text-3xl">{lkr(subtotal)}</span>
              </div>
              <div className="mt-5 flex items-center gap-2 rounded-2xl bg-blush-50 px-4 py-3 text-xs text-blush-700">
                <Icon name="calendar" size={16} /> Earliest delivery: <strong>{formatLong(firstAvailableDate())}</strong>
              </div>
              <Link href="/checkout" className={buttonClass("primary", "lg", "mt-5 w-full")}>
                Continue to checkout <Icon name="arrowRight" size={18} />
              </Link>
              <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted"><Icon name="bank" size={14} /> Pay by bank deposit after checkout</p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
