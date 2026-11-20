// AI-use disclosure: Codex-authored story choices with explicit selection and scene-safe cleanup.
import Phaser from "phaser";
import { getAudio } from "./audio";

/** Story pauses cannot accidentally consume a held combat key. */
export function chooseReply(scene: Phaser.Scene, replies: readonly [string, string], caption = "YOUR ANSWER"): Promise<boolean | null> {
  return new Promise(resolve => {
    let selected = 0, done = false;
    const panel = scene.add.container(0, 0).setDepth(1100);
    const bg = scene.add.rectangle(480, 258, 824, 132, 0x080f1b, 0.98).setStrokeStyle(2, 0x8b8066);
    const title = scene.add.text(90, 203, caption + "     [ ↑ / ↓ choose · Enter confirm ]", { fontFamily: "monospace", fontSize: "12px", color: "#c3b38e" });
    const rows = replies.map((text, i) => scene.add.text(98, 231 + i * 38, "", { fontFamily: "monospace", fontSize: "16px", color: "#d8dfda", wordWrap: { width: 745 } }).setInteractive({ useHandCursor: true }));
    panel.add([bg, title, ...rows]);
    panel.setAlpha(0).setY(6);
    scene.tweens.add({ targets: panel, alpha: 1, y: 0, duration: 150, ease: "Cubic.Out" });
    const draw = () => rows.forEach((row, i) => row.setText((i === selected ? "> " : "  ") + replies[i]).setColor(i === selected ? "#f2dc9c" : "#a4b3b5"));
    const finish = (value: boolean | null) => {
      if (done) return;
      done = true; window.removeEventListener("keydown", key);
      scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cancel);
      scene.events.off("story-cancel", cancel);
      scene.tweens.killTweensOf(panel); panel.destroy(true); getAudio().dialogue(false); resolve(value);
    };
    const key = (event: KeyboardEvent) => {
      if (event.repeat) return;
      if (event.code === "ArrowUp" || event.code === "ArrowDown" || event.code === "Tab") { event.preventDefault(); selected = 1 - selected; draw(); }
      if (event.code === "Enter") { event.preventDefault(); finish(selected === 0); }
    };
    const cancel = () => finish(null);
    rows.forEach((row, i) => row.on("pointerover", () => { selected = i; draw(); }).on("pointerdown", () => finish(i === 0)));
    getAudio().dialogue(true); draw();
    window.addEventListener("keydown", key);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cancel);
    scene.events.once("story-cancel", cancel);
  });
}
