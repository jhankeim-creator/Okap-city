import { MISSIONS } from "../data/world";
import { bus } from "../core/EventBus";
import type { SaveManager } from "../progression/SaveManager";
import type { XPSystem } from "../progression/XPSystem";

export class MissionSystem {
  constructor(
    private save: SaveManager,
    private xp: XPSystem,
  ) {}

  progress(stat: string, amount: number) {
    for (const m of MISSIONS) {
      if (m.stat !== stat) continue;
      if (this.save.state.profile.claimedMissions.includes(m.id)) continue;
      const cur = this.save.state.profile.missionProgress[m.id] ?? 0;
      this.save.state.profile.missionProgress[m.id] = Math.min(m.goal, cur + amount);
    }
    this.save.persist();
    bus.emit("missions");
  }

  claim(id: string) {
    const m = MISSIONS.find((x) => x.id === id);
    if (!m) return false;
    const p = this.save.state.profile;
    if (p.claimedMissions.includes(id)) return false;
    if ((p.missionProgress[id] ?? 0) < m.goal) return false;
    p.claimedMissions.push(id);
    this.xp.award(m.xp, m.title);
    this.save.addCoins(m.coins);
    if (m.kind === "story") p.storyRead.push(id);
    this.save.persist();
    bus.emit("mission-claim", m);
    return true;
  }

  list() {
    const p = this.save.state.profile;
    return MISSIONS.map((m) => ({
      ...m,
      progress: p.missionProgress[m.id] ?? 0,
      claimed: p.claimedMissions.includes(m.id),
    }));
  }
}
