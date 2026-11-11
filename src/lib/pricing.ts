import type { CartLine, Product, ProductVariant } from "./types";
import { addOns, wraps } from "./mock/catalogue";

export const variantPrice = (v: ProductVariant) => v.salePrice ?? v.price;

export function fromPrice(p: Product): number {
  const active = p.variants.filter((v) => v.isActive);
  return Math.min(...active.map(variantPrice));
}

export function linePrice(variant: ProductVariant, wrapId?: string, addOnIds: string[] = []): number {
  const wrap = wraps.find((w) => w.id === wrapId)?.price ?? 0;
  const extras = addOnIds.reduce((s, id) => s + (addOns.find((a) => a.id === id)?.price ?? 0), 0);
  return variantPrice(variant) + wrap + extras;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((s, l) => s + l.unitPrice * l.qty, 0);
}

export const tierLabel: Record<string, string> = {
  STANDARD: "Standard",
  DELUXE: "Deluxe",
  PREMIUM: "Premium",
  LUXURY: "Luxury",
};
