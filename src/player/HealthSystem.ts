import { bus } from "../core/EventBus";
import { clamp } from "../core/Utils";

export class HealthSystem {
  max = 100;
  hp = 100;
  downed = false;
  dead = false;
  downTimer = 0;
  healing = 0;
  healTarget = 0;
  healLocked = false;

  reset() {
    this.hp = this.max;
    this.downed = false;
    this.dead = false;
    this.downTimer = 0;
    this.healing = 0;
    this.healLocked = false;
    bus.emit("health", this.hp);
  }

  damage(amount: number, source = "unknown") {
    if (this.dead) return 0;
    const applied = Math.max(0, amount);
    this.hp = clamp(this.hp - applied, 0, this.max);
    this.healing = 0;
    this.healLocked = false;
    bus.emit("hurt", { amount: applied, source, hp: this.hp });
    if (this.hp <= 0) {
      if (!this.downed) {
        this.downed = true;
        this.downTimer = 18;
        this.hp = 0;
        bus.emit("downed");
      } else {
        this.finish();
      }
    }
    return applied;
  }

  finish() {
    this.dead = true;
    this.downed = false;
    bus.emit("death");
  }

  revive() {
    if (!this.downed || this.dead) return false;
    this.downed = false;
    this.hp = 30;
    this.downTimer = 0;
    bus.emit("revived");
    bus.emit("health", this.hp);
    return true;
  }

  startHeal(amount: number, duration: number, lock = true) {
    if (this.dead || this.downed || this.hp >= this.max) return false;
    this.healing = duration;
    this.healTarget = amount;
    this.healLocked = lock;
    bus.emit("heal-start", { amount, duration });
    return true;
  }

  update(dt: number) {
    if (this.downed) {
      this.downTimer -= dt;
      if (this.downTimer <= 0) this.finish();
    }
    if (this.healing > 0) {
      this.healing -= dt;
      if (this.healing <= 0) {
        this.hp = clamp(this.hp + this.healTarget, 0, this.max);
        this.healLocked = false;
        this.healing = 0;
        bus.emit("heal-done", this.hp);
        bus.emit("health", this.hp);
      }
    }
  }
}
