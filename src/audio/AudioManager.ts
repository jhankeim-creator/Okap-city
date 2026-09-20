import { VOICE_LINES } from "../data/world";
import type { SettingsState } from "../progression/SaveManager";

type LoopName = "menu" | "battle" | "final" | "ambient";

export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private voiceGain: GainNode | null = null;
  private loops = new Map<LoopName, { src: AudioBufferSourceNode; gain: GainNode }>();
  private buffers = new Map<string, AudioBuffer>();
  private currentLoop: LoopName | null = null;
  muted = false;

  constructor(private settings: () => SettingsState) {}

  async init() {
    if (this.ctx) return;
    const ctx = new AudioContext();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.musicGain = ctx.createGain();
    this.sfxGain = ctx.createGain();
    this.voiceGain = ctx.createGain();
    this.musicGain.connect(this.master);
    this.sfxGain.connect(this.master);
    this.voiceGain.connect(this.master);
    this.master.connect(ctx.destination);
    this.applyVolumes();
    const files: [string, string][] = [
      ["menu", "./audio/menu.wav"],
      ["battle", "./audio/battle.wav"],
      ["final", "./audio/final.wav"],
      ["victory", "./audio/victory.wav"],
      ["defeat", "./audio/defeat.wav"],
      ["shoot", "./audio/shoot.wav"],
      ["reload", "./audio/reload.wav"],
      ["hit", "./audio/hit.wav"],
      ["explode", "./audio/explode.wav"],
      ["pickup", "./audio/pickup.wav"],
      ["engine", "./audio/engine.wav"],
      ["ambient", "./audio/ambient.wav"],
    ];
    await Promise.all(
      files.map(async ([id, url]) => {
        try {
          const res = await fetch(url);
          const arr = await res.arrayBuffer();
          this.buffers.set(id, await ctx.decodeAudioData(arr));
        } catch {
          this.buffers.set(id, this.synthFallback(id));
        }
      }),
    );
  }

  applyVolumes() {
    const s = this.settings();
    if (!this.musicGain || !this.sfxGain || !this.voiceGain || !this.master) return;
    this.musicGain.gain.value = s.music;
    this.sfxGain.gain.value = s.sound;
    this.voiceGain.gain.value = s.voice;
    this.master.gain.value = this.muted ? 0 : 1;
  }

  async resume() {
    if (!this.ctx) await this.init();
    if (this.ctx?.state === "suspended") await this.ctx.resume();
  }

  playLoop(name: LoopName) {
    if (!this.ctx || !this.musicGain) return;
    if (this.currentLoop === name) return;
    this.stopLoop();
    const buf = this.buffers.get(name) ?? this.buffers.get("menu");
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const g = this.ctx.createGain();
    g.gain.value = name === "ambient" ? 0.35 : 0.7;
    src.connect(g);
    g.connect(name === "ambient" ? this.sfxGain! : this.musicGain);
    src.start();
    this.loops.set(name, { src, gain: g });
    this.currentLoop = name;
  }

  stopLoop() {
    for (const l of this.loops.values()) {
      try {
        l.src.stop();
      } catch {
        /* ignore */
      }
    }
    this.loops.clear();
    this.currentLoop = null;
  }

  sfx(id: string, rate = 1) {
    if (!this.ctx || !this.sfxGain) return;
    const buf = this.buffers.get(id);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = rate;
    src.connect(this.sfxGain);
    src.start();
  }

  voice(key: string) {
    const line = VOICE_LINES[key] ?? key;
    this.speak(line);
    return line;
  }

  speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-HT";
      u.rate = 1.02;
      u.pitch = 1;
      u.volume = this.settings().voice;
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  }

  private synthFallback(id: string): AudioBuffer {
    const ctx = this.ctx!;
    const len = id === "menu" || id === "battle" || id === "final" || id === "ambient" ? ctx.sampleRate * 4 : ctx.sampleRate * 0.25;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) {
      const t = i / ctx.sampleRate;
      if (id === "shoot") d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 28);
      else if (id === "hit") d[i] = Math.sin(t * 220) * Math.exp(-t * 18);
      else if (id === "pickup") d[i] = Math.sin(t * 880) * Math.exp(-t * 8);
      else if (id === "explode") d[i] = (Math.random() * 2 - 1) * Math.exp(-t * 6);
      else d[i] = Math.sin(t * (id === "menu" ? 220 : 140)) * 0.08 * Math.sin(t * 2);
    }
    return buf;
  }
}
