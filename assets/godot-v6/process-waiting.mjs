// AI-use disclosure: Codex exports original Higgsfield weary waiting/rising sprites at a uniform source scale.
import sharp from 'sharp';import{writeFile}from'node:fs/promises';
const path='assets/godot-v6/waiting-original.png',meta=await sharp(path).metadata(),pieces=[],frames=[];
for(let row=0;row<2;row++)for(let col=0;col<6;col++){
 const left=Math.round(col*meta.width/6),top=Math.round(row*meta.height/2),width=Math.round((col+1)*meta.width/6)-left,height=Math.round((row+1)*meta.height/2)-top;
 const{data}=await sharp(path).extract({left,top,width,height}).resize(128,128,{fit:'contain',kernel:'nearest',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=3;i<data.length;i+=4)data[i]=data[i]>=160?255:0;
 let foot=-1;for(let y=60;y<128;y++)for(let x=40;x<90;x++)if(data[(y*128+x)*4+3])foot=y;
 if(foot<0)throw Error('Empty waiting frame');const shift=154-foot,out=Buffer.alloc(192*192*4);let opaque=0,clip=0;
 for(let y=0;y<128;y++)for(let x=0;x<128;x++){const i=(y*128+x)*4;if(!data[i+3])continue;const yy=y+shift;if(yy<0||yy>=192){clip++;continue;}data.copy(out,(yy*192+x+32)*4,i,i+4);opaque++;}
 const png=await sharp(out,{raw:{width:192,height:192,channels:4}}).png({palette:true,colours:32,dither:0}).toBuffer();pieces.push({input:png,left:col*192,top:row*192});frames.push({row,col,opaque,clipped:clip,sourceFoot:foot,shiftY:shift});
}
await sharp({create:{width:1152,height:384,channels:4,background:'#00000000'}}).composite(pieces).png().toFile('godot/art/waiting.png');
await writeFile('assets/godot-v6/waiting-geometry.json',JSON.stringify({aiUseDisclosure:'Higgsfield created original slumped seated and slow rising poses; Codex used a fixed whole-cell source128 scale and foot154, never fitting seated poses to standing height.',job:'989d9c3d-0b5d-452c-9c0f-8452c613bd34',frame:[192,192],grid:[6,2],foot:[96,154],standingReferenceBody:107,seatedBodyApprox:79,suggestedThroneFootY:422,frames},null,2));
console.log(JSON.stringify({frames:12,empty:frames.filter(x=>!x.opaque).length,clipped:frames.reduce((s,x)=>s+x.clipped,0)}));
