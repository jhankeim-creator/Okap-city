import { CHARACTERS } from "../data/characters";
import { WEAPONS } from "../data/weapons";
import { COSMETICS, LOADING_TIPS, MISSIONS, QUICK_CHAT, STORY_INTRO, VEHICLES, ZONES } from "../data/world";
import { RARITY_COLOR, formatTime, xpForLevel } from "../core/Utils";
import type { GameManager } from "../core/GameManager";
import type { BotDifficulty, TeamMode } from "../data/types";

export class UIManager {
  joy = { x: 0, y: 0 };
  look = { x: 0, y: 0 };
  holdingFire = false;
  private screen = "cinematic";
  pause = false;
  private chatOpen = false;
  private toastT = 0;
  private toastText = "";

  constructor(
    private root: HTMLElement,
    private game: GameManager,
  ) {}

  mount() {
    this.root.innerHTML = "";
    this.root.append(
      el("div", { id: "cinematic-overlay", class: "overlay show" }, [
        el("div", { class: "cine-copy" }, [
          el("p", { class: "voice" }, ["Byenveni nan Okap City. Vil la gen anpil sekrè... men jodi a, sèl bagay ki konte se siviv."]),
          el("h1", { class: "logo" }, ["OKAP CITY"]),
          el("p", { class: "slogan" }, ["BATAY LA KÒMANSE NAN OKAP"]),
          el("button", { class: "btn gold", id: "skip-cine" }, ["KONTINYE"]),
        ]),
      ]),
      el("div", { id: "menu-overlay", class: "overlay" }),
      el("div", { id: "panel-overlay", class: "overlay" }),
      el("div", { id: "match-overlay", class: "overlay" }),
      el("div", { id: "hud-overlay", class: "hud" }),
      el("div", { id: "toast", class: "toast" }),
    );
    this.bindStatic();
    this.renderMenu();
    this.renderHud();
    this.show("cinematic");
  }

  private bindStatic() {
    this.root.addEventListener("click", (e) => {
      const t = e.target as HTMLElement;
      const act = t.closest("[data-act]") as HTMLElement | null;
      if (!act) return;
      this.handle(act.dataset.act!, act.dataset.arg);
    });
    this.root.querySelector("#skip-cine")?.addEventListener("click", () => {
      this.game.phase = "menu";
      this.show("menu");
    });
  }

