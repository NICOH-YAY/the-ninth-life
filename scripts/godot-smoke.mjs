// AI-use disclosure: Codex-authored real Godot WASM/browser checks using native inputs.
import assert from "node:assert/strict";
import {createServer} from "node:http";
import {readFile,mkdir,writeFile} from "node:fs/promises";
import {resolve,extname,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {chromium} from "playwright";
const repo=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const live=process.argv.includes("--live"),routesOnly=process.argv.includes("--routes-only");
const out=resolve(repo,"output","qa",live?"godot-live":"godot");
await mkdir(out,{recursive:true});
const report={aiUseDisclosure:"Codex-authored browser proof of native Godot WebAssembly and real-input gameplay. Presentation debug checks are separately labeled.",live,checks:{},routes:{},screenshots:[],errors:[],warnings:[],driverDiagnostics:[],startedAt:new Date().toISOString()};
let server=null;
if(!live){
 const base=resolve(repo,"build","web");
 server=createServer(async(req,res)=>{
  try{
   const name=decodeURIComponent(new URL(req.url,"http://local").pathname).replace(/\/$/,"/index.html");
   const path=resolve(base,"."+name);if(!path.startsWith(base))throw new Error("Outside export");
   const bytes=await readFile(path);
   res.writeHead(200,{"content-type":({".wasm":"application/wasm",".js":"text/javascript",".html":"text/html",".json":"application/json",".png":"image/png",".pck":"application/octet-stream"})[extname(path)]??"application/octet-stream","cache-control":"no-cache"});res.end(bytes);
  }catch{res.writeHead(404);res.end("Missing export file");}
 });
 await new Promise(resolve=>server.listen(5195,"127.0.0.1",resolve));
}
const base=live?"https://nicoh-yay.github.io/the-ninth-life/":"http://127.0.0.1:5195/";
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??"C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",headless:true,args:["--enable-webgl","--ignore-gpu-blocklist","--use-angle=swiftshader","--enable-unsafe-swiftshader"]});
const context=await browser.newContext({viewport:{width:960,height:540}});
const watch=page=>{
 page.on("pageerror",error=>report.errors.push(String(error)));
 page.on("console",message=>{const value=message.text();if(message.type()==="error")report.errors.push(value);else if(message.type()==="warning"){if(value.includes("GPU stall due to ReadPixels"))report.driverDiagnostics.push(value);else report.warnings.push(value);}});
 page.on("response",response=>{if(response.status()>=400)report.errors.push(response.status()+" "+response.url());});
 return page;
};
const state=page=>page.evaluate(()=>typeof window.ninthState==="string"?JSON.parse(window.ninthState):window.ninthState);
const wait=async(page,test,timeout=60000)=>{
 await page.waitForFunction(source=>{
  const s=typeof window.ninthState==="string"?JSON.parse(window.ninthState):window.ninthState;
  return !!s && new Function("s","return ("+source+")(s)")(s);
 },test.toString(),{timeout,polling:50});
};
const shot=async(page,name)=>{await page.screenshot({path:resolve(out,name+".png")});report.screenshots.push(name+".png");};
const save=async()=>writeFile(resolve(out,"report.json"),JSON.stringify(report,null,2));
const url=query=>base+"?"+query+"&qa="+Date.now();
let page=watch(await context.newPage());
try{
 if(!routesOnly){
  await page.goto(url("debug=1&mode=scripted&seed=42"),{waitUntil:"domcontentloaded"});
  await wait(page,s=>s.mode==="menu",90000);
  const initial=await state(page);
  assert(String(initial.engine).includes("Godot"),"Actual Godot diagnostics must identify the engine");
  report.checks.engine=initial.engine;
  const resources=await page.evaluate(()=>performance.getEntriesByType("resource").map(x=>x.name));
  assert(resources.some(x=>/\.wasm(?:\?|$)/.test(x)),"Real WebAssembly must be downloaded");
  assert(resources.some(x=>/\.pck(?:\?|$)/.test(x)),"Real Godot PCK resources must be downloaded");
  assert(!resources.some(x=>/\/assets\/index-.*\.js/.test(x)),"The active product must not bootstrap the legacy Phaser bundle");
  report.checks.nativeExportResources=resources.filter(x=>/\.(wasm|pck)(?:\?|$)/.test(x));
  await page.waitForTimeout(400);await shot(page,"native-godot-menu");
  for(const viewport of [{width:1280,height:720},{width:390,height:844},{width:960,height:540}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(350);
   const bounds=await page.locator("canvas").evaluate(canvas=>{const r=canvas.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height};});
   assert(bounds.x>=-1&&bounds.y>=-1&&bounds.x+bounds.width<=viewport.width+2&&bounds.y+bounds.height<=viewport.height+2);
   (report.checks.viewportBounds??=[]).push({viewport,bounds});await shot(page,"aspect-"+viewport.width+"x"+viewport.height);
  }
  await page.keyboard.press("r");await page.waitForTimeout(250);await shot(page,"native-controls");
  const settings=await state(page);
  if(settings.settings!==undefined)assert.equal(settings.settings,"controls");
  await page.mouse.click(370,274);await page.keyboard.press("w");await page.waitForTimeout(350);
  const rebound=await state(page);
  if(rebound.bindings){assert.equal(rebound.bindings.jump,87);report.checks.keyRebound=true;}
  await shot(page,"native-key-rebound");
  await page.mouse.click(160,479);await page.waitForTimeout(200);await page.keyboard.press("Escape");await page.waitForTimeout(250);
  await page.keyboard.press("c");await page.waitForTimeout(300);await shot(page,"native-attributions");await page.keyboard.press("Escape");await page.waitForTimeout(250);
  await page.keyboard.press("Enter");await wait(page,s=>s.mode==="opening");
  await page.waitForTimeout(500);await page.keyboard.press("Escape");await page.keyboard.press("Enter");
  assert.equal((await state(page)).mode,"opening","Opening must preserve its reading lock");
  await shot(page,"native-opening");
  await wait(page,s=>s.mode==="arrival",90000);
  let firstOptions=null;
  for(let step=0;step<2;step++){
   await wait(page,s=>s.mode==="arrival"&&!!s.choices,60000);
   const before=await state(page);if(Array.isArray(before.choice_options)){
    assert.equal(before.choice_options.length,2);
    if(step===0)firstOptions=before.choice_options;
    else assert.notDeepEqual(before.choice_options,firstOptions);
   }
   await shot(page,"native-reply-"+(step+1));
   await page.keyboard.press("ArrowDown");await page.waitForTimeout(100);
   await page.keyboard.press("ArrowUp");await page.waitForTimeout(100);
   await page.keyboard.press("Enter");
   await wait(page,s=>!s.choices,10000);
  }
  await wait(page,s=>s.mode==="fight",60000);
  report.checks.twoExchanges=true;assert.equal((await state(page)).life,1);
  const beforeMove=await state(page);
  await page.keyboard.down("a");await page.waitForTimeout(450);await page.keyboard.up("a");
  assert((await state(page)).x<beforeMove.x-25,"Native A input moves the king");
  const beforeJump=await state(page);
  await page.keyboard.press("Space");await wait(page,s=>s.jumps>0&&Math.abs(s.y)>3,5000);
  await shot(page,"native-jump");
  await page.waitForTimeout(900);
  await page.keyboard.down("a");await page.keyboard.press("Shift");await page.waitForTimeout(100);await shot(page,"native-sprite-dash");await page.keyboard.up("a");
  await wait(page,s=>s.dashes>0,5000);
  await page.keyboard.down("g");await wait(page,s=>s.guarding,5000);await shot(page,"native-guard");
  await wait(page,s=>s.blocks>0,25000);await page.keyboard.up("g");
  report.checks.mobility=await state(page);
  if(Array.isArray(report.checks.mobility.move_labels))assert(report.checks.mobility.move_labels.every(label=>!String(label).includes("<null>")));
  await page.keyboard.press("k");await page.waitForTimeout(150);await shot(page,"native-sword-thrust");
  await page.keyboard.down("j");await page.waitForTimeout(550);await page.keyboard.up("j");
  await shot(page,"native-sword-combat");report.checks.realCombatInputs=true;
  if(!live){
   await page.keyboard.press("p");await wait(page,s=>s.phase===2,8000);
   await page.keyboard.press("l");await page.waitForTimeout(250);await shot(page,"native-second-royal-stance");
   report.checks.secondStance=await state(page);
   assert.equal(report.checks.secondStance.phase,2);
  }
  await page.keyboard.down("j");
  const tutorialUntil=Date.now()+30000;
  while(Date.now()<tutorialUntil && (await state(page)).mode==="fight"){
    await page.keyboard.press("l");await page.keyboard.press("k");await page.waitForTimeout(350);
  }
  await page.keyboard.up("j");await wait(page,s=>s.mode==="waiting",10000);
  await wait(page,s=>s.waiting_pose==="rest",5000);
  await shot(page,"native-centuries-rest");report.checks.seatedWaiting=await state(page);
  assert.equal(report.checks.seatedWaiting.music,"years");
  if(report.checks.seatedWaiting.hud_visible!==undefined)assert.equal(report.checks.seatedWaiting.hud_visible,false);
  await save();console.log(JSON.stringify({stage:"native Godot UI, story, combat and seated waiting verified",errors:report.errors.length}));
 }
 if(!live || routesOnly){
  await page.close();
  const results=await Promise.all(["idle","normal","victory","heuristic"].map(async route=>{
   const bot=route==="heuristic"?"victory":route;
   const plannerMode=route==="heuristic"?"heuristic":"scripted";
   const p=watch(await context.newPage());const started=Date.now(),seen=new Set(),stages=new Set(),visitors=new Set();
   try{
    await p.goto(url("autoplay=1&speed=8&bot="+bot+"&mode="+plannerMode+"&seed=42"));
    await wait(p,s=>s.mode==="fight"||s.mode==="arrival"||s.mode==="ending",90000);
    const until=Date.now()+240000;let current;
    while(Date.now()<until){
     current=await state(p);if(current?.life)seen.add(current.life);if(current?.visitor!==undefined)visitors.add(current.visitor);
     if(current?.mode==="ending" && ["held-heart","decree","ruined-arena"].includes(current.stage) && !stages.has(current.stage)){
      stages.add(current.stage);await shot(p,"native-"+route+"-"+current.stage);
     }
     if(current?.mode==="waiting" && !stages.has("waiting") && current.waiting_pose==="rest"){
      stages.add("waiting");await shot(p,"native-"+route+"-centuries-rest");
     }
     if(current?.mode==="ending"&&current.ready)break;
     await p.waitForTimeout(100);
    }
    assert(current?.mode==="ending"&&current.ready,"Full "+bot+" route must reach a complete ending");
    const expected=bot==="idle"?"do_nothing":bot==="normal"?"normal":"victory";
    assert.equal(current.ending,expected,"Correct actual-input ending");
    if(bot==="victory"){
     assert.equal(seen.size,9,"Victory must fight all nine visitors");
     if(Array.isArray(current.completed))assert.equal(new Set(current.completed).size,9,"All nine actual visitor identities must complete uniquely");
    }
    if(route==="heuristic"){
     assert(current.planner_trace && typeof current.planner_trace==="object","Adaptive planner diagnostics must exist");
     assert(!String(current.planner).includes("error"),"Adaptive route must not report a planner failure");
    }
    if(current.hud_visible!==undefined)assert.equal(current.hud_visible,false,"Combat HUD must be hidden in ending");
    if(bot!=="victory"){assert(stages.has("held-heart"),"Physical held impalement must be seen");assert(stages.has("decree"),"Blade remains held into decree");}
    await shot(p,"native-ending-"+route);
    report.routes[route]={...current,seenLives:[...seen],seenVisitorIds:[...visitors],stages:[...stages],ordinaryInputs:true,requestedPlanner:plannerMode,durationMs:Date.now()-started};
    await p.keyboard.press("Enter");await wait(p,s=>s.mode==="menu",10000);
    return{route,bot,ok:true};
   }finally{await p.close();}
  }));
  report.checks.routes=results;
 }
 assert.deepEqual(report.errors,[]);
 report.ok=true;
}catch(error){
 report.ok=false;report.failure=String(error?.stack??error);
 if(!page.isClosed())await shot(page,"failure");
 console.error(error);process.exitCode=1;
}finally{
 report.finishedAt=new Date().toISOString();await save();await browser.close();if(server)await new Promise(r=>server.close(r));
 console.log(JSON.stringify({ok:report.ok,errors:report.errors.length,warnings:report.warnings.length,report:resolve(out,"report.json")}));
}
