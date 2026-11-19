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
  private phase = "entry";
  private phaseAt = 0;
  private alive = false;
  private actors = { heroX: 65, heroY: FLOOR, kingX: 802, kingY: FLOOR };
  private resolves: (() => void)[] = [];
  constructor() { super("opening"); }
  init(data: { session: Session }): void {
    this.session = data.session; this.phase = "entry";
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
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.alive = false; this.dialogue.dispose(); this.fx.clear(); this.resolves.splice(0).forEach(resolve => resolve());
    });
    this.cameras.main.fadeIn(700); getAudio().start();
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
    this.setPhase("crowned"); this.oldKing.setAlpha(0.3);
    this.fx.spawn(3, this.actors.heroX, FLOOR - 70, 420, 1500); getAudio().bell();
    this.cameras.main.flash(450, 150, 195, 205);
    await this.wait(1700); if (!this.alive) return;
    this.oldKing.setAlpha(0); this.setPhase("centuries");
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
    const motion = this.phase === "entry" ? "run" : this.phase === "duel" ? "cleave" : "idle";
    const frame = this.phase === "duel" ? Math.min(5, Math.floor(elapsed / 65)) : Math.floor(t * (motion === "run" ? 12 : 5)) % 6;
    poseActor(this, this.hero, crowned ? "player" : "alley", motion, frame, this.actors.heroX, this.actors.heroY, crowned ? -1 : 1, crowned ? 143 : 82);
    const oldMotion = this.phase === "fallen" || crowned ? "dash" : this.phase === "recoil" ? "jump" : this.phase === "duel" ? "cleave" : "idle";
    const oldFrame = oldMotion === "dash" ? Math.min(5, Math.floor(elapsed / 130)) : oldMotion === "cleave" ? Math.min(3, Math.floor(elapsed / 80)) : Math.floor(t * 5) % 6;
    poseActor(this, this.oldKing, "previous", oldMotion, oldFrame, this.actors.kingX, this.actors.kingY, -1, 146);
    reflectActor(this.hero, this.heroReflection); reflectActor(this.oldKing, this.oldReflection);
  }
}
