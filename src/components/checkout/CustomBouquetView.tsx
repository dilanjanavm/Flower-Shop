"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { galleryFlowers, ribbons, taxonomies, wraps } from "@/lib/mock/catalogue";
import { settings, timeSlots } from "@/lib/mock/delivery";
import { useStore } from "@/lib/store";
import { cn, lkr } from "@/lib/format";
import { formatLong } from "@/lib/dates";
import type { Recipient, SlotCode } from "@/lib/types";
import { FlowerImage } from "../ui/FlowerImage";
import { Icon } from "../ui/Icon";
import { Field, QtyStepper, Toggle } from "../ui/bits";
import { Button, buttonClass } from "../ui/Button";
import { Stepper } from "./Stepper";
import { SchedulePicker } from "./SchedulePicker";
import { RecipientForm, emptyRecipient, validateRecipient, type RecipientErrors } from "./RecipientForm";
import { RibbonSwatch, WrapSwatch } from "./Swatches";
import { wrapKindOf } from "@/lib/three/textures";

const BouquetPreview3D = dynamic(() => import("./BouquetPreview3D"), {
  ssr: false,
  loading: () => <div className="h-[340px] animate-pulse rounded-3xl border border-line bg-blush-50" />,
});

const STEPS = ["Flowers", "Style & wrap", "Delivery", "Review"];
const STYLES = taxonomies.styles.filter((s) => ["hand-tied", "box", "basket"].includes(s.slug));
const DRAFT_KEY = "sf-custom-draft";

interface Draft {
  qty: Record<string, number>;
  style: string;
  wrapId: string;
  ribbonId: string;
  notes: string;
  photos: string[];
  fulfilment: "DELIVERY" | "PICKUP";
  date: string;
  slot: SlotCode | "";
  recipient: Recipient;
  card: string;
  anon: boolean;
}

const initialDraft: Draft = {
  qty: {},
  style: "hand-tied",
  wrapId: "wrap-kraft",
  ribbonId: "rib-blush",
  notes: "",
  photos: [],
  fulfilment: "DELIVERY",
  date: "",
  slot: "",
  recipient: emptyRecipient,
  card: "",
  anon: false,
};

