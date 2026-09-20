import * as THREE from "three";
import { VEHICLES } from "../data/world";
import type { VehicleDef } from "../data/types";
import { clamp } from "../core/Utils";
import type { Collider } from "../world/MapBuilder";
import type { MapBuilder } from "../world/MapBuilder";

export interface VehicleActor {
  def: VehicleDef;
  mesh: THREE.Group;
  position: THREE.Vector3;
  yaw: number;
  speed: number;
  fuel: number;
  health: number;
  occupied: boolean;
}

function carMesh(def: VehicleDef) {
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.35, metalness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.2 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x89c2d9, roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.45 });
  if (def.kind === "MOTORCYCLE") {
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 1.9), paint);
    body.position.y = 0.55;
    body.castShadow = true;
    g.add(body);
  } else {
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.05, 0.95, 4.55), paint);
    body.position.y = 0.78;
    body.castShadow = true;
    g.add(body);
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.82, 2.15), glass);
    cabin.position.set(0, 1.48, -0.28);
    g.add(cabin);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(1.95, 0.08, 2.25), paint);
    roof.position.set(0, 1.92, -0.22);
    g.add(roof);
    const rack = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.06, 2.05), dark);
    rack.position.set(0, 2.02, -0.2);
    g.add(rack);
    for (const sx of [-0.62, 0.62]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 2.1), dark);
      rail.position.set(sx, 2.06, -0.2);
      g.add(rail);
    }
    const spare = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.16, 14), dark);
    spare.rotation.z = Math.PI / 2;
    spare.position.set(0, 0.92, 2.42);
    g.add(spare);
    const cap = new THREE.Mesh(new THREE.CircleGeometry(0.28, 16), new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.4 }));
    cap.position.set(0, 0.92, 2.51);
    g.add(cap);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.12, 0.06), new THREE.MeshStandardMaterial({ color: 0xc81e1e, emissive: 0x7a1010, emissiveIntensity: 0.35 }));
    tail.position.set(0, 0.95, 2.3);
    g.add(tail);
    for (const [x, z] of [
      [-0.95, 1.45],
      [0.95, 1.45],
      [-0.95, -1.45],
      [0.95, -1.45],
    ]) {
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.28, 12), dark);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.38, z);
      g.add(wheel);
    }
  }
  g.userData.vehicleId = def.id;
  return g;
}

export class VehicleController {
  vehicles: VehicleActor[] = [];
  current: VehicleActor | null = null;

  constructor(
    private scene: THREE.Scene,
    private map: MapBuilder,
    private getColliders: () => Collider[],
  ) {}

  spawnAround() {
    this.clear();
    const spots = [
      new THREE.Vector3(10, 0, 16),
      new THREE.Vector3(-90, 0, 100),
      new THREE.Vector3(100, 0, 20),
      new THREE.Vector3(-20, 0, 140),
      new THREE.Vector3(16, 0, -80),
      new THREE.Vector3(-110, 0, -10),
      new THREE.Vector3(110, 0, 90),
    ];
    spots.forEach((p, i) => {
      const def = VEHICLES[i % VEHICLES.length];
      const mesh = carMesh(def);
      mesh.position.copy(p);
      this.scene.add(mesh);
      this.vehicles.push({
        def,
        mesh,
        position: p.clone(),
        yaw: Math.random() * Math.PI,
        speed: 0,
        fuel: def.fuel,
        health: def.health,
        occupied: false,
      });
    });
  }

  nearest(x: number, z: number, max = 3.2) {
    let best: VehicleActor | null = null;
    let d = max;
    for (const v of this.vehicles) {
      const dist = Math.hypot(v.position.x - x, v.position.z - z);
      if (dist < d && !v.occupied) {
        d = dist;
        best = v;
      }
    }
    return best;
  }

  enter(v: VehicleActor) {
    v.occupied = true;
    this.current = v;
  }

  exit() {
    if (!this.current) return;
    this.current.occupied = false;
    this.current.speed = 0;
    this.current = null;
  }

  drive(dt: number, throttle: number, steer: number) {
    const v = this.current;
    if (!v || v.fuel <= 0 || v.health <= 0) return;
    const acc = throttle * v.def.acceleration - Math.sign(v.speed) * (throttle === 0 ? v.def.brake * 0.35 : 0);
    v.speed = clamp(v.speed + acc * dt, -v.def.speed * 0.4, v.def.speed);
    v.yaw -= steer * dt * (v.speed / 10);
    const nx = v.position.x - Math.sin(v.yaw) * v.speed * dt;
    const nz = v.position.z - Math.cos(v.yaw) * v.speed * dt;
    const resolved = this.map.resolveCollision(nx, nz, 1.2, this.getColliders());
    if (Math.hypot(resolved.x - nx, resolved.z - nz) > 0.2) {
      v.speed *= 0.3;
      v.health -= 8 * dt;
    }
    v.position.x = resolved.x;
    v.position.z = resolved.z;
    v.fuel = Math.max(0, v.fuel - Math.abs(v.speed) * dt * 0.08);
    v.mesh.position.copy(v.position);
    v.mesh.rotation.y = v.yaw;
  }

  syncMeshes() {
    for (const v of this.vehicles) {
      v.mesh.position.copy(v.position);
      v.mesh.rotation.y = v.yaw;
    }
  }

  clear() {
    for (const v of this.vehicles) this.scene.remove(v.mesh);
    this.vehicles = [];
    this.current = null;
  }
}
