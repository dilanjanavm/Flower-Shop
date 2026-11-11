import type { MetadataRoute } from "next";
import { products } from "@/lib/mock/catalogue";

const base = "https://sithuliyaflora.lk";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = ["", "/shop", "/custom-bouquet", "/about", "/delivery", "/contact", "/terms", "/privacy"];
  return [
    ...pages.map((p) => ({ url: `${base}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 })),
    ...products.map((p) => ({ url: `${base}/product/${p.slug}`, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
}
