import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rng } from "./textures";

/**
 * Procedural flower heads. Every head is built along +Y (stem attaches at the
 * origin, bloom opens upward). Petal geometry carries greyscale vertex colours
 * (a base→tip gradient) which the material colour tints, so one geometry is
 * shared by all colours of the same flower.
 */

export type FlowerModel =
  | "rose" | "tulip" | "lily" | "sunflower" | "carnation" | "chrysanthemum" | "orchid"
  | "babysbreath" | "eucalyptus" | "ruscus";

export const MODEL_BY_ID: Record<string, FlowerModel> = {
  "gf-red-rose": "rose",
  "gf-pink-rose": "rose",
  "gf-coral-rose": "rose",
  "gf-white-lily": "lily",
  "gf-pink-lily": "lily",
  "gf-pink-tulip": "tulip",
  "gf-white-tulip": "tulip",
  "gf-sunflower": "sunflower",
  "gf-carnation": "carnation",
  "gf-chrysanthemum": "chrysanthemum",
  "gf-orchid": "orchid",
  "gf-babys-breath": "babysbreath",
  "gf-eucalyptus": "eucalyptus",
  "gf-ruscus": "ruscus",
};

export function modelFor(id: string, kind: "FLOWER" | "FILLER"): FlowerModel {
  return MODEL_BY_ID[id] ?? (kind === "FILLER" ? "eucalyptus" : "rose");
}

export type PartRole = "petal" | "fixed" | "disc";

export interface HeadPart {
  geo: THREE.BufferGeometry;
  role: PartRole;
  /** colour for fixed parts */
  color?: string;
  roughness?: number;
}

export interface HeadSpec {
  parts: HeadPart[];
  /** extra lift in the bouquet dome (tall blooms sit higher) */
  lift: number;
  filler: boolean;
  stemRadius: number;
  stemColor: string;
  leaves: LeafSpec[];
}

export interface LeafSpec {
  geo: THREE.BufferGeometry;
  frac: number;
  az: number;
  tilt: number;
  color: string;
}

