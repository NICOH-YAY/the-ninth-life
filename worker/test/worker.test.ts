// AI-use disclosure: written by Claude Code. Worker /plan with a mocked model. No live calls.

import { describe, expect, it } from "vitest";
import { handle, type Deps, type Env, type KVLike } from "../src/index";
import { buildPrompt } from "../src/prompt";

function kv(): KVLike & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, get: async (k) => data.get(k) ?? null, put: async (k, v) => void data.set(k, v) };
}

const plan = {
  next_life: "acrobat",
  tactics: { aggression: 0.6, distance: "close", bait_attack: "reap", dodge_priority: ["reap", "cleave"] },
  line: "You sweep first every time.",
  rationale: "Reap killed both earlier lives.",
};

function modelReply(text: string, status = 200): typeof fetch {
  return (async () =>
    new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }], usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 80 } }), { status })) as typeof fetch;
}

function deps(f: typeof fetch, logs: Record<string, unknown>[] = []): Deps {
  let t = 1000;
  return { fetch: f, now: () => (t += 250), log: (e) => logs.push(e), timeoutMs: 4500 };
}

function req(body: unknown): Request {
  return new Request("https://w.example/plan", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
}

const body = { sessionId: "abcd1234", fightIndex: 3, tier: 1, bond: 1, remaining: ["sailor", "acrobat", "witch", "knight", "thief"], summary: null, history: [], allowedFacts: ["fact"] };

describe("worker /plan", () => {
  it("returns a validated plan from a mocked model and logs the call", async () => {
    const logs: Record<string, unknown>[] = [];
    const env: Env = { VERTEX_API_KEY: "test-key", SESSIONS: kv() };
    const res = await handle(req(body), env, deps(modelReply(JSON.stringify(plan)), logs));
    expect(res.status).toBe(200);
    const out = (await res.json()) as { plan: { next_life: string }; tokens: { in: number } };
    expect(out.plan.next_life).toBe("acrobat");
    expect(out.tokens.in).toBe(900);
    expect(logs[0]).toMatchObject({ sessionId: "abcd1234", result: "ok", choice: "acrobat" });
  });

  it("rejects an invalid model choice", async () => {
    const env: Env = { VERTEX_API_KEY: "k", SESSIONS: kv() };
    const res = await handle(req(body), env, deps(modelReply(JSON.stringify({ ...plan, next_life: "patchwork" }))));
    expect(res.status).toBe(502);
  });

  it("honors the kill switch and the missing key without calling the model", async () => {
    let called = false;
    const spy = (async () => {
      called = true;
      return new Response("{}");
    }) as typeof fetch;
    expect((await handle(req(body), { VERTEX_API_KEY: "k", AGENT_MODE: "scripted" }, deps(spy))).status).toBe(503);
    expect((await handle(req(body), {}, deps(spy))).status).toBe(503);
    expect(called).toBe(false);
  });

  it("caps calls per session and keeps sessions isolated", async () => {
    const store = kv();
    const env: Env = { VERTEX_API_KEY: "k", SESSIONS: store, SESSION_CAP: "2" };
    const f = modelReply(JSON.stringify(plan));
    expect((await handle(req(body), env, deps(f))).status).toBe(200);
    expect((await handle(req(body), env, deps(f))).status).toBe(200);
    expect((await handle(req(body), env, deps(f))).status).toBe(429);
    expect((await handle(req({ ...body, sessionId: "other999" }), env, deps(f))).status).toBe(200);
  });

  it("returns 504 when the model times out", async () => {
    const hang = ((_u: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_, reject) => init?.signal?.addEventListener("abort", () => reject(new Error("aborted"))))) as typeof fetch;
    const d = deps(hang);
    d.timeoutMs = 20;
    const res = await handle(req(body), { VERTEX_API_KEY: "k", SESSIONS: kv() }, d);
    expect(res.status).toBe(504);
  });

  it("rejects bad requests", async () => {
    const env: Env = { VERTEX_API_KEY: "k", SESSIONS: kv() };
    expect((await handle(req({ ...body, fightIndex: 9 }), env, deps(modelReply("{}")))).status).toBe(400);
    expect((await handle(req({ ...body, remaining: ["dragon"] }), env, deps(modelReply("{}")))).status).toBe(400);
    expect((await handle(new Request("https://w.example/other"), env, deps(modelReply("{}")))).status).toBe(404);
  });

  it("builds a prompt with the remaining lives and allowed facts, and nothing about the ending", () => {
    const p = buildPrompt({ ...body, remaining: ["sailor", "witch"], summary: null, history: [] } as Parameters<typeof buildPrompt>[0]);
    expect(p).toContain("- sailor:");
    expect(p).toContain("- witch:");
    expect(p).not.toContain("acrobat");
    expect(p).toContain("- fact");
    expect(p.toLowerCase()).not.toContain("garden");
  });
});
