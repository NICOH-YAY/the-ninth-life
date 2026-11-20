// AI-use disclosure: Codex-authored behavioral regressions for two-exchange visitor conversations.
import { describe, expect, it } from "vitest";
import { visitorTurn } from "../src/game/visitor-dialogue";
import type { LifeId } from "../src/core/types";
const lives: LifeId[] = ["kitten", "alley", "sailor", "acrobat", "witch", "knight", "thief", "quiet", "patchwork"];
describe("anonymous returning-soul conversations", () => {
  it("gives all nine visitors distinct questions, choices and replies at both exchanges", () => {
    for (const step of [0, 1] as const) {
      const turns = lives.map(life => visitorTurn(life, step, [true], 0));
      expect(new Set(turns.map(turn => turn.question)).size).toBe(9);
      expect(new Set(turns.map(turn => turn.choices.join("|"))).size).toBe(9);
      expect(new Set(turns.map(turn => turn.responses.join("|"))).size).toBe(9);
      for (const turn of turns) {
        expect(turn.choices).toHaveLength(2);
        expect(turn.responses).toHaveLength(2);
        expect(turn.responses[0]).not.toBe(turn.responses[1]);
      }
    }
  });
  it("carries the first answer into the second exchange instead of repeating one response", () => {
    for (const life of lives) {
      const open = visitorTurn(life, 1, [true], 0), guarded = visitorTurn(life, 1, [false], 0);
      expect(open.question).not.toBe(guarded.question);
      expect(open.choices).not.toEqual(guarded.choices);
      expect(open.responses).not.toEqual(guarded.responses);
      expect(open.cuePrefix).not.toBe(guarded.cuePrefix);
    }
    expect(() => visitorTurn("kitten", 1, [], 0)).toThrow(/first answer/);
  });
  it("reveals visitor-specific memories with accumulated bond and never mutates answer history", () => {
    const history = [true] as const;
    for (const life of lives) {
      const low = visitorTurn(life, 1, history, 0), remembered = visitorTurn(life, 1, history, 4);
      expect(remembered.responses[0]).toContain(low.responses[0]);
      expect(remembered.responses[0].length).toBeGreaterThan(low.responses[0].length);
    }
    expect(history).toEqual([true]);
  });
});
