"use client";

import { useMemo, useState } from "react";
import { addDays, formatLong, todayISO, weekdayIndex } from "@/lib/dates";
import { dayState, settings, slotRemaining, timeSlots } from "@/lib/mock/delivery";
import { cn, lkr } from "@/lib/format";
import type { SlotCode } from "@/lib/types";
import { Icon } from "../ui/Icon";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

/**
 * Calendar for the next 60 days (FR-CUST-04.2) — earlier than today + lead
 * time, blackout dates, Sundays and fully booked days are disabled — plus
 * slot cards with remaining capacity (FR-CUST-04.3).
 */
export function SchedulePicker({
  date,
  slot,
  onDate,
  onSlot,
  pickup,
}: {
  date: string;
  slot: SlotCode | "";
  onDate: (d: string) => void;
  onSlot: (s: SlotCode) => void;
  pickup?: boolean;
}) {
  const today = todayISO();
  const last = addDays(today, 60);
  const [monthStart, setMonthStart] = useState(() => (date || addDays(today, settings.leadTimeDays)).slice(0, 7) + "-01");

  const cells = useMemo(() => {
    const first = monthStart;
    const lead = weekdayIndex(first);
    const [y, m] = first.split("-").map(Number);
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const out: (string | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 0; d < daysInMonth; d++) out.push(addDays(first, d));
    return out;
  }, [monthStart]);

  const monthLabel = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${monthStart}T12:00:00Z`));
  const shiftMonth = (n: number) => {
    const [y, m] = monthStart.split("-").map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    setMonthStart(d.toISOString().slice(0, 10));
  };
  const canPrev = monthStart > today.slice(0, 7) + "-01";
  const canNext = monthStart.slice(0, 7) < last.slice(0, 7);
  const selectedState = date ? dayState(date) : null;

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-3xl border border-line bg-paper p-5">
        <div className="mb-4 flex items-center justify-between">
          <button type="button" onClick={() => shiftMonth(-1)} disabled={!canPrev} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand disabled:opacity-30" aria-label="Previous month">
            <Icon name="chevronLeft" size={18} />
          </button>
          <p className="font-serif text-xl">{monthLabel}</p>
          <button type="button" onClick={() => shiftMonth(1)} disabled={!canNext} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand disabled:opacity-30" aria-label="Next month">
            <Icon name="chevronRight" size={18} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wider text-faint">
          {WEEKDAYS.map((w) => (
            <span key={w} className="py-1">{w}</span>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={`e${i}`} />;
            const st = d > last ? { disabled: true, reason: "Beyond booking window" } : dayState(d);
            const selected = d === date;
            const isToday = d === today;
            return (
              <button
                key={d}
                type="button"
                disabled={st.disabled}
                title={st.reason}
                onClick={() => onDate(d)}
                className={cn(
                  "relative aspect-square rounded-2xl text-sm font-medium tabular-nums transition-all duration-200",
                  selected ? "scale-105 bg-ink text-cream shadow-[var(--shadow-lift)]" : st.disabled ? "text-faint/60 line-through decoration-faint/40" : "hover:bg-blush-50 hover:text-blush-700",
                )}
              >
                {Number(d.slice(8))}
                {isToday && <span className="absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-blush-500" />}
              </button>
            );
          })}
        </div>
        <p className="mt-4 flex items-start gap-2 text-xs text-muted">
          <Icon name="info" size={14} className="mt-0.5 shrink-0" />
          Every order needs at least {settings.leadTimeDays} days&apos; notice. No deliveries on Sundays or Poya days.
        </p>
      </div>

      <div>
        <p className="label">{pickup ? "Pickup time" : "Delivery slot"}</p>
        {!date ? (
          <div className="grid h-[calc(100%-1.75rem)] min-h-40 place-items-center rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
            Choose a date to see available slots
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-sm font-medium text-ink-soft">{formatLong(date)}</p>
            {selectedState?.disabled && <p className="text-xs text-red-600">{selectedState.reason}</p>}
            {timeSlots
              .filter((t) => !(pickup && t.code === "MIDNIGHT"))
              .map((t) => {
                const left = slotRemaining(date, t.code);
                const full = left === 0;
                const active = slot === t.code;
                return (
                  <button
                    key={t.code}
                    type="button"
                    disabled={full}
                    onClick={() => onSlot(t.code)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-all duration-200",
                      active ? "border-ink bg-ink text-cream" : full ? "border-line bg-sand/50 text-faint" : "border-line bg-paper hover:border-ink/40",
                    )}
                  >
                    <span>
                      <span className="block text-sm font-semibold">
                        {t.label}
                        {t.surcharge > 0 && <span className={cn("ml-2 text-xs font-medium", active ? "text-blush-200" : "text-blush-600")}>+{lkr(t.surcharge)}</span>}
                      </span>
                      <span className={cn("text-xs", active ? "text-cream/70" : "text-muted")}>{t.window}</span>
                    </span>
                    <span className={cn("text-xs font-medium", active ? "text-cream/80" : full ? "" : left <= 3 ? "text-blush-600" : "text-muted")}>
                      {full ? "Fully booked" : left <= 3 ? `Only ${left} left` : "Available"}
                    </span>
                  </button>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
