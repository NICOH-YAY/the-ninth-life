// AI-use disclosure: Codex-authored physics, defense, tutorial, and mortal-finale regressions.
import { describe, expect, it } from "vitest";
import { ARENA, BASE_MOVES, BOSS, DT, MOBILITY } from "../src/core/config";
import type { FightSim } from "../src/core/fight";
import { makeBot, runFight } from "../src/core/bots";
import { NO_INPUT } from "../src/core/types";
import { makeSim, withPhase2 } from "./helpers";

// Isolated contact fixtures call the same damage entry points as melee and projectiles.
type Contact = { damageBoss(damage: number, t: number, low?: boolean): void; applyDamage(move: "cleave", damage: number, t: number, negated: boolean): void };
const contact = (sim: FightSim) => sim as unknown as Contact;

describe("mobile boss physics", () => {
  it("crosses the old throne boundary and clamps both arena edges", () => {
    const sim = makeSim("kitten", {fightIndex: 1});
    for (let i = 0; i < 180; i++) sim.step({...NO_INPUT, left: true});
    expect(sim.boss.x).toBe(ARENA.bossMinX);
    for (let i = 0; i < 240; i++) sim.step({...NO_INPUT, right: true});
    expect(sim.boss.x).toBe(ARENA.bossMaxX);
  });
  it("jumps upward and lands at floor height without sinking", () => {
    const sim = makeSim("kitten", {fightIndex: 1});
    sim.step({...NO_INPUT, jump:true});
    expect(sim.boss.y).toBeGreaterThan(0);
    expect(sim.boss.grounded).toBe(false);
    let apex = sim.boss.y;
    for (let i=0;i<90;i++) { sim.step(NO_INPUT); apex=Math.max(apex,sim.boss.y); expect(sim.boss.y).toBeGreaterThanOrEqual(0); }
    expect(apex).toBeGreaterThan(70);
    expect(sim.boss.y).toBe(0);
    expect(sim.boss.vy).toBe(0);
    expect(sim.boss.grounded).toBe(true);
    expect(sim.boss.jumps).toBe(1);
  });
  it("dashes out of attack recovery, ignores hits briefly, then becomes vulnerable", () => {
    const sim = makeSim("kitten", {fightIndex:1});
    sim.step({...NO_INPUT, cleave:true});
    while (sim.boss.move?.stage !== "recover" && sim.tick<100) sim.step(NO_INPUT);
    expect(sim.boss.move?.stage).toBe("recover");
    const before = sim.boss.x;
    sim.step({...NO_INPUT,dash:true,left:true});
    expect(sim.boss.dashes).toBe(1);
    expect(sim.boss.move).toBeNull();
    expect(sim.boss.x).toBeLessThan(before);
    const hp = sim.boss.hp;
    contact(sim).damageBoss(10,sim.time);
    expect(sim.boss.hp).toBe(hp);
    for(let i=0;i<Math.ceil(MOBILITY.dashS/DT)+2;i++) sim.step(NO_INPUT);
    contact(sim).damageBoss(10,sim.time);
    expect(sim.boss.hp).toBe(hp-10);
    sim.step({...NO_INPUT,dash:true});
    expect(sim.boss.dashes).toBe(1);
  });
  it("keeps basic attacks responsive with recovery cancellation and buffered input", () => {
    const sim=makeSim("kitten",{fightIndex:1});
    sim.step({...NO_INPUT,cleave:true});
    for(let i=0;i<60;i++) sim.step({...NO_INPUT,cleave:true});
    expect(sim.events.filter(e=>e.type==="boss_move").length).toBeGreaterThanOrEqual(2);
    expect(BASE_MOVES.cleave.tellS+BASE_MOVES.cleave.activeS+BASE_MOVES.cleave.recoverS).toBeLessThan(0.6);
  });
});

