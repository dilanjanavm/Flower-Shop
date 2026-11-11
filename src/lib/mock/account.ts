import type { Address, Customer, Order, Quotation, Reminder } from "../types";
import { addDays, todayISO } from "../dates";
import { IMG } from "./images";

export const demoCustomer: Customer = {
  id: "u_demo",
  fullName: "Nadeesha Perera",
  email: "nadeesha@example.lk",
  phone: "+94771234567",
  isVerified: true,
  loyaltyPoints: 420,
  prefs: { sms: true, email: true, whatsapp: true, marketing: false },
};

export const seedAddresses: Address[] = [
  {
    id: "addr1", label: "Home", isDefault: true, name: "Nadeesha Perera", phone: "+94771234567",
    line1: "18/2 Lauries Road", city: "Colombo 04", landmark: "Opposite the post office",
  },
  {
    id: "addr2", label: "Parents' House", isDefault: false, name: "Mrs. Kamala Perera", phone: "+94712223344",
    line1: "55 Temple Road", city: "Nugegoda", landmark: "Near Jubilee Post junction", instructions: "Call before arriving",
  },
  {
    id: "addr3", label: "Partner's Office", isDefault: false, name: "Dinuka Silva", phone: "+94765554433",
    line1: "Level 9, Trace Tower", city: "Colombo 10", landmark: "Main reception desk",
  },
];

const ts = (dateISO: string, hh: number, mm = 0) => {
  // Colombo is UTC+05:30 — store as UTC.
  const d = new Date(`${dateISO}T00:00:00Z`);
  d.setUTCMinutes(hh * 60 + mm - 330);
  return d.toISOString();
};

/** Orders are built relative to today so the demo stays consistent on any day. */
export function buildSeedOrders(): Order[] {
  const t = todayISO();
  const yymmdd = (iso: string) => iso.slice(2).replace(/-/g, "");
  const delivered = addDays(t, -6);
  const preparingCreated = addDays(t, -2);
  return [
    {
      id: "o1", orderNumber: `SF-${yymmdd(addDays(delivered, -3))}-00031`, trackingToken: "tk-8f2a91c4",
      orderType: "STANDARD", fulfilment: "DELIVERY", deliveryDate: delivered, timeSlot: "MORNING",
      recipient: { name: "Mrs. Kamala Perera", phone: "+94712223344", line1: "55 Temple Road", city: "Nugegoda", landmark: "Near Jubilee Post junction" },
      isAnonymousSender: false, cardMessage: "Happy birthday Amma! With all my love.", senderName: "Nadee",
      items: [{ id: "oi1", name: "Blush Whisper", image: IMG.roseBabysBreath, sizeTier: "DELUXE", qty: 1, unitPrice: 9500, detail: "Deluxe · Frosted wrap · Blush ribbon", isCustom: false }],
      subtotal: 9500, discount: 0, deliveryFee: 750, surcharge: 0, total: 10250,
      orderStatus: "DELIVERED", paymentStatus: "PAID", paymentDueAt: ts(addDays(delivered, -2), 10),
      history: [
        { status: "PENDING_PAYMENT", at: ts(addDays(delivered, -3), 10, 12) },
        { status: "PAYMENT_REVIEW", at: ts(addDays(delivered, -3), 11, 2) },
        { status: "CONFIRMED", at: ts(addDays(delivered, -3), 11, 40) },
        { status: "PREPARING", at: ts(delivered, 7, 10) },
        { status: "READY_FOR_DISPATCH", at: ts(delivered, 8, 25) },
        { status: "OUT_FOR_DELIVERY", at: ts(delivered, 9, 5) },
        { status: "DELIVERED", at: ts(delivered, 10, 18), note: "Handed to recipient" },
      ],
      bouquetPhoto: IMG.roseBabysBreath, podPhoto: IMG.womanBouquet, createdAt: ts(addDays(delivered, -3), 10, 12),
    },
    {
      id: "o2", orderNumber: `SF-${yymmdd(preparingCreated)}-00047`, trackingToken: "tk-3c77e0b2",
      orderType: "STANDARD", fulfilment: "DELIVERY", deliveryDate: t, timeSlot: "EVENING",
      recipient: { name: "Dinuka Silva", phone: "+94765554433", line1: "Level 9, Trace Tower", city: "Colombo 10", landmark: "Main reception desk" },
      isAnonymousSender: true, cardMessage: "Guess who? Happy anniversary ❤",
      items: [
        { id: "oi2", name: "Crimson Romance", image: IMG.redRoses1, sizeTier: "PREMIUM", qty: 1, unitPrice: 14250, detail: "Premium · Kraft wrap · Crimson ribbon", isCustom: false },
        { id: "oi3", name: "Belgian chocolates (12 pcs)", image: IMG.rosePetals, qty: 1, unitPrice: 2400, detail: "Add-on", isCustom: false },
      ],
      subtotal: 16650, discount: 1665, deliveryFee: 500, surcharge: 0, total: 15485, couponCode: "LOVE10",
      orderStatus: "PREPARING", paymentStatus: "PAID", paymentDueAt: ts(addDays(preparingCreated, 1), 9),
      history: [
        { status: "PENDING_PAYMENT", at: ts(preparingCreated, 9, 0) },
        { status: "PAYMENT_REVIEW", at: ts(preparingCreated, 9, 45) },
        { status: "CONFIRMED", at: ts(preparingCreated, 10, 30) },
        { status: "PREPARING", at: ts(t, 13, 10) },
      ],
      createdAt: ts(preparingCreated, 9, 0),
    },
  ];
}

