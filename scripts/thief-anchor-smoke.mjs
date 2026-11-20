// AI-use disclosure: Codex-authored connected-body pixel and native Phaser component checks for repaired visitor feet.
import assert from "node:assert/strict";
import sharp from "sharp";
import {mkdir,readFile,writeFile} from "node:fs/promises";
import {createHash} from "node:crypto";
import {chromium} from "playwright";
import {preview} from "vite";

const live=process.argv.includes("--live");
const out=live?"output/qa/thief-anchor-live":"output/qa/thief-anchor";
await mkdir(out,{recursive:true});
const atlases=[
 {id:"walk",key:"royal-visitor-walk",path:"public/royal-v4/visitor-walk.png"},
 {id:"combat",key:"royal-visitor-combat",path:"public/royal-v4/visitor-combat.png"},
 {id:"idle-hurt",key:"gothic-visitors",path:"public/gothic-v5/visitors.png"},
];
const repaired=new Set([...atlases.flatMap(a=>Array.from({length:6},(_,c)=>a.id+":"+(36+c))),"walk:47","combat:8","combat:20","combat:26"]);
function coherent(data,w,h){
 const seen=new Uint8Array(w*h);let best=null;
 for(let start=0;start<w*h;start++){
  if(seen[start]||data[start*4+3]<=100)continue;
  const stack=[start],positions=[];seen[start]=1;let left=w,right=-1,top=h,bottom=-1;
  while(stack.length){
   const p=stack.pop(),x=p%w,y=Math.floor(p/w);positions.push(p);
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy;if(nx<0||nx>=w||ny<0||ny>=h)continue;
    const q=ny*w+nx;if(!seen[q]&&data[q*4+3]>100){seen[q]=1;stack.push(q);}
   }
  }
  if(!best||positions.length>best.area)best={left,right,top,bottom,area:positions.length,positions};
 }
 return best;
}
function summarize(data,w,h){
 const body=coherent(data,w,h);assert(body&&body.area>800,"A coherent actor must exist");
 const bytes=Buffer.alloc((body.right-body.left+1)*(body.bottom-body.top+1)*4);
 for(const p of body.positions){
  const x=p%w-body.left,y=Math.floor(p/w)-body.top,index=(y*(body.right-body.left+1)+x)*4;
  for(let channel=0;channel<4;channel++)bytes[index+channel]=data[p*4+channel];
 }
 const {positions,...bounds}=body;
 return{...bounds,shapeSha256:createHash("sha256").update(bytes).digest("hex")};
}
const report={aiUseDisclosure:"Codex-authored pixel/component verification. Rendering overlays do not change game actor statistics or outcomes.",live,localFrames:[],browserFrames:[],actualThief:[],comparisons:[],screenshots:[],errors:[],warnings:[]};
const before={};
for(const atlas of atlases){
 const image=sharp(atlas.path);const metadata=await image.metadata();
 assert.equal(metadata.width,864);assert.equal(metadata.height,1296);
 let baseline=null;
 try{const bytes=await readFile("output/qa/thief-anchor/baseline/"+atlas.id+".png");baseline=bytes;before[atlas.id]=bytes.toString("base64");}catch{}
 for(let frame=0;frame<54;frame++){
  const cell={left:frame%6*144,top:Math.floor(frame/6)*144,width:144,height:144};
  const current=await sharp(atlas.path).extract(cell).ensureAlpha().raw().toBuffer();
  const body=summarize(current,144,144),fixed=repaired.has(atlas.id+":"+frame);
  assert(body.bottom>=105,atlas.id+":"+frame+" actor floats above its anchor");
  if(fixed)assert.equal(body.bottom,110,atlas.id+":"+frame+" repaired actor foot must be110");
  report.localFrames.push({atlas:atlas.id,frame,repaired:fixed,...body});
  if(baseline){
   const previous=await sharp(baseline).extract(cell).ensureAlpha().raw().toBuffer(),oldBody=summarize(previous,144,144);
   if(fixed){
    assert.equal(body.area,oldBody.area);assert.equal(body.shapeSha256,oldBody.shapeSha256,"Body shape/colors must be preserved, with translation only");
    report.comparisons.push({atlas:atlas.id,frame,before:oldBody.bottom,after:body.bottom,areaUnchanged:true,shapeAndColorsUnchanged:true});
   }else assert(current.equals(previous),"Unrepaired frame changed: "+atlas.id+":"+frame);
  }
 }
 await sharp(atlas.path).extract({left:0,top:864,width:864,height:144}).png().toFile(out+"/"+atlas.id+"-after-strip.png");
}
assert.equal(report.localFrames.length,162);assert.equal(report.localFrames.filter(f=>f.repaired).length,22);
const server=live?null:await preview({preview:{host:"127.0.0.1",port:5196,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??"C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe",headless:true});
const page=await browser.newPage({viewport:{width:960,height:540}});
page.on("pageerror",e=>report.errors.push(String(e)));
page.on("console",m=>{if(m.type()==="error")report.errors.push(m.text());else if(m.type()==="warning")report.warnings.push(m.text());});
page.on("response",r=>{if(r.status()>=400)report.errors.push(r.status()+" "+r.url());});
await page.addInitScript("window.__coherent="+coherent.toString());
const shot=async name=>{await page.screenshot({path:out+"/"+name+".png"});report.screenshots.push(name+".png");};
try{
 const base=live?"https://nicoh-yay.github.io/the-ninth-life/":"http://127.0.0.1:5196/";
 await page.goto(base+"?mute=1&debug=1&autoplay=1&bot=idle&mode=scripted&seed=42&qa="+Date.now());
 await page.waitForFunction(()=>window.ninth?.scene.isActive("fight"),null,{timeout:30000});
 await page.keyboard.press("7");
 await page.waitForFunction(()=>{const s=window.ninth.scene.getScene("fight");return s.sim?.setup.life==="thief"&&s.mode==="fight"&&s.sim.ch.y===0;},null,{timeout:10000});
 report.bundle=await page.evaluate(()=>performance.getEntriesByType("resource").map(e=>e.name).filter(n=>/assets\/index-.*\.js/.test(n)));
 report.textureResources=await page.evaluate(()=>performance.getEntriesByType("resource").map(e=>e.name).filter(n=>/visitor-walk\.png|visitor-combat\.png|gothic-v5\/visitors\.png/.test(n)));
 assert.equal(report.textureResources.length,3);
 assert(report.textureResources.every(url=>url.includes("v=feet-2")),"The page must load the repaired cache-tagged atlases");
 for(let i=0;i<12;i++){
  await page.waitForTimeout(85);
  const sample=await page.evaluate(()=>{
   const s=window.ninth.scene.getScene("fight"),image=s.ch,frame=image.frame,canvas=document.createElement("canvas");canvas.width=frame.cutWidth;canvas.height=frame.cutHeight;
   const c=canvas.getContext("2d",{willReadFrequently:true});c.drawImage(image.texture.getSourceImage(),frame.cutX,frame.cutY,frame.cutWidth,frame.cutHeight,0,0,canvas.width,canvas.height);
   const body=window.__coherent(c.getImageData(0,0,canvas.width,canvas.height).data,canvas.width,canvas.height);
   return{state:s.sim.ch.state,airborne:s.sim.ch.y,key:image.texture.key,frame:frame.name,imageY:image.y,bodyBottom:body.bottom,worldFoot:image.y+(body.bottom-image.originY*image.height)*image.scaleY};
  });
  if(sample.airborne===0){assert(Math.abs(sample.worldFoot-464)<=2,"Actual grounded thief must touch the arena floor");assert.equal(sample.imageY,464);}
  report.actualThief.push(sample);
 }
 await shot("actual-thief-grounded");
 const grid=async(variant)=>{
  return page.evaluate(async({atlases,before,variant})=>{
   const s=window.ninth.scene.getScene("fight");
   window.__anchorPanel?.destroy(true);
   const panel=s.add.container(0,0).setDepth(10000);window.__anchorPanel=panel;
   panel.add(s.add.rectangle(480,270,960,540,0x08131d,1));
   const rows=[],baseline=[165,315,465];
   for(let a=0;a<atlases.length;a++){
    const atlas=atlases[a];let key=atlas.key;
    if(variant==="before"){
     const loaded=new Image();loaded.src="data:image/png;base64,"+before[atlas.id];await loaded.decode();
     key="qa-before-"+atlas.id;if(!s.textures.exists(key))s.textures.addSpriteSheet(key,loaded,{frameWidth:144,frameHeight:144});
    }
    panel.add(s.add.text(22,baseline[a]-119,variant.toUpperCase()+" — "+(a===0?"WALK":a===1?"ATTACK":"IDLE (0–2) / HURT (3–5)"),{fontFamily:"monospace",fontSize:"14px",color:"#d9d4b6"}));
    panel.add(s.add.rectangle(480,baseline[a]+1,920,2,0xe4bc62,0.8));
    const baseFrame=s.textures.get("royal-visitor-walk").get(36),canvas=document.createElement("canvas");canvas.width=144;canvas.height=144;
    const c=canvas.getContext("2d",{willReadFrequently:true});c.drawImage(s.textures.get("royal-visitor-walk").getSourceImage(),baseFrame.cutX,baseFrame.cutY,144,144,0,0,144,144);
    const pixels=c.getImageData(0,0,144,144).data;let top=90;
    find:for(let y=0;y<110;y++)for(let x=Math.floor(144*.32);x<144*.68;x++)if(pixels[(y*144+x)*4+3]>100){top=y;break find;}
    const scale=78/Math.max(24,110-top);
    for(let col=0;col<6;col++){
     const frameIndex=36+col,image=s.add.image(90+col*150,baseline[a],key,frameIndex).setOrigin(.5,110/144).setScale(scale);panel.add(image);
     const f=image.frame;c.clearRect(0,0,144,144);c.drawImage(image.texture.getSourceImage(),f.cutX,f.cutY,144,144,0,0,144,144);
     const body=window.__coherent(c.getImageData(0,0,144,144).data,144,144);
     rows.push({atlas:atlas.id,frame:frameIndex,baseline:baseline[a],imageY:image.y,bodyBottom:body.bottom,worldFoot:image.y+(body.bottom-image.originY*image.height)*image.scaleY});
     panel.add(s.add.text(90+col*150,baseline[a]+13,String(col),{fontFamily:"monospace",fontSize:"11px",color:"#9aafb7"}).setOrigin(.5));
    }
   }
   return rows;
  },{atlases,before,variant});
 };
 if(Object.keys(before).length===3){report.beforeGrid=await grid("before");await page.waitForTimeout(80);await shot("before-thief-idle-walk-hurt");}
 report.afterGrid=await grid("after");
 assert(report.afterGrid.every(frame=>Math.abs(frame.worldFoot-frame.baseline)<=2));
 assert(report.afterGrid.every(frame=>frame.bodyBottom===110));
 await page.waitForTimeout(80);await shot("after-thief-idle-walk-hurt");
 report.browserFrames=await page.evaluate(atlases=>{
  const s=window.ninth.scene.getScene("fight"),results=[],canvas=document.createElement("canvas");canvas.width=144;canvas.height=144;const c=canvas.getContext("2d",{willReadFrequently:true});
  for(const atlas of atlases)for(let index=0;index<54;index++){
   const texture=s.textures.get(atlas.key),frame=texture.get(index);c.clearRect(0,0,144,144);c.drawImage(texture.getSourceImage(),frame.cutX,frame.cutY,144,144,0,0,144,144);
   const body=window.__coherent(c.getImageData(0,0,144,144).data,144,144);
   results.push({atlas:atlas.id,frame:index,bottom:body.bottom,area:body.area});
  }
  return results;
 },atlases);
 for(const f of report.browserFrames){assert(f.bottom>=105);if(repaired.has(f.atlas+":"+f.frame))assert.equal(f.bottom,110);}
 assert.equal(report.browserFrames.length,162);
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.warnings,[]);report.ok=true;
 console.log(JSON.stringify({ok:true,live,allFrames:162,repaired:22,actualSamples:report.actualThief.length,errors:0,warnings:0,bundle:report.bundle}));
}catch(error){report.ok=false;report.failure=String(error);console.error(error);try{await shot("failure");}catch{}process.exitCode=1;}
finally{await writeFile(out+"/report.json",JSON.stringify(report,null,2));await browser.close();await server?.httpServer?.close();}
