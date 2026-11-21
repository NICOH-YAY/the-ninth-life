// AI-use disclosure: Codex exports original twelve-pose gait and airborne artwork on a fixed native pixel lattice.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const id=process.argv[2],rows=Number(process.argv[3]);if(!id||!rows)throw Error('id rows required');
const visitors=id.startsWith('gait-')&&id!=='gait-king',death=id==='death-knight',cell=visitors?144:death?256:192,foot=visitors?110:death?224:154;
const input='assets/reign-v11/'+id+'-original.png',meta=await sharp(input).metadata(),{data:all}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const counts=[];for(let y=0;y<meta.height;y++){let n=0;for(let x=0;x<meta.width;x++)if(all[(y*meta.width+x)*4+3]>=160)n++;counts.push(n);}
const bounds=[0];for(let r=1;r<rows;r++){const ideal=r*meta.height/rows,span=meta.height/rows*.20,a=Math.floor(ideal-span),b=Math.ceil(ideal+span);let min=Infinity;for(let y=a;y<=b;y++)min=Math.min(min,counts[y]);let runs=[],start=-1;for(let y=a;y<=b+1;y++){if(y<=b&&counts[y]<=min+3){if(start<0)start=y;}else if(start>=0){runs.push([start,y-1]);start=-1;}}runs.sort((x,y)=>Math.abs((x[0]+x[1])/2-ideal)-Math.abs((y[0]+y[1])/2-ideal));bounds.push(runs.length?Math.round((runs[0][0]+runs[0][1])/2):Math.round(ideal));}bounds.push(meta.height);
function group(row){return 0;}
function body(row){if(visitors)return [74,80,71,69,76,79,71,76,85][['kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork'].indexOf(id.slice(5))];if(id==='royal-gait')return group(row)===0?107:86;return id.startsWith('magic-air')?130:death?190:107;}
const scales=new Map();
for(let r=0;r<rows;r++){const g=group(r);if(scales.has(g))continue;const width=Math.round(meta.width/6),top=bounds[(visitors||id==='gait-king')?2:r],height=bounds[((visitors||id==='gait-king')?2:r)+1]-top;let low=-1,high=height;
 for(let y=0;y<height;y++)for(let x=Math.floor(width*.32);x<width*.68;x++){const i=((y+top)*meta.width+x+(death?Math.round(meta.width*5/6):0))*4;if(all[i+3]<160)continue;high=Math.min(high,y);if(y>height*.42&&Math.max(all[i],all[i+1],all[i+2])<150)low=Math.max(low,y);}
 if(low<=high)throw Error('Cannot measure actor '+id+' '+r);
 const logicalWidth=Math.max(20,Math.min(death?110:82,2*Math.round(width*body(r)/(low-high)/4)));scales.set(g,{logicalWidth,sourceBody:low-high,referenceBody:body(r)});
}
const pieces=[],frames=[];
for(let r=0;r<rows;r++)for(let c=0;c<6;c++){
 const left=Math.round(c*meta.width/6),right=Math.round((c+1)*meta.width/6),top=bounds[r],bottom=bounds[r+1],{logicalWidth}=scales.get(group(r)),logicalHeight=Math.round((bottom-top)/(right-left)*logicalWidth);
 const{data}=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(logicalWidth,logicalHeight,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){data[i+3]=data[i+3]>=160?255:0;if(!data[i+3])data.fill(0,i,i+4);}
 const seen=new Uint8Array(logicalWidth*logicalHeight),components=[];let main=[],removed=0;
 for(let start=0;start<seen.length;start++){if(seen[start]||!data[start*4+3])continue;const todo=[start],pixels=[];seen[start]=1;let edge=false;
  while(todo.length){const p=todo.pop(),x=p%logicalWidth,y=Math.floor(p/logicalWidth);pixels.push(p);edge ||= x===0||x===logicalWidth-1||y===0||y===logicalHeight-1;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++){if(xx<0||xx>=logicalWidth||yy<0||yy>=logicalHeight)continue;const q=yy*logicalWidth+xx;if(!seen[q]&&data[q*4+3]){seen[q]=1;todo.push(q);}}}
  if((edge&&pixels.length<(death?256:120))||(visitors&&pixels.length<4)){removed+=pixels.length;for(const p of pixels)data.fill(0,p*4,p*4+4);}else{components.push(pixels);if(pixels.length>main.length)main=pixels;}
 }
 const mainSet=new Set(main);let sourceFoot=-1;for(let y=Math.floor(logicalHeight*.4);y<logicalHeight;y++)for(let x=Math.floor(logicalWidth*.32);x<logicalWidth*.7;x++){const p=y*logicalWidth+x,i=p*4;if(mainSet.has(p)&&data[i+3]&&Math.max(data[i],data[i+1],data[i+2])<150)sourceFoot=Math.max(sourceFoot,y);}
 if(sourceFoot<0)throw Error('No body foot '+id+' '+r+':'+c);
 for(const pixels of components){if(pixels===main||pixels.length>=120)continue;if(Math.min(...pixels.map(p=>Math.floor(p/logicalWidth)))>sourceFoot+2){removed+=pixels.length;for(const p of pixels)data.fill(0,p*4,p*4+4);}}
 const out=Buffer.alloc(cell*cell*4),shiftX=(cell-logicalWidth*2)/2,shiftY=foot-sourceFoot*2;let clipped=0,opaque=0;
 for(let y=0;y<logicalHeight;y++)for(let x=0;x<logicalWidth;x++){const i=(y*logicalWidth+x)*4;if(!data[i+3])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const dx=x*2+shiftX+xx,dy=y*2+shiftY+yy;if(dx<0||dx>=cell||dy<0||dy>=cell){clipped++;continue;}data.copy(out,(dy*cell+dx)*4,i,i+4);opaque++;}}
 const png=await sharp(out,{raw:{width:cell,height:cell,channels:4}}).png({palette:true,colours:32,dither:0}).toBuffer();pieces.push({input:png,left:c*cell,top:r*cell});frames.push({row:r,col:c,sourceRect:[left,top,right-left,bottom-top],foot:[cell/2,foot],sourceFoot,logicalWidth,opaque,clipped,removedBorderPixels:removed});
}
const output='godot/art/'+id+'-v11.png';await sharp({create:{width:cell*6,height:cell*rows,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(output);
await writeFile('assets/reign-v11/'+id+'-geometry.json',JSON.stringify({aiUseDisclosure:'Original Higgsfield poses exported at one stable native scale per identity across both halves of twelve-frame cycles. Measured source gutters, connected-body foot anchors, binary alpha and nearest two-pixel clusters.',input,output,source:[meta.width,meta.height],rowBounds:bounds,scales:[...scales.values()],frame:[cell,cell],grid:[6,rows],foot:[cell/2,foot],sha256:createHash('sha256').update(await readFile(output)).digest('hex'),frames},null,2));console.log(JSON.stringify({id,frames:frames.length,empty:frames.filter(f=>!f.opaque).length,clipped:frames.reduce((s,f)=>s+f.clipped,0),scales:[...scales.values()]}));