  handle(act: string, arg?: string) {
    const g = this.game;
    switch (act) {
      case "play":
        g.beginMatchmaking("SOLO", g.difficulty);
        break;
      case "br":
        this.showPanel("br");
        break;
      case "start-mode":
        g.beginMatchmaking((arg as TeamMode) ?? "SOLO", g.difficulty);
        break;
      case "missions":
        this.showPanel("missions");
        break;
      case "arsenal":
        this.showPanel("arsenal");
        break;
      case "chars":
        this.showPanel("chars");
        break;
      case "cars":
        this.showPanel("cars");
        break;
      case "shop":
        this.showPanel("shop");
        break;
      case "profile":
        this.showPanel("profile");
        break;
      case "rank":
        this.showPanel("rank");
        break;
      case "settings":
        this.showPanel("settings");
        break;
      case "friends":
        this.showPanel("friends");
        break;
      case "story":
        this.showPanel("story");
        break;
      case "close-panel":
        this.show("menu");
        break;
      case "pick-char":
        if (arg) {
          g.save.state.profile.characterId = arg;
          g.save.persist();
          this.showPanel("chars");
        }
        break;
      case "pick-car":
        if (arg) {
          g.save.state.profile.vehicleId = arg;
          g.save.persist();
          this.showPanel("cars");
        }
        break;
      case "buy":
        if (arg) {
          const r = g.shop.buy(arg);
          this.toast(r.reason);
          this.showPanel("shop");
        }
        break;
      case "equip":
        if (arg) {
          g.currency.equip(arg);
          this.toast("Ekipman mete.");
          this.showPanel("shop");
        }
        break;
      case "claim":
        if (arg) {
          const ok = g.missions.claim(arg);
          this.toast(ok ? "Misyon fini. XP ak coins ajoute." : "Misyon an poko fini.");
          this.showPanel("missions");
        }
        break;
      case "read-story":
        if (arg) {
          g.missions.progress("story", 1);
          g.save.state.profile.missionProgress[arg] = 1;
          g.save.persist();
          this.showPanel("missions");
        }
        break;
      case "diff":
        g.difficulty = (arg as BotDifficulty) ?? "NORMAL";
        this.showPanel("br");
        break;
      case "save-name": {
        const input = this.root.querySelector<HTMLInputElement>("#username");
        if (input?.value.trim()) {
          g.save.state.profile.username = input.value.trim().slice(0, 16);
          g.save.persist();
          this.toast("Non anrejistre.");
          this.showPanel("profile");
        }
        break;
      }
      case "friend-add": {
        const input = this.root.querySelector<HTMLInputElement>("#friend-name");
        if (input?.value.trim()) {
          g.save.state.profile.incomingFriends.push(input.value.trim());
          g.save.persist();
          this.toast("Demann voye / resevwa.");
          this.showPanel("friends");
        }
        break;
      }
      case "friend-accept":
        if (arg) {
          g.save.state.profile.friends.push(arg);
          g.save.state.profile.incomingFriends = g.save.state.profile.incomingFriends.filter((n) => n !== arg);
          g.save.persist();
          this.showPanel("friends");
        }
        break;
      case "friend-remove":
        if (arg) {
          g.save.state.profile.friends = g.save.state.profile.friends.filter((n) => n !== arg);
          g.save.persist();
          this.showPanel("friends");
        }
        break;
      case "invite":
        this.toast(`${arg} envite nan eskwad. Bots ap ranpli plas yo.`);
        break;
      case "set":
        this.applySetting(arg ?? "");
        break;
      case "menu":
        this.pause = false;
        this.root.querySelector("#pause-card")?.classList.remove("show");
        g.returnToMenu();
        break;
      case "replay":
        g.beginMatchmaking(g.mode, g.difficulty);
        break;
      case "resume":
        this.pause = false;
        this.root.querySelector("#pause-card")?.classList.remove("show");
        break;
      case "fire-down":
        this.holdingFire = true;
        break;
      case "jump":
        g.player.jump();
        break;
      case "crouch":
        g.player.toggleCrouch();
        break;
      case "prone":
        g.player.toggleProne();
        break;
      case "reload":
        g.weapons.reload();
        break;
      case "weapon":
        g.weapons.cycle();
        break;
      case "interact":
        g.interact();
        break;
      case "heal":
        g.combat.useMed();
        break;
      case "aim":
        g.weapons.ads = !g.weapons.ads;
        break;
      case "nade":
        g.throwNade();
        break;
      case "ping":
        g.ping(arg ?? "location");
        break;
      case "toggle-chat":
        this.toggleChat();
        break;
      case "chat":
        if (arg) {
          const line = QUICK_CHAT.find((c) => c.id === arg);
          if (line) {
            g.audio.speak(line.text);
            this.toast(line.text);
          }
        }
        this.chatOpen = false;
        this.updateHud();
        break;
      default:
        break;
    }
  }

  private applySetting(raw: string) {
    const [key, value] = raw.split(":");
    const s = this.game.settings;
    if (key === "graphics") s.set("graphics", value as "LOW" | "MEDIUM" | "HIGH" | "ULTRA");
    if (key === "fps") s.set("fpsCap", Number(value) === 30 ? 30 : 60);
    if (key === "gyro") s.set("gyroscope", value === "1");
    if (key === "vib") s.set("vibration", value === "1");
    if (key === "assist") s.set("aimAssist", value === "1");
    if (key === "sens") s.set("sensitivity", Number(value));
    if (key === "aim") s.set("aimSensitivity", Number(value));
    if (key === "music") s.set("music", Number(value));
    if (key === "sound") s.set("sound", Number(value));
    if (key === "voice") s.set("voice", Number(value));
    this.game.audio.applyVolumes();
    this.game.applyGraphics();
    this.showPanel("settings");
  }

