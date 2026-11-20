AI-use disclosure: Codex documented the native Godot migration and current user-directed design.

# Native Godot revision

This is the active implementation contract. It supersedes conflicting historical Phaser presentation rules. The public product is a Godot 4.7.2 Compatibility-renderer web export, not a Godot wrapper around Phaser. Open godot/project.godot.

The base king is a sword-bearing humanoid cat. The current second form is the Hollow Sovereign: a newly drawn broken crown, torn indigo mantle and cyan chest fissure, with its own transformation and combat rows. This supersedes the first native port's same-king palette-and-area-attack stance; it does not restore the historical giant-monster presentation. All actors, weapons, blood, guards, trails and cutscene pairs use sprite atlases. Native960x540 composition keeps characters small within a broad hall; nearest filtering and aspect-preserving canvas scaling avoid stretched artwork.

The earlier atmospheric hall is restored at native320x180, with successive aged variants. The finale returns to a matching ruined version of that same interior. The menu uses a distant castle silhouette.

## Story and staging

The opening shows crossed swords, blast-back, a returning dash and physical stab before the previous ruler's warning, followed by holding and taking the crown, a coronation explosion and the passage of centuries. Each later visitor has two dialogue exchanges; the second branch depends on the first answer and accumulated bond. Visitors are anonymous reincarnations with distinct accessories, weapons and attacks. Dialogue replies carry no exchange counters, eyebrow labels or instructional captions; controls remain discoverable in the Controls menu.

Waiting is exhaustion: slumped shoulders, half-closed eyes, drooping ears, cheek resting in paw, lowered sword and slow animation. The king settles on the throne during downtime and rises when another visitor arrives. Passing years and the aging hall carry the time jump.

Normal and Do Nothing finales use a joint animation with a visible collar grip and a solid blade entering and exiting the king's torso, a dark wound, blood and buckling posture. The king remains held before the final nova; dawn reveals the ruined hall. Dialogue does not narrate the stabbing. Victory remains mechanically possible after all nine encounters.

## Combat and adaptation

Movement, jumping, dashing and guarding remain available throughout fights. Acceleration and braking, coyote time, buffered jumps and short jumps on release improve control. Both forms have buffered three-strike combos using distinct drawn rows; the base king has three newly drawn slash poses. Crownsteel, Oathpiercer, Kneel and Procession become Gloam Rake, five-blade Crownfall, inward-pulling Royal Undertow and expanding Last Dominion in the Hollow Sovereign form. Visitors use distinct rushes, vaults, slides and attack chains as well as individual weapon abilities. Ground footsteps follow distance traveled on both sides. Hits cause flinching, blood and knockback; guards face the attacker. See [kinetic combat](kinetic-combat.md) for the current movement, ability and per-life details.

The tutorial cannot end until actual jump, dash and block mechanics have been used. The next six forms are selected from remaining identities, with encounter-scaled difficulty; quiet and final lives close the arc. RunPlanner uses move counts, distances and repeated sequences. Scripted mode preserves a fixed order. Optional Worker calls are bounded, validated and limited to downtime. Endings depend on gameplay, never planner output.

## Audio and persistence

Twelve separately composed, licensed Scott Buckley cues retain scene/visitor contrast. Native mixing uses bounded players, quieter gains, crossfades, dialogue ducking and mute. Clean single-source sword recordings replace the previous layered mixes. The commercial reference recordings are not distributed. Credits, licenses, edits and source manifests remain available.

Native InputMap settings persist through ConfigFile; duplicate bindings swap. Latest-run statistics and planning history are saved to user storage. Windows build/test processes isolate Godot user data on D. Browser storage belongs to the browser sandbox.

## Verification and review

The current native suite passes 136 checks: 71 court, 37 game and 28 planner. These cover UI/audio, movement, damage/guard, tutorial requirements, form attacks and planner validation. Automated Brave/Playwright QA boots actual Godot WASM; complete ending routes and a separate adaptive Victory passed before the latest visual revision. Earlier screenshot evidence includes the weary seated king, held impalement and matched ruins. Final browser and visual QA of the kinetic revision is pending. GPU screenshot diagnostics are distinguished from game errors.

The active kinetic artwork is recorded in assets/kinetic-v7/ and imported as -v7 atlases under godot/art/. assets/godot-v6/ remains the original native-port and audio-processing record. Historical Phaser and earlier native decisions remain historical evidence; the current form and ability contract is documented above.

See godot-toolchain.md for installation/export details and agent-sessions/FULL-CHAT-CHANGE-AUDIT.md for historical and current line-level changes. Earlier TypeScript tests are retained as regression evidence for the archived implementation; they do not replace native checks.
