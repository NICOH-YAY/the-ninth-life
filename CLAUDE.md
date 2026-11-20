AI-use disclosure: project instructions authored by Claude; Codex updated the current revision references.

# The Ninth Life: instructions for Claude Code

This is Nicoh Koehly's (`nicoh-yay`) final project for COMS E6998 sec 014, AI in Practice: Game Design and Development (Fall 2026). Nicoh is Executive Producer and Creative Director. Agents recommend and build. Nicoh decides and merges.

## Read these first, every session
@docs/design-history.md
@GDD.md
@CONFIG.md
@PLAN.md

Latest animation correction: @docs/body-animation.md supersedes conflicting timing and locomotion details: physical body windups, upright triangular feline ears and every identity walking.

Current native engine contract: @docs/godot-port.md with @docs/kinetic-combat.md and the latest @docs/memory-and-poise.md revision supersede conflicting historical engine and presentation rules. The current king has a genuinely different Hollow Sovereign form, buffered three-strike animations and native pixel-grid actors. The nine visitors are Morrow's own past lives retained by the crown, revealed through nine memories leaving the pierced body. Current combat uses poise breaks, committed contact/recovery, anticipation cancels and perfect-guard stab counters. Current menu/seating/guard assets are in assets/memory-v8/; original accents and licensed Foley edits are in assets/court-v8/. Open godot/project.godot. Historical combat contract: @docs/gothic-combat.md records the preceding user-directed revision for two exchanges, distinct boss kits, heart impalement, hand-drawn tile environments and differentiated score. Historical contracts: @docs/royal-revision.md and @docs/mobile-combat.md. The royal revision is the later contract for anonymous reincarnation, lethal finales, distinct weapons and licensed music. Its later user-directed mobility, tutorial and three-ending rules replace the older forced-loss rules.

Newer design docs that override GDD.md where they conflict (update GDD.md to match): docs/story-bible.md, docs/phase-two.md, docs/challenger-progression.md, docs/art-direction.md, docs/prototype-brief.md. Simple mechanical work goes to the Haiku subagents in `.claude/agents/`.

`GDD.md` is the current spec. `docs/design-history.md` records the concepts considered, why this one was chosen, decisions, and open critiques.

## Project rules
- **Active stack:** Godot 4.7.2, GDScript, Compatibility renderer and native web export. TypeScript/Phaser is preserved historical code; legacy commands use legacy:.
- **Keep game logic pure.** Native combat profiles live in godot/combat_rules.gd and planning in godot/run_planner.gd; native checks run before export. Historical pure rules remain in src/core/. Fights must be replayable from a seed.
- **The agent reasons between fights only.** Never put a model call in the combat loop.
- **Every PR has tests.** `npm test`, `npm run typecheck`, `npm run build` must pass. CI must pass to merge.
- **Nicoh merges.** Never merge, force-push, or push to `main`. Branch and open a PR.
- **Plan first.** Propose a plan for any non-trivial task and wait for approval.
- **Secrets.** The model key lives only in the Cloudflare Worker (`wrangler secret put`). Keep `.dev.vars` in `.gitignore`.
- **Endings are game rules.** Normal, Do Nothing and Victory follow the player's combat and inactivity. The final cat is mortal. The planner never chooses the ending.
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
