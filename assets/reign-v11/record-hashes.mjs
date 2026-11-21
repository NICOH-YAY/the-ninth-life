// AI-use disclosure: Codex records exact source/runtime hashes for original selected and rejected Higgsfield iterations.
import{readFile,writeFile}from'node:fs/promises';import{createHash}from'node:crypto';
const file='assets/reign-v11/manifest.json',m=JSON.parse(await readFile(file,'utf8'));
for(const item of m.generated){item.sourceSha256=createHash('sha256').update(await readFile(item.source)).digest('hex');item.runtimeSha256=createHash('sha256').update(await readFile(item.runtime)).digest('hex');if(item.id==='royal-magic-fx'){delete item.foot;item.anchors=m.fx.anchors;}}
await writeFile(file,JSON.stringify(m,null,2));
const rejected='assets/reign-v11/gait-alley-rejected-quadruped-geometry.json',g=JSON.parse(await readFile(rejected,'utf8'));g.input='assets/reign-v11/gait-alley-rejected-quadruped-original.png';g.output='assets/reign-v11/gait-alley-rejected-quadruped-native.png';g.status='rejected, never loaded by game';g.job='8fb8eeda-7c0f-4484-9bc5-0b52be055f63';await writeFile(rejected,JSON.stringify(g,null,2));
console.log(JSON.stringify({jobs:m.generated.length,selected:m.generated.filter(j=>j.status==='selected').length,rejected:m.generated.filter(j=>j.status!=='selected').length,sourceAndRuntimeHashes:m.generated.every(j=>j.sourceSha256.length===64&&j.runtimeSha256.length===64)}));
