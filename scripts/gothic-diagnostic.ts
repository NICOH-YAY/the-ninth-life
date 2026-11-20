// AI-use disclosure: Codex-authored ordinary-input kit diagnostic, no actor/stat overrides.
import { runHeadless } from "../src/agent/headless";
import { ScriptedPlanner } from "../src/agent/planners";
for (const profile of ["aggressive","average","defensive","fighter"] as const) {
 const state = await runHeadless({seed:42,planner:new ScriptedPlanner(),bot:()=>profile});
 console.log(JSON.stringify({profile,ending:state.ending,fights:state.summaries.map(s=>({life:s.lifeId,outcome:s.outcome,hp:s.bossMinHpPct}))}));
}
