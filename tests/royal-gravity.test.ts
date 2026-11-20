// AI-use disclosure: Codex-authored behavioral regressions for the dodgeable royal gravity seal.
import { describe, expect, it } from "vitest";
import { ROYAL_GRAVITY } from "../src/core/royal-gravity";
import { NO_INPUT, type Phase } from "../src/core/types";
import { makeSim } from "./helpers";
const cast = (phase: Phase = 1) => {
  const sim = makeSim("quiet", { fightIndex: 8, tier: 1, stats: { maxHp: 2000, speed: 0 } });
  sim.ch.state = "wait"; sim.ch.x = sim.boss.x - 110; sim.ch.decisionT = 100; sim.ch.abilityT = 100;
  sim.boss.phase = phase; sim.boss.phase2Triggered = phase === 2;
  sim.step({ ...NO_INPUT, reap: true });
  return sim;
};
const impact = (sim: ReturnType<typeof cast>, height = 0) => {
  for (let i = 0; i < 90 && sim.boss.move?.stage === "tell"; i++) {
    sim.ch.y = height; sim.ch.vy = height ? 200 : 0;
    sim.step(NO_INPUT);
  }
};

describe("royal gravity", () => {
  it("slams an airborne target into a bounded grounded kneel with no traveling blade", () => {
    const sim = cast(); impact(sim, 50);
    expect(sim.ch.hp).toBeLessThan(sim.ch.maxHp);
    expect(sim.ch.y).toBe(0); expect(sim.ch.vy).toBe(0); expect(sim.ch.knockVx).toBe(0);
    expect(sim.ch.state).toBe("hitstun"); expect(sim.ch.kneelT).toBeGreaterThan(0.35);
    expect(sim.projectiles.some(p => p.kind === "blade")).toBe(false);
    const damageEvents = sim.events.filter(e => e.type === "challenger_hit").length;
    for (let i = 0; i < 60; i++) sim.step(NO_INPUT);
    expect(sim.ch.kneelT).toBe(0);
    expect(sim.events.filter(e => e.type === "challenger_hit")).toHaveLength(damageEvents);
  });

  it("locks its target at the tell and can miss horizontally or above its height", () => {
    const escaped = cast(), target = escaped.boss.move!.targetX;
    escaped.ch.x = target + ROYAL_GRAVITY[1].radius + 40;
    impact(escaped);
    expect(escaped.boss.move!.targetX).toBe(target);
    expect(escaped.ch.hp).toBe(escaped.ch.maxHp); expect(escaped.ch.kneelT).toBe(0);
    const high = cast(); impact(high, ROYAL_GRAVITY[1].height + 30);
    expect(high.ch.hp).toBe(high.ch.maxHp); expect(high.ch.kneelT).toBe(0);
  });

  it("the transformed seal covers a larger area and kneels longer without being mapwide", () => {
    const base = cast(1), ascended = cast(2);
    base.ch.x += 106; ascended.ch.x += 106;
    impact(base, 100); impact(ascended, 100);
    expect(base.ch.hp).toBe(base.ch.maxHp);
    expect(ascended.ch.hp).toBeLessThan(ascended.ch.maxHp);
    expect(ascended.ch.kneelT).toBeGreaterThan(ROYAL_GRAVITY[1].kneelS);
    const outside = cast(2); outside.ch.x += ROYAL_GRAVITY[2].radius + 60; impact(outside);
    expect(outside.ch.hp).toBe(outside.ch.maxHp);
  });

  it("preserves real defensive invulnerability rather than forcing every target to kneel", () => {
    const sim = cast(); sim.ch.iframes = 10; impact(sim, 30);
    expect(sim.ch.hp).toBe(sim.ch.maxHp); expect(sim.ch.kneelT).toBe(0);
    expect(sim.events.some(e => e.type === "evade" && e.move === "reap")).toBe(true);
  });
});