const UP = new THREE.Vector3(0, 1, 0);
const deg = (d: number) => (d * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/* ───────── Petal / leaf surface ───────── */

interface PetalOpts {
  len: number;
  width: number;
  /** edges bend toward the flower axis */
  cup?: number;
  /** + bends the petal outward along its length, − curls it inward */
  curl?: number;
  /** width profile exponent: 0.4 round … 1.2 pointed */
  shape?: number;
  /** wavy, frilled edge */
  ruffle?: number;
  seg?: [number, number];
  /** base → tip brightness */
  dark?: number;
}

export function petalGeo(o: PetalOpts) {
  const su = o.seg?.[0] ?? 6, sv = o.seg?.[1] ?? 8;
  const cup = o.cup ?? 0, curl = o.curl ?? 0, shape = o.shape ?? 0.6, ruffle = o.ruffle ?? 0, dark = o.dark ?? 0.45;
  const ys = [0], zs = [0];
  let y = 0, z = 0;
  const dl = o.len / sv;
  for (let j = 1; j <= sv; j++) {
    const a = curl * ((j - 0.5) / sv) * 1.6;
    y += Math.cos(a) * dl;
    z += Math.sin(a) * dl;
    ys.push(y);
    zs.push(z);
  }
  const pos: number[] = [], col: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= sv; j++) {
    const v = j / sv;
    const wv = Math.pow(Math.max(0.0001, Math.sin(Math.PI * (0.05 + 0.9 * v))), shape) * (0.35 + 0.65 * Math.min(1, v * 3));
    for (let i = 0; i <= su; i++) {
      const u = (i / su) * 2 - 1;
      const half = o.width * 0.5 * wv;
      const x = u * half;
      let zz = zs[j] - cup * u * u * half;
      if (ruffle) zz += ruffle * Math.sin(u * 7 + v * 5) * v * v * o.len * 0.12;
      pos.push(x, ys[j], zz);
      const b = 1 - dark + dark * Math.pow(v, 0.7) + 0.06 * u * u * v;
      col.push(b, b, b);
      uv.push(i / su, v);
    }
  }
  for (let j = 0; j < sv; j++)
    for (let i = 0; i < su; i++) {
      const a = j * (su + 1) + i, b = a + 1, c = a + su + 1, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

/** Place a petal: rotate to azimuth phi, push out to radius rb, tilt outward. */
function place(g: THREE.BufferGeometry, phi: number, tilt: number, rb: number, y0 = 0, scale = 1) {
  const out = g.clone();
  _m.makeScale(scale, scale, scale);
  out.applyMatrix4(_m);
  _m.makeRotationX(tilt);
  out.applyMatrix4(_m);
  _m.makeTranslation(0, y0, rb);
  out.applyMatrix4(_m);
  _m.makeRotationY(phi);
  out.applyMatrix4(_m);
  return out;
}

function withColor(g: THREE.BufferGeometry, b = 1) {
  if (!g.getAttribute("color")) {
    const n = g.getAttribute("position").count;
    g.setAttribute("color", new THREE.Float32BufferAttribute(new Array(n * 3).fill(b), 3));
  }
  if (!g.getAttribute("uv")) {
    const n = g.getAttribute("position").count;
    g.setAttribute("uv", new THREE.Float32BufferAttribute(new Array(n * 2).fill(0), 2));
  }
  return g.index ? g.toNonIndexed() : g;
}

function merge(list: THREE.BufferGeometry[]) {
  const norm = list.map((g) => withColor(g));
  const m = mergeGeometries(norm, false);
  norm.forEach((g) => g.dispose());
  return m!;
}

/** A thin cylinder between two points. */
export function segGeo(a: THREE.Vector3, b: THREE.Vector3, r0: number, r1 = r0, radial = 5) {
  const len = a.distanceTo(b);
  const g = new THREE.CylinderGeometry(r1, r0, len, radial, 1, true);
  _v.subVectors(b, a).normalize();
  _q.setFromUnitVectors(UP, _v);
  _m.compose(_s.addVectors(a, b).multiplyScalar(0.5), _q, new THREE.Vector3(1, 1, 1));
  g.applyMatrix4(_m);
  return g;
}

function blob(r: number, sx = 1, sy = 1, sz = 1, at = new THREE.Vector3(), detail = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  g.scale(sx, sy, sz);
  g.translate(at.x, at.y, at.z);
  return g;
}

/* ───────── Leaves ───────── */

const leafCache = new Map<string, THREE.BufferGeometry>();
function leaf(name: string, make: () => THREE.BufferGeometry) {
  if (!leafCache.has(name)) leafCache.set(name, make());
  return leafCache.get(name)!;
}
const roseLeaf = () => leaf("rose", () => petalGeo({ len: 0.3, width: 0.17, cup: 0.25, curl: 0.35, shape: 0.75, dark: 0.25, ruffle: 0.15 }));
const lanceLeaf = () => leaf("lance", () => petalGeo({ len: 0.55, width: 0.09, cup: 0.4, curl: 0.9, shape: 1, dark: 0.2, seg: [4, 10] }));
const strapLeaf = () => leaf("strap", () => petalGeo({ len: 0.85, width: 0.2, cup: 0.6, curl: 1.0, shape: 0.7, dark: 0.2, seg: [4, 12] }));
const broadLeaf = () => leaf("broad", () => petalGeo({ len: 0.42, width: 0.38, cup: 0.3, curl: 0.5, shape: 0.6, dark: 0.25, ruffle: 0.2 }));
const narrowLeaf = () => leaf("narrow", () => petalGeo({ len: 0.32, width: 0.08, cup: 0.3, curl: 0.6, shape: 1, dark: 0.2 }));

const GREEN = "#4f7b3f";

/* ───────── Heads ───────── */

function rose(): HeadSpec {
  const list: THREE.BufferGeometry[] = [];
  const N = 24;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const inner = t < 0.55;
    const k = inner ? t / 0.55 : (t - 0.55) / 0.45;
    const len = inner ? lerp(0.15, 0.24, k) : lerp(0.25, 0.29, k);
    const tilt = inner ? lerp(2, 22, k) : lerp(30, 58, k);
    const g = petalGeo({
      len,
      width: len * (inner ? lerp(1.3, 1.5, k) : 1.45),
      cup: inner ? 1.25 : lerp(0.9, 0.5, k),
      curl: inner ? lerp(-0.35, -0.05, k) : lerp(0.15, 0.55, k),
      shape: 0.45,
      dark: inner ? 0.5 : 0.35,
      seg: [9, 8],
    });
    list.push(place(g, i * 2.39996, deg(tilt), inner ? lerp(0.012, 0.045, k) : lerp(0.05, 0.07, k), inner ? 0.02 : lerp(0.0, -0.03, k)));
    g.dispose();
  }
  const sepal = petalGeo({ len: 0.16, width: 0.05, shape: 1.1, curl: 0.8, dark: 0.1 });
  const sepals = [0, 1, 2, 3, 4].map((i) => place(sepal, i * 1.2566 + 0.3, deg(115), 0.04, -0.01));
  sepal.dispose();
  const hip = blob(0.05, 1, 0.9, 1, new THREE.Vector3(0, -0.03, 0));
  return {
    parts: [
      { geo: merge(list), role: "petal" },
      { geo: merge([...sepals, hip]), role: "fixed", color: "#3f6b32", roughness: 0.7 },
    ],
    lift: 0,
    filler: false,
    stemRadius: 0.02,
    stemColor: GREEN,
    leaves: [
      { geo: roseLeaf(), frac: 0.8, az: 0.4, tilt: deg(55), color: "#3e6a33" },
      { geo: roseLeaf(), frac: 0.86, az: 3.4, tilt: deg(50), color: "#3e6a33" },
      { geo: roseLeaf(), frac: 0.72, az: 1.9, tilt: deg(60), color: "#3e6a33" },
    ],
  };
}

function tulip(): HeadSpec {
  const list: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const outer = i % 2 === 0;
    const g = petalGeo({ len: outer ? 0.5 : 0.47, width: outer ? 0.34 : 0.32, cup: 0.95, curl: -0.42, shape: 0.55, dark: 0.35, seg: [7, 8] });
    list.push(place(g, (i * Math.PI) / 3, deg(outer ? 14 : 8), outer ? 0.07 : 0.05, 0.02));
    g.dispose();
  }
  const pistil = blob(0.03, 1, 2.2, 1, new THREE.Vector3(0, 0.1, 0));
  return {
    parts: [
      { geo: merge(list), role: "petal" },
      { geo: merge([pistil, blob(0.07, 1, 0.6, 1)]), role: "fixed", color: "#5e8a3c" },
    ],
    lift: 0.08,
    filler: false,
    stemRadius: 0.025,
    stemColor: "#6c9a4b",
    leaves: [
      { geo: strapLeaf(), frac: 0.55, az: 0.2, tilt: deg(25), color: "#6a9450" },
      { geo: strapLeaf(), frac: 0.65, az: 3.3, tilt: deg(30), color: "#6a9450" },
    ],
  };
}

