> AI-use disclosure: Drafted with Claude (Anthropic) from Nicoh's concept and decisions in a planning conversation. Nicoh reviews, edits, and owns every item marked [Decided].

# The Ninth Life: Game Design Document

**Version:** Initial (G1), November 15, 2026. Updated Nov 19 to match the newer design docs (rows marked [Proposed] below are for Nicoh to confirm).
**Owner:** Nicoh Koehly (GitHub `nicoh-yay`), Executive Producer and Creative Director
**Labels:** **[Decided]** Nicoh's decision. **[Proposed]** agent recommendation awaiting Nicoh. **[Open]** unresolved.
**Companion documents:** `CONFIG.md` (Configuration Document), `PLAN.md` (Project Plan and Risk Profile), `docs/design-history.md` (how the concept developed)

## King-kit rollback [Implementation of Nicoh's request]

The current kit is restored from96261d0 after Nicoh rejected the v11 replacement as clunky. See docs/king-kit-revert.md. Pressure and its four new body-magic actions are inactive; classic sword combos, thrust, Kneel/Procession and floating-form area attacks return. Individual visitor gaits, synchronized entrances, personal dialogue without oath bargains and the other v11 fixes remain.

## Sovereign magic and individual locomotion [Proposed implementation of Nicoh's revision]

The newest contract is docs/sovereign-magic.md. It removes the optional half-guard/oath branches entirely and restores personal branching dialogue without stat choices. The king's live kit is fully replaced by Crownless Hand, Borrowed Hour, Royal Burden and King's Ransom, evolving into Hollow Orbit, Vacant Step, Unmoored and Empty Throne. A single finite Pressure reserve makes missed echoes, fixed fields and exposed releases consequential. No enemy requires one correct magic key; normal defensive reads, body pressure, flanking, delayed echoes and spatial manipulation remain alternatives. Separately authored personality gaits and synchronized stair/ground entrance travel replace uniform walking and pose handoff glitches.

## November20 native fantasy revision [Proposed implementation of Nicoh's request]

The active engine is Godot4.7.2 with native web export. The latest contract is docs/reign-and-exchange.md, superseding conflicting historical sections below. All nine anonymous visitors are the immortal's former lives, carrying losses under tyranny and distinct innate powers, sacrifices, entrances and ultimates. The opening and years of neglect show the player repeating the old king's rule. Combat uses bodily anticipation, committed contact/recovery, twelve-frame gaits, poise, perfect parries and next-hit guard breaks at exhausted stamina. The second form truly floats. One optional per-fight oath exchanges half maximum guard for15% attack power. Three earned endings and the held heart impalement/memory release/nova/ruined hall remain.

## Latest combat revision [Proposed implementation of Nicoh's new request]

The current implementation contract is docs/mobile-combat.md. It replaces the older immobile player, one-hit kitten, forced patchwork loss and popup intermissions. The player can move, jump, dash and guard; enemies grow gradually and have animated abilities and knockback. The first kitten is a playable movement/defense tutorial. The three endings are Normal, Do Nothing and an earned Victory for defeating all nine lives. The opening actually stages the prior king's defeat before explaining the castle-bound curse. Unskippable portrait dialogue, years of rest, castle decay, reflections and a castle-exterior menu establish the scene. Older sections below are historical where they conflict.

## 0. Nov 19 update [Proposed]

### Later Nov 19 presentation revision [Proposed implementation of Nicoh's request]

The latest user direction supersedes the original painterly-character art and popup life cards. The game now uses upright humanoid cat sprites, distinct fur patterns and accessories, a spacious moonlit pixel throne room, animated attack poses, colourful hit effects and an Ascended transformation. The view keeps the whole hall visible and characters smaller relative to its architecture. Combat numbers are unchanged.

The Play / Attributions menu opens a skippable fifteen-second inheritance flashback: the prior Immortal laughs that the throne has trapped the player, the player dismisses it, then a thousand-year jump and a kitten's one-hit defeat. Interactive combat starts with the next life. Dialogue is provisional text for Nicoh's final wording. The new backstory is the latest requested opening; older self-imprisonment explanations remain historical rather than additional exposition.

Arrival dialogue and short answer choices stay in the room. Life cards, stat summaries and planner diagnostics are absent from normal play; debug tools remain available explicitly through `?debug=1`. Detailed implementation and remaining limits are in `docs/pixel-pass-notes.md`.

