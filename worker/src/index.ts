// AI-use disclosure: written by Claude Code. Cloudflare Worker for the in-game agent.
// POST /plan calls Gemini through Vertex AI (express mode API key held in Worker secrets,
// sent in a header), validates the reply with the same validator the client uses, and
// keeps per-session and per-day call counters. The key never reaches the browser.
// Not deployed yet.

import { ALLOWED_FACTS } from "../../src/agent/planners";
import { validatePlan } from "../../src/agent/validate";
import { BOSS_MOVES, CHOOSABLE_LIVES, type BossMove, type FightSummary, type LifeId } from "../../src/core/types";
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
  /** Total model calls allowed per UTC day across all sessions. Approximate, since KV is eventually consistent. */
  DAILY_CAP?: string;
  SESSIONS?: KVLike;
}

export interface Deps {
  fetch: typeof fetch;
  now: () => number;
  log: (entry: Record<string, unknown>) => void;
  timeoutMs: number;
}

const DEFAULT_MODEL = "gemini-2.5-flash";
const MAX_BODY_BYTES = 32_000;
const ALL_LIVES: readonly string[] = ["kitten", "alley", "sailor", "acrobat", "witch", "knight", "thief", "quiet", "patchwork"];
const memorySessions = new Map<string, string>();

function memoryKV(): KVLike {
  return {
    get: async (k) => memorySessions.get(k) ?? null,
    put: async (k, v) => {
      memorySessions.set(k, v);
    },
  };
}

function corsHeaders(origin: string): Record<string, string> {
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type",
  };
}

function json(body: unknown, status: number, origin: string): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json", ...corsHeaders(origin) } });
}

const num = (x: unknown, lo: number, hi: number): number | null =>
  typeof x === "number" && Number.isFinite(x) ? Math.min(hi, Math.max(lo, x)) : null;
const isMove = (x: unknown): x is BossMove => typeof x === "string" && (BOSS_MOVES as readonly string[]).includes(x);

/**
 * Rebuilds a fight summary from untrusted input, keeping only the fields the prompt uses,
 * with enums checked and numbers clamped. Returns null if the shape is wrong.
 */
export function sanitizeSummary(raw: unknown): FightSummary | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const mc = s.moveCounts as Record<string, unknown> | undefined;
  if (!mc || typeof mc !== "object") return null;
  const moveCounts = { cleave: 0, throw: 0, reap: 0, nova: 0 };
  for (const m of BOSS_MOVES) {
    const v = num(mc[m], 0, 10_000);
    if (v === null) return null;
    moveCounts[m] = Math.round(v);
  }
  if (typeof s.lifeId !== "string" || !ALL_LIVES.includes(s.lifeId)) return null;
  const outcome = s.outcome === "boss_dead" || s.outcome === "spared" ? s.outcome : "challenger_dead";
  const firstMoves = Array.isArray(s.firstMoves) ? s.firstMoves.filter(isMove).slice(0, 5) : [];
  const topBigrams = Array.isArray(s.topBigrams)
    ? s.topBigrams
        .filter((b): b is [BossMove, BossMove, number] => Array.isArray(b) && isMove(b[0]) && isMove(b[1]) && num(b[2], 0, 10_000) !== null)
        .slice(0, 3)
        .map(([a, b, n]) => [a, b, Math.round(n)] as [BossMove, BossMove, number])
    : [];
  const empty = { cleave: 0, throw: 0, reap: 0, nova: 0 };
  return {
    fight: Math.round(num(s.fight, 1, 9) ?? 1),
    fightIndex: Math.round(num(s.fightIndex, 1, 9) ?? 1),
    lifeId: s.lifeId as LifeId,
    timeAliveMs: Math.round(num(s.timeAliveMs, 0, 3_600_000) ?? 0),
    damageDealt: Math.round(num(s.damageDealt, 0, 100_000) ?? 0),
    moveCounts,
    moveCountsByPhase: { 1: empty, 2: empty },
    firstMoves,
    topBigrams,
    killingMove: isMove(s.killingMove) ? s.killingMove : null,
    avgDistance: Math.round(num(s.avgDistance, 0, 2000) ?? 0),
    shiftsPerMin: num(s.shiftsPerMin, 0, 1000) ?? 0,
    novaAtBossHpPct: [],
    phase2ReachedAtSec: s.phase2ReachedAtSec === null ? null : num(s.phase2ReachedAtSec, 0, 3600),
    diedInPhase: s.diedInPhase === 2 ? 2 : 1,
    bossMinHpPct: num(s.bossMinHpPct, 0, 1) ?? 1,
    directorAdjust: num(s.directorAdjust, -1, 1) ?? 0,
    outcome,
    hesitations: Math.round(num(s.hesitations, 0, 1000) ?? 0),
    remaining: [],
  };
}

