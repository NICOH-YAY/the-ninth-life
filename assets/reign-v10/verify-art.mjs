// AI-use disclosure: Codex verifies original Higgsfield twelve-frame gaits, hover acting, physical attacks and innate sprites.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const config=[['sovereign-air',192,6,[[0,12],[12,12],[24,6],[30,6]]],['royal-gait',192,4,[[0,12],[12,12]]],...[0,1,2].map(g=>['visitors-gait-'+g,144,6,[[0,12],[12,12],[24,12]]]),['king-full-attacks',192,8,[[0,12],[12,12],[24,12],[36,12]]],['innates',192,9,Array.from({length:9},(_,r)=>[r*6,6])],['death-knight',256,2,[[0,6],[6,6]]],['sovereign-air-prep',192,2,[[0,6],[6,6]]]];
const checks=[];
for(const [id,cell,rows,ranges]of config){
 const path='godot/art/'+id+'-v10.png',bytes=await readFile(path),{data,info}=await sharp(bytes).ensureAlpha().raw().toBuffer({resolveWithObject:true});let soft=0,offgrid=0;const nonempty=Array(rows*6).fill(0),unique=[];
 for(let y=0;y<info.height;y+=2)for(let x=0;x<info.width;x+=2){const base=(y*info.width+x)*4;if(data[base+3])nonempty[Math.floor(y/cell)*6+Math.floor(x/cell)]++;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const j=((y+yy)*info.width+x+xx)*4;if(data[j+3]!==0&&data[j+3]!==255)soft++;for(let k=0;k<4;k++)if(data[j+k]!==data[base+k]){offgrid++;break;}}}
 for(const[start,count]of ranges){const hashes=[];for(let f=start;f<start+count;f++)hashes.push(createHash('sha256').update(await sharp(bytes).extract({left:f%6*cell,top:Math.floor(f/6)*cell,width:cell,height:cell}).raw().toBuffer()).digest('hex'));unique.push({start,expected:count,actual:new Set(hashes).size});}
 const geometry=JSON.parse(await readFile('assets/reign-v10/'+id+'-geometry.json','utf8'));
 checks.push({id,frames:rows*6,frame:[cell,cell],grid:[6,rows],emptyFrames:nonempty.filter(n=>!n).length,softAlphaPixels:soft,offGridPixels:offgrid,clipped:geometry.frames.reduce((s,f)=>s+f.clipped,0),unique,runtimeSha256:createHash('sha256').update(bytes).digest('hex')});
}
await writeFile('assets/reign-v10/pixel-verification.json',JSON.stringify({aiUseDisclosure:'Codex verified actual native cropped pixels, not metadata labels. These are component checks; full native source-foot and gameplay/browser checks remain separate.',checks},null,2));
console.log(JSON.stringify(checks.map(c=>({id:c.id,frames:c.frames,unique:c.unique.map(u=>u.actual),soft:c.softAlphaPixels,offgrid:c.offGridPixels,clipped:c.clipped,empty:c.emptyFrames}))));
if(checks.some(c=>c.softAlphaPixels||c.offGridPixels||c.clipped||c.emptyFrames||c.unique.some(u=>u.expected!==u.actual)))process.exitCode=1;
