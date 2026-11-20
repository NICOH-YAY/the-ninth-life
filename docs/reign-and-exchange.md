AI-use disclosure: Codex implemented and documented this fantasy encounter revision with an independent agent design critique and original Higgsfield sprite assets.

# Reign, sacrifice and exchange

This is the latest native Godot contract. It supersedes conflicting timing, locomotion and enemy-kit details in body-animation.md and memory-and-poise.md. Those documents remain historical evidence.

## Design review and story

An independent agent criticized the prior roster as a weapon-delivery taxonomy: colored projectiles, spreads and returning shots did not make nine bosses. The implemented design gives every life an innate bodily rule, a personal loss under royal oppression, a distinctive entrance and an ultimate with a visible cost and recovery. Weapons complement these powers.

The opening ruler seals grain stores and drives away petitioners. Morrow challenges him to open the stores and promises not to become him. Years later, the unchanged grain gates, failing bridge, absent medicine, rotting scaffolds and unanswered petitions show that the immortal has repeated the neglect. The anonymous visitors carry the king's own former lives and the losses they suffered under the previous tyranny. They want the crown ended, not a friendly sparring match. The Morrow reveal, released memories, held heart stabbing and ruined-hall ending remain.

## Innate mini-boss roster

| Internal life | Sacrifice and innate power | Entrance | Ultimate and answer |
|---|---|---|---|
| kitten | Gave away its warmth during a winter levy; palm warmth becomes low moving pulses | A gutter lantern and a cautious walk | A Little Longer: ordered low pulses; jump and dash through, then punish trembling recovery |
| alley | Suffocated rather than betray hidden children; breath becomes delayed pressure pockets | Emptying lanterns and the first inhale | Nothing Left to Breathe: three locked lanes burst in order; leave the next lane, use the emptied one |
| sailor | Carried drowned refugees from shut royal gates; borrowed mass becomes water crests and crushing burdens | Water rises with remembered silhouettes | All Who Were Carried: three actual drowned-cat memories fall into locked lanes, followed by crests; move off each mark and jump the low wave |
| acrobat | Spent its body catching falling workers; stores downward momentum | A suspended fall and a violent landing | Let Me Catch Them: three separate suspended dives; dodge each committed landing, punish its damaged legs |
| witch | Took the deaths of neighbors denied medicine into its own chest; calls a grave-knight | Rune gates and a physical summoned knight striking near the throne | Give It To Me: the creature performs three heavy slams; leave locked marks or break the caster's poise to dispel it |
| knight | Held the gate against executioners; bloodline scars brace and empower its body | Forces the broken gate, then scars ignite | This Gate Will Hold: one advancing crush; get past its braced front, punish the cracked recovery |
| thief | Erased its place in the census to feed forgotten households; briefly loses its presence | Footsteps without a body, then a moonlit reveal | Leave Me Out: three recorded echoes, one real physical lunge; only the grounded real body can hit |
| quiet | Gave away its voice to stop the execution bell; stores and releases impact cracks | The bell falls quiet and a remembered whisper answers | Hear Them Once: delayed low/high cracks in creation order; jump low cracks and remain beneath high ones |
| patchwork | Carried forbidden victims' names in its scars; manifests body-shaped memory helpers | Nine scars light before a deliberate approach | Bring Them Home: actual former bodies hold a lane, sweep and open a heart thrust; respect each tell and punish the last kneel |

Ordinary casts spend 1.8% maximum HP and ultimates 4.5%, never self-killing; the visible cost follows the cast. Ultimates happen once per life, below 55% HP or after 18 seconds. Each ends in a 1.1–1.5-second recovery. Breaking poise or a successful parry can dispel a cast and its summon. The bloodline aura lasts for its full eight-second boost, and memory-hold applies a short movement bind. Hazards have different motion, height, timing and collision rules, not only colors.

## Commitment, animation and weight

Base sword timing is 0.27 seconds preparation, 0.10 contact and 0.36 recovery before combo adjustments. Larger powers and the floating form have longer bodily loads. Guard, jump and dash can cancel anticipation; active attacks and recovery commit. Twelve-frame walk cycles replace six-frame gaits for every identity. Their contact/down/passing/up poses, pelvis motion and cloth lag use distance-driven clocks, with footfalls aligned to two contacts per cycle.

