import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/account", "/checkout", "/order", "/track/"] }],
    sitemap: "https://sithuliyaflora.lk/sitemap.xml",
  };
}
