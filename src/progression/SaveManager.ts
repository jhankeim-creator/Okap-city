import { CHARACTERS } from "../data/characters";
import { COSMETICS } from "../data/world";
import type { GraphicsQuality, RankTier } from "../data/types";
import { rankFromPoints } from "../core/Utils";

export interface SettingsState {
  graphics: GraphicsQuality;
  fpsCap: 30 | 60;
  sensitivity: number;
  aimSensitivity: number;
  gyroscope: boolean;
  music: number;
  sound: number;
  voice: number;
  vibration: boolean;
  language: "ht";
  aimAssist: boolean;
  hudScale: number;
}

export interface ProfileState {
  username: string;
  level: number;
  xp: number;
  coins: number;
  rankPoints: number;
  wins: number;
  kills: number;
  matches: number;
  damage: number;
  favoriteWeapon: string;
  favoriteCharacter: string;
  unlockedCosmetics: string[];
  equipped: Record<string, string>;
  characterId: string;
  vehicleId: string;
  friends: string[];
  incomingFriends: string[];
  missionProgress: Record<string, number>;
  claimedMissions: string[];
  storyRead: string[];
}

export interface SaveState {
  profile: ProfileState;
  settings: SettingsState;
}

const KEY = "okap-city-save-v1";

export const DEFAULT_SETTINGS: SettingsState = {
  graphics: "HIGH",
  fpsCap: 60,
  sensitivity: 1.1,
  aimSensitivity: 0.85,
  gyroscope: false,
  music: 0.55,
  sound: 0.8,
  voice: 0.85,
  vibration: true,
  language: "ht",
  aimAssist: true,
  hudScale: 1,
};

export function defaultProfile(): ProfileState {
  return {
    username: "Junior",
    level: 1,
    xp: 0,
    coins: 250,
    rankPoints: 0,
    wins: 0,
    kills: 0,
    matches: 0,
    damage: 0,
    favoriteWeapon: "soley-wouj",
    favoriteCharacter: "junior",
    unlockedCosmetics: COSMETICS.filter((c) => c.price === 0).map((c) => c.id),
    equipped: {
      cheve: "cheve-fade",
      outfit: "outfit-lanme",
      shoes: "soulye-kouri",
      backpack: "sak-taktik",
      gloves: "gant-nwa",
      frame: "",
    },
    characterId: CHARACTERS[0].id,
    vehicleId: "suv-lakay",
    friends: ["Vanessa", "Kendy"],
    incomingFriends: ["Naomi"],
    missionProgress: {},
    claimedMissions: [],
    storyRead: [],
  };
}

export class SaveManager {
  state: SaveState;

  constructor() {
    this.state = this.load();
  }

  load(): SaveState {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { profile: defaultProfile(), settings: { ...DEFAULT_SETTINGS } };
      const parsed = JSON.parse(raw) as SaveState;
      return {
        profile: { ...defaultProfile(), ...parsed.profile },
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      };
    } catch {
      return { profile: defaultProfile(), settings: { ...DEFAULT_SETTINGS } };
    }
  }

  persist() {
    localStorage.setItem(KEY, JSON.stringify(this.state));
  }

  get rank(): RankTier {
    return rankFromPoints(this.state.profile.rankPoints);
  }

  addCoins(n: number) {
    this.state.profile.coins = Math.max(0, this.state.profile.coins + n);
    this.persist();
  }

  spendCoins(n: number) {
    if (this.state.profile.coins < n) return false;
    this.state.profile.coins -= n;
    this.persist();
    return true;
  }
}
