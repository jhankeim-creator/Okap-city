import * as THREE from "three";
import type { Stance } from "../data/types";
import type { Collider } from "../world/MapBuilder";
import { MapBuilder } from "../world/MapBuilder";
import { clamp } from "../core/Utils";
import type { SettingsState } from "../progression/SaveManager";

export class PlayerController {
  position = new THREE.Vector3(0, 0, 8);
  velocity = new THREE.Vector3();
  yaw = 0;
  pitch = -0.12;
  stance: Stance = "stand";
  grounded = true;
  sprinting = false;
  climbing = false;
  inVehicle = false;
  parachute = false;
  moveInput = new THREE.Vector2();
  lookInput = new THREE.Vector2();
  height = 1.7;
  private jumpVel = 0;

  constructor(
    private camera: THREE.PerspectiveCamera,
    private map: MapBuilder,
    private getColliders: () => Collider[],
    private settings: () => SettingsState,
  ) {}

  reset(pos: THREE.Vector3) {
    this.position.copy(pos);
    this.velocity.set(0, 0, 0);
    this.yaw = 0;
    this.pitch = -0.12;
    this.stance = "stand";
    this.sprinting = false;
    this.inVehicle = false;
    this.parachute = false;
    this.jumpVel = 0;
  }

  look(dx: number, dy: number, ads: boolean) {
    const s = this.settings();
    const mult = (ads ? s.aimSensitivity : s.sensitivity) * 0.0045;
    this.yaw -= dx * mult;
    this.pitch = clamp(this.pitch - dy * mult, -1.15, 0.55);
  }

  jump() {
    if (!this.grounded || this.stance === "prone" || this.inVehicle) return;
    this.jumpVel = 7.2;
    this.grounded = false;
    if (this.stance === "crouch") this.stance = "stand";
  }

  toggleCrouch() {
    this.stance = this.stance === "crouch" ? "stand" : "crouch";
  }

  toggleProne() {
    this.stance = this.stance === "prone" ? "stand" : "prone";
  }

  update(dt: number) {
    if (this.inVehicle) return;
    const speed =
      this.parachute
        ? 16
        : this.stance === "prone"
          ? 2.1
          : this.stance === "crouch"
            ? 3.4
            : this.sprinting
              ? 10.5
              : 6.4;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const wish = new THREE.Vector3();
    wish.addScaledVector(forward, this.moveInput.y);
    wish.addScaledVector(right, this.moveInput.x);
    if (wish.lengthSq() > 1) wish.normalize();
    this.velocity.x = wish.x * speed;
    this.velocity.z = wish.z * speed;

    if (this.parachute) {
      this.position.y = Math.max(0, this.position.y - 7 * dt);
      this.position.x += this.velocity.x * dt;
      this.position.z += this.velocity.z * dt;
      if (this.position.y <= 0.05) {
        this.parachute = false;
        this.position.y = 0;
        this.grounded = true;
      }
    } else {
      this.jumpVel -= 22 * dt;
      this.position.y = Math.max(0, this.position.y + this.jumpVel * dt);
      if (this.position.y <= 0) {
        this.position.y = 0;
        this.jumpVel = 0;
        this.grounded = true;
      }
      const nextX = this.position.x + this.velocity.x * dt;
      const nextZ = this.position.z + this.velocity.z * dt;
      const resolved = this.map.resolveCollision(nextX, nextZ, 0.45, this.getColliders());
      this.position.x = clamp(resolved.x, -200, 200);
      this.position.z = clamp(resolved.z, -200, 200);
    }
    this.updateCamera();
  }

  updateCamera(ads = false) {
    this.height = this.stance === "prone" ? 0.4 : this.stance === "crouch" ? 1.15 : 1.7;
    const back = ads ? 2.4 : 5.2;
    const side = ads ? 0.42 : 0.85;
    const camTarget = this.position.clone().add(new THREE.Vector3(0, this.height + 0.35, 0));
    const offset = new THREE.Vector3(
      Math.sin(this.yaw) * back + Math.cos(this.yaw) * side,
      1.55 - this.pitch * 1.8,
      Math.cos(this.yaw) * back - Math.sin(this.yaw) * side,
    );
    this.camera.position.copy(camTarget).add(offset);
    const look = camTarget.clone().add(new THREE.Vector3(-Math.sin(this.yaw), this.pitch, -Math.cos(this.yaw)));
    this.camera.lookAt(look);
  }

  aimOrigin() {
    const origin = this.position.clone();
    origin.y += this.height * 0.92;
    return origin;
  }

  aimDir() {
    return new THREE.Vector3(-Math.sin(this.yaw), this.pitch * 0.85, -Math.cos(this.yaw)).normalize();
  }
}
