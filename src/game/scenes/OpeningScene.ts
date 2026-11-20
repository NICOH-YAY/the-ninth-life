// AI-use disclosure: Codex-authored previous-king battle and provisional dialogue for Nicoh.
import Phaser from "phaser";
import type { Session } from "../session";
import { PortraitDialogue } from "../dialogue";
import { FLOOR, SpriteEffects, poseActor, reflectActor } from "../presentation";
import { getAudio } from "../audio";

export class OpeningScene extends Phaser.Scene {
  private session!: Session;
  private hero!: Phaser.GameObjects.Image;
  private oldKing!: Phaser.GameObjects.Image;
  private heroReflection!: Phaser.GameObjects.Image;
  private oldReflection!: Phaser.GameObjects.Image;
  private dialogue!: PortraitDialogue;
  private fx!: SpriteEffects;
  private crown!: Phaser.GameObjects.Graphics;
  private coronationFrame = 0;
  private crownPose = { x: 800, y: FLOOR - 6, alpha: 0, angle: 0 };
  private phase = "entry";
  private phaseAt = 0;
  private alive = false;
  private actors = { heroX: 65, heroY: FLOOR, kingX: 802, kingY: FLOOR };
  private resolves: (() => void)[] = [];
  constructor() { super("opening"); }
  init(data: { session: Session }): void {
    this.session = data.session; this.phase = "entry"; this.coronationFrame = 0;
    this.crownPose = { x: 800, y: FLOOR - 6, alpha: 0, angle: 0 };
    this.actors = { heroX: 65, heroY: FLOOR, kingX: 802, kingY: FLOOR }; this.resolves = [];
  }
  create(): void {
    this.alive = true; this.phaseAt = this.time.now;
    this.add.image(480, 270, "higgsfield-arena").setDisplaySize(960, 540);
    this.heroReflection = this.add.image(65, FLOOR, "alley").setDepth(2);
    this.oldReflection = this.add.image(802, FLOOR, "immortal-base").setDepth(2);
    this.hero = this.add.image(65, FLOOR, "alley").setDepth(7);
    this.oldKing = this.add.image(802, FLOOR, "immortal-base").setDepth(7);
    this.add.rectangle(480, 14, 960, 28, 0x040912).setDepth(20);
    this.add.text(30, 13, "BEFORE THE THOUSAND YEARS", { fontFamily: "monospace", fontSize: "10px", color: "#bfbaaa" }).setDepth(21).setOrigin(0, 0.5);
    this.fx = new SpriteEffects(this); this.dialogue = new PortraitDialogue(this);
    this.crown = this.add.graphics().setDepth(12).setAlpha(0);
    this.crown.fillStyle(0xffe8a0).fillRect(-13, 0, 26, 5).fillRect(-13, -9, 4, 9).fillRect(-2, -13, 4, 13).fillRect(9, -9, 4, 9);
    this.crown.fillStyle(0xb67b3c).fillRect(-13, 5, 26, 3);
    this.crown.fillStyle(0xa3355f).fillRect(-2, 1, 4, 3);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.alive = false; this.dialogue.dispose(); this.fx.clear(); this.resolves.splice(0).forEach(resolve => resolve());
    });
    this.cameras.main.fadeIn(700); getAudio().start(); getAudio().soundtrack("years");
    void this.run();
  }
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      this.resolves.push(resolve);
      this.time.delayedCall(ms, () => { this.resolves = this.resolves.filter(r => r !== resolve); resolve(); });
    });
  }
  private setPhase(value: string): void { this.phase = value; this.phaseAt = this.time.now; }
  private async run(): Promise<void> {
    this.tweens.add({ targets: this.actors, heroX: 425, duration: 1400, ease: "Sine.Out" });
    await this.wait(1450); if (!this.alive) return;
    this.setPhase("challenge");
    await this.dialogue.play([{ speaker: "THE CHALLENGER — YOU", text: "I came for your crown.", portrait: "alley" }], 2000);
    if (!this.alive) return;
    for (let hit = 0; hit < 3; hit++) {
      this.setPhase("duel");
      this.tweens.add({ targets: this.actors, heroX: 720 + hit * 20, duration: 300, ease: "Cubic.Out" });
      this.tweens.add({ targets: this.actors, heroY: FLOOR - (hit === 1 ? 100 : 28), duration: 200, yoyo: true, ease: "Sine.Out" });
      this.fx.spawn(0, 750, FLOOR - 70, 260, 440, 1);
      await this.wait(300); if (!this.alive) return;
      getAudio().hit(true); this.fx.burst(this.actors.kingX, FLOOR - 65, true);
      this.actors.kingX = Math.min(880, this.actors.kingX + 22);
      this.cameras.main.shake(110, 0.004);
      this.setPhase(hit === 2 ? "fallen" : "recoil");
      await this.wait(hit === 2 ? 500 : 400); if (!this.alive) return;
    }
    await this.dialogue.play([
      { speaker: "THE FALLEN KING", text: "Ha... Another fool who thinks he has won a kingdom.", portrait: "previous-king-portrait" },
      { speaker: "THE FALLEN KING", text: "Take the crown. Walk every inch of this hall. Its doors will never open for you.", portrait: "previous-king-portrait" },
      { speaker: "THE FALLEN KING", text: "Every life you buried will come for it. You will learn their faces.", portrait: "previous-king-portrait" },
      { speaker: "YOU", text: "It doesn't matter. I will be a better king.", portrait: "alley" },
    ], 2100);
    if (!this.alive) return;
    // The crown is a physical object: reach, lift, consider, then choose to wear it.
    this.setPhase("crown-reach"); this.oldKing.setAlpha(0.3);
    this.crownPose = { x: this.actors.kingX - 34, y: FLOOR - 6, alpha: 1, angle: -0.13 };
    this.tweens.add({ targets: this.actors, heroX: this.crownPose.x - 30, duration: 380, ease: "Sine.Out" });
    await this.wait(380); if (!this.alive) return;
    this.coronationFrame = 1;
    this.tweens.add({ targets: this.crownPose, x: this.actors.heroX + 18, y: FLOOR - 48, angle: 0, duration: 650, ease: "Cubic.InOut" });
    await this.wait(650); if (!this.alive) return;
    this.setPhase("crown-hold"); this.coronationFrame = 3;
    await this.dialogue.play([{ speaker: "YOU", text: "A crown is only a weight. I can carry it.", portrait: "alley", cue: "opening.crown-held" }], 1800);
    if (!this.alive) return;
    this.setPhase("crown-don"); this.coronationFrame = 5;
    this.tweens.add({ targets: this.crownPose, x: this.actors.heroX, y: FLOOR - 87, duration: 750, ease: "Sine.InOut" });
    await this.wait(750); if (!this.alive) return;
    this.setPhase("crowned");
    this.coronationFrame = 7;
    this.fx.spawn(3, this.actors.heroX, FLOOR - 70, 420, 1600); getAudio().bell();
    this.cameras.main.shake(450, 0.004);
    this.tweens.add({ targets: this.crownPose, y: FLOOR - 137, alpha: 0, duration: 850, ease: "Cubic.In" });
    await this.wait(850); if (!this.alive) return;
    this.coronationFrame = 10;
    this.cameras.main.flash(350, 188, 147, 255);
    await this.wait(700); if (!this.alive) return;    this.oldKing.setAlpha(0); this.setPhase("centuries");
    this.tweens.add({ targets: this.actors, heroX: 850, heroY: 385, duration: 1700, ease: "Sine.InOut" });
    const years = this.add.text(480, 150, "ONE THOUSAND YEARS LATER", { fontFamily: "Georgia, serif", fontSize: "27px", color: "#e7d4ad", letterSpacing: 2 }).setOrigin(0.5).setAlpha(0).setDepth(30);
    this.tweens.add({ targets: years, alpha: 1, duration: 1600 });
    await this.wait(3300); if (!this.alive) return;
    await this.dialogue.play([{ speaker: "THE IMMORTAL", text: "My kingdom is dust. Still, someone climbs the steps.", portrait: "immortal-base" }], 2300);
    if (this.alive) this.scene.start("fight", { session: this.session });
  }
  override update(time: number, delta: number): void {
    const t = time / 1000; this.fx?.update(Math.min(0.05, delta / 1000));
    const elapsed = time - this.phaseAt;
    const crowned = this.phase === "crowned" || this.phase === "centuries";
    const lifting = this.phase === "crown-reach" || this.phase === "crown-hold" || this.phase === "crown-don";
    const motion = this.phase === "entry" ? "run" : this.phase === "duel" ? "cleave" : lifting ? "reap" : "idle";
    const frame = this.phase === "duel" ? Math.min(5, Math.floor(elapsed / 65)) : Math.floor(t * (motion === "run" ? 12 : 5)) % 6;
    poseActor(this, this.hero, crowned ? "player" : "alley", motion, frame, this.actors.heroX, this.actors.heroY, crowned ? -1 : 1, crowned ? 143 : 82);
    const coronating = lifting || this.phase === "crowned";
    if (coronating && this.textures.exists("gothic-coronation")) {
      const progressFrame = this.phase === "crown-hold" ? 3 + Math.floor(elapsed / 850) % 2 : this.phase === "crown-don" ? 5 + Math.min(2, Math.floor(elapsed / 300)) : this.phase === "crowned" ? Math.min(11, 7 + Math.floor(elapsed / 280)) : Math.min(2, Math.floor(elapsed / 350));
      this.hero.setTexture("gothic-coronation", progressFrame).setOrigin(0.5, 154 / 192)
        .setPosition(this.actors.heroX, this.actors.heroY).setFlipX(false).setScale(1.35);
      this.crown.setVisible(false);
    } else {
      this.crown.setVisible(true).setPosition(Math.round(this.crownPose.x), Math.round(this.crownPose.y))
        .setAlpha(this.crownPose.alpha).setRotation(this.crownPose.angle);
      if (lifting) poseActor(this, this.hero, "alley", "reap", this.phase === "crown-reach" ? 1 : 2, this.actors.heroX, this.actors.heroY, 1, 82);
    }
    const oldMotion = this.phase === "fallen" || crowned || lifting ? "dash" : this.phase === "recoil" ? "jump" : this.phase === "duel" ? "cleave" : "idle";
    const oldFrame = lifting ? 5 : oldMotion === "dash" ? Math.min(5, Math.floor(elapsed / 130)) : oldMotion === "cleave" ? Math.min(3, Math.floor(elapsed / 80)) : Math.floor(t * 5) % 6;
    poseActor(this, this.oldKing, "previous", oldMotion, oldFrame, this.actors.kingX, this.actors.kingY, -1, 146);
    reflectActor(this.hero, this.heroReflection); reflectActor(this.oldKing, this.oldReflection);
  }
}
