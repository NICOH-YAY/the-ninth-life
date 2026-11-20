// AI-use disclosure: written by Codex to preserve and prepare Higgsfield royal-v4 source assets.
import sharp from 'sharp';import{readFile,writeFile,mkdir}from'node:fs/promises';
function cleanEdgeFlecks(data,size,threshold){
 const visited=new Uint8Array(size*size);let removed=0;
 for(let start=0;start<size*size;start++){if(visited[start]||data[start*4+3]<threshold)continue;const stack=[start],component=[];visited[start]=1;let core=false,edge=false;
 while(stack.length){const p=stack.pop(),x=p%size,y=Math.floor(p/size);component.push(p);if(x>=24&&x<=74&&y>=24&&y<=90)core=true;if(x<2||x>=size-2||y<2||y>=size-2)edge=true;
 for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=size||yy>=size)continue;const q=yy*size+xx;if(!visited[q]&&data[q*4+3]>=threshold){visited[q]=1;stack.push(q);}}}
 if(edge&&!core){for(const p of component)data[p*4+3]=0;removed+=component.length;}}
 return removed;
}
const id=process.argv[2],manifest=JSON.parse(await readFile('assets/royal-v4/manifest.json','utf8')),asset=manifest.assets.find(a=>a.id===id);if(!asset)throw Error('Unknown royal asset '+id);
const input='assets/royal-v4/'+id+'.png',out='public/royal-v4/'+id+'.png';await mkdir('public/royal-v4',{recursive:true});
const meta=await sharp(input).metadata();let result;
if(asset.kind==='background'){
 let native=await sharp(input).resize(320,180,{fit:'fill',kernel:'nearest'}).png({palette:true,colours:32,dither:0}).toBuffer();
 if(id==='dawn-ruins'){
  await writeFile('assets/royal-v4/dawn-ruins-unregistered-native320x180.png',native,{flag:'wx'}).catch(e=>{if(e.code!=='EEXIST')throw e;});
  const edge=await sharp(native).extract({left:0,top:0,width:320,height:6}).flip().png().toBuffer();
  const body=await sharp(native).extract({left:0,top:0,width:320,height:174}).png().toBuffer();
  native=await sharp({create:{width:320,height:180,channels:3,background:'#080d1c'}}).composite([{input:edge,left:0,top:0},{input:body,left:0,top:6}]).png({palette:true,colours:32,dither:0}).toBuffer();
 }
 await writeFile('assets/royal-v4/'+id+'-native320x180.png',native);
 await sharp(native).resize(960,540,{kernel:'nearest'}).png({palette:true,colours:32,dither:0}).toFile(out);
 result={cols:1,rows:1,frameWidth:960,frameHeight:540,width:960,height:540,frameCount:1,nativeWidth:320,nativeHeight:180,paletteColors:32,...(id==='dawn-ruins'?{floorRegistration:{sourceNativeY:147,referenceNativeY:153,shiftNativeY:6,shiftOutputY:18}}:{}),processing:'Native320x180 nearest-neighbor, dither-free32-color palette, then exact3x nearest-neighbor enlargement.'};
}else{
 const character=asset.kind==='character',sourceSize=character?96:128,frame=character?144:128,offsetX=(frame-sourceSize)/2,footY=character?110:null;
 const pieces=[],anchors=[];let totalClipped=0;
 for(let row=0;row<asset.rows;row++)for(let col=0;col<asset.cols;col++){
  const left=Math.round(col*meta.width/asset.cols),top=Math.round(row*meta.height/asset.rows),width=Math.round((col+1)*meta.width/asset.cols)-left,height=Math.round((row+1)*meta.height/asset.rows)-top;
  const{data}=await sharp(input).extract({left,top,width,height}).resize(sourceSize,sourceSize,{fit:'fill',kernel:'nearest'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const threshold=character?96:40,removedEdgePixels=character?cleanEdgeFlecks(data,sourceSize,threshold):0;let feet=sourceSize-2;
  if(character){feet=-1;for(let y=48;y<sourceSize;y++)for(let x=33;x<=64;x++)if(data[(y*sourceSize+x)*4+3]>=threshold)feet=y;if(feet<0)feet=94;}
  const dy=character?footY-feet:0,output=Buffer.alloc(frame*frame*4);let opaque=0,clipped=0;
  for(let y=0;y<sourceSize;y++)for(let x=0;x<sourceSize;x++){const i=(y*sourceSize+x)*4;if(data[i+3]<threshold)continue;const yy=y+dy,xx=x+offsetX;if(yy<0||yy>=frame||xx<0||xx>=frame){clipped++;continue;}const j=(yy*frame+xx)*4;output[j]=data[i];output[j+1]=data[i+1];output[j+2]=data[i+2];output[j+3]=255;opaque++;}
  const png=await sharp(output,{raw:{width:frame,height:frame,channels:4}}).png({palette:true,colours:character?32:48,dither:0}).toBuffer();
  pieces.push({input:png,left:col*frame,top:row*frame});anchors.push({index:row*asset.cols+col,row,col,sourceFeetY:character?feet:null,shiftY:dy,opaquePixels:opaque,clippedOpaque:clipped,removedEdgePixels});totalClipped+=clipped;
 }
 const frameRemaps=id==='visitor-combat'?[{row:2,fromCol:3,toCol:4,reason:'Replace generated hooked-blade substitution with coherent chain-flail attack pose.'},{row:6,fromCol:0,toCol:1,reason:'Replace generated hammer substitution with coherent mirror-dagger pose.'}]:[];
 for(const map of frameRemaps){const source=map.row*asset.cols+map.fromCol,destination=map.row*asset.cols+map.toCol;pieces[destination]={...pieces[destination],input:pieces[source].input};anchors[destination]={...anchors[destination],reusedFromFrame:source,reason:map.reason};}
 await sharp({create:{width:asset.cols*frame,height:asset.rows*frame,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(out);
 result={cols:asset.cols,rows:asset.rows,frameWidth:frame,frameHeight:frame,width:asset.cols*frame,height:asset.rows*frame,frameCount:asset.cols*asset.rows,rowNames:asset.rowNames,sourceCellScale:sourceSize,footX:character?frame/2:null,footY,anchor:character?{x:frame/2,y:footY}:{x:frame/2,y:frame/2},alphaThreshold:character?96:40,totalClippedOpaque:totalClipped,frameRemaps,anchors,processing:character?'Uniform96x96 whole-cell nearest-neighbor mapping for every frame/row, no bounding-box scaling. Central feet x33..64 anchored at110. Body scale preserved; frame padded144x144. Hard alpha and dither-free32-color quantization.':'Uniform128x128 whole-cell nearest-neighbor effects. Hard alpha, 48-color dither-free palette, transparent negative space preserved.'};
}
const layout={disclosure:'AI-use disclosure: Higgsfield generated source artwork; Codex processed native pixels, atlas geometry and alpha with sharp.',id,source:input,sourceWidth:meta.width,sourceHeight:meta.height,hasSourceAlpha:meta.hasAlpha,job_id:asset.job_id,...result};
await writeFile('public/royal-v4/'+id+'.json',JSON.stringify(layout,null,2)+'\n');console.log(JSON.stringify({id,sourceWidth:meta.width,sourceHeight:meta.height,...result,anchors:undefined}));
