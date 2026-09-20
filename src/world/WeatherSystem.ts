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
    this.timeOfDay = (this.timeOfDay + dt * 0.025) % 24;
    const day = this.timeOfDay > 5.5 && this.timeOfDay < 18.5;
    const t = Math.sin(((this.timeOfDay - 6) / 12) * Math.PI);
    const sunH = Math.max(0.18, t);
    this.sun.position.set(Math.cos(this.timeOfDay * 0.26) * 80, 28 + sunH * 70, Math.sin(this.timeOfDay * 0.26) * 80);
    this.sun.intensity = day ? 1.35 * sunH + 0.45 : 0.28;
    this.hemi.intensity = day ? 0.95 : 0.32;
    const sky = this.kind === "bwouya" ? 0xa9c0cc : day ? 0x7ec8ea : 0x10233d;
    this.fog.color.set(sky);
    this.fog.near = this.kind === "bwouya" ? 40 : 160;
    this.fog.far = this.kind === "bwouya" ? 180 : this.kind === "nwaj" ? 340 : 520;
    this.scene.background = new THREE.Color(sky);
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
