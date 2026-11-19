// AI-use disclosure: written by Claude Code. Art helpers: sprite keys and display sizes,
// tier palettes, and procedural fallbacks so the build never blocks on art.

import Phaser from "phaser";
import { ROSTER } from "../core/roster";
import type { LifeId, Tier } from "../core/types";

export const SPRITES: Record<string, string> = {
  kitten: "sprites/kitten.png",
  alley: "sprites/alley.png",
  sailor: "sprites/sailor.png",
  acrobat: "sprites/acrobat.png",
  witch: "sprites/witch.png",
  knight: "sprites/knight.png",
  thief: "sprites/thief.png",
  quiet: "sprites/quiet.png",
  patchwork: "sprites/patchwork.png",
  "immortal-base": "sprites/immortal-base.png",
  "immortal-ascended": "sprites/immortal-ascended.png",
};

export const BACKGROUNDS: Record<string, string> = {
  "bg-night": "bg/bg-throne-night.png",
  "bg-dawn": "bg/bg-throne-dawn.png",
  "key-art": "bg/key-art.png",
};

/** On-screen height in pixels for each character. The Immortal is about twice a challenger. */
export const DISPLAY_HEIGHT: Record<LifeId | "immortal" | "ascended", number> = {
  kitten: 66,
  alley: 100,
  sailor: 104,
  acrobat: 100,
  witch: 104,
  knight: 100,
  thief: 104,
  quiet: 92,
  patchwork: 112,
  immortal: 220,
  ascended: 236,
};

export interface TierLook {
  /** Color laid over the room with MULTIPLY-like low alpha. */
  wash: number;
  washAlpha: number;
  /** Warm light added on top. */
  warm: number;
  warmAlpha: number;
  /** How much of the dawn background shows through. */
  dawn: number;
}

/** Tier 1 cold teal and violet, tier 2 first warm accents, tier 3 dawn in the windows. */
export function tierLook(fightIndex: number): TierLook {
  if (fightIndex <= 3) return { wash: 0x10183a, washAlpha: 0.35, warm: 0xffa860, warmAlpha: 0, dawn: 0 };
  if (fightIndex <= 6) return { wash: 0x14183a, washAlpha: 0.28, warm: 0xffa860, warmAlpha: 0.05 + 0.02 * (fightIndex - 4), dawn: 0 };
  return { wash: 0x1a1a38, washAlpha: 0.18, warm: 0xffb860, warmAlpha: 0.1, dawn: 0.15 * (fightIndex - 6) };
}

export function tierOf(fightIndex: number): Tier {
  return fightIndex <= 3 ? 1 : fightIndex <= 6 ? 2 : 3;
}

/** Makes a simple procedural cat texture in the life's accessory color, for missing sprites. */
export function makeFallbackTexture(scene: Phaser.Scene, key: string): void {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  const isBoss = key.startsWith("immortal");
  const w = isBoss ? 120 : 80;
  const h = isBoss ? 240 : 100;
  const body = 0x15151c;
  g.fillStyle(body, 1);
  g.fillEllipse(w / 2, h * 0.62, w * 0.7, h * 0.62);
  g.fillCircle(w / 2, h * 0.3, w * 0.28);
  g.fillTriangle(w * 0.27, h * 0.2, w * 0.36, h * 0.02, w * 0.45, h * 0.18);
  g.fillTriangle(w * 0.55, h * 0.18, w * 0.64, h * 0.02, w * 0.73, h * 0.2);
  g.fillStyle(isBoss ? 0xc9b8ff : 0xf2efe6, 1);
  g.fillCircle(w * 0.42, h * 0.3, 3);
  g.fillCircle(w * 0.58, h * 0.3, 3);
  if (isBoss) {
    g.fillStyle(key.includes("ascended") ? 0x7cffc8 : 0x2b2560, 0.9);
    g.fillRect(w * 0.15, h * 0.42, w * 0.7, h * 0.5);
  } else {
    const life = ROSTER[key as LifeId];
    g.fillStyle(life ? life.color : 0x888888, 1);
    g.fillRect(w * 0.2, h * 0.48, w * 0.6, h * 0.12);
  }
  g.generateTexture(key, w, h);
  g.destroy();
}

/** A soft round glow texture used for magic, eyes, and light shafts. */
export function makeGlowTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("glow")) return;
  const size = 128;
  const tex = scene.textures.createCanvas("glow", size, size);
  if (!tex) return;
  const ctx = tex.getContext();
  const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  tex.refresh();
}

/** Small left-behind props for tier 2 and 3: cloth scraps in each past life color, flowers. */
export function drawProps(g: Phaser.GameObjects.Graphics, fightIndex: number, pastLives: LifeId[], floorY: number, seed: number): void {
  g.clear();
  if (fightIndex < 4) return;
  let s = seed >>> 0;
  const rnd = (): number => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
  // Cloth scraps from earlier lives, near the floor.
  for (const life of pastLives) {
    if (life === "kitten" || life === "quiet") continue;
    const x = 120 + rnd() * 520;
    g.fillStyle(ROSTER[life].color, 0.85);
    g.fillTriangle(x, floorY + 6, x + 14, floorY + 2, x + 9, floorY + 10);
  }
  // A flower in a crack in tier 2, more of them in the roots in tier 3.
  const flowers = fightIndex >= 7 ? 7 : 1;
  for (let i = 0; i < flowers; i++) {
    const x = fightIndex >= 7 ? 40 + rnd() * 200 : 300;
    const y = floorY + 4 - rnd() * 6;
    g.lineStyle(2, 0x3f7a4a, 1);
    g.lineBetween(x, y, x + 2, y - 14);
    g.fillStyle(i % 2 ? 0xf6d27a : 0xf3a3b8, 1);
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2;
      g.fillCircle(x + 2 + Math.cos(a) * 3.2, y - 15 + Math.sin(a) * 3.2, 2.4);
    }
    g.fillStyle(0xfff4c4, 1);
    g.fillCircle(x + 2, y - 15, 1.6);
  }
}

/** Black foreground framing on the left and right edges (art rule 7). */
export function drawFraming(g: Phaser.GameObjects.Graphics, w: number, h: number): void {
  g.clear();
  g.fillStyle(0x030306, 1);
  g.fillRect(0, 0, 14, h);
  g.fillRect(w - 14, 0, 14, h);
  for (let i = 0; i < 9; i++) {
    const y = i * 64 + 20;
    g.fillEllipse(10, y, 34, 70);
    g.fillEllipse(w - 10, y + 30, 36, 76);
  }
  g.fillTriangle(0, 0, 90, 0, 0, 120);
  g.fillTriangle(w, 0, w - 110, 0, w, 140);
  g.fillRect(0, h - 22, w, 22);
}
