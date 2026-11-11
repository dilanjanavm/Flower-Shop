"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { products, taxonomies } from "@/lib/mock/catalogue";
import { fromPrice } from "@/lib/pricing";
import { cn, lkr } from "@/lib/format";
import type { Product, TaxonomyItem } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { Icon } from "../ui/Icon";
import { EmptyState } from "../ui/bits";
import { Button } from "../ui/Button";

const PAGE_SIZE = 24; // FR-CUST-01.1
const sorts = [
  { key: "popular", label: "Most popular" },
  { key: "newest", label: "Newest" },
  { key: "price_asc", label: "Price: low to high" },
  { key: "price_desc", label: "Price: high to low" },
];
const PRICE_MAX = 40000;

type GroupKey = "occasion" | "flower" | "style" | "colour";
const groups: { key: GroupKey; label: string; items: TaxonomyItem[]; field: (p: Product) => string[] }[] = [
  { key: "occasion", label: "Occasion", items: taxonomies.occasions, field: (p) => p.occasions },
  { key: "flower", label: "Flower type", items: taxonomies.flowerTypes, field: (p) => p.flowerTypes },
  { key: "style", label: "Arrangement style", items: taxonomies.styles, field: (p) => [p.style] },
  { key: "colour", label: "Colour", items: taxonomies.colours, field: (p) => p.colours },
];

