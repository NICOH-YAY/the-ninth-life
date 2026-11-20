// AI-use disclosure: written by Claude Code. Deterministic fight simulation.
// Pure TypeScript, no rendering imports. 60 Hz fixed step, seeded RNG.
// Same setup and same per-tick inputs always give the same event log.

import {
  ARENA,
  MOBILITY,
  ASCENDED_MOVES,
  BASE_MOVES,
  BOSS,
  CHALLENGER,
  DEFAULT_CONFIG,
  DT,
  HESITATION,
  MOVE_GEOMETRY as G,
  PATCHWORK,
  QUIET,
  RUN,
  type GameConfig,
  type MoveSpec,
} from "./config";
import { Rng } from "./rng";
import { ENEMY_ABILITIES, enemyShots } from "./enemy-patterns";
import { ROYAL_GRAVITY } from "./royal-gravity";
import { ROSTER, SKILL_FOR_MOVE } from "./roster";
import type {
  BossInput,
  BossMove,
  ChallengerStats,
  FightEvent,
  FightOutcome,
  LifeId,
  MoveStage,
  Phase,
  Skill,
  Tactics,
  Tier,
} from "./types";

export interface FightSetup {
  seed: number;
  life: LifeId;
  fightIndex: number;
  tactics: Tactics;
  stats: ChallengerStats;
  tier: Tier;
  bond: number;
  directorAdjust: number;
  config?: GameConfig;
}

export interface ActiveMove {
  id: BossMove;
  phase: Phase;
  stage: MoveStage;
  t: number;
  spec: MoveSpec;
  direction: -1 | 1;
  targetX: number;
  pillars: number[];
  hitCh: boolean;
  waveHits: number;
  spawned: number;
}

export interface Projectile {
  kind: "glaive" | "wisp" | "blade" | "enemy-wave" | "enemy-orb";
  move: BossMove;
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  traveled: number;
  returning: boolean;
  canHit: boolean;
  damage: number;
  dead: boolean;
  /** Visitor weapon identity and collision/motion geometry. */
  style?: LifeId;
  radius?: number;
  low?: boolean;
  gravity?: number;
  returnAtDistance?: number;
}

export type ChState =
  | "enter"
  | "approach"
  | "wait"
  | "attack"
  | "backoff"
  | "evade"
  | "flee"
  | "hitstun"
  | "hesitate"
  | "lowered"
  | "sit"
  | "leave"
  | "dead";

export interface BossState {
  y: number; vy: number; vx: number; facing: -1 | 1; grounded: boolean;
  dashT: number; dashCooldown: number; invulnT: number; coyoteT: number; jumpBufferT: number;
  guardEnergy: number; guarding: boolean; knockVx: number;
  jumps: number; dashes: number; blocks: number; inactivityT: number;
  x: number;
  hp: number;
  maxHp: number;
  phase: Phase;
  phase2Triggered: boolean;
  transitionT: number;
  move: ActiveMove | null;
  cooldowns: Record<BossMove, number>;
  novaCharge: number;
  buffered: { move: BossMove; until: number } | null;
  shiftDir: -1 | 0 | 1;
  glaiveDropX: number | null;
  holdAvailable: boolean;
  holdT: number;
  yielded: boolean;
  hitFlashT: number;
}

export interface ChallengerState {
  knockVx: number; abilityT: number; abilityTellT: number; abilityKind: "wave" | "orb" | "lunge";
  attackSerial: number; abilitySerial: number;
  /** Brief light-stagger resistance after recovering, never damage immunity. */
  staggerResistT: number;
  /** Remaining grounded royal-gravity stun; presentation may use a kneeling pose. */
  kneelT: number;
  life: LifeId;
  x: number;
  y: number;
  vy: number;
  hp: number;
  maxHp: number;
  state: ChState;
  stateT: number;
  decisionT: number;
  iframes: number;
  blockT: number;
  decoyT: number;
  armorUp: boolean;
  armorT: number;
  skillCd: Record<Skill, number>;
  pending: { at: number; skill: Skill | "flee"; move: BossMove } | null;
  doubleJumpAt: number | null;
  lastSkill: Skill | null;
  resumeAttack: boolean;
  lastSkillMove: BossMove | null;
  punishReady: boolean;
  windupT: number;
  rollDir: number;
  loweredAt: number;
  quietLine: number;
  quietT: number;
  hitFlashT: number;
  attackFlashT: number;
}

const ALL_SKILLS: Skill[] = ["roll", "umbrella", "double_jump", "blink", "armor", "decoy", "hop"];

export class FightSim {
  readonly setup: FightSetup;
  readonly cfg: GameConfig;
  readonly rng: Rng;
  readonly events: FightEvent[] = [];
  readonly boss: BossState;
  readonly ch: ChallengerState;
  projectiles: Projectile[] = [];
  tick = 0;
  outcome: FightOutcome | null = null;
  killingMove: BossMove | null = null;
  endReason: "combat" | "boredom" = "combat";
  minBossEffPct = 1;
  lastPlayerAttackT = 0;

