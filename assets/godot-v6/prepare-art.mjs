// AI-use disclosure: Codex prepared existing attributed pixel assets for the native Godot project.
import sharp from 'sharp';
import {mkdir,copyFile,writeFile} from 'node:fs/promises';
await mkdir('godot/art',{recursive:true});
await mkdir('assets/godot-v6',{recursive:true});
const copies={
'king.png':'public/gothic-v5/boss-base.png',
'visitors-walk.png':'public/royal-v4/visitor-walk.png',
'visitors-combat.png':'public/royal-v4/visitor-combat.png',
'visitors-idle-hurt.png':'public/gothic-v5/visitors.png',
'coronation.png':'public/gothic-v5/coronation.png',
'effects.png':'public/gothic-v5/effects.png',
'royal-effects.png':'public/royal-v4/royal-vfx.png',
'visitor-effects.png':'public/royal-v4/visitor-vfx.png',
'blood.png':'public/royal-v4/blood-hit.png',
'menu.png':'public/gothic-v5/menu-castle.png'};
for(const [dest,source]of Object.entries(copies))await copyFile(source,'godot/art/'+dest);
for(const [dest,source]of Object.entries({'arena-night.png':'public/royal-v4/arena-night.png','arena-mid.png':'public/royal-v4/arena-mid.png','arena-late.png':'public/royal-v4/arena-late.png','arena-ruins.png':'public/royal-v4/dawn-ruins.png'})){
await sharp(source).resize(320,180,{fit:'fill',kernel:'nearest'}).png({palette:true,colours:48,dither:0}).toFile('godot/art/'+dest);
}
const h=async(path,cell,row,foot)=>{const {data}=await sharp(path).extract({left:0,top:row*cell,width:cell,height:cell}).ensureAlpha().raw().toBuffer({resolveWithObject:true});for(let y=0;y<foot;y++)for(let x=Math.floor(cell*.32);x<cell*.68;x++)if(data[(y*cell+x)*4+3]>100)return foot-y;return foot;};
const heights=[];
for(let i=0;i<9;i++)heights.push(await h('godot/art/visitors-walk.png',144,i,110));
const king=await h('godot/art/king.png',192,0,154);
await writeFile('assets/godot-v6/actor-geometry.json',JSON.stringify({aiUseDisclosure:'Codex measured existing native pixel bodies at stable foot anchors. No per-frame rescaling.',kingBody:king,visitorBodies:heights,kingFoot:[96,154],visitorFoot:[72,110]},null,2));
console.log(JSON.stringify({king,heights,copies:Object.keys(copies).length}));
