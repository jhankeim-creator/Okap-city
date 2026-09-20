import * as THREE from "three";
import { CHARACTERS, CHARACTER_BY_ID } from "../data/characters";
import { WEAPON_BY_ID } from "../data/weapons";
import { LOADING_TIPS, MAP_SIZE, VEHICLES, ZONES } from "../data/world";
import type { BotDifficulty, MatchPhase, TeamMode } from "../data/types";
import { bus } from "./EventBus";
import { clamp, dist2, formatTime, pick } from "./Utils";
import { SaveManager } from "../progression/SaveManager";
import { XPSystem } from "../progression/XPSystem";
import { CurrencySystem } from "../progression/CurrencySystem";
import { SettingsManager } from "../settings/SettingsManager";
import { MissionSystem } from "../missions/MissionSystem";
import { MatchObjectives } from "../missions/MatchObjectives";
import { InventorySystem } from "../inventory/InventorySystem";
import { HealthSystem } from "../player/HealthSystem";
import { ArmorSystem } from "../player/ArmorSystem";
import { PlayerController } from "../player/PlayerController";
import { PlayerCombat } from "../player/PlayerCombat";
import { WeaponSystem } from "../weapons/WeaponSystem";
import { LootSystem } from "../loot/LootSystem";
import { MapBuilder } from "../world/MapBuilder";
import { SafeZoneSystem } from "../world/SafeZoneSystem";
import { WeatherSystem } from "../world/WeatherSystem";
import { AirDropSystem } from "../world/AirDropSystem";
import { VehicleController } from "../vehicles/VehicleController";
import { BotAI } from "../ai/BotAI";
import { AudioManager } from "../audio/AudioManager";
import { NetworkManager } from "../network/NetworkManager";
import { ShopSystem } from "../shop/ShopSystem";
import { animateRig, attachWeaponMesh, createCharacterRig, type CharacterRig } from "../characters/CharacterFactory";
import { UIManager } from "../ui/UIManager";

export class GameManager {
  save = new SaveManager();
  settings = new SettingsManager(this.save);
  xp = new XPSystem(this.save);
  currency = new CurrencySystem(this.save);
  missions = new MissionSystem(this.save, this.xp);
  liveMissions = new MatchObjectives();
  shop = new ShopSystem(this.currency);
  network = new NetworkManager();
  audio = new AudioManager(() => this.settings.all);

  renderer: THREE.WebGLRenderer;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(58, 1, 0.1, 620);
  mapBuilder = new MapBuilder();
  map = this.mapBuilder.build();
  sun: THREE.DirectionalLight;
  hemi: THREE.HemisphereLight;
  weather: WeatherSystem;
  inventory = new InventorySystem();
  health = new HealthSystem();
  armor = new ArmorSystem();
  weapons: WeaponSystem;
  combat: PlayerCombat;
  player: PlayerController;
  loot: LootSystem;
  zone: SafeZoneSystem;
  air: AirDropSystem;
  vehicles: VehicleController;
  bots: BotAI;
  ui: UIManager;
  playerRig: CharacterRig;

  phase: MatchPhase = "cinematic";
  mode: TeamMode = "SOLO";
  difficulty: BotDifficulty = "NORMAL";
  playerTeam = 0;
  clock = new THREE.Clock();
  elapsed = 0;
  matchTime = 0;
  kills = 0;
  assists = 0;
  damageDealt = 0;
  weaponsLooted = 0;
  placement = 24;
  dropTarget = new THREE.Vector3(0, 0, 0);
  keys = new Set<string>();
  firing = false;
  pointerLocked = false;
  lastPing = 0;
  screenShake = 0;
  cinematicT = 0;
  loadingT = 0;
  matchmakingT = 0;
  tip = LOADING_TIPS[0];
  lastHud = 0;
  grenadeCd = 0;
  lastInteract = "";
  running = true;
  fps = 60;

