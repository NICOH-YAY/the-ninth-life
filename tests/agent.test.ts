// AI-use disclosure: written by Claude Code. Planner validation, fallback, timeout, cap,
// kill switch, heuristic choice, and mode selection. No live model calls.

import { afterEach, describe, expect, it, vi } from "vitest";
import { resolveMode } from "../src/agent/mode";
import { HeuristicPlanner, LivePlanner, ScriptedPlanner, heuristicPlan, type PlannerContext } from "../src/agent/planners";
import { checkLine, validatePlan } from "../src/agent/validate";
import { allLines, STOCK } from "../src/content/lines";
import { summarize } from "../src/core/summary";
import { CHOOSABLE_LIVES, type FightEvent, type FightSummary } from "../src/core/types";

const ctx: PlannerContext = { fightIndex: 3, tier: 1, bond: 0, remaining: ["sailor", "acrobat", "witch", "knight", "thief"], sessionId: "test" };

const good = {
  next_life: "acrobat",
  tactics: { aggression: 0.6, distance: "close", bait_attack: "reap", dodge_priority: ["reap", "cleave"] },
  line: "You always sweep first. Not this time.",
  rationale: "Player killed 2 of 2 challengers with the sweep.",
};

function fakeFetch(body: unknown, status = 200): typeof fetch {
  return (async () =>
    ({
      ok: status >= 200 && status < 300,
      status,
      text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    }) as Response) as unknown as typeof fetch;
}

function summaryWith(moves: [string, number][], killing: string, fight = 2): FightSummary {
  const events: FightEvent[] = [{ t: 0, type: "fight_start", life: "alley", fightIndex: fight, directorAdjust: 0 }];
  let t = 1;
  for (const [m, n] of moves) for (let i = 0; i < n; i++) events.push({ t: t++, type: "boss_move", move: m as "reap", phase: 1 });
  events.push({ t: t++, type: "challenger_dead", move: killing as "reap" });
  return summarize(events, { fight, remaining: [] });
}

describe("validatePlan", () => {
  it("accepts a well-formed plan", () => {
    const v = validatePlan(good, ctx.remaining);
    expect(v.ok).toBe(true);
    if (v.ok) expect(v.lineOk).toBe(true);
  });

  it.each([
    ["bad JSON", "{not json"],
    ["unknown life", { ...good, next_life: "dragon" }],
    ["patchwork pick", { ...good, next_life: "patchwork" }],
    ["kitten pick", { ...good, next_life: "kitten" }],
    ["used life", { ...good, next_life: "alley" }],
    ["aggression out of range", { ...good, tactics: { ...good.tactics, aggression: 1.4 } }],
    ["bad distance", { ...good, tactics: { ...good.tactics, distance: "adjacent" } }],
    ["bad bait", { ...good, tactics: { ...good.tactics, bait_attack: "laser" } }],
    ["duplicate dodge", { ...good, tactics: { ...good.tactics, dodge_priority: ["reap", "reap"] } }],
    ["array", [good]],
  ])("rejects %s", (_name, raw) => {
    expect(validatePlan(raw, ctx.remaining).ok).toBe(false);
  });

  it("flags an extra-long or off-tone line without rejecting the plan", () => {
    const long = validatePlan({ ...good, line: "one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen" }, ctx.remaining);
    expect(long.ok && !long.lineOk).toBe(true);
    const rude = validatePlan({ ...good, line: "You are pathetic." }, ctx.remaining);
    expect(rude.ok && !rude.lineOk).toBe(true);
    expect(checkLine("As an AI I cannot fight.").ok).toBe(false);
  });

  it("every authored placeholder line passes the line check", () => {
    for (const l of allLines()) {
      // Templates are checked after {move} is filled in, in the heuristic test below.
      if (l.split(/\s+/).length <= 15 && !l.includes("Hold S") && !l.includes("{")) expect(checkLine(l).ok, l).toBe(true);
    }
  });
});

