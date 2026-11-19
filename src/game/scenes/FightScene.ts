// AI-use disclosure: written by Claude Code. The throne room: renders the core fight sim,
// reads input, plays the between-fight sequence (death, summary, line, response, intro
// card), and hands endings to the ending scene. All rules live in src/core.

import Phaser from "phaser";
import { ARENA, DT, MOVE_GEOMETRY as G, PATCHWORK, RUN } from "../../core/config";
import type { FightSim } from "../../core/fight";
import { ROSTER } from "../../core/roster";
import { clampBond, fixedLifeFor } from "../../core/run";
import { makeBot, type BossBot } from "../../core/bots";
import { NO_INPUT, type BossInput, type FightEvent, type FightSummary, type LifeId, type PlanResult } from "../../core/types";
import { INTRO, LIFE9, MUTUAL, PHASE2_BEAT, QUIET_TALK, RESPONSES, quietBand } from "../../content/lines";
import { DISPLAY_HEIGHT, drawFraming, drawProps, tierLook, tierOf } from "../art";
import { getAudio } from "../audio";
import type { Session } from "../session";

type Mode = "card" | "fight" | "death" | "between";

const FONT = "Georgia, 'Times New Roman', serif";
const FLOOR = ARENA.floorY;
const PLATFORM_TOP = FLOOR - ARENA.platformY;

/** Filled circular sector as a polygon. Graphics.slice draws the wrong arc in the Canvas renderer. */
function fan(g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number, a0: number, a1: number): void {
  const pts: Phaser.Types.Math.Vector2Like[] = [{ x: cx, y: cy }];
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  g.fillPoints(pts, true);
}

export class FightScene extends Phaser.Scene {
  private session!: Session;
  private sim: FightSim | null = null;
  private mode: Mode = "card";
  private acc = 0;
  private hitstop = 0;
  private evIndex = 0;
  private press: Partial<BossInput> = {};
  private keys!: Record<"A" | "D" | "S" | "LEFT" | "RIGHT", Phaser.Input.Keyboard.Key>;
  private showHitboxes = false;
  private fightClock = 0;
  /** Dev options from the URL: ?speed=N runs the sim N times faster, ?autoplay=1 lets a scripted boss play. */
  private speed = 1;
  private autoplay = false;
  private autoBot: BossBot | null = null;

  private bgNight!: Phaser.GameObjects.Image;
  private bgDawn!: Phaser.GameObjects.Image;
  private wash!: Phaser.GameObjects.Rectangle;
  private warm!: Phaser.GameObjects.Rectangle;
  private dark!: Phaser.GameObjects.Rectangle;
  private flash!: Phaser.GameObjects.Rectangle;
  private props!: Phaser.GameObjects.Graphics;
  private stage!: Phaser.GameObjects.Graphics;
  private fx!: Phaser.GameObjects.Graphics;
  private fxAdd!: Phaser.GameObjects.Graphics;
  private ui!: Phaser.GameObjects.Graphics;
  private debugG!: Phaser.GameObjects.Graphics;
  private boss!: Phaser.GameObjects.Image;
  private asc!: Phaser.GameObjects.Image;
  private bossGlow!: Phaser.GameObjects.Image;
  private eyeL!: Phaser.GameObjects.Image;
  private eyeR!: Phaser.GameObjects.Image;
  private ch!: Phaser.GameObjects.Image;
  private decoy!: Phaser.GameObjects.Image;
  private chName!: Phaser.GameObjects.Text;
  private bossName!: Phaser.GameObjects.Text;
  private caption!: Phaser.GameObjects.Text;
  private dialogue!: Phaser.GameObjects.Text;
  private dialogueBox!: Phaser.GameObjects.Rectangle;
  private holdText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private overlay!: Phaser.GameObjects.Container;

  private bossHpShown = 1;
  private typing: { full: string; shown: number; t: number; hold: number } | null = null;
  private captionT = 0;
  private overlayAdvance: (() => void) | null = null;
  private choice: { index: number; options: Phaser.GameObjects.Text[]; done: (open: boolean) => void } | null = null;

  constructor() {
    super("fight");
  }

  init(data: { session: Session }): void {
    this.session = data.session;
    this.sim = null;
    this.mode = "card";
    this.evIndex = 0;
    this.press = {};
    this.typing = null;
    this.choice = null;
    this.overlayAdvance = null;
  }

