> AI-use disclosure: Drafted with Claude (Anthropic) from Nicoh's design decisions. Nicoh reviews and approves every configuration before use.

# The Ninth Life: Configuration Document

**Version:** Initial (G1), November 15, 2026
**Owner:** Nicoh Koehly (`nicoh-yay`) in the Tech Lead and Design Lead roles, with Creative Director approval
**Labels:** [Decided], [Proposed], [Open] as in `GDD.md`. Nothing here is implemented yet.

---

## November20 implementation override [Proposed]

The active runtime is Godot4.7.2 Compatibility renderer, exported as WASM/PCK to GitHub Pages. Canonical checkout and tooling live on D:. Open godot/project.godot. scripts/build-godot.mjs runs native court, game, planner, sprite and reign checks before export. Runtime power and entrance lifecycles live in godot/power_director.gd and godot/entrance_director.gd; timing/data live in godot/combat_rules.gd and godot/content/visitors.json. Latest behavior: docs/reign-and-exchange.md. Historical Phaser/Worker configuration below remains provenance; models are not called during combat.

## Part A. In-game agent: the challengers' collective mind

### A1. Manifest (the executable extension artifact)

Ships as a **function-calling tool bundle** at `agents/challenger/`, with `manifest.yaml` holding the fields the syllabus requires. [Proposed]

| Field | Value |
|---|---|
| Purpose | Between fights, choose the next past life, a tactics plan, and one arrival line, based on how the player fought |
| Available tools | `choose_next_life(life_id)`, `set_tactics(aggression, distance, bait_attack, dodge_priority)`, `say_line(text ≤ 15 words)` |
| Prohibited actions | Choosing a life already used, the kitten after fight 1, or the patchwork cat before the last slot. Tactics outside allowed ranges. Lines that insult the player, mention real-world self-harm, or break character |
| Memory policy | Two configurations for comparison. **History:** summaries of all earlier fights this session. **Last-fight:** only the most recent fight. State is kept in the Worker per session and cleared at session end |
| Named context sources | `content/roster.json` (lives, skills, counters), fight trace summary from the client, session history from the Worker |
| Model choice | Gemini through Vertex AI (course default). Exact model ID **[Open]**, a Flash-class model. Structured output enforced |
| Prompts / system instructions | `agents/challenger/system.md` (role, rules, tone), `agents/challenger/roster.md` (what each life can do) |
| Failure modes | See A6 |
| Evaluation cases | See A7 |
| Logging policy | Each call logs session ID (random), fight number, trace summary, model ID, config version, latency, tokens, raw output, validation result, final choice, and whether fallback fired |
| Human override points | Kill switch `AGENT_MODE=scripted` in Worker config. Debug menu to force a life. Nicoh approves any prompt, roster, or filter change through a PR |
| Test command | `npm test` (deterministic), `npm run eval:live -- --trials 20` (budgeted live suite) |
| CI workflow path | `.github/workflows/ci.yml` **[Open: final folder path if moved to the course repo]** |

### A2. Knowledge boundary

| World state (game holds) | Agent can see |
|---|---|
| Frame-by-frame positions, hitboxes, timers | A fight summary: attack counts, attack order, killing attack, average distance, timing habits |
| Full roster, including the patchwork finale | Remaining lives and their skills. The patchwork slot is fixed and not choosable |
| Story ending | Nothing. The ending is authored |

### A3. Output schema

```json
{
  "next_life": "acrobat",
  "tactics": {"aggression": 0.6, "distance": "close", "bait_attack": "reap", "dodge_priority": ["reap", "cleave"]},
  "line": "You always sweep first. Not this time.",
  "rationale": "Player killed 2 of 2 challengers with Low Reap."
}
```

**[Proposed, Nov 19]** Move ids are now `cleave`, `throw`, `reap`, `nova` (the glaive set in GDD Section 7). Each Phase Two move shares its base move's id and counter, so the schema does not change. Choosable lives are `alley`, `sailor`, `acrobat`, `witch`, `knight`, `thief` (fights 2 to 7). The kitten (1), the quiet one (8), and the patchwork cat (9) are fixed slots.

The rationale is logged and shown in a debug view, never to the player.

### A4. Validation, budgets, fallback

- **Life check:** `next_life` must be remaining and choosable.
- **Tactics check:** values in range (aggression 0 to 1, distance in {close, mid, far}, attacks from the boss move list).
- **Line check:** 15 words or fewer, passes a blocklist and a classifier pass. Failed lines are replaced with the outfit's stock line. **[Proposed]** The prototype has the blocklist only, no classifier yet. A bad line keeps the rest of the plan. Any structural failure (bad JSON, unknown or used life, a patchwork pick, out-of-range tactics) falls back to the whole scripted plan.
- **Planner modes [Proposed, Nov 19]:** `AGENT_MODE` (or `?mode=` on the page) picks `scripted` (the deterministic fallback and kill switch), `heuristic` (an offline stand-in that counters the most-used move, used as an evaluation baseline and for play with no key), or `live` (the Worker). Default is `heuristic` with no Worker URL and `live` with one.
- **Timing:** the call starts the moment a challenger dies, while the death and intro animation plays (about 4 to 6 s). Timeout 5 s, then fallback.
- **Fallback:** the scripted order and default tactics. Also used offline, when the kill switch is on, or after the session cap.
- **Spending limits:** at most 12 calls per session.
- **Credentials:** the key lives only in Worker secrets.

### A5. Deterministic controller

