// AI-use disclosure: Codex-authored game-only Foley mixdowns from Chequered Ink's 400 Sounds Pack.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ffmpeg='D:/Coding VS/.tools/ffmpeg/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe';
const root='assets/audio-v5/local-originals/400-sounds/';
await mkdir('public/audio-v5/sfx',{recursive:true});
const defs=[
['sword-swing','Weapons/sword_slice.wav',null,0.95],
['sword-light','Weapons/sword_light.wav',null,0.85],
['sword-draw','Weapons/sword_unsheath.wav',null,0.7],
['metal-guard','Weapons/sword_clash.wav','Materials/glass_ping_big.wav',0.9],
['metal-hit','Weapons/sword_clash_2.wav',null,0.75],
['chain','Materials/metal_clang.wav','Other/whoosh_2.wav',0.75],
['wood','Materials/wood_small_hollow.wav','Materials/wood_small_drop.wav',0.9],
['ice','Materials/glass_ping_small.wav','Combat and Gore/crunch_quick.wav',1.05],
['flesh','Combat and Gore/crunch_splat.wav','Combat and Gore/punch_2.wav',0.88],
['stab','Materials/cork_stabbed.wav','Combat and Gore/splat_quick.wav',0.85],
['dash','Other/whoosh_1.wav','Materials/clothing_1.wav',1.0],
['dash-magic','Environment/air_burst.wav','Materials/glass_ping_big.wav',0.9],
['footstep-1','Footsteps/foley_footstep_concrete_1.wav',null,0.95],
['footstep-2','Footsteps/foley_footstep_concrete_2.wav',null,1.0],
['nova','Weapons/harsh_thud.wav','Retro/explosion_large.wav',0.7]
];
const manifest={aiUseDisclosure:'Codex edited and layered creator-authored Foley sounds for synchronization inside this game; no raw asset-pack redistribution.',author:'Chequered Ink',page:'https://ci.itch.io/400-sounds-pack',creatorLinkedDownload:'https://www.dropbox.com/scl/fo/6y7hlsyisit2rb0bjepzh/AKOfmeyr1gS2wtKC-a34_U0?dl=1&rlkey=rjgot7j72sdcktk7q411xjwbo',license:'Any uses including commercial, with or without credit; unaltered assets must not be redistributed as own game assets.',rawPack:'Local-only ignored source files; excluded from Git/public distribution.',samples:[]};
for(const [id,first,second,rate] of defs){
 const args=['-hide_banner','-loglevel','error','-y','-i',root+first];
 if(second)args.push('-i',root+second);
 const pre='asetrate=44100*'+rate+',aresample=44100,atrim=duration=1.8';
 const filter=second?'[0:a]'+pre+'[one];[1:a]volume=0.30,'+pre+'[two];[one][two]amix=inputs=2:normalize=0,highpass=f=65,alimiter=limit=0.88,afade=t=out:st=1.45:d=0.35[out]':'[0:a]'+pre+',highpass=f=70,alimiter=limit=0.88,afade=t=out:st=1.45:d=0.35[out]';
 const runtime='public/audio-v5/sfx/'+id+'.mp3';
 args.push('-filter_complex',filter,'-map','[out]','-ac','1','-ar','44100','-b:a','96k','-map_metadata','-1',runtime);
 const result=spawnSync(ffmpeg,args,{encoding:'utf8'});if(result.status!==0)throw Error(result.stderr);
 const data=await readFile(runtime);manifest.samples.push({id,sources:[first,...second?[second]:[]],runtime,sha256:createHash('sha256').update(data).digest('hex'),processing:'Edited/trimmed, speed-adjusted '+rate+'x, optional material-layer mix, highpass65-70Hz, peak limiter.88, short tail fade, mono96kbps44.1kHzMP3.',bytes:data.length});
}
await writeFile('assets/audio-v5/sfx-manifest.json',JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({samples:manifest.samples.length,bytes:manifest.samples.reduce((s,v)=>s+v.bytes,0)}));
