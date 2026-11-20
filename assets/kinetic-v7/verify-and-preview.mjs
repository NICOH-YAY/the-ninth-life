// AI-use disclosure: Codex contact sheet and pixel-grid verification of original Higgsfield runtime atlases.
import sharp from 'sharp';
import {readFile,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
const pieces=[],labels=[];
const selections=[
 ['Base stance','king-v7',0,0],['Drawing cut','king-combo-v7',0,2],['Rising backhand','king-combo-v7',1,3],['Overhead finisher','king-combo-v7',2,2],
 ['Hollow Sovereign','hollow-sovereign-v7',0,0],['Crescent cleave','hollow-sovereign-v7',4,3],['Royal thrust','hollow-sovereign-v7',5,3],['Gravity command','hollow-sovereign-v7',6,3]
];
for(let i=0;i<selections.length;i++){
 const[label,id,row,col]=selections[i],x=i%4*288,y=Math.floor(i/4)*210;
 pieces.push({input:await sharp('godot/art/'+id+'.png').extract({left:col*192,top:row*192,width:192,height:192}).png().toBuffer(),left:x+48,top:y+18});
 labels.push('<text x="'+(x+14)+'" y="'+(y+20)+'">'+label+'</text>');
}
pieces.push({input:await sharp('godot/art/transformation-v7.png').png().toBuffer(),left:0,top:438});
labels.push('<text x="14" y="440">Physical six-pose transformation</text>');
for(let i=0;i<3;i++){
 pieces.push({input:await sharp('godot/art/opening-duel-v7.png').extract({left:([1,8,10][i]%6)*320,top:Math.floor([1,8,10][i]/6)*256,width:320,height:256}).png().toBuffer(),left:i*384+32,top:652});
 labels.push('<text x="'+(i*384+14)+'" y="654">'+['Steel clash','Physical heart stab','Mantle grip and held wound'][i]+'</text>');
}
pieces.push({input:Buffer.from('<svg width="1152" height="928"><g font-family="monospace" font-size="14" fill="#dac7a0">'+labels.join('')+'</g></svg>'),left:0,top:0});
await sharp({create:{width:1152,height:928,channels:4,background:'#17232b'}}).composite(pieces).png().toFile('assets/kinetic-v7/contact-sheet.png');
const manifest=JSON.parse(await readFile('assets/kinetic-v7/manifest.json','utf8')),checks=[];
for(const item of manifest.generated){
 const geo=JSON.parse(await readFile('assets/kinetic-v7/'+item.id+'-geometry.json','utf8'));
 const {data,info}=await sharp(item.runtime).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let soft=0,gridMismatch=0;
 for(let y=0;y<info.height;y+=2)for(let x=0;x<info.width;x+=2){
  const base=(y*info.width+x)*4;
  for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
   const j=((y+yy)*info.width+x+xx)*4;
   if(data[j+3]!==0&&data[j+3]!==255)soft++;
   for(let k=0;k<4;k++)if(data[j+k]!==data[base+k]){gridMismatch++;break;}
  }
 }
 const source=await readFile(item.source),runtime=await readFile(item.runtime);
 item.sourceSha256=createHash('sha256').update(source).digest('hex');item.runtimeSha256=createHash('sha256').update(runtime).digest('hex');
 checks.push({id:item.id,frames:geo.frames.length,clipped:geo.frames.reduce((s,x)=>s+x.clipped,0),empty:geo.frames.filter(x=>!x.opaque).length,removedBorderPixels:geo.frames.reduce((s,x)=>s+x.removedBorderPixels,0),softAlphaPixels:soft,offGridPixels:gridMismatch,sourceSha256:item.sourceSha256,runtimeSha256:item.runtimeSha256});
}
await writeFile('assets/kinetic-v7/manifest.json',JSON.stringify(manifest,null,2));
await writeFile('assets/kinetic-v7/pixel-verification.json',JSON.stringify({aiUseDisclosure:'Codex verified runtime atlas geometry, binary alpha and uniform two-by-two pixel clusters after palette export. This is component evidence, not a full combat playthrough.',checks},null,2));
console.log(JSON.stringify(checks));
if(checks.some(x=>x.clipped||x.empty||x.softAlphaPixels||x.offGridPixels))process.exitCode=1;
