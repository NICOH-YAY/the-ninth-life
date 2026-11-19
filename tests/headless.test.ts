// AI-use disclosure: written by Claude Code. Full nine-life headless runs end in an
// ending state with no exceptions, in scripted and heuristic modes.

import { describe, expect, it } from "vitest";
import { runHeadless } from "../src/agent/headless";
import { HeuristicPlanner, ScriptedPlanner } from "../src/agent/planners";

describe("headless nine-life run", () => {
  for (const [name, make] of [
    ["scripted", () => new ScriptedPlanner()],
    ["heuristic", () => new HeuristicPlanner()],
  ] as const) {
    it(`${name}: ends in an ending state, with life 8 and life 9 played`, async () => {
      for (const seed of [1, 2, 3]) {
        // A boss that fights through fights 1 to 7, spares life 8, and holds on life 9.
        const state = await runHeadless({
          seed,
          planner: make(),
          bot: (fi) => (fi === 8 ? "idle" : fi === 9 ? "holder" : "defensive"),
        });
        expect(state.ending, `seed ${seed}`).not.toBeNull();
        if (state.ending!.kind === "letting_go") {
          expect(state.summaries.map((s) => s.lifeId).slice(-2)).toEqual(["quiet", "patchwork"]);
          expect(state.ending!.held).toBe(true);
          expect(state.life8Struck).toBe(false);
          expect(new Set(state.summaries.map((s) => s.lifeId)).size).toBe(9);
        }
        expect(state.summaries[0]!.lifeId).toBe("kitten");
      }
    });
  }

  it("every run with the usual bot reaches an ending without exceptions", async () => {
    for (const seed of [4, 5, 6, 7]) {
      for (const planner of [new ScriptedPlanner(), new HeuristicPlanner()]) {
        const state = await runHeadless({ seed, planner });
        expect(state.ending).not.toBeNull();
      }
    }
  });

  it("striking life 8 sets bond to 0 and life 9 still comes", async () => {
    const state = await runHeadless({
      seed: 9,
      planner: new ScriptedPlanner(),
      bot: (fi) => (fi === 8 ? "spam_reap" : fi === 9 ? "fighter" : "defensive"),
      open: () => true,
    });
    if (state.ending?.kind === "letting_go") {
      expect(state.life8Struck).toBe(true);
      expect(state.ending.life8Struck).toBe(true);
      expect(state.ending.bond).toBe(0);
      expect(state.ending.held).toBe(false);
    } else {
      expect(state.ending?.kind).toBe("too_soon");
    }
  });
});
