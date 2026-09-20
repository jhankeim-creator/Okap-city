import * as THREE from "three";
import { CHARACTERS, CHARACTER_BY_ID } from "../data/characters";
import type { CharacterDef } from "../data/types";

export interface CharacterRig {
  root: THREE.Group;
  head: THREE.Mesh;
  torso: THREE.Mesh;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  weaponBone: THREE.Group;
  def: CharacterDef;
}

function mat(color: string, rough = 0.7) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0.08 });
}

function box(w: number, h: number, d: number, color: string, y = 0) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
  m.castShadow = true;
  m.receiveShadow = true;
  m.position.y = y;
  return m;
}

function hairMesh(style: CharacterDef["hairStyle"], color: string) {
  const g = new THREE.Group();
  if (style === "fade" || style === "short") {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(color, 0.85));
    m.scale.set(1, 0.55, 0.95);
    m.position.y = 0.2;
    g.add(m);
  } else if (style === "afro") {
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.28, 12, 10), mat(color, 0.9)));
  } else if (style === "locs") {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(color, 0.85));
    cap.position.y = 0.16;
    g.add(cap);
    for (let i = 0; i < 8; i++) {
      const loc = box(0.05, 0.36, 0.05, color, 0.0);
      loc.position.set(-0.14 + i * 0.04, 0.02, 0.14);
      loc.rotation.x = 0.35;
      g.add(loc);
    }
  } else if (style === "braids") {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(color, 0.85));
    cap.position.y = 0.16;
    g.add(cap);
    for (let i = 0; i < 5; i++) {
      const b = box(0.045, 0.4, 0.045, color, -0.02);
      b.position.set(-0.1 + i * 0.05, 0.02, -0.16);
      g.add(b);
    }
  } else if (style === "pony") {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(color, 0.85));
    cap.position.y = 0.16;
    g.add(cap);
    const p = box(0.09, 0.36, 0.09, color, 0.0);
    p.position.set(0, 0.04, -0.22);
    g.add(p);
  } else if (style === "bun") {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), mat(color, 0.85));
    cap.position.y = 0.16;
    g.add(cap);
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), mat(color));
    bun.position.set(0, 0.28, -0.08);
    g.add(bun);
  } else {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), mat(color, 0.85));
    cap.position.y = 0.16;
    g.add(cap);
    g.add(box(0.42, 0.05, 0.16, "#d4a017", 0.34));
  }
  return g;
}

export function createCharacterRig(id: string, scale = 1): CharacterRig {
  const def = CHARACTER_BY_ID[id] ?? CHARACTERS[0];
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const hip = new THREE.Group();
  hip.position.y = 0.95;
  root.add(hip);

  const torso = box(0.5, 0.6, 0.32, def.shirt, 0.3);
  hip.add(torso);
  const vest = box(0.54, 0.3, 0.36, "#1a1d21", 0.3);
  hip.add(vest);
  hip.add(box(0.52, 0.06, 0.34, def.accent, 0.02));
  const neck = box(0.12, 0.1, 0.12, def.skin, 0.64);
  hip.add(neck);

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 14), mat(def.skin, 0.5));
  head.position.y = 0.8;
  head.castShadow = true;
  hip.add(head);
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), mat("#111111", 0.3));
  eyeL.position.set(-0.07, 0.82, 0.17);
  hip.add(eyeL);
  const eyeR = eyeL.clone();
  eyeR.position.x = 0.07;
  hip.add(eyeR);
  const hair = hairMesh(def.hairStyle, def.hair);
  hair.position.y = 0.8;
  hip.add(hair);
  if (def.id === "david" || def.id === "mika") {
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.08), mat("#111111", 0.15));
    glass.position.set(0, 0.83, 0.18);
    hip.add(glass);
  }
  if (def.id === "vanessa") {
    hip.add(box(0.22, 0.04, 0.18, "#f4d35e", 0.98));
  }

  const pack = box(0.34, 0.4, 0.2, "#15181c", 0.3);
  pack.position.z = -0.26;
  hip.add(pack);
  const strap = box(0.28, 0.08, 0.04, "#2a2f33", 0.48);
  strap.position.z = -0.36;
  hip.add(strap);
  const flag = box(0.15, 0.09, 0.02, "#00209f", 0.4);
  flag.position.z = -0.37;
  hip.add(flag);
  const flagR = box(0.15, 0.07, 0.02, "#d21034", 0.32);
  flagR.position.z = -0.37;
  hip.add(flagR);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.35, 0.48, 0);
  leftArm.add(box(0.14, 0.28, 0.14, def.shirt, -0.08));
  leftArm.add(box(0.13, 0.28, 0.13, def.skin, -0.3));
  hip.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.35, 0.48, 0);
  rightArm.add(box(0.14, 0.28, 0.14, def.shirt, -0.08));
  rightArm.add(box(0.13, 0.28, 0.13, def.skin, -0.3));
  rightArm.add(box(0.14, 0.08, 0.14, "#111111", -0.46));
  hip.add(rightArm);

  const weaponBone = new THREE.Group();
  weaponBone.position.set(0, -0.44, 0.1);
  rightArm.add(weaponBone);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.13, 0.95, 0);
  leftLeg.add(box(0.17, 0.58, 0.19, def.pants, -0.3));
  leftLeg.add(box(0.18, 0.09, 0.26, "#111111", -0.62));
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.13, 0.95, 0);
  rightLeg.add(box(0.17, 0.58, 0.19, def.pants, -0.3));
  rightLeg.add(box(0.18, 0.09, 0.26, "#111111", -0.62));
  root.add(rightLeg);

  root.userData.characterId = def.id;
  return { root, head, torso, leftArm, rightArm, leftLeg, rightLeg, weaponBone, def };
}