  create(): void {
    const W = ARENA.width;
    const H = ARENA.height;
    this.cameras.main.fadeIn(600);
    this.bgNight = this.add.image(W / 2, H / 2, "bg-night");
    this.bgNight.setScale(Math.max(W / this.bgNight.width, H / this.bgNight.height));
    this.bgDawn = this.add.image(W / 2, H / 2, "bg-dawn").setAlpha(0);
    this.bgDawn.setScale(Math.max(W / this.bgDawn.width, H / this.bgDawn.height));
    this.wash = this.add.rectangle(W / 2, H / 2, W, H, 0x10183a, 0.3);
    this.warm = this.add.rectangle(W / 2, H / 2, W, H, 0xffa860, 0).setBlendMode(Phaser.BlendModes.ADD);
    this.props = this.add.graphics();
    this.stage = this.add.graphics();
    this.drawStage();
    this.bossGlow = this.add.image(0, 0, "glow").setBlendMode(Phaser.BlendModes.ADD).setAlpha(0);
    this.boss = this.add.image(ARENA.bossStartX, PLATFORM_TOP, "immortal-base").setOrigin(0.5, 1);
    this.boss.setScale(DISPLAY_HEIGHT.immortal / this.boss.height);
    this.asc = this.add.image(ARENA.bossStartX, PLATFORM_TOP, "immortal-ascended").setOrigin(0.5, 1).setAlpha(0);
    this.asc.setScale(DISPLAY_HEIGHT.ascended / this.asc.height);
    this.eyeL = this.add.image(0, 0, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(0xc8b6ff).setAlpha(0);
    this.eyeR = this.add.image(0, 0, "glow").setBlendMode(Phaser.BlendModes.ADD).setTint(0xc8b6ff).setAlpha(0);
    this.decoy = this.add.image(0, FLOOR, "kitten").setOrigin(0.5, 1).setAlpha(0);
    this.ch = this.add.image(ARENA.spawnX, FLOOR, "kitten").setOrigin(0.5, 1);
    this.fx = this.add.graphics();
    this.fxAdd = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    this.dark = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0);
    this.flash = this.add.rectangle(W / 2, H / 2, W, H, 0xffffff, 0);
    drawFraming(this.add.graphics(), W, H);
    this.debugG = this.add.graphics();
    this.ui = this.add.graphics();

    const text = (x: number, y: number, size: number, color = "#e8e0ff"): Phaser.GameObjects.Text =>
      this.add.text(x, y, "", { fontFamily: FONT, fontSize: `${size}px`, color });
    this.chName = text(30, 16, 15);
    this.bossName = text(W - 30, 16, 15).setOrigin(1, 0);
    this.bossName.setText("The Immortal");
    this.caption = text(W / 2, 92, 18, "#d9ccff").setOrigin(0.5).setAlpha(0);
    this.dialogueBox = this.add.rectangle(W / 2, H - 70, 640, 54, 0x05050c, 0.72).setStrokeStyle(1, 0x5c5480).setAlpha(0);
    this.dialogue = text(W / 2, H - 70, 19, "#f3ecff").setOrigin(0.5).setAlpha(0).setWordWrapWidth(600).setAlign("center");
    this.holdText = text(W / 2, H - 128, 17, "#ffe8b0").setOrigin(0.5).setAlpha(0);
    this.debugText = text(22, H - 20, 11, "#8d85a8").setOrigin(0, 1);
    this.overlay = this.add.container(0, 0).setDepth(50);

    const params = new URLSearchParams(window.location.search);
    this.speed = Math.min(8, Math.max(1, Number(params.get("speed") ?? 1) || 1));
    this.autoplay = params.get("autoplay") === "1";
    this.setupInput();
    this.applyTierLook(this.session.fightIndex, false);
    this.showIntroCard();
  }

  // ---------- input ----------

  private setupInput(): void {
    const kb = this.input.keyboard!;
    this.keys = kb.addKeys({ A: "A", D: "D", S: "S", LEFT: "LEFT", RIGHT: "RIGHT" }) as FightScene["keys"];
    kb.addCapture("SPACE,UP,DOWN,LEFT,RIGHT");
    kb.on("keydown", (e: KeyboardEvent) => this.onKey(e));
  }

  private onKey(e: KeyboardEvent): void {
    const k = e.key.toLowerCase();
    if (this.mode === "fight") {
      if (k === "j") this.press.cleave = true;
      else if (k === "k") this.press.throw = true;
      else if (k === "l") this.press.reap = true;
      else if (k === " ") this.press.nova = true;
    }
    // Debug keys.
    if (/^[1-9]$/.test(k) && !this.choice) {
      this.debugJump(Number(k));
      return;
    }
    if (k === "p" && this.sim && this.mode === "fight") this.sim.debugForcePhase2();
    if (k === "b") this.session.state.bond = clampBond(this.session.state.bond + 1);
    if (k === "n") this.session.state.bond = clampBond(this.session.state.bond - 1);
    if (k === "h") this.showHitboxes = !this.showHitboxes;

    if (this.choice) {
      if (k === "a" || k === "arrowleft") this.moveChoice(0);
      else if (k === "d" || k === "arrowright") this.moveChoice(1);
      else if (k === "enter" || k === " " || k === "j") this.confirmChoice();
      return;
    }
    if (this.overlayAdvance && (k === "enter" || k === " " || k === "j")) {
      const f = this.overlayAdvance;
      this.overlayAdvance = null;
      f();
    }
  }

  private readInput(): BossInput {
    const inp: BossInput = {
      ...NO_INPUT,
      ...this.press,
      left: this.keys.A.isDown || this.keys.LEFT.isDown,
      right: this.keys.D.isDown || this.keys.RIGHT.isDown,
      hold: this.keys.S.isDown,
    };
    this.press = {};
    return inp;
  }

  private debugJump(n: number): void {
    this.overlay.removeAll(true);
    this.choice = null;
    this.overlayAdvance = null;
    this.session.debugJump(n);
    getAudio().phase2(false);
    this.applyTierLook(n, false);
    this.showIntroCard();
  }

  // ---------- flow ----------