  show(name: string, extra?: Record<string, unknown>) {
    this.screen = name;
    const cine = this.root.querySelector("#cinematic-overlay")!;
    const menu = this.root.querySelector("#menu-overlay")!;
    const panel = this.root.querySelector("#panel-overlay")!;
    const match = this.root.querySelector("#match-overlay")!;
    const hud = this.root.querySelector("#hud-overlay")!;
    cine.classList.toggle("show", name === "cinematic");
    menu.classList.toggle("show", name === "menu");
    panel.classList.toggle("show", ["missions", "arsenal", "chars", "cars", "shop", "profile", "rank", "settings", "friends", "story", "br"].includes(name));
    match.classList.toggle("show", ["matchmaking", "loading", "victory", "defeat"].includes(name));
    hud.classList.toggle("show", name === "hud");
    if (name === "menu") this.renderMenu();
    if (name === "matchmaking") match.innerHTML = this.matchmakingHtml();
    if (name === "loading") match.innerHTML = this.loadingHtml();
    if (name === "victory") match.innerHTML = this.resultHtml(true, extra);
    if (name === "defeat") match.innerHTML = this.resultHtml(false, extra);
  }

  showPanel(name: string) {
    this.screen = name;
    const panel = this.root.querySelector("#panel-overlay")!;
    panel.classList.add("show");
    this.root.querySelector("#menu-overlay")?.classList.add("show");
    panel.innerHTML = `<div class="panel">${this.panelHtml(name)}<button class="btn" data-act="close-panel">RETOUNEN</button></div>`;
  }

  isOverlay() {
    return ["menu", "missions", "arsenal", "chars", "cars", "shop", "profile", "rank", "settings", "friends", "story", "br", "matchmaking", "loading", "victory", "defeat", "cinematic"].includes(this.screen) || this.pause;
  }

  togglePause() {
    if (this.screen !== "hud") return;
    this.pause = !this.pause;
    let card = this.root.querySelector("#pause-card");
    if (!card) {
      card = el("div", { id: "pause-card", class: "panel pause" });
      this.root.append(card);
    }
    card.classList.toggle("show", this.pause);
    card.innerHTML = `<h2>POZ</h2><button class="btn gold" data-act="resume">KONTINYE</button><button class="btn" data-act="menu">RETOUNEN MENU</button>`;
  }

  toggleChat() {
    this.chatOpen = !this.chatOpen;
    this.updateHud();
  }

  toast(text: string) {
    this.toastText = text;
    this.toastT = 2.4;
    const n = this.root.querySelector("#toast")!;
    n.textContent = text;
    n.classList.add("show");
  }

  updateCinematic(t: number) {
    const voice = this.root.querySelector(".voice") as HTMLElement | null;
    if (voice) voice.style.opacity = t < 8 ? "1" : "0";
    const logo = this.root.querySelector(".logo") as HTMLElement | null;
    if (logo) logo.style.opacity = t > 7 ? "1" : "0";
  }

  updateMatchmaking(t: number) {
    const n = this.root.querySelector("#mm-count");
    if (n) n.textContent = `${Math.min(24, 8 + Math.floor((2.2 - t) * 6))} / 24`;
  }

  updateLoading(t: number, tip: string) {
    const bar = this.root.querySelector<HTMLElement>("#load-bar");
    if (bar) bar.style.width = `${Math.min(100, (1 - t / 2.4) * 100)}%`;
    const tipEl = this.root.querySelector("#load-tip");
    if (tipEl) tipEl.textContent = tip;
  }

