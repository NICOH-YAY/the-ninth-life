// AI-use disclosure: Codex-authored production-browser checks for the gothic visual, branching story, material audio and dual-king revision.
import assert from "node:assert/strict";
import {mkdir,writeFile} from "node:fs/promises";
import {chromium} from "playwright";
import {preview} from "vite";

const live=process.argv.includes("--live");
const out=live?"output/qa/gothic-v5-live":"output/qa/gothic-v5";await mkdir(out,{recursive:true});
const server=live?null:await preview({preview:{host:"127.0.0.1",port:5189,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??"C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",headless:true});
const context=await browser.newContext({viewport:{width:960,height:540}});
await context.addInitScript(()=>{
 window.__qaMedia=[];
 const play=HTMLMediaElement.prototype.play;
 HTMLMediaElement.prototype.play=function(...args){if(!window.__qaMedia.includes(this))window.__qaMedia.push(this);return play.apply(this,args);};
});
const report={checks:{},endings:{},catMusic:[],screenshots:[],errors:[],warnings:[],startedAt:new Date().toISOString()};
const watch=p=>{
 p.on("pageerror",e=>report.errors.push(String(e)));
 p.on("console",m=>{if(m.type()==="error")report.errors.push(m.text());else if(m.type()==="warning")report.warnings.push(m.text());});
 p.on("response",r=>{if(r.status()>=400)report.errors.push(r.status()+" "+r.url());});
 return p;
};
const url=q=>(live?"https://nicoh-yay.github.io/the-ninth-life/":"http://127.0.0.1:5189/")+q+(live?"&qa="+Date.now():"");
const scene=(p,key,timeout=90000)=>p.waitForFunction(k=>window.ninth?.scene.isActive(k),key,{timeout});
const mode=(p,value,timeout=90000)=>p.waitForFunction(m=>window.ninth?.scene.isActive("fight")&&window.ninth.scene.getScene("fight").mode===m,value,{timeout});
const texts=p=>p.evaluate(()=>{const flatten=o=>[o.text??"",...(o.list??[]).flatMap(flatten)];return window.ninth.scene.getScene("fight").children.list.flatMap(flatten).filter(Boolean);});
const choice=(p,number)=>p.waitForFunction(n=>{const flatten=o=>[o.text??"",...(o.list??[]).flatMap(flatten)];return window.ninth.scene.getScene("fight").children.list.flatMap(flatten).some(t=>t.startsWith("YOUR ANSWER  "+n+" / 2"));},number,{timeout:60000});
const shot=async(p,name)=>{await p.screenshot({path:out+"/"+name+".png"});report.screenshots.push(name+".png");};
const save=async stage=>{console.log(JSON.stringify({stage,errors:report.errors.length}));await writeFile(out+"/report.json",JSON.stringify(report,null,2));};
const audioPlaying=(p,cue,full=false)=>p.waitForFunction(({cue,full})=>window.__qaMedia.some(a=>a.src.includes("/audio-v5/music/"+cue+".mp3")&&!a.paused&&a.currentTime>0.03&&(!full||a.volume>0.3)),{cue,full},{timeout:15000});
const page=watch(await context.newPage());

async function endingComponent(kind){
 const p=watch(await context.newPage());
 await p.goto(url("?mute=1&debug=1&autoplay=1&bot=idle&mode=scripted&seed=42"));await scene(p,"fight");
 await p.evaluate(kind=>{
  const s=window.ninth.scene.getScene("fight"),session=s.session;
  const ending=kind==="victory"?{kind,defeated:9,bond:4}:{kind,by:"patchwork",fightIndex:9,bond:4};
  session.state.ending=ending;s.scene.start("ending",{session,ending,life:"patchwork"});
 },kind);
 await scene(p,"ending");await p.keyboard.press("Enter");
 assert(await p.evaluate(()=>window.ninth.scene.isActive("ending")&&!window.ninth.scene.getScene("ending").ready));
 if(kind==="victory"){
  await p.waitForFunction(()=>window.ninth.scene.getScene("ending").visitorState.angle< -70,null,{timeout:30000});
  await p.waitForTimeout(800);await shot(p,"victory-fallen-incarnation");
 }else{
  await p.waitForFunction(()=>window.ninth.scene.getScene("ending").finaleStage==="heart-held",null,{timeout:30000});
  await p.waitForTimeout(450);
  const held=await p.evaluate(()=>{const s=window.ninth.scene.getScene("ending");return{stage:s.finaleStage,impaled:s.impaled,swordVisible:s.heartBlade?.visible,swordName:s.heartBlade?.name,heart:s.heartPosition,blade:{x:s.heartBlade?.x,y:s.heartBlade?.y,rotation:s.heartBlade?.rotation},kingX:s.kingState.x,visitorX:s.visitorState.x};});
  assert(held.impaled&&held.swordVisible);assert.equal(held.swordName,"heart-piercing-light-sword");
  assert(Math.abs(held.blade.y+Math.tan(held.blade.rotation)*(held.heart.x-held.blade.x)-held.heart.y)<2,"The held blade must pass through the heart rather than above it");
  report.endings[kind]={held};await shot(p,kind+"-heart-pierced-and-held");
  await p.waitForFunction(()=>window.ninth.scene.getScene("ending").finaleStage==="decree",null,{timeout:20000});
  assert(await p.evaluate(()=>{const s=window.ninth.scene.getScene("ending");return s.impaled&&s.heartBlade.visible&&s.kingState.motion==="nova";}));
  await shot(p,kind+"-sword-held-through-decree");
  await p.waitForFunction(()=>window.ninth.scene.getScene("ending").finaleStage==="explosion",null,{timeout:10000,polling:20});
  assert(await p.evaluate(()=>{const s=window.ninth.scene.getScene("ending");return s.impaled&&s.heartBlade.visible;}));
  await shot(p,kind+"-decree-explosion");
 }
 await p.waitForFunction(()=>window.ninth.scene.getScene("ending").ready,null,{timeout:30000});
 const state=await p.evaluate(()=>{const s=window.ninth.scene.getScene("ending");return{kind:s.ending.kind,stage:s.finaleStage,ruined:s.ruined,impaled:s.impaled,kingAlpha:s.kingState.alpha,visitorAlpha:s.visitorState.alpha,visitorAngle:s.visitorState.angle,visitorX:s.visitorState.x,ruinTexture:s.children.list.some(c=>c.texture?.key==="royal-dawn-ruins")};});
 if(kind==="victory"){assert(!state.ruined);assert.equal(state.kingAlpha,1);assert(state.visitorAngle< -70);}
 else{assert(state.ruined&&state.ruinTexture);assert.equal(state.kingAlpha,0);assert.equal(state.visitorAlpha,0);assert(!state.impaled);}
 assert(state.visitorX>0,"No friendly departure from the room");
 report.endings[kind]={...report.endings[kind],final:state};await shot(p,kind+"-final-coda");
 await p.keyboard.press("Enter");await scene(p,"title");await p.close();
}

async function perCatMusic(){
 const p=watch(await context.newPage());
 await p.goto(url("?debug=1&autoplay=1&bot=idle&mode=scripted&seed=42"));await scene(p,"title");await p.keyboard.press("ArrowDown");
 await scene(p,"fight");await mode(p,"fight");
 for(let index=1;index<=9;index++){
  if(index!==1)await p.keyboard.press(String(index));
  await p.waitForFunction(n=>{const s=window.ninth.scene.getScene("fight");return s.sim?.setup.fightIndex===n&&s.mode==="fight";},index,{timeout:12000});
  const life=await p.evaluate(()=>window.ninth.scene.getScene("fight").sim.setup.life);
  await audioPlaying(p,life,true);
  const state=await p.evaluate(()=>{const s=window.ninth.scene.getScene("fight"),life=s.sim.setup.life,a=window.__qaMedia.find(a=>a.src.endsWith("/"+life+".mp3")&&!a.paused);return{index:s.sim.setup.fightIndex,life,src:a?.src,time:a?.currentTime,volume:a?.volume};});
  report.catMusic.push(state);
  if([3,5,8,9].includes(index))await shot(p,"incarnation-"+index+"-music-and-accessories");
 }
 assert.equal(new Set(report.catMusic.map(c=>c.life)).size,9);
 assert.equal(new Set(report.catMusic.map(c=>c.src)).size,9);
 await p.close();
}

await save(live?"starting public gothic verification":"starting production gothic verification");
try{
 await page.goto(url("?debug=1&mode=scripted&seed=42"));await scene(page,"title");await page.waitForTimeout(800);
 report.checks.bundle=await page.evaluate(()=>performance.getEntriesByType("resource").map(e=>e.name).filter(n=>/assets\/index-.*\.js/.test(n)));
 report.checks.menu=await page.evaluate(()=>{const s=window.ninth.scene.getScene("title");return{images:s.children.list.filter(c=>c.type==="Image").map(c=>c.texture.key),tweens:s.tweens.getTweens().length};});
 assert(report.checks.menu.images.some(key=>key.startsWith("gothic-")),"New authored/assembled gothic menu artwork must replace the old silhouette");
 assert.equal(report.checks.menu.tweens,0,"No full-image AI-style breathing zoom");
 await shot(page,"menu-gothic-castle");
 for(const viewport of[{width:960,height:540},{width:1280,height:720},{width:390,height:844}]){
  await page.setViewportSize(viewport);await page.waitForTimeout(180);
  const b=await page.locator("canvas").evaluate(c=>{const r=c.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};});
  assert(Math.abs(b.w/b.h-16/9)<0.01);assert(Math.abs(b.x+b.w/2-viewport.width/2)<=2);assert(Math.abs(b.y+b.h/2-viewport.height/2)<=2);
  (report.checks.aspects??=[]).push({viewport,bounds:b});await shot(page,"aspect-"+viewport.width+"x"+viewport.height);
 }
 await page.setViewportSize({width:960,height:540});await page.keyboard.press("ArrowDown");await page.keyboard.press("Enter");await scene(page,"settings");
 await audioPlaying(page,"menu");await page.keyboard.press("Escape");await scene(page,"title");
 await page.keyboard.press("c");await page.waitForTimeout(700);
 const credits=await page.evaluate(()=>{const flatten=o=>[o.text??"",...(o.list??[]).flatMap(flatten)];return window.ninth.scene.getScene("title").children.list.flatMap(flatten).join("\n");});
 for(const phrase of["Scott Buckley","CC BY 4.0","Chequered Ink"])assert(credits.toLowerCase().includes(phrase.toLowerCase()),"Missing credit "+phrase);
 await shot(page,"new-score-and-foley-credits");await page.keyboard.press("Escape");
 await page.waitForFunction(()=>window.ninth.scene.isActive("title")&&!window.ninth.scene.getScene("title").credits);
 await page.keyboard.press("Enter");await scene(page,"opening");
 await page.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="challenge");
 await page.keyboard.press("Enter");await page.keyboard.press("Escape");assert(await page.evaluate(()=>window.ninth.scene.isActive("opening")));
 await page.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="crown-hold",null,{timeout:60000});
 report.checks.coronation=await page.evaluate(()=>{const s=window.ninth.scene.getScene("opening");return{phase:s.phase,key:s.hero.texture.key,frame:s.hero.frame.name,crownY:s.crownPose.y};});
 assert.equal(report.checks.coronation.key,"gothic-coronation");await shot(page,"crown-held-before-choice-to-wear");
 await page.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="crown-don",null,{timeout:10000});await page.waitForTimeout(380);await shot(page,"crown-lifted-onto-head");
 await page.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="crowned",null,{timeout:10000});await page.waitForTimeout(650);await shot(page,"crown-transformation");
 await scene(page,"fight");await audioPlaying(page,"years");
 await choice(page,1);
 report.checks.firstChoices=(await texts(page)).filter(t=>t.startsWith("> ")||t.startsWith("  "));
 assert(report.checks.firstChoices.some(t=>t.includes("I was. I thought this crown")));
 await page.keyboard.press("ArrowDown");await page.waitForTimeout(90);
 assert((await texts(page)).some(t=>t.startsWith("> Your village")));
 await page.keyboard.press("ArrowUp");await page.waitForTimeout(90);
 assert((await texts(page)).some(t=>t.startsWith("> I was.")));
 await shot(page,"first-exchange-open-answer");
 const bondBefore=await page.evaluate(()=>window.ninth.scene.getScene("fight").session.state.bond);
 await page.keyboard.press("Enter");await choice(page,2);
 assert.equal(await page.evaluate(()=>window.ninth.scene.getScene("fight").mode),"arrival","Combat waits for the second answer");
 report.checks.secondChoices=(await texts(page)).filter(t=>t.startsWith("> ")||t.startsWith("  "));
 assert(report.checks.secondChoices.some(t=>t.includes("Watch my feet.")));
 assert(!report.checks.secondChoices.some(t=>t.includes("Your village sent")));
 assert(await page.evaluate(()=>window.ninth.scene.getScene("fight").session.state.bond)>bondBefore);
 await page.keyboard.press("ArrowDown");await page.waitForTimeout(90);
 assert((await texts(page)).some(t=>t.startsWith("> I will teach you")));
 await shot(page,"second-exchange-remembers-first-answer");await page.keyboard.press("Enter");await mode(page,"fight");
 await audioPlaying(page,"kitten",true);report.checks.twoExchangesBeforeCombat=true;
 assert.equal(await page.evaluate(()=>window.ninth.scene.getScene("fight").king.texture.key),"gothic-base");
 await shot(page,"base-king-versus-practice-staff");
 await page.keyboard.press("Space");await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.boss.y>30);await shot(page,"manual-jump");
 await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.boss.grounded);
 await page.keyboard.down("a");await page.keyboard.press("Shift");await page.waitForTimeout(60);await shot(page,"royal-dash-afterimages");await page.keyboard.up("a");
 const beforeThrust=await page.evaluate(()=>window.ninth.scene.getScene("fight").sim.boss.x);
 await page.keyboard.press("k");await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.boss.move?.id==="throw",null,{timeout:4000,polling:15});await page.waitForTimeout(360);
 report.checks.baseThrust=await page.evaluate(()=>{const s=window.ninth.scene.getScene("fight");return{x:s.sim.boss.x,projectiles:s.sim.projectiles.filter(p=>!p.kind.startsWith("enemy")).map(p=>p.kind),direction:s.sim.boss.move?.direction??s.sim.boss.facing,effect:s.fx.active.filter(e=>e.image.texture.key==="gothic-vfx"&&e.row===1).map(e=>({flipX:e.image.flipX,frame:e.image.frame.name}))};});
 assert(report.checks.baseThrust.x<beforeThrust-40);assert.deepEqual(report.checks.baseThrust.projectiles,[]);
 assert(report.checks.baseThrust.effect.length>0,"A real sword-thrust sprite must accompany the physical strike");
 assert(report.checks.baseThrust.effect.every(effect=>effect.flipX===(report.checks.baseThrust.direction>0)),"Left-authored sword art must face the actual thrust direction");
 await shot(page,"physical-royal-thrust");
 await page.keyboard.down("g");await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.boss.guarding);
 assert.equal(await page.evaluate(()=>window.ninth.scene.getScene("fight").shield.texture.key),"gothic-vfx");await shot(page,"layered-royal-guard");
 await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.boss.blocks>0,null,{timeout:22000});await page.keyboard.up("g");
 await page.keyboard.down("j");await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.ch.hitFlashT>0,null,{timeout:12000,polling:15});await shot(page,"recorded-impact-and-sprite-hurt");await page.keyboard.up("j");
 report.checks.manualTutorial=await page.evaluate(()=>{const s=window.ninth.scene.getScene("fight");return{complete:s.sim.tutorialComplete,jumps:s.sim.boss.jumps,dashes:s.sim.boss.dashes,blocks:s.sim.boss.blocks};});
 assert(report.checks.manualTutorial.complete);
 await page.keyboard.press("p");await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.boss.phase===2&&window.ninth.scene.getScene("fight").sim.boss.transitionT<=0,null,{timeout:6000});
 assert.equal(await page.evaluate(()=>window.ninth.scene.getScene("fight").king.texture.key),"gothic-monster");await shot(page,"distinct-monster-second-form");
 await page.keyboard.press("k");
 await page.waitForFunction(()=>window.ninth.scene.getScene("fight").sim.projectiles.some(p=>p.kind==="wisp"&&p.homing===false),null,{timeout:5000,polling:15});
 report.checks.monsterFangs=true;await shot(page,"monster-hollow-choir-fangs");
 const oldMusic=await page.evaluate(()=>window.__qaMedia.filter(a=>/years-at-rest|combat-five-armies|finale-virtutes/.test(a.src)).map(a=>a.src));
 assert.deepEqual(oldMusic,[]);report.checks.oldMusicNeverPlayed=true;
 await save("actual two-exchange story, coronation, music and native dual-form combat passed");
 if(!live) await Promise.all([endingComponent("normal"),endingComponent("do_nothing"),endingComponent("victory"),perCatMusic()]);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);
 report.ok=true;await save(live?"public gothic menu, two-exchange story, music and native dual-form combat passed":"all gothic presentation, per-cat music and held-heart-stab components passed");
}catch(error){
 report.ok=false;report.failure=String(error);console.error(error);
 try{await shot(page,"failure");}catch{}
 process.exitCode=1;
}finally{report.finishedAt=new Date().toISOString();await writeFile(out+"/report.json",JSON.stringify(report,null,2));await browser.close();await server?.httpServer?.close();}
