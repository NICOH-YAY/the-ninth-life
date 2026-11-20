// AI-use disclosure: Codex validates original Higgsfield physical body-animation runtime pixels.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const p='assets/stance-v9/manifest.json',manifest=JSON.parse(await readFile(p,'utf8')),checks=[];
for(const item of manifest.generated){
 const bytes=await readFile(item.runtime),source=await readFile(item.source),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let softAlpha=0,offgrid=0;const frameCounts=Array(item.rows*6).fill(0),uniqueness=[];
 for(let y=0;y<info.height;y+=2)for(let x=0;x<info.width;x+=2){
  const base=(y*info.width+x)*4;
  if(data[base+3])frameCounts[Math.floor(y/item.frame[1])*6+Math.floor(x/item.frame[0])]++;
  for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
   const j=((y+yy)*info.width+x+xx)*4;
   if(data[j+3]!==0&&data[j+3]!==255)softAlpha++;
   for(let k=0;k<4;k++)if(data[j+k]!==data[base+k]){offgrid++;break;}
  }
 }
 for(let row=0;row<item.rows;row++){
  const hashes=[];
  for(let col=0;col<6;col++)hashes.push(createHash('sha256').update(await sharp(bytes).extract({left:col*item.frame[0],top:row*item.frame[1],width:item.frame[0],height:item.frame[1]}).raw().toBuffer()).digest('hex'));
  uniqueness.push(new Set(hashes).size);
 }
 item.sourceSha256=createHash('sha256').update(source).digest('hex');item.runtimeSha256=createHash('sha256').update(bytes).digest('hex');
 checks.push({id:item.id,frames:frameCounts.length,uniqueActualPixelFramesPerRow:uniqueness,emptyFrames:frameCounts.filter(n=>!n).length,softAlphaPixels:softAlpha,offGridPixels:offgrid,sourceSha256:item.sourceSha256,runtimeSha256:item.runtimeSha256});
}
const pieces=[],labels=[],seqs=[['Base overhead','prepare-king',192,2],['Sovereign ground command','prepare-sovereign',192,4],['Knight hammer/shield','prepare-visitors',144,5],['Warden chain-only repair','prepare-visitors',144,2],['Royal heel-toe gait','royal-walk',192,0]];
for(let row=0;row<seqs.length;row++){
 const[label,id,cell,r]=seqs[row];
 for(let col=0;col<6;col++)pieces.push({input:await sharp('godot/art/'+id+'-v9.png').extract({left:col*cell,top:r*cell,width:cell,height:cell}).png().toBuffer(),left:col*192+(192-cell)/2,top:row*208+16+(192-cell)});
 labels.push('<text x="12" y="'+(row*208+18)+'">'+label+'</text>');
}
pieces.push({input:Buffer.from('<svg width="1152" height="1040"><g font-family="monospace" font-size="13" fill="#dac7a0">'+labels.join('')+'</g></svg>'),left:0,top:0});
await sharp({create:{width:1152,height:1040,channels:4,background:'#17232b'}}).composite(pieces).png().toFile('assets/stance-v9/body-contact.png');
await writeFile(p,JSON.stringify(manifest,null,2));
await writeFile('assets/stance-v9/pixel-verification.json',JSON.stringify({aiUseDisclosure:'Codex checked hard alpha, exact two-by-two pixel clusters, nonempty cells and six actually different cropped pixel frames in every selected anticipation/walk row. Full native foot-anchor and browser gameplay checks are separate root QA evidence.',checks},null,2));
console.log(JSON.stringify(checks.map(x=>({id:x.id,frames:x.frames,unique:x.uniqueActualPixelFramesPerRow,soft:x.softAlphaPixels,offgrid:x.offGridPixels,empty:x.emptyFrames}))));
if(checks.some(x=>x.softAlphaPixels||x.offGridPixels||x.emptyFrames||x.uniqueActualPixelFramesPerRow.some(n=>n<6)))process.exitCode=1;
