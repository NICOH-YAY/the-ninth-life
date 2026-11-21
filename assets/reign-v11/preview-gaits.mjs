// AI-use disclosure: Codex diagnostic contact sheet of actual runtime paw positions; floorlines are QA-only.
import sharp from 'sharp';import{existsSync}from'node:fs';
const ids=['kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork'],frames=[12,5,11,17,12],pieces=[],labels=[];
for(let r=0;r<ids.length;r++){const id=ids[r],p='godot/art/gait-'+id+'-v11.png';labels.push('<text x="8" y="'+(r*164+24)+'">'+id+'</text>');if(!existsSync(p)||(id==='alley'&&!existsSync('assets/reign-v11/alley-biped-accepted.json')))continue;for(let c=0;c<5;c++){const f=frames[c];pieces.push({input:await sharp(p).extract({left:f%6*144,top:Math.floor(f/6)*144,width:144,height:144}).png().toBuffer(),left:120+c*144,top:r*164+12});}}
const floors=[];for(let r=0;r<9;r++)floors.push('<path d="M120 '+(r*164+122)+' H840" stroke="#68bca6" stroke-width="1"/>');
await sharp({create:{width:840,height:1476,channels:4,background:'#17232b'}}).composite([{input:Buffer.from('<svg width="840" height="1476">'+floors.join('')+'</svg>'),left:0,top:0},...pieces,{input:Buffer.from('<svg width="840" height="1476"><g font-family="monospace" font-size="13" fill="#dac7a0">'+labels.join('')+'</g></svg>'),left:0,top:0}]).png().toFile('assets/reign-v11/gait-floor-contact.png');
console.log('floor QA samples: neutral,walk5,walk11,start5,stop5; no rejected alley shown');
