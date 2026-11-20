AI-use disclosure: Codex documented the native Godot migration and current user-directed design.

# Native Godot revision

This is the active implementation contract. It supersedes conflicting historical Phaser presentation rules. The public product is a Godot 4.7.2 Compatibility-renderer web export, not a Godot wrapper around Phaser. Open godot/project.godot. The latest [memory and poise revision](memory-and-poise.md) governs story identity, combat timing, guard counters and current court presentation.

The base king is a sword-bearing humanoid cat. The current second form is the Hollow Sovereign: a newly drawn broken crown, torn indigo mantle and cyan chest fissure, with its own transformation and combat rows. This supersedes the first native port's same-king palette-and-area-attack stance; it does not restore the historical giant-monster presentation. All actors, weapons, blood, guards, trails and cutscene pairs use sprite atlases. Native960x540 composition keeps characters small within a broad hall; nearest filtering and aspect-preserving canvas scaling avoid stretched artwork.

The earlier atmospheric hall is restored at native320x180, with successive aged variants. The finale returns to a matching ruined version of that same interior. The menu frames a weathered foreground crown, sword and bell against a distant castle, with a small title and three unboxed items.

## Story and staging

The opening shows crossed swords, blast-back, a returning dash and physical stab before the previous ruler's warning, followed by holding and taking the crown, a coronation explosion and the passage of centuries. Each later visitor has two dialogue exchanges; the second branch depends on the first answer and accumulated bond. Visitors are Morrow's own past lives, retained by the crown and presented anonymously through distinct accessories, weapons and attacks. Dialogue replies carry no exchange counters, eyebrow labels or instructional captions; controls remain discoverable in the Controls menu.

Waiting is exhaustion: slumped shoulders, half-closed eyes, drooping ears, cheek resting in paw, lowered sword and slow animation. The king settles on the throne during downtime and rises when another visitor arrives. Passing years and the aging hall carry the time jump. The seated sprite contacts the actual throne cushion, using world anchor (885, 384) and hips near y348.

Normal and Do Nothing finales use a joint animation with a visible collar grip and a solid blade entering and exiting the king's torso, a dark wound, blood and buckling posture. The king remains held; the name Morrow is revealed and nine visible memory sprites leave the pierced body before “No more kings” and the final nova. Dawn reveals the ruined hall. Dialogue does not narrate the stabbing. Victory remains mechanically possible after all nine encounters.

## Combat and adaptation

Movement, jumping, dashing and guarding remain available throughout fights. Acceleration and braking, coyote time, buffered jumps and short jumps on release improve control. Both forms have buffered three-strike combos using distinct drawn rows; the base king has three newly drawn slash poses. Crownsteel, Oathpiercer, Kneel and Procession become Gloam Rake, five-blade Crownfall, inward-pulling Royal Undertow and expanding Last Dominion in the Hollow Sovereign form. Visitors use distinct rushes, vaults, slides and attack chains as well as individual weapon abilities. Ground footsteps follow distance traveled on both sides. Hits cause blood and knockback; interruption requires a poise break instead of every damaging hit. A break lasts 0.48 seconds, followed by 2.35 seconds of stun immunity. Anticipation permits defensive cancellation, while contact and recovery commit; sword chains open after 78 percent of recovery. A fresh 0.12-second perfect guard prevents health damage and opens a 0.75-second physical stab counter. Eleven shield sprites face their actual attacker. See [kinetic combat](kinetic-combat.md) for the current movement, ability and per-life details.

The tutorial cannot end until actual jump, dash and block mechanics have been used. The next six forms are selected from remaining identities, with encounter-scaled difficulty; quiet and final lives close the arc. RunPlanner uses move counts, distances and repeated sequences. Scripted mode preserves a fixed order. Optional Worker calls are bounded, validated and limited to downtime. Endings depend on gameplay, never planner output.

## Audio and persistence

Twelve separately composed, licensed Scott Buckley cues retain scene/visitor contrast. Native mixing uses bounded players, quieter gains, crossfades, dialogue ducking and mute. Clean single-source sword recordings replace the previous layered mixes. The commercial reference recordings are not distributed. Credits, licenses, edits and source manifests remain available. set_tension builds the existing score from a quiet baseline toward high-stakes moments; pulse adds a bounded original orchestral accent for perfect guards, poise breaks and major transitions, followed by a recovery breath. New licensed metal/impact edits and the original accent are recorded in assets/court-v8/. The Animation vs. Math score is not Creative Commons and is not included.

Native InputMap settings persist through ConfigFile; duplicate bindings swap. Latest-run statistics and planning history are saved to user storage. Windows build/test processes isolate Godot user data on D. Browser storage belongs to the browser sandbox.

## Verification and review

The final native suite passed161 checks:84 court,49 game and28 planner. Native Brave/Playwright QA passed UI, combat and all four ordinary-input ending/planner routes. A separate final story/guard suite verified timed perfect blocks and counters, actual shield absorption and poise-break retaliation, fixed target anticipation, named Morrow dialogue and nine visible memory spirits before nova and same-room ruins. Both final suites reported zero game errors or warnings. GPU screenshot diagnostics remain separate. See memory-and-poise.md for the exact verification boundary and evidence paths.

Current memory/menu/guard art is recorded in assets/memory-v8/ and new audio in assets/court-v8/. The preceding kinetic artwork is recorded in assets/kinetic-v7/ and imported as -v7 atlases under godot/art/. assets/godot-v6/ remains the original native-port and audio-processing record. Historical Phaser and earlier native decisions remain historical evidence; the current form and ability contract is documented above.

See godot-toolchain.md for installation/export details and agent-sessions/FULL-CHAT-CHANGE-AUDIT.md for historical and current line-level changes. Earlier TypeScript tests are retained as regression evidence for the archived implementation; they do not replace native checks.
