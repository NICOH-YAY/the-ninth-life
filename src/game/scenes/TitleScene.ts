// AI-use disclosure: written by Claude Code. Title screen over the key art.

import Phaser from "phaser";
import { TITLE } from "../../content/lines";
import { getAudio } from "../audio";
import { Session } from "../session";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super("title");
  }

  create(): void {
    const { width, height } = this.scale;
    const bg = this.add.image(width / 2, height / 2, "key-art");
    bg.setScale(Math.max(width / bg.width, height / bg.height));
    this.add.rectangle(width / 2, height / 2, width, height, 0x05060f, 0.35);
    this.add.rectangle(width / 2, height - 90, width, 180, 0x000000, 0.45);
    const title = this.add
      .text(width / 2, height - 128, TITLE.name, { fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "54px", color: "#efe6ff" })
      .setOrigin(0.5)
      .setAlpha(0);
    const prompt = this.add
      .text(width / 2, height - 74, TITLE.prompt, { fontFamily: "Georgia, serif", fontSize: "18px", color: "#c9bde8" })
      .setOrigin(0.5)
      .setAlpha(0);
    this.add
      .text(width / 2, height - 44, TITLE.controls, { fontFamily: "Georgia, serif", fontSize: "13px", color: "#8f86ad" })
      .setOrigin(0.5);
    this.tweens.add({ targets: title, alpha: 1, duration: 1800 });
    this.tweens.add({ targets: prompt, alpha: { from: 0.35, to: 1 }, duration: 1300, yoyo: true, repeat: -1, delay: 900 });

    let started = false;
    const go = (): void => {
      if (started) return;
      started = true;
      getAudio().start();
      const session = new Session(window.location.search);
      this.cameras.main.fadeOut(700, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("fight", { session }));
    };
    this.input.keyboard?.once("keydown", go);
    if (new URLSearchParams(window.location.search).get("autoplay") === "1") this.time.delayedCall(1200, go);
    this.input.once("pointerdown", go);
  }
}
