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
    const walk = motion === "idle" || motion === "run";
    const royalKey = walk ? "royal-visitor-walk" : "royal-visitor-combat";
    if (scene.textures.exists(royalKey)) {
      const pose = walk && motion === "idle" ? 0 : frame;
      const base = scene.textures.exists("royal-visitor-walk") ? "royal-visitor-walk" : royalKey;
      image.setTexture(royalKey, row * 6 + pose).setOrigin(0.5, 110 / 144)
        .setPosition(Math.round(x), Math.round(feetY)).setFlipX(facing < 0)
        .setScale(targetHeight / bodyHeight(scene, base, row * 6, 110)).setRotation(0);
      return;
    }
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
    const royal = row !== 4 && this.scene.textures.exists("royal-vfx");
    if (royal) row = [0, 1, 2, 4, 4, 3][row] ?? 0;
    const key = royal ? "royal-vfx" : this.scene.textures.exists("combat-vfx") ? "combat-vfx" : "glow";
    const img = this.scene.add.image(x, y, key, key !== "glow" ? row * 6 : undefined).setDepth(15)
      .setDisplaySize(width, width).setFlipX(direction < 0);
    if (tint) img.setTint(tint);
    this.active.push({ image: img, row, start: this.scene.time.now, duration, vx: row === 0 ? direction * 170 : 0, vy: 0, alpha: 1 });
    return img;
  }
  weapon(life: LifeId, x: number, y: number, width = 150, direction = 1): void {
    if (!this.scene.textures.exists("royal-visitor-vfx")) { this.spawn(4, x, y, width, 320, direction); return; }
    const row = life === "kitten" ? 4 : Math.max(0, LIFE_ORDER.indexOf(life) - 1);
    const key = life === "kitten" ? "combat-vfx" : "royal-visitor-vfx";
    const image = this.scene.add.image(x, y, key, row * 6).setDepth(15)
      .setDisplaySize(width, width).setFlipX(direction < 0);
    if (life === "kitten") image.setTint(0xe1c594).setDisplaySize(70, 70);
    this.active.push({image, row, start: this.scene.time.now, duration: 340, vx: direction * 90, vy: 0, alpha: 1});
  }
  burst(x: number, y: number, blood = false): void {
    if (blood && this.scene.textures.exists("royal-blood")) {
      const image = this.scene.add.image(x, y, "royal-blood", 0).setDepth(16).setDisplaySize(130, 130).setFlipX(x > 480);
      this.active.push({image, row:0, start:this.scene.time.now, duration:440, vx:x > 480 ? 45 : -45, vy:38, alpha:1});
      const impact = this.scene.add.image(x, y, "royal-blood", 6).setDepth(17).setDisplaySize(90, 90);
      this.active.push({image:impact, row:1, start:this.scene.time.now, duration:220, vx:0, vy:0, alpha:1});
      return;
    }
    this.spawn(blood ? 4 : 5, x, y, blood ? 110 : 95, 260);
  }  update(delta: number): void {
    const now = this.scene.time.now;
    this.active = this.active.filter(e => {
      const p = (now - e.start) / e.duration;
      if (p >= 1 || !e.image.active) { e.image.destroy(); return false; }
      if (["combat-vfx", "royal-vfx", "royal-visitor-vfx", "royal-blood"].includes(e.image.texture.key)) e.image.setFrame(e.row * 6 + Math.min(5, Math.floor(p * 6)));
      e.image.x += e.vx * delta; e.image.y += e.vy * delta;
      e.image.setAlpha(e.alpha * (p > 0.8 ? (1 - p) * 5 : 1));
      return true;
    });
  }
  clear(): void { this.active.forEach(e => e.image.destroy()); this.active = []; }
}
