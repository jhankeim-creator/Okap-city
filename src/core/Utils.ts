import * as THREE from "three";
import type { RankTier, Rarity } from "../data/types";

export const RARITY_COLOR: Record<Rarity, string> = {
  COMMON: "#b8b8b8",
  UNCOMMON: "#3ddc84",
  RARE: "#4ea8de",
  EPIC: "#9b5de5",
  LEGENDARY: "#d4a017",
};

export const RANK_ORDER: RankTier[] = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

export function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function xpForLevel(level: number) {
  return Math.floor(80 + level * 35 + level * level * 4);
}

export function rankFromPoints(points: number): RankTier {
  if (points >= 4200) return "Master";
  if (points >= 3200) return "Diamond";
  if (points >= 2300) return "Platinum";
  if (points >= 1500) return "Gold";
  if (points >= 700) return "Silver";
  return "Bronze";
}

export function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function hexColor(hex: string) {
  return new THREE.Color(hex);
}

export function nowId(prefix = "id") {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function circleContains(cx: number, cz: number, r: number, x: number, z: number) {
  const dx = x - cx;
  const dz = z - cz;
  return dx * dx + dz * dz <= r * r;
}

export function dist2(ax: number, az: number, bx: number, bz: number) {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}
