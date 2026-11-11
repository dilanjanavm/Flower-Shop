"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { products, taxonomies } from "@/lib/mock/catalogue";
import { IMG } from "@/lib/mock/images";
import { ProductCard } from "../product/ProductCard";
import { FlowerImage } from "../ui/FlowerImage";
import { Icon, type IconName } from "../ui/Icon";
import { Reveal } from "../ui/Reveal";
import { ButtonLink } from "../ui/Button";
import { SectionHeading, Stars } from "../ui/bits";
import { cn } from "@/lib/format";
import { useStore } from "@/lib/store";

/* ───────── Promise strip ───────── */
const promises: { icon: IconName; title: string; body: string }[] = [
  { icon: "calendar", title: "Book 2 days ahead", body: "Pick your date and a delivery slot" },
  { icon: "leaf", title: "Fresh every order", body: "Hand-tied the morning it goes out" },
  { icon: "bank", title: "Bank deposit", body: "Upload your slip, we verify fast" },
  { icon: "truck", title: "Live tracking", body: "From our studio to their door" },
];

export function PromiseStrip() {
  return (
    <section className="border-y border-line bg-paper">
      <div className="container-x grid grid-cols-2 gap-y-6 py-8 lg:grid-cols-4">
        {promises.map((p, i) => (
          <Reveal key={p.title} delay={i * 80} className="flex items-center gap-4 px-2">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blush-50 text-blush-600">
              <Icon name={p.icon} size={22} />
            </span>
            <div>
              <p className="text-sm font-semibold">{p.title}</p>
              <p className="text-[13px] text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── Shop by occasion ───────── */
export function Occasions() {
  return (
    <section className="container-x pt-24">
      <SectionHeading
        eyebrow="Shop by occasion"
        title={<>For every <em className="text-blush-600">moment</em> worth marking</>}
        action={<Link href="/shop" className="link-underline text-sm font-medium">View all bouquets</Link>}
      />
      <div className="no-scrollbar -mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
        {taxonomies.occasions.map((o, i) => (
          <Reveal key={o.slug} delay={i * 60} className="w-40 shrink-0 snap-start sm:w-auto">
            <Link href={`/shop?occasion=${o.slug}`} className="group block">
              <div className="relative overflow-hidden rounded-[1.4rem]">
                <FlowerImage src={o.image ?? ""} alt={o.name} className="aspect-[3/4]" imgClassName="group-hover:scale-110" sizes="200px" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent opacity-80 transition-opacity group-hover:opacity-100" />
                <span className="absolute bottom-3 right-3 grid h-8 w-8 translate-y-2 place-items-center rounded-full bg-cream text-ink opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                  <Icon name="arrowUpRight" size={16} />
                </span>
                <p className="absolute bottom-3 left-3 right-12 font-serif text-lg leading-tight text-cream">{o.name}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────── Best sellers with tabs ───────── */
const tabs = [
  { key: "all", label: "Best sellers" },
  { key: "new", label: "New in" },
  { key: "roses", label: "Roses" },
  { key: "box", label: "Boxes & baskets" },
];

export function BestSellers() {
  const [tab, setTab] = useState("all");
  const list = products
    .filter((p) => p.isAvailable)
    .filter((p) =>
      tab === "all" ? p.isFeatured : tab === "new" ? p.isNew || p.createdAt > "2026-09-30" : tab === "roses" ? p.flowerTypes.includes("roses") : p.style === "box" || p.style === "basket",
    )
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 8);

  return (
    <section className="container-x pt-24">
      <SectionHeading eyebrow="This month" title="Our best sellers" action={<Link href="/shop?sort=popular" className="link-underline text-sm font-medium">Shop all</Link>} />
      <div className="no-scrollbar -mx-5 mb-8 flex gap-2 overflow-x-auto px-5 sm:mx-0 sm:px-0" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={cn("shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-300", tab === t.key ? "bg-ink text-cream" : "bg-sand text-ink-soft hover:bg-line")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div key={tab} className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {list.map((p, i) => (
          <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${i * 70}ms` }}>
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── Stats band with count-up ───────── */
function CountUp({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const run = () => {
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1600);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    if (typeof IntersectionObserver === "undefined") {
      setN(to);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        run();
        io.disconnect();
      }
    });
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [to]);
  return (
    <span ref={ref} className="tabular-nums">
      {n.toLocaleString()}
      {suffix}
    </span>
  );
}

export function StatsBand() {
  const stats = [
    { to: 3200, suffix: "+", label: "Bouquets delivered" },
    { to: 1800, suffix: "+", label: "Happy customers" },
    { to: 39, suffix: "", label: "Delivery areas" },
    { to: 12, suffix: "", label: "Years arranging" },
  ];
  return (
    <section className="mt-24 bg-ink text-cream">
      <div className="container-x grid grid-cols-2 gap-y-10 py-16 text-center lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <p className="font-serif text-5xl text-cream sm:text-6xl">
              <CountUp to={s.to} suffix={s.suffix} />
            </p>
            <p className="mt-2 text-sm text-cream/60">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ───────── Custom bouquet promo ───────── */
const steps = [
  { n: "01", t: "Pick your flowers", b: "Choose stems and quantities from our live flower gallery." },
  { n: "02", t: "We send a quote", b: "Our florist checks availability and replies with a price." },
  { n: "03", t: "Accept & pay", b: "Accept the quotation and pay by bank deposit." },
  { n: "04", t: "Delivered fresh", b: "Hand-tied on the day and delivered in your slot." },
];

export function CustomPromo() {
  return (
    <section className="container-x pt-24">
      <div className="grid items-center gap-12 overflow-hidden rounded-[2.5rem] bg-blush-50 p-6 sm:p-10 lg:grid-cols-2 lg:p-14">
        <Reveal className="relative">
          <div className="grid grid-cols-2 gap-4">
            <FlowerImage src={IMG.pinkWhiteRoseBouquet} alt="Custom pink and white rose bouquet" className="aspect-[3/4] rounded-[2rem]" sizes="300px" />
            <div className="space-y-4 pt-10">
              <FlowerImage src={IMG.flowerBox} alt="Flowers arranged in a wooden box" className="aspect-square rounded-[2rem]" sizes="300px" />
              <FlowerImage src={IMG.tulipsPaper} alt="Tulips wrapped in kraft paper" className="aspect-[4/3] rounded-[2rem]" sizes="300px" />
            </div>
          </div>
          <div className="absolute -bottom-3 left-6 flex animate-float items-center gap-3 rounded-2xl bg-paper px-4 py-3 shadow-[var(--shadow-lift)]">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-blush-400 text-ink"><Icon name="sparkle" size={18} /></span>
            <div>
              <p className="text-xs text-muted">Typical reply</p>
              <p className="text-sm font-semibold">Within 4 hours</p>
            </div>
          </div>
        </Reveal>
        <div>
          <p className="eyebrow">Custom bouquet</p>
          <h2 className="h-display mt-4 text-4xl sm:text-5xl">Design a bouquet that&apos;s entirely <em className="text-blush-600">theirs</em></h2>
          <p className="mt-5 max-w-md text-muted">Pick each flower from our gallery, choose the wrap and ribbon, and send it to us. We&apos;ll reply with a quotation — no surprises at checkout.</p>
          <ol className="mt-8 grid gap-5 sm:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 90} className="rounded-2xl bg-paper/70 p-4">
                <span className="font-serif text-2xl text-blush-500">{s.n}</span>
                <p className="mt-1 font-semibold">{s.t}</p>
                <p className="mt-1 text-sm text-muted">{s.b}</p>
              </Reveal>
            ))}
          </ol>
          <ButtonLink href="/custom-bouquet" size="lg" className="mt-8">
            Start designing <Icon name="arrowRight" size={18} className="transition-transform group-hover:translate-x-1" />
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}

/* ───────── Testimonials ───────── */
const testimonials = [
  { name: "Nadeesha P.", where: "Colombo 05", body: "The bouquet arrived right in the morning slot and looked even better than the photos. My mother was in tears — happy ones!", img: IMG.roseBabysBreath },
  { name: "Kasun W.", where: "Nugegoda", body: "Paying by bank transfer was easy and the slip was approved within the hour. The tracking link made the surprise stress-free.", img: IMG.redRoses1 },
  { name: "Ishara D.", where: "Rajagiriya", body: "I designed my own bouquet for my sister's graduation. The quote came back the same afternoon with a lovely note from the florist.", img: IMG.pinkWhiteRoseBouquet },
];

export function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setI((x) => (x + 1) % testimonials.length), 6000);
    return () => window.clearInterval(id);
  }, []);
  const t = testimonials[i];
  return (
    <section className="container-x pt-24">
      <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <p className="eyebrow">Kind words</p>
          <h2 className="h-display mt-4 text-4xl sm:text-5xl">Loved across Colombo</h2>
          <div className="mt-5 flex items-center gap-3">
            <Stars value={5} size={18} />
            <span className="text-sm text-muted">4.9 average from 1,200+ verified reviews</span>
          </div>
          <div className="mt-8 flex gap-2">
            {testimonials.map((_, k) => (
              <button key={k} onClick={() => setI(k)} aria-label={`Show review ${k + 1}`} className={cn("h-2 rounded-full transition-all duration-500", k === i ? "w-10 bg-ink" : "w-2 bg-line hover:bg-faint")} />
            ))}
          </div>
        </div>
        <div key={i} className="card grid animate-fade-up gap-6 p-6 sm:grid-cols-[160px_1fr] sm:p-8">
          <FlowerImage src={t.img} alt="" className="aspect-square rounded-2xl sm:aspect-[3/4]" sizes="160px" />
          <div className="flex flex-col">
            <Icon name="quote" size={28} className="text-blush-400" />
            <p className="mt-4 font-serif text-2xl leading-snug">“{t.body}”</p>
            <p className="mt-auto pt-6 text-sm">
              <span className="font-semibold">{t.name}</span> <span className="text-muted">· {t.where}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Reminder CTA ───────── */
export function ReminderCta() {
  const { user } = useStore();
  return (
    <section className="container-x pt-24">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink px-6 py-14 text-center text-cream sm:px-14">
        <div aria-hidden className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-blush-400/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-24 -right-10 h-80 w-80 rounded-full bg-blush-500/20 blur-3xl" />
        <p className="eyebrow relative text-blush-300!">Occasion reminder vault</p>
        <h2 className="h-display relative mx-auto mt-4 max-w-2xl text-4xl text-cream! sm:text-5xl">Never miss a birthday or anniversary again</h2>
        <p className="relative mx-auto mt-4 max-w-lg text-cream/65">Save the dates that matter. We&apos;ll remind you 7 and 2 days before — with a 10% code to make it easy.</p>
        <div className="relative mt-8 flex justify-center">
          <ButtonLink href={user ? "/account/reminders" : "/register"} variant="blush" size="lg">
            <Icon name="bell" size={18} /> Save your dates
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
