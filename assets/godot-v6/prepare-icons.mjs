// AI-use disclosure: Codex derived small pixel HUD icons from this game's attributed original sword and spell sprites.
import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const choices=[
 ['skill-steel.png','godot/art/king.png',{left:28,top:87,width:70,height:70}],
 ['skill-pierce.png','godot/art/effects.png',{left:3*128,top:128,width:128,height:128}],
 ['skill-kneel.png','godot/art/effects.png',{left:3*128,top:2*128,width:128,height:128}],
 ['skill-procession.png','godot/art/royal-effects.png',{left:3*128,top:4*128,width:128,height:128}]
];
const layers=[];
for(let i=0;i<choices.length;i++){const[name,path,rect]=choices[i];const p=await sharp(path).extract(rect).resize(32,32,{fit:'contain',kernel:'nearest',background:'#00000000'}).png().toBuffer();await sharp(p).toFile('godot/art/'+name);layers.push({input:p,left:i*32,top:0});}
await sharp({create:{width:128,height:32,channels:4,background:'#00000000'}}).composite(layers).png().toFile('godot/art/skill-icons.png');
await writeFile('assets/godot-v6/icon-manifest.json',JSON.stringify({aiUseDisclosure:'Codex cropped the game own Higgsfield-authored sword/spell frames into pixel HUD icons. Clockwork Raven public previews informed weapon/skill readability; no Raven asset files were obtained or bundled.',icons:choices.map(([file,source,crop])=>({file:'godot/art/'+file,source,crop})),frame:[32,32],atlas:'godot/art/skill-icons.png'},null,2));
