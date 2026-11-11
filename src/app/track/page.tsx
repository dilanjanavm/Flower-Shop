"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import { FlowerImage } from "@/components/ui/FlowerImage";
import { IMG } from "@/lib/mock/images";

export default function TrackLookupPage() {
  const router = useRouter();
  const { orders } = useStore();
  const [num, setNum] = useState("");
  const [phone, setPhone] = useState("");
  const [err, setErr] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const o = orders.find((x) => x.orderNumber.toLowerCase() === num.trim().toLowerCase());
    if (!o) return setErr("We couldn't find that order. Check the number in your SMS or email.");
    router.push(`/track/${o.trackingToken}`);
  };

  return (
    <div className="container-x pt-10">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Track an order</p>
          <h1 className="h-display mt-3 text-5xl sm:text-6xl">Where are my flowers?</h1>
          <p className="mt-4 max-w-md text-muted">Enter your order number (it looks like <span className="font-mono text-ink">SF-261110-00042</span>) to see live status from our studio to the door.</p>
          <form onSubmit={submit} className="mt-8 max-w-md space-y-3">
            <input className="field h-13 font-mono uppercase" placeholder="SF-YYMMDD-#####" value={num} onChange={(e) => { setNum(e.target.value); setErr(""); }} aria-label="Order number" />
            <input className="field h-13" placeholder="Mobile number used for the order (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} aria-label="Mobile number" />
            {err && <p className="text-sm text-red-600">{err}</p>}
            <Button size="lg" className="w-full" disabled={!num.trim()}>
              <Icon name="search" size={18} /> Track order
            </Button>
          </form>
          {orders[0] && (
            <p className="mt-4 text-xs text-muted">
              Demo: try <button className="font-mono underline" onClick={() => setNum(orders.find((o) => o.orderStatus === "PREPARING")?.orderNumber ?? orders[0].orderNumber)}>{orders.find((o) => o.orderStatus === "PREPARING")?.orderNumber ?? orders[0].orderNumber}</button>
            </p>
          )}
        </div>
        <div className="relative hidden lg:block">
          <FlowerImage src={IMG.womanBouquet} alt="" className="aspect-[4/5] rounded-[2.5rem]" sizes="40vw" />
          <div className="absolute -left-8 bottom-10 flex animate-float items-center gap-3 rounded-2xl bg-paper px-5 py-4 shadow-[var(--shadow-lift)]">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-cream"><Icon name="truck" size={18} /></span>
            <div>
              <p className="text-xs text-muted">Out for delivery</p>
              <p className="text-sm font-semibold">Arriving 4 – 8 pm</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
