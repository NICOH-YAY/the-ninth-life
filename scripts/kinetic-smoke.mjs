// AI-use disclosure: Codex-authored actual Godot keyboard-input kinetic verification.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const live=process.argv.includes('--live');
const out=resolve(repo,'output','qa',live?'kinetic-live':'kinetic');
await mkdir(out,{recursive:true});
const report={aiUseDisclosure:'Native keyboard inputs verify combat mechanics; debug encounter/phase selection is presentation-only, separate from ordinary-input ending routes.',live,checks:{},screenshots:[],errors:[],warnings:[],driverDiagnostics:[],startedAt:new Date().toISOString()};
let server;
if(!live){
 const root=resolve(repo,'build','web');
 server=createServer(async(req,res)=>{try{
  const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html');const path=resolve(root,'.'+name);
  if(!path.startsWith(root+sep))throw Error('Outside build');const body=await readFile(path);
  res.writeHead(200,{'content-type':({'.html':'text/html','.js':'text/javascript','.wasm':'application/wasm','.pck':'application/octet-stream','.png':'image/png'})[extname(path)]??'application/octet-stream','cache-control':'no-cache'});res.end(body);
 }catch{res.writeHead(404);res.end('Missing build');}});
 await new Promise(r=>server.listen(5197,'127.0.0.1',r));
}
const base=live?'https://nicoh-yay.github.io/the-ninth-life/':'http://127.0.0.1:5197/';
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:540}});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());else if(m.type()==='warning'){(m.text().includes('GPU stall due to ReadPixels')?report.driverDiagnostics:report.warnings).push(m.text());}});
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const state=()=>page.evaluate(()=>typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState);
const wait=async(test,timeout=15000)=>page.waitForFunction(source=>{const s=typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState;return s&&new Function('s','return ('+source+')(s)')(s);},test.toString(),{timeout,polling:25});
const shot=async name=>{await page.screenshot({path:resolve(out,name+'.png')});report.screenshots.push(name+'.png');};
const openingStages=new Set();
const enterFight=async()=>{
 const deadline=Date.now()+120000;let answered=0;
 while(Date.now()<deadline){const s=await state();if(s.mode==='opening'&&['crossed-steel','blast-back','counter-thrust','old-king-pierced','crown-held','crown-burst'].includes(s.stage)&&!openingStages.has(s.stage)){openingStages.add(s.stage);await shot('opening-'+s.stage);}if(s.mode==='fight')return answered;if(s.choices){await page.keyboard.press('Enter');answered++;await wait(s=>!s.choices,5000);}await page.waitForTimeout(80);}
 throw Error('Native opening/dialogue did not lead to fight');
};
const jump=async heldMs=>{
 await wait(s=>s.grounded);await page.keyboard.down('Space');const start=Date.now();let peak=0,released=false;const seen=[];
 while(Date.now()-start<1600){if(!released&&Date.now()-start>=heldMs){await page.keyboard.up('Space');released=true;}const s=await state();peak=Math.max(peak,s.y);seen.push({y:s.y,grounded:s.grounded,steps:s.player_steps});if(released&&s.grounded&&Date.now()-start>300)break;await page.waitForTimeout(20);}
 await page.keyboard.up('Space');return{peak,samples:seen};
};
try{
 await page.goto(base+'?debug=1&mode=scripted&seed=42&kinetic='+Date.now());await wait(s=>s.mode==='menu',90000);
 report.checks.engine=(await state()).engine;assert(report.checks.engine.includes('Godot'));
 await page.keyboard.press('Enter');report.checks.initialChoices=await enterFight();assert.equal(report.checks.initialChoices,2);report.checks.openingStages=[...openingStages];assert(openingStages.has('old-king-pierced'),'Opening must show the original king physically pierced');
 const initial=await state();assert.equal(initial.life,1);report.checks.baseActor=initial.king_actor;report.checks.baseSprite=initial.king_sprite_path;
 await shot('base-king');
 for(let n=0;n<3;n++){await page.keyboard.press('j');await page.waitForTimeout(80);}
 await wait(s=>s.combo_history.length>=3,5000);const combo=await state();
 assert.deepEqual(combo.combo_history.slice(0,3),[0,1,2],'Three quick real J taps must buffer all three distinct strikes');report.checks.fastThreeTapCombo=combo.combo_history;
 await shot('third-combo-strike');await page.waitForTimeout(600);
 const short=await jump(30);const high=await jump(400);
 assert(high.peak>short.peak+20,'Holding jump must produce a visibly higher arc');report.checks.variableJump={shortPeak:short.peak,heldPeak:high.peak};
 for(const result of [short,high]){const air=result.samples.filter(s=>s.y>5&&!s.grounded);assert(air.length>=2);assert.equal(new Set(air.map(s=>s.steps)).size,1,'Standing airborne jumps must not create floor footsteps');}
 await page.keyboard.down('a');await page.waitForTimeout(250);const moving=await state();assert(moving.x<initial.x-25);assert(Math.abs(moving.vx)>100);await page.keyboard.up('a');await page.waitForTimeout(300);assert(Math.abs((await state()).vx)<20);report.checks.movement={moving,stopped:await state()};
 await page.keyboard.down('a');await page.keyboard.press('Shift');await page.waitForTimeout(100);await shot('kinetic-dash');await page.keyboard.up('a');await wait(s=>s.dashes>0);
 await page.keyboard.press('p');await wait(s=>s.phase===2&&s.king_actor==='ascended',10000);const second=await state();
 assert(second.king_sprite_path&&second.king_sprite_path!==initial.king_sprite_path,'Ascended king must use a distinct sprite sheet');report.checks.secondForm={actor:second.king_actor,sprite:second.king_sprite_path,labels:second.move_labels};
 assert(second.move_labels.some(x=>x.includes('Vacant Step')));assert(second.move_labels.some(x=>x.includes('Unmoored')));await shot('ascended-king');
 await page.keyboard.press('k');await wait(s=>s.active_move==='throw',3000);await page.waitForTimeout(250);await shot('crownfall');await page.waitForTimeout(800);
 await page.keyboard.press('l');await wait(s=>s.active_move==='reap',3000);await page.waitForTimeout(550);await shot('royal-undertow');
 await page.keyboard.press('4');await wait(s=>s.mode==='arrival'&&s.life===4,5000);assert.equal(await enterFight(),2);
 await page.keyboard.down('g');await page.keyboard.down('a');await page.waitForTimeout(750);await page.keyboard.up('a');
 const trace=[];const deadline=Date.now()+18000;let enemy;
 while(Date.now()<deadline){enemy=await state();trace.push({state:enemy.enemy_state,dashes:enemy.enemy_dashes,strikes:enemy.enemy_strikes,abilities:enemy.enemy_abilities,steps:enemy.enemy_steps,hp:enemy.boss_hp});if(enemy.enemy_dashes>0&&enemy.enemy_strikes>=2&&enemy.enemy_abilities>0)break;assert.equal(enemy.mode,'fight');await page.waitForTimeout(100);}
 await page.keyboard.up('g');assert(enemy.enemy_dashes>0,'Later enemy must proactively dash');assert(enemy.enemy_strikes>=2,'Later enemy must chain real strikes');assert(enemy.enemy_abilities>0,'Later enemy must use its unique skill');assert(enemy.enemy_steps>0,'Ground traversal produces footstep events');report.checks.enemy={state:enemy,trace};await shot('proactive-acrobat');
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack??e);console.error(e);await shot('failure');process.exitCode=1;}
finally{report.finishedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();if(server)await new Promise(r=>server.close(r));console.log(JSON.stringify({ok:report.ok,errors:report.errors.length,warnings:report.warnings.length,report:resolve(out,'report.json')}));}
