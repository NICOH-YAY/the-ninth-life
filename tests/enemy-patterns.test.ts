// AI-use disclosure: Codex-authored behavioral checks for independent visitor weapon patterns.
import { describe, expect, it } from "vitest";
import { ENEMY_ABILITIES, enemyShots, type EnemyShot } from "../src/core/enemy-patterns";
import type { Projectile } from "../src/core/fight";
import { NO_INPUT, type LifeId } from "../src/core/types";
import { makeSim, withPhase2 } from "./helpers";
const lives = Object.keys(ENEMY_ABILITIES) as LifeId[];
const projectile = (s: EnemyShot): Projectile => ({ ...s, move: s.low ? "reap" : "throw", traveled: 0, returning: false, canHit: true, damage: 10, dead: false });

describe("visitor weapon behaviors", () => {
  it("executes every visitor's authored attack through the actual fight simulator", () => {
    const signatures = new Set<string>();
    for (const life of lives) {
      const sim = makeSim(life, { fightIndex: life === "kitten" ? 1 : 6, tier: 1 });
      sim.ch.state = "wait"; sim.ch.x = 300; sim.ch.decisionT = 100; sim.ch.abilityT = 0;
      sim.boss.x = 800;
      for (let i = 0; i < 90 && sim.ch.abilitySerial === 0; i++) sim.step({ ...NO_INPUT, guard: true });
      expect(sim.ch.abilitySerial, life).toBe(1);
      expect(sim.projectiles.length, life).toBeGreaterThan(0);
      expect(sim.projectiles.every(p => p.style === life && p.radius! > 0 && Number.isFinite(p.vx)), life).toBe(true);
      signatures.add(JSON.stringify(sim.projectiles.map(p => [p.kind, p.vx, p.vy, p.radius, p.y])));
      if (life === "thief") expect(sim.ch.x).toBeGreaterThan(sim.boss.x);
    }
    expect(signatures.size).toBe(lives.length);
  });

  it("the chain flail actually reverses and comes back instead of being a recolored orb", () => {
    const sim = makeSim("sailor", { tier: 1 });
    sim.ch.state = "wait"; sim.ch.x = 260; sim.ch.decisionT = 100; sim.ch.abilityT = 100;
    const p = projectile(enemyShots("sailor", sim.ch, sim.boss, 0)[0]!);
    sim.projectiles = [p];
    for (let i = 0; i < 60 && !p.returning; i++) sim.step({ ...NO_INPUT, guard: true });
    expect(p.returning).toBe(true);
    expect(p.vx).toBeLessThan(0);
    const turnedAt = p.x;
    for (let i = 0; i < 12; i++) sim.step({ ...NO_INPUT, guard: true });
    expect(p.x).toBeLessThan(turnedAt);
  });

  it("frost spears alternate meaningful low and high collision lanes", () => {
    const lanes = [0, 1].map(serial => enemyShots("quiet", { x: 300, y: 0 }, { x: 800, y: 0 }, serial)[0]!);
    expect(lanes[0]!.low).toBe(true); expect(lanes[1]!.low).toBe(false);
    const run = (serial: number, airborne: boolean) => {
      const sim = makeSim("quiet", { tier: 1, config: withPhase2({ PHASE2_ENABLED: false }) });
      sim.ch.state = "wait"; sim.ch.decisionT = 100; sim.ch.abilityT = 100;
      if (airborne) { sim.boss.y = 60; sim.boss.grounded = false; }
      sim.projectiles = [projectile({ ...lanes[serial]!, x: sim.boss.x - 8 })];
      sim.step({ ...NO_INPUT, guard: true });
      return sim;
    };
    expect(run(0, false).boss.hp).toBeLessThan(run(0, true).boss.hp);
    expect(run(1, true).boss.hp).toBeLessThan(run(1, false).boss.hp);
  });

  it("crossed blades converge, while fans spread and the tutorial stays readable", () => {
    const source = { x: 300, y: 0 }, target = { x: 800, y: 0 };
    const crossed = enemyShots("patchwork", source, target, 0);
    expect(crossed[0]!.y).toBeLessThan(crossed[1]!.y);
    expect(crossed[0]!.vy).toBeGreaterThan(0); expect(crossed[1]!.vy).toBeLessThan(0);
    const fan = enemyShots("acrobat", source, target, 0);
    expect(fan[0]!.vy).toBeLessThan(0); expect(fan[2]!.vy).toBeGreaterThan(0);
    expect(enemyShots("kitten", source, target, 0)).toHaveLength(1);
    expect(ENEMY_ABILITIES.kitten.tellS).toBeGreaterThan(ENEMY_ABILITIES.knight.tellS);
  });
});