interface PlanBody {
  sessionId: string;
  fightIndex: number;
  tier: number;
  bond: number;
  remaining: LifeId[];
  summary: FightSummary | null;
  history: FightSummary[];
}

function parseBody(raw: unknown): PlanBody | string {
  if (!raw || typeof raw !== "object") return "body must be an object";
  const b = raw as Record<string, unknown>;
  if (typeof b.sessionId !== "string" || !/^[\w-]{4,64}$/.test(b.sessionId)) return "bad sessionId";
  if (typeof b.fightIndex !== "number" || b.fightIndex < 2 || b.fightIndex > 7) return "bad fightIndex";
  if (!Array.isArray(b.remaining) || b.remaining.length === 0 || !b.remaining.every((l) => (CHOOSABLE_LIVES as readonly unknown[]).includes(l))) return "bad remaining";
  const history = Array.isArray(b.history) ? b.history.slice(-8).map(sanitizeSummary).filter((s): s is FightSummary => s !== null) : [];
  return {
    sessionId: b.sessionId,
    fightIndex: b.fightIndex,
    tier: Math.round(num(b.tier, 1, 3) ?? 1),
    bond: Math.round(num(b.bond, 0, 8) ?? 0),
    remaining: [...new Set(b.remaining as LifeId[])],
    summary: sanitizeSummary(b.summary),
    history,
  };
}

async function bump(kv: KVLike, key: string, cap: number, ttl: number): Promise<boolean> {
  const n = Number((await kv.get(key)) ?? "0") || 0;
  if (n >= cap) return false;
  await kv.put(key, String(n + 1), { expirationTtl: ttl });
  return true;
}

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  const origin = env.ALLOWED_ORIGIN ?? "*";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(origin) });
  const url = new URL(req.url);
  if (url.pathname !== "/plan" || req.method !== "POST") return json({ error: "not found" }, 404, origin);
  if ((env.AGENT_MODE ?? "").toLowerCase() === "scripted") return json({ error: "kill switch" }, 503, origin);
  if (!env.VERTEX_API_KEY) return json({ error: "agent unavailable" }, 503, origin);

  let raw: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: "body too large" }, 413, origin);
    raw = JSON.parse(text);
  } catch {
    return json({ error: "invalid JSON" }, 400, origin);
  }
  const body = parseBody(raw);
  if (typeof body === "string") return json({ error: body }, 400, origin);

  // Spending limits: a global daily cap first (session ids are chosen by the client), then
  // the per-session cap. Session state is isolated by the random session id.
  const kv = env.SESSIONS ?? memoryKV();
  const day = new Date(deps.now()).toISOString().slice(0, 10);
  if (!(await bump(kv, `daily:${day}`, Number(env.DAILY_CAP ?? 400), 60 * 60 * 30))) return json({ error: "daily cap" }, 429, origin);
  if (!(await bump(kv, `session:${body.sessionId}`, Number(env.SESSION_CAP ?? 12), 60 * 60 * 6))) return json({ error: "session call cap" }, 429, origin);

  const model = env.GEMINI_MODEL ?? DEFAULT_MODEL;
  const started = deps.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs);
  const entry: Record<string, unknown> = { sessionId: body.sessionId, fight: body.fightIndex, model, config: CONFIG_VERSION };
  try {
    // Facts come from the server, never from the request.
    const prompt = buildPrompt({ ...body, allowedFacts: ALLOWED_FACTS });
    const res = await deps.fetch(`https://aiplatform.googleapis.com/v1/publishers/google/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": env.VERTEX_API_KEY },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", responseSchema: RESPONSE_SCHEMA, temperature: 0.7, maxOutputTokens: 400 },
      }),
    });
    const latencyMs = deps.now() - started;
    entry.latencyMs = latencyMs;
    if (!res.ok) {
      entry.result = `model status ${res.status}`;
      deps.log(entry);
      return json({ error: "model error" }, 502, origin);
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
      return json({ error: "invalid plan" }, 502, origin);
    }
    entry.result = v.lineOk ? "ok" : `ok, line flagged: ${v.lineReason}`;
    entry.choice = v.plan.next_life;
    deps.log(entry);
    return json({ plan: v.plan, model, latencyMs, tokens, config: CONFIG_VERSION }, 200, origin);
  } catch (e) {
    const timedOut = controller.signal.aborted;
    entry.result = timedOut ? "timeout" : `error: ${(e as Error).name}`;
    entry.latencyMs = deps.now() - started;
    deps.log(entry);
    return json({ error: timedOut ? "model timeout" : "agent error" }, 504, origin);
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
