const $=s=>document.querySelector(s);
const menu=$('.menu-toggle');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));$('#mainNav').classList.toggle('is-open',open);});
$('#mainNav').addEventListener('click',e=>{if(e.target.closest('a')){menu.setAttribute('aria-expanded','false');$('#mainNav').classList.remove('is-open');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape' && menu.getAttribute('aria-expanded')==='true'){menu.click();menu.focus();}});
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectTab(tab){for(const t of tabs){const active=t===tab;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;document.getElementById(t.getAttribute('aria-controls')).hidden=!active;}}
tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>selectTab(tab));tab.addEventListener('keydown',e=>{const next=e.key==='ArrowRight'?(i+1)%tabs.length:e.key==='ArrowLeft'?(i+tabs.length-1)%tabs.length:e.key==='Home'?0:e.key==='End'?tabs.length-1:null;if(next!==null){e.preventDefault();selectTab(tabs[next]);tabs[next].focus();}});});
let history=[],controller=null;
const conversation=$('#conversation'),status=$('#chatStatus'),input=$('#questionInput');
function element(tag,text,className){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;if(className)el.className=className;return el;}
function message(role,text){const box=element('article',undefined,`message ${role}`);box.append(element('div',role==='user'?'나의 질문':'학과 안내','message-label'));const body=element('div',text,'answer-text');box.append(body);conversation.append(box);return {box,body};}
function busy(value){$('#submitAskBtn').disabled=value;document.querySelectorAll('[data-question]').forEach(b=>b.disabled=value);$('#stopAsk').hidden=!value;$('#resetChat').disabled=value;$('#askForm').setAttribute('aria-busy',String(value));}
function renderAnswer(target,data){
  target.body.textContent=data.answer || '확인 가능한 답변이 없습니다.';
  target.box.querySelector('.message-label').textContent=data.type==='ai-answer'?'학과 자료 기반 AI 답변':data.type==='clarification'?'추가 확인':'학과 자료 안내';
  if(data.notice)target.box.append(element('p',data.notice,'note'));
  if(data.sources?.length){const list=element('div',undefined,'sources');list.append(element('strong','참고 문서 · 기준일 확인'));data.sources.forEach((source,i)=>{if(!source || typeof source.url!=='string'||!source.url.startsWith('/wiki/#'))return;const item=element('div');const a=element('a',`[${i+1}] ${source.title}`);a.href=source.url;a.target='_blank';a.rel='noopener noreferrer';item.append(a,element('small',`${source.date} · ${source.status}`));list.append(item);});target.box.append(list);}
  if(data.related_questions?.length){const group=element('div',undefined,'related');for(const q of data.related_questions.slice(0,3)){const b=element('button',q);b.type='button';b.addEventListener('click',()=>{if(!controller){input.value=q;$('#askForm').requestSubmit();}});group.append(b);}target.box.append(group);}
}
async function readAnswer(response,target){
  if(!response.headers.get('content-type')?.includes('text/event-stream')) return response.json();
  const reader=response.body.getReader(),decoder=new TextDecoder();let buffer='',text='',result;
  try{while(true){const {value,done}=await reader.read();buffer+=done?decoder.decode():decoder.decode(value,{stream:true});let pos;while((pos=buffer.indexOf('\n\n'))!==-1){const block=buffer.slice(0,pos);buffer=buffer.slice(pos+2);const kind=block.match(/^event: (.+)$/m)?.[1];const line=block.match(/^data: (.+)$/m)?.[1];if(!line)continue;const data=JSON.parse(line);if(kind==='delta'){text+=data.text;target.body.textContent=text;}if(kind==='done')result=data;}if(done)break;}}finally{reader.releaseLock();}
  if(!result)throw new Error('응답을 끝까지 받지 못했습니다. 다시 질문해 주세요.');return result;
}
$('#askForm').addEventListener('submit',async e=>{
  e.preventDefault();const question=input.value.trim();if(!question||controller)return;
  controller=new AbortController();const current=controller;let timedOut=false;const timer=setTimeout(()=>{timedOut=true;current.abort();},55000);
  message('user',question);const target=message('assistant','관련 학과 자료를 확인하고 있습니다…');input.value='';busy(true);status.textContent='답변 중…';
  try{const response=await fetch('/api/ask',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question,history:history.slice(-6),stream:true}),signal:controller.signal});
    if(!response.ok){const error=await response.json().catch(()=>({}));throw new Error(error.error||'연결을 확인하고 다시 시도해 주세요.');}
    const data=await readAnswer(response,target);renderAnswer(target,data);history.push({role:'user',content:question},{role:'assistant',content:data.answer});history=history.slice(-6);status.textContent='답변 완료';
  }catch(error){target.body.textContent=error.name==='AbortError'?(timedOut?'응답 시간이 길어 중단했습니다. 잠시 후 다시 시도해 주세요.':'응답을 중지했습니다.'):error.message;const link=element('a','학과 지식 위키에서 직접 찾아보기 ↗','text-link');link.href='/wiki/';target.box.append(link);input.value=question;status.textContent='답변을 완료하지 못했습니다. 질문을 다시 보낼 수 있습니다.';}
  finally{clearTimeout(timer);controller=null;busy(false);input.focus();}
});
$('#stopAsk').addEventListener('click',()=>controller?.abort());
$('#resetChat').addEventListener('click',()=>{history=[];conversation.replaceChildren();status.textContent='새 대화를 시작합니다.';input.focus();});
input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();$('#askForm').requestSubmit();}});
document.querySelectorAll('[data-question]').forEach(b=>b.addEventListener('click',()=>{input.value=b.dataset.question;$('#askForm').requestSubmit();}));
const initial=new URLSearchParams(location.search).get('q');if(initial){input.value=initial.slice(0,1200);status.textContent='질문을 확인한 뒤 전송해 주세요.';}
const animation=$('#learningAnimation'),toggle=$('#toggleAnimation');
if(animation&&toggle){
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let paused=true;
 function update(){toggle.setAttribute('aria-pressed',String(paused));toggle.setAttribute('aria-label',paused?'학습 애니메이션 재생':'학습 애니메이션 일시정지');toggle.replaceChildren();const img=document.createElement('img');img.src=paused?'/assets/icons/play.svg':'/assets/icons/pause.svg';img.alt='';img.width=18;img.height=18;toggle.append(img);}
 async function play(){try{await animation.play();paused=false;}catch{paused=true;}update();}
 toggle.addEventListener('click',()=>{if(animation.paused)play();else{animation.pause();paused=true;update();}});
 reduced.addEventListener('change',event=>{if(event.matches){animation.pause();paused=true;update();}});
 update();if(!reduced.matches)play();
}
