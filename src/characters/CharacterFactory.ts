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

function box(w: number, h: number, d: number, color: string, y = 0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color }),
  );
  m.castShadow = true;
  m.receiveShadow = true;
  m.position.y = y;
  return m;
}

function hairMesh(style: CharacterDef["hairStyle"], color: string) {
  const g = new THREE.Group();
  if (style === "fade" || style === "short") {
    g.add(box(0.38, 0.12, 0.36, color, 0.22));
  } else if (style === "afro") {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), new THREE.MeshLambertMaterial({ color }));
    m.position.y = 0.22;
    g.add(m);
  } else if (style === "locs") {
    for (let i = 0; i < 7; i++) {
      const loc = box(0.06, 0.34, 0.06, color, 0.02);
      loc.position.x = -0.14 + i * 0.045;
      loc.position.z = 0.12;
      loc.rotation.x = 0.25;
      g.add(loc);
    }
    g.add(box(0.36, 0.1, 0.34, color, 0.22));
  } else if (style === "braids") {
    g.add(box(0.36, 0.1, 0.32, color, 0.22));
    for (let i = 0; i < 4; i++) {
      const b = box(0.05, 0.42, 0.05, color, -0.05);
      b.position.set(-0.1 + i * 0.07, 0.05, -0.16);
      g.add(b);
    }
  } else if (style === "pony") {
    g.add(box(0.36, 0.1, 0.32, color, 0.22));
    const p = box(0.1, 0.38, 0.1, color, 0.0);
    p.position.set(0, 0.05, -0.22);
    g.add(p);
  } else if (style === "bun") {
    g.add(box(0.34, 0.1, 0.3, color, 0.2));
    const bun = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshLambertMaterial({ color }));
    bun.position.set(0, 0.28, -0.1);
    g.add(bun);
  } else {
    g.add(box(0.4, 0.16, 0.36, color, 0.24));
    const crown = box(0.42, 0.05, 0.16, "#d4a017", 0.34);
    g.add(crown);
  }
  return g;
}

export function createCharacterRig(id: string, scale = 1): CharacterRig {
  const def = CHARACTER_BY_ID[id] ?? CHARACTERS[0];
  const root = new THREE.Group();
  root.scale.setScalar(scale);

  const hip = new THREE.Group();
  hip.position.y = 0.92;
  root.add(hip);

  const torso = box(0.46, 0.55, 0.28, def.shirt, 0.28);
  hip.add(torso);

  const belt = box(0.48, 0.06, 0.3, def.accent, 0.02);
  hip.add(belt);

  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.34, 0.36, 0.32),
    new THREE.MeshLambertMaterial({ color: def.skin }),
  );
  head.position.y = 0.72;
  head.castShadow = true;
  hip.add(head);
  const hair = hairMesh(def.hairStyle, def.hair);
  hair.position.y = 0.72;
  hip.add(hair);

  const backpack = box(0.28, 0.34, 0.16, "#2b2f33", 0.24);
  backpack.position.z = -0.22;
  hip.add(backpack);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.32, 0.42, 0);
  leftArm.add(box(0.12, 0.42, 0.12, def.skin, -0.18));
  hip.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.32, 0.42, 0);
  const armMesh = box(0.12, 0.42, 0.12, def.skin, -0.18);
  rightArm.add(armMesh);
  const gloves = box(0.13, 0.08, 0.13, "#1a1a1a", -0.4);
  rightArm.add(gloves);
  hip.add(rightArm);

  const weaponBone = new THREE.Group();
  weaponBone.position.set(0, -0.42, 0.08);
  rightArm.add(weaponBone);

  const leftLeg = new THREE.Group();
  leftLeg.position.set(-0.12, 0.92, 0);
  leftLeg.add(box(0.16, 0.55, 0.18, def.pants, -0.28));
  leftLeg.add(box(0.17, 0.08, 0.24, "#e8e4dc", -0.58));
  root.add(leftLeg);

  const rightLeg = new THREE.Group();
  rightLeg.position.set(0.12, 0.92, 0);
  rightLeg.add(box(0.16, 0.55, 0.18, def.pants, -0.28));
  rightLeg.add(box(0.17, 0.08, 0.24, "#e8e4dc", -0.58));
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
    category === "SNIPER" ? 0x3d405b : category === "SHOTGUN" ? 0x6b4226 : category === "SMG" ? 0x222831 : category === "PISTOL" ? 0x2b2d42 : 0x1d3557;
  if (category === "MELEE") {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.08), new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }));
    blade.position.y = 0.2;
    bone.add(blade);
    return;
  }
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(category === "PISTOL" ? 0.08 : 0.1, 0.12, category === "SNIPER" ? 0.85 : category === "PISTOL" ? 0.28 : 0.55),
    new THREE.MeshLambertMaterial({ color }),
  );
  body.position.z = 0.18;
  bone.add(body);
}
