// AI-use disclosure: Codex-authored deterministic weapon patterns; no rendering or model calls.
import type { LifeId } from "./types";

export const ENEMY_ABILITIES: Record<LifeId, { cooldownS: number; tellS: number }> = {
  kitten: { cooldownS: 3.8, tellS: 0.85 },
  alley: { cooldownS: 2.15, tellS: 0.42 },
  sailor: { cooldownS: 3.1, tellS: 0.64 },
  acrobat: { cooldownS: 2.7, tellS: 0.50 },
  witch: { cooldownS: 2.8, tellS: 0.60 },
  knight: { cooldownS: 3.5, tellS: 0.78 },
  thief: { cooldownS: 2.9, tellS: 0.58 },
  quiet: { cooldownS: 2.4, tellS: 0.57 },
  patchwork: { cooldownS: 2.25, tellS: 0.62 },
};

export interface EnemyShot {
  kind: "enemy-wave" | "enemy-orb";
  style: LifeId;
  x: number; y: number; vx: number; vy: number;
  ttl: number; damageScale: number; radius: number; low: boolean;
  gravity?: number;
  returnAtDistance?: number;
}

/** Actual weapon geometry, rather than a cosmetic recolor of one universal projectile. */
export function enemyShots(life: LifeId, origin: { x: number; y: number }, target: { x: number; y: number }, serial: number): EnemyShot[] {
  const side = target.x < origin.x ? -1 : 1;
  const shot = (patch: Partial<EnemyShot>): EnemyShot => ({
    kind: "enemy-orb", style: life, x: origin.x + side * 22, y: origin.y + 42,
    vx: side * 360, vy: 0, ttl: 3, damageScale: 0.7, radius: 12, low: false, ...patch,
  });
  const aimed = (speed: number, spread: number) => {
    const angle = Math.atan2(target.y + 42 - (origin.y + 42), target.x - origin.x) + spread;
    return { vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed };
  };
  switch (life) {
    case "kitten": return [shot({ kind: "enemy-wave", y: 13, vx: side * 220, damageScale: 0.55, low: true })];
    case "alley": return [
      shot({ kind: "enemy-wave", y: 16, vx: side * 620, ttl: 0.82, damageScale: 0.6, radius: 10, low: true }),
      shot({ y: origin.y + 52, vx: side * 410, vy: 45, gravity: 160, ttl: 1.0, damageScale: 0.65, radius: 10 }),
    ];
    case "sailor": return [shot({ ...aimed(390, 0), ttl: 2.8, radius: 22, damageScale: 1.05, returnAtDistance: 265 })];
    case "acrobat": return [-0.30, 0, 0.30].map(angle => shot({ ...aimed(390, angle), ttl: 2.3, radius: 15, damageScale: 0.58 }));
    case "witch": return [-0.16, 0, 0.16].map((angle, i) => shot({ ...aimed(320 + i * 65, angle), ttl: 3, radius: 9, damageScale: 0.65 }));
    case "knight": return [shot({ kind: "enemy-wave", y: 16, vx: side * 265, ttl: 4, low: true, radius: 32, damageScale: 1.35 })];
    case "thief": return [
      shot({ ...aimed(540, 0), radius: 9, ttl: 1.7, damageScale: 0.8 }),
      shot({ kind: "enemy-wave", y: 13, vx: side * 365, radius: 10, ttl: 2.4, low: true, damageScale: 0.65 }),
    ];
    case "quiet": return [serial % 2 === 0
      ? shot({ kind: "enemy-wave", y: 14, vx: side * 450, low: true, radius: 12, damageScale: 0.9 })
      : shot({ y: 88, vx: side * 490, radius: 12, damageScale: 1.0 })];
    case "patchwork": return [
      shot({ ...aimed(430, 0.20), y: origin.y + 26, radius: 16, damageScale: 0.8 }),
      shot({ ...aimed(430, -0.20), y: origin.y + 64, radius: 16, damageScale: 0.8 }),
      shot({ kind: "enemy-wave", y: 15, vx: side * 330, low: true, radius: 16, damageScale: 0.65 }),
    ];
  }
}

/** Contact attacks preserve each weapon's reach, weight and reaction. */
export const ENEMY_MELEE: Record<LifeId, { reach: number; tellS: number; height: number; impulse: number; lift: number; guardCost: number }> = {
  kitten: { reach:44,tellS:0.50,height:60,impulse:80,lift:0,guardCost:0 },
  alley: { reach:64,tellS:0.30,height:65,impulse:-220,lift:0,guardCost:0 },
  sailor: { reach:112,tellS:0.46,height:75,impulse:310,lift:0,guardCost:0.12 },
  acrobat: { reach:60,tellS:0.24,height:110,impulse:180,lift:0,guardCost:0 },
  witch: { reach:86,tellS:0.48,height:100,impulse:130,lift:230,guardCost:0 },
  knight: { reach:96,tellS:0.55,height:70,impulse:460,lift:190,guardCost:0.18 },
  thief: { reach:52,tellS:0.20,height:60,impulse:120,lift:0,guardCost:0 },
  quiet: { reach:140,tellS:0.38,height:105,impulse:270,lift:0,guardCost:0 },
  patchwork: { reach:90,tellS:0.31,height:88,impulse:340,lift:100,guardCost:0.10 },
};