// AI-use disclosure: written by Claude Code. Phase Two tests from docs/phase-two.md.

import { describe, expect, it } from "vitest";
import { ASCENDED_MOVES, BOSS, DT, PHASE2 } from "../src/core/config";
import { makeBot, runFight } from "../src/core/bots";
import { summarize } from "../src/core/summary";
import { NO_INPUT, type FightEvent } from "../src/core/types";
import { makeSim, withPhase2 } from "./helpers";

describe("Phase Two trigger", () => {
  it("triggers exactly once, even when one hit takes HP from above 50% to well below", () => {
    // Isolate the threshold crossing from the new ranged ability's smaller wave damage.
    const sim = makeSim("alley");
    (sim as unknown as {damageBoss(damage:number,t:number):void}).damageBoss(520,sim.time);
    runFight(sim, makeBot("idle"));
    const starts = sim.events.filter((e) => e.type === "phase2_start");
    expect(starts).toHaveLength(1);
    const start = starts[0];
    expect(start && start.type === "phase2_start" ? start.hpBefore : -1).toBeLessThan(BOSS.maxHp * 0.3);
    // The summary still counts the crossing at the trigger point, not the overkill.
    const s = summarize(sim.events.slice(0, sim.events.indexOf(start!) + 1), { fight: 4, remaining: [] });
    expect(s.bossMinHpPct).toBeCloseTo(0.5);
    // Later hits in Phase Two below 50% do not trigger again, and the boss can still die.
    expect(sim.outcome).toBe("boss_dead");
  });

  it("refills HP to PHASE2_REFILL_PCT of max after the transition", () => {
    for (const refill of [1.0, 0.75, 0.6]) {
      const sim = makeSim("alley", { stats: { damage: 400 }, config: withPhase2({ PHASE2_REFILL_PCT: refill }) });
      const bot = makeBot("idle");
      while (!sim.events.some((e) => e.type === "phase2_ready") && sim.tick < 60 * 60) sim.step(bot(sim));
      expect(sim.boss.phase).toBe(2);
      expect(sim.boss.hp).toBe(Math.round(refill * BOSS.maxHp));
    }
  });

  it("takes no damage during the transition and clears projectiles in flight", () => {
    const sim = makeSim("alley", { stats: { damage: 400 } });
    let planted = false;
    while (!sim.boss.phase2Triggered && sim.tick < 60 * 60) {
      if (!planted && sim.ch.state === "attack") {
        sim.projectiles.push({ kind: "glaive", move: "throw", x: 20, y: 300, vx: -1, vy: 0, ttl: 30, traveled: 0, returning: false, canHit: false, damage: 1, dead: false });
        planted = true;
      }
      sim.step(NO_INPUT);
    }
    expect(planted).toBe(true);
    expect(sim.boss.transitionT).toBeGreaterThan(0);
    expect(sim.projectiles).toHaveLength(0);
    const hpAtTrigger = sim.boss.hp;
    let hits = 0;
    const before = sim.events.length;
    while (sim.boss.transitionT > 0) {
      // Attack input is ignored during the transition.
      sim.step({ ...NO_INPUT, cleave: true });
      if (sim.boss.transitionT > 0) expect(sim.boss.hp).toBe(hpAtTrigger);
    }
    for (const e of sim.events.slice(before)) if (e.type === "boss_hit" || e.type === "boss_move") hits++;
    expect(hits).toBe(0);
  });
});

