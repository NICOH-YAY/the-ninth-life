// AI-use disclosure: Codex-authored isolated production-browser checks for mobile combat and story.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const out = 'output/qa/mobile';
await mkdir(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5186, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
const errors = [], warnings = [];
const routesOnly = process.argv.includes('--routes-only');
const report = routesOnly ? JSON.parse(await readFile(`${out}/report.json`,'utf8')) : { checks: {}, screenshots: [], routes: {} };
report.errors=errors;report.warnings=warnings;
const watch = p => {
  p.on('pageerror', e => errors.push(String(e)));
  p.on('console', m => { if (m.type() === 'error') errors.push(m.text()); else if (m.type() === 'warning') warnings.push(m.text()); });
  p.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
  return p;
};
const page = watch(await context.newPage());
const url = search => 'http://127.0.0.1:5186/' + search;
const sceneIs = (p, key, timeout = 60000) => p.waitForFunction(k => window.ninth?.scene.isActive(k), key, { timeout });
const fightMode = (p, mode, timeout = 60000) => p.waitForFunction(m => window.ninth?.scene.isActive('fight') && window.ninth.scene.getScene('fight').mode === m, mode, { timeout });
const shot = async (p, name) => { await p.screenshot({ path: `${out}/${name}.png` }); report.screenshots.push(name + '.png'); };
const checkpoint = async name => { console.log(JSON.stringify({ stage: name, errors: errors.length })); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); };
const fightState = p => p.evaluate(() => { const s = window.ninth.scene.getScene('fight'), b = s.sim?.boss; return { mode:s.mode, fi:s.session.fightIndex, x:b?.x,y:b?.y,grounded:b?.grounded,jumps:b?.jumps,dashes:b?.dashes,blocks:b?.blocks,complete:s.sim?.tutorialComplete,shield:s.shield?.visible,kingTexture:s.king?.texture.key,chTexture:s.ch?.texture.key,phase:b?.phase,transition:b?.transitionT,reflection:{key:s.kingReflection?.texture.key,flipY:s.kingReflection?.flipY,alpha:s.kingReflection?.alpha},aged:{key:s.aged?.texture.key,alpha:s.aged?.alpha},year:s.yearText?.text }; });
async function checkHud(p) {
  return p.evaluate(() => {
    const s=window.ninth.scene.getScene('fight');
    return [s.healthLeft,s.healthRight,s.yearText,s.hint,...s.docks].filter(t=>t.visible&&t.text).map(t=>{const r=t.getBounds();return {text:t.text,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}).filter(r=>r.x < -1 || r.y < -1 || r.right > 961 || r.bottom > 541);
  });
}
try {
  if(!routesOnly) {
  await page.goto(url('?mute=1&debug=1&mode=scripted&seed=42'));
  await sceneIs(page,'title'); await page.waitForTimeout(700);
  report.checks.castleMenu = await page.evaluate(()=>window.ninth.scene.getScene('title').children.list.some(i=>i.type==='Image'&&i.texture?.key==='hf-castle-exterior'));
  assert(report.checks.castleMenu); await shot(page,'menu');
  await page.keyboard.press('r'); await sceneIs(page,'settings');
  await page.mouse.click(250,257);
  await page.waitForFunction(()=>window.ninth.scene.getScene('settings').capturing==='jump');
  await page.keyboard.press('w');
  assert.equal(await page.evaluate(()=>window.ninth.scene.getScene('settings').bindings.jump),'KeyW');
  await shot(page,'settings-rebound');
  await page.reload(); await sceneIs(page,'title'); await page.keyboard.press('r'); await sceneIs(page,'settings');
  assert.equal(await page.evaluate(()=>window.ninth.scene.getScene('settings').bindings.jump),'KeyW');
  report.checks.bindingPersisted = true;
  await page.mouse.click(123,490);
  assert.equal(await page.evaluate(()=>window.ninth.scene.getScene('settings').bindings.jump),'Space');
  report.checks.bindingReset = true; await shot(page,'settings-defaults');
  await page.keyboard.press('Escape'); await sceneIs(page,'title');
  await page.keyboard.press('c');
  await page.waitForFunction(()=>window.ninth.scene.getScene('title').credits);
  await shot(page,'credits'); await page.keyboard.press('Enter'); assert(await page.evaluate(()=>window.ninth.scene.isActive('title')));
  await page.keyboard.press('Escape'); await page.waitForFunction(()=>!window.ninth.scene.getScene('title').credits);
  await checkpoint('menu/settings/persistence/credits pass');

  await page.keyboard.press('Enter'); await sceneIs(page,'opening');
  const openingAt=Date.now();
  await page.waitForFunction(()=>window.ninth.scene.getScene('opening').phase==='challenge');
  await page.keyboard.press('Escape'); await page.keyboard.press('Enter');
  await page.waitForTimeout(250);
  assert(await page.evaluate(()=>window.ninth.scene.isActive('opening')&&window.ninth.scene.getScene('opening').phase==='challenge'));
  report.checks.prologueCannotSkip=true; await shot(page,'prologue-portrait');
  await page.waitForFunction(()=>window.ninth.scene.getScene('opening').phase==='duel',null,{polling:30});
  await shot(page,'prologue-duel');
  await page.waitForFunction(()=>window.ninth.scene.getScene('opening').phase==='fallen');
  await page.waitForTimeout(1000); await shot(page,'fallen-king-portrait');
  await sceneIs(page,'fight'); report.checks.prologueDurationMs=Date.now()-openingAt;
  assert(report.checks.prologueDurationMs<60000);
  assert.equal((await fightState(page)).fi,1); assert.equal((await fightState(page)).mode,'arrival');
  await page.waitForTimeout(2100);
  await page.keyboard.press('Escape'); await page.keyboard.press('Enter'); await page.keyboard.press('j');
  assert.equal((await fightState(page)).mode,'arrival');
  await shot(page,'tutorial-arrival-portrait'); report.checks.arrivalCannotSkip=true;
  await checkpoint('unskippable prologue and first tutorial arrival pass');
  await fightMode(page,'fight');
  assert.equal((await fightState(page)).fi,1);
  await page.keyboard.down('d'); await page.waitForTimeout(700); await page.keyboard.up('d');
  assert((await fightState(page)).x>880);
  await page.keyboard.down('a'); await page.waitForTimeout(3200); await page.keyboard.up('a');
  assert((await fightState(page)).x<80); report.checks.fullArenaMovement=true;
  await page.keyboard.press('Space');
  await page.waitForFunction(()=>window.ninth.scene.getScene('fight').sim.boss.y>20);
  await shot(page,'jump');
  await page.waitForFunction(()=>window.ninth.scene.getScene('fight').sim.boss.grounded);
  await page.keyboard.down('d'); await page.keyboard.down('Shift'); await page.waitForTimeout(110);
  await shot(page,'dash'); await page.keyboard.up('Shift'); await page.keyboard.up('d');
  assert((await fightState(page)).dashes>0);
  await page.keyboard.down('g');
  await page.waitForFunction(()=>window.ninth.scene.getScene('fight').sim.boss.guarding);
  await shot(page,'guard-shield');
  await page.waitForFunction(()=>window.ninth.scene.getScene('fight').sim.boss.blocks>0,null,{timeout:20000});
  await page.keyboard.up('g');
  report.checks.manualTutorial = await fightState(page); assert(report.checks.manualTutorial.complete);
  assert(report.checks.manualTutorial.reflection.flipY); assert.equal(report.checks.manualTutorial.reflection.key,report.checks.manualTutorial.kingTexture);
  report.checks.hudOutOfBounds = await checkHud(page); assert.deepEqual(report.checks.hudOutOfBounds,[]);
  await shot(page,'combat'); await checkpoint('manual movement/jump/dash/block/reflections/HUD pass');

  // Finish the tutorial with real attack inputs, then measure the authored seven-second wait.
  await page.keyboard.down('j');
  const limit=Date.now()+45000;
  while(Date.now()<limit && (await fightState(page)).mode==='fight') {
    await page.keyboard.press('l'); await page.waitForTimeout(600);
  }
  await page.keyboard.up('j');
  await fightMode(page,'waiting'); const waitingAt=Date.now();
  await page.waitForTimeout(1900); report.checks.waiting=await fightState(page); await shot(page,'years-waiting');
  assert(await page.evaluate(()=>window.ninth.scene.getScene('fight').waitingText.text.includes('years pass.')));
  assert(Math.abs(await page.evaluate(()=>window.ninth.scene.getScene('fight').king.x)-880)<3);
  assert.equal(await page.evaluate(()=>window.ninth.scene.getScene('fight').king.texture.key),'combat-rest');
  await fightMode(page,'arrival'); report.checks.waitingObservedMs=Date.now()-waitingAt;
  assert(report.checks.waitingObservedMs>=6500);
  report.checks.aging=[];
  for(const fi of [4,6,7,9]) {
    await page.keyboard.press(String(fi));
    await page.waitForFunction(n=>window.ninth.scene.getScene('fight').session.fightIndex===n,fi);
    report.checks.aging.push(await fightState(page));
  }
  await page.waitForTimeout(800); await shot(page,'aged-castle');
  assert.equal(report.checks.aging[0].aged.key,'combat-aged-mid');
  assert(report.checks.aging[1].aged.alpha>report.checks.aging[0].aged.alpha);
  assert.equal(report.checks.aging[2].aged.key,'combat-aged-late');
  assert.equal(report.checks.aging[3].aged.alpha,1);
  await checkpoint('seven-second return-to-throne wait and progressive aging pass');
  }

  if(routesOnly) {
    // Recheck the final portrait framing while preserving the earlier real-input mobility evidence.
    await page.goto(url('?mute=1&debug=1&mode=scripted&seed=42'));
    await sceneIs(page,'title');await page.waitForTimeout(700);await shot(page,'menu');
    await page.keyboard.press('Enter');await sceneIs(page,'opening');
    await page.waitForFunction(()=>window.ninth.scene.getScene('opening').phase==='challenge');
    await page.waitForTimeout(500);await shot(page,'prologue-portrait');
    await page.waitForFunction(()=>window.ninth.scene.getScene('opening').phase==='fallen');
    await page.waitForTimeout(1200);await shot(page,'fallen-king-portrait');
    await sceneIs(page,'fight');await page.waitForTimeout(2400);await shot(page,'tutorial-arrival-portrait');
    report.checks.finalPortraitBounds=await page.evaluate(()=>{const d=window.ninth.scene.getScene('fight').dialogue;const p=d.portrait.getBounds();return {x:p.x,y:p.y,width:p.width,height:p.height,panelVisible:d.panel.visible,body:d.body.text};});
    assert(report.checks.finalPortraitBounds.panelVisible);
    await checkpoint('final portrait-framing snapshots refreshed');
  }

  const transitionPage=watch(await context.newPage());
  await transitionPage.goto(url('?mute=1&debug=1&autoplay=1&speed=1&mode=scripted&seed=42&bot=spam_reap'));
  await sceneIs(transitionPage,'fight');await transitionPage.keyboard.press('9');await fightMode(transitionPage,'fight');
  await transitionPage.keyboard.press('p');await transitionPage.waitForTimeout(1250);
  report.checks.transformation=await fightState(transitionPage);
  assert(report.checks.transformation.kingTexture.startsWith('immortal-transform:'));
  await shot(transitionPage,'transformation');
  await transitionPage.waitForTimeout(1300);
  report.checks.ascended=await fightState(transitionPage);assert.equal(report.checks.ascended.kingTexture,'combat-ascended');
  await shot(transitionPage,'ascended');
  await transitionPage.waitForFunction(()=>window.ninth.scene.getScene('fight').projectileImages.size>0);
  await shot(transitionPage,'wave-effects');await transitionPage.close();
  await checkpoint('new transformation/ascended actor sheets and projectile FX pass');

  // Route components use the documented debug jump; all-nine authentic routes also have headless tests.
  async function route(name, bot, jumpFinal=false) {
    const p=watch(await context.newPage());
    await p.goto(url(`?mute=1&debug=1&autoplay=1&speed=8&mode=scripted&seed=42&bot=${bot}`));
    await sceneIs(p,'fight');
    if(jumpFinal) { await p.keyboard.press('9'); await p.waitForFunction(()=>window.ninth.scene.getScene('fight').session.fightIndex===9); }
    const started=Date.now(); let prior;
    while(Date.now()-started<180000) {
      const state=await p.evaluate(()=>{const s=window.ninth.scene.getScenes(true)[0];return {scene:s.scene.key,fi:s.session?.fightIndex,mode:s.mode,ending:s.session?.state.ending,time:s.sim?.time,used:s.session?.state.used};});
      if(state.fi!==prior){console.log(JSON.stringify({stage:name,...state}));prior=state.fi;}
      if(state.scene==='ending') {
        report.routes[name]={...state,componentDebugJump:jumpFinal,durationMs:Date.now()-started};
        await p.waitForTimeout(2100); await shot(p,`ending-${name}`);
        assert.equal(state.ending.kind,name);
        await p.keyboard.press('Enter');assert(await p.evaluate(()=>window.ninth.scene.isActive('ending')));
        await p.waitForFunction(()=>window.ninth.scene.getScene('ending').ready,null,{timeout:30000});
        await shot(p,`ending-${name}-coda`);
        await p.keyboard.press('Enter');await sceneIs(p,'title');
        await p.close();return;
      }
      await p.waitForTimeout(1000);
    }
    throw new Error(`${name} did not reach an ending`);
  }
  await Promise.all([route('normal','normal'),route('do_nothing','idle'),route('victory','victory')]);
  await checkpoint('three ending routes, reading lock, coda, and menu return pass');
  report.productionBundles=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(n=>/\/assets\/index-.*\.js/.test(n)));
  assert.deepEqual(errors,[]); assert(!warnings.some(w=>/missing|not found|frame/i.test(w)),warnings.join('\n'));
  report.ok=true;
} catch(error) {
  report.ok=false;report.failure=String(error);console.error(error);
  try{await shot(page,'failure');}catch{}
  process.exitCode=1;
} finally {
  await checkpoint('finished');
  await browser.close();await new Promise(resolve=>server.httpServer.close(resolve));
}
