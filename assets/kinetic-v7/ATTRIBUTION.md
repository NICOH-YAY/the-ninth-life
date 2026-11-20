AI-use disclosure: Higgsfield generated the new original sprites listed below. Codex exported sprite atlases, preserved generated physical poses, aligned feet and verified a hard native pixel grid.

# Kinetic v7 art provenance

All four generations used the user-authorized active free unlimited allowance with GPT Image 2.6 at 2k / medium. The initial four-item submission accepted only the transformed king; three explicit 429 rejections created no job and were retried sequentially. No paid fallback was used. Full prompts, reference IDs, output URLs and SHA256 hashes are in manifest.json.

| Original asset | Higgsfield job | Runtime export | Layout |
|---|---|---|---|
| Three different connecting sword cuts | 5d13baf1-9299-4c78-b3b7-dd27d0686226 | godot/art/king-combo-v7.png | 6x3,192x192,foot96/154 |
| Hollow Sovereign transformed cat | 8aa9715e-f7b6-47fd-a9cc-1b4929ed7ac3 | godot/art/hollow-sovereign-v7.png | 6x8,192x192,foot96/154 |
| Paired opening duel, clash, blastback and steel heart stab | dc573fd2-7477-407a-8f4f-5205925de6c4 | godot/art/opening-duel-v7.png | 6x2,320x256,foot160/240 |
| Physical six-pose crown/body transformation | 7c2b909b-bb8d-48c1-b90f-8a6524496947 | godot/art/transformation-v7.png | 6x1,192x192,foot96/154 |

The base king reference was original job 13cf3b8c-deb3-4980-be07-707400612d7c. The transformation additionally referenced the new Hollow Sovereign job. These are original game characters, not copied character-template sprites.

Existing visitor, waiting, previous-king, coronation, held-finisher and effect artwork retains its prior attribution in assets/godot-v6/manifest.json and earlier source manifests. Its 408 frames were exported to separate -v7.png siblings by crisp-existing.mjs. Originals were preserved.

All actors and effects use nearest sampling within individual cells, binary alpha and fixed two-source-pixel clusters. Palettes are restricted per animation/visitor row or generated pose. ActorView uses integer scale1 for the intended native body heights: roughly107 base and130 transformed. The transformed king is a different drawn silhouette with broken crown fragments, ragged indigo mantle, cyan chest fissure, larger blade and long tail, rather than a tint of the same body.

export-generated.mjs uses one fixed source scale per sheet, never per-frame zoom fitting. Main connected body pixels anchor feet; tiny disconnected border/next-row fragments are removed while detached crown pieces above the body remain. The physical opening blade enters the chest, exits the back, draws blood and is held by a visible mantle grip. It is not replaced with a light beam.

pixel-verification.json verifies84 generated poses: zero empty frames, zero clipped pixels, zero intermediate-alpha pixels and zero off-grid pixels. This is component evidence, not a full fight playthrough. contact-sheet.png previews the actual runtime exports. Runtime helpers are documented in manifest.json.
