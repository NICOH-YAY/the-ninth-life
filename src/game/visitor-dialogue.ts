// AI-use disclosure: Codex-authored branching dialogue for Nicoh's anonymous returning soul.
import type { LifeId } from "../core/types";

export interface VisitorTurn {
  question: string;
  choices: readonly [string, string];
  responses: readonly [string, string];
  cuePrefix: string;
}
type Branch = Omit<VisitorTurn, "cuePrefix">;
type Conversation = { first: Branch; remembered: string; second: readonly [Branch, Branch] };

// PLACEHOLDER: Nicoh to review. Names are deliberately absent; objects carry the memory.
const CONVERSATIONS: Record<LifeId, Conversation> = {
  kitten: {
    first: { question: "The village said a good king would come home. Are you ours?",
      choices: ["I was. I thought this crown would keep you safe.", "Your village sent a child to threaten its king?"],
      responses: ["Then why do our doors still need locks?", "They sent the only one who would climb the steps."] },
    remembered: "I know the sound your crown makes when you lower your head.",
    second: [
      { question: "If the crown keeps you here, let me knock it off. Will you show me how?",
        choices: ["Watch my feet. A low blow must be jumped.", "I will teach you, but this is no harmless lesson."],
        responses: ["Then move. I want to see the king, not the chair.", "I know. I brought a wooden staff because I was afraid."] },
      { question: "I am afraid. Does that make it easier for you?",
        choices: ["No. Fear means you still have something to lose.", "It means you should have stayed below the hill."],
        responses: ["Then teach me to survive you.", "There is no one else coming for me. Raise your blade."] },
    ],
  },
  alley: {
    first: { question: "This scarf was in my grave. Why does your seal stitch it closed?",
      choices: ["I wrapped it around you before the earth froze.", "A scrap of cloth proves nothing."],
      responses: ["You remember burying me. I remember the blade before it.", "My paw still reaches for the wound when I sleep."] },
    remembered: "You tied the knot too tightly. You always do.",
    second: [
      { question: "If you remember my grave, why open the door for me again?",
        choices: ["Because I cannot bear to forget another face.", "Because I hoped this time you would finish it."],
        responses: ["Then look at me when I strike.", "Do not ask me for mercy after I earn that chance."] },
      { question: "Will you deny the hook in my paw when it finds the same place?",
        choices: ["No. I will remember this wound.", "You will need more than a dream to reach me."],
        responses: ["Good. I am tired of carrying the memory alone.", "I sharpened this hook on every step to your door."] },
    ],
  },
  sailor: {
    first: { question: "I dragged this chain from the river. Your crest was locked around its weight.",
      choices: ["My prison used to reach farther than these walls.", "I never ordered anyone into that river."],
      responses: ["You did not need to. We wore your orders like collars.", "The lock does not care which mouth spoke the command."] },
    remembered: "The chain has one broken link. It is shaped like your crown.",
    second: [
      { question: "I can bind your hands with your own iron. What will your kingdom command then?",
        choices: ["Nothing. Let the weight fall on its king.", "I will break the chain before I kneel."],
        responses: ["Hold still long enough to learn what it weighs.", "Then I will swing until the last link gives."] },
      { question: "You deny the river. Will you deny the iron when it closes?",
        choices: ["No. I can answer for what it carried.", "I answer to no jailer."],
        responses: ["Then we finally understand one another.", "Neither did I. That is why I brought the key as a weapon."] },
    ],
  },
  acrobat: {
    first: { question: "These bells were cast from your coronation cup. Do you hear the crack?",
      choices: ["I heard it on the day I stopped hearing the crowd.", "I hear someone making noise before a fight."],
      responses: ["There was never a crowd. Only the same voice, coming back.", "Then listen closely. This rhythm ends beneath your guard."] },
    remembered: "One bell is silent. It remembers the strike that broke it.",
    second: [
      { question: "You know my rhythm now. Will you follow it or try to silence it?",
        choices: ["I will meet you between the bells.", "I will stop the hand that rings them."],
        responses: ["Then keep your eyes above the floor.", "Try. The blade returns from the other side."] },
      { question: "Will you look up when the last bell rings?",
        choices: ["Yes. I am done hiding behind the crown.", "I will be where your feet must land."],
        responses: ["Then you may finally see me fall.", "There. You remembered something about me after all."] },
    ],
  },
  witch: {
    first: { question: "This needle came from the star in your crown. It points at you, even through stone.",
      choices: ["I thought it pointed toward a way out.", "You stole a piece of my crown."],
      responses: ["It points toward the wound that keeps us here.", "It grew in my chest. I had to pull it free."] },
    remembered: "We have carried the same light in different wounds.",
    second: [
      { question: "If I open that wound again, will you close it or let it speak?",
        choices: ["I will hear what the crown buried.", "I will tear the star out myself."],
        responses: ["Then do not blink when the dark answers.", "It has roots. They reach farther than your hands."] },
      { question: "Will you call it theft when your own light turns against you?",
        choices: ["No. I should have known what I left behind.", "I will snuff it out with the rest."],
        responses: ["Then watch where the needles gather.", "You have tried. That is why I learned to move between them."] },
    ],
  },
  knight: {
    first: { question: "This guard was hammered from your gate. There is no gate left outside.",
      choices: ["I thought it would protect the kingdom after I could not.", "Then you have brought my own wall to threaten me."],
      responses: ["It protected your silence. We died on the other side.", "I brought what was left after your wall fell."] },
    remembered: "Your seal is on the side I hold against my heart.",
    second: [
      { question: "My hammer will reach the floor beneath your feet. What will you stand on then?",
        choices: ["On what remains of my promise.", "On your broken guard."],
        responses: ["A promise will not stop the shock. Move.", "Then come close enough to break it."] },
      { question: "Who will you blame when the hall breaks under us?",
        choices: ["Its king. There is no one else to name.", "The one who raised a hammer inside it."],
        responses: ["Then carry the blow without looking away.", "That is an answer worthy of these walls."] },
    ],
  },
  thief: {
    first: { question: "My mirrors show your face before they show mine. Which of us did the crown steal?",
      choices: ["I no longer remember the face beneath it.", "A mirror is an easy thing to lie with."],
      responses: ["Then let me show you the side you never guard.", "It only gives back what stands before it."] },
    remembered: "Every reflection wears the same small crack above the eye.",
    second: [
      { question: "If both blades look real, which one will you answer?",
        choices: ["The one with a living hand behind it.", "Both. I have room for one more scar."],
        responses: ["Then find me before the glass breaks.", "You still count wounds as if they are victories."] },
      { question: "Will you keep calling it a trick when I stand behind you?",
        choices: ["No. I have hidden behind worse things.", "Come closer and make it real."],
        responses: ["Then turn. I want you to see this one coming.", "That is what you said in the other mirror."] },
    ],
  },
  quiet: {
    first: { question: "This lantern burned beneath your throne before I was born. Why does it know my breath?",
      choices: ["I lit it for someone who never came home.", "Put it down. I will not be haunted by a flame."],
      responses: ["I came home many times. You buried me each time.", "Then watch the frost. It does not need your permission."] },
    remembered: "The wick is made from the hem of your first cloak.",
    second: [
      { question: "I can freeze the light at your feet or put it through your heart. Which will you face?",
        choices: ["The heart. I have spent too long looking down.", "Neither. I will keep moving."],
        responses: ["Then remember that stillness is a choice.", "Good. I did not come to strike an empty chair."] },
      { question: "If I leave the lantern here, will you remember who carried it?",
        choices: ["Yes. Even if I cannot remember your name.", "I will remember the one who raised a spear."],
        responses: ["That is all the light it has left.", "Then let it be a memory you earned."] },
    ],
  },
  patchwork: {
    first: { question: "The scarf. The chain. The bells. All stitched with your crest. How many lives did you think I had?",
      choices: ["I counted the years because I could not count the graves.", "Enough to learn what your last life could not."],
      responses: ["Then stop counting. There is only this room now.", "I learned. This blade is made from every lesson."] },
    remembered: "You have heard every voice in this one.",
    second: [
      { question: "There is a place between the ribs where a crown cannot protect you. Will you meet me there?",
        choices: ["I will. No throne between us.", "Come and take the last thing I have."],
        responses: ["Then let the sword stay until the light goes out.", "You still think it belongs to you."] },
      { question: "If I lose this life, what will you do with the silence?",
        choices: ["I do not know. That frightens me more than you.", "I will call it victory."],
        responses: ["Then fight for an answer worth surviving.", "I hope it keeps you warm when the roof is gone."] },
    ],
  },
};

/** Two real exchanges. The second turn cannot be built without the first answer. */
export function visitorTurn(life: LifeId, step: 0 | 1, history: readonly boolean[], bond: number): VisitorTurn {
  const script = CONVERSATIONS[life];
  if (step === 1 && history.length < 1) throw new Error("The second exchange requires the first answer.");
  const branch = step === 0 ? script.first : script.second[history[0] ? 0 : 1];
  const remembered = bond >= 4 ? " " + script.remembered : "";
  return {
    question: branch.question,
    choices: [...branch.choices],
    responses: [branch.responses[0] + remembered, branch.responses[1] + remembered],
    cuePrefix: "visitor." + life + ".exchange-" + (step + 1) + (step === 1 ? history[0] ? ".open" : ".guarded" : ""),
  };
}