  private showIntroCard(): void {
    this.mode = "card";
    this.sim = null;
    const fi = this.session.fightIndex;
    const plan = this.session.next;
    const life = this.session.lifeFor(plan, fi);
    this.ch.setTexture(ROSTER[life].sprite).setAlpha(0).setRotation(0);
    this.overlay.removeAll(true);
    const W = ARENA.width;
    const H = ARENA.height;
    const dim = this.add.rectangle(W / 2, H / 2, W, H, 0x020208, 0.78);
    const stripe = this.add.rectangle(W / 2, H / 2 + 92, 220, 4, ROSTER[life].color);
    const num = this.add.text(W / 2, H / 2 - 120, `Life ${fi} of ${RUN.totalLives}`, { fontFamily: FONT, fontSize: "16px", color: "#a99fcc" }).setOrigin(0.5);
    const title = this.add.text(W / 2, H / 2 + 50, INTRO[life].title, { fontFamily: FONT, fontSize: "34px", color: "#f1eaff" }).setOrigin(0.5);
    const sign = this.add.text(W / 2, H / 2 + 118, INTRO[life].sign, { fontFamily: FONT, fontSize: "16px", color: "#cbbfe6" }).setOrigin(0.5);
    const pic = this.add.image(W / 2, H / 2 + 20, ROSTER[life].sprite).setOrigin(0.5, 1);
    pic.setScale(120 / pic.height);
    const items: Phaser.GameObjects.GameObject[] = [dim, stripe, num, title, sign, pic];
    if (fi === 1) {
      const line = this.add.text(W / 2, H / 2 + 156, `“${this.session.lineFor(plan, fi)}”`, { fontFamily: FONT, fontSize: "17px", color: "#efe7d0" }).setOrigin(0.5);
      items.push(line);
    }
    this.overlay.add(items);
    this.overlay.setAlpha(0);
    this.tweens.add({ targets: this.overlay, alpha: 1, duration: 500 });
    // Flow runs on the scene clock. The tween is only the visual fade.
    const go = (): void => {
      this.tweens.add({ targets: this.overlay, alpha: 0, duration: 450 });
      this.time.delayedCall(460, () => {
        this.overlay.removeAll(true);
        this.overlay.setAlpha(1);
        this.beginFight();
      });
    };
    this.overlayAdvance = go;
    if (this.autoplay) this.time.delayedCall(400, () => this.overlayAdvance === go && (this.overlayAdvance = null, go()));
    this.time.delayedCall(fi === 1 ? 3800 : 2800, () => {
      if (this.overlayAdvance === go) {
        this.overlayAdvance = null;
        go();
      }
    });
  }

  private beginFight(): void {
    this.sim = this.session.startFight();
    this.evIndex = 0;
    this.acc = 0;
    this.fightClock = 0;
    this.bossHpShown = 1;
    this.mode = "fight";
    const life = this.sim.setup.life;
    if (this.autoplay) this.autoBot = makeBot(life === "patchwork" ? "holder" : life === "quiet" ? "idle" : "average", this.session.state.seed + this.sim.setup.fightIndex);
    this.ch.setTexture(ROSTER[life].sprite).setAlpha(1).setRotation(0);
    this.ch.setScale(DISPLAY_HEIGHT[life] / this.ch.height);
    this.decoy.setTexture(ROSTER[life].sprite).setScale(this.ch.scaleX).setAlpha(0);
    this.boss.setAlpha(1).setRotation(0);
    this.asc.setAlpha(0);
    this.bossGlow.setAlpha(0);
    getAudio().phase2(false);
    getAudio().setTier(tierOf(this.sim.setup.fightIndex));
    this.chName.setText(`Life ${this.sim.setup.fightIndex}  ·  ${INTRO[life].title}`);
    drawProps(this.props, this.sim.setup.fightIndex, this.session.state.used, FLOOR, this.session.state.seed);
    if (life === "patchwork") this.say(LIFE9.midFight);
  }

  private onFightOver(): void {
    const sim = this.sim!;
    this.mode = "death";
    this.holdText.setAlpha(0);
    if (sim.outcome === "boss_dead") {
      const ending = this.session.state.ending;
      this.session.endFight();
      const endingNow = this.session.state.ending ?? ending;
      this.hitstop = 0.4;
      this.tweens.add({ targets: [this.boss, this.asc], alpha: 0.6, duration: 900 });
      this.time.delayedCall(1400, () => {
        this.cameras.main.fadeOut(1200, 255, 236, 200);
        this.cameras.main.once("camerafadeoutcomplete", () =>
          this.scene.start("ending", { session: this.session, ending: endingNow, life: sim.setup.life }),
        );
      });
      return;
    }
    if (sim.outcome === "challenger_dead") {
      this.tweens.add({ targets: this.ch, rotation: -1.4, y: FLOOR, alpha: 0, duration: 1300, ease: "Quad.easeIn" });
    }
    const summary = this.session.endFight();
    this.time.delayedCall(1500, () => this.showSummary(summary));
  }

  private panel(lines: { text: string; size: number; color?: string; dy: number }[]): Phaser.GameObjects.GameObject[] {
    const W = ARENA.width;
    const H = ARENA.height;
    const out: Phaser.GameObjects.GameObject[] = [this.add.rectangle(W / 2, H / 2, W, H, 0x020208, 0.6)];
    for (const l of lines) {
      out.push(this.add.text(W / 2, H / 2 + l.dy, l.text, { fontFamily: FONT, fontSize: `${l.size}px`, color: l.color ?? "#ece4ff" }).setOrigin(0.5));
    }
    return out;
  }

