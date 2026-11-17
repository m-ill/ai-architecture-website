import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const {site}=JSON.parse(fs.readFileSync('output/releases/latest.json','utf8'));
const {default:worker}=await import(pathToFileURL(path.join(site,'_worker.js')));
const env={ASSETS:{fetch:async req=>{const url=typeof req==='string'?req:req.url;let file=path.join(site,new URL(url).pathname);if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');return fs.existsSync(file)?new Response(fs.readFileSync(file)):new Response('Not found',{status:404});}}};
for(const [url,options] of [['/',{}],['/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'학과 문의 연락처를 알려주세요'})}],['/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:'기초와 실무를 어떻게 함께 배우나요?'})}]]){
 const response=await worker.fetch(new Request('https://ai-architecture-website.pages.dev'+url,options),env,{waitUntil(){},passThroughOnException(){}});
 if(response.status!==200)throw new Error(`${url}: ${response.status}`);
 if(url.startsWith('/api')){const data=await response.json();if(!data.ok||!data.answer||!data.sources?.length)throw new Error('Missing grounded answer');}
 console.log('PASS '+url);
}
