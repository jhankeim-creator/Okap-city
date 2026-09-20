import * as THREE from "three";
import { MAP_SIZE, ZONES } from "../data/world";
import type { ZoneDef } from "../data/types";

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
  return new THREE.MeshLambertMaterial({ color, emissive, emissiveIntensity: em });
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

export class MapBuilder {
  build(): MapData {
    const group = new THREE.Group();
    const colliders: Collider[] = [];
    const interactables: MapData["interactables"] = [];
    const spawnPoints: THREE.Vector3[] = [];
    const zoneMeshes = new THREE.Group();
    group.add(zoneMeshes);

    this.ground(group);
    this.ocean(group);
    this.roads(group);

    for (const zone of ZONES) {
      this.buildZone(zone, zoneMeshes, colliders, interactables, spawnPoints);
    }

    this.scatterProps(group, colliders);
    return { group, colliders, interactables, spawnPoints, zoneMeshes };
  }

  private ground(group: THREE.Group) {
    const geo = new THREE.PlaneGeometry(MAP_SIZE * 2.2, MAP_SIZE * 2.2, 40, 40);
    const pos = geo.attributes.position;
    const colors: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getY(i);
      const n = Math.sin(x * 0.03) * Math.cos(z * 0.03) * 1.6;
      if (z > 155) pos.setZ(i, n * 0.1);
      else pos.setZ(i, Math.max(0, n));
      const sand = z > 145;
      const grass = z < -90 || x < -90;
      const c = new THREE.Color(sand ? 0xe9c46a : grass ? 0x52796f : 0x6b705c);
      colors.push(c.r, c.g, c.b);
    }
    geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true }));
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  private ocean(group: THREE.Group) {
    const water = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 280, 20, 8),
      new THREE.MeshLambertMaterial({ color: 0x1d8a99, transparent: true, opacity: 0.88 }),
    );
    water.rotation.x = -Math.PI / 2;
    water.position.set(-20, 0.05, 250);
    group.add(water);
  }

  private roads(group: THREE.Group) {
    const mat = lamb(0x2b2d31);
    const mark = lamb(0xd4a017);
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

  private building(
    parent: THREE.Group,
    x: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: number,
    colliders: Collider[],
    enterable = false,
  ) {
    const mat = lamb(color);
    addBox(parent, w, h, d, x, h / 2, z, mat);
    addBox(parent, w + 0.4, 0.25, d + 0.4, x, h + 0.1, z, lamb(0x3d405b));
    for (let i = 0; i < 3; i++) {
      addBox(parent, 0.35, 0.45, 0.08, x - w * 0.25 + i * 0.4, h * 0.55, z + d / 2 + 0.02, lamb(0x7ec8e3, 0x7ec8e3, 0.2), false);
    }
    if (enterable) {
      addBox(parent, 1.2, 2.1, 0.12, x, 1.05, z + d / 2 + 0.04, lamb(0x3a2a1a));
      colliders.push({
        minX: x - w / 2,
        maxX: x + w / 2,
        minZ: z - d / 2,
        maxZ: z + d / 2,
        minY: 0,
        maxY: h,
        enterable: true,
        door: new THREE.Vector3(x, 0, z + d / 2),
      });
    } else {
      colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, minY: 0, maxY: h });
    }
  }

  private downtown(g: THREE.Group, zone: ZoneDef, colliders: Collider[], interactables: MapData["interactables"]) {
    const colors = [0xd4a373, 0xe9c46a, 0xf4a261, 0xe76f51, 0x2a9d8f, 0xf1faee];
    let n = 0;
    for (let ix = -2; ix <= 2; ix++) {
      for (let iz = -2; iz <= 2; iz++) {
        if (Math.abs(ix) + Math.abs(iz) === 0) continue;
        const w = 10 + ((ix + 3) % 3) * 2;
        const d = 10 + ((iz + 2) % 3) * 2;
        const h = 10 + ((n * 7) % 16);
        this.building(g, zone.x + ix * 18, zone.z + iz * 18, w, h, d, colors[n % colors.length], colliders, n % 3 === 0);
        n++;
      }
    }
    addBox(g, 16, 1.2, 16, zone.x, 0.6, zone.z, lamb(0x457b9d));
    interactables.push({ kind: "crate", position: new THREE.Vector3(zone.x + 6, 0, zone.z + 6), radius: 2 });
  }

  private market(g: THREE.Group, zone: ZoneDef, colliders: Collider[]) {
    for (let i = 0; i < 18; i++) {
      const x = zone.x + ((i % 6) - 2.5) * 8;
      const z = zone.z + (Math.floor(i / 6) - 1) * 10;
      addBox(g, 5.5, 2.4, 4.2, x, 1.2, z, lamb(i % 2 ? 0xe07a5f : 0xf2cc8f));
      addBox(g, 6, 0.15, 4.6, x, 2.5, z, lamb(0x9b2226));
      colliders.push({ minX: x - 2.7, maxX: x + 2.7, minZ: z - 2.1, maxZ: z + 2.1, minY: 0, maxY: 2.5 });
      addBox(g, 0.8, 0.6, 0.8, x + 1.4, 0.4, z + 1.6, lamb(0x6b4226));
    }
  }

  private houses(g: THREE.Group, zone: ZoneDef, colliders: Collider[], interactables: MapData["interactables"], base: number) {
    const palette = [base, 0xe07a5f, 0x2a9d8f, 0xf4a261, 0xf1faee, 0xb5838d, 0x457b9d, 0xffddd2];
    for (let i = 0; i < 16; i++) {
      const x = zone.x + ((i % 4) - 1.5) * 16;
      const z = zone.z + (Math.floor(i / 4) - 1.5) * 16;
      this.caribbeanHouse(g, x, z, palette[i % palette.length], colliders, true);
      this.palm(g, x + 5.6, z + 3.2);
      if (i % 3 === 0) this.flag(g, x - 4.2, z + 3.4);
    }
  }

  private caribbeanHouse(parent: THREE.Group, x: number, z: number, color: number, colliders: Collider[], enterable = true) {
    const w = 8.4;
    const d = 7.2;
    const h = 4.6;
    addBox(parent, w, h, d, x, h / 2, z, lamb(color));
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.2, 4), lamb(0xc36f3c));
    roof.position.set(x, h + 1.1, z);
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    parent.add(roof);
    addBox(parent, 1.15, 2.15, 0.12, x, 1.1, z + d / 2 + 0.04, lamb(0x3a2a1a));
    addBox(parent, 0.7, 0.7, 0.08, x - 2.1, 2.6, z + d / 2 + 0.05, lamb(0x7ec8e3, 0x7ec8e3, 0.15), false);
    addBox(parent, 0.7, 0.7, 0.08, x + 2.1, 2.6, z + d / 2 + 0.05, lamb(0x7ec8e3, 0x7ec8e3, 0.15), false);
    addBox(parent, 3.2, 0.12, 1.4, x, 3.15, z + d / 2 + 0.6, lamb(0xede0d4));
    addBox(parent, 0.12, 1.1, 1.4, x - 1.55, 2.6, z + d / 2 + 0.6, lamb(0xede0d4));
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

  private palm(parent: THREE.Group, x: number, z: number) {
    const tree = new THREE.Group();
    addBox(tree, 0.28, 4.4, 0.28, 0, 2.2, 0, lamb(0x6b4226));
    for (let i = 0; i < 6; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 2.6), lamb(0x2d6a4f));
      leaf.position.set(0, 4.3, 0.7);
      leaf.rotation.y = (i / 6) * Math.PI * 2;
      leaf.rotation.x = -0.55;
      tree.add(leaf);
    }
    tree.position.set(x, 0, z);
    parent.add(tree);
  }

  private flag(parent: THREE.Group, x: number, z: number) {
    addBox(parent, 0.08, 4.2, 0.08, x, 2.1, z, lamb(0x222831));
    addBox(parent, 1.15, 0.42, 0.04, x + 0.62, 3.85, z, lamb(0x00209f));
    addBox(parent, 1.15, 0.42, 0.04, x + 0.62, 3.43, z, lamb(0xd21034));
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
      addBox(g, 6, 3.2, 6, x, 1.6, zone.z - 6, lamb(0xf4f1ea));
      colliders.push({ minX: x - 3, maxX: x + 3, minZ: zone.z - 9, maxZ: zone.z - 3, minY: 0, maxY: 3.2 });
    }
    for (let i = 0; i < 10; i++) this.palm(g, zone.x - 18 + i * 4.2, zone.z + 8);
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
    addBox(g, 10, 4.5, 8, zone.x + 12, 2.25, zone.z + 8, lamb(0xf1faee));
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
      const tree = new THREE.Group();
      addBox(tree, 0.45, 3.6, 0.45, 0, 1.8, 0, lamb(0x6b4226));
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(1.8, 7, 6), lamb(0x2d6a4f));
      leaf.position.y = 4;
      tree.add(leaf);
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * zone.radius * 0.85;
      tree.position.set(zone.x + Math.cos(a) * r, 0, zone.z + Math.sin(a) * r);
      g.add(tree);
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
    addBox(g, 28, 10, 16, zone.x + 18, 5, zone.z - 22, lamb(0xf1faee));
    colliders.push({ minX: zone.x + 4, maxX: zone.x + 32, minZ: zone.z - 30, maxZ: zone.z - 14, minY: 0, maxY: 10 });
    addBox(g, 18, 4, 8, zone.x - 24, 2, zone.z + 16, lamb(0x4a4e69));
    colliders.push({ minX: zone.x - 33, maxX: zone.x - 15, minZ: zone.z + 12, maxZ: zone.z + 20, minY: 0, maxY: 4 });
  }

  private scatterProps(group: THREE.Group, colliders: Collider[]) {
    const crateMat = lamb(0x6b4226);
    const barrelMat = lamb(0xd4a017);
    const wallMat = lamb(0x7f5539);
    for (let i = 0; i < 70; i++) {
      const x = (Math.random() - 0.5) * 340;
      const z = (Math.random() - 0.5) * 340;
      if (Math.hypot(x, z) < 12) continue;
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
      const px = clampTo(nx, c.minX - radius, c.maxX + radius);
      const pz = clampTo(nz, c.minZ - radius, c.maxZ + radius);
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
      void px;
      void pz;
    }
    return { x: nx, z: nz };
  }
}

function clampTo(v: number, a: number, b: number) {
  return Math.max(Math.min(v, b), a);
}
