// AI-use disclosure: Codex-authored local server for the real Godot web export.
import {createServer} from "node:http";
import {readFile,stat} from "node:fs/promises";
import {resolve,dirname,extname} from "node:path";
import {fileURLToPath} from "node:url";
const repo=resolve(dirname(fileURLToPath(import.meta.url)),".."),root=resolve(repo,"build","web");
const port=Number(process.env.PORT??5190);
await stat(resolve(root,"index.html")).catch(()=>{throw new Error("Build the Godot game first: npm run build");});
const types={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".wasm":"application/wasm",".pck":"application/octet-stream",".json":"application/json",".png":"image/png",".txt":"text/plain; charset=utf-8",".md":"text/markdown; charset=utf-8",".ogg":"audio/ogg",".mp3":"audio/mpeg"};
const server=createServer(async(req,res)=>{
 try{
  const path=resolve(root,"."+decodeURIComponent(new URL(req.url,"http://localhost").pathname).replace(/\/$/,"/index.html"));
  if(!path.startsWith(root))throw new Error("Outside export");
  const bytes=await readFile(path);res.writeHead(200,{"content-type":types[extname(path)]??"application/octet-stream","cache-control":"no-cache"});res.end(bytes);
 }catch{res.writeHead(404);res.end("Not found");}
});
server.listen(port,"127.0.0.1",()=>console.log("The Ninth Life (Godot): http://127.0.0.1:"+port+"/"));
for(const signal of ["SIGINT","SIGTERM"])process.on(signal,()=>server.close(()=>process.exit(0)));
