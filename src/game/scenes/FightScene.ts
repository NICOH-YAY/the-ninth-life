// AI-use disclosure: Codex-authored mobile combat presentation; deterministic rules stay in src/core.
import Phaser from "phaser";
import { ARENA, DT, BASE_MOVES, ASCENDED_MOVES, MOBILITY } from "../../core/config";
import type { FightSim, Projectile } from "../../core/fight";
import { NO_INPUT, type BossInput, type FightEvent, type LifeId, type BossMove } from "../../core/types";
import { makeBot, type BossBot } from "../../core/bots";
import { ROSTER } from "../../core/roster";
import { loadBindings, keyLabel, type Bindings } from "../controls";
import { PortraitDialogue, type DialogueLine } from "../dialogue";
import { FLOOR, LIFE_ORDER, SpriteEffects, poseActor, reflectActor, type Motion } from "../presentation";
import { getAudio } from "../audio";
import type { Session } from "../session";

type Mode = "arrival" | "fight" | "death" | "waiting" | "paused";
const YEARS = [1000, 1089, 1193, 1324, 1488, 1672, 1880, 2116, 2400];
const NAMES: Record<LifeId, string> = { kitten: "The Village Kitten", alley: "The Red Scarf", sailor: "The Stormwalker", acrobat: "The Bell Dancer", witch: "The Ash Witch", knight: "The Last Knight", thief: "The Silver Thief", quiet: "The Winter Visitor", patchwork: "The Mended One" };
// PLACEHOLDER: Nicoh to review. Authored scene facts, never generated during combat.
const ARRIVALS: Record<LifeId, [string, string]> = {
  kitten: ["The villages sent me. They say their king never leaves this castle.", "Then let me see what the villages have learned."],
  alley: ["All these winters. I still remember your blade.", "The scarf is new. The eyes are not."],
  sailor: ["The river moved. Your castle did not. Do you remember the sea?", "I hear it when the hall is quiet."],
  acrobat: ["You always strike low. I practiced above the bells.", "There were bells here once."],
  witch: ["The crown keeps every life you buried. I am one of them.", "I thought I had forgotten that voice."],
  knight: ["Your people are names carved into stone now. Come outside.", "The doors open for everyone but their king."],
  thief: ["I found the old king's warning beneath your throne.", "I heard it before I put the crown on."],
  quiet: ["I brought you a scarf. Winter has reached the broken roof.", "Stay a while. Then show me what you came to do."],
  patchwork: ["I have worn every life you left behind. This one is mine.", "Then neither of us will pretend this is easy."],
};

export class FightScene extends Phaser.Scene {
  private session!: Session;
  private sim: FightSim | null = null;
  private mode: Mode = "arrival";
  private bindings!: Bindings;
  private held = new Set<string>();
  private queued: Partial<BossInput> = {};
  private accumulator = 0;
  private hitstop = 0;
  private eventIndex = 0;
  private epoch = 0;
  private modeAt = 0;
  private autoplay = false;
  private speed = 1;
  private debug = false;
  private bot: BossBot | null = null;
  private released: object | null = null;
  private bg!: Phaser.GameObjects.Image;
  private aged!: Phaser.GameObjects.Image;
  private king!: Phaser.GameObjects.Image;
  private ch!: Phaser.GameObjects.Image;
  private kingReflection!: Phaser.GameObjects.Image;
  private chReflection!: Phaser.GameObjects.Image;
  private shield!: Phaser.GameObjects.Image;
  private enemyShield!: Phaser.GameObjects.Image;
  private ui!: Phaser.GameObjects.Graphics;
  private ground!: Phaser.GameObjects.Graphics;
  private healthLeft!: Phaser.GameObjects.Text;
  private healthRight!: Phaser.GameObjects.Text;
  private yearText!: Phaser.GameObjects.Text;
  private hint!: Phaser.GameObjects.Text;
  private waitingText!: Phaser.GameObjects.Text;
  private debugText!: Phaser.GameObjects.Text;
  private docks: Phaser.GameObjects.Text[] = [];
  private dialogue!: PortraitDialogue;
  private fx!: SpriteEffects;
  private projectileImages = new Map<Projectile, Phaser.GameObjects.Image>();

