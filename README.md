> AI-use disclosure: written by Claude Code during the Nov 19 overnight build.

# The Ninth Life

A short story boss fight for COMS E6998 sec 014 (Fall 2026). You play a tall, lonely, immortal cat on a throne. One small cat keeps coming back over nine lives, stronger each time, in a new outfit with a new skill. An agent picks which life comes next and how it fights, between fights only. The ninth life always wins.

Design: `GDD.md`, `CONFIG.md`, `docs/story-bible.md`, `docs/phase-two.md`, `docs/challenger-progression.md`, `docs/art-direction.md`. Status of the first playable: `docs/prototype-notes.md`.

## Run it

```
npm install
npm run dev
```

Open the address Vite prints (usually http://localhost:5173). Press any key on the title screen.

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

Debug keys (on in `npm run dev`, or add `?debug=1` to a built page): 1 to 9 jump to a life, P forces Phase Two, B and N raise and lower bond, H shows hitboxes. The line at the bottom shows the planner mode and where the last plan came from.

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
