// AI-use disclosure: Codex-authored castle-exterior menu and credits for the existing game.
import Phaser from "phaser";
import { getAudio } from "../audio";
import { Session } from "../session";
import { keyLabel, loadBindings } from "../controls";

export class TitleScene extends Phaser.Scene {
  private credits = false;
  private started = false;
  constructor() { super("title"); }
  create(): void {
    this.started = false;
    this.credits = false;
    this.cameras.main.fadeIn(600, 3, 7, 16);
    if (this.textures.exists("hf-castle-exterior")) {
      const castle = this.add.image(480, 270, "hf-castle-exterior").setDisplaySize(960, 540);
      this.tweens.add({ targets: castle, scaleX: castle.scaleX * 1.025, scaleY: castle.scaleY * 1.025, duration: 24000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    } else this.drawDistantCastle();
    this.add.rectangle(238, 270, 476, 540, 0x070e1b, 0.79);
    this.add.rectangle(238, 270, 476, 540, 0x101b2a, 0.13);
    this.add.text(68, 78, "THE CROWN REMEMBERS.", { fontFamily: "monospace", fontSize: "12px", color: "#b8c9c6", letterSpacing: 2 });
    this.add.text(64, 125, "THE\nNINTH LIFE", { fontFamily: "Georgia, serif", fontSize: "64px", color: "#e9e1c8", lineSpacing: -6 });
    this.add.rectangle(68, 287, 48, 2, 0xb6d3c4).setOrigin(0);
    this.add.text(68, 309, "A kingdom that forgot the sun.", { fontFamily: "Georgia, serif", fontSize: "18px", color: "#a6b8bc" });
    const button = (label: string, y: number, fn: () => void): void => {
      const text = this.add.text(68, y, label, { fontFamily: "monospace", fontSize: "18px", color: "#dbe7d1" }).setPadding(0, 10, 34, 10).setInteractive({ useHandCursor: true });
      text.on("pointerover", () => text.setColor("#f3d58d"));
      text.on("pointerout", () => text.setColor("#dbe7d1"));
      text.on("pointerdown", fn);
    };
    button("[ Enter ]  Play", 352, () => this.play());
    button("[ R ]      Controls", 398, () => this.openSettings());
    button("[ C ]      Attributions", 444, () => this.showCredits());
    const controls = loadBindings();
    const footer = keyLabel(controls.left) + " / " + keyLabel(controls.right) + " MOVE    " + keyLabel(controls.jump) + " JUMP    " + keyLabel(controls.dash) + " DASH";
    this.add.text(68, 513, footer, { fontFamily: "monospace", fontSize: "10px", color: "#a2b2b8" });
    const onKey = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      if (event.code === "Escape" && this.credits) { event.preventDefault(); this.scene.restart(); }
      else if (!this.credits && event.code === "KeyC") this.showCredits();
      else if (!this.credits && event.code === "KeyR") this.openSettings();
      else if (!this.credits && event.code === "Enter") { event.preventDefault(); this.play(); }
    };
    const keyboard = this.input.keyboard;
    keyboard?.on("keydown", onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off("keydown", onKey));
    if (new URLSearchParams(location.search).get("autoplay") === "1") this.time.delayedCall(600, () => this.play());
  }
  private drawDistantCastle(): void {
    const g = this.add.graphics();
    g.fillStyle(0x0b1528, 1).fillRect(0, 0, 960, 540);
    g.fillStyle(0x2a4356, 0.5).fillCircle(720, 130, 88);
    g.fillStyle(0xa0beb9, 1).fillCircle(720, 130, 58);
    g.fillStyle(0xbad1c7, 1).fillCircle(710, 124, 45);
    for (let i = 0; i < 65; i++) {
      const x = (i * 173 + 31) % 960, y = (i * 67 + 23) % 330;
      g.fillStyle(i % 5 ? 0x8ba5b1 : 0xcbdcc6, i % 3 ? 0.55 : 0.25).fillRect(x, y, i % 7 ? 1 : 2, 1);
    }
    g.fillStyle(0x172438, 1).fillTriangle(270, 420, 590, 240, 960, 420);
    g.fillStyle(0x111c2c, 1).fillTriangle(520, 485, 790, 290, 960, 485);
    g.fillStyle(0x070f1e, 1).fillRect(590, 265, 282, 187);
    const towers = [[596, 205, 35, 230], [650, 160, 43, 280], [747, 185, 40, 255], [822, 220, 37, 220]];
    for (const [x, y, w, h] of towers as [number, number, number, number][]) {
      g.fillStyle(0x0a1324, 1).fillRect(x, y, w, h);
      g.fillStyle(0x080e1b, 1).fillTriangle(x - 9, y, x + w / 2, y - 52, x + w + 9, y);
      for (let j = 0; j < 3; j++) g.fillStyle(0xb5a275, 0.75).fillRect(x + w / 2 - 2, y + 26 + j * 43, 4, 10);
    }
    g.fillStyle(0x070e1a, 1).fillTriangle(465, 540, 628, 400, 945, 540).fillRect(610, 400, 350, 140);
    g.fillStyle(0x040a14, 1).fillRect(0, 508, 960, 32);
    for (let i = 0; i < 3; i++) {
      const fog = this.add.ellipse(620 + i * 90, 445 + i * 21, 570, 34, 0x6a8f94, 0.07);
      this.tweens.add({ targets: fog, x: fog.x - 80, alpha: 0.02, duration: 13000 + i * 3000, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    }
  }
  private play(): void {
    if (this.started || this.credits) return;
    this.started = true;
    getAudio().start();
    const session = new Session(location.search);
    this.scene.start(new URLSearchParams(location.search).get("autoplay") === "1" ? "fight" : "opening", { session });
  }
  private openSettings(): void {
    if (!this.started && !this.credits) this.scene.start("settings");
  }
  private showCredits(): void {
    if (this.credits || this.started) return;
    this.credits = true;
    this.add.rectangle(480, 270, 860, 470, 0x0a1221, 0.98).setStrokeStyle(1, 0x677d85).setInteractive();
    this.add.text(100, 78, "ATTRIBUTIONS", { fontFamily: "monospace", fontSize: "25px", color: "#ead8af" });
    this.add.text(100, 137, ["The Ninth Life — a game by Nicoh", "", "Design inspiration: The Dark Queen of Mortholme, by Mosu.", "Mood references: Scaredy Cats, Ori, dark fantasy environments.", "Reference characters and compositions are not reproduced.", "", "Original concept images: Higgsfield (z_image).", "Pixel scenes, sprites and effects: Higgsfield; see ATTRIBUTION.md.", "Animation integration and procedural effects: Codex.", "Prototype code and audio: Claude Code; revisions: Codex.", "Engine: Phaser 3 (MIT). Full asset log: ATTRIBUTION.md."].join("\n"), { fontFamily: "monospace", fontSize: "13px", color: "#bdcbd0", lineSpacing: 5 });
    const back = this.add.text(100, 452, "[ Esc ]  Back", { fontFamily: "monospace", fontSize: "17px", color: "#f3d58d" }).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.restart());
  }
}
