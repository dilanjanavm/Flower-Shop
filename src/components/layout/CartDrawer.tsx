"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useStore, describeConfig } from "@/lib/store";
import { cn, lkr } from "@/lib/format";
import { cartSubtotal } from "@/lib/pricing";
import { formatShort } from "@/lib/dates";
import { firstAvailableDate } from "@/lib/mock/delivery";
import { Icon } from "../ui/Icon";
import { QtyStepper } from "../ui/bits";
import { FlowerImage } from "../ui/FlowerImage";
import { buttonClass } from "../ui/Button";

export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQty, removeLine } = useStore();
  const subtotal = cartSubtotal(cart);

  useEffect(() => {
    document.body.style.overflow = cartOpen ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  return (
    <div className={cn("fixed inset-0 z-[65]", cartOpen ? "visible" : "invisible")} aria-hidden={!cartOpen}>
      <button className={cn("absolute inset-0 bg-ink/35 backdrop-blur-[2px] transition-opacity duration-500", cartOpen ? "opacity-100" : "opacity-0")} onClick={() => setCartOpen(false)} aria-label="Close cart" tabIndex={-1} />
      <aside
        role="dialog"
        aria-label="Shopping cart"
        className={cn("absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-[var(--shadow-lift)] transition-transform duration-500 ease-[var(--ease-out-soft)]", cartOpen ? "translate-x-0" : "translate-x-full")}
      >
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="font-serif text-2xl">Your bag</h2>
          <button onClick={() => setCartOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Close cart">
            <Icon name="close" />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
            <span className="mb-5 grid h-20 w-20 animate-float place-items-center rounded-full bg-blush-50 text-blush-500">
              <Icon name="flower" size={34} />
            </span>
            <p className="font-serif text-2xl">Your bag is empty</p>
            <p className="mt-2 text-sm text-muted">Find something beautiful — or design your own bouquet.</p>
            <Link href="/shop" onClick={() => setCartOpen(false)} className={buttonClass("primary", "md", "mt-6")}>
              Browse bouquets
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {cart.map((l, i) => (
                <li key={l.id} className="flex animate-fade-up gap-4" style={{ animationDelay: `${i * 50}ms` }}>
                  <FlowerImage src={l.image} alt={l.name} className="h-24 w-20 shrink-0 rounded-2xl" sizes="80px" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${l.slug}`} onClick={() => setCartOpen(false)} className="font-medium leading-snug hover:underline">
                        {l.name}
                      </Link>
                      <button onClick={() => removeLine(l.id)} className="text-faint transition hover:text-red-600" aria-label={`Remove ${l.name}`}>
                        <Icon name="trash" size={16} />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted">{describeConfig(l)}</p>
                    {l.config.cardMessage && <p className="mt-1 line-clamp-1 text-xs italic text-muted">“{l.config.cardMessage}”</p>}
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <QtyStepper size="sm" value={l.qty} onChange={(n) => updateQty(l.id, n)} />
                      <span className="text-sm font-semibold">{lkr(l.unitPrice * l.qty)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="space-y-4 border-t border-line bg-paper px-6 py-5">
              <div className="flex items-center gap-2 rounded-2xl bg-blush-50 px-4 py-3 text-xs text-blush-700">
                <Icon name="calendar" size={16} />
                Earliest delivery: <strong>{formatShort(firstAvailableDate())}</strong>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted">Subtotal</span>
                <span className="font-serif text-2xl">{lkr(subtotal)}</span>
              </div>
              <p className="text-xs text-muted">Delivery fee and slot chosen at checkout. Payment by bank deposit.</p>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/cart" onClick={() => setCartOpen(false)} className={buttonClass("outline", "md")}>
                  View bag
                </Link>
                <Link href="/checkout" onClick={() => setCartOpen(false)} className={buttonClass("primary", "md")}>
                  Checkout
                </Link>
              </div>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
