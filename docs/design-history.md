> AI-use disclosure: Drafted with Claude (Anthropic) and reviewed by Nicoh.

# The Ninth Life: Design History

This file records how the concept developed and why, so the design reasoning is inspectable. `GDD.md` is the current spec. If the two disagree, `GDD.md` wins.

## 1. Concepts considered

| Concept | Summary | Why it was not chosen |
|---|---|---|
| Two-minute sandbox | Open exploration with a fixed time limit | No repeatable loop, no clear job for an agent |
| Any Given Morning | A narrative game across a series of dream levels, with an anxiety character as the agent | The agent was not core to play, since rules could do most of its job. Nine separate minigames were too much scope for one person |
| Nine Lives dungeon | A push-your-luck dungeon crawl with a ghost companion that scouts ahead | A larger build, with a less visible agent |
| **The Ninth Life** | Play as an overpowered boss cat while your past lives return as challengers, chosen by an agent that learns from how you fight | **Chosen.** The agent is the core mechanic, its decisions are visible, and the scope is one arena |

## 2. Why The Ninth Life

- **The agent is central.** Remove it and the challengers stop responding to the player, which is the whole experience.
- **Its decisions are visible.** Each challenger's outfit shows what it learned, so players can see the agent's choice before a fight starts.
- **Latency is not a problem.** The model runs once between fights, never during combat, so a deterministic controller handles real-time play.
- **The scope is small.** One arena, one boss, a short roster built from outfit layers on one base character.
- **The theme carries over.** The nine-lives premise gives a reason for the challengers to return and an ending about letting go.

## 3. Settled decisions (Nicoh)

- Switch to an agent-first game.
- The player is the boss. The challengers are the cat's past lives, and the AI eventually wins.
- The boss is overpowered, with a fixed move set that never changes.
- Each challenger wears a different outfit that shows a learned skill.
- The game needs a story for why the cat became the boss.
- Art and lighting direction similar to *Scaredy Cats*, not pixel art.
- The base game must also run in a scripted mode with no API calls. The agent mode is the deployed in-game agent required by the course.

## 4. Agent recommendations (see `GDD.md` Section 19 for status)

- The agent chooses the order of challengers between the kitten and the patchwork finale.
- Story details: the cat locked its past lives inside itself, and they return to let it rest.
- The starting roster and the boss's four moves.
- Model calls only between fights, with a 5 s timeout and a scripted fallback.
- The final win is authored. The agent decides how the boss is beaten, never whether.

## 5. References

- *The Dark Queen of Mortholme* (Mosu, 2024): playing as the boss while a hero returns stronger. This project changes the hero into a learning agent drawn from the player's own past lives.
- *Scaredy Cats* (kimbo): art and lighting reference only.

## 6. Open critiques to keep in view

1. **Closeness to Mortholme.** Credit it clearly. The learning agent and the past-lives roster are what make this project distinct.
2. **Visible learning.** If players can't tell why a challenger was sent, the agent adds nothing they can feel. Intro cards and arrival lines must make the counter obvious.
3. **Art scope.** Use outfit layers on one rig, and collect references before drawing.
4. **Authored inevitability.** Be upfront that the ending is fixed and the agent controls how it arrives.

## 7. Rules for agents on this project

- Do not change the story, ending, pillars, or tone without Nicoh's approval.
- Separate recommendations from decisions in every document. Nicoh's decisions are marked **[Decided]**.
- Raise disagreements plainly, with reasons.
- Keep private planning material and personal information out of the repository.
