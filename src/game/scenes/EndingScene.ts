// AI-use disclosure: written by Claude Code. The endings from docs/story-bible.md:
// letting go (held or fought) and too soon. The crown rolls to the challenger, the light
// turns to dawn, and the screen fades to the empty dawn room and the title.
// No "game over" text anywhere.

import Phaser from "phaser";
import { ARENA } from "../../core/config";
import { ROSTER } from "../../core/roster";
import type { Ending } from "../../core/run";
import type { LifeId } from "../../core/types";
import { ENDINGS, TITLE } from "../../content/lines";
import { DISPLAY_HEIGHT } from "../art";
import { getAudio } from "../audio";
import type { Session } from "../session";

const FONT = "Georgia, 'Times New Roman', serif";

export class EndingScene extends Phaser.Scene {
  private session!: Session;
  private ending!: Ending | null;
  private life!: LifeId;

  constructor() {
    super("ending");
  }

  init(data: { session: Session; ending: Ending | null; life: LifeId }): void {
    this.session = data.session;
    this.ending = data.ending;
    this.life = data.life;
  }

  create(): void {
    const W = ARENA.width;
    const H = ARENA.height;
    const floor = ARENA.floorY;
    const platform = floor - ARENA.platformY;
    const audio = getAudio();
    audio.resolve();
    this.cameras.main.fadeIn(1500, 255, 236, 200);

    const night = this.add.image(W / 2, H / 2, "bg-night");
    night.setScale(Math.max(W / night.width, H / night.height));
    const dawn = this.add.image(W / 2, H / 2, "bg-dawn").setAlpha(0.35);
    dawn.setScale(Math.max(W / dawn.width, H / dawn.height));
    const warm = this.add.rectangle(W / 2, H / 2, W, H, 0xffc070, 0.0).setBlendMode(Phaser.BlendModes.ADD);

    const ending = this.ending;
    const tooSoon = !ending || ending.kind === "too_soon";
    const bossX = this.session.sim?.boss.x ?? ARENA.bossStartX;
    const boss = this.add.image(bossX, platform, "immortal-base").setOrigin(0.5, 1);
    const bs = DISPLAY_HEIGHT.immortal / boss.height;
    boss.setScale(bs);
    const chX = Math.min(bossX - 110, this.session.sim?.ch.x ?? 600);
    const ch = this.add.image(chX, floor, ROSTER[this.life].sprite).setOrigin(0.5, 1);
    ch.setScale(DISPLAY_HEIGHT[this.life] / ch.height);
    const crown = this.add.circle(bossX + 4, platform - DISPLAY_HEIGHT.immortal + 6, 7, 0xd9b45a).setStrokeStyle(2, 0x8a6a2a);

    // The Immortal kneels.
    this.tweens.add({ targets: boss, scaleY: bs * 0.72, rotation: 0.12, duration: 1600, ease: "Sine.easeInOut" });
    // The crown slips off and rolls to the challenger's feet.
    this.tweens.add({ targets: crown, x: chX + 26, y: floor - 7, duration: 2600, delay: 1200, ease: "Quad.easeIn" });
    this.tweens.add({ targets: crown, angle: -720, duration: 2600, delay: 1200 });
    // The light turns to dawn.
    this.tweens.add({ targets: dawn, alpha: 1, duration: tooSoon ? 3000 : 6000, delay: 800 });
    this.tweens.add({ targets: warm, alpha: 0.12, duration: 6000, delay: 800 });

    const text = this.add.text(W / 2, H - 92, "", { fontFamily: FONT, fontSize: "21px", color: "#2a1c22", align: "center", wordWrap: { width: 700 } }).setOrigin(0.5);
    const shade = this.add.rectangle(W / 2, H - 92, 760, 70, 0xfff2dc, 1).setAlpha(0);
    text.setDepth(5);
    shade.setDepth(4);

    const lines: string[] = [];
    if (tooSoon) {
      lines.push(ENDINGS.tooSoonChallenger, ENDINGS.tooSoonCoda);
    } else if (ending.kind === "letting_go") {
      const high = ending.bond >= 4;
      if (ending.held) lines.push(ENDINGS.heldImmortal, high ? ENDINGS.heldHigh : ENDINGS.heldLow);
      else lines.push(high ? ENDINGS.foughtHigh : ENDINGS.foughtLow);
      if (ending.life8Struck) lines.push(ENDINGS.struckCoda);
    }

    // The patchwork cat sits beside the Immortal.
    if (!tooSoon) this.tweens.add({ targets: ch, x: bossX - 70, y: platform, scaleY: ch.scaleY * 0.88, duration: 2200, delay: 3000 });

    let delay = 4200;
    lines.forEach((l, i) => {
      this.time.delayedCall(delay, () => {
        shade.setAlpha(0.7);
        this.typeLine(text, l);
        if (i === 0 && !tooSoon && ending?.kind === "letting_go" && ending.held) {
          // It stands, and they walk out together.
          this.tweens.add({ targets: boss, scaleY: bs, rotation: 0, duration: 1600, delay: 1800 });
          this.tweens.add({ targets: [boss, ch, crown], x: "-=900", duration: 7000, delay: 3800, ease: "Sine.easeIn" });
        }
      });
      delay += 4200 + l.length * 30;
    });

    // Fade to the empty dawn room and the title.
    this.time.delayedCall(delay + 1500, () => {
      const cover = this.add.image(W / 2, H / 2, "bg-dawn").setAlpha(0).setDepth(10);
      cover.setScale(Math.max(W / cover.width, H / cover.height));
      const title = this.add.text(W / 2, H / 2 - 40, TITLE.name, { fontFamily: FONT, fontSize: "56px", color: "#3a2430" }).setOrigin(0.5).setAlpha(0).setDepth(11);
      this.tweens.add({ targets: cover, alpha: 1, duration: 3500 });
      this.tweens.add({ targets: title, alpha: 1, duration: 3000, delay: 2500 });
      text.setAlpha(0);
      shade.setAlpha(0);
      this.time.delayedCall(7000, () => {
        this.input.keyboard?.once("keydown", () => this.scene.start("title"));
        this.input.once("pointerdown", () => this.scene.start("title"));
      });
    });
  }

  private typeLine(target: Phaser.GameObjects.Text, line: string): void {
    let i = 0;
    target.setText("").setAlpha(1);
    const ev = this.time.addEvent({
      delay: 40,
      repeat: line.length - 1,
      callback: () => {
        const c = line[i] ?? "";
        if (/[aeiouy]/i.test(c) && !/[aeiouy]/i.test(line[i - 1] ?? " ")) getAudio().murmur(0.85);
        i++;
        target.setText(line.slice(0, i));
        if (i >= line.length) ev.remove();
      },
    });
  }
}
