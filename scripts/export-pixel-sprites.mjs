// AI-use disclosure: Codex-authored deterministic sprite asset processing.
// Keep generator originals; export hard-edged 48x72 frames and a shared 32-colour palette.
import sharp from 'sharp';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
const palette = JSON.parse(await readFile('assets/pixel/palette.json', 'utf8')).colors.map(hex => [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16)));
const sheets = [
  { file: 'assets/pixel/immortal-base-pixel-v2.png', runtime: 'public/pixel/immortal-base-sheet.png', name: 'immortal-base', rows: 4 },
  { file: 'assets/pixel/immortal-ascended-pixel-v2.png', runtime: 'public/pixel/immortal-ascended-sheet.png', name: 'immortal-ascended', rows: 4 },
  { file: 'assets/pixel/challenger-pixel-v2.png', runtime: 'public/pixel/challenger-actions.png', name: 'challengers', rows: 9 },
  { file: 'assets/pixel/challenger-walk-v2.png', runtime: 'public/pixel/challenger-walk.png', name: 'challenger-walk', rows: 9 },
  { file: 'assets/pixel/immortal-transformation.png', runtime: 'public/pixel/immortal-transformation.png', name: 'immortal-transformation', rows: 2 },
];
await mkdir('assets/pixel/native', { recursive: true });
const exported = [];
for (const sheet of sheets) {
  const meta = await sharp(sheet.file).metadata();
  const frames = [];
  for (let row = 0; row < sheet.rows; row++) for (let col = 0; col < 6; col++) {
    const left = Math.round(col * meta.width / 6), top = Math.round(row * meta.height / sheet.rows);
    const right = Math.round((col + 1) * meta.width / 6), bottom = Math.round((row + 1) * meta.height / sheet.rows);
    const raw = await sharp(sheet.file).extract({ left, top, width: right - left, height: bottom - top }).resize(48, 72, { fit: 'fill', kernel: 'nearest' }).ensureAlpha().raw().toBuffer();
    for (let p = 0; p < raw.length; p += 4) {
      raw[p + 3] = raw[p + 3] < 96 ? 0 : 255;
      if (!raw[p + 3]) continue;
      let best = palette[0], distance = Infinity;
      for (const rgb of palette) {
        const d = (raw[p] - rgb[0]) ** 2 + (raw[p + 1] - rgb[1]) ** 2 + (raw[p + 2] - rgb[2]) ** 2;
        if (d < distance) { best = rgb; distance = d; }
      }
      raw[p] = best[0]; raw[p + 1] = best[1]; raw[p + 2] = best[2];
    }
    let foot = 0;
    for (let y = 0; y < 72; y++) for (let x = 14; x < 35; x++) if (raw[(y * 48 + x) * 4 + 3]) foot = y;
    const anchored = Buffer.alloc(raw.length);
    const offset = Math.max(0, 71 - foot) * 48 * 4;
    raw.copy(anchored, offset, 0, raw.length - offset);
    const input = await sharp(anchored, { raw: { width: 48, height: 72, channels: 4 } }).png().toBuffer();
    frames.push({ input, left: col * 48, top: row * 72 });
  }
  const output = `assets/pixel/native/${sheet.name}.png`;
  await sharp({ create: { width: 288, height: sheet.rows * 72, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(frames).png({ palette: true, colours: 33, dither: 0 }).toFile(output);
  await copyFile(output, sheet.runtime);
  exported.push({ output, source: sheet.file, frameWidth: 48, frameHeight: 72, columns: 6, rows: sheet.rows });
}
await writeFile('assets/pixel/native/manifest.json', JSON.stringify({ disclosure: 'AI-use disclosure: Higgsfield generated sources; Codex resampled and quantized native sprite frames.', exported }, null, 2));
console.log(JSON.stringify(exported));
