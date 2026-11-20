// AI-use disclosure: Codex exports original finite Higgsfield innate-power VFX with a shared feet-relative anchor.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const input='assets/reign-v10/innates-original.png',m=await sharp(input).metadata(),{data:source}=await sharp(input).ensureAlpha().raw().toBuffer({resolveWithObject:true}),rows=9,cell=192,foot=154;
const counts=[];for(let y=0;y<m.height;y++){let n=0;for(let x=0;x<m.width;x++)if(source[(y*m.width+x)*4+3]>=160)n++;counts.push(n);}const bounds=[0];for(let r=1;r<rows;r++){const ideal=r*m.height/rows,span=m.height/rows*.18,a=Math.floor(ideal-span),b=Math.ceil(ideal+span);let min=Infinity;for(let y=a;y<=b;y++)min=Math.min(min,counts[y]);let best=Math.round(ideal),distance=Infinity;for(let y=a;y<=b;y++)if(counts[y]<=min+3&&Math.abs(y-ideal)<distance){best=y;distance=Math.abs(y-ideal);}bounds.push(best);}bounds.push(m.height);
const pieces=[],frames=[];
for(let r=0;r<rows;r++){
 const logical=r===5?48:80;
 const pixels=[];let rowFoot=-1;
 for(let c=0;c<6;c++){
  const left=Math.round(c*m.width/6),right=Math.round((c+1)*m.width/6),top=bounds[r],bottom=bounds[r+1],{data}=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(logical,logical,{fit:'contain',kernel:'nearest',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4){data[i+3]=data[i+3]>=160?255:0;if(data[i+3])rowFoot=Math.max(rowFoot,Math.floor(i/4/logical));else data.fill(0,i,i+4);}pixels.push(data);
 }
 const composites=[];
 for(let c=0;c<6;c++){
  const data=pixels[c],out=Buffer.alloc(cell*cell*4),shiftY=foot-rowFoot*2;let opaque=0,clipped=0;
  for(let y=0;y<logical;y++)for(let x=0;x<logical;x++){const i=(y*logical+x)*4;if(!data[i+3])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const dx=x*2+(cell-logical*2)/2+xx,dy=y*2+shiftY+yy;if(dy<0||dy>=cell){clipped++;continue;}data.copy(out,(dy*cell+dx)*4,i,i+4);opaque++;}}
  composites.push({input:await sharp(out,{raw:{width:cell,height:cell,channels:4}}).png().toBuffer(),left:c*cell,top:0});frames.push({row:r,col:c,opaque,clipped,pixelBlock:2,rowFoot,foot:[96,154]});
 }
 pieces.push({input:await sharp({create:{width:1152,height:192,channels:4,background:'#00000000'}}).composite(composites).png({palette:true,colours:32,dither:0}).toBuffer(),left:0,top:r*cell});
}
const output='godot/art/innates-v10.png';await sharp({create:{width:1152,height:1728,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(output);
await writeFile('assets/reign-v10/innates-geometry.json',JSON.stringify({aiUseDisclosure:'Higgsfield authored finite original innate powers. Codex used fixed per-row scale, binary alpha, measured source gutters and shared foot-relative placement; all six effect stages retain their internal positions.',input,output,rowBounds:bounds,frame:[192,192],grid:[6,9],foot:[96,154],sha256:createHash('sha256').update(await readFile(output)).digest('hex'),frames},null,2));console.log(JSON.stringify({frames:54,empty:frames.filter(f=>!f.opaque).length,clipped:frames.reduce((n,f)=>n+f.clipped,0)}));
