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
  alley: { id: "alley", name: "the alley cat", outfit: "red bandana", weapon: "hooked sickle and short blade", skills: ["roll"], counters: "cleave", color: 0xd8342c, sprite: "alley", choosable: true },
  sailor: { id: "sailor", name: "the chain warden", outfit: "ochre burial wraps", weapon: "iron chain flail", skills: ["umbrella"], counters: "throw", color: 0xf2c230, sprite: "sailor", choosable: true },
  acrobat: { id: "acrobat", name: "the acrobat cat", outfit: "jade sash and bells", weapon: "twin chakrams", skills: ["double_jump"], counters: "reap", color: 0x46d6a5, sprite: "acrobat", choosable: true },
  witch: { id: "witch", name: "the witch’s cat", outfit: "pointed hat", weapon: "astral needle", skills: ["blink"], counters: "nova", color: 0x7b3fb0, sprite: "witch", choosable: true },
  knight: { id: "knight", name: "the knight cat", outfit: "steel-blue armor", weapon: "warhammer and tower guard", skills: ["armor"], counters: "any", color: 0x7eb2e0, sprite: "knight", choosable: true },
  thief: { id: "thief", name: "the thief cat", outfit: "mask and hood", weapon: "mirror daggers", skills: ["decoy"], counters: "any", color: 0x46d99a, sprite: "thief", choosable: true },
  quiet: { id: "quiet", name: "the quiet one", outfit: "frost-worn mantle", weapon: "frost spear and lantern", skills: [], counters: "none", color: 0x9cdff3, sprite: "quiet", choosable: false },
  patchwork: { id: "patchwork", name: "the patchwork cat", outfit: "pieces of every outfit", weapon: "broken royal sword", skills: ["roll", "umbrella", "double_jump", "blink", "armor", "decoy"], counters: "all", color: 0xea5868, sprite: "patchwork", choosable: false },
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
