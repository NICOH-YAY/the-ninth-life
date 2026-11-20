// AI-use disclosure: Codex assembles Luis Zuno/Ansimuz CC0 hand-drawn pixel tiles; no AI environment painting is used.
import sharp from 'sharp';import{writeFile,mkdir}from'node:fs/promises';
const ROOT='assets/gothic-v5/tiles/',OUT='public/gothic-v5/';await mkdir(OUT,{recursive:true});
const W=480,H=270;
const img=async(name,region)=>{let p=sharp(ROOT+name);if(region)p=p.extract(region);return p.ensureAlpha().raw().toBuffer({resolveWithObject:true});};
function canvas(col){const b=Buffer.alloc(W*H*4);for(let i=0;i<b.length;i+=4){b[i]=col[0];b[i+1]=col[1];b[i+2]=col[2];b[i+3]=255;}return b;}
function rect(b,x,y,w,h,c){for(let yy=Math.max(0,y|0);yy<Math.min(H,y+h);yy++)for(let xx=Math.max(0,x|0);xx<Math.min(W,x+w);xx++){const i=(yy*W+xx)*4;b[i]=c[0];b[i+1]=c[1];b[i+2]=c[2];b[i+3]=255;}}
function line(b,x,y,xx,yy,c){let n=Math.max(Math.abs(xx-x),Math.abs(yy-y));for(let i=0;i<=n;i++)rect(b,Math.round(x+(xx-x)*i/(n||1)),Math.round(y+(yy-y)*i/(n||1)),1,1,c);}
function moon(b,x,y,r,c){for(let dy=-r;dy<=r;dy++){const a=Math.floor(Math.sqrt(r*r-dy*dy));rect(b,x-a,y+dy,a*2+1,1,c);}}
function color(r,g,b,mode){if(mode==='dawn'){const v=(r+g+b)/3;return[Math.min(255,86+v*1.55),Math.min(255,56+v*1.05),Math.min(255,67+v*.64)];}
if(r>180&&g>180&&b>160)return[124,231,244];if(r>=g*.9&&r>42)return[Math.min(255,r*1.65),Math.min(255,g*1.4),Math.min(255,b*1.25)];return[Math.min(255,r*.95+4),Math.min(255,g*1.5+2),Math.min(255,Math.max(b*1.5,g*1.65)+8)];}
function blit(b,source,x,y,{tint='night',alpha=1,flip=false}={}){const{data,info}=source;for(let sy=0;sy<info.height;sy++)for(let sx=0;sx<info.width;sx++){const xx=Math.floor(x+(flip?info.width-1-sx:sx)),yy=Math.floor(y+sy);if(xx<0||yy<0||xx>=W||yy>=H)continue;const a=data[(sy*info.width+sx)*4+3]/255*alpha;if(!a)continue;const c=color(...data.subarray((sy*info.width+sx)*4,(sy*info.width+sx)*4+3),tint),o=(yy*W+xx)*4;for(let k=0;k<3;k++)b[o+k]=Math.round(b[o+k]*(1-a)+c[k]*a);}}
const sources={};for(const name of ['old-wall.png','old-tiles.png','castle-props.png','town-sky.png','town-clouds.png','town-mountains.png','town-mountains-lights.png','town-far-buildings.png','town-forest.png','town-town.png'])sources[name]=await img(name);
const clean=await img('old-wall.png',{left:672,top:32,width:256,height:232}),vined=await img('old-wall.png',{left:192,top:32,width:256,height:232});
const cap=await sharp(ROOT+'old-tiles.png').extract({left:416,top:154,width:32,height:16}).png().toBuffer(),body=await sharp(ROOT+'old-tiles.png').extract({left:320,top:160,width:32,height:64}).png().toBuffer(); const floor=await sharp({create:{width:32,height:80,channels:4,background:'#00000000'}}).composite([{input:cap,top:0,left:0},{input:body,top:16,left:0}]).ensureAlpha().raw().toBuffer({resolveWithObject:true}),throne=await img('old-tiles.png',{left:656,top:48,width:48,height:80});
const stone=await img('old-wall.png',{left:198,top:70,width:24,height:128});
function sky(b,mode='night'){for(let x=0;x<W;x+=96){blit(b,sources['town-sky.png'],x,0,{tint:mode});blit(b,sources['town-mountains.png'],x,30,{tint:mode});blit(b,sources['town-mountains-lights.png'],x,30,{tint:mode});}
for(let x=-40;x<W;x+=288)blit(b,sources['town-clouds.png'],x,18,{tint:mode,alpha:.75});}
function castle(b,cx=363,cy=160,mode='night'){
// Pixel-built architecture uses the original stone/column texture, not solid rectangular tower fills.
const towers=[[cx-59,cy-63,16,68],[cx-29,cy-87,20,92],[cx+21,cy-76,17,81],[cx+56,cy-54,14,60]];
for(const[x,y,w,h]of towers){for(let yy=y;yy<y+h;yy+=32)for(let xx=x;xx<x+w;xx+=12){for(let sy=0;sy<32&&yy+sy<y+h;sy++)for(let sx=0;sx<12&&xx+sx<x+w;sx++){const si=((sy+28)*24+sx)*4,c=color(...stone.data.subarray(si,si+3),mode);rect(b,xx+sx,yy+sy,1,1,c.map(v=>Math.round(v*.63)));}}
for(let dy=0;dy<13;dy++)rect(b,x+Math.floor(w/2)-Math.floor(dy*w/26),y-13+dy,Math.max(1,Math.floor(dy*w/13)),1,[17,29,44]);
for(let i=0;i<3;i++){rect(b,x+Math.floor(w/2)-1,y+16+i*17,2,4,mode==='dawn'?[210,128,80]:[194,171,94]);}}
for(let y=cy-33;y<cy+5;y++)for(let x=cx-58;x<cx+70;x++){const si=((y-cy+70)%80*24+(x%24))*4;const c=color(...stone.data.subarray(si,si+3),mode);rect(b,x,y,1,1,c.map(v=>Math.round(v*.57)));}
for(let x=cx-55;x<cx+69;x+=8)rect(b,x,cy-39,4,8,[22,37,50]);
for(let x=cx-48;x<cx+60;x+=17)rect(b,x,cy-22,2,5,mode==='dawn'?[179,91,67]:[165,164,89]);
}
function ground(b,mode='night'){for(let x=0;x<W;x+=32)blit(b,floor,x,232,{tint:mode});rect(b,0,232,W,1,mode==='dawn'?[234,193,122]:[97,175,197]);
for(let y=249;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;b[i]=Math.round(b[i]*.58);b[i+1]=Math.round(b[i+1]*.66);b[i+2]=Math.min(255,Math.round(b[i+2]*.9+8));}}
function throneAndSteps(b,mode='night'){for(let i=0;i<5;i++){const sx=367+i*13,sy=224-i*8;for(let x=sx;x<451;x+=32)blit(b,floor,x,sy,{tint:mode});}
const t=sharp(ROOT+'old-tiles.png').extract({left:656,top:48,width:48,height:80}).resize(36,60,{kernel:'nearest'});return t.ensureAlpha().raw().toBuffer({resolveWithObject:true}).then(s=>{blit(b,s,421,133,{tint:mode});rect(b,427,143,24,46,[30,31,64]);for(let yy=146;yy<184;yy+=7)rect(b,430,yy,18,1,[49,43,83]);rect(b,427,183,24,7,[77,44,96]);rect(b,420,181,6,13,[153,129,72]);rect(b,452,181,6,13,[153,129,72]);rect(b,421,192,38,4,[134,115,72]);for(let i=0;i<3;i++)rect(b,424+i*12,129-(i===1?4:0),4,7+(i===1?4:0),[197,157,71]);});}
for(const [id,age]of [['arena-night',0],['arena-mid',1],['arena-late',2]]){
const b=canvas([10,22,39]);blit(b,age? vined:clean,0,0);blit(b,age===2?vined:clean,224,0);
ground(b);await throneAndSteps(b);
if(age){for(let k=0;k<age*10;k++){const x=(k*83+31)%W,y=(k*29+25)%190;line(b,x,y,x+10,y+16,[32,23,52]);line(b,x+10,y+16,x+5,y+28,[32,23,52]);}
for(let i=0;i<age*12;i++){const x=(i*59+14)%W,y=225-(i%4)*2;rect(b,x,y,5+i%7,2,[31,75,69]);}}
await sharp(b,{raw:{width:W,height:H,channels:4}}).png().toFile(OUT+id+'.png');}
const menu=canvas([10,18,34]);sky(menu);moon(menu,370,54,20,[163,185,191]);moon(menu,361,49,20,[12,26,43]);
castle(menu);for(let x=-50;x<W;x+=64)blit(menu,sources['town-forest.png'],x,153,{alpha:.65});
blit(menu,sources['town-town.png'],0,173);for(let y=0;y<H;y++)for(let x=0;x<250;x++){const a=Math.max(0,.7*(1-x/250)),i=(y*W+x)*4;menu[i]=Math.round(menu[i]*(1-a));menu[i+1]=Math.round(menu[i+1]*(1-a));menu[i+2]=Math.round(menu[i+2]*(1-a)+6*a);}
await sharp(menu,{raw:{width:W,height:H,channels:4}}).png().toFile(OUT+'menu-castle.png');
const ruins=canvas([107,79,91]);sky(ruins,'dawn');moon(ruins,258,103,32,[255,223,150]);moon(ruins,258,103,24,[255,239,181]);
blit(ruins,sources['town-town.png'],0,150,{tint:'dawn'});
// Only fragments of the old architectural modules survive the blast.
for(const [sx,sy,w,h,xx,yy]of [[0,40,48,180,0,20],[200,0,38,210,442,5],[64,150,42,65,70,160],[180,170,45,62,389,158]]){const fragment=await img('old-wall.png',{left:sx+192,top:sy,width:w,height:h});const bg=sources['old-wall.png'].data;for(let i=0;i<fragment.data.length;i+=4)if(Math.max(Math.abs(fragment.data[i]-bg[0]),Math.abs(fragment.data[i+1]-bg[1]),Math.abs(fragment.data[i+2]-bg[2]))<5)fragment.data[i+3]=0;blit(ruins,fragment,xx,yy,{tint:'dawn'});}
ground(ruins,'dawn');for(let i=0;i<55;i++){const x=(i*79+17)%W,y=230-(i%5)*3;const debris=await img('old-tiles.png',{left:320+(i%3)*16,top:160,width:16,height:16});blit(ruins,debris,x,y,{tint:'dawn'});}
await sharp(ruins,{raw:{width:W,height:H,channels:4}}).png().toFile(OUT+'dawn-ruins.png');
await writeFile('assets/gothic-v5/environment-layout.json',JSON.stringify({aiUseDisclosure:'Codex composed human-drawn Ansimuz CC0 layers; no generated painting is used in these environments.',native:[480,270],display:[960,540],floorY:232,displayFloorY:464,throneFeetY:193,filter:'nearest',artist:'Luis Zuno / Ansimuz',sources:'assets/gothic-v5/tile-sources.json',files:['arena-night','arena-mid','arena-late','menu-castle','dawn-ruins']},null,2)+'\n');
console.log('Composed five native480x270 castle images from licensed hand-drawn source modules.');
