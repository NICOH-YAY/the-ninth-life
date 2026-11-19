// AI-use disclosure: Codex-authored regression checks for cinematic encounter progression.
import { describe, expect, it } from "vitest";
import { Session } from "../src/game/session";

describe("opening encounter", () => {
  it("records one authored one-hit kitten fight and advances to the next challenger", async () => {
    const session = new Session("?mode=scripted&seed=42");
    await session.completeOpening();
    expect(session.fightIndex).toBe(2);
    expect(session.state.used).toEqual(["kitten"]);
    expect(session.state.summaries).toHaveLength(1);
    expect(session.state.summaries[0]?.outcome).toBe("challenger_dead");
    expect(session.state.summaries[0]?.moveCounts.reap).toBe(1);
    expect(session.next.plan.next_life).toBe("alley");
  });
  it("does not replay the kitten if the opening completion runs twice", async () => {
    const session = new Session("?mode=scripted&seed=42");
    await session.completeOpening();
    await session.completeOpening();
    expect(session.fightIndex).toBe(2);
    expect(session.state.summaries).toHaveLength(1);
  });
});
