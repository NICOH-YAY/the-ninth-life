// AI-use disclosure: Codex exports original Higgsfield shield and ground-warning sprite pixels.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const guardBounds=[0,234,462,666,861,1074,1267,1466,1681,1868,2076,2336];
const id=process.argv[2],rows=Number(process.argv[3]),input='assets/memory-v8/'+id+'-original.png',m=await sharp(input).metadata(),pieces=[],frames=[];
for(let r=0;r<rows;r++){
 const cells=[];
 for(let c=0;c<6;c++){
  const left=Math.round(c*m.width/6),right=Math.round((c+1)*m.width/6),top=id==='guard-sigils'?guardBounds[r]:Math.round(r*m.height/rows),bottom=id==='guard-sigils'?guardBounds[r+1]:Math.round((r+1)*m.height/rows);
  const size=id==='guard-sigils'?52:64;
  const {data,info}=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(size,size,{fit:'contain',kernel:'nearest',background:'#00000000'}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  let opaque=0;for(let i=0;i<data.length;i+=4){data[i+3]=data[i+3]>=160?255:0;if(data[i+3])opaque++;else data.fill(0,i,i+4);}
  const png=await sharp(data,{raw:info}).resize(size*2,size*2,{kernel:'nearest'}).extend({top:(128-size*2)/2,bottom:(128-size*2)/2,left:(128-size*2)/2,right:(128-size*2)/2,background:'#00000000'}).png().toBuffer();
  cells.push({input:png,left:c*128,top:0});frames.push({row:r,col:c,opaqueLogicalPixels:opaque,sourceRect:[left,top,right-left,bottom-top],frame:[128,128],pixelGrid:2,clipped:0});
 }
 const row=await sharp({create:{width:768,height:128,channels:4,background:'#00000000'}}).composite(cells).png({palette:true,colours:32,dither:0}).toBuffer();
 pieces.push({input:row,left:0,top:r*128});
}
const output='godot/art/'+id+'-v8.png';await sharp({create:{width:768,height:rows*128,channels:4,background:'#00000000'}}).composite(pieces).png().toFile(output);
await writeFile('assets/memory-v8/'+id+'-geometry.json',JSON.stringify({aiUseDisclosure:'Higgsfield created the original animated shields/telegraphs. Codex applied fixed whole-cell nearest sampling, binary alpha, limited per-row palette and a two-pixel logical grid.',input,output,source:[m.width,m.height],frame:[128,128],grid:[6,rows],sha256:createHash('sha256').update(await readFile(output)).digest('hex'),frames},null,2));
console.log(JSON.stringify({id,frames:frames.length,empty:frames.filter(x=>!x.opaqueLogicalPixels).length,output}));
