"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { cn, lkr } from "@/lib/format";
import { fromPrice, linePrice } from "@/lib/pricing";
import { useStore } from "@/lib/store";
import { FlowerImage } from "../ui/FlowerImage";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/bits";

export function ProductCard({ product, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const { wishlist, toggleWishlist, addToCart, hydrated } = useStore();
  const liked = hydrated && wishlist.includes(product.id);
  const std = product.variants.find((v) => v.isActive)!;
  const onSale = product.variants.some((v) => v.salePrice);

  const quickAdd = () => {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      qty: 1,
      unitPrice: linePrice(std, "wrap-kraft", []),
      config: { variantId: std.id, sizeTier: std.sizeTier, wrapId: "wrap-kraft", ribbonId: "rib-blush", addOnIds: [], cardMessage: "", senderName: "", isAnonymous: false },
    });
  };

  return (
    <article className={cn("group relative", className)}>
      <div className="relative overflow-hidden rounded-[1.6rem] bg-sand">
        <Link href={`/product/${product.slug}`} aria-label={product.name} className="block">
          <FlowerImage
            src={product.images[0]}
            alt={product.name}
            priority={priority}
            className="aspect-[4/5]"
            imgClassName="group-hover:scale-[1.06]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          {product.images[1] && (
            <FlowerImage
              src={product.images[1]}
              alt=""
              className="absolute! inset-0 opacity-0 transition-opacity duration-700 group-hover:opacity-100"
              imgClassName="scale-105"
              sizes="(max-width: 640px) 50vw, 25vw"
            />
          )}
        </Link>

        <div className="pointer-events-none absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && <Badge tone="ink">New</Badge>}
          {onSale && <Badge tone="blush">Sale</Badge>}
          {!product.isAvailable && <Badge tone="neutral">Currently unavailable</Badge>}
        </div>

        <button
          onClick={() => toggleWishlist(product.id)}
          aria-label={liked ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={liked}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-paper/85 backdrop-blur transition hover:scale-110"
        >
          <Icon name="heart" size={17} className={cn("transition", liked ? "fill-blush-500 text-blush-500" : "text-ink")} />
        </button>

        {product.isAvailable && (
          <button
            onClick={quickAdd}
            className="absolute bottom-3 right-3 flex h-11 items-center gap-2 overflow-hidden rounded-full bg-ink pl-3.5 pr-3.5 text-cream shadow-lg transition-all duration-500 ease-[var(--ease-out-soft)] hover:bg-ink-soft sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
            aria-label={`Quick add ${product.name} to bag`}
          >
            <Icon name="bag" size={17} />
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-[13px] font-medium transition-all duration-500 group-hover:max-w-24">Quick add</span>
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-1.5 px-1 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-serif text-xl leading-tight">
            <Link href={`/product/${product.slug}`} className="link-underline">{product.name}</Link>
          </h3>
          <p className="mt-1 truncate text-[13px] text-muted">{product.tagline}</p>
        </div>
        <div className="shrink-0 sm:text-right">
          <p className="hidden text-[11px] uppercase tracking-wider text-faint sm:block">from</p>
          <p className="text-sm font-semibold"><span className="text-xs font-normal text-faint sm:hidden">from </span>{lkr(fromPrice(product))}</p>
        </div>
      </div>
    </article>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/5] rounded-[1.6rem]!" />
      <div className="skeleton mt-4 h-5 w-2/3" />
      <div className="skeleton mt-2 h-4 w-1/2" />
    </div>
  );
}
