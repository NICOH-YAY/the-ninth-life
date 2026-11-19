// AI-use disclosure: written by Claude Code. Scripted boss input profiles for tests,
// headless runs, and tuning. Each bot is deterministic given its seed.

import { MOVE_GEOMETRY } from "./config";
import type { FightSim } from "./fight";
import { Rng } from "./rng";
import { NO_INPUT, type BossInput, type BossMove } from "./types";

export type BossBot = (sim: FightSim) => BossInput;
export type BotProfile = "average" | "aggressive" | "defensive" | "idle" | "holder" | "fighter" | `spam_${BossMove}`;

function press(move: BossMove, extra: Partial<BossInput> = {}): BossInput {
  return { ...NO_INPUT, ...extra, [move]: true };
}

function inCleaveRange(sim: FightSim): boolean {
  return sim.ch.x >= sim.bossFront - MOVE_GEOMETRY.cleaveReach + 10;
}

/** Presses a move at most every `gapS` seconds, picking with `choose`. */
function paced(seed: number, gapLo: number, gapHi: number, choose: (sim: FightSim, rng: Rng) => BossMove | null, holdOnPrompt = false): BossBot {
  const rng = new Rng(seed);
  let nextAt = 0;
  return (sim) => {
    const hold = holdOnPrompt && sim.boss.holdAvailable;
    if (hold) return { ...NO_INPUT, hold: true };
    if (sim.time < nextAt || sim.boss.move) return NO_INPUT;
    const m = choose(sim, rng);
    if (!m || !sim.canUse(m)) return NO_INPUT;
    nextAt = sim.time + rng.range(gapLo, gapHi);
    return press(m);
  };
}

/** A middling human: reacts to range, mixes moves, leaves gaps, shifts a little. */
function average(seed: number, holdOnPrompt: boolean): BossBot {
  const inner = paced(
    seed,
    0.35,
    0.9,
    (sim, rng) => {
      if (sim.canUse("nova") && rng.chance(0.5)) return "nova";
      if (inCleaveRange(sim) && sim.canUse("cleave") && rng.chance(0.6)) return "cleave";
      const options: BossMove[] = (["throw", "reap", "cleave"] as BossMove[]).filter((m) => sim.canUse(m));
      if (!options.length) return null;
      return options[Math.floor(rng.next() * options.length)] ?? null;
    },
    holdOnPrompt,
  );
  return (sim) => {
    const input = inner(sim);
    const wobble = Math.floor(sim.time / 3) % 4;
    if (wobble === 1) return { ...input, left: true };
    if (wobble === 3) return { ...input, right: true };
    return input;
  };
}

export function makeBot(profile: BotProfile, seed = 1): BossBot {
  switch (profile) {
    case "average":
      return average(seed, false);
    case "holder":
      return average(seed, true);
    case "fighter":
      return average(seed, false);
    case "aggressive":
      return paced(seed, 0.05, 0.15, (sim) => {
        if (sim.canUse("nova")) return "nova";
        if (inCleaveRange(sim) && sim.canUse("cleave")) return "cleave";
        if (sim.canUse("reap")) return "reap";
        if (sim.canUse("throw")) return "throw";
        return null;
      });
    case "defensive":
      return paced(seed, 0.6, 1.4, (sim) => {
        if (sim.canUse("nova")) return "nova";
        if (inCleaveRange(sim)) return sim.canUse("cleave") ? "cleave" : "reap";
        return null;
      });
    case "idle":
      return () => NO_INPUT;
    default: {
      const move = profile.slice("spam_".length) as BossMove;
      return paced(seed, 0.05, 0.1, (sim) => (sim.canUse(move) ? move : null));
    }
  }
}

/** Runs one fight to its end with a bot. Returns the number of seconds simulated. */
export function runFight(sim: FightSim, bot: BossBot, maxS = 400): number {
  const maxTicks = Math.ceil(maxS * 60);
  while (!sim.outcome && sim.tick < maxTicks) sim.step(bot(sim));
  return sim.time;
}
