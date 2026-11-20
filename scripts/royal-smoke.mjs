// AI-use disclosure: Codex-authored production-browser QA for the royal story, menu and lethal ending revision.
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { preview } from 'vite';

const out = 'output/qa/royal';
await mkdir(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5187, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 960, height: 540 } });
// Record media playback without changing native autoplay policy or playback promises.
await context.addInitScript(() => {
  window.__qaMedia = [];
  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    if (!window.__qaMedia.includes(this)) window.__qaMedia.push(this);
    return nativePlay.apply(this, args);
  };
});
const report = { checks: {}, endings: {}, screenshots: [], errors: [], warnings: [], startedAt: new Date().toISOString() };
const watch = page => {
  page.on('pageerror', error => report.errors.push(String(error)));
  page.on('console', message => { if (message.type() === 'error') report.errors.push(message.text()); else if (message.type() === 'warning') report.warnings.push(message.text()); });
  page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
  return page;
};
const page = watch(await context.newPage());
const url = search => 'http://127.0.0.1:5187/' + search;
const sceneIs = (page, key, timeout = 60000) => page.waitForFunction(k => window.ninth?.scene.isActive(k), key, { timeout });
const shot = async (page, name) => { await page.screenshot({ path: `${out}/${name}.png` }); report.screenshots.push(name + '.png'); };
const checkpoint = async stage => { console.log(JSON.stringify({ stage, errors: report.errors.length })); await writeFile(`${out}/report.json`, JSON.stringify(report, null, 2)); };

