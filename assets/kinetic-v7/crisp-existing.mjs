// AI-use disclosure: Codex fixed-grid exports of original Higgsfield sprites; no painterly runtime interpolation.
import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('assets/kinetic-v7',{recursive:true});
const config=[
 ['king','godot/art/king.png',192,192,6,8,32],
 ['visitors-walk','godot/art/visitors-walk.png',144,144,6,9,32],
 ['visitors-combat','godot/art/visitors-combat.png',144,144,6,9,32],
 ['visitors-idle-hurt','godot/art/visitors-idle-hurt.png',144,144,6,9,32],
 ['waiting','godot/art/waiting.png',192,192,6,2,32],
 ['previous','godot/art/previous.png',96,96,6,4,32],
 ['coronation','godot/art/coronation.png',192,192,6,2,32],
 ['held-impalement','godot/art/held-impalement.png',320,256,6,2,48],
 ['effects','godot/art/effects.png',128,128,6,8,24],
 ['royal-effects','godot/art/royal-effects.png',128,128,6,5,24],
 ['visitor-effects','godot/art/visitor-effects.png',128,128,6,8,24],
 ['blood','godot/art/blood.png',128,128,6,2,16]
];
const records=[];
for(const [id,input,w,h,cols,rows,colours] of config){
 const m=await sharp(input).metadata();
 if(m.width!==w*cols || m.height!==h*rows)throw Error('Unexpected atlas '+id+' '+JSON.stringify(m));
 const rowOutputs=[],frames=[];
 for(let r=0;r<rows;r++){
  const cells=[];
  for(let c=0;c<cols;c++){
   // Every cell is sampled independently, anchored to its own pixel lattice.
   const {data,info}=await sharp(input).extract({left:c*w,top:r*h,width:w,height:h}).resize(w/2,h/2,{kernel:'nearest',fit:'fill'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
   let visible=0;for(let i=0;i<data.length;i+=4){data[i+3]=data[i+3]>=128?255:0;if(!data[i+3])data.fill(0,i,i+4);else visible++;}
   const cell=await sharp(data,{raw:info}).resize(w,h,{kernel:'nearest',fit:'fill'}).png().toBuffer();
   cells.push({input:cell,left:c*w,top:0});frames.push({row:r,col:c,opaqueLogicalPixels:visible,cell:[w,h],pixelGrid:2});
  }
  const row=await sharp({create:{width:w*cols,height:h,channels:4,background:'#00000000'}}).composite(cells).png({palette:true,colours,dither:0}).toBuffer();
  rowOutputs.push({input:row,left:0,top:r*h});
 }
 const output='godot/art/'+id+'-v7.png';
 await sharp({create:{width:w*cols,height:h*rows,channels:4,background:'#00000000'}}).composite(rowOutputs).png().toFile(output);
 records.push({id,input,output,frame:[w,h],grid:[cols,rows],logicalPixelBlock:2,coloursPerRow:colours,sourceSha256:createHash('sha256').update(await readFile(input)).digest('hex'),outputSha256:createHash('sha256').update(await readFile(output)).digest('hex'),frames});
}
await writeFile('assets/kinetic-v7/crisp-geometry.json',JSON.stringify({aiUseDisclosure:'Codex exported existing original sprite artwork on fixed two-source-pixel clusters, independently per cell, hard alpha, nearest only and a coherent limited palette per animation/visitor row. Originals remain unchanged.',pixelGrid:2,records},null,2));
console.log(JSON.stringify(records.map(x=>({id:x.id,frames:x.frames.length,output:x.output}))));
