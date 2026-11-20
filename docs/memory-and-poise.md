AI-use disclosure: Codex documented Nicoh's requested memory reveal, readable combat timing and native court presentation.

# Memory, poise and the crown

This is the latest supplement to [the native Godot contract](godot-port.md). It supersedes conflicting timing, story-identity and presentation details in [kinetic combat](kinetic-combat.md), while preserving that document as the preceding revision.

## The visitors are the king's past lives

The nine visitors are Morrow's own previous lives, retained by the crown. Their anonymous labels, different bodies, accessories and weapons conceal that connection until the story reveals it. They are not nine unrelated challengers. Each encounter retains two authored branching dialogue exchanges, including different second exchanges after the first answer.

The final dialogue reveals the name Morrow. In the lethal finales, the challenger physically pierces the king's heart and holds the body; nine visible memory sprites then leave it. “No more kings” precedes the final nova and dawn over the same ruined arena. The memory release is shown with sprites rather than replaced by explanatory narration. Victory remains a separate possible outcome, determined by combat.

During waiting, the king sits on the actual throne at world coordinate (885, 384), with the seated sprite's hips on the cushion near y348. The old platform alignment is historical. The menu foreground uses a weathered crown, sword and bell against a distant castle. Its small title and three unboxed items keep that scene visible; dialogue panels remain opaque above gameplay, without exchange counters or commentary.

## Poise prevents permanent hit interruption

Damage and poise are separate. Ordinary damaging hits do not automatically cancel an enemy's attack. Poise damage accumulates until a break, producing a 0.48-second interruption. A 2.35-second post-break immunity prevents repeated immediate stun. Guarding also has chip damage and stamina depletion.

| Internal life | Poise threshold |
|---|---:|
| kitten | 55 |
| alley | 76 |
| sailor | 100 |
| acrobat | 70 |
| witch | 72 |
| knight | 125 |
| thief | 68 |
| quiet | 90 |
| patchwork | 108 |

These keys identify combat data, not the visitor's public name. Breaks are a mechanical opening with a distinct impact sound and orchestral accent; color flashes alone do not substitute for the poise rule.

## Anticipation, contact and recovery

Player attacks have an anticipation stage, a short contact stage and a committed recovery. Fresh guard, dash or jump inputs can cancel anticipation, and an incoming hit can interrupt it. Active contact and recovery remain committed, apart from the deliberate sword-chain transition after 78 percent of recovery. The sword combo buffer lasts 1.65 seconds.

Long royal area attacks have roughly 0.78–1.18 seconds of anticipation, with ground marks locked to the target when the move starts. Contact on quick physical strikes lasts about 0.085–0.12 seconds; recovery is longer, roughly 0.28–0.58 seconds. Persistent area attacks retain their own longer active windows. Visitor melee tells are roughly 0.40–0.55 seconds, contact about 0.10 seconds and recovery about 0.38–0.68 seconds. Individual profiles remain authoritative in godot/combat_rules.gd.

This timing gives the player a visible threat, a brief collision moment and a readable opening afterward. Existing acceleration, jump buffering, per-life footwork, three drawn combo rows and the Hollow Sovereign's distinct area moves remain in effect.

## Perfect guard and riposte

A newly raised guard has a 0.12-second perfect window. A 0.34-second rearm prevents repeated rapid taps from continuously reopening it. A successful perfect guard takes no health damage and grants a 0.75-second counter opportunity.

Pressing sword while guard remains held spends that opportunity on a fast physical stab: 0.055-second anticipation and 1.55 times damage. It uses the thrust pose, not a generic slash flash. The eleven actor shields have distinct sprite art, and guards follow their actual facing rather than sharing a fixed right-hand overlay.

## Musical breathing and impact accents

The twelve licensed Scott Buckley scene/visitor cues remain distinct. CourtAudio.set_tension(value) builds the underlying score from a quiet baseline toward higher-stakes passages. Lower anticipation values leave room for a threat; stronger combat and critical moments raise the cue. CourtAudio.pulse(event) adds a short original orchestral accent for perfect blocks, poise breaks, transformation and climax, followed by a brief reduction in underlying score. It does not add another full song. Score playback remains bounded to two crossfading players, with one dedicated accent voice and cooldowns.

The new perfect-block ring and poise-break impact are isolated, original-pitch edits of licensed Chequered Ink recordings. The orchestral accent is original deterministic synthesis. Sources, processing and hashes are in assets/court-v8/.

Alan Becker's Animation vs. Math is a timing reference for quiet anticipation, impact and recovery. The [composer's official score page](https://www.scottbuckley.com.au/2023/06/animation-vs-math/) explicitly places that score outside his Creative Commons library. No audio was extracted or distributed from the reference video.

## Assets and evidence

assets/memory-v8/ records the new menu, seated contact, guard sigils and combat-tell source art and processing. assets/court-v8/ records the new audio. Earlier v6 and kinetic-v7 directories remain provenance for their respective revisions.

The final native suite passed **161 checks: 84 court, 49 game and 28 planner**. The standard native-browser suite passed menus, controls, story, combat and four full ordinary-input routes: Normal, Do Nothing, scripted Victory and adaptive Victory. The dedicated story/guard suite passed sustained versus perfect guard, actual counter hits, knight shield absorption and poise breaks with retaliation, locked AoE placement while moving, the Morrow reveal and nine departing spirit sprites before the held-blade nova and matching ruins. Both final browser suites reported zero game errors and warnings. Screenshots were reviewed for seat contact, menu composition, physical stabbing, spirit release, dialogue occlusion and attack marks. Headless screenshot GPU diagnostics are recorded separately. The retained TypeScript suite passed140 tests and typechecking. Public deployment is checked separately after publishing.
