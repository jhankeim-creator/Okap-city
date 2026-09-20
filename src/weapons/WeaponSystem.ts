import * as THREE from "three";
import { WEAPON_BY_ID } from "../data/weapons";
import type { WeaponDef } from "../data/types";
import type { InventorySystem } from "../inventory/InventorySystem";
import { bus } from "../core/EventBus";
import { clamp, rand } from "../core/Utils";

export class WeaponSystem {
  slot: "primary" | "secondary" | "melee" = "melee";
  mag = 0;
  cooldown = 0;
  reloading = 0;
  recoilKick = 0;
  ads = false;
  tracers: { line: THREE.Line; life: number }[] = [];

  constructor(
    private scene: THREE.Scene,
    private inventory: InventorySystem,
  ) {}

  get def(): WeaponDef {
    return this.inventory.equippedWeapon(this.slot) ?? WEAPON_BY_ID["machet-lakay"];
  }

  reset() {
    this.slot = this.inventory.primary ? "primary" : "melee";
    this.fillMag();
    this.cooldown = 0;
    this.reloading = 0;
    this.ads = false;
  }

  fillMag() {
    const w = this.def;
    if (w.category === "MELEE") {
      this.mag = 1;
      return;
    }
    this.mag = Math.min(w.magazine, this.inventory.ammo[w.category] ?? 0);
  }

  cycle() {
    if (this.slot === "primary" && this.inventory.secondary) this.slot = "secondary";
    else if (this.slot !== "melee") this.slot = "melee";
    else if (this.inventory.primary) this.slot = "primary";
    this.fillMag();
    this.reloading = 0;
    bus.emit("weapon", this.def);
  }

  setSlot(slot: "primary" | "secondary" | "melee") {
    this.slot = slot;
    this.fillMag();
    this.reloading = 0;
    bus.emit("weapon", this.def);
  }

  reload() {
    const w = this.def;
    if (w.category === "MELEE" || this.reloading > 0 || this.mag >= w.magazine) return false;
    if ((this.inventory.ammo[w.category] ?? 0) <= 0) return false;
    this.reloading = w.reload;
    bus.emit("reload-start", w);
    return true;
  }

  update(dt: number) {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.recoilKick = Math.max(0, this.recoilKick - dt * 6);
    if (this.reloading > 0) {
      this.reloading -= dt;
      if (this.reloading <= 0) {
        const w = this.def;
        const need = w.magazine - this.mag;
        const got = this.inventory.takeAmmo(w.category, need);
        this.mag += got;
        bus.emit("reload-done", this.mag);
      }
    }
    for (let i = this.tracers.length - 1; i >= 0; i--) {
      this.tracers[i].life -= dt;
      if (this.tracers[i].life <= 0) {
        this.scene.remove(this.tracers[i].line);
        this.tracers.splice(i, 1);
      }
    }
  }

  canFire() {
    return this.cooldown <= 0 && this.reloading <= 0 && (this.def.category === "MELEE" || this.mag > 0);
  }

  fire(origin: THREE.Vector3, dir: THREE.Vector3) {
    const w = this.def;
    if (!this.canFire()) {
      if (this.mag <= 0 && w.category !== "MELEE") this.reload();
      return null;
    }
    this.cooldown = 1 / w.fireRate;
    if (w.category !== "MELEE") this.mag -= 1;
    this.recoilKick = w.recoil;
    const spread = (1 - w.accuracy) * (this.ads ? 0.35 : 1.15);
    const pellets = w.category === "SHOTGUN" ? 8 : 1;
    const rays: THREE.Ray[] = [];
    for (let i = 0; i < pellets; i++) {
      const d = dir.clone();
      d.x += rand(-spread, spread);
      d.y += rand(-spread * 0.6, spread * 0.6);
      d.z += rand(-spread, spread);
      d.normalize();
      rays.push(new THREE.Ray(origin.clone(), d));
      this.addTracer(origin, d, Math.min(80, w.range));
    }
    bus.emit("shot", { weapon: w, origin, rays });
    return { weapon: w, rays };
  }

  private addTracer(origin: THREE.Vector3, dir: THREE.Vector3, range: number) {
    const end = origin.clone().addScaledVector(dir, range);
    const geo = new THREE.BufferGeometry().setFromPoints([origin.clone(), end]);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.65 }));
    this.scene.add(line);
    this.tracers.push({ line, life: 0.07 });
  }

  damageFor(w: WeaponDef, distance: number, head: boolean) {
    const fall = clamp(1 - distance / (w.range * 1.25), 0.35, 1);
    const base = w.damage * fall;
    return head ? base * w.headshot : base;
  }
}
