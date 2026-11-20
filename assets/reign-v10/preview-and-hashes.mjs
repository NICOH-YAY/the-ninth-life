// AI-use disclosure: Codex builds contact sheets from actual exported game pixels and records source hashes.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const file='assets/reign-v10/manifest.json',manifest=JSON.parse(await readFile(file,'utf8'));
for(const item of manifest.generated){item.sourceSha256=createHash('sha256').update(await readFile(item.source)).digest('hex');item.runtimeSha256=createHash('sha256').update(await readFile(item.runtime)).digest('hex');}
await writeFile(file,JSON.stringify(manifest,null,2));
const frame=async(id,n,cell)=>sharp('godot/art/'+id+'-v10.png').extract({left:n%6*cell,top:Math.floor(n/6)*cell,width:cell,height:cell}).png().toBuffer();
const gait=[{input:await sharp('godot/art/royal-gait-v10.png').extract({left:0,top:0,width:1152,height:384}).png().toBuffer(),left:0,top:0},{input:await sharp('godot/art/sovereign-air-v10.png').extract({left:0,top:384,width:1152,height:384}).png().toBuffer(),left:0,top:384}];
await sharp({create:{width:1152,height:768,channels:4,background:'#17232b'}}).composite(gait).png().toFile('assets/reign-v10/gait-and-hover-contact.png');
const attacks=[];for(let r=0;r<4;r++)for(let c=0;c<6;c++)attacks.push({input:await frame('king-full-attacks',r*12+[5,6,7,8,9,11][c],192),left:c*192,top:r*192});
await sharp({create:{width:1152,height:768,channels:4,background:'#17232b'}}).composite(attacks).png().toFile('assets/reign-v10/attack-contact.png');
const powers=[];for(let r=0;r<9;r++)powers.push({input:await frame('innates',r*6+3,192),left:r%6*192,top:Math.floor(r/6)*192});for(let c=0;c<3;c++)powers.push({input:await frame('death-knight',[5,8,10][c],256),left:64+c*384,top:384});
await sharp({create:{width:1152,height:640,channels:4,background:'#17232b'}}).composite(powers).png().toFile('assets/reign-v10/innate-and-summon-contact.png');
console.log(JSON.stringify({assets:manifest.generated.length,previews:['gait-and-hover-contact.png','attack-contact.png','innate-and-summon-contact.png']}));
