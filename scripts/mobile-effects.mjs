// AI-use disclosure: Codex-authored isolated capture of the readable transformation after its flash.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const server=await preview({preview:{host:'127.0.0.1',port:5187,strictPort:true}});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_BROWSER_PATH??'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',headless:true});
const page=await browser.newPage({viewport:{width:960,height:540}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
try{
 await page.goto('http://127.0.0.1:5187/?mute=1&debug=1&autoplay=1&speed=1&mode=scripted&seed=42&bot=spam_reap');
 await page.waitForFunction(()=>window.ninth?.scene.isActive('fight'));
 await page.keyboard.press('9');
 await page.waitForFunction(()=>{const s=window.ninth.scene.getScene('fight');return s.session.fightIndex===9&&s.mode==='fight';});
 await page.keyboard.press('p');await page.waitForTimeout(1250);
 const state=await page.evaluate(()=>{const s=window.ninth.scene.getScene('fight');return {key:s.king.texture.key,remainingTransition:s.sim.boss.transitionT,x:s.king.x,y:s.king.y,width:s.king.displayWidth,height:s.king.displayHeight};});
 assert(state.key.startsWith('immortal-transform:'));assert(state.remainingTransition>0);
 await page.screenshot({path:'output/qa/mobile/transformation-readable.png'});
 await writeFile('output/qa/mobile/effects-report.json',JSON.stringify({state,errors},null,2));
 console.log(JSON.stringify({state,errors}));assert.deepEqual(errors,[]);
}finally{await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));}
