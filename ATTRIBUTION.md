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
