> AI-use disclosure: prototype written by Claude Code; pixel presentation pass and project organization by Codex, from Nicoh's direction.

# The Ninth Life

A short story boss fight for COMS E6998 sec 014 (Fall 2026). You play a tall, lonely, immortal cat on a throne. One small cat keeps coming back over nine lives, stronger each time, in a new outfit with a new skill. An agent picks which life comes next and how it fights, between fights only. The ninth life always wins.

Design: `GDD.md`, `CONFIG.md`, `docs/story-bible.md`, `docs/phase-two.md`, `docs/challenger-progression.md`, `docs/art-direction.md`. Status of the first playable: `docs/prototype-notes.md`.

## Run it

On this computer, double-click `PLAY.cmd`, then open the local address it prints. Or use:

```
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). Click Play or press Enter. C opens Attributions. Esc skips the opening or returns from Attributions.

The fifteen-second opening shows the Immortal inheriting the throne, a thousand-year jump, and the first kitten's one-hit defeat. That defeat uses the real combat rules and is recorded once; interactive play starts at the second life. Autoplay retains the complete original nine-fight harness.

## Project map

The working project is `D:\Coding VS\the-ninth-life`, including its Git history, assets, dependencies and local QA evidence. The former C: game copy has been relocated here. Use this D: folder for future work.

| Folder or file | Contents |
|---|---|
| `src/core/` | Existing deterministic combat, progression and story rules |
| `src/game/` | Pixel rendering, animation, input, menu, cutscenes and audio |
| `assets/pixel/` | Original Higgsfield generations, exact prompts, jobs and palette |
| `assets/pixel/native/` | Exported transparent 48 x 72 sprite sheets |
| `public/pixel/` | Runtime animation sheets and generated opening atlas |
| `public/bg/` | Runtime throne hall backgrounds |
| `assets/concept/` | Preserved original concept art and manifest |
| `assets/references/` | Your mood and upright-cat references, local only and Git-ignored |
| `docs/` | All handoff design files, session plans and build notes |
| `worker/`, `agents/` | Existing between-fight agent service and configuration |
| `ATTRIBUTION.md` | Source and AI-use record |
| `CLAUDE.local.md` | Private course context, Git-ignored |

Presentation status and limitations: `docs/pixel-pass-notes.md`. Native sprite exports can be regenerated with `node scripts/export-pixel-sprites.mjs`.

## Published game

GitHub Pages: [Play The Ninth Life](https://nicoh-yay.github.io/the-ninth-life/). The Pages workflow tests and builds the game on pushes to `prototype/first-playable` or `main`. It publishes only `dist/`; the private course context and local reference files remain ignored.

## Controls

| Key | Action |
|---|---|
| A, D | Shift on the throne platform |
| J | Crescent Cleave (Pounce Rift in Phase Two) |
| K | Glaive Throw (Soul Wisps) |
| L | Low Reap (Shadow Tide) |
| Space | Nine-Lives Nova (Ninth Bell), when charged |
| S (hold) | Life 9, below 25% health: lower your guard |
| A/D, Enter | Choose the Immortal's answer between fights |
| M | Mute |

Debug keys require `?debug=1`: 1 to 9 jump to a life, P forces Phase Two, B and N raise and lower bond, H shows hitboxes. Planner diagnostics appear only in this mode.

## Planner modes

Set `AGENT_MODE` at build time (`VITE_AGENT_MODE` in a `.env.local`) or add `?mode=` to the page address.

- `heuristic` (default with no Worker URL): offline stand-in for the agent. Sends the life that counters your most-used move.
- `scripted`: the fixed order and default tactics. The deterministic fallback and the kill switch.
- `live`: calls the Worker at `VITE_WORKER_URL` (or `?worker=`). 5 s timeout, schema check, 12 calls per session, scripted fallback on any failure. `?memory=last` sends only the last fight.

Other page options: `?seed=N` fixes the run seed, `?mute=1` starts muted, `?speed=4` runs fights faster, `?autoplay=1` lets a scripted boss play the whole run, `?renderer=webgl` tries WebGL (Canvas is the default).

## Checks

```
npm run typecheck
npm test
npm run build
npm run sim -- 12
```

`npm run sim` plays full headless runs and prints the lowest boss health per fight for each planner, curve, and boss style.

## Worker

`worker/` holds the Cloudflare Worker for the live agent. It is not deployed. See `worker/wrangler.toml` for the steps. The model key lives only in Worker secrets.

## Credits

Inspired by *The Dark Queen of Mortholme* (structure) and *Scaredy Cats* (lighting mood). No code or assets from either. Asset sources are in `ATTRIBUTION.md`.
