import * as THREE from "three";
import type { WeaponSystem } from "../weapons/WeaponSystem";
import type { HealthSystem } from "./HealthSystem";
import type { ArmorSystem } from "./ArmorSystem";
import type { InventorySystem } from "../inventory/InventorySystem";
import { bus } from "../core/EventBus";

export class PlayerCombat {
  constructor(
    private weapons: WeaponSystem,
    private health: HealthSystem,
    private armor: ArmorSystem,
    private inventory: InventorySystem,
  ) {}

  get blocked() {
    return this.health.healLocked || this.health.downed || this.health.dead;
  }

  shoot(origin: THREE.Vector3, dir: THREE.Vector3) {
    if (this.blocked) return null;
    return this.weapons.fire(origin, dir);
  }

  receiveHit(raw: number, head: boolean, source: string) {
    const remain = this.armor.absorb(raw, head);
    return this.health.damage(remain, source);
  }

  useMed() {
    if (this.blocked && !this.health.downed) return false;
    const item = this.inventory.consumeMed();
    if (!item) return false;
    const lock = item.name === "Medkit" || item.name === "Gwo Geri";
    const duration = lock ? 3.4 : 1.6;
    return this.health.startHeal(item.heal ?? 20, duration, lock);
  }

  throwGrenade() {
    if (this.blocked) return null;
    return this.inventory.consumeGrenade();
  }
}
