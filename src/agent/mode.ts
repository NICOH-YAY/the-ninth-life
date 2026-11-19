// AI-use disclosure: written by Claude Code. Chooses the planner mode from build env and
// the page URL. Pure, so it can be tested without a browser.

import type { MemoryMode, PlannerMode } from "./planners";

export interface ModeInputs {
  envMode?: string;
  workerUrl?: string;
  memory?: string;
  /** Query string of the page, such as "?mode=scripted". */
  search?: string;
}

export interface ModeChoice {
  mode: PlannerMode;
  workerUrl: string | null;
  memory: MemoryMode;
  note?: string;
}

/**
 * AGENT_MODE picks the planner. Default is heuristic when no Worker URL is configured,
 * live when one is. "scripted" is the kill switch and needs no network.
 */
export function resolveMode(inp: ModeInputs): ModeChoice {
  const params = new URLSearchParams(inp.search ?? "");
  const raw = (params.get("mode") ?? inp.envMode ?? "").trim().toLowerCase();
  const workerUrl = (params.get("worker") ?? inp.workerUrl ?? "").trim() || null;
  const memRaw = (params.get("memory") ?? inp.memory ?? "history").trim().toLowerCase();
  const memory: MemoryMode = memRaw === "last" ? "last" : "history";
  if (raw === "scripted" || raw === "heuristic") return { mode: raw, workerUrl, memory };
  if (raw === "live" || raw === "agent") {
    if (workerUrl) return { mode: "live", workerUrl, memory };
    return { mode: "heuristic", workerUrl: null, memory, note: "live mode asked for but no Worker URL is set, using heuristic" };
  }
  return workerUrl ? { mode: "live", workerUrl, memory } : { mode: "heuristic", workerUrl: null, memory };
}