export function animateRig(
  rig: CharacterRig,
  state: "idle" | "walk" | "run" | "sprint" | "crouch" | "prone" | "jump" | "shoot" | "reload" | "down" | "dead" | "win" | "drive",
  t: number,
  speed = 1,
) {
  const swing = Math.sin(t * (state === "sprint" ? 14 : state === "run" ? 11 : 8) * speed);
  const amp = state === "sprint" ? 0.7 : state === "run" ? 0.55 : state === "walk" || state === "crouch" ? 0.35 : 0.05;
  if (state === "dead") {
    rig.root.rotation.x = -1.45;
    return;
  }
  if (state === "down") {
    rig.root.rotation.x = -1.1;
    return;
  }
  if (state === "prone") {
    rig.root.rotation.x = -1.35;
    return;
  }
  rig.root.rotation.x = 0;
  if (state === "win") {
    rig.rightArm.rotation.x = -2.4;
    rig.leftArm.rotation.x = -2.2;
    return;
  }
  if (state === "drive") {
    rig.leftArm.rotation.x = -0.8;
    rig.rightArm.rotation.x = -0.8;
    return;
  }
  if (state === "reload") {
    rig.rightArm.rotation.x = -0.9 + Math.sin(t * 10) * 0.2;
    rig.leftArm.rotation.x = -0.7;
    return;
  }
  if (state === "shoot") {
    rig.rightArm.rotation.x = -1.15;
    rig.leftArm.rotation.x = -0.9;
    return;
  }
  if (state === "jump") {
    rig.leftLeg.rotation.x = -0.4;
    rig.rightLeg.rotation.x = 0.25;
    return;
  }
  const crouch = state === "crouch" ? 0.25 : 0;
  rig.leftArm.rotation.x = swing * amp - crouch;
  rig.rightArm.rotation.x = -swing * amp - (state === "idle" ? 0.15 : 0);
  rig.leftLeg.rotation.x = -swing * amp;
  rig.rightLeg.rotation.x = swing * amp;
  rig.torso.rotation.y = swing * 0.05;
}

export function attachWeaponMesh(bone: THREE.Group, category: string) {
  while (bone.children.length) bone.remove(bone.children[0]);
  const color =
    category === "SNIPER" ? 0x3d405b : category === "SHOTGUN" ? 0x6b4226 : category === "SMG" ? 0x222831 : category === "PISTOL" ? 0x2b2d42 : 0x1d1f24;
  if (category === "MELEE") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.08), new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.7, roughness: 0.25 }));
    blade.position.y = 0.2;
    bone.add(blade);
    return;
  }
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(category === "PISTOL" ? 0.08 : 0.1, 0.12, category === "SNIPER" ? 0.85 : category === "PISTOL" ? 0.28 : 0.62),
    new THREE.MeshStandardMaterial({ color, metalness: 0.45, roughness: 0.35 }),
  );
  body.position.z = 0.2;
  bone.add(body);
}
