// AI-use disclosure: Codex-authored staging and provisional dialogue for the three requested endings.
import Phaser from "phaser";
import type { Ending } from "../../core/run";
import type { LifeId } from "../../core/types";
import { getAudio } from "../audio";
import { PortraitDialogue, type DialogueLine } from "../dialogue";
import { FLOOR, poseActor, reflectActor, SpriteEffects, type Motion } from "../presentation";
import type { Session } from "../session";

type ActorState = { x: number; feet: number; facing: number; motion: Motion; fixed: number | null; alpha: number; height: number };
export class EndingScene extends Phaser.Scene {
  private session!: Session;
  private ending!: Ending | null;
  private life: LifeId = "patchwork";
  private king!: Phaser.GameObjects.Image;
  private visitor!: Phaser.GameObjects.Image;
  private kingReflection!: Phaser.GameObjects.Image;
  private visitorReflection!: Phaser.GameObjects.Image;
  private kingState!: ActorState;
  private visitorState!: ActorState;
  private dialogue!: PortraitDialogue;
  private effects!: SpriteEffects;
  private epoch = 0;
  private ready = false;
  private exiting = false;
  private wait: { timer: Phaser.Time.TimerEvent; resolve: () => void } | null = null;
  private returnKey: ((event: KeyboardEvent) => void) | null = null;
  private returnClick: (() => void) | null = null;

