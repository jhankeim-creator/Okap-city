import { COSMETICS } from "../data/world";
import { bus } from "../core/EventBus";
import type { SaveManager } from "./SaveManager";

export class CurrencySystem {
  constructor(private save: SaveManager) {}

  get coins() {
    return this.save.state.profile.coins;
  }

  buy(cosmeticId: string) {
    const item = COSMETICS.find((c) => c.id === cosmeticId);
    if (!item) return { ok: false, reason: "Atik sa pa egziste." };
    const p = this.save.state.profile;
    if (p.unlockedCosmetics.includes(item.id)) return { ok: false, reason: "Ou genyen l deja." };
    if (!this.save.spendCoins(item.price)) return { ok: false, reason: "Pa gen ase OKAP COINS." };
    p.unlockedCosmetics.push(item.id);
    p.equipped[item.slot] = item.id;
    this.save.persist();
    bus.emit("shop-buy", item);
    return { ok: true, reason: `${item.name} achte!` };
  }

  equip(cosmeticId: string) {
    const item = COSMETICS.find((c) => c.id === cosmeticId);
    if (!item) return false;
    const p = this.save.state.profile;
    if (!p.unlockedCosmetics.includes(item.id)) return false;
    p.equipped[item.slot] = item.id;
    this.save.persist();
    return true;
  }
}
