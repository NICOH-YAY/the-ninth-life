// AI-use disclosure: Codex-authored deterministic bot diagnostics; no state mutation.
import {makeSim} from "../tests/helpers";
import {makeBot,runFight} from "../src/core/bots";
for(const profile of ["aggressive","average","defensive","spam_cleave","spam_throw","spam_reap","spam_nova"] as const){
 const s=makeSim("patchwork",{fightIndex:9,seed:42});runFight(s,makeBot(profile,5));
 console.log(JSON.stringify({profile,outcome:s.outcome,end:s.endReason,time:s.time,hp:s.boss.hp,chHp:s.ch.hp,bx:s.boss.x,cx:s.ch.x,phase:s.boss.phase,blocks:s.boss.blocks,jumps:s.boss.jumps,dashes:s.boss.dashes,hits:s.events.filter(e=>e.type==="challenger_hit").length,evades:s.events.filter(e=>e.type==="evade").length,last:s.events.slice(-12)}));
}
