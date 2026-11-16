> AI-use disclosure: Drafted with Claude (Anthropic) from Nicoh's concept and decisions in a planning conversation. Nicoh reviews, edits, and owns every item marked [Decided].

# The Ninth Life: Game Design Document

**Version:** Initial (G1), November 15, 2026
**Owner:** Nicoh Koehly (GitHub `nicoh-yay`), Executive Producer and Creative Director
**Labels:** **[Decided]** Nicoh's decision. **[Proposed]** agent recommendation awaiting Nicoh. **[Open]** unresolved.
**Companion documents:** `CONFIG.md` (Configuration Document), `PLAN.md` (Project Plan and Risk Profile), `docs/design-history.md` (how the concept developed)

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

The boss never gains or loses moves. Four attacks with cooldowns:

| Move | Key | Effect | Tell |
|---|---|---|---|
| Paw Slam | J | Shockwave across the whole floor | Paw lifts for 0.5 s |
| Hairball Volley | K | Three arcing projectiles | Cheeks puff |
| Tail Sweep | L | Fast low sweep across the floor | Tail coils |
| Nine-Lives Nova | Space | Fullscreen blast, about every 20 s | Eyes glow, screen darkens |

The boss can shift left and right on the throne platform (A and D). The boss has a health bar, but early challengers can barely scratch it.

## 8. The challengers (the agent's choices) [Decided: outfits show learned skills / Proposed: roster]

| Life | Outfit | Learned skill | Counters | Scope |
|---|---|---|---|---|
| Kitten | none | none | nothing | Committed |
| Alley cat | bandana | dodge-roll with brief invulnerability | Paw Slam | Committed |
| Sailor cat | raincoat | umbrella block | Hairball Volley | Committed |
| Acrobat cat | leotard and bell | double jump | Tail Sweep | Committed |
| Witch's cat | pointed hat | short blink | Nine-Lives Nova | Committed |
| Knight cat | armor | survives one hit | any | Stretch |
| Thief cat | mask | decoy clone | any | Stretch |
| Patchwork cat (final) | every outfit | all skills | everything | Committed |

The kitten always comes first and the patchwork cat always comes last. **The agent chooses the order of everything between them.**

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
- The game ends when the patchwork cat defeats the boss.
- If the player beats the patchwork cat, the fight continues until it wins, with authored escalation as needed. **[Open]** exact rule.
- No score. Progress shows as the challenger lineup and the boss's growing stillness.

## 12. Controls and feedback

| Input | Action |
|---|---|
| A and D | Shift on the throne platform |
| J, K, L | Paw Slam, Hairball Volley, Tail Sweep |
| Space | Nine-Lives Nova (when charged) |

Feedback includes clear wind-ups on every attack, hit flashes, a short intro card for each challenger showing its outfit and line, and a brief replay of the killing blow after each death.

## 13. Edge cases

- Player spams one attack. The agent should counter it, which is the point.
- Player idles. Challengers still approach. A fight cannot stall forever.
- Model call fails, times out, or returns an invalid life or out-of-range tactics. The scripted choice is used and logged.
- The agent tries to choose a life already used. It is rejected and the next scripted life is used.
- Challenger line fails the content filter. A stock line for that outfit is used.

## 14. Balance

Targets: the kitten dies in one hit, middle lives last 1 to 2 minutes, and the patchwork cat wins within about 3 minutes. Tuning levers are challenger health, skill cooldowns, and boss cooldowns. **[Open]** First data at the G2 playtest.

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
| *The Dark Queen of Mortholme* (Mosu, 2024) | Playing as the final boss while a hero returns stronger each time | The challenger is an AI that learns from how you play and chooses its own counters. The hero is your own past lives | Inspiration only |
| *Scaredy Cats* (kimbo, in development) | Art and lighting direction | Different genre and mechanics | Inspiration only, no assets |
| Nine lives (folklore) | Premise | Past lives as challengers | Public domain idea |
| Engine and asset packs | To be confirmed | — | Recorded in `ATTRIBUTION.md` |

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
| Story details, agent choosing the challenger order, roster, move set, title "The Ninth Life" | Claude (proposed), awaiting Nicoh | Nov 15 |

## 20. Open questions

1. Engine choice: Phaser or plain Canvas.
2. Final art references and the mood board.
3. The rule if the player beats the patchwork cat.
4. Whether challengers speak in text only or with generated voice.
5. Measured latency and cost per agent call (by Nov 23).
6. Rename the repo to match the new title.
