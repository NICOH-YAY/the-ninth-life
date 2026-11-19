// AI-use disclosure: written by Claude Code. Headless pacing report. Runs full nine-life
// runs for each planner, curve, and boss profile, then prints the mean lowest boss HP per
// fight (shared scale, Phase Two counts as half) and where Phase Two first appears.
// Usage: npm run sim [-- runs]
import { runHeadless } from "../src/agent/headless";
import { HeuristicPlanner, ScriptedPlanner, type Planner } from "../src/agent/planners";
import { PACING_TARGETS } from "../src/core/config";
import type { BotProfile } from "../src/core/bots";
import type { CurveId } from "../src/core/progression";

declare const process: { argv: string[] };
const runs = Number(process.argv[2] ?? 12);
const profiles: BotProfile[] = ["average", "aggressive", "defensive"];
const configs: { name: string; planner: () => Planner; curve: CurveId | null }[] = [
  { name: "heuristic/shipped", planner: () => new HeuristicPlanner(), curve: null },
  { name: "scripted/shipped", planner: () => new ScriptedPlanner(), curve: null },
  { name: "heuristic/agentCurve", planner: () => new HeuristicPlanner(), curve: "agent" },
  { name: "scripted/agentCurve", planner: () => new ScriptedPlanner(), curve: "agent" },
];

const fmt = (x: number) => x.toFixed(2);
console.log("targets   " + [1, 2, 3, 4, 5, 6, 7].map((f) => fmt(PACING_TARGETS[f] ?? 0)).join("  "));
for (const prof of profiles) {
  for (const c of configs) {
    const sums: number[] = Array(10).fill(0);
    const ns: number[] = Array(10).fill(0);
    const firstP2: number[] = [];
    const endings: Record<string, number> = {};
    let secs = 0;
    for (let seed = 1; seed <= runs; seed++) {
      const st = await runHeadless({ seed: seed * 101, planner: c.planner(), curveOverride: c.curve, bot: () => prof });
      for (const s of st.summaries) {
        sums[s.fightIndex] = (sums[s.fightIndex] ?? 0) + s.bossMinHpPct;
        ns[s.fightIndex] = (ns[s.fightIndex] ?? 0) + 1;
        secs += s.timeAliveMs / 1000;
      }
      const p2 = st.summaries.find((s) => s.phase2ReachedAtSec !== null && s.lifeId !== "patchwork");
      firstP2.push(p2 ? p2.fightIndex : 10);
      const k = st.ending ? (st.ending.kind === "victory" ? "victory" : st.ending.kind + "@" + st.ending.fightIndex) : "none";
      endings[k] = (endings[k] ?? 0) + 1;
    }
    const row = [1, 2, 3, 4, 5, 6, 7].map((f) => (ns[f] ? fmt((sums[f] ?? 0) / (ns[f] ?? 1)) : " -- ")).join("  ");
    const mp2 = firstP2.reduce((a, b) => a + b, 0) / firstP2.length;
    console.log(prof.padEnd(10) + row + "  firstP2 " + mp2.toFixed(1) + "  min/run " + (secs / runs / 60).toFixed(1) + "  " + c.name + "  " + JSON.stringify(endings));
  }
}
