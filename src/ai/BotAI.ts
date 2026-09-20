import * as THREE from "three";
import { CHARACTERS } from "../data/characters";
import { WEAPONS } from "../data/weapons";
import type { BotDifficulty, TeamMode } from "../data/types";
import { animateRig, attachWeaponToRig, createCharacterRig, type CharacterRig } from "../characters/CharacterFactory";
import type { SafeZoneSystem } from "../world/SafeZoneSystem";
import type { LootSystem } from "../loot/LootSystem";
import { clamp, pick, rand } from "../core/Utils";
import { bus } from "../core/EventBus";

export interface BotActor {
  id: string;
  name: string;
  team: number;
  isPlayer: boolean;
  rig: CharacterRig;
  position: THREE.Vector3;
  yaw: number;
  hp: number;
  armor: number;
  alive: boolean;
  downed: boolean;
  downTimer: number;
  weaponId: string;
  state: "wander" | "loot" | "fight" | "flee" | "heal" | "zone" | "down";
  cooldown: number;
  healCd: number;
  targetId: string | null;
  difficulty: BotDifficulty;
}

const DIFF: Record<BotDifficulty, { acc: number; react: number; dmg: number; speed: number }> = {
  EASY: { acc: 0.28, react: 0.9, dmg: 0.65, speed: 4.6 },
  NORMAL: { acc: 0.48, react: 0.55, dmg: 0.85, speed: 5.6 },
  HARD: { acc: 0.68, react: 0.32, dmg: 1, speed: 6.6 },
  EXTREME: { acc: 0.82, react: 0.18, dmg: 1.15, speed: 7.4 },
};

export class BotAI {
  bots: BotActor[] = [];

  constructor(
    private scene: THREE.Scene,
    private zone: SafeZoneSystem,
    private loot: LootSystem,
  ) {}

  spawn(count: number, difficulty: BotDifficulty, mode: TeamMode, playerTeam: number) {
    this.clear();
    const squadSize = mode === "SQUAD" ? 4 : mode === "DUO" ? 2 : 1;
    let spawned = 0;
    for (let i = 1; i < squadSize && spawned < count; i++) {
      this.bots.push(this.makeBot(spawned, playerTeam, difficulty, true));
      spawned++;
    }
    let team = playerTeam + 1;
    let inTeam = 0;
    while (spawned < count) {
      this.bots.push(this.makeBot(spawned, team, difficulty, false));
      spawned++;
      inTeam++;
      if (inTeam >= squadSize) {
        team += 1;
        inTeam = 0;
      }
    }
  }

  private makeBot(i: number, team: number, difficulty: BotDifficulty, ally: boolean): BotActor {
    const def = CHARACTERS[(i + 1) % CHARACTERS.length];
    const rig = createCharacterRig(def.id, 1, { detail: "high" });
    const ang = rand(0, Math.PI * 2);
    const r = rand(12, 70);
    const pos = new THREE.Vector3(Math.cos(ang) * r, 0, Math.sin(ang) * r);
    rig.root.position.copy(pos);
    this.scene.add(rig.root);
    const weapon = pick(WEAPONS.filter((w) => w.category !== "MELEE"));
    attachWeaponToRig(rig, weapon.category);
    return {
      id: `bot-${i}`,
      name: ally ? `${def.name} (ekip)` : def.name,
      team,
      isPlayer: false,
      rig,
      position: pos,
      yaw: rand(0, Math.PI * 2),
      hp: 100,
      armor: ally ? 40 : 20,
      alive: true,
      downed: false,
      downTimer: 0,
      weaponId: weapon.id,
      state: "wander",
      cooldown: rand(0.2, 1.2),
      healCd: 0,
      targetId: null,
      difficulty,
    };
  }

