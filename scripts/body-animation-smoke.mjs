// AI-use disclosure: Codex-authored actual Godot physical-body animation verification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const live=process.argv.includes('--live');
const out=resolve(repo,'output','qa',live?'body-animation-live':'body-animation');
await mkdir(out,{recursive:true});
const report={aiUseDisclosure:'Native keypresses verify actual body preparation regions, arrival/combat walking and short real-time anticipation; debug encounter/phase selection is presentation-only.',live,checks:{},screenshots:[],errors:[],warnings:[],driverDiagnostics:[],startedAt:new Date().toISOString()};
let server;
if(!live){
 const root=resolve(repo,'build','web');
 server=createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html');const path=resolve(root,'.'+name);
  if(!path.startsWith(root+sep))throw Error('Outside build');const body=await readFile(path);
  res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.pck':'application/octet-stream','.png':'image/png'})[extname(path)]??'application/octet-stream','cache-control':'no-cache'});res.end(body);
 }catch{res.writeHead(404);res.end('Missing build');}});
 await new Promise(r=>server.listen(5199,'127.0.0.1',r));
}
const base=live?'https://nicoh-yay.github.io/the-ninth-life/':'http://127.0.0.1:5199/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:540}});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());else if(m.type()==='warning'){(m.text().includes('GPU stall due to ReadPixels')?report.driverDiagnostics:report.warnings).push(m.text());}});
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const state=()=>page.evaluate(()=>typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState);
const wait=async(test,timeout=15000)=>page.waitForFunction(source=>{const s=typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState;return s&&new Function('s','return ('+source+')(s)')(s);},test.toString(),{timeout,polling:25});
const shot=async name=>{await page.screenshot({path:resolve(out,name+'.png')});report.screenshots.push(name+'.png');};

