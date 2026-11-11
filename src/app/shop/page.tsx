import type { Metadata } from "next";
import { Suspense } from "react";
import { ShopView } from "@/components/product/ShopView";
import { ProductCardSkeleton } from "@/components/product/ProductCard";

export const metadata: Metadata = {
  title: "Shop bouquets",
  description: "Browse hand-tied bouquets, boxes, baskets and vase arrangements by occasion, flower, style, colour and price.",
};

function ShopFallback() {
  return (
    <div className="container-x pt-10">
      <div className="skeleton h-14 w-72" />
      <div className="mt-14 grid grid-cols-2 gap-6 xl:grid-cols-3 lg:ml-[310px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<ShopFallback />}>
      <ShopView />
    </Suspense>
  );
}
