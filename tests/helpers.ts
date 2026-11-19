// AI-use disclosure: written by Claude Code. Shared fixtures for the Vitest suites.

import { DEFAULT_CONFIG, type GameConfig } from "../src/core/config";
import { FightSim, type FightSetup } from "../src/core/fight";
import { statsFor, tierFor, type CurveId } from "../src/core/progression";
import { defaultTactics } from "../src/core/roster";
import type { ChallengerStats, LifeId, Tier } from "../src/core/types";

export function makeSim(
  life: LifeId,
  opts: {
    seed?: number;
    fightIndex?: number;
    curve?: CurveId;
    stats?: Partial<ChallengerStats>;
    tier?: Tier;
    bond?: number;
    config?: GameConfig;
  } = {},
): FightSim {
  const fightIndex = opts.fightIndex ?? 4;
  const base = statsFor(life, fightIndex, opts.curve ?? "agent", 0);
  const setup: FightSetup = {
    seed: opts.seed ?? 7,
    life,
    fightIndex,
    tactics: defaultTactics(life),
    stats: { ...base, ...opts.stats },
    tier: opts.tier ?? tierFor(fightIndex),
    bond: opts.bond ?? 0,
    directorAdjust: 0,
    config: opts.config ?? DEFAULT_CONFIG,
  };
  return new FightSim(setup);
}

export function withPhase2(patch: Partial<GameConfig["phase2"]>): GameConfig {
  return { phase2: { ...DEFAULT_CONFIG.phase2, ...patch } };
}
