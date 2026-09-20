import * as THREE from "three";
import { ANATOMY, ellipsoid, tubeMesh } from "./Body";
import { mulberry32, plainMaterial, skinDetailMaterial } from "./outfits";

/**
 * OKAP CITY — figi reyalis pou pèsonaj yo.
 *
 * Tout bagay la fèt nan espas lokal zo bwa tèt la (sant kran an se orijin):
 *   x = agoch/dwat, y = anwo/anba, z = dèyè (-z = devan figi a)
 */

export type BeardKind = "none" | "stubble" | "short" | "full" | "goatee";

export interface FaceOptions {
  /** Koulè po a (hex string) pou ton labjoun, po je yo elatriye */
  skin: string;
  eyeColor?: number;
  browColor?: string;
  lipsColor?: string;
  beard?: BeardKind;
  beardColor?: string;
  /** Sousi pi fen + sil pou fi */
  feminine?: boolean;
  /** Zye ble/klè pou kèk pèsonaj */
  highlight?: boolean;
}

const W = ANATOMY.headWidth;
const H = ANATOMY.headHeight;
const D = ANATOMY.headDepth;

/** Bias je a: sifas kran an nan wotè/nan lajè zye yo. */
function surfaceZ(x: number, y: number, inflate = 1) {
  const nx = x / (W * inflate);
  const ny = y / (H * inflate);
  const k = Math.max(0.05, 1 - nx * nx - ny * ny);
  return -D * inflate * Math.sqrt(k);
}

function eyeGroup(side: number, face: FaceOptions, skin: THREE.Material) {
  const g = new THREE.Group();
  const eyeX = side * 0.0312;
  const eyeY = 0.008;
  const eyeZ = surfaceZ(eyeX, eyeY) + 0.012;
  g.position.set(eyeX, eyeY, eyeZ);

  const sclera = ellipsoid(0.0132, 0.0132, 0.0132, plainMaterial("eye-sclera", 0xf1ece2, { roughness: 0.22 }), false);
  g.add(sclera);
  const iris = ellipsoid(0.0062, 0.0062, 0.0042, plainMaterial("eye-iris", face.eyeColor ?? 0x3a2415, { roughness: 0.18 }), false);
  iris.position.set(0, 0, -0.0104);
  iris.rotation.y = side * 0.16;
  g.add(iris);
  const pupil = ellipsoid(0.0026, 0.0026, 0.0018, plainMaterial("eye-pupil", 0x090909, { roughness: 0.1 }), false);
  pupil.position.set(0, 0, -0.0122);
  g.add(pupil);
  if (face.highlight !== false) {
    const glint = ellipsoid(0.0016, 0.0016, 0.0012, plainMaterial("eye-glint", 0xffffff, { roughness: 0.05 }), false);
    glint.position.set(side * 0.0028, 0.0032, -0.0128);
    g.add(glint);
  }

  // po je yo: mwatye sferik an po
  const upperLid = new THREE.Mesh(new THREE.SphereGeometry(0.0146, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.52), skin);
  upperLid.rotation.x = -0.32;
  upperLid.rotation.z = side * 0.07;
  upperLid.position.set(0, 0.0014, 0);
  upperLid.scale.set(1, 1, 0.92);
  g.add(upperLid);
  const lowerLid = new THREE.Mesh(new THREE.SphereGeometry(0.0146, 18, 12, 0, Math.PI * 2, Math.PI * 0.6, Math.PI * 0.4), skin);
  lowerLid.rotation.x = 0.3;
  g.add(lowerLid);

  // plezir sil yo
  if (face.feminine) {
    const lashMat = plainMaterial("lash", 0x140f0c, { roughness: 0.5 });
    for (let i = 0; i < 3; i++) {
      const lash = ellipsoid(0.008 - i * 0.0016, 0.0012, 0.0026, lashMat, false);
      lash.position.set(side * (0.002 + i * 0.004), 0.0088 - i * 0.0012, -0.0106 + i * 0.0026);
      lash.rotation.z = side * (0.1 + i * 0.12);
      g.add(lash);
    }
  }
  return g;
}

function browGroup(side: number, face: FaceOptions, mat: THREE.Material) {
  const g = new THREE.Group();
  const y = 0.0395;
  const x = side * 0.0316;
  g.position.set(x, y, surfaceZ(x, y) + 0.004);
  const inner = ellipsoid(face.feminine ? 0.007 : 0.0084, 0.0034, 0.005, mat, false);
  inner.position.set(-side * 0.011, -0.0016, 0.0016);
  g.add(inner);
  const mid = ellipsoid(0.0098, 0.0042, 0.0056, mat, false);
  g.add(mid);
  const outer = ellipsoid(0.0084, 0.0034, 0.005, mat, false);
  outer.position.set(side * 0.0135, 0.0008, 0.0022);
  outer.rotation.z = side * 0.22;
  g.add(outer);
  g.rotation.z = side * -0.1;
  return g;
}

function noseGroup(skin: THREE.Material) {
  const g = new THREE.Group();
  const bridge = tubeMesh(0.0068, 0.0098, 0.052, skin, false, 1, 1.25);
  bridge.rotation.x = -0.16;
  bridge.position.set(0, 0.016, surfaceZ(0, 0.014) + 0.0035);
  g.add(bridge);
  const tipY = -0.019;
  const tip = ellipsoid(0.0126, 0.0118, 0.0134, skin, false);
  tip.position.set(0, tipY, surfaceZ(0, tipY) + 0.0016);
  g.add(tip);
  const bridgeTip = ellipsoid(0.0088, 0.012, 0.0088, skin, false);
  bridgeTip.position.set(0, -0.004, surfaceZ(0, -0.002) + 0.004);
  g.add(bridgeTip);
  for (const s of [-1, 1]) {
    const wing = ellipsoid(0.0086, 0.0078, 0.0092, skin, false);
    wing.position.set(s * 0.0118, tipY + 0.0024, surfaceZ(s * 0.0118, tipY + 0.0024) + 0.0038);
    g.add(wing);
    const nostril = ellipsoid(0.0032, 0.0024, 0.0034, plainMaterial("nostril", 0x2a1a13, { roughness: 0.6 }), false);
    nostril.position.set(s * 0.0082, tipY - 0.0032, surfaceZ(s * 0.0082, tipY) + 0.0074);
    g.add(nostril);
  }
  return g;
}

