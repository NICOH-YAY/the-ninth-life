// AI-use disclosure: written by Claude Code. Loads sprites and backgrounds, and makes
// procedural stand-ins for anything that fails to load.

import Phaser from "phaser";
import { BACKGROUNDS, SPRITES, makeFallbackTexture, makeGlowTexture } from "../art";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 4, 0x9a8cff).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => bar.setSize(300 * p, 4));
    this.load.on("loaderror", (file: Phaser.Loader.File) => console.warn("asset missing, using a stand-in:", file.key));
    for (const [k, v] of Object.entries(SPRITES)) this.load.image(k, v);
    for (const [k, v] of Object.entries(BACKGROUNDS)) this.load.image(k, v);
  }

  create(): void {
    for (const k of Object.keys(SPRITES)) makeFallbackTexture(this, k);
    for (const k of Object.keys(BACKGROUNDS)) {
      if (!this.textures.exists(k)) {
        const g = this.add.graphics();
        g.fillGradientStyle(0x0b1030, 0x0b1030, 0x1d1440, 0x1d1440, 1);
        if (k === "bg-dawn") g.fillGradientStyle(0xf2b56b, 0xf2b56b, 0x6a4a5a, 0x6a4a5a, 1);
        g.fillRect(0, 0, 960, 540);
        g.generateTexture(k, 960, 540);
        g.destroy();
      }
    }
    makeGlowTexture(this);
    // Pre-scale big images once so the Canvas renderer does not resample them every frame.
    for (const k of Object.keys(BACKGROUNDS)) this.downscale(k, 960, 540, true);
    for (const k of Object.keys(SPRITES)) this.downscale(k, 0, k.startsWith("immortal") ? 300 : 170, false);
    this.scene.start("title");
  }

  private downscale(key: string, w: number, h: number, cover: boolean): void {
    const tex = this.textures.get(key);
    const src = tex.getSourceImage() as HTMLImageElement | HTMLCanvasElement;
    if (!src || !("width" in src) || src.height <= h) return;
    const scale = cover ? Math.max(w / src.width, h / src.height) : h / src.height;
    const cw = cover ? w : Math.round(src.width * scale);
    const ch = cover ? h : h;
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    const dw = src.width * scale;
    const dh = src.height * scale;
    ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }
}
