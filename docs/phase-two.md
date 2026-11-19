# Boss Phase Two (design addendum)

Status: approved in concept, tuning numbers are placeholders. This changes GDD section 4.5, which currently says the move set never changes. After this lands, the move set is fixed within each phase.

AI-use disclosure: drafted with Claude from Nicoh's design direction. Nicoh decides the final numbers.

## What it is

When the boss cat drops to 50% HP for the first time in a fight, it enters Phase Two (the Ascended form). The fight pauses for a short transition, the boss refills its HP, and for the rest of that fight it attacks faster, moves faster, and uses a different move set built on magic. It happens at most once per fight and resets when the next challenger arrives.

Thematically this is the boss spending one of its own lives. The transition art and the challenger's next line can lean on that.

## Rules

1. Trigger. Boss HP at or below `PHASE2_TRIGGER_PCT` (default 0.5) for the first time this fight, and `PHASE2_ENABLED` is true.
2. Transition. Lasts `PHASE2_TRANSITION_S` (default 2.0). The boss is invulnerable, the challenger stops attacking and backs off, and all projectiles in flight are cleared. Input is ignored during the transition.
3. Refill. Boss HP is set to `PHASE2_REFILL_PCT` of max (default 1.0). See the tuning note below before keeping 1.0.
4. Stat changes, all multipliers on base values:
   - Move cooldowns times `PHASE2_COOLDOWN_MULT` (default 0.7)
   - Wind-up (tell) durations times `PHASE2_TELL_MULT` (default 0.8, never below 0.3 s so every attack stays readable)
   - Platform shift speed times `PHASE2_MOVE_SPEED_MULT` (default 1.3)
   - Damage dealt times `PHASE2_DAMAGE_MULT` (default 1.25)
   - Damage taken times `PHASE2_DAMAGE_TAKEN_MULT` (default 1.0, available as a balance lever)
5. New move set. Phase Two swaps the whole kit. The Immortal drops its glaive (it clatters to the floor and stays there for the rest of the fight), floats, and fights with the magic it has been holding back. Each Phase Two move sits on the same key as a base move and keeps the same counter, so the life that counters the base move also counters its replacement. This keeps the roster table and the agent's reasoning valid.

| Key | Base form (glaive) | Tell | Ascended form (magic) | Tell | Countered by |
|---|---|---|---|---|---|
| J | Crescent Cleave, a wide close slash in front | glaive raised overhead, 0.45 s | Pounce Rift, blinks above the challenger and crashes down with a ground shock | body fades, a violet ring marks the landing spot, 0.6 s | alley dodge-roll |
| K | Glaive Throw, a spinning glaive that flies out and returns | spin wind-up, 0.5 s | Soul Wisps, five slow wisps that drift toward the challenger | paws cup a glowing orb, 0.5 s | sailor umbrella |
| L | Low Reap, a sweep along the whole floor | crouch, blade low, 0.4 s | Shadow Tide, two floor waves one after another | ground ripples, 0.45 s | acrobat double jump |
| Space | Nine-Lives Nova, a charged fullscreen blast every 20 s | eyes glow, room darkens | Ninth Bell, light pillars at three spots then a nova, every 16 s | a bell tolls, pillars outlined | witch blink |

The A and D platform shift works in both forms. The Ascended form shifts by gliding.
6. No second trigger. Dropping below 50% again in Phase Two does nothing.
7. Patchwork fight. The authored win still holds. The patchwork cat should push the boss into Phase Two and then win anyway, which makes the ending land harder.

All constants live in one config module (`src/core/config.ts` or equivalent) so tuning never touches logic.

## Tuning note

Phase Two is meant to appear for the first time around the midpoint of the run (see docs/challenger-progression.md). A full refill doubles the boss's effective HP, so late challengers need enough strength from the progression curve to get through the second bar. Start at 1.0, and drop to 0.6 or 0.75 if fights 5 and 6 can't get deep into Phase Two even when the agent picks well. `PHASE2_DAMAGE_TAKEN_MULT` above 1.0 is the other lever if the faster boss feels too safe.

## Effect on the agent

The agent still runs only between fights and never controls the phase. Phase Two is deterministic game code. It does give the agent new evidence to read, which helps the AI integration story.

Add to `FightSummary`:

```ts
phase2ReachedAtSec: number | null;      // fight time when Phase Two began, null if never
diedInPhase: 1 | 2;                     // phase the challenger died in
moveCountsByPhase: { 1: Record<BossMove, number>; 2: Record<BossMove, number> };
```

The agent output schema does not change. `bait_attack` and `dodge_priority` keep using base move ids, because each variant shares its base move's id and counter. Add one sentence to the system prompt explaining Phase Two so the agent can say things like "it gets faster at half health, so we hold back early."

Scripted fallback is unchanged.

## Tests (Vitest, deterministic, seeded)

- Phase Two triggers exactly once when HP crosses the threshold, including when a single hit takes HP from above 50% to well below it.
- HP after transition equals `PHASE2_REFILL_PCT * maxHp`.
- Boss takes no damage during the transition, and in-flight projectiles are gone after it.
- Cooldowns, tells, shift speed, and damage use the multipliers, and tells never drop below 0.3 s.
- With `PHASE2_ENABLED = false`, a fight plays out identically to the pre-change build for the same seed and inputs.
- `FightSummary` reports `phase2ReachedAtSec`, `diedInPhase`, and per-phase move counts correctly from a scripted fight log.
- A patchwork fight with scripted boss input still ends in the patchwork win.

## Presentation

The player needs to read the change instantly. Minimum set: screen flash and a brief hit-stop at the trigger, a distinct Phase Two boss palette or aura, faster idle animation, a music or ambience change, and the HP bar refilling visibly. Each empowered move needs a tell that differs from the base tell, even if it's only a color.

## Build order

This goes after the core loop works end to end (one fight, agent call, next life). Build it behind `PHASE2_ENABLED` so it can be switched off for Alpha (Dec 2) if it isn't stable. Suggested order is config constants, trigger and transition in `src/core` with tests, stat multipliers, summary fields, then empowered variants once the moveset is settled, then presentation.

## Open items

1. Nicoh to confirm the revised base move set and the Ascended move set above (proposed by Claude).
2. Final refill percentage after playtesting.
3. Life 8 (the quiet one) never attacks, so it should never push the Immortal into Phase Two. Life 9 always does.
