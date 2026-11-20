AI-use disclosure: Codex documented Nicoh's requested kinetic combat revision against the native Godot implementation.

# Kinetic combat and the Hollow Sovereign

This supplements [the active Godot contract](godot-port.md). It describes the verified native Godot source revision. Publication is verified separately after the Pages workflow completes.

## Drawn forms and connected attacks

The base king remains a humanoid cat with a physical sword. Crownsteel now uses three newly drawn slash poses, each with its own six-frame animation row rather than rotating one unchanged pose. Both forms accept buffered sword inputs and progress through three distinct strike rows. The middle strike lifts the target; the finishing strike drives it away. Short buffers also preserve special attacks entered during recovery.

The second form is **the Hollow Sovereign**: a broken crown, torn indigo mantle and cyan fissure through the chest. It is a newly generated Higgsfield sprite silhouette, not a palette swap. A dedicated transformation sequence connects the two forms. Its three combo rows remain separate drawn actions.

| Input | Base king | Hollow Sovereign |
|---|---|---|
| Sword | Crownsteel: three connected physical cuts | Gloam Rake: a wider three-strike sequence |
| Thrust | Oathpiercer: a directed physical stab | Crownfall: five separately spawned blades descend around the targeted position |
| Decree | Kneel: a targeted grounded seal arrests a struck visitor | Royal Undertow: marks and inward gravity pull the visitor toward the king |
| Nova | Procession: three successive royal strikes | Last Dominion: a wave expands outwards from the king |

Hits retain blood, flinching, knockback and brief impact pauses. The area attacks have different collision behavior and timing, not merely different effect colors.

## Movement and grounded sound

Ground movement accelerates and brakes; airborne steering uses a different acceleration. A 0.10-second coyote window and 0.13-second jump buffer ease jumps near landing and edge transitions. Releasing jump early shortens the ascent. Dash has its own movement burst and invulnerability window.

Ground footsteps follow distance traveled by both the king and visitors. Standing still does not trigger a walking metronome; landing produces a separate contact. Sprite feet remain aligned with the hall floor.

## Visitor footwork and weapon functions

The identifiers below are internal data keys. On-screen visitors remain anonymous, with garbled speaker labels and authored branching responses. Their accessories, weapons, colors and movement distinguish each returning life.

| Internal life | Mobility and chain | Distinct ability behavior |
|---|---|---|
| kitten | Short grounded practice step; one strike | Slow low training projectile teaches jumping; durable tutorial also requires a dash and guarded hit |
| alley | Fast grounded rush; two strikes | Fast low shot plus a falling secondary projectile |
| sailor | Anchor-like slide; one long strike | Heavy returning projectile with a guarded cast |
| acrobat | Airborne vault; two strikes | Leaping three-way spread |
| witch | Brief fast step; one strike | Three accelerating, separated magic shots |
| knight | Armored hopping charge; two strikes | Guarded heavy low ground wave |
| thief | Fast crossing dash; three strikes | High and low paired shots, with a dash available during the ability |
| quiet | Gliding approach; two strikes | Guarded alternating low/high ice attacks |
| patchwork | Hopping pursuit; three strikes | Two angled shots and a low follow-up |

These are actual movement states, collision profiles and chained attacks. Later visitors are not just the tutorial with larger health. The adaptive planner still selects among the six middle lives using combat history; it does not decide endings.

## Opening, dialogue and aftermath

The opening now stages crossed swords, the old king blasting the challenger back, and a returning dash into a physical stab. The previous king then warns the victor about the crown. The challenger holds and takes the crown, the coronation erupts, and the story advances through centuries of waiting.

Dialogue shows portraits, speakers and authored replies without exchange counters, a “YOUR ANSWER” eyebrow or instructional captions over the story. Two branching exchanges remain, with the second branch responding to the first choice. Keyboard instructions remain available in Controls.

Normal and Do Nothing endings retain the paired held-impalement animation: the challenger grips the king, a solid blade pierces the torso, blood and a wound appear, and the king remains held before the final nova. Dawn returns to the same arena in ruins. Dialogue does not describe each action in advance.

## Asset record and verification boundary

New source images, geometry records, attribution and processing scripts live in assets/kinetic-v7/. Active imported atlases use the -v7 suffix in godot/art/, including king-combo-v7.png, hollow-sovereign-v7.png, transformation-v7.png and opening-duel-v7.png. Earlier assets/godot-v6/ remains a record of the original native port and its audio processing.

The current native suite has **136 passing checks: 71 court, 37 game and 28 planner**. The native browser suite passed menus, bindings, opening, dialogue, combat, waiting and four complete ordinary-input routes: Normal, Do Nothing, scripted Victory and adaptive Victory, with zero game errors or warnings. The kinetic suite separately verified 80ms-spaced J/J/J inputs produce [0,1,2], short/held jump peaks of about60/94 pixels, no airborne footsteps, acceleration/braking, different base/transformed sprite resources, Crownfall and Undertow, and an acrobat performing a dash, three melee strikes and an ability. It captured all six new opening action/crown stages. After the final foot-anchor export, the kinetic suite was repeated on a fresh PCK and passed; Crownfall and idle feet were visually checked against the floor. The final native build is clean. The preserved TypeScript suite also passed140 tests and typechecking. Evidence: ignored output/qa/godot/report.json and output/qa/kinetic/report.json; headless screenshot GPU diagnostics are recorded separately from game warnings.
