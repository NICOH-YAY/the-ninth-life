// AI-use disclosure: written by Claude Code. Deterministic fight simulation.
// Pure TypeScript, no rendering imports. 60 Hz fixed step, seeded RNG.
// Same setup and same per-tick inputs always give the same event log.

import {
  ARENA,
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
  targetX: number;
  pillars: number[];
  hitCh: boolean;
  waveHits: number;
  spawned: number;
}

export interface Projectile {
  kind: "glaive" | "wisp";
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
  minBossEffPct = 1;
  lastPlayerAttackT = 0;

  constructor(setup: FightSetup) {
    this.setup = setup;
    this.cfg = setup.config ?? DEFAULT_CONFIG;
    this.rng = new Rng(setup.seed);
    this.boss = {
      x: ARENA.bossStartX,
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
    return this.boss.x - ARENA.bossHalfWidth;
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
    return this.setup.life === "quiet";
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
    if (b.move) return false;
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

    b.hitFlashT = Math.max(0, b.hitFlashT - DT);
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
      if (this.setup.life === "patchwork") this.killBoss(t);
      else this.endChallenger(t, null);
    }
  }

  private updateBossInput(input: BossInput, t: number): void {
    const b = this.boss;
    const dir: -1 | 0 | 1 = input.left && !input.right ? -1 : input.right && !input.left ? 1 : 0;
    const canShift = !b.move || b.move.stage === "recover";
    if (dir !== 0 && canShift) {
      const speed = BOSS.shiftSpeed * (b.phase === 2 ? this.cfg.phase2.PHASE2_MOVE_SPEED_MULT : 1);
      b.x = Math.min(ARENA.bossMaxX, Math.max(ARENA.bossMinX, b.x + dir * speed * DT));
      if (b.shiftDir !== dir) this.log({ t, type: "boss_shift", dir });
    }
    b.shiftDir = canShift ? dir : 0;
    if (b.buffered && t > b.buffered.until) b.buffered = null;
    if (b.buffered && this.canUse(b.buffered.move)) {
      this.startMove(b.buffered.move, t);
      b.buffered = null;
    }
  }

