AI-use disclosure: Codex-authored implementation and release record from Nicoh's revised direction.

# Gothic art, combat, dialogue and score
Canonical project: D:/Coding VS/the-ninth-life. The existing prototype/first-playable branch remains the publication branch. No changes are merged or pushed to main.

Nicoh explicitly chose closer licensed/original music. Twelve different Scott Buckley compositions replace the rejected three-track runtime score. Menu, passing years, each of the nine visitor forms and aftermath have independent recordings. Native browser audio tests played all twelve cues and decoded fifteen processed Chequered Ink Foley mixdowns, including actual weapon/material/guard/dash/stab sounds. All27runtimeMP3 files passed full FFmpeg decode. Music is lazy-loaded rather than downloading the full19.5MB together.

Every visitor now has two required dialogue choices and two complete exchanges. The second branch depends on the first answer and bond. Unique objects and memories connect anonymous visitors to the crown, and new portrait frames match current costumes.

The base king's kit is physical: chained Crownsteel cuts/rise/thrust, Oathpiercer lunge, Kneel, and advancing Procession sword echoes. The multi-armed monster uses Rend, nonhoming fang fans, staggered Grave Hands pillars and an expanding Eclipse wave. Enemy contact weapons also differ: hooks pull, hammers launch, flails pressure guard, frost spear reaches farther, and acrobat rebounds. Real input policies use these ranges and contact tells without health/damage bonuses.

The new castle, aging halls, ruined dawn and menu use genuine hand-drawn Ansimuz CC0 source tiles and layered art, composed at480x270/exact2x display. The actual opaque floor cap—not transparent tile padding—is registered to y464. Higgsfield generated210 selected sprite/effect frames:48king,48monster,12coronation,48effects,54visitoridle/hurt. Binary alpha and zero clipping were verified. Source palettes are preserved for vivid hand-drawn color; this is not claimed to be a32-color environment export.

Coronation reaches, lifts, holds and dons the crown before transforming. Defeat uses one light-sword thrust through the actual new king sprite's heart at approximately(755,381). The visitor leaps to reach the hilt, and the blade remains embedded through the decree and explosion. Geometry checks measured under2pixels error at the heart. Victory preserves the difficult mortal final opponent and king-survives outcome.

The deterministic suite passes140tests across17files. Strict main/worker TypeScript checks and production build passed. Final production browser validation targets index-B9dxlPRJ.js and checks both choices, actual native combat, sword orientation, monster fan, all three held-stab presentations and nine distinct visitor music URLs with no errors/warnings. Full ordinary-input routes are separately verified by scripts/royal-routes.mjs; isolated ending components do not substitute for route proof.

Asset, score and Foley attribution is in ATTRIBUTION.md plus assets/gothic-v5/ and assets/audio-v5/ manifests. Raw downloads, source recordings, archives, temporary itch session pages and private course context remain ignored. Public verification after deployment uses node scripts/gothic-v5-smoke.mjs --live and records local evidence under output/qa/gothic-v5-live/.

Postdeployment: the full public UI/audio/coronation/two-choice/native-combat check passed on index-B9dxlPRJ.js with zero errors and warnings. A further sprite audit caught detached next-row fragments falsely defining feet in22 visitor poses. The follow-up patch removes those fragments and translates coherent actors to y110 without scaling or recoloring; all140 other visitor frames remain identical in rawRGBA.

The focused verifier passed on index-DNjXFc0U.js: all162 frames audited, all22 corrected feet exactly110, original body pixel counts and normalized shape/color hashes preserved, actual thief idle/walk/hurt feet at worldy464 within2pixels, and all three versioned asset URLs fetched. Source changes after the fully tested gameplay build are only the three sprite-cache URL tags. Postdeployment verification uses node scripts/thief-anchor-smoke.mjs --live with evidence under output/qa/thief-anchor-live/.