  constructor() { super("fight"); }
  init(data: { session: Session }): void {
    this.session = data.session; this.sim = null; this.held.clear(); this.queued = {};
    this.accumulator = 0; this.epoch++; this.projectileImages.clear(); this.released = null;
  }
  create(): void {
    const params = new URLSearchParams(location.search);
    this.autoplay = params.get("autoplay") === "1"; this.speed = Math.max(1, Math.min(8, Number(params.get("speed") ?? 1)));
    this.debug = params.get("debug") === "1"; this.bindings = loadBindings();
    this.bg = this.add.image(480, 270, "higgsfield-arena").setDisplaySize(960, 540);
    this.aged = this.add.image(480, 270, "combat-aged-mid").setDisplaySize(960, 540).setAlpha(0);
    this.ground = this.add.graphics().setDepth(1);
    this.kingReflection = this.add.image(800, FLOOR, "immortal-base").setDepth(2);
    this.chReflection = this.add.image(120, FLOOR, "kitten").setDepth(2);
    this.king = this.add.image(800, FLOOR, "immortal-base").setDepth(8);
    this.ch = this.add.image(-50, FLOOR, "kitten").setDepth(7);
    this.shield = this.add.image(800, FLOOR - 60, "combat-vfx", 30).setDepth(13).setVisible(false);
    this.enemyShield = this.add.image(120, FLOOR - 35, "combat-vfx", 30).setDepth(13).setVisible(false);
    this.ui = this.add.graphics().setDepth(40);
    const text = (x: number, y: number, size: number, color = "#d8e1dd") => this.add.text(x, y, "", { fontFamily: "monospace", fontSize: size + "px", color }).setDepth(42);
    this.healthLeft = text(28, 15, 13); this.healthRight = text(932, 15, 13).setOrigin(1, 0);
    this.yearText = text(480, 23, 12, "#cdbb92").setOrigin(0.5);
    this.hint = text(480, 73, 12, "#e1cb97").setOrigin(0.5);
    this.waitingText = text(480, 144, 27, "#e5d3b2").setOrigin(0.5).setAlpha(0);
    this.debugText = text(20, 482, 10, "#91a3b0").setVisible(this.debug);
    this.docks = [0, 1, 2, 3].map(i => text(330 + i * 98, 518, 10).setOrigin(0.5));
    this.dialogue = new PortraitDialogue(this); this.fx = new SpriteEffects(this);
    const down = (e: KeyboardEvent) => this.onKey(e);
    const up = (e: KeyboardEvent) => this.held.delete(e.code);
    const blur = () => { this.held.clear(); this.queued = {}; };
    this.input.keyboard?.on("keydown", down); this.input.keyboard?.on("keyup", up);
    this.game.events.on("blur", blur);
    this.input.keyboard?.addCapture("SPACE,UP,DOWN,LEFT,RIGHT");
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.epoch++; this.held.clear(); this.dialogue.dispose(); this.fx.clear();
      this.input.keyboard?.off("keydown", down); this.input.keyboard?.off("keyup", up); this.game.events.off("blur", blur);
    });
    this.cameras.main.fadeIn(500);
    void this.encounter();
  }

  private onKey(e: KeyboardEvent): void {
    this.held.add(e.code);
    if (e.repeat) return;
    if (this.debug && /^Digit[1-9]$/.test(e.code)) {
      this.epoch++; this.dialogue.hide(); this.fx.clear(); this.session.debugJump(Number(e.code.slice(-1)));
      this.projectileImages.forEach(image => image.destroy()); this.projectileImages.clear();
      void this.encounter(); return;
    }
    if (this.debug && e.code === "KeyP") this.sim?.debugForcePhase2();
    if (e.code === "Escape" && this.mode === "fight") { this.mode = "paused"; this.hint.setText("PAUSED — Enter resumes, T returns to the castle"); return; }
    if (this.mode === "paused") {
      if (e.code === "Enter" || e.code === "Escape") { this.mode = "fight"; this.hint.setText(""); this.held.clear(); }
      else if (e.code === "KeyT") this.scene.start("title");
      return;
    }
    if (this.mode !== "fight") return;
    for (const action of ["jump", "dash", "cleave", "throw", "reap", "nova"] as const) {
      if (e.code === this.bindings[action]) this.queued[action] = true;
    }
  }
  private readInput(): BossInput {
    if (this.autoplay && this.bot && this.sim) return this.bot(this.sim);
    const result: BossInput = { ...NO_INPUT, ...this.queued, cleave: !!this.queued.cleave || this.held.has(this.bindings.cleave), left: this.held.has(this.bindings.left), right: this.held.has(this.bindings.right),
      guard: this.held.has(this.bindings.guard), hold: this.held.has(this.bindings.hold) };
    this.queued = {}; return result;
  }
  private wait(ms: number): Promise<void> { return new Promise(resolve => this.time.delayedCall(ms, resolve)); }
  private async speak(lines: DialogueLine[], epoch: number): Promise<boolean> {
    if (!this.autoplay) await this.dialogue.play(lines, 2200);
    return epoch === this.epoch && this.scene.isActive();
  }

  private async encounter(): Promise<void> {
    const epoch = this.epoch;
    this.mode = "arrival"; this.modeAt = this.time.now;
    this.waitingText.setAlpha(0); this.dialogue.hide(); this.shield.setVisible(false); this.enemyShield.setVisible(false);
    this.sim = this.session.startFight(); this.eventIndex = 0; this.accumulator = 0; this.released = null;
    this.king.setAlpha(1); this.ch.setAlpha(1);
    const fi = this.session.fightIndex; const life = this.sim.setup.life;
    this.yearText.setText("YEAR " + YEARS[Math.min(8, fi - 1)]);
    this.healthLeft.setText(NAMES[life]); this.healthRight.setText("The Immortal");
    this.hint.setText("");
    const requestedBot = new URLSearchParams(location.search).get("bot") ?? "average";
    if (this.autoplay && requestedBot === "normal" && fi > 1) this.bot = () => ({ ...NO_INPUT, guard: true });
    else if (this.autoplay) {
      const profile = requestedBot === "victory" ? fi === 9 ? "spam_reap" : "aggressive" : requestedBot === "normal" ? "aggressive" :
        ["average", "aggressive", "defensive", "idle", "holder", "fighter", "spam_cleave", "spam_throw", "spam_reap", "spam_nova"].includes(requestedBot) ? requestedBot : "average";
      this.bot = makeBot(profile as Parameters<typeof makeBot>[0], this.session.state.seed + fi);
    } else this.bot = null;
    getAudio().setTier(fi <= 3 ? 1 : fi <= 6 ? 2 : 3); getAudio().phase2(false);
    const age = fi <= 3 ? 0 : fi <= 6 ? (fi - 3) / 3 : 1;
    this.aged.setTexture(fi >= 7 ? "combat-aged-late" : "combat-aged-mid").setDisplaySize(960, 540);
    this.aged.setAlpha(fi >= 7 ? Math.min(1, 0.5 + (fi - 7) * 0.25) : age);
    await this.wait(this.autoplay ? 250 : 1700);
    if (epoch !== this.epoch) return;
    const pair = ARRIVALS[life];
    if (!await this.speak([
      { speaker: NAMES[life], text: pair[0], portrait: life },
      { speaker: "THE IMMORTAL", text: pair[1], portrait: "immortal-base" },
    ], epoch)) return;
    if (fi === 1 && !await this.speak([
      { speaker: "THE VILLAGE KITTEN", text: "I cannot hurt you much. Show me a leap, a dash, and your guard.", portrait: "kitten" },
      { speaker: "THE IMMORTAL", text: "Watch the low wave. A king can move. The curse binds the castle, not the chair.", portrait: "immortal-base" },
    ], epoch)) return;
    this.mode = "fight"; this.modeAt = this.time.now; this.held.clear(); this.queued = {};
  }

  private async finishEncounter(): Promise<void> {
    if (!this.sim || this.mode !== "fight") return;
    const epoch = this.epoch; const sim = this.sim;
    this.mode = "death"; this.modeAt = this.time.now; this.hint.setText("");
    this.session.endFight();
    this.fx.burst(sim.outcome === "boss_dead" ? sim.boss.x : sim.ch.x, FLOOR - 45, true);
    await this.wait(this.autoplay ? 200 : 1100);
    if (epoch !== this.epoch) return;
    if (this.session.state.ending) {
      this.scene.start("ending", { session: this.session, ending: this.session.state.ending, life: sim.setup.life }); return;
    }
    this.mode = "waiting"; this.modeAt = this.time.now; this.dialogue.hide();
    this.shield.setVisible(false); this.enemyShield.setVisible(false);
    this.projectileImages.forEach(image => image.destroy()); this.projectileImages.clear();
    const oldYear = YEARS[Math.max(0, this.session.fightIndex - 2)]!;
    const nextYear = YEARS[Math.min(8, this.session.fightIndex - 1)]!;
    this.waitingText.setText((nextYear - oldYear) + " years pass.").setAlpha(0);
    this.tweens.add({ targets: this.waitingText, alpha: 1, duration: 1200, hold: 3300, yoyo: true });
    this.healthLeft.setText(""); this.ch.setAlpha(0);
    this.session.respond(true);
    const pending = this.session.resolveNext();
    await this.wait(this.autoplay ? 200 : 7000);
    if (epoch !== this.epoch) return;
    await pending;
    if (epoch !== this.epoch) return;
    await this.encounter();
  }

  private event(e: FightEvent): void {
    if (!this.sim) return;
    const sim = this.sim;
    if (e.type === "boss_move") getAudio().tell(e.move, e.phase);
    if (e.type === "challenger_hit") {
      this.fx.burst(sim.ch.x, FLOOR - sim.ch.y - 35, true); this.hitstop = 0.035;
      this.cameras.main.shake(90, 0.0025); getAudio().hit(e.dmg > 25);
    }
    if (e.type === "boss_hit") { this.fx.burst(sim.boss.x, FLOOR - sim.boss.y - 65, true); this.hitstop = 0.025; getAudio().hit(false); }
    if (e.type === "boss_block") { this.fx.spawn(5, sim.boss.x, FLOOR - sim.boss.y - 65, 175, 300); getAudio().bell(); }
    if (e.type === "dash") { this.fx.spawn(0, sim.boss.x, FLOOR - sim.boss.y - 35, 150, 240, -sim.boss.facing, 0x8bd5df); getAudio().evade(); }
    if (e.type === "jump") this.fx.spawn(5, sim.boss.x, FLOOR - 8, 80, 220);
    if (e.type === "phase2_start") { getAudio().phase2(true); this.cameras.main.flash(180, 150, 210, 210); this.fx.spawn(3, sim.boss.x, FLOOR - 80, 380, 1100); this.cameras.main.shake(400, 0.005); }
    if (e.type === "evade") this.fx.spawn(5, sim.ch.x, FLOOR - sim.ch.y - 30, 80, 200);
    if (e.type === "enemy_ability") this.fx.spawn(sim.ch.life === "sailor" || sim.ch.life === "knight" ? 5 : 4, sim.ch.x, FLOOR - sim.ch.y - 35, 95, 460);
    if (e.type === "boredom") this.fx.spawn(4, sim.boss.x, FLOOR - 60, 350, 700);
  }

  override update(_time: number, delta: number): void {
    const dt = Math.min(0.05, delta / 1000); this.fx?.update(dt);
    const sim = this.sim; if (!sim) return;
    if (this.mode === "arrival") {
      if (sim.ch.state === "enter") for (let i = 0; i < 2 && sim.ch.state === "enter"; i++) sim.step(NO_INPUT);
      // Arrival and portrait dialogue freeze combat rather than secretly dealing damage.
    } else if (this.mode === "fight") {
      if (this.hitstop > 0) this.hitstop -= dt;
      else {
        this.accumulator += dt * this.speed;
        while (this.accumulator >= DT && !sim.outcome) { sim.step(this.readInput()); this.accumulator -= DT; }
      }
      while (this.eventIndex < sim.events.length) this.event(sim.events[this.eventIndex++]!);
      if (sim.outcome) void this.finishEncounter();
    }
    this.render(sim);
  }

  private render(sim: FightSim): void {
    const t = this.time.now / 1000, b = sim.boss, c = sim.ch;
    const move = b.move;
    let kingMotion: Motion = b.dashT > 0 ? "dash" : !b.grounded ? "jump" : Math.abs(b.vx) > 10 ? "run" : "idle";
    let kingFrame = Math.floor(t * (kingMotion === "run" ? 12 : 6)) % 6;
    if (move) {
      kingMotion = move.id;
      const duration = move.stage === "tell" ? move.spec.tellS : move.stage === "active" ? move.spec.activeS : move.spec.recoverS;
      const progress = Math.min(0.999, move.t / duration);
      kingFrame = move.stage === "tell" ? Math.min(2, Math.floor(progress * 3)) : move.stage === "active" ? 3 + Math.min(1, Math.floor(progress * 2)) : 5;
    }
    let kx = b.x, ky = FLOOR - b.y;
    if (this.mode === "waiting") {
      const p = Math.min(1, (this.time.now - this.modeAt) / 1600);
      kx = Phaser.Math.Linear(b.x, 880, p); ky = Phaser.Math.Linear(FLOOR - b.y, 385, p);
      kingMotion = p < 1 ? "run" : "idle"; kingFrame = Math.floor(t * (p < 1 ? 10 : 3)) % 6;
    }
    if (this.mode === "arrival") {
      const p = Math.min(1, (this.time.now - this.modeAt) / 1300);
      kx = Phaser.Math.Linear(880, b.x, p); ky = Phaser.Math.Linear(385, FLOOR - b.y, p);
      if (p < 1) { kingMotion = "run"; kingFrame = Math.floor(t * 10) % 6; }
    }
    if (b.phase === 2 && b.grounded && this.mode !== "waiting") ky -= 10 + Math.sin(t * 3) * 3;
    poseActor(this, this.king, this.mode === "waiting" && this.time.now - this.modeAt >= 1600 ? "rest" : b.phase === 2 ? "ascended" : "player", kingMotion, kingFrame, kx, ky, move?.direction ?? b.facing, 143);
    if (b.transitionT > 0) {
      const progress = 1 - b.transitionT / sim.cfg.phase2.PHASE2_TRANSITION_S;
      const frame = Math.min(11, Math.floor(progress * 12));
      const key = "immortal-transform:" + (frame < 6 ? "idle" : "run") + ":" + frame % 6;
      if (this.textures.exists(key)) this.king.setTexture(key).setOrigin(0.5, 71 / 72).setScale(170 / 72);
    }
    this.king.setTint(b.hitFlashT > 0 ? 0xffb2c8 : 0xffffff);
    let cm: Motion = c.y > 3 ? "jump" : c.abilityTellT > 0 || c.state === "attack" || c.attackFlashT > 0 ? "cleave" :
      ["approach", "enter", "backoff", "flee", "leave", "evade"].includes(c.state) ? "run" : "idle";
    let cf = Math.floor(t * 10) % 6;
    if (c.abilityTellT > 0) cf = 1 + Math.floor((1 - c.abilityTellT / (c.life === "kitten" ? 0.85 : 0.48)) * 2);
    else if (c.attackFlashT > 0) cf = 3 + Math.min(2, Math.floor((1 - c.attackFlashT / 0.18) * 3));
    if (c.state === "hitstun") { cm = "cleave"; cf = 5; }
    poseActor(this, this.ch, c.life, cm, cf, c.x, FLOOR - c.y, b.x > c.x ? 1 : -1, c.life === "kitten" ? 61 : c.life === "patchwork" ? 85 : 78);
    if (this.mode === "death" && sim.outcome !== "boss_dead") this.ch.setAlpha(Math.max(0, 1 - (this.time.now - this.modeAt) / 900));
    else if (this.mode !== "waiting") this.ch.setAlpha(c.iframes > 0 ? 0.65 : 1);
    this.ch.setTint(c.hitFlashT > 0 ? 0xffb2bf : 0xffffff);
    this.shield.setVisible(b.guarding && this.mode === "fight").setPosition(b.x, FLOOR - b.y - 66).setFrame(30 + Math.floor(t * 10) % 6).setDisplaySize(170, 170).setAlpha(0.8);
    this.enemyShield.setVisible(c.blockT > 0).setPosition(c.x, FLOOR - c.y - 37).setFrame(30 + Math.floor(t * 10) % 6).setDisplaySize(115, 115).setAlpha(0.85);
    if (move?.stage === "active" && move !== this.released) {
      this.released = move;
      const row = move.id === "nova" ? 3 : move.id === "throw" ? 1 : move.id === "reap" ? 2 : 0;
      this.fx.spawn(row, move.id === "cleave" && b.phase === 2 ? move.targetX : b.x + move.direction * 60, FLOOR - b.y - 55, move.id === "nova" ? 600 : 240, move.id === "nova" ? 600 : 340, move.direction);
      getAudio().swing();
    }
    if (c.attackFlashT > 0 && c.attackSerial !== this.lastAttackSerial) {
      this.lastAttackSerial = c.attackSerial;
      this.fx.spawn(4, c.x + (b.x > c.x ? 38 : -38), FLOOR - c.y - 35, 155, 280, b.x > c.x ? 1 : -1);
    }
    reflectActor(this.king, this.kingReflection); reflectActor(this.ch, this.chReflection);
    this.drawProjectiles(sim, t);
    this.ground.clear().fillStyle(0x00040e, 0.32);
    if (this.mode !== "waiting") this.ground.fillEllipse(b.x, FLOOR + 1, Math.max(22, 72 - b.y * 0.2), 9);
    if (c.state !== "dead" && this.mode !== "waiting") this.ground.fillEllipse(c.x, FLOOR + 1, Math.max(16, 40 - c.y * 0.15), 6);
    this.ground.lineStyle(1, 0x79959c, 0.12);
    for (let i = 0; i < 12; i++) { const x = (i * 83 + Math.sin(t * 0.5 + i) * 7) % 960; this.ground.lineBetween(x, FLOOR + 10 + i % 4 * 11, x + 28 + i % 3 * 15, FLOOR + 10 + i % 4 * 11); }
    this.drawHUD(sim);
  }
  private lastAttackSerial = -1;
  private drawProjectiles(sim: FightSim, t: number): void {
    const living = new Set(sim.projectiles);
    this.projectileImages.forEach((image, p) => { if (!living.has(p)) { image.destroy(); this.projectileImages.delete(p); } });
    for (const p of sim.projectiles) {
      let image = this.projectileImages.get(p);
      if (!image) { image = this.add.image(p.x, FLOOR - p.y, "combat-vfx", 0).setDepth(14); this.projectileImages.set(p, image); }
      const row = p.kind === "glaive" ? 1 : p.kind === "blade" || p.kind === "enemy-wave" ? 2 : 3;
      image.setFrame(row * 6 + Math.floor(t * 15) % 6).setPosition(p.x, FLOOR - p.y).setFlipX(p.vx < 0);
      const wave = p.kind === "blade" || p.kind === "enemy-wave";
      image.setDisplaySize(wave ? 215 : p.kind === "glaive" ? 118 : 76, wave ? 120 : p.kind === "glaive" ? 118 : 76);
      if (p.kind === "enemy-wave" || p.kind === "enemy-orb") image.setTint(0xffa1ba); else image.clearTint();
    }
  }
  private drawHUD(sim: FightSim): void {
    const b = sim.boss, c = sim.ch;
    const visible = this.mode !== "waiting";
    this.docks.forEach(label => label.setVisible(visible));
    this.healthLeft.setVisible(visible); this.healthRight.setVisible(visible); this.hint.setVisible(visible);
    this.debugText.setVisible(this.debug && visible);
    if (!visible) { this.ui.clear(); return; }
    this.ui.clear().fillStyle(0x07101f, 0.86);
    this.ui.fillRect(26, 37, 245, 10).fillRect(630, 37, 304, 10);
    this.ui.fillStyle(ROSTER[c.life].color === 0x1c1c22 ? 0x9ab4c6 : ROSTER[c.life].color, 1).fillRect(28, 39, 241 * Math.max(0, c.hp / c.maxHp), 6);
    this.ui.fillStyle(b.phase === 2 ? 0x8df5cd : 0xb29ce1, 1).fillRect(632, 39, 300 * Math.max(0, b.hp / b.maxHp), 6);
    this.ui.fillStyle(0x7799bd, 1).fillRect(632, 53, 180 * b.guardEnergy, 3);
    const moves: BossMove[] = ["cleave", "throw", "reap", "nova"];
    moves.forEach((move, i) => {
      const cd = move === "nova" ? Math.max(0, sim.novaChargeNeeded() - b.novaCharge) : b.cooldowns[move];
      const full = move === "nova" ? sim.novaChargeNeeded() : (b.phase === 2 ? ASCENDED_MOVES[move].cooldownS * sim.cfg.phase2.PHASE2_COOLDOWN_MULT : BASE_MOVES[move].cooldownS);
      const x = 282 + i * 98;
      this.ui.fillStyle(0x091526, 0.95).fillRect(x, 502, 94, 29);
      this.ui.lineStyle(1, cd <= 0 ? 0x9bc8b4 : 0x3b4b63, 1).strokeRect(x, 502, 94, 29);
      this.ui.fillStyle(cd <= 0 ? 0x94d3ba : 0x647da1, 1).fillRect(x + 2, 527, 90 * Math.max(0, 1 - cd / full), 2);
      this.docks[i]!.setText(keyLabel(this.bindings[move]) + " " + (cd > 0 ? cd.toFixed(1) : move.toUpperCase())).setColor(cd > 0 ? "#8796ac" : "#d8e9da");
    });
    if (this.mode === "fight") {
      if (sim.setup.life === "kitten" && !sim.tutorialComplete) this.hint.setText(
        (b.jumps ? "✓ " : "") + keyLabel(this.bindings.jump) + " JUMP   " + (b.dashes ? "✓ " : "") + keyLabel(this.bindings.dash) + " DASH   " + (b.blocks ? "✓ " : "") + keyLabel(this.bindings.guard) + " BLOCK A HIT");
      else if (b.inactivityT > 30) this.hint.setText("The visitor lowers its blade. \"Will you answer me?\"");
      else this.hint.setText("");
    }
    this.debugText.setText("mode " + this.session.planner.mode + "  life " + sim.setup.fightIndex + "  JUMP " + b.jumps + " DASH " + b.dashes + " BLOCK " + b.blocks + "  1–9 encounter  P ascend");
  }
}
