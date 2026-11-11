import type { OrderStatus, PaymentStatus, QuoteStatus } from "./types";

export const orderStatusLabel: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "Awaiting payment",
  PAYMENT_REVIEW: "Verifying payment",
  CONFIRMED: "Confirmed",
  PREPARING: "Being prepared",
  READY_FOR_DISPATCH: "Ready for dispatch",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  DELIVERY_FAILED: "Delivery attempt failed",
  CANCELLED: "Cancelled",
};

export const orderStatusTone: Record<OrderStatus, "neutral" | "blush" | "sage" | "ink" | "amber" | "red"> = {
  PENDING_PAYMENT: "amber",
  PAYMENT_REVIEW: "amber",
  CONFIRMED: "blush",
  PREPARING: "blush",
  READY_FOR_DISPATCH: "blush",
  OUT_FOR_DELIVERY: "ink",
  DELIVERED: "sage",
  DELIVERY_FAILED: "red",
  CANCELLED: "neutral",
};

export const paymentStatusLabel: Record<PaymentStatus, string> = {
  UNPAID: "Unpaid",
  PENDING_VERIFICATION: "Slip under review",
  PAID: "Paid",
  REJECTED: "Slip rejected",
  REFUNDED: "Refunded",
  PARTIALLY_REFUNDED: "Partially refunded",
};

export const quoteStatusLabel: Record<QuoteStatus, string> = {
  REQUESTED: "Quotation pending",
  QUOTED: "Quotation ready",
  ACCEPTED: "Accepted",
  DECLINED_BY_SHOP: "Declined by shop",
  DECLINED_BY_CUSTOMER: "You declined",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

export const quoteStatusTone: Record<QuoteStatus, "neutral" | "blush" | "sage" | "ink" | "amber" | "red"> = {
  REQUESTED: "amber",
  QUOTED: "blush",
  ACCEPTED: "sage",
  DECLINED_BY_SHOP: "red",
  DECLINED_BY_CUSTOMER: "neutral",
  EXPIRED: "neutral",
  CANCELLED: "neutral",
};

/** Customer tracker steps (FR-CUST-06.1). */
export const trackerSteps = [
  { key: "PLACED", label: "Order placed", match: ["PENDING_PAYMENT", "PAYMENT_REVIEW"] },
  { key: "PAID", label: "Payment verified", match: ["CONFIRMED"] },
  { key: "PREPARING", label: "Preparing", match: ["PREPARING", "READY_FOR_DISPATCH"] },
  { key: "OUT", label: "Out for delivery", match: ["OUT_FOR_DELIVERY", "DELIVERY_FAILED"] },
  { key: "DELIVERED", label: "Delivered", match: ["DELIVERED"] },
] as const;

export function trackerIndex(status: OrderStatus): number {
  const i = trackerSteps.findIndex((s) => (s.match as readonly string[]).includes(status));
  return i < 0 ? 0 : i;
}
