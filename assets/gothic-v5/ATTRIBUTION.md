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

Visitor anchor correction: Codex removed only confirmed detached below-body neighboring-cell fragments in22 runtime frames (18thief poses, one frost-keeper walk pose, three aerial attack poses) and translated each coherent actor/legitimate weapon to feet110. No rescaling or recoloring occurred. Originals, before/after bounds and hashes are retained in foot-repair-inputs/ and foot-anchor-repair.json. All frames outside the authorized22 remained byte-identical in rawRGBA. A read-only audit of all162 visitor frames found no remaining largest-body foot below105; every repaired frame ends at110.
