// AI-use disclosure: Codex-authored bounded ordinary-input repetition benchmark for native Godot.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';
const bot=process.argv.includes('--bot=victory')?'victory':'mash';
const repo=resolve(dirname(fileURLToPath(import.meta.url)),'..'),root=resolve(repo,'build/web'),out=resolve(repo,'output/qa/'+(bot==='mash'?'mash':'royal-strategy'));
await mkdir(out,{recursive:true});
const report={aiUseDisclosure:'Bounded ordinary native autoplay policy, selected by bot: mash pursues and holds basic attack after required tutorial actions; victory uses ordinary mixed actions. No debug encounter selection, health changes, resource cheats, or guaranteed-outcome assertion.',preliminary:process.argv.includes('--preliminary'),bot,checks:{},lives:{},errors:[],warnings:[],driverDiagnostics:[],startedAt:new Date().toISOString()};
const server=createServer(async(req,res)=>{try{const name=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/\/$/,'/index.html'),path=resolve(root,'.'+name);if(!path.startsWith(root+sep))throw Error('Outside export');const bytes=await readFile(path);res.writeHead(200,{'content-type':({'.wasm':'application/wasm','.js':'text/javascript','.html':'text/html'})[extname(path)]??'application/octet-stream'});res.end(bytes);}catch{res.writeHead(404);res.end('Missing export');}});
await new Promise(r=>server.listen(5201,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true,args:['--enable-webgl','--ignore-gpu-blocklist','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const page=await browser.newPage({viewport:{width:960,height:540}});
page.on('pageerror',e=>report.errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());else if(m.type()==='warning')(m.text().includes('GPU stall due to ReadPixels')?report.driverDiagnostics:report.warnings).push(m.text());});
page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
const state=()=>page.evaluate(()=>typeof window.ninthState==='string'?JSON.parse(window.ninthState):window.ninthState);
try{
 await page.goto('http://127.0.0.1:5201/?autoplay=1&speed=8&bot='+bot+'&mode=scripted&seed=42&qa='+Date.now());
 const until=Date.now()+180000;let s;
 while(Date.now()<until){
  s=await state();if(s?.mode==='fight'){
   const life=report.lives[s.life]??={visitor:s.visitor,minHp:s.boss_hp,maxHp:s.boss_hp,enemyMinHp:s.enemy_hp,samples:0,firstAt:Date.now(),lastAt:Date.now()};
   life.minHp=Math.min(life.minHp,s.boss_hp);life.maxHp=Math.max(life.maxHp,s.boss_hp);life.enemyMinHp=Math.min(life.enemyMinHp,s.enemy_hp);life.samples++;life.lastAt=Date.now();
  }
  if(s?.mode==='ending'&&s.ready)break;
  await page.waitForTimeout(100);
 }
 assert(s&&String(s.engine).includes('Godot'),'Must run the real Godot engine');
 report.final=s;report.complete=!!(s.mode==='ending'&&s.ready);report.checks.reachedLives=Object.keys(report.lives).map(Number);report.checks.tookRealDamage=Object.values(report.lives).some(l=>l.minHp<l.maxHp-1);assert(Object.keys(report.lives).length,'Policy must reach actual combat');
 await page.screenshot({path:resolve(out,'bounded-result.png')});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.ok=true;
}catch(e){report.ok=false;report.failure=String(e.stack??e);process.exitCode=1;console.error(e);}
finally{report.finishedAt=new Date().toISOString();await writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));await browser.close();await new Promise(r=>server.close(r));console.log(JSON.stringify({ok:report.ok,complete:report.complete,lives:report.checks.reachedLives,ending:report.final?.ending,errors:report.errors.length,warnings:report.warnings.length}));}
