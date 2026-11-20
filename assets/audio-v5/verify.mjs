// AI-use disclosure: Codex-authored isolated native-browser audio component verification.
import {chromium} from 'playwright';
import {createServer} from 'vite';
import {mkdir,writeFile} from 'node:fs/promises';
const out='output/qa/audio-v5';await mkdir(out,{recursive:true});
const server=await createServer({server:{host:'127.0.0.1',port:5191,strictPort:true}});await server.listen();
const browser=await chromium.launch({executablePath:'C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',headless:true});
const page=await browser.newPage();const errors=[],warnings=[];
page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
page.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});
const report={aiUseDisclosure:'Codex-authored native playback component check, not complete game-route verification.',cues:[],errors,warnings};
try{
 await page.goto('http://127.0.0.1:5191/?mute=1');
 await page.evaluate(async()=>{
  const {Audio}=await import('/src/game/audio.ts');
  window.__audioProbe=new Audio(false);
  const button=document.createElement('button');button.textContent='Audio component test';button.id='audio-probe-start';
  button.style='position:absolute;left:0;top:0;z-index:99999';
  button.onclick=()=>window.__audioProbe.start();document.body.append(button);
 });
 await page.locator('#audio-probe-start').click();
 await page.waitForFunction(()=>window.__audioProbe.buffers.size===15,null,{timeout:15000});
 report.decodedFoley=await page.evaluate(()=>window.__audioProbe.buffers.size);
 const cues=['menu','years','kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork','finale'];
 for(const cue of cues){
  await page.evaluate(cue=>{if(['menu','years','finale'].includes(cue))window.__audioProbe.soundtrack(cue);else window.__audioProbe.combat(cue);},cue);
  await page.waitForTimeout(1900);
  const state=await page.evaluate(()=>{const a=window.__audioProbe,t=a.track;return {cue:a.cue,src:t.src,time:t.currentTime,paused:t.paused,volume:t.volume,liveTracks:a.tracks.length};});
  if(state.paused||state.time<=0||!state.src.endsWith('/'+cue+'.mp3')||state.liveTracks!==1)throw Error('Bad cue '+JSON.stringify(state));
  report.cues.push(state);
 }
 await page.evaluate(()=>window.__audioProbe.dialogue(true));await page.waitForTimeout(220);
 report.duck=await page.evaluate(()=>window.__audioProbe.track.volume);if(report.duck>0.12)throw Error('Music did not duck');
 await page.evaluate(()=>{window.__audioProbe.toggleMute();window.__audioProbe.combat('alley');});
 const muted=[];for(let i=0;i<10;i++){await page.waitForTimeout(100);muted.push(await page.evaluate(()=>window.__audioProbe.tracks.map(t=>t.volume)));}
 if(muted.flat().some(v=>v!==0))throw Error('Crossfade leaked during mute');
 report.mutedSamples=muted;
 await page.evaluate(()=>{window.__audioProbe.dialogue(false);window.__audioProbe.toggleMute();});
 await page.waitForTimeout(1000);
 report.unmuted=await page.evaluate(()=>window.__audioProbe.track.volume);if(report.unmuted<0.4)throw Error('Music did not recover');
 await page.evaluate(()=>{const a=window.__audioProbe;a.guard();a.stab();a.swing('chain');a.weaponHit('ice',true);a.dash('king');a.footstep();});
 report.liveFoleyVoices=await page.evaluate(()=>window.__audioProbe.activeSounds.size);
 if(!report.liveFoleyVoices)throw Error('Recorded Foley did not play');
 report.ok=errors.length===0;if(errors.length)throw Error(errors.join('\n'));
 console.log(JSON.stringify({ok:true,cues:report.cues.length,decodedFoley:report.decodedFoley,errors:errors.length,warnings:warnings.length}));
}catch(e){report.ok=false;report.failure=String(e);console.error(e);process.exitCode=1;}
finally{await writeFile(out+'/report.json',JSON.stringify(report,null,2));await browser.close();await server.close();}
