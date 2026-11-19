// Chroma-key the light grey background out of concept art.
// Reads character and lineup images listed in assets/concept/manifest.json,
// writes keyed, trimmed PNGs to public/sprites/keyed/.
// Originals in assets/concept/ are never modified.
import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONCEPT_DIR = join(ROOT, 'assets', 'concept');
const OUT_DIR = join(ROOT, 'public', 'sprites', 'keyed');
const KEY_KINDS = new Set(['character', 'lineup']);
const HARD = 28;   // d below this: fully transparent
const SOFT = 48;   // d between HARD and SOFT: partial alpha; at or above: opaque
const BORDER = 4;  // border band used to sample the background
const PAD = 4;

function median(values) {
  const v = [...values].sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}

async function keyImage(file) {
  const src = join(CONCEPT_DIR, file);
  const { data, info } = await sharp(await readFile(src))
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = info;
  const ch = 4;

  // Background = median RGB of the outer BORDER-pixel band.
  const rs = [], gs = [], bs = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (x >= BORDER && y >= BORDER && x < w - BORDER && y < h - BORDER) continue;
      const i = (y * w + x) * ch;
      rs.push(data[i]); gs.push(data[i + 1]); bs.push(data[i + 2]);
    }
  }
  const bg = [median(rs), median(gs), median(bs)];

  const dist = (i) => {
    const dr = data[i] - bg[0], dg = data[i + 1] - bg[1], db = data[i + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const alphaFor = (d) => (d < HARD ? 0 : Math.round(((d - HARD) / (SOFT - HARD)) * 255));

  // Flood fill from border pixels: only pixels 4-connected to the border and
  // within the SOFT threshold are candidates. Interior grey survives.
  const candidate = new Uint8Array(w * h);   // 1 = reached by flood
  const queue = new Int32Array(w * h);
  let qh = 0, qt = 0;
  const seed = (x, y) => {
    const p = y * w + x;
    if (candidate[p]) return;
    if (dist((y * w + x) * ch) < SOFT) { candidate[p] = 1; queue[qt++] = p; }
  };
  for (let x = 0; x < w; x++) { seed(x, 0); seed(x, h - 1); }
  for (let y = 0; y < h; y++) { seed(0, y); seed(w - 1, y); }

  while (qh < qt) {
    const p = queue[qh++];
    const x = p % w, y = (p - x) / w;
    const nb = [];
    if (x > 0) nb.push(p - 1);
    if (x < w - 1) nb.push(p + 1);
    if (y > 0) nb.push(p - w);
    if (y < h - 1) nb.push(p + w);
    for (const q of nb) {
      if (candidate[q]) continue;
      if (dist(q * ch) < SOFT) { candidate[q] = 1; queue[qt++] = q; }
    }
  }

  // Apply alpha only to flood-reached pixels.
  for (let p = 0; p < w * h; p++) {
    if (!candidate[p]) continue;
    const i = p * ch;
    data[i + 3] = alphaFor(dist(i));
  }

  // Trim transparent margins with a 4px pad.
  let minX = w, minY = h, maxX = -1, maxY = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * ch + 3] > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) throw new Error(`${file}: nothing left after keying`);
  const left = Math.max(0, minX - PAD);
  const top = Math.max(0, minY - PAD);
  const right = Math.min(w - 1, maxX + PAD);
  const bottom = Math.min(h - 1, maxY + PAD);
  const cw = right - left + 1, chh = bottom - top + 1;

  await mkdir(OUT_DIR, { recursive: true });
  const out = join(OUT_DIR, file);
  await sharp(data, { raw: { width: w, height: h, channels: 4 } })
    .extract({ left, top, width: cw, height: chh })
    .png()
    .toFile(out);

  const flooded = candidate.reduce((a, b) => a + b, 0);
  console.log(`${file}: bg=rgb(${bg.join(',')}) flooded=${flooded} out=${cw}x${chh}`);
}

const manifest = JSON.parse(await readFile(join(CONCEPT_DIR, 'manifest.json'), 'utf8'));
for (const entry of manifest.images) {
  if (!KEY_KINDS.has(entry.kind)) continue;
  await keyImage(entry.file);
}
