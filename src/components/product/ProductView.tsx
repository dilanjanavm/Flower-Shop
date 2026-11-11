"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product, SizeTier } from "@/lib/types";
import { addOns, products, ribbons, wraps } from "@/lib/mock/catalogue";
import { firstAvailableDate, settings, timeSlots } from "@/lib/mock/delivery";
import { linePrice, tierLabel, variantPrice } from "@/lib/pricing";
import { cn, lkr } from "@/lib/format";
import { formatLong } from "@/lib/dates";
import { useStore } from "@/lib/store";
import { FlowerImage } from "../ui/FlowerImage";
import { Icon } from "../ui/Icon";
import { Badge, QtyStepper, Stars, Toggle } from "../ui/bits";
import { Button } from "../ui/Button";
import { ProductCard } from "./ProductCard";
import { Reveal } from "../ui/Reveal";

const tabs = ["Description", "Care tips", "Delivery", "Reviews"] as const;

export function ProductView({ product }: { product: Product }) {
  const { addToCart, wishlist, toggleWishlist, hydrated } = useStore();
  const activeVariants = product.variants.filter((v) => v.isActive);
  const [imgIdx, setImgIdx] = useState(0);
  const [tier, setTier] = useState<SizeTier>(activeVariants[Math.min(1, activeVariants.length - 1)].sizeTier);
  const [wrapId, setWrapId] = useState(wraps.find((w) => w.available)!.id);
  const [ribbonId, setRibbonId] = useState(ribbons[0].id);
  const [extras, setExtras] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const [sender, setSender] = useState("");
  const [anon, setAnon] = useState(false);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState<(typeof tabs)[number]>("Description");
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);

  const variant = product.variants.find((v) => v.sizeTier === tier)!;
  const unit = linePrice(variant, wrapId, extras);
  // Computed on the client so a statically generated page never shows a stale date (FR-CUST-01.6)
  const [earliest, setEarliest] = useState<string | null>(null);
  useEffect(() => setEarliest(firstAvailableDate()), []);
  const liked = hydrated && wishlist.includes(product.id);
  const related = useMemo(
    () => products.filter((p) => p.id !== product.id && p.isAvailable && p.occasions.some((o) => product.occasions.includes(o))).slice(0, 4),
    [product],
  );

  const add = () => {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      qty,
      unitPrice: unit,
      config: { variantId: variant.id, sizeTier: tier, wrapId, ribbonId, addOnIds: extras, cardMessage: message.trim(), senderName: anon ? "" : sender.trim(), isAnonymous: anon },
    });
  };

  return (
    <div className="container-x pt-8">
      <nav className="mb-6 flex items-center gap-1.5 text-xs text-muted" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-ink">Home</Link>
        <Icon name="chevronRight" size={12} />
        <Link href="/shop" className="hover:text-ink">Shop</Link>
        <Icon name="chevronRight" size={12} />
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        {/* Gallery */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div
            className="relative cursor-zoom-in overflow-hidden rounded-[2rem]"
            onMouseMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
            }}
            onMouseLeave={() => setZoom(null)}
          >
            <div key={imgIdx} className="animate-fade-in" style={{ ["--zx" as string]: `${zoom?.x ?? 50}%`, ["--zy" as string]: `${zoom?.y ?? 50}%` }}>
              <FlowerImage
                src={product.images[imgIdx]}
                alt={`${product.name} — photo ${imgIdx + 1}`}
                priority
                className="aspect-[4/5]"
                imgClassName={cn("origin-[var(--zx)_var(--zy)] transition-transform duration-300", zoom && "scale-[1.6]")}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
            <div className="absolute left-4 top-4 flex gap-2">
              {product.isNew && <Badge tone="ink">New</Badge>}
              {!product.isAvailable && <Badge>Currently unavailable</Badge>}
            </div>
            <button
              onClick={() => toggleWishlist(product.id)}
              className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-paper/90 backdrop-blur transition hover:scale-110"
              aria-label="Save to wishlist"
              aria-pressed={liked}
            >
              <Icon name="heart" className={liked ? "fill-blush-500 text-blush-500" : ""} />
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            {product.images.map((src, i) => (
              <button
                key={src}
                onClick={() => setImgIdx(i)}
                className={cn("overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-cream transition", i === imgIdx ? "ring-ink" : "ring-transparent opacity-70 hover:opacity-100")}
                aria-label={`Show photo ${i + 1}`}
              >
                <FlowerImage src={src} alt="" className="h-20 w-16 sm:h-24 sm:w-20" sizes="80px" />
              </button>
            ))}
          </div>
        </div>

        {/* Configurator */}
        <div className="pb-10">
          <div className="flex items-center gap-3 text-sm">
            <Stars value={product.rating} />
            <a href="#reviews" onClick={() => setTab("Reviews")} className="text-muted underline-offset-4 hover:underline">
              {product.rating.toFixed(1)} · {product.reviewCount} reviews
            </a>
          </div>
          <h1 className="h-display mt-3 text-5xl sm:text-6xl">{product.name}</h1>
          <p className="mt-3 text-lg text-muted">{product.tagline}</p>

          <div className="mt-6 flex items-baseline gap-3">
            <span key={unit} className="animate-fade-up font-serif text-4xl">{lkr(unit)}</span>
            {variant.salePrice && <span className="text-lg text-faint line-through">{lkr(variant.price)}</span>}
          </div>

          <div className="mt-5 flex items-center gap-2.5 rounded-2xl bg-blush-50 px-4 py-3 text-sm text-blush-700">
            <Icon name="calendar" size={18} />
            <span>
              Earliest delivery: <strong>{earliest ? formatLong(earliest) : "…"}</strong>
            </span>
          </div>

          {!product.isAvailable && (
            <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-sand px-4 py-3 text-sm">
              <Icon name="info" size={18} className="mt-0.5 shrink-0" />
              <span>
                <strong>Currently unavailable.</strong> Our florist has paused this bouquet for now. Try a{" "}
                <Link href="/custom-bouquet" className="underline">custom bouquet</Link> instead.
              </span>
            </div>
          )}

          {/* Size tier */}
          <section className="mt-9">
            <h2 className="label">Size</h2>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  disabled={!v.isActive}
                  onClick={() => setTier(v.sizeTier)}
                  className={cn(
                    "rounded-2xl border p-3.5 text-left transition-all duration-200",
                    tier === v.sizeTier ? "border-ink bg-ink text-cream shadow-[var(--shadow-lift)]" : "border-line bg-paper hover:border-ink/40",
                    !v.isActive && "cursor-not-allowed opacity-40",
                  )}
                >
                  <span className="block text-sm font-semibold">{tierLabel[v.sizeTier]}</span>
                  <span className={cn("block text-xs", tier === v.sizeTier ? "text-cream/70" : "text-muted")}>{v.isActive ? `${v.stemCount} stems` : "Not offered"}</span>
                  <span className="mt-2 block text-sm">{lkr(variantPrice(v))}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Wrap */}
          <section className="mt-8">
            <h2 className="label">Wrapping</h2>
            <div className="grid gap-2.5 sm:grid-cols-3">
              {wraps.map((w) => (
                <button
                  key={w.id}
                  disabled={!w.available}
                  onClick={() => setWrapId(w.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3 text-left transition",
                    wrapId === w.id ? "border-ink ring-1 ring-ink" : "border-line bg-paper hover:border-ink/40",
                    !w.available && "cursor-not-allowed opacity-45",
                  )}
                >
                  <span className="h-9 w-9 shrink-0 rounded-xl ring-1 ring-black/10" style={{ background: w.swatch }} />
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{w.name}</span>
                    <span className="block text-xs text-muted">{!w.available ? "Unavailable" : w.price ? `+${lkr(w.price)}` : "Included"}</span>
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* Ribbon */}
          <section className="mt-8">
            <h2 className="label">
              Ribbon · <span className="normal-case tracking-normal text-ink">{ribbons.find((r) => r.id === ribbonId)?.name}</span>
            </h2>
            <div className="flex flex-wrap gap-3">
              {ribbons.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setRibbonId(r.id)}
                  aria-label={r.name}
                  aria-pressed={ribbonId === r.id}
                  className={cn("h-10 w-10 rounded-full ring-1 ring-black/10 transition-all duration-200", ribbonId === r.id ? "scale-110 ring-2 ring-ink ring-offset-2 ring-offset-cream" : "hover:scale-105")}
                  style={{ background: r.hex }}
                />
              ))}
            </div>
          </section>

          {/* Add-ons */}
          <section className="mt-8">
            <h2 className="label">Add a little extra</h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {addOns.map((a) => {
                const on = extras.includes(a.id);
                return (
                  <button
                    key={a.id}
                    disabled={!a.available}
                    onClick={() => setExtras((x) => (on ? x.filter((i) => i !== a.id) : [...x, a.id]))}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border p-2.5 text-left transition",
                      on ? "border-ink bg-blush-50" : "border-line bg-paper hover:border-ink/40",
                      !a.available && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <FlowerImage src={a.image} alt="" className="h-12 w-12 shrink-0 rounded-xl" sizes="48px" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{a.name}</span>
                      <span className="text-xs text-muted">{a.available ? `+${lkr(a.price)}` : "Out of stock"}</span>
                    </span>
                    <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full border transition", on ? "border-ink bg-ink text-cream" : "border-line")}>
                      {on && <Icon name="check" size={14} strokeWidth={2.4} />}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Card message */}
          <section className="mt-8 rounded-3xl border border-line bg-paper p-5">
            <div className="flex items-center justify-between">
              <h2 className="label mb-0 flex items-center gap-2"><Icon name="card" size={16} /> Card message</h2>
              <span className={cn("text-xs tabular-nums", message.length > settings.cardMessageLimit - 20 ? "text-blush-600" : "text-faint")}>
                {message.length}/{settings.cardMessageLimit}
              </span>
            </div>
            <textarea
              value={message}
              maxLength={settings.cardMessageLimit}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Write something from the heart… emoji welcome 💐"
              className="field mt-3 resize-none font-serif text-lg"
              aria-label="Card message"
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 sm:items-center">
              <input value={sender} onChange={(e) => setSender(e.target.value)} disabled={anon} placeholder="Sign it as… (e.g. Nadee)" className="field disabled:opacity-40" aria-label="Signature" />
              <Toggle checked={anon} onChange={setAnon} label="Send anonymously" description="Your name won't appear anywhere" />
            </div>
          </section>

          {/* Add to cart */}
          <div className="sticky bottom-0 z-10 -mx-5 mt-8 flex items-center gap-3 border-t border-line bg-cream/90 px-5 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
            <QtyStepper value={qty} onChange={setQty} />
            <Button size="lg" className="flex-1" disabled={!product.isAvailable} onClick={add}>
              {product.isAvailable ? (
                <>
                  <Icon name="bag" size={18} /> Add to bag<span className="hidden sm:inline"> · {lkr(unit * qty)}</span>
                </>
              ) : (
                "Currently unavailable"
              )}
            </Button>
          </div>

          <ul className="mt-6 grid grid-cols-3 gap-2 text-center text-[11px] text-muted">
            <li className="rounded-2xl bg-sand/70 px-2 py-3"><Icon name="leaf" size={18} className="mx-auto mb-1 text-sage-500" />Made fresh to order</li>
            <li className="rounded-2xl bg-sand/70 px-2 py-3"><Icon name="bank" size={18} className="mx-auto mb-1 text-sage-500" />Pay by bank deposit</li>
            <li className="rounded-2xl bg-sand/70 px-2 py-3"><Icon name="truck" size={18} className="mx-auto mb-1 text-sage-500" />Tracked delivery</li>
          </ul>
        </div>
      </div>

      {/* Tabs */}
      <section id="reviews" className="mt-20 scroll-mt-28">
        <div className="no-scrollbar flex gap-1 overflow-x-auto border-b border-line" role="tablist">
          {tabs.map((t) => (
            <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={cn("relative shrink-0 px-5 py-4 text-sm font-medium transition", tab === t ? "text-ink" : "text-muted hover:text-ink")}>
              {t}
              {t === "Reviews" && <span className="ml-1.5 text-xs text-faint">({product.reviewCount})</span>}
              <span className={cn("absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-ink transition-transform duration-300", tab === t ? "scale-x-100" : "scale-x-0")} />
            </button>
          ))}
        </div>
        <div key={tab} className="animate-fade-up py-8">
          {tab === "Description" && <p className="max-w-3xl text-lg leading-relaxed text-ink-soft">{product.description}</p>}
          {tab === "Care tips" && (
            <ol className="grid max-w-3xl gap-3 sm:grid-cols-2">
              {product.careTips.map((c, i) => (
                <li key={c} className="flex gap-3 rounded-2xl bg-paper p-4 text-sm">
                  <span className="font-serif text-2xl text-blush-500">{i + 1}</span>
                  {c}
                </li>
              ))}
            </ol>
          )}
          {tab === "Delivery" && (
            <div className="grid max-w-4xl gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-paper p-5 text-sm">
                <p className="font-semibold">Book at least {settings.leadTimeDays} days ahead</p>
                <p className="mt-1 text-muted">We don&apos;t offer same-day or next-day delivery — every bouquet is made fresh for its date.</p>
              </div>
              <div className="rounded-2xl bg-paper p-5 text-sm">
                <p className="font-semibold">Delivery slots</p>
                <ul className="mt-1 text-muted">
                  {timeSlots.map((s) => (
                    <li key={s.code}>
                      {s.label} · {s.window}
                      {s.surcharge ? ` (+${lkr(s.surcharge)})` : ""}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl bg-paper p-5 text-sm sm:col-span-2">
                <p className="font-semibold">Payment by bank deposit</p>
                <p className="mt-1 text-muted">After checkout you&apos;ll see our bank details. Upload your slip and we&apos;ll confirm your order once verified.</p>
                <Link href="/delivery" className="mt-2 inline-block font-medium underline underline-offset-4">Delivery areas & fees</Link>
              </div>
            </div>
          )}
          {tab === "Reviews" && (
            <div className="grid gap-4 md:grid-cols-2">
              {product.reviews.map((r) => (
                <article key={r.id} className="rounded-3xl bg-paper p-6">
                  <div className="flex items-center justify-between">
                    <Stars value={r.rating} />
                    {r.verified && <Badge tone="sage"><Icon name="check" size={12} strokeWidth={2.4} /> Verified order</Badge>}
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed">{r.body}</p>
                  <p className="mt-4 text-xs text-muted">{r.author} · {r.date}</p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="h-display mb-8 text-4xl">You may also love</h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
            {related.map((p, i) => (
              <Reveal key={p.id} delay={i * 70}>
                <ProductCard product={p} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