  constructor(setup: FightSetup) {
    this.setup = setup;
    this.cfg = setup.config ?? DEFAULT_CONFIG;
    this.rng = new Rng(setup.seed);
    this.boss = {
      x: ARENA.bossStartX,
      y: 0, vy: 0, vx: 0, facing: -1, grounded: true, dashT: 0, dashCooldown: 0,
      invulnT: 0, coyoteT: MOBILITY.coyoteS, jumpBufferT: 0, guardEnergy: 1, guarding: false,
      knockVx: 0, jumps: 0, dashes: 0, blocks: 0, inactivityT: 0,
      hp: BOSS.maxHp,
      maxHp: BOSS.maxHp,
      phase: 1,
      phase2Triggered: false,
      transitionT: 0,
      move: null,
      cooldowns: { cleave: 0, throw: 0, reap: 0, nova: 0 },
      novaCharge: 0,
      buffered: null,
      shiftDir: 0,
      glaiveDropX: null,
      holdAvailable: false,
      holdT: 0,
      yielded: false,
      hitFlashT: 0,
    };
    const skillCd = {} as Record<Skill, number>;
    for (const s of ALL_SKILLS) skillCd[s] = 0;
    this.ch = {
      life: setup.life,
      knockVx: 0, abilityT: 2.5, abilityTellT: 0, abilityKind: "wave", attackSerial: 0, abilitySerial: 0, staggerResistT: 0, kneelT: 0,
      x: ARENA.spawnX,
      y: 0,
      vy: 0,
      hp: setup.stats.maxHp,
      maxHp: setup.stats.maxHp,
      state: "enter",
      stateT: 0,
      decisionT: CHALLENGER.decisionIntervalS,
      iframes: 0,
      blockT: 0,
      decoyT: 0,
      armorUp: ROSTER[setup.life].skills.includes("armor"),
      armorT: 0,
      skillCd,
      pending: null,
      doubleJumpAt: null,
      lastSkill: null,
      resumeAttack: false,
      lastSkillMove: null,
      punishReady: false,
      windupT: 0,
      rollDir: -1,
      loweredAt: 0,
      quietLine: 0,
      quietT: 0,
      hitFlashT: 0,
      attackFlashT: 0,
    };
    this.log({ t: 0, type: "fight_start", life: setup.life, fightIndex: setup.fightIndex, directorAdjust: setup.directorAdjust });
  }

  get time(): number {
    return this.tick * DT;
  }

  get bossFront(): number {
    return this.boss.x + this.boss.facing * ARENA.bossHalfWidth;
  }

  get bossHpPct(): number {
    return this.boss.hp / this.boss.maxHp;
  }

  /** Effective HP on one scale across both phases. Phase Two counts as remaining times the trigger pct. */
  get bossEffPct(): number {
    const p2 = this.cfg.phase2;
    if (!this.boss.phase2Triggered) return this.bossHpPct;
    if (this.boss.transitionT > 0) return p2.PHASE2_TRIGGER_PCT;
    return this.bossHpPct * p2.PHASE2_TRIGGER_PCT;
  }

  get isQuiet(): boolean {
    return false; // The white-scarf life now fights under the revised design.
  }

  get hesitating(): boolean {
    return this.ch.state === "hesitate" || this.ch.state === "lowered";
  }

  moveSpec(id: BossMove, phase: Phase): MoveSpec {
    const p2 = this.cfg.phase2;
    if (phase === 1) return BASE_MOVES[id];
    const a = ASCENDED_MOVES[id];
    return {
      name: a.name,
      tellS: Math.max(p2.PHASE2_TELL_MIN_S, a.tellS * p2.PHASE2_TELL_MULT),
      activeS: a.activeS,
      recoverS: a.recoverS,
      cooldownS: a.cooldownS * p2.PHASE2_COOLDOWN_MULT,
      damage: a.damage * p2.PHASE2_DAMAGE_MULT,
    };
  }

  novaChargeNeeded(): number {
    return this.boss.phase === 2 ? G.bellChargeS : G.novaChargeS;
  }

  canUse(move: BossMove): boolean {
    const b = this.boss;
    if (this.outcome || b.transitionT > 0 || b.yielded) return false;
    if (b.move && (b.move.stage !== "recover" || b.move.t < 0.04)) return false;
    if (move === "nova") return b.novaCharge >= this.novaChargeNeeded();
    return b.cooldowns[move] <= 0;
  }

  private log(e: FightEvent): void {
    this.events.push(e);
  }

  step(input: BossInput): void {
    if (this.outcome) return;
    this.tick++;
    const t = this.time;
    const b = this.boss;
    const ch = this.ch;

    const pressed: BossMove | null = input.cleave ? "cleave" : input.throw ? "throw" : input.reap ? "reap" : input.nova ? "nova" : null;
    if (pressed && b.transitionT <= 0 && !b.yielded) {
      this.lastPlayerAttackT = t;
      if (ch.state === "lowered") this.raiseWeapon(t, false);
      b.buffered = { move: pressed, until: t + BOSS.inputBufferS };
    }

    const active = pressed || input.left || input.right || input.jump || input.dash || input.guard;
    b.inactivityT = active ? 0 : b.inactivityT + DT;
    b.hitFlashT = Math.max(0, b.hitFlashT - DT);
    b.invulnT = Math.max(0, b.invulnT - DT);
    b.dashCooldown = Math.max(0, b.dashCooldown - DT);
    if (b.inactivityT > MOBILITY.boredomS && b.transitionT <= 0) {
      this.endReason = "boredom";
      this.log({ t, type: "boredom" });
      this.killBoss(t);
      return;
    }
    for (const m of ["cleave", "throw", "reap"] as BossMove[]) b.cooldowns[m] = Math.max(0, b.cooldowns[m] - DT);
    if (!b.move || b.move.id !== "nova") b.novaCharge = Math.min(this.novaChargeNeeded(), b.novaCharge + DT);

    if (b.transitionT > 0) {
      b.transitionT -= DT;
      if (b.transitionT <= 0) {
        b.transitionT = 0;
        b.phase = 2;
        b.hp = Math.round(this.cfg.phase2.PHASE2_REFILL_PCT * b.maxHp);
        this.log({ t, type: "phase2_ready" });
      }
    } else if (!b.yielded) {
      this.updateBossInput(input, t);
    }

    this.updateBossMove(t);
    this.updateProjectiles();
    this.updateChallenger(t);
    this.updateHold(input, t);

    this.minBossEffPct = Math.min(this.minBossEffPct, this.bossEffPct);
    if (this.tick % 30 === 0 && ch.state !== "dead" && ch.x > 0) {
      this.log({ t, type: "distance", d: Math.round(this.bossFront - ch.x) });
    }
    if (!this.outcome && t >= RUN.maxFightS) {
      this.outcome = "spared";
      this.log({ t, type: "spared" });
    }
  }