  renderMenu() {
    const p = this.game.save.state.profile;
    this.root.querySelector("#menu-overlay")!.innerHTML = `
      <div class="menu-shell">
        <div class="brand">
          <div class="crest">OC</div>
          <div>
            <h1 class="logo-crown">OKAP CITY</h1>
            <p class="slogan">BATAY LA KÒMANSE NAN OKAP</p>
          </div>
        </div>
        <div class="menu-grid">
          ${btn("play", "JWE")}
          ${btn("br", "BATTLE ROYALE")}
          ${btn("missions", "MISYON")}
          ${btn("arsenal", "ARSENAL")}
          ${btn("chars", "PERSONAJ")}
          ${btn("cars", "MACHIN")}
          ${btn("shop", "SHOP")}
          ${btn("profile", "PROFIL")}
          ${btn("rank", "RANKING")}
          ${btn("settings", "SETTINGS")}
        </div>
        <div class="menu-foot">
          <span>${p.username} · Nivo ${p.level} · ${this.game.save.rank}</span>
          <span>${p.coins} OKAP COINS</span>
          <button class="link" data-act="friends">Zanmi</button>
          <button class="link" data-act="story">Istwa</button>
        </div>
      </div>`;
  }

  private panelHtml(name: string) {
    const p = this.game.save.state.profile;
    if (name === "br") {
      return `<h2>OKAP ROYALE</h2><p>Chwazi mòd ak difikilte bots.</p>
        <div class="row">${btn("start-mode", "SOLO", "SOLO")}${btn("start-mode", "DUO", "DUO")}${btn("start-mode", "SQUAD", "SQUAD")}</div>
        <div class="row">${btn("diff", "FASIL", "EASY")}${btn("diff", "NORMAL", "NORMAL")}${btn("diff", "DIFISIL", "HARD")}${btn("diff", "EKSTRÈM", "EXTREME")}</div>
        <p class="muted">Difikilte kounye a: ${this.game.difficulty}</p>`;
    }
    if (name === "missions") {
      return `<h2>MISYON</h2>${this.game.missions
        .list()
        .map((m) => {
          const ready = m.progress >= m.goal;
          return `<article class="card"><h3>${m.title}</h3><p>${m.kind.toUpperCase()} · ${Math.floor(m.progress)}/${m.goal} · +${m.xp} XP</p>
            ${m.storyText ? `<p class="story">${m.storyText}</p><button class="btn" data-act="read-story" data-arg="${m.id}">LI Istwa</button>` : ""}
            <button class="btn gold" data-act="claim" data-arg="${m.id}" ${m.claimed || !ready ? "disabled" : ""}>${m.claimed ? "RESEVWA" : "REKLAME"}</button></article>`;
        })
        .join("")}`;
    }
    if (name === "arsenal") {
      return `<h2>ARSENAL</h2><div class="cards">${WEAPONS.map(
        (w) => `<article class="card"><b style="color:${RARITY_COLOR[w.rarity]}">${w.name}</b><p>${w.category} · ${w.damage} dmg · ${w.fireRate}/s</p><p>${w.description}</p></article>`,
      ).join("")}</div>`;
    }
    if (name === "chars") {
      return `<h2 class="logo-crown">PERSONAJ</h2><p>8 pèsonaj orijinal · 4 gason · 4 fi · chak genyen pwòp istwa.</p>
      <div class="roster">${CHARACTERS.map(
        (c) => `<article class="card ${p.characterId === c.id ? "sel" : ""}"><h3>${c.mark} ${c.name}</h3><p>${c.role}</p><p>${c.bio}</p><button class="btn" data-act="pick-char" data-arg="${c.id}">${p.characterId === c.id ? "CHWAZI" : "SELEKSYONE"}</button></article>`,
      ).join("")}</div>
      <h3>Pèsonalizasyon</h3><p class="muted">Cheve, outfit, soulye, sak, mask, linèt, gant, emote ak skin. Cosmetics pa bay avantaj konba.</p>
      <div class="cards">${COSMETICS.filter((c) => ["cheve", "outfit", "shoes", "backpack", "mask", "glasses", "gloves", "emote", "skin"].includes(c.slot))
        .map((c) => `<article class="card"><b style="color:${RARITY_COLOR[c.rarity]}">${c.name}</b><p>${c.slot}</p>
          ${p.unlockedCosmetics.includes(c.id) ? `<button class="btn" data-act="equip" data-arg="${c.id}">METE</button>` : `<button class="btn gold" data-act="buy" data-arg="${c.id}">ACHTE ${c.price}</button>`}
        </article>`)
        .join("")}</div>`;
    }
    if (name === "cars") {
      return `<h2>MACHIN</h2><div class="cards">${VEHICLES.map(
        (v) => `<article class="card ${p.vehicleId === v.id ? "sel" : ""}"><h3>${v.name}</h3><p>${v.kind} · vitès ${v.speed} · gaz ${v.fuel}</p><button class="btn" data-act="pick-car" data-arg="${v.id}">CHWAZI</button></article>`,
      ).join("")}</div>`;
    }
    if (name === "shop") {
      return `<h2>SHOP · OKAP COINS ${p.coins}</h2><p>Wotasyon jodi a. Pa gen avantaj konba pou vann.</p><div class="cards">${this.game.shop
        .items()
        .map((c) => `<article class="card"><b style="color:${RARITY_COLOR[c.rarity]}">${c.name}</b><p>${c.slot} · ${c.price} coins</p>
          ${p.unlockedCosmetics.includes(c.id) ? `<button class="btn" data-act="equip" data-arg="${c.id}">METE</button>` : `<button class="btn gold" data-act="buy" data-arg="${c.id}">ACHTE</button>`}</article>`)
        .join("")}</div>`;
    }
    if (name === "profile") {
      return `<h2>PROFIL</h2>
        <label>Non itilizatè <input id="username" value="${p.username}" maxlength="16"/></label>
        <button class="btn gold" data-act="save-name">SOVE NON</button>
        <ul class="stats">
          <li>Nivo ${p.level} · XP ${p.xp}/${xpForLevel(p.level)}</li>
          <li>Rank: ${this.game.save.rank} (${p.rankPoints})</li>
          <li>Viktwa ${p.wins} · Eliminasyon ${p.kills} · Match ${p.matches}</li>
          <li>Damage ${Math.floor(p.damage)}</li>
          <li>Zam favori: ${WEAPONS.find((w) => w.id === p.favoriteWeapon)?.name ?? p.favoriteWeapon}</li>
          <li>Pèsonaj favori: ${CHARACTERS.find((c) => c.id === p.favoriteCharacter)?.name ?? p.favoriteCharacter}</li>
          <li>Coins: ${p.coins}</li>
        </ul>`;
    }
    if (name === "rank") {
      return `<h2>RANKING</h2><p>Apre MVP: Bronze, Silver, Gold, Platinum, Diamond, Master.</p>
        <p>Ou ye: <b>${this.game.save.rank}</b> ak ${p.rankPoints} pwen.</p>
        <p class="muted">Matchmaking pa fèt pou fè w pèdi ekspre. Pwen yo baze sou pèfòmans: viktwa, eliminasyon, tan siviv.</p>
        <ol>${["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"].map((r) => `<li>${r}${r === this.game.save.rank ? " ← ou" : ""}</li>`).join("")}</ol>`;
    }
    if (name === "settings") {
      const s = this.game.settings.all;
      return `<h2>SETTINGS</h2>
        <div class="set-grid">
          <p>Grafik</p><div>${["LOW", "MEDIUM", "HIGH", "ULTRA"].map((q) => btn("set", q, `graphics:${q}`)).join("")}</div>
          <p>FPS</p><div>${btn("set", "30", "fps:30")}${btn("set", "60", "fps:60")}</div>
          <p>Sansibilite ${s.sensitivity.toFixed(2)}</p><input type="range" min="0.4" max="2" step="0.05" value="${s.sensitivity}" onchange="document.body.dispatchEvent(new CustomEvent('okap-set',{detail:'sens:'+this.value}))"/>
          <p>Aim ${s.aimSensitivity.toFixed(2)}</p><input type="range" min="0.3" max="1.6" step="0.05" value="${s.aimSensitivity}" onchange="document.body.dispatchEvent(new CustomEvent('okap-set',{detail:'aim:'+this.value}))"/>
          <p>Mizik ${s.music.toFixed(2)}</p><input type="range" min="0" max="1" step="0.05" value="${s.music}" onchange="document.body.dispatchEvent(new CustomEvent('okap-set',{detail:'music:'+this.value}))"/>
          <p>Son ${s.sound.toFixed(2)}</p><input type="range" min="0" max="1" step="0.05" value="${s.sound}" onchange="document.body.dispatchEvent(new CustomEvent('okap-set',{detail:'sound:'+this.value}))"/>
          <p>Vwa ${s.voice.toFixed(2)}</p><input type="range" min="0" max="1" step="0.05" value="${s.voice}" onchange="document.body.dispatchEvent(new CustomEvent('okap-set',{detail:'voice:'+this.value}))"/>
          <p>Gyroscope</p><div>${btn("set", s.gyroscope ? "ON" : "OFF", `gyro:${s.gyroscope ? "0" : "1"}`)}</div>
          <p>Vibration</p><div>${btn("set", s.vibration ? "ON" : "OFF", `vib:${s.vibration ? "0" : "1"}`)}</div>
          <p>Aim assist</p><div>${btn("set", s.aimAssist ? "ON" : "OFF", `assist:${s.aimAssist ? "0" : "1"}`)}</div>
          <p>Lang</p><b>Kreyòl Ayisyen</b>
          <p>Kontwòl</p><span>Goch: deplase · Dwèt: vize · T/CHAT · F/ENTRE · Q/GERI</span>
        </div>`;
    }
    if (name === "friends") {
      return `<h2>ZANMI</h2>
        <div class="row"><input id="friend-name" placeholder="Non zanmi"/><button class="btn gold" data-act="friend-add">AJOUTE</button></div>
        <h3>Demann</h3>${p.incomingFriends.map((n) => `<div class="row"><span>${n}</span><button class="btn" data-act="friend-accept" data-arg="${n}">AKSEPTE</button></div>`).join("") || "<p>Pa gen demann.</p>"}
        <h3>Lis</h3>${p.friends.map((n) => `<div class="row"><span>${n}</span><button class="btn" data-act="invite" data-arg="${n}">ENVITE</button><button class="btn" data-act="friend-remove" data-arg="${n}">RETIRE</button></div>`).join("")}`;
    }
    if (name === "story") {
      return `<h2>ISTWA OKAP CITY</h2><p class="story">${STORY_INTRO.replace(/\n/g, "<br/>")}</p>
        <h3>Zòn</h3>${ZONES.map((z) => `<p><b>${z.name}</b> — ${z.description}</p>`).join("")}`;
    }
    return "";
  }