try {
  await page.goto(url('?debug=1&mode=scripted&seed=42'));
  await sceneIs(page, 'title'); await page.waitForTimeout(1000);
  report.checks.productionBundles = await page.evaluate(() => performance.getEntriesByType('resource').map(resource => resource.name).filter(name => /assets\/index-.*\.js/.test(name)));
  report.checks.menu = await page.evaluate(() => {
    const scene = window.ninth.scene.getScene('title');
    return { graphics: scene.children.list.filter(child => child.type === 'Graphics').length, castleImage: scene.children.list.some(child => child.texture?.key === 'hf-castle-exterior'), tweens: scene.tweens.getTweens().length };
  });
  assert(report.checks.menu.graphics > 0, 'Menu must use authored pixel geometry');
  assert.equal(report.checks.menu.castleImage, false);
  assert.equal(report.checks.menu.tweens, 0, 'No continuous menu zoom or ambient movement');
  const stillA = createHash('sha256').update(await page.locator('canvas').screenshot()).digest('hex');
  await page.waitForTimeout(1100);
  const stillB = createHash('sha256').update(await page.locator('canvas').screenshot()).digest('hex');
  assert.equal(stillA, stillB, 'Menu image must remain perfectly still');
  report.checks.staticMenuHash = stillA;
  await shot(page, 'menu-static-pixel');
  for (const viewport of [{ width: 960, height: 540 }, { width: 1280, height: 720 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(viewport); await page.waitForTimeout(250);
    const bounds = await page.locator('canvas').evaluate(canvas => { const r = canvas.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height, logicalWidth: canvas.width, logicalHeight: canvas.height }; });
    assert(Math.abs(bounds.width / bounds.height - 16 / 9) < 0.01);
    assert(bounds.x >= -1 && bounds.y >= -1 && bounds.x + bounds.width <= viewport.width + 1 && bounds.y + bounds.height <= viewport.height + 1);
    assert.equal(bounds.logicalWidth, 960); assert.equal(bounds.logicalHeight, 540);
    assert(Math.abs(bounds.x + bounds.width / 2 - viewport.width / 2) <= 2, 'Canvas must be horizontally centred');
    assert(Math.abs(bounds.y + bounds.height / 2 - viewport.height / 2) <= 2, 'Canvas must be vertically centred');
    (report.checks.aspectRatios ??= []).push({ viewport, bounds });
    await shot(page, `menu-${viewport.width}x${viewport.height}`);
  }
  await page.setViewportSize({ width: 960, height: 540 }); await page.waitForTimeout(200);
  // Use visible keyboard focus to reach Settings and return.
  await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter'); await sceneIs(page, 'settings');
  report.checks.menuKeyboardSettings = true;
  await page.keyboard.press('Escape'); await sceneIs(page, 'title');
  await page.keyboard.press('c');
  const credits = await page.evaluate(() => {
    const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)];
    return window.ninth.scene.getScene('title').children.list.flatMap(flatten).join('\n');
  });
  for (const phrase of ['At Rest', 'Five Armies', 'Virtutes Vocis', 'Kevin MacLeod', 'incompetech.com', 'https://creativecommons.org/licenses/by/4.0/']) assert(credits.includes(phrase), `Missing credit ${phrase}`);
  report.checks.musicCredits = true; await page.waitForTimeout(700); await shot(page, 'music-attributions');
  await page.keyboard.press('Escape'); await page.waitForFunction(() => window.ninth.scene.isActive('title') && !window.ninth.scene.getScene('title').credits);
  await page.keyboard.press('Enter'); await sceneIs(page, 'opening');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('years-at-rest.mp3') && !audio.paused && audio.currentTime > 0.05), null, { timeout: 15000 });
  report.checks.musicPlayingAfterGesture = await page.evaluate(() => window.__qaMedia.filter(audio => audio.src).map(audio => ({ src: audio.src, paused: audio.paused, currentTime: audio.currentTime, volume: audio.volume })));
  await page.waitForFunction(() => window.ninth.scene.getScene('opening').phase === 'challenge');
  await page.keyboard.press('Escape'); await page.keyboard.press('Enter');
  assert(await page.evaluate(() => window.ninth.scene.isActive('opening')), 'Intro dialogue must not skip');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('years-at-rest.mp3') && !audio.paused && audio.volume > 0 && audio.volume <= 0.135));
  report.checks.portraitDuckedVolume = await page.evaluate(() => window.__qaMedia.find(audio => audio.src.includes('years-at-rest.mp3') && !audio.paused)?.volume);
  await shot(page, 'opening-portrait');
  await sceneIs(page, 'fight');
  await checkpoint('static menu, centered aspects, licensed audio and locked opening pass');
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').dialogue.panel.visible);
  report.checks.anonymousArrivalSpeaker = await page.evaluate(() => window.ninth.scene.getScene('fight').dialogue.speaker.text);
  assert(/^[#? /]+$/.test(report.checks.anonymousArrivalSpeaker));
  await shot(page, 'anonymous-tutorial-dialogue');
  await page.waitForFunction(() => {
    const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)];
    return window.ninth.scene.getScene('fight').children.list.flatMap(flatten).some(text => text.startsWith('YOUR ANSWER') || text === 'WHAT REMAINS OF YOUR ANSWER?');
  }, null, { timeout: 30000 });
  const choiceText = () => page.evaluate(() => {
    const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)];
    return window.ninth.scene.getScene('fight').children.list.flatMap(flatten).filter(Boolean);
  });
  assert((await choiceText()).some(text => text.startsWith('> I wanted to protect')));
  await page.keyboard.press('ArrowDown');
  await page.waitForFunction(() => { const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)]; return window.ninth.scene.getScene('fight').children.list.flatMap(flatten).some(text => text.startsWith('> A king owes')); });
  assert((await choiceText()).some(text => text.startsWith('> A king owes')));
  await page.keyboard.press('ArrowUp');
  await page.waitForFunction(() => { const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)]; return window.ninth.scene.getScene('fight').children.list.flatMap(flatten).some(text => text.startsWith('> I wanted to protect')); });
  assert((await choiceText()).some(text => text.includes('Enter confirm') && text.includes('choose')));
  const bondBefore = await page.evaluate(() => window.ninth.scene.getScene('fight').session.state.bond);
  await shot(page, 'explicit-dialogue-choice');
  await page.keyboard.press('Enter');
  await page.waitForFunction(bond => window.ninth.scene.getScene('fight').session.state.bond > bond, bondBefore);
  report.checks.openChoiceBond = { before: bondBefore, after: await page.evaluate(() => window.ninth.scene.getScene('fight').session.state.bond) };
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').mode === 'fight');
  await shot(page, 'tutorial-after-choice');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('combat-five-armies.mp3') && !audio.paused && audio.currentTime > 0.05 && audio.volume > 0.5), null, { timeout: 15000 });
  report.checks.combatMusicUnducked = await page.evaluate(() => window.__qaMedia.filter(audio => audio.src.includes('combat-five-armies.mp3')).map(audio => ({ src: audio.src, paused: audio.paused, currentTime: audio.currentTime, volume: audio.volume })));
  // Start the actual ending scene to request a cue transition, then mute while its crossfade is active.
  await page.evaluate(() => {
    const fight = window.ninth.scene.getScene('fight');
    const ending = { kind: 'normal', by: 'kitten', fightIndex: 1, bond: fight.session.state.bond };
    fight.scene.start('ending', { session: fight.session, ending, life: 'kitten' });
  });
  await sceneIs(page, 'ending');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('finale-virtutes-vocis.mp3') && !audio.paused && audio.currentTime > 0.02), null, { timeout: 15000 });
  report.checks.musicCueSequence = ['years-at-rest.mp3', 'combat-five-armies.mp3', 'finale-virtutes-vocis.mp3'];
  await page.keyboard.press('m');
  report.checks.mutedCrossfadeSamples = [];
  for (let sample = 0; sample < 12; sample++) {
    await page.waitForTimeout(100);
    const volumes = await page.evaluate(() => window.__qaMedia.filter(audio => !audio.paused && /audio\/.*\.mp3/.test(audio.src)).map(audio => ({ src: audio.src, volume: audio.volume })));
    assert(volumes.length > 0);
    assert(volumes.every(audio => audio.volume === 0), 'Every active track must stay silent while crossfading muted');
    report.checks.mutedCrossfadeSamples.push(volumes);
  }
  await page.keyboard.press('m');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('finale-virtutes-vocis.mp3') && !audio.paused && audio.volume > 0));
  report.checks.finaleUnmutes = true;
  await checkpoint('static menu, aspect fit, licensed audio, opening and interactive anonymous tutorial pass');

  // These are isolated ending presentation components. They do not claim to exercise the combat routes.
  async function endingComponent(kind) {
    const p = watch(await context.newPage());
    await p.goto(url('?mute=1&debug=1&autoplay=1&mode=scripted&seed=42'));
    await sceneIs(p, 'fight');
    await p.evaluate(kind => {
      const fight = window.ninth.scene.getScene('fight');
      const session = fight.session;
      const ending = kind === 'victory' ? { kind, defeated: 9, bond: 1 } : { kind, by: 'patchwork', fightIndex: 9, bond: 1 };
      session.state.ending = ending;
      fight.scene.start('ending', { session, ending, life: 'patchwork' });
    }, kind);
    await sceneIs(p, 'ending');
    const started = Date.now();
    await p.keyboard.press('Enter');
    assert(await p.evaluate(() => window.ninth.scene.isActive('ending') && !window.ninth.scene.getScene('ending').ready));
    const initial = await p.evaluate(() => { const s = window.ninth.scene.getScene('ending'); return { ruined: s.ruined, images: s.children.list.filter(child => child.type === 'Image').map(child => child.texture.key) }; });
    assert.equal(initial.ruined, false); assert(initial.images.includes('combat-aged-late'));
    await p.waitForTimeout(1700); await shot(p, `ending-${kind}-portrait`);
    assert.equal(await p.evaluate(() => window.ninth.scene.getScene('ending').dialogue.speaker.text), '#? // ??');
    if (kind === 'victory') {
      await p.waitForFunction(() => window.ninth.scene.getScene('ending').visitorState.angle < -70, null, { timeout: 30000 });
      await p.waitForTimeout(500); await shot(p, 'victory-slain-challenger');
    } else {
      await p.waitForFunction(() => window.ninth.scene.getScene('ending').kingState.angle > 5, null, { timeout: 30000 });
      await shot(p, `ending-${kind}-lethal-impact`);
      await p.waitForFunction(() => window.ninth.scene.getScene('ending').kingState.motion === 'nova', null, { timeout: 15000 });
      await p.waitForTimeout(350); await shot(p, `ending-${kind}-last-nova-charge`);
      await p.waitForFunction(() => window.ninth.scene.getScene('ending').children.list.some(child => child.type === 'Graphics' && child.depth === 18), null, { timeout: 10000, polling: 20 });
      await p.waitForTimeout(300); await shot(p, `ending-${kind}-last-nova-blast`);
      await p.waitForFunction(() => window.ninth.scene.getScene('ending').ruined, null, { timeout: 10000 });
    }
    await p.waitForFunction(() => window.ninth.scene.getScene('ending').ready, null, { timeout: 30000 });
    const final = await p.evaluate(() => {
      const s = window.ninth.scene.getScene('ending');
      const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)];
      return { kind: s.ending.kind, ruined: s.ruined, king: { ...s.kingState }, visitor: { ...s.visitorState }, texts: s.children.list.flatMap(flatten).filter(Boolean), ruinTexture: s.children.list.some(child => child.texture?.key === 'royal-dawn-ruins') };
    });
    assert.equal(final.kind, kind);
    if (kind === 'victory') { assert.equal(final.ruined, false); assert(final.visitor.angle < -70 && final.visitor.alpha === 1); assert.equal(final.king.alpha, 1); }
    else { assert(final.ruined); assert(final.ruinTexture, 'Generated dawn ruins must be loaded for the final build'); assert.equal(final.king.alpha, 0); assert.equal(final.visitor.alpha, 0); }
    assert(final.visitor.x > 400 && final.king.x > 700, 'No friendly exit walk');
    assert(!final.texts.some(text => /let us begin|going outside|doors open/i.test(text)));
    final.presentationDurationMs = Date.now() - started;
    final.componentOnly = true;
    report.endings[kind] = final;
    await shot(p, `ending-${kind}-coda`);
    await p.keyboard.press('Enter'); await sceneIs(p, 'title');
    await p.close();
  }
  await Promise.all(['normal', 'do_nothing', 'victory'].map(endingComponent));
  await checkpoint('three lethal ending components, read locks, nova, ruins and return pass');
  assert.deepEqual(report.errors, []);
  assert(!report.warnings.some(warning => /missing|not found|frame/i.test(warning)), report.warnings.join('\n'));
  report.ok = true;
} catch (error) {
  report.ok = false; report.failure = String(error); console.error(error); process.exitCode = 1;
  try { await shot(page, 'failure'); } catch {}
} finally {
  report.finishedAt = new Date().toISOString();
  await checkpoint('finished');
  await browser.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