  private showSummary(summary: FightSummary): void {
    this.mode = "between";
    this.overlay.removeAll(true);
    const lowPct = Math.round(summary.bossMinHpPct * 100);
    const life = summary.lifeId;
    const fate = summary.outcome === "spared" ? "left quietly" : "fell";
    const items = this.panel([
      { text: `Life ${summary.fightIndex}  ·  ${INTRO[life].title} ${fate}`, size: 22, dy: -90 },
      { text: summary.outcome === "spared" ? "It never raised a paw." : `The Immortal held at ${lowPct}% at its lowest.`, size: 18, color: "#cbbfe6", dy: -46 },
      {
        text: summary.phase2ReachedAtSec !== null ? "It forced the Immortal into its second form." : "The Immortal kept its first form.",
        size: 16,
        color: "#a99fcc",
        dy: -16,
      },
    ]);
    // Trend: each past fight's lowest boss HP as a small bar.
    const g = this.add.graphics();
    const past = this.session.state.summaries.filter((s) => s.lifeId !== "quiet");
    const x0 = ARENA.width / 2 - (past.length * 26) / 2;
    past.forEach((s, i) => {
      const h = 60 * s.bossMinHpPct;
      g.fillStyle(0x3a3358, 1).fillRect(x0 + i * 26, ARENA.height / 2 + 20, 16, 60);
      g.fillStyle(s.phase2ReachedAtSec !== null ? 0x7cffc8 : 0x9a8cff, 1).fillRect(x0 + i * 26, ARENA.height / 2 + 80 - h, 16, h);
    });
    items.push(g);
    items.push(this.add.text(ARENA.width / 2, ARENA.height / 2 + 100, "the Immortal’s lowest health, life by life", { fontFamily: FONT, fontSize: "12px", color: "#7f7799" }).setOrigin(0.5));
    this.overlay.add(items);
    let advanced = false;
    const next = (): void => {
      if (advanced) return;
      advanced = true;
      void this.showLine();
    };
    this.overlayAdvance = next;
    if (this.autoplay) this.time.delayedCall(500, next);
    this.time.delayedCall(3200, next);
  }

  private async showLine(): Promise<void> {
    this.overlayAdvance = null;
    this.overlay.removeAll(true);
    const plan: PlanResult = await this.session.resolveNext();
    const fi = this.session.fightIndex;
    const line = this.session.lineFor(plan, fi);
    const items = this.panel([{ text: "a voice from the stairs", size: 14, color: "#8f86ad", dy: -60 }]);
    this.overlay.add(items);
    this.say(line, 4.5, true);
    let advanced = false;
    const next = (): void => {
      if (advanced) return;
      advanced = true;
      this.showChoice();
    };
    this.overlayAdvance = next;
    if (this.autoplay) this.time.delayedCall(500, next);
    this.time.delayedCall(Math.max(2600, 120 * line.length), next);
  }

  private showChoice(): void {
    this.overlayAdvance = null;
    this.overlay.removeAll(true);
    this.hideDialogue();
    const fi = this.session.fightIndex;
    const tier = tierOf(Math.max(1, fi - 1));
    const options = RESPONSES[tier];
    const pair = options[(fi - 2 + options.length) % options.length]!;
    const W = ARENA.width;
    const H = ARENA.height;
    const items = this.panel([{ text: "The Immortal answers", size: 15, color: "#8f86ad", dy: -70 }]);
    const left = this.add.text(W / 2 - 170, H / 2, pair.guarded, { fontFamily: FONT, fontSize: "20px", color: "#ece4ff", align: "center", wordWrap: { width: 280 } }).setOrigin(0.5);
    const right = this.add.text(W / 2 + 170, H / 2, pair.open, { fontFamily: FONT, fontSize: "20px", color: "#ece4ff", align: "center", wordWrap: { width: 280 } }).setOrigin(0.5);
    const hint = this.add.text(W / 2, H / 2 + 80, "A or D to choose, Enter to answer", { fontFamily: FONT, fontSize: "12px", color: "#7f7799" }).setOrigin(0.5);
    for (const [i, t] of [left, right].entries()) {
      t.setInteractive({ useHandCursor: true });
      t.on("pointerover", () => this.moveChoice(i));
      t.on("pointerdown", () => {
        this.moveChoice(i);
        this.confirmChoice();
      });
    }
    items.push(left, right, hint);
    this.overlay.add(items);
    this.choice = {
      index: 0,
      options: [left, right],
      done: (open) => {
        this.session.respond(open);
        this.choice = null;
        this.applyTierLook(this.session.fightIndex, true);
        this.showIntroCard();
      },
    };
    this.moveChoice(0);
    if (this.autoplay) this.time.delayedCall(500, () => {
      this.moveChoice(this.session.fightIndex % 2);
      this.confirmChoice();
    });
  }

  private moveChoice(i: number): void {
    if (!this.choice) return;
    this.choice.index = i;
    this.choice.options.forEach((t, j) => t.setColor(j === i ? "#ffe2a8" : "#8f86ad").setScale(j === i ? 1.06 : 1));
  }

  private confirmChoice(): void {
    if (!this.choice) return;
    const c = this.choice;
    getAudio().evade();
    c.done(c.index === 1);
  }

