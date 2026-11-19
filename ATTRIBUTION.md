# Attribution

AI-use disclosure: every asset row says how it was made.

| Asset | Source | Tool or model | Date |
|---|---|---|---|
| assets/concept/*.png (8 images, see manifest.json) | Generated for this project | Higgsfield, z_image | 2026-11-19 |
| public/sprites/*.png | Derived from assets/concept lineups and characters by chroma key and crop | scripts/chroma-key.mjs, scripts/crop-lineup.mjs (sharp) | 2026-11-19 |
| public/bg/*.png | Copied from assets/concept | Higgsfield, z_image | 2026-11-19 |
| Music, ambience, murmur, and sound effects | Generated in code at runtime (src/game/audio.ts, WebAudio oscillators and noise) | Written by Claude Code, no samples | 2026-11-19 |
| UI, hit effects, props (flowers, cloth scraps), framing | Drawn in code (src/game/art.ts, src/game/scenes) | Written by Claude Code | 2026-11-19 |
| Phaser 3.88.2 | npm, MIT license | Engine | 2026-11-19 |
