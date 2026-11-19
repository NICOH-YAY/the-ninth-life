// AI-use disclosure: placeholder lines drafted by Claude Code. Every line here is a
// placeholder for Nicoh to rewrite. Authored beats will be voiced later; agent lines
// get a murmur. Style rules: plain, short, no em dashes, the Immortal never says it is lonely.

import type { BossMove, LifeId, Tier } from "../core/types";

/** Intro card text per life: outfit name and one visible sign of growth. */
export const INTRO: Record<LifeId, { title: string; sign: string }> = {
  kitten: { title: "The kitten", sign: "A twig held in both paws" }, // PLACEHOLDER: Nicoh to rewrite
  alley: { title: "The alley cat", sign: "A red bandana, a dagger, quick feet" }, // PLACEHOLDER: Nicoh to rewrite
  sailor: { title: "The sailor cat", sign: "A yellow raincoat and an umbrella that does not close" }, // PLACEHOLDER: Nicoh to rewrite
  acrobat: { title: "The acrobat cat", sign: "A cape, a bell, and springs in its legs" }, // PLACEHOLDER: Nicoh to rewrite
  witch: { title: "The witch’s cat", sign: "A pointed hat and a wand that hums" }, // PLACEHOLDER: Nicoh to rewrite
  knight: { title: "The knight cat", sign: "Tin armor, dented already" }, // PLACEHOLDER: Nicoh to rewrite
  thief: { title: "The thief cat", sign: "A mask, a hood, and two of everything" }, // PLACEHOLDER: Nicoh to rewrite
  quiet: { title: "The quiet one", sign: "Only a scarf" }, // PLACEHOLDER: Nicoh to rewrite
  patchwork: { title: "The patchwork cat", sign: "Something from every life, sewn together" }, // PLACEHOLDER: Nicoh to rewrite
};

/** The challenger's arrival line for the fixed slots. */
export const ARRIVAL: Partial<Record<LifeId, string>> = {
  kitten: "I climbed all the stairs. I am not scared.", // PLACEHOLDER: Nicoh to rewrite
  quiet: "I left the sword downstairs. Can I sit?", // PLACEHOLDER: Nicoh to rewrite
  patchwork: "This is the last one. I brought everyone.", // PLACEHOLDER: Nicoh to rewrite
};
export const ARRIVAL_PATCHWORK_STRUCK = "You hit the quiet one. I came anyway."; // PLACEHOLDER: Nicoh to rewrite

/** Authored fallback lines for agent slots, used when the agent fails or in scripted mode. */
export const FALLBACK: Record<Tier, string[]> = {
  1: [
    "That was a practice round. Watch this one.", // PLACEHOLDER: Nicoh to rewrite
    "I slipped. That is all that happened.", // PLACEHOLDER: Nicoh to rewrite
    "You are big. I am faster now.", // PLACEHOLDER: Nicoh to rewrite
  ],
  2: [
    "You always do the same thing first. I noticed.", // PLACEHOLDER: Nicoh to rewrite
    "Do you ever sleep up here?", // PLACEHOLDER: Nicoh to rewrite
    "Why stay on that chair when the door is open?", // PLACEHOLDER: Nicoh to rewrite
  ],
  3: [
    "Hello again. Your tail still gives you away.", // PLACEHOLDER: Nicoh to rewrite
    "I left the scarf by the steps last time. You kept it.", // PLACEHOLDER: Nicoh to rewrite
    "Still here. So am I.", // PLACEHOLDER: Nicoh to rewrite
  ],
};

/** Stock line per outfit, used when an agent line fails the line check. */
export const STOCK: Record<LifeId, string> = {
  kitten: "I am not scared.", // PLACEHOLDER: Nicoh to rewrite
  alley: "Swing slower. I dare you.", // PLACEHOLDER: Nicoh to rewrite
  sailor: "Throw whatever you want. I brought cover.", // PLACEHOLDER: Nicoh to rewrite
  acrobat: "Sweep the floor. I will not be on it.", // PLACEHOLDER: Nicoh to rewrite
  witch: "Make the room go dark. I know a way out.", // PLACEHOLDER: Nicoh to rewrite
  knight: "Hit me once. See what happens.", // PLACEHOLDER: Nicoh to rewrite
  thief: "Which one of me are you looking at?", // PLACEHOLDER: Nicoh to rewrite
  quiet: "Can I sit?", // PLACEHOLDER: Nicoh to rewrite
  patchwork: "I brought everyone.", // PLACEHOLDER: Nicoh to rewrite
};

