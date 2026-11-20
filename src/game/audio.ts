// AI-use disclosure: Codex-authored scene/per-visitor music director and material-based Foley using credited Scott Buckley and Chequered Ink recordings.
import type { LifeId } from "../core/types";
import { LIFE_WEAPON, SOUND_FILES, TRACKS, type MusicCue, type SoundId, type WeaponSound } from "./soundtrack";

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private cue: MusicCue = "menu";
  private life: LifeId = "kitten";
  private tracks: HTMLAudioElement[] = [];
  private track: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private duckTimer: ReturnType<typeof setInterval> | null = null;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private ducked = false;
  private voice: HTMLAudioElement | null = null;
  private positions = new Map<MusicCue, number>();
  private buffers = new Map<SoundId, AudioBuffer>();
  private activeSounds = new Set<AudioBufferSourceNode>();
  private lastSound = new Map<string, number>();
  private step = 0;
  muted: boolean;

  constructor(startMuted: boolean) { this.muted = startMuted; }

  soundtrack(cue: "menu" | "years" | "combat" | "finale"): void {
    this.select(cue === "combat" ? this.life : cue);
  }
  combat(life: LifeId): void { this.life = life; this.select(life); }

  private select(cue: MusicCue, repeat = false): void {
    const changed = cue !== this.cue;
    this.cue = cue;
    if (!this.ctx || (!changed && this.track && !repeat)) return;
    if (this.track) {
      const previous = this.track.dataset.cue as MusicCue;
      if (previous && Number.isFinite(this.track.currentTime)) this.positions.set(previous, this.track.currentTime);
    }
    const config = TRACKS[cue];
    const next = new window.Audio("audio-v5/music/" + config.file + ".mp3");
    next.preload = "auto"; next.volume = 0; next.loop = false;
    next.dataset.cue = cue; next.dataset.gain = String(config.gain);
    const position = repeat ? 0 : this.positions.get(cue) ?? 0;
    if (position > 0) next.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(next.duration) && position < next.duration - 4) next.currentTime = position;
    }, { once: true });
    this.tracks.push(next); this.track = next;
    void next.play().catch(() => { /* A later trusted gesture retries browser-blocked playback. */ });
    if (this.duckTimer) { clearInterval(this.duckTimer); this.duckTimer = null; }
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const started = performance.now(), duration = repeat ? 1500 : 1700;
    const duck = this.ducked ? 0.24 : 1;
    const levels = new Map(this.tracks.map(t => [t, t.volume / duck]));
    this.fadeTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / duration);
      for (const t of this.tracks) {
        const envelope = t === next ? Math.sin(p * Math.PI / 2) * Number(t.dataset.gain) : Math.cos(p * Math.PI / 2) * (levels.get(t) ?? 0);
        t.volume = this.muted ? 0 : Math.min(1, Math.max(0, envelope * (this.ducked ? 0.24 : 1)));
      }
      if (p === 1) {
        this.tracks.filter(t => t !== next).forEach(t => { t.pause(); t.removeAttribute("src"); t.load(); });
        this.tracks = [next]; clearInterval(this.fadeTimer!); this.fadeTimer = null;
      }
    }, 35);
  }

  private musicLevel(track: HTMLAudioElement): number {
    return this.muted ? 0 : Number(track.dataset.gain ?? 0.4) * (this.ducked ? 0.24 : 1);
  }

  dialogue(on: boolean): void {
    this.ducked = on;
    if (this.duckTimer) { clearInterval(this.duckTimer); this.duckTimer = null; }
    if (!this.fadeTimer && this.track) {
      const track = this.track, from = track.volume, started = performance.now(), duration = on ? 140 : 750;
      this.duckTimer = setInterval(() => {
        if (track !== this.track) { clearInterval(this.duckTimer!); this.duckTimer = null; return; }
        const p = Math.min(1, (performance.now() - started) / duration);
        track.volume = this.muted ? 0 : from + (this.musicLevel(track) - from) * p;
        if (p === 1) { clearInterval(this.duckTimer!); this.duckTimer = null; }
      }, 30);
    }
    if (!on && this.voice) { this.voice.pause(); this.voice = null; }
  }

  playVoice(path?: string): void {
    this.voice?.pause(); this.voice = null;
    if (!path || !/^audio\/voices\/[a-z0-9/_-]+\.(mp3|ogg|wav)$/i.test(path)) return;
    this.voice = new window.Audio(path); this.voice.volume = this.muted ? 0 : 0.85;
    void this.voice.play().catch(() => {});
  }

  /** Only invoked from the game's trusted click/key path. Music fetches remain lazy. */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      if (this.track?.paused) void this.track.play().catch(() => {});
      return;
    }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try { this.ctx = new AC(); } catch { return; }
    this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : 0.85;
    this.master.connect(this.ctx.destination);
    for (const id of SOUND_FILES) {
      void fetch("audio-v5/sfx/" + id + ".mp3").then(response => {
        if (!response.ok) throw new Error("Unavailable Foley sample " + id);
        return response.arrayBuffer();
      }).then(buffer => this.ctx!.decodeAudioData(buffer)).then(decoded => this.buffers.set(id, decoded)).catch(() => {
        // The synthesized fallback preserves a usable telegraph if a sample cannot load.
      });
    }
    this.select(this.cue, true);
    this.loopTimer = setInterval(() => {
      const t = this.track;
      if (!t || this.fadeTimer || !TRACKS[this.cue].loop || !Number.isFinite(t.duration)) return;
      if (t.currentTime >= t.duration - 1.65) this.select(this.cue, true);
    }, 100);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.85, this.ctx.currentTime, 0.025);
    for (const t of this.tracks) t.volume = t === this.track ? this.musicLevel(t) : 0;
    if (this.voice) this.voice.volume = this.muted ? 0 : 0.85;
    return this.muted;
  }

  private sample(id: SoundId, gain = 0.6, rate = 1, intervalMs = 45): boolean {
    if (!this.ctx || !this.master) return false;
    const now = performance.now();
    if (now - (this.lastSound.get(id) ?? -1000) < intervalMs) return true;
    this.lastSound.set(id, now);
    const buffer = this.buffers.get(id);
    if (!buffer) return false;
    if (this.activeSounds.size >= 18) return true;
    const source = this.ctx.createBufferSource(), level = this.ctx.createGain();
    source.buffer = buffer; source.playbackRate.value = rate; level.gain.value = gain;
    source.connect(level); level.connect(this.master);
    this.activeSounds.add(source);
    source.onended = () => { this.activeSounds.delete(source); source.disconnect(); level.disconnect(); };
    source.start(); return true;
  }

  setTier(_tier: number): void { /* Kept for older scene callers; per-life cues now own music. */ }
  phase2(on: boolean): void { if (on) { this.sample("dash-magic",0.75,0.65); this.boom(0.6); } }
  resolve(): void { this.soundtrack("finale"); }

  swing(weapon: WeaponSound = "sword"): void {
    const id: SoundId = weapon === "wood" ? "wood" : weapon === "chain" ? "chain" : weapon === "ice" || weapon === "magic" ? "ice" : "sword-swing";
    if (!this.sample(id, weapon === "magic" ? 0.40 : 0.6, weapon === "chain" ? 0.9 : 1)) this.noise(0.11,0.14,2100);
    if (weapon === "ice" || weapon === "magic") this.sample("dash",0.17,1.15);
  }
  weaponHit(material: "flesh" | "metal" | "wood" | "ice" = "flesh", heavy = false): void {
    const id: SoundId = material === "metal" ? "metal-hit" : material === "wood" ? "wood" : material === "ice" ? "ice" : "flesh";
    if (!this.sample(id, heavy ? 0.85 : 0.58, heavy ? 0.84 : 1)) this.noise(heavy ? 0.19 : 0.08,0.2,material === "metal" ? 3000 : 1000);
    if (heavy && material === "flesh") this.sample("stab",0.35,0.8);
  }
  hit(heavy = false): void { this.weaponHit("flesh",heavy); }
  guard(): void { if (!this.sample("metal-guard",0.7,1)) this.tone(630,0.15,"triangle",0.13); }
  dash(who: LifeId | "king" = "king"): void {
    const weapon = who === "king" ? "magic" : LIFE_WEAPON[who];
    this.sample(who === "king" ? "dash-magic" : "dash",who === "king" ? 0.58 : 0.45,1);
    if (weapon === "chain") this.sample("chain",0.27,1.1);
    if (weapon === "ice") this.sample("ice",0.28,1.12);
  }
  evade(): void { this.dash("king"); }
  stab(): void { this.sample("stab",0.95,0.9); this.sample("metal-hit",0.2,1.15); }
  footstep(): void { this.sample(++this.step % 2 ? "footstep-1" : "footstep-2",0.23,1,120); }
  bell(): void { this.sample("ice",0.45,0.63); this.tone(196,1.3,"sine",0.12); this.tone(392.5,1.1,"sine",0.05); }
  boom(level = 0.4): void {
    if (!this.sample("nova",Math.min(1,level * 1.4),0.82)) this.noise(0.7,level,350);
    this.tone(42,0.8,"sine",level * 0.7);
  }
  tell(kind: "cleave" | "throw" | "reap" | "nova", phase: number): void {
    if (kind === "nova") { this.bell(); this.tone(65,0.45,"sine",0.12); }
    else if (kind === "reap") { this.sample("chain",0.25,0.65); this.tone(95,0.23,"sine",0.08); }
    else this.sample(phase === 2 ? "ice" : "sword-draw",0.27,phase === 2 ? 0.8 : 1.1);
  }
  murmur(pitch = 1): void { this.tone((175 + Math.random() * 45) * pitch,0.045,"triangle",0.018); }

  private tone(frequency: number, duration: number, type: OscillatorType, gain: number): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime, oscillator = this.ctx.createOscillator(), level = this.ctx.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    level.gain.setValueAtTime(0,t); level.gain.linearRampToValueAtTime(gain,t + 0.012);
    level.gain.exponentialRampToValueAtTime(0.001,t + duration);
    oscillator.connect(level); level.connect(this.master); oscillator.start(t); oscillator.stop(t + duration + 0.02);
  }
  private noise(duration: number, gain: number, cutoff: number): void {
    if (!this.ctx || !this.master) return;
    const length = Math.floor(this.ctx.sampleRate * duration), buffer = this.ctx.createBuffer(1,length,this.ctx.sampleRate);
    const samples = buffer.getChannelData(0);
    for (let i=0;i<length;i++) samples[i]=(Math.random()*2-1)*(1-i/length);
    const source=this.ctx.createBufferSource(), filter=this.ctx.createBiquadFilter(), level=this.ctx.createGain();
    source.buffer=buffer; filter.type="lowpass"; filter.frequency.value=cutoff; level.gain.value=gain;
    source.connect(filter); filter.connect(level); level.connect(this.master); source.start();
  }
}

let instance: Audio | null = null;
export function getAudio(): Audio {
  if (!instance) instance = new Audio(typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mute") === "1");
  return instance;
}
