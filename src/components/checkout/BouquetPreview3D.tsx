"use client";

import { useEffect, useRef, useState } from "react";
import type { BouquetEngine, EngineProps } from "@/lib/three/engine";
import { cn } from "@/lib/format";
import { Icon } from "../ui/Icon";

interface Props extends EngineProps {
  focusName?: string;
  focusMeta?: string;
  onMode: (m: "stem" | "bouquet") => void;
  canBouquet: boolean;
  className?: string;
}

/**
 * Live three.js preview of the custom bouquet. "Single flower" shows one stem
 * of the flower being picked; "Bouquet" assembles every selected stem with
 * the chosen style, wrapping paper and ribbon.
 */
export default function BouquetPreview3D({ focusName, focusMeta, onMode, canBouquet, className, ...engineProps }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<BouquetEngine | null>(null);
  const latest = useRef(engineProps);
  latest.current = engineProps;
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [big, setBig] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const host = hostRef.current;
    if (!host) return;
    let io: IntersectionObserver | undefined;
    const onVis = () => engineRef.current?.setVisible(!document.hidden);
    import("@/lib/three/engine")
      .then(({ BouquetEngine }) => {
        if (cancelled) return;
        const eng = new BouquetEngine(host);
        engineRef.current = eng;
        eng.setProps(latest.current);
        io = new IntersectionObserver(([e]) => eng.setVisible(e.isIntersecting && !document.hidden));
        io.observe(host);
        document.addEventListener("visibilitychange", onVis);
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
      io?.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      engineRef.current?.dispose();
      engineRef.current = null;
    };
  }, []);

  const key = JSON.stringify(engineProps);
  useEffect(() => {
    engineRef.current?.setProps(latest.current);
  }, [key]);

  useEffect(() => {
    if (!big) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBig(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [big]);

  const isStem = engineProps.mode === "stem";
  const empty = !isStem && engineProps.items.length === 0;

  return (
    <>
      {big && <div className="fixed inset-0 z-[60] bg-ink/40 backdrop-blur-sm" onClick={() => setBig(false)} />}
      <div
        className={cn(
          "relative overflow-hidden bg-[radial-gradient(120%_90%_at_50%_15%,#fffdf9_0%,#fbeff2_55%,#f3e6e0_100%)]",
          big ? "fixed inset-4 z-[61] rounded-3xl shadow-2xl sm:inset-10" : "rounded-3xl border border-line",
          className,
        )}
      >
        <div ref={hostRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" aria-label="3D bouquet preview. Drag to rotate, scroll or pinch to zoom." role="img" />

        {state === "loading" && (
          <div className="absolute inset-0 grid place-items-center text-xs text-muted">
            <span className="flex items-center gap-2"><span className="h-3 w-3 animate-spin rounded-full border-2 border-blush-400 border-t-transparent" /> Growing your flowers…</span>
          </div>
        )}
        {state === "error" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center text-xs text-muted">3D preview isn&apos;t supported on this device.</div>
        )}

        {/* Mode toggle */}
        <div className="absolute left-3 top-3 flex gap-0.5 rounded-full bg-paper/85 p-0.5 text-xs shadow-sm backdrop-blur">
          {(["stem", "bouquet"] as const).map((m) => (
            <button
              key={m}
              type="button"
              disabled={m === "bouquet" && !canBouquet}
              onClick={() => onMode(m)}
              className={cn("rounded-full px-3 py-1.5 font-medium transition disabled:opacity-40", engineProps.mode === m ? "bg-ink text-cream" : "text-muted hover:text-ink")}
            >
              {m === "stem" ? "Single flower" : "Bouquet"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setBig((b) => !b)}
          className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-paper/85 text-ink shadow-sm backdrop-blur transition hover:bg-paper"
          aria-label={big ? "Close large preview" : "Open large preview"}
        >
          {big ? <Icon name="close" size={14} /> : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
          )}
        </button>

        {/* Caption */}
        <div className="pointer-events-none absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
          <div className="rounded-2xl bg-paper/85 px-3 py-2 shadow-sm backdrop-blur">
            {empty ? (
              <p className="text-xs text-muted">Add flowers to see your bouquet</p>
            ) : isStem ? (
              <>
                <p className="text-sm font-medium leading-tight">{focusName ?? "Tap a flower"}</p>
                {focusMeta && <p className="text-[11px] text-muted">{focusMeta}</p>}
              </>
            ) : (
              <p className="text-xs text-muted">Live preview · drag to rotate</p>
            )}
          </div>
        </div>
      </div>
      {big && <div className={className} aria-hidden />}
    </>
  );
}
