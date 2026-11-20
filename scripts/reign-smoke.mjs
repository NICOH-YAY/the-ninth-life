// AI-use disclosure: Codex-authored actual Godot reign, entrances, shield exhaustion and levitation verification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const live=process.argv.includes('--live');
const out=resolve(repo,'output','qa',live?'reign-live':'reign');
await mkdir(out,{recursive:true});
const report={aiUseDisclosure:'Native keypresses verify staged entrances, next-hit shield break, parry recovery, weighted landing, logical hover and actual summoned hazards. Debug selections are presentation-only.',live,checks:{},screenshots:[],errors:[],warnings:[],driverDiagnostics:[],startedAt:new Date().toISOString()};
let server;
if(!live){
 const root=resolve(repo,'build','web');
 server=createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html');const path=resolve(root,'.'+name);
  if(!path.startsWith(root+sep))throw Error('Outside build');const body=await readFile(path);
  res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.pck':'application/octet-stream','.png':'image/png'})[extname(path)]??'application/octet-stream','cache-control':'no-cache'});res.end(body);
 }catch{res.writeHead(404);res.end('Missing build');}});
 await new Promise(r=>server.listen(5200,'127.0.0.1',r));
}
const base=live?'https://nicoh-yay.github.io/the-ninth-life/':'http://127.0.0.1:5200/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:540}});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());else if(m.type()==='warning'){(m.text().includes('GPU stall due to ReadPixels')?report.driverDiagnostics:report.warnings).push(m.text());}});
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const state=()=>page.evaluate(()=>typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState);
const wait=async(test,timeout=15000)=>page.waitForFunction(source=>{const s=typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState;return s&&new Function('s','return ('+source+')(s)')(s);},test.toString(),{timeout,polling:25});
const shot=async name=>{await page.screenshot({path:resolve(out,name+'.png')});report.screenshots.push(name+'.png');};