/** Move names as the challenger says them in heuristic lines. */
export const MOVE_SPOKEN: Record<BossMove, string> = {
  cleave: "the big slash",
  throw: "the spinning blade",
  reap: "the low sweep",
  nova: "the light that eats the room",
};

/** Templates for heuristic lines. {move} is replaced with MOVE_SPOKEN. */
export const HEURISTIC_TEMPLATES: Record<Tier, string[]> = {
  1: [
    "You only know {move}. I fixed that.", // PLACEHOLDER: Nicoh to rewrite
    "{move} again? I came ready this time.", // PLACEHOLDER: Nicoh to rewrite
  ],
  2: [
    "You always reach for {move}. I watched.", // PLACEHOLDER: Nicoh to rewrite
    "Every time, {move}. Why that one?", // PLACEHOLDER: Nicoh to rewrite
  ],
  3: [
    "I knew {move} was coming. I always know now.", // PLACEHOLDER: Nicoh to rewrite
    "{move} first, like always. That is fine.", // PLACEHOLDER: Nicoh to rewrite
  ],
};

/** The Immortal's two answers between fights, by tier. Index rotates by fight. */
export const RESPONSES: Record<Tier, { guarded: string; open: string }[]> = {
  1: [
    { guarded: "Go home.", open: "You climbed all those stairs?" }, // PLACEHOLDER: Nicoh to rewrite
    { guarded: "Again. Pointless.", open: "You hold that blade wrong." }, // PLACEHOLDER: Nicoh to rewrite
    { guarded: "Stop coming.", open: "You are faster than last time." }, // PLACEHOLDER: Nicoh to rewrite
  ],
  2: [
    { guarded: "I do not sleep.", open: "Sometimes. Not well." }, // PLACEHOLDER: Nicoh to rewrite
    { guarded: "The chair is mine.", open: "The door was locked a long time." }, // PLACEHOLDER: Nicoh to rewrite
    { guarded: "You learn nothing.", open: "You learned that from the last one." }, // PLACEHOLDER: Nicoh to rewrite
  ],
  3: [
    { guarded: "Leave the scarf. Go.", open: "I kept it by the throne." }, // PLACEHOLDER: Nicoh to rewrite
    { guarded: "This changes nothing.", open: "Sit a moment before you go." }, // PLACEHOLDER: Nicoh to rewrite
    { guarded: "Finish it, then.", open: "I know. I know you are." }, // PLACEHOLDER: Nicoh to rewrite
  ],
};

/** Life 8 conversation, picked by bond band. Six lines each. */
export const QUIET_TALK: Record<"low" | "mid" | "high", string[]> = {
  low: [
    "I am not here to fight.", // PLACEHOLDER: Nicoh to rewrite
    "The others are tired. So am I.", // PLACEHOLDER: Nicoh to rewrite
    "You never answer us. That is fine.", // PLACEHOLDER: Nicoh to rewrite
    "There is a garden at the bottom of the tower.", // PLACEHOLDER: Nicoh to rewrite
    "Nobody has walked in it for a long time.", // PLACEHOLDER: Nicoh to rewrite
    "I will go now. One more comes after me.", // PLACEHOLDER: Nicoh to rewrite
  ],
  mid: [
    "I left my sword with the others.", // PLACEHOLDER: Nicoh to rewrite
    "You answered some of us. I heard.", // PLACEHOLDER: Nicoh to rewrite
    "The kitten still talks about the stairs.", // PLACEHOLDER: Nicoh to rewrite
    "There is a garden at the bottom. It needs someone.", // PLACEHOLDER: Nicoh to rewrite
    "You could see it. If you came down.", // PLACEHOLDER: Nicoh to rewrite
    "I will go. The last one is coming.", // PLACEHOLDER: Nicoh to rewrite
  ],
  high: [
    "Hello. I brought nothing this time.", // PLACEHOLDER: Nicoh to rewrite
    "You kept the scarf. I saw it.", // PLACEHOLDER: Nicoh to rewrite
    "Every one of us came back for the same reason.", // PLACEHOLDER: Nicoh to rewrite
    "The garden at the bottom still grows. We checked.", // PLACEHOLDER: Nicoh to rewrite
    "You do not have to hold the chair forever.", // PLACEHOLDER: Nicoh to rewrite
    "The last one will ask you something. Listen.", // PLACEHOLDER: Nicoh to rewrite
  ],
};

