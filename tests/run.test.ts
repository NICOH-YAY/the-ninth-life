// AI-use disclosure: written by Claude Code. Run state: bond, life 8, endings.

import { describe, expect, it } from "vitest";
import { makeBot, runFight } from "../src/core/bots";
import { FightSim } from "../src/core/fight";
import { applyResponse, authoredPlan, clampBond, finishFight, newRun, setupFight } from "../src/core/run";
import { defaultTactics } from "../src/core/roster";
import type { PlanResult } from "../src/core/types";

describe("bond", () => {
  it("stays in 0 to 8", () => {
    const run = newRun(1);
    for (let i = 0; i < 20; i++) applyResponse(run, true);
    expect(run.bond).toBe(8);
    applyResponse(run, false);
    expect(run.bond).toBe(8);
    expect(clampBond(-3)).toBe(0);
    expect(clampBond(12)).toBe(8);
    expect(newRun(1, { bond: 99 }).bond).toBe(8);
  });
});

describe("life 8 struck", () => {
  it("sets bond to 0 and is remembered for life 9", () => {
    const run = newRun(2, { bond: 6 });
    run.fightIndex = 8;
    const plan = authoredPlan(8);
    const sim = new FightSim(setupFight(run, plan));
    expect(sim.setup.life).toBe("quiet");
    runFight(sim, makeBot("spam_reap", 1));
    finishFight(run, sim, plan);
    expect(run.life8Struck).toBe(true);
    expect(run.bond).toBe(0);
    expect(run.fightIndex).toBe(9);
  });
});

describe("endings", () => {
  it("a life from 2 to 8 that kills the Immortal ends the run too soon", () => {
    const run = newRun(3);
    run.fightIndex = 2;
    const plan: PlanResult = { plan: { next_life: "alley", tactics: defaultTactics("alley"), line: "" }, source: "heuristic" };
    const setup = setupFight(run, plan);
    setup.stats = { ...setup.stats, damage: 2000 };
    const sim = new FightSim(setup);
    runFight(sim, makeBot("idle"));
    finishFight(run, sim, plan);
    expect(run.ending).toEqual({ kind: "too_soon", by: "alley", fightIndex: 2, bond: 0 });
  });

  it("life 9 ends in letting go, held or fought", () => {
    for (const [profile, held] of [["holder", true], ["fighter", false]] as const) {
      const run = newRun(4);
      run.fightIndex = 9;
      const plan = authoredPlan(9);
      const sim = new FightSim(setupFight(run, plan));
      runFight(sim, makeBot(profile, 5));
      finishFight(run, sim, plan);
      expect(run.ending?.kind).toBe("letting_go");
      expect(run.ending && run.ending.kind === "letting_go" ? run.ending.held : null).toBe(held);
    }
  });

  it("rejects a used or unchoosable life at setup and uses the next scripted one", () => {
    const run = newRun(5);
    run.fightIndex = 3;
    run.used = ["kitten", "alley"];
    const bad: PlanResult = { plan: { next_life: "alley", tactics: defaultTactics("alley"), line: "" }, source: "agent" };
    expect(setupFight(run, bad).life).toBe("sailor");
    const patch: PlanResult = { plan: { next_life: "patchwork", tactics: defaultTactics("alley"), line: "" }, source: "agent" };
    expect(setupFight(run, patch).life).toBe("sailor");
  });
});
