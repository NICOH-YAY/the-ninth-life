// AI-use disclosure: Codex-authored weapon-specific contact and hit-reaction regressions.
import { describe, expect, it } from "vitest";
import { ENEMY_MELEE } from "../src/core/enemy-patterns";
import type { LifeId } from "../src/core/types";
import { makeSim } from "./helpers";
const strike = (life:LifeId, distance=80,guard=false) => {
 const sim=makeSim(life,{fightIndex:4,tier:1,stats:{damage:10}});
 sim.ch.x=sim.boss.x-distance;sim.ch.y=0;sim.ch.state="attack";sim.boss.guarding=guard;
 (sim as unknown as {strikeBoss(t:number):void}).strikeBoss(0);return sim;
};
describe("visitor weapon contact",()=>{
 it("a frost lance reaches the king where a short blade misses",()=>{
  expect(strike("quiet",165).boss.hp).toBeLessThan(700);
  expect(strike("thief",165).boss.hp).toBe(700);
 });
 it("a hook pulls while a hammer launches and throws the king back",()=>{
  const hooked=strike("alley"),hammer=strike("knight");
  expect(hooked.boss.knockVx).toBeLessThan(0);
  expect(hammer.boss.knockVx).toBeGreaterThan(400);
  expect(hammer.boss.vy).toBeGreaterThan(150);expect(hammer.boss.grounded).toBe(false);
 });
 it("the flail and hammer put extra pressure on a real guard",()=>{
  const light=strike("thief",80,true),heavy=strike("knight",80,true);
  expect(heavy.boss.guardEnergy).toBeLessThan(light.boss.guardEnergy);
  expect(heavy.boss.blocks).toBe(1);
  expect(heavy.boss.vy).toBe(0);
 });
 it("all nine contacts have independently authored timing and geometry",()=>{
  expect(new Set(Object.values(ENEMY_MELEE).map(x=>JSON.stringify(x))).size).toBe(9);
 });
});
