// AI-use disclosure: Codex composes licensed Ansimuz hand-drawn layers into the game's castle scenes.
import sharp from 'sharp';import{mkdir,copyFile,writeFile}from'node:fs/promises';
const root='assets/gothic-v5/',legacy=root+'legacy/Legacy Collection/',base=legacy+'Assets/Gothicvania/Environments/';
await mkdir(root+'tiles',{recursive:true});await copyFile(legacy+'public-license.pdf',root+'public-license.pdf');
const items={
'old-wall.png':'Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-background.png',
'old-tiles.png':'Old-dark-Castle-tileset-Files/PNG/old-dark-castle-interior-tileset.png',
'castle-props.png':'Gothic-Castle-Files/PNG/layers/gothic-castle-background.png',
'castle-tiles.png':'Gothic-Castle-Files/PNG/layers/gothic-castle-tileset.png',
};
for(const [out,path]of Object.entries(items))await copyFile(base+path,root+'tiles/'+out);
for(const layer of ['sky','clouds','mountains','mountains-lights','far-buildings','forest','town'])await copyFile(base+'night-town-background-files/layers/night-town-background-'+layer+'.png',root+'tiles/town-'+layer+'.png');
const sizes={};for(const n of Object.keys(items).concat(['sky','clouds','mountains','mountains-lights','far-buildings','forest','town'].map(n=>'town-'+n+'.png'))){const m=await sharp(root+'tiles/'+n).metadata();sizes[n]=[m.width,m.height];}
console.log(sizes);
await writeFile(root+'.gitignore','# AI-use disclosure: Codex keeps downloaded archives and ephemeral itch session pages local.\nlegacy/\nlegacy-collection.zip\n*.html\nitch-bundle.js\ndownload-response.json\n');
await writeFile(root+'tile-sources.json',JSON.stringify({aiUseDisclosure:'Codex selected and composed existing human-drawn CC0 artwork; these tile images were not AI generated.',artist:'Luis Zuno (Ansimuz)',source:'https://ansimuz.itch.io/gothicvania-patreon-collection',license:'CC0',licenseEvidence:'assets/gothic-v5/public-license.pdf',downloaded:'2026-11-20',selectedFiles:items,nightTownLayers:'night-town-background-files/layers/night-town-background-{sky,clouds,mountains,mountains-lights,far-buildings,forest,town}.png',sizes},null,2)+'\n');
