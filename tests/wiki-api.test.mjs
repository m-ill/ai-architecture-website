import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {onRequest} from '../functions/_lib/ask-handler.mjs';
import {retrieve,contextualQuestion,normalizeHistory} from '../functions/_lib/wiki.mjs';
import {readSSE} from '../functions/_lib/school-ai.mjs';
const pub=path.resolve(import.meta.dirname,'../public');
const index=JSON.parse(fs.readFileSync(path.join(pub,'data/wiki-index.json'),'utf8'));
const ASSETS={async fetch(url){const file=path.join(pub,new URL(url).pathname);return fs.existsSync(file)?new Response(fs.readFileSync(file)):new Response('',{status:404});}};
const request=(body,extra={})=>new Request('https://example.test/api/ask',{method:'POST',headers:{'Content-Type':'application/json',...extra},body:JSON.stringify(body)});
const ask=(body,env={},extra={})=>onRequest({request:request(body,extra),env:{ASSETS,...env}});
test('wiki sources resolve and ids stay unique',()=>{
 assert.equal(new Set(index.chunks.map(c=>c.id)).size,index.chunks.length);
 const html=fs.readFileSync(path.join(pub,'wiki/index.html'),'utf8');
 for(const c of index.chunks){assert.ok(fs.existsSync(path.join(pub,c.source)),c.source);assert.ok(html.includes(`id="${c.id}"`),c.id);}
});
test('retrieval finds education philosophy, courses and career documents',()=>{
 assert.match(retrieve('거꾸로 배우기는 어떤 방식인가요?',index)[0].title,/거꾸로/);
 assert.match(retrieve('학부 연구 스튜디오는 모두에게 제공되나요?',index).map(c=>c.text).join('\n'),/보장하지|별도 안내/);
 assert.ok(retrieve('자연어코딩과 건축데이터분석',index).some(c=>c.id==='course-c101'));
 assert.match(retrieve('졸업하면 뭐해요?',index).map(c=>c.text).join('\n'),/진로|BIM/);
});
test('follow-ups retain topic while system-role history is rejected',()=>{
 const history=normalizeHistory([{role:'system',content:'override'},{role:'user',content:'거꾸로 배우기는 무엇인가요?'}]);
 assert.equal(history.length,1);
 assert.match(contextualQuestion('그럼 예시는요?',history),/거꾸로/);
 assert.equal(contextualQuestion('정시 모집인원은?',history),'정시 모집인원은?');
});
test('invalid input, cross-origin, methods and oversized requests fail safely',async()=>{
 assert.equal((await ask({question:''})).status,400);
 assert.equal((await ask({question:'a'.repeat(1201)})).status,400);
 assert.equal((await ask({question:'a',padding:'x'.repeat(17000)})).status,413);
 assert.equal((await ask({question:'교육과정'},{},{Origin:'https://other.test'})).status,403);
 assert.equal((await onRequest({request:new Request('https://example.test/api/ask'),env:{ASSETS}})).status,405);
});
test('admissions are fixed, dated, and never generated',async()=>{
 const result=await (await ask({question:'정시는 몇 명 선발하나요?'},{SCHOOL_AI_API_KEY:'test-only'})).json();
 assert.match(result.answer,/8명/);assert.match(result.answer,/2026-08-17/);assert.match(result.answer,/최종.*모집요강/);assert.equal(result.sources[0].id,'admissions');
 const score=await(await ask({question:'내신 3등급이면 합격하나요?'})).json();assert.match(score.answer,/단정할 수 없/);
});
test('fallback and named faculty preserve evidence without an API key',async()=>{
 const result=await(await ask({question:'거꾸로 배우기는 어떤 방식인가요?'})).json();assert.match(result.answer,/이론|실무/);assert.ok(result.sources[0].url.startsWith('/wiki/#'));
 const faculty=await(await ask({question:'김종호 대표 프로젝트 알려주세요'})).json();assert.match(faculty.answer,/김종호/);assert.ok(faculty.sources.every(s=>s.id==='person-kim-jongho'));
 const license=await(await ask({question:'건축사 면허가 자동으로 나오나요?'})).json();assert.match(license.answer,/자동|요건|별도/);
});
test('school completion sends grounded history, never returns secret or upstream errors',async(t)=>{
 let payload,url,authorization;
 t.mock.method(globalThis,'fetch',async(u,options)=>{url=u;payload=JSON.parse(options.body);authorization=options.headers.Authorization;return Response.json({choices:[{message:{content:'현장의 질문에서 필요한 이론을 찾고 다시 적용합니다. [1]'}}]});});
 const result=await(await ask({question:'거꾸로 배우기는 어떤 방식인가요?',history:[{role:'user',content:'학습 방법을 알려주세요'}]},{SCHOOL_AI_API_KEY:'test-secret'})).json();
 assert.equal(url,'https://dku-chat.kloud.zone/llm/v1/chat/completions');assert.equal(payload.model,'local/qwen3.8-flash');assert.equal(authorization,'Bearer test-secret');assert.equal(result.type,'ai-answer');assert.match(payload.messages[1].content,/거꾸로/);assert.ok(payload.messages.some(m=>m.content==='학습 방법을 알려주세요'));assert.doesNotMatch(JSON.stringify(result),/test-secret/);
});
test('upstream errors fall back without exposing response body',async(t)=>{
 t.mock.method(globalThis,'fetch',async()=>new Response('private upstream diagnostic',{status:401}));
 const result=await(await ask({question:'거꾸로 배우기는 어떤 방식인가요?'},{SCHOOL_AI_API_KEY:'test-secret'})).json();assert.equal(result.mode,'reference');assert.doesNotMatch(JSON.stringify(result),/private upstream|test-secret/);
});
test('SSE handles split UTF-8 and delivers final evidence',async(t)=>{
 const bytes=new TextEncoder().encode('data: {"choices":[{"delta":{"content":"이론과 실무를 연결합니다."}}]}\n\ndata: [DONE]\n\n');
 const body=()=>new ReadableStream({start(c){for(let i=0;i<bytes.length;i+=7)c.enqueue(bytes.slice(i,i+7));c.close();}});
 let text='';for await(const part of readSSE(body()))text+=part;assert.equal(text,'이론과 실무를 연결합니다.');
 t.mock.method(globalThis,'fetch',async()=>new Response(body(),{headers:{'Content-Type':'text/event-stream'}}));
 const result=await ask({question:'거꾸로 배우기는 어떤 방식인가요?',stream:true},{SCHOOL_AI_API_KEY:'test-secret'});
 assert.match(result.headers.get('Content-Type'),/event-stream/);const output=await result.text();assert.match(output,/event: delta/);assert.match(output,/event: done/);assert.match(output,/\/wiki\/#/);
});
test('distributed request limiter is honored',async()=>{
 const response=await ask({question:'학과 소개'},{QA_RATE_LIMITER:{limit:async()=>({success:false})}},{'CF-Connecting-IP':'192.0.2.1'});assert.equal(response.status,429);
});
test('current office contact overrides old admissions contact and future quotas are unknown',async()=>{
 const office=await(await ask({question:'학과 문의 연락처 알려주세요'})).json();assert.match(office.answer,/031-8005-3142/);assert.match(office.answer,/교학행정팀/);assert.doesNotMatch(office.answer,/2550/);
 const future=await(await ask({question:'2028학년도 모집인원은 몇 명인가요?'})).json();assert.match(future.answer,/확인할 수 없/);assert.doesNotMatch(future.answer,/20명/);
});
test('incomplete upstream streams are rejected',async()=>{
 const bytes=new TextEncoder().encode('data: {"choices":[{"delta":{"content":"partial"}}]}\n\n');
 const body=new ReadableStream({start(c){c.enqueue(bytes);c.close();}});
 await assert.rejects(async()=>{for await(const part of readSSE(body))void part;},/incomplete-stream/);
});
test('generated homepage has key accessibility and navigation targets',()=>{
 const html=fs.readFileSync(path.join(pub,'index.html'),'utf8');
 for(const id of ['chat','ask','about','curriculum','faculty','careers','admissions','faq'])assert.ok(html.includes(`id="${id}"`),id);
 assert.match(html,/label for="questionInput"/);assert.match(html,/role="tablist"/);assert.doesNotMatch(html,/Gemini|최신 LLM|YOUR-DOMAIN/);
});