export function CustomBouquetView() {
  const router = useRouter();
  const { user, submitQuote, toast, hydrated } = useStore();
  const [step, setStep] = useState(0);
  const [d, setD] = useState<Draft>(initialDraft);
  const [filter, setFilter] = useState<"ALL" | "FLOWER" | "FILLER">("ALL");
  const [errors, setErrors] = useState<RecipientErrors>({});
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<"stem" | "bouquet">("stem");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ qty: Record<string, number>; label: string } | null>(null);

  // Undo offer disappears after a few seconds
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 6000);
    return () => clearTimeout(t);
  }, [undo]);

  // Picking flowers → show the single stem; style/wrap and later → the whole bouquet
  useEffect(() => {
    setView(step === 0 ? "stem" : "bouquet");
    setHoverId(null);
  }, [step]);

  // Keep the selection across login (FR-CUST-03.4)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) setD({ ...initialDraft, ...(JSON.parse(raw) as Draft) });
    } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(d));
  }, [d, loaded]);

  const up = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setQty = (id: string, n: number) => {
    setFocusId(id);
    if (step === 0) setView("stem");
    setQtyRaw(id, n);
  };
  const removeFlower = (id: string) => {
    const f = galleryFlowers.find((g) => g.id === id);
    setUndo({ qty: d.qty, label: `${f?.name ?? "Flower"} removed` });
    setQtyRaw(id, 0);
    if (focusId === id) setFocusId(null);
    if (hoverId === id) setHoverId(null);
  };
  const clearBouquet = () => {
    if (!Object.keys(d.qty).length) return;
    setUndo({ qty: d.qty, label: "Bouquet cleared" });
    setD((x) => ({ ...x, qty: {} }));
    setFocusId(null);
    setView("stem");
  };
  const restore = () => {
    if (!undo) return;
    setD((x) => ({ ...x, qty: undo.qty }));
    setUndo(null);
  };
  const setQtyRaw = (id: string, n: number) => setD((x) => {
    const qty = { ...x.qty };
    if (n <= 0) delete qty[id];
    else qty[id] = Math.min(200, n);
    return { ...x, qty };
  });

  const picked = useMemo(() => galleryFlowers.filter((f) => d.qty[f.id]), [d.qty]);
  const previewFlower =
    galleryFlowers.find((f) => f.id === (step === 0 && hoverId ? hoverId : focusId)) ?? picked[picked.length - 1] ?? galleryFlowers[0];
  const flowerCount = picked.filter((f) => f.kind === "FLOWER").length;
  const stems = picked.reduce((s, f) => s + d.qty[f.id], 0);
  const estimate = picked.reduce((s, f) => s + (f.indicativePrice ?? 0) * d.qty[f.id], 0) + (wraps.find((w) => w.id === d.wrapId)?.price ?? 0);
  const pickup = d.fulfilment === "PICKUP";

  // Nothing left to arrange → back to picking flowers
  useEffect(() => {
    if (loaded && step > 0 && flowerCount === 0) setStep(0);
  }, [loaded, step, flowerCount]);

  const canNext = [flowerCount > 0, !!d.style && !!d.wrapId, !!d.date && !!d.slot, true][step];

  const next = () => {
    if (step === 2) {
      const e = validateRecipient(d.recipient, pickup);
      setErrors(e);
      if (Object.keys(e).length) return;
    }
    setStep((s) => Math.min(3, s + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submit = () => {
    if (!user) {
      router.push("/login?next=/custom-bouquet");
      return;
    }
    const q = submitQuote({
      items: picked.map((f) => ({ flowerId: f.id, name: f.name, image: f.image, qty: d.qty[f.id] })),
      style: d.style,
      wrapId: d.wrapId,
      ribbonId: d.ribbonId,
      notes: d.notes,
      referencePhotos: d.photos,
      fulfilment: d.fulfilment,
      deliveryDate: d.date,
      timeSlot: d.slot as SlotCode,
      recipient: pickup ? { ...d.recipient, line1: "Store pickup", city: "Colombo 07" } : d.recipient,
      cardMessage: d.card,
      isAnonymousSender: d.anon,
      estimate,
    });
    sessionStorage.removeItem(DRAFT_KEY);
    toast({ title: "Quotation request sent", body: "We'll reply with a price soon — you'll get an SMS and email.", tone: "success" });
    router.push(`/account/quotations/${q.id}`);
  };

  const list = galleryFlowers.filter((f) => filter === "ALL" || f.kind === filter);

  return (
    <div className="container-x pt-10">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">Custom bouquet</p>
        <h1 className="h-display mt-3 text-5xl sm:text-6xl">Design your own bouquet</h1>
        <p className="mt-4 text-muted">Pick flowers from our gallery and send a quotation request. Our florist checks availability and replies with a price — you only pay once you accept.</p>
      </div>

      <div className="mx-auto mt-10 max-w-3xl">
        <Stepper steps={STEPS} current={step} onStep={setStep} />
      </div>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_340px]">
        <div key={step} className="animate-fade-up">
          {step === 0 && (
            <section>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-3xl">Choose your flowers</h2>
                <div className="flex gap-1 rounded-full bg-sand p-1 text-sm">
                  {(["ALL", "FLOWER", "FILLER"] as const).map((f) => (
                    <button key={f} onClick={() => setFilter(f)} className={cn("rounded-full px-4 py-1.5 transition", filter === f ? "bg-paper shadow-sm" : "text-muted")}>
                      {f === "ALL" ? "All" : f === "FLOWER" ? "Flowers" : "Greens & fillers"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
                {list.map((f, i) => {
                  const q = d.qty[f.id] ?? 0;
                  return (
                    <div key={f.id} onMouseEnter={() => setHoverId(f.id)} onMouseLeave={() => setHoverId((h) => (h === f.id ? null : h))} className={cn("group animate-fade-up overflow-hidden rounded-3xl border bg-paper transition-all duration-300", q ? "border-ink shadow-[var(--shadow-lift)]" : "border-line/70")} style={{ animationDelay: `${i * 35}ms` }}>
                      <button className="relative block w-full" onClick={() => setQty(f.id, q ? q : f.kind === "FILLER" ? 1 : 5)} aria-label={`Add ${f.name}`}>
                        <FlowerImage src={f.image} alt={f.name} className="aspect-square" imgClassName="group-hover:scale-105" sizes="220px" />
                        {q > 0 && <span className="absolute right-3 top-3 grid h-8 min-w-8 animate-pop place-items-center rounded-full bg-ink px-2 text-xs font-bold text-cream">{q}</span>}
                        <span className="absolute left-3 top-3 h-5 w-5 rounded-full ring-2 ring-paper" style={{ background: f.hex }} title={f.colour} />
                      </button>
                      <div className="p-3.5">
                        <p className="font-medium leading-tight">{f.name}</p>
                        <p className="mt-0.5 text-xs text-muted">{f.indicativePrice ? `≈ ${lkr(f.indicativePrice)} / ${f.kind === "FILLER" ? "bunch" : "stem"}` : f.colour}</p>
                        <div className="mt-3">
                          {q > 0 ? (
                            <div className="flex items-center justify-between gap-2">
                              <QtyStepper size="sm" value={q} min={0} max={200} onChange={(n) => setQty(f.id, n)} />
                              <button
                                type="button"
                                onClick={() => removeFlower(f.id)}
                                className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-blush-50 hover:text-blush-600"
                                aria-label={`Remove ${f.name}`}
                                title="Remove"
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setQty(f.id, f.kind === "FILLER" ? 1 : 5)} className="flex h-8 items-center gap-1 rounded-full border border-line px-3 text-xs font-medium transition hover:border-ink hover:bg-ink hover:text-cream">
                              <Icon name="plus" size={13} /> Add
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {step === 1 && (
            <section className="space-y-8">
              <h2 className="font-serif text-3xl">Style, wrap & ribbon</h2>
              <div>
                <p className="label">Arrangement style</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {STYLES.map((s) => (
                    <button key={s.slug} onClick={() => up("style", s.slug)} className={cn("rounded-2xl border p-4 text-left transition", d.style === s.slug ? "border-ink bg-ink text-cream" : "border-line bg-paper hover:border-ink/40")}>
                      <Icon name={s.slug === "box" ? "gift" : s.slug === "basket" ? "leaf" : "flower"} size={22} />
                      <p className="mt-3 font-semibold">{s.name}</p>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label">Wrapping paper</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  {wraps.map((w) => (
                    <button key={w.id} disabled={!w.available} onClick={() => up("wrapId", w.id)} className={cn("flex items-center gap-3 rounded-2xl border p-3 text-left transition", d.wrapId === w.id ? "border-ink ring-1 ring-ink" : "border-line bg-paper hover:border-ink/40", !w.available && "opacity-40")}>
                      <WrapSwatch kind={wrapKindOf(w.id)} className="h-14 w-14 shrink-0" />
                      <span>
                        <span className="block text-sm font-medium">{w.name}</span>
                        <span className="text-xs text-muted">{w.available ? w.description : "Unavailable"}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="label">Ribbon colour</p>
                <div className="flex flex-wrap gap-3">
                  {ribbons.map((r) => (
                    <button key={r.id} onClick={() => up("ribbonId", r.id)} aria-label={r.name} className={cn("flex items-center gap-1.5 rounded-full border py-1 pl-1.5 pr-4 text-sm transition", d.ribbonId === r.id ? "border-ink bg-paper" : "border-line hover:border-ink/40")}>
                      <RibbonSwatch hex={r.hex} className="h-9 w-9" />
                      {r.name}
                    </button>
                  ))}
                </div>
              </div>
              <Field label="Notes for the florist" hint="Colours, mood, height, anything you have in mind">
                <textarea className="field resize-none" rows={4} value={d.notes} onChange={(e) => up("notes", e.target.value)} placeholder="Soft and airy, mostly pastels, around 50 cm tall…" />
              </Field>
              <div>
                <p className="label">Reference photos (optional, up to 3)</p>
                <div className="flex flex-wrap gap-3">
                  {d.photos.map((p, i) => (
                    <div key={i} className="relative h-24 w-24 overflow-hidden rounded-2xl bg-sand">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p} alt={`Reference ${i + 1}`} className="h-full w-full object-cover" />
                      <button onClick={() => up("photos", d.photos.filter((_, k) => k !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-ink/80 text-cream" aria-label="Remove photo">
                        <Icon name="close" size={12} />
                      </button>
                    </div>
                  ))}
                  {d.photos.length < 3 && (
                    <label className="grid h-24 w-24 cursor-pointer place-items-center rounded-2xl border border-dashed border-line text-muted transition hover:border-ink hover:text-ink">
                      <span className="flex flex-col items-center gap-1 text-xs"><Icon name="camera" /> Add</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          if (file.size > 5 * 1024 * 1024) return toast({ title: "Photo too large", body: "Please use an image under 5 MB.", tone: "error" });
                          const reader = new FileReader();
                          reader.onload = () => up("photos", [...d.photos, String(reader.result)]);
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="space-y-8">
              <h2 className="font-serif text-3xl">When & where</h2>
              <div className="inline-flex rounded-full bg-sand p-1">
                {(["DELIVERY", "PICKUP"] as const).map((f) => (
                  <button key={f} onClick={() => up("fulfilment", f)} className={cn("flex items-center gap-2 rounded-full px-5 py-2 text-sm transition", d.fulfilment === f ? "bg-paper font-medium shadow-sm" : "text-muted")}>
                    <Icon name={f === "DELIVERY" ? "truck" : "home"} size={16} /> {f === "DELIVERY" ? "Delivery" : "Store pickup"}
                  </button>
                ))}
              </div>
              <SchedulePicker date={d.date} slot={d.slot} onDate={(x) => setD((s) => ({ ...s, date: x, slot: "" }))} onSlot={(x) => up("slot", x)} pickup={pickup} />
              <RecipientForm value={d.recipient} onChange={(r) => up("recipient", r)} errors={errors} pickup={pickup} />
              <div className="rounded-3xl border border-line bg-paper p-5">
                <div className="flex items-center justify-between">
                  <p className="label mb-0">Card message</p>
                  <span className="text-xs text-faint">{d.card.length}/{settings.cardMessageLimit}</span>
                </div>
                <textarea className="field mt-3 resize-none font-serif text-lg" rows={3} maxLength={settings.cardMessageLimit} value={d.card} onChange={(e) => up("card", e.target.value)} placeholder="Your message…" />
                <div className="mt-3"><Toggle checked={d.anon} onChange={(v) => up("anon", v)} label="Send anonymously" /></div>
              </div>
            </section>
          )}

          {step === 3 && (
            <section className="space-y-6">
              <h2 className="font-serif text-3xl">Review your request</h2>
              <div className="card divide-y divide-line">
                <div className="p-5">
                  <p className="label">Flowers</p>
                  <ul className="space-y-2">
                    {picked.map((f) => (
                      <li key={f.id} className="flex items-center gap-3 text-sm">
                        <FlowerImage src={f.image} alt="" className="h-10 w-10 rounded-xl" sizes="40px" />
                        <span className="flex-1">{f.name}</span>
                        <span className="font-semibold tabular-nums">× {d.qty[f.id]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="grid gap-4 p-5 text-sm sm:grid-cols-3">
                  <div><p className="label">Style</p>{STYLES.find((s) => s.slug === d.style)?.name}</div>
                  <div><p className="label">Wrap</p>{wraps.find((w) => w.id === d.wrapId)?.name}</div>
                  <div><p className="label">Ribbon</p>{ribbons.find((r) => r.id === d.ribbonId)?.name}</div>
                </div>
                <div className="grid gap-4 p-5 text-sm sm:grid-cols-2">
                  <div>
                    <p className="label">{pickup ? "Pickup" : "Delivery"}</p>
                    {d.date && formatLong(d.date)}
                    <br />
                    <span className="text-muted">{timeSlots.find((t) => t.code === d.slot)?.label} · {timeSlots.find((t) => t.code === d.slot)?.window}</span>
                  </div>
                  <div>
                    <p className="label">{pickup ? "Collected by" : "Recipient"}</p>
                    {d.recipient.name} · {d.recipient.phone}
                    {!pickup && <><br /><span className="text-muted">{d.recipient.line1}, {d.recipient.city}</span></>}
                  </div>
                </div>
                {d.notes && <div className="p-5 text-sm"><p className="label">Notes</p>{d.notes}</div>}
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
                <Icon name="info" size={18} className="mt-0.5 shrink-0" />
                <p>This is a <strong>quotation request</strong>, not an order. We don&apos;t check stock or take payment yet. Our florist will reply with a final price, valid for {settings.quotationValidityHours} hours.</p>
              </div>
              {hydrated && !user && (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-paper p-4 text-sm">
                  <span>Please sign in to send your request — your selection will be kept.</span>
                  <Link href="/login?next=/custom-bouquet" className={buttonClass("outline", "sm")}>Sign in</Link>
                </div>
              )}
            </section>
          )}

          <div className="mt-10 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <Icon name="arrowLeft" size={18} /> Back
            </Button>
            {step < 3 ? (
              <Button size="lg" disabled={!canNext} onClick={next}>
                Continue <Icon name="arrowRight" size={18} />
              </Button>
            ) : (
              <Button size="lg" onClick={submit}>
                <Icon name="sparkle" size={18} /> {user ? "Send quotation request" : "Sign in to send"}
              </Button>
            )}
          </div>
        </div>

        {/* Summary */}
        <aside className="order-first space-y-4 lg:order-none lg:sticky lg:top-24 lg:self-start">
          <BouquetPreview3D
            className="h-[300px] sm:h-[340px]"
            items={picked.map((f) => ({ id: f.id, hex: f.hex, qty: d.qty[f.id], kind: f.kind }))}
            style={d.style}
            wrap={wrapKindOf(d.wrapId)}
            ribbonHex={ribbons.find((r) => r.id === d.ribbonId)?.hex ?? "#f095a8"}
            mode={view === "bouquet" && picked.length ? "bouquet" : "stem"}
            focus={previewFlower ? { id: previewFlower.id, hex: previewFlower.hex, qty: d.qty[previewFlower.id] ?? 0, kind: previewFlower.kind } : null}
            focusName={previewFlower?.name}
            focusMeta={previewFlower ? (d.qty[previewFlower.id] ? `× ${d.qty[previewFlower.id]} in your bouquet` : previewFlower.indicativePrice ? `≈ ${lkr(previewFlower.indicativePrice)} / ${previewFlower.kind === "FILLER" ? "bunch" : "stem"}` : previewFlower.colour) : undefined}
            canBouquet={picked.length > 0}
            onMode={setView}
          />
          <div className="card overflow-hidden">
            <div className="bg-blush-50 p-5">
              <div className="flex items-center justify-between gap-2">
                <p className="eyebrow">Your bouquet</p>
                {picked.length > 0 && (
                  <button type="button" onClick={clearBouquet} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-muted transition hover:bg-paper hover:text-blush-600">
                    <Icon name="trash" size={13} /> Clear all
                  </button>
                )}
              </div>
              <p className="mt-2 font-serif text-3xl">{stems} {stems === 1 ? "stem" : "stems"}</p>
              <p className="text-sm text-muted">{picked.length} {picked.length === 1 ? "variety" : "varieties"} · {STYLES.find((s) => s.slug === d.style)?.name}</p>
            </div>
            <div className="p-5">
              {undo && (
                <div role="status" className="mb-4 flex animate-fade-in items-center justify-between gap-2 rounded-xl bg-ink px-3 py-2 text-xs text-cream">
                  <span>{undo.label}</span>
                  <button type="button" onClick={restore} className="font-semibold underline underline-offset-2 hover:text-blush-200">Undo</button>
                </div>
              )}
              {picked.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">Tap a flower to add it</p>
              ) : (
                <ul className="max-h-36 space-y-2.5 overflow-y-auto">
                  {picked.map((f) => (
                    <li key={f.id} className="flex animate-fade-in items-center gap-3 text-sm">
                      <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: f.hex }} />
                      <span className="flex-1 truncate">{f.name}</span>
                      <span className="tabular-nums text-muted">× {d.qty[f.id]}</span>
                      <button
                        type="button"
                        onClick={() => removeFlower(f.id)}
                        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-faint transition hover:bg-blush-50 hover:text-blush-600"
                        aria-label={`Remove ${f.name}`}
                        title="Remove"
                      >
                        <Icon name="close" size={12} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-5 border-t border-line pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted">Indicative estimate</span>
                  <span className="font-serif text-2xl">{estimate ? lkr(estimate) : "—"}</span>
                </div>
                <p className="mt-2 text-xs text-muted">Not a final price. The florist confirms availability and sends your quotation.</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
