// AI-use disclosure: Codex prepared clean native-rate recorded Foley and copied the licensed score for Godot.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ffmpeg='D:/Coding VS/.tools/ffmpeg/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe';
const source='assets/audio-v5/local-originals/400-sounds/';
await mkdir('godot/audio/sfx',{recursive:true});await mkdir('godot/audio/music',{recursive:true});await mkdir('godot/content',{recursive:true});
const definitions=[
 ['sword-swing','Weapons/sword_slice.wav',0.65],
 ['sword-hit','Weapons/sword_light.wav',0.70],
 ['sword-draw','Weapons/sword_unsheath.wav',0.75],
 ['guard','Weapons/sword_clash.wav',0.70],
 ['chain','Materials/metal_clang.wav',0.70],
 ['wood','Materials/wood_small_hollow.wav',0.65],
 ['ice','Materials/glass_ping_small.wav',0.60],
 ['flesh','Combat and Gore/punch_2.wav',0.60],
 ['stab','Materials/cork_stabbed.wav',0.65],
 ['dash','Other/whoosh_1.wav',0.60],
 ['magic','Environment/air_burst.wav',0.85],
 ['step1','Footsteps/foley_footstep_concrete_1.wav',0.38],
 ['step2','Footsteps/foley_footstep_concrete_2.wav',0.38],
 ['nova','Retro/explosion_large.wav',1.10],
 ['cloth','Materials/clothing_1.wav',0.42],
];
const manifest={aiUseDisclosure:'Codex edited creator-authored recordings at native pitch, using one isolated source per sound rather than layered, slowed metallic mixes.',author:'Chequered Ink',source:'https://ci.itch.io/400-sounds-pack',license:'Use in games permitted; unmodified source-pack redistribution excluded.',samples:[]};
for(const [id,file,duration] of definitions){
 const out='godot/audio/sfx/'+id+'.ogg';
 const filter='atrim=duration='+duration+',asetpts=PTS-STARTPTS,highpass=f=110,lowpass=f=11000,volume=0.82,afade=t=in:d=0.004,afade=t=out:st='+Math.max(0.01,duration-0.07)+':d=0.07,alimiter=limit=0.80:level=0';
 const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',source+file,'-af',filter,'-ac','1','-ar','44100','-c:a','libvorbis','-q:a','5','-map_metadata','-1',out],{encoding:'utf8'});
 if(r.status!==0)throw Error(r.stderr);
 const bytes=await readFile(out);
 manifest.samples.push({id,input:file,output:out,durationLimit:duration,pitch:'unchanged',processing:filter,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const tracks=['menu','years','kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork','finale'];
for(const cue of tracks)await copyFile('public/audio-v5/music/'+cue+'.mp3','godot/audio/music/'+cue+'.mp3');
const ts=await readFile('src/game/visitor-dialogue.ts','utf8');
const typescript=await import('typescript');
const compiled=typescript.transpileModule(ts+'\nexport { CONVERSATIONS };\n',{compilerOptions:{module:typescript.ModuleKind.CommonJS,target:typescript.ScriptTarget.ES2022}}).outputText;
const exported={};new Function('exports',compiled)(exported);
await writeFile('godot/content/visitors.json',JSON.stringify({aiUseDisclosure:'Codex ported the existing authored branching conversations to native Godot JSON.',visitors:exported.CONVERSATIONS},null,2)+'\n');
await copyFile('assets/audio-v5/manifest.json','godot/content/music-license-manifest.json');
await writeFile('assets/godot-v6/audio-processing.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({sounds:manifest.samples.length,music:tracks.length,visitors:Object.keys(exported.CONVERSATIONS).length}));