  private matchmakingHtml() {
    return `<div class="panel center"><h2>MATCHMAKING</h2><p>N ap chèche konpetitè pou OKAP ROYALE...</p><p id="mm-count">8 / 24</p><p class="muted">Si pa gen ase jwè, bots ap ranpli match la.</p></div>`;
  }

  private loadingHtml() {
    return `<div class="panel center load"><div class="crest big">OC</div><h1>OKAP CITY</h1><p id="load-tip">${LOADING_TIPS[0]}</p><div class="bar"><i id="load-bar"></i></div></div>`;
  }

  private resultHtml(won: boolean, extra?: Record<string, unknown>) {
    const reward = (extra?.reward as { xp: number; coins: number }) ?? { xp: 0, coins: 0 };
    return `<div class="panel center">
      <h1 class="${won ? "win" : "lose"}">${won ? "OU GENYEN!" : "OU ELIJINE"}</h1>
      <p>${won ? "Bravo! Se ou ki rete dènye a!" : "Batay la poko fini. Eseye ankò."}</p>
      <ul class="stats">
        <li>Eliminasyon: ${extra?.kills ?? 0}</li>
        <li>Damage: ${Math.floor(Number(extra?.damage ?? 0))}</li>
        <li>Tan: ${formatTime(Number(extra?.time ?? 0))}</li>
        <li>Pozisyon: #${extra?.placement ?? "-"}</li>
        <li>XP: +${reward.xp} · Coins: +${reward.coins}</li>
      </ul>
      <div class="row">${btn("replay", "REJWE")}${btn("menu", "RETOUNEN MENU")}</div>
    </div>`;
  }

