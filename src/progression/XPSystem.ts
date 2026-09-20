import { bus } from "../core/EventBus";
import { xpForLevel } from "../core/Utils";
import type { SaveManager } from "./SaveManager";

export class XPSystem {
  constructor(private save: SaveManager) {}

  award(amount: number, reason: string) {
    const p = this.save.state.profile;
    p.xp += Math.max(0, Math.floor(amount));
    let leveled = false;
    while (p.level < 100 && p.xp >= xpForLevel(p.level)) {
      p.xp -= xpForLevel(p.level);
      p.level += 1;
      p.coins += 20 + p.level * 2;
      leveled = true;
      bus.emit("level-up", p.level);
    }
    this.save.persist();
    bus.emit("xp", { amount, reason, level: p.level, xp: p.xp, leveled });
    return { leveled, level: p.level };
  }

  matchReward(opts: { kills: number; assists: number; survived: number; won: boolean; loot: number }) {
    const xp =
      opts.kills * 40 +
      opts.assists * 16 +
      Math.floor(opts.survived * 0.8) +
      (opts.won ? 220 : 40) +
      opts.loot * 8;
    const coins = opts.kills * 12 + (opts.won ? 80 : 18) + Math.floor(opts.survived / 20);
    this.award(xp, opts.won ? " viktwa" : "match");
    this.save.addCoins(coins);
    const p = this.save.state.profile;
    p.matches += 1;
    p.kills += opts.kills;
    p.damage += 0;
    if (opts.won) {
      p.wins += 1;
      p.rankPoints += 80 + opts.kills * 8;
    } else {
      p.rankPoints = Math.max(0, p.rankPoints + 12 + opts.kills * 4);
    }
    this.save.persist();
    return { xp, coins };
  }
}
