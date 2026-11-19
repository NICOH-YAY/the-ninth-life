// AI-use disclosure: Codex-authored isolated headless visual QA capture.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir } from 'node:fs/promises';
await mkdir('output/qa', { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5185, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('response', r => { if (r.status() >= 400) console.log(JSON.stringify({ status: r.status(), url: r.url() })); });
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
try {
  await page.goto('http://127.0.0.1:5185/?mute=1&debug=1');
  await page.waitForFunction(() => window.ninth?.scene.isActive('title'));
  await page.screenshot({ path: 'output/qa/current-menu.png' });
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => window.ninth?.scene.isActive('opening'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.ninth?.scene.isActive('fight'));
  await page.waitForTimeout(1500);
  console.log(JSON.stringify(await page.evaluate(() => { const s = window.ninth.scene.getScene('fight'); return { fight: s.session.fightIndex, setup: s.sim?.setup, texture: s.ch?.texture.key }; })));
  await page.evaluate(() => window.ninth.scene.getScene('fight').debugText.setVisible(false));
  await page.screenshot({ path: 'output/qa/current-combat.png' });
  await page.keyboard.press('p');
  await page.waitForTimeout(700);
  const transformation = await page.evaluate(() => { const s = window.ninth.scene.getScene('fight'); return { frame: s.transformation.texture.key, visible: s.transformation.visible, caption: s.caption.text, captionAlpha: s.caption.alpha }; });
  await page.screenshot({ path: 'output/qa/transformation.png' });
  await page.waitForTimeout(2300);
  await page.screenshot({ path: 'output/qa/ascended.png' });
  await page.keyboard.press('l');
  await page.waitForTimeout(650);
  await page.screenshot({ path: 'output/qa/shadow-tide.png' });
  const textureSizes = await page.evaluate(() => { const s = window.ninth.scene.getScene('fight'); return [s.boss, s.ch, s.asc, s.transformation].map(i => ({ key: i.texture.key, width: i.texture.getSourceImage().width, height: i.texture.getSourceImage().height })); });
  console.log(JSON.stringify({ transformation, textureSizes }));
  console.log(JSON.stringify({ errors }));
} finally { await browser.close(); await new Promise(resolve => server.httpServer.close(resolve)); }
