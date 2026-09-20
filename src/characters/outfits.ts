import * as THREE from "three";
import { makeCanvas, mulberry32 as mulberry, texFrom } from "../world/Materials";
import type { CharacterDef } from "../data/types";
import { ANATOMY, ellipsoid, limbMesh, tubeMesh, type Joints } from "./Body";
import { buildFace, type BeardKind } from "./Face";
import { buildHair, type HairStyleName } from "./Hair";
import * as G from "./garments";

/**
 * OKAP CITY — rad, cheve ak akseswa pou chak pèsonaj (orijinal, pa kopi).
 *
 * Chak rad koupe selon pwofil kò a (wè `garments.ts`) — pa gen bwat
 * rektangilè ki flote sou kò a.
 */

export const mulberry32 = mulberry;

/* ------------------------------------------------------------------ *
 * Twal ak po (teksti jenere an kòd)
 * ------------------------------------------------------------------ */

function noiseOverlay(ctx: CanvasRenderingContext2D, size: number, amount: number, seed: number) {
  const img = ctx.getImageData(0, 0, size, size);
  const rand = mulberry32(seed);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rand() - 0.5) * amount;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  ctx.putImageData(img, 0, 0);
}

/** Twal senp: koulè + fil + pli. */
export function paintFabric(
  size: number,
  base: string,
  opts: { seed?: number; band?: string; bandAt?: number; bandH?: number; weave?: number } = {},
) {
  const { c, ctx } = makeCanvas(size);
  const seed = opts.seed ?? 5;
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const rand = mulberry32(seed);
  for (let i = 0; i < 1400; i++) {
    ctx.strokeStyle = `rgba(255,255,255,${0.012 + rand() * 0.028})`;
    ctx.lineWidth = 0.6;
    const y = rand() * size;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (rand() - 0.5) * 2);
    ctx.stroke();
  }
  for (let i = 0; i < 900; i++) {
    ctx.strokeStyle = `rgba(0,0,0,${0.015 + rand() * 0.04})`;
    ctx.lineWidth = 0.5;
    const x = rand() * size;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + (rand() - 0.5) * 2, size);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.16;
  for (let i = 0; i < 16; i++) {
    const g = ctx.createLinearGradient(0, rand() * size, 0, rand() * size + 40);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(0.5, "rgba(0,0,0,0.5)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(rand() * size, 0, 12 + rand() * 36, size);
  }
  ctx.globalAlpha = 1;
  if (opts.band) {
    const at = opts.bandAt ?? 0.86;
    const h = opts.bandH ?? 0.06;
    ctx.fillStyle = opts.band;
    ctx.fillRect(0, size * at, size, size * h);
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, size * at, size, size * h);
  }
  noiseOverlay(ctx, size, opts.weave ?? 11, seed + 7);
  return c;
}

