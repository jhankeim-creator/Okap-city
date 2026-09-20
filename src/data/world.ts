import type { CosmeticItem, MissionDef, VehicleDef, ZoneDef } from "./types";

export const MAP_SIZE = 420;

export const ZONES: ZoneDef[] = [
  { id: "downtown", name: "Downtown Okap", x: 0, z: 0, radius: 52, color: 0xc9a227, lootBias: "RARE", description: "Sant vil, bilding wo, anpil cover." },
  { id: "mache", name: "Mache Santral", x: 8, z: 88, radius: 42, color: 0xe07a5f, lootBias: "UNCOMMON", description: "Etal, kès, koridò sere." },
  { id: "rezidans", name: "Katye Rezidansyèl", x: 110, z: 20, radius: 50, color: 0xf2cc8f, lootBias: "COMMON", description: "Kay koulè, lakou, twati." },
  { id: "port", name: "Port Okap", x: -120, z: 110, radius: 48, color: 0x3d5a80, lootBias: "RARE", description: "Kontenè, depo, bato." },
  { id: "plaj", name: "Plaj", x: -40, z: 150, radius: 46, color: 0xe9c46a, lootBias: "COMMON", description: "Sab, kay plaj, vizibilite long." },
  { id: "endistri", name: "Zòn Endistriyèl", x: -130, z: -20, radius: 50, color: 0x6d6875, lootBias: "EPIC", description: "Depo metal, tank, cover fò." },
  { id: "gaz", name: "Estasyon Gaz", x: 120, z: 110, radius: 36, color: 0xe63946, lootBias: "UNCOMMON", description: "Pom, barik, eksplozyon potansyèl." },
  { id: "mon", name: "Mòn", x: -130, z: -130, radius: 56, color: 0x588157, lootBias: "RARE", description: "Wòch, pozisyon wo, sniper." },
  { id: "fore", name: "Forè", x: -20, z: -140, radius: 50, color: 0x2d6a4f, lootBias: "UNCOMMON", description: "Pyebwa, bwouya, anbiskad." },
  { id: "plas", name: "Gran Plas", x: 20, z: 40, radius: 34, color: 0xffffff, lootBias: "RARE", description: "Espas ouvè, danje, gwo loot." },
  { id: "abandone", name: "Katye Abandone", x: 130, z: -90, radius: 48, color: 0x7f5539, lootBias: "EPIC", description: "Kay kraze, sekrè, zòn riske." },
  { id: "ayewopo", name: "Ayewopò Fiksyon", x: 20, z: -90, radius: 52, color: 0x8d99ae, lootBias: "LEGENDARY", description: "Pis, otèl, gwo bwat ekipman." },
];

export const VEHICLES: VehicleDef[] = [
  { id: "suv-lakay", name: "SUV Lakay", kind: "SUV", speed: 24, acceleration: 10, brake: 16, fuel: 100, health: 220, color: "#1d3557" },
  { id: "pickup-po", name: "Pickup Pò", kind: "PICKUP", speed: 26, acceleration: 12, brake: 14, fuel: 90, health: 200, color: "#6b4226" },
  { id: "sedan-vil", name: "Sedan Vil", kind: "SEDAN", speed: 28, acceleration: 13, brake: 15, fuel: 80, health: 160, color: "#e9c46a" },
  { id: "moto-van", name: "Moto Van", kind: "MOTORCYCLE", speed: 34, acceleration: 18, brake: 12, fuel: 55, health: 90, color: "#e63946" },
  { id: "jeep-mon", name: "Jeep Mòn", kind: "JEEP", speed: 22, acceleration: 9, brake: 18, fuel: 110, health: 240, color: "#588157" },
];

export const COSMETICS: CosmeticItem[] = [
  { id: "cheve-fade", name: "Fade Okap", slot: "cheve", rarity: "COMMON", price: 0, color: "#1a120c" },
  { id: "cheve-lò", name: "Lok Lò", slot: "cheve", rarity: "EPIC", price: 400, color: "#d4a017" },
  { id: "outfit-lanme", name: "Outfit Lanmè", slot: "outfit", rarity: "RARE", price: 250, color: "#1d3557" },
  { id: "outfit-soley", name: "Outfit Soley", slot: "outfit", rarity: "EPIC", price: 420, color: "#e9c46a" },
  { id: "soulye-kouri", name: "Sneakers Kouri", slot: "shoes", rarity: "COMMON", price: 80, color: "#f4f1ea" },
  { id: "sak-taktik", name: "Sak Taktik", slot: "backpack", rarity: "UNCOMMON", price: 140, color: "#2b2f33" },
  { id: "mask-van", name: "Mask Van", slot: "mask", rarity: "RARE", price: 300, color: "#222831" },
  { id: "linèt-plas", name: "Linèt Gran Plas", slot: "glasses", rarity: "UNCOMMON", price: 160, color: "#7ec8e3" },
  { id: "gant-nwa", name: "Gant Nwa", slot: "gloves", rarity: "COMMON", price: 60, color: "#111111" },
  { id: "emote-annale", name: "Emote: Ann ale!", slot: "emote", rarity: "COMMON", price: 50, color: "#d4a017" },
  { id: "emote-dans", name: "Emote: Dans Okap", slot: "emote", rarity: "RARE", price: 280, color: "#e07a5f" },
  { id: "skin-junior-lò", name: "Junior Lò", slot: "skin", rarity: "LEGENDARY", price: 800, color: "#d4a017" },
  { id: "zam-soley-lò", name: "Soley Wouj Lò", slot: "weapon", rarity: "EPIC", price: 360, color: "#c9a227" },
  { id: "machin-nwa", name: "SUV Nwa Lalin", slot: "vehicle", rarity: "RARE", price: 320, color: "#0b0f14" },
  { id: "parachut-drapo", name: "Parachit Karayib", slot: "parachute", rarity: "RARE", price: 240, color: "#d62828" },
  { id: "kad-or", name: "Kad Pwofil Lò", slot: "frame", rarity: "EPIC", price: 200, color: "#d4a017" },
];