The story bible, `docs/phase-two.md`, `docs/challenger-progression.md`, and `docs/art-direction.md` replace parts of this document where they differ. The first playable prototype (`docs/prototype-notes.md`) follows them. In short:

- **A story game.** One small cat comes back over nine lives. The fights turn into a bond with the lonely Immortal. Story moves in three tiers through light, music, props, dialogue, and challenger hesitation. Full detail in `docs/story-bible.md`.
- **Nine lives, not 6 to 8 fights.** Life 1 is the kitten, lives 2 to 7 are chosen by the agent from alley, sailor, acrobat, witch, knight, and thief, life 8 is the quiet one who does not fight, and life 9 is the patchwork cat, who always wins.
- **New base move set and Phase Two.** The Immortal fights with a glaive. At 50% HP it spends one of its own lives: refill, faster, and a magic move set on the same keys with the same counters. See Section 7 and `docs/phase-two.md`.
- **Any challenger from life 2 on can kill the Immortal**, which ends the run early with the "too soon" ending.
- **Progression curves.** Each life is stronger than the last. The agent plans on a gentle curve, the scripted fallback on a steeper capped one. A pacing director nudges stats between fights. See Section 14 and `docs/challenger-progression.md`.
- **Between fights** the Immortal picks a guarded or open answer, which sets bond (0 to 8). Bond changes hesitation, tone, the life 8 talk, and the ending lines. It never changes difficulty.

---

## 1. The X

The Ninth Life is a short boss-fight game in which you play an overpowered cat on its final life, holding off its own past lives as an AI challenger learns from every death until it finally wins.

## 2. Player and motivation

**Player.** Adults who enjoy short, story-driven action games finished in one sitting (about 20 to 30 minutes). Classmates and showcase visitors are the first audience.

