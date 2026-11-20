// AI-use disclosure: Codex-authored regressions for fair retaliation under repeated light pressure.
import { describe, expect, it } from "vitest";
import { CHALLENGER, DT } from "../src/core/config";
import type { FightSim } from "../src/core/fight";
import { NO_INPUT, type BossMove } from "../src/core/types";
import { makeSim } from "./helpers";

type Contacts = { applyDamage(move: BossMove, damage: number, t: number, negated: boolean): void };
const hit = (sim: FightSim, move: BossMove = "cleave") => (sim as unknown as Contacts).applyDamage(move, 1, sim.time, false);
const counterFixture = () => {
  const sim = makeSim("alley", { fightIndex: 4, tier: 1, stats: { maxHp: 10000, damage: 1 } });
  sim.ch.state = "wait"; sim.ch.x = sim.boss.x - 80; sim.ch.abilityT = 100;
  return sim;
};
const recover = (sim: FightSim) => {
  hit(sim);
  for (let i = 0; i < Math.ceil(CHALLENGER.hitstunS / DT) + 1; i++) sim.step({ ...NO_INPUT, guard: true });
};

describe("challenger retaliation", () => {
  it("recovers into a telegraphed counter and takes light damage without repeatedly resetting it", () => {
    const sim = counterFixture();
    recover(sim);
    expect(sim.ch.state).toBe("attack");
    expect(sim.ch.staggerResistT).toBeGreaterThan(0);
    expect(sim.ch.attackSerial).toBe(0);
    const hp = sim.ch.hp, windup = sim.ch.windupT;
    hit(sim);
    expect(sim.ch.hp).toBe(hp - 1);
    expect(sim.ch.state).toBe("attack");
    expect(sim.ch.windupT).toBe(windup);
    expect(Math.abs(sim.ch.knockVx)).toBeLessThan(260);
    for (let i = 0; i < 60; i++) sim.step({ ...NO_INPUT, guard: true });
    expect(sim.ch.attackSerial).toBeGreaterThan(0);
    const contact = sim.events.find(e => e.type === "boss_hit");
    expect(contact).toBeDefined();
    expect(contact!.t).toBeGreaterThanOrEqual(CHALLENGER.hitstunS + CHALLENGER.attackWindupS);
  });

  it("heavy attacks interrupt a protected counter; its resistance also expires", () => {
    const heavy = counterFixture(); recover(heavy); hit(heavy, "nova");
    expect(heavy.ch.state).toBe("hitstun");
    expect(heavy.ch.staggerResistT).toBe(0);
    expect(Math.abs(heavy.ch.knockVx)).toBe(420);
    const timed = counterFixture(); recover(timed);
    for (let i = 0; i < 65; i++) timed.step({ ...NO_INPUT, guard: true });
    expect(timed.ch.staggerResistT).toBe(0);
    hit(timed); expect(timed.ch.state).toBe("hitstun");
  });

  it("retaliates during real held-cleave inputs instead of retreating forever", () => {
    const sim = counterFixture();
    for (let i = 0; i < 60 * 8; i++) sim.step({ ...NO_INPUT, cleave: true });
    expect(sim.events.filter(e => e.type === "challenger_hit").length).toBeGreaterThan(4);
    expect(sim.events.some(e => e.type === "boss_hit")).toBe(true);
    expect(sim.ch.attackSerial).toBeGreaterThan(0);
  });

  it("keeps the tutorial challenger interruptible", () => {
    const sim = makeSim("kitten", { fightIndex: 1 }); sim.ch.state = "wait";
    recover(sim);
    expect(sim.ch.staggerResistT).toBe(0);
    hit(sim); expect(sim.ch.state).toBe("hitstun");
  });
});
