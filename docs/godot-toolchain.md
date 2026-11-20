AI-use disclosure: Codex authored the Godot installation, export and verification tooling.

# Godot Web toolchain
The active engine is the official Godot 4.7.2 stable GDScript edition. Editor and web export templates are pinned to the same release. The Godot project is godot/project.godot; the published product is its actual WebAssembly export, not a browser wrapper around the archived Phaser implementation.

On this Windows machine the portable editor and export templates live in D:/Coding VS/.tools/godot. The _sc_ marker keeps editor settings and export-template data on D. Game source, imported project cache, exported files and QA evidence remain inside the D-drive project or tools folder.

Run node scripts/build-godot.mjs to import the native project, run its headless court/game behavior checks, and export build/web/index.html. Native Windows checks and game logs use APPDATA/LOCALAPPDATA under D:/Coding VS/.tools/godot/user-data; Linux CI uses matching XDG tool-cache paths. If needed, scripts/install-godot.mjs downloads the official editor and matching export templates. It verifies the editor SHA512 against the official release sums. The official template archive is downloaded over HTTPS and checksum-verified if range access is unavailable; only web template ZIPs are retained, each checked for ZIP CRC and size. The reusable build excludes all raw tool binaries from Git.

Release source: https://github.com/godotengine/godot/releases/tag/4.7.2-stable
Engine license: https://godotengine.org/license/
Single-thread web documentation: https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html
Portable paths documentation: https://docs.godotengine.org/en/stable/tutorials/io/data_paths.html

The Web preset uses the Compatibility renderer and single-threaded templates. It therefore requires WebGL2 and WebAssembly but does not require SharedArrayBuffer/COOP/COEP headers, so the existing GitHub Pages host works. The minimal HTML shell only loads and starts Godot; gameplay remains in GDScript. The export includes engine license and project attribution sidecars.

The GitHub Pages workflow installs this pinned toolchain, runs the archived deterministic regression suite, imports/exports Godot, and uploads build/web. The published entry is index.html with matching index.js, index.wasm and index.pck names. No main-branch merge is performed.

Browser verification: node scripts/godot-smoke.mjs. The --live flag uses the public Pages URL. The --routes-only flag checks ordinary-input Normal, Do Nothing and Victory paths, plus an independent adaptive-planner Victory run. Stable baseline paths request mode=scripted explicitly; the adaptive path requests mode=heuristic. Evidence is stored in output/qa/godot/ or output/qa/godot-live/. The harness verifies real .wasm/.pck downloads, native menu/control/dialogue inputs and live combat diagnostics. Debug stance checks are labeled presentation components separately from full ordinary-input routes.

A disposable native Godot fixture was first exported and run in isolated headless Brave with real WASM/PCK requests and zero errors. It is toolchain evidence only and is never shipped as the game.

Validation before publication (2026-11-20): all 122 native checks pass (67 court, 27 game behavior, 28 adaptive planner), and the actual WebAssembly build passes native menu/rebinding, locked opening, two dialogue exchanges, movement, jump, dash, blocking, sword inputs, seated years and all three complete ending routes. A fourth full ordinary-input heuristic Victory route also passes: all nine unique visitor identities complete, with a different order from the scripted baseline. The final QA report records game errors separately from headless software-GPU screenshot diagnostics. Screenshots include physical held-heart impalement, the held decree and the same arena in sunrise ruins.

The full-browser export was verified with the earlier 121-check native snapshot; the final native build adds one planner check, bringing its count to 122. The archived 140-test deterministic suite and TypeScript typecheck also pass.

The final local browser run completed in 95 seconds with zero game errors and zero game warnings. Four SwiftShader ReadPixels diagnostics came from screenshot capture and are recorded separately in the report. Production deployment should additionally pass node scripts/godot-smoke.mjs --live after Pages finishes.
