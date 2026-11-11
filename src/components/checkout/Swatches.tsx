"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/format";
import { drawBow, drawWrap, type WrapKind } from "@/lib/three/textures";

/** A folded sheet of the actual wrapping-paper texture. */
export function WrapSwatch({ kind, className }: { kind: WrapKind; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const s = 160;
    c.width = c.height = s;
    const ctx = c.getContext("2d")!;
    const tile = document.createElement("canvas");
    tile.width = tile.height = 512;
    drawWrap(tile.getContext("2d")!, 512, 512, kind);
    ctx.drawImage(tile, 40, 40, 220, 220, 0, 0, s, s);
    if (kind === "frosted") {
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(0, 0, s, s);
    }
    // light falling across a sheet
    const g = ctx.createLinearGradient(0, 0, s, s);
    g.addColorStop(0, "rgba(255,255,255,0.28)");
    g.addColorStop(0.5, "rgba(255,255,255,0)");
    g.addColorStop(1, "rgba(0,0,0,0.14)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    // folded corner
    const f = s * 0.32;
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.beginPath();
    ctx.moveTo(s - f, s);
    ctx.lineTo(s, s - f);
    ctx.lineTo(s, s);
    ctx.closePath();
    ctx.fill();
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s - f, s);
    ctx.lineTo(s, s - f);
    ctx.lineTo(s - f, s - f);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(tile, 300, 300, 90, 90, s - f, s - f, f, f);
    const g2 = ctx.createLinearGradient(s - f, s - f, s, s);
    g2.addColorStop(0, "rgba(255,255,255,0.35)");
    g2.addColorStop(1, "rgba(0,0,0,0.12)");
    ctx.fillStyle = g2;
    ctx.fillRect(s - f, s - f, f, f);
    ctx.restore();
  }, [kind]);
  return <canvas ref={ref} className={cn("rounded-xl ring-1 ring-black/10", className)} aria-hidden />;
}

/** A small satin bow in the ribbon colour. */
export function RibbonSwatch({ hex, className }: { hex: string; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    c.width = c.height = 96;
    drawBow(c.getContext("2d")!, 96, hex);
  }, [hex]);
  return <canvas ref={ref} className={className} aria-hidden />;
}
