// AI-use disclosure: written by Claude Code. Prompt and response schema for the
// challengers' collective mind. Mirrored in agents/challenger/system.md for review.

import { ROSTER } from "../../src/core/roster";
import type { FightSummary, LifeId } from "../../src/core/types";

export const CONFIG_VERSION = "challenger-v0.1";

export const SYSTEM = [
  "You are the shared mind of a small cat's past lives. Each life climbs a tower to face an immortal cat on a throne.",
  "Between fights you choose which past life goes next, how it should fight, and one short line it says on arrival.",
  "Rules:",
  "1. next_life must be one of the remaining lives you are given. Never choose any other.",
  "2. Read the fight summary and pick the life whose skill counters the move that hurt the last lives most.",
  "3. tactics.aggression is 0 to 1. tactics.distance is close, mid, or far. bait_attack and dodge_priority use only the move ids cleave, throw, reap, nova.",
  "4. line is at most 15 words, plain and short, spoken by the cat to the immortal. Stay in the world. Never mention players, keyboards, games, or AI.",
  "5. Match the tone to the tier: tier 1 boastful and nervous, tier 2 curious and naming its habits, tier 3 warm and familiar. Higher bond means warmer.",
  "6. Only reference the allowed facts. Do not invent plot. Do not say why the lives keep coming.",
  "7. At half health the immortal drops its glaive and fights with magic, faster. You can mention that.",
  "8. rationale is one sentence for the developer log. The player never sees it.",
].join("\n");

export const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    next_life: { type: "STRING", enum: ["alley", "sailor", "acrobat", "witch", "knight", "thief"] },
    tactics: {
      type: "OBJECT",
      properties: {
        aggression: { type: "NUMBER" },
        distance: { type: "STRING", enum: ["close", "mid", "far"] },
        bait_attack: { type: "STRING", enum: ["cleave", "throw", "reap", "nova"] },
        dodge_priority: { type: "ARRAY", items: { type: "STRING", enum: ["cleave", "throw", "reap", "nova"] } },
      },
      required: ["aggression", "distance", "bait_attack", "dodge_priority"],
    },
    line: { type: "STRING" },
    rationale: { type: "STRING" },
  },
  required: ["next_life", "tactics", "line"],
};

export interface PromptInput {
  fightIndex: number;
  tier: number;
  bond: number;
  remaining: LifeId[];
  summary: FightSummary | null;
  history: FightSummary[];
  allowedFacts: string[];
}

function compact(s: FightSummary): string {
  const moves = Object.entries(s.moveCounts)
    .filter(([, n]) => n > 0)
    .map(([m, n]) => `${m} x${n}`)
    .join(", ");
  const bigrams = s.topBigrams.map(([a, b, n]) => `${a}>${b} x${n}`).join(", ");
  return [
    `fight ${s.fightIndex}: ${s.lifeId}, ${s.outcome}, alive ${Math.round(s.timeAliveMs / 1000)}s`,
    `moves: ${moves || "none"}; first: ${s.firstMoves.join(" ") || "none"}; pairs: ${bigrams || "none"}`,
    `killed by: ${s.killingMove ?? "nothing"}; lowest immortal health ${Math.round(s.bossMinHpPct * 100)}%; phase two ${s.phase2ReachedAtSec === null ? "no" : "yes"}`,
    `average distance ${s.avgDistance}px; shifts per minute ${s.shiftsPerMin}`,
  ].join("\n");
}

export function buildPrompt(p: PromptInput): string {
  const lives = p.remaining
    .map((l) => {
      const d = ROSTER[l];
      return `- ${l}: ${d.outfit}, skill ${d.skills.join("/") || "none"}, counters ${d.counters}`;
    })
    .join("\n");
  const earlier = p.history.filter((h) => h !== p.summary).map(compact).join("\n\n");
  return [
    `Next fight: ${p.fightIndex} of 9. Tier ${p.tier}. Bond ${p.bond} of 8.`,
    "",
    "Remaining lives you may choose:",
    lives,
    "",
    "Last fight:",
    p.summary ? compact(p.summary) : "none yet",
    "",
    earlier ? `Earlier fights:\n${earlier}` : "No earlier fights in memory.",
    "",
    "Allowed facts:",
    ...p.allowedFacts.map((f) => `- ${f}`),
    "",
    "Reply with JSON only.",
  ].join("\n");
}