  private startMove(id: BossMove, t: number): void {
    const b = this.boss;
    const spec = this.moveSpec(id, b.phase);
    const ch = this.ch;
    const pillars = id === "nova" && b.phase === 2 ? [ch.x, ch.x - G.bellPillarSpacing, ch.x + G.bellPillarSpacing] : [];
    b.move = { id, phase: b.phase, stage: "tell", t: 0, spec, targetX: ch.x, pillars, hitCh: false, waveHits: 0, spawned: 0 };
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
      if (m.id !== "nova") b.cooldowns[m.id] = m.spec.cooldownS;
      b.move = null;
    }
  }

  private onActiveStart(m: ActiveMove): void {
    if (m.id === "throw" && m.phase === 1) {
      this.projectiles.push({
        kind: "glaive",
        move: "throw",
        x: this.bossFront,
        y: G.throwHeight,
        vx: -G.throwSpeed,
        vy: 0,
        ttl: 6,
        traveled: 0,
        returning: false,
        canHit: true,
        damage: m.spec.damage,
        dead: false,
      });
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
            ? ch.x >= front - G.cleaveReach && ch.y < G.cleaveHeight
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
        if (m.phase === 1) {
          if (!m.hitCh && ch.y < G.floorHitHeight) this.hitChallenger(m, m.spec.damage, t);
          return;
        }
        const wave = m.t < G.tideWaveS ? 0 : m.t >= G.tideSecondWaveS && m.t < G.tideSecondWaveS + G.tideWaveS ? 1 : -1;
        if (wave >= 0 && m.waveHits <= wave) {
          if (ch.y < G.floorHitHeight) {
            m.waveHits = wave + 1;
            this.hitChallenger(m, m.spec.damage, t);
          }
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
    const ch = this.ch;
    const t = this.time;
    for (const p of this.projectiles) {
      if (p.dead) continue;
      p.ttl -= DT;
      if (p.kind === "glaive") {
        p.x += p.vx * DT;
        p.traveled += Math.abs(p.vx * DT);
        if (!p.returning && (p.traveled >= G.throwRange || p.x <= ARENA.leftWall)) {
          p.returning = true;
          p.vx = G.throwSpeed;
        }
        if (p.returning && p.x >= this.bossFront) p.dead = true;
      } else {
        const dx = ch.x - p.x;
        const dy = this.chCenterY() - p.y;
        const len = Math.hypot(dx, dy) || 1;
        p.vx += (dx / len) * G.wispSpeed * G.wispTurn * DT;
        p.vy += (dy / len) * G.wispSpeed * G.wispTurn * DT;
        const sp = Math.hypot(p.vx, p.vy) || 1;
        p.vx = (p.vx / sp) * G.wispSpeed;
        p.vy = (p.vy / sp) * G.wispSpeed;
        p.x += p.vx * DT;
        p.y += p.vy * DT;
      }
      if (p.ttl <= 0) p.dead = true;
      if (p.dead || !p.canHit || ch.state === "dead" || this.outcome) continue;
      const r = p.kind === "glaive" ? G.throwRadius : G.wispRadius;
      if (Math.abs(ch.x - p.x) < r + 12 && Math.abs(this.chCenterY() - p.y) < r + 22) {
        if (ch.blockT > 0) {
          this.log({ t, type: "evade", move: p.move, how: "umbrella" });
          if (p.move === this.setup.tactics.bait_attack) ch.punishReady = true;
          if (p.kind === "glaive") {
            p.canHit = false;
            p.returning = true;
            p.vx = G.throwSpeed;
          } else p.dead = true;
          continue;
        }
        const negated = ch.iframes > 0 || ch.decoyT > 0;
        if (p.kind === "glaive") p.canHit = false;
        else p.dead = true;
        this.applyDamage(p.move, p.damage, t, negated);
      }
    }
    this.projectiles = this.projectiles.filter((p) => !p.dead);
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
    if (ch.life === "patchwork") ch.hp = Math.max(1, ch.hp);
    ch.hitFlashT = 0.2;
    this.log({ t, type: "challenger_hit", move, dmg: Math.round(d), hpAfter: Math.max(0, Math.round(ch.hp)), hesitating: hes });
    if (ch.hp <= 0) {
      this.endChallenger(t, move);
      return;
    }
    if (!this.isQuiet) {
      ch.state = "hitstun";
      ch.stateT = CHALLENGER.hitstunS;
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
    const tac = this.setup.tactics;
    const inPriority = tac.dodge_priority.includes(move);
    const jitter = 1 + this.rng.range(-CHALLENGER.reactionJitter, CHALLENGER.reactionJitter);
    const react = (this.setup.stats.reactionMs / 1000) * (inPriority ? 1 : CHALLENGER.offPriorityReactionMult) * jitter;
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
    return this.bossFront - CHALLENGER.distanceOffset[this.setup.tactics.distance];
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

  private damageMult(t: number): number {
    if (this.setup.life !== "patchwork") return 1;
    return 1 + Math.max(0, t - PATCHWORK.escalateAfterS) * PATCHWORK.escalatePerS;
  }

  private strikeBoss(t: number): void {
    const b = this.boss;
    const ch = this.ch;
    ch.attackFlashT = 0.15;
    if (b.transitionT > 0 || this.outcome) return;
    if (b.yielded) {
      this.log({ t, type: "boss_hit", dmg: Math.round(b.hp), hpAfter: 0, phase: b.phase });
      this.killBoss(t);
      return;
    }
    const p2 = this.cfg.phase2;
    let dmg = this.setup.stats.damage * (ch.punishReady ? CHALLENGER.punishDamageMult : 1) * this.damageMult(t);
    if (b.phase === 2) dmg *= p2.PHASE2_DAMAGE_TAKEN_MULT;
    ch.punishReady = false;
    b.hp -= dmg;
    b.hitFlashT = 0.12;
    if (!b.phase2Triggered && p2.PHASE2_ENABLED && b.hp <= p2.PHASE2_TRIGGER_PCT * b.maxHp) {
      const before = Math.max(0, b.hp);
      b.hp = Math.max(1, b.hp);
      // The crossing hit is logged at the trigger point: Phase Two starts there, whatever the overkill.
      this.log({ t, type: "boss_hit", dmg: Math.round(dmg), hpAfter: Math.round(p2.PHASE2_TRIGGER_PCT * b.maxHp), phase: 1 });
      b.phase2Triggered = true;
      b.transitionT = p2.PHASE2_TRANSITION_S;
      b.move = null;
      b.buffered = null;
      b.glaiveDropX = b.x - 40;
      this.projectiles = [];
      this.log({ t, type: "phase2_start", hpBefore: Math.round(before) });
      ch.state = "backoff";
      ch.pending = null;
      return;
    }
    this.log({ t, type: "boss_hit", dmg: Math.round(dmg), hpAfter: Math.max(0, Math.round(b.hp)), phase: b.phase });
    if (b.hp <= 0) this.killBoss(t);
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
    this.runPending(t);

    const transition = this.boss.transitionT > 0;
    const combat = !this.isQuiet;
    const s = ch.state;
    const lowerable = s === "wait" || s === "approach" || s === "backoff";
    if (
      combat &&
      lowerable &&
      !transition &&
      !this.boss.yielded &&
      this.setup.fightIndex >= HESITATION.mutualFromFight &&
      t - this.lastPlayerAttackT >= HESITATION.mutualIdleS
    ) {
      ch.state = "lowered";
      ch.loweredAt = t;
      ch.pending = null;
      this.log({ t, type: "mutual_lower" });
      this.log({ t, type: "say", key: "mutual.lower" });
    }

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
        const target = this.bossFront - CHALLENGER.reach * 0.7;
        const arrived = this.moveToward(target, ch.punishReady ? CHALLENGER.punishDashMult : CHALLENGER.attackDashMult);
        if (arrived || this.bossFront - ch.x <= CHALLENGER.reach) {
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
        if (ch.stateT <= 0) ch.state = "backoff";
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
    ch.x = Math.max(ARENA.spawnX - 30, Math.min(this.bossFront - 16, ch.x));
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
