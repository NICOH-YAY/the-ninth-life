// AI-use disclosure: written by Claude Code. Plays a whole run with no renderer: the
// nine lives, planner calls between fights, bond choices, and the ending. Used by tests,
// scripts/sim.ts, and the evaluation harness.

import { makeBot, runFight, type BossBot, type BotProfile } from "../core/bots";
import { FightSim } from "../core/fight";
import { tierFor, type CurveId } from "../core/progression";
import { applyResponse, authoredPlan, finishFight, fixedLifeFor, isOver, newRun, remainingChoosable, setupFight, type RunState } from "../core/run";
import type { PlanResult } from "../core/types";
import type { Planner } from "./planners";

export interface HeadlessOptions {
  seed: number;
  planner: Planner;
  /** Boss profile per fight index. Defaults to "average", with "holder" on fight 9. */
  bot?: (fightIndex: number) => BotProfile | BossBot;
  /** Whether the Immortal picks the open answer after a fight. Defaults to every other fight. */
  open?: (fightIndex: number) => boolean;
  curveOverride?: CurveId | null;
  sessionId?: string;
}

export async function runHeadless(opts: HeadlessOptions): Promise<RunState> {
  const state = newRun(opts.seed, { curveOverride: opts.curveOverride ?? null });
  const sessionId = opts.sessionId ?? `headless-${opts.seed}`;
  let next: PlanResult = authoredPlan(1);
  while (!isOver(state)) {
    const fi = state.fightIndex;
    const sim = new FightSim(setupFight(state, next));
    const choice = opts.bot ? opts.bot(fi) : fi === 9 ? "holder" : "average";
    const bot = typeof choice === "function" ? choice : makeBot(choice, opts.seed * 31 + fi);
    runFight(sim, bot);
    const summary = finishFight(state, sim, next);
    if (isOver(state)) break;
    applyResponse(state, opts.open ? opts.open(fi) : fi % 2 === 0);
    const nf = state.fightIndex;
    if (fixedLifeFor(nf)) {
      next = authoredPlan(nf);
    } else {
      next = await opts.planner.plan(summary, state.summaries.slice(0, -1), {
        fightIndex: nf,
        tier: tierFor(nf),
        bond: state.bond,
        remaining: remainingChoosable(state),
        sessionId,
      });
    }
  }
  return state;
}
