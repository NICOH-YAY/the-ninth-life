// AI-use disclosure: Codex-authored fixed-grid sprite export for original Higgsfield artwork.
import sharp from 'sharp';import{readFile,writeFile,mkdir}from'node:fs/promises';
await mkdir('public/gothic-v5',{recursive:true});
function cleanFlecks(data,size){
 const seen=new Uint8Array(size*size);let removed=0;
 for(let start=0;start<size*size;start++){if(seen[start]||!data[start*4+3])continue;
 const stack=[start],points=[];seen[start]=1;let core=false,edge=false;
 while(stack.length){const p=stack.pop(),x=p%size,y=(p/size)|0;points.push(p);
 if(x>=size*.25&&x<=size*.75&&y>=size*.2&&y<size*.92)core=true;if(x<2||x>=size-2||y<2||y>=size-2)edge=true;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||xx>=size||yy<0||yy>=size)continue;const n=yy*size+xx;if(!seen[n]&&data[n*4+3]){seen[n]=1;stack.push(n);}}}
 if(edge&&!core){for(const p of points)data[p*4+3]=0;removed+=points.length;}
 }return removed;
}

const definitions=[
{id:'boss-monster',key:'gothic-monster',job:'0e006191-9604-4af2-87e2-18367eb2c625',rows:8,frame:192,source:128,foot:154},
{id:'boss-base',key:'gothic-base',job:'13cf3b8c-deb3-4980-be07-707400612d7c',rows:8,frame:192,source:128,foot:154},
{id:'coronation',key:'gothic-coronation',job:'7de8c56b-d99f-4343-8853-15e3680a3cdc',rows:2,frame:192,source:128,foot:154},
{id:'effects',key:'gothic-vfx',job:'01cb2025-a4bd-4821-b527-78055b2ff8b7',rows:8,frame:128,source:128,foot:null},
{id:'visitors',key:'gothic-visitors',job:'37987577-6178-469a-95a9-f5fa338e86a0',rows:9,frame:144,source:96,foot:110}
];
for(const def of definitions){
 if(process.argv[2]&&process.argv[2]!==def.id)continue;
 let meta;try{meta=await sharp('assets/gothic-v5/'+def.id+'.png').metadata();}catch{continue;}
 const pieces=[],anchors=[];
 for(let row=0;row<def.rows;row++)for(let col=0;col<6;col++){
 const left=Math.round(col*meta.width/6),top=Math.round(row*meta.height/def.rows),width=Math.round((col+1)*meta.width/6)-left,height=Math.round((row+1)*meta.height/def.rows)-top;
 const{data}=await sharp('assets/gothic-v5/'+def.id+'.png').extract({left,top,width,height}).resize(def.source,def.source,{fit:'contain',kernel:'nearest',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 const size=def.source;for(let i=3;i<data.length;i+=4)data[i]=data[i]>=160?255:0;
 if(def.id==="visitors")cleanFlecks(data,size);
 let foot=size-1;if(def.foot!==null){foot=-1;for(let y=Math.floor(size*.5);y<size;y++)for(let x=Math.floor(size*.35);x<size*.67;x++)if(data[(y*size+x)*4+3])foot=y;if(foot<0)foot=size-2;}
 const shiftY=def.foot!==null?def.foot-foot:0,shiftX=(def.frame-size)/2,out=Buffer.alloc(def.frame*def.frame*4);let opaque=0,clipped=0;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;if(!data[i+3])continue;const xx=x+shiftX,yy=y+shiftY;if(xx<0||yy<0||xx>=def.frame||yy>=def.frame){clipped++;continue;}data.copy(out,(yy*def.frame+xx)*4,i,i+4);opaque++;}
 const png=await sharp(out,{raw:{width:def.frame,height:def.frame,channels:4}}).png({palette:true,colours:def.foot===null?48:32,dither:0}).toBuffer();pieces.push({input:png,left:col*def.frame,top:row*def.frame});anchors.push({row,col,sourceFeet:foot,shiftY,opaque,clipped});
 }
 await sharp({create:{width:6*def.frame,height:def.rows*def.frame,channels:4,background:'#00000000'}}).composite(pieces).png().toFile('public/gothic-v5/'+def.id+'.png');
 const record={aiUseDisclosure:'Higgsfield generated original artwork; Codex exported uniform source-cell pixels, palette and hard alpha.',...def,cols:6,frameWidth:def.frame,frameHeight:def.frame,footX:def.frame/2,footY:def.foot,sourceWidth:meta.width,sourceHeight:meta.height,alphaThreshold:160,processing:'Same whole-cell contain scale in all frames; no per-frame fit; binary alpha; dither-free palette.',anchors};
 await writeFile('public/gothic-v5/'+def.id+'.json',JSON.stringify(record,null,2)+'\n');console.log(JSON.stringify({id:def.id,frames:pieces.length,empty:anchors.filter(a=>a.opaque===0).length,clipped:anchors.reduce((s,a)=>s+a.clipped,0)}));
}
