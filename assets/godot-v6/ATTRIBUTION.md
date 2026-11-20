AI-use disclosure: Higgsfield generated the new paired-actor and waiting sheets; Codex prepared the Godot sprite resources and authored ActorView.

## Godot sprite migration and restored arena
| Asset | Source | Processing |
|---|---|---|
| godot/art/king.png | Prior Higgsfield king design, job13cf3b8c-deb3-4980-be07-707400612d7c | Same crowned sword-bearing cat in both stances; no monster atlas is shipped |
| godot/art/visitors-*.png | Existing attributed royal-v4/gothic-v5 visitor sheets | Copy preserves the complete foot-anchor repair and source pixel scale |
| godot/art/arena-night.png, arena-mid.png, arena-late.png, arena-ruins.png | Earlier Higgsfield royal-v4 gothic hall and matching ruined interior; original provenance remains in assets/royal-v4/manifest.json | Native320x180/48-color-cap nearest export, exact3x display, same arena composition |
| godot/art/menu.png | Ansimuz CC0 source layers and Codex earlier composition | Existing native480x270 distant-castle menu copied |
| godot/art/held-impalement.png | Higgsfield GPT Image2.6, job0e069eca-93f4-4bbb-96a0-10524803ad05 | Twelve paired grapple/thrust/held/wounded/charge frames,320x256,feet160/240,hardalpha32-color export |
| godot/art/waiting.png | Higgsfield GPT Image2.6, job989d9c3d-0b5d-452c-9c0f-8452c613bd34 | Six sad slumped seated poses and six weary rises,192x192,feet96/154,uniform128px source mapping |
| godot/art/skill-*.png and skill-icons.png | Derived from this game's Higgsfield-authored king sword/effect sheets | Four32px HUD icons, nearest pixel crops; no Raven files copied |
| godot/art/effects.png, royal-effects.png, visitor-effects.png, blood.png, coronation.png, previous.png | Existing attributed Higgsfield original game artwork | Unchanged runtime sheets reused by native Godot AtlasTexture sprites |

New generations used the user-authorized free unlimited allowance; originals and result URLs are retained in manifest.json. Pixel export helpers and frame geometry records are in this folder.

Reference-only resources: Quaternius Universal Animation Library2 (public combo/weight previews; no3D rigs used), Clockwork Raven Fantasy Icons (public weapon/skill previews; no free/premium pack files bundled), and Deep-Fold Pixel Planet Generator (public pixel-lighting reference; no generator code bundled). Links and exact usage notes are in manifest.json.