The challenger in combat is a state machine (approach, dodge, attack, retreat) driven by the tactics values and the life's skill. It is deterministic given a seed, so fights can be replayed and tested.

### A6. Named failure modes

1. **Invalid choice.** A used or unchoosable life, or out-of-range tactics.
2. **Ignoring the evidence.** A choice that does not respond to the player's dominant attack. This would make the agent no better than the baseline.
3. **Harmful or off-tone line.**
4. **Latency spill.** The intro waits on the model.
5. **Degenerate tactics.** A plan that makes the challenger stand still or suicide immediately.
6. **Memory confusion.** The history agent referring to fights that did not happen.

### A7. Evaluation plan

**Deterministic (every PR, required to merge):**
- Validator rejects every invalid life, range, and line case.
- Fallback fires on timeout, invalid JSON, and kill switch, and the game continues.
- Controller with fixed tactics and seed produces the same fight trace (replay test).
- Each committed life can beat a scripted boss bot that spams its counter attack (sanity check that counters work).
- Patchwork cat always wins against a scripted perfect-play boss bot within its time limit.

**Live, budgeted (when prompts, model, or roster change, and before each gate):**
- 20 trials on recorded fight traces with clear dominant attacks. Metric: **counter rate**, the share of choices that counter the dominant killing attack. Baseline counter rate comes from the fixed order.
- Memory comparison: history versus last-fight configurations on multi-fight traces. Metrics: counter rate and repeated-mistake rate.
- Also invalid-output rate, fallback rate, latency p50 and p95, tokens and cost per call, harmful-line count (target 0). Failed runs are kept in the results.

**Human:** playtest comparison of agent versus scripted order on the GDD's playtest question.

### A8. Latency and cost budgets (estimates until measured by Nov 23)

| Budget | Target | Basis |
|---|---|---|
| Latency per call | Under 5 s, hidden behind the death and intro animation | One short JSON reply from a Flash-class model |
| Calls per session | About 6 to 8, capped at 12 | One per challenger after the kitten |
| Tokens per call | About 1,200 in, 150 out | System prompt, roster, fight summary, history |
| Cost per session | Under $0.02 | About 10K input and 1K output tokens at published Gemini Flash rates |

---

## Part B. Production agent team [Proposed]

Agents run in Claude Code as subagents in `.claude/agents/`. Each role has an executable config and evidence of use in PRs. Nicoh approves at every human approval boundary.

| Role | Artifact | Purpose | Outputs → recipient | Human approval boundary |
|---|---|---|---|---|
| Producer | `producer.md` | Plan, PPP, risk updates | Weekly plan → Nicoh | Scope or date changes |
| Design Lead | `design-lead.md` | Moves, roster, balance, playtest questions | Specs → Tech Lead, Art | Story, ending, pillars |
| Tech Lead | `tech-lead.md` | Engine, controller, Worker, agent integration | PRs with tests → QA | Nicoh merges |
| Narrative | `narrative.md` | Intro lines, stock lines, ending text | Text → Design, QA | Nicoh approves all story text |
| Art Lead | `art-lead.md` | Mood board, sprites, outfit layers, attribution | Assets → Tech Lead | Style and every AI-generated asset |
| QA | `qa.md` | Repro failures, verify fixes, run evals | Reports → Tech Lead | Known-issue acceptance |
| BI | `bi.md` | Summarize eval and playtest numbers with limits | Summaries → Nicoh | What results mean |
| Release | `release.md` | Build, deploy, archive, instructions | Release notes → Nicoh | Gold tag and production deploy |

### A9. Prototype status (Nov 19) [Proposed]

- The Worker (`worker/`) is written and unit-tested with a mocked model. It is not deployed and no live call has been made. Model id defaults to `gemini-2.5-flash` through Vertex express mode with an API key in Worker secrets.
- The manifest is at `agents/challenger/manifest.yaml`, the system prompt at `agents/challenger/system.md` (mirrors `worker/src/prompt.ts`).
- `FightSummary` gained `phase2ReachedAtSec`, `diedInPhase`, `moveCountsByPhase`, `fightIndex`, `bossMinHpPct`, `directorAdjust`, `outcome`, and `hesitations`. The Worker prompt adds tier, bond, and an allowed-facts list. The agent never sees the ending or the life 9 reason.
- The A7 live evaluation and the A8 measurements are not done yet.

## Open questions

**[Proposed, later Nov 19 presentation pass]** Pixel rendering disables antialiasing, snaps character frames to a 48 x 72 grid and a shared 32-colour palette, and retains binary alpha. The original generated sheets and generation evidence remain in `assets/pixel/`. Combat config and planner validation are unchanged. Player-facing diagnostics require `?debug=1`. The opening records a real one-hit kitten encounter before resolving the next plan, so the cinematic and run history agree. No model call runs in combat or during deterministic checks.

1. Exact Gemini model ID and measured latency and cost.
2. Phaser or plain Canvas.
3. Worker session state on Durable Objects or KV.

## Mobile combat revision, later Nov 19 [Proposed implementation]
Current rules and default bindings are in docs/mobile-combat.md and src/core/config.ts. Full-hall movement ranges from x48 to912, floor y464. Jump gravity1700/s² and launch580/s; dash900/s for0.16s with0.65s cooldown and finite invulnerability. Guard reduces ordinary hits78% while energy lasts; low waves require jump/dash. Cooldowns begin when attacks start. The final opponent has ordinary mortal health, no forced damage escalation. Three rule-authored endings replace the former mandatory patchwork loss. Input traces remain deterministic, and planners still run only between encounters.