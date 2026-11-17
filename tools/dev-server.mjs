import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import {onRequest} from '../functions/_lib/ask-handler.mjs';
const pub=path.resolve(import.meta.dirname,'../public');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.md':'text/plain; charset=utf-8','.txt':'text/plain; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.xml':'application/xml'};
function asset(url){
  let file=path.resolve(pub,'.'+decodeURIComponent(new URL(url).pathname));
  if(!file.startsWith(pub+path.sep)&&file!==pub)return new Response('Forbidden',{status:403});
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file))return new Response('Not found',{status:404});
  return new Response(fs.readFileSync(file),{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}});
}
const env={ASSETS:{fetch:async url=>asset(url)},SCHOOL_AI_API_KEY:process.env.SCHOOL_AI_API_KEY,SCHOOL_AI_MODEL:process.env.SCHOOL_AI_MODEL,SCHOOL_AI_BASE_URL:process.env.SCHOOL_AI_BASE_URL};
// Optional one-time secret on stdin stays in memory. Never echo input or upstream bodies.
if(process.argv.includes('--secret-stdin')){env.SCHOOL_AI_API_KEY=await new Promise(resolve=>{let buffer='';process.stdin.setEncoding('utf8');process.stdin.on('data',function receive(chunk){buffer+=chunk;if(buffer.includes('\n')){process.stdin.removeListener('data',receive);process.stdin.pause();resolve(buffer.trim());buffer='';}});});}
const server=http.createServer(async(req,res)=>{
  const origin=`http://127.0.0.1:${process.env.PORT||8788}`;
  const url=new URL(req.url,origin);let response;
  try{
    if(url.pathname==='/api/health')response=Response.json({ok:true,service:'ai-architecture-wiki'});
    else if(url.pathname==='/api/ask'){
      const abort=new AbortController();res.on('close',()=>{if(!res.writableEnded)abort.abort();});
      const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:ReadableStreamFrom(req),duplex:'half'}:{}),signal:abort.signal});
      response=await onRequest({request,env});
    }else response=asset(url.href);
    res.writeHead(response.status,Object.fromEntries(response.headers));
    if(response.body){const reader=response.body.getReader();try{while(true){const {done,value}=await reader.read();if(done)break;if(res.destroyed){await reader.cancel();break;}res.write(value);}}finally{reader.releaseLock();}}
    res.end();
  }catch{if(!res.headersSent)res.writeHead(500);res.end('Request failed');}
});
function ReadableStreamFrom(req){return new ReadableStream({async start(controller){try{for await(const chunk of req)controller.enqueue(new Uint8Array(chunk));controller.close();}catch{controller.error(new Error('Request interrupted'));}}});}
server.listen(Number(process.env.PORT||8788),'127.0.0.1',()=>console.log(`Preview http://127.0.0.1:${process.env.PORT||8788} (AI ${env.SCHOOL_AI_API_KEY?'connected configuration':'reference mode'})`));
