// AI-use disclosure: written by Claude Code. One playthrough: run state, planner, the
// pending plan for the next life, debug jumps, and the localStorage session log.

import { resolveMode, type ModeChoice } from "../agent/mode";
import { heuristicPlan, makePlanner, scriptedPlan, type Planner } from "../agent/planners";
import { FightSim } from "../core/fight";
import { tierFor } from "../core/progression";
import {
  applyResponse,
  authoredPlan,
  finishFight,
  fixedLifeFor,
  newRun,
  remainingChoosable,
  setupFight,
  type RunState,
} from "../core/run";
import { RUN } from "../core/config";
import { NO_INPUT } from "../core/types";
import type { FightSummary, LifeId, PlanResult, Tier } from "../core/types";
import { ARRIVAL, ARRIVAL_PATCHWORK_STRUCK, FALLBACK } from "../content/lines";

const STORAGE_KEY = "ninth-life.sessions";

export interface SavedSession {
  id: string;
  startedAt: string;
  mode: string;
  summaries: FightSummary[];
  plans: { source: string; fallbackReason?: string; latencyMs?: number; next_life: string; rationale?: string }[];
  ending: RunState["ending"];
}

function randomId(): string {
  const a = new Uint32Array(2);
  if (typeof crypto !== "undefined" && crypto.getRandomValues) crypto.getRandomValues(a);
  else {
    a[0] = Math.floor(Math.random() * 2 ** 32);
    a[1] = Math.floor(Math.random() * 2 ** 32);
  }
  return Array.from(a, (n) => n.toString(36)).join("");
}

export class Session {
  readonly id = randomId();
  readonly startedAt = new Date().toISOString();
  readonly modeChoice: ModeChoice;
  readonly planner: Planner;
  state: RunState;
  /** The plan for the fight at state.fightIndex. */
  next: PlanResult = authoredPlan(1);
  pending: Promise<PlanResult> | null = null;
  lastPlan: PlanResult | null = null;
  sim: FightSim | null = null;

  constructor(search: string) {
    const env = import.meta.env;
    this.modeChoice = resolveMode({
      envMode: env.VITE_AGENT_MODE as string | undefined,
      workerUrl: env.VITE_WORKER_URL as string | undefined,
      memory: env.VITE_AGENT_MEMORY as string | undefined,
      search,
    });
    this.planner = makePlanner(
      this.modeChoice.mode,
      this.modeChoice.workerUrl ? { workerUrl: this.modeChoice.workerUrl, memory: this.modeChoice.memory } : undefined,
    );
    const seedParam = new URLSearchParams(search).get("seed");
    const seed = seedParam ? Number(seedParam) >>> 0 : (Math.random() * 2 ** 31) >>> 0;
    this.state = newRun(seed);
  }

  get fightIndex(): number {
    return this.state.fightIndex;
  }

  get tier(): Tier {
    return tierFor(Math.min(this.state.fightIndex, RUN.totalLives));
  }

  startFight(): FightSim {
    this.sim = new FightSim(setupFight(this.state, this.next));
    this.lastPlan = this.next;
    return this.sim;
  }

  /** The opening defeats the previous king; the tutorial kitten remains playable. */
  async completeOpening(): Promise<void> { return; }
  /** Records the fight. Starts the planner call for the next slot right away. */
  endFight(): FightSummary {
    const sim = this.sim!;
    const summary = finishFight(this.state, sim, this.next);
    this.save();
    if (!this.state.ending && this.state.fightIndex <= RUN.totalLives) this.pending = this.planFor(this.state.fightIndex, summary);
    return summary;
  }

  private planFor(fightIndex: number, summary: FightSummary | null): Promise<PlanResult> {
    if (fixedLifeFor(fightIndex)) return Promise.resolve(authoredPlan(fightIndex));
    const history = this.state.summaries.filter((s) => s !== summary);
    return this.planner.plan(summary, history, {
      fightIndex,
      tier: tierFor(fightIndex),
      bond: this.state.bond,
      remaining: remainingChoosable(this.state),
      sessionId: this.id,
    });
  }

  async resolveNext(): Promise<PlanResult> {
    if (this.pending) {
      const pending = this.pending;
      this.pending = null;
      try {
        this.next = await pending;
      } catch (e) {
        // A planner should never throw, but if one does the run continues on the scripted plan.
        const fi = this.state.fightIndex;
        const ctx = { fightIndex: fi, tier: tierFor(fi), bond: this.state.bond, remaining: remainingChoosable(this.state), sessionId: this.id };
        this.next = fixedLifeFor(fi) ? authoredPlan(fi) : { plan: scriptedPlan(ctx), source: "fallback", fallbackReason: "planner error: " + String(e) };
      }
    }
    return this.next;
  }

  respond(open: boolean): void {
    applyResponse(this.state, open);
  }

  /** The line spoken between fights for the life about to arrive. */
  lineFor(plan: PlanResult, fightIndex: number): string {
    const life = fixedLifeFor(fightIndex);
    if (life === "patchwork" && this.state.life8Struck) return ARRIVAL_PATCHWORK_STRUCK;
    if (life) return ARRIVAL[life] ?? "";
    return plan.plan.line || (FALLBACK[tierFor(fightIndex)][0] ?? "");
  }

  lifeFor(plan: PlanResult, fightIndex: number): LifeId {
    return fixedLifeFor(fightIndex) ?? plan.plan.next_life;
  }

  /** Debug: jump straight to a life. Earlier slots are filled in scripted order. */
  debugJump(n: number): void {
    const st = newRun(this.state.seed, { bond: this.state.bond });
    st.fightIndex = n;
    const fill: LifeId[] = [];
    for (let i = 1; i < n; i++) {
      const fixed = fixedLifeFor(i);
      if (fixed) fill.push(fixed);
      else fill.push(RUN.scriptedOrder.find((l) => !fill.includes(l)) ?? "alley");
    }
    st.used = fill;
    this.state = st;
    this.pending = null;
    if (fixedLifeFor(n)) this.next = authoredPlan(n);
    else {
      const ctx = { fightIndex: n, tier: tierFor(n), bond: st.bond, remaining: remainingChoosable(st), sessionId: this.id };
      this.next =
        this.modeChoice.mode === "scripted"
          ? { plan: scriptedPlan(ctx), source: "scripted" }
          : { plan: heuristicPlan(null, [], ctx), source: "heuristic" };
    }
  }

  save(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: SavedSession[] = raw ? (JSON.parse(raw) as SavedSession[]) : [];
      const entry: SavedSession = {
        id: this.id,
        startedAt: this.startedAt,
        mode: this.planner.mode,
        summaries: this.state.summaries,
        plans: this.state.plans.map((p) => ({
          source: p.source,
          fallbackReason: p.fallbackReason,
          latencyMs: p.latencyMs,
          next_life: p.plan.next_life,
          rationale: p.plan.rationale,
        })),
        ending: this.state.ending,
      };
      const i = list.findIndex((s) => s.id === this.id);
      if (i >= 0) list[i] = entry;
      else list.push(entry);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(-20)));
    } catch {
      // Storage can be blocked or full. The game runs without it.
    }
  }
}
