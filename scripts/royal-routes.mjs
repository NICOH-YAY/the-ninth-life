// AI-use disclosure: Codex-authored production-browser full-route checks using ordinary bot inputs.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const out='output/qa/royal-routes';
await mkdir(out,{recursive:true});
const server=await preview({preview:{host:'127.0.0.1',port:5195,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',headless:true});
const report={aiUseDisclosure:'Codex-authored verification. Routes start at life one and use ordinary game inputs; no debug jumps or actor/stat overrides.',routes:{},errors:[],warnings:[],ok:false};
const context=await browser.newContext({viewport:{width:1280,height:720}});
const save=()=>writeFile(`${out}/report.json`,JSON.stringify(report,null,2));
async function route(expected,bot){
 const page=await context.newPage();
 page.on('pageerror',e=>report.errors.push({route:expected,error:String(e)}));
 page.on('console',m=>{if(m.type()==='error')report.errors.push({route:expected,error:m.text()});else if(m.type()==='warning')report.warnings.push({route:expected,message:m.text()})});
 page.on('response',r=>{if(r.status()>=400)report.errors.push({route:expected,error:`${r.status()} ${r.url()}`})});
 const started=Date.now();let prior=0;
 await page.goto(`http://127.0.0.1:5195/?mute=1&autoplay=1&speed=8&mode=scripted&seed=42&bot=${bot}`);
 await page.waitForFunction(()=>window.ninth?.scene.isActive('fight'),null,{timeout:30000});
 const first=await page.evaluate(()=>window.ninth.scene.getScene('fight').session.fightIndex);assert.equal(first,1);
 while(Date.now()-started<300000){
  const state=await page.evaluate(()=>{const s=window.ninth.scene.getScenes(true)[0];return {scene:s.scene.key,fi:s.session?.fightIndex,mode:s.mode,time:s.sim?.time,ending:s.session?.state.ending,summaries:s.session?.state.summaries?.map(x=>({life:x.lifeId,outcome:x.outcome})),ready:s.ready,ruined:s.ruined}});
  if(state.fi!==prior){console.log(JSON.stringify({route:expected,...state}));prior=state.fi}
  if(state.scene==='ending'){
   assert.equal(state.ending?.kind,expected);
   if(expected==='victory'){assert.equal(state.summaries.length,9);assert.equal(new Set(state.summaries.map(x=>x.life)).size,9);assert(state.summaries.every(x=>x.outcome==='challenger_dead'))}
   if(expected==='normal')assert.equal(state.summaries.at(-1)?.outcome,'boss_dead');
   if(expected==='do_nothing'){assert.equal(state.ending.fightIndex,1);assert.equal(state.summaries.length,1);assert.equal(state.summaries[0].life,'kitten')}
   await page.waitForFunction(()=>window.ninth.scene.getScene('ending').ready,null,{timeout:60000});
   const finale=await page.evaluate(()=>{const s=window.ninth.scene.getScene('ending');return {ready:s.ready,ruined:s.ruined,kingAlpha:s.king.alpha,visitorAlpha:s.visitor.alpha,visitorAngle:s.visitorState.angle}});
   assert(finale.ready);if(expected==='victory'){assert(!finale.ruined);assert(finale.kingAlpha>0);assert(Math.abs(finale.visitorAngle)>60)}else{assert(finale.ruined);assert.equal(finale.kingAlpha,0);assert.equal(finale.visitorAlpha,0)}
   await page.screenshot({path:`${out}/${expected}-ruins.png`});
   report.routes[expected]={...state,finale,firstLife:first,debugJump:false,productionBundles:await page.evaluate(()=>performance.getEntriesByType("resource").map(entry=>entry.name).filter(name=>/assets\/index-.*\.js/.test(name))),durationMs:Date.now()-started};await save();
   console.log(JSON.stringify({route:expected,complete:true,finale,durationMs:Date.now()-started}));
   await page.keyboard.press('Enter');await page.waitForFunction(()=>window.ninth.scene.isActive('title'),null,{timeout:10000});
   await page.close();return;
  }
  await page.waitForTimeout(800);
 }
 throw Error(`${expected} route timed out`);
}
try{await Promise.all([route('normal','normal'),route('do_nothing','idle'),route('victory','victory')]);assert.deepEqual(report.errors,[]);assert(!report.warnings.some(w=>/missing|frame|not found/i.test(w.message)));report.ok=true}
catch(error){report.failure=String(error);console.error(error);process.exitCode=1}
finally{await save();await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));console.log(JSON.stringify({ok:report.ok,routes:Object.keys(report.routes),errors:report.errors.length,warnings:report.warnings.length}))}
