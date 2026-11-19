> AI-use disclosure: written by Claude Code (Opus) during the Nov 19 overnight run, from the kickoff prompt and the design docs.

# Prototype plan: first playable (Nov 19 overnight)

Contract is `docs/prototype-brief.md`. Design is the story bible, phase-two, challenger-progression, and art-direction docs. Choices the docs leave open go in `docs/prototype-notes.md` under "Decisions to confirm".

## Architecture

```
src/core/      pure TypeScript, no Phaser. Seeded RNG, 60 Hz fixed step.
  config.ts      every tunable number (moves, phase two, curves, director, hesitation, bond)
  rng.ts         mulberry32
  types.ts       BossMove, LifeId, Tactics, ChallengerPlan, FightSummary, FightEvent
  moves.ts       base and Ascended move data, same ids and counters per key
  roster.ts      nine-life roster, skills, counters, accessory colors
  fight.ts       FightSim: boss, challenger state machine, projectiles, phase two, hesitation, log
  summary.ts     FightSummary from the event log
  progression.ts curves, tiers, pacing director
  run.ts         RunState across nine lives: bond, tiers, life 8 and 9 rules, endings
  bots.ts        scripted boss input profiles for tests and tuning
src/agent/     Planner interface, scripted, heuristic, live (Worker client), validator, mode select
src/content/   lines.ts (all placeholder authored lines)
src/game/      Phaser scenes, rendering, input, audio, debug overlay, storage
worker/        Cloudflare Worker /plan, Gemini via Vertex, mocked-model test
scripts/       chroma-key.mjs, crop-lineup.mjs, sim.ts (headless tuning)
tests/         Vitest suites, all deterministic
```

The fight sim takes a seed, the life, its tactics, its curve stats, and run flags, then one input per tick. Same inputs give the same log. The replay, pacing, and headless nine-life tests all run on that.

## Build order

1. Scaffold (Vite, TS strict, Phaser 3, Vitest), `.nvmrc`, CI workflow.
2. Assets in parallel through the asset-helper subagent: download, chroma key, crop lineups.
3. Core combat with tests: RNG, config, base moves with tells, cooldowns, hitboxes.
4. Challenger state machine and the six skills, kitten, quiet one, patchwork.
5. Phase Two: trigger, transition, refill, multipliers, Ascended moves.
6. Curves, tiers, director, summary fields.
7. Planners: scripted, heuristic, live with validation, timeout, cap, kill switch.
8. Run state: between-fight flow, bond, hesitation, mutual hesitation, life 8, life 9 hold prompt, three endings.
9. Phaser game: title, fight, between-fight screen, intro card, ending. Presentation by tier.
10. Procedural audio layers and murmur, mute key.
11. Art integration with procedural fallbacks.
12. Debug keys and the on-screen planner line.
13. Worker with a mocked-model test.
14. Headless tuning pass so Phase Two first appears around fight 4 with the average bot.
15. Notes, final typecheck, test, build.

## Tests planned

The phase-two and progression test lists from their docs, plus the brief's list: planner validation fallbacks, live timeout with fake timers, call cap, headless nine-life run in scripted and heuristic modes, hesitation never during a tell, bond clamped 0 to 8, replay determinism.

## Commits

Small commits on `prototype/first-playable`. `git status` before each. `CLAUDE.local.md` is gitignored and never staged. No push, no PR, no merge.
