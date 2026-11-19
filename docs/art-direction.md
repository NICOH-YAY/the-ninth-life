# Art Direction

AI-use disclosure: drafted with Claude from Nicoh's mood board. Concept images were generated with Higgsfield (model z_image). Every generated asset and its prompt is logged in `assets/concept/manifest.json`.

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