**Intended motivations.** Mastery at first (crushing the challenger), turning into curiosity (what did it learn this time?), and finally acceptance (the ending you can't prevent).

**Observable hypothesis.** If the design works, a playtester will (a) change their attack habits partway through the game, (b) say out loud or afterward what a challenger "learned," and (c) stop trying to win before the final fight.

## 3. Pillars

1. **Overpowered, then outgrown.** The boss never changes. The challengers do.
2. **You can see what it learned.** Every challenger's outfit shows its new skill before the fight starts.
3. **Every death teaches.** A challenger's death is information for the next one.
4. **Letting go is the ending.** The game ends when the boss is finally allowed to rest.

## 4. Genre, platform, length

| Item | Value | Status |
|---|---|---|
| Genre | Single-arena boss fight, played as the boss | Decided |
| View | Fixed-screen 2D side view, one arena | Proposed |
| Engine | TypeScript in the browser (Phaser or plain Canvas) with Vite and Vitest, matching the Tremor midterm's test, typecheck, and build setup | Proposed |
| Platform | Desktop browser, keyboard | Proposed |
| Hosting | Static build on GitHub Pages or Cloudflare Pages. Model calls go through a Cloudflare Worker that holds the key | Proposed |
| Length | About 20 to 30 minutes for a full playthrough | Proposed |

## 5. Story [Decided: premise / Proposed: details]

A cat reached its ninth and final life and refused to die. To keep living, it locked its eight past lives inside itself. It grew huge and immortal, and it sits on a throne at the top of a moonlit tower.

The past lives escape one at a time and climb the tower to end it. They come to let it rest, not for revenge. Each time one dies, it returns to the others carrying what it learned, and the next one arrives wearing that lesson.

The first challenger is a kitten that the boss kills in one hit. The last is every past life together, a patchwork cat wearing all their outfits. When it lands the final blow, the boss lets go. The closing scene shows nine cats together, quiet.

**[Open]** Dialogue tone between rounds, and whether the boss speaks.

## 6. Core loop

1. **Act.** As the boss, attack the challenger with your fixed move set.
2. **Respond.** The challenger dodges, blocks, and strikes using its learned skill and its tactics plan.
3. **Interpret.** When a challenger dies, the next one walks in wearing a new outfit and says one line. You read what it learned and how it plans to fight.
4. **Next action.** You adjust your attack habits for the next fight.

One fight lasts about 1 to 3 minutes. A full game is 6 to 8 fights.

## 7. The boss (the player) [Decided: overpowered, fixed move set / Proposed: moves]

The move set is fixed within each phase. **[Proposed, from docs/phase-two.md]** The Paw Slam, Hairball, and Tail Sweep set below was replaced on Nov 19 by a glaive set plus an Ascended set for Phase Two. Each Ascended move keeps its base move's key, id, and counter.

| Key | Base form (glaive) | Tell | Ascended form (magic) | Tell | Countered by |
|---|---|---|---|---|---|
| J | Crescent Cleave, wide close slash | glaive raised, 0.45 s | Pounce Rift, crashes down on the challenger's spot | violet ring on the floor, 0.6 s | alley dodge-roll |
| K | Glaive Throw, spins out and back | spin wind-up, 0.5 s | Soul Wisps, five slow homing wisps | glowing orb, 0.5 s | sailor umbrella |
| L | Low Reap, sweep along the whole floor | crouch, 0.4 s | Shadow Tide, two floor waves | ground ripples, 0.45 s | acrobat double jump |
| Space | Nine-Lives Nova, fullscreen, every 20 s | eyes glow, room darkens | Ninth Bell, pillars then nova, every 16 s | bell, pillar outlines | witch blink |

Phase Two starts the first time HP drops to 50%: a 2 s transition, a refill (prototype uses 75%, tuning note in `docs/phase-two.md`), shorter cooldowns and tells, faster shifting, more damage. The boss can shift left and right on the throne platform (A and D) in both forms.

Superseded G1 move set, kept for the record: Paw Slam (J), Hairball Volley (K), Tail Sweep (L), Nine-Lives Nova (Space).

## 8. The challengers (the agent's choices) [Decided: outfits show learned skills / Proposed: roster]

| Life | Outfit and weapon | Learned skill | Counters | Scope |
|---|---|---|---|---|
| 1 Kitten | none, a twig | none | nothing | Committed |
| Alley cat | red bandana, dagger | dodge-roll with brief invulnerability | Crescent Cleave / Pounce Rift | Committed |
| Sailor cat | yellow raincoat, umbrella | umbrella block | Glaive Throw / Soul Wisps | Committed |
| Acrobat cat | cape and bell, short staff | double jump | Low Reap / Shadow Tide | Committed |
| Witch's cat | pointed hat, wand | short blink | Nova / Ninth Bell | Committed |
| Knight cat | tin armor, sword | armor absorbs a hit, regrows after 6 s [Proposed] | any | Stretch, built in the prototype |
| Thief cat | mask and hood, two knives | decoy that absorbs a hit | any | Stretch, built in the prototype |
| 8 The quiet one [Proposed] | a scarf, no weapon | never attacks, talks | none | Committed (story bible) |
| 9 Patchwork cat | pieces of every outfit, mended sword | all skills | everything | Committed |

The kitten always comes first, the quiet one is always eighth, and the patchwork cat is always last. **The agent chooses the order of lives 2 to 7.** In the prototype every life except the kitten and the quiet one also has a basic hop that clears the base Reap and Throw when timed well. It gets more reliable each fight and does nothing against Ascended moves. [Proposed]

## 9. The in-game agent: the challengers' collective mind (summary)

Full specification is in `CONFIG.md`.

**When it acts.** Between fights, while the last challenger is "dead." It makes one model call per life, about 6 to 8 per playthrough, so latency never touches combat.

**What it sees.** A summary of the last fight: which attacks the player used and how often, what killed the challenger, timing habits (for example "opens with Paw Slam," "saves Nova for low health"), plus a history of earlier lives.

**What it decides.**
1. Which remaining life goes next (the outfit and the counter it brings).
2. A tactics plan from bounded values: aggression, preferred distance, which attack to bait, dodge priority for each boss attack.
3. One short line the challenger says on arrival.

**How it is used.** The game validates the plan. A deterministic controller then fights in real time from it. If the call fails or times out, the game uses the scripted order and default tactics.

**Agent hypothesis.** When the agent picks the life that counters *this* player's main killing attack and tunes tactics to their habits, players will feel the challengers learned from them and will change how they fight.

**Scripted baseline.** A fixed order (alley, sailor, acrobat, witch) with default tactics.

**What the player loses with the baseline.** The same order and the same behavior for everyone, whatever they do. A player who only uses Tail Sweep meets the acrobat third in the scripted game. The agent sends it right away, and the player feels read.

**Memory comparison.** The agent with history of all past lives versus the agent with only the last fight. The course asks for an evaluated memory strategy, and this is it.

**Playtest question.** Can players name what a challenger learned and why it was sent, and does that differ between the agent and the scripted order?

**Honest limit.** The final win is authored. The patchwork cat is built to win. The agent decides *how* the player is beaten, never *whether*.

## 10. Dynamics and aesthetics (MDA)

| Mechanic | Expected dynamic | Intended aesthetic |
|---|---|---|
| Overpowered fixed move set | Player settles into favorite attacks | Power, then comfort |
| Agent picks the counter to those attacks | Player notices and changes habits | Challenge, being seen |
| Outfit shows the learned skill | Player reads the challenger before the fight | Discovery |
| Guaranteed final loss | Player stops fighting it | Narrative, acceptance |

## 11. Win, loss, and progress

- The player "wins" each fight by killing the challenger. The story progresses either way.
- **[Proposed, from challenger-progression]** Any challenger from life 2 to 7 that takes the Immortal to 0 HP ends the run early with the "too soon" ending.
- Life 8 never attacks. If the player kills it, life 9 still comes, bond drops to 0, and the life 9 lines change.
- Life 9 always wins. Below 25% HP in Phase Two a prompt appears: hold S to lower your guard. Holding ends the fight with a last blow and the Immortal walks out with the patchwork cat. Fighting on ends with the Immortal kneeling and not getting up.
- **[Proposed]** Rule if the player "beats" the patchwork cat: it cannot drop below 1 HP, and its damage climbs after 45 s, so it always wins within about 3 minutes.
- No score and no "game over" text. Progress shows as the challenger lineup, the light moving toward dawn, and the boss's growing stillness.

## 12. Controls and feedback

| Input | Action |
|---|---|
| A and D | Shift on the throne platform |
| J, K, L | Crescent Cleave, Glaive Throw, Low Reap (Pounce Rift, Soul Wisps, Shadow Tide in Phase Two) |
| Space | Nine-Lives Nova (Ninth Bell in Phase Two), when charged |
| S (hold) | Life 9 only, below 25% HP: lower your guard [Proposed] |
| A/D and Enter | Pick the Immortal's answer between fights |
| M | Mute |

Feedback includes clear wind-ups on every attack, hit flashes, a short intro card for each challenger showing its outfit and line, and a brief replay of the killing blow after each death.

## 13. Edge cases

- Player spams one attack. The agent should counter it, which is the point.
- Player idles. Challengers still approach. A fight cannot stall forever.
- Model call fails, times out, or returns an invalid life or out-of-range tactics. The scripted choice is used and logged.
- The agent tries to choose a life already used. It is rejected and the next scripted life is used.
- Challenger line fails the content filter. A stock line for that outfit is used.

## 14. Balance

Targets: the kitten dies in one hit, middle lives last 1 to 2 minutes, and the patchwork cat wins within about 3 minutes. Tuning levers are challenger health, skill cooldowns, and boss cooldowns. **[Open]** First data at the G2 playtest.

**[Proposed, from challenger-progression]** Each fight index has a pacing target for the lowest boss HP reached (90%, 75%, 60%, 50% with the first Phase Two at fight 4, then deep into Phase Two). Two curves: the agent plans on a roughly linear curve, the scripted fallback on a 1.25x per fight curve capped at 3x. A deterministic director raises or lowers the next fight by 5% (caps +20% and -15%) when a challenger misses its target by more than 10 points. All numbers live in `src/core/config.ts`. Headless numbers from `npm run sim` are in `docs/prototype-notes.md`.

## 15. Art and audio direction [Decided: not pixel art; lighting like Scaredy Cats / Proposed: details]

- **Reference:** Nicoh likes the look and lighting of *Scaredy Cats* (kimbo). **[Open]** Collect 3 to 5 reference screenshots into a mood board and confirm what to take from them (lighting, palette, shapes).
- One arena, the moonlit throne room at the top of the tower. Strong light sources such as moonlight through a window and candles, deep shadows, warm against cool.
- The boss is a large, soft, dark silhouette with glowing eyes. Challengers are small, so the size difference reads at a glance.
- **Outfits are layers on one base cat rig**, so each new challenger is mostly a new accessory. Every outfit needs a distinct silhouette.
- Audio: a low, slow theme for the boss, with a lighter motif that grows as more lives return.
- Sources: original art, AI-assisted art, and CC0 assets, each listed in `ATTRIBUTION.md`.

## 16. Scope

**Committed for Gold (Dec 5):** one arena, the boss with four moves, kitten, alley, sailor, acrobat, witch, patchwork, the agent with validation and scripted fallback, intro cards, ending scene.

**Stretch:** Knight cat, Thief cat, voiced lines.

**Excluded:** multiple arenas, playing as the challenger, multiplayer, procedural challengers, mobile.

**Cut first:** Thief, then Knight, then the kill replay.
**Cut rule [Proposed]:** if the committed roster is not feature-complete at Alpha (Dec 2), stretch lives are cut.

## 17. References and attribution

| Reference | What is borrowed | What changes | Terms |
|---|---|---|---|
| *The Dark Queen of Mortholme* (Mosu, 2024) | The core structure: you play the boss in one throne room, the first hero is crushed easily, and the hero keeps returning a little stronger and more skilled, with a short exchange between fights | Its hero's growth is authored. Here the challenger is an agent that chooses which past life to send and how to fight based on the player's own attack habits, and every challenger is one of the boss's past lives with a visible outfit for what it learned | Inspiration only, no code or assets |
| *Scaredy Cats* (kimbo, in development) | Mood of its lighting: strong light sources against deep shadow, used for the throne room | Different genre and mechanics (it is a push-your-luck dungeon crawler) | Inspiration only, no assets |
| Nine lives (folklore) | Premise | Past lives as challengers | Public domain idea |
| Engine (Phaser or plain Canvas) and any asset packs | Rendering and input | — | Phaser is MIT licensed. Every asset and its license is recorded in `ATTRIBUTION.md` before use |

## 18. Concepts considered before this one

1. **Any Given Morning.** A dream game about a man's lost lives, with an anxiety "Shadow" agent. Rejected because the agent was not core to play (rules could do most of its job), and nine minigames were too much scope for one person.
2. **Nine Lives dungeon.** A push-your-luck dungeon crawl with a ghost companion that scouts ahead. Rejected in favor of this design, which keeps the nine-lives idea with a smaller scope and a more visible agent.
3. **Two-minute death sandbox.** Rejected because it had no repeatable loop and no job for an agent.

## 19. Decision log

| Decision | Made by | Date |
|---|---|---|
| Switch from Any Given Morning to a new, agent-first game | Nicoh | Nov 15 |
| Play as the boss cat. Past lives are the challengers. The AI eventually wins | Nicoh | Nov 15 |
| Boss is overpowered with a fixed move set | Nicoh | Nov 15 |
| Each challenger wears a different outfit showing a learned skill | Nicoh | Nov 15 |
| Story of why the cat became the boss is required | Nicoh | Nov 15 |
| Art direction like Scaredy Cats, not pixel art | Nicoh | Nov 15 |
| Story details, agent choosing the challenger order, roster, move set, title "The Ninth Life" | Proposed by Claude, accepted by Nicoh | Nov 15 |
| Story game with a bond, tiers, hesitation, life 8 and life 9, three endings (story bible) | Nicoh in a planning chat, recorded here [Proposed] for confirmation | Nov 19 |
| Phase Two at 50% with a new magic move set; glaive base set (moves proposed by Claude) | Nicoh (concept), moves [Proposed] | Nov 19 |
| Any challenger from life 2 can kill the boss | Nicoh, recorded here [Proposed] | Nov 19 |
| Two progression curves (agent gentle, scripted steeper and capped) plus an evaluation ablation | Compromise in docs, [Proposed] | Nov 19 |
| Engine: Phaser 3 with the Canvas renderer | Claude Code, [Proposed] | Nov 19 |
| Native Godot web export; sacrificed innate mini-boss powers, distinct entrances, floating king and weighted combat with optional oath | Nicoh requested direction; implementation documented [Proposed] | Nov20 |

## 20. Open questions

1. Engine choice: Phaser or plain Canvas. The prototype uses Phaser 3 with the Canvas renderer [Proposed].
2. Final art references and the mood board.
3. The rule if the player beats the patchwork cat.
4. Whether challengers speak in text only or with generated voice.
5. Measured latency and cost per agent call (by Nov 23).
6. Rename the repo to match the new title.
