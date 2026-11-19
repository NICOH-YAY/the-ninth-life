AI-use disclosure: drafted with Claude from Nicoh's mood board. Concept images were generated with Higgsfield (model z_image). Every generated asset and its prompt is logged in `assets/concept/manifest.json`.

# Art Direction

## Mood board and what each reference contributes

The mood board images are references for mood only. Never copy their characters, compositions, or ask a generator for any of them by name.

- **A cozy roguelike with cats in accessories (3D, dark castle).** Small round cats wearing bright accessories and holding blades like fencers. Takeaway: the challengers' proportions, readable accessory colors against dark fur, the way they hold weapons.
- **A dark painterly 2D action game in a glowing green forest.** Black foreground framing, glowing particles, strong light shafts. Takeaway: how hits and magic should flash, and foreground framing.
- **A giant bioluminescent creature looming over a tiny hero.** Scale contrast and light coming from the monster itself. Takeaway: the Ascended form's glow, and the size gap between the Immortal and the challenger.
- **A bright painterly landscape with a small character and a calm sky.** Painterly backgrounds with simple flat-shaded characters. Takeaway: the ending's dawn palette, and the general rule that backgrounds are painterly while characters stay flat and simple.

The Creative Bloq article on indie art direction makes the same point the board does. Planet of Lana contrasts painterly backgrounds with simple, flat-shaded characters inside a black foreground frame, and Ori gives each area its own palette and shape language. This game applies that per story tier instead of per area.

## Rules

1. Painterly backgrounds, flat-shaded characters with a soft rim light. Characters must read as silhouettes against the background at a glance.
2. Scale. The Immortal stands about twice the challenger's height in base form and floats higher in the Ascended form.
3. Palette by tier. Tier 1 is teal, indigo, and violet under cold moonlight. Tier 2 adds small warm accents. Tier 3 brings in dawn gold through the windows. The ending is full golden dawn. The palette change is the main visual signal of the story moving.
4. Accessory color is identity. Each life has one saturated accessory color: red bandana, yellow raincoat, striped leotard, purple hat, tin grey, black mask. The patchwork cat wears all of them.
5. Every attack has a distinct tell that reads with the sound off. Base tells are physical (glaive raised, crouch). Ascended tells are light (rings, ripples, pillar outlines).
6. Glow is reserved for magic and for the Immortal's eyes. Challengers never glow, so the Ascended form stands out.
7. Black foreground framing (vines, pillars) on the left and right edges of the throne room.

## Animation approach

Image generators can't keep a character consistent across animation frames, so the game uses cut-out animation. Each character is one clean image split into a few parts (body, head, tail, weapon arm). Parts are animated with tweens: squash and stretch on wind-ups, rotation for swings, bobbing for idle. This keeps every frame on-model and makes new outfits cheap, since an outfit is a different image on the same rig.

Prototype rule: until parts are cut, each character is a single sprite animated as a whole (scale, rotation, offset tweens), with the weapon drawn as a separate procedural shape so swings can rotate.

## Asset list

| Asset | Status |
|---|---|
| Immortal, base form, with glaive | concept generated |
| Immortal, Ascended form | concept generated |
| Challenger lineup (kitten, alley, sailor, acrobat, witch, knight) | concept generated |
| Patchwork cat | concept generated |
| Thief cat, quiet-one cat | to generate |
| Throne room at night | generated |
| Throne room at dawn | to generate |
| Title key art | to generate |
| UI (health bars, dialogue box, choice buttons) | built in code |
| Music (three tier layers plus ending) | placeholder in code, to produce |
| Voices (authored beats) | to record or generate later |

## Generation log format

`assets/concept/manifest.json` holds one entry per image with the file name, model, prompt, Higgsfield job id, and date. The course requires AI-use disclosure on every artifact, and this log is the evidence.

## Pixel revision, November 19, 2026

AI-use disclosure: this revision was recorded by Codex from Nicoh's latest request.

**[Decided by Nicoh's latest request]** Pixel art replaces the earlier painterly background and 3D-derived character direction. The rules above remain historical context where they conflict with this revision. Use one coherent pixel scale for characters, floor, architecture, and effects; nearest-neighbor scaling; crisp clusters; and a restrained shared palette. The scene should feel like one game rather than sprites pasted onto a different background.

Cats stay recognizable as base cats wearing accessories. Fur colors may vary between past lives. Only one challenger needs to resemble the supplied black-cat reference. Preserve readable accessory identities: red bandana, yellow raincoat and umbrella, striped acrobat suit and bell, violet witch hat, tin armor, dark thief mask, quiet scarf, and the final patchwork of earlier accessories. Keep the Immortal's crown, cloak, and glaive readable at gameplay size.

Prioritize animation and presentation over move statistics. Each move needs an anticipatory pose, a fast readable action, a brief impact accent, and a settling recovery. Head, paws, tail, cloak or scarf, and weapon should support the action rather than only rotating an entire standing portrait. Keep silhouettes clear through the brightest effects. Idle breathing and tail motion should connect naturally to attacks and back into rest.

Use the supplied images for mood only: ruined architecture, framing, a scale contrast between cats, teal moonlight, violet magic, and a dawn resolution. Do not reproduce their characters, compositions, marks, or named art styles. Background details should frame the combat lane and keep the arena floor readable.

Higgsfield is the requested generator for final pixel images. Production prompts, palette, frame geometry, negative constraints, and planned provenance are in `assets/pixel/higgsfield-prompts.json`. Generated revision sources now include the night arena, nine-cat accessory roster, Immortal base and ascended animation sheets, all nine challenger action rows, and the animated opening scene. Actual prompts, job IDs and output URLs are recorded in `assets/pixel/generation-log.json`; broader asset specifications remain pending until the matching output is verified. Code-authored pixel art is provisional and must be attributed separately from Higgsfield output. Existing concept originals must remain intact.

The generated opening GIF delivered 16 frames, despite a request for 48. `scripts/prepare-prologue.mjs` extracts the observed frames into a browser atlas and records source timing and intended 15 second playback. Do not describe it as 48 delivered frames. Generated sheets also need inspection for accessory continuity; the witch action row has stray armor in its first and last poses, so those poses should use the clean roster reference or other frames.

### Follow-up sprite revision

**[Decided by Nicoh's follow-up request]** Cats are upright bipedal characters with two short legs and two paw arms. Keep expressive cat faces, ears, tails and round bodies, while outfits and weapons read clearly. Distinct fur varieties matter: cream kitten; orange tabby alley; tuxedo sailor; calico acrobat; charcoal witch; brown tabby knight; silver spotted thief; white fluffy quiet cat; black-white calico patchwork. Richer native sprites around 48x64 pixels are acceptable. Use actual square pixel clusters and a restrained palette with sharp nearest-neighbor scaling rather than detailed painted cats.

The `*-pixel-v2.png` sources implement the revised direction; the older illustrated and quadruped sheets remain archived reference, not the current character target. `immortal-transformation.png` supplies twelve authored-by-generation poses from glaive drop to ascended magic. `prologue-v2.gif` supplies sixteen full scene poses and is the current opening atlas source. Generated output is still subject to inspection: the revised alley attack row has a twig in one active pose, and the opening film changes the small protagonist's fur to black during the curse.