  private updateBossInput(input: BossInput, t: number): void {
    const b = this.boss;
    const dir: -1 | 0 | 1 = input.left && !input.right ? -1 : input.right && !input.left ? 1 : 0;
    if (b.grounded) b.coyoteT = MOBILITY.coyoteS;
    else b.coyoteT = Math.max(0, b.coyoteT - DT);
    b.jumpBufferT = input.jump ? MOBILITY.jumpBufferS : Math.max(0, b.jumpBufferT - DT);
    if (b.jumpBufferT > 0 && b.coyoteT > 0) {
      b.vy = MOBILITY.jumpSpeed; b.grounded = false; b.coyoteT = 0; b.jumpBufferT = 0; b.jumps++;
      if (b.move?.stage === "recover") b.move = null;
      this.log({ t, type: "jump" });
    }
    if (input.dash && b.dashCooldown <= 0) {
      if (dir) b.facing = dir;
      b.dashT = MOBILITY.dashS; b.dashCooldown = MOBILITY.dashCooldownS;
      b.invulnT = Math.max(b.invulnT, MOBILITY.dashS); b.move = null; b.dashes++;
      this.log({ t, type: "dash" });
    }
    b.guarding = input.guard && b.guardEnergy > 0.08 && b.dashT <= 0 && !b.move;
    b.guardEnergy = Math.max(0, Math.min(1, b.guardEnergy + (b.guarding ? -MOBILITY.guardDrain : MOBILITY.guardRegen) * DT));
    const phaseSpeed = b.phase === 2 ? this.cfg.phase2.PHASE2_MOVE_SPEED_MULT : 1;
    if (b.dashT > 0) {
      b.dashT = Math.max(0, b.dashT - DT); b.vx = b.facing * MOBILITY.dashSpeed;
    } else {
      b.vx = dir * BOSS.shiftSpeed * phaseSpeed * (b.guarding ? 0.5 : 1);
      if (dir && !b.move) b.facing = dir;
    }
    b.x += (b.vx + b.knockVx) * DT;
    b.knockVx *= Math.max(0, 1 - DT * 10);
    b.x = Math.max(ARENA.bossMinX, Math.min(ARENA.bossMaxX, b.x));
    if (!b.grounded || b.vy > 0) {
      b.vy -= MOBILITY.gravity * DT; b.y += b.vy * DT;
      if (b.y <= 0) { b.y = 0; b.vy = 0; b.grounded = true; }
    }
    if (dir && b.shiftDir !== dir) this.log({ t, type: "boss_shift", dir });
    b.shiftDir = dir;
    if (b.buffered && t > b.buffered.until) b.buffered = null;
    if (b.buffered && this.canUse(b.buffered.move) && !b.guarding && b.dashT <= 0) {
      this.startMove(b.buffered.move, t); b.buffered = null;
    }
  }

  private startMove(id: BossMove, t: number): void {
    const b = this.boss;
    b.facing = this.ch.x < b.x ? -1 : 1;
    const spec = this.moveSpec(id, b.phase);
    if (id !== "nova") b.cooldowns[id] = spec.cooldownS;
    const ch = this.ch;
    const pillars = id === "nova" && b.phase === 2 ? [ch.x, ch.x - G.bellPillarSpacing, ch.x + G.bellPillarSpacing] : [];
    b.move = { id, phase: b.phase, stage: "tell", t: 0, spec, direction: b.facing, targetX: ch.x, pillars, hitCh: false, waveHits: 0, spawned: 0 };
    if (id === "nova") b.novaCharge = 0;
    this.log({ t, type: "boss_move", move: id, phase: b.phase });
    this.challengerSeesTell(id, spec.tellS, t);
  }

  private updateBossMove(t: number): void {
    const b = this.boss;
    const m = b.move;
    if (!m) return;
    m.t += DT;
    if (m.stage === "tell" && m.t >= m.spec.tellS - 1e-9) {
      m.stage = "active";
      m.t = 0;
      this.onActiveStart(m);
    }
    if (m.stage === "active") {
      this.activeHits(m, t);
      if (m.t >= m.spec.activeS - 1e-9) {
        m.stage = "recover";
        m.t = 0;
        this.onMoveResolved(m, t);
      }
    } else if (m.stage === "recover" && m.t >= m.spec.recoverS - 1e-9) {
      // Cooldowns start with the input, not after recovery.
      b.move = null;
    }
  }

  private onActiveStart(m: ActiveMove): void {
    const b = this.boss;
    if (m.id === "cleave" && m.phase === 1) b.x = Math.max(48, Math.min(912, b.x + m.direction * 14));
    if (m.id === "throw" && m.phase === 1) {
      this.projectiles.push({ kind: "glaive", move: "throw", x: this.bossFront, y: b.y + 44,
        vx: m.direction * G.throwSpeed, vy: 0, ttl: 4, traveled: 0, returning: false, canHit: true, damage: m.spec.damage, dead: false });
    }
  }

  chCenterY(): number {
    return this.ch.y + 26;
  }

