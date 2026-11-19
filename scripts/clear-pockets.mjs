// AI-use disclosure: written by Claude Code. Second keying pass: the border flood fill in
// chroma-key.mjs cannot reach background pockets enclosed by a character (for example
// between the glaive shaft and the cloak). This clears large enclosed regions whose color
// is close to the background color sampled from the original concept image border.
// Usage: node scripts/clear-pockets.mjs [--dry]
import sharp from 'sharp';
import { readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'public', 'sprites');
const DRY = process.argv.includes('--dry');
const THRESH = 22;      // color distance to the background color
const MIN_AREA = 250;   // pixels, at the shipped sprite size
const SOURCE = { kitten: 'lineup-six', alley: 'lineup-six', sailor: 'lineup-six', witch: 'lineup-six', knight: 'lineup-six', acrobat: 'lineup-six', thief: 'lineup-thief-quiet', quiet: 'lineup-thief-quiet', patchwork: 'patchwork', 'immortal-base': 'immortal-base', 'immortal-ascended': 'immortal-ascended' };

async function borderColor(file) {
  const { data, info } = await sharp(join(ROOT, 'assets', 'concept', file + '.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const rs = [], gs = [], bs = [];
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) {
    if (x > 3 && y > 3 && x < info.width - 4 && y < info.height - 4) continue;
    const i = (y * info.width + x) * 4;
    rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
  }
  const med = (a) => a.sort((p, q) => p - q)[a.length >> 1];
  return [med(rs), med(gs), med(bs)];
}

for (const f of await readdir(DIR)) {
  if (!f.endsWith('.png')) continue;
  const name = f.replace('.png', '');
  const src = SOURCE[name];
  if (!src) continue;
  const bg = await borderColor(src);
  const p = join(DIR, f);
  const { data, info } = await sharp(p).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const near = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    if (data[i * 4 + 3] < 40) continue;
    const d = Math.hypot(data[i * 4] - bg[0], data[i * 4 + 1] - bg[1], data[i * 4 + 2] - bg[2]);
    if (d < THRESH) near[i] = 1;
  }
  const seen = new Uint8Array(w * h);
  let cleared = 0, regions = 0;
  for (let s = 0; s < w * h; s++) {
    if (!near[s] || seen[s]) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const q = comp[k], x = q % w, y = (q / w) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const r = ny * w + nx;
        if (near[r] && !seen[r]) { seen[r] = 1; comp.push(r); }
      }
    }
    if (comp.length >= MIN_AREA) {
      regions++;
      cleared += comp.length;
      if (!DRY) for (const q of comp) data[q * 4 + 3] = 0;
    }
  }
  console.log(f, 'bg', bg.join(','), 'regions', regions, 'pixels', cleared);
  if (!DRY && cleared) await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png({ compressionLevel: 9 }).toFile(p + '.tmp').then(() => import('node:fs/promises').then((fs) => fs.rename(p + '.tmp', p)));
}
