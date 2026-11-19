// AI-use disclosure: Codex-authored sprite staging, reflections and animated effects.
import Phaser from "phaser";
import type { LifeId } from "../core/types";

export const FLOOR = 464;
export const LIFE_ORDER: LifeId[] = ["kitten", "alley", "sailor", "acrobat", "witch", "knight", "thief", "quiet", "patchwork"];
export type Motion = "idle" | "run" | "jump" | "dash" | "cleave" | "throw" | "reap" | "nova";
const ROW: Record<Motion, number> = { idle: 0, run: 1, jump: 2, dash: 3, cleave: 4, throw: 5, reap: 6, nova: 7 };
const bodyCache = new WeakMap<Phaser.Scene, Map<string, number>>();

function bodyHeight(scene: Phaser.Scene, key: string, frame: number, foot: number): number {
  let cache = bodyCache.get(scene);
  if (!cache) { cache = new Map(); bodyCache.set(scene, cache); }
  const id = key + ":" + frame;
  if (cache.has(id)) return cache.get(id)!;
  const texture = scene.textures.get(key);
  const fr = texture.get(frame);
  const canvas = document.createElement("canvas");
  canvas.width = fr.cutWidth; canvas.height = fr.cutHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(texture.getSourceImage() as CanvasImageSource, fr.cutX, fr.cutY, fr.cutWidth, fr.cutHeight, 0, 0, canvas.width, canvas.height);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let top = Math.min(foot - 20, canvas.height - 20);
  outer: for (let y = 0; y < foot; y++) {
    for (let x = Math.floor(canvas.width * 0.32); x < canvas.width * 0.68; x++) {
      if (data[(y * canvas.width + x) * 4 + 3]! > 100) { top = y; break outer; }
    }
  }
  const height = Math.max(24, foot - top);
  cache.set(id, height);
  return height;
}

export function poseActor(scene: Phaser.Scene, image: Phaser.GameObjects.Image, who: "player" | "ascended" | "previous" | "rest" | LifeId,
  motion: Motion, frame: number, x: number, feetY: number, facing: number, targetHeight = 142): void {
  frame = Math.max(0, Math.min(5, frame | 0));
  const boss = who === "player" || who === "ascended" || who === "previous" || who === "rest";
  if (boss) {
    const key = who === "rest" ? "combat-rest" : who === "previous" ? "combat-previous" : who === "ascended" ? "combat-ascended" : "combat-player";
    if (scene.textures.exists(key)) {
      const row = who === "previous" ? motion === "idle" || motion === "run" ? 0 : motion === "cleave" ? 1 : motion === "dash" ? 3 : 2 : who === "rest" ? motion === "idle" ? 0 : 1 : ROW[motion];
      image.setTexture(key, row * 6 + frame).setOrigin(0.5, 94 / 96).setPosition(Math.round(x), Math.round(feetY)).setFlipX(facing > 0);
      image.setScale(targetHeight / bodyHeight(scene, who === "rest" ? "combat-player" : key, 0, 94)).setRotation(0);
      return;
    }
    image.setTexture(who === "ascended" ? "immortal-ascended" : "immortal-base");
  } else {
    const row = LIFE_ORDER.indexOf(who);
    if (motion !== "idle" && motion !== "run" && scene.textures.exists("combat-enemy")) {
      image.setTexture("combat-enemy", row * 6 + frame).setOrigin(0.5, 110 / 144).setPosition(Math.round(x), Math.round(feetY)).setFlipX(facing < 0);
      image.setScale(targetHeight / bodyHeight(scene, "combat-enemy", row * 6, 110)).setRotation(0);
      return;
    }
    const key = who + ":" + (motion === "run" ? "run" : "idle") + ":" + frame;
    image.setTexture(scene.textures.exists(key) ? key : who);
  }
  image.setOrigin(0.5, 71 / 72).setPosition(Math.round(x), Math.round(feetY)).setFlipX(boss ? facing > 0 : facing < 0);
  // Cached legacy idle references keep walking and generated ability body scales consistent.
  const baseKey = boss ? who === "ascended" ? "immortal-ascended" : "immortal-base" : who;
  image.setScale(targetHeight / bodyHeight(scene, baseKey, 0, 71)).setRotation(0);
}

export function reflectActor(image: Phaser.GameObjects.Image, reflection: Phaser.GameObjects.Image): void {
  reflection.setTexture(image.texture.key, image.frame.name).setPosition(image.x, FLOOR * 2 - image.y)
    .setOrigin(image.originX, 1 - image.originY).setScale(image.scaleX, image.scaleY)
    .setFlipX(image.flipX).setFlipY(true).setTint(0x77949c).setAlpha(image.visible ? image.alpha * 0.14 : 0).setRotation(-image.rotation);
}

interface AnimatedEffect { image: Phaser.GameObjects.Image; row: number; start: number; duration: number; vx: number; vy: number; alpha: number; }
export class SpriteEffects {
  private active: AnimatedEffect[] = [];
  constructor(private readonly scene: Phaser.Scene) {}
  spawn(row: number, x: number, y: number, width = 160, duration = 320, direction = 1, tint?: number): Phaser.GameObjects.Image {
    const key = this.scene.textures.exists("combat-vfx") ? "combat-vfx" : "glow";
    const img = this.scene.add.image(x, y, key, key === "combat-vfx" ? row * 6 : undefined).setDepth(15)
      .setDisplaySize(width, width).setFlipX(direction < 0);
    if (tint) img.setTint(tint);
    this.active.push({ image: img, row, start: this.scene.time.now, duration, vx: row === 0 ? direction * 170 : 0, vy: 0, alpha: 1 });
    return img;
  }
  burst(x: number, y: number, blood = false): void {
    this.spawn(blood ? 4 : 5, x, y, blood ? 110 : 95, 260);
    for (let i = 0; i < 5; i++) {
      const img = this.spawn(blood ? 4 : 5, x, y, 30 + i * 5, 250 + i * 25, i % 2 ? -1 : 1, blood ? 0xef5576 : 0xc4f9df);
      const effect = this.active[this.active.length - 1]!;
      effect.vx = Math.cos(i * 1.7) * 160; effect.vy = Math.sin(i * 1.7) * 130;
      img.setAlpha(0.8); effect.alpha = 0.8;
    }
  }
  update(delta: number): void {
    const now = this.scene.time.now;
    this.active = this.active.filter(e => {
      const p = (now - e.start) / e.duration;
      if (p >= 1 || !e.image.active) { e.image.destroy(); return false; }
      if (e.image.texture.key === "combat-vfx") e.image.setFrame(e.row * 6 + Math.min(5, Math.floor(p * 6)));
      e.image.x += e.vx * delta; e.image.y += e.vy * delta;
      e.image.setAlpha(e.alpha * (p > 0.8 ? (1 - p) * 5 : 1));
      return true;
    });
  }
  clear(): void { this.active.forEach(e => e.image.destroy()); this.active = []; }
}