  // ---------- dialogue ----------

  /** Shows a line. Ambient lines wait their turn instead of cutting off a line still on screen. */
  private say(text: string, holdS = 3.2, boxless = false, ambient = false): void {
    if (!text) return;
    if (ambient && this.typing) return;
    this.typing = { full: text, shown: 0, t: 0, hold: holdS };
    this.dialogue.setText("").setAlpha(1).setDepth(60);
    this.dialogueBox.setAlpha(boxless ? 0 : 1).setDepth(59);
    if (boxless) this.dialogue.setY(ARENA.height / 2 - 10);
    else this.dialogue.setY(ARENA.height - 70);
  }

  private hideDialogue(): void {
    this.typing = null;
    this.dialogue.setAlpha(0);
    this.dialogueBox.setAlpha(0);
  }

  private updateDialogue(dt: number): void {
    const ty = this.typing;
    if (!ty) return;
    ty.t += dt;
    const target = Math.min(ty.full.length, Math.floor(ty.t / 0.035));
    while (ty.shown < target) {
      const ch = ty.full[ty.shown]!;
      const prev = ty.shown > 0 ? ty.full[ty.shown - 1]! : " ";
      if (/[aeiouy]/i.test(ch) && !/[aeiouy]/i.test(prev)) getAudio().murmur(this.sim?.setup.life === "kitten" ? 1.3 : 1);
      ty.shown++;
    }
    this.dialogue.setText(ty.full.slice(0, ty.shown));
    if (ty.shown >= ty.full.length && ty.t > ty.full.length * 0.035 + ty.hold) this.hideDialogue();
  }

  private handleEvent(e: FightEvent): void {
    const audio = getAudio();
    const sim = this.sim!;
    switch (e.type) {
      case "boss_move":
        audio.tell(e.move, e.phase);
        break;
      case "challenger_hit":
        audio.hit(e.dmg > 20);
        this.cameras.main.shake(120, 0.004);
        break;
      case "boss_hit":
        audio.hit(false);
        break;
      case "evade":
        audio.evade();
        break;
      case "phase2_start":
        this.hitstop = 0.22;
        this.flash.setAlpha(0.9);
        this.cameras.main.shake(500, 0.01);
        audio.phase2(true);
        this.caption.setText(PHASE2_BEAT).setAlpha(1);
        this.captionT = 3;
        break;
      case "say": {
        if (e.key.startsWith("quiet.")) {
          const i = Number(e.key.split(".")[1]);
          const line = QUIET_TALK[quietBand(this.session.state.bond)][i];
          if (line) this.say(line, 2.8);
        } else if (e.key === "mutual.lower") this.say(MUTUAL.lower[sim.setup.fightIndex % MUTUAL.lower.length]!, 2.5, false, true);
        else if (e.key === "mutual.raise") this.say(MUTUAL.raise[sim.setup.fightIndex % MUTUAL.raise.length]!, 2, false, true);
        break;
      }
      case "hold_prompt": {
        const st = this.session.state;
        this.say(st.life8Struck ? LIFE9.whyStruck : st.bond >= 4 ? LIFE9.whyHigh : LIFE9.whyLow, 5);
        break;
      }
      case "yield":
        this.holdText.setAlpha(0);
        audio.bell();
        break;
      default:
        break;
    }
  }

  // ---------- frame ----------

  override update(_time: number, deltaMs: number): void {
    const dt = Math.min(0.1, deltaMs / 1000);
    this.updateDialogue(dt);
    if (this.captionT > 0) {
      this.captionT -= dt;
      this.caption.setAlpha(Math.min(1, this.captionT));
    }
    this.flash.setAlpha(Math.max(0, this.flash.alpha - dt * 2.2));

    const sim = this.sim;
    if (sim && this.mode === "fight") {
      if (this.hitstop > 0) this.hitstop -= dt;
      else {
        this.acc += dt * this.speed;
        while (this.acc >= DT && !sim.outcome) {
          const input = this.readInput();
          sim.step(this.autoBot ? { ...this.autoBot(sim), left: input.left, right: input.right } : input);
          this.acc -= DT;
        }
      }
      while (this.evIndex < sim.events.length) this.handleEvent(sim.events[this.evIndex++]!);
      this.fightClock += dt;
      if (sim.outcome) this.onFightOver();
    }
    if (sim) this.render(sim, dt);
    this.drawDebug();
  }

