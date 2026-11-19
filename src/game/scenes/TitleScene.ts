// AI-use disclosure: Codex-authored menu and credits, continuing the existing game.
import Phaser from "phaser";
import { getAudio } from "../audio";
import { Session } from "../session";
import { pixelFrame } from "../pixel";

export class TitleScene extends Phaser.Scene {
  private credits = false;
  private started = false;
  private cat!: Phaser.GameObjects.Image;
  constructor() { super("title"); }
  create(): void {
    this.started = false; this.credits = false;
    this.add.image(480, 270, this.textures.exists("higgsfield-arena") ? "higgsfield-arena" : "bg-night").setDisplaySize(960, 540);
    this.add.rectangle(250, 270, 520, 540, 0x081020, 0.88);
    this.add.text(76, 92, "A THRONE. A THOUSAND YEARS.", { fontFamily: "monospace", fontSize: "12px", color: "#a6b8bc", letterSpacing: 2 });
    this.add.text(72, 138, "THE\nNINTH LIFE", { fontFamily: "Georgia, serif", fontSize: "66px", color: "#e9e1c8", lineSpacing: -8 });
    this.add.rectangle(78, 306, 50, 2, 0xa6c5ba).setOrigin(0);
    this.add.text(76, 330, "How long can you hold on?", { fontFamily: "Georgia, serif", fontSize: "19px", color: "#a6b8bc" });
    this.cat = this.add.image(790, 420, "immortal-base").setOrigin(0.5, 1);
    this.cat.setScale(224 / this.cat.height);
    const button = (label: string, y: number, fn: () => void): void => {
      const t = this.add.text(76, y, label, { fontFamily: "monospace", fontSize: "19px", color: "#dbe7d1" }).setPadding(0, 9, 36, 9).setInteractive({ useHandCursor: true });
      t.on("pointerover", () => t.setColor("#f3d58d")); t.on("pointerout", () => t.setColor("#dbe7d1")); t.on("pointerdown", fn);
    };
    button("[ Enter ]  Play", 386, () => this.play());
    button("[ C ]      Attributions", 432, () => this.showCredits());
    this.add.text(76, 507, "A / D  MOVE     J / K / L / SPACE  ATTACK     M  SOUND", { fontFamily: "monospace", fontSize: "10px", color: "#8b9ba9" });
    this.input.keyboard?.on("keydown", (e: KeyboardEvent) => {
      if (e.key === "Escape" && this.credits) this.scene.restart();
      else if (e.key.toLowerCase() === "c" && !this.credits) this.showCredits();
      else if (e.key === "Enter" && !this.credits) this.play();
    });
    if (new URLSearchParams(location.search).get("autoplay") === "1") this.time.delayedCall(600, () => this.play());
  }
  private play(): void {
    if (this.started || this.credits) return;
    this.started = true; getAudio().start();
    const session = new Session(location.search);
    this.scene.start(new URLSearchParams(location.search).get("autoplay") === "1" ? "fight" : "opening", { session });
  }
  private showCredits(): void {
    if (this.credits || this.started) return;
    this.credits = true;
    this.add.rectangle(480, 270, 860, 470, 0x0a1221, 0.98).setStrokeStyle(1, 0x677d85);
    this.add.text(100, 78, "ATTRIBUTIONS", { fontFamily: "monospace", fontSize: "25px", color: "#ead8af" });
    this.add.text(100, 137, ["The Ninth Life — a game by Nicoh", "", "Design inspiration: The Dark Queen of Mortholme, by Mosu.", "Mood references: Scaredy Cats, Ori, dark fantasy environments.", "Reference characters and compositions are not reproduced.", "", "Original concept images: Higgsfield (z_image).", "Pixel asset generation: Higgsfield; details in ATTRIBUTION.md.", "Pixel rigs / effects: code authored with Codex.", "Prototype code and procedural audio: Claude Code; revisions: Codex.", "Engine: Phaser 3 (MIT). Full asset log: ATTRIBUTION.md."].join("\n"), { fontFamily: "monospace", fontSize: "14px", color: "#bdcbd0", lineSpacing: 5 });
    const back = this.add.text(100, 452, "[ Esc ]  Back", { fontFamily: "monospace", fontSize: "17px", color: "#f3d58d" }).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => this.scene.restart());
  }
  override update(time: number): void { this.cat?.setTexture(pixelFrame("immortal-base", "idle", time / 1000)); }
}
