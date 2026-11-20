// AI-use disclosure: Codex exported original Higgsfield joint-actor pixels without repainting the action.
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const input='assets/godot-v6/held-impalement-original.png',meta=await sharp(input).metadata();
const pieces=[],frames=[];
for(let row=0;row<2;row++)for(let col=0;col<6;col++){
 const left=Math.round(col*meta.width/6),right=Math.round((col+1)*meta.width/6),top=Math.round(row*meta.height/2);
 const {data,info}=await sharp(input).extract({left,top:top+200,width:right-left,height:360}).resize(160,169,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 for(let i=0;i<data.length;i+=4){data[i+3]=data[i+3]>=160?255:0;if(!data[i+3]){data[i]=0;data[i+1]=0;data[i+2]=0;}}
 let bottom=-1,opaque=0;for(let y=50;y<169;y++)for(let x=0;x<160;x++)if(data[(y*160+x)*4+3])bottom=Math.max(bottom,y);
 const out=Buffer.alloc(320*256*4),shiftX=80,shiftY=240-bottom;
 for(let y=0;y<169;y++)for(let x=0;x<160;x++){const i=(y*160+x)*4;if(!data[i+3])continue;const yy=y+shiftY;if(yy<0||yy>=256)throw Error('Finisher clipping');data.copy(out,(yy*320+x+shiftX)*4,i,i+4);opaque++;}
 const png=await sharp(out,{raw:{width:320,height:256,channels:4}}).png({palette:true,colours:32,dither:0}).toBuffer();
 pieces.push({input:png,left:col*320,top:row*256});frames.push({index:row*6+col,row,col,opaque,foot:240,translation:[shiftX,shiftY],sourceFoot:bottom,clipped:0});
}
await sharp({create:{width:1920,height:512,channels:4,background:'#00000000'}}).composite(pieces).png().toFile('godot/art/held-impalement.png');
await writeFile('assets/godot-v6/finisher-geometry.json',JSON.stringify({aiUseDisclosure:'Higgsfield authored paired physical grapple/heart-impalement poses; Codex applied one fixed pixel export scale, hard alpha and foot alignment.',job:'0e069eca-93f4-4bbb-96a0-10524803ad05',frame:[320,256],grid:[6,2],foot:[160,240],kingHeightApprox:143,pairWidthApprox:160,displayScale:1,frames},null,2));
console.log(JSON.stringify({frames:12,width:1920,height:512,foot:240,empty:frames.filter(x=>!x.opaque).length}));
