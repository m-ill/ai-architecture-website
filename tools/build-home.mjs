import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'), pub=path.join(root,'public');
const read=p=>JSON.parse(fs.readFileSync(path.join(pub,'data',p+'.json'),'utf8'));
const e=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plan=read('curriculum-plan'), details=read('curriculum-course-details'), faculty=read('faculty'), projects=read('people-projects'), admissions=read('admissions'), faq=read('faq');
const areas=read('advanced_areas');
const dept=read('department');
const careers=read('careers');
const icon=name=>fs.readFileSync(path.join(root,'node_modules/lucide-static/icons',name+'.svg'),'utf8').replace('<svg','<svg aria-hidden="true" focusable="false"');
fs.mkdirSync(path.join(pub,'assets/icons'),{recursive:true});
for(const name of ['arrow-up-right','arrow-up','chevron-down','chevron-right','search','pause','play','menu','x','mail','phone']) fs.copyFileSync(path.join(root,'node_modules/lucide-static/icons',name+'.svg'),path.join(pub,'assets/icons',name+'.svg'));
fs.copyFileSync(path.join(root,'node_modules/lucide-static/LICENSE'),path.join(pub,'assets/icons/LICENSE.txt'));
const replacements={
 PAUSE_ICON:icon('pause'),
 CONTACT:`<div class="office-contact"><div><h3>${e(dept.contact.office)}</h3></div><div><a href="tel:${dept.contact.phone.replaceAll('-','')}">${icon('phone')}${e(dept.contact.phone)}</a><a href="mailto:${e(dept.contact.email)}">${icon('mail')}${e(dept.contact.email)}</a></div><details><summary>업무별 연락처</summary>${dept.contact.additional.map(c=>`<p>${e(c.role)}<br><a href="tel:${c.phone.replaceAll('-','')}">${e(c.phone)}</a> · <a href="mailto:${e(c.email)}">${e(c.email)}</a></p>`).join('')}</details></div>`,
 AREAS:areas.areas.map(a=>`<a class="text-link" href="/wiki/?q=${encodeURIComponent(a.name)}">${e(a.name)} · 학습 내용 ↗</a>`).join(''),
 YEAR_TABS:plan.years.map((y,i)=>`<button id="tab-${y.year}" role="tab" aria-controls="year-${y.year}" aria-selected="${i===0}" tabindex="${i===0?'0':'-1'}">${e(y.label)}<span>${e(y.name)}</span></button>`).join(''),
 YEAR_PANELS:plan.years.map((y,i)=>`<section class="year-panel" id="year-${y.year}" role="tabpanel" aria-labelledby="tab-${y.year}" ${i?'hidden':''}><div><h3>${e(y.title)}</h3></div><div class="semesters">${y.semesters.map(s=>`<div><h4>${e(s.code)} · ${e(s.title)}</h4>${s.courses.map(c=>{const d=details.courses.find(x=>x.id===c.id);return `<details class="course"><summary>${e(c.name)}<small>${e(c.credit)} · ${e(c.type)}</small></summary><p>${e(d?.card)}</p><p><strong>학습 목표</strong><br>${(d?.objectives||[]).map(e).join('<br>')}</p><p><strong>결과물 예시</strong><br>${(d?.outputs||[]).map(e).join('<br>')}</p><a href="/wiki/#course-${c.id}">과목 근거 자료 ↗</a></details>`;}).join('')}</div>`).join('')}</div></section>`).join(''),
 CAREERS:`<figure class="education-infographic career-infographic"><img class="infographic-wide" src="/assets/careers-infographic.png" alt="졸업 후 진로 예시: 건축 AI 현장도입 엔지니어는 도면·시방서 Q&A와 업무 자동화 앱, BIM 자동화 개발자는 플러그인과 검토 스크립트, 디지털트윈 구축 엔지니어는 운영 대시보드와 센서 연계 모델, 건물 성능 분석 엔지니어는 대안 비교 리포트와 분석 코드를 만듭니다." width="1672" height="941" loading="lazy"><div class="infographic-mobile">${careers.roles.map((c,i)=>`<div class="infographic-slice" style="--column:${i%2};--row:${Math.floor(i/2)}"><img src="/assets/careers-infographic.png" alt="${e(c.title)}: ${e(c.work)} 결과물 예시: ${e(c.output)}" width="1672" height="941" loading="lazy"></div>`).join('')}</div></figure>`,
 PEOPLE:[...faculty.faculty,...faculty.industry_experts].map(p=>`<article class="person"><div class="person-head"><span class="person-monogram" aria-hidden="true">${e(p.name.slice(0,1))}</span><div><h3>${e(p.name)} <small>${e(p.title)}</small></h3><p>${e(p.company||'단국대학교')}</p></div></div><p>${e(p.domain)}</p><details><summary>연구·프로젝트와 소개 자료</summary><p>${e(p.philosophy)}</p>${(projects.people.find(x=>x.id===p.id)?.projects||[]).map(pr=>`<div class="project"><strong>${e(pr.name)}</strong><p>${e(pr.role)}</p><a href="${e(pr.sourceUrl)}" target="_blank" rel="noopener noreferrer">자료 출처 · ${e(pr.credit)} ↗</a></div>`).join('')}<a class="text-link" href="${e(p.brochure_image)}">기존 교수 소개 브로셔 보기 ↗</a></details></article>`).join(''),
 QUOTA:e(admissions.total_quota_regular), ADMISSIONS_SOURCE:e(admissions.source), ADMISSIONS_DATE:e(admissions.last_updated), ADMISSIONS_NOTICE:e(admissions.important_notice),
 ADMISSIONS_ROWS:admissions.admission_breakdown_regular.map(r=>`<tr><td>${e(r.period)}</td><td>${e(r.name)}</td><td>${e(r.count)}명</td></tr>`).join(''),
 FAQ:['identity-001','fit-004','diff-006','ops-002a'].map(id=>faq.find(f=>f.id===id)).filter(Boolean).map(f=>`<details><summary>${e(f.question)}</summary><p>${e(f.answer)}</p><a href="/wiki/#faq-${f.id}">답변 근거 보기 ↗</a></details>`).join('')
};
let template=fs.readFileSync(path.join(root,'tools/home-template.html'),'utf8');
for(const [key,value] of Object.entries(replacements)) template=template.replaceAll(`{{${key}}}`,value);
template=template.replaceAll('↗',icon('arrow-up-right')).replaceAll('→',icon('chevron-right'));
template=template.replace('<button class="menu-toggle" aria-controls="mainNav" aria-expanded="false">메뉴</button>',`<button class="menu-toggle" aria-label="메뉴" aria-controls="mainNav" aria-expanded="false">${icon('menu')}</button>`);
template=template.replace(/(<button class="send-button"[^>]*>)[\s\S]*?(<\/button>)/,`$1${icon('arrow-up')}$2`);
template=template.replace(/<span class="person-monogram" aria-hidden="true">[^<]*<\/span>/g,'');
for(const p of [...faculty.faculty,...faculty.industry_experts]) {
 const marker=`<article class="person"><div class="person-head"><div><h3>${e(p.name)}`;
 template=template.replace(marker,`<article class="person"><a class="portrait" href="${e(p.brochure_image)}" aria-label="${e(p.name)} 소개 브로셔 보기"><img src="${e(p.brochure_image)}" alt="${e(p.name)} ${e(p.title)} 사진" loading="lazy" decoding="async"></a><div class="person-head"><div><h3>${e(p.name)}`);
}
if(/\{\{[A-Z_]+\}\}/.test(template)) throw new Error('Unresolved template');
fs.writeFileSync(path.join(pub,'index.html'),template);
console.log('Home generated from source data');
