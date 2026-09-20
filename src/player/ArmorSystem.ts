import { clamp } from "../core/Utils";

export class ArmorSystem {
  armor = 0;
  armorLevel = 0;
  helmet = 0;
  helmetLevel = 0;

  reset() {
    this.armor = 0;
    this.armorLevel = 0;
    this.helmet = 0;
    this.helmetLevel = 0;
  }

  applyBody(level: number) {
    this.armorLevel = clamp(level, 1, 3);
    this.armor = 40 + this.armorLevel * 30;
  }

  applyHelmet(level: number) {
    this.helmetLevel = clamp(level, 1, 3);
    this.helmet = 25 + this.helmetLevel * 20;
  }

  absorb(raw: number, headshot: boolean) {
    let remain = raw;
    if (headshot && this.helmet > 0) {
      const take = Math.min(this.helmet, remain * (0.35 + this.helmetLevel * 0.08));
      this.helmet -= take;
      remain -= take;
      if (this.helmet <= 0) this.helmetLevel = 0;
    }
    if (this.armor > 0) {
      const take = Math.min(this.armor, remain * (0.4 + this.armorLevel * 0.08));
      this.armor -= take;
      remain -= take;
      if (this.armor <= 0) this.armorLevel = 0;
    }
    return Math.max(0, remain);
  }
}
