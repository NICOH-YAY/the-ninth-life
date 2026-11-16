> AI-use disclosure: Drafted with Claude (Anthropic) from the course syllabus dates and Nicoh's decisions. Dates and tasks are proposals until Nicoh accepts them.

# The Ninth Life: Initial Project Plan and Risk Profile

**Version:** Initial (G1), November 15, 2026
**Owner:** Nicoh Koehly (`nicoh-yay`) in the Producer role
**Moves to Asana after G1.**

## 1. Gate and milestone dates (from the syllabus)

| Date | Gate or milestone | Due |
|---|---|---|
| Sun Nov 15, 11:59 p.m. | **G1 Concept** | Pitch recording and deck, Initial GDD and Configuration Document, this plan |
| Mon Nov 16 | G1 review | Decision posted by Nov 17 |
| Thu Nov 19 | Braintrust | Two replies in the G1 discussion |
| Mon Nov 23 | Checkpoint | Deployed model call, isolated session state, forced-timeout fallback |
| Sat Nov 28 / Mon Nov 30 | **G2 + G3** | First playable with one external playtest, Initial Playtest Log, scope lock, updated docs |
| Wed Dec 2 | Alpha | Committed features in |
| Fri Dec 4 | Beta | Content locked |
| Sat Dec 5 / Mon Dec 7 | **G4** | Gold build, final docs, harness |
| Mon Dec 14 | **G5** | Final game, AAR, playtest log |
| Dec 17 to 23 | Finals | Retrospective, walkthrough, live presentation |

## 2. First tasks through G2

| # | Task | Role | Due | Acceptance criteria |
|---|---|---|---|---|
| 1 | Asana project set up from this plan | Producer | Nov 17 | Tasks have owner, role, criteria, dates |
| 2 | Scaffold: TypeScript, Vite, Vitest, engine choice | Tech Lead | Nov 17 | test, typecheck, build pass |
| 3 | Lean CI, required to merge | Tech Lead | Nov 18 | Runs on every PR |
| 4 | Agent role files in `.claude/agents/` | Producer | Nov 18 | One config per role |
| 5 | Two Braintrust replies | Nicoh | Nov 19 | Specific, observation first |
| 6 | Mood board from Scaredy Cats-style references | Art Lead | Nov 19 | 3 to 5 references, notes on what to take |
| 7 | Boss with 4 moves and tells, greybox arena | Tech Lead, Design | Nov 21 | Playable vs. a dummy |
| 8 | Challenger controller + kitten + alley cat, scripted order | Tech Lead | Nov 22 | Full fight loop with fallback |
| 9 | Validator, fallback, deterministic tests (CONFIG A7) | Tech Lead, QA | Nov 22 | All cases pass in CI |
| 10 | Worker: Gemini call, session state, timeout, kill switch | Tech Lead | Nov 22 | Forced timeout falls back cleanly |
| 11 | **Checkpoint demo** and measured latency and cost | Release, BI | Nov 23 | Recorded, CONFIG A8 filled |
| 12 | Sailor, acrobat, witch lives | Tech Lead, Art | Nov 25 | Each counter works against its attack |
| 13 | Live eval: counter rate, memory comparison | QA, BI | Nov 25 | Results logged with failures |
| — | Thanksgiving buffer | — | Nov 26 to 27 | No new commitments |
| 14 | External playtest, agent vs. scripted | Design, QA | Nov 27 | Consent script, anonymized notes |
| 15 | Playtest Log, scope lock, docs update, G2/G3 recording | Producer, Nicoh | Nov 28 | Ready for review |

## 3. Six-dimension Risk Profile

| Dimension | Rating | Evidence | Mitigation |
|---|---|---|---|
| IP / Concept | Medium | Close in premise to The Dark Queen of Mortholme | Credit it clearly. The learning AI and the past-lives roster are the difference |
| Business / Audience | Low | Short, readable action game, easy to playtest | Recruit testers early |
| Technology | Medium | Combat controller and Worker are unbuilt. Midterm toolchain carries over. Model calls sit between fights, so latency is low risk | Worker proven by Nov 23. Scripted fallback |
| Team | Medium | Solo with agents, limited hours from work | Role files by Nov 18. QA review per PR |
| Genre / Mechanics | **High** | Whether the counters feel fair and the learning feels visible is untested | Greybox fights by Nov 22. Playtest before adding lives |
| Timeline | **High** | About 3 weeks to Gold. Art is the largest unknown | Outfit layers on one rig. Stretch lives behind the Alpha cut rule |

**Shared cause:** both Highs come down to how many lives and outfits get built. Build the boss and two lives first, playtest, then add lives.

## 4. Decision requested at G1

**Approval would authorize:** a prototype of the boss and the first lives with the live agent and its scripted baseline, and the Nov 23 agent checkpoint.

**A Hold would need:** a narrower roster or agent role, resubmitted with revised Scope and Risk Profile.
