export type WeaponCategory = "PISTOL" | "SMG" | "ASSAULT_RIFLE" | "SHOTGUN" | "SNIPER" | "MELEE";
export type Rarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";
export type TeamMode = "SOLO" | "DUO" | "SQUAD";
export type RankTier = "Bronze" | "Silver" | "Gold" | "Platinum" | "Diamond" | "Master";
export type BotDifficulty = "EASY" | "NORMAL" | "HARD" | "EXTREME";
export type GraphicsQuality = "LOW" | "MEDIUM" | "HIGH" | "ULTRA";
export type WeatherKind = "sole" | "nwaj" | "lapli" | "bwouya";
export type Stance = "stand" | "crouch" | "prone";
export type MatchPhase =
  | "idle"
  | "cinematic"
  | "menu"
  | "matchmaking"
  | "loading"
  | "drop"
  | "parachute"
  | "playing"
  | "victory"
  | "defeat";

export interface WeaponDef {
  id: string;
  name: string;
  category: WeaponCategory;
  damage: number;
  fireRate: number;
  range: number;
  accuracy: number;
  recoil: number;
  magazine: number;
  reload: number;
  headshot: number;
  rarity: Rarity;
  description: string;
}

export interface CharacterDef {
  id: string;
  name: string;
  gender: "gason" | "fi";
  bio: string;
  role: string;
  mark: string;
  skin: string;
  shirt: string;
  pants: string;
  accent: string;
  hair: string;
  hairStyle: "short" | "fade" | "braids" | "bun" | "locs" | "pony" | "afro" | "crown";
  voicePitch: number;
}

export interface VehicleDef {
  id: string;
  name: string;
  kind: "SUV" | "PICKUP" | "SEDAN" | "MOTORCYCLE" | "JEEP";
  speed: number;
  acceleration: number;
  brake: number;
  fuel: number;
  health: number;
  color: string;
}

export interface ZoneDef {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
  color: number;
  lootBias: Rarity;
  description: string;
}

export interface CosmeticItem {
  id: string;
  name: string;
  slot: "cheve" | "outfit" | "shoes" | "backpack" | "mask" | "glasses" | "gloves" | "emote" | "skin" | "weapon" | "vehicle" | "parachute" | "frame";
  rarity: Rarity;
  price: number;
  color: string;
}

export interface MissionDef {
  id: string;
  title: string;
  kind: "daily" | "weekly" | "story";
  goal: number;
  stat: "kills" | "damage" | "lootWeapons" | "surviveSec" | "matches" | "wins" | "story";
  xp: number;
  coins: number;
  storyText?: string;
}
