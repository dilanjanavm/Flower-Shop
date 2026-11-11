"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Reminder } from "@/lib/types";
import { diffDays, formatLong, todayISO } from "@/lib/dates";
import { cn } from "@/lib/format";
import { EmptyState, Field, Modal, Toggle } from "@/components/ui/bits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";

const occasions = ["Birthday", "Anniversary", "Valentine's Day", "Mother's Day", "Graduation", "Other"];
const blank: Omit<Reminder, "id"> = { recipientName: "", occasion: "Birthday", date: "", repeatYearly: true };

export default function RemindersPage() {
  const { reminders, saveReminder, deleteReminder, toast } = useStore();
  const [editing, setEditing] = useState<(Omit<Reminder, "id"> & { id?: string }) | null>(null);
  const t = todayISO();
  const sorted = [...reminders].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-display text-4xl sm:text-5xl">Occasion reminders</h1>
          <p className="mt-2 max-w-lg text-muted">We&apos;ll email and SMS you 7 and 2 days before each date — with a single-use 10% code, valid for 14 days.</p>
        </div>
        <Button size="sm" onClick={() => setEditing({ ...blank })}><Icon name="plus" size={15} /> Add a date</Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {sorted.length === 0 && <div className="sm:col-span-2 xl:col-span-3"><EmptyState icon="bell" title="No dates saved" body="Add birthdays and anniversaries so you never miss one." /></div>}
        {sorted.map((r) => {
          const days = diffDays(t, r.date);
          const soon = days >= 0 && days <= 7;
          return (
            <div key={r.id} className={cn("card relative overflow-hidden p-5", soon && "ring-2 ring-blush-300")}>
              {soon && <span className="absolute right-0 top-0 rounded-bl-2xl bg-blush-400 px-3 py-1 text-[11px] font-semibold">Coming up</span>}
              <p className="eyebrow">{r.occasion}</p>
              <p className="mt-2 font-serif text-2xl">{r.recipientName}</p>
              <p className="mt-1 text-sm text-muted">{formatLong(r.date)}</p>
              <p className="mt-1 text-xs text-muted">{days >= 0 ? `In ${days} day${days === 1 ? "" : "s"}` : "Passed"} · {r.repeatYearly ? "Every year" : "Once"}</p>
              <div className="mt-4 flex items-center gap-3 border-t border-line pt-3 text-sm">
                {days >= 2 && <Link href="/shop" className="font-medium text-blush-600">Send flowers</Link>}
                <button onClick={() => setEditing(r)} className="text-ink-soft hover:text-ink">Edit</button>
                <button onClick={() => deleteReminder(r.id)} className="ml-auto text-muted hover:text-red-600" aria-label="Delete"><Icon name="trash" size={16} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit reminder" : "Save a date"}>
        {editing && (
          <div className="space-y-4">
            <Field label="Who is it for?"><input className="field" value={editing.recipientName} onChange={(e) => setEditing({ ...editing, recipientName: e.target.value })} placeholder="e.g. Amma" /></Field>
            <div>
              <span className="label">Occasion</span>
              <div className="flex flex-wrap gap-2">
                {occasions.map((o) => (
                  <button key={o} onClick={() => setEditing({ ...editing, occasion: o })} className={cn("rounded-full border px-3 py-1.5 text-xs", editing.occasion === o ? "border-ink bg-ink text-cream" : "border-line")}>{o}</button>
                ))}
              </div>
            </div>
            <Field label="Date"><input type="date" className="field" value={editing.date} onChange={(e) => setEditing({ ...editing, date: e.target.value })} /></Field>
            <Toggle checked={editing.repeatYearly} onChange={(v) => setEditing({ ...editing, repeatYearly: v })} label="Repeat every year" />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button disabled={!editing.recipientName || !editing.date} onClick={() => { saveReminder(editing); setEditing(null); toast({ title: "Date saved", body: "We'll remind you 7 and 2 days before.", tone: "success" }); }}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
