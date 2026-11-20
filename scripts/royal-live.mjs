// AI-use disclosure: Codex-authored public GitHub Pages QA using native input and unmodified game state.
// Run only after deployment: node scripts/royal-live.mjs
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { chromium } from 'playwright';

const out = fileURLToPath(new URL('../output/qa/royal-live/', import.meta.url));
assert(/^d:[\\/]/i.test(out), 'Keep verification output on the D drive.');
await mkdir(out, { recursive: true });
const target = new URL('https://nicoh-yay.github.io/the-ninth-life/');
target.search = new URLSearchParams({ qa: String(Date.now()), mode: 'scripted', seed: '42' }).toString();
const report = {
  aiUseDisclosure: 'Codex-authored browser verification. Native keyboard inputs only; no actor, statistics, game timer, scene or ending overrides.',
  url: target.href, startedAt: new Date().toISOString(), checks: {}, screenshots: [], errors: [], warnings: [], ok: false,
};
const started = Date.now();
const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
// Observe native media elements without relaxing autoplay policy or replacing their playback promises.
await context.addInitScript(() => {
  window.__qaMedia = [];
  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    if (!window.__qaMedia.includes(this)) window.__qaMedia.push(this);
    return nativePlay.apply(this, args);
  };
});
const page = await context.newPage();
page.setDefaultTimeout(12000);
page.on('pageerror', error => report.errors.push(String(error)));
page.on('console', message => {
  if (message.type() === 'error') report.errors.push(message.text());
  else if (message.type() === 'warning') report.warnings.push(message.text());
});
page.on('response', response => { if (response.status() >= 400) report.errors.push(`${response.status()} ${response.url()}`); });
page.on('requestfailed', request => {
  // Media source cleanup deliberately cancels old crossfade requests.
  if (!/ERR_ABORTED/.test(request.failure()?.errorText ?? '')) report.errors.push(`${request.failure()?.errorText} ${request.url()}`);
});
const checkpoint = async stage => {
  console.log(JSON.stringify({ stage, durationMs: Date.now() - started, errors: report.errors.length }));
  await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2));
};
const shot = async name => {
  const path = join(out, `${name}.png`);
  await page.screenshot({ path }); report.screenshots.push(path);
};
const sceneIs = (key, timeout = 12000) => page.waitForFunction(k => window.ninth?.scene.isActive(k), key, { timeout });
const mediaState = () => page.evaluate(() => window.__qaMedia.filter(audio => audio.src).map(audio => ({
  src: audio.src, paused: audio.paused, time: audio.currentTime, volume: audio.volume, readyState: audio.readyState,
})));

