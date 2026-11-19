// AI-use disclosure: written by Claude Code. Downscale game sprites to a 512 px max height
// (characters draw at most about 260 px tall on a 960x540 canvas, so this is about 2x).
import sharp from 'sharp';
import { readdir, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sprites');
for (const f of await readdir(DIR)) {
  if (!f.endsWith('.png')) continue;
  const p = join(DIR, f);
  const meta = await sharp(p).metadata();
  if ((meta.height ?? 0) <= 512) continue;
  await sharp(p).resize({ height: 512 }).png({ compressionLevel: 9 }).toFile(p + '.tmp');
  await rename(p + '.tmp', p);
  console.log('resized', f);
}
