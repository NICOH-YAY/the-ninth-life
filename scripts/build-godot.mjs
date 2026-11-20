// AI-use disclosure: Codex-authored portable Godot import/export pipeline, with all local tooling on D:.
import { existsSync } from "node:fs";
import { mkdir,writeFile,copyFile,cp,readFile } from "node:fs/promises";
import { resolve,dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const repo=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const version="4.7.2",tag=version+"-stable",windows=process.platform==="win32";
const tool=process.env.GODOT_TOOL_ROOT??(windows?"D:/Coding VS/.tools/godot":resolve(tmpdir(),"ninth-life-godot"));
const binary=resolve(tool,"bin","Godot_v"+tag+"_"+(windows?"win64_console.exe":"linux.x86_64"));
function run(command,args,options={}){
 const result=spawnSync(command,args,{cwd:repo,encoding:"utf8",maxBuffer:24*1024*1024,...options});
 if(result.stdout)process.stdout.write(result.stdout);if(result.stderr)process.stderr.write(result.stderr);
 if(result.error)throw result.error;
 if(result.status!==0)throw new Error(command+" failed with exit "+result.status);
 if(/SCRIPT ERROR|Parse Error|ERROR: Failed to (load|export)/i.test((result.stdout??"")+" "+(result.stderr??"")))throw new Error("Godot reported script/import/export errors.");
}
if(!existsSync(resolve(tool,"web-template-receipt.json"))||!existsSync(resolve(tool,"Godot_v"+tag+"_"+(windows?"win64.exe":"linux.x86_64")+".zip"))){
 run(process.execPath,["scripts/install-godot.mjs"],{env:{...process.env,GODOT_TOOL_ROOT:tool}});
}
await mkdir(resolve(tool,"bin"),{recursive:true});
if(!existsSync(binary)){
 const archive=resolve(tool,"Godot_v"+tag+"_"+(windows?"win64.exe":"linux.x86_64")+".zip");
 if(windows)run("powershell.exe",["-NoProfile","-Command","Expand-Archive -LiteralPath '"+archive.replaceAll("'","''")+"' -DestinationPath '"+resolve(tool,"bin").replaceAll("'","''")+"' -Force"]);
 else run("unzip",["-oq",archive,"-d",resolve(tool,"bin")]);
}
await writeFile(resolve(tool,"bin","_sc_"),"");
await mkdir(resolve(tool,"bin","editor_data","export_templates",version+".stable"),{recursive:true});
await cp(resolve(tool,"templates",version+".stable"),resolve(tool,"bin","editor_data","export_templates",version+".stable"),{recursive:true});
await mkdir(resolve(repo,"build","web"),{recursive:true});
const env={...process.env};
const profile=resolve(tool,"user-data");
for(const name of ["roaming","local","data","config","cache"])await mkdir(resolve(profile,name),{recursive:true});
if(windows){env.APPDATA=resolve(profile,"roaming");env.LOCALAPPDATA=resolve(profile,"local");}
else{env.GODOT_SILENCE_ROOT_WARNING="1";env.XDG_DATA_HOME=resolve(profile,"data");env.XDG_CONFIG_HOME=resolve(profile,"config");env.XDG_CACHE_HOME=resolve(profile,"cache");}
run(binary,["--headless","--path",resolve(repo,"godot"),"--editor","--import"],{env});
for(const test of ["verify_court.gd","verify_game.gd","verify_planner.gd"])run(binary,["--headless","--path",resolve(repo,"godot"),"--script","res://content/"+test],{env});
run(binary,["--headless","--path",resolve(repo,"godot"),"--export-release","Web",resolve(repo,"build","web","index.html")],{env});
if(existsSync(resolve(repo,"public","favicon.png")))await copyFile(resolve(repo,"public","favicon.png"),resolve(repo,"build","web","favicon.png"));
const licensePath=resolve(tool,"GODOT-LICENSE.txt");
if(!existsSync(licensePath)){
 const response=await fetch("https://raw.githubusercontent.com/godotengine/godot/"+tag+"/LICENSE.txt");
 if(!response.ok)throw new Error("Official Godot license download failed");
 await writeFile(licensePath,await response.text());
}
await copyFile(licensePath,resolve(repo,"build","web","GODOT-LICENSE.txt"));
if(existsSync(resolve(repo,"ATTRIBUTION.md")))await copyFile(resolve(repo,"ATTRIBUTION.md"),resolve(repo,"build","web","ATTRIBUTION.md"));
await writeFile(resolve(repo,"build","web",".nojekyll"),"");
const receipt=JSON.parse(await readFile(resolve(tool,"web-template-receipt.json"),"utf8"));
await writeFile(resolve(repo,"build","web","build-info.json"),JSON.stringify({aiUseDisclosure:"Codex-authored native Godot web export.",engine:"Godot",version,threaded:false,renderer:"Compatibility/WebGL2",sourceCommit:process.env.GITHUB_SHA??null,officialTemplates:receipt.templates.map(t=>({file:t.file,sha256:t.sha256}))},null,2));
console.log("Godot Web build ready: "+resolve(repo,"build","web","index.html"));
