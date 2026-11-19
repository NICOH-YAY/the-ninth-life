// AI-use disclosure: written by Codex to process Higgsfield combat-v3 source atlases; originals are preserved.
import sharp from 'sharp';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
const specs={
 'castle-exterior':{cols:1,rows:1,frameWidth:960,frameHeight:540,kind:'background',rowNames:['castle']},
 'combat-vfx':{cols:6,rows:6,frameWidth:128,frameHeight:128,kind:'effect',rowNames:['crescent-slash','spinning-glaive','shadow-wave','nova-burst','enemy-slash-bloodsparks','shield-hitsparks']},
 'immortal-base-motion':{cols:6,rows:8,frameWidth:48,frameHeight:72,kind:'character',rowNames:['idle','run','jump','dash','cleave','throw','reap','nova']},
 'immortal-ascended-motion':{cols:6,rows:8,frameWidth:48,frameHeight:72,kind:'character',rowNames:['idle','run','jump','dash','rift','wisps','tide','bell']},
 'challenger-abilities':{cols:6,rows:9,frameWidth:48,frameHeight:72,kind:'character',rowNames:['kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork']}
};
const id=process.argv[2]; const spec=specs[id]; if(!spec)throw new Error('Unknown asset '+id);
await mkdir('public/combat-v3',{recursive:true});
const input='assets/combat-v3/'+id+'.png';
const image=sharp(input); const meta=await image.metadata();
if(spec.kind==='background'){
 await image.resize(480,270,{fit:'fill',kernel:'nearest'}).resize(960,540,{kernel:'nearest'}).png().toFile('public/combat-v3/'+id+'.png');
}else{
 const composites=[];const frames=[];const cells=[];
 for(let row=0;row<spec.rows;row++){
  const rowCells=[];let minX=Infinity,minY=Infinity,maxX=0,maxY=0;
  for(let col=0;col<spec.cols;col++){
   const left=Math.round(col*meta.width/spec.cols),top=Math.round(row*meta.height/spec.rows);
   const width=Math.round((col+1)*meta.width/spec.cols)-left,height=Math.round((row+1)*meta.height/spec.rows)-top;
   const {data,info}=await sharp(input).extract({left,top,width,height}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let opaque=0;for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const a=(y*width+x)*4+3;data[a]=data[a]>=(spec.kind==='effect'?40:96)?255:0;
    if(data[a]){opaque++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}
   }
   rowCells.push({data,info,width,height,opaque});
  }
  if(!Number.isFinite(minX)){minX=0;minY=0;maxX=rowCells[0].width-1;maxY=rowCells[0].height-1;}
  for(let col=0;col<spec.cols;col++){
   const cell=rowCells[col];
   let prepared=sharp(cell.data,{raw:cell.info});
   if(spec.kind==='character'){
    const crop={left:Math.max(0,minX-2),top:Math.max(0,minY-2),width:Math.min(cell.width,Math.ceil(maxX+3))-Math.max(0,minX-2),height:Math.min(cell.height,Math.ceil(maxY+3))-Math.max(0,minY-2)};
    prepared=prepared.extract(crop).resize(spec.frameWidth-4,spec.frameHeight-4,{fit:'contain',position:'bottom',background:'#00000000',kernel:'nearest'}).extend({left:2,right:2,top:2,bottom:2,background:'#00000000'});
   }else prepared=prepared.resize(spec.frameWidth,spec.frameHeight,{fit:'fill',kernel:'nearest'});
   const png=await prepared.png({palette:true,colours:spec.kind==='effect'?48:32,dither:0}).toBuffer();
   composites.push({input:png,left:col*spec.frameWidth,top:row*spec.frameHeight});
   frames.push({index:row*spec.cols+col,row,col,name:spec.rowNames[row],sourceOpaquePixels:cell.opaque});
  }
 }
 await sharp({create:{width:spec.cols*spec.frameWidth,height:spec.rows*spec.frameHeight,channels:4,background:'#00000000'}}).composite(composites).png().toFile('public/combat-v3/'+id+'.png');
 cells.push(...frames);
}
const layout={disclosure:'AI-use disclosure: Higgsfield generated the source; Codex processed frame geometry, nearest-neighbor pixels and hard alpha with sharp.',id,source:input,sourceWidth:meta.width,sourceHeight:meta.height,hasSourceAlpha:meta.hasAlpha,...spec,frameCount:spec.cols*spec.rows,width:spec.cols*spec.frameWidth,height:spec.rows*spec.frameHeight,alphaThreshold:spec.kind==='effect'?40:96,processing:'Original preserved. Each frame extracted separately. Characters fit a shared row bounding box to preserve relative animation positions. Effects preserve whole cell. Hard alpha, nearest-neighbor resizing and dither-free palette.'};
await writeFile('public/combat-v3/'+id+'.json',JSON.stringify(layout,null,2)+'\n');console.log(JSON.stringify(layout));