  renderHud() {
    this.root.querySelector("#hud-overlay")!.innerHTML = `
      <div class="compass-bar" id="compass">N  NW  W  SW  S  SE  E  NE  N</div>
      <div class="minimap" id="minimap"></div>
      <div class="mission-box" id="mission-box"></div>
      <div class="top-right">
        <div class="meta-pill"><span id="alive">24</span> · ✕ <span id="kills">0</span></div>
        <div class="meta-pill" id="zone-t">0:45 Safe zone</div>
        <div class="weapon-stack" id="ammo"></div>
      </div>
      <div class="zone-name" id="zone-name"></div>
      <div class="crosshair"></div>
      <div class="player-card">
        <div class="portrait" id="portrait">J</div>
        <div>
          <b id="hud-name">Junior</b>
          <div class="bars"><i id="hp-bar"></i><i id="ar-bar"></i></div>
        </div>
      </div>
      <div class="joy" id="joy"><b></b></div>
      <div class="look" id="look"></div>
      <div class="btns">
        <button data-act="jump">SOTE</button>
        <button data-act="aim">VIZE</button>
        <button data-act="fire-down" id="fire">TIRE</button>
        <button data-act="crouch">AKOUPI</button>
        <button data-act="reload">CHAJ</button>
        <button data-act="interact">ANTRE</button>
        <button data-act="heal">GERI</button>
        <button data-act="nade">GRENAD</button>
        <button data-act="weapon">ZAM</button>
      </div>
      <div class="vehicle-hud" id="vehicle-hud">
        <span id="speedo">0 KM/H</span>
        <span id="fuel">GAZ 100</span>
        <button data-act="interact">SOTI</button>
      </div>
      <div class="chat-dock" id="chat-dock"></div>`;
    this.bindPads();
    document.body.addEventListener("okap-set", (e) => {
      this.applySetting((e as CustomEvent<string>).detail);
    });
  }

