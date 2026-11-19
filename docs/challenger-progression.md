# Challenger Progression and Pacing (design addendum)

Status: approved in concept, numbers are placeholders for playtesting. Read with docs/phase-two.md.

AI-use disclosure: drafted with Claude from Nicoh's design direction. Nicoh decides the final numbers.

## Problem

If the boss wins every fight easily until the patchwork cat, the run feels flat and the ending feels abrupt. Each returning challenger has to be visibly stronger than the last, so the player feels the pressure build. By the middle of the run a challenger should push the boss to 50% HP and force Phase Two for the first time.

The Dark Queen of Mortholme handles this by having the hero come back stronger each attempt while the queen's kit stays fixed. Player comments on that game say the result can feel boring to play because only one side grows. Phase Two answers part of that by giving the boss a visible escalation of its own once challengers earn it.

## Two layers of strength

Challenger strength comes from two sources, and both have to stay visible.

1. The progression curve (deterministic game code). Every challenger is stronger than the one before, whatever the agent picks. This guarantees the pacing.
2. The agent's choice (between fights). The agent picks which life comes next and its tactics. A good counter pick should push the boss noticeably further than the scripted pick would at the same point on the curve.

The curve alone must never be enough to hit the pacing targets in agent mode. Tune the agent curve so a well-chosen counter is what reaches each target.

### Two curves (Nicoh's decision)

The scripted fallback can't adapt, so it gets its strength from raw stats. The agent gets its strength from choosing the right life and tactics, so its stat growth stays gentle.

- `CURVE_AGENT` (used when the agent plans) grows roughly linearly. This is the table below.
- `CURVE_SCRIPTED` (used when the scripted fallback plans) grows geometrically, about 1.25 times per fight on HP and damage, capped at 3.0, so a run with the agent offline still reaches the midpoint Phase Two.

A note on evaluation. If the two modes run on different curves, a difference in outcomes could come from the curve and not from the agent. So the evaluation harness runs both planners on the same curve as an ablation (agent vs scripted on `CURVE_AGENT`, and again on `CURVE_SCRIPTED`), and also reports the shipped pairing (agent on the agent curve, scripted on the scripted curve). That isolates the agent's contribution, which the rubric's AI integration category will ask about.

## Curve

Indexed by fight number `n` (1 = kitten). Values are multipliers on base challenger stats, stored in one table in config.

| Fight | HP | Damage | Move speed | Reaction delay | Pacing target (lowest boss HP reached) |
|---|---|---|---|---|---|
| 1 kitten | 1.0 | 1.0 | 1.0 | 450 ms | about 90% |
| 2 | 1.2 | 1.15 | 1.05 | 380 ms | about 75% |
| 3 | 1.4 | 1.3 | 1.1 | 320 ms | about 60% |
| 4 (midpoint) | 1.6 | 1.45 | 1.15 | 260 ms | 50%, first Phase Two |
| 5 | 1.8 | 1.6 | 1.2 | 210 ms | deep into Phase Two |
| 6+ before patchwork | 2.0 | 1.75 | 1.25 | 180 ms | deep into Phase Two, can win |
| patchwork | authored | authored | authored | 150 ms | wins |

Reaction delay is how long a challenger waits after a boss tell before using its counter skill. Lowering it is the clearest way to show "it learned."

With stretch lives (knight, thief) the run is longer, so index the curve by fight number. Don't tie it to which life it is.

## Pacing director

Players differ, so a fixed curve will miss the targets for very good or very bad players. A small deterministic director corrects this between fights.

After each fight, compare the lowest boss HP the challenger reached with that fight's target. If the challenger fell short by more than 10 points, the next fight's HP and damage multipliers go up by 5% (cumulative, capped at +20%). If it overshot by more than 10 points, they go down by 5% (capped at -15%). The director never changes which life comes next or its tactics, since those belong to the agent.

The director is game code. It is seeded and fully testable, and it logs every adjustment to the fight log so the evaluation can separate the director's effect from the agent's.

## Showing it

The player has to see that each challenger is stronger, or the curve is wasted.

- The intro card shows the life number and one visible sign of growth, like a scar, a sharper outfit, or a stat ribbon.
- Challengers dodge earlier and more cleanly as reaction delay drops.
- The agent's line can name what changed ("I saw the sweep coming that time").
- Boss HP at the end of each fight goes in the between-fight screen so the player sees the trend.

## Ending rule (decided)

Any challenger from life 2 on that brings the boss to 0 HP ends the game with the short "too soon" ending (docs/story-bible.md). The patchwork cat (life 9) is built to guarantee the win. Life 8 never attacks.

## Roster length

The full run is nine lives: kitten (1), six agent-chosen lives (2 to 7: alley, sailor, acrobat, witch, knight, thief), the quiet one (8), patchwork (9). Index the curve by fight number. The curve table rows for fights 6 and 7 use the "6+" row. Life 8 skips the curve because it doesn't fight.

## Agent changes

Add to `FightSummary`:

```ts
fightIndex: number;
bossMinHpPct: number;        // lowest boss HP this fight, across both phases (Phase Two counts as 50% + remaining/2 for comparison)
directorAdjust: number;      // multiplier change applied before this fight
```

The output schema does not change.

## Evaluation

Primary metric per configuration (agent with history, agent with last fight only, scripted) is `bossMinHpPct` by fight index, plus the fight index where Phase Two first triggers. Run with scripted boss input profiles (aggressive, defensive, spammy) so results don't depend on one play style. The claim to test is that agent picks reach the pacing targets with smaller director adjustments than scripted picks.

## Tests

- The curve table applies the right multipliers for each fight index.
- The director moves multipliers in the right direction, respects caps, and never touches life choice or tactics.
- With a fixed seed and scripted boss input, the midpoint fight triggers Phase Two.
- `bossMinHpPct` and `directorAdjust` are reported correctly from a scripted fight log.

## Build order

After the core loop and Phase Two trigger work. Curve table first, then summary fields, then the director, then the presentation pieces.