export const MUTUAL: { lower: string[]; raise: string[] } = {
  lower: [
    "You stopped. So will I.", // PLACEHOLDER: Nicoh to rewrite
    "We could just stand here a while.", // PLACEHOLDER: Nicoh to rewrite
    "Quiet up here when you stop.", // PLACEHOLDER: Nicoh to rewrite
  ],
  raise: [
    "Sorry. I have to keep going.", // PLACEHOLDER: Nicoh to rewrite
    "Alright. Again.", // PLACEHOLDER: Nicoh to rewrite
  ],
};

/** Shown under the Immortal when Phase Two begins. */
export const PHASE2_BEAT = "It spends one of its own lives."; // PLACEHOLDER: Nicoh to rewrite

/** Life 9 lines during the fight. */
export const LIFE9 = {
  midFight: "I came to take you outside.", // PLACEHOLDER: Nicoh to rewrite
  holdPrompt: "Hold S to lower the glaive", // PLACEHOLDER: Nicoh to rewrite
  holdPromptAscended: "Hold S to lower your hands", // PLACEHOLDER: Nicoh to rewrite
  whyHigh: "Every life ended up here. We kept coming so you would not be the only one left.", // PLACEHOLDER: Nicoh to rewrite
  whyLow: "We kept coming. Somebody had to.", // PLACEHOLDER: Nicoh to rewrite
  whyStruck: "You hit the quiet one. I still came.", // PLACEHOLDER: Nicoh to rewrite
};

/** Endings. Final wording is Nicoh's; these are stand-ins so the scene can be judged. */
export const ENDINGS = {
  heldImmortal: "Show me the garden.", // PLACEHOLDER: Nicoh to rewrite
  heldHigh: "They walk down the stairs together.", // PLACEHOLDER: Nicoh to rewrite
  heldLow: "It stands up slowly. They go down together.", // PLACEHOLDER: Nicoh to rewrite
  foughtHigh: "It does not get up. The small cat stays beside it until the light comes.", // PLACEHOLDER: Nicoh to rewrite
  foughtLow: "It does not get up. The small cat sits with it anyway.", // PLACEHOLDER: Nicoh to rewrite
  struckCoda: "The quiet one is not among them.", // PLACEHOLDER: Nicoh to rewrite
  tooSoonChallenger: "Oh. That was too soon. I did not get to ask you anything.", // PLACEHOLDER: Nicoh to rewrite
  tooSoonCoda: "The light comes up on an empty chair.", // PLACEHOLDER: Nicoh to rewrite
};

export const TITLE = {
  name: "The Ninth Life",
  prompt: "Press any key", // PLACEHOLDER: Nicoh to rewrite
  controls: "A D shift   J K L Space attack   M mute", // PLACEHOLDER: Nicoh to rewrite
};

export function quietBand(bond: number): "low" | "mid" | "high" {
  return bond >= 5 ? "high" : bond >= 2 ? "mid" : "low";
}

/** Every line string, for the content check in tests. */
export function allLines(): string[] {
  const out: string[] = [];
  out.push(...Object.values(INTRO).flatMap((i) => [i.title, i.sign]));
  out.push(...(Object.values(ARRIVAL) as string[]), ARRIVAL_PATCHWORK_STRUCK);
  out.push(...Object.values(FALLBACK).flat(), ...Object.values(STOCK), ...Object.values(HEURISTIC_TEMPLATES).flat());
  out.push(...Object.values(RESPONSES).flatMap((r) => r.flatMap((x) => [x.guarded, x.open])));
  out.push(...Object.values(QUIET_TALK).flat(), ...MUTUAL.lower, ...MUTUAL.raise, PHASE2_BEAT);
  out.push(...Object.values(LIFE9), ...Object.values(ENDINGS));
  return out;
}
