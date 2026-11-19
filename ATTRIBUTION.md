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
