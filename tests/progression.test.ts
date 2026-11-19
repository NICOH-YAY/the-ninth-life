// AI-use disclosure: written by Claude Code. Progression and pacing tests from
// docs/challenger-progression.md.

import { describe, expect, it } from "vitest";
import { CHALLENGER, CURVE_AGENT, DIRECTOR } from "../src/core/config";
import { makeBot, runFight } from "../src/core/bots";
import { curveForSource, curveRow, directorStep, statsFor, tierFor } from "../src/core/progression";
import { defaultTactics } from "../src/core/roster";
import { newRun, setupFight } from "../src/core/run";
import { makeSim } from "./helpers";

describe("curve tables", () => {
  it("applies the agent curve rows by fight index, with fights past 6 on the 6+ row", () => {
    for (let n = 1; n <= 6; n++) expect(curveRow("agent", n)).toEqual(CURVE_AGENT[n - 1]);
    expect(curveRow("agent", 7)).toEqual(CURVE_AGENT[5]);
    const s4 = statsFor("alley", 4, "agent", 0);
    expect(s4.maxHp).toBe(Math.round(CHALLENGER.baseHp * 1.6));
    expect(s4.damage).toBeCloseTo(CHALLENGER.baseDamage * 1.45);
    expect(s4.reactionMs).toBe(260);
  });

  it("grows the scripted curve geometrically by 1.25 per fight, capped at 3.0", () => {
    expect(curveRow("scripted", 1).hp).toBeCloseTo(1);
    expect(curveRow("scripted", 2).hp).toBeCloseTo(1.25);
    expect(curveRow("scripted", 3).damage).toBeCloseTo(1.5625);
    expect(curveRow("scripted", 6).hp).toBeCloseTo(3.0);
    expect(curveRow("scripted", 7).hp).toBeCloseTo(3.0);
  });

  it("pairs scripted and fallback plans with the scripted curve, and agent or heuristic plans with the agent curve", () => {
    expect(curveForSource("scripted")).toBe("scripted");
    expect(curveForSource("fallback")).toBe("scripted");
    expect(curveForSource("agent")).toBe("agent");
    expect(curveForSource("heuristic")).toBe("agent");
  });

  it("maps fights to tiers 1-3", () => {
    expect([1, 2, 3, 4, 5, 6, 7, 8, 9].map(tierFor)).toEqual([1, 1, 1, 2, 2, 2, 3, 3, 3]);
  });
});

describe("pacing director", () => {
  it("raises the next fight when the challenger fell short and lowers it when it overshot", () => {
    // Target for fight 3 is 0.6.
    expect(directorStep(0, 3, 0.85)).toBeCloseTo(DIRECTOR.step);
    expect(directorStep(0, 3, 0.4)).toBeCloseTo(-DIRECTOR.step);
    expect(directorStep(0, 3, 0.62)).toBe(0);
  });

  it("respects its caps", () => {
    let up = 0;
    for (let i = 0; i < 20; i++) up = directorStep(up, 2, 1.0);
    expect(up).toBeCloseTo(DIRECTOR.maxUp);
    let down = 0;
    for (let i = 0; i < 20; i++) down = directorStep(down, 2, 0.0);
    expect(down).toBeCloseTo(DIRECTOR.maxDown);
  });

  it("never changes the life choice or tactics, only stats", () => {
    const run = newRun(5);
    run.fightIndex = 3;
    const plan = { plan: { next_life: "sailor" as const, tactics: { aggression: 0.8, distance: "far" as const, bait_attack: "throw" as const, dodge_priority: ["throw" as const] }, line: "" }, source: "agent" as const };
    const a = setupFight(run, plan);
    run.directorAdjust = 0.15;
    const b = setupFight(run, plan);
    expect(b.life).toBe(a.life);
    expect(b.tactics).toEqual(a.tactics);
    expect(b.stats.maxHp).toBeGreaterThan(a.stats.maxHp);
    expect(b.stats.damage).toBeGreaterThan(a.stats.damage);
  });
});

describe("midpoint", () => {
  it("with a fixed seed and scripted boss input, the midpoint fight triggers Phase Two", () => {
    // Fight 4, the acrobat (counters Low Reap) against a boss that leans on Low Reap.
    const sim = makeSim("acrobat", { seed: 2, fightIndex: 4 });
    expect(sim.setup.tactics).toEqual(defaultTactics("acrobat"));
    runFight(sim, makeBot("spam_reap", 2));
    expect(sim.boss.phase2Triggered).toBe(true);
  });
});
