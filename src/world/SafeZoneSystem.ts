import * as THREE from "three";
import { bus } from "../core/EventBus";
import { circleContains, dist2 } from "../core/Utils";

export class SafeZoneSystem {
  cx = 0;
  cz = 0;
  radius = 210;
  nextCx = 0;
  nextCz = 0;
  nextRadius = 140;
  timer = 45;
  shrinking = false;
  shrinkT = 0;
  phase = 0;
  mesh: THREE.Mesh;
  nextMesh: THREE.Mesh;
  private readonly phases = [
    { r: 140, wait: 40, dmg: 2 },
    { r: 90, wait: 32, dmg: 4 },
    { r: 50, wait: 24, dmg: 7 },
    { r: 24, wait: 18, dmg: 11 },
    { r: 10, wait: 14, dmg: 16 },
  ];

  constructor(scene: THREE.Scene) {
    const ring = new THREE.RingGeometry(209, 210, 64);
    ring.rotateX(-Math.PI / 2);
    this.mesh = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color: 0x4ea8de, side: THREE.DoubleSide, transparent: true, opacity: 0.55 }));
    this.mesh.position.y = 0.2;
    scene.add(this.mesh);
    const next = new THREE.RingGeometry(139, 140, 48);
    next.rotateX(-Math.PI / 2);
    this.nextMesh = new THREE.Mesh(next, new THREE.MeshBasicMaterial({ color: 0xd4a017, side: THREE.DoubleSide, transparent: true, opacity: 0.28 }));
    this.nextMesh.position.y = 0.22;
    scene.add(this.nextMesh);
  }

  reset() {
    this.cx = 0;
    this.cz = 0;
    this.radius = 210;
    this.phase = 0;
    this.pickNext();
    this.timer = this.phases[0].wait;
    this.shrinking = false;
    this.updateMeshes();
  }

  private pickNext() {
    const p = this.phases[Math.min(this.phase, this.phases.length - 1)];
    const ang = Math.random() * Math.PI * 2;
    const maxOff = Math.max(0, this.radius - p.r);
    const off = Math.random() * maxOff * 0.7;
    this.nextRadius = p.r;
    this.nextCx = this.cx + Math.cos(ang) * off;
    this.nextCz = this.cz + Math.sin(ang) * off;
  }

  update(dt: number) {
    if (this.shrinking) {
      this.shrinkT += dt / 16;
      const t = Math.min(1, this.shrinkT);
      this.cx += (this.nextCx - this.cx) * (dt * 0.18);
      this.cz += (this.nextCz - this.cz) * (dt * 0.18);
      this.radius += (this.nextRadius - this.radius) * (dt * 0.18);
      if (t >= 1 || Math.abs(this.radius - this.nextRadius) < 0.8) {
        this.radius = this.nextRadius;
        this.cx = this.nextCx;
        this.cz = this.nextCz;
        this.shrinking = false;
        this.phase = Math.min(this.phase + 1, this.phases.length - 1);
        this.pickNext();
        this.timer = this.phases[this.phase].wait;
        bus.emit("zone-closed", this.phase);
      }
    } else {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.shrinking = true;
        this.shrinkT = 0;
        bus.emit("zone-closing");
      }
    }
    this.updateMeshes();
  }

  private updateMeshes() {
    this.mesh.position.x = this.cx;
    this.mesh.position.z = this.cz;
    this.mesh.scale.setScalar(Math.max(0.04, this.radius / 210));
    this.nextMesh.position.x = this.nextCx;
    this.nextMesh.position.z = this.nextCz;
    this.nextMesh.scale.setScalar(Math.max(0.03, this.nextRadius / 210));
  }

  inside(x: number, z: number) {
    return circleContains(this.cx, this.cz, this.radius, x, z);
  }

  damagePerSecond() {
    return this.phases[Math.min(this.phase, this.phases.length - 1)].dmg;
  }

  distOutside(x: number, z: number) {
    return Math.max(0, dist2(this.cx, this.cz, x, z) - this.radius);
  }
}
