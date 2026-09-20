import { WEAPON_BY_ID } from "../data/weapons";
import type { WeaponDef } from "../data/types";
import { bus } from "../core/EventBus";

export type ItemKind = "weapon" | "ammo" | "med" | "armor" | "helmet" | "backpack" | "grenade" | "attach";

export interface InvItem {
  id: string;
  kind: ItemKind;
  name: string;
  qty: number;
  weaponId?: string;
  level?: number;
  heal?: number;
  slotCost?: number;
}

export class InventorySystem {
  primary: InvItem | null = null;
  secondary: InvItem | null = null;
  melee: InvItem | null = null;
  throwable: InvItem | null = null;
  medical: InvItem | null = null;
  armorItem: InvItem | null = null;
  helmetItem: InvItem | null = null;
  bag: InvItem[] = [];
  backpackLevel = 1;
  ammo: Record<string, number> = {
    PISTOL: 36,
    SMG: 60,
    ASSAULT_RIFLE: 90,
    SHOTGUN: 16,
    SNIPER: 8,
    MELEE: 0,
  };

  get capacity() {
    return this.backpackLevel === 3 ? 30 : this.backpackLevel === 2 ? 20 : 10;
  }

  usedSlots() {
    return this.bag.reduce((n, i) => n + (i.slotCost ?? 1) * Math.max(1, Math.ceil(i.qty / 4)), 0);
  }

  canAdd(item: InvItem) {
    return this.usedSlots() + (item.slotCost ?? 1) <= this.capacity;
  }

  add(item: InvItem) {
    if (item.kind === "weapon" && item.weaponId) {
      const def = WEAPON_BY_ID[item.weaponId];
      if (!def) return false;
      if (def.category === "MELEE") {
        const old = this.melee;
        this.melee = item;
        if (old) this.stow(old);
        bus.emit("inventory");
        return true;
      }
      if (!this.primary) {
        this.primary = item;
        bus.emit("inventory");
        return true;
      }
      if (!this.secondary) {
        this.secondary = item;
        bus.emit("inventory");
        return true;
      }
      const old = this.primary;
      this.primary = item;
      this.stow(old);
      bus.emit("inventory");
      return true;
    }
    if (item.kind === "ammo" && item.weaponId) {
      this.ammo[item.weaponId] = (this.ammo[item.weaponId] ?? 0) + item.qty;
      bus.emit("inventory");
      return true;
    }
    if (item.kind === "grenade") {
      if (!this.throwable) this.throwable = { ...item };
      else this.throwable.qty += item.qty;
      bus.emit("inventory");
      return true;
    }
    if (item.kind === "med") {
      if (!this.medical) this.medical = { ...item };
      else this.medical.qty += item.qty;
      bus.emit("inventory");
      return true;
    }
    if (item.kind === "armor") {
      this.armorItem = item;
      bus.emit("inventory");
      return true;
    }
    if (item.kind === "helmet") {
      this.helmetItem = item;
      bus.emit("inventory");
      return true;
    }
    if (item.kind === "backpack") {
      this.backpackLevel = Math.max(this.backpackLevel, item.level ?? 1);
      bus.emit("inventory");
      return true;
    }
    return this.stow(item);
  }

  private stow(item: InvItem) {
    const existing = this.bag.find((b) => b.kind === item.kind && b.name === item.name && b.weaponId === item.weaponId);
    if (existing) {
      existing.qty += item.qty;
      bus.emit("inventory");
      return true;
    }
    if (!this.canAdd(item)) return false;
    this.bag.push({ ...item });
    bus.emit("inventory");
    return true;
  }

  consumeMed() {
    if (!this.medical || this.medical.qty <= 0) return null;
    this.medical.qty -= 1;
    const item = this.medical;
    if (this.medical.qty <= 0) this.medical = null;
    bus.emit("inventory");
    return item;
  }

  consumeGrenade() {
    if (!this.throwable || this.throwable.qty <= 0) return null;
    this.throwable.qty -= 1;
    const item = { ...this.throwable };
    if (this.throwable.qty <= 0) this.throwable = null;
    bus.emit("inventory");
    return item;
  }

  takeAmmo(category: string, n: number) {
    const have = this.ammo[category] ?? 0;
    const take = Math.min(have, n);
    this.ammo[category] = have - take;
    bus.emit("inventory");
    return take;
  }

  equippedWeapon(slot: "primary" | "secondary" | "melee"): WeaponDef | null {
    const item = slot === "primary" ? this.primary : slot === "secondary" ? this.secondary : this.melee;
    if (!item?.weaponId) return null;
    return WEAPON_BY_ID[item.weaponId] ?? null;
  }

  reset() {
    this.primary = null;
    this.secondary = null;
    this.melee = { id: "melee", kind: "weapon", name: "Machèt Lakay", qty: 1, weaponId: "machet-lakay" };
    this.throwable = { id: "frag", kind: "grenade", name: "Grenad Kraze", qty: 1 };
    this.medical = { id: "bandage", kind: "med", name: "Bandaj", qty: 3, heal: 20 };
    this.armorItem = null;
    this.helmetItem = null;
    this.bag = [];
    this.backpackLevel = 1;
    this.ammo = { PISTOL: 24, SMG: 30, ASSAULT_RIFLE: 30, SHOTGUN: 8, SNIPER: 4, MELEE: 0 };
    bus.emit("inventory");
  }
}
