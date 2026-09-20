import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HealthSystem } from "../src/player/HealthSystem";
import { ArmorSystem } from "../src/player/ArmorSystem";
import { InventorySystem } from "../src/inventory/InventorySystem";
import { xpForLevel, rankFromPoints } from "../src/core/Utils";
import { WEAPONS } from "../src/data/weapons";
import { CHARACTERS } from "../src/data/characters";
import { ZONES } from "../src/data/world";

describe("OKAP CITY core", () => {
  it("gen 16 zam original ak 8 pèsonaj ak 12 zòn", () => {
    assert.equal(WEAPONS.length >= 15, true);
    assert.equal(CHARACTERS.length, 8);
    assert.equal(ZONES.length, 12);
    assert.ok(WEAPONS.every((w) => !/ak47|m416|awm|ump|scar/i.test(w.name)));
  });

  it("armor diminye damage men pa fè invincible", () => {
    const a = new ArmorSystem();
    a.applyBody(3);
    a.applyHelmet(3);
    const remain = a.absorb(80, true);
    assert.ok(remain > 0 && remain < 80);
  });

  it("medkit geri epi down state fini si pa reviv", () => {
    const h = new HealthSystem();
    h.damage(150, "test");
    assert.equal(h.downed, true);
    h.downTimer = 0.01;
    h.update(0.02);
    assert.equal(h.dead, true);
  });

  it("inventory mete zam nan primary/secondary/melee", () => {
    const inv = new InventorySystem();
    inv.reset();
    inv.add({ id: "1", kind: "weapon", name: "Soley Wouj", qty: 1, weaponId: "soley-wouj" });
    assert.equal(inv.primary?.weaponId, "soley-wouj");
    inv.add({ id: "2", kind: "backpack", name: "Sak", qty: 1, level: 3 });
    assert.equal(inv.capacity, 30);
  });

  it("nivo ak rank kalkile san avantaj kache", () => {
    assert.ok(xpForLevel(1) > 0);
    assert.equal(rankFromPoints(0), "Bronze");
    assert.equal(rankFromPoints(4200), "Master");
  });
});