describe("Phase Two multipliers", () => {
  it("applies cooldown, tell, and damage multipliers with a configurable readable tell floor", () => {
    const sim = makeSim("alley");
    for (const id of ["cleave", "throw", "reap", "nova"] as const) {
      const spec = sim.moveSpec(id, 2);
      const a = ASCENDED_MOVES[id];
      expect(spec.cooldownS).toBeCloseTo(a.cooldownS * PHASE2.PHASE2_COOLDOWN_MULT);
      expect(spec.damage).toBeCloseTo(a.damage * PHASE2.PHASE2_DAMAGE_MULT);
      expect(spec.tellS).toBeCloseTo(Math.max(PHASE2.PHASE2_TELL_MIN_S, a.tellS * PHASE2.PHASE2_TELL_MULT));
      expect(spec.tellS).toBeGreaterThanOrEqual(PHASE2.PHASE2_TELL_MIN_S);
    }
    const harsh = makeSim("alley", { config: withPhase2({ PHASE2_TELL_MULT: 0.1 }) });
    for (const id of ["cleave", "throw", "reap", "nova"] as const) expect(harsh.moveSpec(id, 2).tellS).toBe(PHASE2.PHASE2_TELL_MIN_S);
  });

  it("speeds up free movement in Phase Two", () => {
    const p1 = makeSim("alley");
    p1.boss.x = 800;
    p1.step({ ...NO_INPUT, left: true });
    const d1 = 800 - p1.boss.x;
    const p2 = makeSim("alley");
    p2.boss.phase = 2;
    p2.boss.x = 800;
    p2.step({ ...NO_INPUT, left: true });
    const d2 = 800 - p2.boss.x;
    expect(d1).toBeCloseTo(BOSS.shiftSpeed * DT);
    expect(d2).toBeCloseTo(d1 * PHASE2.PHASE2_MOVE_SPEED_MULT);
  });
});

describe("PHASE2_ENABLED switch", () => {
  it("with Phase Two off, a fight plays out the same as a build where it can never trigger", () => {
    const off = makeSim("thief", { seed: 11, config: withPhase2({ PHASE2_ENABLED: false }) });
    const never = makeSim("thief", { seed: 11, config: withPhase2({ PHASE2_TRIGGER_PCT: -1 }) });
    runFight(off, makeBot("average", 4));
    runFight(never, makeBot("average", 4));
    expect(off.events.some((e) => e.type.startsWith("phase2"))).toBe(false);
    expect(JSON.stringify(off.events)).toBe(JSON.stringify(never.events));
  });
});

describe("FightSummary Phase Two fields", () => {
  it("reports phase2ReachedAtSec, diedInPhase, per-phase counts, bossMinHpPct and directorAdjust from a log", () => {
    const log: FightEvent[] = [
      { t: 0, type: "fight_start", life: "witch", fightIndex: 5, directorAdjust: 0.05 },
      { t: 1, type: "boss_move", move: "cleave", phase: 1 },
      { t: 2, type: "boss_move", move: "cleave", phase: 1 },
      { t: 3, type: "boss_hit", dmg: 200, hpAfter: 500, phase: 1 },
      { t: 4, type: "boss_move", move: "nova", phase: 1 },
      { t: 5, type: "boss_hit", dmg: 160, hpAfter: 340, phase: 1 },
      { t: 5, type: "phase2_start", hpBefore: 340 },
      { t: 7, type: "phase2_ready" },
      { t: 8, type: "boss_move", move: "throw", phase: 2 },
      { t: 9, type: "boss_hit", dmg: 140, hpAfter: 560, phase: 2 },
      { t: 10, type: "boss_move", move: "reap", phase: 2 },
      { t: 10.5, type: "challenger_dead", move: "reap" },
    ];
    const s = summarize(log, { fight: 5, remaining: [] });
    expect(s.phase2ReachedAtSec).toBe(5);
    expect(s.diedInPhase).toBe(2);
    expect(s.moveCountsByPhase[1]).toEqual({ cleave: 2, throw: 0, reap: 0, nova: 1 });
    expect(s.moveCountsByPhase[2]).toEqual({ cleave: 0, throw: 1, reap: 1, nova: 0 });
    expect(s.moveCounts).toEqual({ cleave: 2, throw: 1, reap: 1, nova: 1 });
    // 560 of 700 in Phase Two is 0.8, which counts as 0.8 * 0.5 = 0.4 on the shared scale.
    expect(s.bossMinHpPct).toBeCloseTo(0.4);
    expect(s.directorAdjust).toBe(0.05);
    expect(s.killingMove).toBe("reap");
    expect(s.novaAtBossHpPct).toEqual([Math.round((500 / 700) * 100) / 100]);

    const quick: FightEvent[] = [
      { t: 0, type: "fight_start", life: "alley", fightIndex: 2, directorAdjust: 0 },
      { t: 1, type: "boss_hit", dmg: 70, hpAfter: 630, phase: 1 },
      { t: 2, type: "challenger_dead", move: "cleave" },
    ];
    const q = summarize(quick, { fight: 2, remaining: [] });
    expect(q.phase2ReachedAtSec).toBeNull();
    expect(q.diedInPhase).toBe(1);
    expect(q.bossMinHpPct).toBeCloseTo(0.9);
  });
});
