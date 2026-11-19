// AI-use disclosure: Codex-authored revised ending and run-state regressions.
import { describe, expect, it } from "vitest";
import { FightSim } from "../src/core/fight";
import { applyResponse, authoredPlan, clampBond, finishFight, newRun, setupFight } from "../src/core/run";
import { defaultTactics } from "../src/core/roster";
import { makeBot, runFight } from "../src/core/bots";
import { NO_INPUT, type PlanResult } from "../src/core/types";
import { withPhase2 } from "./helpers";

describe("bond",()=>{
  it("stays within zero to eight",()=>{
    const state=newRun(1); for(let i=0;i<20;i++)applyResponse(state,true);
    expect(state.bond).toBe(8); applyResponse(state,false); expect(state.bond).toBe(8);
    expect(clampBond(-3)).toBe(0); expect(clampBond(12)).toBe(8); expect(newRun(1,{bond:99}).bond).toBe(8);
  });
  it("defeating the scarf cat advances normally without erasing bond",()=>{
    const state=newRun(2,{bond:6}); state.fightIndex=8;
    const plan=authoredPlan(8), sim=new FightSim(setupFight(state,plan));
    runFight(sim,makeBot("aggressive",2)); expect(sim.outcome).toBe("challenger_dead");
    finishFight(state,sim,plan);
    expect(state.bond).toBe(6); expect(state.life8Struck).toBe(false); expect(state.fightIndex).toBe(9); expect(state.ending).toBeNull();
  });
});

describe("three endings",()=>{
  it("ordinary combat defeat produces the normal ending",()=>{
    const state=newRun(3,{config:withPhase2({PHASE2_ENABLED:false})});state.fightIndex=2;
    const plan:PlanResult={plan:{next_life:"alley",tactics:defaultTactics("alley"),line:""},source:"heuristic"};
    const setup=setupFight(state,plan);setup.stats={...setup.stats,damage:2000};
    const sim=new FightSim(setup);
    // Guard keeps this active while an overwhelming melee hit still defeats it.
    runFight(sim,()=>({...NO_INPUT,guard:true}));
    expect(sim.outcome).toBe("boss_dead");expect(sim.endReason).toBe("combat");
    finishFight(state,sim,plan);
    expect(state.ending).toEqual({kind:"normal",by:"alley",fightIndex:2,bond:0});
  });
  it("inactivity produces a distinct do-nothing ending",()=>{
    const state=newRun(4),plan=authoredPlan(1),sim=new FightSim(setupFight(state,plan));
    runFight(sim,makeBot("idle"));finishFight(state,sim,plan);
    expect(state.ending).toEqual({kind:"do_nothing",by:"kitten",fightIndex:1,bond:0});
  });
  it("beating a mortal ninth challenger records a victory",()=>{
    const state=newRun(5,{bond:5});state.fightIndex=9;
    state.used=["kitten","alley","sailor","acrobat","witch","knight","thief","quiet"];
    const plan=authoredPlan(9),sim=new FightSim(setupFight(state,plan));
    runFight(sim,makeBot("spam_reap",5));expect(sim.outcome).toBe("challenger_dead");
    finishFight(state,sim,plan);expect(state.ending).toEqual({kind:"victory",defeated:9,bond:5});
  });
  it("rejects a used or unchoosable life at setup",()=>{
    const state=newRun(6);state.fightIndex=3;state.used=["kitten","alley"];
    const bad:PlanResult={plan:{next_life:"alley",tactics:defaultTactics("alley"),line:""},source:"agent"};
    expect(setupFight(state,bad).life).toBe("sailor");bad.plan.next_life="patchwork";expect(setupFight(state,bad).life).toBe("sailor");
  });
});