export function ShopView() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [drawer, setDrawer] = useState(false);

  const selected = (k: GroupKey) => sp.getAll(k);
  const q = sp.get("q") ?? "";
  const sort = sp.get("sort") ?? "popular";
  const minPrice = Number(sp.get("minPrice") ?? 0);
  const maxPrice = Number(sp.get("maxPrice") ?? PRICE_MAX);
  const page = Math.max(1, Number(sp.get("page") ?? 1));

  const update = (fn: (p: URLSearchParams) => void) => {
    const next = new URLSearchParams(sp.toString());
    fn(next);
    next.delete("page");
    router.replace(`${pathname}?${next.toString()}`, { scroll: false });
  };
  const toggle = (k: GroupKey, slug: string) =>
    update((p) => {
      const cur = p.getAll(k);
      p.delete(k);
      (cur.includes(slug) ? cur.filter((x) => x !== slug) : [...cur, slug]).forEach((v) => p.append(k, v));
    });

  // AND across groups, OR within a group (FR-CUST-01.1)
  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    let list = products.filter((p) => {
      for (const g of groups) {
        const sel = sp.getAll(g.key);
        if (sel.length && !g.field(p).some((v) => sel.includes(v))) return false;
      }
      const price = fromPrice(p);
      if (price < minPrice || price > maxPrice) return false;
      if (term) {
        const hay = `${p.name} ${p.tagline} ${p.description} ${p.flowerTypes.join(" ")} ${p.occasions.join(" ")}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "newest") return b.createdAt.localeCompare(a.createdAt);
      if (sort === "price_asc") return fromPrice(a) - fromPrice(b);
      if (sort === "price_desc") return fromPrice(b) - fromPrice(a);
      return b.popularity - a.popularity;
    });
    // unavailable products last
    return list.sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
  }, [sp, q, sort, minPrice, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const pageItems = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const activeChips = groups.flatMap((g) => selected(g.key).map((slug) => ({ g: g.key, slug, name: g.items.find((i) => i.slug === slug)?.name ?? slug })));
  const occasionTitle = selected("occasion").length === 1 ? taxonomies.occasions.find((o) => o.slug === selected("occasion")[0])?.name : null;

  const Filters = (
    <div className="space-y-8">
      {groups.map((g) => (
        <fieldset key={g.key}>
          <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">{g.label}</legend>
          {g.key === "colour" ? (
            <div className="flex flex-wrap gap-2.5">
              {g.items.map((c) => {
                const on = selected("colour").includes(c.slug);
                return (
                  <button
                    key={c.slug}
                    onClick={() => toggle("colour", c.slug)}
                    title={c.name}
                    aria-pressed={on}
                    className={cn("flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3 text-xs transition", on ? "border-ink bg-ink text-cream" : "border-line bg-paper hover:border-ink/40")}
                  >
                    <span className="h-5 w-5 rounded-full ring-1 ring-black/10" style={{ background: c.hex }} />
                    {c.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {g.items.map((it) => {
                const on = selected(g.key).includes(it.slug);
                return (
                  <button
                    key={it.slug}
                    onClick={() => toggle(g.key, it.slug)}
                    aria-pressed={on}
                    className={cn("rounded-full border px-3.5 py-2 text-[13px] transition-all duration-200", on ? "border-ink bg-ink text-cream" : "border-line bg-paper text-ink-soft hover:border-ink/40 hover:text-ink")}
                  >
                    {it.name}
                  </button>
                );
              })}
            </div>
          )}
        </fieldset>
      ))}
      <fieldset>
        <legend className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted">Price</legend>
        <div className="flex items-center justify-between text-sm">
          <span>{lkr(minPrice)}</span>
          <span>{maxPrice >= PRICE_MAX ? `${lkr(PRICE_MAX)}+` : lkr(maxPrice)}</span>
        </div>
        <input
          type="range"
          min={2000}
          max={PRICE_MAX}
          step={500}
          value={maxPrice}
          onChange={(e) => update((p) => p.set("maxPrice", e.target.value))}
          className="mt-3 w-full accent-[var(--color-ink)]"
          aria-label="Maximum price"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            [0, 7000, "Under Rs 7,000"],
            [7000, 12000, "Rs 7,000 – 12,000"],
            [12000, PRICE_MAX, "Rs 12,000+"],
          ].map(([a, b, label]) => (
            <button
              key={String(label)}
              onClick={() =>
                update((p) => {
                  p.set("minPrice", String(a));
                  p.set("maxPrice", String(b));
                })
              }
              className={cn("rounded-full border px-3 py-1.5 text-xs transition", minPrice === a && maxPrice === b ? "border-ink bg-ink text-cream" : "border-line hover:border-ink/40")}
            >
              {label}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );

  return (
    <div className="container-x pb-10 pt-10">
      <div className="mb-10">
        <p className="eyebrow">{q ? "Search" : "Shop"}</p>
        <h1 className="h-display mt-3 text-5xl sm:text-6xl">{q ? <>Results for “{q}”</> : occasionTitle ?? "All bouquets"}</h1>
        <p className="mt-3 text-muted">Hand-tied to order. Every bouquet needs at least 2 days&apos; notice.</p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[270px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28">{Filters}</div>
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button onClick={() => setDrawer(true)} className="flex h-10 items-center gap-2 rounded-full border border-line bg-paper px-4 text-sm lg:hidden">
                <Icon name="filter" size={16} /> Filters {activeChips.length > 0 && <span className="grid h-5 w-5 place-items-center rounded-full bg-ink text-[10px] text-cream">{activeChips.length}</span>}
              </button>
              <p className="text-sm text-muted">
                <span className="font-semibold text-ink">{results.length}</span> {results.length === 1 ? "bouquet" : "bouquets"}
              </p>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-muted">Sort</span>
              <select value={sort} onChange={(e) => update((p) => p.set("sort", e.target.value))} className="h-10 rounded-full border border-line bg-paper px-4 pr-8 text-sm outline-none focus:border-ink/40">
                {sorts.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>

          {(activeChips.length > 0 || q || minPrice > 0 || maxPrice < PRICE_MAX) && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {q && (
                <button onClick={() => update((p) => p.delete("q"))} className="flex items-center gap-1.5 rounded-full bg-blush-100 px-3 py-1.5 text-xs font-medium text-blush-700">
                  “{q}” <Icon name="close" size={12} />
                </button>
              )}
              {activeChips.map((c) => (
                <button key={c.g + c.slug} onClick={() => toggle(c.g, c.slug)} className="flex animate-pop items-center gap-1.5 rounded-full bg-blush-100 px-3 py-1.5 text-xs font-medium text-blush-700">
                  {c.name} <Icon name="close" size={12} />
                </button>
              ))}
              <button onClick={() => router.replace(pathname, { scroll: false })} className="text-xs font-medium text-muted underline-offset-4 hover:text-ink hover:underline">
                Clear all
              </button>
            </div>
          )}

          {pageItems.length === 0 ? (
            <EmptyState
              icon="search"
              title="No bouquets match"
              body="Try removing a filter — or tell us exactly what you want with a custom bouquet."
              action={<Button onClick={() => router.replace(pathname)}>Clear filters</Button>}
            />
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 xl:grid-cols-3">
              {pageItems.map((p, i) => (
                <div key={p.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}>
                  <ProductCard product={p} priority={i < 3} />
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-12 flex justify-center gap-2" aria-label="Pagination">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  onClick={() => {
                    const next = new URLSearchParams(sp.toString());
                    next.set("page", String(n));
                    router.replace(`${pathname}?${next}`);
                  }}
                  className={cn("h-10 w-10 rounded-full text-sm", n === page ? "bg-ink text-cream" : "hover:bg-sand")}
                >
                  {n}
                </button>
              ))}
            </nav>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      <div className={cn("fixed inset-0 z-[66] lg:hidden", drawer ? "visible" : "invisible")}>
        <button className={cn("absolute inset-0 bg-ink/40 transition-opacity", drawer ? "opacity-100" : "opacity-0")} onClick={() => setDrawer(false)} aria-label="Close filters" />
        <div className={cn("absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-[2rem] bg-cream p-6 transition-transform duration-500 ease-[var(--ease-out-soft)]", drawer ? "translate-y-0" : "translate-y-full")}>
          <div className="mb-6 flex items-center justify-between">
            <p className="font-serif text-2xl">Filters</p>
            <button onClick={() => setDrawer(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          {Filters}
          <Button className="mt-8 w-full" onClick={() => setDrawer(false)}>
            Show {results.length} results
          </Button>
        </div>
      </div>
    </div>
  );
}
