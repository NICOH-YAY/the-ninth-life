// AI-use disclosure: written by Claude Code (first version by the asset-helper subagent).
// Split keyed lineup images into one sprite per challenger.
// Column scanning failed on lineup-six because the umbrella, hat, and sword overlap
// neighbouring cats. This version labels connected components of opaque pixels and
// gives each component to the cat whose column band contains the component's center.
// Bands were read off the keyed image by eye. The real left-to-right order of
// lineup-six is kitten, alley, sailor, witch, knight, acrobat (caped cat with the bell).
import sharp from 'sharp';
import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KEYED = join(ROOT, 'public', 'sprites', 'keyed');
const OUT = join(ROOT, 'public', 'sprites');
const ALPHA_MIN = 40;
const MIN_COMPONENT = 30; // pixels; smaller specks are dropped
const PAD = 4;

// bands: right edge (exclusive) of each cat's column band, in source pixels.
const LINEUPS = [
  { file: 'lineup-six.png', names: ['kitten', 'alley', 'sailor', 'witch', 'knight', 'acrobat'], bands: [230, 565, 950, 1290, 1625, Infinity] },
  { file: 'lineup-thief-quiet.png', names: ['thief', 'quiet'], bands: null },
];
const SINGLES = ['immortal-base', 'immortal-ascended', 'patchwork'];

async function loadRaw(path) {
  const { data, info } = await sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height };
}

/** 8-connected component labels for pixels with alpha >= ALPHA_MIN. */
function components({ data, w, h }) {
  const label = new Int32Array(w * h).fill(-1);
  const comps = [];
  const stack = [];
  for (let start = 0; start < w * h; start++) {
    if (label[start] !== -1 || data[start * 4 + 3] < ALPHA_MIN) continue;
    const id = comps.length;
    let minX = w, maxX = -1, minY = h, maxY = -1, n = 0, sumX = 0;
    stack.push(start);
    label[start] = id;
    while (stack.length) {
      const p = stack.pop();
      const x = p % w, y = (p / w) | 0;
      n++; sumX += x;
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
        const q = ny * w + nx;
        if (label[q] === -1 && data[q * 4 + 3] >= ALPHA_MIN) { label[q] = id; stack.push(q); }
      }
    }
    comps.push({ id, n, minX, maxX, minY, maxY, cx: (minX + maxX) / 2, meanX: sumX / n });
  }
  return { label, comps };
}

async function splitLineup({ file, names, bands }, img) {
  const { label, comps } = components(img);
  const kept = comps.filter((c) => c.n >= MIN_COMPONENT);
  let bandOf;
  if (bands) {
    bandOf = (c) => bands.findIndex((edge) => c.meanX < edge);
  } else {
    // Two cats with a clear gap: split at the midpoint of the two largest components.
    const big = [...kept].sort((a, b) => b.n - a.n).slice(0, names.length).sort((a, b) => a.meanX - b.meanX);
    const edges = big.slice(0, -1).map((c, i) => (c.maxX + big[i + 1].minX) / 2);
    bandOf = (c) => { const i = edges.findIndex((e) => c.meanX < e); return i === -1 ? names.length - 1 : i; };
  }
  const owner = new Int32Array(comps.length).fill(-1);
  for (const c of kept) owner[c.id] = bandOf(c);
  const report = [];
  for (let k = 0; k < names.length; k++) {
    const mine = kept.filter((c) => owner[c.id] === k);
    if (!mine.length) { report.push(`${names[k]}: no pixels`); continue; }
    const x0 = Math.max(0, Math.min(...mine.map((c) => c.minX)) - PAD);
    const x1 = Math.min(img.w - 1, Math.max(...mine.map((c) => c.maxX)) + PAD);
    const y0 = Math.max(0, Math.min(...mine.map((c) => c.minY)) - PAD);
    const y1 = Math.min(img.h - 1, Math.max(...mine.map((c) => c.maxY)) + PAD);
    const cw = x1 - x0 + 1, ch = y1 - y0 + 1;
    const out = Buffer.alloc(cw * ch * 4);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const p = y * img.w + x;
      const l = label[p];
      if (l === -1 || owner[l] !== k) continue;
      const o = ((y - y0) * cw + (x - x0)) * 4;
      img.data.copy(out, o, p * 4, p * 4 + 4);
    }
    await sharp(out, { raw: { width: cw, height: ch, channels: 4 } }).png().toFile(join(OUT, `${names[k]}.png`));
    report.push(`${names[k]}: ${cw}x${ch} from ${mine.length} components`);
  }
  return report;
}

await mkdir(OUT, { recursive: true });
for (const lineup of LINEUPS) {
  const img = await loadRaw(join(KEYED, lineup.file));
  for (const line of await splitLineup(lineup, img)) console.log(line);
}
for (const s of SINGLES) await copyFile(join(KEYED, `${s}.png`), join(OUT, `${s}.png`));
console.log('copied singles:', SINGLES.join(', '));
