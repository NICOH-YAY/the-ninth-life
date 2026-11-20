// AI-use disclosure: Claude authored procedural combat effects; Codex added licensed music, crossfades, dialogue ducking and optional voice recordings.

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  muted: boolean;
  private tier = 1;
  private cue: "years" | "combat" | "finale" = "years";
  private tracks: HTMLAudioElement[] = [];
  private track: HTMLAudioElement | null = null;
  private fadeTimer: ReturnType<typeof setInterval> | null = null;
  private ducked = false;
  private duckTimer: ReturnType<typeof setInterval> | null = null;
  private voice: HTMLAudioElement | null = null;

  /** Browser-relative paths work on GitHub Pages and local preview. */
  soundtrack(cue: "years" | "combat" | "finale"): void {
    const changed = this.cue !== cue;
    this.cue = cue;
    if (!this.ctx || (!changed && this.track)) return;
    const files = { years: "years-at-rest.mp3", combat: "combat-five-armies.mp3", finale: "finale-virtutes-vocis.mp3" };
    const next = new window.Audio("audio/" + files[cue]);
    next.loop = cue !== "finale"; next.volume = 0; next.preload = "auto";
    next.dataset.gain = cue === "combat" ? "0.60" : "0.48";
    this.tracks.push(next); this.track = next;
    void next.play().catch(() => { /* A later user gesture retries playback. */ });
    if (this.duckTimer) { clearInterval(this.duckTimer); this.duckTimer = null; }
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const started = performance.now();
    const levels = new Map(this.tracks.map(t => [t, t.volume]));
    this.fadeTimer = setInterval(() => {
      const p = Math.min(1, (performance.now() - started) / 2500);
      for (const t of this.tracks) {
        const target = t === next ? this.musicLevel(t) : 0;
        t.volume = this.muted ? 0 : Math.max(0, Math.min(1, (levels.get(t) ?? 0) * (1 - p) + target * p));
      }
      if (p === 1) {
        this.tracks.filter(t => t !== next).forEach(t => { t.pause(); t.removeAttribute("src"); t.load(); });
        this.tracks = [next]; clearInterval(this.fadeTimer!); this.fadeTimer = null;
      }
    }, 40);
  }

  private musicLevel(track: HTMLAudioElement): number {
    return this.muted ? 0 : Number(track.dataset.gain ?? 0.48) * (this.ducked ? 0.28 : 1);
  }

  dialogue(on: boolean): void {
    this.ducked = on;
    if (this.duckTimer) clearInterval(this.duckTimer);
    if (!this.fadeTimer && this.track) {
      const track = this.track, from = track.volume, start = performance.now(), duration = on ? 150 : 800;
      this.duckTimer = setInterval(() => {
        if (track !== this.track) { clearInterval(this.duckTimer!); this.duckTimer = null; return; }
        const p = Math.min(1, (performance.now() - start) / duration);
        track.volume = this.muted ? 0 : from + (this.musicLevel(track) - from) * p;
        if (p === 1) { clearInterval(this.duckTimer!); this.duckTimer = null; }
      }, 30);
    }
    if (!on && this.voice) { this.voice.pause(); this.voice = null; }
  }

  /** Optional supplied voice recordings; an absent cue never requests a missing file. */
  playVoice(path?: string): void {
    if (this.voice) this.voice.pause();
    this.voice = null;
    if (!path || !/^audio\/voices\/[a-z0-9/_-]+\.(mp3|ogg|wav)$/i.test(path)) return;
    this.voice = new window.Audio(path); this.voice.volume = this.muted ? 0 : 0.85;
    void this.voice.play().catch(() => {});
  }

  constructor(startMuted: boolean) {
    this.muted = startMuted;
  }

  /** Call from a key or click handler. Browsers block audio before a gesture. */
  start(): void {
    if (this.ctx) { void this.ctx.resume(); if (this.track?.paused) void this.track.play().catch(() => {}); return; }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    try {
      this.ctx = new AC();
    } catch {
      return;
    }
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.8;
    this.master.connect(this.ctx.destination);
    this.music = this.ctx.createGain();
    this.music.gain.value = 0.5;
    this.music.connect(this.master);
    this.soundtrack(this.cue);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    for (const track of this.tracks) track.volume = track === this.track ? this.musicLevel(track) : 0;
    if (this.voice) this.voice.volume = this.muted ? 0 : 0.85;
    return this.muted;
  }

  setTier(tier: number): void { this.tier = tier; }

  phase2(on: boolean): void { if (on) this.boom(0.6); }

  resolve(): void { this.soundtrack("finale"); }
  private tone(freq: number, dur: number, type: OscillatorType, level: number, dest?: AudioNode): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(level, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(dest ?? this.master!);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, level: number, cutoff: number): void {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const len = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.value = level;
    src.connect(f);
    f.connect(g);
    g.connect(this.master!);
    src.start();
  }

  /** One murmur syllable for dialogue text. Pitch varies a little per syllable. */
  murmur(pitch = 1): void {
    if (!this.ctx) return;
    this.tone((180 + Math.random() * 60) * pitch, 0.07, "square", 0.04);
  }

  tell(kind: "cleave" | "throw" | "reap" | "nova", phase: number): void {
    if (!this.ctx) return;
    if (kind === "nova") {
      if (phase === 2) this.bell();
      else this.tone(70, 1.0, "sine", 0.3);
      return;
    }
    this.tone(phase === 2 ? 520 : 300, 0.12, "triangle", 0.08);
  }

  bell(): void {
    this.tone(196, 2.2, "sine", 0.25);
    this.tone(392.5, 1.6, "sine", 0.1);
  }

  swing(): void {
    this.noise(0.18, 0.18, 1800);
  }

  hit(heavy = false): void {
    this.noise(heavy ? 0.3 : 0.12, heavy ? 0.4 : 0.25, heavy ? 600 : 1200);
  }

  evade(): void {
    this.tone(880, 0.08, "sine", 0.06);
  }

  boom(level = 0.4): void {
    this.noise(0.9, level, 300);
    this.tone(45, 1.2, "sine", level);
  }
}

let instance: Audio | null = null;

/** The one Audio for the page. ?mute=1 starts it muted. */
export function getAudio(): Audio {
  if (!instance) {
    const muted = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("mute") === "1";
    instance = new Audio(muted);
  }
  return instance;
}
