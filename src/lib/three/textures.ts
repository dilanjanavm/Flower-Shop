/**
 * Procedural 2D textures for the bouquet designer. Used both by the three.js
 * scene (as CanvasTextures) and by the option swatches in the UI, so the
 * paper / ribbon a customer picks looks the same in both places.
 */

export type WrapKind = "kraft" | "frosted" | "burlap";

export function wrapKindOf(id: string | undefined): WrapKind {
  if (id?.includes("frosted")) return "frosted";
  if (id?.includes("burlap")) return "burlap";
  return "kraft";
}

export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Mix a hex colour toward white (amt > 0) or black (amt < 0). */
export function shade(hex: string, amt: number) {
  const [r, g, b] = hexToRgb(hex);
  const t = amt > 0 ? 255 : 0;
  const a = Math.abs(amt);
  const m = (c: number) => Math.round(c + (t - c) * a);
  return `rgb(${m(r)},${m(g)},${m(b)})`;
}

function blobs(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, colours: string[], count: number, alpha: number) {
  for (let i = 0; i < count; i++) {
    const x = r() * w, y = r() * h, rad = (0.08 + r() * 0.25) * w;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    g.addColorStop(0, colours[i % colours.length]);
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.globalAlpha = 1;
}

/** Paint a tileable-ish wrapping paper texture. */
export function drawWrap(ctx: CanvasRenderingContext2D, w: number, h: number, kind: WrapKind) {
  const r = rng(kind === "kraft" ? 11 : kind === "frosted" ? 23 : 37);
  const k = w / 512;

  if (kind === "kraft") {
    ctx.fillStyle = "#c6a274";
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, r, ["#b18a5c", "#d6b68b", "#bd976a"], 40, 0.35);
    // Paper fibres
    for (let i = 0; i < 5200 * k * k; i++) {
      const x = r() * w, y = r() * h, len = (3 + r() * 12) * k, a = (r() - 0.5) * 1.2;
      ctx.strokeStyle = r() > 0.5 ? `rgba(110,74,38,${0.08 + r() * 0.14})` : `rgba(240,215,175,${0.08 + r() * 0.16})`;
      ctx.lineWidth = (0.4 + r() * 0.7) * k;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
      ctx.stroke();
    }
    // Speckles
    for (let i = 0; i < 900 * k * k; i++) {
      ctx.fillStyle = `rgba(80,52,25,${0.15 + r() * 0.3})`;
      const s = (0.6 + r() * 1.4) * k;
      ctx.fillRect(r() * w, r() * h, s, s);
    }
    // Soft creases
    for (let i = 0; i < 6; i++) {
      const x0 = r() * w, y0 = r() * h, a = r() * Math.PI;
      ctx.strokeStyle = "rgba(255,236,205,0.18)";
      ctx.lineWidth = 2 * k;
      ctx.beginPath();
      ctx.moveTo(x0 - Math.cos(a) * w, y0 - Math.sin(a) * w);
      ctx.lineTo(x0 + Math.cos(a) * w, y0 + Math.sin(a) * w);
      ctx.stroke();
      ctx.strokeStyle = "rgba(95,62,30,0.12)";
      ctx.lineWidth = 1.2 * k;
      ctx.beginPath();
      ctx.moveTo(x0 - Math.cos(a) * w + 2 * k, y0 - Math.sin(a) * w + 2 * k);
      ctx.lineTo(x0 + Math.cos(a) * w + 2 * k, y0 + Math.sin(a) * w + 2 * k);
      ctx.stroke();
    }
    return;
  }

  if (kind === "frosted") {
    ctx.fillStyle = "#e8edf0";
    ctx.fillRect(0, 0, w, h);
    blobs(ctx, w, h, r, ["#ffffff", "#d7dee3", "#f4f7f9"], 34, 0.55);
    // Fine matte grain
    for (let i = 0; i < 9000 * k * k; i++) {
      ctx.fillStyle = r() > 0.5 ? `rgba(255,255,255,${0.25 + r() * 0.4})` : `rgba(140,155,165,${0.05 + r() * 0.08})`;
      ctx.fillRect(r() * w, r() * h, k, k);
    }
    // Crinkle lines in the film
    for (let i = 0; i < 70; i++) {
      let x = r() * w, y = r() * h;
      ctx.strokeStyle = r() > 0.4 ? "rgba(255,255,255,0.7)" : "rgba(150,165,178,0.22)";
      ctx.lineWidth = (0.6 + r()) * k;
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let s = 0; s < 4; s++) {
        x += (r() - 0.5) * 70 * k;
        y += (r() - 0.5) * 70 * k;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // Faint sheen band
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.45, "rgba(255,255,255,0.35)");
    g.addColorStop(0.55, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    return;
  }

  // Burlap — loose jute weave
  ctx.fillStyle = "#4f3c26";
  ctx.fillRect(0, 0, w, h);
  const cell = 16 * k;
  const thread = cell * 0.78;
  for (let y = 0; y < h; y += cell) {
    for (let x = 0; x < w; x += cell) {
      const over = ((x / cell) + (y / cell)) % 2 === 0;
      const tone = 150 + r() * 45;
      const c = (v: number) => `rgb(${Math.round(v * 1.12)},${Math.round(v * 0.93)},${Math.round(v * 0.62)})`;
      const gx = ctx.createLinearGradient(over ? x : 0, over ? 0 : y, over ? x + thread : 0, over ? 0 : y + thread);
      gx.addColorStop(0, c(tone * 0.72));
      gx.addColorStop(0.5, c(tone));
      gx.addColorStop(1, c(tone * 0.7));
      ctx.fillStyle = gx;
      const jx = (r() - 0.5) * 2 * k, jy = (r() - 0.5) * 2 * k;
      if (over) ctx.fillRect(x + jx + (cell - thread) / 2, y - 1 * k, thread, cell + 2 * k);
      else ctx.fillRect(x - 1 * k, y + jy + (cell - thread) / 2, cell + 2 * k, thread);
    }
  }
  // Fuzz
  for (let i = 0; i < 2600 * k * k; i++) {
    const x = r() * w, y = r() * h, a = r() * Math.PI * 2, len = (2 + r() * 6) * k;
    ctx.strokeStyle = `rgba(${200 + r() * 40},${170 + r() * 30},${120 + r() * 30},${0.2 + r() * 0.3})`;
    ctx.lineWidth = 0.6 * k;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
}

/** Greyscale satin ribbon pattern (tinted by material colour). x = across width. */
export function drawSatin(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = rng(5);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 1) {
    const v = 0.88 + r() * 0.1;
    ctx.fillStyle = `rgba(0,0,0,${1 - v})`;
    ctx.fillRect(x, 0, 1, h);
  }
  // Woven selvedge edges
  const edge = Math.max(2, w * 0.06);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  ctx.fillRect(0, 0, edge, h);
  ctx.fillRect(w - edge, 0, edge, h);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fillRect(edge, 0, 1, h);
  ctx.fillRect(w - edge - 1, 0, 1, h);
}

/** Woven wicker for the basket. */
export function drawWicker(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const r = rng(91);
  ctx.fillStyle = "#5a3b1d";
  ctx.fillRect(0, 0, w, h);
  const rowH = h / 16, colW = w / 12;
  for (let row = 0; row < 16; row++) {
    for (let col = 0; col < 12; col++) {
      const x = col * colW + (row % 2 ? colW / 2 : 0), y = row * rowH;
      const tone = 0.85 + r() * 0.25;
      const g = ctx.createLinearGradient(0, y, 0, y + rowH);
      g.addColorStop(0, `rgb(${120 * tone},${80 * tone},${40 * tone})`);
      g.addColorStop(0.45, `rgb(${205 * tone},${155 * tone},${92 * tone})`);
      g.addColorStop(1, `rgb(${110 * tone},${72 * tone},${36 * tone})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(x + colW / 2, y + rowH / 2, colW * 0.55, rowH * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.ellipse(x + colW / 2 - w, y + rowH / 2, colW * 0.55, rowH * 0.44, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Sunflower seed disc — Fibonacci spiral of seeds. */
export function drawSeedDisc(ctx: CanvasRenderingContext2D, s: number) {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "#5c3d12");
  g.addColorStop(0.55, "#3b250c");
  g.addColorStop(0.85, "#2a1806");
  g.addColorStop(1, "#6b4a12");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const n = 700;
  for (let i = 0; i < n; i++) {
    const rad = Math.sqrt(i / n) * s * 0.48, a = i * 2.39996;
    const x = s / 2 + Math.cos(a) * rad, y = s / 2 + Math.sin(a) * rad;
    ctx.fillStyle = i < n * 0.12 ? "rgba(140,150,40,0.7)" : `rgba(${110 + (i % 7) * 6},${70 + (i % 5) * 5},20,0.75)`;
    ctx.beginPath();
    ctx.arc(x, y, s * 0.008, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Soft contact shadow. */
export function drawShadow(ctx: CanvasRenderingContext2D, s: number) {
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  g.addColorStop(0, "rgba(60,35,30,0.38)");
  g.addColorStop(0.45, "rgba(60,35,30,0.14)");
  g.addColorStop(1, "rgba(60,35,30,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
}

/** A little satin bow, drawn flat — used as the ribbon option swatch. */
export function drawBow(ctx: CanvasRenderingContext2D, s: number, hex: string) {
  ctx.clearRect(0, 0, s, s);
  const cx = s / 2, cy = s * 0.42;
  const outline = "rgba(27,23,20,0.18)";
  const grad = (x0: number, y0: number, x1: number, y1: number) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, shade(hex, -0.28));
    g.addColorStop(0.45, shade(hex, 0.32));
    g.addColorStop(0.6, hex);
    g.addColorStop(1, shade(hex, -0.22));
    return g;
  };
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(1, s / 64);
  ctx.strokeStyle = outline;

  // Tails
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx - dir * s * 0.03, cy);
    ctx.quadraticCurveTo(cx + dir * s * 0.1, cy + s * 0.25, cx + dir * s * 0.2, cy + s * 0.5);
    ctx.lineTo(cx + dir * s * 0.28, cy + s * 0.45);
    ctx.lineTo(cx + dir * s * 0.32, cy + s * 0.53);
    ctx.quadraticCurveTo(cx + dir * s * 0.22, cy + s * 0.22, cx + dir * s * 0.07, cy);
    ctx.closePath();
    ctx.fillStyle = grad(cx, cy, cx + dir * s * 0.3, cy + s * 0.5);
    ctx.fill();
    ctx.stroke();
  }
  // Loops
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.bezierCurveTo(cx + dir * s * 0.16, cy - s * 0.32, cx + dir * s * 0.5, cy - s * 0.3, cx + dir * s * 0.44, cy);
    ctx.bezierCurveTo(cx + dir * s * 0.42, cy + s * 0.2, cx + dir * s * 0.16, cy + s * 0.14, cx, cy);
    ctx.moveTo(cx + dir * s * 0.1, cy - s * 0.02);
    ctx.bezierCurveTo(cx + dir * s * 0.22, cy - s * 0.17, cx + dir * s * 0.36, cy - s * 0.14, cx + dir * s * 0.34, cy - s * 0.01);
    ctx.bezierCurveTo(cx + dir * s * 0.32, cy + s * 0.08, cx + dir * s * 0.2, cy + s * 0.06, cx + dir * s * 0.1, cy - s * 0.02);
    ctx.fillStyle = grad(cx, cy - s * 0.3, cx + dir * s * 0.1, cy + s * 0.15);
    ctx.fill("evenodd");
    ctx.stroke();
  }
  // Knot
  const kw = s * 0.15, kh = s * 0.17;
  ctx.beginPath();
  ctx.roundRect(cx - kw / 2, cy - kh / 2, kw, kh, s * 0.04);
  ctx.fillStyle = grad(cx - kw / 2, cy, cx + kw / 2, cy);
  ctx.fill();
  ctx.stroke();
}

export function makeCanvas(w: number, h = w) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}
