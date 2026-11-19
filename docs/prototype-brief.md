# Prototype Brief (first playable)

Goal: a playable browser build of the full nine-life arc, start to ending, that Nicoh can open with `npm run dev` and play in about 15 minutes. Rough art is fine. Every system in the design should exist in a simple form so it can be judged and tuned. This build also becomes the starting point for G2.

AI-use disclosure: brief drafted with Claude. Implementation by Claude Code.

Read first, in this order: CLAUDE.md, CLAUDE.local.md (private, never commit), GDD.md, CONFIG.md, PLAN.md, docs/story-bible.md, docs/phase-two.md, docs/challenger-progression.md, docs/art-direction.md, docs/design-history.md. Where documents conflict, the newest docs (story-bible, phase-two, challenger-progression, art-direction, this brief) win, and GDD.md and CONFIG.md should be updated to match them.

## Stack

TypeScript (strict), Vite, Phaser 3 (MIT), Vitest. All game rules in `src/core/` with no Phaser imports, a seeded RNG, and a fixed timestep (60 Hz), so fights replay deterministically in tests. Rendering, input, audio, and scenes in `src/game/`. Agent client in `src/agent/`. Worker in `worker/`. Every tunable number in `src/core/config.ts`.

## Must have

1. **Boot and title.** Title screen over the key art or the night throne room, "The Ninth Life", press any key.
2. **Throne room fight.** Side view. The Immortal on a raised platform at the right, about twice the challenger's height, shifting with A and D. The challenger enters from the left.
3. **Base move set** (J, K, L, Space) with the tells, hitboxes, cooldowns, and counters in docs/phase-two.md.
4. **Phase Two.** Trigger at 50%, transition, refill, Ascended move set on the same keys, stat multipliers. Glaive left on the floor. All per docs/phase-two.md.
5. **Challenger AI.** A state machine (approach, attack, evade with its skill, back off, hesitate) driven by the tactics object (aggression, distance, bait_attack, dodge_priority) and the curve stats (HP, damage, speed, reaction delay). Skills: dodge-roll with i-frames, umbrella block, double jump, blink, survive-one-hit, decoy clone. Life 8 never attacks. Life 9 has every skill.
6. **Progression.** Both curves, the pacing director, fight indexing, and the nine-life roster per docs/challenger-progression.md.
7. **Planner.** An interface `Planner.plan(summary, history) -> Promise<ChallengerPlan>` with three implementations, chosen by `AGENT_MODE`:
   - `scripted`: the fixed order and default tactics (the required deterministic fallback).
   - `heuristic`: an offline stand-in that picks the life countering the player's most-used move and sets bait and dodge from the move bigrams. It's a baseline for evaluation and a way to play the adaptive loop with no API key.
   - `live`: POST to the Worker `/plan`, 5 s timeout, schema validation, fall back to `scripted` on any failure, 12-call session cap, and the kill switch.
   Default for local play: `heuristic` when no Worker URL is configured.
8. **Worker.** `worker/` with the `/plan` endpoint calling Gemini through Vertex, prompt built from the summary, tier, bond, and allowed facts, with JSON output validated against the schema. It doesn't need to be deployed tonight, but it must typecheck and have a unit test with a mocked model.
9. **Between-fight screen.** Death animation, the fight summary (boss HP low point, phase reached), the challenger's line (agent or fallback), the Immortal's two response choices (guarded or open, which update bond), then the next life's intro card with its life number and outfit name. The planner call runs during the death animation.
10. **Story systems.** Tiers, bond, challenger hesitation, mutual hesitation, the life 8 conversation, the life 9 fight with the hold-to-lower-the-glaive prompt below 25% HP, all three endings, all per docs/story-bible.md. Write placeholder authored lines in `src/content/lines.ts` and mark every one with `// PLACEHOLDER: Nicoh to rewrite`.
11. **Presentation by tier.** Palette or tint shift and light changes from night to dawn, small room props appearing, a heavier Immortal idle. The ending crossfades to the dawn background.
12. **Audio placeholders.** Procedural WebAudio music in layers (drone, a melody layer added at tier 2, a fuller layer at tier 3, a resolving chord in the ending) and a syllable "murmur" blip for dialogue text. A mute key (M). Real music and voices come later.
13. **Art.** Use the concept images from `assets/concept/` (see "Assets" below). Characters are single sprites, chroma-keyed to remove the grey background, with tween-based animation per docs/art-direction.md. Crop the lineup sheet into individual challenger sprites. Anything without an image gets a simple procedural shape in the right accessory color. Never block the build on art.
14. **Debug.** Keys to skip to any life (1–9), force Phase Two, set bond, and toggle a hitbox overlay. An on-screen line shows the planner mode and the last plan's source (agent, heuristic, fallback).
15. **Fight log and summary.** Event log per fight, `FightSummary` computed from it including the new fields (phase2ReachedAtSec, diedInPhase, moveCountsByPhase, fightIndex, bossMinHpPct, directorAdjust), and sessions saved to localStorage as JSON (wrapped in try/catch).

## Tests (Vitest, all deterministic)

Write the tests listed in docs/phase-two.md and docs/challenger-progression.md, plus:
- planner output validation (bad JSON, unknown life, a patchwork pick, an extra-long line all fall back),
- live planner timeout falls back within 5 s (fake timers),
- the session call cap,
- a full nine-life headless run with scripted boss inputs ends in the ending state with no exceptions, in both `scripted` and `heuristic` modes,
- hesitation never starts during a boss tell,
- the bond range stays 0 to 8.

`npm test`, `npm run typecheck`, and `npm run build` must all pass before you report done.

## CI

`.github/workflows/ci.yml`: ubuntu-latest, Node from `.nvmrc`, npm cache, concurrency with cancel-in-progress, timeout-minutes 10, running typecheck, test, and build. No live model calls in CI.

## Assets

`assets/concept/manifest.json` lists the Higgsfield concept images with their URLs and prompts. First step: download each URL into `assets/concept/` with the given file name (the URLs are public CDN links). Then write `scripts/chroma-key.mjs` (using sharp) to turn the light grey background transparent for character images, and `scripts/crop-lineup.mjs` to cut the lineup sheet into separate sprites into `public/sprites/`. Backgrounds go to `public/bg/` as they are. Keep the originals.

## Not in scope tonight

Real voices, final music, deployment, Asana setup, multiplayer, mobile controls.

## Done means

Nicoh runs `npm install` then `npm run dev`, opens the page, and can play from the title to an ending. Phase Two shows up around fight 4 with average play, challengers visibly hesitate in the later lives, life 8 talks, life 9 wins, and the ending plays. Then write `docs/prototype-notes.md` saying what works, what is placeholder, what you'd tune first, and how to switch planner modes.
