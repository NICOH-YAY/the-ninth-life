// AI-use disclosure: Codex-authored portrait dialogue presentation and cancellation handling.
import Phaser from "phaser";
import { getAudio } from "./audio";
import { VOICE_CUES } from "./voice-cues";
import { LIFE_ORDER } from "./presentation";
import type { LifeId } from "../core/types";

export interface DialogueLine { speaker: string; text: string; portrait: string; cue?: string }

/** Timed story dialogue. Keys and clicks never shorten a line's required reading time. */
export class PortraitDialogue {
  private readonly scene: Phaser.Scene;
  private readonly panel: Phaser.GameObjects.Container;
  private readonly portrait: Phaser.GameObjects.Image;
  private readonly speaker: Phaser.GameObjects.Text;
  private readonly body: Phaser.GameObjects.Text;
  private readonly timers = new Set<Phaser.Time.TimerEvent>();
  private generation = 0;
  private disposed = false;
  private resolveLine: (() => void) | null = null;
  private readonly onSceneEnd = (): void => this.dispose();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const border = scene.add.graphics();
    border.fillStyle(0x050b17, 0.98).fillRect(40, 430, 880, 110);
    border.lineStyle(2, 0xb2a077, 1).strokeRect(41, 431, 878, 108);
    border.lineStyle(1, 0x475566, 1).strokeRect(46, 436, 868, 98);
    border.fillStyle(0xc8ba8e, 1);
    for (const [x, y] of [[40, 430], [915, 430], [40, 535], [915, 535]]) border.fillRect(x!, y!, 5, 5);
    border.fillStyle(0x172435, 1).fillRect(48, 437, 96, 96);
    border.lineStyle(1, 0x998b6f, 1).strokeRect(47, 436, 98, 98);
    this.portrait = scene.add.image(96, 485, this.headTexture("immortal-base")).setDisplaySize(96, 96);
    this.speaker = scene.add.text(161, 439, "", { fontFamily: "monospace", fontSize: "13px", fontStyle: "bold", color: "#e1c98e", letterSpacing: 1 });
    this.body = scene.add.text(160, 459, "", { fontFamily: "monospace", fontSize: "17px", color: "#e1e7db", lineSpacing: 3, wordWrap: { width: 700, useAdvancedWrap: true } });
    this.panel = scene.add.container(0, -330, [border, this.portrait, this.speaker, this.body]).setDepth(1000).setVisible(false);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.onSceneEnd);
    scene.events.once(Phaser.Scenes.Events.DESTROY, this.onSceneEnd);
  }

  async play(lines: DialogueLine[], minReadMs = 2200): Promise<void> {
    if (this.disposed) return;
    const generation = ++this.generation;
    this.cancelPending();
    this.panel.setVisible(lines.length > 0);
    getAudio().dialogue(lines.length > 0);
    for (const line of lines) {
      if (this.disposed || generation !== this.generation) break;
      await this.showLine(line, generation, Math.max(0, minReadMs));
    }
    if (!this.disposed && generation === this.generation) { this.panel.setVisible(false); getAudio().dialogue(false); }
  }

  hide(): void {
    if (this.disposed) return;
    this.generation++;
    this.cancelPending();
    this.panel.setVisible(false);
    getAudio().dialogue(false);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.generation++;
    this.cancelPending();
    this.scene.events.off(Phaser.Scenes.Events.SHUTDOWN, this.onSceneEnd);
    this.scene.events.off(Phaser.Scenes.Events.DESTROY, this.onSceneEnd);
    getAudio().dialogue(false);
    this.panel.destroy(true);
  }

  private showLine(line: DialogueLine, generation: number, minReadMs: number): Promise<void> {
    getAudio().playVoice(line.cue ? VOICE_CUES[line.cue] : undefined);
    this.speaker.setText(line.speaker.toUpperCase());
    this.body.setText("");
    this.portrait.setTexture(this.headTexture(line.portrait)).setDisplaySize(96, 96);
    this.panel.setVisible(true);
    let shown = 0;
    const readMs = Math.max(minReadMs, line.text.length * 32 + 800);
    return new Promise<void>(resolve => {
      this.resolveLine = resolve;
      if (line.text.length) {
        const typing = this.scene.time.addEvent({
          delay: 22,
          repeat: line.text.length - 1,
          callback: () => {
            if (this.disposed || generation !== this.generation) return;
            shown++;
            this.body.setText(line.text.slice(0, shown));
            const character = line.text[shown - 1] ?? "";
            if (shown % 5 === 0 && /[aeiouy]/i.test(character)) getAudio().murmur(line.portrait === "kitten" ? 1.2 : 0.9);
          },
        });
        this.timers.add(typing);
      }
      const finish = this.scene.time.delayedCall(readMs, () => {
        if (!this.disposed && generation === this.generation) this.body.setText(line.text);
        this.cancelPending();
      });
      this.timers.add(finish);
    });
  }

  private cancelPending(): void {
    for (const timer of this.timers) {
      timer.remove(false);
      this.scene.time.removeEvent(timer);
    }
    this.timers.clear();
    const resolve = this.resolveLine;
    this.resolveLine = null;
    resolve?.();
  }

  /** Cached head crops use opaque body bounds rather than the source image's transparent padding. */
  private headTexture(requested: string): string {
    const lifeRow = LIFE_ORDER.indexOf(requested as LifeId);
    const exists = (key: string): boolean => this.scene.textures.exists(key);
    let sourceKey = exists(requested) ? requested : exists("immortal-base") ? "immortal-base" : "";
    let selectedFrame: number | null = null;
    if ((requested === "immortal-base" || requested === "gothic-base") && exists("gothic-base")) {
      sourceKey = "gothic-base"; selectedFrame = 0;
    } else if ((requested === "immortal-ascended" || requested === "gothic-monster") && exists("gothic-monster")) {
      sourceKey = "gothic-monster"; selectedFrame = 0;
    } else if (lifeRow >= 0 && exists("gothic-visitors")) {
      sourceKey = "gothic-visitors"; selectedFrame = lifeRow * 6;
    } else if (lifeRow >= 0 && exists("royal-visitor-walk")) {
      sourceKey = "royal-visitor-walk"; selectedFrame = lifeRow * 6;
    }
    const name = "dialogue-head-v5:" + (sourceKey || "fallback") + ":" + (selectedFrame ?? "image");
    if (this.scene.textures.exists(name)) return name;
    const texture = this.scene.textures.createCanvas(name, 96, 96)!;
    const context = texture.getContext();
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#142232";
    context.fillRect(0, 0, 96, 96);
    if (sourceKey) {
      let image = this.scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement | HTMLCanvasElement;
      if (selectedFrame !== null) {
        const frame = this.scene.textures.get(sourceKey).get(selectedFrame);
        const cell = document.createElement("canvas"); cell.width = frame.cutWidth; cell.height = frame.cutHeight;
        cell.getContext("2d")!.drawImage(image, frame.cutX, frame.cutY, frame.cutWidth, frame.cutHeight, 0, 0, cell.width, cell.height);
        image = cell;
      }
      const width = Number(image.width), height = Number(image.height);
      if (width > 0 && height > 0) {
        const sample = document.createElement("canvas");
        sample.width = width; sample.height = height;
        const source = sample.getContext("2d", { willReadFrequently: true })!;
        source.drawImage(image, 0, 0);
        const pixels = source.getImageData(0, 0, width, height).data;
        const opaque = (x: number, y: number): boolean => pixels[(y * width + x) * 4 + 3]! > 96;
        const centralLeft = Math.floor(width * 0.35), centralRight = Math.ceil(width * 0.7);
        const substantial = Math.max(3, Math.ceil((centralRight - centralLeft) * 0.22));
        let top = height, bottom = -1;
        for (let y = 0; y < height; y++) {
          let count = 0;
          for (let x = centralLeft; x < centralRight; x++) if (opaque(x, y)) count++;
          // Narrow raised blades and isolated spark pixels do not define the body top.
          if (count >= substantial) { top = Math.min(top, y); bottom = y; }
        }
        if (bottom >= top) {
          const bodyHeight = bottom - top + 1;
          const upperBottom = Math.min(height - 1, top + Math.ceil(bodyHeight * 0.44));
          let headLeft = width, headRight = -1;
          for (let y = top; y <= upperBottom; y++) {
            let bestLeft = -1, bestRight = -1, runStart = -1;
            for (let x = 0; x <= width; x++) {
              if (x < width && opaque(x, y)) { if (runStart < 0) runStart = x; }
              else if (runStart >= 0) {
                const runEnd = x - 1, midpoint = (runStart + runEnd) / 2;
                if (midpoint >= centralLeft && midpoint <= centralRight && runEnd - runStart + 1 >= substantial && runEnd - runStart > bestRight - bestLeft) { bestLeft = runStart; bestRight = runEnd; }
                runStart = -1;
              }
            }
            if (bestLeft >= 0) { headLeft = Math.min(headLeft, bestLeft); headRight = Math.max(headRight, bestRight); }
          }
          if (headRight < headLeft) { headLeft = centralLeft; headRight = centralRight - 1; }
          const margin = Math.max(2, Math.round(bodyHeight * 0.035));
          const size = Math.min(width, height, Math.max(14, Math.round(bodyHeight * 0.5) + margin * 2, headRight - headLeft + 1 + margin * 2));
          const center = (headLeft + headRight) / 2;
          const left = Math.max(0, Math.min(width - size, Math.round(center - size / 2)));
          const cropTop = Math.max(0, Math.min(height - size, top - margin));
          // Keep the face, ears and upper neck; exclude a separate glaive on the image edge.
          const faceLeft = Math.max(left, headLeft - margin), faceRight = Math.min(left + size, headRight + margin + 1);
          context.save();
          context.beginPath(); context.rect((faceLeft - left) / size * 96, 0, (faceRight - faceLeft) / size * 96, 96); context.clip();
          context.drawImage(image, left, cropTop, size, size, 0, 0, 96, 96);
          context.restore();
        }
      }
    } else {
      context.fillStyle = "#343549";
      context.fillRect(24, 29, 48, 44); context.fillRect(24, 14, 14, 20); context.fillRect(58, 14, 14, 20);
      context.fillStyle = "#c9dcc7";
      context.fillRect(33, 44, 7, 7); context.fillRect(57, 44, 7, 7);
    }
    texture.refresh();
    return name;
  }
}
