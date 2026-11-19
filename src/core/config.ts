// AI-use disclosure: written by Claude Code. Every tunable number lives here.
// Numbers are placeholders for playtesting. Names follow docs/phase-two.md and
// docs/challenger-progression.md where those docs name a constant.

import type { BossMove, Distance, Tier } from "./types";

export const TICK_HZ = 60;
export const DT = 1 / TICK_HZ;

export const ARENA = {
  width: 960,
  height: 540,
  /** Screen y of the floor. Core positions use y = height above the floor. */
  floorY: 452,
  /** Height of the throne platform the Immortal stands on. */
  platformY: 36,
  leftWall: 24,
  spawnX: -40,
  startX: 90,
  bossMinX: 700,
  bossMaxX: 870,
  bossStartX: 800,
  bossHalfWidth: 52,
};

export interface MoveSpec {
  name: string;
  tellS: number;
  activeS: number;
  recoverS: number;
  cooldownS: number;
  damage: number;
}

export const BASE_MOVES: Record<BossMove, MoveSpec> = {
  cleave: { name: "Crescent Cleave", tellS: 0.45, activeS: 0.15, recoverS: 0.35, cooldownS: 1.1, damage: 16 },
  throw: { name: "Glaive Throw", tellS: 0.5, activeS: 0.1, recoverS: 0.3, cooldownS: 2.0, damage: 12 },
  reap: { name: "Low Reap", tellS: 0.4, activeS: 0.25, recoverS: 0.35, cooldownS: 1.6, damage: 13 },
  nova: { name: "Nine-Lives Nova", tellS: 1.0, activeS: 0.2, recoverS: 0.6, cooldownS: 0, damage: 26 },
};

export const ASCENDED_MOVES: Record<BossMove, MoveSpec> = {
  cleave: { name: "Pounce Rift", tellS: 0.6, activeS: 0.15, recoverS: 0.35, cooldownS: 1.2, damage: 16 },
  throw: { name: "Soul Wisps", tellS: 0.5, activeS: 0.6, recoverS: 0.3, cooldownS: 2.2, damage: 5 },
  reap: { name: "Shadow Tide", tellS: 0.45, activeS: 0.8, recoverS: 0.35, cooldownS: 1.8, damage: 10 },
  nova: { name: "Ninth Bell", tellS: 1.0, activeS: 0.2, recoverS: 0.6, cooldownS: 0, damage: 22 },
};

export const MOVE_GEOMETRY = {
  /** Cleave reaches this far in front of the boss, below this height. */
  cleaveReach: 170,
  cleaveHeight: 60,
  throwSpeed: 480,
  throwRange: 620,
  throwRadius: 24,
  throwHeight: 40,
  /** Reap and Tide hit anything on the floor (y below this). */
  floorHitHeight: 10,
  riftRadius: 90,
  wispCount: 5,
  wispIntervalS: 0.12,
  wispSpeed: 230,
  wispTurn: 3.0,
  wispTtlS: 4,
  wispRadius: 16,
  tideSecondWaveS: 0.55,
  tideWaveS: 0.25,
  bellPillarHalfWidth: 32,
  bellPillarSpacing: 170,
  bellPillarDamage: 9,
  novaChargeS: 20,
  bellChargeS: 16,
};

export const BOSS = {
  maxHp: 700,
  shiftSpeed: 150,
  inputBufferS: 0.15,
};

export interface Phase2Config {
  PHASE2_ENABLED: boolean;
  PHASE2_TRIGGER_PCT: number;
  PHASE2_TRANSITION_S: number;
  PHASE2_REFILL_PCT: number;
  PHASE2_COOLDOWN_MULT: number;
  PHASE2_TELL_MULT: number;
  PHASE2_TELL_MIN_S: number;
  PHASE2_MOVE_SPEED_MULT: number;
  PHASE2_DAMAGE_MULT: number;
  PHASE2_DAMAGE_TAKEN_MULT: number;
}

export const PHASE2: Phase2Config = {
  PHASE2_ENABLED: true,
  PHASE2_TRIGGER_PCT: 0.5,
  PHASE2_TRANSITION_S: 2.0,
  PHASE2_REFILL_PCT: 1.0,
  PHASE2_COOLDOWN_MULT: 0.7,
  PHASE2_TELL_MULT: 0.8,
  PHASE2_TELL_MIN_S: 0.3,
  PHASE2_MOVE_SPEED_MULT: 1.3,
  PHASE2_DAMAGE_MULT: 1.25,
  PHASE2_DAMAGE_TAKEN_MULT: 1.0,
};