  private bindPads() {
    const joy = this.root.querySelector<HTMLElement>("#joy");
    const look = this.root.querySelector<HTMLElement>("#look");
    const fire = this.root.querySelector<HTMLElement>("#fire");
    const bindStick = (node: HTMLElement | null, target: { x: number; y: number }, reset: boolean) => {
      if (!node) return;
      const go = (e: PointerEvent) => {
        const r = node.getBoundingClientRect();
        target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
        target.y = -((e.clientY - r.top) / r.height - 0.5) * 2;
      };
      node.addEventListener("pointerdown", (e) => {
        node.setPointerCapture(e.pointerId);
        go(e);
      });
      node.addEventListener("pointermove", (e) => {
        if (e.pressure || (e.buttons ?? 0)) go(e);
      });
      node.addEventListener("pointerup", () => {
        if (reset) {
          target.x = 0;
          target.y = 0;
        }
      });
    };
    bindStick(joy, this.joy, true);
    bindStick(look, this.look, true);
    fire?.addEventListener("pointerdown", () => {
      this.holdingFire = true;
    });
    fire?.addEventListener("pointerup", () => {
      this.holdingFire = false;
    });
    window.addEventListener("pointerup", () => {
      this.holdingFire = false;
    });
  }

  updateHud() {
    if (this.screen !== "hud") {
      if (this.toastT > 0) {
        this.toastT -= 0.08;
        if (this.toastT <= 0) this.root.querySelector("#toast")?.classList.remove("show");
      }
      return;
    }
    const g = this.game;
    const hp = this.root.querySelector<HTMLElement>("#hp-bar");
    const ar = this.root.querySelector<HTMLElement>("#ar-bar");
    if (hp) hp.style.width = `${g.health.hp}%`;
    if (ar) ar.style.width = `${Math.min(100, g.armor.armor)}%`;
    const ammo = this.root.querySelector("#ammo");
    if (ammo) ammo.innerHTML = `${g.weapons.def.name}<br>${g.weapons.mag}/${g.inventory.ammo[g.weapons.def.category] ?? 0}`;
    const z = g.zoneInfo();
    const zt = this.root.querySelector("#zone-t");
    if (zt) zt.textContent = z.shrinking ? "Safe zone ap fèmen" : `${z.timer} Safe zone`;
    const zn = this.root.querySelector("#zone-name");
    if (zn) zn.textContent = z.name;
    const al = this.root.querySelector("#alive");
    if (al) al.textContent = String(g.bots.aliveCount() + (g.health.dead ? 0 : 1));
    const kills = this.root.querySelector("#kills");
    if (kills) kills.textContent = String(g.kills);
    const compass = this.root.querySelector("#compass");
    if (compass) compass.textContent = `${g.compass()}   ·   ${z.name}`;
    const name = this.root.querySelector("#hud-name");
    if (name) name.textContent = g.save.state.profile.username;
    const portrait = this.root.querySelector("#portrait");
    if (portrait) portrait.textContent = (g.save.state.profile.username[0] ?? "J").toUpperCase();
    const missions = this.root.querySelector("#mission-box");
    if (missions) {
      missions.innerHTML = `<b>MISYON</b>${g.liveMissions.items.map((m) => `<li class="${m.done ? "done" : ""}">${m.done ? "☑" : "☐"} ${m.title}</li>`).join("")}`;
    }
    const vh = this.root.querySelector("#vehicle-hud");
    if (vh) {
      vh.classList.toggle("on", g.player.inVehicle);
      const v = g.vehicles.current;
      const speed = this.root.querySelector("#speedo");
      const fuel = this.root.querySelector("#fuel");
      if (v && speed) speed.textContent = `${Math.abs(Math.round(v.speed * 4))} KM/H`;
      if (v && fuel) fuel.textContent = `GAZ ${Math.round(v.fuel)}`;
    }
    this.drawMinimap();
    const dock = this.root.querySelector("#chat-dock");
    if (dock) {
      dock.innerHTML = this.chatOpen
        ? QUICK_CHAT.map((c) => `<button data-act="chat" data-arg="${c.id}">${c.text}</button>`).join("")
        : `<button class="btn" data-act="toggle-chat">CHAT</button>`;
    }
    if (this.toastT > 0) {
      this.toastT -= 0.08;
      if (this.toastT <= 0) this.root.querySelector("#toast")?.classList.remove("show");
    }
  }

