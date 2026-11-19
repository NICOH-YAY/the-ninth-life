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

export function statsFor(life: LifeId, fightIndex: number, curve: CurveId, directorAdjust: number): ChallengerStats {
  if (life === "patchwork") {
    return {
      maxHp: PATCHWORK.hp,
      damage: PATCHWORK.damage,
      speed: CHALLENGER.baseSpeed * PATCHWORK.speed,
      reactionMs: PATCHWORK.reactionMs,
    };
  }
  const row = curveRow(curve, fightIndex);
  const over = LIFE_BASE[life] ?? {};
  const adj = 1 + directorAdjust;
  return {
    maxHp: Math.round((over.hp ?? CHALLENGER.baseHp) * row.hp * adj),
    damage: (over.damage ?? CHALLENGER.baseDamage) * row.damage * adj,
    speed: CHALLENGER.baseSpeed * row.speed,
    reactionMs: row.reactionMs,
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
