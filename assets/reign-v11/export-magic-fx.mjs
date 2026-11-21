// AI-use disclosure: Codex exports original semantic royal-magic FX and derives weapon-free ability icons.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const input='assets/reign-v11/royal-magic-fx-original.png',m=await sharp(input).metadata(),pieces=[],frames=[];
for(let r=0;r<6;r++){
 const row=[];
 for(let c=0;c<6;c++){
  const left=Math.round(c*m.width/6),right=Math.round((c+1)*m.width/6),top=Math.round(r*m.height/6),bottom=Math.round((r+1)*m.height/6),{data,info}=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(52,52,{fit:'contain',kernel:'nearest',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let maxY=-1,opaque=0;for(let y=0;y<52;y++)for(let x=0;x<52;x++){const i=(y*52+x)*4;data[i+3]=data[i+3]>=160?255:0;if(data[i+3]){maxY=Math.max(maxY,y);opaque++;}else data.fill(0,i,i+4);}
  const ground=[1,2,3].includes(r),shiftY=ground?110-maxY*2:12,out=Buffer.alloc(128*128*4);let clipped=0;
  for(let y=0;y<52;y++)for(let x=0;x<52;x++){const i=(y*52+x)*4;if(!data[i+3])continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const dx=12+x*2+xx,dy=shiftY+y*2+yy;if(dy<0||dy>=128){clipped++;continue;}data.copy(out,(dy*128+dx)*4,i,i+4);}}
  row.push({input:await sharp(out,{raw:{width:128,height:128,channels:4}}).png().toBuffer(),left:c*128,top:0});frames.push({row:r,col:c,opaqueLogicalPixels:opaque,clipped,anchor:ground?[64,110]:[64,64],pixelBlock:2});
 }
 pieces.push({input:await sharp({create:{width:768,height:128,channels:4,background:'#00000000'}}).composite(row).png({palette:true,colours:32,dither:0}).toBuffer(),left:0,top:r*128});
}
const output='godot/art/royal-magic-fx-v11.png';await sharp({create:{width:768,height:768,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(output);
const icons=[],mapping=[[0,1,2,4],[0,1,3,5]];
for(let phase=0;phase<2;phase++)for(let i=0;i<4;i++){const r=mapping[phase][i],cell=await sharp(output).extract({left:3*128,top:r*128,width:128,height:128}).png().toBuffer(),icon=await sharp(cell).trim({threshold:1}).resize(28,28,{fit:'contain',kernel:'nearest',background:'#00000000'}).extend({top:2,bottom:2,left:2,right:2,background:'#00000000'}).png({palette:true,colours:16,dither:0}).toBuffer();icons.push({input:icon,left:i*32,top:phase*32});}
await sharp({create:{width:128,height:64,channels:4,background:'#00000000'}}).composite(icons).png().toFile('godot/art/magic-icons-v11.png');
await writeFile('assets/reign-v11/royal-magic-fx-geometry.json',JSON.stringify({aiUseDisclosure:'Higgsfield authored palm/time/down/up/outward/inward effects. Codex exported hard nearest pixel objects and derived eight semantic icons from their actual contact motifs, without weapon glyphs.',input,output,frame:[128,128],grid:[6,6],anchors:[[64,64],[64,110],[64,110],[64,110],[64,64],[64,64]],frames,icons:{path:'godot/art/magic-icons-v11.png',frame:[32,32],grid:[4,2],rows:mapping},sha256:createHash('sha256').update(await readFile(output)).digest('hex')},null,2));console.log(JSON.stringify({frames:36,clipped:frames.reduce((s,f)=>s+f.clipped,0),icons:8}));