  private drawMinimap() {
    const node = this.root.querySelector("#minimap");
    if (!node) return;
    const g = this.game;
    const px = 50 + (g.player.position.x / 200) * 46;
    const pz = 50 + (g.player.position.z / 200) * 46;
    const zx = 50 + (g.zone.cx / 200) * 46;
    const zz = 50 + (g.zone.cz / 200) * 46;
    const zr = (g.zone.radius / 200) * 46;
    const mates = g.bots
      .teammates(g.playerTeam)
      .map((b) => {
        const x = 50 + (b.position.x / 200) * 46;
        const z = 50 + (b.position.z / 200) * 46;
        return `<i class="mate" style="left:${x}%;top:${z}%"></i>`;
      })
      .join("");
    node.innerHTML = `<i class="zone" style="left:${zx - zr}%;top:${zz - zr}%;width:${zr * 2}%;height:${zr * 2}%"></i><i class="me" style="left:${px}%;top:${pz}%"></i>${mates}`;
  }
}

function el(tag: string, attrs: Record<string, string>, children: Array<string | HTMLElement> = []) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === "class") n.className = v;
    else n.setAttribute(k, v);
  }
  for (const c of children) n.append(c);
  return n;
}

function btn(act: string, label: string, arg?: string) {
  return `<button class="btn" data-act="${act}" ${arg ? `data-arg="${arg}"` : ""}>${label}</button>`;
}