export const CHALLENGER = {
  baseHp: 150,
  baseDamage: 15,
  baseSpeed: 150,
  reach: 44,
  attackWindupS: 0.2,
  hitstunS: 0.3,
  decisionIntervalS: 0.5,
  gravity: 1600,
  jumpVy: 540,
  doubleJumpVy: 500,
  doubleJumpDelayS: 0.28,
  rollS: 0.42,
  rollDistance: 110,
  umbrellaS: 1.5,
  blinkInvulnS: 0.4,
  blinkDistance: 170,
  decoyS: 0.9,
  skillCooldownS: { roll: 0.9, umbrella: 0.9, double_jump: 0.6, blink: 2.5, armor: 0, decoy: 3.5, hop: 1.2 },
  /** How long before the active frames each skill must start to cover them. */
  skillLeadS: { roll: 0.1, umbrella: 0.3, double_jump: 0.12, blink: 0.15, armor: 0, decoy: 0.2, hop: 0.12 },
  /** Basic hop every life but the kitten and the quiet one has. Success chance grows by fight. */
  hopBaseChance: 0.4,
  hopChancePerFight: 0.06,
  hopMaxChance: 0.8,
  hopReactionMult: 1.0,
  /** Reaction delay is multiplied by this for moves outside dodge_priority. */
  offPriorityReactionMult: 1.6,
  reactionJitter: 0.25,
  punishDamageMult: 1.5,
  distanceOffset: { close: 55, mid: 150, far: 270 } as Record<Distance, number>,
  attackDashMult: 1.6,
  punishDashMult: 2.0,
};

/** Per-life base stat overrides. Multiplied by the curve. */
export const LIFE_BASE: Partial<Record<string, { hp?: number; damage?: number }>> = {
  kitten: { hp: 12, damage: 8 },
  quiet: { hp: 1, damage: 0 },
  knight: { hp: 170 },
  thief: { damage: 16 },
};

export interface CurveRow {
  hp: number;
  damage: number;
  speed: number;
  reactionMs: number;
}

/** CURVE_AGENT: roughly linear, used when the agent (or the heuristic stand-in) plans. */
export const CURVE_AGENT: CurveRow[] = [
  { hp: 1.0, damage: 1.0, speed: 1.0, reactionMs: 450 },
  { hp: 1.2, damage: 1.15, speed: 1.05, reactionMs: 380 },
  { hp: 1.4, damage: 1.3, speed: 1.1, reactionMs: 320 },
  { hp: 1.6, damage: 1.45, speed: 1.15, reactionMs: 260 },
  { hp: 1.8, damage: 1.6, speed: 1.2, reactionMs: 210 },
  { hp: 2.0, damage: 1.75, speed: 1.25, reactionMs: 180 },
];

export const CURVE_SCRIPTED_GROWTH = 1.25;
export const CURVE_SCRIPTED_CAP = 3.0;

/** Pacing targets for the lowest effective boss HP reached, by fight index (1-based). */
export const PACING_TARGETS: Record<number, number> = {
  1: 0.9,
  2: 0.75,
  3: 0.6,
  4: 0.5,
  5: 0.35,
  6: 0.25,
  7: 0.25,
};

export const DIRECTOR = {
  tolerance: 0.1,
  step: 0.05,
  maxUp: 0.2,
  maxDown: -0.15,
};

export const PATCHWORK = {
  hp: 420,
  damage: 24,
  speed: 1.3,
  reactionMs: 150,
  aggression: 0.75,
  /** After this many seconds its damage climbs, so the authored win always lands. */
  escalateAfterS: 45,
  escalatePerS: 0.03,
  holdPromptBelowPct: 0.25,
  holdToYieldS: 1.5,
};

export const QUIET = {
  sitX: 430,
  lineCount: 6,
  lineIntervalS: 3.8,
  firstLineS: 2.0,
  leaveAfterS: 2.5,
};

export const HESITATION = {
  HESITATE_BASE: { 1: 0, 2: 0.1, 3: 0.22 } as Record<Tier, number>,
  bondStep: 0.02,
  minS: 0.8,
  maxS: 2.0,
  damageTakenMult: 1.5,
  mutualFromFight: 6,
  mutualIdleS: 4,
  mutualMaxS: 7,
};

export const BOND = { min: 0, max: 8 };

export const TIERS: Record<number, Tier> = { 1: 1, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2, 7: 3, 8: 3, 9: 3 };

export const RUN = {
  totalLives: 9,
  quietFight: 8,
  finalFight: 9,
  scriptedOrder: ["alley", "sailor", "acrobat", "witch", "knight", "thief"] as const,
  /** Safety cap on any one fight, in seconds. The game never shows a timer. */
  maxFightS: 400,
};

export const PLANNER = {
  timeoutMs: 5000,
  sessionCallCap: 12,
  lineMaxWords: 15,
};

export interface GameConfig {
  phase2: Phase2Config;
}

export const DEFAULT_CONFIG: GameConfig = { phase2: PHASE2 };
