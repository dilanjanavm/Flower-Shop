/**
 * Shared domain types. Shapes follow the SRS data design (section 7) and the
 * API conventions (section 8) so the mock service can later be swapped for the
 * NestJS API without touching components.
 */

export type SizeTier = "STANDARD" | "DELUXE" | "PREMIUM" | "LUXURY";

export interface TaxonomyItem {
  slug: string;
  name: string;
  image?: string;
  hex?: string;
}

export interface Taxonomies {
  occasions: TaxonomyItem[];
  flowerTypes: TaxonomyItem[];
  styles: TaxonomyItem[];
  colours: TaxonomyItem[];
}

export interface ProductVariant {
  id: string;
  sizeTier: SizeTier;
  price: number;
  salePrice?: number;
  stemCount: number;
  isActive: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  body: string;
  date: string; // ISO date
  verified: boolean;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  careTips: string[];
  images: string[];
  occasions: string[];
  flowerTypes: string[];
  style: string;
  colours: string[];
  variants: ProductVariant[];
  isAvailable: boolean;
  isFeatured: boolean;
  isNew?: boolean;
  popularity: number;
  createdAt: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
}

export interface WrapOption {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  swatch: string;
}

export interface RibbonOption {
  id: string;
  name: string;
  hex: string;
}

export interface AddOn {
  id: string;
  name: string;
  price: number;
  image: string;
  available: boolean;
}

export interface GalleryFlower {
  id: string;
  name: string;
  colour: string;
  hex: string;
  image: string;
  indicativePrice?: number; // per stem, optional (SRS OI-11)
  kind: "FLOWER" | "FILLER";
}

export type SlotCode = "MORNING" | "AFTERNOON" | "EVENING" | "MIDNIGHT";

export interface TimeSlot {
  code: SlotCode;
  label: string;
  window: string;
  surcharge: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  fee: number;
  freeOver?: number;
}

export interface CartLineConfig {
  variantId: string;
  sizeTier: SizeTier;
  wrapId?: string;
  ribbonId?: string;
  addOnIds: string[];
  cardMessage: string;
  senderName: string;
  isAnonymous: boolean;
}

export interface CartLine {
  id: string;
  productId: string;
  slug: string;
  name: string;
  image: string;
  config: CartLineConfig;
  qty: number;
  unitPrice: number; // snapshot incl. wrap + add-ons
}

export type OrderStatus =
  | "PENDING_PAYMENT"
  | "PAYMENT_REVIEW"
  | "CONFIRMED"
  | "PREPARING"
  | "READY_FOR_DISPATCH"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "DELIVERY_FAILED"
  | "CANCELLED";

export type PaymentStatus =
  | "UNPAID"
  | "PENDING_VERIFICATION"
  | "PAID"
  | "REJECTED"
  | "REFUNDED"
  | "PARTIALLY_REFUNDED";

export interface Recipient {
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  landmark?: string;
  instructions?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  image: string;
  sizeTier?: SizeTier;
  qty: number;
  unitPrice: number;
  detail: string;
  isCustom: boolean;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string; // ISO timestamp
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  trackingToken: string;
  orderType: "STANDARD" | "CUSTOM";
  fulfilment: "DELIVERY" | "PICKUP";
  deliveryDate: string; // YYYY-MM-DD
  timeSlot: SlotCode;
  recipient: Recipient;
  isAnonymousSender: boolean;
  cardMessage?: string;
  senderName?: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  surcharge: number;
  total: number;
  couponCode?: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentDueAt: string;
  slipFileName?: string;
  slipRejectReason?: string;
  history: StatusEvent[];
  bouquetPhoto?: string;
  podPhoto?: string;
  createdAt: string;
  reviewed?: boolean;
}

export type QuoteStatus =
  | "REQUESTED"
  | "QUOTED"
  | "ACCEPTED"
  | "DECLINED_BY_SHOP"
  | "DECLINED_BY_CUSTOMER"
  | "EXPIRED"
  | "CANCELLED";

export interface QuoteItem {
  flowerId: string;
  name: string;
  image: string;
  qty: number;
  unitPrice?: number; // set by owner
}

export interface Quotation {
  id: string;
  requestNumber: string;
  status: QuoteStatus;
  items: QuoteItem[];
  style: string;
  wrapId: string;
  ribbonId: string;
  notes: string;
  referencePhotos: string[];
  fulfilment: "DELIVERY" | "PICKUP";
  deliveryDate: string;
  timeSlot: SlotCode;
  recipient: Recipient;
  cardMessage: string;
  isAnonymousSender: boolean;
  estimate?: number;
  itemsPrice?: number;
  wrappingPrice?: number;
  deliveryFee?: number;
  discount?: number;
  quotedTotal?: number;
  quoteNote?: string;
  validUntil?: string;
  declineReason?: string;
  orderNumber?: string;
  createdAt: string;
}

export interface Address extends Recipient {
  id: string;
  label: string;
  isDefault: boolean;
}

export interface Reminder {
  id: string;
  recipientName: string;
  occasion: string;
  date: string; // YYYY-MM-DD
  repeatYearly: boolean;
}

export interface Customer {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  isVerified: boolean;
  loyaltyPoints: number;
  prefs: { sms: boolean; email: boolean; whatsapp: boolean; marketing: boolean };
}

export interface ShopSettings {
  leadTimeDays: number;
  paymentWindowHours: number;
  quotationValidityHours: number;
  cardMessageLimit: number;
  bank: { bank: string; branch: string; accountName: string; accountNumber: string };
  shop: { phone: string; whatsapp: string; email: string; address: string; hours: string };
  pointsValue: number; // LKR per point
}

export interface Coupon {
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minSpend: number;
  maxDiscount?: number;
  description: string;
}
