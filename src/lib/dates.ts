/**
 * Date helpers. The business runs on Asia/Colombo time (SRS C7, FR-CUST-01.6):
 * "today" rolls over at midnight Colombo time, and delivery dates are date-only
 * strings (YYYY-MM-DD) so they never shift across time zones.
 */

export const SHOP_TZ = "Asia/Colombo";

/** Today's date in Colombo as YYYY-MM-DD. */
export function todayISO(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SHOP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Adds whole days to a YYYY-MM-DD string (UTC arithmetic, no TZ drift). */
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  const toUTC = (s: string) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUTC(b) - toUTC(a)) / 86_400_000);
}

/** Earliest selectable delivery/pickup date = today + lead time. */
export function earliestDate(leadTimeDays: number, now: Date = new Date()): string {
  return addDays(todayISO(now), leadTimeDays);
}

const dateOnly = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};

/** "Thu, 13 Nov" */
export function formatShort(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(dateOnly(iso));
}

/** "Thursday, 13 November 2026" */
export function formatLong(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOnly(iso));
}

/** "13 Nov 2026" */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(dateOnly(iso.slice(0, 10)));
}

/** Timestamp shown in Colombo time: "13 Nov, 4:30 pm" */
export function formatDateTime(isoTs: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: SHOP_TZ,
  }).format(new Date(isoTs));
}

export function weekdayIndex(iso: string): number {
  return dateOnly(iso).getUTCDay();
}

/** Remaining time as "5h 12m" (or "Expired"). */
export function timeLeft(untilTs: string, now: Date = new Date()): string {
  const ms = new Date(untilTs).getTime() - now.getTime();
  if (ms <= 0) return "Expired";
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  if (h >= 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return `${h}h ${m.toString().padStart(2, "0")}m`;
}
