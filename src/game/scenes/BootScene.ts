// AI-use disclosure: written by Claude Code. Loads sprites and backgrounds, and makes
// procedural stand-ins for anything that fails to load.

import Phaser from "phaser";
import { BACKGROUNDS, SPRITES, makeFallbackTexture, makeGlowTexture } from "../art";
import { createPixelArt, installBossSheet, installChallengers, installPixelSheet } from "../pixel";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    const { width, height } = this.scale;
    const bar = this.add.rectangle(width / 2 - 150, height / 2, 0, 4, 0x9a8cff).setOrigin(0, 0.5);
    this.load.on("progress", (p: number) => bar.setSize(300 * p, 4));
    this.load.on("loaderror", (file: Phaser.Loader.File) => console.warn("asset missing, using a stand-in:", file.key));
    this.load.image("gothic-menu", "gothic-v5/menu-castle.png");
    this.load.spritesheet("gothic-base", "gothic-v5/boss-base.png", { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet("gothic-monster", "gothic-v5/boss-monster.png", { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet("gothic-coronation", "gothic-v5/coronation.png", { frameWidth: 192, frameHeight: 192 });
    this.load.spritesheet("gothic-vfx", "gothic-v5/effects.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("gothic-visitors", "gothic-v5/visitors.png", { frameWidth: 144, frameHeight: 144 });
    this.load.image("higgsfield-arena", "gothic-v5/arena-night.png");
    this.load.image("combat-aged-mid", "gothic-v5/arena-mid.png");
    this.load.image("combat-aged-late", "gothic-v5/arena-late.png");
    this.load.spritesheet("royal-visitor-combat", "royal-v4/visitor-combat.png", { frameWidth: 144, frameHeight: 144 });
    this.load.spritesheet("royal-visitor-walk", "royal-v4/visitor-walk.png", { frameWidth: 144, frameHeight: 144 });
    this.load.image("previous-king-portrait", "combat-v3/previous-king-portrait.png");
    this.load.spritesheet("combat-player", "combat-v3/immortal-base-motion.png", { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet("combat-ascended", "combat-v3/immortal-ascended-motion.png", { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet("combat-enemy", "combat-v3/challenger-abilities.png", { frameWidth: 144, frameHeight: 144 });
    this.load.spritesheet("royal-visitor-vfx", "royal-v4/visitor-vfx.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("royal-blood", "royal-v4/blood-hit.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("royal-vfx", "royal-v4/royal-vfx.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("combat-vfx", "combat-v3/combat-vfx.png", { frameWidth: 128, frameHeight: 128 });
    this.load.spritesheet("combat-rest", "combat-v3/immortal-rest.png", { frameWidth: 96, frameHeight: 96 });
    this.load.spritesheet("combat-previous", "combat-v3/previous-king.png", { frameWidth: 96, frameHeight: 96 });
    this.load.image("royal-dawn-ruins", "gothic-v5/dawn-ruins.png");
    this.load.image("higgsfield-dawn", "gothic-v5/dawn-ruins.png");
    this.load.image("hf-base", "pixel/immortal-base-sheet.png");
    this.load.image("hf-ascended", "pixel/immortal-ascended-sheet.png");
    this.load.image("hf-challengers", "pixel/challenger-actions.png");
    this.load.image("hf-walk", "pixel/challenger-walk.png");
    this.load.image("hf-transformation", "pixel/immortal-transformation.png");
    this.load.spritesheet("prologue", "pixel/prologue-atlas.png", { frameWidth: 384, frameHeight: 216 });
  }

  create(): void {
    createPixelArt(this);
    installBossSheet(this, "hf-base", "immortal-base");
    installBossSheet(this, "hf-ascended", "immortal-ascended");
    installChallengers(this);
    installPixelSheet(this, "hf-transformation", "immortal-transform", { idle: 0, run: 1 }, 6, 2);
    for (const [key, source] of [["bg-night", "higgsfield-arena"], ["bg-dawn", "higgsfield-dawn"], ["key-art", "higgsfield-arena"]]) {
      if (source && key && this.textures.exists(source)) {
        this.textures.remove(key);
        this.textures.addImage(key, this.textures.get(source).getSourceImage() as HTMLImageElement);
      }
    }
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
    ctx.imageSmoothingEnabled = false;
    const dw = src.width * scale;
    const dh = src.height * scale;
    ctx.drawImage(src, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    this.textures.remove(key);
    this.textures.addCanvas(key, canvas);
  }
}
