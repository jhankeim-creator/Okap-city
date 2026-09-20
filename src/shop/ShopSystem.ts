import { COSMETICS } from "../data/world";
import type { CurrencySystem } from "../progression/CurrencySystem";

export class ShopSystem {
  rotation: string[] = [];
  dayKey = "";

  constructor(private currency: CurrencySystem) {
    this.refresh();
  }

  refresh() {
    const day = new Date().toISOString().slice(0, 10);
    if (this.dayKey === day && this.rotation.length) return;
    this.dayKey = day;
    const seed = [...day].reduce((a, c) => a + c.charCodeAt(0), 0);
    const pool = [...COSMETICS].sort((a, b) => (a.id.charCodeAt(0) + seed) % 7 - ((b.id.charCodeAt(0) + seed) % 7));
    this.rotation = pool.slice(0, 6).map((c) => c.id);
  }

  items() {
    this.refresh();
    return COSMETICS.filter((c) => this.rotation.includes(c.id));
  }

  buy(id: string) {
    return this.currency.buy(id);
  }
}
