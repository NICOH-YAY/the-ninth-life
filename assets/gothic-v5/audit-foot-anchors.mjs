// AI-use disclosure: Codex-authored read-only connected-body foot audit.
import sharp from 'sharp';import{writeFile}from'node:fs/promises';
const names=['kitten','alley','sailor','acrobat','witch','knight','thief','quiet','patchwork'],all=[];
for(const path of['public/royal-v4/visitor-walk.png','public/royal-v4/visitor-combat.png','public/gothic-v5/visitors.png']){
const{data,info}=await sharp(path).ensureAlpha().raw().toBuffer({resolveWithObject:true});
for(let row=0;row<9;row++)for(let col=0;col<6;col++){
const seen=new Uint8Array(144*144),parts=[];
for(let i=0;i<seen.length;i++){const x=i%144,y=i/144|0,index=((row*144+y)*info.width+col*144+x)*4;if(seen[i]||data[index+3]<100)continue;const stack=[i];seen[i]=1;let n=0,left=144,right=0,top=144,bottom=0;
while(stack.length){const p=stack.pop(),x=p%144,y=p/144|0;n++;left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++){if(xx<0||yy<0||xx>=144||yy>=144)continue;const q=yy*144+xx,at=((row*144+yy)*info.width+col*144+xx)*4;if(!seen[q]&&data[at+3]>100){seen[q]=1;stack.push(q);}}}
parts.push({n,left,right,top,bottom});}
parts.sort((a,b)=>b.n-a.n);all.push({path,life:names[row],row,col,frame:row*6+col,body:parts[0],others:parts.slice(1).filter(p=>p.n>4)});
}
}
const flagged=all.filter(a=>a.life!=='thief'&&a.body.bottom<105);
const report={aiUseDisclosure:'Codex measured largest8-connectedalpha component without modifying any sprite.',frames:all.length,flaggedNonThief:flagged,all};
await writeFile('assets/gothic-v5/foot-anchor-audit.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({frames:all.length,flaggedNonThief:flagged.map(a=>({path:a.path,life:a.life,col:a.col,body:a.body,others:a.others}))},null,2));
