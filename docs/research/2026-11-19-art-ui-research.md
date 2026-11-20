AI-use disclosure: Researched and written by Codex on 2026-11-19; recommendations are design proposals, not evidence of asset provenance.

# The Ninth Life: pixel art, menu and engine research

## Scope and local findings

This research supports the user's requested visual and menu polish, preserving the existing browser game. It does not replace the story/combat specification. Sources were consulted on 2026-11-19. Primary documentation is separated below from project-specific recommendations.

Local inspection: `src/game/main.ts` already creates a Phaser game at 960 x 540, using FIT, CENTER_BOTH, pixelArt, roundPixels and antialias:false. `TitleScene` applies a repeating 24-second 1.025x scale tween to the entire castle background. That fractional whole-image movement is an avoidable source of crawling pixels and the drifting wallpaper impression. Existing fallback castle/fog graphics demonstrate that a coherent restrained composition can be built without changing engines. The mobile combat contract records a working movement system and deterministic test suite; preserve those during art polish.

## Primary-source principles

- **Preserve composition and aspect.** Phaser FIT keeps the game's aspect ratio within its parent; ENVELOP covers the parent but may crop. RESIZE changes the game dimensions with the available area. FIT is appropriate for a deliberately composed combat arena with fixed HUD placement. [Phaser Scale Manager](https://docs.phaser.io/phaser/concepts/scale-manager)
- **Pixel scale is a separate choice from aspect fit.** Godot's documentation illustrates how fractional display scales produce uneven pixel widths; integer scaling uses uniform pixel blocks and leaves bars where necessary. This principle applies to raster presentation in Phaser too; FIT alone does not promise integer scaling. [Godot multiple resolutions](https://docs.godotengine.org/en/stable/tutorials/rendering/multiple_resolutions.html)
- **Quiet menus help reading.** Xbox guidance recommends control over scrolling, blinking and moving content, including distracting background movement. It also identifies opaque backgrounds as a way to separate reading content from animation. [XAG 117: visual distractions](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/117)
- **Navigation must be predictable.** Microsoft recommends consistent structure, logical focus movement and keyboard-only navigation. [XAG 112: UI navigation](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/112)
- **Readability includes the scene behind the UI.** Text, meaningful UI and key gameplay elements must remain distinguishable against their backgrounds. [XAG 102: contrast](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/102)
- **A weapon colour cannot carry the whole mechanic.** Essential meaning needs another channel such as shape, symbol, text or pattern. [Game Accessibility Guidelines: colour alone](https://gameaccessibilityguidelines.com/ensure-no-essential-information-is-conveyed-by-a-fixed-colour-alone/)
- **Flash needs a readable purpose.** Riot's VFX education describes the balance between excitement and gameplay clarity, and between a harmonious overall style and effects that belong to individual characters. [Riot Games: Visual Effects](https://www.riotgames.com/en/artedu/visual-effects)

These sources are production and accessibility guidance, not an AI-art detection standard. The user's phrase "looks AI generated" is actionable feedback about inconsistency, excessive detail and unsupported motion. It cannot establish how any particular image was made. Improve those visible properties directly.

## Proposed art constraints for this project

1. Keep the 960 x 540 simulation and UI coordinates. Author new environmental art on a consistent 320 x 180 logical grid (3x enlargement) or, if existing sprite detail requires it, a declared 480 x 270 grid (2x). Choose one after comparing actual gameplay captures. Do not blindly posterize a detailed image and call that a completed pixel-art pass.
2. Use nearest-neighbour sampling, integer asset enlargement and consistent pixel clusters. Avoid fractional whole-scene scaling, artificial camera breathing and smoothing. Keep finer UI text separate from the world's art grid if necessary for readability.
3. Reduce background texture contrast around the combat floor. Build the hall from repeated architectural modules and a few controlled value groups. Keep the throne, doorway, pillars and floor perspective identical across age variants; change cracks, ivy, dust and fallen details in registered layers.
4. Give every sprite frame an explicit feet pivot. Validate idle, entrance, jump, attack, hit and death frames against the same floor line. Keep body scale stable between poses. Reflections originate at the feet plane, remain darker than bodies and do not hide contact shadows.
5. Give each anonymous challenger a distinct silhouette, weapon behaviour and timing as well as a colour. The unreadable name can remain mysterious while the moveset is learnable. Keep a shared material/palette discipline so different fur colours and accessories belong in one world.
6. Make the king's effects express rule: downward crown-shaped pressure for kneeling, an angular decree seal before a strike, a sweeping royal blade, a final crown/sun nova. Use visible anticipation, a directional active phase and a short decay. Visitor effects should use their own weapon geometry rather than recoloured king attacks.
7. Reserve highest contrast for incoming hazards, attack contact and actionable UI. Use brief blood/impact bursts, recoil and hitstop to confirm contact; avoid filling the entire screen throughout ordinary combat. Make guard shape follow facing. Reduce camera shake and flashes through settings without removing attack tells.

These are proposed constraints derived from this game's needs, not requirements quoted from the source guides.

## Proposed menu composition

Make the castle small and distant on the right side of a wide negative-space sky: a near-black silhouette, two or three readable towers, one restrained light, a pale moon and layered low-contrast terrain. Avoid an enormous detailed building, mirrored ornamental clutter and broad luminous fog. The title and vertical Play / Settings / Attributions list live on the quieter left side with stable spacing and a clear selected indicator. Use the same frame edges and accent colour as dialogue and settings.

Remove the castle scale tween. Start with a still composition. Any later atmospheric animation should use intentionally drawn pixel frames at a measured cadence; it must survive reduced-motion mode as a convincing still image. Buttons should respond to focus immediately, without sliding text or delayed float animations. Support arrow keys or Tab, Enter to activate, Escape to return, and pointer activation. Keep prompts in the same position on every screen. Avoid adding first-launch popups; settings are available from the main menu.

Retain 16:9 composition with letter/pillarboxing instead of stretching or cropping gameplay. Offer an integer-scale presentation when the available screen can hold it; retain a fit fallback for small windows. A 960 x 540 canvas at 1x can remain centred in a 1280 x 720 window rather than forcing 1.333x native pixel enlargement. If the world is rendered separately at 320 x 180, it can scale exactly 4x to 1280 x 720 while the UI remains independently readable. This latter approach is a larger rendering change, not a CSS-only fix.

Review menu, settings, portraits and battle HUD at 960 x 540, 1280 x 720, 1920 x 1080, 1366 x 768, 2560 x 1080, 800 x 600 and portrait 720 x 1280. Check actual canvas bounds, pointer mapping, readable text, visible feet, unchanged attack reach and no cropped menus. Capture stills at native scale as well as browser screenshots.

## Godot assessment

Phaser already is a game engine, and the current project already has scenes, sprite animation, input bindings and a deterministic TypeScript combat model. A new engine will not repair art pivots, incompatible pixel density or unclear effects by itself.

Godot is a credible future choice if editor-based animation authoring becomes the main production need. Its AnimationPlayer supports animation libraries, property tracks and custom transition blending, and is intended for more complex timing than simple tweens. [Godot AnimationPlayer](https://docs.godotengine.org/en/stable/classes/class_animationplayer.html)

A web-targeted Godot prototype would need WebAssembly and WebGL 2.0 support and the Compatibility renderer. The official documentation currently says Godot 4 C# projects cannot export to web; single-threaded export avoids the special cross-origin isolation requirements of threaded export. Those are hosting/runtime constraints to verify before any future migration. [Godot web export](https://docs.godotengine.org/en/stable/tutorials/export/exporting_for_web.html)

Recommendation: finish this polish in Phaser. A Godot migration would require porting or bridging the existing TypeScript simulation, tests, encounter logic, scenes, input and deployment, with new regression testing. If the user later chooses it, first build one isolated combat encounter as a comparison; do not replace the working project during this visual pass. This cost assessment is an inference from the local architecture, not an engine benchmark.
