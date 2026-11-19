// AI-use disclosure: written by Claude Code. The Planner interface and its three
// implementations: scripted (the required deterministic fallback), heuristic (offline
// stand-in for the agent), and live (POST to the Worker with validation and fallback).

import { PLANNER, RUN } from "../core/config";
import { COUNTER_LIFE, ROSTER, counterMoveOf, defaultTactics } from "../core/roster";
import { BOSS_MOVES, emptyMoveCounts, type BossMove, type ChallengerPlan, type FightSummary, type LifeId, type PlanResult, type Tactics, type Tier } from "../core/types";
import { FALLBACK, HEURISTIC_TEMPLATES, MOVE_SPOKEN, STOCK } from "../content/lines";
import { validatePlan } from "./validate";

export type PlannerMode = "scripted" | "heuristic" | "live";
export type MemoryMode = "history" | "last";

export interface PlannerContext {
  /** The fight about to be planned (2 to 7). */
  fightIndex: number;
  tier: Tier;
  bond: number;
  remaining: LifeId[];
  sessionId: string;
}

export interface Planner {
  readonly mode: PlannerMode;
  plan(summary: FightSummary | null, history: FightSummary[], ctx: PlannerContext): Promise<PlanResult>;
}

/** Facts the live agent may reference. It never sees the ending or the life 9 reason. */
export const ALLOWED_FACTS = [
  "The challenger is one cat on its next life, back again after dying.",
  "The Immortal sits on a throne at the top of a ruined tower and never leaves.",
  "Each life wears a new outfit and carries one new skill.",
  "At half health the Immortal drops its glaive and fights with magic. It gets faster.",
  "Earlier lives left small things in the throne room.",
];

function pick<T>(arr: T[], i: number): T {
  return arr[((i % arr.length) + arr.length) % arr.length]!;
}

export function fallbackLine(tier: Tier, fightIndex: number): string {
  return pick(FALLBACK[tier], fightIndex);
}

/** The scripted plan for a slot: fixed order, default tactics, an authored line. */
export function scriptedPlan(ctx: PlannerContext): ChallengerPlan {
  const life = (RUN.scriptedOrder as readonly LifeId[]).find((l) => ctx.remaining.includes(l)) ?? ctx.remaining[0] ?? "alley";
  return { next_life: life, tactics: defaultTactics(life), line: fallbackLine(ctx.tier, ctx.fightIndex) };
}

export class ScriptedPlanner implements Planner {
  readonly mode = "scripted" as const;
  async plan(_s: FightSummary | null, _h: FightSummary[], ctx: PlannerContext): Promise<PlanResult> {
    return { plan: scriptedPlan(ctx), source: "scripted" };
  }
}

/** Weighted move counts across the run: the last fight counts double and the killing move gets a bonus. */
export function moveWeights(summary: FightSummary | null, history: FightSummary[]): Record<BossMove, number> {
  const w = emptyMoveCounts();
  for (const h of history) for (const m of BOSS_MOVES) w[m] += h.moveCounts[m];
  if (summary) {
    for (const m of BOSS_MOVES) w[m] += summary.moveCounts[m];
    if (summary.killingMove) w[summary.killingMove] += 3;
  }
  return w;
}

function ranked(w: Record<BossMove, number>): BossMove[] {
  return [...BOSS_MOVES].sort((a, b) => w[b] - w[a] || BOSS_MOVES.indexOf(a) - BOSS_MOVES.indexOf(b));
}

/**
 * Offline stand-in for the agent. Picks the remaining life that counters the most-used
 * move, then sets bait and dodge priority from the move bigrams.
 */
export function heuristicPlan(summary: FightSummary | null, history: FightSummary[], ctx: PlannerContext): ChallengerPlan {
  const last = summary;
  const all = last ? [...history.filter((h) => h !== last), last] : history;
  const w = moveWeights(last, history.filter((h) => h !== last));
  const order = ranked(w);
  const top = order[0]!;
  const hasData = BOSS_MOVES.some((m) => w[m] > 0);

  let life: LifeId | undefined;
  if (hasData) {
    for (const m of order) {
      if (w[m] <= 0) break;
      const c = COUNTER_LIFE[m];
      if (ctx.remaining.includes(c)) {
        life = c;
        break;
      }
    }
  }
  if (!life) life = (["knight", "thief"] as LifeId[]).find((l) => ctx.remaining.includes(l));
  if (!life) life = scriptedPlan(ctx).next_life;

  // Bigrams: which move tends to follow which.
  const follow = new Map<BossMove, Map<BossMove, number>>();
  for (const s of all) {
    for (const [a, b, n] of s.topBigrams) {
      const m = follow.get(a) ?? new Map<BossMove, number>();
      m.set(b, (m.get(b) ?? 0) + n);
      follow.set(a, m);
    }
  }
  const counter = counterMoveOf(life);
  const topBigram = all.flatMap((s) => s.topBigrams).sort((x, y) => y[2] - x[2])[0];
  const bait: BossMove = counter ?? (topBigram ? topBigram[0] : top);
  const after = [...(follow.get(bait)?.entries() ?? [])].sort((x, y) => y[1] - x[1]).map(([m]) => m);
  const dodge: BossMove[] = [];
  for (const m of [bait, ...after, ...order]) if (!dodge.includes(m)) dodge.push(m);

  const distance: Tactics["distance"] = life === "alley" ? "close" : top === "cleave" && hasData ? "far" : "mid";
  const aggression = Math.min(0.9, Math.round((0.35 + 0.06 * ctx.fightIndex) * 100) / 100);

  const spoken = hasData ? MOVE_SPOKEN[top] : null;
  const line = spoken
    ? pick(HEURISTIC_TEMPLATES[ctx.tier], ctx.fightIndex).replace("{move}", spoken).replace(/^./, (c) => c.toUpperCase())
    : fallbackLine(ctx.tier, ctx.fightIndex);
  return {
    next_life: life,
    tactics: { aggression, distance, bait_attack: bait, dodge_priority: dodge.slice(0, 4) },
    line,
    rationale: hasData ? `Most-used move ${top} (weight ${w[top]}). ${ROSTER[life].name} counters ${counter ?? "any"}.` : "No data yet.",
  };
}

