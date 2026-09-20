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
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(def.kind === "MOTORCYCLE" ? 0.7 : 2.4, def.kind === "MOTORCYCLE" ? 0.7 : 0.9, def.kind === "MOTORCYCLE" ? 2.1 : 4.4),
    new THREE.MeshLambertMaterial({ color: def.color }),
  );
  body.position.y = def.kind === "MOTORCYCLE" ? 0.55 : 0.7;
  body.castShadow = true;
  g.add(body);
  if (def.kind !== "MOTORCYCLE") {
    const cabin = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.7, 2.1), new THREE.MeshLambertMaterial({ color: 0x7ec8e3, transparent: true, opacity: 0.55 }));
    cabin.position.set(0, 1.25, -0.3);
    g.add(cabin);
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
      new THREE.Vector3(18, 0, 22),
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