The transformed king genuinely floats at logical height 56. His idle, glide, preparation and attacks use hanging-leg, downward-mantle airborne art. A ground shadow anchors his height. He has different drift/braking, no walking footsteps, and a short upward burst on jump. His torso still intersects high attacks and tall slams; ground waves can pass beneath him. Landing in the base form creates an actual 0.18-second settle, brief action lock, contact sound, dust and bounded camera impulse. Attack recovery includes blade follow-through, cloth lag and foot rebalancing.

## Guard and optional oath

Holding guard can drain stamina to exactly zero without breaking it immediately. The next ordinary non-low shield contact causes a 1.1-second guard break, full damage, strong knockback and a 0.65-second action lock. Holding the button cannot regenerate stamina. Release and a delay allow recovery. An exact fresh parry is a skill exception: it prevents the contact, restores some guard and opens the existing counter. Low attacks bypass the shield and must be avoided rather than causing a shield break.

Equivalent exchange is deliberately small: first reply 0 offers one optional oath for this fight, explicitly trading half maximum guard for 15% stronger attacks. Reply 1 declines. The cost and effect are spoken and shown by a small cracked-shield oath indicator. There is no stacked run-wide upgrade or hidden penalty. Both replies lead into the second authored exchange.

## Verification and sources

Runtime code: game.gd, power_director.gd and entrance_director.gd. Each entrance is bounded, preserves fight health/tutorial controls, and resolves before the two dialogue exchanges; the danger is staged before control is given, while the actual fight powers are damaging and avoidable.

New actor/power/summon art, original prompts, jobs, hashes and geometry are under assets/reign-v10/. Earlier assets remain provenance. Native reign checks cover exhausted guard, actual hover collision, all nine ordinary powers and ultimates, outside-bounds avoidance, self-costs, single-use ultimates and recovery. Final browser and public evidence is recorded after source freeze.

Final native validation passes 418 behavior checks (107 court, 51 game, 28 planner, 232 reign) and 956 actual-pixel atlas assertions. The archived TypeScript baseline passes 140 tests and both typechecks. The final standard browser suite runs all four ordinary-input routes sequentially: Normal, Do Nothing, scripted nine-life Victory and adaptive nine-life Victory. Native menu/rebinding/credits, three aspect ratios, unskippable opening, two dialogue exchanges, mobility, blocking, sword inputs and seated years also pass. This full final run reports zero runtime errors and zero runtime warnings.

Earlier preliminary runs produced WebGL INVALID_OPERATION buffer-binding warnings in both concurrent and sequential playback. They were not dismissed as load and were not filtered: the newly added Polygon2D/Line2D shadows and oath symbol were replaced with equivalent ImageTexture Sprite2D/TextureRect graphics. The strict sequential repeat then passed clean. Earlier reports/screenshots remain in ignored output/qa/reign-v10-preliminary-webgl-diagnostic, godot-v10-parallel-webgl-diagnostic and godot-v10-serial-webgl-diagnostic. Known screenshot ReadPixels performance messages are recorded separately as driver diagnostics; other warnings still fail verification.

Final body-animation and reign browser runs also pass separately, each with zero runtime errors and zero runtime warnings. Body verification observes the second half of the actual twelve-frame locomotion cycles, real preparation regions, rendered entrance travel and the floating form. Reign verification plays all nine distinct entrance IDs before dialogue, confirms fair-start health and two exchanges, chooses the half-guard oath, drains a raised shield to zero and receives the next-hit break, tests the recovery lock/release-only regeneration and a later perfect parry, then checks weighted landing, logical 56-pixel hovering with a ground shadow/no footsteps, a physical grave-knight summon and its caster health cost/recovery. All final browser runs use strict console checks; the complete ending routes run sequentially, with --parallel-routes retained only for explicit stress diagnosis. Evidence is under output/qa/godot/, output/qa/body-animation/ and output/qa/reign/. Publication metadata and public sequential verification are recorded after deployment.
