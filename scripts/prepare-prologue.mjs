// AI-use disclosure: written by Codex to prepare the generated Higgsfield cutscene for Phaser.
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const input = process.argv[2] ?? 'assets/pixel/prologue.gif';
const jobId = process.argv[3] ?? '39a8f7d4-7f54-4e01-b3d5-f0f512b11476';
const metadata = await sharp(input, { animated: true }).metadata();
const frameCount = metadata.pages ?? 1;
const frameWidth = 384;
const frameHeight = 216;
const cols = 8;
const rows = Math.ceil(frameCount / cols);
const composite = [];
await mkdir('public/pixel', { recursive: true });
for (let page = 0; page < frameCount; page++) {
  const frame = await sharp(input, { page, pages: 1 })
    .resize(frameWidth, frameHeight, { fit: 'fill', kernel: 'nearest' }).png().toBuffer();
  composite.push({ input: frame, left: (page % cols) * frameWidth, top: Math.floor(page / cols) * frameHeight });
}
await sharp({ create: { width: cols * frameWidth, height: rows * frameHeight, channels: 4, background: '#080d1c' } })
  .composite(composite).png().toFile('public/pixel/prologue-atlas.png');
const data = {
  disclosure: 'AI-use disclosure: Higgsfield GPT Image 2.6 generated the source GIF; Codex extracted this atlas with sharp.',
  source: '../../' + input,
  higgsfield_job_id: jobId,
  frameCount, frameWidth, frameHeight, cols, rows,
  durationMs: 15000,
  sourceDurationMs: (metadata.delay ?? []).reduce((sum, delay) => sum + delay, 0),
  sourceDelaysMs: metadata.delay,
  note: 'The atlas records the actual delivered GIF frames. Game playback maps these observed poses to the authored 15 second opening.'
};
await writeFile('public/pixel/prologue.json', JSON.stringify(data, null, 2) + '\n');
console.log(JSON.stringify(data));