  private render(sim: FightSim, dt: number): void {
    const t = this.time.now / 1000;
    const b = sim.boss;
    const fi = sim.setup.fightIndex;
    const tier = tierOf(fi);
    this.fx.clear();
    this.fxAdd.clear();
    this.ui.clear();

    // --- the Immortal ---
    const trans = b.transitionT > 0 ? 1 - b.transitionT / sim.cfg.phase2.PHASE2_TRANSITION_S : b.phase === 2 ? 1 : 0;
    const breathAmp = tier === 1 ? 0.006 : tier === 2 ? 0.01 : 0.016;
    const breathRate = tier === 1 ? 2.2 : tier === 2 ? 1.8 : 1.3;
    const sway = tier >= 2 ? Math.sin(t * 0.7) * (tier === 3 ? 0.03 : 0.015) : 0;
    const m = b.move;
    let lean = sway + (tier === 3 ? 0.04 : 0);
    let squash = 1 + Math.sin(t * breathRate) * breathAmp;
    if (m && m.phase === 1) {
      const p = m.stage === "tell" ? m.t / m.spec.tellS : 1;
      if (m.id === "cleave") lean = m.stage === "tell" ? -0.1 * p : m.stage === "active" ? 0.16 : 0.05;
      if (m.id === "reap") squash = m.stage === "tell" ? 1 - 0.1 * p : 0.92;
      if (m.id === "throw") lean = m.stage === "tell" ? -0.06 * p : 0;
    }
    const baseScale = DISPLAY_HEIGHT.immortal / this.boss.height;
    this.boss.setPosition(b.x, PLATFORM_TOP).setRotation(lean).setScale(baseScale, baseScale * squash);
    this.boss.setAlpha(b.hitFlashT > 0 ? 0.6 : 1 - trans);
    const ascScale = DISPLAY_HEIGHT.ascended / this.asc.height;
    const floatY = PLATFORM_TOP - 22 + Math.sin(t * 2.4) * 6;
    let ascAlpha = trans;
    if (m && m.phase === 2 && m.id === "cleave" && m.stage === "tell") ascAlpha = Math.max(0.2, 1 - m.t / m.spec.tellS);
    this.asc.setPosition(b.x, floatY).setScale(ascScale).setAlpha(b.hitFlashT > 0 ? ascAlpha * 0.6 : ascAlpha);
    this.bossGlow.setPosition(b.x, floatY - 110).setScale(3.4).setTint(0x8f5cff).setAlpha(0.35 * trans + (b.hitFlashT > 0 ? 0.3 : 0));
    // The dropped glaive stays on the floor in Phase Two.
    if (b.glaiveDropX !== null) {
      this.fx.lineStyle(4, 0x9aa0b4, 1).lineBetween(b.glaiveDropX - 60, PLATFORM_TOP - 2, b.glaiveDropX + 40, PLATFORM_TOP - 6);
      this.fx.lineStyle(3, 0xc8ccd8, 1).beginPath().arc(b.glaiveDropX - 66, PLATFORM_TOP - 14, 14, -1.2, 1.6).strokePath();
    }

    // Eyes glow on the Nova tell, and the room darkens.
    const novaTell = m && m.id === "nova" && m.stage === "tell" ? m.t / m.spec.tellS : 0;
    const eyeY = (b.phase === 2 ? floatY : PLATFORM_TOP) - (b.phase === 2 ? DISPLAY_HEIGHT.ascended : DISPLAY_HEIGHT.immortal) * 0.86;
    this.eyeL.setPosition(b.x - 8, eyeY).setScale(0.12 + novaTell * 0.25).setAlpha(0.35 + novaTell * 0.65);
    this.eyeR.setPosition(b.x + 8, eyeY).setScale(0.12 + novaTell * 0.25).setAlpha(0.35 + novaTell * 0.65);
    this.dark.setAlpha(novaTell * 0.5);

    this.drawMove(sim, t);

    // --- challenger ---
    const c = sim.ch;
    const life = c.life;
    const chScale = DISPLAY_HEIGHT[life] / this.ch.height;
    let rot = 0;
    let sy = 1;
    let yOff = 0;
    const bob = Math.sin(t * (tier === 3 ? 3 : 5)) * (tier === 3 ? 1.5 : 2);
    switch (c.state) {
      case "hesitate":
      case "lowered":
        rot = -0.14;
        sy = 0.94;
        yOff = 2;
        break;
      case "attack":
        rot = c.windupT > 0 ? 0.22 : 0.08;
        break;
      case "evade":
        if (c.lastSkill === "roll") rot = -(1 - c.stateT / 0.42) * Math.PI * 2;
        break;
      case "hitstun":
        rot = -0.25;
        break;
      case "sit":
        sy = 0.86;
        break;
      case "flee":
        rot = -0.1;
        break;
      default:
        yOff = c.state === "wait" ? bob * 0.5 : Math.abs(bob);
    }
    if (c.state !== "dead") {
      this.ch.setPosition(c.x, FLOOR - c.y - yOff).setRotation(rot).setScale(chScale, chScale * sy);
      this.ch.setAlpha(c.iframes > 0 ? 0.55 : c.hitFlashT > 0 ? (Math.floor(t * 30) % 2 ? 0.4 : 1) : 1);
    }
    // Decoy afterimage.
    this.decoy.setAlpha(c.decoyT > 0 ? 0.35 : 0).setPosition(c.x + 60, FLOOR);
    // Umbrella.
    if (c.blockT > 0) {
      fan(this.fx.fillStyle(0xf2c230, 0.9), c.x + 18, FLOOR - c.y - 58, 34, Math.PI + 0.35, Math.PI * 2 - 0.35);
    }
    // Armor glint.
    if (c.armorUp && life !== "patchwork") this.fxAdd.fillStyle(0xdfe6ff, 0.25 + 0.15 * Math.sin(t * 6)).fillCircle(c.x, FLOOR - c.y - 50, 10);
    // Attack slash in the accessory color.
    if (c.attackFlashT > 0) {
      this.fxAdd.lineStyle(4, ROSTER[life].color, c.attackFlashT / 0.15).beginPath().arc(c.x + 28, FLOOR - c.y - 50, 34, -1.2, 1.0).strokePath();
    }
    // Blink puff.
    if (c.lastSkill === "blink" && c.iframes > 0) this.fxAdd.fillStyle(0x9b6bff, c.iframes).fillCircle(c.x, FLOOR - 50, 30 * (1 - c.iframes));

    // --- projectiles ---
    for (const p of sim.projectiles) {
      const py = FLOOR - p.y;
      if (p.kind === "glaive") {
        const a = t * 18;
        this.fx.lineStyle(4, 0xd7dbea, 1).beginPath().arc(p.x, py, 20, a, a + 2.6).strokePath();
        this.fxAdd.fillStyle(0xbfc6ff, 0.25).fillCircle(p.x, py, 16);
      } else {
        this.fxAdd.fillStyle(0x7cffc8, 0.35).fillCircle(p.x, py, 16);
        this.fxAdd.fillStyle(0xe9fff6, 0.9).fillCircle(p.x, py, 6);
      }
    }

    // --- hp bars ---
    this.bossHpShown += (sim.bossHpPct - this.bossHpShown) * Math.min(1, dt * 6);
    const W = ARENA.width;
    const bw = 300;
    this.ui.fillStyle(0x000000, 0.55).fillRect(W - 30 - bw, 40, bw, 10);
    this.ui.fillStyle(b.phase === 2 || b.transitionT > 0 ? 0x7cffc8 : 0xa48cff, 1).fillRect(W - 30 - bw, 40, bw * Math.max(0, this.bossHpShown), 10);
    if (!b.phase2Triggered) this.ui.fillStyle(0xffffff, 0.6).fillRect(W - 30 - bw * 0.5, 38, 2, 14);
    if (life !== "quiet") {
      this.ui.fillStyle(0x000000, 0.55).fillRect(30, 40, 200, 8);
      this.ui.fillStyle(ROSTER[life].color, 1).fillRect(30, 40, 200 * Math.max(0, c.hp / c.maxHp), 8);
    }

    // --- life 9 hold prompt ---
    if (b.holdAvailable && !b.yielded && this.mode === "fight") {
      const txt = b.phase === 2 ? LIFE9.holdPromptAscended : LIFE9.holdPrompt;
      this.holdText.setText(txt).setAlpha(0.65 + 0.35 * Math.sin(t * 2));
      const p = Math.min(1, b.holdT / PATCHWORK.holdToYieldS);
      this.ui.fillStyle(0x000000, 0.5).fillRect(W / 2 - 80, ARENA.height - 112, 160, 5);
      this.ui.fillStyle(0xffe2a8, 1).fillRect(W / 2 - 80, ARENA.height - 112, 160 * p, 5);
    } else if (this.mode === "fight") this.holdText.setAlpha(0);
  }