  constructor(private canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.28;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.background = new THREE.Color(0x7ec8ea);
    const fog = new THREE.Fog(0xb7dceb, 160, 520);
    this.scene.fog = fog;
    this.hemi = new THREE.HemisphereLight(0xf4fbff, 0x6a7a4a, 1.05);
    this.scene.add(this.hemi);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.62));
    this.sun = new THREE.DirectionalLight(0xfff0cc, 1.7);
    this.sun.position.set(70, 88, 36);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    this.sun.shadow.camera.left = -80;
    this.sun.shadow.camera.right = 80;
    this.sun.shadow.camera.top = 80;
    this.sun.shadow.camera.bottom = -80;
    this.scene.add(this.sun);
    this.scene.add(this.map.group);
    this.weather = new WeatherSystem(this.scene, this.sun, this.hemi, fog);
    this.loot = new LootSystem(this.scene);
    this.weapons = new WeaponSystem(this.scene, this.inventory);
    this.combat = new PlayerCombat(this.weapons, this.health, this.armor, this.inventory);
    this.player = new PlayerController(this.camera, this.mapBuilder, () => this.map.colliders, () => this.settings.all);
    this.zone = new SafeZoneSystem(this.scene);
    this.air = new AirDropSystem(this.scene, this.loot);
    this.vehicles = new VehicleController(this.scene, this.mapBuilder, () => this.map.colliders);
    this.bots = new BotAI(this.scene, this.zone, this.loot);
    this.playerRig = createCharacterRig(this.save.state.profile.characterId);
    this.scene.add(this.playerRig.root);
    this.ui = new UIManager(uiRoot, this);
    this.bindInput();
    window.addEventListener("resize", () => this.resize());
    this.resize();
    this.applyGraphics();
    bus.on("bot-shot", (p: { from: { name: string }; to: string; damage: number; head: boolean }) => {
      if (p.to === "player") {
        this.combat.receiveHit(p.damage, p.head, p.from.name);
        this.audio.sfx("hit", 0.9);
        this.screenShake = 0.25;
        if (this.settings.all.vibration && navigator.vibrate) navigator.vibrate(18);
      } else {
        this.bots.applyDamage(p.to, p.damage, "bot");
      }
    });
    bus.on("bot-killed", (p: { bot: { name: string; team: number }; attacker: string }) => {
      if (p.attacker === "player") {
        this.kills += 1;
        this.missions.progress("kills", 1);
        this.audio.voice("down");
        this.ui.toast(`Li elimine! ${p.bot.name}`);
      }
    });
    bus.on("zone-closing", () => {
      this.audio.voice("zone");
      this.ui.toast("Safe zone lan ap fèmen!");
    });
    bus.on("airdrop", () => {
      this.ui.toast("Yon kago ap tonbe!");
      this.audio.sfx("explode", 0.5);
    });
    bus.on("death", () => this.endMatch(false));
  }

  async start() {
    await this.audio.init();
    this.ui.mount();
    this.phase = "cinematic";
    this.cinematicT = 0;
    this.audio.playLoop("menu");
    this.audio.voice("welcome");
    if (new URLSearchParams(location.search).has("skipcine")) {
      this.phase = "menu";
      this.ui.show("menu");
    }
    this.loop();
  }

  applyGraphics() {
    const q = this.settings.all.graphics;
    const pr = q === "LOW" ? 0.85 : q === "MEDIUM" ? 1.1 : q === "HIGH" ? 1.5 : 1.8;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, pr));
    this.renderer.shadowMap.enabled = q !== "LOW";
    this.weather.set(q === "ULTRA" ? "sole" : q === "LOW" ? "nwaj" : "sole");
  }

  beginMatchmaking(mode: TeamMode, difficulty: BotDifficulty = "NORMAL") {
    this.mode = mode;
    this.difficulty = difficulty;
    this.phase = "matchmaking";
    this.matchmakingT = 2.2;
    this.ui.show("matchmaking");
    this.audio.resume();
  }

  private beginLoading() {
    this.phase = "loading";
    this.loadingT = 2.4;
    this.tip = pick(LOADING_TIPS);
    this.ui.show("loading");
  }

  startMatch() {
    this.inventory.reset();
    this.health.reset();
    this.armor.reset();
    this.weapons.reset();
    this.loot.scatter(92);
    this.vehicles.spawnAround();
    this.zone.reset();
    this.air.reset();
    this.kills = 0;
    this.assists = 0;
    this.damageDealt = 0;
    this.weaponsLooted = 0;
    this.matchTime = 0;
    this.playerTeam = 0;
    const botParam = Number(new URLSearchParams(location.search).get("bots"));
    const botCount = Number.isFinite(botParam) && botParam > 0 ? Math.min(23, botParam) : this.mode === "SOLO" ? 11 : this.mode === "DUO" ? 15 : 19;
    this.bots.spawn(botCount, this.difficulty, this.mode, this.playerTeam);
    this.placement = botCount + 1;
    this.scene.remove(this.playerRig.root);
    this.playerRig = createCharacterRig(this.save.state.profile.characterId);
    this.scene.add(this.playerRig.root);
    attachWeaponMesh(this.playerRig.weaponBone, this.weapons.def.category);
    this.player.reset(new THREE.Vector3(0, 0, 14));
    this.player.yaw = 0;
    this.player.pitch = 0.04;
    this.player.parachute = false;
    this.player.updateCamera();
    this.phase = "playing";
    this.ui.show("hud");
    this.audio.playLoop("battle");
    this.weather.set("sole");
    this.weather.timeOfDay = 11.2;
    this.liveMissions.reset();
    this.loot.spawn(new THREE.Vector3(5.6, 0.5, 9.2), "EPIC");
    const bag = this.loot.drops[this.loot.drops.length - 1];
    if (bag) bag.item.name = "Valiz Okap";
    this.inventory.add({ id: "start-ar", kind: "weapon", name: "Soley Wouj", qty: 1, weaponId: "soley-wouj" });
    this.inventory.add({ id: "start-ar2", kind: "armor", name: "Blende Nivo 1", qty: 1, level: 1 });
    this.armor.applyBody(1);
    this.weapons.reset();
    attachWeaponMesh(this.playerRig.weaponBone, this.weapons.def.category);
    this.ui.toast("Ou nan lakou Downtown Okap. Chèche zam!");
  }

  dropNow() {
    if (this.phase !== "drop") return;
    this.player.parachute = true;
    this.player.position.y = 16;
    this.phase = "parachute";
  }

  private landIfNeeded() {
    if (this.phase === "parachute" && !this.player.parachute) {
      this.phase = "playing";
      this.ui.toast("Ou ateri. Chèche zam!");
    }
    if (this.phase === "drop") {
      this.player.position.y = 7;
      this.player.parachute = true;
      if (this.firing || this.ui.holdingFire || this.matchTime > 10) this.dropNow();
    }
  }

  endMatch(won: boolean) {
    if (this.phase === "victory" || this.phase === "defeat") return;
    this.placement = won ? 1 : this.bots.aliveCount() + 1;
    const reward = this.xp.matchReward({
      kills: this.kills,
      assists: this.assists,
      survived: this.matchTime,
      won,
      loot: this.weaponsLooted,
    });
    this.save.state.profile.damage += Math.floor(this.damageDealt);
    this.save.state.profile.favoriteCharacter = this.save.state.profile.characterId;
    this.save.state.profile.favoriteWeapon = this.weapons.def.id;
    this.save.persist();
    this.missions.progress("matches", 1);
    this.missions.progress("surviveSec", Math.floor(this.matchTime));
    this.missions.progress("damage", Math.floor(this.damageDealt));
    if (won) this.missions.progress("wins", 1);
    this.phase = won ? "victory" : "defeat";
    this.ui.show(won ? "victory" : "defeat", { reward, kills: this.kills, damage: this.damageDealt, time: this.matchTime, placement: this.placement });
    this.audio.stopLoop();
    this.audio.sfx(won ? "victory" : "defeat");
    if (won) this.audio.voice("victory");
    this.vehicles.exit();
    this.player.inVehicle = false;
  }

  returnToMenu() {
    this.bots.clear();
    this.loot.clear();
    this.vehicles.clear();
    this.phase = "menu";
    this.ui.pause = false;
    document.querySelector("#pause-card")?.classList.remove("show");
    this.ui.show("menu");
    this.audio.playLoop("menu");
  }

  interact() {
    if (this.phase !== "playing" && this.phase !== "parachute") return;
    if (this.player.inVehicle) {
      const v = this.vehicles.current;
      this.vehicles.exit();
      this.player.inVehicle = false;
      if (v) this.player.position.copy(v.position).add(new THREE.Vector3(2, 0, 0));
      this.lastInteract = "Ou soti nan machin nan.";
      return;
    }
    const nearV = this.vehicles.nearest(this.player.position.x, this.player.position.z);
    if (nearV) {
      this.vehicles.enter(nearV);
      this.player.inVehicle = true;
      this.lastInteract = `Ou antre: ${nearV.def.name}`;
      this.audio.sfx("engine");
      if (this.liveMissions.complete("drive")) this.ui.toast("Misyon: Kondwi yon machin ✓");
      return;
    }
    const drop = this.loot.nearest(this.player.position.x, this.player.position.z);
    if (drop) {
      const taken = this.loot.take(drop.id);
      if (taken && this.inventory.add(taken.item)) {
        this.audio.sfx("pickup", 1.1);
        this.ui.toast(`Ou pran ${taken.item.name}`);
        if (taken.item.name === "Valiz Okap" && this.liveMissions.complete("valiz")) this.ui.toast("Misyon: Ranmase valiz la ✓");
        if (taken.item.kind === "weapon") {
          this.weaponsLooted += 1;
          this.missions.progress("lootWeapons", 1);
          this.weapons.reset();
          attachWeaponMesh(this.playerRig.weaponBone, this.weapons.def.category);
        }
        if (taken.item.kind === "armor") this.armor.applyBody(taken.item.level ?? 1);
        if (taken.item.kind === "helmet") this.armor.applyHelmet(taken.item.level ?? 1);
      }
      return;
    }
    const door = this.map.colliders.find((c) => c.enterable && c.door && Math.hypot(c.door.x - this.player.position.x, c.door.z - this.player.position.z) < 2.3);
    if (door) {
      if (this.liveMissions.complete("kay")) this.ui.toast("Misyon: Antre nan kay la ✓");
      this.player.position.set((door.minX + door.maxX) / 2, 0, (door.minZ + door.maxZ) / 2);
      return;
    }
    const downed = this.bots.bots.find((b) => b.downed && b.team === this.playerTeam && b.position.distanceTo(this.player.position) < 2.2);
    if (downed) {
      downed.downed = false;
      downed.hp = 30;
      this.ui.toast(`Ou reviv ${downed.name}`);
    }
  }

  ping(kind: string) {
    if (performance.now() - this.lastPing < 400) return;
    this.lastPing = performance.now();
    const map: Record<string, string> = {
      enemy: "enemy",
      weapon: "ammo",
      location: "go",
      danger: "caution",
      loot: "med",
      vehicle: "move",
    };
    const line = this.audio.voice(map[kind] ?? "nearby");
    this.ui.toast(line);
  }

  private bindInput() {
    window.addEventListener("keydown", (e) => {
      this.keys.add(e.code);
      if (e.code === "Escape") {
        if (this.phase === "playing") this.ui.togglePause();
        document.exitPointerLock();
      }
      if (e.code === "KeyF") this.interact();
      if (e.code === "KeyR") this.weapons.reload();
      if (e.code === "KeyC") this.player.toggleCrouch();
      if (e.code === "KeyZ") this.player.toggleProne();
      if (e.code === "Space") this.player.jump();
      if (e.code === "KeyQ") this.combat.useMed();
      if (e.code === "KeyG") this.throwNade();
      if (e.code === "Digit1") this.weapons.setSlot("primary");
      if (e.code === "Digit2") this.weapons.setSlot("secondary");
      if (e.code === "Digit3") this.weapons.setSlot("melee");
      if (e.code === "KeyV") this.weapons.cycle();
      if (e.code === "KeyT") this.ui.toggleChat();
      if (e.code === "KeyP") this.ping("enemy");
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    this.canvas.addEventListener("click", async () => {
      await this.audio.resume();
      if (this.phase === "cinematic") {
        this.phase = "menu";
        this.ui.show("menu");
        return;
      }
      if (this.phase === "drop") {
        this.dropNow();
        return;
      }
      if ((this.phase === "playing" || this.phase === "parachute") && !this.ui.isOverlay()) {
        this.canvas.requestPointerLock();
        this.firing = true;
        this.tryShoot();
      }
    });
    window.addEventListener("mouseup", () => {
      this.firing = false;
    });
    window.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement === this.canvas || this.pointerLocked) {
        this.player.look(e.movementX, e.movementY, this.weapons.ads);
      }
    });
    document.addEventListener("pointerlockchange", () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
    });
    window.addEventListener("contextmenu", (e) => {
      if (this.phase === "playing") {
        e.preventDefault();
        this.weapons.ads = !this.weapons.ads;
      }
    });
    this.canvas.addEventListener(
      "touchstart",
      () => {
        void this.audio.resume();
      },
      { passive: true },
    );
  }

  throwNade() {
    if (this.grenadeCd > 0) return;
    const g = this.combat.throwGrenade();
    if (!g) return;
    this.grenadeCd = 1.2;
    const origin = this.player.aimOrigin();
    const dir = this.player.aimDir();
    const dest = origin.clone().addScaledVector(dir, 18);
    this.audio.sfx("explode");
    for (const b of this.bots.bots) {
      if (!b.alive) continue;
      const d = b.position.distanceTo(dest);
      if (d < 8) {
        const dmg = g.name.includes("Lafimen") || g.name.includes("Klere") ? 4 : 48 * (1 - d / 8);
        this.bots.applyDamage(b.id, dmg, "player");
        this.damageDealt += dmg;
      }
    }
    this.ui.toast(`Ou jete ${g.name}`);
  }

  tryShoot() {
    if (this.phase !== "playing" && this.phase !== "parachute") return;
    if (this.player.inVehicle) return;
    const shot = this.combat.shoot(this.player.aimOrigin(), this.player.aimDir());
    if (!shot) return;
    this.audio.sfx("shoot", 0.85 + Math.random() * 0.3);
    this.screenShake = 0.12 + this.weapons.def.recoil * 0.15;
    attachWeaponMesh(this.playerRig.weaponBone, shot.weapon.category);
    for (const ray of shot.rays) {
      let hitBot: { id: string; dist: number; head: boolean } | null = null;
      for (const b of this.bots.bots) {
        if (!b.alive) continue;
        const body = new THREE.Sphere(b.position.clone().setY(0.95), 0.55);
        const head = new THREE.Sphere(b.position.clone().setY(1.7), 0.22);
        const hb = ray.intersectSphere(head, new THREE.Vector3());
        const bb = ray.intersectSphere(body, new THREE.Vector3());
        const pt = hb ?? bb;
        if (!pt) continue;
        const dist = pt.distanceTo(ray.origin);
        if (dist > shot.weapon.range) continue;
        if (!hitBot || dist < hitBot.dist) hitBot = { id: b.id, dist, head: !!hb };
      }
      if (hitBot) {
        const dmg = this.weapons.damageFor(shot.weapon, hitBot.dist, hitBot.head);
        this.bots.applyDamage(hitBot.id, dmg, "player");
        this.damageDealt += dmg;
        this.missions.progress("damage", dmg);
        this.audio.sfx("hit", 1.2);
        this.ui.toast(hitBot.head ? "Tèt! Mwen frape li!" : "Mwen frape li!");
      }
    }
  }

  private loop = () => {
    if (!this.running) return;
    requestAnimationFrame(this.loop);
    const raw = this.clock.getDelta();
    const cap = this.settings.all.fpsCap === 30 ? 1 / 30 : 1 / 60;
    const dt = Math.min(raw, 0.05);
    this.elapsed += dt;
    this.fps = lerpFps(this.fps, 1 / Math.max(0.001, raw));
    this.update(dt);
    this.render();
    void cap;
  };

  private update(dt: number) {
    this.weather.update(dt, this.player.position);
    this.loot.update(this.elapsed);
    if (this.phase === "cinematic") {
      this.cinematicT += dt;
      const t = this.cinematicT;
      this.camera.position.set(Math.sin(t * 0.22) * 90, 28 + Math.sin(t * 0.3) * 8, 140 - t * 6);
      this.camera.lookAt(0, 4, 20);
      if (t > 12) {
        this.phase = "menu";
        this.ui.show("menu");
      }
      this.ui.updateCinematic(t);
      return;
    }
    if (this.phase === "menu") {
      const t = this.elapsed;
      this.camera.position.set(Math.sin(t * 0.12) * 70, 22, 90 + Math.cos(t * 0.1) * 30);
      this.camera.lookAt(0, 3, 10);
      return;
    }
    if (this.phase === "matchmaking") {
      this.matchmakingT -= dt;
      this.ui.updateMatchmaking(this.matchmakingT);
      if (this.matchmakingT <= 0) this.beginLoading();
      return;
    }
    if (this.phase === "loading") {
      this.loadingT -= dt;
      this.ui.updateLoading(this.loadingT, this.tip);
      if (this.loadingT <= 0) this.startMatch();
      return;
    }
    if (this.phase === "victory" || this.phase === "defeat") {
      animateRig(this.playerRig, this.phase === "victory" ? "win" : "dead", this.elapsed);
      return;
    }

    this.matchTime += dt;
    this.grenadeCd = Math.max(0, this.grenadeCd - dt);
    this.player.sprinting = this.keys.has("ShiftLeft") || this.keys.has("ShiftRight");
    this.player.moveInput.set(
      (this.keys.has("KeyD") ? 1 : 0) - (this.keys.has("KeyA") ? 1 : 0) + this.ui.joy.x,
      (this.keys.has("KeyW") ? 1 : 0) - (this.keys.has("KeyS") ? 1 : 0) + this.ui.joy.y,
    );
    if (this.ui.look.x || this.ui.look.y) {
      this.player.look(this.ui.look.x * 22, this.ui.look.y * 22, this.weapons.ads);
      this.ui.look.x = 0;
      this.ui.look.y = 0;
    }
    if (this.player.inVehicle && this.vehicles.current) {
      this.vehicles.drive(dt, this.player.moveInput.y, this.player.moveInput.x);
      this.player.position.copy(this.vehicles.current.position);
      this.player.yaw = this.vehicles.current.yaw;
      this.player.updateCamera(false);
      this.camera.position.y += 2.2;
    } else {
      this.player.update(dt);
    }
    this.landIfNeeded();
    this.weapons.update(dt);
    this.health.update(dt);
    this.zone.update(dt);
    this.air.update(dt, this.zone);
    this.bots.update(dt, this.elapsed, this.player.position, !this.health.dead && !this.health.downed, this.playerTeam);
    if ((this.phase === "playing" || this.phase === "parachute") && !this.zone.inside(this.player.position.x, this.player.position.z) && !this.health.dead) {
      this.health.damage(this.zone.damagePerSecond() * dt, "safe-zone");
    }
    if (this.firing || this.ui.holdingFire) this.tryShoot();
    if (this.weapons.reloading > 0) this.audio.sfx === undefined;
    this.playerRig.root.position.copy(this.player.position);
    this.playerRig.root.rotation.y = this.player.yaw;
    this.playerRig.root.visible = true;
    const anim = this.health.dead
      ? "dead"
      : this.health.downed
        ? "down"
        : this.player.inVehicle
          ? "drive"
          : this.weapons.reloading > 0
            ? "reload"
            : this.firing
              ? "shoot"
              : !this.player.grounded
                ? "jump"
                : this.player.stance === "prone"
                  ? "prone"
                  : this.player.stance === "crouch"
                    ? "crouch"
                    : this.player.moveInput.length() > 0.2
                      ? this.player.sprinting
                        ? "sprint"
                        : "run"
                      : "idle";
    animateRig(this.playerRig, anim, this.elapsed);
    if (this.phase === "playing" || this.phase === "parachute") {
      const enemiesLeft = this.bots.bots.filter((b) => b.alive && b.team !== this.playerTeam).length;
      this.placement = enemiesLeft + (this.health.dead ? 0 : 1);
      if (!this.health.dead && enemiesLeft === 0) this.endMatch(true);
      if (this.matchTime > 180 && this.zone.radius < 30) this.audio.playLoop("final");
      if (dist2(this.player.position.x, this.player.position.z, -120, 110) < 42) {
        if (this.liveMissions.complete("port")) this.ui.toast("Misyon: Ale nan Port Okap ✓");
      }
    }
    if (this.elapsed - this.lastHud > 0.08) {
      this.lastHud = this.elapsed;
      this.ui.updateHud();
    }
    this.network.enqueue({
      playerId: "local",
      x: this.player.position.x,
      z: this.player.position.z,
      yaw: this.player.yaw,
      hp: this.health.hp,
      shooting: this.firing,
    });
  }

  private render() {
    if (this.screenShake > 0) {
      this.camera.position.x += (Math.random() - 0.5) * this.screenShake;
      this.camera.position.y += (Math.random() - 0.5) * this.screenShake;
      this.screenShake *= 0.86;
    }
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / Math.max(1, h);
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  zoneInfo() {
    return {
      name: currentZone(this.player.position.x, this.player.position.z),
      timer: formatTime(Math.max(0, this.zone.timer)),
      shrinking: this.zone.shrinking,
      radius: this.zone.radius,
      cx: this.zone.cx,
      cz: this.zone.cz,
    };
  }

  compass() {
    const deg = ((-this.player.yaw * 180) / Math.PI + 360) % 360;
    if (deg > 315 || deg <= 45) return "N";
    if (deg <= 135) return "W";
    if (deg <= 225) return "S";
    return "E";
  }
}

function currentZone(x: number, z: number) {
  let best = ZONES[0];
  let d = Infinity;
  for (const zdef of ZONES) {
    const dd = dist2(x, z, zdef.x, zdef.z);
    if (dd < d) {
      d = dd;
      best = zdef;
    }
  }
  return best.name;
}

function lerpFps(a: number, b: number) {
  return a + (b - a) * 0.08;
}

export const WORLD_LIMIT = MAP_SIZE;
export { CHARACTERS, CHARACTER_BY_ID, VEHICLES, WEAPON_BY_ID };