describe("LivePlanner fallback", () => {
  afterEach(() => vi.useRealTimers());

  it("uses the agent plan when the Worker replies with a valid plan", async () => {
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: fakeFetch({ plan: good }) });
    const r = await p.plan(null, [], ctx);
    expect(r.source).toBe("agent");
    expect(r.plan.next_life).toBe("acrobat");
  });

  it.each([
    ["bad JSON", "{oops"],
    ["unknown life", { ...good, next_life: "dragon" }],
    ["patchwork pick", { ...good, next_life: "patchwork" }],
  ])("falls back to the scripted plan on %s", async (_n, body) => {
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: fakeFetch(body) });
    const r = await p.plan(null, [], ctx);
    expect(r.source).toBe("fallback");
    expect(r.plan.next_life).toBe("sailor");
    expect(r.fallbackReason).toBeTruthy();
  });

  it("keeps the plan but swaps in the stock line when the line is too long", async () => {
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: fakeFetch({ ...good, line: "a b c d e f g h i j k l m n o p q" }) });
    const r = await p.plan(null, [], ctx);
    expect(r.source).toBe("agent");
    expect(r.plan.line).toBe(STOCK.acrobat);
    expect(r.fallbackReason).toContain("stock line");
  });

  it("falls back on a Worker error status and on a network error", async () => {
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: fakeFetch("nope", 503) });
    expect((await p.plan(null, [], ctx)).source).toBe("fallback");
    const q = new LivePlanner({ workerUrl: "http://w", fetchImpl: (async () => { throw new Error("offline"); }) as unknown as typeof fetch });
    const r = await q.plan(null, [], ctx);
    expect(r.source).toBe("fallback");
    expect(r.fallbackReason).toContain("network");
  });

  it("falls back within 5 s when the Worker never answers", async () => {
    vi.useFakeTimers();
    const never = (() => new Promise<Response>(() => {})) as unknown as typeof fetch;
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: never });
    const pending = p.plan(null, [], ctx);
    let settled = false;
    void pending.then(() => (settled = true));
    await vi.advanceTimersByTimeAsync(4999);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    const r = await pending;
    expect(r.source).toBe("fallback");
    expect(r.fallbackReason).toBe("timeout");
  });

  it("stops calling after the session call cap", async () => {
    let calls = 0;
    const counting = (async () => {
      calls++;
      return { ok: true, status: 200, text: async () => JSON.stringify(good) } as Response;
    }) as unknown as typeof fetch;
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: counting, callCap: 12 });
    const sources: string[] = [];
    for (let i = 0; i < 15; i++) sources.push((await p.plan(null, [], ctx)).source);
    expect(calls).toBe(12);
    expect(sources.slice(0, 12).every((s) => s === "agent")).toBe(true);
    expect(sources.slice(12).every((s) => s === "fallback")).toBe(true);
  });

  it("the kill switch never calls the Worker", async () => {
    let calls = 0;
    const counting = (async () => {
      calls++;
      return { ok: true, status: 200, text: async () => JSON.stringify(good) } as Response;
    }) as unknown as typeof fetch;
    const p = new LivePlanner({ workerUrl: "http://w", fetchImpl: counting, killSwitch: true });
    const r = await p.plan(null, [], ctx);
    expect(calls).toBe(0);
    expect(r.fallbackReason).toBe("kill switch");
  });

  it("sends only the last fight in last-fight memory mode", async () => {
    let sent: { history: { fight: number }[] } | null = null;
    const capture = (async (_url: string, init: RequestInit) => {
      sent = JSON.parse(String(init.body));
      return { ok: true, status: 200, text: async () => JSON.stringify(good) } as Response;
    }) as unknown as typeof fetch;
    const s1 = summaryWith([["reap", 3]], "reap", 1);
    const s2 = summaryWith([["reap", 4]], "reap", 2);
    await new LivePlanner({ workerUrl: "http://w", fetchImpl: capture, memory: "last" }).plan(s2, [s1], ctx);
    expect(sent!.history.map((h) => h.fight)).toEqual([2]);
    await new LivePlanner({ workerUrl: "http://w", fetchImpl: capture, memory: "history" }).plan(s2, [s1], ctx);
    expect(sent!.history.map((h) => h.fight)).toEqual([1]);
  });
});

describe("scripted and heuristic planners", () => {
  it("scripted follows the fixed order with default tactics", async () => {
    const r = await new ScriptedPlanner().plan(null, [], ctx);
    expect(r.source).toBe("scripted");
    expect(r.plan.next_life).toBe("sailor");
  });

  it("heuristic sends the life that counters the most-used move", async () => {
    const s = summaryWith([["reap", 6], ["cleave", 2]], "reap");
    const r = await new HeuristicPlanner().plan(s, [], ctx);
    expect(r.plan.next_life).toBe("acrobat");
    expect(r.plan.tactics.bait_attack).toBe("reap");
    expect(r.plan.tactics.dodge_priority[0]).toBe("reap");
    expect(validatePlan(r.plan, ctx.remaining).ok).toBe(true);
  });

  it("heuristic moves to the next counter when the first is used, then to knight or thief", () => {
    const s = summaryWith([["throw", 6], ["nova", 2]], "throw");
    const used = { ...ctx, remaining: ctx.remaining.filter((l) => l !== "sailor") };
    expect(heuristicPlan(s, [], used).next_life).toBe("witch");
    const s2 = summaryWith([["cleave", 6]], "cleave");
    expect(heuristicPlan(s2, [], used).next_life).toBe("knight");
  });

  it("heuristic plans always validate for every remaining set", () => {
    const s = summaryWith([["cleave", 3], ["throw", 2], ["reap", 1]], "throw");
    for (const life of CHOOSABLE_LIVES) {
      const remaining = CHOOSABLE_LIVES.filter((l) => l !== life);
      const plan = heuristicPlan(s, [], { ...ctx, remaining });
      const v = validatePlan(plan, remaining);
      expect(v.ok && v.lineOk, JSON.stringify(plan)).toBe(true);
    }
  });
});

describe("resolveMode", () => {
  it("defaults to heuristic without a Worker URL and live with one", () => {
    expect(resolveMode({}).mode).toBe("heuristic");
    expect(resolveMode({ workerUrl: "https://w.example" }).mode).toBe("live");
  });
  it("honors AGENT_MODE and the ?mode= query, and scripted is the kill switch", () => {
    expect(resolveMode({ envMode: "scripted", workerUrl: "https://w" }).mode).toBe("scripted");
    expect(resolveMode({ search: "?mode=scripted" }).mode).toBe("scripted");
    expect(resolveMode({ search: "?mode=live" }).mode).toBe("heuristic");
    expect(resolveMode({ search: "?mode=live&worker=http://localhost:8787&memory=last" })).toEqual({ mode: "live", workerUrl: "http://localhost:8787", memory: "last" });
  });
});
