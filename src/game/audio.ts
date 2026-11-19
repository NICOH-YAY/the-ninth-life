// AI-use disclosure: written by Claude Code. Placeholder procedural audio with WebAudio:
// a low drone (tier 1), a melody layer (tier 2), a fuller pad (tier 3), a Phase Two pulse,
// a resolving chord for the ending, a syllable murmur for dialogue, and small effects.
// Real music and voices come later. Starts only after a key press. M mutes.

type Layer = { gain: GainNode; nodes: AudioScheduledSourceNode[] };

const A_MINOR_PENTA = [220, 261.63, 293.66, 329.63, 392, 440, 523.25];

export class Audio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private music: GainNode | null = null;
  private drone: Layer | null = null;
  private pad: Layer | null = null;
  private pulse: Layer | null = null;
  private melodyGain: GainNode | null = null;
  private melodyTimer: ReturnType<typeof setInterval> | null = null;
  private melodyStep = 0;
  muted: boolean;
  private tier = 1;

  constructor(startMuted: boolean) {
    this.muted = startMuted;
  }

  /** Call from a key or click handler. Browsers block audio before a gesture. */
  start(): void {
    if (this.ctx) return;
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
    this.drone = this.makeDrone();
    this.setTier(this.tier);
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.8, this.ctx.currentTime, 0.05);
    return this.muted;
  }

  private makeDrone(): Layer {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 320;
    gain.connect(filter);
    filter.connect(this.music!);
    const nodes: AudioScheduledSourceNode[] = [];
    for (const [f, type, g] of [
      [55, "sawtooth", 0.18],
      [55.4, "sawtooth", 0.14],
      [82.41, "sine", 0.25],
    ] as [number, OscillatorType, number][]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = g;
      o.connect(og);
      og.connect(gain);
      o.start();
      nodes.push(o);
    }
    gain.gain.setTargetAtTime(0.5, ctx.currentTime, 1.5);
    return { gain, nodes };
  }

  private makePad(freqs: number[], level: number, type: OscillatorType = "sine"): Layer {
    const ctx = this.ctx!;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(this.music!);
    const nodes: AudioScheduledSourceNode[] = [];
    for (const f of freqs) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.value = 1 / freqs.length;
      o.connect(og);
      og.connect(gain);
      o.start();
      nodes.push(o);
    }
    gain.gain.setTargetAtTime(level, ctx.currentTime, 2.5);
    return { gain, nodes };
  }

  private stopLayer(layer: Layer | null, fade = 1.5): void {
    if (!layer || !this.ctx) return;
    const t = this.ctx.currentTime;
    layer.gain.gain.setTargetAtTime(0, t, fade / 3);
    for (const n of layer.nodes) n.stop(t + fade * 2);
  }

  /** Tier 1 drone only, tier 2 adds the melody, tier 3 adds the pad. */
  setTier(tier: number): void {
    this.tier = tier;
    if (!this.ctx) return;
    if (tier >= 2 && !this.melodyTimer) {
      this.melodyGain = this.ctx.createGain();
      this.melodyGain.gain.value = 0.12;
      this.melodyGain.connect(this.music!);
      this.melodyTimer = setInterval(() => this.melodyNote(), 950);
    }
    if (tier >= 3 && !this.pad) this.pad = this.makePad([220, 261.63, 329.63, 440], 0.12, "triangle");
  }

  private melodyNote(): void {
    if (!this.ctx || !this.melodyGain) return;
    const pattern = [0, 2, 3, 2, 4, 3, 1, -1, 0, 2, 4, 5, 4, 3, 1, -1];
    const idx = pattern[this.melodyStep % pattern.length]!;
    this.melodyStep++;
    if (idx < 0) return;
    const f = A_MINOR_PENTA[idx]!;
    this.tone(f, 0.8, "triangle", 0.5, this.melodyGain);
  }

  phase2(on: boolean): void {
    if (!this.ctx) return;
    if (on && !this.pulse) {
      this.pulse = this.makePad([110, 164.81], 0.08, "square");
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 3;
      const lg = this.ctx.createGain();
      lg.gain.value = 0.06;
      lfo.connect(lg);
      lg.connect(this.pulse.gain.gain);
      lfo.start();
      this.pulse.nodes.push(lfo);
      this.boom(0.6);
    } else if (!on && this.pulse) {
      this.stopLayer(this.pulse, 0.5);
      this.pulse = null;
    }
  }

  /** The ending: the theme resolves to a major chord, then silence. */
  resolve(): void {
    if (!this.ctx) return;
    this.phase2(false);
    if (this.melodyTimer) clearInterval(this.melodyTimer);
    this.melodyTimer = null;
    this.stopLayer(this.drone, 3);
    this.drone = null;
    this.stopLayer(this.pad, 3);
    this.pad = null;
    const chord = this.makePad([220, 277.18, 329.63, 440, 554.37], 0.2, "sine");
    setTimeout(() => this.stopLayer(chord, 4), 7000);
  }

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
