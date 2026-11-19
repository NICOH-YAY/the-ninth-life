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
    this.scene.start("title");
  }
}
