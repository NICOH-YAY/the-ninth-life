// AI-use disclosure: written by Claude Code. The nine-life roster from docs/story-bible.md.

import type { BossMove, LifeId, Skill, Tactics } from "./types";

export interface LifeDef {
  id: LifeId;
  name: string;
  outfit: string;
  weapon: string;
  skills: Skill[];
  /** Base move this life counters. */
  counters: BossMove | "any" | "none" | "all";
  /** One saturated accessory color (art-direction rule 4). */
  color: number;
  sprite: string;
  choosable: boolean;
}

export const ROSTER: Record<LifeId, LifeDef> = {
  kitten: { id: "kitten", name: "the kitten", outfit: "nothing at all", weapon: "a twig", skills: [], counters: "none", color: 0x8a6a4a, sprite: "kitten", choosable: false },
  alley: { id: "alley", name: "the alley cat", outfit: "red bandana", weapon: "dagger", skills: ["roll"], counters: "cleave", color: 0xd8342c, sprite: "alley", choosable: true },
  sailor: { id: "sailor", name: "the sailor cat", outfit: "yellow raincoat", weapon: "umbrella", skills: ["umbrella"], counters: "throw", color: 0xf2c230, sprite: "sailor", choosable: true },
  acrobat: { id: "acrobat", name: "the acrobat cat", outfit: "cape and bell", weapon: "short staff", skills: ["double_jump"], counters: "reap", color: 0xe8902a, sprite: "acrobat", choosable: true },
  witch: { id: "witch", name: "the witch’s cat", outfit: "pointed hat", weapon: "wand", skills: ["blink"], counters: "nova", color: 0x7b3fb0, sprite: "witch", choosable: true },
  knight: { id: "knight", name: "the knight cat", outfit: "tin armor", weapon: "sword", skills: ["armor"], counters: "any", color: 0x9aa3ad, sprite: "knight", choosable: true },
  thief: { id: "thief", name: "the thief cat", outfit: "mask and hood", weapon: "two knives", skills: ["decoy"], counters: "any", color: 0x1c1c22, sprite: "thief", choosable: true },
  quiet: { id: "quiet", name: "the quiet one", outfit: "a scarf", weapon: "nothing", skills: [], counters: "none", color: 0x5a5f6e, sprite: "quiet", choosable: false },
  patchwork: { id: "patchwork", name: "the patchwork cat", outfit: "pieces of every outfit", weapon: "mended sword", skills: ["roll", "umbrella", "double_jump", "blink", "armor", "decoy"], counters: "all", color: 0xc98a4b, sprite: "patchwork", choosable: false },
};

/** Which skill answers which move. */
export const SKILL_FOR_MOVE: Record<BossMove, Skill> = {
  cleave: "roll",
  throw: "umbrella",
  reap: "double_jump",
  nova: "blink",
};

/** The life whose own skill counters a move. */
export const COUNTER_LIFE: Record<BossMove, LifeId> = {
  cleave: "alley",
  throw: "sailor",
  reap: "acrobat",
  nova: "witch",
};

export function counterMoveOf(life: LifeId): BossMove | null {
  const c = ROSTER[life].counters;
  return c === "cleave" || c === "throw" || c === "reap" || c === "nova" ? c : null;
}

export function defaultTactics(life: LifeId): Tactics {
  const bait: BossMove = counterMoveOf(life) ?? "cleave";
  const rest = (["cleave", "throw", "reap", "nova"] as BossMove[]).filter((m) => m !== bait);
  return { aggression: 0.5, distance: "mid", bait_attack: bait, dodge_priority: [bait, ...rest] };
}
