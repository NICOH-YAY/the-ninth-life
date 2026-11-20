// AI-use disclosure: Codex authored an original sampled-model orchestral accent and edited licensed Chequered Ink Foley for v8.
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const dir='assets/court-v8';await mkdir(dir,{recursive:true});
const ffmpeg='D:/Coding VS/.tools/ffmpeg/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe';
const rate=44100,seconds=2.6,n=Math.round(rate*seconds),pcm=Buffer.alloc(n*2);let seed=82917;
const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296*2-1;};
for(let i=0;i<n;i++){const t=i/rate;let value=0;
 for(const [f,start,amp] of [[146.832,0,.20],[220,.04,.13],[293.665,.08,.13],[440,.12,.09],[587.33,.16,.06]]){
 const u=t-start;if(u<0)continue;const envelope=(1-Math.exp(-u*36))*Math.exp(-u*2.5);
 value+=amp*envelope*(Math.sin(2*Math.PI*f*u)+.20*Math.sin(4*Math.PI*f*u)+.08*Math.sin(6*Math.PI*f*u));
 }value+=.13*Math.sin(2*Math.PI*(62-8*t)*t)*Math.exp(-t*11)+random()*.025*Math.exp(-t*18);
 const fade=Math.min(1,(seconds-t)/.2);pcm.writeInt16LE(Math.round(Math.max(-.85,Math.min(.85,value*fade))*32767),i*2);}
const header=Buffer.alloc(44);header.write('RIFF');header.writeUInt32LE(36+pcm.length,4);header.write('WAVEfmt ',8);header.writeUInt32LE(16,16);header.writeUInt16LE(1,20);header.writeUInt16LE(1,22);header.writeUInt32LE(rate,24);header.writeUInt32LE(rate*2,28);header.writeUInt16LE(2,32);header.writeUInt16LE(16,34);header.write('data',36);header.writeUInt32LE(pcm.length,40);
await writeFile(dir+'/original-orchestral-accent.wav',Buffer.concat([header,pcm]));
const definitions=[['orchestral-accent',dir+'/original-orchestral-accent.wav',2.6],['perfect','assets/audio-v5/local-originals/400-sounds/Weapons/sword_clash.wav',.9],['poise-break','assets/audio-v5/local-originals/400-sounds/Materials/metal_clang.wav',.7]];
const manifest={aiUseDisclosure:'Codex original deterministic synthesis and isolated recorded Foley edits.',original:'orchestral-accent: original synthesized D-minor open-fifth string/brass-like partials and low drum; no commercial audio or music excerpts.',recordingAuthor:'Chequered Ink',source:'https://ci.itch.io/400-sounds-pack',license:'Use in games permitted; no redistribution of unmodified source pack.',samples:[]};
for(const [id,input,duration] of definitions){const output='godot/audio/sfx/'+id+'.ogg';const filter='atrim=duration='+duration+',highpass=f=90,lowpass=f=10500,afade=t=in:d=0.003,afade=t=out:st='+Math.max(.01,duration-.12)+':d=0.12,alimiter=limit=0.80:level=0';
const r=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-i',input,'-af',filter,'-ac','1','-ar','44100','-c:a','libvorbis','-q:a','5','-map_metadata','-1',output],{encoding:'utf8'});if(r.status)throw Error(r.stderr);
const bytes=await readFile(output);manifest.samples.push({id,input,output,filter,sha256:createHash('sha256').update(bytes).digest('hex')});}
await writeFile(dir+'/audio-processing.json',JSON.stringify(manifest,null,2)+'\n');
await writeFile(dir+'/audio-notes.md','AI-use disclosure: Codex authored the v8 audio processing and original accent.\n\n# Court audio v8\n\nThe existing twelve licensed Scott Buckley cues remain separate. Anticipation smoothly reduces their gain; perfect blocks, poise breaks, phase changes and climaxes can trigger one bounded original orchestral accent voice. The accent is a deterministic original synthesis, not a commercial reference recording or an unrelated full-song layer. Perfect-block and poise-break Foley are isolated Chequered Ink sword-clash and metal-clang edits, at original pitch. Existing game-use license and credits remain applicable. Source recording archives are not redistributed.\n\nRun node assets/court-v8/process-audio.mjs to reproduce these three OGG assets. audio-processing.json records sources, processing and hashes.\n');
console.log(JSON.stringify({generated:manifest.samples.map(s=>s.output)}));
