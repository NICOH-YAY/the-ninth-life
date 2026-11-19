// AI-use disclosure: written by Claude Code. Phaser entry point.
// Defaults to the Canvas renderer because WebGL runs very slowly in some browsers without
// GPU acceleration. Add ?renderer=webgl to try WebGL, ?mute=1 to start muted.

import Phaser from "phaser";
import { ARENA } from "../core/config";
import { getAudio } from "./audio";
import { BootScene } from "./scenes/BootScene";
import { EndingScene } from "./scenes/EndingScene";
import { FightScene } from "./scenes/FightScene";
import { TitleScene } from "./scenes/TitleScene";
import { OpeningScene } from "./scenes/OpeningScene";

const params = new URLSearchParams(window.location.search);
const audio = getAudio();

window.addEventListener("keydown", (e) => {
  if (e.key === "m" || e.key === "M") audio.toggleMute();
});

const game = new Phaser.Game({
  type: params.get("renderer") === "webgl" ? Phaser.WEBGL : Phaser.CANVAS,
  parent: "game",
  width: ARENA.width,
  height: ARENA.height,
  backgroundColor: "#07070d",
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  render: { antialias: false, pixelArt: true, roundPixels: true },
  fps: { target: 60 },
  scene: [BootScene, TitleScene, OpeningScene, FightScene, EndingScene],
});

// Exposed for debugging in the console only.
(window as unknown as { ninth?: Phaser.Game }).ninth = game;
