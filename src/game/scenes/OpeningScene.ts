// AI-use disclosure: Codex-authored staging; dialogue is provisional for Nicoh to review.
import Phaser from "phaser";
import type { Session } from "../session";
import { getAudio } from "../audio";
import { pixelFrame } from "../pixel";
import { PROLOGUE } from "../../content/lines";

export class OpeningScene extends Phaser.Scene {
  private session!: Session;
  private hero!: Phaser.GameObjects.Image;
  private prior!: Phaser.GameObjects.Image;
  private subtitle!: Phaser.GameObjects.Text;
  private startedAt = 0;
  private done = false;
  private film: Phaser.GameObjects.Image | null = null;
  constructor() { super("opening"); }
  init(data: { session: Session }): void { this.session = data.session; this.done = false; this.film = null; }
  create(): void {
    this.startedAt = this.time.now;
    this.add.image(480, 270, this.textures.exists("higgsfield-arena") ? "higgsfield-arena" : "bg-night").setDisplaySize(960, 540);
    this.add.rectangle(480, 26, 960, 52, 0x050a13); this.add.rectangle(480, 505, 960, 70, 0x050a13);
    this.hero = this.add.image(598, 452, "alley").setOrigin(0.5, 1).setDisplaySize(112, 128);
    this.prior = this.add.image(800, 416, "immortal-base").setOrigin(0.5, 1).setDisplaySize(168, 192).setAngle(-16).setTint(0xa59daf);
    if (this.textures.exists("prologue")) {
      this.film = this.add.image(480, 270, "prologue", 0).setDisplaySize(960, 540);
      this.hero.setVisible(false); this.prior.setVisible(false);
      this.add.rectangle(480, 26, 960, 52, 0x050a13); this.add.rectangle(480, 505, 960, 70, 0x050a13);
    }
    this.subtitle = this.add.text(480, 493, "", { fontFamily: "Georgia, serif", fontSize: "21px", color: "#e8e0cd", align: "center" }).setOrigin(0.5);
    const skip = this.add.text(920, 26, "ESC  SKIP", { fontFamily: "monospace", fontSize: "11px", color: "#92a9af" }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    skip.on("pointerdown", () => this.finish()); this.input.keyboard?.on("keydown-ESC", () => this.finish());
    // PLACEHOLDER: Nicoh to rewrite. Requested plot beats, fifteen seconds total.
    const beats: [number, () => void][] = [
      [100, () => this.subtitle.setText(PROLOGUE.laugh)],
      [3300, () => this.subtitle.setText(PROLOGUE.trap)],
      [6500, () => this.subtitle.setText(PROLOGUE.answer)],
      [8600, () => { this.cameras.main.flash(450, 160, 199, 188); this.prior.setAlpha(0); this.hero.setTexture("immortal-base").setPosition(800, 416).setDisplaySize(196, 224); this.subtitle.setText(PROLOGUE.years); }],
      [10900, () => { this.subtitle.setText(PROLOGUE.kitten); this.prior.setTexture("kitten").clearTint().setAngle(0).setPosition(-30, 452).setDisplaySize(70, 80).setAlpha(1); this.tweens.add({ targets: this.prior, x: 235, duration: 1900, ease: "Sine.Out" }); }],
      [13300, () => this.subtitle.setText(PROLOGUE.refusal)],
      [15000, () => this.finish()],
    ];
    beats.forEach(([delay, fn]) => this.time.delayedCall(delay, fn));
  }
  private finish(): void {
    if (this.done) return;
    this.done = true;
    this.time.removeAllEvents();
    getAudio().start();
    void this.session.completeOpening().then(() => {
      if (this.scene.isActive()) this.scene.start("fight", { session: this.session });
    });
  }
  override update(time: number): void {
    const late = time - this.startedAt >= 8600;
    this.hero.setTexture(pixelFrame(late ? "immortal-base" : "alley", "idle", time / 1000));
    if (this.film) {
      const elapsed = time - this.startedAt;
      const frame = elapsed < 6500 ? Math.min(5, Math.floor(elapsed / 1100)) : elapsed < 8600 ? 6 + Math.min(2, Math.floor((elapsed - 6500) / 700)) : elapsed < 10900 ? 9 + Math.min(2, Math.floor((elapsed - 8600) / 770)) : elapsed < 14000 ? 12 + Math.min(2, Math.floor((elapsed - 10900) / 1033)) : 15;
      this.film.setFrame(frame);
      // A restrained continuous dolly joins generated key poses without moving UI.
      this.film.setScale(2.5 + Math.sin(elapsed / 15000 * Math.PI) * 0.06);
    }
  }
}
