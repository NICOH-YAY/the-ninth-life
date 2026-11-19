// AI-use disclosure: written by Codex for uniform-scale, foot-anchored Higgsfield motion atlases.
import sharp from 'sharp';import{writeFile,copyFile}from'node:fs/promises';
const id=process.argv[2];if(!['immortal-base-motion','immortal-ascended-motion','challenger-abilities','previous-king','immortal-rest'].includes(id))throw Error('Unsupported atlas');
const input='assets/combat-v3/'+id+'.png';const metadata=await sharp(input).metadata();
const size=96,frame=id==='challenger-abilities'?144:96,offsetX=(frame-size)/2,anchorY=id==='challenger-abilities'?110:94,cols=6,rows=id==='challenger-abilities'?9:id==='previous-king'?4:id==='immortal-rest'?2:8;const composites=[];const anchors=[];
if(!['previous-king','immortal-rest'].includes(id))await copyFile('public/combat-v3/'+id+'.png','public/combat-v3/'+id+'-native48x72.png',1).catch(e=>{if(!['EEXIST','ENOENT'].includes(e.code))throw e;});
for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
 const left=Math.round(col*metadata.width/cols),top=Math.round(row*metadata.height/rows),width=Math.round((col+1)*metadata.width/cols)-left,height=Math.round((row+1)*metadata.height/rows)-top;
 const{data,info}=await sharp(input).extract({left,top,width,height}).resize(size,size,{fit:['previous-king','immortal-rest'].includes(id)?'contain':'fill',position:'bottom',background:'#00000000',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 let feet=-1;
 for(let y=48;y<size;y++)for(let x=33;x<=64;x++){const a=(y*size+x)*4+3;if(data[a]>=96)feet=y;}
 if(feet<0)feet=94;const dy=anchorY-feet;
 const shifted=Buffer.alloc(frame*frame*4);let clippedOpaque=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;const alpha=data[i+3]>=96?255:0;if(!alpha)continue;const yy=y+dy;if(yy<0||yy>=frame){clippedOpaque++;continue;}const j=(yy*frame+x+offsetX)*4;shifted[j]=data[i];shifted[j+1]=data[i+1];shifted[j+2]=data[i+2];shifted[j+3]=255;}
 const png=await sharp(shifted,{raw:{width:frame,height:frame,channels:4}}).png({palette:true,colours:32,dither:0}).toBuffer();
 composites.push({input:png,left:col*frame,top:row*frame});anchors.push({index:row*cols+col,row,col,sourceFeetY:feet,shiftY:dy,clippedOpaque});
}
const output='public/combat-v3/'+id+'.png';
await sharp({create:{width:cols*frame,height:rows*frame,channels:4,background:'#00000000'}}).composite(composites).png().toFile(output);
const rowNames=id==='immortal-rest'?['sit','rise']:id==='previous-king'?['idle','royal-cleave','hurt','collapse']:id==='challenger-abilities'?['kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork']:id==='immortal-base-motion'?['idle','run','jump','dash','cleave','throw','reap','nova']:['idle','run','jump','dash','rift','wisps','tide','bell'];
const layout={disclosure:'AI-use disclosure: Higgsfield source; Codex uses uniform whole-cell nearest-neighbor scale and central-body feet anchoring.',id,source:input,sourceWidth:metadata.width,sourceHeight:metadata.height,cols,rows,frameWidth:frame,frameHeight:frame,frameCount:cols*rows,width:cols*frame,height:rows*frame,anchor:{x:frame/2,y:anchorY},rowNames,alphaThreshold:96,processing:'Each equal source cell uses the same96x96 full-cell mapping. No row or per-frame bounding-box scaling. Central-body feet detection x33..64,y48..95; translateY only to the declared foot anchor; previous-king uses a uniform aspect-preserving whole-cell contain fit. Binaryalpha and32color palette.',anchors};
await writeFile('public/combat-v3/'+id+'.json',JSON.stringify(layout,null,2)+'\n');console.log(JSON.stringify({id,cols,rows,frameWidth:frame,frameHeight:frame,anchor:layout.anchor,clippedOpaque:anchors.reduce((n,a)=>n+a.clippedOpaque,0)}));
