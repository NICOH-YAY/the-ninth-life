AI-use disclosure: Codex-authored implementation notes from Nicoh's requested iteration.

# Royal revision
Canonical working copy: D:\Coding VS\the-ninth-life. Project work and generated artifacts remain on D:.

Authorized scope: anonymous returning soul, selectable dialogue, lethal endings with final nova/ruins, independent stronger enemy weapons, grounded animation, symmetric guard, pixel presentation, mysterious still menu, licensed orchestral/choir soundtrack, voice-over slots, bug audit and GitHub Pages publication. These later user instructions override the kickoff's old forced-loss/friendly-story, no-generation and no-push restrictions. No merge to main is authorized or performed.

Work was delegated for art generation, design research/menu/finale/browser QA, and music research/core combat regressions. Research and bug findings are under docs/research/. The existing Phaser engine is retained. The prior named forms are only internal planner IDs. Normal, Do Nothing and Victory outcomes still follow the player's inputs.

The new art uses free Higgsfield generation with explicit user authorization. Original images and job evidence remain in assets/royal-v4; runtime sprite sheets are in public/royal-v4. Some wrong-weapon generated poses were replaced by coherent neighboring poses in runtime exports and documented; originals are untouched.

Soundtrack: At Rest, Five Armies and Virtutes Vocis by Kevin MacLeod under CC BY 4.0. Files are normalized and compressed with provenance retained. The linked Sawano track and Radiohead's Let Down are mood references; their commercial recordings are not bundled. Native browser playback follows user interaction; scene crossfades, mute and dialogue ducking are integrated. No recorded voice acting is supplied. Add licensed clips through src/game/voice-cues.ts.

Final validation: 123/123 deterministic tests and all 13 test files passed; strict game/worker TypeScript checks passed; the production build passed. The complete ordinary-input browser routes reached Normal, Do Nothing and Victory from life one without debug jumps or health overrides. All nine unique forms were defeated in Victory. These checks recorded zero errors and warnings.

Final presentation/audio browser proof is output/qa/royal/report.json against index-C7yodiOf.js. It verifies the static pixel menu, centered canvas at 960x540, 1280x720 and 390x844, real soundtrack playback, years/combat/finale transitions, portrait ducking, mute during crossfades, anonymous dialogue, responsive reply selection changing bond, actual generated dawn-ruin texture in both defeat endings, grounded prone corpse, reading locks and return controls. Browser component-ending checks are distinct from the complete combat-route checks under output/qa/royal-routes/.

Publication uses the existing prototype branch and GitHub Pages workflow. The postdeployment check is scripts/royal-live.mjs; its local evidence will be saved in output/qa/royal-live/. Main is not merged or pushed.

Published game commit a140408 through successful Pages run 44660259739. The public-site browser check passed in 44.9 seconds against index-C7yodiOf.js: all nine royal/background textures loaded, licensed music played after a trusted keypress, the locked opening and anonymous dialogue worked, open reply raised bond, and actual movement/jump/attack inputs worked with the new visitor sheets. Public verification recorded zero errors and warnings. Evidence: output/qa/royal-live/report.json.