export function buildSeedQuotations(): Quotation[] {
  const t = todayISO();
  const now = new Date();
  return [
    {
      id: "q1", requestNumber: `QR-${t.slice(2).replace(/-/g, "")}-0012`, status: "QUOTED",
      items: [
        { flowerId: "gf-pink-rose", name: "Pink Rose", image: IMG.pinkRosesClose, qty: 15, unitPrice: 380 },
        { flowerId: "gf-white-tulip", name: "White Tulip", image: IMG.whiteTulips, qty: 10, unitPrice: 450 },
        { flowerId: "gf-eucalyptus", name: "Eucalyptus", image: IMG.whiteBeige, qty: 5, unitPrice: 180 },
      ],
      style: "hand-tied", wrapId: "wrap-frosted", ribbonId: "rib-ivory",
      notes: "Soft, airy look please — like the reference photo. For my sister's graduation.",
      referencePhotos: [IMG.pinkWhiteRoseBouquet], fulfilment: "DELIVERY", deliveryDate: addDays(t, 4), timeSlot: "AFTERNOON",
      recipient: { name: "Sanduni Perera", phone: "+94778889900", line1: "12 Park Avenue", city: "Colombo 05" },
      cardMessage: "So proud of you, graduate! 🎓", isAnonymousSender: false,
      estimate: 11100, itemsPrice: 11100, wrappingPrice: 450, deliveryFee: 500, discount: 550, quotedTotal: 11500,
      quoteNote: "Lovely choice! We've added a little extra eucalyptus at no cost. White tulips are in stock this week.",
      validUntil: new Date(now.getTime() + 19 * 3_600_000).toISOString(),
      createdAt: new Date(now.getTime() - 5 * 3_600_000).toISOString(),
    },
    {
      id: "q2", requestNumber: `QR-${t.slice(2).replace(/-/g, "")}-0015`, status: "REQUESTED",
      items: [
        { flowerId: "gf-sunflower", name: "Sunflower", image: IMG.sunflowerBasket, qty: 7 },
        { flowerId: "gf-babys-breath", name: "Baby's Breath", image: IMG.roseBabysBreath, qty: 3 },
      ],
      style: "basket", wrapId: "wrap-kraft", ribbonId: "rib-gold", notes: "Bright and cheerful for a new office opening.",
      referencePhotos: [], fulfilment: "PICKUP", deliveryDate: addDays(t, 6), timeSlot: "MORNING",
      recipient: { name: "Nadeesha Perera", phone: "+94771234567", line1: "Store pickup", city: "Colombo 07" },
      cardMessage: "Congratulations on the new space!", isAnonymousSender: false, estimate: 3250,
      createdAt: new Date(now.getTime() - 40 * 60_000).toISOString(),
    },
  ];
}

export function buildSeedReminders(): Reminder[] {
  const t = todayISO();
  return [
    { id: "r1", recipientName: "Amma", occasion: "Birthday", date: addDays(t, 9), repeatYearly: true },
    { id: "r2", recipientName: "Dinuka", occasion: "Anniversary", date: addDays(t, 41), repeatYearly: true },
    { id: "r3", recipientName: "Sanduni", occasion: "Graduation", date: addDays(t, 4), repeatYearly: false },
  ];
}