  private drawMove(sim: FightSim, t: number): void {
    const m = sim.boss.move;
    if (!m || sim.outcome) return;
    const front = sim.bossFront;
    const p = m.stage === "tell" ? Math.min(1, m.t / m.spec.tellS) : 1;
    const fx = this.fx;
    const add = this.fxAdd;
    if (m.phase === 1) {
      switch (m.id) {
        case "cleave":
          if (m.stage === "tell") add.lineStyle(3, 0xd8dcf0, 0.3 + 0.6 * p).beginPath().arc(sim.boss.x - 10, PLATFORM_TOP - 190, 46, -2.8, -0.6).strokePath();
          if (m.stage === "active") {
            fan(add.fillStyle(0xe8e4ff, 0.55), front, FLOOR - 30, G.cleaveReach, Math.PI * 0.82, Math.PI * 1.12);
            add.lineStyle(5, 0xffffff, 0.9).beginPath().arc(front, FLOOR - 30, G.cleaveReach, Math.PI * 0.82, Math.PI * 1.12).strokePath();
          }
          break;
        case "throw":
          if (m.stage === "tell") {
            const a = t * 10 * (0.5 + p);
            fx.lineStyle(4, 0xd7dbea, 0.9).beginPath().arc(front + 6, PLATFORM_TOP - 120, 22, a, a + 2.6).strokePath();
          }
          break;
        case "reap":
          if (m.stage === "tell") add.lineStyle(2, 0xd8dcf0, 0.3 + 0.5 * p).lineBetween(front - 40 * p, FLOOR - 4, front, FLOOR - 4);
          if (m.stage === "active") {
            const prog = m.t / m.spec.activeS;
            add.fillStyle(0xeae6ff, 0.55).fillRect(front - (front - 20) * prog, FLOOR - 14, (front - 20) * prog, 12);
          }
          break;
        case "nova":
          if (m.stage === "active") this.flash.setAlpha(0.85);
          break;
      }
      return;
    }
    switch (m.id) {
      case "cleave":
        if (m.stage === "tell") {
          add.lineStyle(3, 0xb07cff, 0.4 + 0.6 * p).strokeEllipse(m.targetX, FLOOR - 2, G.riftRadius * 2 * (1.4 - 0.4 * p), 24);
        }
        if (m.stage === "active") {
          add.fillStyle(0xc9a2ff, 0.6).fillEllipse(m.targetX, FLOOR - 6, G.riftRadius * 2, 34);
          add.fillStyle(0xffffff, 0.5).fillRect(m.targetX - 6, FLOOR - 260, 12, 254);
        }
        break;
      case "throw":
        if (m.stage === "tell") add.fillStyle(0x7cffc8, 0.3 + 0.5 * p).fillCircle(sim.boss.x - 20, PLATFORM_TOP - 150, 10 + 10 * p);
        break;
      case "reap":
        if (m.stage === "tell") {
          for (let i = 0; i < 4; i++) {
            const x = front - 60 - i * 140 + Math.sin(t * 8 + i) * 8;
            add.lineStyle(2, 0x6fe6ff, 0.25 + 0.5 * p).beginPath().arc(x, FLOOR + 6, 30, Math.PI * 1.15, Math.PI * 1.85).strokePath();
          }
        }
        if (m.stage === "active") {
          const wave = m.t < G.tideWaveS ? 0 : m.t >= G.tideSecondWaveS && m.t < G.tideSecondWaveS + G.tideWaveS ? 1 : -1;
          if (wave >= 0) {
            const local = wave === 0 ? m.t / G.tideWaveS : (m.t - G.tideSecondWaveS) / G.tideWaveS;
            add.fillStyle(0x6fe6ff, 0.55).fillRect(front - (front - 20) * local, FLOOR - 18, (front - 20) * local, 16);
          }
        }
        break;
      case "nova":
        for (const px of m.pillars) {
          if (m.stage === "tell") add.lineStyle(2, 0xfff1b8, 0.3 + 0.6 * p).strokeRect(px - G.bellPillarHalfWidth, 60, G.bellPillarHalfWidth * 2, FLOOR - 60);
          if (m.stage === "active") add.fillStyle(0xfff1b8, 0.55).fillRect(px - G.bellPillarHalfWidth, 60, G.bellPillarHalfWidth * 2, FLOOR - 60);
        }
        if (m.stage === "active") this.flash.setAlpha(0.7);
        break;
    }
  }