  private activeHits(m: ActiveMove, t: number): void {
    const ch = this.ch;
    if (ch.state === "dead" || this.outcome) return;
    const front = this.bossFront;
    switch (m.id) {
      case "cleave": {
        if (m.hitCh) return;
        const inZone =
          m.phase === 1
            ? (ch.x - this.boss.x) * m.direction > -20 && Math.abs(ch.x - this.boss.x) < G.cleaveReach && Math.abs(ch.y - this.boss.y) < G.cleaveHeight
            : Math.abs(ch.x - m.targetX) <= G.riftRadius && ch.y < G.cleaveHeight;
        if (inZone) this.hitChallenger(m, m.spec.damage, t);
        return;
      }
      case "throw": {
        if (m.phase === 2) {
          while (m.spawned < G.wispCount && m.t >= m.spawned * G.wispIntervalS) {
            const sy = 110 + (m.spawned % 2) * 40;
            const dx = ch.x - front;
            const dy = this.chCenterY() - sy;
            const len = Math.hypot(dx, dy) || 1;
            this.projectiles.push({
              kind: "wisp",
              move: "throw",
              x: front,
              y: sy,
              vx: (dx / len) * G.wispSpeed,
              vy: (dy / len) * G.wispSpeed,
              ttl: G.wispTtlS,
              traveled: 0,
              returning: false,
              canHit: true,
              damage: m.spec.damage,
              dead: false,
            });
            m.spawned++;
          }
        }
        return;
      }
      case "reap": {
        if (m.spawned > 0) return;
        m.spawned = 1;
        const seal = ROYAL_GRAVITY[m.phase];
        // Snapshot at input: leaving its horizontal radius or rising above the seal avoids it.
        if (Math.abs(ch.x - m.targetX) > seal.radius || ch.y >= seal.height) return;
        const before = ch.hp;
        this.hitChallenger(m, m.spec.damage, t);
        if (ch.hp < before && ch.hp > 0) {
          ch.y = 0; ch.vy = 0; ch.knockVx = 0; ch.doubleJumpAt = null;
          ch.kneelT = seal.kneelS; ch.state = "hitstun"; ch.stateT = seal.kneelS;
          ch.staggerResistT = 0; ch.pending = null;
        }
        return;
      }
      case "nova": {
        if (m.hitCh) return;
        let dmg = m.spec.damage;
        if (m.phase === 2 && m.pillars.some((px) => Math.abs(ch.x - px) <= G.bellPillarHalfWidth)) {
          dmg += G.bellPillarDamage * this.cfg.phase2.PHASE2_DAMAGE_MULT;
        }
        this.hitChallenger(m, dmg, t);
        return;
      }
    }
  }

  /** At the end of the active frames: did a skill carry the challenger through the move? */
  private onMoveResolved(m: ActiveMove, t: number): void {
    const ch = this.ch;
    if (m.id === "throw" || ch.state === "dead" || m.hitCh || m.waveHits > 0) return;
    if (ch.lastSkillMove === m.id && ch.lastSkill) {
      this.log({ t, type: "evade", move: m.id, how: ch.lastSkill });
      if (m.id === this.setup.tactics.bait_attack) ch.punishReady = true;
      ch.lastSkillMove = null;
    }
  }

