// AI-use disclosure: Codex-authored installer for official pinned Godot binaries and selectively downloaded web export templates.
import { mkdir, readFile, writeFile, open, unlink } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
import { resolve } from "node:path";
const version="4.7.2",tag=version+"-stable";
const base="https://github.com/godotengine/godot/releases/download/"+tag+"/";
const root=process.env.GODOT_TOOL_ROOT ?? "D:/Coding VS/.tools/godot";
await mkdir(root,{recursive:true});
const sums=await (await fetch(base+"SHA512-SUMS.txt")).text();
await writeFile(resolve(root,"SHA512-SUMS.txt"),sums);
const platform=process.platform==="win32"?"win64.exe":"linux.x86_64";
const filename="Godot_v"+tag+"_"+platform+".zip";
const archive=new Uint8Array(await (await fetch(base+filename)).arrayBuffer());
const hash=createHash("sha512").update(archive).digest("hex");
if(!sums.split("\n").some(line=>line.startsWith(hash)&&line.includes(filename)))throw new Error("Official editor SHA512 mismatch");
await writeFile(resolve(root,filename),archive);
console.log(JSON.stringify({editor:filename,bytes:archive.length,sha512:hash}));
const templateUrl=base+"Godot_v"+tag+"_export_templates.tpz";
async function range(start,end){
 const response=await fetch(templateUrl,{headers:{Range:start===null?"bytes=-65536":"bytes="+start+"-"+end}});
 if(response.status!==206){await response.body?.cancel();throw new Error("Official CDN did not support ZIP range extraction: HTTP"+response.status);}
 return Buffer.from(await response.arrayBuffer());
}
let fullArchive=null;
const remoteRange=range;
try { await remoteRange(null,null); } catch(error) {
 console.log("Range unavailable; streaming the official all-platform archive to D for selective extraction.");
 const file=resolve(root,"Godot_v"+tag+"_export_templates.tpz");
 const response=await fetch(templateUrl);
 if(!response.ok)throw new Error("Official template download HTTP"+response.status);
 const handle=await open(file,"w"), hash=createHash("sha512");
 let downloaded=0,lastReport=0;
 try {for await(const chunk of response.body){await handle.write(chunk);hash.update(chunk);downloaded+=chunk.length;if(downloaded-lastReport>128*1024*1024){lastReport=downloaded;console.log(JSON.stringify({templateDownloaded:downloaded}));}}}finally{await handle.close();}
 const digest=hash.digest("hex");
 if(!sums.split("\n").some(line=>line.startsWith(digest)&&line.includes("_export_templates.tpz")))throw new Error("Official template archive SHA512 mismatch");
 fullArchive=await open(file,"r");
}
const remoteOrFileRange=async(start,end)=>{
 if(!fullArchive)return remoteRange(start,end);
 const size=(await fullArchive.stat()).size;
 if(start===null){start=Math.max(0,size-65536);end=size-1;}
 const bytes=Buffer.alloc(end-start+1);await fullArchive.read(bytes,0,bytes.length,start);return bytes;
};
const tail=await remoteOrFileRange(null,null);
let eocd=-1;for(let i=tail.length-22;i>=0;i--)if(tail.readUInt32LE(i)===0x06054b50){eocd=i;break;}
if(eocd<0)throw new Error("ZIP central directory missing");
const cdSize=tail.readUInt32LE(eocd+12),cdOffset=tail.readUInt32LE(eocd+16);
const cd=await remoteOrFileRange(cdOffset,cdOffset+cdSize-1);
const entries=[];
for(let i=0;i<cd.length;){
 if(cd.readUInt32LE(i)!==0x02014b50)throw new Error("Invalid ZIP directory");
 const nameLen=cd.readUInt16LE(i+28),extraLen=cd.readUInt16LE(i+30),commentLen=cd.readUInt16LE(i+32);
 entries.push({name:cd.toString("utf8",i+46,i+46+nameLen),method:cd.readUInt16LE(i+10),crc:cd.readUInt32LE(i+16),compressed:cd.readUInt32LE(i+20),size:cd.readUInt32LE(i+24),offset:cd.readUInt32LE(i+42)});
 i+=46+nameLen+extraLen+commentLen;
}
const selected=entries.filter(e=>/\/(web_.*\.zip|version\.txt)$/.test(e.name));
if(!selected.length)throw new Error("No web templates in official archive");
const templateRoot=resolve(root,"templates",version+".stable");
await mkdir(templateRoot,{recursive:true});
function crc32(bytes){let c=0xffffffff;for(const byte of bytes){c^=byte;for(let i=0;i<8;i++)c=(c>>>1)^((c&1)?0xedb88320:0);}return(c^0xffffffff)>>>0;}
const receipt=[];
for(const entry of selected){
 const head=await remoteOrFileRange(entry.offset,entry.offset+29);
 if(head.readUInt32LE(0)!==0x04034b50)throw new Error("Invalid local ZIP header");
 const start=entry.offset+30+head.readUInt16LE(26)+head.readUInt16LE(28);
 const packed=await remoteOrFileRange(start,start+entry.compressed-1);
 const unpacked=entry.method===0?packed:entry.method===8?inflateRawSync(packed):null;
 if(!unpacked||unpacked.length!==entry.size||crc32(unpacked)!==entry.crc)throw new Error("Template ZIP CRC/size mismatch "+entry.name);
 const file=entry.name.split("/").pop();
 await writeFile(resolve(templateRoot,file),unpacked);
 receipt.push({file,bytes:unpacked.length,sha256:createHash("sha256").update(unpacked).digest("hex"),officialArchive:templateUrl,zipCrc32:entry.crc.toString(16)});
 console.log(JSON.stringify({template:file,bytes:unpacked.length}));
}
await writeFile(resolve(root,"web-template-receipt.json"),JSON.stringify({aiUseDisclosure:"Codex downloaded official Godot binaries and ZIP-range-extracted web templates, checking editor SHA512 and each extracted entry CRC32.",version,tag,editor:{filename,sha512:hash},templates:receipt},null,2));
if(fullArchive){await fullArchive.close();await unlink(resolve(root,"Godot_v"+tag+"_export_templates.tpz"));}
