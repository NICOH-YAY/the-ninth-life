// AI-use disclosure: Codex-authored regression checks for player keybinding settings.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ACTIONS, DEFAULT_BINDINGS, STORAGE_KEY, keyLabel, loadBindings, rebind, resetBindings, saveBindings } from "../src/game/controls";

let values: Map<string, string>;
beforeEach(() => {
  values = new Map();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("keyboard bindings", () => {
  it("provides every action with a unique default key and returns independent copies", () => {
    const bindings = loadBindings();
    expect(bindings).toEqual(DEFAULT_BINDINGS);
    expect(new Set(Object.values(bindings)).size).toBe(ACTIONS.length);
    bindings.jump = "KeyZ";
    expect(loadBindings().jump).toBe("Space");
  });
  it("recovers safely when storage is unavailable or throws", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadBindings()).toEqual(DEFAULT_BINDINGS);
    expect(() => saveBindings({ ...DEFAULT_BINDINGS })).not.toThrow();
    vi.stubGlobal("localStorage", { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("quota"); } });
    expect(loadBindings()).toEqual(DEFAULT_BINDINGS);
    expect(() => rebind("jump", "KeyZ")).not.toThrow();
  });
  it.each(["bad JSON", "null", JSON.stringify(DEFAULT_BINDINGS), JSON.stringify({ version: 0, bindings: DEFAULT_BINDINGS }), JSON.stringify({ version: 1, bindings: { jump: "KeyZ" } }), JSON.stringify({ version: 1, bindings: { ...DEFAULT_BINDINGS, jump: "KeyA" } }), JSON.stringify({ version: 1, bindings: { ...DEFAULT_BINDINGS, jump: "Escape" } })])("rejects malformed, stale or unreachable binding maps: %s", value => {
    values.set(STORAGE_KEY, value);
    expect(loadBindings()).toEqual(DEFAULT_BINDINGS);
  });
  it("swaps a duplicate key instead of leaving an action unbound", () => {
    const bindings = rebind("jump", "KeyA");
    expect(bindings.jump).toBe("KeyA");
    expect(bindings.left).toBe("Space");
    expect(new Set(Object.values(bindings)).size).toBe(ACTIONS.length);
    expect(loadBindings()).toEqual(bindings);
  });
  it("persists remaps in the versioned payload used by subsequent scenes", () => {
    const bindings = rebind("dash", "KeyV");
    expect(JSON.parse(values.get(STORAGE_KEY)!)).toEqual({ version: 1, bindings });
    expect(loadBindings().dash).toBe("KeyV");
    expect(loadBindings().jump).toBe("Space");
  });
  it("restores and persists defaults", () => {
    rebind("dash", "KeyV");
    expect(resetBindings()).toEqual(DEFAULT_BINDINGS);
    expect(loadBindings()).toEqual(DEFAULT_BINDINGS);
  });
  it.each(["Enter", "Escape", "NumpadEnter", "", "KeyNOTREAL", "a"])("rejects reserved or invalid capture %s without changing saved controls", code => {
    rebind("jump", "KeyZ");
    expect(() => rebind("dash", code)).toThrow();
    expect(loadBindings().jump).toBe("KeyZ");
    expect(loadBindings().dash).toBe("ShiftLeft");
  });
  it("labels physical code names clearly in the menu", () => {
    expect(keyLabel("KeyJ")).toBe("J");
    expect(keyLabel("ShiftLeft")).toBe("L Shift");
    expect(keyLabel("ArrowUp")).toBe("Up");
  });
});