  private updateProjectiles(): void {
    const ch = this.ch; const b = this.boss; const t = this.time;
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.ttl -= DT;
      if (p.kind === "wisp") {
        const dx = ch.x - p.x, dy = this.chCenterY() - p.y, len = Math.hypot(dx, dy) || 1;
        p.vx += dx / len * G.wispSpeed * G.wispTurn * DT;
        p.vy += dy / len * G.wispSpeed * G.wispTurn * DT;
        const speed = Math.hypot(p.vx, p.vy) || 1;
        p.vx = p.vx / speed * G.wispSpeed; p.vy = p.vy / speed * G.wispSpeed;
      }
      if (p.kind === "glaive" && p.returning) {
        const dx = this.bossFront - p.x, dy = b.y + 44 - p.y, len = Math.hypot(dx, dy) || 1;
        p.vx = dx / len * G.throwSpeed; p.vy = dy / len * G.throwSpeed;
        if (len < 25) p.dead = true;
      }
      if (p.returnAtDistance !== undefined) {
        if (p.traveled >= p.returnAtDistance) p.returning = true;
        if (p.returning) {
          const dx = ch.x - p.x, dy = ch.y + 42 - p.y, distance = Math.hypot(dx, dy) || 1;
          if (distance < 24) p.dead = true;
          p.vx = dx / distance * 390; p.vy = dy / distance * 390;
        }
      }
      if (p.gravity !== undefined) p.vy -= p.gravity * DT;
      p.x += p.vx * DT; p.y += p.vy * DT; p.traveled += Math.hypot(p.vx, p.vy) * DT;
      if (p.kind === "glaive" && !p.returning && (p.traveled >= G.throwRange || p.x < 12 || p.x > 948)) {
        p.returning = true; p.canHit = true;
      }
      if (p.ttl <= 0 || (p.kind !== "glaive" && (p.x < -100 || p.x > 1060))) p.dead = true;
      if (p.dead || !p.canHit || this.outcome) continue;
      if (p.kind === "enemy-wave" || p.kind === "enemy-orb") {
        const low = p.low ?? p.kind === "enemy-wave", radius = p.radius ?? 16;
        const hit = Math.abs(b.x - p.x) < radius + 18 && (low ? b.y < 35 : Math.abs(b.y + 42 - p.y) < radius + 22);
        if (hit) { this.damageBoss(p.damage, t, low); p.dead = true; }
        continue;
      }
      const r = p.kind === "blade" ? 34 : p.kind === "glaive" ? G.throwRadius : G.wispRadius;
      if (Math.abs(ch.x - p.x) < r + 12 && Math.abs(this.chCenterY() - p.y) < r + 24) {
        if (ch.blockT > 0 && p.kind !== "blade") {
          this.log({ t, type: "evade", move: p.move, how: "umbrella" });
          if (p.kind === "glaive") { p.canHit = false; p.returning = true; } else p.dead = true;
          continue;
        }
        const negated = ch.iframes > 0 || ch.decoyT > 0;
        if (p.kind === "glaive") p.canHit = false; else p.dead = true;
        this.applyDamage(p.move, p.damage, t, negated);
      }
    }
    this.projectiles = this.projectiles.filter(p => !p.dead);
  }

  private hitChallenger(m: ActiveMove, dmg: number, t: number): void {
    m.hitCh = true;
    const ch = this.ch;
    this.applyDamage(m.id, dmg, t, ch.iframes > 0 || ch.decoyT > 0);
  }

  private applyDamage(move: BossMove, dmg: number, t: number, negated: boolean): void {
    const ch = this.ch;
    if (ch.state === "dead" || (ch.state === "enter" && ch.x < 0)) return;
    if (negated) {
      const how: Skill = ch.iframes > 0 ? (ch.lastSkill === "blink" ? "blink" : "roll") : "decoy";
      if (ch.decoyT > 0 && ch.iframes <= 0) ch.decoyT = 0;
      this.log({ t, type: "evade", move, how });
      if (move === this.setup.tactics.bait_attack) ch.punishReady = true;
      ch.lastSkillMove = null;
      return;
    }
    if (ch.armorUp) {
      ch.armorUp = false;
      ch.armorT = CHALLENGER.armorRechargeS;
      this.log({ t, type: "armor_break" });
      return;
    }
    const hes = this.hesitating;
    let d = dmg * (hes ? HESITATION.damageTakenMult : 1);
    if (this.isQuiet) d = ch.hp;
    ch.hp -= d;
    if (ch.life === "kitten" && !this.tutorialComplete) ch.hp = Math.max(1, ch.hp);
    // Repeated light hits still hurt and flinch, but cannot erase every counterattack.
    const resistsLightStagger = move === "cleave" && ch.staggerResistT > 0;
    ch.knockVx = Math.sign(ch.x - this.boss.x || -this.boss.facing) * (move === "nova" ? 420 : resistsLightStagger ? 60 : 260);
    if ((move === "cleave" && !resistsLightStagger) || move === "nova") { ch.vy = Math.max(ch.vy, 180); ch.y = Math.max(ch.y, 0.1); }
    ch.hitFlashT = 0.2;
    this.log({ t, type: "challenger_hit", move, dmg: Math.round(d), hpAfter: Math.max(0, Math.round(ch.hp)), hesitating: hes });
    if (ch.hp <= 0) {
      this.endChallenger(t, move);
      return;
    }
    if (!this.isQuiet && !resistsLightStagger) {
      ch.staggerResistT = 0;
      ch.state = "hitstun";
      ch.stateT = Math.max(CHALLENGER.hitstunS, ch.kneelT);
      ch.pending = null;
      ch.punishReady = false;
    }
  }

  private endChallenger(t: number, move: BossMove | null): void {
    this.ch.hp = 0;
    this.ch.state = "dead";
    this.killingMove = move;
    this.outcome = "challenger_dead";
    this.log({ t, type: "challenger_dead", move });
  }

  private killBoss(t: number): void {
    this.boss.hp = 0;
    this.outcome = "boss_dead";
    this.log({ t, type: "boss_dead", by: this.setup.life });
  }

  private skillFor(move: BossMove): Skill | null {
    const skills = ROSTER[this.setup.life].skills;
    const best = SKILL_FOR_MOVE[move];
    if (skills.includes(best) && this.ch.skillCd[best] <= 0) return best;
    if (skills.includes("decoy") && this.ch.skillCd.decoy <= 0) return "decoy";
    // The witch can also blink clear of a cleave.
    if (move === "cleave" && skills.includes("blink") && this.ch.skillCd.blink <= 0) return "blink";
    if (skills.includes(best)) return best;
    return null;
  }

  /** The basic hop clears the base Reap and Throw. It does not help against Ascended moves. */
  private canHop(move: BossMove): boolean {
    const life = this.setup.life;
    if (life === "kitten" || life === "quiet") return false;
    if (this.boss.phase === 2) return false;
    return (move === "reap" || move === "throw") && this.ch.skillCd.hop <= 0 && this.ch.y <= 0;
  }

  private challengerSeesTell(move: BossMove, tellS: number, t: number): void {
    const ch = this.ch;
    if (this.isQuiet || ch.state === "dead" || ch.state === "enter" || this.hesitating) return;
    // A recovered counter commits through light pressure; its normal windup remains dodgeable.
    if (move === "cleave" && ch.state === "attack" && ch.staggerResistT > 0) return;
    const tac = this.setup.tactics;
    const inPriority = tac.dodge_priority.includes(move);
    const jitter = 1 + this.rng.range(-CHALLENGER.reactionJitter, CHALLENGER.reactionJitter);
    const react = (this.setup.stats.reactionMs / 1000) * (inPriority ? 0.25 : 0.65) * jitter;
    const skill = this.skillFor(move);
    if (skill) {
      const lead = CHALLENGER.skillLeadS[skill];
      ch.pending = { at: t + Math.max(react, tellS - lead), skill, move };
      return;
    }
    if (this.canHop(move)) {
      const p = CHALLENGER.hopBaseChance + CHALLENGER.hopChancePerFight * (this.setup.fightIndex - 1);
      if (this.rng.chance(Math.min(CHALLENGER.hopMaxChance, p))) {
        let ideal = tellS - CHALLENGER.skillLeadS.hop;
        if (move === "throw") ideal = tellS + Math.max(0, this.bossFront - ch.x - 36) / G.throwSpeed - 0.3;
        ch.pending = { at: t + Math.max(react * CHALLENGER.hopReactionMult, ideal), skill: "hop", move };
        return;
      }
    }
    if (move === "cleave") {
      const m = this.boss.move;
      const danger = m && m.phase === 2 ? Math.abs(ch.x - m.targetX) <= G.riftRadius + 20 : ch.x >= this.bossFront - G.cleaveReach - 20;
      if (danger) ch.pending = { at: t + react, skill: "flee", move };
    }
  }

  private runPending(t: number): void {
    const ch = this.ch;
    const p = ch.pending;
    if (!p || t < p.at) return;
    ch.pending = null;
    if (ch.state === "dead" || ch.state === "hitstun" || this.hesitating) return;
    if (p.skill === "flee") {
      const m = this.boss.move;
      ch.rollDir = m && m.phase === 2 ? (ch.x < m.targetX ? -1 : 1) : -1;
      ch.state = "flee";
      ch.stateT = 0.5;
      return;
    }
    const s = p.skill;
    if (ch.skillCd[s] > 0) return;
    const wasAttacking = ch.state === "attack";
    ch.skillCd[s] = CHALLENGER.skillCooldownS[s];
    ch.lastSkill = s;
    ch.lastSkillMove = p.move;
    this.log({ t, type: "skill", skill: s, move: p.move });
    switch (s) {
      case "roll": {
        const m = this.boss.move;
        ch.rollDir = m && m.phase === 2 && m.id === "cleave" ? (ch.x < m.targetX ? -1 : 1) : -1;
        if (ch.x < ARENA.leftWall + 60) ch.rollDir = 1;
        ch.iframes = CHALLENGER.rollS;
        ch.resumeAttack = wasAttacking;
        ch.state = "evade";
        ch.stateT = CHALLENGER.rollS;
        break;
      }
      // Umbrella, hop, double jump, and decoy keep the challenger moving in its current state.
      case "umbrella":
        ch.blockT = CHALLENGER.umbrellaS;
        break;
      case "hop":
        if (ch.y <= 0) {
          ch.vy = CHALLENGER.jumpVy;
          ch.y = 0.01;
        }
        break;
      case "double_jump":
        if (ch.y <= 0) {
          ch.vy = CHALLENGER.jumpVy;
          ch.y = 0.01;
          ch.doubleJumpAt = t + CHALLENGER.doubleJumpDelayS;
        }
        break;
      case "blink": {
        let nx = ch.x - CHALLENGER.blinkDistance;
        if (nx < ARENA.leftWall + 20) nx = Math.min(this.bossFront - 30, ch.x + CHALLENGER.blinkDistance);
        ch.x = nx;
        ch.iframes = CHALLENGER.blinkInvulnS;
        ch.resumeAttack = wasAttacking;
        ch.state = "evade";
        ch.stateT = CHALLENGER.blinkInvulnS;
        break;
      }
      case "decoy":
        ch.decoyT = CHALLENGER.decoyS;
        ch.x = Math.max(ARENA.leftWall, ch.x - 60);
        break;
      case "armor":
        break;
    }
  }

  prefX(): number {
    const side = this.ch.x < this.boss.x ? -1 : 1; return Math.max(ARENA.leftWall, Math.min(936, this.boss.x + side * (ARENA.bossHalfWidth + CHALLENGER.distanceOffset[this.setup.tactics.distance])));
  }

  private moveToward(target: number, speedMult = 1): boolean {
    const ch = this.ch;
    const sp = this.setup.stats.speed * speedMult * DT;
    const d = target - ch.x;
    if (Math.abs(d) <= sp) {
      ch.x = target;
      return true;
    }
    ch.x += Math.sign(d) * sp;
    return false;
  }

  /** A decision moment. Returns true if the challenger started hesitating. */
  private maybeHesitate(t: number): boolean {
    const { tier, bond } = this.setup;
    if (tier === 1 || this.isQuiet || this.boss.yielded) return false;
    const m = this.boss.move;
    if (m && m.stage !== "recover") return false;
    if (this.boss.transitionT > 0) return false;
    const p = HESITATION.HESITATE_BASE[tier] + HESITATION.bondStep * bond;
    if (!this.rng.chance(p)) return false;
    const dur = this.rng.range(HESITATION.minS, HESITATION.maxS);
    this.ch.state = "hesitate";
    this.ch.stateT = dur;
    this.ch.pending = null;
    this.log({ t, type: "hesitate", dur: Math.round(dur * 100) / 100, bossStage: m ? m.stage : "idle" });
    return true;
  }

  private raiseWeapon(t: number, auto: boolean): void {
    this.ch.state = "wait";
    this.ch.decisionT = CHALLENGER.decisionIntervalS;
    this.log({ t, type: "mutual_raise" });
    if (auto) {
      this.lastPlayerAttackT = t;
      this.log({ t, type: "say", key: "mutual.raise" });
    }
  }

  private damageMult(_t: number): number { return 1; }

  get tutorialComplete(): boolean { return this.boss.jumps > 0 && this.boss.dashes > 0 && this.boss.blocks > 0; }

  private strikeBoss(t: number): void {
    const ch = this.ch;
    ch.attackFlashT = 0.18; ch.attackSerial++;
    const dx = Math.abs(ch.x - this.boss.x);
    if (dx > ARENA.bossHalfWidth + CHALLENGER.reach + 12 || Math.abs(ch.y - this.boss.y) > 65) return;
    const damage = this.setup.stats.damage * (ch.punishReady ? CHALLENGER.punishDamageMult : 1);
    ch.punishReady = false;
    this.damageBoss(damage, t);
  }

  private damageBoss(damage: number, t: number, low = false): void {
    const b = this.boss;
    if (b.transitionT > 0 || b.invulnT > 0 || this.outcome) return;
    if (b.yielded) { this.killBoss(t); return; }
    if (low && b.y > 34) return;
    if (b.guarding && !low) {
      damage *= 1 - MOBILITY.guardReduction; b.blocks++; b.guardEnergy = Math.max(0, b.guardEnergy - 0.10);
      this.log({ t, type: "boss_block" });
    }
    b.hp -= damage; b.hitFlashT = 0.13; b.invulnT = MOBILITY.hurtInvulnS;
    b.knockVx = Math.sign(b.x - this.ch.x || 1) * (b.guarding ? 70 : 240);
    if (!b.phase2Triggered && this.cfg.phase2.PHASE2_ENABLED && b.hp <= this.cfg.phase2.PHASE2_TRIGGER_PCT * b.maxHp) {
      const before = Math.max(1, Math.round(b.hp));
      this.log({ t, type: "boss_hit", dmg: Math.round(damage), hpAfter: Math.round(this.cfg.phase2.PHASE2_TRIGGER_PCT * b.maxHp), phase: 1 });
      this.beginPhase2(t, before); return;
    }
    this.log({ t, type: "boss_hit", dmg: Math.round(damage), hpAfter: Math.max(0, Math.round(b.hp)), phase: b.phase });
    if (b.hp <= 0) this.killBoss(t);
  }

  private beginPhase2(t: number, hpBefore: number): void {
    const b = this.boss;
    b.hp = Math.max(1, b.hp); b.phase2Triggered = true; b.transitionT = this.cfg.phase2.PHASE2_TRANSITION_S;
    b.move = null; b.buffered = null; b.glaiveDropX = b.x - 40; b.y = 0; b.vy = 0; b.grounded = true; b.dashT = 0;
    this.projectiles = []; this.ch.state = "backoff"; this.ch.pending = null;
    this.log({ t, type: "phase2_start", hpBefore });
  }

  private updateAbility(t: number): void {
    const ch = this.ch;
    if (this.boss.transitionT > 0 || this.hesitating || ch.state === "dead" || ch.state === "enter" || ch.state === "hitstun") return;
    if (ch.abilityTellT > 0) {
      ch.abilityTellT = Math.max(0, ch.abilityTellT - DT);
      if (ch.abilityTellT === 0) {
        if (ch.life === "thief") {
          const flank = ch.x < this.boss.x ? 1 : -1;
          ch.x = Math.max(ARENA.leftWall + 16, Math.min(ARENA.width - 32, this.boss.x + flank * 205));
          ch.decoyT = 0.5;
        }
        for (const shot of enemyShots(ch.life, ch, this.boss, ch.abilitySerial)) {
          const { damageScale, ...geometry } = shot;
          this.projectiles.push({ ...geometry, move: shot.low ? "reap" : "throw", traveled: 0,
            returning: false, canHit: true, damage: this.setup.stats.damage * damageScale, dead: false });
        }
        ch.abilitySerial++;
        if (ch.life === "sailor" || ch.life === "knight") ch.blockT = 0.5;
        if (ch.life === "acrobat") { ch.vy = 500; ch.y = Math.max(ch.y, 0.1); }
      }
      return;
    }
    ch.abilityT -= DT;
    if (ch.abilityT <= 0) {
      const profile = ENEMY_ABILITIES[ch.life];
      ch.abilityT = profile.cooldownS;
      ch.abilityTellT = profile.tellS;
      ch.abilityKind = ch.life === "witch" || ch.life === "sailor" || ch.life === "quiet" ? "orb" : "wave";
      this.log({ t, type: "enemy_ability", kind: ch.abilityKind, x: ch.x });
    }
  }


  private updateChallenger(t: number): void {
    const ch = this.ch;
    if (ch.state === "dead" || this.outcome) return;
    ch.iframes = Math.max(0, ch.iframes - DT);
    ch.blockT = Math.max(0, ch.blockT - DT);
    ch.decoyT = Math.max(0, ch.decoyT - DT);
    if (ch.armorT > 0) {
      ch.armorT -= DT;
      if (ch.armorT <= 0 && ROSTER[ch.life].skills.includes("armor")) ch.armorUp = true;
    }
    ch.hitFlashT = Math.max(0, ch.hitFlashT - DT);
    ch.attackFlashT = Math.max(0, ch.attackFlashT - DT);
    ch.staggerResistT = Math.max(0, ch.staggerResistT - DT);
    ch.kneelT = Math.max(0, ch.kneelT - DT);
    for (const s of ALL_SKILLS) ch.skillCd[s] = Math.max(0, ch.skillCd[s] - DT);

    if (ch.y > 0 || ch.vy > 0) {
      ch.vy -= CHALLENGER.gravity * DT;
      ch.y += ch.vy * DT;
      if (ch.y <= 0) {
        ch.y = 0;
        ch.vy = 0;
      }
    }
    if (ch.doubleJumpAt !== null && t >= ch.doubleJumpAt) {
      if (ch.y > 0) ch.vy = CHALLENGER.doubleJumpVy;
      ch.doubleJumpAt = null;
    }
    ch.x += ch.knockVx * DT; ch.knockVx *= Math.max(0, 1 - DT * 8);
    this.runPending(t);
    this.updateAbility(t);

    const transition = this.boss.transitionT > 0;
    // Defensive movement and guarding never request a narrative ceasefire.

    switch (ch.state) {
      case "enter": {
        const target = this.isQuiet ? QUIET.sitX : ARENA.startX;
        if (this.moveToward(target)) {
          if (this.isQuiet) {
            ch.state = "sit";
            ch.quietT = 0;
          } else ch.state = "approach";
          this.lastPlayerAttackT = Math.max(this.lastPlayerAttackT, t);
        }
        break;
      }
      case "approach":
        if (this.moveToward(this.prefX())) ch.state = "wait";
        break;
      case "wait": {
        this.moveToward(this.prefX(), 0.5);
        ch.decisionT -= DT;
        if (ch.decisionT <= 0 && !transition) {
          ch.decisionT = CHALLENGER.decisionIntervalS;
          if (this.maybeHesitate(t)) break;
          const aggression =
            this.setup.life === "patchwork" ? Math.max(PATCHWORK.aggression, this.setup.tactics.aggression) : this.setup.tactics.aggression;
          const bossOpen = this.boss.move?.stage === "recover";
          if (ch.punishReady || this.boss.yielded || bossOpen || this.rng.chance(0.15 + 0.6 * aggression)) {
            ch.state = "attack";
            ch.windupT = 0;
          }
        }
        break;
      }
      case "attack": {
        if (transition) {
          ch.state = "backoff";
          break;
        }
        const side = ch.x < this.boss.x ? -1 : 1; const target = this.boss.x + side * (ARENA.bossHalfWidth + CHALLENGER.reach * 0.45);
        const arrived = this.moveToward(target, ch.punishReady ? CHALLENGER.punishDashMult : CHALLENGER.attackDashMult);
        if (arrived || Math.abs(ch.x - this.boss.x) <= ARENA.bossHalfWidth + CHALLENGER.reach) {
          ch.windupT += DT;
          if (ch.windupT >= CHALLENGER.attackWindupS) {
            this.strikeBoss(t);
            if (this.outcome) break;
            if (ch.state === "attack") ch.state = "backoff";
          }
        }
        break;
      }
      case "backoff":
        if (this.moveToward(this.prefX())) {
          if (!transition && this.maybeHesitate(t)) break;
          ch.state = "wait";
          ch.decisionT = CHALLENGER.decisionIntervalS;
        }
        break;
      case "evade":
        ch.stateT -= DT;
        if (ch.lastSkill === "roll" && ch.iframes > 0 && ch.stateT > 0) {
          ch.x += ch.rollDir * (CHALLENGER.rollDistance / CHALLENGER.rollS) * DT;
        }
        if (ch.stateT <= 0 && ch.y <= 0) {
          ch.state = (ch.punishReady || ch.resumeAttack) && !transition ? "attack" : "backoff";
          ch.resumeAttack = false;
          ch.windupT = 0;
        }
        break;
      case "flee":
        ch.stateT -= DT;
        ch.x += ch.rollDir * this.setup.stats.speed * 1.3 * DT;
        if (ch.stateT <= 0) ch.state = "backoff";
        break;
      case "hitstun":
        ch.stateT -= DT;
        if (ch.stateT <= 0) {
          const retaliates = ch.life !== "kitten" && !transition;
          ch.state = retaliates ? "attack" : "backoff";
          ch.windupT = 0;
          ch.staggerResistT = retaliates ? 0.9 : 0;
        }
        break;
      case "hesitate":
        ch.stateT -= DT;
        if (ch.stateT <= 0) {
          ch.state = "wait";
          ch.decisionT = CHALLENGER.decisionIntervalS;
        }
        break;
      case "lowered":
        if (t - ch.loweredAt >= HESITATION.mutualMaxS) this.raiseWeapon(t, true);
        break;
      case "sit":
        this.updateQuiet(t);
        break;
      case "leave":
        if (this.moveToward(ARENA.spawnX - 20, 0.6)) {
          this.outcome = "spared";
          this.log({ t, type: "spared" });
        }
        break;
    }
    ch.x = Math.max(ARENA.spawnX - 30, Math.min(ARENA.width - 24, ch.x));
    if (ch.state !== "enter" && ch.state !== "leave") ch.x = Math.max(ARENA.leftWall, ch.x);
  }

  /** Debug key: drop the boss to the trigger point and start Phase Two now. */
  debugForcePhase2(): void {
    const b = this.boss;
    const p2 = this.cfg.phase2;
    if (b.phase2Triggered || !p2.PHASE2_ENABLED || this.outcome) return;
    const t = this.time;
    const before = Math.round(b.hp);
    b.hp = Math.round(p2.PHASE2_TRIGGER_PCT * b.maxHp);
    b.phase2Triggered = true;
    b.transitionT = p2.PHASE2_TRANSITION_S;
    b.move = null;
    b.buffered = null;
    b.glaiveDropX = b.x - 40;
    this.projectiles = [];
    this.log({ t, type: "phase2_start", hpBefore: before });
  }

  private updateQuiet(t: number): void {
    const ch = this.ch;
    ch.quietT += DT;
    const due = QUIET.firstLineS + ch.quietLine * QUIET.lineIntervalS;
    if (ch.quietLine < QUIET.lineCount && ch.quietT >= due) {
      this.log({ t, type: "say", key: `quiet.${ch.quietLine}` });
      ch.quietLine++;
    }
    const doneAt = QUIET.firstLineS + QUIET.lineCount * QUIET.lineIntervalS + QUIET.leaveAfterS;
    if (ch.quietLine >= QUIET.lineCount && ch.quietT >= doneAt) ch.state = "leave";
  }

  private updateHold(input: BossInput, t: number): void {
    const b = this.boss;
    if (this.setup.life !== "patchwork" || this.outcome || b.yielded) return;
    const p2 = this.cfg.phase2;
    const inFinalBar = p2.PHASE2_ENABLED ? b.phase === 2 && b.transitionT <= 0 : true;
    if (!b.holdAvailable && inFinalBar && this.bossHpPct < PATCHWORK.holdPromptBelowPct) {
      b.holdAvailable = true;
      this.log({ t, type: "hold_prompt" });
    }
    if (!b.holdAvailable) return;
    if (input.hold) {
      b.holdT += DT;
      if (b.holdT >= PATCHWORK.holdToYieldS) {
        b.yielded = true;
        b.buffered = null;
        this.log({ t, type: "yield" });
        // The patchwork cat stops waiting and comes forward for the last blow.
        if (this.ch.state === "lowered" || this.ch.state === "hesitate" || this.ch.state === "wait") {
          this.ch.state = "attack";
          this.ch.windupT = 0;
        }
      }
    } else b.holdT = 0;
  }
}