describe("defense and impact",()=>{
  it("guard reduces melee damage, counts an actual block, and weakens knockback",()=>{
    const open=makeSim("kitten",{fightIndex:1}), guarded=makeSim("kitten",{fightIndex:1});
    guarded.step({...NO_INPUT,guard:true}); open.step(NO_INPUT);
    expect(guarded.boss.blocks).toBe(0);
    contact(open).damageBoss(100,open.time); contact(guarded).damageBoss(100,guarded.time);
    expect(BOSS.maxHp-guarded.boss.hp).toBeCloseTo(100*(1-MOBILITY.guardReduction));
    expect(guarded.boss.blocks).toBe(1);
    expect(Math.abs(guarded.boss.knockVx)).toBeLessThan(Math.abs(open.boss.knockVx));
    expect(open.boss.knockVx).not.toBe(0);
    const x=open.boss.x; open.step(NO_INPUT); expect(open.boss.x).toBeGreaterThan(x);
  });
  it("jump clears low projectiles but guard alone does not",()=>{
    const sim=makeSim("kitten",{fightIndex:1});
    sim.step({...NO_INPUT,jump:true});
    for(let i=0;i<5;i++)sim.step(NO_INPUT);
    expect(sim.boss.y).toBeGreaterThan(34);
    contact(sim).damageBoss(30,sim.time,true); expect(sim.boss.hp).toBe(BOSS.maxHp);
    const grounded=makeSim("kitten",{fightIndex:1}); grounded.step({...NO_INPUT,guard:true});
    contact(grounded).damageBoss(30,grounded.time,true); expect(grounded.boss.hp).toBe(BOSS.maxHp-30);
    expect(grounded.boss.blocks).toBe(0);
  });
  it("hits knock a mortal challenger away and final life has no damage immunity",()=>{
    const sim=makeSim("patchwork",{fightIndex:9});
    sim.ch.state="wait"; sim.ch.x=sim.boss.x-100; sim.ch.armorUp=false;
    contact(sim).applyDamage("cleave",25,sim.time,false);
    expect(sim.ch.hp).toBe(sim.ch.maxHp-25);
    expect(sim.ch.knockVx).toBeLessThan(0);
    sim.ch.armorUp=false;
    contact(sim).applyDamage("cleave",sim.ch.hp+1,sim.time,false);
    expect(sim.outcome).toBe("challenger_dead");
  });
  it("patchwork does not gain an unbounded timed damage multiplier",()=>{
    const a=makeSim("patchwork",{fightIndex:9}), b=makeSim("patchwork",{fightIndex:9});
    const multiplier=(s:FightSim,t:number)=>(s as unknown as {damageMult(t:number):number}).damageMult(t);
    expect(multiplier(a,1)).toBe(multiplier(b,300));
  });
});

describe("playable tutorial",()=>{
  it("survives repeated lethal hits until jump, dash, and a real guarded hit occur",()=>{
    const sim=makeSim("kitten",{fightIndex:1}); sim.ch.state="wait"; sim.ch.x=400;
    contact(sim).applyDamage("cleave",9999,0,false);
    expect(sim.ch.hp).toBe(1); expect(sim.outcome).toBeNull();
    sim.step({...NO_INPUT,jump:true,dash:true});
    expect(sim.tutorialComplete).toBe(false);
    for(let i=0;i<60;i++)sim.step(NO_INPUT);
    sim.step({...NO_INPUT,guard:true});
    expect(sim.boss.blocks).toBe(0);
    contact(sim).damageBoss(4,sim.time);
    expect(sim.tutorialComplete).toBe(true);
    contact(sim).applyDamage("cleave",100,sim.time,false);
    expect(sim.outcome).toBe("challenger_dead");
  });
  it("mobile bots complete all lessons using real player inputs",()=>{
    for(const profile of ["average","aggressive","defensive"] as const){
      const sim=makeSim("kitten",{fightIndex:1,seed:42}); runFight(sim,makeBot(profile,42),90);
      expect(sim.tutorialComplete,profile).toBe(true);
      expect(sim.outcome,profile).toBe("challenger_dead");
      expect(sim.events.some(e=>e.type==="jump")).toBe(true);
      expect(sim.events.some(e=>e.type==="dash")).toBe(true);
      expect(sim.events.some(e=>e.type==="boss_block")).toBe(true);
    }
  });
  it("doing nothing produces boredom while guard, movement, or attack resets inactivity",()=>{
    const idle=makeSim("kitten",{fightIndex:1}); runFight(idle,makeBot("idle"),MOBILITY.boredomS+2);
    expect(idle.outcome).toBe("boss_dead"); expect(idle.endReason).toBe("boredom");
    const active=makeSim("kitten",{fightIndex:1,config:withPhase2({PHASE2_ENABLED:false})});
    for(let i=0;i<100;i++)active.step(NO_INPUT);
    expect(active.boss.inactivityT).toBeGreaterThan(1);
    active.step({...NO_INPUT,left:true}); expect(active.boss.inactivityT).toBe(0);
    active.step(NO_INPUT); active.step({...NO_INPUT,guard:true}); expect(active.boss.inactivityT).toBe(0);
    active.step(NO_INPUT); active.step({...NO_INPUT,cleave:true}); expect(active.boss.inactivityT).toBe(0);
  });
});
