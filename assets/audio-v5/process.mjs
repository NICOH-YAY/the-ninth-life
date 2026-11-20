// AI-use disclosure: Codex-authored official-source download and game-excerpt processing, not music generation.
import {mkdir,writeFile,readFile,stat} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const ffmpeg='D:/Coding VS/.tools/ffmpeg/ffmpeg-9.0.1-essentials_build/bin/ffmpeg.exe';
const ffprobe=ffmpeg.replace('ffmpeg.exe','ffprobe.exe');
const root='assets/audio-v5', originals=root+'/local-originals';
await mkdir(originals,{recursive:true});await mkdir('public/audio-v5/music',{recursive:true});
const definitions=[
 ['menu','incantation','Incantation',5,100,'Distant castle: eerie effected wordless vocals, ritual ambience and empty space; no battle percussion.'],
 ['years','hiraeth','Hiraeth',20,120,'Passing centuries: solo cello and subdued strings, separate from the menu choir.'],
 ['kitten','call-to-adventure','Call To Adventure',8,96,'Wooden practice staff: bright orchestral adventure and clear heroic rhythm.'],
 ['alley','juggernaut','Juggernaut',18,96,'Hooked red blades: malevolent chugging strings and forceful percussion.'],
 ['sailor','legionnaire-2022','Legionnaire (2022 Remaster)',16,96,'Chain warden: heavy martial brass and drums.'],
 ['acrobat','race-the-sun','Race The Sun',22,96,'Jade chakrams: fast buoyant hybrid-orchestral movement.'],
 ['witch','the-summoning','The Summoning',8,96,'Astral needles: gothic choir and ritual orchestra.'],
 ['knight','goliath','Goliath',32,96,'Warhammer: large low percussion, bold brass and choir.'],
 ['thief','honour-among-thieves','Honour Among Thieves',12,96,'Mirror daggers: agile folk rhythm, winds, accordion and vocal texture.'],
 ['quiet','snowfall','Snowfall',30,96,'Frost spear: layered piano and icy sustained/percussive strings.'],
 ['patchwork','vanguard','Vanguard',45,110,'Broken royal sword: escalating hybrid orchestra with thematic release.'],
 ['finale','helios','Helios',222,110,'Ruined dawn: late orchestral/choir release, separate from every combat theme.']
];
let manifest={aiUseDisclosure:'Codex selected and edited licensed human-composed recordings. No melodies were generated or copied from the commercial references.',date:'2026-11-19',composer:'Scott Buckley',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',artist:'https://www.scottbuckley.com.au/',useTerms:'https://www.scottbuckley.com.au/library/using-this-music/',higgsfieldCheck:'Suno is absent. ElevenLabs/Sonilo music models are present, but the current unlimited allowance lists speech/image/video and does not cover these music models. No paid music generation requested.',tracks:[]};
if(process.argv[2]) manifest=JSON.parse(await readFile(root+'/manifest.json','utf8'));
for(const [id,slug,title,start,seconds,purpose] of definitions.filter(row=>!process.argv[2]||row[0]===process.argv[2])){
 const page='https://www.scottbuckley.com.au/library/'+slug+'/';
 const response=await fetch(page);if(!response.ok)throw Error(page+' HTTP '+response.status);
 const html=await response.text();
 if(!html.includes('creativecommons.org/licenses/by/4.0'))throw Error('No verified CC BY4 link: '+id);
 const url=[...html.matchAll(/https?:[^"\s<>]+\.mp3[^"\s<>]*/g)][0]?.[0]?.replace(/^http:/,'https:');
 if(!url)throw Error('No official MP3 '+id);
 const source=originals+'/'+id+'.mp3';
 try{await stat(source);}catch{
  const mp3=await fetch(url);if(!mp3.ok)throw Error(url+' HTTP '+mp3.status);
  await writeFile(source,Buffer.from(await mp3.arrayBuffer()));
 }
 await writeFile(originals+'/'+id+'-source.html',html);
 const metadata=JSON.parse(spawnSync(ffprobe,['-v','quiet','-show_format','-of','json',source],{encoding:'utf8'}).stdout);
 const duration=Number(metadata.format.duration);if(duration<start+seconds)throw Error('Excerpt beyond original '+id);
 const runtime='public/audio-v5/music/'+id+'.mp3';
 const filters='loudnorm=I=-19:TP=-2:LRA=11,afade=t=in:d=0.7,afade=t=out:st='+(seconds-1.8)+':d=1.8';
 const process=spawnSync(ffmpeg,['-hide_banner','-loglevel','error','-y','-ss',String(start),'-i',source,'-t',String(seconds),'-af',filters,'-ar','44100','-ac','2','-b:a','128k','-map_metadata','-1',runtime],{encoding:'utf8'});
 if(process.status!==0)throw Error(process.stderr);
 const output=await readFile(runtime), input=await readFile(source);
 const description=html.match(/<meta property="og:description" content="([^"]*)/)?.[1]??purpose;
 manifest.tracks=manifest.tracks.filter(track=>track.id!==id);
 manifest.tracks.push({id,title,composer:'Scott Buckley',page,download:url,license:'CC BY 4.0',licenseUrl:manifest.licenseUrl,credit:"'"+title+"' by Scott Buckley – released under CC-BY 4.0. www.scottbuckley.com.au",purpose,officialDescription:description,originalDuration:duration,excerptStart:start,excerptSeconds:seconds,seamlessLoop:false,processing:'Trimmed game excerpt; -19LUFS/-2dBTP/LRA11 normalization; .7s fadein/1.8s fadeout; stereo128kbps44.1kHzMP3. Loop transitions use runtime overlap crossfades.',runtime,bytes:output.length,sourceSha256:createHash('sha256').update(input).digest('hex'),runtimeSha256:createHash('sha256').update(output).digest('hex'),licenseEvidence:{verifiedCcByLink:true,officialSourcePage:page,terms:manifest.useTerms}});
 console.log(JSON.stringify({id,seconds,bytes:output.length,sourceDuration:duration}));
 await writeFile(root+'/manifest.json',JSON.stringify(manifest,null,2)+'\n');
}
const terms=await (await fetch(manifest.useTerms)).text();await writeFile(originals+'/using-this-music.html',terms);
await writeFile(root+'/license-evidence.json',JSON.stringify({aiUseDisclosure:'Codex extracted the official license terms; raw upstream pages are retained locally unchanged.',url:manifest.useTerms,license:'CC BY 4.0',permits:'Use and adapt in credited projects, including commercial games.',credit:"Music by Scott Buckley – released under CC-BY 4.0. www.scottbuckley.com.au",restrictions:'Do not resell music in isolation or submit it to audio fingerprinting services. Orchestral remixes of copyrighted themes are excluded; selected tracks are original library compositions.'},null,2)+'\n');