export const MISSIONS: MissionDef[] = [
  { id: "d1", title: "Elimine 3 lènmi.", kind: "daily", goal: 3, stat: "kills", xp: 120, coins: 40 },
  { id: "d2", title: "Fè 500 damage.", kind: "daily", goal: 500, stat: "damage", xp: 140, coins: 45 },
  { id: "d3", title: "Jwenn 5 zam.", kind: "daily", goal: 5, stat: "lootWeapons", xp: 100, coins: 30 },
  { id: "d4", title: "Siviv 10 minit.", kind: "daily", goal: 600, stat: "surviveSec", xp: 160, coins: 50 },
  { id: "d5", title: "Fini yon match.", kind: "daily", goal: 1, stat: "matches", xp: 80, coins: 25 },
  { id: "w1", title: "Genyen 2 match nan semèn nan.", kind: "weekly", goal: 2, stat: "wins", xp: 500, coins: 180 },
  { id: "w2", title: "Fè 2500 damage nan semèn nan.", kind: "weekly", goal: 2500, stat: "damage", xp: 420, coins: 150 },
  {
    id: "s1",
    title: "Vwa nan Mache a",
    kind: "story",
    goal: 1,
    stat: "story",
    xp: 200,
    coins: 80,
    storyText:
      "Nan Mache Santral, yon machann pale de yon konpetisyon ki te kòmanse lè vil la te pèdi limyè. OKAP ROYALE pa t fèt pou amizman sèlman — se te yon fason pou chwazi ki moun ki ka kenbe lavil la lè lòd disparèt.",
  },
  {
    id: "s2",
    title: "Sekrè Port Okap",
    kind: "story",
    goal: 1,
    stat: "story",
    xp: 240,
    coins: 90,
    storyText:
      "Kontenè yo nan pò a pa vid. Chak bwat pote mak yon gwoup: Zèb Wouj, Van Nwa, ak Gad Plas. Yo tout te siyen menm kontra a: dènye moun ki rete vin mèt lavil la pou yon sezon.",
  },
  {
    id: "s3",
    title: "Lalin sou Mòn",
    kind: "story",
    goal: 1,
    stat: "story",
    xp: 280,
    coins: 110,
    storyText:
      "Sou mòn nan, Junior jwenn yon vye radyo. Yon vwa di: «Vil la gen anpil sekrè... men jodi a, sèl bagay ki konte se siviv.» Se premye fwa li konprann ke OKAP CITY pa yon kat. Se yon tès.",
  },
];

export const LOADING_TIPS = [
  "Pa bliye pran armor.",
  "Safe zone lan toujou ap deplase.",
  "Travay ak ekip ou pou siviv.",
  "Ayewopò a gen loot ki pi ra, men plis danje.",
  "Machin yo fè bri. Pa bliye sa.",
  "Medkit pran tan. Kache anvan ou geri.",
  "Tande van an: pafwa li kache pa yon lènmi.",
  "Ping yon zam pou ekip ou wè l.",
  "Mòn nan bon pou Je Mòn, move pou kouri.",
  "Pa rete nan Gran Plas san cover.",
];

export const QUICK_CHAT = [
  { id: "go", text: "Ann ale!" },
  { id: "atk", text: "Atake!" },
  { id: "ret", text: "Retrete!" },
  { id: "en", text: "Gen lènmi!" },
  { id: "help", text: "Bezwen èd!" },
  { id: "loot", text: "Pran loot sa!" },
];

export const VOICE_LINES: Record<string, string> = {
  go: "Ann ale!",
  enemy: "Mwen wè yon lènmi!",
  cover: "Pran cover!",
  ammo: "Mwen bezwen ammo!",
  med: "Mwen bezwen medkit!",
  nearby: "Gen moun bò isit la!",
  caution: "Fè atansyon!",
  hit: "Mwen frape li!",
  down: "Li elimine!",
  move: "Nou dwe deplase!",
  zone: "Safe zone lan ap fèmen!",
  win: "Nou genyen!",
  welcome: "Byenveni nan Okap City. Vil la gen anpil sekrè... men jodi a, sèl bagay ki konte se siviv.",
  victory: "Bravo! Se ou ki rete dènye a!",
};

export const STORY_INTRO = `OKAP CITY se yon gwo vil karayibèn fiksyon, enspire pa atmosfè Okap, Ayiti, men ki pa kopi okenn vil reyèl ni okenn jwèt.

Apre limyè yo te disparèt yon sezon, plizyè gwoup te fè pretansyon sou lari, pò, mache ak mòn. Pou evite yon lagè san fen, yon konsey kache te kreye yon konpetisyon: OKAP ROYALE.

Chak konpetitè antre ak yon sèl règ: rete dènye moun, oswa dènye ekip, ki vivan. Pa gen twone piblik. Pa gen rekonpans fasil. Sèl bagay ki rete se non ou sou miray Gran Plas.

Junior, David, Kendy, Mika, Vanessa, Sarah, Naomi ak Ruth pa ewo enpòte. Yo se moun vil la: yon mekanisyen, yon machann, yon pilòt, yon gad. Chak match rakonte yon lòt moso nan sekrè vil la.`;
