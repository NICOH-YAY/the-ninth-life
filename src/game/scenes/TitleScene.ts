// AI-use disclosure: Codex-authored pixel castle menu, navigation and credits for the existing game.
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
    this.drawDistantCastle();
    getAudio().soundtrack("years");
    this.add.text(68, 73, "THE CROWN REMEMBERS", { fontFamily: "monospace", fontSize: "11px", color: "#91aaa9", letterSpacing: 2 });
    this.add.text(64, 118, "THE\nNINTH LIFE", { fontFamily: "monospace", fontSize: "55px", fontStyle: "bold", color: "#e1e0c9", lineSpacing: -4 });
    this.add.rectangle(68, 270, 42, 3, 0xb5b88b).setOrigin(0);
    this.add.text(68, 298, "A kingdom that forgot the sun.", { fontFamily: "monospace", fontSize: "13px", color: "#8fa5aa" });
    const actions = [() => this.play(), () => this.openSettings(), () => this.showCredits()];
    const labels = ["PLAY", "SETTINGS", "ATTRIBUTIONS"];
    const buttons: Phaser.GameObjects.Text[] = [];
    const marker = this.add.rectangle(69, 367, 6, 6, 0xd0b77a);
    let focused = 0;
    const focus = (index: number): void => {
      focused = index;
      marker.setY(367 + index * 44);
      buttons.forEach((text, i) => text.setColor(i === focused ? "#f0dfae" : "#9eafb0"));
    };
    labels.forEach((label, index) => {
      const text = this.add.text(89, 347 + index * 44, label, { fontFamily: "monospace", fontSize: "17px", color: "#9eafb0", letterSpacing: 1 }).setPadding(0, 10, 45, 10).setInteractive({ useHandCursor: true });
      text.on("pointerover", () => { if (!this.credits) focus(index); });
      text.on("pointerdown", () => { if (!this.credits) { getAudio().start(); getAudio().soundtrack("years"); actions[index]?.(); } });
      buttons.push(text);
    });
    focus(0);
    this.add.text(68, 491, "↑ ↓  SELECT     ENTER  CONFIRM", { fontFamily: "monospace", fontSize: "10px", color: "#6e888e" });
    const controls = loadBindings();
    const footer = keyLabel(controls.left) + " / " + keyLabel(controls.right) + " MOVE    " + keyLabel(controls.jump) + " JUMP    " + keyLabel(controls.dash) + " DASH";
    this.add.text(68, 514, footer, { fontFamily: "monospace", fontSize: "10px", color: "#83989d" });
    const onKey = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      getAudio().start();
      getAudio().soundtrack("years");
      if (event.code === "Escape" && this.credits) { event.preventDefault(); this.scene.restart(); }
      else if (!this.credits && ["ArrowUp", "ArrowDown", "Tab"].includes(event.code)) {
        event.preventDefault();
        const direction = event.code === "ArrowUp" || (event.code === "Tab" && event.shiftKey) ? -1 : 1;
        focus((focused + direction + buttons.length) % buttons.length);
      }
      else if (!this.credits && event.code === "KeyC") this.showCredits();
      else if (!this.credits && event.code === "KeyR") this.openSettings();
      else if (!this.credits && event.code === "Enter") { event.preventDefault(); actions[focused]?.(); }
    };
    const keyboard = this.input.keyboard;
    keyboard?.on("keydown", onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off("keydown", onKey));
    if (new URLSearchParams(location.search).get("autoplay") === "1") this.time.delayedCall(600, () => this.play());
  }
  private drawDistantCastle(): void {
    // One 320 x 180 art grid enlarged exactly three times. No camera breathing or fractional art scales.
    const g = this.add.graphics();
    const rect = (x: number, y: number, width: number, height: number, colour: number): void => {
      g.fillStyle(colour, 1).fillRect(x * 3, y * 3, width * 3, height * 3);
    };
    rect(0, 0, 320, 180, 0x0b1420);
    rect(0, 70, 320, 38, 0x101e2b);
    rect(0, 108, 320, 72, 0x172a34);
    // The moon is drawn as horizontal pixel spans, never as a smooth high-resolution circle.
    for (let y = -15; y <= 15; y++) {
      const span = Math.floor(Math.sqrt(225 - y * y));
      rect(247 - span, 49 + y, span * 2 + 1, 1, 0x9caeac);
    }
    rect(240, 38, 4, 2, 0x899e9f); rect(253, 53, 5, 3, 0x8ba0a0);
    for (let i = 0; i < 35; i++) {
      const x = (i * 71 + 41) % 320, y = (i * 23 + 7) % 91;
      if (x > 150 && Math.abs(x - 247) + Math.abs(y - 49) > 30) rect(x, y, 1, 1, i % 4 ? 0x425b66 : 0x829a9d);
    }
    for (let x = 120; x < 320; x++) {
      const y = Math.round(112 + Math.sin(x * 0.035) * 8 + Math.sin(x * 0.079) * 4);
      rect(x, y, 1, 180 - y, 0x1b3039);
    }
    for (let x = 131; x < 320; x++) {
      const y = Math.round(140 - 34 * Math.exp(-Math.pow((x - 247) / 53, 2)) + Math.sin(x * 0.11) * 2);
      rect(x, y, 1, 180 - y, 0x101e29);
    }
    // Distant, deliberately small architecture. A single ember is the only warm focal point.
    rect(216, 92, 64, 21, 0x08131e);
    rect(230, 81, 30, 32, 0x08131e);
    const towers: [number, number, number][] = [[212, 81, 7], [228, 69, 9], [253, 74, 8], [274, 85, 7]];
    for (const [x, y, width] of towers) {
      rect(x, y, width, 114 - y, 0x08131e);
      for (let row = 0; row < 8; row++) {
        const inset = Math.min(Math.floor(width / 2), Math.floor(row / 2));
        rect(x + inset, y - row, width - inset * 2, 1, 0x08131e);
      }
      rect(x + 1, y - 1, 1, 2, 0x08131e);
    }
    rect(232, 58, 1, 5, 0x08131e); rect(233, 59, 5, 2, 0x08131e);
    rect(246, 95, 2, 4, 0xb4a277);
    rect(197, 121, 102, 2, 0x213740); rect(225, 124, 83, 1, 0x213740);
    for (let x = 110; x < 320; x++) {
      const y = Math.round(164 + Math.sin(x * 0.034) * 7 + Math.sin(x * 0.071) * 3);
      rect(x, y, 1, 180 - y, 0x070f19);
    }
    // The reading area belongs to the same flat palette; no translucent full-image wash.
    rect(0, 0, 145, 180, 0x0b1420);
    for (let x = 145; x < 171; x++) rect(x, 145 + Math.floor((x - 145) / 3), 1, 35, 0x0b1420);
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
    this.add.rectangle(480, 270, 860, 470, 0x0a1221, 1).setStrokeStyle(2, 0x526e76).setInteractive();
    this.add.text(100, 73, "ATTRIBUTIONS", { fontFamily: "monospace", fontSize: "25px", color: "#ead8af" });
    this.add.text(100, 122, [
      "The Ninth Life — a game by Nicoh", "",
      "Design inspiration: The Dark Queen of Mortholme, by Mosu.",
      "Mood references: Scaredy Cats, Ori, dark fantasy environments.",
      "Original concepts, character sprites and effects: Higgsfield.",
      "Pixel castle menu, integration and procedural effects: Codex.",
      "Prototype code/SFX: Claude Code; revisions: Codex.", "",
      "At Rest, Five Armies, Virtutes Vocis — Kevin MacLeod",
      "(incompetech.com), CC BY 4.0. Audio normalized/compressed.",
      "https://creativecommons.org/licenses/by/4.0/", "",
      "Engine: Phaser 3 (MIT). Full asset log: ATTRIBUTION.md.",
      "M toggles music and effects."
    ].join("\n"), { fontFamily: "monospace", fontSize: "12px", color: "#bdcbd0", lineSpacing: 5 });
    const back = this.add.text(100, 452, "[ Esc ]  Back", { fontFamily: "monospace", fontSize: "17px", color: "#f3d58d" }).setPadding(0, 5, 40, 5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.restart());
  }
}
