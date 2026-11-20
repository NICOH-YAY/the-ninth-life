AI-use disclosure: Written by Codex from executed production-browser checks and visual inspection on November 19, 2026 (America/New_York).

# Royal presentation browser validation

Final production bundle: `dist/assets/index-C7yodiOf.js`.

Commands: `npm run build`, followed by `node scripts/royal-smoke.mjs`. Both passed. TypeScript checks also passed during the ending and corpse-grounding implementation. The final browser run used installed headless Brave through Playwright and Vite production preview at `127.0.0.1:5187`. No visible browser windows or desktop input were used.

Machine-readable evidence is `output/qa/royal/report.json`; screenshots are in the same directory. The report records the exact production bundle URL, native audio state, canvas dimensions, bond response and all three ending states. Browser errors and warnings were both empty.

## Passed checks

- Static authored pixel menu: graphics present, generated exterior image absent, no menu tweens. Two canvas screenshots taken 1.1 seconds apart had identical SHA-256 hashes.
- Keyboard navigation to Settings and back, music Attributions and Play into the actual opening sequence.
- All three soundtrack titles, Kevin MacLeod, incompetech.com, CC BY 4.0 link and processing disclosure appear in credits.
- Actual native media playback after a user gesture. The recorded cue sequence is At Rest (years), Five Armies (combat), Virtutes Vocis (finale). Portrait music ducking, restored combat volume, twelve 100 ms muted-crossfade samples with all active track volumes exactly zero, and unmute recovery passed.
- The opening cannot be dismissed with Escape/Enter. The first tutorial arrival uses an anonymous punctuation-only speaker label.
- The visible choice panel includes arrow-selection and Enter-confirm instructions. Rapid Down then Up selection works; confirming the open answer increases bond from 0 to 1. This test exposed an earlier Phaser key-event timing issue; choices now use scene-cleaned native key listeners.
- Normal and Do Nothing endings start in the dark aged hall, show the king's lethal impacts and last nova, then use the loaded `royal-dawn-ruins` texture. Both characters disappear in the destruction and do not walk out together.
- Victory leaves the slain challenger in the hall and the king alone. The corpse's frozen body pose rests on the floor. Its opaque sprite pixels, rather than transparent atlas bounds, determine rotated floor contact.
- All three ending components keep their reading lock, reach their coda and return to the menu on Enter. The ending title has a dark plaque and light lettering to remain readable over the ruined roof.

## Aspect and centering

The logical canvas stays 960 x 540. FIT preserves 16:9 without cropping; centering assertions allow two display pixels of rounding.

| Browser viewport | Displayed canvas | Canvas position |
| --- | --- | --- |
| 960 x 540 | 960 x 540 | 0, 0 |
| 1280 x 720 | 1280 x 720 | 0, 0 |
| 390 x 844 | 390 x 219.375 | 0, 312 |

The portrait result verifies the duplicate parent-centering correction: Phaser handles the canvas margins without a second flex-centering offset. Fractional FIT scaling remains a small-screen fallback; the background artwork itself uses a consistent native pixel grid.

## Visual evidence reviewed

`menu-static-pixel.png`, `menu-390x844.png`, `music-attributions.png`, `explicit-dialogue-choice.png`, `victory-slain-challenger.png`, `ending-normal-last-nova-charge.png`, `ending-normal-last-nova-blast.png`, and all three `ending-*-coda.png` captures were produced. The menu, credits, answer selection, prone corpse and generated ruined dawn were inspected directly. The nova capture waits for the initial white flash to clear so its expanding effect remains visible.

## Scope of this evidence

The first encounter and its dialogue choice use actual UI inputs. The three ending checks deliberately start the real EndingScene with representative completed-run data, isolating presentation and cancellation from combat balancing. They do not claim that an unattended player completed all nine fights or prove the complete combat routes. Deterministic combat/ending-rule tests and deployment verification are separate checks.
