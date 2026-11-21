AI-use disclosure: Codex documented the body-and-curse magic design selected by Nicoh and the implementing agent; authored dialogue and native UI were updated by Codex.

# Sovereign magic

This is the selected v11 combat contract. It supersedes conflicting sword-first player kits and all dialogue-oath rules in earlier revisions. The player may still carry a sword as a secondary visual object, but the king's main attacks come from his body and the crown's curse. Gameplay integration and final browser verification are separate from the court UI checks recorded below.

## One resource, four connected actions

Pressure is the only royal magic resource: 0–100, initially 60. It recovers slowly, about 3 per second while the king is unhurt. Actual hand-strike hits restore 7; a successful parry restores 16. Missing a strike does not grant its contact reward. There is no second Breath or Authority meter, oath multiplier or dialogue purchase.

| Input | Base king | Hollow Sovereign |
|---|---|---|
| J | **Crownless Hand**: a three-hit palm, backhand and chest-pressure sequence; no Pressure cost | **Hollow Orbit**: a closer body-orbit sequence; no Pressure cost |
| K | **Borrowed Hour**, 24 Pressure: place a fixed world afterimage that records the next J within 3 seconds and repeats it after 0.65 seconds, at its original position and facing, for 65% damage | **Vacant Step**, 28 Pressure: commit a roughly 200-pixel phase pass and leave a delayed attack at the old location; movement does not grant free invulnerability |
| L | **Royal Burden**, 30 Pressure: commit a short field to a locked lane; pull and ground targets, with physical interactions for moving hazards and summons | **Unmoored**, 34 Pressure: lift and repel through a committed field rather than repeating the grounded pull |
| F | **King’s Ransom**, at least 40 Pressure: spend all stored Pressure in an outward chest-pressure release, with strength determined by the reserve | **Empty Throne**, at least 40 Pressure: spend all in a delayed inward collapse over about 350 pixels, rather than the base form's roughly 260-pixel outward release |

Both F actions have long recovery and prevent raising the ward for 2.4 seconds. Their visible defensive exposure is part of the cost. The inward form must change target movement and collision, not merely reverse an outward effect animation.

Borrowed Hour is stationary and predictable. The enemy can leave its range; the player can lure a pursuer back into it or use the delay to cover another approach. Vacant Step trades Pressure and commitment for position, with its danger still marked at the old location. Neither is an unconditional escape.

Royal Burden is not a universal stun. Targets retain poise, committed actions and escape opportunities. A field can alter a dive, a wave or a summoned body's position without making that interaction mandatory for victory. Opponents may punish the king while he establishes it.

## Open responses to distinct enemies

There are no elemental keys or damage-type immunities that require one correct button. Defensive timing, spacing and the enemy's recovery remain useful throughout the run. These are alternative routes through encounters, not mandatory solutions.

| Innate power | Several available approaches |
|---|---|
| Last Warmth | Jump or dash through low pulses; pressure the body after the lantern expires; leave an echo where the child must approach |
| Held Breath | Leave locked pressure pockets; interrupt an exposed inhale by breaking poise; delay a hand echo until the committed rush returns |
| Heavy Dead | Step off the marked burden landing and reuse the cleared lane; jump a crest; shift an approaching crest with a well-placed gravity field |
| Fall That Waited | Evade a committed landing and punish its recovery; ground an exposed dive with Burden; place an echo on the announced landing |
| Shared Wound | Evade the grave-knight's marked slams; attack the calling body and break its poise to dispel the summon; reposition a summon with magic when the field can reach it |
| Unbent | Pass the frontal brace and strike its back; parry a committed crush; spend magic on positioning rather than trading into boosted bloodline armor |
| Unseen Hand | Track the real grounded body's shadow; evade or parry the locked lunge; punish its destination using a stationary echo |
| Silenced | Stay under high cracks and clear low ones; avoid drifting a floating torso into the high attack; close in during the voiceless recovery |
| Remaining | Clear the hold lane, avoid the sweeping body and answer the committed heart thrust; reposition an exposed memory; time an echo for the sequence's final recovery |

The king's stronger form remains vulnerable to retaliation. Floating changes body placement and the attacks that intersect it; it does not erase collision or grant a permanent dodge.

## Personal dialogue without mechanical bargaining

