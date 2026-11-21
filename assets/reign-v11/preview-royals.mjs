// AI-use disclosure: Codex visual review sheets of every actual native royal body-magic pose.
import sharp from 'sharp';
for(const id of['magic-base-hand','magic-base-gifts','magic-air-hand','magic-air-gifts']){
 const floors=[];for(let r=0;r<6;r++)floors.push('<path d="M0 '+(r*192+154)+' H1152" stroke="#38685e" stroke-width="1"/>');
 await sharp({create:{width:1152,height:1152,channels:4,background:'#17232b'}}).composite([{input:Buffer.from('<svg width="1152" height="1152">'+floors.join('')+'</svg>'),left:0,top:0},{input:'godot/art/'+id+'-v11.png',left:0,top:0}]).png().toFile('assets/reign-v11/'+id+'-native-contact.png');
}
console.log('144 native royal poses reviewed in four unscaled contact sheets; green lines are source anchors, not floor height for hovering form.');