function mouthGroup(face: FaceOptions) {
  const g = new THREE.Group();
  const lipMat = plainMaterial("lips-" + (face.lipsColor ?? "default"), face.lipsColor ?? 0x7d4238, { roughness: 0.42 });
  const dark = plainMaterial("mouth-line", 0x33150f, { roughness: 0.7 });
  const y = -0.05;
  const z = surfaceZ(0, y);
  const upper = ellipsoid(0.0146, 0.0052, 0.0088, lipMat, false);
  upper.position.set(0, 0.0056, z + 0.0042);
  g.add(upper);
  const upperMid = ellipsoid(0.0092, 0.0056, 0.0062, lipMat, false);
  upperMid.position.set(0, 0.0048, z + 0.0056);
  g.add(upperMid);
  const line = ellipsoid(0.0142, 0.0016, 0.006, dark, false);
  line.position.set(0, 0.0004, z + 0.0062);
  g.add(line);
  const lower = ellipsoid(0.0134, 0.006, 0.0092, lipMat, false);
  lower.position.set(0, -0.0062, z + 0.0052);
  g.add(lower);
  return g;
}

/** Bab/bar: ti grenn sou liy machwè a + moustach. */
function beardGroup(face: FaceOptions) {
  const g = new THREE.Group();
  const kind = face.beard ?? "none";
  if (kind === "none") return g;
  const color = face.beardColor ?? face.browColor ?? "#1a1208";
  const mat = plainMaterial(`beard-${color}`, color, { roughness: 0.92 });
  const counts: Record<string, number> = { stubble: 420, short: 620, full: 900, goatee: 220 };
  const count = counts[kind] ?? 400;
  const big = kind === "full" ? 1.45 : kind === "short" ? 1.2 : 1;
  const inst = new THREE.InstancedMesh(new THREE.SphereGeometry(0.0022 * big, 6, 5), mat, count);
  const rand = mulberry32(97 + count);
  const m = new THREE.Matrix4();
  const scales = new THREE.Vector3(1, 0.72, 1);
  const q = new THREE.Quaternion();
  let placed = 0;
  let guard = 0;
  while (placed < count && guard < count * 40) {
    guard++;
    // direksyon o aza sou yon mwatye esfè (devan + anba)
    const u = rand() * 2 - 1;
    const v = rand();
    const theta = Math.acos(1 - v * 1.35);
    const phi = rand() * Math.PI * 2;
    const dx = Math.sin(theta) * Math.cos(phi);
    const dy = Math.cos(theta);
    const dz = Math.sin(theta) * Math.sin(phi);
    // rejyon bab la
    const y = dy * H * 1.02;
    const x = dx * W * 1.04;
    const z = dz * D * 1.02;
    const frontHalf = z < D * 0.34;
    const onJaw = y < -H * 0.3 && y > -H * 0.98 && frontHalf && Math.abs(x) < W * 1.02;
    const sideburn = kind === "full" && Math.abs(x) > W * 0.6 && y < H * 0.12 && y > -H * 0.6 && z < D * 0.25;
    const mustache = Math.abs(x) < W * 0.34 && y < -H * 0.24 && y > -H * 0.36 && z < -D * 0.55;
    const goateeZone = kind === "goatee" ? Math.abs(x) < W * 0.32 && y < -H * 0.5 : false;
    if (!(onJaw || sideburn || mustache || goateeZone)) continue;
    if (kind === "goatee" && !(goateeZone || mustache)) continue;
    q.setFromEuler(new THREE.Euler(rand() * 0.6, rand() * Math.PI, 0));
    m.compose(new THREE.Vector3(x * 1.01, y * 1.01, z * 1.01), q, scales);
    inst.setMatrixAt(placed, m);
    placed++;
  }
  inst.count = placed;
  inst.instanceMatrix.needsUpdate = true;
  inst.castShadow = false;
  inst.receiveShadow = false;
  g.add(inst);
  return g;
}

/** Bati tout figi a sou gwoup tèt la. */
export function buildFace(head: THREE.Group, opts: FaceOptions) {
  const skin = skinDetailMaterial(opts.skin);
  const hairMat = plainMaterial(`hairline-${opts.browColor ?? "#1a1208"}`, opts.browColor ?? "#1a1208", { roughness: 0.85 });
  head.add(eyeGroup(-1, opts, skin));
  head.add(eyeGroup(1, opts, skin));
  head.add(browGroup(-1, opts, hairMat));
  head.add(browGroup(1, opts, hairMat));
  head.add(noseGroup(skin));
  head.add(mouthGroup(opts));
  head.add(beardGroup(opts));

  // liy cheve a (hairline) pou po tèt ki kale
  const hairline = new THREE.Mesh(new THREE.SphereGeometry(1, 26, 20, 0, Math.PI * 2, 0, Math.PI * 0.42), hairMat);
  hairline.scale.set(W * 1.012, H * 1.02, D * 1.012);
  hairline.position.y = 0.012;
  hairline.rotation.x = 0.12;
  hairline.castShadow = false;
  head.add(hairline);
}
