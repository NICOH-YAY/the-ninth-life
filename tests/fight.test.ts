// AI-use disclosure: written by Claude Code. Combat rules, replay, skills, and hesitation.

import { describe, expect, it } from "vitest";
import { HESITATION } from "../src/core/config";
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

describe("kitten", () => {
  it("dies to a single hit from any base move", () => {
    for (const p of ["spam_cleave", "spam_throw", "spam_reap", "spam_nova"] as const) {
      const sim = makeSim("kitten", { fightIndex: 1 });
      runFight(sim, makeBot(p, 1));
      expect(sim.outcome, p).toBe("challenger_dead");
      expect(sim.events.filter((e) => e.type === "challenger_hit")).toHaveLength(1);
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
    it(`${life} outlasts and outdamages a non-counter life against ${bot}`, () => {
      const counter = makeSim(life, { seed: 4, fightIndex: 4 });
      const control = makeSim(other, { seed: 4, fightIndex: 4 });
      runFight(counter, makeBot(bot, 4));
      runFight(control, makeBot(bot, 4));
      expect(counter.events.some((e) => e.type === "evade")).toBe(true);
      // Lower boss HP reached, or the same (both won) and faster.
      const score = (s: typeof counter) => s.minBossEffPct + s.time / 10000;
      expect(score(counter)).toBeLessThan(score(control));
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
  it("never starts during a boss tell or active frames", () => {
    let seen = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const sim = makeSim("acrobat", { seed, fightIndex: 7, tier: 3, bond: 8 });
      const bot = makeBot("average", seed);
      let prev = sim.ch.state;
      while (!sim.outcome && sim.tick < 60 * 200) {
        sim.step(bot(sim));
        if (sim.ch.state === "hesitate" && prev !== "hesitate") {
          seen++;
          expect(sim.boss.move?.stage === "tell" || sim.boss.move?.stage === "active").toBe(false);
        }
        prev = sim.ch.state;
      }
      for (const e of sim.events) if (e.type === "hesitate") expect(["idle", "recover"]).toContain(e.bossStage);
    }
    expect(seen).toBeGreaterThan(0);
  });

  it("does not happen in tier 1", () => {
    const sim = makeSim("alley", { fightIndex: 2, tier: 1, bond: 8 });
    runFight(sim, makeBot("average", 3));
    expect(sim.events.some((e) => e.type === "hesitate")).toBe(false);
  });

  it("a hit during hesitation does extra damage", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const sim = makeSim("witch", { seed, fightIndex: 7, tier: 3, bond: 8 });
      runFight(sim, makeBot("aggressive", seed));
      const hit = sim.events.find((e) => e.type === "challenger_hit" && e.hesitating);
      if (hit && hit.type === "challenger_hit") {
        const normal = sim.events.find((e) => e.type === "challenger_hit" && !e.hesitating && e.move === hit.move);
        if (normal && normal.type === "challenger_hit") {
          expect(hit.dmg).toBeGreaterThan(normal.dmg);
          return;
        }
      }
    }
    throw new Error("no hesitation hit found");
  });

  it("from life 6, idling for 4 s makes the challenger lower its weapon, and attacking resumes the fight", () => {
    const sim = makeSim("knight", { fightIndex: 6 });
    while (!sim.events.some((e) => e.type === "mutual_lower") && sim.tick < 60 * 30) sim.step(NO_INPUT);
    const lower = sim.events.find((e) => e.type === "mutual_lower");
    expect(lower).toBeDefined();
    expect(lower!.t).toBeGreaterThanOrEqual(HESITATION.mutualIdleS);
    expect(sim.ch.state).toBe("lowered");
    sim.step({ ...NO_INPUT, cleave: true });
    expect(sim.ch.state).not.toBe("lowered");
    expect(sim.events.some((e) => e.type === "mutual_raise")).toBe(true);
  });

  it("before life 6, idling does not lower the weapon", () => {
    const sim = makeSim("knight", { fightIndex: 5 });
    for (let i = 0; i < 60 * 10; i++) sim.step(NO_INPUT);
    expect(sim.events.some((e) => e.type === "mutual_lower")).toBe(false);
  });
});

describe("life 8, the quiet one", () => {
  it("never attacks, talks, and leaves when spared", () => {
    const sim = makeSim("quiet", { fightIndex: 8 });
    runFight(sim, makeBot("idle"));
    expect(sim.outcome).toBe("spared");
    expect(sim.events.some((e) => e.type === "boss_hit")).toBe(false);
    expect(sim.events.filter((e) => e.type === "say").length).toBeGreaterThanOrEqual(5);
    expect(sim.boss.phase2Triggered).toBe(false);
  });

  it("dies to one strike", () => {
    const sim = makeSim("quiet", { fightIndex: 8 });
    runFight(sim, makeBot("spam_reap", 1));
    expect(sim.outcome).toBe("challenger_dead");
  });
});

describe("life 9, the hold prompt", () => {
  it("appears below 25% HP in Phase Two, and holding lets the patchwork cat land the last blow", () => {
    const sim = makeSim("patchwork", { fightIndex: 9 });
    runFight(sim, makeBot("holder", 2));
    const prompt = sim.events.find((e) => e.type === "hold_prompt");
    const yieldE = sim.events.find((e) => e.type === "yield");
    expect(prompt).toBeDefined();
    expect(yieldE).toBeDefined();
    expect(yieldE!.t).toBeGreaterThan(prompt!.t);
    expect(sim.boss.yielded).toBe(true);
    expect(sim.outcome).toBe("boss_dead");
  });

  it("without holding, the fight still ends in the patchwork win", () => {
    const sim = makeSim("patchwork", { fightIndex: 9 });
    runFight(sim, makeBot("fighter", 2));
    expect(sim.boss.yielded).toBe(false);
    expect(sim.outcome).toBe("boss_dead");
  });
});
