// AI-use disclosure: Codex-authored isolated visual checks for the held heart-stab and coronation.
import {chromium} from "playwright";
import {createServer} from "vite";
import {mkdir,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
const out="output/qa/story-v5";await mkdir(out,{recursive:true});
const server=await createServer({server:{host:"127.0.0.1",port:5192,strictPort:true,hmr:false}});await server.listen();
const browser=await chromium.launch({executablePath:"C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",headless:true});
const context=await browser.newContext({viewport:{width:960,height:540}});
const report={checks:{},errors:[]};
const onlyEnding=process.argv.includes("--ending-only");
const watch=p=>{p.on("pageerror",e=>report.errors.push(String(e)));p.on("response",r=>{if(r.status()>=400)report.errors.push(r.status()+" "+r.url())});return p;};
try{
if(!onlyEnding){
const opening=watch(await context.newPage());await opening.goto("http://127.0.0.1:5192/?mute=1&mode=scripted&seed=42");
await opening.waitForFunction(()=>window.ninth?.scene.isActive("title"));await opening.keyboard.press("Enter");
await opening.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="crown-hold",null,{timeout:50000});await opening.screenshot({path:out+"/crown-held.png"});
report.checks.crownHeld=await opening.evaluate(()=>{const s=window.ninth.scene.getScene("opening");return{phase:s.phase,x:s.crownPose.x,y:s.crownPose.y,alpha:s.crownPose.alpha,texture:s.hero.texture.key}});
assert(report.checks.crownHeld.y<440);
await opening.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="crown-don",null,{timeout:10000});await opening.waitForTimeout(500);await opening.screenshot({path:out+"/crown-don.png"});
await opening.waitForFunction(()=>window.ninth.scene.getScene("opening").phase==="crowned",null,{timeout:10000});await opening.waitForTimeout(850);await opening.screenshot({path:out+"/crown-transform.png"});
}
const p=watch(await context.newPage());await p.goto("http://127.0.0.1:5192/?mute=1&autoplay=1&mode=scripted&seed=42");await p.waitForFunction(()=>window.ninth?.scene.isActive("fight"));
await p.evaluate(()=>{const s=window.ninth.scene.getScene("fight");const ending={kind:"normal",by:"patchwork",fightIndex:9,bond:4};s.session.state.ending=ending;s.scene.start("ending",{session:s.session,ending,life:"patchwork"})});
await p.waitForFunction(()=>window.ninth.scene.getScene("ending").finaleStage==="heart-held",null,{timeout:30000});await p.waitForTimeout(500);
const held=await p.evaluate(()=>{const s=window.ninth.scene.getScene("ending");return{stage:s.finaleStage,impaled:s.impaled,blade:s.heartBlade.visible,king:s.kingState.x,visitor:s.visitorState.x,visitorFeet:s.visitorState.feet,heart:{...s.heartPosition},bladeX:s.heartBlade.x,bladeY:s.heartBlade.y,bladeAngle:s.heartBlade.rotation,kingTexture:s.king.texture.key}});
assert(held.impaled&&held.blade);assert(Math.abs(held.bladeY+Math.tan(held.bladeAngle)*(held.heart.x-held.bladeX)-held.heart.y)<2);assert.equal(held.heart.y,381);assert.equal(held.kingTexture,"gothic-base");report.checks.heartHeld=held;await p.screenshot({path:out+"/heart-pierced-held.png"});
await p.waitForFunction(()=>window.ninth.scene.getScene("ending").finaleStage==="decree",null,{timeout:20000});assert(await p.evaluate(()=>window.ninth.scene.getScene("ending").impaled));await p.screenshot({path:out+"/heart-held-decree.png"});
await p.waitForFunction(()=>window.ninth.scene.getScene("ending").ruined&&window.ninth.scene.getScene("ending").ready,null,{timeout:20000});await p.screenshot({path:out+"/nova-ruins.png"});
report.checks.ruins=true;assert.deepEqual(report.errors,[]);report.ok=true;
}catch(error){report.ok=false;report.failure=String(error);throw error;}
finally{await writeFile(out+(onlyEnding?"/ending-report.json":"/report.json"),JSON.stringify(report,null,2));await browser.close();await server.close();}
