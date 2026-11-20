// AI-use disclosure: Codex-authored behavioral checks for distinct physical and monster attacks.
import { describe, expect, it } from "vitest";
import { KING_KIT } from "../src/core/king-kit";
import { NO_INPUT, type BossMove, type Phase } from "../src/core/types";
import { makeSim } from "./helpers";
const fixture = (phase: Phase = 1, distance = 100) => {
 const sim = makeSim("quiet", {fightIndex:8,tier:1,stats:{maxHp:5000,speed:0}});
 sim.ch.state="wait";sim.ch.x=sim.boss.x-distance;sim.ch.decisionT=100;sim.ch.abilityT=100;
 sim.boss.phase=phase;sim.boss.phase2Triggered=phase===2;return sim;
};
const start = (phase:Phase,move:BossMove,distance=100) => {
 const sim=fixture(phase,distance);if(move==="nova")sim.boss.novaCharge=sim.novaChargeNeeded();sim.step({...NO_INPUT,[move]:true});
 while(sim.boss.move?.stage==="tell") sim.step(NO_INPUT);
 return sim;
};
describe("physical king and monstrous crown",()=>{
 it("chains three real sword geometries and resets the combo after a pause",()=>{
  const sim=fixture();const combos:number[]=[];
  for(let i=0;i<4;i++){
   sim.ch.x=sim.boss.x-90; sim.step({...NO_INPUT,cleave:true});
   combos.push(sim.boss.move!.combo);
   while(sim.boss.move || sim.boss.cooldowns.cleave>0)sim.step(NO_INPUT);
  }
  expect(combos).toEqual([0,1,2,0]);
  for(let i=0;i<90;i++)sim.step(NO_INPUT);
  sim.step({...NO_INPUT,cleave:true});expect(sim.boss.move!.combo).toBe(0);
 });
 it("Oathpiercer advances the king and thrusts with no thrown return projectile",()=>{
  const sim=start(1,"throw",260);
  expect(sim.boss.x).toBeLessThan(800-90);
  expect(sim.ch.hp).toBeLessThan(sim.ch.maxHp);
  expect(sim.projectiles).toHaveLength(0);
 });
 it("the narrow physical thrust can pass below an airborne target",()=>{
  const sim=fixture(1,150);sim.ch.y=120;sim.ch.vy=600;
  sim.step({...NO_INPUT,throw:true});
  while(sim.boss.move?.stage==="tell")sim.step(NO_INPUT);
  expect(sim.ch.hp).toBe(sim.ch.maxHp);
 });
 it("monster claws pounce toward their snapshotted target before contact",()=>{
  const sim=start(2,"cleave",300);
  expect(sim.boss.x).toBe(800-KING_KIT.clawPounce);
  expect(sim.boss.move!.targetX).toBe(500);
  expect(sim.boss.move!.spawned).toBe(1);
 });
 it("Hollow Choir launches a genuine five-direction fang fan without homing",()=>{
  const sim=start(2,"throw",350);
  while(sim.boss.move?.stage==="active")sim.step(NO_INPUT);
  const fangs=sim.projectiles.filter(p=>p.kind==="wisp");
  expect(fangs).toHaveLength(5);
  expect(fangs.every(p=>p.homing===false)).toBe(true);
  expect(new Set(fangs.map(p=>Math.round(Math.atan2(p.vy,p.vx)*100))).size).toBe(5);
 });
 it("Grave Hands erupts three separate ground marks and launches rather than kneels",()=>{
  const sim=start(2,"reap",170);const move=sim.boss.move!;
  expect(move.pillars).toHaveLength(3);
  sim.ch.x=move.pillars[2]!;
  while(move.spawned<3){sim.ch.x=move.pillars[2]!;sim.ch.y=0;sim.step(NO_INPUT);}
  expect(sim.ch.hp).toBeLessThan(sim.ch.maxHp);
  expect(sim.ch.vy).toBeGreaterThan(300);expect(sim.ch.kneelT).toBe(0);
 });
 it("Procession advances its strikes instead of instantly hitting the whole hall",()=>{
  const sim=start(1,"nova",410);
  expect(sim.ch.hp).toBe(sim.ch.maxHp);
  while(sim.boss.move!.spawned<3)sim.step(NO_INPUT);
  expect(sim.ch.hp).toBeLessThan(sim.ch.maxHp);
 });
 it("Eclipse reaches distant targets only as the wave expands",()=>{
  const sim=start(2,"nova",350);
  expect(sim.ch.hp).toBe(sim.ch.maxHp);
  while(sim.boss.move?.stage==="active" && sim.ch.hp===sim.ch.maxHp)sim.step(NO_INPUT);
  expect(sim.ch.hp).toBeLessThan(sim.ch.maxHp);
 });
});
