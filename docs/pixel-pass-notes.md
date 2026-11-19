AI-use disclosure: written by Codex; Higgsfield generated the new raster assets. Nicoh directs the design and owns final dialogue.

# Pixel presentation revision

The working project and its Git history are now in `D:\Coding VS\the-ninth-life`, on `prototype/first-playable`. The former C: game copy was moved here at Nicoh's request. All source, design documents, course handoff files and asset evidence are in this folder. User reference images are local-only in the ignored `assets/references/`; private `CLAUDE.local.md` remains ignored.

## Play

Double-click `PLAY.cmd`, or run `npm install`, then `npm run dev`. Open the local address printed in the terminal. Use Enter or Play at the menu. C opens Attributions, Esc returns or skips the opening. A/D move; J/K/L/Space attack; M toggles sound. The ninth-life lower-guard control remains S. Between fights, use A/D then Enter, or click a response.

## Changed

- Play and Attributions menu, with source credits.
- Fifteen-second generated opening with provisional dialogue, inherited immortality, a thousand-year jump, and a one-hit kitten defeat. Skip and natural completion both record exactly one real rules-based encounter before interactive life two. Autoplay still exercises the original nine-life loop from life one.
- Moonlit and matched dawn pixel throne halls. Smaller sprite display heights make the room feel larger without retuning combat geometry or stats.
- Upright, bipedal accessory-led cats with different fur types. Revised sprites replace the rejected quadruped designs. Original generations are preserved as evidence.
- 48 x 72 native character frames, a shared 32-colour palette, hard transparency and nearest-neighbour scaling. Native exported PNG sheets are in `assets/pixel/native/`.
- Boss attack frames tied to anticipation, release and recovery; challenger poses tied to controller states; coloured slash trails, pixel impact bursts, dodge dust, hit-stop and a particle-heavy Ascended transformation.
- Life title cards and statistical intermissions replaced by in-arena speech and bottom response choices. Planner diagnostics appear only with `?debug=1`.

## Verification

`npm run typecheck`, `npm test` (84 tests across eight files) and `npm run build` pass. Two additional regressions check cinematic progression and prevent a duplicate kitten encounter. No live model calls are used by these tests.

An isolated headless Brave session verified the Play / Attributions / Back flow, skipped opening, natural opening duration (14,967 ms), visible transformation frames, Ascended textures, and a complete nine-life seeded autoplay run. The ending was `letting_go`, guard lowered, bond 4, quiet life spared, all nine summaries recorded, with no JavaScript, console or asset errors. A later caption-only adjustment removed explanatory transformation text; fresh screenshots verified it and a turquoise Shadow Tide effect. Final native PNG packaging passed its separate loading/visual check with every runtime character canvas confirmed at 48 x 72, no errors, and typecheck, all 84 tests and build passing again. Reproducible smoke script: `npm run test:browser`; set `PLAYWRIGHT_BROWSER_PATH` if using a different local browser. Screenshots and the report are local-only in `output/qa/`.

The final native sprite sheets total approximately 85 KB in `public/pixel/`, replacing megabyte-sized source sheets in the runtime payload. Generator originals remain under `assets/pixel/`.

## Limits and decisions to confirm

- Generated animation consists of authored key poses with procedural movement, not a fully hand-animated 60-frame-per-second production sprite set. The opening service returned sixteen whole-scene poses; the game stages them across fifteen seconds. Source and delivered frame counts are logged honestly.
- Dialogue, procedural music, sounds and ending wording remain provisional. No recorded voice acting is included.
- Generators can drift in accessories and pose anchors. The importer excludes known incorrect cells, preserves a common foot anchor and uses a fixed grid. Further sprite cleanup is an art-polish task.
- Live Worker deployment and live-model evaluation remain as in the original handoff: not completed by this visual pass.
- The later user request authorizes a source push and GitHub Pages publication. The Pages workflow is in `.github/workflows/pages.yml`; no main-branch merge is required.
- ECC commands and the named Haiku runtime are not exposed in this Codex session. Available coding subagents handled the kickoff's requested asset and test delegation. Local commits use Codex authorship; the source branch is preserved.

First five tuning targets: hand-clean sprite silhouettes; add more walk and recovery frames; review dialogue timing; listen to and mix audio; playtest counter readability in the larger-feeling hall.
