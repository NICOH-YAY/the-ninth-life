AI-use disclosure: every asset row says how it was made.

# Attribution

| Asset | Source | Tool or model | Date |
|---|---|---|---|
| assets/concept/*.png (8 images, see manifest.json) | Generated for this project | Higgsfield, z_image | 2026-11-19 |
| public/sprites/*.png | Derived from assets/concept lineups and characters by chroma key and crop | scripts/chroma-key.mjs, scripts/crop-lineup.mjs (sharp) | 2026-11-19 |
| public/bg/*.png | Copied from assets/concept | Higgsfield, z_image | 2026-11-19 |
| Music, ambience, murmur, and sound effects | Generated in code at runtime (src/game/audio.ts, WebAudio oscillators and noise) | Written by Claude Code, no samples | 2026-11-19 |
| UI, hit effects, props (flowers, cloth scraps), framing | Drawn in code (src/game/art.ts, src/game/scenes) | Written by Claude Code | 2026-11-19 |
| Phaser 3.88.2 | npm, MIT license | Engine | 2026-11-19 |
| Provisional pixel cat rig and accessory variants | Original native pixel drawing for this project's presentation revision | Written by Codex; code-authored art, not Higgsfield output | 2026-11-19 |
| Provisional pixel throne arena | Original native pixel drawing for this project's presentation revision | Written by Codex; code-authored art, not Higgsfield output | 2026-11-19 |
| Revised combat animation and impact effects | Original runtime drawing and animation for this project | Written by Codex | 2026-11-19 |
| Pixel art generation prompts | `assets/pixel/higgsfield-prompts.json`; production specifications and actual submitted prompts in generation-log.json | Written by Codex for Higgsfield | 2026-11-19 |
| assets/pixel/immortal-base-sheet.png | Generated animation sheet, six columns by four rows; original retained | Higgsfield GPT Image 2.6, job `276b03fd-d546-4ab0-801b-29bb5a762a67`, free unlimited allowance | 2026-11-19 |
| assets/pixel/arena-night.png | Generated night throne arena; original retained | Higgsfield GPT Image 2.6, job `f2d13509-56af-41d5-a1ce-305355b10118`, free unlimited allowance | 2026-11-19 |
| assets/pixel/challenger-roster.png | Generated nine-cat design roster, three columns by three rows; original retained | Higgsfield GPT Image 2.6, job `c002be15-0757-4311-bc16-459810438b23`, free unlimited allowance | 2026-11-19 |
| assets/pixel/immortal-ascended-sheet.png | Generated animation sheet using base character reference, six columns by four rows; original retained | Higgsfield GPT Image 2.6, job `8e3f5c3b-1ce8-428f-9193-30924ee418dd`, free unlimited allowance | 2026-11-19 |
| assets/pixel/challenger-actions.png | Generated six-frame action rows for all nine cats using roster reference; original retained | Higgsfield GPT Image 2.6, job `f723f778-0ee4-4b4b-b4b1-f7e0bd33362b`, free unlimited allowance | 2026-11-19 |
| assets/pixel/prologue.gif | Generated complete scene animation using arena and character references; 16 observed GIF frames | Higgsfield GPT Image 2.6, job `39a8f7d4-7f54-4e01-b3d5-f0f512b11476`, free unlimited allowance | 2026-11-19 |
| public/pixel/prologue-atlas.png and prologue.json | Extracted GIF poses, nearest-neighbor resize to 384x216 cells; intended 15 second game playback | Codex, sharp; scripts/prepare-prologue.mjs | 2026-11-19 |
| assets/pixel/arena-dawn.png | Generated lighting edit of the night arena with matching architecture; original retained | Higgsfield GPT Image 2.6, job `3170b8f5-8128-4fce-a936-338fde52fc0c`, free unlimited allowance | 2026-11-19 |
| assets/pixel/immortal-base-pixel-v2.png | Strict pixel sprite revision, upright bipedal cat, six columns by four rows; original retained | Higgsfield GPT Image 2.6, job `10b5a340-04c3-4fc4-9737-073a43853886`, free unlimited allowance | 2026-11-19 |
| assets/pixel/challenger-pixel-v2.png | Upright bipedal nine-cat action sheet, fur varieties and accessories informed by user-supplied reference; six columns by nine rows | Higgsfield GPT Image 2.6, job `2ddab274-84d8-403f-8d39-d1ad5faa9290`, free unlimited allowance | 2026-11-19 |
| assets/pixel/immortal-ascended-pixel-v2.png | Upright pixel ascended form using strict base reference; six columns by four rows | Higgsfield GPT Image 2.6, job `8e7088c8-e93a-491b-8248-1c07b5c2da39`, free unlimited allowance | 2026-11-19 |
| assets/pixel/immortal-transformation.png | Twelve-frame pixel boss transformation, six columns by two rows | Higgsfield GPT Image 2.6, job `f3c0f5b3-825d-41b4-887a-70c12075f477`, free unlimited allowance | 2026-11-19 |
| assets/pixel/prologue-v2.gif | Revised full opening film with upright pixel cat references; 16 observed frames at 940ms, original retained | Higgsfield GPT Image 2.6, job `d4ca8b87-0c7f-4fe4-b43c-147c3e7a7a86`, free unlimited allowance | 2026-11-19 |
| public/pixel/prologue-atlas.png and prologue.json, revised | Latest opening atlas extracted from prologue-v2.gif, 384x216 cells, eight columns by two rows | Codex, sharp; scripts/prepare-prologue.mjs | 2026-11-19 |
| assets/pixel/challenger-walk-v2.png | Dedicated upright six-frame locomotion rows for all nine fur and accessory identities; six columns by nine rows | Higgsfield GPT Image 2.6, job `7b5a9cbc-0c46-4e7c-913e-37bbe4d37b15`, free unlimited allowance | 2026-11-19 |

Pixel revision status: active runtime characters, arenas and the opening use the revised Higgsfield assets above, processed by Codex into a common pixel grid, palette and foot anchor. The code-authored rig remains a missing-asset fallback. Existing concepts and rejected iterations are preserved as historical source material. Actual submitted prompts, errors and generation evidence are in `assets/pixel/generation-log.json`; the broader specification in `higgsfield-prompts.json` includes optional asset ideas beyond this delivery.

| Runtime derivative | Source and processing | Author/tool | Date |
|---|---|---|---|
| public/pixel/immortal-base-sheet.png | Processed immortal-base-pixel-v2.png into native 48 x 72 frames | Higgsfield source; Codex processing | 2026-11-19 |
| public/pixel/immortal-ascended-sheet.png | Processed immortal-ascended-pixel-v2.png into native frames | Higgsfield source; Codex processing | 2026-11-19 |
| public/pixel/challenger-actions.png and challenger-walk.png | Processed upright v2 action and walk sheets into native frames | Higgsfield source; Codex frame selection | 2026-11-19 |
| public/pixel/immortal-transformation.png | Processed twelve-frame transformation into native frames | Higgsfield source; Codex processing | 2026-11-19 |
| assets/pixel/native/*.png and runtime frame textures | 48 x 72 nearest-neighbour frames, shared 32-colour palette, binary alpha, body-region foot anchors | Codex; sharp and Canvas | 2026-11-19 |
| public/bg/pixel-arena.png and pixel-dawn.png | Copied matching night/dawn generated halls | Higgsfield source | 2026-11-19 |
| public/favicon.png | Immortal sprite first-frame derivative | Codex; sharp | 2026-11-19 |
| assets/references/* | User-supplied mood and accessory references, local-only and excluded from Git/runtime | Original image owners; reference use only | 2026-11-19 |

## Combat and movement revision

AI-use disclosure: these original assets were generated through Higgsfield GPT Image 2.6 using the authorized free unlimited allowance. Exact prompts, model parameters, result URLs, job IDs and observed layouts are in assets/combat-v3/manifest.json. Existing source images are preserved.

| Asset | Source and tool | Date |
|---|---|---|
| assets/combat-v3/castle-exterior.png | Higgsfield GPT Image 2.6, job 3ff59ac6-ac03-4c35-a780-17274d368e8e; original moonlit castle exterior | 2026-11-19 |
| assets/combat-v3/combat-vfx.png | Higgsfield GPT Image 2.6, job b953b5bf-1701-48a7-8f2b-26384b1478dc; 36 sprite effect frames | 2026-11-19 |
| assets/combat-v3/immortal-base-motion.png | Higgsfield GPT Image 2.6, job e7163c4b-91a0-4688-8216-aebda57502de; 48 movement and attack frames with character reference | 2026-11-19 |
| assets/combat-v3/immortal-ascended-motion.png | Higgsfield GPT Image 2.6, job 0bff3fc0-ab77-4739-a177-3240987c87dd; 48 movement and magic frames with base and ascended references | 2026-11-19 |
| assets/combat-v3/challenger-abilities.png | Higgsfield GPT Image 2.6, job 45c7dc45-0213-493d-a553-50210cd8949f; 54 distinct accessory cat ability frames with roster reference | 2026-11-19 |
| public/combat-v3/castle-exterior.png | Codex/sharp resize from generated exterior to 960x540 | 2026-11-19 |
| public/combat-v3/combat-vfx.png | Codex/sharp: 128x128 cells, nearest-neighbor, binary alpha, 48-color palette | 2026-11-19 |
| public/combat-v3/immortal-base-motion.png and immortal-ascended-motion.png | Codex/sharp: uniform whole-cell mapping, 96x96 frames, central feet anchor (48,94), binary alpha and 32-color palette; no row-dependent scaling | 2026-11-19 |
| public/combat-v3/challenger-abilities.png | Codex/sharp: uniform 96x96 source mapping padded to 144x144, feet anchor (72,110), no body rescaling between action frames | 2026-11-19 |
| public/combat-v3/*-native48x72.png | Archived first processing pass from the same generated originals; active motion files use uniform scaling instead | 2026-11-19 |
| public/combat-v3/*.json and assets/combat-v3/process-*.mjs | Codex-authored atlas geometry, provenance and repeatable processing helpers | 2026-11-19 |

| Additional arena and opening asset | Source and processing | Date |
|---|---|---|
| assets/combat-v3/castle-aged-mid.png | Higgsfield GPT Image 2.6 reference edit, job 2ceab360-0c32-4e2f-ac05-df86a5991b37; 400-year cracks, vines, banners, dust and window aging | 2026-11-19 |
| assets/combat-v3/castle-aged-late.png | Higgsfield GPT Image 2.6 reference edit, job d133c617-ad54-43f8-a1d4-1e580b3fdfa6; 900-year roots, roof loss, moss, flowers and early dawn | 2026-11-19 |
| public/combat-v3/castle-aged-mid.png and castle-aged-late.png | Codex/sharp nearest-neighbor resize to 960x540 and 3px downward registration to original arena floor; originals preserved | 2026-11-19 |
| assets/combat-v3/previous-king.png | Higgsfield GPT Image 2.6, job 60ccecaf-3d15-464e-8173-5379c5578169; original old gray tabby king, 24 idle, attack, hurt and collapse poses | 2026-11-19 |
| public/combat-v3/previous-king.png and previous-king-portrait.png | Codex/sharp uniform aspect-preserving whole-cell scale, 96x96 frames with foot anchor (48,94), binary alpha and 32-color palette; portrait is first idle frame | 2026-11-19 |

| Seated immortal asset | Source and processing | Date |
|---|---|---|
| assets/combat-v3/immortal-rest.png | Higgsfield GPT Image 2.6, job 3af32e0d-8ea8-419e-be54-149b0a6ded2d; six seated waiting poses and six rising poses using the approved base-motion reference, free unlimited allowance | 2026-11-19 |
| public/combat-v3/immortal-rest.png and immortal-rest.json | Codex/sharp uniform whole-cell contain scale, twelve 96x96 frames, feet at (48,94), hard alpha and 32-color palette; seated body stays physically lower; no chair or environment baked in | 2026-11-19 |

## Licensed soundtrack — 19 November 2026

AI-use disclosure: Codex researched and selected existing human-composed recordings, verified the composer's download and license pages, and processed runtime copies with FFmpeg. The music itself was not AI generated.

| Recording | Composer and original source | License | Runtime derivative |
|---|---|---|---|
| At Rest | [Kevin MacLeod / Incompetech](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100748) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | public/audio/years-at-rest.mp3 |
| Five Armies | [Kevin MacLeod / Incompetech](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100875) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | public/audio/combat-five-armies.mp3 |
| Virtutes Vocis | [Kevin MacLeod / Incompetech](https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1100800) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | public/audio/finale-virtutes-vocis.mp3 |

Changes to each runtime recording: loudness normalization toward -20 LUFS / -2 dBTP, 0.6-second fade-in, 2-second fade-out, metadata removal and stereo MP3 compression to 128 kbps / 44.1 kHz. Full compositions retained. Official downloads are preserved in assets/audio/originals. Exact download URLs, hashes, license snapshots, required credit strings and loop limitations are in assets/audio/manifest.json. The artist's [free license option](https://incompetech.com/music/royalty-free/licenses/) requires visible credit; the game must also display these credits in Attributions.

Hiroyuki Sawano's Voices of the Chord (86 EIGHTY-SIX original soundtrack; Aniplex) and Radiohead's Let Down were mood references only. Neither reference recording was downloaded, copied or bundled.

## Royal combat polish assets

AI-use disclosure: the six original royal-v4 images were generated with Higgsfield GPT Image 2.6 using the user-authorized free unlimited allowance. Exact prompts, references, model parameters, job IDs, URLs, processing layouts and runtime frame substitutions are recorded in assets/royal-v4/manifest.json. Prior assets are preserved.

| Royal asset | Source and processing | Date |
|---|---|---|
| assets/royal-v4/visitor-combat.png | Higgsfield GPT Image 2.6, job 2c947798-d004-4c29-a68d-d29b3b65e4bc; redesigned nine-cat weapon roster, no umbrella | 2026-11-19 |
| assets/royal-v4/visitor-walk.png | Higgsfield GPT Image 2.6, job 54bff2e4-8f54-410d-8329-0994c75bec09; matching walk cycles using new combat reference | 2026-11-19 |
| assets/royal-v4/royal-vfx.png | Higgsfield GPT Image 2.6, job 587f0043-6ffe-42da-8442-6e084217ef85; sentence, returning blade, gravity seal, circular aegis and final nova | 2026-11-19 |
| assets/royal-v4/visitor-vfx.png | Higgsfield GPT Image 2.6, job cd4c7bd3-2a2d-4f51-86ef-e4fa48a73533; eight distinct weapon effect families | 2026-11-19 |
| assets/royal-v4/blood-hit.png | Higgsfield GPT Image 2.6, job f64b2ac8-5eb9-459e-a9a9-0328522ee975; directional blood droplets and white/crimson impact bursts | 2026-11-19 |
| assets/royal-v4/dawn-ruins.png | Higgsfield GPT Image 2.6 reference edit, job 61a71415-7ae2-4c70-8db1-c5edfeafba48; shattered hall and destroyed kingdom at dawn | 2026-11-19 |
| public/royal-v4/visitor-combat.png and visitor-walk.png | Codex/sharp uniform96px source-cell mapping,144px frames,foot(72,110),binary alpha,32-color per-frame palette,isolated edge-fleck cleanup. Combat chain-warden col4 reuses col3 and thief col1 reuses col0 to keep weapon continuity; originals unchanged | 2026-11-19 |
| public/royal-v4/royal-vfx.png, visitor-vfx.png and blood-hit.png | Codex/sharp128px effect cells,nearest-neighbor,binary alpha,48-color per-frame palette; true transparent negative space | 2026-11-19 |
| public/royal-v4/dawn-ruins.png and assets/royal-v4/dawn-ruins-native320x180.png | Codex/sharp320x180,32-color native export,exact3x nearest enlargement;6native-pixel vertical floor registration,reflected roof/sky padding; original and unregistered native derivative preserved | 2026-11-19 |
| public/royal-v4/arena-night.png, arena-mid.png and arena-late.png | Existing Higgsfield arena art processed by Codex into32-color320x180 nearest-neighbor exports; provenance assets/royal-arena-manifest.json,original art assets/combat-v3 and referenced prior sources | 2026-11-19 |
| public/royal-v4/*.json and assets/royal-v4/process-assets.mjs | Codex-authored geometry,anchors,provenance and repeatable processing helper | 2026-11-19 |

AI-use disclosure: Codex selected, downloaded and edited existing human-composed recordings and creator-authored Foley. No commercial reference recording or melody was copied.

# The Ninth Life: differentiated score and Foley
Music by **Scott Buckley**, released under **CC BY 4.0**. www.scottbuckley.com.au
License: https://creativecommons.org/licenses/by/4.0/
Official use terms: https://www.scottbuckley.com.au/library/using-this-music/

| Placement | Recording | Official source |
|---|---|---|
| Menu | Incantation | https://www.scottbuckley.com.au/library/incantation/ |
| Passing years | Hiraeth | https://www.scottbuckley.com.au/library/hiraeth/ |
| Practice-staff incarnation | Call To Adventure | https://www.scottbuckley.com.au/library/call-to-adventure/ |
| Hooked-blade incarnation | Juggernaut | https://www.scottbuckley.com.au/library/juggernaut/ |
| Chain warden | Legionnaire (2022 Remaster) | https://www.scottbuckley.com.au/library/legionnaire-2022/ |
| Chakram incarnation | Race The Sun | https://www.scottbuckley.com.au/library/race-the-sun/ |
| Astral incarnation | The Summoning | https://www.scottbuckley.com.au/library/the-summoning/ |
| Warhammer incarnation | Goliath | https://www.scottbuckley.com.au/library/goliath/ |
| Mirror-dagger incarnation | Honour Among Thieves | https://www.scottbuckley.com.au/library/honour-among-thieves/ |
| Frost incarnation | Snowfall | https://www.scottbuckley.com.au/library/snowfall/ |
| Broken royal sword incarnation | Vanguard | https://www.scottbuckley.com.au/library/vanguard/ |
| Ruined dawn | Helios | https://www.scottbuckley.com.au/library/helios/ |

Game adaptations: 96–120-second excerpts, normalization toward -19 LUFS/-2 dBTP, short fades, stereo128kbps44.1kHz MP3. Original melodies and instrumentation preserved. Runtime overlap crossfades mask excerpt boundaries; these excerpts are not claimed to be seamless authored loops. Every composition is different; no pitch-shifted replacement copies of the same theme. Track map, direct official downloads, source/runtime SHA-256 hashes, exact excerpt bounds and per-page license evidence: assets/audio-v5/manifest.json.

The selector follows each form's weapon and movement style. Menu uses atmospheric effected wordless voices, passing years uses cello/strings, martial forms use heavy orchestra, the witch uses gothic choir, the acrobat uses brighter orchestral momentum, and the mirror-dagger form has distinct folk winds/accordion/vocal texture. The late Helios excerpt emphasizes orchestral/choir release. This is curated contrast rather than a claim to duplicate the commercial reference track. No claim of exact beat synchronization is made.

Recorded sound effects: **Chequered Ink, 400+ Sounds Pack** — https://ci.itch.io/400-sounds-pack
The creator permits commercial and noncommercial use, with or without credit, but prohibits selling or redistributing unaltered assets as one's own game assets. Only edited, layered game mixdowns are distributed here. Sources include sword slices/clashes/drawing, concrete footsteps, wood impacts, glass pings, clothing, cork stabbing, gore impacts and air bursts. Game-only derivatives use trimming, speed changes, layering, filtering, limiting, fades and mono96kbps MP3 encoding. Exact sample inputs and edits are in assets/audio-v5/sfx-manifest.json. The creator-linked source archive and unmodified recordings remain local-only under ignored local-originals/, outside Git and public hosting.

Commercial reference recordings, including Voices of the Chord and Let Down, are not supplied. No reusable game-distribution permission was found; an instrumental recording would still require appropriate rights. Higgsfield has ElevenLabs and Sonilo music models, but the current unlimited allowance covers speech, images and video rather than those music models. Suno was not in the catalog. No paid music request was submitted.

Runtime music is lazy-loaded per cue (19.34MB across twelve optional cues; not preloaded together), remembers scene positions, uses1.7s equal-power scene transitions and1.5s repeat overlap, ducks to24% during dialogue and honors mute. The15processed sound assets total159.6KB and decode after a trusted gesture. Existing voice-recording hooks are preserved.

AI-use disclosure: Higgsfield generated original feline actor/effect images; Codex assembled human-drawn licensed tiles and prepared the runtime atlases.

## Gothic animation and authentic pixel environment pass
| Asset | Author/source | Processing |
|---|---|---|
| public/gothic-v5/arena-night.png, arena-mid.png, arena-late.png, menu-castle.png, dawn-ruins.png | Luis Zuno / Ansimuz, [Legacy Collection](https://ansimuz.itch.io/gothicvania-patreon-collection), CC0; included public-license.pdf permits use, modification and redistribution | Codex tile/layer composition at native480x270, exact2x display; visible ground registered232/464; palette rebalanced to vivid blue/gold and dawn |
| public/gothic-v5/boss-base.png | Higgsfield GPT Image2.6, job13cf3b8c-deb3-4980-be07-707400612d7c | 48 frames192px, feet96/154, uniform128px source-cell mapping, hardalpha32-color exports |
| public/gothic-v5/boss-monster.png | Higgsfield GPT Image2.6, job0e006191-9604-4af2-87e2-18367eb2c625 | 48 frames192px; original six-armed spectral feline and shattered crown halo |
| public/gothic-v5/coronation.png | Higgsfield GPT Image2.6, job7de8c56b-d99f-4343-8853-15e3680a3cdc | Twelve lift/hold/don/transform frames192px, feet96/154 |
| public/gothic-v5/effects.png | Higgsfield GPT Image2.6, job01cb2025-a4bd-4821-b527-78055b2ff8b7 | 48 frames128px: steel cuts, thrust, seal, aegis, dash, claws, grave hands and held heart-piercing sword |
| public/gothic-v5/visitors.png | Higgsfield GPT Image2.6, job37987577-6178-469a-95a9-f5fa338e86a0, reference prior identity-consistent walk atlas | 54 idle/hurt frames144px, feet72/110; wrong-weapon first attempt is preserved but never loaded |
| assets/gothic-v5/tiles/* and public-license.pdf | Ansimuz's downloaded official free archive, CC0 | Selected unmodified source files retained; original archive/extraction stays local and ignored |
| assets/gothic-v5/*.mjs, manifests and public/gothic-v5/*.json | Codex | Reproducible selection, composition, palette, alpha, geometry and frame verification |

Ozzbit Games' [Action Platformer Character Animation Template](https://ozzbit-games.itch.io/action-platformer-character-template) informed motion principles through its public previews only. No Ozzbit template files or paid-tier animations are bundled.

Visitor foot-anchor cleanup (Codex): removed confirmed detached neighboring-cell fragments and translated coherent actors to the y110 anchor in22 selected runtime frames. No actor was rescaled or recolored. Unchanged source generations and pre-fix exports remain preserved; reproducible helper, raw-pixel bounds and hashes are in assets/gothic-v5/repair-thief-foot.mjs and foot-anchor-repair.json. The162-frame audit found no remaining coherent-body foot above its intended contact baseline.

AI-use disclosure: Codex implemented the native Godot port and prepared the revised sprite and audio assets.

## Native Godot revision

The active project is godot/project.godot. Engine: Godot4.7.2, MIT; exported license text accompanies the web build. Earlier Phaser assets and attribution records remain historical.

| Asset | Source and changes |
|---|---|
| godot/art/held-impalement.png | Higgsfield GPT Image2.6, job0e069eca-93f4-4bbb-96a0-10524803ad05; original joint cat animation with collar grip, solid torso-piercing blade and blood; transparent pixel atlas prepared by Codex |
| godot/art/waiting.png | Higgsfield original generation; slumped, sad/bored king resting and rising; exact job, prompt, source and export hashes in assets/godot-v6/manifest.json |
| godot/art/arena-*.png | Restored earlier licensed/composed pixel hall and matching same-interior ruins; provenance and transformations in assets/godot-v6/ATTRIBUTION.md |
| godot/art/ remaining atlases and skill icons | Reused original Higgsfield king, visitors, effects and coronation; curated/derived pixel skill icons; complete source mapping in assets/godot-v6/ATTRIBUTION.md and manifest.json |
| godot/audio/music/ | The twelve Scott Buckley compositions credited above, CC BY4.0; native runtime crossfade, gain and dialogue-duck modifications |
| godot/audio/sfx/ | Chequered Ink 400+ Sounds Pack; fifteen edited single-source OGG derivatives with native pitch, trimming and fades; exact processing and provenance in assets/godot-v6/audio-processing.json and audio-note.md |

Quaternius Universal Animation Library2, Clockwork Raven Fantasy Icons and Deep-Fold Pixel Planet Generator were reference research only. Their downloaded asset content is not included in the active game. No commercial reference recordings are included. Runtime monster atlas is omitted: the second stance uses the sword-bearing king.

AI-use disclosure: Higgsfield generated the original kinetic combat sprites; Codex implemented native gameplay and pixel exports.

## Kinetic v7 revision

| Asset | Source and processing |
|---|---|
| godot/art/king-combo-v7.png | Higgsfield job5d13baf1-9299-4c78-b3b7-dd27d0686226; three distinct connecting sword cuts,18frames |
| godot/art/hollow-sovereign-v7.png | Higgsfield job8aa9715e-f7b6-47fd-a9cc-1b4929ed7ac3; original broken-crown, torn-mantle, cyan-fissure transformed king,48frames |
| godot/art/opening-duel-v7.png | Higgsfield jobdc573fd2-7477-407a-8f4f-5205925de6c4; two-actor crossed-sword/blast-back/physical stab opening,12frames |
| godot/art/transformation-v7.png | Higgsfield job7c2b909b-bb8d-48c1-b90f-8a6524496947; six actual crown/body transformation poses |
| Other godot/art/*-v7.png siblings | Previously attributed original assets;408 actor/effect frames re-exported with cell-isolated nearest sampling, hard alpha, two-pixel clusters and limited palettes; originals preserved |

All four new images used GPT Image2.6,2k/medium under the user-authorized unlimited allowance. Full prompts, reference jobs, source/runtime SHA256 hashes, fixed geometry and processing scripts: assets/kinetic-v7/manifest.json and ATTRIBUTION.md. Pixel verification checks84new poses for empty frames, clipping, intermediate alpha and off-grid pixels. Actor scales are integers. No PixelLab or third-party character sprites are copied; PixelLab was a style reference in the user's request.

AI-use disclosure: Higgsfield generated the memory/court sprite artwork; Codex authored the combat, story staging and responsive score mix.

## Memory and poise v8

| Asset | Source and changes |
|---|---|
| godot/art/menu-memory-v8.png | Original Higgsfield twilight road, discarded royal sword/crown and distant castle; native480x270 export |
| godot/art/seated-contact-v8.png | Original Higgsfield seated/rising king; fixed contact atworld885/384 with hips at actual throne cushion348 |
| godot/art/guard-sigils-v8.png | Original Higgsfield66-frame atlas: normal/transformed royal guards and nine distinct visitor shields |
| godot/art/combat-tells-v8.png | Original Higgsfield36-frame atlas: thrust, sweep, landing, burst, chain and royal area warning lines/runes |
| godot/audio/sfx/perfect.ogg, poise-break.ogg | Isolated original-pitch Chequered Ink sword-clash/metal-clang edits, same game-use rights as prior Foley |
| godot/audio/sfx/orchestral-accent.ogg | Original Codex deterministic synthesis; synthesis source, WAV master and processing manifest in assets/court-v8 |

The four Higgsfield generations used the authorized unlimited GPT Image2.6 2k/medium configuration. Full prompts, jobIDs, reference sources, source/runtime hashes, measured shield gutters and pixel-grid verification: assets/memory-v8/manifest.json and ATTRIBUTION.md. Audio processing/source hashes: assets/court-v8/audio-processing.json. Existing twelve Scott Buckley compositions retain their individual CC BY4.0 credits; runtime mix now swells with tension and makes space around impacts/dialogue.

Alan Becker's Animation vs. Math informed anticipation/impact/recovery pacing. Its original score is excluded from the composer's Creative Commons library, per https://www.scottbuckley.com.au/2023/06/animation-vs-math/ . No video/audio from it is bundled. Menu references informed minimal composition only; no Fallout, Persona, Firewatch or Ghost of Tsushima artwork is copied into the game.

AI-use disclosure: Higgsfield generated the v9 physical preparation and feline locomotion artwork; Codex integrated native Godot animation clocks and frame selection.

## Physical body animation v9

| Asset | Source and changes |
|---|---|
| godot/art/rest-cat-v9.png | Original tired seated/rising cat with short upright triangular ears and compact feline muzzle; earlier throne contact preserved |
| godot/art/prepare-king-v9.png | Original six-pose physical preparation for each of six base sword/cast actions |
| godot/art/prepare-sovereign-v9.png | Original distinct transformed-body preparation for the same six input families |
| godot/art/prepare-visitors-v9.png | Original weapon-specific preparation for all nine feline identities; targeted chain-weapon repair recorded in manifest |
| godot/art/royal-walk-v9.png | Original six-frame walk cycles for the king, Hollow Sovereign and previous ruler; nine earlier visitor gait sheets retain their prior attribution |

All new generations use the authorized Higgsfield GPT Image2.6 unlimited2k/medium configuration. Exact prompts, job IDs, source/runtime hashes, row mapping and foot geometry are recorded in assets/stance-v9/manifest.json. Actor cells use nearest pixel sampling, hard alpha and fixed foot baselines; source art is preserved. Native verification checks actual cropped pixel differences for each of the198 active walk/preparation frames, separately from browser movement/attack input tests. No third-party character templates or recordings are introduced by this pass.
