// AI-use disclosure: Codex-authored native pixel export of existing attributed arena art.
import sharp from 'sharp';
import {mkdir,writeFile} from 'node:fs/promises';
await mkdir('public/royal-v4',{recursive:true});
for (const [name,path] of [['arena-night','public/bg/pixel-arena.png'],['arena-mid','public/combat-v3/castle-aged-mid.png'],['arena-late','public/combat-v3/castle-aged-late.png']]) {
await sharp(path).resize(320,180,{fit:'fill',kernel:'nearest'}).png({palette:true,colours:32,dither:0}).toFile('public/royal-v4/'+name+'.png');
}
await writeFile('assets/royal-arena-manifest.json',JSON.stringify({aiUseDisclosure:'Codex authored 320x180 nearest-neighbor pixel processing; Higgsfield original provenance retained in ATTRIBUTION.md.',native:[320,180],colors:32,files:['arena-night','arena-mid','arena-late']},null,2));