Every visitor keeps a distinct first exchange and two possible second exchanges. Each exchange has two authored responses. Choices express memory, denial, guilt or responsibility; they do not halve guard, buy damage or apply a hidden combat bargain.

The visitors remain anonymous until the late Morrow reveal. Their stories connect the previous tyrant's direct violence to the current king's abandonment of the kingdom. The final visitor reveals Morrow on either first-answer branch. Quiet is a remembered whisper rather than an ordinarily voiced conversation. Existing innate-power, ultimate, sacrifice and entrance metadata remain available to scene staging.

## Small native HUD

The HUD displays current Pressure and a short ward-exposure timer. Skill tooltips state cost, commitment and limitations; they do not open an additional screen or dialogue choice. The old oath marker and its generated icon have been removed. Guard exhaustion and the next-hit guard-break indicator remain separate from Pressure expenditure.

The court UI accepts pressure in 0–100 and ward_exposure (or exposure) in seconds. Root gameplay supplies these real values and the chosen move names. The native court suite passes **110 checks**, including distinct branching conversations, absence of combat-stat bargaining, Pressure display, exposure and skill-cost tooltips. Those court checks are distinct from the native mechanics, sprite and complete browser checks recorded below and in sovereign-qa.md.

## Implemented limits and contact rules

Pressure resets to 60 after each long intermission. It is paid when preparation starts, so cancelling or being interrupted does not refund an already committed spell. Passive recovery is 3 per second only after the wound delay, outside an attack and without holding guard. Only actual unguarded hand-hit damage restores 7; an echo never refunds itself. A perfect parry restores 16. Insufficient spells stay dim and briefly tint the small Pressure bar when attempted.

Borrowed Hour repeats one recorded hand strike at exactly 65% strength. Vacant Step schedules its old-position strike automatically; it does not require another J. Its old body can draw a shield counter in the wrong direction while the live king moves away. Echoes use their real world origin for guard direction and knockback rather than pretending every attack comes from the king's current location.

Burden and Unmoored last 1.6 seconds at a committed location. A real wound breaks the field. Heavy bloodline armor resists displacement. Grounding can stop a pending dive, and gravity can shift both pending lanes and already moving crests, capped at 90 pixels. Fixed explosions that have already committed are not freely retargeted. The reserve release can disperse live hazards in reach; future queued attacks remain threats. Empty Throne first draws from the outer 350-pixel range, then crushes inside 180 after 0.36 seconds; a stationary target at the outer boundary is pulled into that crush, while movement and escape remain meaningful.

Overlapping bodies now occupy 44 pixels of horizontal space, with different mass sharing. Walking through a front guard no longer grants an accidental free flank. Dashes, the actual phase pass and jumps that clear the opposing body can cross. Armored and guarded visitors can answer an actual blocked hit with a visible 0.46–0.52-second preparation, contact and full recovery. The original source of an echo determines the counter's direction. Repeated blocks cannot reset the tell indefinitely. A genuine player parry lowers the enemy's shield and opens the riposte. No enemy has a required magic-key immunity.

Each visitor now has its own generated gait, neutral transition and world-distance stride. The king has coherent empty-handed travel and magic in both forms, including landing compression and a real twelve-frame air idle/glide. Entrance staging synchronizes logical and rendered positions throughout the stair descent and each visitor's arrival; the final neutral is handed to dialogue without replaying a rise or teleporting from an old position. Cancelling the silent entrance also releases its temporary music duck.

## Revision verification

The final native export passes 541 behavioral assertions (110 court, 42 game, 28 planner, 231 visitor powers/guard/hover, 65 royal magic/body spacing/counters and 65 actual entrance checks), plus 2,034 actual-pixel assertions. Pixel selection coverage includes reversed transition reuse and is not a claim that every sampled cell is a globally different drawing. The archived 140-test baseline and both TypeScript checks pass. All final local browser suites pass with zero runtime errors or warnings: native UI and four ending routes, physical animation, all-nine arrivals/guard/hover/summon, basic-only and mixed-action comparisons. The mixed policy was safer in seven of nine encounters in this one scripted-seed comparison; basic-only play remains legal. Full evidence and limits are in sovereign-qa.md. Published-build checks follow deployment and record the exact source commit.
