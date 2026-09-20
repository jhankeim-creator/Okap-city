import * as THREE from "three";
import type { LootSystem } from "../loot/LootSystem";
import { bus } from "../core/EventBus";

export class AirDropSystem {
  timer = 35;
  crate: THREE.Group | null = null;
  falling = false;

  constructor(
    private scene: THREE.Scene,
    private loot: LootSystem,
  ) {}

  reset() {
    this.timer = 28 + Math.random() * 18;
    if (this.crate) this.scene.remove(this.crate);
    this.crate = null;
    this.falling = false;
  }

  update(dt: number, zone: { cx: number; cz: number; radius: number }) {
    this.timer -= dt;
    if (!this.falling && this.timer <= 0) {
      this.start(zone.cx + (Math.random() - 0.5) * zone.radius * 0.6, zone.cz + (Math.random() - 0.5) * zone.radius * 0.6);
    }
    if (this.crate && this.falling) {
      this.crate.position.y -= 8 * dt;
      this.crate.rotation.y += dt;
      if (this.crate.position.y <= 1.2) {
        this.crate.position.y = 1.2;
        this.falling = false;
        this.timer = 50;
        const p = this.crate.position;
        this.loot.spawn(new THREE.Vector3(p.x, 0.5, p.z), "LEGENDARY");
        this.loot.spawn(new THREE.Vector3(p.x + 1.2, 0.5, p.z), "EPIC");
        this.loot.spawn(new THREE.Vector3(p.x - 1.1, 0.5, p.z + 0.8), "RARE");
        bus.emit("airdrop-landed", p.clone());
      }
    }
  }

  private start(x: number, z: number) {
    if (this.crate) this.scene.remove(this.crate);
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 1.6), new THREE.MeshLambertMaterial({ color: 0xd4a017 }));
    const chute = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.6, 8), new THREE.MeshLambertMaterial({ color: 0xe63946, transparent: true, opacity: 0.75 }));
    chute.position.y = 2.1;
    chute.rotation.x = Math.PI;
    const smoke = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshLambertMaterial({ color: 0xe07a5f, transparent: true, opacity: 0.45 }));
    smoke.position.y = 0.2;
    g.add(box, chute, smoke);
    g.position.set(x, 42, z);
    this.scene.add(g);
    this.crate = g;
    this.falling = true;
    bus.emit("airdrop", { x, z });
  }
}
