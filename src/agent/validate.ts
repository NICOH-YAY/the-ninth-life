// AI-use disclosure: written by Claude Code. Validates planner output. Game code decides
// what is allowed, never the model. Shared by the client and the Worker.

import { PLANNER } from "../core/config";
import { BOSS_MOVES, CHOOSABLE_LIVES, type BossMove, type ChallengerPlan, type Distance, type LifeId } from "../core/types";

export type ValidationResult =
  | { ok: true; plan: ChallengerPlan; lineOk: boolean; lineReason?: string }
  | { ok: false; reason: string };

const DISTANCES: Distance[] = ["close", "mid", "far"];

/** Lines that insult the player, mention real-world harm, or break character are refused. */
const BLOCKLIST = [
  "kill yourself",
  "suicide",
  "self harm",
  "self-harm",
  "cut yourself",
  "stupid",
  "idiot",
  "loser",
  "pathetic",
  "worthless",
  "hate you",
  "as an ai",
  "language model",
  "player",
  "keyboard",
  "game over",
  "press ",
  "prompt",
  "gemini",
  "claude",
];

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

export function checkLine(line: unknown): { ok: true } | { ok: false; reason: string } {
  if (typeof line !== "string" || !line.trim()) return { ok: false, reason: "line missing" };
  if (wordCount(line) > PLANNER.lineMaxWords) return { ok: false, reason: "line too long" };
  if (line.length > 140) return { ok: false, reason: "line too long" };
  const lower = line.toLowerCase();
  const hit = BLOCKLIST.find((w) => lower.includes(w));
  if (hit) return { ok: false, reason: `line blocked (${hit.trim()})` };
  if (/[<>{}\\]|https?:/.test(line)) return { ok: false, reason: "line has markup" };
  return { ok: true };
}

function isMove(x: unknown): x is BossMove {
  return typeof x === "string" && (BOSS_MOVES as readonly string[]).includes(x);
}

/**
 * Checks a raw planner reply. `remaining` lists the lives still choosable for this slot.
 * Structural problems reject the whole plan (the caller falls back to the scripted plan).
 * A bad line keeps the plan and reports lineOk false, so the caller swaps in the stock line.
 */
export function validatePlan(raw: unknown, remaining: LifeId[]): ValidationResult {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return { ok: false, reason: "invalid JSON" };
    }
  }
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return { ok: false, reason: "not an object" };
  const o = obj as Record<string, unknown>;

  const life = o.next_life;
  if (typeof life !== "string" || !(CHOOSABLE_LIVES as readonly string[]).includes(life)) {
    return { ok: false, reason: `unknown or unchoosable life: ${String(life)}` };
  }
  if (!remaining.includes(life as LifeId)) return { ok: false, reason: `life already used: ${life}` };

  const t = o.tactics;
  if (!t || typeof t !== "object") return { ok: false, reason: "tactics missing" };
  const tac = t as Record<string, unknown>;
  const aggression = tac.aggression;
  if (typeof aggression !== "number" || !Number.isFinite(aggression) || aggression < 0 || aggression > 1) {
    return { ok: false, reason: "aggression out of range" };
  }
  if (typeof tac.distance !== "string" || !DISTANCES.includes(tac.distance as Distance)) return { ok: false, reason: "bad distance" };
  if (!isMove(tac.bait_attack)) return { ok: false, reason: "bad bait_attack" };
  const dp = tac.dodge_priority;
  if (!Array.isArray(dp) || dp.length === 0 || dp.length > 4 || !dp.every(isMove) || new Set(dp).size !== dp.length) {
    return { ok: false, reason: "bad dodge_priority" };
  }

  const plan: ChallengerPlan = {
    next_life: life as LifeId,
    tactics: {
      aggression,
      distance: tac.distance as Distance,
      bait_attack: tac.bait_attack,
      dodge_priority: dp as BossMove[],
    },
    line: typeof o.line === "string" ? o.line.trim() : "",
    rationale: typeof o.rationale === "string" ? o.rationale.slice(0, 400) : undefined,
  };
  const lc = checkLine(o.line);
  return lc.ok ? { ok: true, plan, lineOk: true } : { ok: true, plan, lineOk: false, lineReason: lc.reason };
}
