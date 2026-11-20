// AI-use disclosure: Codex-authored actual Godot keyboard-input story, guard, counter and poise verification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const live=process.argv.includes('--live');
const out=resolve(repo,'output','qa',live?'story-guard-live':'story-guard');
await mkdir(out,{recursive:true});
const report={aiUseDisclosure:'Native keyboard inputs verify held versus perfect guard, counters and poise; debug encounter selection is presentation-only, separate from ordinary-input ending routes.',live,checks:{},screenshots:[],errors:[],warnings:[],driverDiagnostics:[],startedAt:new Date().toISOString()};
let server;
if(!live){
 const root=resolve(repo,'build','web');
 server=createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html');const path=resolve(root,'.'+name);
  if(!path.startsWith(root+sep))throw Error('Outside build');const body=await readFile(path);
  res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.pck':'application/octet-stream','.png':'image/png'})[extname(path)]??'application/octet-stream','cache-control':'no-cache'});res.end(body);
 }catch{res.writeHead(404);res.end('Missing build');}});
 await new Promise(r=>server.listen(5198,'127.0.0.1',r));
}
const base=live?'https://nicoh-yay.github.io/the-ninth-life/':'http://127.0.0.1:5198/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:540}});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());else if(m.type()==='warning'){(m.text().includes('GPU stall due to ReadPixels')?report.driverDiagnostics:report.warnings).push(m.text());}});
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const state=()=>page.evaluate(()=>typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState);
const wait=async(test,timeout=15000)=>page.waitForFunction(source=>{const s=typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState;return s&&new Function('s','return ('+source+')(s)')(s);},test.toString(),{timeout,polling:25});
const shot=async name=>{await page.screenshot({path:resolve(out,name+'.png')});report.screenshots.push(name+'.png');};
const openingStages=new Set();
const storyLines=new Set();
const enterFight=async()=>{
 const deadline=Date.now()+120000;let answered=0;
 while(Date.now()<deadline){const s=await state();if(s.dialogue_text)storyLines.add(s.dialogue_text);if(s.mode==='opening'&&['crossed-steel','blast-back','counter-thrust','old-king-pierced','crown-held','crown-burst'].includes(s.stage)&&!openingStages.has(s.stage)){openingStages.add(s.stage);await shot('opening-'+s.stage);}if(s.mode==='fight')return answered;if(s.choices){await page.keyboard.press('Enter');answered++;await wait(s=>!s.choices,5000);}await page.waitForTimeout(80);}
 throw Error('Native opening/dialogue did not lead to fight');
};

