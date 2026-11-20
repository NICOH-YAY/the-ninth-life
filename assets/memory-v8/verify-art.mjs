// AI-use disclosure: Codex component verification and preview of original Higgsfield memory/guard assets.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const manifest=JSON.parse(await readFile('assets/memory-v8/manifest.json','utf8')),checks=[];
for(const item of manifest.generated){
 const source=await readFile(item.source),runtime=await readFile(item.runtime),{data,info}=await sharp(runtime).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let soft=0,offgrid=0;const step=item.pixelGrid,frameCounts=Array(item.grid[0]*item.grid[1]).fill(0);
 for(let y=0;y<info.height;y+=step)for(let x=0;x<info.width;x+=step){
  const base=(y*info.width+x)*4;
  if(data[base+3])frameCounts[Math.floor(y/item.frame[1])*item.grid[0]+Math.floor(x/item.frame[0])]++;
  for(let yy=0;yy<step;yy++)for(let xx=0;xx<step;xx++){
   const j=((y+yy)*info.width+x+xx)*4;
   if(data[j+3]!==0&&data[j+3]!==255)soft++;
   for(let k=0;k<4;k++)if(data[j+k]!==data[base+k]){offgrid++;break;}
  }
 }
 item.sourceSha256=createHash('sha256').update(source).digest('hex');item.runtimeSha256=createHash('sha256').update(runtime).digest('hex');
 checks.push({id:item.id,size:[info.width,info.height],frames:frameCounts.length,emptyFrames:frameCounts.filter(n=>!n).length,softAlphaPixels:soft,offGridPixels:offgrid,pixelGrid:step,sourceSha256:item.sourceSha256,runtimeSha256:item.runtimeSha256});
}
const pieces=[];
for(let r=0;r<11;r++)pieces.push({input:await sharp('godot/art/guard-sigils-v8.png').extract({left:2*128,top:r*128,width:128,height:128}).png().toBuffer(),left:r%6*128,top:Math.floor(r/6)*128});
await sharp({create:{width:768,height:256,channels:4,background:'#17232b'}}).composite(pieces).png().toFile('assets/memory-v8/guard-contact.png');
await writeFile('assets/memory-v8/manifest.json',JSON.stringify(manifest,null,2));
await writeFile('assets/memory-v8/pixel-verification.json',JSON.stringify({aiUseDisclosure:'Codex verifies geometry, nonempty cells, binary alpha and exact square logical pixel clusters of original Higgsfield runtime exports. Seating contact is separately shown by the exact-coordinate arena composite; this component test is not a complete game playthrough.',checks},null,2));
console.log(JSON.stringify(checks));
if(checks.some(x=>x.softAlphaPixels||x.offGridPixels||x.emptyFrames))process.exitCode=1;
