import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { headSpec, modelFor, type FlowerModel, type HeadSpec } from "./flowers";
import { drawSatin, drawSeedDisc, drawShadow, drawWicker, drawWrap, makeCanvas, rng, type WrapKind } from "./textures";

export interface PreviewItem {
  id: string;
  hex: string;
  qty: number;
  kind: "FLOWER" | "FILLER";
}

export interface EngineProps {
  items: PreviewItem[];
  style: string;
  wrap: WrapKind;
  ribbonHex: string;
  mode: "stem" | "bouquet";
  focus: PreviewItem | null;
}

type Style = "hand-tied" | "box" | "basket";

interface StyleCfg {
  C: THREE.Vector3; // where stems converge
  top: number; // dome top
  drop: number; // dome curvature
  bottom: number; // lowest visible point (framing)
}

const CFG: Record<Style, StyleCfg> = {
  "hand-tied": { C: new THREE.Vector3(0, -0.3, 0), top: 2.45, drop: 0.17, bottom: -0.45 },
  box: { C: new THREE.Vector3(0, 0.1, 0), top: 1.95, drop: 0.14, bottom: -0.05 },
  basket: { C: new THREE.Vector3(0, 0.2, 0), top: 2.0, drop: 0.14, bottom: -0.05 },
};

const UP = new THREE.Vector3(0, 1, 0);
const GOLDEN = 2.39996323;
const MAX_STEMS = 72;
const BIND_Y = 0.62;
const HEAD_H: Partial<Record<FlowerModel, number>> = {
  rose: 0.3, tulip: 0.55, lily: 0.45, sunflower: 0.3, carnation: 0.32, chrysanthemum: 0.3, orchid: 0.85,
  babysbreath: 0.75, eucalyptus: 0.9, ruscus: 0.95,
};
const coneR = (y: number) => 0.13 + 0.6 * Math.max(0, y);

