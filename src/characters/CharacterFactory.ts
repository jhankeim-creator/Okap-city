import * as THREE from "three";
import { CHARACTERS, CHARACTER_BY_ID } from "../data/characters";
import { WEAPON_BY_ID } from "../data/weapons";
import type { CharacterDef } from "../data/types";
import { ANATOMY, BODY_TYPES, buildSkeleton, poseSkeleton, type Joints, type PoseState } from "./Body";
import { dressCharacter, OUTFITS, skinDetailMaterial } from "./outfits";
import { buildMuzzleFlash, buildWeaponMesh, type WeaponMeshInfo } from "../weapons/WeaponFactory";

/**
 * OKAP CITY — faktori pèsonaj: eskèlèt reyalis + rad inik + animasyon.
 */

export type RigDetail = "high" | "low";

export interface RigOptions {
  /** "low" = san detay figi (pou èdtan/robot lwen) */
  detail?: RigDetail;
  /** Zam kòmanse */
  weapon?: string;
}

export interface CharacterRig {
  root: THREE.Group;
  joints: Joints;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponBone: THREE.Group;
  supportBone: THREE.Group;
  weapon: THREE.Group;
  weaponInfo: WeaponMeshInfo;
  def: CharacterDef;
  aim: number;
  recoil: number;
  state: PoseState;
}

const CATEGORY_WEAPON: Record<string, string> = {
  PISTOL: "kot-fe",
  SMG: "van-rapid",
  ASSAULT_RIFLE: "soley-wouj",
  SHOTGUN: "barik-chaj",
  SNIPER: "je-mon",
  MELEE: "machet-lakay",
};

export function weaponIdForCategory(category: string) {
  return CATEGORY_WEAPON[category] ?? "soley-wouj";
}

/** Kalite kò pou chak pèsonaj (soti nan fich rad la). */
export function bodyTypeFor(def: CharacterDef) {
  const spec = OUTFITS[def.id];
  return BODY_TYPES[spec?.build ?? "male"] ?? BODY_TYPES.male;
}

export function createCharacterRig(id: string, scale = 1, opts: RigOptions = {}): CharacterRig {
  const def = CHARACTER_BY_ID[id] ?? CHARACTERS[0];
  const bodyType = bodyTypeFor(def);
  const skin = skinDetailMaterial(def.skin);
  const joints = buildSkeleton(skin, bodyType);
  const root = joints.root;
  root.scale.setScalar(scale);
  root.name = `rig-${def.id}`;
  root.userData.characterId = def.id;

  const dressed = dressCharacter(joints, def, 0, opts.detail ?? "high");

  const info = buildWeaponMesh(WEAPON_BY_ID[opts.weapon ?? "machet-lakay"] ?? WEAPON_BY_ID["machet-lakay"]);
  dressed.weaponBone.add(info.group);
  const flash = buildMuzzleFlash();
  flash.name = "muzzle-flash";
  flash.scale.setScalar(0.3);
  flash.visible = false;
  info.muzzle.add(flash);

  return {
    root,
    joints,
    head: joints.headMesh,
    torso: joints.torso,
    leftArm: joints.shoulderL,
    rightArm: joints.shoulderR,
    leftLeg: joints.hipL,
    rightLeg: joints.hipR,
    weaponBone: dressed.weaponBone,
    supportBone: dressed.supportBone,
    weapon: info.group,
    weaponInfo: info,
    def,
    aim: 0,
    recoil: 0,
    state: "idle",
  };
}

/** Mete bon zam nan men pèsonaj la (pa kategori oswa pa id). */
export function attachWeaponMesh(bone: THREE.Group, categoryOrId: string): WeaponMeshInfo {
  const def = WEAPON_BY_ID[categoryOrId] ?? WEAPON_BY_ID[weaponIdForCategory(categoryOrId)] ?? Object.values(WEAPON_BY_ID)[0];
  while (bone.children.length) bone.remove(bone.children[0]);
  const info = buildWeaponMesh(def);
  bone.add(info.group);
  const flash = buildMuzzleFlash();
  flash.name = "muzzle-flash";
  flash.scale.setScalar(0.3);
  flash.visible = false;
  info.muzzle.add(flash);
  return info;
}

export function attachWeaponToRig(rig: CharacterRig, categoryOrId: string) {
  rig.weaponInfo = attachWeaponMesh(rig.weaponBone, categoryOrId);
  rig.weapon = rig.weaponInfo.group;
}

export function flashMuzzle(rig: CharacterRig, strength = 1) {
  const meshes = rig.weaponInfo.muzzle.children;
  for (const c of meshes) {
    const m = c as THREE.Mesh;
    if (!(m as THREE.Mesh).isMesh) continue;
    m.visible = true;
    m.rotation.z = Math.random() * Math.PI;
    m.scale.setScalar(0.16 + Math.random() * 0.14 * strength);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.9;
  }
  rig.recoil = Math.min(1.2, rig.recoil + 0.5);
}

export function updateMuzzleFlash(rig: CharacterRig, dt: number) {
  for (const c of rig.weaponInfo.muzzle.children) {
    const m = c as THREE.Mesh;
    if (!m.isMesh) continue;
    const mat = m.material as THREE.MeshBasicMaterial;
    if (mat.opacity <= 0.02) {
      m.visible = false;
      mat.opacity = 0;
      continue;
    }
    mat.opacity = Math.max(0, mat.opacity - dt * 16);
  }
}

export interface AnimateExtra {
  aim?: boolean;
  aimPitch?: number;
  speed?: number;
  smooth?: number;
  crouchAmount?: number;
}

/** Animasyon reyalis: konvèti eta jwèt la an poz kò. */
export function animateRig(rig: CharacterRig, state: PoseState, t: number, extra: AnimateExtra = {}) {
  const targetAim = (extra.aim ?? (state === "shoot" || state === "reload" || state === "aim")) ? 1 : 0;
  rig.aim += (targetAim - rig.aim) * 0.22;
  rig.recoil = Math.max(0, rig.recoil - 0.06);
  rig.state = state;

  const speed = extra.speed ?? 1;
  poseSkeleton(rig.joints, {
    state,
    t,
    speed,
    aim: rig.aim > 0.35,
    aimPitch: extra.aimPitch ?? 0,
    recoil: rig.recoil,
    crouchAmount: extra.crouchAmount ?? 1,
    smooth: extra.smooth,
  });

  // Zam nan men an: konpanse wotasyon bra a pou l rete dwat devan
  const j = rig.joints;
  const accX = j.shoulderR.rotation.x + j.elbowR.rotation.x;
  const accZ = j.shoulderR.rotation.z + j.elbowR.rotation.z;
  const wb = rig.weaponBone;
  if (state === "dead" || state === "down") {
    wb.rotation.set(0.35, 0.2, 0.4);
  } else if (rig.aim > 0.35) {
    wb.rotation.set(-accX + (extra.aimPitch ?? 0) * 0.25 - rig.recoil * 0.3, 0.05, -accZ * 0.75);
  } else {
    wb.rotation.set(-accX + 0.55 - rig.recoil * 0.2, 0.08, -accZ * 0.75 + 0.05);
  }
}

export function characterHeight() {
  return ANATOMY.headY + ANATOMY.headHeight * 1.06;
}

export function rigBaseMaterial(def: CharacterDef) {
  return skinDetailMaterial(def.skin);
}
