// AI-use disclosure: written by Claude Code. Seeded RNG (mulberry32) so fights replay exactly.

export class Rng {
  private s: number;
  constructor(seed: number) {
    this.s = seed >>> 0;
  }
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(lo: number, hi: number): number {
    return lo + (hi - lo) * this.next();
  }
  chance(p: number): boolean {
    return this.next() < p;
  }
}

/** Derive a per-fight seed from a run seed and fight index. */
export function fightSeed(runSeed: number, fightIndex: number): number {
  return (Math.imul(runSeed ^ 0x9e3779b9, 2654435761) + fightIndex * 7919) >>> 0;
}