function lily(): HeadSpec {
  const list: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const outer = i % 2 === 0;
    const g = petalGeo({ len: 0.6, width: outer ? 0.22 : 0.3, cup: 0.55, curl: 1.55, shape: 0.95, dark: 0.3, seg: [6, 12] });
    list.push(place(g, (i * Math.PI) / 3, deg(22), 0.02, 0));
    g.dispose();
  }
  const fil: THREE.BufferGeometry[] = [];
  const anth: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3 + 0.5, spread = 0.12 + (i % 2) * 0.04;
    const tip = new THREE.Vector3(Math.sin(a) * spread * 1.4, 0.34 + (i % 3) * 0.025, Math.cos(a) * spread * 1.4);
    fil.push(segGeo(new THREE.Vector3(0, 0, 0), tip, 0.006, 0.004, 4));
    anth.push(blob(0.022, 0.7, 0.7, 2.2, tip.clone().add(new THREE.Vector3(0, 0.01, 0))));
  }
  fil.push(segGeo(new THREE.Vector3(), new THREE.Vector3(0.02, 0.38, 0.0), 0.009, 0.007, 5), blob(0.025, 1, 0.7, 1, new THREE.Vector3(0.02, 0.39, 0)));
  return {
    parts: [
      { geo: merge(list), role: "petal" },
      { geo: merge(fil), role: "fixed", color: "#c9d8a0" },
      { geo: merge(anth), role: "fixed", color: "#a8461a", roughness: 0.9 },
    ],
    lift: 0.18,
    filler: false,
    stemRadius: 0.022,
    stemColor: "#52813f",
    leaves: [0, 1, 2, 3].map((i) => ({ geo: lanceLeaf(), frac: 0.6 + i * 0.08, az: i * 2.2, tilt: deg(35), color: "#4c7a3c" })),
  };
}

