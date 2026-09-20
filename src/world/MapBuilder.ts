import * as THREE from "three";
import { MAP_SIZE, ZONES } from "../data/world";
import type { ZoneDef } from "../data/types";
import { PLATE, asphalt, glass, grass, photoMat, roofMat, sand, std, stucco, wood } from "./Materials";

export interface Collider {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  minY: number;
  maxY: number;
  enterable?: boolean;
  door?: THREE.Vector3;
}

export interface MapData {
  group: THREE.Group;
  colliders: Collider[];
  interactables: { kind: "door" | "vehicle-spot" | "crate"; position: THREE.Vector3; radius: number }[];
  spawnPoints: THREE.Vector3[];
  zoneMeshes: THREE.Group;
}

function lamb(color: number, emissive = 0x000000, em = 0) {
  return std(color, { emissive, emissiveIntensity: em });
}

function addBox(
  parent: THREE.Object3D,
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  mat: THREE.Material,
  cast = true,
) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

function hipRoof(w: number, d: number, h: number) {
  const hw = w / 2;
  const hd = d / 2;
  const ridge = Math.min(w, d) * 0.2;
  const alongX = w >= d;
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];

  const face = (pts: number[][], uvs: number[][]) => {
    const start = pos.length / 3;
    for (const p of pts) pos.push(p[0], p[1], p[2]);
    for (const u of uvs) uv.push(u[0], u[1]);
    if (pts.length === 3) idx.push(start, start + 1, start + 2);
    else idx.push(start, start + 1, start + 2, start, start + 2, start + 3);
  };

  if (alongX) {
    const r0 = [-hw + ridge, h, 0];
    const r1 = [hw - ridge, h, 0];
    face(
      [[-hw, 0, hd], [hw, 0, hd], r1, r0],
      [[0, 0], [1, 0], [0.82, 1], [0.18, 1]],
    );
    face(
      [[hw, 0, -hd], [-hw, 0, -hd], r0, r1],
      [[0, 0], [1, 0], [0.82, 1], [0.18, 1]],
    );
    face(
      [[-hw, 0, -hd], [-hw, 0, hd], r0],
      [[0, 0], [1, 0], [0.5, 1]],
    );
    face(
      [[hw, 0, hd], [hw, 0, -hd], r1],
      [[0, 0], [1, 0], [0.5, 1]],
    );
  } else {
    const r0 = [0, h, -hd + ridge];
    const r1 = [0, h, hd - ridge];
    face(
      [[-hw, 0, -hd], [-hw, 0, hd], r1, r0],
      [[0, 0], [1, 0], [0.82, 1], [0.18, 1]],
    );
    face(
      [[hw, 0, hd], [hw, 0, -hd], r0, r1],
      [[0, 0], [1, 0], [0.82, 1], [0.18, 1]],
    );
    face(
      [[-hw, 0, hd], [hw, 0, hd], r1],
      [[0, 0], [1, 0], [0.5, 1]],
    );
    face(
      [[hw, 0, -hd], [-hw, 0, -hd], r0],
      [[0, 0], [1, 0], [0.5, 1]],
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

export class MapBuilder {
  build(): MapData {
    const group = new THREE.Group();
    const colliders: Collider[] = [];
    const interactables: MapData["interactables"] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const zoneMeshes = new THREE.Group();
    group.add(zoneMeshes);

    this.sky(group);
    this.photoHorizon(group);
    this.ground(group);
    this.ocean(group);
    this.distantHills(group);
    this.roads(group);

    for (const zone of ZONES) {
      this.buildZone(zone, zoneMeshes, colliders, interactables, spawnPoints);
    }

    this.scatterProps(group, colliders);
    return { group, colliders, interactables, spawnPoints, zoneMeshes };
  }

  private sky(group: THREE.Group) {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(520, 32, 20),
      new THREE.MeshBasicMaterial({ color: 0x7ec8ea, side: THREE.BackSide, fog: false }),
    );
    group.add(sky);
    const sun = new THREE.Mesh(new THREE.SphereGeometry(10, 16, 16), new THREE.MeshBasicMaterial({ color: 0xffe7a3, fog: false }));
    sun.position.set(110, 78, 48);
    group.add(sun);
  }

  private photoHorizon(group: THREE.Group) {
    const plates = [
      { tex: PLATE.city, ang: 0.15, w: 210, h: 62 },
      { tex: PLATE.coast, ang: 1.72, w: 180, h: 52 },
      { tex: PLATE.harbor, ang: 3.2, w: 140, h: 44 },
      { tex: PLATE.hills, ang: 4.7, w: 150, h: 46 },
    ];
    const r = 210;
    for (const p of plates) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(p.w, p.h), photoMat(p.tex, false));
      mesh.position.set(Math.sin(p.ang) * r, p.h * 0.38, Math.cos(p.ang) * r);
      mesh.lookAt(0, p.h * 0.32, 0);
      group.add(mesh);
    }
  }

  private ground(group: THREE.Group) {
    const lawn = new THREE.Mesh(new THREE.PlaneGeometry(MAP_SIZE * 2.2, MAP_SIZE * 2.2), grass());
    lawn.rotation.x = -Math.PI / 2;
    lawn.receiveShadow = true;
    group.add(lawn);
    const beach = new THREE.Mesh(new THREE.PlaneGeometry(420, 90), sand());
    beach.rotation.x = -Math.PI / 2;
    beach.position.set(-20, 0.03, 168);
    beach.receiveShadow = true;
    group.add(beach);
  }

  private ocean(group: THREE.Group) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(980, 320, 24, 10),
      new THREE.MeshStandardMaterial({ color: 0x1b93b0, roughness: 0.16, metalness: 0.22, transparent: true, opacity: 0.94 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-20, 0.02, 268);
    group.add(water);
  }

  private distantHills(group: THREE.Group) {
    const mat = grass();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2 + 0.2;
      const r = 188 + (i % 4) * 10;
      const hill = new THREE.Mesh(new THREE.SphereGeometry(16 + (i % 5) * 5, 10, 7, 0, Math.PI * 2, 0, Math.PI / 2), mat);
      hill.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
      hill.scale.y = 1.35 + (i % 3) * 0.28;
      group.add(hill);
    }
  }

  private roads(group: THREE.Group) {
    const mat = asphalt();
    const mark = std(0xf4f1ea);
    const axes = [
      { w: 14, d: 360, x: 0, z: 10 },
      { w: 360, d: 12, x: 0, z: 0 },
      { w: 12, d: 260, x: 110, z: 10 },
      { w: 12, d: 260, x: -120, z: 10 },
      { w: 240, d: 10, x: -20, z: 88 },
      { w: 240, d: 10, x: 10, z: -90 },
    ];
    for (const a of axes) {
      addBox(group, a.w, 0.08, a.d, a.x, 0.04, a.z, mat, false);
      addBox(group, Math.min(1.2, a.w), 0.1, Math.min(a.d, 2), a.x, 0.09, a.z, mark, false);
    }
  }

  private buildZone(
    zone: ZoneDef,
    parent: THREE.Group,
    colliders: Collider[],
    interactables: MapData["interactables"],
    spawns: THREE.Vector3[],
  ) {
    const g = new THREE.Group();
    g.name = zone.id;
    parent.add(g);
    const sign = addBox(g, 6, 3.2, 0.4, zone.x, 1.7, zone.z - zone.radius * 0.55, lamb(0x07111f, 0xd4a017, 0.15));
    sign.userData.zoneSign = zone.name;

    switch (zone.id) {
      case "downtown":
        this.downtown(g, zone, colliders, interactables);
        break;
      case "mache":
        this.market(g, zone, colliders);
        break;
      case "rezidans":
        this.houses(g, zone, colliders, interactables, 0xf2cc8f);
        break;
      case "port":
        this.port(g, zone, colliders);
        break;
      case "plaj":
        this.beach(g, zone, colliders);
        break;
      case "endistri":
        this.industrial(g, zone, colliders);
        break;
      case "gaz":
        this.gas(g, zone, colliders);
        break;
      case "mon":
        this.mountains(g, zone, colliders);
        break;
      case "fore":
        this.forest(g, zone);
        break;
      case "plas":
        this.plaza(g, zone, colliders);
        break;
      case "abandone":
        this.ruins(g, zone, colliders, interactables);
        break;
      case "ayewopo":
        this.airport(g, zone, colliders);
        break;
    }
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.4;
      spawns.push(new THREE.Vector3(zone.x + Math.cos(a) * (zone.radius * 0.4), 0, zone.z + Math.sin(a) * (zone.radius * 0.4)));
    }
  }

  private downtown(g: THREE.Group, zone: ZoneDef, colliders: Collider[], interactables: MapData["interactables"]) {
    this.heroCourtyard(g, colliders, interactables);
    const colors = [0xd9c3a3, 0x8ecae6, 0xf4a261, 0x90be6d, 0xf1faee, 0xe07a5f, 0xbde0fe, 0xf2d0a4, 0xb5838d];
    const plates = [PLATE.cream, PLATE.blue];
    let n = 0;
    for (let ix = -2; ix <= 2; ix++) {
      for (let iz = -2; iz <= 2; iz++) {
        if (ix === 0 && (iz === 0 || iz === 1 || iz === -1)) continue;
        this.caribbeanHouse(g, zone.x + ix * 17, zone.z + iz * 17, colors[n % colors.length], colliders, true, plates[n % 2]);
        this.palm(g, zone.x + ix * 17 + 6.2, zone.z + iz * 17 + 4.2);
        n++;
      }
    }
    this.church(g, zone.x - 28, zone.z - 22, colliders);
  }

  private heroCourtyard(g: THREE.Group, colliders: Collider[], interactables: MapData["interactables"]) {
    addBox(g, 26, 0.07, 24, 0, 0.035, 8, std(0xd4c4a8), false);
    this.caribbeanHouse(g, 0, -4, 0xd8cbb8, colliders, true, PLATE.cream);
    this.caribbeanHouse(g, 16, -2, 0x8eb8d4, colliders, true, PLATE.blue);
    this.palm(g, -7.5, 5);
    this.palm(g, 8.5, 3.5, 1.15);
    this.palm(g, -11, -1, 0.9);
    addBox(g, 1.45, 0.42, 0.72, 5.6, 0.55, 9.2, std(0x1c2118));
    addBox(g, 0.7, 0.85, 0.7, 6.8, 0.48, 10.4, lamb(0xd4a017));
    this.flag(g, -4.6, 0.6);
    interactables.push({ kind: "crate", position: new THREE.Vector3(5.6, 0, 9.2), radius: 2 });
    interactables.push({ kind: "vehicle-spot", position: new THREE.Vector3(10, 0, 16), radius: 3 });
  }

  private market(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    for (let i = 0; i < 18; i++) {
      const x = zone.x + ((i % 6) - 2.5) * 8;
      const z = zone.z + (Math.floor(i / 6) - 1) * 10;
      addBox(g, 5.5, 2.4, 4.2, x, 1.2, z, lamb(i % 2 ? 0xe07a5f : 0xf2cc8f));
      addBox(g, 6, 0.15, 4.6, x, 2.5, z, roofMat());
      colliders.push({ minX: x - 2.7, maxX: x + 2.7, minZ: z - 2.1, maxZ: z + 2.1, minY: 0, maxY: 2.5 });
      addBox(g, 0.8, 0.6, 0.8, x + 1.4, 0.4, z + 1.6, lamb(0x6b4226));
    }
  }

  private houses(g: THREE.Group, zone: ZoneDef, colliders: Collider[], interactables: MapData["interactables"], base: number) {
    const palette = [base, 0xe07a5f, 0x2a9d8f, 0xf4a261, 0xf1faee, 0xb5838d, 0x457b9d, 0xffddd2, 0x8ecae6];
    const plates = [PLATE.cream, PLATE.blue];
    for (let i = 0; i < 16; i++) {
      const x = zone.x + ((i % 4) - 1.5) * 16;
      const z = zone.z + (Math.floor(i / 4) - 1.5) * 16;
      this.caribbeanHouse(g, x, z, palette[i % palette.length], colliders, true, i % 2 === 0 ? plates[i % 2] : undefined);
      this.palm(g, x + 5.6, z + 3.2);
      if (i % 3 === 0) this.flag(g, x - 4.2, z + 3.4);
      if (i % 4 === 0) interactables.push({ kind: "crate", position: new THREE.Vector3(x + 4, 0, z + 5), radius: 1.8 });
    }
  }

  private caribbeanHouse(
    parent: THREE.Group,
    x: number,
    z: number,
    color: number,
    colliders: Collider[],
    enterable = true,
    plate?: string,
  ) {
    const w = 10.4;
    const d = 8.2;
    const h = 6.6;
    addBox(parent, w, h, d, x, h / 2, z, stucco(color));
    const roof = new THREE.Mesh(hipRoof(w + 1.4, d + 1.4, 2.15), roofMat());
    roof.position.set(x, h + 0.02, z);
    roof.castShadow = true;
    parent.add(roof);
    addBox(parent, w + 0.2, 0.16, 2.1, x, 3.42, z + d / 2 + 0.7, std(0xf4efe6));
    addBox(parent, 0.08, 1.05, 2.05, x - w * 0.42, 3.95, z + d / 2 + 0.7, wood());
    addBox(parent, 0.08, 1.05, 2.05, x + w * 0.42, 3.95, z + d / 2 + 0.7, wood());
    addBox(parent, w * 0.84, 0.07, 0.07, x, 4.48, z + d / 2 + 1.68, wood());
    addBox(parent, 1.35, 2.3, 0.12, x, 1.18, z + d / 2 + 0.05, wood());
    addBox(parent, 0.9, 1.1, 0.08, x - 2.5, 2.05, z + d / 2 + 0.06, glass(), false);
    addBox(parent, 0.9, 1.1, 0.08, x + 2.5, 2.05, z + d / 2 + 0.06, glass(), false);
    addBox(parent, 0.9, 1.0, 0.08, x - 2.5, 4.7, z + d / 2 + 0.06, glass(), false);
    addBox(parent, 0.9, 1.0, 0.08, x + 2.5, 4.7, z + d / 2 + 0.06, glass(), false);
    if (plate) {
      const facade = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.35, h - 0.55), photoMat(plate));
      facade.position.set(x, h / 2 + 0.12, z + d / 2 + 0.09);
      parent.add(facade);
    }
    colliders.push({
      minX: x - w / 2,
      maxX: x + w / 2,
      minZ: z - d / 2,
      maxZ: z + d / 2,
      minY: 0,
      maxY: h + 2,
      enterable,
      door: new THREE.Vector3(x, 0, z + d / 2),
    });
  }

  private church(parent: THREE.Group, x: number, z: number, colliders: Collider[]) {
    addBox(parent, 8.4, 7.2, 11, x, 3.6, z, stucco(0xf3efe6));
    const roof = new THREE.Mesh(hipRoof(9.4, 12.2, 2.5), roofMat());
    roof.position.set(x, 7.25, z);
    parent.add(roof);
    addBox(parent, 2.3, 6.4, 2.3, x, 9.4, z - 4.4, stucco(0xf7f1e4));
    const steeple = new THREE.Mesh(new THREE.ConeGeometry(1.55, 3.4, 4), roofMat());
    steeple.position.set(x, 14.2, z - 4.4);
    steeple.rotation.y = Math.PI / 4;
    parent.add(steeple);
    colliders.push({ minX: x - 4.2, maxX: x + 4.2, minZ: z - 5.5, maxZ: z + 5.5, minY: 0, maxY: 12 });
  }

  private palm(parent: THREE.Group, x: number, z: number, scale = 1) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.2, 5.4, 8), std(0x8a5a32, { roughness: 0.88 }));
    trunk.position.y = 2.7;
    trunk.castShadow = true;
    tree.add(trunk);
    const leafMat = std(0x2f7a3e, { roughness: 0.65 });
    for (let i = 0; i < 9; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.07, 3.1), leafMat);
      leaf.position.set(0, 5.25, 0.95);
      leaf.rotation.y = (i / 9) * Math.PI * 2;
      leaf.rotation.x = -0.62;
      leaf.castShadow = true;
      tree.add(leaf);
    }
    tree.position.set(x, 0, z);
    tree.scale.setScalar(scale);
    parent.add(tree);
  }

  private flag(parent: THREE.Group, x: number, z: number) {
    addBox(parent, 0.08, 4.2, 0.08, x, 2.1, z, lamb(0x222831));
    addBox(parent, 1.15, 0.42, 0.04, x + 0.62, 3.85, z, lamb(0x00209f));
    addBox(parent, 1.15, 0.42, 0.04, x + 0.62, 3.43, z, lamb(0xd21034));
    addBox(parent, 0.22, 0.22, 0.05, x + 0.62, 3.64, z, lamb(0xf6f3ea));
  }

  private port(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    addBox(g, 70, 0.6, 18, zone.x, 0.3, zone.z + 18, lamb(0x4a4e69));
    for (let i = 0; i < 10; i++) {
      const x = zone.x - 24 + (i % 5) * 12;
      const z = zone.z - 8 + Math.floor(i / 5) * 14;
      addBox(g, 8, 4, 4, x, 2, z, lamb(i % 2 ? 0x1d3557 : 0xe63946));
      colliders.push({ minX: x - 4, maxX: x + 4, minZ: z - 2, maxZ: z + 2, minY: 0, maxY: 4 });
    }
    addBox(g, 28, 8, 12, zone.x + 10, 4, zone.z - 18, lamb(0x6d6875));
    colliders.push({ minX: zone.x - 4, maxX: zone.x + 24, minZ: zone.z - 24, maxZ: zone.z - 12, minY: 0, maxY: 8 });
  }

  private beach(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    for (let i = 0; i < 6; i++) {
      const x = zone.x - 20 + i * 9;
      this.caribbeanHouse(g, x, zone.z - 6, 0xf4f1ea, colliders, true);
    }
    for (let i = 0; i < 12; i++) this.palm(g, zone.x - 18 + i * 4.2, zone.z + 8, 0.95 + (i % 3) * 0.1);
  }

  private industrial(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    for (let i = 0; i < 7; i++) {
      const x = zone.x - 24 + i * 8;
      addBox(g, 7, 9, 16, x, 4.5, zone.z, lamb(0x6d6875));
      colliders.push({ minX: x - 3.5, maxX: x + 3.5, minZ: zone.z - 8, maxZ: zone.z + 8, minY: 0, maxY: 9 });
      addBox(g, 1.4, 6, 1.4, x + 2, 8, zone.z + 6, lamb(0x9d0208));
    }
  }

  private gas(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    addBox(g, 22, 0.4, 16, zone.x, 0.2, zone.z, lamb(0x2b2d31));
    addBox(g, 18, 0.3, 12, zone.x, 5.2, zone.z, lamb(0xe63946));
    for (let i = 0; i < 4; i++) {
      addBox(g, 0.8, 5, 0.8, zone.x - 6 + i * 4, 2.5, zone.z, lamb(0xcfcfcf));
    }
    addBox(g, 10, 4.5, 8, zone.x + 12, 2.25, zone.z + 8, stucco(0xf1faee));
    colliders.push({ minX: zone.x + 7, maxX: zone.x + 17, minZ: zone.z + 4, maxZ: zone.z + 12, minY: 0, maxY: 4.5 });
    for (let i = 0; i < 6; i++) addBox(g, 0.7, 0.9, 0.7, zone.x - 8 + i * 1.2, 0.45, zone.z + 6, lamb(0xd4a017));
  }

  private mountains(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    for (let i = 0; i < 7; i++) {
      const peak = new THREE.Mesh(new THREE.ConeGeometry(10 + (i % 3) * 4, 16 + i * 2, 6), lamb(i % 2 ? 0x588157 : 0x3a5a40));
      peak.position.set(zone.x - 18 + i * 8, 8 + i, zone.z - 8 + (i % 2) * 10);
      peak.castShadow = true;
      g.add(peak);
      colliders.push({
        minX: peak.position.x - 6,
        maxX: peak.position.x + 6,
        minZ: peak.position.z - 6,
        maxZ: peak.position.z + 6,
        minY: 0,
        maxY: 14,
      });
    }
  }

  private forest(g: THREE.Group, zone: ZoneDef) {
    for (let i = 0; i < 40; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * zone.radius * 0.85;
      this.palm(g, zone.x + Math.cos(a) * r, zone.z + Math.sin(a) * r, 0.75 + Math.random() * 0.4);
    }
  }

  private plaza(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    addBox(g, 28, 0.2, 28, zone.x, 0.1, zone.z, lamb(0xede0d4), false);
    const statue = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.8, 6, 8), lamb(0xd4a017));
    statue.position.set(zone.x, 3, zone.z);
    g.add(statue);
    colliders.push({ minX: zone.x - 1.6, maxX: zone.x + 1.6, minZ: zone.z - 1.6, maxZ: zone.z + 1.6, minY: 0, maxY: 6 });
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      addBox(g, 0.35, 3.5, 0.35, zone.x + Math.cos(a) * 12, 1.75, zone.z + Math.sin(a) * 12, lamb(0x222831));
    }
  }

  private ruins(g: THREE.Group, zone: ZoneDef, colliders: Collider[], interactables: MapData["interactables"]) {
    for (let i = 0; i < 12; i++) {
      const x = zone.x + ((i % 4) - 1.5) * 14;
      const z = zone.z + (Math.floor(i / 4) - 1) * 14;
      addBox(g, 7, 3 + (i % 3), 6, x, 1.8, z, lamb(0x7f5539));
      addBox(g, 2, 2, 2, x + 3, 1, z + 2, lamb(0x9c6644));
      colliders.push({ minX: x - 3.5, maxX: x + 3.5, minZ: z - 3, maxZ: z + 3, minY: 0, maxY: 4 });
      if (i % 2 === 0) interactables.push({ kind: "crate", position: new THREE.Vector3(x, 0, z + 4), radius: 1.6 });
    }
  }

  private airport(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    addBox(g, 90, 0.15, 10, zone.x, 0.08, zone.z, lamb(0x8d99ae), false);
    addBox(g, 8, 0.16, 8, zone.x - 20, 0.1, zone.z, lamb(0xd4a017), false);
    addBox(g, 28, 10, 16, zone.x + 18, 5, zone.z - 22, stucco(0xf1faee));
    colliders.push({ minX: zone.x + 4, maxX: zone.x + 32, minZ: zone.z - 30, maxZ: zone.z - 14, minY: 0, maxY: 10 });
    addBox(g, 18, 4, 8, zone.x - 24, 2, zone.z + 16, lamb(0x4a4e69));
    colliders.push({ minX: zone.x - 33, maxX: zone.x - 15, minZ: zone.z + 12, maxZ: zone.z + 20, minY: 0, maxY: 4 });
  }

  private scatterProps(group: THREE.Group, colliders: Collider[]) {
    const crateMat = lamb(0x6b4226);
    const barrelMat = lamb(0xd4a017);
    const wallMat = stucco(0xe8ddd0);
    for (let i = 0; i < 70; i++) {
      const x = (Math.random() - 0.5) * 340;
      const z = (Math.random() - 0.5) * 340;
      if (Math.hypot(x, z) < 16) continue;
      if (i % 3 === 0) {
        addBox(group, 1.1, 1.1, 1.1, x, 0.55, z, crateMat);
        colliders.push({ minX: x - 0.55, maxX: x + 0.55, minZ: z - 0.55, maxZ: z + 0.55, minY: 0, maxY: 1.1 });
      } else if (i % 3 === 1) {
        const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.1, 8), barrelMat);
        b.position.set(x, 0.55, z);
        b.castShadow = true;
        group.add(b);
      } else {
        addBox(group, 2.4, 1.2, 0.35, x, 0.6, z, wallMat);
        colliders.push({ minX: x - 1.2, maxX: x + 1.2, minZ: z - 0.2, maxZ: z + 0.2, minY: 0, maxY: 1.2 });
      }
    }
    for (let i = 0; i < 30; i++) {
      addBox(group, 0.18, 6.2, 0.18, -150 + i * 10, 3.1, -6, lamb(0x222831));
    }
  }

  resolveCollision(x: number, z: number, radius: number, colliders: Collider[]) {
    let nx = x;
    let nz = z;
    for (const c of colliders) {
      if (c.enterable) continue;
      if (nx > c.minX - radius && nx < c.maxX + radius && nz > c.minZ - radius && nz < c.maxZ + radius) {
        const dx1 = Math.abs(nx - (c.minX - radius));
        const dx2 = Math.abs(nx - (c.maxX + radius));
        const dz1 = Math.abs(nz - (c.minZ - radius));
        const dz2 = Math.abs(nz - (c.maxZ + radius));
        const m = Math.min(dx1, dx2, dz1, dz2);
        if (m === dx1) nx = c.minX - radius;
        else if (m === dx2) nx = c.maxX + radius;
        else if (m === dz1) nz = c.minZ - radius;
        else nz = c.maxZ + radius;
      }
    }
    return { x: nx, z: nz };
  }
}
