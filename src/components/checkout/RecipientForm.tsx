"use client";

import type { Recipient } from "@/lib/types";
import { allCities, zoneForCity } from "@/lib/mock/delivery";
import { useStore } from "@/lib/store";
import { cn, lkr, normalisePhone } from "@/lib/format";
import { Field } from "../ui/bits";
import { Icon } from "../ui/Icon";

export type RecipientErrors = Partial<Record<keyof Recipient, string>>;

export function validateRecipient(r: Recipient, pickup: boolean): RecipientErrors {
  const e: RecipientErrors = {};
  if (r.name.trim().length < 2) e.name = "Enter the recipient's name";
  if (!normalisePhone(r.phone)) e.phone = "Use a Sri Lankan mobile, e.g. 077 123 4567";
  if (!pickup) {
    if (r.line1.trim().length < 4) e.line1 = "Enter the street address";
    if (!r.city.trim()) e.city = "Choose a city";
    else if (!zoneForCity(r.city)) e.city = "Sorry — this area is outside our delivery range";
  }
  return e;
}

export function RecipientForm({
  value,
  onChange,
  errors,
  pickup,
}: {
  value: Recipient;
  onChange: (r: Recipient) => void;
  errors: RecipientErrors;
  pickup: boolean;
}) {
  const { addresses, user, hydrated } = useStore();
  const set = (k: keyof Recipient) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => onChange({ ...value, [k]: e.target.value });
  const zone = value.city ? zoneForCity(value.city) : undefined;

  return (
    <div className="space-y-5">
      {hydrated && user && addresses.length > 0 && !pickup && (
        <div>
          <p className="label">Saved addresses</p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {addresses.map((a) => {
              const on = a.line1 === value.line1 && a.name === value.name;
              return (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => onChange({ name: a.name, phone: a.phone, line1: a.line1, line2: a.line2, city: a.city, landmark: a.landmark, instructions: a.instructions })}
                  className={cn("shrink-0 rounded-2xl border px-4 py-3 text-left transition", on ? "border-ink bg-ink text-cream" : "border-line bg-paper hover:border-ink/40")}
                >
                  <span className="flex items-center gap-1.5 text-sm font-semibold"><Icon name="pin" size={14} /> {a.label}</span>
                  <span className={cn("block text-xs", on ? "text-cream/70" : "text-muted")}>{a.name} · {a.city}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={pickup ? "Collected by" : "Recipient name"} error={errors.name}>
          <input className="field" value={value.name} onChange={set("name")} autoComplete="name" placeholder="Full name" />
        </Field>
        <Field label="Mobile number" error={errors.phone} hint="We'll only call if we can't find them">
          <input className="field" value={value.phone} onChange={set("phone")} inputMode="tel" autoComplete="tel" placeholder="077 123 4567" />
        </Field>
      </div>

      {!pickup && (
        <>
          <Field label="Street address" error={errors.line1}>
            <input className="field" value={value.line1} onChange={set("line1")} autoComplete="address-line1" placeholder="House no., street" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="City / area" error={errors.city} hint={zone ? `${zone.name} · delivery ${lkr(zone.fee)}` : undefined}>
              <input className="field" value={value.city} onChange={set("city")} list="sf-cities" placeholder="Start typing… e.g. Colombo 05" />
              <datalist id="sf-cities">
                {allCities.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Landmark (optional)">
              <input className="field" value={value.landmark ?? ""} onChange={set("landmark")} placeholder="Near the temple, blue gate…" />
            </Field>
          </div>
          <Field label="Delivery instructions (optional)">
            <textarea className="field resize-none" rows={2} value={value.instructions ?? ""} onChange={set("instructions")} placeholder="Leave at reception, call on arrival…" />
          </Field>
        </>
      )}
    </div>
  );
}

export const emptyRecipient: Recipient = { name: "", phone: "", line1: "", city: "", landmark: "", instructions: "" };