function sunflower(): HeadSpec {
  const list: THREE.BufferGeometry[] = [];
  for (let ring = 0; ring < 2; ring++) {
    const g = petalGeo({ len: ring ? 0.25 : 0.28, width: 0.085, cup: 0.35, curl: -0.15, shape: 1.0, dark: 0.3, seg: [4, 6] });
    for (let i = 0; i < 21; i++) list.push(place(g, (i / 21) * Math.PI * 2 + ring * 0.15, deg(ring ? 66 : 80), 0.19, 0.01 - ring * 0.01));
    g.dispose();
  }
  const disc = new THREE.CylinderGeometry(0.21, 0.19, 0.06, 40, 1);
  disc.translate(0, 0.02, 0);
  const sep = petalGeo({ len: 0.14, width: 0.06, shape: 1.1, curl: 0.4, dark: 0.1 });
  const back = Array.from({ length: 14 }, (_, i) => place(sep, i * 0.4488, deg(120), 0.12, -0.02));
  sep.dispose();
  back.push(blob(0.16, 1, 0.35, 1, new THREE.Vector3(0, -0.03, 0)));
  return {
    parts: [
      { geo: merge(list), role: "petal" },
      { geo: disc, role: "disc" },
      { geo: merge(back), role: "fixed", color: "#476f2c" },
    ],
    lift: 0.12,
    filler: false,
    stemRadius: 0.032,
    stemColor: "#5b8a3a",
    leaves: [
      { geo: broadLeaf(), frac: 0.72, az: 0.5, tilt: deg(55), color: "#4f7f35" },
      { geo: broadLeaf(), frac: 0.84, az: 3.6, tilt: deg(50), color: "#4f7f35" },
    ],
  };
}

function carnation(): HeadSpec {
  const list: THREE.BufferGeometry[] = [];
  const N = 54;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const len = lerp(0.1, 0.22, t);
    const g = petalGeo({ len, width: len * 1.25, cup: 0.3, curl: lerp(0.1, 0.9, t), shape: 0.45, ruffle: 1.4, dark: 0.35, seg: [8, 5] });
    list.push(place(g, i * 2.39996, deg(lerp(5, 80, t)), lerp(0.01, 0.05, t), 0.08));
    g.dispose();
  }
  const calyx = new THREE.CylinderGeometry(0.06, 0.035, 0.16, 10, 1, true);
  calyx.translate(0, 0.02, 0);
  return {
    parts: [
      { geo: merge(list), role: "petal" },
      { geo: calyx, role: "fixed", color: "#6f9a6a" },
    ],
    lift: 0.02,
    filler: false,
    stemRadius: 0.016,
    stemColor: "#6f9a6a",
    leaves: [
      { geo: narrowLeaf(), frac: 0.7, az: 0, tilt: deg(40), color: "#6f9a6a" },
      { geo: narrowLeaf(), frac: 0.7, az: Math.PI, tilt: deg(40), color: "#6f9a6a" },
    ],
  };
}