try {
  const response = await page.goto(target.href, { waitUntil: 'domcontentloaded', timeout: 20000 });
  assert.equal(response?.status(), 200, 'Published page must return HTTP 200');
  await sceneIs('title', 20000);
  await page.waitForTimeout(750);
  report.checks.menu = await page.evaluate(() => {
    const scene = window.ninth.scene.getScene('title');
    return {
      graphics: scene.children.list.filter(child => child.type === 'Graphics').length,
      oldCastleImage: scene.children.list.some(child => child.texture?.key === 'hf-castle-exterior'),
      tweens: scene.tweens.getTweens().length,
    };
  });
  assert(report.checks.menu.graphics > 0, 'Published menu must use authored pixel geometry');
  assert.equal(report.checks.menu.oldCastleImage, false, 'Old generated castle menu must be absent');
  assert.equal(report.checks.menu.tweens, 0, 'Published menu must have no continuous zoom');
  const textureKeys = [
    'higgsfield-arena', 'combat-aged-mid', 'combat-aged-late', 'royal-visitor-walk',
    'royal-visitor-combat', 'royal-visitor-vfx', 'royal-blood', 'royal-vfx', 'royal-dawn-ruins',
  ];
  report.checks.textures = await page.evaluate(keys => keys.map(key => {
    const manager = window.ninth.textures;
    const texture = manager.exists(key) ? manager.get(key) : null;
    const image = texture?.getSourceImage();
    return { key, exists: !!texture, source: image?.currentSrc || image?.src || '', width: image?.width, height: image?.height };
  }), textureKeys);
  assert(report.checks.textures.every(texture => texture.exists && texture.width > 0 && texture.height > 0), 'Every royal texture, including dawn ruins, must load');
  assert(await page.evaluate(() => performance.getEntriesByType("resource").some(entry => entry.name.includes("/the-ninth-life/royal-v4/dawn-ruins.png"))), "The deployed ruin PNG must be fetched; Phaser may convert its image source to a blob URL.");
  report.checks.productionBundles = await page.evaluate(() => performance.getEntriesByType('resource').map(entry => entry.name).filter(name => /\/assets\/index-.*\.js/.test(name)));
  assert(report.checks.productionBundles.length > 0, 'Verify an actual deployed production bundle');
  await shot('published-menu');
  await checkpoint('published authored menu and complete royal assets');

  // A real Playwright keyboard gesture starts the ordinary unskippable opening and unlocks music.
  await page.keyboard.press('Enter');
  await sceneIs('opening');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('years-at-rest.mp3') && !audio.paused && audio.currentTime > 0.05 && audio.volume > 0), null, { timeout: 12000 });
  report.checks.yearsMusicAfterTrustedEnter = await mediaState();
  await page.waitForFunction(() => window.ninth.scene.getScene('opening').phase === 'challenge');
  await shot('published-opening-dialogue');
  await page.keyboard.press('Escape');
  assert(await page.evaluate(() => window.ninth.scene.isActive('opening')), 'The opening must not skip');
  await sceneIs('fight', 35000);
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').dialogue.panel.visible);
  report.checks.arrival = await page.evaluate(() => {
    const scene = window.ninth.scene.getScene('fight');
    return { speaker: scene.dialogue.speaker.text, texture: scene.ch.texture.key, life: scene.sim.setup.life, fightIndex: scene.session.fightIndex };
  });
  assert(/^[#? /]+$/.test(report.checks.arrival.speaker), 'Visitor identity must remain anonymous');
  assert.equal(report.checks.arrival.texture, 'royal-visitor-walk');
  assert.equal(report.checks.arrival.fightIndex, 1);
  await shot('published-anonymous-arrival');

  await page.waitForFunction(() => {
    const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)];
    return window.ninth.scene.getScene('fight').children.list.flatMap(flatten).some(text => text.startsWith('YOUR ANSWER'));
  }, null, { timeout: 20000 });
  const chosen = prefix => page.waitForFunction(prefix => {
    const flatten = object => [object.text ?? '', ...(object.list ?? []).flatMap(flatten)];
    return window.ninth.scene.getScene('fight').children.list.flatMap(flatten).some(text => text.startsWith(prefix));
  }, prefix);
  await chosen('> I wanted to protect');
  await page.keyboard.press('ArrowDown'); await chosen('> A king owes');
  await page.keyboard.press('ArrowUp'); await chosen('> I wanted to protect');
  const bondBefore = await page.evaluate(() => window.ninth.scene.getScene('fight').session.state.bond);
  await shot('published-open-dialogue-choice');
  await page.keyboard.press('Enter');
  await page.waitForFunction(bond => window.ninth.scene.getScene('fight').session.state.bond > bond, bondBefore);
  report.checks.openChoice = { confirmedWith: 'ArrowUp then Enter', before: bondBefore, after: await page.evaluate(() => window.ninth.scene.getScene('fight').session.state.bond) };
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').mode === 'fight');
  await page.waitForFunction(() => window.__qaMedia.some(audio => audio.src.includes('combat-five-armies.mp3') && !audio.paused && audio.currentTime > 0.05 && audio.volume > 0.5), null, { timeout: 10000 });
  report.checks.combatMusic = await mediaState();
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').ch.texture.key === 'royal-visitor-walk');
  const before = await page.evaluate(() => window.ninth.scene.getScene('fight').sim.boss.x);
  await page.keyboard.down('a'); await page.waitForTimeout(260); await page.keyboard.up('a');
  const after = await page.evaluate(() => window.ninth.scene.getScene('fight').sim.boss.x);
  assert(after < before, 'Ordinary movement must move the king away from the throne');
  await page.keyboard.press('Space');
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').sim.boss.jumps > 0);
  await page.keyboard.press('j');
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').sim.events.some(event => event.type === 'boss_move'));
  report.checks.ordinaryCombat = await page.evaluate(() => {
    const scene = window.ninth.scene.getScene('fight');
    return { mode: scene.mode, playerX: scene.sim.boss.x, jumps: scene.sim.boss.jumps, visitorTexture: scene.ch.texture.key,
      visitorFrame: scene.ch.frame.name, moves: scene.sim.events.filter(event => event.type === 'boss_move').map(event => event.move) };
  });
  report.checks.ordinaryCombat.movement = { before, after };
  assert(['royal-visitor-walk', 'royal-visitor-combat'].includes(report.checks.ordinaryCombat.visitorTexture));
  await shot('published-combat');
  assert.deepEqual(report.errors, []);
  assert(!report.warnings.some(warning => /missing|not found|frame/i.test(warning)), report.warnings.join('\n'));
  report.ok = true;
  await checkpoint('public opening, anonymous choice, native movement and licensed combat music passed');
} catch (error) {
  report.failure = error?.stack ?? String(error); process.exitCode = 1; console.error(error);
  try { await shot('failure'); } catch {}
} finally {
  report.finishedAt = new Date().toISOString(); report.durationMs = Date.now() - started;
  await checkpoint('finished');
  await browser.close();
}
