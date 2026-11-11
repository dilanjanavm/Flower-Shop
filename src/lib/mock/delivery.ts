import type { Coupon, DeliveryZone, ShopSettings, SlotCode, TimeSlot } from "../types";
import { addDays, todayISO, weekdayIndex } from "../dates";

/* SRS FR-CUST-04.3 */
export const timeSlots: TimeSlot[] = [
  { code: "MORNING", label: "Morning", window: "8:00 – 12:00", surcharge: 0 },
  { code: "AFTERNOON", label: "Afternoon", window: "12:00 – 16:00", surcharge: 0 },
  { code: "EVENING", label: "Evening", window: "16:00 – 20:00", surcharge: 0 },
  { code: "MIDNIGHT", label: "Midnight Surprise", window: "23:30 – 00:30", surcharge: 1500 },
];

/* SRS FR-ADMIN-05.2 (zones defined by city lists; OI-3 fees are placeholders) */
export const deliveryZones: DeliveryZone[] = [
  {
    id: "z1", name: "Colombo City", fee: 500, freeOver: 15000,
    cities: ["Colombo 01", "Colombo 02", "Colombo 03", "Colombo 04", "Colombo 05", "Colombo 06", "Colombo 07", "Colombo 08", "Colombo 09", "Colombo 10", "Colombo 11", "Colombo 12", "Colombo 13", "Colombo 14", "Colombo 15"],
  },
  { id: "z2", name: "Inner suburbs", fee: 750, freeOver: 20000, cities: ["Dehiwala", "Mount Lavinia", "Nugegoda", "Rajagiriya", "Battaramulla", "Kotte", "Kirulapone", "Wellawatte"] },
  { id: "z3", name: "Outer suburbs", fee: 1100, cities: ["Maharagama", "Kottawa", "Malabe", "Kaduwela", "Kelaniya", "Wattala", "Moratuwa", "Piliyandala", "Boralesgamuwa"] },
  { id: "z4", name: "Greater Colombo", fee: 1600, cities: ["Negombo", "Gampaha", "Panadura", "Ja-Ela", "Kadawatha", "Homagama", "Horana"] },
];

export const allCities = deliveryZones.flatMap((z) => z.cities).sort((a, b) => a.localeCompare(b));

export function zoneForCity(city: string): DeliveryZone | undefined {
  const c = city.trim().toLowerCase();
  return deliveryZones.find((z) => z.cities.some((x) => x.toLowerCase() === c));
}

export const settings: ShopSettings = {
  leadTimeDays: 2,
  paymentWindowHours: 24,
  quotationValidityHours: 24,
  cardMessageLimit: 250,
  bank: {
    bank: "Commercial Bank of Ceylon",
    branch: "Kollupitiya",
    accountName: "Sithuliya Flora (Pvt) Ltd",
    accountNumber: "8001 2345 6789",
  },
  shop: {
    phone: "+94 77 123 4567",
    whatsapp: "+94 77 123 4567",
    email: "hello@sithuliyaflora.lk",
    address: "42 Flower Road, Colombo 07",
    hours: "Mon – Sat, 8:00 am – 8:00 pm",
  },
  pointsValue: 1,
};

/** Shop holidays / blackout dates (FR-ADMIN-05.3). Sundays closed for delivery. */
export const blackoutDates: { date: string; note: string }[] = [
  { date: "2026-11-24", note: "Il Full Moon Poya — shop closed" },
  { date: "2026-12-23", note: "Unduvap Full Moon Poya — shop closed" },
  { date: "2026-12-25", note: "Christmas Day — shop closed" },
];

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export const SLOT_CAPACITY: Record<SlotCode, number> = { MORNING: 25, AFTERNOON: 20, EVENING: 20, MIDNIGHT: 8 };

/** Remaining places in a slot — deterministic mock of slot_capacity rows. */
export function slotRemaining(date: string, slot: SlotCode): number {
  const cap = SLOT_CAPACITY[slot];
  const h = hash(`${date}:${slot}`);
  // every ~7th slot is full so the UI shows grey-outs
  if (h % 7 === 0) return 0;
  return Math.max(1, cap - (h % cap));
}

export type DayState = { date: string; disabled: boolean; reason?: string };

export function dayState(date: string, leadTimeDays = settings.leadTimeDays): DayState {
  const earliest = addDays(todayISO(), leadTimeDays);
  if (date < earliest) return { date, disabled: true, reason: "Needs 2 days' notice" };
  const bo = blackoutDates.find((b) => b.date === date);
  if (bo) return { date, disabled: true, reason: bo.note };
  if (weekdayIndex(date) === 0) return { date, disabled: true, reason: "No deliveries on Sundays" };
  const full = (["MORNING", "AFTERNOON", "EVENING", "MIDNIGHT"] as SlotCode[]).every((s) => slotRemaining(date, s) === 0);
  if (full) return { date, disabled: true, reason: "Fully booked" };
  return { date, disabled: false };
}

/** Next selectable date on/after the earliest date. */
export function firstAvailableDate(): string {
  let d = addDays(todayISO(), settings.leadTimeDays);
  for (let i = 0; i < 60; i++) {
    if (!dayState(d).disabled) return d;
    d = addDays(d, 1);
  }
  return d;
}

export const coupons: Coupon[] = [
  { code: "LOVE10", type: "PERCENT", value: 10, minSpend: 5000, maxDiscount: 3000, description: "10% off orders over Rs 5,000" },
  { code: "WELCOME500", type: "FIXED", value: 500, minSpend: 4000, description: "Rs 500 off your first order" },
];

export function applyCoupon(code: string, subtotal: number): { ok: true; coupon: Coupon; discount: number } | { ok: false; error: string } {
  const c = coupons.find((x) => x.code === code.trim().toUpperCase());
  if (!c) return { ok: false, error: "This code isn't valid." };
  if (subtotal < c.minSpend) return { ok: false, error: `Spend at least Rs ${c.minSpend.toLocaleString()} to use ${c.code}.` };
  const raw = c.type === "PERCENT" ? (subtotal * c.value) / 100 : c.value;
  const discount = Math.round(Math.min(raw, c.maxDiscount ?? raw));
  return { ok: true, coupon: c, discount };
}