export class HeuristicPlanner implements Planner {
  readonly mode = "heuristic" as const;
  async plan(summary: FightSummary | null, history: FightSummary[], ctx: PlannerContext): Promise<PlanResult> {
    return { plan: heuristicPlan(summary, history, ctx), source: "heuristic" };
  }
}

export interface LivePlannerOptions {
  workerUrl: string;
  memory?: MemoryMode;
  timeoutMs?: number;
  callCap?: number;
  /** Client-side kill switch. True forces scripted plans without calling. */
  killSwitch?: boolean;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export interface PlanRequest {
  sessionId: string;
  fightIndex: number;
  tier: Tier;
  bond: number;
  remaining: LifeId[];
  memory: MemoryMode;
  summary: FightSummary | null;
  history: FightSummary[];
  allowedFacts: string[];
}

class TimeoutError extends Error {}

/** Live planner. Any failure returns the scripted plan with source "fallback" and a reason. */
export class LivePlanner implements Planner {
  readonly mode = "live" as const;
  calls = 0;
  private readonly opts: Required<Omit<LivePlannerOptions, "fetchImpl" | "now">> & Pick<LivePlannerOptions, "fetchImpl" | "now">;

  constructor(opts: LivePlannerOptions) {
    this.opts = {
      workerUrl: opts.workerUrl.replace(/\/$/, ""),
      memory: opts.memory ?? "history",
      timeoutMs: opts.timeoutMs ?? PLANNER.timeoutMs,
      callCap: opts.callCap ?? PLANNER.sessionCallCap,
      killSwitch: opts.killSwitch ?? false,
      fetchImpl: opts.fetchImpl,
      now: opts.now,
    };
  }

  private fallback(ctx: PlannerContext, reason: string, latencyMs?: number): PlanResult {
    return { plan: scriptedPlan(ctx), source: "fallback", fallbackReason: reason, latencyMs };
  }

  async plan(summary: FightSummary | null, history: FightSummary[], ctx: PlannerContext): Promise<PlanResult> {
    if (this.opts.killSwitch) return this.fallback(ctx, "kill switch");
    if (this.calls >= this.opts.callCap) return this.fallback(ctx, "session call cap");
    this.calls++;
    const now = this.opts.now ?? (() => Date.now());
    const started = now();
    const body: PlanRequest = {
      sessionId: ctx.sessionId,
      fightIndex: ctx.fightIndex,
      tier: ctx.tier,
      bond: ctx.bond,
      remaining: ctx.remaining,
      memory: this.opts.memory,
      summary,
      history: this.opts.memory === "history" ? history : summary ? [summary] : [],
      allowedFacts: ALLOWED_FACTS,
    };
    const doFetch = this.opts.fetchImpl ?? globalThis.fetch.bind(globalThis);
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        controller?.abort();
        reject(new TimeoutError("timeout"));
      }, this.opts.timeoutMs);
    });
    try {
      const res = await Promise.race([
        doFetch(`${this.opts.workerUrl}/plan`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
          signal: controller?.signal,
        }),
        timeout,
      ]);
      if (!res.ok) return this.fallback(ctx, `worker status ${res.status}`, now() - started);
      const text = await Promise.race([res.text(), timeout]);
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        return this.fallback(ctx, "invalid JSON", now() - started);
      }
      const inner = parsed && typeof parsed === "object" && "plan" in parsed ? (parsed as { plan: unknown }).plan : parsed;
      const v = validatePlan(inner, ctx.remaining);
      if (!v.ok) return this.fallback(ctx, v.reason, now() - started);
      const plan = v.lineOk ? v.plan : { ...v.plan, line: STOCK[v.plan.next_life] };
      return { plan, source: "agent", latencyMs: now() - started, fallbackReason: v.lineOk ? undefined : `stock line: ${v.lineReason}` };
    } catch (e) {
      return this.fallback(ctx, e instanceof TimeoutError ? "timeout" : `network: ${(e as Error).message}`, now() - started);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  }
}

export function makePlanner(mode: PlannerMode, live?: LivePlannerOptions): Planner {
  if (mode === "live" && live) return new LivePlanner(live);
  if (mode === "heuristic") return new HeuristicPlanner();
  return new ScriptedPlanner();
}
