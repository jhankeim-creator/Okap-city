import * as THREE from "three";
import { ANATOMY } from "./Body";
import { mulberry32, plainMaterial } from "./outfits";

/**
 * OKAP CITY — cheve orijinal pou chak pèsonaj.
 * Tout stil yo bati ak grenn (curls), fil (locs) ak branch (braids) pou
 * yo genyen volim reyèl olye de yon boul plat sou tèt la.
 */

export type HairStyleName =
  | "curlsFade"
  | "curlsShort"
  | "twistsShort"
  | "locsLong"
  | "afroBig"
  | "braidsLong"
  | "curlsMed"
  | "wavyLong"
  | "buzz";

const W = ANATOMY.headWidth;
const H = ANATOMY.headHeight;
const D = ANATOMY.headDepth;

interface Shell {
  x: number;
  y: number;
  z: number;
  nx: number;
  ny: number;
  nz: number;
}

/** Pwen o aza sou yon koki ki antoure kran an. */
function shellPoint(rand: () => number, inflate: number, region: (p: Shell) => boolean): Shell | null {
  for (let i = 0; i < 60; i++) {
    const u = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const s = Math.sqrt(1 - u * u);
    const nx = s * Math.cos(phi);
    const ny = u;
    const nz = s * Math.sin(phi);
    const p: Shell = {
      nx,
      ny,
      nz,
      x: nx * W * inflate,
      y: ny * H * inflate + 0.012,
      z: nz * D * inflate,
    };
    if (region(p)) return p;
  }
  return null;
}

const topRegion = (p: Shell) => p.y > -H * 0.15;
const backRegion = (p: Shell) => p.z > -D * 0.15;
const sideRegion = (p: Shell) => Math.abs(p.nx) > 0.45 && p.y < H * 0.25;

/** Kouch baz: koki cheve sou tèt la. */
function scalpShell(mat: THREE.Material, coverage: number, thickness = 1.03) {
  const geo = new THREE.SphereGeometry(1, 26, 20, 0, Math.PI * 2, 0, Math.PI * coverage);
  const m = new THREE.Mesh(geo, mat);
  m.scale.set(W * thickness, H * thickness, D * thickness);
  m.position.y = 0.012;
  m.rotation.x = 0.08;
  m.castShadow = false;
  m.receiveShadow = false;
  return m;
}

function curls(mat: THREE.Material, count: number, radius: number, inflate: number, seed: number, region = topRegion) {
  const geo = new THREE.SphereGeometry(radius, 8, 6);
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const rand = mulberry32(seed);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  let n = 0;
  for (let i = 0; i < count; i++) {
    const p = shellPoint(rand, inflate, region);
    if (!p) continue;
    const sc = 0.75 + rand() * 0.7;
    s.set(sc, sc * (0.85 + rand() * 0.4), sc * (0.85 + rand() * 0.3));
    q.setFromEuler(new THREE.Euler(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI));
    m.compose(new THREE.Vector3(p.x, p.y, p.z), q, s);
    inst.setMatrixAt(n++, m);
  }
  inst.count = n;
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = false;
  return inst;
}

function strands(
  mat: THREE.Material,
  count: number,
  len: number,
  radius: number,
  seed: number,
  opts: { outward?: number; curve?: number; region?: (p: Shell) => boolean; accentMat?: THREE.Material; accentEvery?: number } = {},
) {
  const outward = opts.outward ?? 1.02;
  const geo = new THREE.CylinderGeometry(radius * 1.05, radius * 0.5, len, 5, 1);
  geo.translate(0, -len / 2, 0); // pive anwo
  const inst = new THREE.InstancedMesh(geo, mat, count);
  const rand = mulberry32(seed);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const one = new THREE.Vector3(1, 1, 1);
  let n = 0;
  for (let i = 0; i < count; i++) {
    const p = shellPoint(rand, outward, opts.region ?? topRegion);
    if (!p) continue;
    const tilt = 0.25 + rand() * 0.5;
    const dir = Math.atan2(p.nx, p.nz);
    q.setFromEuler(new THREE.Euler(tilt * Math.cos(dir), 0, -tilt * Math.sin(dir)));
    const l = len * (0.72 + rand() * 0.55);
    m.compose(new THREE.Vector3(p.x, p.y, p.z), q, new THREE.Vector3(1, l / len, 1));
    inst.setMatrixAt(n++, m);
  }
  inst.count = n;
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = false;
  void one;
  const group = new THREE.Group();
  group.add(inst);

  if (opts.accentMat && opts.accentEvery) {
    const accentCount = Math.max(2, Math.round(count / opts.accentEvery));
    const inst2 = new THREE.InstancedMesh(geo, opts.accentMat, accentCount);
    let k = 0;
    const rand2 = mulberry32(seed + 91);
    for (let i = 0; i < accentCount; i++) {
      const p = shellPoint(rand2, outward, opts.region ?? topRegion);
      if (!p) continue;
      const tilt = 0.3 + rand2() * 0.4;
      const dir = Math.atan2(p.nx, p.nz);
      q.setFromEuler(new THREE.Euler(tilt * Math.cos(dir), 0, -tilt * Math.sin(dir)));
      const l = len * (0.7 + rand2() * 0.5);
      const offset = 0.012;
      m.compose(
        new THREE.Vector3(p.x + Math.cos(dir) * offset, p.y, p.z - Math.sin(dir) * offset),
        q,
        new THREE.Vector3(1, l / len, 1),
      );
      inst2.setMatrixAt(k++, m);
    }
    inst2.count = k;
    inst2.instanceMatrix.needsUpdate = true;
    inst2.castShadow = false;
    group.add(inst2);
  }
  return group;
}

