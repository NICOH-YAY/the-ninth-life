AI-use disclosure: Codex wrote the native and browser checks and this QA record.

# Sovereign revision: bug audit and verification

This record covers the v11 body-driven royal kit, individual gait sources, continuous entrances, removal of dialogue stat bargains, and grounded body spacing. Earlier revision reports remain historical evidence, not certification of this export.

## Bugs found and fixed

- Entrance sprites previously moved independently of logical body positions. The director now updates both every physics frame, descends the throne along stair contacts, completes an individual stop pose, and hands off to local idle clocks. All nine entrances have zero measured render/logic gaps and no positional jump at the first actual arrival render.
- Cancelling the silent visitor's entrance could retain music ducking. Cancellation now clears the duck and staged props; a real interrupted entrance fixture verifies both.
- Ordinary walking through an opponent produced automatic rear hits, allowing a chase-and-hold-basic policy to bypass frontal defenses accidentally. A grounded 44-pixel pushbox now gives overlapping bodies mass. Actual dash, sufficiently high jump and Vacant Step remain valid ways through; fixtures verify those crossings and finite separation at both walls.
- A remote echo's frontal clash could shove the real king. Counter facing uses the old body's source, while physical player knockback requires nearby actual contact. A ghost-baited counter can miss the real king on the other side.
- The first counter timing could land before the blocked Hand completed recovery. Counters now expose readable body anticipation. A fixture replays the actual Hand, blocked contact, full recovery and a subsequent fresh guard; the counter is genuinely parried without pre-cancelling the original attack.
- The old isolated movement fixture placed the newly solid enemy directly in its test path. Its setup now puts the enemy outside that path; the original movement-distance assertion remains intact.

## Native proof

`node scripts/build-godot.mjs` passes 541 distinct semantic assertions: court 110, game 42, planner 28, reign 231, royal magic 65 and entrance handoff 65. The final build also passes 2,034 actual-pixel assertions across 62 animation sequences and 472 frame selections. The log contains no engine errors or warnings.

Frame selections are not a claim of 472 globally unique source drawings: a stop deliberately reverses its own six intro frames, and an idle reuses its own neutral. Every expected sequence has distinct actual cropped pixels and atlas regions. The fixture requires new personal visitor gait paths and actual new magic paths, rather than accepting legacy fallbacks. It verifies nine distinct distance-based strides, all twelve magic poses for each of six moves in each form, foot anchors, retention of the exact last moving pose on stop frame zero, and identical neutral source/scale at stop-to-idle handoff. The base idle is honestly one neutral pose; the hovering idle has twelve actual poses.

The magic fixtures exercise finite Pressure, refusal without fake cooldown/cast accounting, actual contact gain, no guarded/echo gain, fixed-origin delayed bodies, independent phase-two relocation, real field movement and selective hazard interactions, field disruption on damage, full-reserve expenditure, delayed inner collision, ward exposure, readable guarded counters, rear/ghost-source alternatives, parry openings and weighted body crossings. Guard exhaustion, next-contact break, fresh-parry exception, recovery lock, hover and nine distinct sacrificial power lifecycles remain covered.

## Browser proof

Final local browser validation completed successfully on 2026-11-21. The standard native UI/opening/controls/combat/rest suite, all four complete ordinary ending routes (idle, normal, scripted victory and heuristic victory), the body-animation suite, the nine-entrance/guard/hover/power suite, and both bounded policy runs all passed with zero engine errors and zero WebGL warnings. The two victory routes each fought all nine visitors. All suites used actual native inputs and the real Godot WASM/PCK, with hidden Brave contexts running sequentially. Rendering errors and INVALID_OPERATION warnings remained strict failures. Screenshot-induced GPU stall due to ReadPixels performance messages are retained separately in driverDiagnostics; they are not described as rendering failures or discarded from the receipts.

A bounded comparison separately measures `bot=mash` (required tutorial actions, then pursuit and held basic attack) against the ordinary mixed-action policy. It does not force basic-only play to lose: the intended requirement is meaningful tradeoffs and open strategies, rather than a mandatory ability solution. Pre-fix and intermediate comparisons are retained under ignored QA output and must not be described as the final balance result.

On the final pushbox/resource build, both policies legally reached Victory through all nine encounters. Mixed actions retained more health in seven of nine fights. Mean observed minimum health was 564.73/700 for mixed actions versus 522.86/700 for held basic attack; against the last visitor it was 535.98 versus 432.70. The mixed policy took more damage against the second and eighth visitors, so this is a tradeoff rather than universal dominance. This is one deterministic scripted seed, not a statistical balance study or proof of optimal play. Basic-only victory remains intentionally legal.

The final ignored receipt is `output/qa/v11-final-local-validation.json`; it records all five fresh suite outcomes, timestamps, policy minima and SHA-256 hashes of the tested PCK/WASM. Public deployment verification is performed against the released build-info commit after publication; no future commit is invented here.

Reproduction commands: `node scripts/godot-smoke.mjs --serial-routes`, then `node scripts/body-animation-smoke.mjs`, then `node scripts/reign-smoke.mjs`, then `node scripts/mash-smoke.mjs`, then `node scripts/mash-smoke.mjs --bot=victory`. Do not run these WebGL suites concurrently.
