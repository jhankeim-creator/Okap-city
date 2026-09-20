import * as THREE from "three";
import type { WeatherKind } from "../data/types";

export class WeatherSystem {
  kind: WeatherKind = "sole";
  timeOfDay = 10;
  rain: THREE.Points | null = null;
  private sun: THREE.DirectionalLight;
  private hemi: THREE.HemisphereLight;
  private fog: THREE.Fog;

  constructor(
    private scene: THREE.Scene,
    sun: THREE.DirectionalLight,
    hemi: THREE.HemisphereLight,
    fog: THREE.Fog,
  ) {
    this.sun = sun;
    this.hemi = hemi;
    this.fog = fog;
  }

  set(kind: WeatherKind) {
    this.kind = kind;
    if (this.rain) {
      this.scene.remove(this.rain);
      this.rain = null;
    }
    if (kind === "lapli") {
      const geo = new THREE.BufferGeometry();
      const n = 900;
      const pos = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) {
        pos[i * 3] = (Math.random() - 0.5) * 180;
        pos[i * 3 + 1] = Math.random() * 40;
        pos[i * 3 + 2] = (Math.random() - 0.5) * 180;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      this.rain = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0xa8d8ea, size: 0.12 }));
      this.scene.add(this.rain);
    }
  }

  update(dt: number, follow: THREE.Vector3) {
    this.timeOfDay = (this.timeOfDay + dt * 0.18) % 24;
    const day = this.timeOfDay > 6 && this.timeOfDay < 18;
    const t = Math.sin(((this.timeOfDay - 6) / 12) * Math.PI);
    const sunH = Math.max(0.05, t);
    this.sun.position.set(Math.cos(this.timeOfDay * 0.26) * 80, 20 + sunH * 70, Math.sin(this.timeOfDay * 0.26) * 80);
    this.sun.intensity = day ? 1.15 * sunH + 0.25 : 0.18;
    this.hemi.intensity = day ? 0.7 : 0.22;
    this.fog.color.set(this.kind === "bwouya" ? 0x9aa7b2 : day ? 0xb7d6e8 : 0x07111f);
    this.fog.near = this.kind === "bwouya" ? 12 : 30;
    this.fog.far = this.kind === "bwouya" ? 90 : this.kind === "nwaj" ? 160 : 220;
    this.scene.background = new THREE.Color(this.fog.color);
    if (this.rain) {
      this.rain.position.copy(follow);
      const att = this.rain.geometry.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < att.count; i++) {
        let y = att.getY(i) - dt * 28;
        if (y < 0) y = 40;
        att.setY(i, y);
      }
      att.needsUpdate = true;
    }
  }
}
