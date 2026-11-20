// AI-use disclosure: Codex-authored full-run and ending-path regressions with real mobile inputs.
import { describe, expect, it } from "vitest";
import { runHeadless } from "../src/agent/headless";
import { HeuristicPlanner, ScriptedPlanner } from "../src/agent/planners";
import { NO_INPUT } from "../src/core/types";

describe("mobile headless runs",()=>{
  for(const [name,make] of [["scripted",()=>new ScriptedPlanner()],["heuristic",()=>new HeuristicPlanner()]] as const){
    it(`${name}: can defeat all nine mortal challengers`,async()=>{
      const state=await runHeadless({seed:42,planner:make(),bot:()=>"aggressive"});
      expect(state.ending).toMatchObject({kind:"victory",defeated:9});
      expect(state.summaries).toHaveLength(9);
      expect(new Set(state.summaries.map(s=>s.lifeId)).size).toBe(9);
      expect(state.summaries.map(s=>s.lifeId).slice(-2)).toEqual(["quiet","patchwork"]);
      expect(state.summaries.every(s=>s.outcome==="challenger_dead")).toBe(true);
    });
  }
  it("an inactive session reaches the do-nothing route without advancing the tutorial",async()=>{
    const state=await runHeadless({seed:3,planner:new ScriptedPlanner(),bot:()=>"idle"});
    expect(state.ending?.kind).toBe("do_nothing");expect(state.summaries).toHaveLength(1);expect(state.summaries[0]?.lifeId).toBe("kitten");
  });
  it("an active but losing defense reaches the normal route",async()=>{
    const state=await runHeadless({seed:42,planner:new ScriptedPlanner(),bot:fi=>fi===1?"aggressive":()=>({...NO_INPUT,guard:true})});
    expect(state.ending).toMatchObject({kind:"normal",fightIndex:2,by:"alley"});
    expect(state.summaries).toHaveLength(2);
    expect(state.summaries[1]?.outcome).toBe("boss_dead");
  });
  it("same seed and mobile policy reproduce the entire encounter trace",async()=>{
    const first=await runHeadless({seed:11,planner:new HeuristicPlanner()});
    const replay=await runHeadless({seed:11,planner:new HeuristicPlanner()});
    expect(replay.summaries).toEqual(first.summaries);expect(replay.ending).toEqual(first.ending);
    expect(first.ending).not.toBeNull();
  });
});
