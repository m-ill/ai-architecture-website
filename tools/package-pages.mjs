import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
const release=path.join(root,'output/releases',new Date().toISOString().replace(/[:.]/g,'-'));
const site=path.join(release,'site');fs.mkdirSync(site,{recursive:true});
fs.cpSync(path.join(root,'public'),site,{recursive:true});
const env={...process.env,WRANGLER_LOG_PATH:path.join(release,'build.log')};
const result=spawnSync(process.execPath,[path.join(root,'node_modules/wrangler/bin/wrangler.js'),'pages','functions','build',path.join(root,'functions'),'--outdir',path.join(release,'worker'),'--minify','--compatibility-date=2026-11-17'],{cwd:root,env,stdio:'inherit'});
if(result.status!==0)throw new Error('Worker build failed');
fs.copyFileSync(path.join(release,'worker/index.js'),path.join(site,'_worker.js'));
fs.writeFileSync(path.join(site,'_routes.json'),JSON.stringify({version:1,include:['/api/*'],exclude:[]},null,2));
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const file of files(site)){
 if(fs.statSync(file).size>25*1024*1024)throw new Error('Asset exceeds Pages size limit: '+path.basename(file));
 if(/\.(js|html|json|md|txt|css)$/.test(file)&&/sk-[A-Za-z0-9_-]{16,}/.test(fs.readFileSync(file,'utf8')))throw new Error('Credential-like value in release');
}
fs.writeFileSync(path.join(root,'output/releases/latest.json'),JSON.stringify({release,site,files:files(site).length},null,2));
console.log(JSON.stringify({release,site,files:files(site).length}));
