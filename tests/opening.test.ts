// AI-use disclosure: Codex-authored regression checks for a playable tutorial after the prologue.
import { describe, expect, it } from "vitest";
import { Session } from "../src/game/session";
describe("opening completion",()=>{
  it("leaves the first kitten encounter playable and unrecorded",async()=>{
    const session=new Session("?mode=scripted&seed=42");await session.completeOpening();
    expect(session.fightIndex).toBe(1);expect(session.state.used).toEqual([]);expect(session.state.summaries).toEqual([]);
    expect(session.next.plan.next_life).toBe("kitten");expect(session.state.ending).toBeNull();
  });
  it("remains a no-op when called twice",async()=>{
    const session=new Session("?mode=scripted&seed=42");await session.completeOpening();await session.completeOpening();
    expect(session.fightIndex).toBe(1);expect(session.state.summaries).toHaveLength(0);
  });
});