function chrysanthemum(): HeadSpec {
  const list: THREE.BufferGeometry[] = [];
  const N = 96;
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const len = lerp(0.08, 0.27, Math.sqrt(t));
    const g = petalGeo({ len, width: lerp(0.035, 0.05, t), cup: 0.6, curl: lerp(-0.4, 0.4, t), shape: 0.9, dark: 0.3, seg: [3, 5] });
    list.push(place(g, i * 2.39996, deg(lerp(0, 95, t)), lerp(0.005, 0.035, t), 0.02));
    g.dispose();
  }
  return {
    parts: [
      { geo: merge(list), role: "petal" },
      { geo: blob(0.05, 1, 0.6, 1), role: "fixed", color: "#5e8a3c" },
    ],
    lift: 0,
    filler: false,
    stemRadius: 0.017,
    stemColor: GREEN,
    leaves: [
      { geo: broadLeaf(), frac: 0.78, az: 1, tilt: deg(55), color: "#3f6b32" },
    ],
  };
}

function orchid(): HeadSpec {
  const petals: THREE.BufferGeometry[] = [];
  const lips: THREE.BufferGeometry[] = [];
  const stalk: THREE.BufferGeometry[] = [];
  const tep = petalGeo({ len: 0.15, width: 0.1, cup: 0.25, curl: 0.3, shape: 0.6, dark: 0.3, seg: [5, 5] });
  const lipG = petalGeo({ len: 0.11, width: 0.09, cup: 0.8, curl: 0.6, shape: 0.5, dark: 0.6, seg: [5, 5], ruffle: 0.8 });
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    pts.push(new THREE.Vector3(0, t * 0.75, Math.sin(t * 1.4) * 0.22));
  }
  for (let i = 0; i < 8; i++) stalk.push(segGeo(pts[i], pts[i + 1], 0.012 - i * 0.0008, 0.011 - i * 0.0008));
  for (let k = 0; k < 6; k++) {
    const p = pts[2 + k];
    const sc = lerp(1, 0.55, k / 5);
    const side = k % 2 ? 1 : -1;
    const bloom: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 5; i++) bloom.push(place(tep, (i * Math.PI * 2) / 5, deg(82), 0.01, 0, sc));
    const lip = place(lipG, Math.PI, deg(55), 0.015, 0, sc);
    _e.set(deg(80), side * 0.6, 0);
    _m.compose(p.clone().add(new THREE.Vector3(side * 0.05, 0, 0.03)), _q.setFromEuler(_e), new THREE.Vector3(1, 1, 1));
    bloom.forEach((g) => { g.applyMatrix4(_m); petals.push(g); });
    lip.applyMatrix4(_m);
    lips.push(lip);
  }
  tep.dispose();
  lipG.dispose();
  return {
    parts: [
      { geo: merge(petals), role: "petal" },
      { geo: merge(lips), role: "fixed", color: "#6b2f78" },
      { geo: merge(stalk), role: "fixed", color: "#5c7f3c" },
    ],
    lift: 0.1,
    filler: false,
    stemRadius: 0.014,
    stemColor: "#5c7f3c",
    leaves: [],
  };
}

/* ───────── Fillers (sprigs) ───────── */

