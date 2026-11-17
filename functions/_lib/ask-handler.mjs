import {scoreFaq, STATIC_ANSWER_SCORE, isProtectedAdmissionsQuestion, isClearlyOutOfScope, buildNamedFacultyAnswer, appendDisclaimers, getDisclaimers} from './qa-core.mjs';
import {buildAdmissionsResponse} from './admissions.mjs';
import {retrieve, sourceOf, normalizeHistory, contextualQuestion, SYSTEM} from './wiki.mjs';
import {connectSchool, readSSE} from './school-ai.mjs';
const buckets = new Map();
const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const json = (body,status=200) => new Response(JSON.stringify(body),{status,headers});
async function asset(env,request,file) {
  const result = await env.ASSETS.fetch(new URL(file,request.url).href);
  if (!result.ok) throw new Error('knowledge-unavailable');
  return result.json();
}
async function limitedBody(request) {
  if (Number(request.headers.get('content-length')) > 16000) throw new Error('too-large');
  const reader = request.body?.getReader();
  if (!reader) throw new Error('invalid');
  const decoder = new TextDecoder(); let text = '', bytes = 0;
  try { while (true) { const {done,value}=await reader.read(); if(done) break; bytes+=value.byteLength; if(bytes>16000) {await reader.cancel();throw new Error('too-large');} text+=decoder.decode(value,{stream:true}); } }
  finally {reader.releaseLock();}
  return JSON.parse(text+decoder.decode());
}
async function allowRequest(request,env) {
  const ip=request.headers.get('CF-Connecting-IP');
  if (!ip) return true;
  if (env.QA_RATE_LIMITER) return (await env.QA_RATE_LIMITER.limit({key:ip})).success;
  // Best effort per isolate; use a distributed limiter binding in production.
  const now=Date.now();
  for (const [key,value] of buckets) if (value.until < now) buckets.delete(key);
  const b=buckets.get(ip) || {count:0,until:now+60000}; b.count++; buckets.set(ip,b);
  if (buckets.size > 5000) buckets.delete(buckets.keys().next().value);
  return b.count<=15;
}
export async function onRequest({request,env}) {
  if(request.method!=='POST') return json({ok:false,error:'POST로 질문을 보내주세요.'},405);
  const origin=request.headers.get('Origin');
  if(origin && origin!==new URL(request.url).origin) return json({ok:false,error:'이 사이트에서 질문해 주세요.'},403);
  let body;
  try {body=await limitedBody(request);} catch(error) {return json({ok:false,error:'질문 형식이나 길이를 확인해 주세요.'},error.message==='too-large'?413:400);}
  if(!body || typeof body.question!=='string' || !body.question.trim() || body.question.length>1200) return json({ok:false,error:'질문을 1~1,200자로 입력해 주세요.'},400);
  if(!await allowRequest(request,env)) return json({ok:false,error:'질문이 많습니다. 잠시 후 다시 시도해 주세요.'},429);
  const question=body.question.trim(), history=normalizeHistory(body.history);
  const query=contextualQuestion(question,history);
  try {
    const [index,faq,faculty,admissions]=await Promise.all(['wiki-index','faq','faculty','admissions'].map(name=>asset(env,request,`/data/${name}.json`)));
    const docs=retrieve(query,index);
    const match=scoreFaq(query,faq)[0];
    const base={ok:true,question,related_questions:docs.slice(0,3).map(d=>d.title),revision:index.revision};
    const answer=(text,type='wiki-answer',sources=docs.map(sourceOf))=>({...base,type,answer:text,sources});
    if(/문의|연락처|전화|이메일|사무실|교학행정/.test(question)) {const contact=index.chunks.find(c=>c.id==='contact');return json(answer(contact.text,'answer',[sourceOf(contact)]));}
    if(isProtectedAdmissionsQuestion(query)) {
      const requestedYear=query.match(/20\d{2}(?=\s*(?:학년도|년))/)?.[0];
      if(requestedYear && !admissions.admission_year.startsWith(requestedYear)) return json(answer(`${requestedYear}학년도 모집인원과 전형은 현재 저장된 자료로 확인할 수 없습니다. 보유 자료는 ${admissions.admission_year} 기준입니다. 해당 학년도 최종 모집요강을 확인해 주세요.`,'admissions-guidance',[sourceOf(index.chunks.find(c=>c.id==='admissions'))]));
      const result=buildAdmissionsResponse(query,admissions);
      return json({...base,...result,question,sources:[sourceOf(index.chunks.find(c=>c.id==='admissions'))],answer:result.answer+`\n\n자료 기준일: ${admissions.last_updated}. 원서 접수 전 최종 모집요강을 확인해 주세요.`});
    }
    if(isClearlyOutOfScope(question)) return json(answer('학과 소개, 교육철학, 교육과정, 진로와 입학 준비에 관한 질문을 안내합니다. 궁금한 학과 내용을 알려주세요.','fallback',[]));
    const person=buildNamedFacultyAnswer(query,faculty);
    if(person) return json(answer(person.answer,'answer',index.chunks.filter(c=>c.id===`person-${person.person.id}`).map(sourceOf)));
    const license=/건축사|면허|자격증|기사\s*시험/.test(query);
    const exact=faq.find(f=>[f.question,...(f.aliases||[])].some(q=>q.trim()===question));
    const fixed=license ? faq.find(f=>f.id==='diff-006') : exact;
    if(fixed) return json(answer(appendDisclaimers(fixed.answer,getDisclaimers(query,fixed.category)),'answer',index.chunks.filter(c=>c.id===`faq-${fixed.id}`).map(sourceOf)));
    const fallback=()=> {
      if(match && match.score>=STATIC_ANSWER_SCORE) return answer(appendDisclaimers(match.item.answer,getDisclaimers(query,match.item.category)),'wiki-answer',index.chunks.filter(c=>c.id===`faq-${match.item.id}`).map(sourceOf));
      if(docs.length) return answer(`${docs[0].text}\n\n위 내용은 자료 원문 발췌입니다.`,'wiki-answer',[sourceOf(docs[0])]);
      return answer('확인할 수 있는 근거를 찾지 못했습니다. 교육과정, 교육철학, 진로 또는 입학 중 궁금한 내용을 조금 더 구체적으로 알려주세요.','clarification',[]);
    };
    if(!docs.length || !env.SCHOOL_AI_API_KEY) return json({...fallback(),mode:'reference'});
    const messages=[{role:'system',content:SYSTEM},{role:'system',content:docs.map((d,i)=>`[${i+1}] ${d.title}\n자료 기준: ${d.date} / 상태: ${d.status}\n${d.text}`).join('\n\n')},...history,{role:'user',content:question}];
    const controller=new AbortController();
    const abort=()=>controller.abort(); request.signal.addEventListener('abort',abort,{once:true});
    const timeout=setTimeout(abort,45000);
    const cleanup=()=>{clearTimeout(timeout);request.signal.removeEventListener('abort',abort);};
    let upstream;
    try {upstream=await connectSchool(env,messages,body.stream===true,controller.signal);}
    catch {cleanup();return json({...fallback(),mode:'reference',notice:'AI 연결이 지연되어 확인 가능한 자료를 안내합니다.'});}
    if(body.stream!==true) {
      try {const data=await upstream.json(); const text=data.choices?.[0]?.message?.content;
        if(typeof text!=='string'||!text.trim()) throw new Error('empty');
        return json(answer(appendDisclaimers(text,getDisclaimers(query,'')),'ai-answer'));
      } catch {return json({...fallback(),mode:'reference'});} finally {cleanup();}
    }
    const encoder=new TextEncoder();
    const stream=new ReadableStream({
      async start(output) {
        const emit=(event,data)=>output.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        try {
          emit('meta',{sources:docs.map(sourceOf)});
          let full='';
          for await (const delta of readSSE(upstream.body)) {full+=delta;if(full.length>12000) throw new Error('too-long');emit('delta',{text:delta});}
          if(!full.trim()) throw new Error('empty');
          emit('done',answer(appendDisclaimers(full,getDisclaimers(query,'')),'ai-answer'));
        } catch {try{emit('done',{...fallback(),mode:'reference',notice:'AI 응답을 완료하지 못해 자료 원문으로 전환했습니다.'});}catch{}}
        finally {cleanup();try{output.close();}catch{}}
      }, cancel(){controller.abort();cleanup();}
    });
    return new Response(stream,{headers:{...headers,'Content-Type':'text/event-stream; charset=utf-8'}});
  } catch {return json({ok:false,error:'자료를 불러오지 못했습니다. 잠시 후 다시 시도하거나 학과 지식 위키를 확인해 주세요.'},503);}
}
