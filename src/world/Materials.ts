import * as THREE from "three";

const loader = new THREE.TextureLoader();
const cache = new Map<string, THREE.Texture>();
const matCache = new Map<string, THREE.Material>();

function tex(path: string, repeat = 2, wrap = true) {
  const key = `${path}:${repeat}:${wrap}`;
  if (cache.has(key)) return cache.get(key)!;
  const t = loader.load(path);
  if (wrap) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat, repeat);
  } else {
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  }
  t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

export function std(color: number | string, extras: Partial<THREE.MeshStandardMaterialParameters> = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.82,
    metalness: 0.04,
    ...extras,
  });
}

export function stucco(color: number) {
  return std(color, { map: tex("/textures/stucco.png", 3), roughness: 0.9 });
}

export function roofMat() {
  return std(0xc36f3c, { map: tex("/textures/roof.png", 4), roughness: 0.75 });
}

export function asphalt() {
  return std(0x6a6d72, { map: tex("/textures/asphalt.png", 8), roughness: 0.95 });
}

export function grass() {
  return std(0x6a9a4e, { map: tex("/textures/grass.png", 10), roughness: 1 });
}

export function sand() {
  return std(0xe4c57a, { map: tex("/textures/sand.png", 6), roughness: 1 });
}

export function wood() {
  return std(0x6b4226, { map: tex("/textures/wood.png", 2), roughness: 0.7 });
}

export function glass() {
  return new THREE.MeshStandardMaterial({
    color: 0x7ec8e3,
    roughness: 0.12,
    metalness: 0.35,
    transparent: true,
    opacity: 0.55,
  });
}

export function photoMat(path: string, fog = true) {
  const key = `basic:${path}:${fog}`;
  if (matCache.has(key)) return matCache.get(key) as THREE.MeshBasicMaterial;
  const m = new THREE.MeshBasicMaterial({ map: tex(path, 1, false), fog });
  matCache.set(key, m);
  return m;
}

export function photoStd(path: string) {
  const key = `std:${path}`;
  if (matCache.has(key)) return matCache.get(key) as THREE.MeshStandardMaterial;
  const m = new THREE.MeshStandardMaterial({
    map: tex(path, 1, false),
    roughness: 0.72,
    metalness: 0.05,
  });
  matCache.set(key, m);
  return m;
}

export const PLATE = {
  city: "/textures/plates/city-horizon.png",
  cream: "/textures/plates/house-cream.png",
  blue: "/textures/plates/house-blue.png",
  coast: "/textures/plates/coast-sunset.png",
  harbor: "/textures/plates/harbor-bay.png",
  hills: "/textures/plates/harbor-hills.png",
};