export function paintCamoFabric(size: number, base: string, seed = 11) {
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  const rand = mulberry32(seed);
  const tones = ["#3d4430", "#7a7a55", "#25291d", "#98986f", "#565744", "#1c1f16"];
  for (let i = 0; i < 130; i++) {
    ctx.fillStyle = tones[i % tones.length];
    ctx.globalAlpha = 0.75 + rand() * 0.25;
    const x = rand() * size;
    const y = rand() * size;
    ctx.beginPath();
    for (let k = 0; k <= 9; k++) {
      const a = (k / 9) * Math.PI * 2;
      const r = 9 + rand() * 26;
      const px = x + Math.cos(a) * r * (0.65 + rand() * 0.7);
      const py = y + Math.sin(a) * r * (0.65 + rand() * 0.7);
      if (k === 0) ctx.moveTo(px, py);
      else ctx.quadraticCurveTo(x, y, px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  noiseOverlay(ctx, size, 16, seed + 3);
  return c;
}

/** Po: ti tach natirèl, porositè, ak yon ti chalè wouj. */
export function paintSkin(size = 256, seed = 3) {
  const { c, ctx } = makeCanvas(size);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);
  const rand = mulberry32(seed);
  for (let i = 0; i < 90; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const r = 8 + rand() * 34;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const a = 0.03 + rand() * 0.05;
    g.addColorStop(0, rand() > 0.45 ? `rgba(122,70,52,${a})` : `rgba(255,224,200,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  for (let i = 0; i < 2600; i++) {
    ctx.fillStyle = `rgba(90,60,45,${0.02 + rand() * 0.05})`;
    ctx.fillRect(rand() * size, rand() * size, 1, 1);
  }
  return c;
}

/** Drapo Ayiti (pou patch sou sak do a). */
export function paintHaitiFlag(size = 128) {
  const { c } = makeCanvas(size, Math.floor(size * 0.6));
  const h = Math.floor(size * 0.6);
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#00209f";
  ctx.fillRect(0, 0, size, h / 2);
  ctx.fillStyle = "#d21034";
  ctx.fillRect(0, h / 2, size, h / 2);
  ctx.fillStyle = "#f1faee";
  ctx.fillRect(size * 0.42, h * 0.33, size * 0.16, h * 0.34);
  ctx.fillStyle = "#2f6b3a";
  ctx.beginPath();
  ctx.arc(size * 0.5, h * 0.5, size * 0.035, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

/** Enprime (transparan) pou dekoupaj sou rad. */
export function paintPrint(text: string, sub: string, color = "#f6f3ea", subColor = "#d4a017", size = 512) {
  const { c } = makeCanvas(size, Math.floor(size * 0.5));
  const ctx = c.getContext("2d")!;
  const h = size * 0.5;
  ctx.clearRect(0, 0, size, h);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.font = `bold ${Math.floor(h * 0.52)}px "Segoe UI", Arial, sans-serif`;
  ctx.fillText(text, size / 2, h * 0.4);
  if (sub) {
    ctx.fillStyle = subColor;
    ctx.font = `bold ${Math.floor(h * 0.2)}px "Segoe UI", Arial, sans-serif`;
    ctx.fillText(sub, size / 2, h * 0.76);
  }
  return c;
}

/* ------------------------------------------------------------------ *
 * Materyèl
 * ------------------------------------------------------------------ */

const matCache = new Map<string, THREE.Material>();

export function fabricMat(key: string, canvas: HTMLCanvasElement, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const hit = matCache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({
    map: texFrom(canvas, 1),
    roughness: 0.85,
    metalness: 0.02,
    envMapIntensity: 0.4,
    ...opts,
  });
  matCache.set(key, m);
  return m;
}

export function plainMaterial(key: string, color: string | number, opts: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  const k = `${key}-${String(color)}`;
  const hit = matCache.get(k);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({
    color: color as THREE.ColorRepresentation,
    roughness: 0.72,
    metalness: 0.03,
    envMapIntensity: 0.4,
    ...opts,
  });
  matCache.set(k, m);
  return m;
}

let skinTexCache: THREE.CanvasTexture | null = null;

/** Po reyalis: ti detay sifas + reflets dou. */
export function skinDetailMaterial(color: string | number) {
  const key = `skin-detail-${String(color)}`;
  const hit = matCache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  if (!skinTexCache) skinTexCache = texFrom(paintSkin(256, 3), 1);
  const m = new THREE.MeshStandardMaterial({
    color: color as THREE.ColorRepresentation,
    map: skinTexCache,
    roughness: 0.48,
    metalness: 0,
    envMapIntensity: 0.6,
  });
  matCache.set(key, m);
  return m;
}

export function skinMaterial(skin: string) {
  return skinDetailMaterial(skin);
}

export function goldMaterial() {
  const hit = matCache.get("gold");
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({ color: 0xd8a520, roughness: 0.24, metalness: 1, envMapIntensity: 1.5 });
  matCache.set("gold", m);
  return m;
}

export function lensMaterial(tint = 0x14181f) {
  return plainMaterial("lens", tint, { roughness: 0.05, metalness: 0.85, envMapIntensity: 2 });
}

export function leatherMaterial(key: string, color: number) {
  return fabricMat(key, paintFabric(128, "#" + color.toString(16).padStart(6, "0"), { seed: 9, weave: 6 }), {
    roughness: 0.55,
    metalness: 0.05,
    envMapIntensity: 0.5,
  });
}

function decalMaterial(key: string, canvas: HTMLCanvasElement) {
  const hit = matCache.get(key);
  if (hit) return hit as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({
    map: texFrom(canvas, 1, true),
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.82,
    metalness: 0,
    envMapIntensity: 0.3,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  matCache.set(key, m);
  return m;
}

/* ------------------------------------------------------------------ *
 * Espesifikasyon rad (dapre fich konsepsyon an)
 * ------------------------------------------------------------------ */

export interface OutfitSpec {
  build: "male" | "maleLean" | "maleBroad" | "female" | "femaleTall";
  top: {
    kind: "bomber" | "tee" | "hoodie" | "varsity" | "tactical" | "sport" | "crop" | "jacket";
    color: string;
    accent: string;
    /** Dezyèm koulè (manch, pans) */
    second?: string;
    sleeves: "long" | "short" | "none";
    hood?: boolean;
    camo?: boolean;
    print?: { text: string; sub: string; color?: string };
    /** Kouch anba (tricot, mayo) */
    under?: { kind: "tee" | "tank" | "crop" | "none"; color: string };
  };
  bottom: { color: string; accent: string; cargo?: boolean; shorts?: boolean; camo?: boolean; belt?: number };
  shoes: { color: string; sole: string; boot?: boolean; highTop?: boolean; accent?: number };
  face: { beard?: BeardKind; eye?: number; lips?: string; feminine?: boolean };
  hair: { style: HairStyleName; color: string; accent?: string };
  acc: string[];
}

export const OUTFITS: Record<string, OutfitSpec> = {
  // Junior — jèn lari, jakèt nwa ak mayo blan OKAP CITY, chèn an lò
  junior: {
    build: "maleLean",
    top: {
      kind: "bomber",
      color: "#22262c",
      accent: "#c9a227",
      second: "#15181d",
      sleeves: "long",
      under: { kind: "tee", color: "#f4f1e8" },
      print: { text: "OKAP", sub: "CITY" },
    },
    bottom: { color: "#191c21", accent: "#2b3038", cargo: true, belt: 0x14161a },
    shoes: { color: "#15171b", sole: "#e6e1d5", highTop: true, accent: 0xd8a520 },
    face: { beard: "stubble", eye: 0x2f1e12, lips: "#6d3a30" },
    hair: { style: "curlsFade", color: "#160f0a" },
    acc: ["chain", "gloves", "backpack", "flag", "watch"],
  },
  // David — vye sòlda, vès taktik oliv ak kamou, kas nwa
  david: {
    build: "maleBroad",
    top: {
      kind: "tactical",
      color: "#5b5b41",
      accent: "#3f4029",
      second: "#4a4a33",
      sleeves: "none",
      camo: true,
      under: { kind: "tank", color: "#33351f" },
    },
    bottom: { color: "#464733", accent: "#2f3022", cargo: true, camo: true, belt: 0x2a2a1c },
    shoes: { color: "#2b2419", sole: "#181410", boot: true },
    face: { beard: "full", eye: 0x2a1c10, lips: "#5f342c" },
    hair: { style: "buzz", color: "#1c130c" },
    acc: ["cap-logo", "sunglasses", "gloves", "sling", "pouch"],
  },
  // Kendy — kourè, kapichò wouj ak jakèt varzite, bando wouj
  kendy: {
    build: "maleLean",
    top: {
      kind: "varsity",
      color: "#b8111f",
      accent: "#f2efe6",
      second: "#171a1f",
      sleeves: "long",
      hood: false,
      under: { kind: "tee", color: "#c1131f" },
    },
    bottom: { color: "#14161a", accent: "#242830", belt: 0x0f1114 },
    shoes: { color: "#f2efe6", sole: "#cfcabc", highTop: false },
    face: { eye: 0x2b1a10, lips: "#6b3a30" },
    hair: { style: "twistsShort", color: "#120d09" },
    acc: ["headband", "gloves", "backpack", "flag"],
  },
  // Mika — gad pò a, ble, dreadlocks long, linèt miron
  mika: {
    build: "male",
    top: {
      kind: "jacket",
      color: "#1d4ed8",
      accent: "#cfe6ff",
      second: "#14327f",
      sleeves: "long",
      under: { kind: "tee", color: "#2b6fd6" },
    },
    bottom: { color: "#111827", accent: "#1f2937", cargo: true, belt: 0x0d1017 },
    shoes: { color: "#161a20", sole: "#e9e4d8", highTop: true, accent: 0x2b6fd6 },
    face: { beard: "short", eye: 0x241608, lips: "#5d332b" },
    hair: { style: "locsLong", color: "#120c07" },
    acc: ["sunglasses-mirror", "chain", "backpack", "gloves", "flag"],
  },
  // Vanessa — machann, tèt bandana jòn, gwo cheve afro
  vanessa: {
    build: "female",
    top: {
      kind: "crop",
      color: "#f2c200",
      accent: "#141414",
      sleeves: "short",
      print: { text: "OKAP", sub: "VIV PI BÈL" },
    },
    bottom: { color: "#20242b", accent: "#33383f", cargo: true, shorts: false, belt: 0x14161a },
    shoes: { color: "#efe9dc", sole: "#cbc4b3", highTop: false, accent: 0xf2c200 },
    face: { eye: 0x3a2412, lips: "#8a4436", feminine: true },
    hair: { style: "afroBig", color: "#26150b" },
    acc: ["bandana", "hoops", "gloves", "backpack", "harness", "watch"],
  },
  // Sarah — pilòt, tòp espò nwa/woz, braid long
  sarah: {
    build: "female",
    top: {
      kind: "sport",
      color: "#1a1a1e",
      accent: "#e0568c",
      second: "#e0568c",
      sleeves: "long",
      print: { text: "SPORT", sub: "OKAP" },
    },
    bottom: { color: "#17171b", accent: "#e0568c", cargo: true, shorts: false, belt: 0x101013 },
    shoes: { color: "#1c1c21", sole: "#f0e9dd", highTop: true, accent: 0xe0568c },
    face: { eye: 0x2f1d10, lips: "#9c4a3c", feminine: true },
    hair: { style: "braidsLong", color: "#241207", accent: "#e0568c" },
    acc: ["gloves", "backpack", "watch", "harness"],
  },
  // Naomi — atis, kostim espò ble, chokè, goggles sou tèt
  naomi: {
    build: "femaleTall",
    top: {
      kind: "sport",
      color: "#2f7fd1",
      accent: "#0f2a49",
      second: "#0f2a49",
      sleeves: "long",
      print: { text: "NAOMI", sub: "OKAP" },
    },
    bottom: { color: "#141920", accent: "#2a3240", cargo: true, belt: 0x0f1216 },
    shoes: { color: "#f5f2ea", sole: "#ccc6b8", highTop: true, accent: 0x2f7fd1 },
    face: { eye: 0x331f10, lips: "#7d3b31", feminine: true },
    hair: { style: "curlsMed", color: "#18100a" },
    acc: ["goggles", "choker", "gloves", "backpack", "flag", "harness"],
  },
  // Ruth — lidè, vyolèt ak nwa, kas vyolèt, cheve long
  ruth: {
    build: "femaleTall",
    top: {
      kind: "jacket",
      color: "#4b2e6b",
      accent: "#c9a227",
      second: "#2a1840",
      sleeves: "long",
      under: { kind: "crop", color: "#1a1224" },
    },
    bottom: { color: "#1c1224", accent: "#392a4a", cargo: true, belt: 0x150e1c },
    shoes: { color: "#251a2d", sole: "#d8d2c4", boot: true, accent: 0x6b4c93 },
    face: { eye: 0x301c0e, lips: "#7d3a34", feminine: true },
    hair: { style: "wavyLong", color: "#120d0a" },
    acc: ["cap", "chain", "gloves", "backpack", "harness"],
  },
};

/* ------------------------------------------------------------------ *
 * Bwat zouti rad
 * ------------------------------------------------------------------ */

export interface DressedRig {
  clothing: THREE.Group;
  weaponBone: THREE.Group;
  supportBone: THREE.Group;
  hairGroup: THREE.Group;
}

function underLayer(j: Joints, spec: OutfitSpec, under: NonNullable<OutfitSpec["top"]["under"]>) {
  if (under.kind === "none") return;
  const mat = fabricMat(`under-${spec.top.color}-${under.kind}`, paintFabric(256, under.color, { seed: 4 }));
  G.torsoShell(j, mat, { from: ANATOMY.hipY - 0.16, to: ANATOMY.neckY - 0.01, inflate: 1.035, steps: 6 });
  if (under.kind === "tee") {
    G.sleeve(j, mat, { inflate: 1.12, short: true });
  }
}

function addPrint(j: Joints, print: NonNullable<OutfitSpec["top"]["print"]>, z: number, matKey: string) {
  const canvas = paintPrint(print.text, print.sub, print.color ?? "#f6f3ea", "#d4a017");
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.075), decalMaterial(`print-${matKey}`, canvas));
  mesh.position.set(0, -0.01, z);
  mesh.rotation.y = Math.PI;
  j.chest.add(mesh);
}

function buildTop(j: Joints, spec: OutfitSpec, def: CharacterDef, key: string) {
  const t = spec.top;
  const isCamo = !!t.camo;
  const canvas = isCamo
    ? paintCamoFabric(256, t.color, 11)
    : paintFabric(256, t.color, { seed: 3, weave: 10 });
  const mat = fabricMat(`${key}-top`, canvas, { roughness: isCamo ? 0.92 : 0.8 });
  const accentMat = plainMaterial(`${key}-accent`, t.accent, { roughness: 0.7 });
  const secondMat = plainMaterial(`${key}-second`, t.second ?? t.accent, { roughness: 0.75 });

  if (t.under) underLayer(j, spec, t.under);

  switch (t.kind) {
    case "bomber": {
      G.torsoShell(j, mat, { from: ANATOMY.hipY - 0.1, to: ANATOMY.neckY - 0.02, inflate: 1.11, steps: 7 });
      G.collar(j, accentMat, { height: 0.07, radius: 0.07 });
      G.sleeve(j, secondMat, { inflate: 1.2, long: true, cuff: accentMat });
      // zip devan
      const zip = plainMaterial(`${key}-zip`, 0xf0d27a, { roughness: 0.35, metalness: 0.8 });
      const zipStrip = limbMesh(
        [
          [0.007, -0.2],
          [0.007, 0.2],
        ],
        zip,
        0.6,
        6,
      );
      zipStrip.position.set(0, -0.04, -(j.body.chestD * 0.78));
      j.chest.add(zipStrip);
      const hem = tubeMesh(0.155, 0.16, 0.055, secondMat, true, 1, 0.72);
      hem.position.y = ANATOMY.hipY - 0.06 - ANATOMY.hipY;
      j.pelvis.add(hem);
      if (t.print) addPrint(j, t.print, -(j.body.chestD * 1.06), `${key}-print`);
      break;
    }
    case "tee": {
      G.torsoShell(j, mat, { from: ANATOMY.hipY - 0.06, to: ANATOMY.neckY - 0.02, inflate: 1.06, steps: 6 });
      G.collar(j, accentMat, { height: 0.045, radius: 0.058 });
      G.sleeve(j, mat, { inflate: 1.14, short: true });
      if (t.print) addPrint(j, t.print, -(j.body.chestD * 0.94), `${key}-print`);
      break;
    }
    case "hoodie": {
      G.torsoShell(j, mat, { from: ANATOMY.hipY - 0.14, to: ANATOMY.neckY - 0.01, inflate: 1.13, steps: 7 });
      G.hood(j, mat);
      G.sleeve(j, mat, { inflate: 1.2, long: true, cuff: secondMat });
      const pocket = ellipsoid(0.11, 0.06, 0.05, secondMat, true);
      pocket.position.set(t.print ? 0 : 0, ANATOMY.waistY - ANATOMY.chestY + 0.02, -(j.body.chestD * 0.86));
      j.chest.add(pocket);
      if (t.print) addPrint(j, t.print, -(j.body.chestD * 0.98), `${key}-print`);
      break;
    }
    case "varsity": {
      G.torsoShell(j, mat, { from: ANATOMY.hipY - 0.12, to: ANATOMY.neckY - 0.02, inflate: 1.12, steps: 7 });
      G.collar(j, secondMat, { height: 0.07, radius: 0.068 });
      G.sleeve(j, secondMat, { inflate: 1.2, long: true, cuff: accentMat });
      const placket = limbMesh(
        [
          [0.012, -0.2],
          [0.012, 0.2],
        ],
        accentMat,
        0.4,
        6,
      );
      placket.position.set(0, -0.04, -(j.body.chestD * 0.8));
      j.chest.add(placket);
      const hem = tubeMesh(0.152, 0.158, 0.05, secondMat, true, 1, 0.72);
      hem.position.y = ANATOMY.hipY - 0.08 - ANATOMY.hipY;
      j.pelvis.add(hem);
      break;
    }
    case "jacket":
    case "crop": {
      const hemY = t.kind === "crop" ? ANATOMY.waistY + 0.02 : ANATOMY.hipY - 0.12;
      G.torsoShell(j, mat, { from: hemY, to: ANATOMY.neckY - 0.015, inflate: t.kind === "crop" ? 1.07 : 1.12, steps: 6 });
      G.collar(j, accentMat, { height: 0.055, radius: 0.062 });
      G.sleeve(j, mat, { inflate: 1.18, long: t.sleeves === "long", short: t.sleeves === "short", cuff: accentMat });
      if (t.kind === "crop") {
        const trim = tubeMesh(0.15, 0.152, 0.035, accentMat, true, 1, 0.72);
        trim.position.y = hemY - ANATOMY.waistY;
        j.spine.add(trim);
      }
      if (t.print) addPrint(j, t.print, -(j.body.chestD * 0.98), `${key}-print`);
      break;
    }
    case "sport": {
      const hemY = ANATOMY.waistY + 0.0;
      G.torsoShell(j, mat, { from: hemY, to: ANATOMY.neckY - 0.02, inflate: 1.07, steps: 6 });
      G.sleeve(j, secondMat, { inflate: 1.16, long: t.sleeves === "long", cuff: accentMat });
      G.shoulderPads(j, accentMat);
      const trim = tubeMesh(0.15, 0.152, 0.03, accentMat, true, 1, 0.72);
      trim.position.y = hemY - ANATOMY.waistY + 0.012;
      j.spine.add(trim);
      if (t.print) addPrint(j, t.print, -(j.body.chestD * 0.96), `${key}-print`);
      break;
    }
    case "tactical": {
      // mayo anba + vès taktik
      const vestMat = fabricMat(`${key}-vest`, paintCamoFabric(256, t.color, 5), { roughness: 0.92 });
      G.torsoShell(j, vestMat, { from: ANATOMY.hipY - 0.08, to: ANATOMY.shoulderY + 0.02, inflate: 1.14, steps: 6 });
      G.chestRig(j, plainMaterial(`${key}-pouch`, t.accent, { roughness: 0.9 }), { pouches: 5 });
      const collarV = tubeMesh(0.062, 0.07, 0.05, vestMat, true, 1, 0.9);
      collarV.position.y = ANATOMY.neckY - ANATOMY.chestY - 0.03;
      j.chest.add(collarV);
      break;
    }
  }
  void def;
}

function buildBottom(j: Joints, spec: OutfitSpec, key: string) {
  const b = spec.bottom;
  const canvas = b.camo ? paintCamoFabric(256, b.color, 23) : paintFabric(256, b.color, { seed: 21, weave: 12 });
  const mat = fabricMat(`${key}-pants`, canvas, { roughness: 0.88 });
  const accent = plainMaterial(`${key}-pants-accent`, b.accent, { roughness: 0.85 });
  G.pantsShell(j, mat, { cargo: b.cargo, shorts: b.shorts, inflate: 1.13, cuff: accent });
  if (b.belt !== undefined) {
    const beltMat = plainMaterial(`${key}-belt`, b.belt, { roughness: 0.6 });
    const belt = tubeMesh(j.body.hipW * 1.16, j.body.hipW * 1.2, 0.06, beltMat, true, 1, 0.78);
    belt.position.y = 0.07;
    j.pelvis.add(belt);
    const buckle = ellipsoid(0.022, 0.016, 0.012, goldMaterial(), false);
    buckle.position.set(0, 0.07, -(j.body.hipW * 0.8));
    j.pelvis.add(buckle);
  }
}

/* ------------------------------------------------------------------ *
 * Abiye yon eskèlèt ki deja bati
 * ------------------------------------------------------------------ */

export function dressCharacter(j: Joints, def: CharacterDef, variant = 0, detail: "high" | "low" = "high"): DressedRig {
  const spec = OUTFITS[def.id] ?? OUTFITS.junior;
  const key = `${def.id}-${variant}`;
  const clothing = new THREE.Group();
  clothing.name = "clothing";
  j.root.add(clothing);

  /* ---- figi ---- */
  if (detail === "high") {
    buildFace(j.head, {
      skin: def.skin,
      eyeColor: spec.face.eye,
      browColor: spec.hair.color,
      lipsColor: spec.face.lips,
      beard: spec.face.beard,
      beardColor: spec.hair.color,
      feminine: spec.face.feminine,
    });
  }

  /* ---- rad ---- */
  buildTop(j, spec, def, key);
  buildBottom(j, spec, key);

  const shoeMat = leatherMaterial(`${key}-shoe`, parseInt(spec.shoes.color.slice(1), 16));
  const soleMat = plainMaterial(`${key}-sole`, parseInt(spec.shoes.sole.slice(1), 16), { roughness: 0.9 });
  const accentShoe = spec.shoes.accent !== undefined ? plainMaterial(`${key}-shoe-accent`, spec.shoes.accent, { roughness: 0.7 }) : undefined;
  G.shoes(j, shoeMat, soleMat, { boot: spec.shoes.boot, highTop: spec.shoes.highTop, color: accentShoe });

  if (spec.acc.includes("gloves")) {
    G.gloves(j, leatherMaterial(`${key}-glove`, 0x16181c), { fingerless: false });
  }

  /* ---- cheve ---- */
  const hair = buildHair({ style: spec.hair.style, color: spec.hair.color, accent: spec.hair.accent });
  j.head.add(hair);

  /* ---- akseswa ---- */
  const gold = goldMaterial();
  const darkMat = plainMaterial(`${key}-dark`, 0x15181d, { roughness: 0.5, metalness: 0.3 });
  let capCovered = false;
  for (const a of spec.acc) {
    switch (a) {
      case "cap":
      case "cap-logo":
        G.cap(j, plainMaterial(`${key}-cap`, spec.top.kind === "tactical" ? 0x1b1c17 : spec.top.color, { roughness: 0.82 }), {
          logoMat: gold,
          logo: a === "cap-logo" ? "okap" : undefined,
        });
        capCovered = true;
        break;
      case "bandana":
        G.bandana(j, plainMaterial(`${key}-bandana`, spec.top.color, { roughness: 0.8 }), { y: 0.055 });
        break;
      case "headband":
        G.bandana(j, plainMaterial(`${key}-headband`, 0xc1121f, { roughness: 0.8 }), { y: 0.062, knot: false });
        break;
      case "sunglasses":
        G.sunglasses(j, lensMaterial(0x1a2430), plainMaterial(`${key}-frame`, 0x101215, { roughness: 0.4, metalness: 0.4 }));
        break;
      case "sunglasses-mirror":
        G.sunglasses(j, lensMaterial(0x2b6fd6), plainMaterial(`${key}-frame`, 0x0e1013, { roughness: 0.35, metalness: 0.5 }), {
          mirrored: true,
        });
        break;
      case "goggles":
        G.goggles(j, plainMaterial(`${key}-goggle-strap`, 0x1a1c20, { roughness: 0.7 }), lensMaterial(0x9fd8ff));
        break;
      case "hoops":
        G.hoops(j, gold);
        break;
      case "choker":
        G.choker(j, darkMat);
        break;
      case "chain":
        G.chain(j, gold, { pendant: true });
        break;
      case "watch":
        G.watch(j, gold);
        break;
      case "harness":
        G.harness(j, plainMaterial(`${key}-harness`, 0x1b1e23, { roughness: 0.6, metalness: 0.15 }));
        break;
      case "backpack": {
        const canvas = paintFabric(256, "#20242a", { seed: 33, band: "#2f3540", bandAt: 0.2, bandH: 0.08 });
        const packMat = fabricMat(`${key}-pack`, canvas, { roughness: 0.9 });
        const flagMat = spec.acc.includes("flag")
          ? new THREE.MeshStandardMaterial({ map: texFrom(paintHaitiFlag(128), 1), roughness: 0.78, envMapIntensity: 0.35 })
          : undefined;
        G.backpack(j, packMat, { flagMat, size: def.gender === "fi" ? 0.92 : 1, pockets: true });
        break;
      }
      case "sling":
        G.shoulderPads(j, leatherMaterial(`${key}-sling`, 0x2f2c24));
        break;
      default:
        break;
    }
  }
  if (capCovered && hair) hair.visible = true; // chapo a chita sou cheve a (pa gen klip)

  /* ---- bone zam ---- */
  const weaponBone = new THREE.Group();
  weaponBone.position.set(0, -0.075, -0.02);
  j.wristR.add(weaponBone);
  const supportBone = new THREE.Group();
  supportBone.position.set(0, -0.075, -0.012);
  j.wristL.add(supportBone);

  return { clothing, weaponBone, supportBone, hairGroup: hair };
}

export function clearOutfitCache() {
  matCache.clear();
  skinTexCache = null;
}
