AI-use disclosure: written by Codex from Nicoh's revised gameplay request. Dialogue remains provisional for Nicoh's wording.

# Mobile combat and the crown's curse
This revision supersedes the old throne restriction, one-hit opening kitten, automatic quiet-life sparing and guaranteed last loss. Those older documents and session records remain historical.

Later changes to visitor identities, weapon patterns, dialogue choices, lethal endings and music are documented in [royal-revision.md](royal-revision.md). That contract supersedes the corresponding historical descriptions below.

## Player
The Immortal can move across the whole hall, jump, dash through attacks and hold a magic guard. The throne is a place to rest, not a movement boundary. The curse binds the king to the castle's doors.
Default controls: A/D move, Space jump, left Shift dash, J light attack (hold to chain), K glaive/wisps, L travelling ground blade/tide, F nova/bell, G guard, S voluntary yielding when available. Esc pauses combat. The castle menu's Controls screen supports persistent remapping, duplicate-key swapping and resetting.
Attacks have short anticipation and recovery. Their cooldown starts when the attack begins; light attacks chain through buffered recovery. Movement is available during attacks, and dash can cancel recovery. Jump has a short buffer and coyote allowance. Dash has finite invulnerability and a 0.65 second cooldown.
Hits push characters back; cleaves launch enemies briefly. Guard reduces damage while its energy lasts. Low waves must be jumped or dashed rather than guarded.

## Tutorial and growth
The first kitten has 260 HP but only four base damage. It practices low pulses and melee. Its last HP cannot be removed until the player has actually jumped, dashed and blocked a hit, so the tutorial cannot be bypassed by one attack.
The other eight cats fight. Strength grows by encounter number rather than which outfit the planner chooses: agent-mode HP 250 at encounter two, then +52 per encounter through 614 at nine; damage 16 through 40.5; speed 175 through 259; reaction 350 ms through 140 ms. The director is bounded to a small modifier. Scripted HP receives a 5% offset rather than a late geometric spike.
The patchwork cat has no invulnerable last HP and no escalating forced-win damage multiplier. It is a difficult, mortal opponent. Each life has distinct accessory-led attack art, movement and magic/shield effects.

## Three main endings
- Normal: an active ruler is defeated. The crown falls and the visitor helps the Immortal leave.
- Do Nothing: continuous inactivity for 55 simulated seconds makes the visitor abandon its hope of an answer and finish the silent king. This is an authored, telegraphed inactivity route rather than secretly boosting every opponent.
- Victory: defeat all nine lives through actual combat. The final visitor lays down its ambition and leaves the king with the empty castle.

## Time and story
The opening now shows the challenger coming into the hall, fighting and knocking down the previous king before the king laughs at the victor and explains the crown's price. It uses staged character animations and sprite effects rather than a film that begins after the battle.
Story dialogue has a portrait and minimum reading time and cannot be skipped by Enter or Esc. Combat freezes while it plays. The tutorial remains encounter one after the opening.
Between visitors there are seven seconds of downtime: the king returns to the throne, waits, and the number of passing years appears. Encounter dates run from year 1000 to 2400. Visitors physically walk in from the doorway.
The same hall gains cracks, torn banners, vines, broken roofing and dawn light through generated matching age variants. Foot anchors use the visible floor at y464. Character reflections, shadows and small ripples ground the actors in the room.

## Art and evidence
Higgsfield generated the exterior, 36 transparent animated weapon/magic/shield effects, 48 player motion frames, 48 ascended frames, 54 challenger ability frames, 24 previous-king poses, twelve seated/rising poses and two aged halls. Sources and exact job evidence are in assets/combat-v3/manifest.json. Selected atlases are in public/combat-v3/. Motion exports preserve one pixel scale and consistent foot anchors rather than resizing each pose to its own bounding box.
The normal HUD shows no planner rationale, life title card or stat intermission. Debug diagnostics still require ?debug=1.
Audio remains procedural; no recorded acting is implied.

## Verification
Deterministic checks cover movement limits, jump/landing, dash invulnerability and cancellation, guard damage, knockback, tutorial completion through real inputs, mortal finale, three ending routes and replay equality. The 111-test suite, typecheck and build pass. Final production-browser QA passed with zero runtime, console or asset errors and zero warnings.
Browser evidence is in output/qa/mobile/. The new smoke harness verified remapping, unskippable story, manual mobility, the playable tutorial, seated waiting, aging, transformation and all three ending routes from life one through ordinary inputs. Explicit autoplay profiles victory, normal and idle use ordinary gameplay inputs and are test tools, not hidden gameplay bonuses.
