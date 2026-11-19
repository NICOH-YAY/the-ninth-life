// AI-use disclosure: written by Claude Code. Progression and pacing tests from
// docs/challenger-progression.md.

import { describe, expect, it } from "vitest";
import { DIRECTOR } from "../src/core/config";
import { curveForSource, directorStep, statsFor, tierFor } from "../src/core/progression";
import { newRun, setupFight } from "../src/core/run";

describe("curve tables", () => {
  it("grows all later encounters gradually with mortal final-life stats", () => {
    const rows = Array.from({length:8},(_,i)=>statsFor(i===7?"patchwork":i===6?"quiet":"alley",i+2,"agent",0));
    for(let i=1;i<rows.length;i++){
      expect(rows[i]!.maxHp).toBeGreaterThan(rows[i-1]!.maxHp);
      expect(rows[i]!.maxHp/rows[i-1]!.maxHp).toBeLessThan(1.3);
      expect(rows[i]!.damage).toBeGreaterThan(rows[i-1]!.damage);
      expect(rows[i]!.speed).toBeGreaterThan(rows[i-1]!.speed);
      expect(rows[i]!.reactionMs).toBeLessThanOrEqual(rows[i-1]!.reactionMs);
    }
    expect(rows[7]!.maxHp).toBeLessThan(1000);
    expect(statsFor("kitten",1,"agent",0)).toMatchObject({maxHp:260,damage:4});
  });

  it("keeps scripted strength close to adaptive strength instead of a geometric spike", () => {
    for(let n=2;n<=9;n++){
      const a=statsFor("alley",n,"agent",0),s=statsFor("alley",n,"scripted",0);
      expect(s.maxHp/a.maxHp).toBeLessThan(1.1);
      expect(s.damage).toBe(a.damage);
    }
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
