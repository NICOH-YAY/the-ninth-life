AI-use disclosure: Codex implemented the audio director and wrote/executed these browser checks; no live model calls occur in combat or tests.

# Gothic v5 browser validation
Final tested production bundle: **index-B9dxlPRJ.js**.

Strict game and worker TypeScript checks and production build passed. The audio-specific regression file passed3tests; the parent agent's complete deterministic suite passed140tests. Runtime source stayed frozen throughout the final production checks.

## Actual UI and native combat
scripts/gothic-v5-smoke.mjs passed with zero browser errors and zero warnings. Evidence: output/qa/gothic-v5/report.json.

The test follows the actual title, keyboard Settings and Attributions flow, and checks centered16:9 fit at960x540,1280x720 and390x844. The title uses the new hand-assembled gothic-menu image and has no continuous image zoom. Composer, license and Foley credits are visible.

It plays the unskippable opening and captures the physical crown held in the paws, lifted onto the head and transformation through gothic-coronation frames. It answers the first visitor twice: Down/Up selection, open first answer, then a different guarded second answer. The second exchange is conditional on the first answer; combat remains frozen until both are confirmed. The open answer raises bond.

Trusted keyboard inputs then demonstrate jumping, dash afterimages, an actual guarded hit, physical Oathpiercer movement with no friendly projectile, a real hit reaction and the new layered guard. The left-authored thrust sprite is checked against the strike's actual direction. A debug P input is explicitly used as a separate presentation check for the monster transformation; the monster then fires the nonhoming Hollow Choir fan through a real K input. This debug presentation check is distinct from complete ordinary combat-route proof.

## Score and Foley
Menu, passing-years and first-cat music play as distinct files through the real game. The three rejected previous recordings are never requested. Nine separate debug encounter components verify that every incarnation actually plays a different combat recording and displays its own accessories. Those encounter components do not claim full ordinary progression.

The independent audio component check assets/audio-v5/verify.mjs passed12native music cues,15decoded Foley buffers, recorded effect playback, dialogue ducking, silence throughout a muted crossfade and unmute recovery, with zero browser errors/warnings. All27runtime audio files also passed full FFmpeg decoding. Evidence: output/qa/audio-v5/report.json and assets/audio-v5/decode-validation.json.

## Held heart-stab and endings
Three isolated ending presentation components pass their reading locks and return controls. Normal and Do Nothing show one thrust held through the actual heart; measured blade-line error is under2pixels. The sword stays visible and the king remains impaled through heart-held, decree and explosion, then disappears with both actors into the generated ruined-dawn scene. Victory leaves a grounded fallen visitor and living king. No branch has a friendly departure. Final images were visually inspected.

These components intentionally start EndingScene from an existing session; they do not establish the outcome by combat.

## Complete ordinary-input routes
scripts/royal-routes.mjs separately passed all three full routes from life one on the same B9dxlPRJ production bundle:
- Do Nothing: inactivity leads to the king's death, held-stab finale, ruins and return.
- Normal: tutorial completed through ordinary inputs; the next incarnation defeats the king; finale, ruins and return.
- Victory: the ordinary fighter policy defeats all9unique forms without actor/stat overrides, debug jumps or health bonuses. Living king, dead visitor and return verified.

Full-route durations were approximately32,43and47seconds at the explicit8x test speed. Browser errors and warnings were both zero. Evidence: output/qa/royal-routes/report.json and coda images. The bot is a regression tool; it does not alter player balance.

## Public-site verification
After deployment, run node scripts/gothic-v5-smoke.mjs --live. It uses the public Pages URL with cache busting and saves output/qa/gothic-v5-live/. Live mode verifies actual UI, both choices, coronation, music and native combat; the isolated ending and nine-debug-encounter components are retained as local production evidence. Public results must be read after this command completes; local success alone does not claim publication.

No recorded voice acting is supplied. The optional voice registry remains available. Music selection is licensed orchestral/choral contrast, not the copyrighted reference recordings or an exact musical imitation.
