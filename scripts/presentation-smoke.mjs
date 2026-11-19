// AI-use disclosure: Codex-authored isolated headless presentation smoke test.
import { chromium } from 'playwright';
import { preview } from 'vite';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'output/qa';
await mkdir(out, { recursive: true });
const server = await preview({ preview: { host: '127.0.0.1', port: 5184, strictPort: true } });
const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_BROWSER_PATH ?? 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', headless: true });
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('response', r => { if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`); });
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const sceneIs = async key => page.waitForFunction(k => window.ninth?.scene.isActive(k), key);
const texts = () => page.evaluate(() => window.ninth.scene.getScenes(true).flatMap(s => s.children.list.filter(c => c.type === 'Text').map(c => c.text)));
const report = {};
try {
  await page.goto('http://127.0.0.1:5184/?mute=1');
  await sceneIs('title');
  await page.screenshot({ path: `${out}/menu.png` });
  await page.keyboard.press('c');
  await page.waitForFunction(() => window.ninth.scene.getScene('title').credits === true);
  report.credits = (await texts()).some(t => t.includes('ATTRIBUTIONS'));
  await page.screenshot({ path: `${out}/credits.png` });
  await page.keyboard.press('Enter');
  report.creditsBlocksPlay = await page.evaluate(() => window.ninth.scene.isActive('title'));
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => window.ninth.scene.getScene('title').credits === false);
  await page.keyboard.press('Enter');
  await sceneIs('opening');
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${out}/opening.png` });
  await page.keyboard.press('Escape');
  await sceneIs('fight');
  report.skipOpening = true;
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${out}/combat.png` });
  await page.goto('http://127.0.0.1:5184/?mute=1&debug=1');
  await sceneIs('title');
  await page.keyboard.press('Enter');
  await sceneIs('opening');
  const openingAt = Date.now();
  await sceneIs('fight');
  report.openingDurationMs = Date.now() - openingAt;
  if (report.openingDurationMs < 14500 || report.openingDurationMs > 17500) throw new Error(`Opening duration ${report.openingDurationMs}ms outside expected bounds`);
  await page.keyboard.press('p');
  await page.waitForTimeout(700);
  report.transformation = await page.evaluate(() => { const s = window.ninth.scene.getScene('fight'); return { visible: s.transformation.visible, frame: s.transformation.texture.key, transitionT: s.sim.boss.transitionT }; });
  await page.screenshot({ path: `${out}/transformation.png` });
  await page.waitForFunction(() => window.ninth.scene.getScene('fight').sim?.boss.phase === 2);
  await page.waitForTimeout(2300);
  report.ascended = await page.evaluate(() => { const s = window.ninth.scene.getScene('fight'); return { phase: s.sim.boss.phase, frame: s.asc.texture.key, transitionT: s.sim.boss.transitionT }; });
  await page.screenshot({ path: `${out}/ascended.png` });
  await page.goto('http://127.0.0.1:5184/?autoplay=1&speed=8&mute=1&seed=42');
  await sceneIs('fight');
  const start = Date.now();
  while (Date.now() - start < 240000) {
    const state = await page.evaluate(() => {
      const game = window.ninth;
      const scene = game.scene.getScenes(true)[0];
      return { scene: scene?.scene.key, fight: scene?.session?.state?.fightIndex, ending: scene?.session?.state?.ending, mode: scene?.mode, time: scene?.sim?.time, used: scene?.session?.state?.used, summaries: scene?.session?.state?.summaries?.map(s => ({fightIndex:s.fightIndex, outcome:s.outcome, lifeId:s.lifeId})) };
    });
    console.log(JSON.stringify(state));
    if (state.scene === 'ending') { report.autonomousRun = state; break; }
    await page.waitForTimeout(5000);
  }
  await page.waitForTimeout(3000);
  await page.screenshot({ path: `${out}/autoplay-result.png` });
  report.errors = errors;
  await writeFile(`${out}/smoke-report.json`, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
  if (report.autonomousRun?.ending?.kind !== 'letting_go' || report.autonomousRun?.used?.length !== 9 || report.autonomousRun?.summaries?.length !== 9 || errors.length || !report.credits || !report.creditsBlocksPlay || !report.transformation.visible || report.ascended.phase !== 2 || report.ascended.transitionT !== 0) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise(resolve => server.httpServer.close(resolve));
}
