// AI-use disclosure: written by Claude Code. Curves, tiers, and the pacing director
// from docs/challenger-progression.md.

import {
  CHALLENGER,
  CURVE_AGENT,
  CURVE_SCRIPTED_CAP,
  CURVE_SCRIPTED_GROWTH,
  DIRECTOR,
  LIFE_BASE,
  PACING_TARGETS,
  PATCHWORK,
  TIERS,
  type CurveRow,
} from "./config";
import type { ChallengerStats, LifeId, PlanSource, Tier } from "./types";

export type CurveId = "agent" | "scripted";

function agentRow(fightIndex: number): CurveRow {
  const i = Math.min(Math.max(fightIndex, 1), CURVE_AGENT.length) - 1;
  return CURVE_AGENT[i]!;
}

export function curveRow(curve: CurveId, fightIndex: number): CurveRow {
  const base = agentRow(fightIndex);
  if (curve === "agent") return base;
  const g = Math.min(CURVE_SCRIPTED_CAP, Math.pow(CURVE_SCRIPTED_GROWTH, Math.max(0, fightIndex - 1)));
  return { hp: g, damage: g, speed: base.speed, reactionMs: base.reactionMs };
}

/** Shipped pairing: scripted and fallback plans use the scripted curve, everything else the agent curve. */
export function curveForSource(source: PlanSource): CurveId {
  return source === "scripted" || source === "fallback" ? "scripted" : "agent";
}

export function tierFor(fightIndex: number): Tier {
  return TIERS[fightIndex] ?? 3;
}

/** Every life is mortal. Strength grows by encounter, without a discontinuous final boss. */
export function statsFor(life: LifeId, fightIndex: number, curve: CurveId, directorAdjust: number): ChallengerStats {
  if (life === "kitten") return { maxHp: 260, damage: 4, speed: 130, reactionMs: 500 };
  const n = Math.max(2, Math.min(9, fightIndex));
  const multiplier = 1 + Math.max(-0.10, Math.min(0.10, directorAdjust));
  const baseline = curve === "scripted" ? 1.05 : 1;
  return {
    maxHp: Math.round((250 + (n - 2) * 52) * multiplier * baseline),
    damage: (16 + (n - 2) * 3.5) * multiplier,
    speed: 175 + (n - 2) * 12,
    reactionMs: Math.max(125, 350 - (n - 2) * 30),
  };
}
export function pacingTarget(fightIndex: number): number | null {
  return PACING_TARGETS[fightIndex] ?? null;
}

/**
 * Pacing director. Compares the lowest effective boss HP a challenger reached with
 * the target and nudges the next fight by one step. Never touches life choice or tactics.
 */
export function directorStep(currentAdjust: number, fightIndex: number, bossMinHpPct: number): number {
  const target = pacingTarget(fightIndex);
  if (target === null) return currentAdjust;
  const diff = bossMinHpPct - target;
  let next = currentAdjust;
  if (diff > DIRECTOR.tolerance) next += DIRECTOR.step;
  else if (diff < -DIRECTOR.tolerance) next -= DIRECTOR.step;
  next = Math.min(DIRECTOR.maxUp, Math.max(DIRECTOR.maxDown, next));
  return Math.round(next * 1000) / 1000;
}
