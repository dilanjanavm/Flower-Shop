"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore, describeConfig } from "@/lib/store";
import { cartSubtotal } from "@/lib/pricing";
import { applyCoupon, settings, slotRemaining, timeSlots, zoneForCity } from "@/lib/mock/delivery";
import { cn, lkr, normalisePhone } from "@/lib/format";
import { formatLong } from "@/lib/dates";
import type { Recipient, SlotCode } from "@/lib/types";
import { Stepper } from "./Stepper";
import { SchedulePicker } from "./SchedulePicker";
import { RecipientForm, emptyRecipient, validateRecipient, type RecipientErrors } from "./RecipientForm";
import { FlowerImage } from "../ui/FlowerImage";
import { Icon } from "../ui/Icon";
import { EmptyState, Toggle } from "../ui/bits";
import { Button, ButtonLink, buttonClass } from "../ui/Button";

const STEPS = ["Recipient & schedule", "Review", "Bank deposit"];

export function CheckoutView() {
  const router = useRouter();
  const { cart, user, hydrated, placeOrder, toast, login } = useStore();
  const [step, setStep] = useState(0);
  const [fulfilment, setFulfilment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [date, setDate] = useState("");
  const [slot, setSlot] = useState<SlotCode | "">("");
  const [recipient, setRecipient] = useState<Recipient>(emptyRecipient);
  const [errors, setErrors] = useState<RecipientErrors>({});
  const [anon, setAnon] = useState(false);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponErr, setCouponErr] = useState("");
  const [usePoints, setUsePoints] = useState(false);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (cart.some((l) => l.config.isAnonymous)) setAnon(true);
  }, [cart]);

  const pickup = fulfilment === "PICKUP";
  const subtotal = cartSubtotal(cart);
  const zone = !pickup && recipient.city ? zoneForCity(recipient.city) : undefined;
  const deliveryFee = pickup ? 0 : zone ? (zone.freeOver && subtotal >= zone.freeOver ? 0 : zone.fee) : 0;
  const surcharge = timeSlots.find((t) => t.code === slot)?.surcharge ?? 0;
  const discount = coupon?.discount ?? 0;
  const points = usePoints && user ? Math.min(user.loyaltyPoints, Math.floor(subtotal * 0.2)) : 0;
  const total = Math.max(0, subtotal - discount - points * settings.pointsValue + deliveryFee + surcharge);

  if (!hydrated) {
    return (
      <div className="container-x pt-10">
        <div className="skeleton h-14 w-64" />
        <div className="skeleton mt-10 h-96" />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="container-x pt-16">
        <EmptyState icon="bag" title="Nothing to check out yet" body="Add a bouquet to your bag first." action={<ButtonLink href="/shop">Shop bouquets</ButtonLink>} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-x pt-16">
        <div className="card mx-auto max-w-lg p-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-blush-50 text-blush-600"><Icon name="user" size={26} /></span>
          <h1 className="mt-5 font-serif text-3xl">Sign in to check out</h1>
          <p className="mt-2 text-sm text-muted">Your bag is saved and will be waiting. An account lets you track the order, upload your bank slip and reorder later.</p>
          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <Link href="/login?next=/checkout" className={buttonClass("primary", "md")}>Sign in</Link>
            <Link href="/register?next=/checkout" className={buttonClass("outline", "md")}>Create account</Link>
          </div>
          <button onClick={() => login()} className="mt-4 text-xs text-muted underline underline-offset-4 hover:text-ink">Use demo customer account</button>
        </div>
      </div>
    );
  }

  const goReview = () => {
    const e = validateRecipient(recipient, pickup);
    setErrors(e);
    if (!date || !slot) {
      toast({ title: "Choose a date and slot", tone: "error" });
      return;
    }
    if (Object.keys(e).length) return;
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const apply = () => {
    const r = applyCoupon(code, subtotal);
    if (r.ok) {
      setCoupon({ code: r.coupon.code, discount: r.discount });
      setCouponErr("");
    } else {
      setCoupon(null);
      setCouponErr(r.error);
    }
  };

  const place = async () => {
    // Server re-checks lead time + slot capacity at placement (FR-CUST-04.8)
    if (!slot || slotRemaining(date, slot) === 0) {
      toast({ title: "That slot just filled up", body: "Please pick another time.", tone: "error" });
      setStep(0);
      return;
    }
    setPlacing(true);
    await new Promise((r) => setTimeout(r, 900));
    const order = placeOrder({
      fulfilment,
      deliveryDate: date,
      timeSlot: slot,
      recipient: { ...recipient, phone: normalisePhone(recipient.phone) ?? recipient.phone, ...(pickup ? { line1: "Store pickup", city: "Colombo 07" } : {}) },
      isAnonymousSender: anon,
      couponCode: coupon?.code,
      discount,
      pointsUsed: points,
    });
    router.push(`/order/${order.orderNumber}?new=1`);
  };

  return (
    <div className="container-x pt-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="h-display text-5xl">Checkout</h1>
        <div className="w-full max-w-xl"><Stepper steps={STEPS} current={step} onStep={setStep} /></div>
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div key={step} className="animate-fade-up space-y-10">
          {step === 0 && (
            <>
              <section>
                <h2 className="font-serif text-3xl">How should it arrive?</h2>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {(["DELIVERY", "PICKUP"] as const).map((f) => (
                    <button key={f} onClick={() => { setFulfilment(f); if (f === "PICKUP" && slot === "MIDNIGHT") setSlot(""); }} className={cn("flex items-center gap-4 rounded-3xl border p-5 text-left transition", fulfilment === f ? "border-ink bg-ink text-cream" : "border-line bg-paper hover:border-ink/40")}>
                      <span className={cn("grid h-12 w-12 place-items-center rounded-full", fulfilment === f ? "bg-cream/10" : "bg-blush-50 text-blush-600")}>
                        <Icon name={f === "DELIVERY" ? "truck" : "home"} size={22} />
                      </span>
                      <span>
                        <span className="block font-semibold">{f === "DELIVERY" ? "Delivery" : "Store pickup"}</span>
                        <span className={cn("text-sm", fulfilment === f ? "text-cream/70" : "text-muted")}>{f === "DELIVERY" ? "Fee by delivery zone" : `Free · ${settings.shop.address}`}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <h2 className="mb-4 font-serif text-3xl">{pickup ? "Pickup date" : "Delivery date"}</h2>
                <SchedulePicker date={date} slot={slot} onDate={(d) => { setDate(d); setSlot(""); }} onSlot={setSlot} pickup={pickup} />
              </section>
              <section>
                <h2 className="mb-4 font-serif text-3xl">{pickup ? "Who's collecting?" : "Who's it for?"}</h2>
                <RecipientForm value={recipient} onChange={setRecipient} errors={errors} pickup={pickup} />
                <div className="mt-5 rounded-2xl border border-line bg-paper p-4">
                  <Toggle checked={anon} onChange={setAnon} label="Hide my name from the recipient" description="The rider, waybill and tracking link won't show your details" />
                </div>
              </section>
              <div className="flex justify-end">
                <Button size="lg" onClick={goReview}>Review order <Icon name="arrowRight" size={18} /></Button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <section className="card divide-y divide-line">
                <div className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="label">{pickup ? "Store pickup" : "Delivery"}</p>
                    <p className="font-medium">{formatLong(date)}</p>
                    <p className="text-sm text-muted">{timeSlots.find((t) => t.code === slot)?.label} · {timeSlots.find((t) => t.code === slot)?.window}</p>
                  </div>
                  <button onClick={() => setStep(0)} className="text-sm font-medium underline underline-offset-4">Change</button>
                </div>
                <div className="flex items-start justify-between gap-4 p-5">
                  <div>
                    <p className="label">{pickup ? "Collected by" : "Recipient"}</p>
                    <p className="font-medium">{recipient.name} · {recipient.phone}</p>
                    {!pickup && <p className="text-sm text-muted">{recipient.line1}, {recipient.city}{recipient.landmark ? ` · ${recipient.landmark}` : ""}</p>}
                    {anon && <p className="mt-1 text-xs text-blush-600">Sender hidden</p>}
                  </div>
                  <button onClick={() => setStep(0)} className="text-sm font-medium underline underline-offset-4">Change</button>
                </div>
                <ul className="space-y-4 p-5">
                  {cart.map((l) => (
                    <li key={l.id} className="flex items-center gap-4">
                      <FlowerImage src={l.image} alt="" className="h-16 w-14 rounded-xl" sizes="56px" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{l.name} <span className="text-muted">× {l.qty}</span></p>
                        <p className="text-xs text-muted">{describeConfig(l)}</p>
                      </div>
                      <p className="text-sm font-semibold">{lkr(l.unitPrice * l.qty)}</p>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="card p-5">
                <p className="label">Promo code</p>
                <div className="flex gap-2">
                  <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} className="field uppercase" placeholder="e.g. LOVE10" aria-label="Promo code" />
                  <Button variant="outline" onClick={apply} disabled={!code}>Apply</Button>
                </div>
                {couponErr && <p className="mt-2 text-xs text-red-600">{couponErr}</p>}
                {coupon && <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-sage-700"><Icon name="check" size={14} /> {coupon.code} applied — you save {lkr(coupon.discount)}</p>}
                {user.loyaltyPoints > 0 && (
                  <div className="mt-5 border-t border-line pt-5">
                    <Toggle checked={usePoints} onChange={setUsePoints} label={`Use loyalty points (${user.loyaltyPoints} available)`} description="1 point = Rs 1, up to 20% of your subtotal" />
                  </div>
                )}
              </section>

              <section className="flex items-start gap-4 rounded-3xl bg-paper p-5 ring-1 ring-line">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blush-50 text-blush-600"><Icon name="bank" size={22} /></span>
                <div className="text-sm">
                  <p className="font-semibold">Payment: bank deposit or online transfer</p>
                  <p className="mt-1 text-muted">After you place the order we&apos;ll show our account details. Transfer the total, then upload your slip within {settings.paymentWindowHours} hours — your slot is held until then.</p>
                </div>
              </section>

              <div className="flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(0)}><Icon name="arrowLeft" size={18} /> Back</Button>
                <Button size="lg" onClick={place} disabled={placing}>
                  {placing ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-cream/30 border-t-cream" /> Placing order…</> : <>Place order · {lkr(total)}</>}
                </Button>
              </div>
            </>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-6">
            <h2 className="font-serif text-2xl">Order total</h2>
            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-muted">Subtotal ({cart.reduce((n, l) => n + l.qty, 0)} items)</dt><dd>{lkr(subtotal)}</dd></div>
              <div className="flex justify-between">
                <dt className="text-muted">{pickup ? "Pickup" : `Delivery${zone ? ` · ${zone.name}` : ""}`}</dt>
                <dd>{pickup ? "Free" : zone ? (deliveryFee === 0 ? "Free" : lkr(deliveryFee)) : "—"}</dd>
              </div>
              {surcharge > 0 && <div className="flex justify-between"><dt className="text-muted">Midnight surcharge</dt><dd>{lkr(surcharge)}</dd></div>}
              {discount > 0 && <div className="flex justify-between text-sage-700"><dt>Promo {coupon?.code}</dt><dd>−{lkr(discount)}</dd></div>}
              {points > 0 && <div className="flex justify-between text-sage-700"><dt>Loyalty points</dt><dd>−{lkr(points)}</dd></div>}
            </dl>
            <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5">
              <span className="font-medium">Total</span>
              <span key={total} className="animate-fade-up font-serif text-3xl">{lkr(total)}</span>
            </div>
            {zone?.freeOver && !pickup && subtotal < zone.freeOver && (
              <p className="mt-3 text-xs text-muted">Add {lkr(zone.freeOver - subtotal)} more for free delivery to {zone.name}.</p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
