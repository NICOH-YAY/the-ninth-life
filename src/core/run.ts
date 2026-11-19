// AI-use disclosure: written by Claude Code. Run state across the nine lives: slots,
// bond, the pacing director, life 8 and life 9 rules, and the three endings.

import { BOND, DEFAULT_CONFIG, RUN, type GameConfig } from "./config";
import type { FightSetup, FightSim } from "./fight";
import { curveForSource, directorStep, statsFor, tierFor, type CurveId } from "./progression";
import { fightSeed } from "./rng";
import { ROSTER, defaultTactics } from "./roster";
import { summarize } from "./summary";
import { CHOOSABLE_LIVES, type FightSummary, type LifeId, type PlanResult } from "./types";

export type Ending =
  | { kind: "normal"; by: LifeId; fightIndex: number; bond: number }
  | { kind: "do_nothing"; by: LifeId; fightIndex: number; bond: number }
  | { kind: "victory"; defeated: number; bond: number };
export interface RunState {
  seed: number;
  /** The fight about to be played or being played (1 to 9). */
  fightIndex: number;
  bond: number;
  used: LifeId[];
  summaries: FightSummary[];
  plans: PlanResult[];
  directorAdjust: number;
  life8Struck: boolean;
  ending: Ending | null;
  /** Forces one curve for evaluation ablations. Null uses the shipped pairing. */
  curveOverride: CurveId | null;
  config: GameConfig;
}

export function newRun(seed: number, opts: { curveOverride?: CurveId | null; config?: GameConfig; bond?: number } = {}): RunState {
  return {
    seed,
    fightIndex: 1,
    bond: clampBond(opts.bond ?? 0),
    used: [],
    summaries: [],
    plans: [],
    directorAdjust: 0,
    life8Struck: false,
    ending: null,
    curveOverride: opts.curveOverride ?? null,
    config: opts.config ?? DEFAULT_CONFIG,
  };
}

export function clampBond(b: number): number {
  return Math.max(BOND.min, Math.min(BOND.max, Math.round(b)));
}

/** The life a slot is fixed to, or null when the planner chooses. */
export function fixedLifeFor(fightIndex: number): LifeId | null {
  if (fightIndex === 1) return "kitten";
  if (fightIndex === RUN.quietFight) return "quiet";
  if (fightIndex === RUN.finalFight) return "patchwork";
  return null;
}

export function remainingChoosable(state: RunState): LifeId[] {
  return CHOOSABLE_LIVES.filter((l) => !state.used.includes(l));
}

/** First unused life in the scripted order. */
export function scriptedNext(state: RunState): LifeId {
  return RUN.scriptedOrder.find((l) => !state.used.includes(l)) ?? "alley";
}

/** Plan for a fixed slot (kitten, quiet one, patchwork). Lines for these are authored. */
export function authoredPlan(fightIndex: number): PlanResult {
  const life = fixedLifeFor(fightIndex) ?? "kitten";
  return { plan: { next_life: life, tactics: defaultTactics(life), line: "" }, source: "authored" };
}

export function setupFight(state: RunState, result: PlanResult): FightSetup {
  const fixed = fixedLifeFor(state.fightIndex);
  let life = fixed ?? result.plan.next_life;
  if (!fixed && (!ROSTER[life].choosable || state.used.includes(life))) life = scriptedNext(state);
  const curve: CurveId = state.curveOverride ?? curveForSource(result.source);
  const tactics = fixed ? defaultTactics(life) : result.plan.tactics;
  return {
    seed: fightSeed(state.seed, state.fightIndex),
    life,
    fightIndex: state.fightIndex,
    tactics,
    stats: statsFor(life, state.fightIndex, curve, state.directorAdjust),
    tier: tierFor(state.fightIndex),
    bond: state.bond,
    directorAdjust: state.directorAdjust,
    config: state.config,
  };
}

/** Records a finished fight and advances the run. Returns the summary. */
export function finishFight(state: RunState, sim: FightSim, plan: PlanResult): FightSummary {
  const life = sim.setup.life;
  state.used.push(life);
  state.plans.push(plan);
  const summary = summarize(sim.events, {
    fight: state.fightIndex,
    remaining: remainingChoosable(state),
    refillPct: state.config.phase2.PHASE2_REFILL_PCT,
    triggerPct: state.config.phase2.PHASE2_TRIGGER_PCT,
  });
  state.summaries.push(summary);

  if (sim.outcome === "boss_dead") {
    state.ending = { kind: sim.endReason === "boredom" ? "do_nothing" : "normal", by: life, fightIndex: state.fightIndex, bond: state.bond };
  } else if (life === "patchwork" && sim.outcome === "challenger_dead") {
    state.ending = { kind: "victory", defeated: state.used.length, bond: state.bond };
  } else if (life === "patchwork" && sim.outcome === "spared") {
    // A stalemate is not the difficult Victory route; the crown eventually fails.
    state.ending = { kind: "normal", by: life, fightIndex: state.fightIndex, bond: state.bond };
  }
  if (life !== "quiet" && life !== "patchwork") {
    state.directorAdjust = directorStep(state.directorAdjust, state.fightIndex, summary.bossMinHpPct);
  }
  state.fightIndex++;
  return summary;
}

/** The Immortal answers between fights. Open answers raise bond by one. After life 8 is struck, bond stays at 0. */
export function applyResponse(state: RunState, open: boolean): void {
  if (open && !state.life8Struck) state.bond = clampBond(state.bond + 1);
}

export function isOver(state: RunState): boolean {
  return state.ending !== null || state.fightIndex > RUN.totalLives;
}