const sample=async(duration,visit)=>{const end=Date.now()+duration;while(Date.now()<end){await visit(await state());await page.waitForTimeout(8);}};
const enterFight=async label=>{
 const frames=new Set(),regions=new Set(),positions=[];let answered=0,captured=false;const end=Date.now()+120000;
 while(Date.now()<end){const s=await state();if(s.mode==='fight')break;
  if(['entrance','arrival'].includes(s.mode)&&['walk','run'].includes(s.enemy_motion)){frames.add(s.enemy_frame);regions.add(s.enemy_region);positions.push(s.enemy_render_x??s.enemy_x);if(frames.size>=3&&!captured){captured=true;await shot(label+'-arrival-walk');}}
  if(s.choices){await page.keyboard.press('Enter');answered++;await wait(s=>!s.choices,5000);}await page.waitForTimeout(20);
 }
 assert.equal((await state()).mode,'fight');assert.equal(answered,2);if(label==='tutorial'){assert(frames.size>=3,label+' entrance must advance through real walk frames');assert(regions.size>=3,label+' entrance must select distinct walk texture regions');assert(Math.max(...positions)-Math.min(...positions)>50);}report.checks[label+'Arrival']={frames:[...frames],regions:[...regions],distance:positions.length?Math.max(...positions)-Math.min(...positions):null};
};
const enemyWalk={frames:new Set(),regions:new Set(),positions:[]};
const collectEnemy=s=>{if(s.mode==='fight'&&['walk','run'].includes(s.enemy_motion)){enemyWalk.frames.add(s.enemy_frame);enemyWalk.regions.add(s.enemy_region);enemyWalk.positions.push(s.enemy_x);}};
const walk=async(key,label)=>{
 const initial=await state();let reposition='';
 if(key==='d'&&initial.x>720)reposition='a';else if(key==='a'&&initial.x<240)reposition='d';
 if(reposition){
  await page.keyboard.down(reposition);const until=Date.now()+2500;
  while(Date.now()<until){const s=await state();if(reposition==='a'?s.x<=600:s.x>=360)break;await page.waitForTimeout(12);}
  await page.keyboard.up(reposition);await page.waitForTimeout(160);
 }
 const start=await state(),frames=new Set(),regions=new Set(),positions=[],trace=[];
 await page.keyboard.down(key);const until=Date.now()+1400;
 while(Date.now()<until){const s=await state();collectEnemy(s);trace.push({x:s.x,vx:s.vx,motion:s.actor_motion,frame:s.actor_frame,move:s.active_move,grounded:s.grounded});
  if(['walk','run','glide'].includes(s.actor_motion)){frames.add(s.actor_frame);regions.add(s.actor_region);positions.push(s.x);}
  if(frames.size>=6&&[...frames].some(f=>f>=6)&&Math.max(...positions)-Math.min(...positions)>=100)break;
  await page.waitForTimeout(8);
 }
 await page.keyboard.up(key);const distance=Math.max(...positions)-Math.min(...positions);
 report.checks[label]={initialX:initial.x,repositionKey:reposition,startX:start.x,endX:(await state()).x,frames:[...frames],regions:[...regions],distance,trace};
 assert(frames.size>=6&&[...frames].some(f=>f>=6),label+' must use the second half of its real12-frame gait');assert(regions.size>=6,label+' must change rendered atlas regions across the12-frame cycle');assert(distance>50,label+' must physically move over50px with travel room');await shot(label);
};
const guardOpening=async()=>{await wait(s=>s.enemy_attack_in>0.20&&s.enemy_attack_in<0.65,20000);const previous=(await state()).enemy_strikes;await page.keyboard.down('g');const end=Date.now()+3000;while(Date.now()<end&&(await state()).enemy_strikes===previous)await page.waitForTimeout(15);await page.keyboard.up('g');};
const prepare=async(key,id,label)=>{
 const attempts=[];
 for(let attempt=0;attempt<3;attempt++){
  await wait(s=>!s.active_move,10000);await page.keyboard.press(key);const frames=new Set(),regions=new Set(),samples=[];const end=Date.now()+2500;let seen=false;
  while(Date.now()<end){const s=await state();collectEnemy(s);
   if(s.active_move===id&&s.player_move_stage==='tell'){
    seen=true;assert(s.actor_motion.startsWith('prepare_')&&s.actor_frame<=5,label+' tell must use physical sword preparation frames');assert(!s.telegraphs.some(t=>['sweep','thrust'].includes(t.kind)),label+' basic tell must have no projected attack/hologram');frames.add(s.actor_frame);regions.add(s.actor_region);samples.push({motion:s.actor_motion,frame:s.actor_frame,region:s.actor_region,path:s.king_sprite_path,tell:s.telegraphs});
   }else if(seen)break;
   await page.waitForTimeout(6);
  }
  attempts.push({frames:[...frames],regions:[...regions],samples});
  if(frames.size>=3&&regions.size>=3){report.checks[label]={attempts};return;}
  await guardOpening();
 }
 assert.fail(label+' must visibly draw at least three different physical preparation frames at its real short timing: '+JSON.stringify(attempts));
};
try{
 await page.goto(base+'?debug=1&mode=scripted&seed=42&bodyanimation='+Date.now());await wait(s=>s.mode==='menu',90000);report.checks.engine=(await state()).engine;
 await page.keyboard.press('Enter');await enterFight('tutorial');
 await walk('d','king-walk-right');await walk('a','king-walk-left');
 assert(enemyWalk.frames.size>=6&&enemyWalk.regions.size>=6&&[...enemyWalk.frames].some(f=>f>=6),'Enemy combat approach must use actual12-frame feet, not frozen or six-frame walking');report.checks.tutorialCombatWalk={frames:[...enemyWalk.frames],regions:[...enemyWalk.regions]};
 await guardOpening();await prepare('j','cleave','base-sword-body-preparation');await prepare('k','throw','base-thrust-body-preparation');
 await page.keyboard.press('p');await wait(s=>s.phase===2&&s.king_actor==='ascended',10000);await walk('d','ascended-walk');
 await guardOpening();await prepare('j','cleave','ascended-sword-body-preparation');await prepare('k','throw','ascended-crownfall-body-preparation');
 await shot('ascended-body-followthrough');
 await page.keyboard.press('6');await wait(s=>s.mode==='arrival'&&s.life===6);await enterFight('knight');
 const visitorFrames=new Set(),visitorRegions=new Set(),walkingFrames=new Set();const end=Date.now()+12000;let pictured=false;
 while(Date.now()<end){const s=await state();if(['walk','run'].includes(s.enemy_motion))walkingFrames.add(s.enemy_frame);if(s.enemy_motion==='prepare'){visitorFrames.add(s.enemy_frame);visitorRegions.add(s.enemy_region);if(visitorFrames.size>=3&&!pictured){pictured=true;await shot('knight-physical-windup');}}if(visitorFrames.size>=3&&visitorRegions.size>=3)break;await page.waitForTimeout(8);}
 assert(visitorFrames.size>=3&&visitorRegions.size>=3,'Enemy tell must draw its own changing weapon preparation frames');report.checks.knightCombatBody={walkFrames:[...walkingFrames],prepareFrames:[...visitorFrames],prepareRegions:[...visitorRegions]};
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack??e);console.error(e);await shot('failure');process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();if(server)await new Promise(r=>server.close(r));console.log(JSON.stringify({ok:report.ok,errors:report.errors.length,warnings:report.warnings.length,report:resolve(out,'report.json')}));}
