AI-use disclosure: Codex authored the targeted restoration checks and this QA record.

# King kit restoration: verification

The current request restores the earlier king move set and its matching sword sprites. It supersedes the active-kit claims in `sovereign-magic.md` and the historical v11 magic QA record. No new images were generated for this restoration.

The base kit is Crownsteel, Oathpiercer, Kneel and Procession. The stronger form returns to Gloam Rake, Crownfall, Royal Undertow and Last Dominion. The active Pressure module, resource gate, old-body echo kit and ward-exposure HUD are removed. Personal visitor gaits, continuous entrances, anonymous branching dialogue without stat bargains, guard exhaustion, weighted body separation and distinct visitor powers remain.

## Targeted native proof

`verify_classic_kit.gd` replaces the obsolete Pressure verifier. It checks all eight classic casts without a resource gate; real three-stage sword contact in both forms; the physical thrust and its deliberate pushbox crossing; locked-position Kneel; three advancing Procession marks; five descending Crownfall blades with actual collision; Undertow's inward impulse/lift; Dominion's expanding contact; absence of the Pressure script and HUD; frontal guarded counters, rear attacks and parry openings; and solid walking versus deliberate dash/jump crossings at both walls.

The restored slash recoveries are longer than the newer hand-strike recoveries. A retained visitor counter initially landed too early after a blocked classic slash. The interaction now derives a minimum tell from the current move's actual active/recovery duration, preserving the restored king timing and leaving a defensive response window. The verifier replays all three real blocked slash stages, waits through their complete recovery and then performs a fresh perfect guard. It does not pre-cancel the original attack or merely inspect a timer.

Actual-pixel proof covers restored sword preparation/contact/cast atlases and hovering form, alongside the newer individual visitor walk/start/stop/neutral sources. Frame counts and real cropped pixels are verified rather than treating unchanged metadata as animation.

## Validation status

The final strict native/export build passes 526 semantic assertions (court 110, game 42, planner 28, reign 231, classic-kit 50 and entrance 65), plus 2,012 actual-pixel checks across 74 sequences and 501 frame selections. These frame selections include deliberate source reuse across compatible poses; they are not a claim of 501 globally unique drawings. The build reports no engine errors or warnings.

The full native UI/combat/story/rest browser suite and all four ordinary ending routes pass: Do Nothing, Normal, scripted Victory and heuristic Victory. Both Victory routes fight all nine visitors. Targeted body-animation browser proof also passes with the restored physical sword/thrust and crown-rain preparations, both forms and retained personal visitor gaits. Both browser suites finish with zero errors and zero unexpected warnings. Retained guard, visitor powers and entrance mechanics pass their native suites; the unchanged long reign browser suite was not repeated unnecessarily.

The final ignored local receipt is `output/qa/classic-kit-final/local-validation.json`. Public UI and body proof run after publication against the exact deployed commit. No future release hash is invented in this source record.

All rendering errors and unexpected warnings remain failures. Screenshot readback performance messages are retained separately as `driverDiagnostics`.
