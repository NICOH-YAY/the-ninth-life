# Story Bible

AI-use disclosure: drafted with Claude from Nicoh's design direction. Nicoh owns final wording and all authored lines.

## The premise in one paragraph

An immortal cat guards an empty throne in a ruined castle. It cannot leave and cannot die. One small cat keeps coming to fight it, and every time it dies it comes back on its next life, a little stronger, wearing a new outfit, remembering what the last life learned. The player is the immortal cat. The player's move set stays fixed while the challenger grows. Over nine lives the fights turn into a relationship. The challenger is not trying to conquer the throne. It is trying to free the cat sitting on it. Losing the last fight is the ending, and it should feel like letting go.

## Characters

**The Immortal (player).** Tall, about twice a challenger's height. Black fur, frayed indigo cloak, tarnished small crown, pale violet eyes, carries a long crescent glaive. Lonely, proud, tired. Speaks rarely and briefly. Has two forms (see GDD and docs/phase-two.md). Name is open for Nicoh to decide.

**The Challenger (one cat, nine lives).** Small, round-headed, upright, holds its weapon like a fencer. The same soul in every life, so its personality carries over while its outfit and skill change. Early lives are scared and boastful. Middle lives are curious. Late lives are warm and familiar. The agent speaks for this cat between fights.

| Life | Outfit and weapon | Skill | Counters | Story role |
|---|---|---|---|---|
| 1 kitten | nothing, a twig | none | — | Terrified, brave anyway. Dies fast. |
| 2–7, chosen by the agent | alley (red bandana, dagger), sailor (yellow raincoat, umbrella), acrobat (striped leotard, bell, short staff), witch (pointed hat, wand), knight (tin armor, sword), thief (mask, hood, two knives) | dodge-roll, umbrella block, double jump, blink, survives one hit, decoy clone | Cleave, Throw, Reap, Nova, any, any | The learning lives. The agent picks the order to counter how the player fights. |
| 8 the quiet one | no outfit, no weapon, a scarf | does not attack | — | Authored. Sits down in the throne room and talks. The player decides whether to strike. |
| 9 patchwork | a patchwork of every earlier outfit, mended sword | every skill | everything | Authored. Always wins. Comes to take the Immortal outside. |

Any challenger from life 2 on can kill the Immortal if the player plays badly. That ends the game early with a short version of the ending (see Endings).

## Arc

The story moves through three tiers. The changes are gradual. Each tier changes dialogue, behavior, visuals, and music a little, so the player notices the shift without a cutscene announcing it.

**Tier 1, lives 1–3. Defiance.** Challenger lines are short boasts and nervous jokes. It never hesitates. The throne room is cold teal and violet. Music is a sparse low drone. The Immortal's between-fight options are curt.

**Tier 2, lives 4–6. Recognition.** The challenger names the player's habits ("You always open with the throw"). It starts asking questions: why the Immortal stays, whether it ever sleeps. It hesitates now and then, lowering its weapon for a second. Small warm things appear in the room between fights, like a flower in a crack or a scrap of cloth left on the floor from the last life. A melody enters the music.

**Tier 3, lives 7–9. Familiarity.** The challenger talks like an old friend. It hesitates often. If the player stops attacking, it lowers its weapon too. Life 8 does not fight at all. Dawn light creeps into the windows from fight to fight. Music becomes a full theme. Life 9 tells the Immortal why it kept coming.

## Bond

Between fights the player picks one of two short responses for the Immortal, one guarded and one open, as in the reference game. Each open answer raises `bond` by 1 (range 0 to 8). Bond does not change difficulty. It changes:

- how often the challenger hesitates in tiers 2 and 3,
- the tone the agent is told to use for the next line,
- which life 8 conversation plays,
- the last lines of the ending.

## Hesitation

Hesitation is the main visual sign of the bond, and it has to read without text.

- **Challenger hesitation.** A state where the challenger lowers its weapon, its ears drop, and it looks at the Immortal for 0.8 to 2 seconds. Chance per eligible moment is `HESITATE_BASE[tier] + 0.02 * bond`, starting at 0 in tier 1. It is never triggered during a boss tell, so it is never a free dodge. A hit during hesitation does extra damage, which makes the player's choice to take the opening meaningful.
- **Mutual hesitation.** From life 6 on, if the player makes no attack for 4 seconds, the challenger lowers its weapon and says a short line. Attacking resumes the fight normally.
- **The Immortal.** The player keeps full control. The Immortal's idle animation gets heavier over the run (slower breathing, glaive tip resting on the floor) so the sprite shows the tiredness.

## Dialogue system

Three kinds of lines, each with a clear owner.

1. **Authored beats (voiced).** Fixed lines for intros, life 8, life 9, the transformation, and the endings. Written by Nicoh. These carry the plot and get recorded voices.
2. **Agent lines (between fights, up to 15 words).** Generated by the in-game agent from the fight summary, the tier, and the bond. They react to what the player did. They are shown as text with a short voiced "murmur" sound per syllable, since generated lines can't be pre-recorded. Authored fallback lines exist for every tier in case the agent fails.
3. **Boss responses (player choice).** Two options between fights, authored per tier.

The agent never invents plot. Its system prompt gets the tier, the bond, and the list of facts it may reference. It cannot reveal the life 9 reason early.

## Endings

**Letting go (main).** Life 9 always wins. During that fight, after the Immortal drops below 25% HP, a quiet prompt appears: hold the key to lower the glaive. Either way the fight ends with the Immortal kneeling. The crown slips off and rolls to the challenger's feet. The light turns to dawn. The patchwork cat sits beside the Immortal. Final lines depend on bond. The screen fades to the dawn throne room, empty, and the title. There is no "game over" text anywhere.

- If the player held the key, the Immortal says one last line and stands up, and they walk out together.
- If the player fought to the end, the Immortal does not get up. The challenger stays with it until the fade.

**Too soon (early loss).** If a life from 2 to 8 kills the Immortal, the same dawn transition plays, shorter, and the challenger's line acknowledges it came too soon. This ending is meant to feel unfinished.

**Life 8 struck.** If the player kills the quiet one, life 9 still comes, but the bond is set to 0 and the life 9 lines change.

## Presentation by tier

| | Tier 1 | Tier 2 | Tier 3 | Ending |
|---|---|---|---|---|
| Light | cold moonlight, teal and violet | first warm accents | dawn creeping in the windows | full golden dawn |
| Music | low drone | melody enters | full theme | the theme resolves, then silence |
| Room | empty | small left-behind objects | flowers in the roots | open doors |
| Challenger | stiff stance, no hesitation | some hesitation | frequent hesitation, softer idle | sits beside the Immortal |
| Immortal idle | upright, still | slight sway | glaive tip on the floor | kneeling |

## Rules for writing lines

- Plain and short. No speeches. Fifteen words is the cap for agent lines, and authored lines should rarely go past twenty.
- Show the bond through small observations and repetition. A joke from life 2 coming back in life 7 does more than any line that states the relationship.
- The Immortal never says it is lonely. The challenger figures it out.