const IDS=['lantern','breath','tide','fall','grave_gate','blood_gate','shadow','silence','names'];
const observeEntrance=async(index,label)=>{
 await wait(s=>s.mode==='entrance',90000);assert.equal((await state()).life,index+1);
 const stages=new Set();let minHp=Infinity,maxDanger=0,pictured=false;const started=Date.now(),end=started+15000;let s;
 while(Date.now()<end){s=await state();assert(s.boss_hp>0,'A staged entrance must never kill or softlock the king');minHp=Math.min(minHp,s.boss_hp);if(s.entrance?.id)assert.equal(s.entrance.id,IDS[index]);if(s.entrance?.stage)stages.add(s.entrance.stage);maxDanger=Math.max(maxDanger,s.entrance?.danger_count??0);assert(!s.choices,'Entrance action must resolve before dialogue choices');if(!pictured&&stages.size>=2){pictured=true;await shot('entrance-'+label+'-'+IDS[index]);}if(s.mode==='arrival')break;assert.equal(s.mode,'entrance');await page.waitForTimeout(20);}
 assert.equal(s.mode,'arrival','Every distinct entrance must resolve in bounded time');assert(stages.size>=2);assert.equal(s.boss_hp,700,'Entrances must restore full fair-start health before dialogue/fight');report.checks['entrance-'+label]={id:s.entrance.id,stages:[...stages],minHp,restoredHp:s.boss_hp,danger:maxDanger,durationMs:Date.now()-started};
};
const enterFight=async()=>{let count=0;const end=Date.now()+120000;while(Date.now()<end){const s=await state();if(s.mode==='fight'){assert.equal(count,2);return s;}if(s.choices){await page.keyboard.press('Enter');count++;await wait(s=>!s.choices,5000);}await page.waitForTimeout(30);}throw Error('Two native exchanges failed to lead into combat');};
try{
 await page.goto(base+'?debug=1&mode=scripted&seed=42&reign='+Date.now());await wait(s=>s.mode==='menu',90000);await page.keyboard.press('Enter');await observeEntrance(0,'first');
 for(let i=1;i<9;i++){await page.keyboard.press(String(i+1));await observeEntrance(i,String(i+1));}
 assert.equal(new Set(Object.values(report.checks).filter(v=>v?.id).map(v=>v.id)).size,9,'All nine actual mini-boss entrance identities must be distinct');
 await page.keyboard.press('1');await observeEntrance(0,'tutorial-return');const fight=await enterFight();assert(fight.vow&&fight.max_guard===0.5,'The chosen oath must trade real guard capacity for damage this fight');report.checks.vow=fight;
 await page.keyboard.down('g');await wait(s=>s.guard_exhausted&&s.guard===0&&s.guarding&&s.guard_breaks===0,25000);const empty=await state();report.checks.emptyRaisedShield=empty;await shot('exhausted-shield-awaiting-contact');
 await wait(s=>s.guard_breaks>0,25000);const broken=await state();assert(broken.guard_broken>0.65&&broken.action_locked);assert(!broken.guarding);report.checks.nextHitBreak=broken;await page.keyboard.press('j');await page.waitForTimeout(100);const locked=await state();assert(locked.action_locked&&!locked.active_move&&!locked.guarding,'Broken-shield opening must reject instant attacks or re-guard');report.checks.breakRecoveryLock=locked;await shot('shield-break-recovery');
 await page.waitForTimeout(1200);assert.equal((await state()).guard,0,'Holding G must not regenerate an exhausted shield');await page.keyboard.up('g');await wait(s=>s.guard_broken<=0&&s.guard>s.max_guard*0.70,18000);report.checks.releasedRecovery=await state();
 const previous=(await state()).perfect_blocks;const attempts=[];
 for(let n=0;n<6&&(await state()).perfect_blocks===previous;n++){
  await wait(s=>s.enemy_attack_in>0.15&&s.enemy_attack_in<0.50,25000);const end=Date.now()+1600;
  while(Date.now()<end){const s=await state();if(s.enemy_attack_in>0&&s.enemy_attack_in<=0.10)break;await page.waitForTimeout(8);}
  await page.keyboard.down('g');await page.waitForTimeout(145);const s=await state();attempts.push(s);if(s.perfect_blocks>previous)break;await page.keyboard.up('g');await page.waitForTimeout(350);
 }
 assert((await state()).perfect_blocks>previous,'Fresh timed guard must still parry after exhaustion/recovery');report.checks.perfectAfterBreak={state:await state(),attempts};await shot('perfect-after-shield-break');await page.keyboard.up('g');
 await page.keyboard.down('Space');await page.waitForTimeout(280);await page.keyboard.up('Space');await wait(s=>s.grounded&&s.land_timer>0.065,6000);report.checks.weightedLanding=await state();await shot('weighted-ground-landing');
 await page.keyboard.press('p');await wait(s=>s.phase===2&&s.hovering&&s.y>=55,12000);const hoverStart=await state();assert(hoverStart.shadow_visible&&!hoverStart.grounded);await page.keyboard.down('a');const frames=new Set();const end=Date.now()+900;
 while(Date.now()<end){const s=await state();assert(s.y>=50&&s.hovering);frames.add(s.actor_frame);await page.waitForTimeout(12);}await page.keyboard.up('a');const hovered=await state();assert.equal(hovered.player_steps,hoverStart.player_steps,'Gliding must not make grounded footstep contacts');assert(hovered.shadow_visible);report.checks.logicalHover={before:hoverStart,after:hovered,frames:[...frames]};await shot('logical-floating-sovereign');
 await page.keyboard.press('5');await observeEntrance(4,'grave-power');await enterFight();await wait(s=>s.power?.busy&&s.power.auxiliary,20000);const summon=await state();assert(summon.power.hazards.some(h=>h.kind==='grave-knight-slam'&&h.real));report.checks.realGraveSummon=summon;await shot('actual-grave-knight-power');
 await wait(s=>s.cost_paid>0&&s.power.recovering,15000);report.checks.sacrificeOpening=await state();assert((await state()).enemy_hp<(await state()).enemy_max,'The cast must pay its own health sacrifice and open real recovery');await shot('power-sacrifice-recovery');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack??e);console.error(e);await shot('failure');process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();if(server)await new Promise(r=>server.close(r));console.log(JSON.stringify({ok:report.ok,errors:report.errors.length,warnings:report.warnings.length,report:resolve(out,'report.json')}));}