function hash(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const damp = (dt: number, rate: number) => 1 - Math.exp(-dt * rate);
const easeOutBack = (t: number) => {
  const c1 = 1.5, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

/* ───────── One stem in the scene ───────── */

interface Slot {
  key: string;
  model: FlowerModel;
  hex: string;
  target: THREE.Vector3;
  headScale: number;
  roll: number;
}

class Stem {
  key: string;
  model: FlowerModel;
  spec: HeadSpec;
  head = new THREE.Group();
  stemG = new THREE.Group();
  stem: THREE.Mesh;
  leaves: { mesh: THREE.Mesh; frac: number }[] = [];
  pos = new THREE.Vector3();
  target = new THREE.Vector3();
  grow = 0;
  growT = 0;
  headScale = 1;
  targetHeadScale = 1;
  roll = 0;
  removing = false;
  C = new THREE.Vector3();
  petalMats: THREE.MeshPhysicalMaterial[] = [];

  constructor(slot: Slot, C: THREE.Vector3, eng: BouquetEngine, instant: boolean) {
    this.C.copy(C);
    this.key = slot.key;
    this.model = slot.model;
    this.spec = headSpec(slot.model);
    for (const part of this.spec.parts) {
      const mat = eng.partMaterial(part, slot.hex);
      if (part.role === "petal") this.petalMats.push(mat as THREE.MeshPhysicalMaterial);
      const m = new THREE.Mesh(part.geo, mat);
      this.head.add(m);
    }
    this.stem = new THREE.Mesh(eng.stemGeo, eng.fixedMaterial(this.spec.stemColor, 0.6));
    this.stemG.add(this.stem);
    for (const l of this.spec.leaves) {
      const m = new THREE.Mesh(l.geo, eng.leafMaterial(l.color));
      m.rotation.set(l.tilt, l.az + (hash(slot.key) % 100) / 30, 0, "YXZ");
      this.stemG.add(m);
      this.leaves.push({ mesh: m, frac: l.frac });
    }
    this.pos.copy(slot.target);
    this.target.copy(slot.target);
    this.roll = slot.roll;
    this.headScale = this.targetHeadScale = slot.headScale;
    this.grow = instant ? 1 : 0;
    this.growT = instant ? 1 : 0;
  }

  update(dt: number, stemMode: boolean) {
    const C = this.C;
    const k = damp(dt, 5);
    this.pos.lerp(this.target, k);
    this.headScale += (this.targetHeadScale - this.headScale) * k;
    if (this.removing) this.growT = Math.max(0, this.growT - dt * 3);
    else this.growT = Math.min(1, this.growT + dt * 1.6);
    this.grow = this.removing ? this.growT * this.growT : easeOutBack(this.growT);
    const g = Math.max(0.0001, this.grow);

    const dir = new THREE.Vector3().subVectors(this.pos, C);
    const len = dir.length() * Math.min(1, g);
    dir.normalize();
    this.stemG.position.copy(C);
    this.stemG.quaternion.setFromUnitVectors(UP, dir);
    this.stem.scale.set(this.spec.stemRadius, len, this.spec.stemRadius);
    this.stem.position.y = len / 2;
    for (const l of this.leaves) {
      l.mesh.position.y = len * l.frac;
      l.mesh.scale.setScalar(g * (stemMode ? 1.15 : 1));
    }
    const headPos = C.clone().addScaledVector(dir, len);
    this.head.position.copy(headPos);
    const face = dir.clone().multiplyScalar(0.75).addScaledVector(UP, 0.25).normalize();
    this.head.quaternion.setFromUnitVectors(UP, face);
    this.head.rotateY(this.roll);
    this.head.scale.setScalar(this.headScale * g);
  }

  addTo(parent: THREE.Object3D) {
    parent.add(this.stemG, this.head);
  }
  removeFrom(parent: THREE.Object3D) {
    parent.remove(this.stemG, this.head);
  }
}

/* ───────── Engine ───────── */

export class BouquetEngine {
  private host: HTMLElement;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  private controls: OrbitControls;
  private root = new THREE.Group();
  private flowersG = new THREE.Group();
  private holderG = new THREE.Group();
  private bowG = new THREE.Group();
  private shadow: THREE.Mesh;
  private stems = new Map<string, Stem>();
  private raf = 0;
  private clock = new THREE.Clock();
  private visible = true;
  private props: EngineProps | null = null;
  private holderKey = "";
  private holderScale = 1;
  private holderTarget = 1;
  private ribbonMat: THREE.MeshPhysicalMaterial;
  private ribbonTarget = new THREE.Color();
  private camTarget = new THREE.Vector3(0, 1.1, 0);
  private camDist = 7;
  private tweenUntil = 0;
  private userActive = false;
  private idleAt = 0;
  private sway = 1;
  private spin = 0;
  private time = 0;
  private ro: ResizeObserver;
  private cfg: StyleCfg = CFG["hand-tied"];
  private bowY = 0;
  private bowAnchor = new THREE.Vector3();

  stemGeo: THREE.CylinderGeometry;
  private mats = new Map<string, THREE.Material>();
  private tex = new Map<string, THREE.Texture>();

  constructor(host: HTMLElement) {
    this.host = host;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NeutralToneMapping;
    this.renderer.toneMappingExposure = 0.95;
    this.renderer.domElement.style.display = "block";
    this.renderer.domElement.style.width = "100%";
    this.renderer.domElement.style.height = "100%";
    this.renderer.domElement.style.touchAction = "none";
    host.appendChild(this.renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(this.renderer);
    const envScene = new RoomEnvironment();
    this.scene.environment = pmrem.fromScene(envScene, 0.04).texture;
    this.scene.environmentIntensity = 0.55;
    envScene.dispose();
    pmrem.dispose();

    const hemi = new THREE.HemisphereLight("#fff6ee", "#d9c8bb", 0.8);
    const key = new THREE.DirectionalLight("#fff3e6", 2.0);
    key.position.set(3, 6, 5);
    const rim = new THREE.DirectionalLight("#ffe1ea", 1.0);
    rim.position.set(-4, 3, -4);
    this.scene.add(hemi, key, rim, this.root);
    this.root.add(this.flowersG, this.holderG, this.bowG);

    this.stemGeo = new THREE.CylinderGeometry(1, 1, 1, 6, 1, true);

    const sc = makeCanvas(256);
    drawShadow(sc.getContext("2d")!, 256);
    const shadowTex = new THREE.CanvasTexture(sc);
    this.shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    this.shadow.rotation.x = -Math.PI / 2;
    this.scene.add(this.shadow);

    this.ribbonMat = new THREE.MeshPhysicalMaterial({
      color: "#f095a8",
      map: this.texture("satin", () => {
        const c = makeCanvas(64, 64);
        drawSatin(c.getContext("2d")!, 64, 64);
        return c;
      }),
      roughness: 0.32,
      sheen: 1,
      sheenRoughness: 0.35,
      sheenColor: new THREE.Color("#ffffff"),
      clearcoat: 0.35,
      clearcoatRoughness: 0.3,
      side: THREE.DoubleSide,
    });

    this.camera.position.set(0, 2.2, 7);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 14;
    this.controls.minPolarAngle = 0.25;
    this.controls.maxPolarAngle = 1.85;
    this.controls.target.copy(this.camTarget);
    this.controls.addEventListener("start", () => {
      this.userActive = true;
      this.tweenUntil = 0;
    });
    this.controls.addEventListener("end", () => {
      this.userActive = false;
      this.idleAt = this.time;
    });

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    this.loop = this.loop.bind(this);
    this.raf = requestAnimationFrame(this.loop);
  }

  /* ───────── material / texture caches ───────── */

  private texture(key: string, make: () => HTMLCanvasElement, repeat = 1) {
    let t = this.tex.get(key);
    if (!t) {
      t = new THREE.CanvasTexture(make());
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
      t.repeat.set(repeat, repeat);
      t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
      this.tex.set(key, t);
    }
    return t;
  }

  private cached<T extends THREE.Material>(key: string, make: () => T): T {
    if (!this.mats.has(key)) this.mats.set(key, make());
    return this.mats.get(key) as T;
  }

  partMaterial(part: HeadSpec["parts"][number], hex: string): THREE.Material {
    if (part.role === "petal")
      return this.cached(`petal:${hex}`, () =>
        new THREE.MeshPhysicalMaterial({
          color: hex,
          vertexColors: true,
          side: THREE.DoubleSide,
          roughness: 0.7,
          sheen: 0.35,
          sheenRoughness: 0.6,
          sheenColor: new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), 0.25),
        }),
      );
    if (part.role === "disc")
      return this.cached("disc", () =>
        new THREE.MeshStandardMaterial({
          roughness: 0.95,
          map: this.texture("seeds", () => {
            const c = makeCanvas(256);
            drawSeedDisc(c.getContext("2d")!, 256);
            return c;
          }),
        }),
      );
    return this.fixedMaterial(part.color ?? "#4f7b3f", part.roughness ?? 0.6);
  }

  fixedMaterial(color: string, roughness = 0.6) {
    return this.cached(`fixed:${color}:${roughness}`, () => new THREE.MeshStandardMaterial({ color, roughness, side: THREE.DoubleSide }));
  }

  leafMaterial(color: string) {
    return this.cached(`leaf:${color}`, () =>
      new THREE.MeshPhysicalMaterial({ color, vertexColors: true, roughness: 0.45, clearcoat: 0.25, side: THREE.DoubleSide }),
    );
  }

  /* ───────── props ───────── */

  setProps(p: EngineProps) {
    this.props = p;
    this.ribbonTarget.set(p.ribbonHex);
    const style: Style = p.style === "box" || p.style === "basket" ? p.style : "hand-tied";
    const stemMode = p.mode === "stem";
    this.cfg = CFG[style];

    const slots = stemMode ? this.stemSlots(p.focus) : this.bouquetSlots(p.items, style);
    const C = stemMode ? new THREE.Vector3(0, -0.2, 0) : this.cfg.C;
    const live = new Set(slots.map((s) => s.key));
    const fresh = this.stems.size === 0;

    for (const s of slots) {
      let st = this.stems.get(s.key);
      if (st && st.removing) st.removing = false;
      if (!st) {
        st = new Stem(s, C, this, false);
        if (fresh && !stemMode) st.growT = 0.4 + Math.random() * 0.3;
        st.addTo(this.flowersG);
        this.stems.set(s.key, st);
      }
      st.C.copy(C);
      st.target.copy(s.target);
      st.targetHeadScale = s.headScale;
      st.roll = s.roll;
    }
    for (const [k, st] of this.stems) if (!live.has(k)) st.removing = true;

    // Holder (wrap / box / basket)
    const n = slots.length;
    const rMax = 0.27 * Math.sqrt(n + 0.7) * 1.05;
    const holderKey = `${style}:${p.wrap}`;
    if (holderKey !== this.holderKey) {
      this.buildHolder(style, p.wrap);
      this.holderKey = holderKey;
    }
    this.holderTarget = style === "hand-tied" ? Math.max(0.62, (0.5 * rMax + 0.5) / 1.2) : Math.max(0.75, (0.48 * rMax + 0.5) / 1.2);
    this.holderG.visible = this.bowG.visible = !stemMode;

    // Camera framing
    let top: number, bottom: number, half: number;
    if (stemMode) {
      const s0 = slots[0];
      const hh = s0 ? (HEAD_H[s0.model] ?? 0.3) * s0.headScale : 0.5;
      const y0 = s0 ? s0.target.y : 1.8;
      top = y0 + hh + 0.35;
      bottom = y0 - Math.max(1.1, hh * 1.1);
      half = Math.max(0.8, hh * 0.8);
      this.shadow.visible = false;
    } else {
      top = Math.max(this.cfg.top + 0.45, style === "basket" ? this.handleTop() + 0.2 : 0);
      bottom = this.cfg.bottom;
      half = Math.max(rMax + 0.45, 1.45 * this.holderTarget * (style === "hand-tied" ? 1.1 : 1.15));
      this.shadow.visible = true;
      const sh = style === "hand-tied" ? 2.6 : 3.6 * this.holderTarget;
      this.shadow.scale.set(sh, sh, 1);
      this.shadow.position.y = this.cfg.bottom + (style === "hand-tied" ? 0.08 : 0.02);
    }
    this.camTarget.set(0, (top + bottom) / 2, 0);
    const fov = THREE.MathUtils.degToRad(this.camera.fov / 2);
    const aspect = this.camera.aspect || 1;
    const distH = (top - bottom) / 2 / Math.tan(fov);
    const distW = half / (Math.tan(fov) * aspect);
    this.camDist = Math.max(distH, distW) * 1.12 + half * 0.5;
    this.tweenUntil = this.time + 1.4;
    if (!this.snapped) {
      this.snapped = true;
      this.controls.target.copy(this.camTarget);
      const sph = new THREE.Spherical(this.camDist, stemMode ? 1.12 : 1.32, 0);
      this.camera.position.copy(this.camTarget).add(new THREE.Vector3().setFromSpherical(sph));
    }
  }

  private snapped = false;

  private stemSlots(f: PreviewItem | null): Slot[] {
    if (!f) return [];
    const model = modelFor(f.id, f.kind);
    const spec = headSpec(model);
    return [
      {
        key: `focus:${f.id}`,
        model,
        hex: f.hex,
        target: new THREE.Vector3(0.12, spec.filler ? 1.25 : 1.8, 0.05),
        headScale: spec.filler ? 1.5 : model === "lily" || model === "sunflower" ? 1.5 : model === "orchid" ? 1.6 : 1.9,
        roll: 0.3,
      },
    ];
  }

  private bouquetSlots(items: PreviewItem[], style: Style): Slot[] {
    // Expand to individual stems; fillers count as bunches → 3 sprigs each
    let expanded = items.map((it) => ({ ...it, n: it.kind === "FILLER" ? it.qty * 3 : it.qty }));
    const total = expanded.reduce((s, x) => s + x.n, 0);
    if (total > MAX_STEMS) expanded = expanded.map((x) => ({ ...x, n: Math.max(1, Math.round((x.n * MAX_STEMS) / total)) }));

    // Interleave varieties evenly so colours mix through the dome
    const stems: { it: PreviewItem; k: number; order: number }[] = [];
    expanded.forEach((x, vi) => {
      for (let k = 0; k < x.n; k++) stems.push({ it: x, k, order: (k + 0.5) / x.n + vi * 0.0007 });
    });
    stems.sort((a, b) => a.order - b.order);

    const cfg = CFG[style];
    return stems.map((s, i) => {
      const model = modelFor(s.it.id, s.it.kind);
      const spec = headSpec(model);
      const key = `${s.it.id}#${s.k}`;
      const r0 = rng(hash(key));
      const rad = 0.27 * Math.sqrt(i + 0.7) * (spec.filler ? 1.12 : 1);
      const ang = i * GOLDEN;
      const y = cfg.top - cfg.drop * rad * rad + spec.lift + (r0() - 0.5) * 0.08 - (spec.filler ? 0.42 : 0);
      return {
        key,
        model,
        hex: s.it.hex,
        target: new THREE.Vector3(Math.cos(ang) * rad + (r0() - 0.5) * 0.06, y, Math.sin(ang) * rad + (r0() - 0.5) * 0.06),
        headScale: (spec.filler ? 1 : 1.0) * (0.92 + r0() * 0.16),
        roll: r0() * Math.PI * 2,
      };
    });
  }

  /* ───────── holders ───────── */

  private clearGroup(g: THREE.Group) {
    g.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
    });
    g.clear();
  }

  private wrapMaterials(kind: WrapKind): THREE.Material[] {
    const map = this.texture(`wrap:${kind}`, () => {
      const c = makeCanvas(512);
      drawWrap(c.getContext("2d")!, 512, 512, kind);
      return c;
    });
    if (kind === "frosted") {
      const base = { map, color: "#ffffff", transparent: true, opacity: 0.62, roughness: 0.42, clearcoat: 0.3, clearcoatRoughness: 0.5, depthWrite: false };
      return [
        this.cached("wrap:frosted:back", () => new THREE.MeshPhysicalMaterial({ ...base, side: THREE.BackSide })),
        this.cached("wrap:frosted:front", () => new THREE.MeshPhysicalMaterial({ ...base, side: THREE.FrontSide })),
      ];
    }
    return [
      this.cached(`wrap:${kind}`, () =>
        new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: kind === "burlap" ? 2.5 : 0.8, roughness: kind === "burlap" ? 1 : 0.9, side: THREE.DoubleSide }),
      ),
    ];
  }

  private addSheet(geo: THREE.BufferGeometry, mats: THREE.Material[]) {
    mats.forEach((m, i) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.renderOrder = m.transparent ? 2 + i : 0;
      this.holderG.add(mesh);
    });
  }

  /** The bouquet wrap: a pleated, flared cone, higher at the back. */
  private wrapSheet(phase: number, hBack: number, hFront: number, scaleR: number, seed: number) {
    const nu = 96, nv = 18;
    const r = rng(seed);
    const noise = Array.from({ length: 6 }, () => r() * Math.PI * 2);
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      for (let i = 0; i <= nu; i++) {
        const th = (i / nu) * Math.PI * 2;
        const top = hFront + (hBack - hFront) * (0.5 - 0.5 * Math.cos(th + phase * 0.3));
        let y = v * top;
        y += 0.06 * Math.sin(th * 5 + noise[0]) * Math.pow(v, 5);
        const pleatA = 0.11 * smooth(BIND_Y, 1.9, y);
        const pleat = pleatA * (Math.sin(th * 6 + phase + 1.2 * Math.sin(th * 2 + noise[1])) + 0.45 * Math.sin(th * 11 + noise[2]));
        const crumple = 0.012 * Math.sin(th * 17 + y * 9 + noise[3]) * smooth(0.2, 1.2, y);
        const pinch = y < BIND_Y ? 1 - 0.22 * smooth(BIND_Y - 0.25, BIND_Y, y) * (1 - smooth(BIND_Y, BIND_Y + 0.2, y)) : 1;
        const rr = (coneR(y) * (1 + pleat) * (1 + 0.18 * Math.pow(v, 3)) + crumple) * scaleR * pinch;
        pos.push(Math.sin(th) * rr, y, Math.cos(th) * rr);
        uv.push((i / nu) * 3, y * 1.1);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  /** A ruffled paper collar around a container rim. */
  private collar(R: number, y0: number, h: number, seed: number) {
    const nu = 96, nv = 8;
    const r = rng(seed);
    const n0 = r() * 6, n1 = r() * 6;
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let j = 0; j <= nv; j++) {
      const v = j / nv;
      for (let i = 0; i <= nu; i++) {
        const th = (i / nu) * Math.PI * 2;
        const hh = h * (0.8 + 0.25 * Math.sin(th * 3 + n0) + 0.1 * Math.sin(th * 7 + n1));
        const ruff = 1 + 0.07 * v * v * Math.sin(th * 14 + n1 + 2 * Math.sin(th * 3));
        const rr = R * (0.94 + 0.4 * Math.pow(v, 1.4)) * ruff;
        pos.push(Math.sin(th) * rr, y0 - 0.12 + v * (hh + 0.12), Math.cos(th) * rr);
        uv.push((i / nu) * 4, v * hh);
      }
    }
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1;
        idx.push(a, b, c, b, d, c);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  private handleTop() {
    return 2.75;
  }

  private buildHolder(style: Style, wrap: WrapKind) {
    this.clearGroup(this.holderG);
    this.clearGroup(this.bowG);
    const mats = this.wrapMaterials(wrap);
    const R = 1.2;

    if (style === "hand-tied") {
      this.addSheet(this.wrapSheet(0, 2.05, 1.5, 1.0, 1), mats);
      this.addSheet(this.wrapSheet(2.1, 1.85, 1.3, 1.05, 2), mats);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(coneR(BIND_Y + 0.08) * 0.83, coneR(BIND_Y - 0.08) * 0.83, 0.17, 48, 1, true), this.ribbonMat);
      band.position.y = BIND_Y;
      this.holderG.add(band);
      this.bowY = BIND_Y;
      this.bowAnchor.set(0, BIND_Y, coneR(BIND_Y) * 0.83 + 0.02);
    } else if (style === "box") {
      const boxMat = this.cached("box", () => new THREE.MeshStandardMaterial({ color: "#f2ebe1", roughness: 0.75 }));
      const lidMat = this.cached("boxlid", () => new THREE.MeshStandardMaterial({ color: "#ebe2d6", roughness: 0.7 }));
      const inner = this.cached("boxin", () => new THREE.MeshStandardMaterial({ color: "#d8cdbf", roughness: 0.9, side: THREE.BackSide }));
      const body = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.88, 72, 1, true), boxMat);
      body.position.y = 0.44;
      const bodyIn = new THREE.Mesh(new THREE.CylinderGeometry(R - 0.01, R - 0.01, 0.88, 72, 1, true), inner);
      bodyIn.position.y = 0.44;
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.025, R + 0.025, 0.2, 72, 1, true), lidMat);
      lid.position.y = 0.79;
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R + 0.012, 0.016, 8, 96), lidMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.89;
      const bottom = new THREE.Mesh(new THREE.CircleGeometry(R, 72), boxMat);
      bottom.rotation.x = -Math.PI / 2;
      const moss = new THREE.Mesh(new THREE.CircleGeometry(R - 0.02, 64), this.fixedMaterial("#5d7f48", 1));
      moss.rotation.x = -Math.PI / 2;
      moss.position.y = 0.8;
      this.holderG.add(body, bodyIn, lid, rim, bottom, moss);
      this.addSheet(this.collar(R * 0.98, 0.9, 0.42, 7), mats);
      const band = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.006, R + 0.006, 0.16, 72, 1, true), this.ribbonMat);
      band.position.y = 0.42;
      this.holderG.add(band);
      this.bowY = 0.42;
      this.bowAnchor.set(0, 0.42, R + 0.02);
    } else {
      const wicker = this.cached("wicker", () => {
        const map = this.texture("wicker", () => {
          const c = makeCanvas(256);
          drawWicker(c.getContext("2d")!, 256, 256);
          return c;
        });
        map.wrapS = map.wrapT = THREE.RepeatWrapping;
        map.repeat.set(5, 2);
        return new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 3, roughness: 0.9, side: THREE.DoubleSide });
      });
      const prof = [
        [0, 0], [0.72, 0], [0.82, 0.04], [0.92, 0.25], [1.04, 0.6], [R, 0.86],
      ].map(([x, y]) => new THREE.Vector2(x, y));
      const body = new THREE.Mesh(new THREE.LatheGeometry(prof, 64), wicker);
      const rimMat = this.cached("wicker-rim", () => {
        const m = (wicker as THREE.MeshStandardMaterial).clone();
        m.map = m.map!.clone();
        m.map.repeat.set(12, 0.3);
        m.map.needsUpdate = true;
        return m;
      });
      const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.055, 10, 96), rimMat);
      rim.rotation.x = Math.PI / 2;
      rim.position.y = 0.86;
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 24; i++) {
        const a = (i / 24) * Math.PI;
        pts.push(new THREE.Vector3(-Math.cos(a) * R, 0.86 + Math.sin(a) * (this.handleTop() - 0.86), 0));
      }
      const handle = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.05, 8, false), rimMat);
      const moss = new THREE.Mesh(new THREE.CircleGeometry(R - 0.05, 64), this.fixedMaterial("#5d7f48", 1));
      moss.rotation.x = -Math.PI / 2;
      moss.position.y = 0.8;
      this.holderG.add(body, rim, handle, moss);
      this.addSheet(this.collar(R * 0.97, 0.88, 0.32, 9), mats);
      this.bowY = this.handleTop() - 0.55;
      const a = Math.asin(Math.min(1, (this.bowY - 0.86) / (this.handleTop() - 0.86)));
      this.bowAnchor.set(-Math.cos(a) * R, this.bowY, 0.06);
    }
    this.buildBow();
  }

  /** A flat ribbon strip swept along a curve. `side` gives the width direction. */
  private strip(points: THREE.Vector3[], width: number, side: (t: number, tan: THREE.Vector3) => THREE.Vector3, closed = false) {
    const curve = new THREE.CatmullRomCurve3(points, closed, "centripetal");
    const n = 60;
    const pos: number[] = [], uv: number[] = [], idx: number[] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const p = curve.getPointAt(t);
      const tan = curve.getTangentAt(t);
      const s = side(t, tan).normalize().multiplyScalar(width / 2);
      pos.push(p.x - s.x, p.y - s.y, p.z - s.z, p.x + s.x, p.y + s.y, p.z + s.z);
      uv.push(0, t * 4, 1, t * 4);
    }
    for (let i = 0; i < n; i++) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }

  private buildBow() {
    const W = 0.13;
    const Z = new THREE.Vector3(0, 0, 1);
    const inPlane = (_t: number, tan: THREE.Vector3) => new THREE.Vector3().crossVectors(tan, Z);
    const loop = (dir: number) => {
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i < 14; i++) {
        const th = (i / 14) * Math.PI * 2;
        const c = 1 - Math.cos(th);
        pts.push(new THREE.Vector3(dir * 0.27 * c, 0.16 * Math.sin(th) + 0.06 * c, 0.05 * Math.sin(th * 0.5) + 0.04 * c));
      }
      return this.strip(pts, W, (t, tan) => inPlane(t, tan).lerp(Z, 0.35), true);
    };
    const tail = (dir: number) => {
      const pts = [
        new THREE.Vector3(0, 0, 0.02),
        new THREE.Vector3(dir * 0.08, -0.22, 0.05),
        new THREE.Vector3(dir * 0.14, -0.48, 0.03),
        new THREE.Vector3(dir * 0.24, -0.72, 0.08),
      ];
      return this.strip(pts, W * 0.95, (_t, tan) => new THREE.Vector3().crossVectors(tan, Z).lerp(Z, 0.15 * dir));
    };
    const knot = new THREE.SphereGeometry(0.075, 20, 14);
    knot.scale(1, 1.15, 0.7);
    knot.translate(0, 0, 0.03);
    for (const g of [loop(1), loop(-1), tail(1), tail(-1), knot]) this.bowG.add(new THREE.Mesh(g, this.ribbonMat));
  }

  /* ───────── loop ───────── */

  resize() {
    const w = this.host.clientWidth || 1, h = this.host.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    if (this.props) this.setProps(this.props);
  }

  setVisible(v: boolean) {
    if (v === this.visible) return;
    this.visible = v;
    if (v) {
      this.clock.getDelta();
      this.raf = requestAnimationFrame(this.loop);
    } else cancelAnimationFrame(this.raf);
  }

  private loop() {
    if (!this.visible) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, this.clock.getDelta());
    this.time += dt;
    const stemMode = this.props?.mode === "stem";

    for (const [k, st] of this.stems) {
      st.update(dt, stemMode);
      if (st.removing && st.growT <= 0) {
        st.removeFrom(this.flowersG);
        this.stems.delete(k);
      }
    }

    this.holderScale += (this.holderTarget - this.holderScale) * damp(dt, 4);
    this.holderG.scale.set(this.holderScale, 1, this.holderScale);
    const s = this.holderScale;
    this.bowG.position.set(this.bowAnchor.x * s, this.bowAnchor.y, this.bowAnchor.z * s + (s - 1) * 0.02);
    this.bowG.scale.setScalar(0.75 + 0.3 * s);
    this.ribbonMat.color.lerp(this.ribbonTarget, damp(dt, 6));

    // Idle motion: gentle sway for the bouquet, slow turntable for a single stem
    if (!this.userActive && this.time - this.idleAt > 4) this.sway = Math.min(1, this.sway + dt * 0.5);
    if (this.userActive) this.sway = Math.max(0, this.sway - dt * 3);
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      if (stemMode) {
        this.spin += dt * 0.55 * this.sway;
        this.root.rotation.y = this.spin;
      } else {
        this.spin = this.root.rotation.y;
        const want = Math.sin(this.time * 0.45) * 0.5 * this.sway;
        let cur = this.root.rotation.y % (Math.PI * 2);
        if (cur > Math.PI) cur -= Math.PI * 2;
        if (cur < -Math.PI) cur += Math.PI * 2;
        this.root.rotation.y = cur + (want - cur) * damp(dt, 2);
      }
    }

    if (this.time < this.tweenUntil && !this.userActive) {
      const k = damp(dt, 3.5);
      this.controls.target.lerp(this.camTarget, k);
      const off = this.camera.position.clone().sub(this.controls.target);
      const len = off.length() + (this.camDist - off.length()) * k;
      // ease the elevation toward a slightly-above view
      const sph = new THREE.Spherical().setFromVector3(off);
      sph.radius = len;
      sph.phi += ((stemMode ? 1.12 : 1.32) - sph.phi) * k;
      this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(sph));
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    cancelAnimationFrame(this.raf);
    this.visible = false;
    this.ro.disconnect();
    this.controls.dispose();
    this.clearGroup(this.holderG);
    this.clearGroup(this.bowG);
    this.mats.forEach((m) => m.dispose());
    this.tex.forEach((t) => t.dispose());
    this.stemGeo.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
