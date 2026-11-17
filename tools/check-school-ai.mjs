import {connectSchool,readSSE,DEFAULT_BASE_URL,DEFAULT_MODEL} from '../functions/_lib/school-ai.mjs';
import fs from 'node:fs';
import {retrieve,SYSTEM} from '../functions/_lib/wiki.mjs';
async function secretInput(){
  if(process.env.SCHOOL_AI_API_KEY)return process.env.SCHOOL_AI_API_KEY;
  if(!process.stdin.isTTY)throw new Error('Use an interactive terminal or SCHOOL_AI_API_KEY environment variable.');
  process.stdout.write('School API key (hidden input): ');
  process.stdin.setRawMode(true);process.stdin.resume();process.stdin.setEncoding('utf8');
  return new Promise((resolve,reject)=>{let value='';const handle=chunk=>{for(const char of chunk){if(char==='\u0003'){finish();reject(new Error('cancelled'));return;}if(char==='\r'||char==='\n'){finish();resolve(value.trim());return;}if(char==='\u007f'||char==='\b')value=value.slice(0,-1);else value+=char;}};const finish=()=>{process.stdin.removeListener('data',handle);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');};process.stdin.on('data',handle);});
}
try {
  const key=await secretInput();
  const base=process.env.SCHOOL_AI_BASE_URL||DEFAULT_BASE_URL;
  const response=await fetch(base+'/models',{headers:{Authorization:`Bearer ${key}`},signal:AbortSignal.timeout(15000)});
  if(!response.ok)throw new Error(`Models HTTP ${response.status}`);
  const models=(await response.json()).data?.map(m=>m.id)||[];
  const model=process.env.SCHOOL_AI_MODEL||DEFAULT_MODEL;
  console.log(JSON.stringify({models,selected:model,available:models.includes(model)}));
  if(!models.includes(model))throw new Error('Configured model is unavailable');
  const env={SCHOOL_AI_API_KEY:key,SCHOOL_AI_BASE_URL:base,SCHOOL_AI_MODEL:model};
  const result=await connectSchool(env,[{role:'user',content:'연결 확인입니다. 한국어로 확인되었습니다 한 문장만 답하세요.'}],false,AbortSignal.timeout(25000));
  const data=await result.json();if(!data.choices?.[0]?.message?.content)throw new Error('No text response');
  console.log(JSON.stringify({text_response:true,model:data.model||model}));
  const stream=await connectSchool(env,[{role:'user',content:'한국어로 연결 확인이라고 짧게 답하세요.'}],true,AbortSignal.timeout(25000));
  let chars=0;for await(const delta of readSSE(stream.body))chars+=delta.length;
  if(!chars)throw new Error('No stream text');console.log(JSON.stringify({streaming:true,characters:chars}));
  const index=JSON.parse(fs.readFileSync(new URL('../public/data/wiki-index.json',import.meta.url),'utf8'));
  const question='거꾸로 배우기는 어떤 방식인가요?';
  const docs=retrieve(question,index);
  const grounded=await connectSchool(env,[{role:'system',content:SYSTEM},{role:'system',content:docs.map((d,i)=>`[${i+1}] ${d.title}\n${d.text}`).join('\n\n')},{role:'user',content:question}],true,AbortSignal.timeout(45000));
  let groundedChars=0;for await(const delta of readSSE(grounded.body))groundedChars+=delta.length;
  console.log(JSON.stringify({grounded_stream:groundedChars>0,characters:groundedChars}));
  if(!groundedChars)throw new Error('No grounded response');
  if(process.argv.includes('--serve')){process.env.SCHOOL_AI_API_KEY=key;console.log('Starting local preview; key remains in process memory only.');await import('./dev-server.mjs');}
}catch(error){console.error(JSON.stringify({ok:false,message:error.message,code:error.cause?.code}));process.exitCode=1;}
