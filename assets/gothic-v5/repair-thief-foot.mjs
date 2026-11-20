// AI-use disclosure: Codex repairs confirmed detached neighboring-cell foot artifacts without rescaling/recoloring actors.
import sharp from 'sharp';import{readFile,writeFile,mkdir}from'node:fs/promises';import{createHash}from'node:crypto';
const DIR='assets/gothic-v5/',thief=[36,37,38,39,40,41],targets=[
{id:'royal-walk',png:'public/royal-v4/visitor-walk.png',json:'public/royal-v4/visitor-walk.json',frames:[...thief,47]},
{id:'royal-combat',png:'public/royal-v4/visitor-combat.png',json:'public/royal-v4/visitor-combat.json',frames:[...thief,8,20,26]},
{id:'gothic-idle-hurt',png:'public/gothic-v5/visitors.png',json:'public/gothic-v5/visitors.json',frames:thief}
];
const hash=b=>createHash('sha256').update(b).digest('hex');
function components(data){const seen=new Uint8Array(144*144),parts=[];
for(let i=0;i<seen.length;i++){if(seen[i]||data[i*4+3]<100)continue;const stack=[i],points=[];seen[i]=1;let left=144,right=0,top=144,bottom=0;
while(stack.length){const p=stack.pop(),x=p%144,y=p/144|0;points.push(p);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++){if(xx<0||yy<0||xx>=144||yy>=144)continue;const q=yy*144+xx;if(!seen[q]&&data[q*4+3]>100){seen[q]=1;stack.push(q);}}}
parts.push({points,bounds:{left,right,top,bottom},pixels:points.length});}return parts.sort((a,b)=>b.pixels-a.pixels);}
await mkdir(DIR+'foot-repair-inputs',{recursive:true});
let report;try{report=JSON.parse(await readFile(DIR+'foot-anchor-repair.json','utf8'));}catch{report={frames:[],atlases:[]};}
report.aiUseDisclosure='Codex removed only confirmed detached below-body neighboring-cell fragments and translated whole actors/legitimate gear to y110. No rescaling, recoloring or other frames were changed.';report.authorizedFrames=22;report.footY=110;
for(const target of targets){
const metadata=JSON.parse(await readFile(target.json,'utf8'));
if(metadata.footAnchorRepair?.version===2){console.log(target.id+': already repaired');continue;}
const original=await readFile(target.png),beforeMeta=await readFile(target.json);await writeFile(DIR+'foot-repair-inputs/'+target.id+'.png',original,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});await writeFile(DIR+'foot-repair-inputs/'+target.id+'.json',beforeMeta,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
const{data:atlas,info}=await sharp(original).ensureAlpha().raw().toBuffer({resolveWithObject:true}),atlasBefore=Buffer.from(atlas);let changed=0;
const allowed=new Set(target.frames);
for(const frameId of target.frames){
const row=Math.floor(frameId/6),col=frameId%6,oldAnchor=metadata.anchors?.[frameId];
if(oldAnchor?.thiefFootRepair||oldAnchor?.footAnchorRepair)continue;
const frame=Buffer.alloc(144*144*4);for(let y=0;y<144;y++)atlas.copy(frame,y*144*4,((row*144+y)*info.width+col*144)*4,((row*144+y)*info.width+col*144+144)*4);
const parts=components(frame),body=parts[0];if(!body||body.pixels<800)throw Error('No coherent actor '+target.id+':'+frameId);
const removed=parts.filter(p=>p!==body&&p.pixels<250&&p.bounds.top>body.bounds.bottom+5&&p.bounds.right-p.bounds.left<=35&&p.bounds.bottom-p.bounds.top<=13);
for(const part of removed)for(const p of part.points)frame[p*4+3]=0;
const dy=110-body.bounds.bottom,out=Buffer.alloc(frame.length);let clipped=0;
for(let y=0;y<144;y++)for(let x=0;x<144;x++){const i=(y*144+x)*4;if(!frame[i+3])continue;const yy=y+dy;if(yy<0||yy>=144){clipped++;continue;}frame.copy(out,(yy*144+x)*4,i,i+4);}
if(clipped)throw Error('Repair clips valid actor '+target.id+':'+frameId);
const after=components(out)[0];if(after.bounds.bottom!==110||after.pixels!==body.pixels)throw Error('Actor geometry changed '+target.id+':'+frameId);
for(let y=0;y<144;y++)out.copy(atlas,((row*144+y)*info.width+col*144)*4,y*144*4,(y+1)*144*4);
const record={atlas:target.id,frame:frameId,row,col,beforeBody:body.bounds,afterBody:after.bounds,bodyPixels:body.pixels,removedPixels:removed.reduce((s,p)=>s+p.pixels,0),removedBounds:removed.map(p=>p.bounds),translateY:dy,clippedOpaque:0};
report.frames=report.frames.filter(r=>!(r.atlas===target.id&&r.frame===frameId));report.frames.push(record);
if(oldAnchor){oldAnchor.footAnchorRepair=record;if(typeof oldAnchor.shiftY==='number')oldAnchor.shiftY+=dy;if(typeof oldAnchor.opaque==='number')oldAnchor.opaque-=record.removedPixels;if(typeof oldAnchor.opaquePixels==='number')oldAnchor.opaquePixels-=record.removedPixels;}
changed+=dy!==0||removed.length>0?1:0;
}
for(let y=0;y<info.height;y++)for(let x=0;x<info.width;x++){if(allowed.has(Math.floor(y/144)*6+Math.floor(x/144)))continue;const i=(y*info.width+x)*4;if(!atlas.subarray(i,i+4).equals(atlasBefore.subarray(i,i+4)))throw Error('Changed an unauthorized frame');}
const output=changed?await sharp(atlas,{raw:{width:info.width,height:info.height,channels:4}}).png().toBuffer():original;if(changed)await writeFile(target.png,output);
metadata.footAnchorRepair={version:2,frames:target.frames,footY:110,method:'Remove confirmed detached below-body neighboring-cell fragment; translate whole actor and legitimate gear. No scaling or recoloring.',helper:'assets/gothic-v5/repair-thief-foot.mjs',inputSha256:hash(original),outputSha256:hash(output),additionalChangedFrames:changed};
await writeFile(target.json,JSON.stringify(metadata,null,2)+'\n');report.atlases=report.atlases.filter(a=>a.id!==target.id);report.atlases.push({id:target.id,...metadata.footAnchorRepair});
}
report.frames.sort((a,b)=>a.atlas.localeCompare(b.atlas)||a.frame-b.frame);await writeFile(DIR+'foot-anchor-repair.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:report.frames.length,bodyBottoms:report.frames.map(f=>f.afterBody.bottom),removedPixels:report.frames.reduce((s,f)=>s+f.removedPixels,0),clipped:report.frames.reduce((s,f)=>s+f.clippedOpaque,0)}));