export interface HairOptions {
  style: HairStyleName;
  color: string;
  /** Koulè dezyèm (pou tòsad, reflets) */
  accent?: string;
  hatSpace?: boolean;
}

/** Bati cheve yo epi retounen gwoup la (pou ka kache l si bouchon). */
export function buildHair(opts: HairOptions): THREE.Group {
  const g = new THREE.Group();
  g.name = "hair";
  const mat = plainMaterial(`hair-${opts.color}`, opts.color, { roughness: 0.72, metalness: 0.05, envMapIntensity: 0.4 });
  const accentMat = opts.accent
    ? plainMaterial(`hair-accent-${opts.accent}`, opts.accent, { roughness: 0.72, metalness: 0.05, envMapIntensity: 0.4 })
    : undefined;

  switch (opts.style) {
    case "buzz":
      g.add(scalpShell(mat, 0.42, 1.015));
      break;
    case "curlsFade":
      // bò yo koupe (fade), anwo a gen boukè
      g.add(scalpShell(mat, 0.34, 1.012));
      g.add(curls(mat, 190, 0.0105, 1.07, 11, (p) => p.y > H * 0.16 || (p.ny > 0.25 && p.z < D * 0.2)));
      break;
    case "curlsShort":
      g.add(scalpShell(mat, 0.46, 1.02));
      g.add(curls(mat, 220, 0.0125, 1.06, 23, (p) => p.y > -H * 0.05));
      break;
    case "twistsShort":
      g.add(scalpShell(mat, 0.5, 1.02));
      g.add(curls(mat, 120, 0.009, 1.05, 31, topRegion));
      g.add(strands(mat, 90, 0.12, 0.0072, 37, { outward: 1.06, region: (p) => p.y > -H * 0.05 }));
      break;
    case "locsLong":
      g.add(scalpShell(mat, 0.5, 1.02));
      g.add(curls(mat, 110, 0.0115, 1.05, 41, topRegion));
      g.add(
        strands(mat, 120, 0.34, 0.0088, 43, {
          outward: 1.06,
          region: (p) => p.y > -H * 0.1,
        }),
      );
      g.add(
        strands(mat, 40, 0.3, 0.008, 47, {
          outward: 1.04,
          region: backRegion,
        }),
      );
      break;
    case "afroBig":
      g.add(scalpShell(mat, 0.55, 1.06));
      g.add(curls(mat, 340, 0.021, 1.35, 53, (p) => p.y > -H * 0.35));
      g.add(curls(mat, 120, 0.017, 1.6, 59, (p) => p.y > 0));
      break;
    case "braidsLong":
      g.add(scalpShell(mat, 0.52, 1.02));
      g.add(curls(mat, 150, 0.0115, 1.05, 61, topRegion));
      g.add(
        strands(mat, 120, 0.5, 0.0068, 67, {
          outward: 1.05,
          region: (p) => p.y > -H * 0.2,
          accentMat,
          accentEvery: 7,
        }),
      );
      break;
    case "curlsMed":
      g.add(scalpShell(mat, 0.52, 1.03));
      g.add(curls(mat, 260, 0.0155, 1.14, 71, (p) => p.y > -H * 0.25));
      g.add(curls(mat, 70, 0.013, 1.4, 73, (p) => p.y > -H * 0.05 && Math.abs(p.nx) > 0.4));
      break;
    case "wavyLong":
      g.add(scalpShell(mat, 0.72, 1.03));
      g.add(curls(mat, 170, 0.0135, 1.08, 79, topRegion));
      g.add(
        strands(mat, 90, 0.42, 0.0115, 83, {
          outward: 1.04,
          region: (p) => p.z > -D * 0.2 || sideRegion(p),
        }),
      );
      break;
    default:
      g.add(scalpShell(mat, 0.45, 1.02));
      g.add(curls(mat, 180, 0.012, 1.06, 89, topRegion));
      break;
  }
  return g;
}
