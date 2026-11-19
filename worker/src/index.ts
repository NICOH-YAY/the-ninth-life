// AI-use disclosure: written by Claude Code. Cloudflare Worker for the in-game agent.
// POST /plan calls Gemini through Vertex AI (express mode API key held in Worker secrets),
// validates the reply with the same validator the client uses, and keeps per-session state.
// The key never reaches the browser. Not deployed yet.

import { validatePlan } from "../../src/agent/validate";
import { CHOOSABLE_LIVES, type FightSummary, type LifeId } from "../../src/core/types";
import { CONFIG_VERSION, RESPONSE_SCHEMA, SYSTEM, buildPrompt } from "./prompt";

/** The subset of a KV namespace this Worker uses. */
export interface KVLike {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
}

export interface Env {
  VERTEX_API_KEY?: string;
  GEMINI_MODEL?: string;
  /** "scripted" is the server-side kill switch. */
  AGENT_MODE?: string;
  ALLOWED_ORIGIN?: string;
  SESSION_CAP?: string;
  SESSIONS?: KVLike;
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
  log: (entry: Record<string, unknown>) => void;
  timeoutMs: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const memorySessions = new Map<string, string>();

function memoryKV(): KVLike {
  return {
    get: async (k) => memorySessions.get(k) ?? null,
    put: async (k, v) => {
      memorySessions.set(k, v);
    },
  };
}

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "POST, OPTIONS",
      "access-control-allow-headers": "content-type",
    },
  });
}

interface PlanBody {
  sessionId: string;
  fightIndex: number;
  tier: number;
  bond: number;
  remaining: LifeId[];
  summary: FightSummary | null;
  history: FightSummary[];
  allowedFacts: string[];
}

function parseBody(raw: unknown): PlanBody | string {
  if (!raw || typeof raw !== "object") return "body must be an object";
  const b = raw as Record<string, unknown>;
  if (typeof b.sessionId !== "string" || !/^[\w-]{4,64}$/.test(b.sessionId)) return "bad sessionId";
  if (typeof b.fightIndex !== "number" || b.fightIndex < 2 || b.fightIndex > 7) return "bad fightIndex";
  if (!Array.isArray(b.remaining) || !b.remaining.every((l) => (CHOOSABLE_LIVES as readonly unknown[]).includes(l))) return "bad remaining";
  return {
    sessionId: b.sessionId,
    fightIndex: b.fightIndex,
    tier: typeof b.tier === "number" ? b.tier : 1,
    bond: typeof b.bond === "number" ? b.bond : 0,
    remaining: b.remaining as LifeId[],
    summary: (b.summary as FightSummary | null) ?? null,
    history: Array.isArray(b.history) ? (b.history as FightSummary[]).slice(-8) : [],
    allowedFacts: Array.isArray(b.allowedFacts) ? (b.allowedFacts as unknown[]).filter((x): x is string => typeof x === "string").slice(0, 10) : [],
  };
}

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";
  if (req.method === "OPTIONS") return json({}, 204, origin);
  const url = new URL(req.url);
  if (url.pathname !== "/plan" || req.method !== "POST") return json({ error: "not found" }, 404, origin);
  if ((env.AGENT_MODE ?? "").toLowerCase() === "scripted") return json({ error: "kill switch" }, 503, origin);
  if (!env.VERTEX_API_KEY) return json({ error: "no model key configured" }, 503, origin);

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: "invalid JSON" }, 400, origin);
  }
  const body = parseBody(raw);
  if (typeof body === "string") return json({ error: body }, 400, origin);

  // Isolated per-session state: a call counter keyed by the random session id.
  const kv = env.SESSIONS ?? memoryKV();
  const key = `session:${body.sessionId}`;
  const state = JSON.parse((await kv.get(key)) ?? '{"calls":0}') as { calls: number; updatedAt?: number };
  const cap = Number(env.SESSION_CAP ?? 12);
  if (state.calls >= cap) return json({ error: "session call cap" }, 429, origin);
  state.calls++;
  state.updatedAt = deps.now();
  await kv.put(key, JSON.stringify(state), { expirationTtl: 60 * 60 * 6 });

  const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const prompt = buildPrompt(body);
  const started = deps.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs);
  const entry: Record<string, unknown> = { sessionId: body.sessionId, fight: body.fightIndex, model, config: CONFIG_VERSION, call: state.calls };
  try {
    const res = await deps.fetch(
      `https://aiplatform.googleapis.com/v1/publishers/google/models/${model}:generateContent?key=${encodeURIComponent(env.VERTEX_API_KEY)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM }] },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.7, maxOutputTokens: 400 },
        }),
      },
    );
    const latencyMs = deps.now() - started;
    entry.latencyMs = latencyMs;
    if (!res.ok) {
      entry.result = `model status ${res.status}`;
      deps.log(entry);
      return json({ error: "model error", status: res.status }, 502, origin);
    }
    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    const tokens = { in: data.usageMetadata?.promptTokenCount ?? null, out: data.usageMetadata?.candidatesTokenCount ?? null };
    entry.tokens = tokens;
    entry.raw = text.slice(0, 600);
    const v = validatePlan(text, body.remaining);
    if (!v.ok) {
      entry.result = `invalid: ${v.reason}`;
      deps.log(entry);
      return json({ error: "invalid plan", reason: v.reason }, 502, origin);
    }
    entry.result = v.lineOk ? "ok" : `ok, line flagged: ${v.lineReason}`;
    entry.choice = v.plan.next_life;
    deps.log(entry);
    return json({ plan: v.plan, model, latencyMs, tokens, config: CONFIG_VERSION }, 200, origin);
  } catch (e) {
    entry.result = controller.signal.aborted ? "timeout" : `error: ${(e as Error).message}`;
    entry.latencyMs = deps.now() - started;
    deps.log(entry);
    return json({ error: entry.result }, 504, origin);
  } finally {
    clearTimeout(timer);
  }
}

export default {
  fetch(req: Request, env: Env): Promise<Response> {
    return handle(req, env, {
      fetch: (input, init) => fetch(input, init),
      now: () => Date.now(),
      log: (entry) => console.log(JSON.stringify(entry)),
      timeoutMs: 4500,
    });
  },
};
