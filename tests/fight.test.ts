// AI-use disclosure: written by Claude Code. Combat rules, replay, skills, and hesitation.

import { describe, expect, it } from "vitest";
import { makeBot, runFight } from "../src/core/bots";
import { NO_INPUT, type LifeId } from "../src/core/types";
import { makeSim } from "./helpers";

describe("replay", () => {
  it("a fixed seed, tactics, and input sequence give an identical event log", () => {
    for (const life of ["alley", "witch", "thief", "patchwork"] as LifeId[]) {
      const a = makeSim(life, { seed: 99, fightIndex: life === "patchwork" ? 9 : 5 });
      const b = makeSim(life, { seed: 99, fightIndex: life === "patchwork" ? 9 : 5 });
      runFight(a, makeBot("average", 17));
      runFight(b, makeBot("average", 17));
      expect(JSON.stringify(b.events)).toBe(JSON.stringify(a.events));
      expect(a.events.length).toBeGreaterThan(20);
    }
  });
});

describe("counters", () => {
  const cases: [LifeId, "spam_cleave" | "spam_throw" | "spam_reap" | "spam_nova", LifeId][] = [
    ["alley", "spam_cleave", "sailor"],
    ["sailor", "spam_throw", "alley"],
    ["acrobat", "spam_reap", "witch"],
    ["witch", "spam_nova", "sailor"],
  ];
  for (const [life, bot, other] of cases) {
    it(`${life} uses its defense against ${bot}`, () => {
      const counter = makeSim(life, { seed: 4, fightIndex: 4 });
      const control = makeSim(other, { seed: 4, fightIndex: 4 });
      runFight(counter, makeBot(bot, 4));
      runFight(control, makeBot(bot, 4));
      expect(counter.events.some((e) => e.type === "evade")).toBe(true);
      // Defense must negate an actual attack, rather than merely playing a skill animation.
      const move = bot.slice(5);
      expect(counter.events.some(e => e.type === "evade" && e.move === move)).toBe(true);
      expect(control.events.some(e => e.type === "challenger_hit")).toBe(true);
    });
  }

  it("knight armor absorbs the first hit", () => {
    const sim = makeSim("knight", { fightIndex: 3 });
    runFight(sim, makeBot("spam_reap", 2));
    const first = sim.events.find((e) => e.type === "armor_break" || e.type === "challenger_hit");
    expect(first?.type).toBe("armor_break");
  });

  it("thief decoy negates hits", () => {
    const sim = makeSim("thief", { fightIndex: 5 });
    runFight(sim, makeBot("average", 2));
    expect(sim.events.some((e) => e.type === "evade" && e.how === "decoy")).toBe(true);
  });
});

describe("hesitation", () => {
  it("never starts during a boss tell or active frames, but remains possible in recovery", () => {
    const sim = makeSim("acrobat", { seed: 7, fightIndex: 7, tier: 3, bond: 8 });
    sim.ch.state = "wait"; sim.ch.abilityT = 100;
    sim.step({ ...NO_INPUT, cleave: true });
    const hesitate = () => (sim as unknown as { maybeHesitate(t: number): boolean }).maybeHesitate(sim.time);
    for (const stage of ["tell", "active"] as const) {
      sim.boss.move!.stage = stage;
      for (let i = 0; i < 40; i++) expect(hesitate()).toBe(false);
    }
    sim.boss.move!.stage = "recover";
    let seen = false;
    for (let i = 0; i < 80; i++) seen = hesitate() || seen;
    expect(seen).toBe(true);
    for (const e of sim.events) if (e.type === "hesitate") expect(e.bossStage).toBe("recover");
  });
  it("does not happen in tier 1", () => {
    const sim = makeSim("alley", { fightIndex: 2, tier: 1, bond: 8 });
    runFight(sim, makeBot("average", 3));
    expect(sim.events.some((e) => e.type === "hesitate")).toBe(false);
  });

  it("a hit during hesitation does extra damage", () => {
    const damage = (hesitating: boolean) => {
      const sim = makeSim("quiet", { fightIndex: 8, tier: 3, stats: { speed: 0 } });
      sim.ch.x = sim.boss.x - 80; sim.ch.state = hesitating ? "hesitate" : "wait";
      sim.ch.stateT = 5; sim.ch.decisionT = 100; sim.ch.abilityT = 100;
      sim.step({ ...NO_INPUT, cleave: true });
      for (let i = 0; i < 30; i++) sim.step(NO_INPUT);
      const hit = sim.events.find(e => e.type === "challenger_hit");
      expect(hit?.type).toBe("challenger_hit");
      return hit?.type === "challenger_hit" ? hit.dmg : 0;
    };
    expect(damage(true)).toBeGreaterThan(damage(false));
  });

  it("late challengers keep attacking while the player guards without attacking", () => {
    for (const life of ["knight", "quiet", "patchwork"] as LifeId[]) {
      const sim = makeSim(life, { fightIndex: 8, tier: 1, stats: { damage: 1 } });
      for (let i = 0; i < 60 * 16; i++) sim.step({ ...NO_INPUT, guard: true });
      expect(sim.events.some(e => e.type === "mutual_lower"), life).toBe(false);
      expect(sim.ch.attackSerial, life).toBeGreaterThan(2);
      expect(sim.events.some(e => e.type === "boss_hit"), life).toBe(true);
    }
  });

  it("before life 6, idling does not lower the weapon", () => {
    const sim = makeSim("knight", { fightIndex: 5 });
    for (let i = 0; i < 60 * 10; i++) sim.step(NO_INPUT);
    expect(sim.events.some((e) => e.type === "mutual_lower")).toBe(false);
  });
});

describe("life 8 fights", () => {
  it("attacks and uses its ability instead of automatically leaving", () => {
    const sim = makeSim("quiet", { fightIndex: 8 });
    runFight(sim, makeBot("idle"), 30);
    expect(sim.outcome).not.toBe("spared");
    expect(sim.events.some((e) => e.type === "boss_hit")).toBe(true);
    expect(sim.events.some((e) => e.type === "enemy_ability")).toBe(true);
  });

  it("has a full health bar and can be defeated", () => {
    const sim = makeSim("quiet", { fightIndex: 8 });
    expect(sim.ch.maxHp).toBeGreaterThan(250);
    runFight(sim, makeBot("aggressive", 1));
    expect(sim.outcome).toBe("challenger_dead");
  });
});
