"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Address } from "@/lib/types";
import { Badge, EmptyState, Field, Modal, Toggle } from "@/components/ui/bits";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { allCities, zoneForCity } from "@/lib/mock/delivery";
import { normalisePhone } from "@/lib/format";

const blank: Omit<Address, "id"> = { label: "", name: "", phone: "", line1: "", city: "", landmark: "", instructions: "", isDefault: false };
const presets = ["Home", "Partner's Office", "Parents' House", "Work"];

export default function AddressesPage() {
  const { addresses, saveAddress, deleteAddress, toast } = useStore();
  const [editing, setEditing] = useState<(Omit<Address, "id"> & { id?: string }) | null>(null);
  const [err, setErr] = useState("");

  const save = () => {
    if (!editing) return;
    if (!editing.label || !editing.name || !editing.line1) return setErr("Label, name and address are required.");
    if (!normalisePhone(editing.phone)) return setErr("Enter a valid Sri Lankan mobile number.");
    if (!zoneForCity(editing.city)) return setErr("That city is outside our delivery zones.");
    saveAddress(editing);
    setEditing(null);
    toast({ title: "Address saved", tone: "success" });
  };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="h-display text-4xl sm:text-5xl">Address book</h1>
          <p className="mt-2 text-muted">Save the people you send to most — up to 20 addresses.</p>
        </div>
        <Button size="sm" disabled={addresses.length >= 20} onClick={() => { setErr(""); setEditing({ ...blank }); }}><Icon name="plus" size={15} /> Add address</Button>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {addresses.length === 0 && <div className="sm:col-span-2"><EmptyState icon="pin" title="No saved addresses" body="Add one to speed up checkout." /></div>}
        {addresses.map((a) => (
          <div key={a.id} className="card flex flex-col p-5">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-semibold"><Icon name="pin" size={16} className="text-blush-500" /> {a.label}</p>
              {a.isDefault && <Badge tone="ink">Default</Badge>}
            </div>
            <p className="mt-3 text-sm">{a.name} · {a.phone}</p>
            <p className="text-sm text-muted">{a.line1}, {a.city}</p>
            {a.landmark && <p className="text-xs text-muted">Landmark: {a.landmark}</p>}
            <div className="mt-4 flex gap-3 border-t border-line pt-3 text-sm">
              <button onClick={() => { setErr(""); setEditing(a); }} className="flex items-center gap-1 text-ink-soft hover:text-ink"><Icon name="edit" size={15} /> Edit</button>
              <button onClick={() => deleteAddress(a.id)} className="flex items-center gap-1 text-muted hover:text-red-600"><Icon name="trash" size={15} /> Delete</button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing?.id ? "Edit address" : "New address"} wide>
        {editing && (
          <div className="space-y-4">
            <div>
              <span className="label">Label</span>
              <div className="flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p} onClick={() => setEditing({ ...editing, label: p })} className={`rounded-full border px-3 py-1.5 text-xs ${editing.label === p ? "border-ink bg-ink text-cream" : "border-line"}`}>{p}</button>
                ))}
              </div>
              <input className="field mt-2" value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} placeholder="Or type a label" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Recipient name"><input className="field" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></Field>
              <Field label="Mobile"><input className="field" value={editing.phone} onChange={(e) => setEditing({ ...editing, phone: e.target.value })} placeholder="077 123 4567" /></Field>
            </div>
            <Field label="Street address"><input className="field" value={editing.line1} onChange={(e) => setEditing({ ...editing, line1: e.target.value })} /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="City"><input className="field" list="addr-cities" value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} /><datalist id="addr-cities">{allCities.map((c) => <option key={c} value={c} />)}</datalist></Field>
              <Field label="Landmark"><input className="field" value={editing.landmark ?? ""} onChange={(e) => setEditing({ ...editing, landmark: e.target.value })} /></Field>
            </div>
            <Toggle checked={editing.isDefault} onChange={(v) => setEditing({ ...editing, isDefault: v })} label="Use as default address" />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              <Button onClick={save}>Save address</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