  private drawStage(): void {
    const g = this.stage;
    g.clear();
    const x0 = ARENA.bossMinX - 90;
    g.fillStyle(0x0a0a14, 0.92).fillRect(x0, PLATFORM_TOP, ARENA.width - x0, ARENA.platformY + 30);
    g.fillStyle(0x23203a, 1).fillRect(x0, PLATFORM_TOP, ARENA.width - x0, 3);
    g.fillStyle(0x0a0a14, 0.92).fillTriangle(x0 - 40, FLOOR, x0, PLATFORM_TOP, x0, FLOOR);
    g.fillStyle(0x000000, 0.35).fillRect(0, FLOOR, ARENA.width, ARENA.height - FLOOR);
  }

  private applyTierLook(fightIndex: number, animate: boolean): void {
    const look = tierLook(fightIndex);
    this.wash.setFillStyle(look.wash, look.washAlpha);
    this.warm.setFillStyle(look.warm, look.warmAlpha);
    if (animate) this.tweens.add({ targets: this.bgDawn, alpha: look.dawn, duration: 2500 });
    else this.bgDawn.setAlpha(look.dawn);
    getAudio().setTier(tierOf(fightIndex));
  }

  private drawDebug(): void {
    const s = this.session;
    const last = s.lastPlan;
    const src = last ? last.source + (last.fallbackReason ? ` (${last.fallbackReason})` : "") : "-";
    const nextLife = fixedLifeFor(s.fightIndex) ?? s.next.plan.next_life;
    this.debugText.setText(
      `planner ${s.planner.mode}  ·  last plan ${src}  ·  fight ${Math.min(s.fightIndex, 9)}  ·  bond ${s.state.bond}  ·  director ${s.state.directorAdjust >= 0 ? "+" : ""}${s.state.directorAdjust}  ·  next ${nextLife}  ·  1-9 jump  P phase two  B/N bond  H hitboxes  M mute`,
    );
    this.debugG.clear();
    const sim = this.sim;
    if (!this.showHitboxes || !sim) return;
    const g = this.debugG;
    const c = sim.ch;
    g.lineStyle(1, 0x00ff88, 1).strokeRect(c.x - 14, FLOOR - c.y - 52, 28, 52);
    g.lineStyle(1, 0xff4466, 1).strokeRect(sim.bossFront, PLATFORM_TOP - 200, ARENA.bossHalfWidth * 2, 200);
    const m = sim.boss.move;
    if (m && m.stage !== "recover") {
      g.lineStyle(1, 0xffcc00, 1);
      if (m.id === "cleave" && m.phase === 1) g.strokeRect(sim.bossFront - G.cleaveReach, FLOOR - G.cleaveHeight, G.cleaveReach, G.cleaveHeight);
      if (m.id === "cleave" && m.phase === 2) g.strokeRect(m.targetX - G.riftRadius, FLOOR - G.cleaveHeight, G.riftRadius * 2, G.cleaveHeight);
      if (m.id === "reap") g.strokeRect(0, FLOOR - G.floorHitHeight, sim.bossFront, G.floorHitHeight);
      if (m.id === "nova") g.strokeRect(0, 0, ARENA.width, ARENA.height);
    }
    for (const p of sim.projectiles) g.strokeCircle(p.x, FLOOR - p.y, p.kind === "glaive" ? G.throwRadius : G.wispRadius);
    g.lineStyle(1, 0x66aaff, 0.6).lineBetween(sim.prefX(), FLOOR, sim.prefX(), FLOOR - 20);
  }
}

export type { LifeId };