  constructor() { super("ending"); }
  init(data: { session: Session; ending: Ending | null; life: LifeId }): void {
    this.session = data.session;
    this.ending = data.ending ?? data.session.state.ending;
    this.life = data.life ?? "patchwork";
    this.ready = false; this.exiting = false;
  }
  create(): void {
    const epoch = ++this.epoch;
    getAudio().resolve();
    const kind = this.ending?.kind ?? "normal";
    const preferred = kind === "victory" ? "combat-aged-late" : "higgsfield-dawn";
    const background = this.textures.exists(preferred) ? preferred : this.textures.exists(kind === "victory" ? "higgsfield-arena" : "bg-dawn") ? kind === "victory" ? "higgsfield-arena" : "bg-dawn" : "bg-night";
    this.add.image(480, 270, background).setDisplaySize(960, 540);
    this.add.rectangle(480, FLOOR + 38, 960, 76, 0x172633, 0.25).setDepth(1);
    this.add.rectangle(480, FLOOR + 1, 960, 2, 0xb6d0c9, 0.25).setDepth(2);
    this.cameras.main.fadeIn(1200, kind === "victory" ? 6 : 229, kind === "victory" ? 13 : 213, kind === "victory" ? 26 : 184);
    this.kingReflection = this.add.image(730, FLOOR, "immortal-base").setDepth(3);
    this.visitorReflection = this.add.image(590, FLOOR, this.life).setDepth(3);
    this.king = this.add.image(730, FLOOR, "immortal-base").setDepth(4);
    this.visitor = this.add.image(590, FLOOR, this.life).setDepth(4);
    this.kingState = { x: 730, feet: FLOOR, facing: -1, motion: kind === "normal" ? "reap" : "idle", fixed: kind === "normal" ? 1 : null, alpha: 1, height: 143 };
    this.visitorState = { x: 590, feet: FLOOR, facing: 1, motion: kind === "victory" ? "reap" : "idle", fixed: kind === "victory" ? 4 : null, alpha: 1, height: 79 };
    if (kind === "do_nothing") this.king.setTint(0x636c7b);
    this.effects = new SpriteEffects(this);
    this.dialogue = new PortraitDialogue(this);
    const label = kind === "normal" ? "Normal Ending" : kind === "do_nothing" ? "Do Nothing Ending" : "Victory Ending";
    const title = this.add.text(480, 61, label, { fontFamily: "Georgia, serif", fontSize: "30px", color: "#ead8af" }).setOrigin(0.5).setAlpha(0).setDepth(20);
    this.tweens.add({ targets: title, alpha: 1, duration: 1000, delay: 600 });
    if (kind === "normal") this.dropCrown();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
    void this.finishStory(epoch, kind);
  }
  private lines(kind: "normal" | "do_nothing" | "victory"): DialogueLine[] {
    // PLACEHOLDER: Nicoh to review the final ending wording.
    if (kind === "normal") return [
      { speaker: "The Challenger", text: "You do not have to guard an empty room anymore.", portrait: this.life },
      { speaker: "The Immortal", text: "I cannot remember the sky without these windows.", portrait: "immortal-base" },
      { speaker: "The Challenger", text: "Then let us begin there.", portrait: this.life },
    ];
    if (kind === "do_nothing") return [
      { speaker: "The Challenger", text: "All those years, and you will not even answer.", portrait: this.life },
      { speaker: "The Challenger", text: "I thought there was someone left behind those eyes.", portrait: this.life },
      { speaker: "The Challenger", text: "Enough. Let the castle keep its silence.", portrait: this.life },
    ];
    return [
      { speaker: "The Challenger", text: "There is no life left in me that wants your crown.", portrait: this.life },
      { speaker: "The Immortal", text: "Then I have won.", portrait: "immortal-base" },
      { speaker: "The Challenger", text: "Yes. Keep it. I am going outside.", portrait: this.life },
    ];
  }
  private async finishStory(epoch: number, kind: "normal" | "do_nothing" | "victory"): Promise<void> {
    await this.pause(1000);
    if (!this.alive(epoch)) return;
    await this.dialogue.play(this.lines(kind), 2400);
    if (!this.alive(epoch)) return;
    if (kind === "normal") {
      this.visitorState.motion = "run"; this.visitorState.fixed = null;
      this.tweens.add({ targets: this.visitorState, x: 663, duration: 800, ease: "Sine.InOut" });
      await this.pause(800);
      if (!this.alive(epoch)) return;
      this.kingState.motion = "run"; this.kingState.fixed = null;
      this.kingState.facing = -1; this.visitorState.facing = -1;
      this.tweens.add({ targets: this.kingState, x: -90, duration: 4200, ease: "Sine.InOut" });
      this.tweens.add({ targets: this.visitorState, x: -165, duration: 4200, ease: "Sine.InOut" });
      await this.pause(4200);
    } else {
      this.visitorState.facing = -1; this.visitorState.motion = "run"; this.visitorState.fixed = null;
      this.tweens.add({ targets: this.visitorState, x: -100, duration: 4600, ease: "Sine.InOut" });
      if (kind === "do_nothing") this.tweens.add({ targets: this.kingState, alpha: 0.35, duration: 3600 });
      await this.pause(5000);
    }
    if (!this.alive(epoch)) return;
    const coda = kind === "normal" ? "At last, the doors open." : kind === "do_nothing" ? "The hall is silent again." : "The crown is still yours. The kingdom is empty.";
    this.add.rectangle(480, 488, 960, 104, 0x050c18, 0.9).setDepth(30);
    this.add.text(480, 476, coda, { fontFamily: "Georgia, serif", fontSize: "21px", color: "#e4dcc5", align: "center", wordWrap: { width: 820 } }).setOrigin(0.5).setDepth(31);
    this.add.text(480, 514, "[ Enter ]  Return to the castle", { fontFamily: "monospace", fontSize: "13px", color: "#aec5bd" }).setOrigin(0.5).setDepth(31);
    this.ready = true;
    this.returnKey = (event: KeyboardEvent): void => { if (event.code === "Enter" && !event.repeat) { event.preventDefault(); this.returnToMenu(); } };
    this.returnClick = (): void => this.returnToMenu();
    this.input.keyboard?.on("keydown", this.returnKey);
    this.input.on("pointerdown", this.returnClick);
  }
  private dropCrown(): void {
    const crown = this.add.graphics().setPosition(730, FLOOR - 137).setDepth(8);
    crown.fillStyle(0xe4c47a, 1).fillRect(-11, 0, 22, 5).fillRect(-11, -8, 4, 8).fillRect(-2, -11, 4, 11).fillRect(7, -8, 4, 8);
    crown.fillStyle(0xa47c48, 1).fillRect(-11, 4, 22, 2);
    this.tweens.add({ targets: crown, x: 648, y: FLOOR - 6, angle: -205, duration: 1800, delay: 400, ease: "Bounce.Out", onComplete: () => this.effects.burst(648, FLOOR - 4) });
  }
  private pause(ms: number): Promise<void> {
    return new Promise<void>(resolve => {
      const timer = this.time.delayedCall(ms, () => { this.wait = null; resolve(); });
      this.wait = { timer, resolve };
    });
  }
  private alive(epoch: number): boolean { return epoch === this.epoch && this.scene.isActive(); }
  private returnToMenu(): void {
    if (!this.ready || this.exiting) return;
    this.exiting = true;
    this.scene.start("title");
  }
  private cleanup(): void {
    this.epoch++;
    if (this.wait) {
      this.wait.timer.remove(false); this.time.removeEvent(this.wait.timer);
      const resolve = this.wait.resolve; this.wait = null; resolve();
    }
    this.dialogue?.dispose(); this.effects?.clear();
    if (this.returnKey) this.input.keyboard?.off("keydown", this.returnKey);
    if (this.returnClick) this.input.off("pointerdown", this.returnClick);
    this.returnKey = null; this.returnClick = null; this.ready = false;
  }
  override update(time: number, delta: number): void {
    if (!this.kingState || !this.visitorState) return;
    const frame = Math.floor(time / 140) % 6;
    poseActor(this, this.king, "player", this.kingState.motion, this.kingState.fixed ?? frame, this.kingState.x, this.kingState.feet, this.kingState.facing, this.kingState.height);
    poseActor(this, this.visitor, this.life, this.visitorState.motion, this.visitorState.fixed ?? frame, this.visitorState.x, this.visitorState.feet, this.visitorState.facing, this.visitorState.height);
    this.king.setAlpha(this.kingState.alpha); this.visitor.setAlpha(this.visitorState.alpha);
    reflectActor(this.king, this.kingReflection); reflectActor(this.visitor, this.visitorReflection);
    this.effects.update(Math.min(delta / 1000, 0.1));
  }
}
