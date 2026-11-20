// AI-use disclosure: Codex exports original Higgsfield motion on a native pixel grid, preserving generated poses.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const id=process.argv[2],rows=Number(process.argv[3]),pair=id==='opening-duel';
if(!id||!rows)throw Error('Usage: node assets/kinetic-v7/export-generated.mjs id rows');
const input='assets/kinetic-v7/'+id+'-original.png',m=await sharp(input).metadata(),w=pair?320:192,h=pair?256:192,foot=pair?240:154;
const logicalWidth=pair?120:id==='transformation'?50:80, logicalHeight=Math.round((m.height/rows)/(m.width/6)*logicalWidth), pieces=[],frames=[];
for(let r=0;r<rows;r++)for(let c=0;c<6;c++){
 const left=Math.round(c*m.width/6),right=Math.round((c+1)*m.width/6),top=Math.round(r*m.height/rows),bottom=Math.round((r+1)*m.height/rows);
 const{data,info}=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(logicalWidth,logicalHeight,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){data[i+3]=data[i+3]>=160?255:0;if(!data[i+3])data.fill(0,i,i+4);}
 let removedBorderPixels=0; let mainPixels=[];const components=[];const seen=new Uint8Array(logicalWidth*logicalHeight); for(let start=0;start<seen.length;start++){if(seen[start]||!data[start*4+3])continue;const stack=[start],pixels=[];seen[start]=1;let edge=false;while(stack.length){const pos=stack.pop(),x=pos%logicalWidth,y=Math.floor(pos/logicalWidth);pixels.push(pos);edge ||= x===0||x===logicalWidth-1||y===0||y===logicalHeight-1;for(const [xx,yy]of[[x-1,y],[x+1,y],[x,y-1],[x,y+1],[x-1,y-1],[x+1,y-1],[x-1,y+1],[x+1,y+1]]){if(xx<0||xx>=logicalWidth||yy<0||yy>=logicalHeight)continue;const j=yy*logicalWidth+xx;if(!seen[j]&&data[j*4+3]){seen[j]=1;stack.push(j);}}}if(edge&&pixels.length<200){removedBorderPixels+=pixels.length;for(const pos of pixels)data.fill(0,pos*4,pos*4+4);}else{components.push(pixels);if(pixels.length>mainPixels.length)mainPixels=pixels;}}
 const mainSet=new Set(mainPixels);let sourceFoot=-1;
 for(let y=Math.floor(logicalHeight*.45);y<logicalHeight;y++)for(let x=Math.floor(logicalWidth*.32);x<logicalWidth*.7;x++){
  const i=(y*logicalWidth+x)*4;
  if(mainSet.has(y*logicalWidth+x) && data[i+3] && Math.max(data[i],data[i+1],data[i+2])<135)sourceFoot=y;
 }
 if(sourceFoot<0)throw Error('No visible feet '+id+' '+r+':'+c);
 for(const pixels of components){if(pixels===mainPixels||pixels.length>=200)continue;const low=Math.min(...pixels.map(pos=>Math.floor(pos/logicalWidth)));if(low>sourceFoot+2){removedBorderPixels+=pixels.length;for(const pos of pixels)data.fill(0,pos*4,pos*4+4);}}
 const out=Buffer.alloc(w*h*4),shiftX=(w-logicalWidth*2)/2,shiftY=foot-sourceFoot*2,opaque=[];let clip=0,count=0;
 for(let y=0;y<logicalHeight;y++)for(let x=0;x<logicalWidth;x++){
  const i=(y*logicalWidth+x)*4;if(!data[i+3])continue;
  for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){
   const dx=x*2+shiftX+xx,dy=y*2+shiftY+yy;
   if(dx<0||dx>=w||dy<0||dy>=h){clip++;continue;}
   data.copy(out,(dy*w+dx)*4,i,i+4);count++;
  }
 }
 const png=await sharp(out,{raw:{width:w,height:h,channels:4}}).png({palette:true,colours:pair?48:32,dither:0}).toBuffer();
 pieces.push({input:png,left:c*w,top:r*h});
 frames.push({row:r,col:c,sourceRect:[left,top,right-left,bottom-top],sourceFoot,foot:[w/2,foot],pixelBlock:2,shift:[shiftX,shiftY],opaque:count,clipped:clip,removedBorderPixels});
}
const output='godot/art/'+id+'-v7.png';
await sharp({create:{width:w*6,height:h*rows,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(output);
await writeFile('assets/kinetic-v7/'+id+'-geometry.json',JSON.stringify({aiUseDisclosure:'Original Higgsfield poses; fixed full-cell nearest sampling, hard alpha, two-pixel clusters, limited palette, no per-frame scale fitting. Per-frame vertical translation aligns physical feet.',input,output,source:[m.width,m.height],frame:[w,h],grid:[6,rows],foot:[w/2,foot],body:pair?143:id==='hollow-sovereign'?130:107,sha256:createHash('sha256').update(await readFile(output)).digest('hex'),frames},null,2));
console.log(JSON.stringify({output,frames:frames.length,clip:frames.reduce((s,x)=>s+x.clipped,0),empty:frames.filter(x=>!x.opaque).length}));