  update(dt: number, t: number, playerPos: THREE.Vector3, playerAlive: boolean, playerTeam: number) {
    for (const b of this.bots) {
      if (!b.alive) {
        animateRig(b.rig, "dead", t);
        continue;
      }
      if (b.downed) {
        b.downTimer -= dt;
        animateRig(b.rig, "down", t);
        if (b.downTimer <= 0) this.kill(b, "down-timer");
        else this.tryRevive(b, dt);
        b.rig.root.position.copy(b.position);
        continue;
      }
      if (!this.zone.inside(b.position.x, b.position.z)) {
        b.state = "zone";
        b.hp -= this.zone.damagePerSecond() * dt * 0.7;
        if (b.hp <= 0) this.down(b);
      }
      const d = DIFF[b.difficulty];
      const enemy = this.closestEnemy(b, playerPos, playerAlive, playerTeam);
      if (enemy && enemy.dist < 42) {
        b.state = b.hp < 28 ? "flee" : "fight";
        b.targetId = enemy.id;
      } else if (b.hp < 45 && b.healCd <= 0) {
        b.state = "heal";
      } else if (b.state !== "zone") {
        b.state = Math.random() < 0.01 ? "loot" : "wander";
      }

      let wish = new THREE.Vector3();
      if (b.state === "zone") {
        wish.set(this.zone.cx - b.position.x, 0, this.zone.cz - b.position.z);
      } else if (b.state === "flee" && enemy) {
        wish.set(b.position.x - enemy.pos.x, 0, b.position.z - enemy.pos.z);
      } else if (b.state === "fight" && enemy) {
        const gap = enemy.dist - 16;
        wish.set(enemy.pos.x - b.position.x, 0, enemy.pos.z - b.position.z);
        if (Math.abs(gap) < 4) wish.set(Math.cos(t + iHash(b.id)), 0, Math.sin(t + iHash(b.id)));
        b.yaw = Math.atan2(-(enemy.pos.x - b.position.x), -(enemy.pos.z - b.position.z));
        b.cooldown -= dt;
        if (b.cooldown <= 0 && enemy.dist < 48) {
          b.cooldown = d.react + rand(0.08, 0.35);
          if (Math.random() < d.acc) {
            bus.emit("bot-shot", { from: b, to: enemy.id, damage: 12 * d.dmg, head: Math.random() < 0.12 });
          }
        }
        animateRig(b.rig, "shoot", t);
      } else if (b.state === "heal") {
        b.hp = clamp(b.hp + 18 * dt, 0, 100);
        b.healCd = 6;
        if (b.hp > 70) b.state = "wander";
        animateRig(b.rig, "idle", t);
      } else if (b.state === "loot") {
        const drop = this.loot.nearest(b.position.x, b.position.z, 40);
        if (drop) wish.set(drop.position.x - b.position.x, 0, drop.position.z - b.position.z);
        animateRig(b.rig, "run", t);
      } else {
        wish.set(Math.sin(t * 0.2 + iHash(b.id)), 0, Math.cos(t * 0.17 + iHash(b.id)));
        animateRig(b.rig, "walk", t, { speed: 0.8 });
      }

      if (b.state !== "fight" && b.state !== "heal") {
        if (wish.lengthSq() > 0.01) {
          wish.normalize();
          b.position.x = clamp(b.position.x + wish.x * d.speed * dt, -195, 195);
          b.position.z = clamp(b.position.z + wish.z * d.speed * dt, -195, 195);
          b.yaw = Math.atan2(-wish.x, -wish.z);
        }
        if (b.state !== "loot") animateRig(b.rig, b.state === "flee" || b.state === "zone" ? "sprint" : "walk", t);
      }
      b.healCd = Math.max(0, b.healCd - dt);
      b.rig.root.position.copy(b.position);
      b.rig.root.rotation.y = b.yaw;
    }
  }

  private closestEnemy(b: BotActor, playerPos: THREE.Vector3, playerAlive: boolean, playerTeam: number) {
    let best: { id: string; pos: THREE.Vector3; dist: number } | null = null;
    if (playerAlive && b.team !== playerTeam) {
      const dist = b.position.distanceTo(playerPos);
      best = { id: "player", pos: playerPos, dist };
    }
    for (const o of this.bots) {
      if (!o.alive || o.downed || o.id === b.id || o.team === b.team) continue;
      const dist = b.position.distanceTo(o.position);
      if (!best || dist < best.dist) best = { id: o.id, pos: o.position, dist };
    }
    return best;
  }

  applyDamage(id: string, amount: number, attacker: string) {
    if (id === "player") return false;
    const b = this.bots.find((x) => x.id === id);
    if (!b || !b.alive) return false;
    const remain = Math.max(0, amount - b.armor * 0.15);
    b.armor = Math.max(0, b.armor - amount * 0.25);
    b.hp -= remain;
    if (b.hp <= 0) this.down(b, attacker);
    return true;
  }

  down(b: BotActor, attacker = "zone") {
    if (b.downed || !b.alive) return;
    b.downed = true;
    b.downTimer = 14;
    b.state = "down";
    bus.emit("bot-down", { bot: b, attacker });
  }

  kill(b: BotActor, attacker: string) {
    if (!b.alive) return;
    b.alive = false;
    b.downed = false;
    bus.emit("bot-killed", { bot: b, attacker });
  }

  private tryRevive(b: BotActor, dt: number) {
    const mate = this.bots.find((o) => o.alive && !o.downed && o.team === b.team && o.id !== b.id && o.position.distanceTo(b.position) < 2.4);
    if (mate) {
      b.downTimer += dt * 0.4;
      if (Math.random() < 0.01) {
        b.downed = false;
        b.hp = 28;
        b.state = "flee";
        bus.emit("bot-revived", b);
      }
    }
  }

  aliveCount() {
    return this.bots.filter((b) => b.alive).length;
  }

  teammates(team: number) {
    return this.bots.filter((b) => b.team === team && b.alive);
  }

  clear() {
    for (const b of this.bots) this.scene.remove(b.rig.root);
    this.bots = [];
  }
}

function iHash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h % 1000) / 100;
}
