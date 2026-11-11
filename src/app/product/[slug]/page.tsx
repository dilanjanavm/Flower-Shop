import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products } from "@/lib/mock/catalogue";
import { fromPrice } from "@/lib/pricing";
import { ProductView } from "@/components/product/ProductView";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = products.find((x) => x.slug === slug);
  if (!p) return { title: "Bouquet not found" };
  return {
    title: p.name,
    description: `${p.tagline}. ${p.description}`.slice(0, 160),
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: { title: p.name, description: p.tagline, images: [p.images[0]] },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = products.find((p) => p.slug === slug);
  if (!product) notFound();

  // Product JSON-LD (NFR-SEO-01)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.description,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Sithuliya Flora" },
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "LKR",
      lowPrice: fromPrice(product),
      availability: product.isAvailable ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProductView product={product} />
    </>
  );
}
