AI-use disclosure: Claude built the original prototype; Codex implemented the native Godot port, sprite presentation and deployment from Nicoh's direction.

# The Ninth Life

An immortal cat king faces his own past lives, retained by the crown. Fight freely through centuries of rule, choose how to answer each visitor, and survive or leave a ruined kingdom behind.

[Play the published game](https://nicoh-yay.github.io/the-ninth-life/).

## Run and edit

The canonical project, assets, Git history and local evidence are on D: at D:\Coding VS\the-ninth-life. Open godot/project.godot in Godot 4.7.2 to edit the active game. Double-click PLAY.cmd for a local web build, or run:

~~~sh
npm install
npm run dev
~~~

This imports, checks and exports the native Godot project, then serves build/web. The first build installs the pinned editor and web templates under D:\Coding VS\.tools\godot on this computer. npm run build exports; npm run preview serves an existing export. See [toolchain details](docs/godot-toolchain.md).

## Current game

Current king kit: [restored sword and floating-area abilities](docs/king-kit-revert.md). Individual visitor gait and entrance fixes remain.

Historical mechanics: [body-bound sovereign magic and individual gaits](docs/sovereign-magic.md).

Historical encounter contract: [reign, sacrifice and exchange](docs/reign-and-exchange.md).

Latest animation revision: [physical body preparation and walking](docs/body-animation.md).

The sword-bearing king has buffered three-strike combos and transforms into the Hollow Sovereign, a broken-crowned figure with a torn indigo mantle and cyan chest fissure. Its separate moveset combines wide rakes, five falling blades, inward gravity and an expanding wave. Movement uses acceleration, braking, jump buffering and short jumps; visitors have their own rushes, vaults and attack chains. Visitors have different weapons and attacks but anonymous dialogue. Each meeting has two branching exchanges without exchange counters or instructional captions over the story. The durable tutorial requires a jump, dash and real block. Enemies resist interruption until their poise breaks; a precisely timed guard opens a physical stab counter. Between fights, years pass while the king sits slumped and weary; the hall ages.

Normal and Do Nothing endings show the challenger gripping the king and physically piercing his torso before nine visible memories leave the body and the final nova erupts. The name Morrow is revealed; dawn returns to the same hall in ruins. Victory follows defeating all nine lives. No outcome is selected by the planner.

Controls can be rebound in the main menu and persist locally. Default movement is A/D, jump Space, dash Shift, sword J, thrust K, decree L, nova F, guard G, and lower guard S. Esc pauses; M mutes. Phase two changes the four attacks. Dialogue reading time is locked before choices become available.

## Project map

| Path | Purpose |
|---|---|
| godot/project.godot, main.tscn | Active native engine project and scene |
| godot/game.gd, combat_rules.gd | Gameplay, encounters, cutscenes and combat profiles |
| godot/actor_view.gd, art/ | Sprite animation and pixel environments |
| godot/court_ui.gd, court_audio.gd | Native menus, controls, dialogue and mixed audio |
| godot/run_planner.gd | Offline adaptive planner and optional HTTPS Worker |
| godot/content/ | Dialogue, credits and native verification scripts |
| assets/godot-v6/, assets/kinetic-v7/ | Earlier native-port and kinetic-art provenance |
| assets/memory-v8/, assets/court-v8/ | Current menu, seating, guard and original/edited audio provenance |
| src/, public/ | Preserved earlier TypeScript/Phaser implementation |
| worker/, agents/ | Existing optional between-fight AI service |
| docs/ | Design history, current contract, audit and handoffs |

The active contract is [docs/godot-port.md](docs/godot-port.md); the latest [memory and poise revision](docs/memory-and-poise.md) details the story reveal, committed attack timing, perfect guards and minimal menu. [Kinetic combat](docs/kinetic-combat.md) records the preceding form, movement and opening changes. Older design documents and Phaser code remain historical references. Legacy development commands use the legacy: prefix.

## Planner and checks

Default heuristic mode chooses remaining lives from actual combat history. ?mode=scripted fixes the order. ?mode=live&worker=URL enables a validated HTTPS Worker between fights only, with a five-second timeout, six-call ceiling and deterministic fallback. No model request runs during combat.

~~~sh
npm test
npm run typecheck
npm run build
npm run test:browser
~~~

The build runs native Godot checks before exporting actual WASM/PCK files. The final native suite passed161 checks (84 court,49 game,28 planner). Browser QA covers native menus, rebinding, opening, two dialogue choices, combat, sad waiting, three endings and a separate adaptive nine-life run. Both final browser suites passed with zero game errors or warnings, including perfect-block counters, shield/poise retaliation, fixed AoE targets and nine released memories. Debug shortcuts require ?debug=1. Autoplay QA uses ordinary inputs with ?autoplay=1&speed=8&bot=victory (or normal/idle).

GitHub Pages publishes build/web from prototype/first-playable. Private context, source audio archives, build caches and local evidence stay ignored. The [full change audit](docs/agent-sessions/FULL-CHAT-CHANGE-AUDIT.md) records historical and current code changes line by line, with evidence boundaries. Asset rights and AI use are in [ATTRIBUTION.md](ATTRIBUTION.md).
