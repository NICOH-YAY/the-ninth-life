// AI-use disclosure: Codex-authored pixel castle menu, navigation and credits for the existing game.
import Phaser from "phaser";
import { getAudio } from "../audio";
import { TRACKS } from "../soundtrack";
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
    getAudio().soundtrack("menu");
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
      text.on("pointerdown", () => { if (!this.credits) { getAudio().start(); getAudio().soundtrack("menu"); actions[index]?.(); } });
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
      getAudio().soundtrack("menu");
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
    // Human-drawn CC0 Ansimuz layers, assembled at native480x270 and displayed exactly2x.
    this.add.image(480, 270, "gothic-menu").setDisplaySize(960, 540);
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
    this.add.text(94, 121, [
      "A game by Nicoh", "",
      "Inspired by The Dark Queen",
      "of Mortholme, by Mosu.", "",
      "Castle pixels: Luis Zuno / Ansimuz.",
      "CC0 hand-drawn tile artwork.",
      "Scene assembly: Codex.", "",
      "Cat animation and VFX: Higgsfield.",
      "Code: Claude Code and Codex.", "",
      "Foley: Chequered Ink.",
      "Edited game samples, credited", "in the full ATTRIBUTION.md log.", "",
      "Phaser 3 — MIT."
    ].join("\n"), { fontFamily: "monospace", fontSize: "12px", color: "#b6c9d1", lineSpacing: 4 });
    this.add.text(472, 121, [
      "MUSIC BY SCOTT BUCKLEY",
      "Released under CC BY 4.0",
      "www.scottbuckley.com.au",
      "creativecommons.org/licenses/by/4.0/", "",
      ...Object.values(TRACKS).map(track => track.title), "",
      "Game excerpts trimmed, normalized",
      "and compressed. M toggles sound."
    ].join("\n"), { fontFamily: "monospace", fontSize: "11px", color: "#cbd9db", lineSpacing: 3 });
    const back = this.add.text(100, 475, "[ Esc ]  Back", { fontFamily: "monospace", fontSize: "17px", color: "#f3d58d" }).setPadding(0, 5, 40, 5).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.restart());
  }
}
