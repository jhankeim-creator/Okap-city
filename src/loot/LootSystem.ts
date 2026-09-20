import * as THREE from "three";
import { WEAPONS } from "../data/weapons";
import type { InvItem } from "../inventory/InventorySystem";
import type { Rarity } from "../data/types";
import { nowId, pick, rand } from "../core/Utils";
import { ZONES } from "../data/world";

const RARITY_WEIGHT: Record<Rarity, number> = {
  COMMON: 46,
  UNCOMMON: 28,
  RARE: 16,
  EPIC: 8,
  LEGENDARY: 2,
};

export interface LootDrop {
  id: string;
  item: InvItem;
  rarity: Rarity;
  position: THREE.Vector3;
  mesh: THREE.Object3D;
  taken: boolean;
}

function weightedRarity(bias?: Rarity): Rarity {
  const boost: Record<Rarity, number> = { ...RARITY_WEIGHT };
  if (bias) boost[bias] += 18;
  const total = Object.values(boost).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const key of Object.keys(boost) as Rarity[]) {
    r -= boost[key];
    if (r <= 0) return key;
  }
  return "COMMON";
}

function makeItem(rarity: Rarity): { item: InvItem; rarity: Rarity } {
  const roll = Math.random();
  if (roll < 0.38) {
    const pool = WEAPONS.filter((w) => w.rarity === rarity || Math.random() < 0.25);
    const w = pick(pool.length ? pool : WEAPONS);
    return {
      rarity: w.rarity,
      item: { id: nowId("w"), kind: "weapon", name: w.name, qty: 1, weaponId: w.id },
    };
  }
  if (roll < 0.55) {
    const cat = pick(["PISTOL", "SMG", "ASSAULT_RIFLE", "SHOTGUN", "SNIPER"]);
    return { rarity: "COMMON", item: { id: nowId("a"), kind: "ammo", name: `Bal ${cat}`, qty: 16 + Math.floor(Math.random() * 24), weaponId: cat } };
  }
  if (roll < 0.68) {
    const meds = [
      { name: "Bandaj", heal: 20, qty: 2 },
      { name: "Ti Geri", heal: 35, qty: 1 },
      { name: "Medkit", heal: 70, qty: 1 },
      { name: "Gwo Geri", heal: 100, qty: 1 },
    ];
    const m = pick(meds);
    return { rarity: m.heal >= 70 ? "RARE" : "UNCOMMON", item: { id: nowId("m"), kind: "med", name: m.name, qty: m.qty, heal: m.heal } };
  }
  if (roll < 0.8) {
    const level = rarity === "LEGENDARY" || rarity === "EPIC" ? 3 : rarity === "RARE" ? 2 : 1;
    return { rarity, item: { id: nowId("ar"), kind: "armor", name: `Blende Nivo ${level}`, qty: 1, level } };
  }
  if (roll < 0.88) {
    const level = rarity === "LEGENDARY" ? 3 : rarity === "EPIC" || rarity === "RARE" ? 2 : 1;
    return { rarity, item: { id: nowId("h"), kind: "helmet", name: `Kas Nivo ${level}`, qty: 1, level } };
  }
  if (roll < 0.93) {
    const level = rarity === "EPIC" || rarity === "LEGENDARY" ? 3 : 2;
    return { rarity, item: { id: nowId("b"), kind: "backpack", name: `Sak Nivo ${level}`, qty: 1, level } };
  }
  const g = pick([
    { name: "Grenad Kraze", id: "frag" },
    { name: "Grenad Lafimen", id: "smoke" },
    { name: "Grenad Klere", id: "flash" },
  ]);
  return { rarity: "UNCOMMON", item: { id: nowId("g"), kind: "grenade", name: g.name, qty: 1 } };
}

export class LootSystem {
  drops: LootDrop[] = [];
  private group = new THREE.Group();

  constructor(private scene: THREE.Scene) {
    this.scene.add(this.group);
  }

  scatter(count: number) {
    this.clear();
    for (let i = 0; i < count; i++) {
      const zone = pick(ZONES);
      const ang = rand(0, Math.PI * 2);
      const rad = rand(4, zone.radius * 0.82);
      const x = zone.x + Math.cos(ang) * rad;
      const z = zone.z + Math.sin(ang) * rad;
      this.spawn(new THREE.Vector3(x, 0.45, z), weightedRarity(zone.lootBias));
    }
  }

  spawn(position: THREE.Vector3, rarity?: Rarity) {
    const made = makeItem(rarity ?? weightedRarity());
    const geo = new THREE.BoxGeometry(0.55, 0.38, 0.55);
    const color =
      made.rarity === "LEGENDARY"
        ? 0xd4a017
        : made.rarity === "EPIC"
          ? 0x9b5de5
          : made.rarity === "RARE"
            ? 0x4ea8de
            : made.rarity === "UNCOMMON"
              ? 0x3ddc84
              : 0xcfcfcf;
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color, emissive: color, emissiveIntensity: 0.18 }));
    mesh.position.copy(position);
    mesh.position.y = 0.45;
    mesh.castShadow = true;
    this.group.add(mesh);
    const drop: LootDrop = { id: nowId("loot"), item: made.item, rarity: made.rarity, position: position.clone(), mesh, taken: false };
    this.drops.push(drop);
    return drop;
  }

  nearest(x: number, z: number, max = 2.4) {
    let best: LootDrop | null = null;
    let bestD = max;
    for (const d of this.drops) {
      if (d.taken) continue;
      const dx = d.position.x - x;
      const dz = d.position.z - z;
      const dist = Math.hypot(dx, dz);
      if (dist < bestD) {
        best = d;
        bestD = dist;
      }
    }
    return best;
  }

  take(id: string) {
    const d = this.drops.find((x) => x.id === id);
    if (!d || d.taken) return null;
    d.taken = true;
    d.mesh.visible = false;
    return d;
  }

  update(t: number) {
    for (const d of this.drops) {
      if (d.taken) continue;
      d.mesh.rotation.y = t * 1.6;
      d.mesh.position.y = 0.45 + Math.sin(t * 2 + d.position.x) * 0.08;
    }
  }

  clear() {
    for (const d of this.drops) this.group.remove(d.mesh);
    this.drops = [];
  }
}
