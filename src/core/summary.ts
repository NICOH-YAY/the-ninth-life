// AI-use disclosure: written by Claude Code. Builds the FightSummary the planner reads
// from a fight event log alone, so it can be tested on recorded logs.

import { BOSS, PHASE2 } from "./config";
import { BOSS_MOVES, emptyMoveCounts, type BossMove, type FightEvent, type FightSummary, type LifeId, type Phase } from "./types";

export interface SummaryContext {
  fight: number;
  remaining: LifeId[];
  maxHp?: number;
  refillPct?: number;
  triggerPct?: number;
}

export function summarize(events: FightEvent[], ctx: SummaryContext): FightSummary {
  const maxHp = ctx.maxHp ?? BOSS.maxHp;
  const refill = ctx.refillPct ?? PHASE2.PHASE2_REFILL_PCT;
  const trigger = ctx.triggerPct ?? PHASE2.PHASE2_TRIGGER_PCT;

  const start = events.find((e) => e.type === "fight_start");
  const lifeId: LifeId = start && start.type === "fight_start" ? start.life : "kitten";
  const fightIndex = start && start.type === "fight_start" ? start.fightIndex : ctx.fight;
  const directorAdjust = start && start.type === "fight_start" ? start.directorAdjust : 0;

  const moveCounts = emptyMoveCounts();
  const byPhase = { 1: emptyMoveCounts(), 2: emptyMoveCounts() };
  const seq: BossMove[] = [];
  let hp = maxHp;
  let phase: Phase = 1;
  let triggered = false;
  let minEff = 1;
  let damageDealt = 0;
  let shifts = 0;
  let distSum = 0;
  let distN = 0;
  let hesitations = 0;
  let phase2At: number | null = null;
  let killingMove: BossMove | null = null;
  let endT = 0;
  let outcome: FightSummary["outcome"] = "challenger_dead";
  const novaAt: number[] = [];

  const eff = (): number => (!triggered ? hp / maxHp : (hp / maxHp) * trigger);

  for (const e of events) {
    endT = Math.max(endT, e.t);
    switch (e.type) {
      case "boss_move":
        moveCounts[e.move]++;
        byPhase[e.phase][e.move]++;
        seq.push(e.move);
        if (e.move === "nova") novaAt.push(Math.round((hp / maxHp) * 100) / 100);
        break;
      case "boss_shift":
        shifts++;
        break;
      case "boss_hit":
        damageDealt += e.dmg;
        hp = e.hpAfter;
        if (!triggered) minEff = Math.min(minEff, eff());
        else minEff = Math.min(minEff, eff());
        break;
      case "phase2_start":
        triggered = true;
        phase2At = e.t;
        minEff = Math.min(minEff, trigger);
        break;
      case "phase2_ready":
        phase = 2;
        hp = Math.round(refill * maxHp);
        break;
      case "hesitate":
        hesitations++;
        break;
      case "distance":
        distSum += e.d;
        distN++;
        break;
      case "challenger_dead":
        killingMove = e.move;
        outcome = "challenger_dead";
        break;
      case "boss_dead":
        hp = 0;
        minEff = 0;
        outcome = "boss_dead";
        break;
      case "spared":
        outcome = "spared";
        break;
      default:
        break;
    }
  }

  const bigramMap = new Map<string, number>();
  for (let i = 0; i + 1 < seq.length; i++) {
    const k = `${seq[i]}>${seq[i + 1]}`;
    bigramMap.set(k, (bigramMap.get(k) ?? 0) + 1);
  }
  const topBigrams = [...bigramMap.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k, n]) => {
      const [a, b] = k.split(">") as [BossMove, BossMove];
      return [a, b, n] as [BossMove, BossMove, number];
    });

  const minutes = Math.max(endT, 1) / 60;
  return {
    fight: ctx.fight,
    fightIndex,
    lifeId,
    timeAliveMs: Math.round(endT * 1000),
    damageDealt: Math.round(damageDealt),
    moveCounts,
    moveCountsByPhase: byPhase,
    firstMoves: seq.slice(0, 5),
    topBigrams,
    killingMove,
    avgDistance: distN ? Math.round(distSum / distN) : 0,
    shiftsPerMin: Math.round((shifts / minutes) * 10) / 10,
    novaAtBossHpPct: novaAt,
    phase2ReachedAtSec: phase2At === null ? null : Math.round(phase2At * 100) / 100,
    diedInPhase: triggered ? 2 : phase,
    bossMinHpPct: Math.round(minEff * 1000) / 1000,
    directorAdjust,
    outcome,
    hesitations,
    remaining: ctx.remaining,
  };
}

/** The boss move used most, ties broken by the fixed move order. */
export function dominantMove(counts: Record<BossMove, number>): BossMove | null {
  let best: BossMove | null = null;
  for (const m of BOSS_MOVES) if ((best === null && counts[m] > 0) || (best !== null && counts[m] > counts[best])) best = m;
  return best;
}
