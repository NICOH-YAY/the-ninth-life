// AI-use disclosure: written by Claude Code. Shared core types for The Ninth Life.

/** Boss move ids. Each Ascended move keeps its base move's id and counter. */
export type BossMove = "cleave" | "throw" | "reap" | "nova";
export const BOSS_MOVES: readonly BossMove[] = ["cleave", "throw", "reap", "nova"];

export type LifeId =
  | "kitten"
  | "alley"
  | "sailor"
  | "acrobat"
  | "witch"
  | "knight"
  | "thief"
  | "quiet"
  | "patchwork";

/** Lives the planner may choose for fights 2 to 7. */
export const CHOOSABLE_LIVES: readonly LifeId[] = ["alley", "sailor", "acrobat", "witch", "knight", "thief"];

export type Skill = "roll" | "umbrella" | "double_jump" | "blink" | "armor" | "decoy" | "hop";
export type Distance = "close" | "mid" | "far";
export type Tier = 1 | 2 | 3;
export type Phase = 1 | 2;

export interface Tactics {
  aggression: number;
  distance: Distance;
  bait_attack: BossMove;
  dodge_priority: BossMove[];
}

export interface ChallengerPlan {
  next_life: LifeId;
  tactics: Tactics;
  line: string;
  rationale?: string;
}

export type PlanSource = "agent" | "heuristic" | "scripted" | "fallback" | "authored";

export interface PlanResult {
  plan: ChallengerPlan;
  source: PlanSource;
  /** Why a fallback fired, when it did. */
  fallbackReason?: string;
  latencyMs?: number;
}

export interface ChallengerStats {
  maxHp: number;
  damage: number;
  speed: number;
  reactionMs: number;
}

export interface BossInput {
  jump: boolean;
  dash: boolean;
  guard: boolean;
  left: boolean;
  right: boolean;
  /** Attack keys are edge-triggered: true only on the tick the key went down. */
  cleave: boolean;
  throw: boolean;
  reap: boolean;
  nova: boolean;
  /** Held key used for the life 9 "let go" prompt. */
  hold: boolean;
}

export const NO_INPUT: BossInput = {
  jump: false,
  dash: false,
  guard: false,
  left: false,
  right: false,
  cleave: false,
  throw: false,
  reap: false,
  nova: false,
  hold: false,
};

export type MoveStage = "tell" | "active" | "recover";

export type FightEvent =
  | { t: number; type: "jump" | "dash" | "boss_block" | "boredom" }
  | { t: number; type: "enemy_ability"; kind: "wave" | "orb" | "lunge"; x: number }
  | { t: number; type: "fight_start"; life: LifeId; fightIndex: number; directorAdjust: number }
  | { t: number; type: "boss_move"; move: BossMove; phase: Phase }
  | { t: number; type: "boss_shift"; dir: -1 | 1 }
  | { t: number; type: "boss_hit"; dmg: number; hpAfter: number; phase: Phase }
  | { t: number; type: "challenger_hit"; move: BossMove; dmg: number; hpAfter: number; hesitating: boolean }
  | { t: number; type: "evade"; move: BossMove; how: Skill | "flee" }
  | { t: number; type: "skill"; skill: Skill; move: BossMove }
  | { t: number; type: "armor_break" }
  | { t: number; type: "phase2_start"; hpBefore: number }
  | { t: number; type: "phase2_ready" }
  | { t: number; type: "hesitate"; dur: number; bossStage: MoveStage | "idle" }
  | { t: number; type: "mutual_lower" }
  | { t: number; type: "mutual_raise" }
  | { t: number; type: "say"; key: string }
  | { t: number; type: "hold_prompt" }
  | { t: number; type: "yield" }
  | { t: number; type: "challenger_dead"; move: BossMove | null }
  | { t: number; type: "boss_dead"; by: LifeId }
  | { t: number; type: "spared" }
  | { t: number; type: "distance"; d: number };

export type FightOutcome = "challenger_dead" | "boss_dead" | "spared";

export interface FightSummary {
  fight: number;
  fightIndex: number;
  lifeId: LifeId;
  timeAliveMs: number;
  damageDealt: number;
  moveCounts: Record<BossMove, number>;
  moveCountsByPhase: { 1: Record<BossMove, number>; 2: Record<BossMove, number> };
  firstMoves: BossMove[];
  topBigrams: [BossMove, BossMove, number][];
  killingMove: BossMove | null;
  avgDistance: number;
  shiftsPerMin: number;
  novaAtBossHpPct: number[];
  phase2ReachedAtSec: number | null;
  diedInPhase: Phase;
  bossMinHpPct: number;
  directorAdjust: number;
  outcome: FightOutcome;
  hesitations: number;
  remaining: LifeId[];
}

export function emptyMoveCounts(): Record<BossMove, number> {
  return { cleave: 0, throw: 0, reap: 0, nova: 0 };
}
