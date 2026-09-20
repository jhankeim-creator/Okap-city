import * as THREE from "three";
import type { WeaponDef } from "../data/types";
import { plainMaterial } from "../characters/outfits";

/**
 * OKAP CITY — zam orijinal yo (jewometri detaye: receveur, barik, manch, magazin, optik).
 * Tout zam yo fèt an kòd, pa gen okenn modèl pran nan lòt jwèt.
 */

function box(w: number, h: number, d: number, mat: THREE.Material, x = 0, y = 0, z = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = false;
  return m;
}

function cyl(r: number, len: number, mat: THREE.Material, rotX = Math.PI / 2) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.rotation.x = rotX;
  m.castShadow = false;
  return m;
}

export interface WeaponMeshInfo {
  group: THREE.Group;
  muzzle: THREE.Object3D;
  magazine: THREE.Object3D | null;
  bolt: THREE.Object3D | null;
}

const PALETTE: Record<string, { body: number; metal: number; grip: number }> = {
  PISTOL: { body: 0x25282d, metal: 0x8d949c, grip: 0x14161a },
  SMG: { body: 0x2a2d33, metal: 0x9aa1a9, grip: 0x16181c },
  ASSAULT_RIFLE: { body: 0x2f3138, metal: 0x8a9099, grip: 0x1a1c20 },
  SHOTGUN: { body: 0x4a2f1c, metal: 0x9a7846, grip: 0x2b1c11 },
  SNIPER: { body: 0x33363d, metal: 0x99a0a8, grip: 0x1b1d21 },
  MELEE: { body: 0x3b3f45, metal: 0xc9ced6, grip: 0x1c1a18 },
};

export function buildWeaponMesh(def: WeaponDef): WeaponMeshInfo {
  const g = new THREE.Group();
  const pal = PALETTE[def.category] ?? PALETTE.ASSAULT_RIFLE;
  const bodyMat = plainMaterial("gun-body-" + def.category, pal.body, { roughness: 0.45, metalness: 0.55, envMapIntensity: 0.8 });
  const metalMat = plainMaterial("gun-metal-" + def.category, pal.metal, { roughness: 0.25, metalness: 0.95, envMapIntensity: 1.1 });
  const gripMat = plainMaterial("gun-grip-" + def.category, pal.grip, { roughness: 0.85, metalness: 0.05 });

  const muzzle = new THREE.Object3D();
  let magazine: THREE.Object3D | null = null;
  let bolt: THREE.Object3D | null = null;

  if (def.category === "MELEE") {
    const blade = box(0.02, 0.02, 0.34, metalMat, 0, 0.01, -0.24);
    blade.rotation.x = 0.02;
    g.add(blade);
    g.add(box(0.05, 0.035, 0.05, bodyMat, 0, -0.01, -0.24));
    g.add(box(0.026, 0.026, 0.13, gripMat, 0, -0.005, -0.02));
    g.add(box(0.06, 0.012, 0.03, bodyMat, 0, 0.012, -0.09));
    muzzle.position.set(0, 0.01, -0.42);
    g.add(muzzle);
    return { group: g, muzzle, magazine, bolt };
  }

  const long = def.category === "SNIPER" ? 0.66 : def.category === "ASSAULT_RIFLE" ? 0.5 : def.category === "SHOTGUN" ? 0.46 : def.category === "SMG" ? 0.34 : 0.2;
  const receiverH = def.category === "PISTOL" ? 0.05 : 0.075;

  // receveur
  const receiver = box(def.category === "PISTOL" ? 0.032 : 0.045, receiverH, def.category === "PISTOL" ? 0.16 : 0.26, bodyMat, 0, 0, -0.06);
  g.add(receiver);
  // barik
  const barrel = cyl(def.category === "SNIPER" ? 0.016 : 0.012, long * 0.62, metalMat);
  barrel.position.set(0, def.category === "PISTOL" ? 0.005 : 0.012, -0.06 - long * 0.42);
  g.add(barrel);
  // machwè / handguard
  if (def.category !== "PISTOL") {
    const guard = box(0.04, 0.045, long * 0.34, gripMat, 0, -0.004, -0.18 - long * 0.12);
    g.add(guard);
    for (let i = 0; i < 3; i++) {
      g.add(box(0.045, 0.008, 0.008, metalMat, 0, -0.028, -0.14 - i * 0.06));
    }
  }
  // magazin
  const magLen = def.category === "PISTOL" ? 0.1 : def.magazine > 20 ? 0.19 : 0.13;
  const mag = box(0.036, magLen, 0.05, gripMat, 0, -0.06 - magLen * 0.35, -0.04);
  mag.rotation.x = def.category === "SNIPER" ? 0.02 : 0.06;
  g.add(mag);
  magazine = mag;
  // pye/pistol grip
  const grip = box(0.034, 0.1, 0.045, gripMat, 0, -0.07, 0.02);
  grip.rotation.x = -0.22;
  g.add(grip);
  // kolb
  if (def.category !== "PISTOL") {
    const stock = box(0.04, 0.06, 0.2, bodyMat, 0, -0.005, 0.16);
    g.add(stock);
    g.add(box(0.036, 0.04, 0.07, gripMat, 0, 0.005, 0.28));
  }
  // sistèm vizè
  if (def.category === "SNIPER") {
    const scope = cyl(0.024, 0.24, metalMat, 0);
    scope.rotation.set(0, 0, Math.PI / 2);
    scope.rotation.y = Math.PI / 2;
    scope.rotation.x = Math.PI / 2;
    scope.position.set(0, 0.07, -0.1);
    g.add(scope);
    g.add(box(0.02, 0.03, 0.02, bodyMat, 0, 0.05, -0.05));
  } else {
    const rail = box(0.02, 0.012, 0.16, metalMat, 0, receiverH / 2 + 0.006, -0.1);
    g.add(rail);
    const rear = box(0.024, 0.03, 0.02, bodyMat, 0, receiverH / 2 + 0.026, 0.0);
    g.add(rear);
    const front = box(0.016, 0.036, 0.016, metalMat, 0, receiverH / 2 + 0.03, -0.2);
    g.add(front);
    bolt = front;
  }
  // frenn/brake
  const brake = cyl(0.018, 0.05, metalMat);
  brake.position.set(0, def.category === "PISTOL" ? 0.005 : 0.012, -0.06 - long * 0.72);
  g.add(brake);
  muzzle.position.set(0, def.category === "PISTOL" ? 0.005 : 0.012, -0.09 - long * 0.78);
  g.add(muzzle);

  return { group: g, muzzle, magazine, bolt };
}

export function buildMuzzleFlash(): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(1, 1);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffd08a,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(geo, mat);
  m.visible = false;
  m.renderOrder = 20;
  return m;
}
