// AI-use disclosure: Codex-authored deterministic mobile combat bots for regression and evaluation.
import { ARENA, CHALLENGER, MOVE_GEOMETRY } from "./config";
import type { FightSim } from "./fight";
import { ENEMY_MELEE } from "./enemy-patterns";
import { Rng } from "./rng";
import { NO_INPUT, type BossInput, type BossMove } from "./types";

export type BossBot = (sim: FightSim) => BossInput;
export type BotProfile = "average" | "aggressive" | "defensive" | "idle" | "holder" | "fighter" | `spam_${BossMove}`;

/** Real inputs teach the tutorial: jump, dash, then withstand a guarded melee hit. */
function learnTutorial(sim: FightSim): BossInput | null {
  if (sim.setup.life !== "kitten" || sim.tutorialComplete) return null;
  const b = sim.boss, ch = sim.ch;
  if (!b.jumps) return { ...NO_INPUT, jump: true };
  if (!b.grounded) return NO_INPUT;
  if (!b.dashes) return { ...NO_INPUT, dash: true, left: ch.x < b.x, right: ch.x > b.x };
  if (b.dashT > 0) return NO_INPUT;
  const distance = Math.abs(ch.x - b.x);
  return { ...NO_INPUT, left: distance > 85 && ch.x < b.x, right: distance > 85 && ch.x > b.x,
    guard: ch.state === "attack" && distance < 150 && b.guardEnergy > 0.12 };
}

export function makeBot(profile: BotProfile, seed = 1): BossBot {
  if (profile === "idle") return () => NO_INPUT;
  const rng = new Rng(seed);
  const spam = profile.startsWith("spam_") ? profile.slice(5) as BossMove : null;
  const aggressive = profile === "aggressive";
  const defensive = profile === "defensive" || profile === "holder";
  let nextAttack = 0;
  return (sim) => {
    const lesson = learnTutorial(sim);
    if (lesson) return lesson;
    const b = sim.boss, ch = sim.ch;
    const distance = Math.abs(ch.x - b.x);
    const input = { ...NO_INPUT };
    if (!spam) {
      const incoming = sim.projectiles.filter(p => !p.dead && p.kind.startsWith("enemy") && (b.x - p.x) * p.vx > 0);
      const wave = incoming.some(p => p.kind === "enemy-wave" && Math.abs(p.x - b.x) < 220);
      const orb = incoming.some(p => p.kind === "enemy-orb" && Math.abs(p.x - b.x) < 100);
      input.jump = wave && b.grounded;
      input.dash = orb && b.dashCooldown <= 0;
      input.guard = !input.jump && !input.dash && ch.state === "attack" && distance < ARENA.bossHalfWidth + ENEMY_MELEE[ch.life].reach + 25 && b.guardEnergy > 0.2;
      const contactSoon = ch.state === "attack" && ch.windupT > 0 && ENEMY_MELEE[ch.life].tellS - ch.windupT < 0.11;
      if (contactSoon && distance < ARENA.bossHalfWidth + ENEMY_MELEE[ch.life].reach + 20 && b.dashCooldown <= 0) {
        input.dash = true; input.guard = false;
      }
      const reach = aggressive ? 135 : defensive ? 230 : 170;
      input.left = distance > reach + 35 && ch.x < b.x || distance < reach && ch.x > b.x;
      input.right = distance > reach + 35 && ch.x > b.x || distance < reach && ch.x < b.x;
      if (aggressive && distance < 200 && b.dashCooldown <= 0 && ((b.x < 90 && ch.x > b.x) || (b.x > 870 && ch.x < b.x))) {
        input.dash = true; input.guard = false; input.left = ch.x < b.x; input.right = ch.x > b.x;
      }
    }
    if (input.guard || input.dash || sim.time < nextAttack || b.transitionT > 0) return input;
    let move: BossMove | null = null;
    if (spam) move = sim.canUse(spam) ? spam : null;
    else if (sim.canUse("nova")) move = "nova";
    else if (distance < (b.phase === 2 ? 310 : 190) && sim.canUse("cleave")) move = "cleave";
    else if (sim.canUse("reap")) move = "reap";
    else if (sim.canUse("throw")) move = "throw";
    else if (sim.canUse("reap")) move = "reap";
    if (move) {
      input[move] = true;
      nextAttack = sim.time + rng.range(aggressive || spam ? 0.05 : 0.20, aggressive || spam ? 0.12 : defensive ? 0.65 : 0.45);
    }
    return input;
  };
}

/** Runs a bounded fight using only the supplied bot's inputs. */
export function runFight(sim: FightSim, bot: BossBot, maxS = 400): number {
  const maxTicks = Math.ceil(maxS * 60);
  while (!sim.outcome && sim.tick < maxTicks) sim.step(bot(sim));
  return sim.time;
}