try{
 await page.goto(base+'?debug=1&mode=scripted&seed=42&storyguard='+Date.now());await wait(s=>s.mode==='menu',90000);
 await page.keyboard.press('Enter');assert.equal(await enterFight(),2);report.checks.engine=(await state()).engine;
 // Approach with native movement; no positions, damage or timers are overwritten.
 await page.keyboard.down('a');await wait(s=>Math.abs(s.x-s.enemy_x)<95,10000);await page.keyboard.up('a');
 await wait(s=>s.enemy_attack_in>0.30&&s.enemy_attack_in<0.65,15000);
 const beforeHeld=await state();await page.keyboard.down('g');await wait(s=>s.blocks>0,10000);const held=await state();await page.keyboard.up('g');
 assert.equal(held.perfect_blocks,beforeHeld.perfect_blocks,'An ordinary sustained guard must not become a perfect block');report.checks.heldGuard=held;await shot('ordinary-held-guard');
 const baselinePerfect=held.perfect_blocks;const attempts=[];
 for(let n=0;n<6&&(await state()).perfect_blocks===baselinePerfect;n++){
  await wait(s=>s.enemy_attack_in>0.16&&s.enemy_attack_in<0.60,12000);
  const deadline=Date.now()+1500;
  while(Date.now()<deadline){const s=await state();if(s.enemy_attack_in>0&&s.enemy_attack_in<=0.105)break;await page.waitForTimeout(10);}
  await page.keyboard.down('g');await page.waitForTimeout(150);const observed=await state();attempts.push(observed);
  if(observed.perfect_blocks>baselinePerfect)break;await page.keyboard.up('g');await page.waitForTimeout(250);
 }
 const perfect=await state();assert(perfect.perfect_blocks>baselinePerfect,'A newly timed native G press must produce a perfect block');report.checks.perfectGuard={state:perfect,attempts};await shot('perfect-block');
 const counterBefore=perfect.counter_hits;await page.keyboard.press('j');await wait(s=>s.counter_hits>0,5000);const counter=await state();assert(counter.counter_hits>counterBefore,'A real sword hit must consume the perfect-block counter opportunity');report.checks.counter=counter;await page.keyboard.up('g');await shot('perfect-block-counter');
 await wait(s=>!s.active_move);await page.keyboard.down('d');await page.keyboard.press('Shift');await page.waitForTimeout(240);await page.keyboard.down('Space');await wait(s=>s.y>50,3000);await page.keyboard.press('l');await wait(s=>s.telegraphs.some(t=>t.kind==='royal'&&!t.enemy),3000);const locked=await state();const mark=locked.telegraphs.find(t=>t.kind==='royal'&&!t.enemy);await page.waitForTimeout(160);const movedTell=await state();await page.keyboard.up('d');await page.keyboard.up('Space');const lockedAfter=movedTell.telegraphs.find(t=>t.kind==='royal'&&!t.enemy);assert(lockedAfter,'Anticipation must remain visible long enough to react');report.checks.telegraphAttempt={before:locked,after:movedTell};assert.equal(lockedAfter.x,mark.x,'Targeted floor telegraph must stay locked while the caster moves');assert(movedTell.x>locked.x+8);report.checks.lockedTelegraph={before:locked,after:movedTell};await shot('locked-royal-telegraph');
 // A late durable knight must retain attacks under real repeated slash pressure.
 await page.keyboard.press('6');await wait(s=>s.mode==='arrival'&&s.life===6);assert.equal(await enterFight(),2);
 const trace=[];const deadline=Date.now()+15000;let observedGuard=false,poiseState;await page.keyboard.down('j');let heldDirection='';
 while(Date.now()<deadline){const s=await state();poiseState=s;trace.push({hp:s.enemy_hp,poise:s.poise,breaks:s.poise_breaks,guard:s.enemy_guard,strikes:s.enemy_strikes,move:s.player_move_stage,enemy:s.enemy_state});observedGuard ||= s.enemy_guard<0.98;
  if(s.poise_breaks>0&&s.enemy_strikes>0&&observedGuard)break;assert.equal(s.mode,'fight','Durable enemy must survive long enough to demonstrate poise and counter-pressure');
  const desired=Math.abs(s.enemy_x-s.x)>85?(s.enemy_x<s.x?'a':'d'):'';if(desired!==heldDirection){if(heldDirection)await page.keyboard.up(heldDirection);if(desired)await page.keyboard.down(desired);heldDirection=desired;}await page.waitForTimeout(80);
 }
 await page.keyboard.up('j');if(heldDirection)await page.keyboard.up(heldDirection);
 assert(poiseState.poise_breaks>0,'Real repeated hits must eventually break enemy poise');assert(poiseState.enemy_strikes>0,'Enemy must hit back under attack pressure');assert(observedGuard,'Knight must show its own shield');report.checks.poisePressure={state:poiseState,trace};await shot('knight-poise-pressure');
 // Final encounter is selected for story presentation; defeat itself uses actual enemy damage.
 await page.keyboard.press('9');await wait(s=>s.mode==='arrival'&&s.life===9);assert.equal(await enterFight(),2);
 assert([...storyLines].some(x=>x.includes('Morrow')),'Final conversation must reveal the pre-crown name');assert([...storyLines].some(x=>/earlier lives|past lives/.test(x)),'Final conversation must explicitly connect cats to the king himself');report.checks.storyLines=[...storyLines];
 const stages=new Set();const endingLines=new Set();let nineCaptured=false;const until=Date.now()+150000;let ending;
 while(Date.now()<until){ending=await state();if(ending.dialogue_text)endingLines.add(ending.dialogue_text);if(ending.mode==='ending'&&ending.stage&&!stages.has(ending.stage)){stages.add(ending.stage);await shot('ending-'+ending.stage);}if(ending.spirits_released===9&&!nineCaptured){nineCaptured=true;await shot('nine-memories-free');}if(ending.mode==='ending'&&ending.ready)break;await page.waitForTimeout(60);}
 assert(ending.mode==='ending'&&ending.ready);assert(stages.has('held-heart'));assert(stages.has('memory-reveal'));assert(stages.has('spirits'));assert.equal(ending.spirits_released,9,'All nine actual memory sprites must leave the king');assert(nineCaptured);assert(stages.has('decree'));assert(stages.has('ruined-arena'));assert([...endingLines].some(x=>x.includes('Morrow')),'King must reclaim his name before the ending nova');report.checks.ending={state:ending,stages:[...stages],lines:[...endingLines]};
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack??e);console.error(e);await shot('failure');process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();if(server)await new Promise(r=>server.close(r));console.log(JSON.stringify({ok:report.ok,errors:report.errors.length,warnings:report.warnings.length,report:resolve(out,'report.json')}));}
