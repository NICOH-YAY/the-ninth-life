// AI-use disclosure: Codex-authored, deterministic keyboard binding validation and local persistence.
export const ACTIONS = ["left", "right", "jump", "dash", "cleave", "throw", "reap", "nova", "guard", "hold"] as const;
export type Action = typeof ACTIONS[number];
export type Bindings = Record<Action, string>;
export const STORAGE_KEY = "ninth-life.keybinds.v1";
export const DEFAULT_BINDINGS: Bindings = Object.freeze({
  left: "KeyA", right: "KeyD", jump: "Space", dash: "ShiftLeft",
  cleave: "KeyJ", throw: "KeyK", reap: "KeyL", nova: "KeyF", guard: "KeyG", hold: "KeyS",
});

const RESERVED = new Set(["Escape", "Enter", "NumpadEnter"]);
const NAMED_CODES = new Set(["Space", "ShiftLeft", "ShiftRight", "ControlLeft", "ControlRight", "AltLeft", "AltRight", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab", "Backspace", "CapsLock", "NumpadAdd", "NumpadSubtract", "NumpadMultiply", "NumpadDivide", "NumpadDecimal", "Comma", "Period", "Slash", "Semicolon", "Quote", "BracketLeft", "BracketRight", "Backslash", "Minus", "Equal", "Backquote"]);
function validCode(value: unknown): value is string {
  return typeof value === "string" && !RESERVED.has(value) && (/^Key[A-Z]$/.test(value) || /^Digit[0-9]$/.test(value) || /^Numpad[0-9]$/.test(value) || NAMED_CODES.has(value));
}
function validBindings(value: unknown): value is Bindings {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (Object.keys(record).length !== ACTIONS.length) return false;
  const values = ACTIONS.map(action => record[action]);
  return values.every(validCode) && new Set(values).size === ACTIONS.length;
}

/** Storage access may itself throw (private mode, policy, quota). Defaults always remain playable. */
export function loadBindings(): Bindings {
  try {
    const value = globalThis.localStorage?.getItem(STORAGE_KEY);
    if (!value) return { ...DEFAULT_BINDINGS };
    const parsed = JSON.parse(value) as { version?: unknown; bindings?: unknown };
    return parsed?.version === 1 && validBindings(parsed.bindings) ? { ...parsed.bindings } : { ...DEFAULT_BINDINGS };
  } catch { return { ...DEFAULT_BINDINGS }; }
}
export function saveBindings(bindings: Bindings): Bindings {
  if (!validBindings(bindings)) throw new Error("Choose a different key for each action.");
  const copy = { ...bindings };
  try { globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify({ version: 1, bindings: copy })); } catch { /* Keyboard controls still work when storage is unavailable. */ }
  return copy;
}
/** Reusing a key swaps the two actions, so no action can silently become unreachable. */
export function rebind(action: Action, code: string): Bindings {
  if (!ACTIONS.includes(action)) throw new Error("Unknown action.");
  if (!validCode(code)) throw new Error(RESERVED.has(code) ? "Enter and Esc stay reserved for menus." : "Choose a keyboard letter, number, arrow or modifier key.");
  const next = loadBindings();
  const previous = next[action];
  const duplicate = ACTIONS.find(other => other !== action && next[other] === code);
  next[action] = code;
  if (duplicate) next[duplicate] = previous;
  return saveBindings(next);
}
export function resetBindings(): Bindings { return saveBindings({ ...DEFAULT_BINDINGS }); }
export function keyLabel(code: string): string {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return "Num " + code.slice(6);
  const names: Record<string, string> = { Space: "Space", ShiftLeft: "L Shift", ShiftRight: "R Shift", ControlLeft: "L Ctrl", ControlRight: "R Ctrl", AltLeft: "L Alt", AltRight: "R Alt", ArrowUp: "Up", ArrowDown: "Down", ArrowLeft: "Left", ArrowRight: "Right", NumpadAdd: "Num +", NumpadSubtract: "Num -", NumpadMultiply: "Num *", NumpadDivide: "Num /", NumpadDecimal: "Num .", Comma: ",", Period: ".", Slash: "/", Semicolon: ";", Quote: "'", BracketLeft: "[", BracketRight: "]", Backslash: "Backslash", Minus: "-", Equal: "=", Backquote: "Backtick" };
  return names[code] ?? code;
}
