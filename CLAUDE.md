# The Ninth Life: instructions for Claude Code

This is Nicoh Koehly's (`nicoh-yay`) final project for COMS E6998 sec 014, AI in Practice: Game Design and Development (Fall 2026). Nicoh is Executive Producer and Creative Director. Agents recommend and build. Nicoh decides and merges.

## Read these first, every session
@docs/design-history.md
@GDD.md
@CONFIG.md
@PLAN.md

Newer design docs that override GDD.md where they conflict (update GDD.md to match): docs/story-bible.md, docs/phase-two.md, docs/challenger-progression.md, docs/art-direction.md, docs/prototype-brief.md. Simple mechanical work goes to the Haiku subagents in `.claude/agents/`.

`GDD.md` is the current spec. `docs/design-history.md` records the concepts considered, why this one was chosen, decisions, and open critiques.

## Project rules
- **Stack (proposed):** TypeScript (strict), Vite, Vitest, Phaser or plain Canvas. Browser game, one arena.
- **Keep game logic pure.** Combat rules, the challenger controller, roster, validator, and fallback live in `src/core/` with no rendering imports, so they can be tested without a browser. Fights must be replayable from a seed.
- **The agent reasons between fights only.** Never put a model call in the combat loop.
- **Every PR has tests.** `npm test`, `npm run typecheck`, `npm run build` must pass. CI must pass to merge.
- **Nicoh merges.** Never merge, force-push, or push to `main`. Branch and open a PR.
- **Plan first.** Propose a plan for any non-trivial task and wait for approval.
- **Secrets.** The model key lives only in the Cloudflare Worker (`wrangler secret put`). Keep `.dev.vars` in `.gitignore`.
- **The ending is authored.** The patchwork cat always wins. Do not let the agent decide the ending.
- **Decisions versus recommendations.** Mark your suggestions **[Proposed]**. Only Nicoh marks **[Decided]**. Log decisions in `GDD.md` Section 19.
- **AI-use disclosure** at the top of every written artifact.
- **Evidence.** Notes for significant agent sessions go in `docs/agent-sessions/`.
- **Attribution.** Every asset gets a row in `ATTRIBUTION.md`.

## How to work with Nicoh
- Be a critical partner. Say plainly when an idea is weak or risky, with reasons, and don't fold just because Nicoh pushes back.
- Plain prose. No filler, no hype, no em dashes as connectors.
- Nicoh has limited hours because of work. Keep scope honest and flag schedule risk early.
- Keep private planning material, chat transcripts, and personal information out of the repository. This repo is public.

## Key dates
G1 Nov 15 · checkpoint Nov 23 · G2/G3 recording Nov 28, review Nov 30 · Alpha Dec 2 · Beta Dec 4 · Gold recording Dec 5 · G4 Dec 7 · G5 Dec 14 · Finals Dec 17 to 23.