function babysBreath(): HeadSpec {
  const r = rng(3);
  const twigs: THREE.BufferGeometry[] = [];
  const buds: THREE.BufferGeometry[] = [];
  const top = new THREE.Vector3(0, 0.45, 0);
  twigs.push(segGeo(new THREE.Vector3(), top, 0.01, 0.007));
  for (let i = 0; i < 9; i++) {
    const a = i * 2.39996, h = 0.15 + r() * 0.3;
    const base = new THREE.Vector3(0, h, 0);
    const end = new THREE.Vector3(Math.cos(a) * (0.2 + r() * 0.2), h + 0.2 + r() * 0.25, Math.sin(a) * (0.2 + r() * 0.2));
    twigs.push(segGeo(base, end, 0.006, 0.004, 4));
    for (let k = 0; k < 4; k++) {
      const tip = end.clone().add(new THREE.Vector3((r() - 0.5) * 0.16, 0.04 + r() * 0.1, (r() - 0.5) * 0.16));
      twigs.push(segGeo(end, tip, 0.003, 0.003, 3));
      for (let b = 0; b < 3; b++)
        buds.push(blob(0.018 + r() * 0.012, 1, 1, 1, tip.clone().add(new THREE.Vector3((r() - 0.5) * 0.05, (r() - 0.5) * 0.04, (r() - 0.5) * 0.05)), 0));
    }
  }
  return {
    parts: [
      { geo: merge(buds), role: "petal" },
      { geo: merge(twigs), role: "fixed", color: "#7f9a62" },
    ],
    lift: 0,
    filler: true,
    stemRadius: 0.01,
    stemColor: "#7f9a62",
    leaves: [],
  };
}

function leafySprig(seed: number, leafGeo: THREE.BufferGeometry, pairs: boolean, count: number, len: number, stemColor: string): HeadSpec {
  const r = rng(seed);
  const leaves: THREE.BufferGeometry[] = [];
  const stem: THREE.BufferGeometry[] = [];
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector3(Math.sin(t * 2) * 0.08, t * len, Math.sin(t * 1.3) * 0.12 * t));
  }
  for (let i = 0; i < 10; i++) stem.push(segGeo(pts[i], pts[i + 1], 0.009 * (1 - i / 14), 0.009 * (1 - (i + 1) / 14), 4));
  for (let i = 0; i < count; i++) {
    const t = 0.15 + (i / count) * 0.85;
    const p = pts[Math.min(10, Math.round(t * 10))];
    const sc = lerp(1.05, 0.55, t);
    const sides = pairs ? [0, Math.PI] : [i % 2 ? 0 : Math.PI];
    for (const s of sides) {
      const g = leafGeo.clone();
      _m.makeScale(sc, sc, sc);
      g.applyMatrix4(_m);
      _e.set(deg(55 + r() * 15), s + i * (pairs ? 1.57 : 0.4) + (r() - 0.5) * 0.4, 0, "YXZ");
      _m.compose(p, _q.setFromEuler(_e), new THREE.Vector3(1, 1, 1));
      g.applyMatrix4(_m);
      leaves.push(g);
    }
  }
  const top = petalGeo({ len: 0.1, width: 0.06, shape: 0.8, dark: 0.1 });
  top.translate(pts[10].x, pts[10].y, pts[10].z);
  leaves.push(top);
  return {
    parts: [
      { geo: merge(leaves), role: "petal" },
      { geo: merge(stem), role: "fixed", color: stemColor },
    ],
    lift: 0,
    filler: true,
    stemRadius: 0.011,
    stemColor,
    leaves: [],
  };
}

const eucalyptus = () =>
  leafySprig(17, petalGeo({ len: 0.17, width: 0.16, cup: 0.15, curl: 0.15, shape: 0.42, dark: 0.12, seg: [5, 5] }), true, 8, 0.85, "#8a6f63");
const ruscus = () =>
  leafySprig(29, petalGeo({ len: 0.22, width: 0.09, cup: 0.2, curl: 0.25, shape: 0.85, dark: 0.15, seg: [4, 6] }), false, 14, 0.9, "#557a43");

const BUILDERS: Record<FlowerModel, () => HeadSpec> = {
  rose, tulip, lily, sunflower, carnation, chrysanthemum, orchid,
  babysbreath: babysBreath, eucalyptus, ruscus,
};

const headCache = new Map<FlowerModel, HeadSpec>();
export function headSpec(model: FlowerModel): HeadSpec {
  if (!headCache.has(model)) headCache.set(model, BUILDERS[model]());
  return headCache.get(model)!;
}
