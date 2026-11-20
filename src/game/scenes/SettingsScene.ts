// AI-use disclosure: Codex-authored in-game keybinding settings, with no operating-system dialogs.
import Phaser from "phaser";
import { ACTIONS, keyLabel, loadBindings, rebind, resetBindings, type Action, type Bindings } from "../controls";

const LABELS: Record<Action, string> = { left: "Move left", right: "Move right", jump: "Jump", dash: "Dash", cleave: "Crownsteel / Rend", throw: "Oathpiercer / Choir", reap: "Kneel / Grave Hands", nova: "Procession / Eclipse", guard: "Guard", hold: "Lower guard / yield" };
export class SettingsScene extends Phaser.Scene {
  private bindings!: Bindings;
  private capturing: Action | null = null;
  private values = new Map<Action, Phaser.GameObjects.Text>();
  private boxes = new Map<Action, Phaser.GameObjects.Rectangle>();
  private modal!: Phaser.GameObjects.Container;
  private status!: Phaser.GameObjects.Text;
  constructor() { super("settings"); }
  create(): void {
    this.bindings = loadBindings();
    this.capturing = null;
    this.values.clear(); this.boxes.clear();
    this.add.rectangle(480, 270, 960, 540, 0x091321);
    this.add.rectangle(480, 270, 910, 490, 0x0c1727, 0.92).setStrokeStyle(1, 0x3d5664);
    this.add.text(64, 49, "CONTROLS", { fontFamily: "monospace", fontSize: "27px", color: "#ead8af" });
    this.add.text(64, 88, "Click an action, then press its new key. Reusing a key swaps the actions.", { fontFamily: "monospace", fontSize: "12px", color: "#aebfc5" });
    ACTIONS.forEach((action, index) => {
      const column = index < 5 ? 0 : 1;
      const x = column ? 508 : 64, y = 145 + (index % 5) * 56;
      const row = this.add.rectangle(x + 194, y, 388, 45, 0x101e30, 0.88).setStrokeStyle(1, 0x203a4b).setInteractive({ useHandCursor: true });
      this.add.text(x + 11, y, LABELS[action], { fontFamily: "monospace", fontSize: "14px", color: "#d4dfdc" }).setOrigin(0, 0.5);
      const box = this.add.rectangle(x + 306, y, 144, 33, 0x152b3a).setStrokeStyle(1, 0x78998e);
      const value = this.add.text(x + 306, y, keyLabel(this.bindings[action]), { fontFamily: "monospace", fontSize: "14px", color: "#e6dfc2" }).setOrigin(0.5);
      this.values.set(action, value); this.boxes.set(action, box);
      row.on("pointerover", () => box.setStrokeStyle(1, 0xe6cd8c));
      row.on("pointerout", () => box.setStrokeStyle(1, 0x78998e));
      row.on("pointerdown", () => this.capture(action));
    });
    this.status = this.add.text(480, 442, "Enter and Esc are reserved for menus.", { fontFamily: "monospace", fontSize: "12px", color: "#9fb4bb", align: "center" }).setOrigin(0.5);
    const reset = this.add.text(64, 483, "Reset defaults", { fontFamily: "monospace", fontSize: "16px", color: "#bad8c9" }).setPadding(0, 7, 16, 7).setInteractive({ useHandCursor: true });
    reset.on("pointerdown", () => { if (this.capturing) return; this.bindings = resetBindings(); this.refresh(); this.status.setText("Default controls restored.").setColor("#bad8c9"); });
    const back = this.add.text(893, 483, "[ Esc ]  Back", { fontFamily: "monospace", fontSize: "16px", color: "#ead8af" }).setOrigin(1, 0).setPadding(14, 7, 0, 7).setInteractive({ useHandCursor: true });
    back.on("pointerdown", () => { if (!this.capturing) this.scene.start("title"); });
    this.modal = this.add.container(0, 0).setDepth(100).setVisible(false);
    const blocker = this.add.rectangle(480, 270, 960, 540, 0x020710, 0.8).setInteractive();
    const panel = this.add.rectangle(480, 270, 660, 165, 0x101f30, 1).setStrokeStyle(2, 0xb6cbbb);
    const title = this.add.text(480, 234, "", { fontFamily: "monospace", fontSize: "21px", color: "#ead8af", align: "center" }).setOrigin(0.5).setName("capture-title");
    const hint = this.add.text(480, 286, "Press a key. Esc cancels.", { fontFamily: "monospace", fontSize: "15px", color: "#bfd3cd" }).setOrigin(0.5);
    const cancel = this.add.text(480, 326, "Cancel", { fontFamily: "monospace", fontSize: "12px", color: "#e1d2ae" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    cancel.on("pointerdown", () => this.cancelCapture());
    this.modal.add([blocker, panel, title, hint, cancel]);
    const onKey = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      if (this.capturing) {
        event.preventDefault();
        if (event.code === "Escape") { this.cancelCapture(); return; }
        const action = this.capturing;
        try {
          this.bindings = rebind(action, event.code);
          this.capturing = null; this.modal.setVisible(false); this.refresh();
          this.status.setText(LABELS[action] + " set to " + keyLabel(event.code) + ".").setColor("#bad8c9");
        } catch (error) {
          const message = error instanceof Error ? error.message : "That key cannot be used.";
          hint.setText(message).setColor("#f0b6a3");
        }
      } else if (event.code === "Escape") {
        event.preventDefault(); this.scene.start("title");
      }
    };
    const keyboard = this.input.keyboard;
    keyboard?.on("keydown", onKey);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => keyboard?.off("keydown", onKey));
  }
  private capture(action: Action): void {
    if (this.capturing) return;
    this.capturing = action;
    const title = this.modal.getByName("capture-title") as Phaser.GameObjects.Text;
    title.setText("Bind " + LABELS[action]);
    const hint = this.modal.list[3] as Phaser.GameObjects.Text;
    hint.setText("Press a key. Esc cancels.").setColor("#bfd3cd");
    this.modal.setVisible(true);
  }
  private cancelCapture(): void { this.capturing = null; this.modal.setVisible(false); }
  private refresh(): void { for (const action of ACTIONS) this.values.get(action)?.setText(keyLabel(this.bindings[action])); }
}
