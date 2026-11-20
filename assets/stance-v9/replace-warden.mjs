// AI-use disclosure: Codex replaces only the contaminated warden row with an original targeted Higgsfield chain-only anticipation strip.
import sharp from 'sharp';import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const sheet='godot/art/prepare-visitors-v9.png',strip='godot/art/prepare-warden-v9.png';
const before=await readFile(sheet),after=await sharp(before).composite([{input:strip,left:0,top:288}]).png().toBuffer();
await writeFile(sheet,after);
const geo=JSON.parse(await readFile('assets/stance-v9/prepare-visitors-geometry.json','utf8'));geo.repairedRow=2;geo.repairJob='ddc8355e-a791-4308-878a-8319391d9079';geo.repairReason='Original combined roster row2 last frame contained an incorrect hooked sickle. Entire six-frame row replaced with a targeted chain/censer-only original generation.';geo.sha256=createHash('sha256').update(after).digest('hex');await writeFile('assets/stance-v9/prepare-visitors-geometry.json',JSON.stringify(geo,null,2));console.log(JSON.stringify({row:2,frames:6,sha256:geo.sha256}));
