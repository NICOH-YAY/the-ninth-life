// AI-use disclosure: Codex-authored lethal ending choreography, ruin reveal and provisional dialogue.
import Phaser from "phaser";
import type { Ending } from "../../core/run";
import type { LifeId } from "../../core/types";
import { getAudio } from "../audio";
import { PortraitDialogue, type DialogueLine } from "../dialogue";
import { FLOOR, poseActor, reflectActor, SpriteEffects, type Motion } from "../presentation";
import type { Session } from "../session";

type ActorState = { x: number; feet: number; facing: number; motion: Motion; fixed: number | null; alpha: number; height: number; angle: number };
type EndingKind = "normal" | "do_nothing" | "victory";
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
  private ruined = false;
  private readonly corpseColumns = new Map<string, [number, number, number][]>();
  private wait: { timer: Phaser.Time.TimerEvent; resolve: () => void } | null = null;
  private returnKey: ((event: KeyboardEvent) => void) | null = null;
  private returnClick: (() => void) | null = null;

  constructor() { super("ending"); }
  init(data: { session: Session; ending: Ending | null; life: LifeId }): void {
    this.session = data.session;
    this.ending = data.ending ?? data.session.state.ending;
    this.life = data.life ?? "patchwork";
    this.ready = false; this.exiting = false; this.ruined = false;
  }
  create(): void {
    const epoch = ++this.epoch;
    getAudio().resolve();
    const kind = this.ending?.kind ?? "normal";
    const background = this.textures.exists("combat-aged-late") ? "combat-aged-late" : this.textures.exists("higgsfield-arena") ? "higgsfield-arena" : "bg-night";
    this.add.image(480, 270, background).setDisplaySize(960, 540);
    this.add.rectangle(480, FLOOR + 38, 960, 76, 0x101623, 0.4).setDepth(1);
    this.add.rectangle(480, FLOOR + 1, 960, 2, 0x8ba1ac, 0.22).setDepth(1);
    this.cameras.main.fadeIn(650, 6, 13, 26);
    this.kingReflection = this.add.image(730, FLOOR, "immortal-base").setDepth(3);
    this.visitorReflection = this.add.image(590, FLOOR, this.life).setDepth(3);
    this.king = this.add.image(730, FLOOR, "immortal-base").setDepth(4);
    this.visitor = this.add.image(590, FLOOR, this.life).setDepth(4);
    this.kingState = { x: 730, feet: FLOOR, facing: -1, motion: "idle", fixed: null, alpha: 1, height: 143, angle: 0 };
    this.visitorState = { x: 560, feet: FLOOR, facing: 1, motion: "idle", fixed: null, alpha: 1, height: 79, angle: 0 };
    if (kind === "do_nothing") this.king.setTint(0x636c7b);
    this.effects = new SpriteEffects(this);
    this.dialogue = new PortraitDialogue(this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
    this.events.once(Phaser.Scenes.Events.DESTROY, () => this.cleanup());
    void this.finishStory(epoch, kind);
  }
  private lines(kind: EndingKind): DialogueLine[] {
    // Provisional authored dialogue for the user's lethal crown-and-consequence direction.
    if (kind === "normal") return [
      { speaker: "#? // ??", text: "Every road ends at your door. Every grave bears your seal.", portrait: this.life },
      { speaker: "The Immortal", text: "I held this kingdom together. There was no one else.", portrait: "immortal-base" },
      { speaker: "#? // ??", text: "Then die with it.", portrait: this.life },
    ];
    if (kind === "do_nothing") return [
      { speaker: "#? // ??", text: "Stand. Draw your weapon. Give me something to defeat.", portrait: this.life },
      { speaker: "The Immortal", text: "I have given this room everything.", portrait: "immortal-base" },
      { speaker: "#? // ??", text: "Then I will take what is left.", portrait: this.life },
    ];
    return [
      { speaker: "#? // ??", text: "Another life spent at your feet. Is that enough?", portrait: this.life },
      { speaker: "The Immortal", text: "You came for a crown. You knew its price.", portrait: "immortal-base" },
      { speaker: "#? // ??", text: "Keep it. There is nothing left to rule.", portrait: this.life },
    ];
  }
  private async finishStory(epoch: number, kind: EndingKind): Promise<void> {
    await this.pause(750);
    if (!this.alive(epoch)) return;
    await this.dialogue.play(this.lines(kind), 2400);
    if (!this.alive(epoch)) return;
    if (kind === "victory") await this.kingSurvives(epoch);
    else await this.kingDies(epoch);
    if (!this.alive(epoch)) return;
    const label = kind === "normal" ? "Normal Ending" : kind === "do_nothing" ? "Do Nothing Ending" : "Victory Ending";
    this.add.rectangle(480, 58, 342, 46, 0x07101c, 0.95).setStrokeStyle(1, 0x827b68).setDepth(29);
    this.add.text(480, 58, label, { fontFamily: "monospace", fontSize: "27px", color: "#e0cfaa" }).setOrigin(0.5).setDepth(30);
    const coda = kind === "normal" ? "The king is dead. His last decree burns the kingdom away." : kind === "do_nothing" ? "Silence did not spare you. Dawn finds a kingdom of ash." : "The last challenger is dead. The crown is still yours. Nothing else is.";
    this.add.rectangle(480, 488, 960, 104, 0x050c18, 0.95).setDepth(30);
    this.add.text(480, 476, coda, { fontFamily: "monospace", fontSize: "17px", color: "#e4dcc5", align: "center", wordWrap: { width: 850 } }).setOrigin(0.5).setDepth(31);
    this.add.text(480, 519, "[ Enter ]  Return to the castle", { fontFamily: "monospace", fontSize: "12px", color: "#aec5bd" }).setOrigin(0.5).setDepth(31);
    this.ready = true;
    this.returnKey = (event: KeyboardEvent): void => { if (event.code === "Enter" && !event.repeat) { event.preventDefault(); this.returnToMenu(); } };
    this.returnClick = (): void => this.returnToMenu();
    this.input.keyboard?.on("keydown", this.returnKey);
    this.input.on("pointerdown", this.returnClick);
  }
  private async kingDies(epoch: number): Promise<void> {
    this.visitorState.motion = "run";
    this.tweens.add({ targets: this.visitorState, x: 663, duration: 650, ease: "Cubic.In" });
    await this.pause(650);
    if (!this.alive(epoch)) return;
    this.visitorState.motion = "cleave"; this.visitorState.fixed = 1;
    getAudio().swing();
    this.effects.spawn(0, 704, FLOOR - 75, 170, 380, 1, 0xf4ad9f);
    await this.pause(180);
    if (!this.alive(epoch)) return;
    this.visitorState.fixed = 4;
    this.bloodAt(732, FLOOR - 85);
    this.kingState.motion = "reap"; this.kingState.fixed = 1;
    this.king.setTint(0xffb1b5);
    this.tweens.add({ targets: this.kingState, x: 758, feet: FLOOR + 10, angle: 12, duration: 230, ease: "Cubic.Out" });
    this.dropCrown();
    this.cameras.main.shake(180, 0.005);
    await this.pause(460);
    if (!this.alive(epoch)) return;
    this.king.clearTint();
    this.visitorState.motion = "throw"; this.visitorState.fixed = 2;
    getAudio().swing();
    this.effects.spawn(0, 744, FLOOR - 64, 200, 360, 1, 0xf6dcc2).setAngle(-20);
    await this.pause(160);
    if (!this.alive(epoch)) return;
    this.visitorState.fixed = 5;
    this.bloodAt(755, FLOOR - 65);
    this.cameras.main.shake(220, 0.007);
    this.tweens.add({ targets: this.kingState, x: 786, feet: FLOOR + 18, angle: 28, duration: 300 });
    await this.pause(500);
    if (!this.alive(epoch)) return;
    this.visitorState.motion = "idle"; this.visitorState.fixed = null;
    await this.dialogue.play([{ speaker: "The Immortal", text: "The crown takes everything. Even now.", portrait: "immortal-base" }], 2400);
    if (!this.alive(epoch)) return;
    this.kingState.motion = "nova"; this.kingState.fixed = null;
    this.king.setTint(0xdab7ff);
    getAudio().tell("nova", 1);
    this.effects.spawn(3, 776, FLOOR - 78, 230, 1000, 1, 0xd3afff);
    this.effects.spawn(5, 776, FLOOR - 78, 130, 850, 1, 0xffedb2);
    await this.pause(850);
    if (!this.alive(epoch)) return;
    this.lastNova();
    await this.pause(850);
    if (!this.alive(epoch)) return;
    // The white blast masks the destruction cut; no living character walks out of the hall.
    this.kingState.alpha = 0; this.visitorState.alpha = 0;
    this.showRuins();
    this.cameras.main.flash(1100, 255, 246, 218, true);
    await this.pause(2400);
  }
  private async kingSurvives(epoch: number): Promise<void> {
    this.kingState.motion = "cleave"; this.kingState.fixed = 1;
    getAudio().tell("cleave", 1);
    await this.pause(420);
    if (!this.alive(epoch)) return;
    this.kingState.fixed = 4;
    getAudio().swing();
    this.effects.spawn(0, 600, FLOOR - 65, 300, 500, -1, 0xb99cf9);
    await this.pause(140);
    if (!this.alive(epoch)) return;
    this.bloodAt(this.visitorState.x, FLOOR - 46);
    this.visitorState.motion = "reap"; this.visitorState.fixed = 4;
    this.visitor.setTint(0xf28f9b);
    this.cameras.main.shake(220, 0.006);
    this.tweens.add({ targets: this.visitorState, x: 486, feet: FLOOR - 20, angle: -86, duration: 450, ease: "Cubic.Out" });
    await this.pause(450);
    if (!this.alive(epoch)) return;
    this.tweens.add({ targets: this.visitorState, feet: FLOOR, duration: 250, ease: "Bounce.Out" });
    this.visitorState.motion = "idle"; this.visitorState.fixed = 0;
    this.visitor.setTint(0x626577);
    this.kingState.motion = "idle"; this.kingState.fixed = null;
    await this.pause(1000);
    if (!this.alive(epoch)) return;
    await this.dialogue.play([{ speaker: "The Immortal", text: "No one answers. Not even an echo.", portrait: "immortal-base" }], 2400);
    if (!this.alive(epoch)) return;
    this.add.rectangle(480, 270, 960, 540, 0x030813, 0.2).setDepth(17);
    await this.pause(750);
  }
  private bloodAt(x: number, y: number): void {
    getAudio().hit(true);
    this.effects.burst(x, y, true);
    this.effects.burst(x + 9, y + 18, true);
    const blood = this.add.graphics().setDepth(3);
    blood.fillStyle(0x6b2038, 0.9);
    for (let i = 0; i < 14; i++) {
      const dx = ((i * 23) % 65) - 30;
      blood.fillRect(x + dx, FLOOR - 1 + (i % 4) * 2, 3 + i % 7, 2);
    }
  }
  private lastNova(): void {
    getAudio().boom(1);
    this.cameras.main.shake(1200, 0.018);
    this.cameras.main.flash(250, 244, 218, 255, true);
    this.effects.spawn(3, 776, FLOOR - 75, 720, 1150, 1, 0xf3d9ff);
    const blast = this.add.graphics().setPosition(776, FLOOR - 75).setDepth(18);
    blast.lineStyle(8, 0xddb6ff, 1).strokeCircle(0, 0, 26);
    blast.lineStyle(3, 0xffe9ac, 1).strokeCircle(0, 0, 19);
    this.tweens.add({ targets: blast, scaleX: 45, scaleY: 45, alpha: 0, duration: 1350, ease: "Cubic.Out", onComplete: () => blast.destroy() });
    for (let i = 0; i < 28; i++) {
      const debris = this.add.rectangle(776, FLOOR - 75, 6 + i % 4 * 3, 3 + i % 3 * 3, i % 3 ? 0xb0a6bd : 0xf6dfab).setDepth(19);
      const angle = i * 2.39996;
      this.tweens.add({ targets: debris, x: 776 + Math.cos(angle) * (400 + i * 18), y: FLOOR - 75 + Math.sin(angle) * (240 + i * 11), angle: i * 51, alpha: 0, duration: 900 + i % 5 * 100, onComplete: () => debris.destroy() });
    }
  }
  private showRuins(): void {
    this.ruined = true;
    if (this.textures.exists("royal-dawn-ruins")) {
      this.add.image(480, 270, "royal-dawn-ruins").setDisplaySize(960, 540).setDepth(2);
      return;
    }
    // Pixel-authored dawn fallback: broken pillars and walls, open sky, no intact kingdom.
    const g = this.add.graphics().setDepth(2);
    const rect = (x: number, y: number, w: number, h: number, colour: number): void => { g.fillStyle(colour).fillRect(x * 3, y * 3, w * 3, h * 3); };
    rect(0, 0, 320, 180, 0xd6cbb0);
    rect(0, 83, 320, 44, 0xe3cd9e);
    for (let row = -20; row <= 20; row++) {
      const half = Math.floor(Math.sqrt(400 - row * row));
      rect(230 - half, 48 + row, half * 2 + 1, 1, 0xffefbf);
    }
    for (let i = 0; i < 36; i++) {
      const x = i * 9;
      const height = 3 + (i * 17 % 13);
      rect(x, 121 - height, 5 + i % 4, height, 0x8f8d84);
      if (i % 5 === 0) rect(x, 115 - height, 3, 7, 0x8f8d84);
    }
    rect(0, 126, 320, 54, 0x625e5c);
    rect(0, 146, 320, 34, 0x44454a);
    rect(16, 83, 15, 67, 0x424650); rect(16, 81, 8, 4, 0x424650);
    rect(291, 62, 13, 88, 0x424650); rect(296, 57, 8, 5, 0x424650);
    for (let i = 0; i < 24; i++) {
      const x = (i * 47 + 12) % 320, y = 143 + i * 7 % 25;
      rect(x, y, 4 + i % 7, 3 + i % 4, i % 3 ? 0x747079 : 0x9d9290);
    }
    rect(236, 144, 7, 2, 0xc6ac72); rect(237, 142, 1, 2, 0xc6ac72); rect(241, 142, 1, 2, 0xc6ac72);
  }
  private dropCrown(): void {
    const crown = this.add.graphics().setPosition(this.kingState.x, FLOOR - 137).setDepth(8);
    crown.fillStyle(0xe4c47a, 1).fillRect(-11, 0, 22, 5).fillRect(-11, -8, 4, 8).fillRect(-2, -11, 4, 11).fillRect(7, -8, 4, 8);
    crown.fillStyle(0xa47c48, 1).fillRect(-11, 4, 22, 2);
    this.tweens.add({ targets: crown, x: 827, y: FLOOR - 6, angle: 205, duration: 1200, ease: "Bounce.Out", onComplete: () => this.effects.burst(827, FLOOR - 4) });
    // The crown is caught in the final blast and cannot survive as a second intact crown.
    this.tweens.add({ targets: crown, alpha: 0, duration: 300, delay: 4700, onComplete: () => crown.destroy() });
  }
  private groundCorpse(image: Phaser.GameObjects.Image): void {
    // Standing feet pivots cease to describe floor contact after a death rotation.
    // Cache each opaque column's extremes instead of including transparent atlas padding.
    const frame = image.frame;
    const key = image.texture.key + ":" + frame.name;
    let columns = this.corpseColumns.get(key);
    if (!columns) {
      const canvas = document.createElement("canvas");
      canvas.width = frame.cutWidth; canvas.height = frame.cutHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(image.texture.getSourceImage() as CanvasImageSource, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, canvas.width, canvas.height);
      const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      columns = [];
      for (let x = 0; x < canvas.width; x++) {
        let top = canvas.height, bottom = -1;
        for (let y = 0; y < canvas.height; y++) {
          if (pixels[(y * canvas.width + x) * 4 + 3]! > 100) { top = Math.min(top, y); bottom = y; }
        }
        if (bottom >= 0) columns.push([x, top, bottom + 1]);
      }
      this.corpseColumns.set(key, columns);
    }
    const sin = Math.sin(image.rotation), cos = Math.cos(image.rotation);
    let lowest = -Infinity;
    for (const [x, top, bottom] of columns) {
      const left = image.flipX ? image.width - x - 1 : x;
      const right = left + 1;
      const localX = ((sin * image.scaleX >= 0 ? right : left) - image.displayOriginX) * image.scaleX;
      const localY = ((cos * image.scaleY >= 0 ? bottom : top) - image.displayOriginY) * image.scaleY;
      lowest = Math.max(lowest, localX * sin + localY * cos);
    }
    if (Number.isFinite(lowest)) image.setY(Math.round(FLOOR - lowest));
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
    this.tweens.killAll();
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
    this.king.setAlpha(this.kingState.alpha).setAngle(this.kingState.angle);
    this.visitor.setAlpha(this.visitorState.alpha).setAngle(this.visitorState.angle);
    if (this.visitorState.angle < -70 && this.visitorState.feet >= FLOOR - 1) this.groundCorpse(this.visitor);
    reflectActor(this.king, this.kingReflection); reflectActor(this.visitor, this.visitorReflection);
    if (this.ruined) { this.kingReflection.setAlpha(0); this.visitorReflection.setAlpha(0); }
    this.effects.update(Math.min(delta / 1000, 0.1));
  }
}
