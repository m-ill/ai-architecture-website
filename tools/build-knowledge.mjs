import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'public');
const read = p => fs.readFileSync(path.join(pub, p), 'utf8');
const json = p => JSON.parse(read(p));
const escape = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const chunks = [];
function add(id, title, text, source, date, status, keywords = []) {
  if (chunks.some(c=>c.id===id)) id += '-' + crypto.createHash('sha1').update(text).digest('hex').slice(0,8);
  chunks.push({id, title, text, source, date: date || '기준일 미기재', status, keywords, url: `/wiki/#${id}`});
}
function markdown(file, prefix, date, status) {
  const sections = read(file).split(/(?=^#{1,3} )/m);
  for (const section of sections) {
    const title = section.match(/^#{1,3} (.+)/)?.[1];
    const text = section.replace(/^#{1,3} .+\r?\n/, '').trim();
    if (title && text) add(`${prefix}-${crypto.createHash('sha1').update(title).digest('hex').slice(0, 10)}`, title, text, `/${file}`, date, status);
  }
}
const dept = json('data/department.json');
const admissions = json('data/admissions.json');
add('identity', '어떤 학과인가요?', `${dept.tagline}\n${dept.one_sentence}\n${dept.college} · ${dept.campus} · ${dept.status_label}`, '/data/department.json', dept.status_updated, '학과 기본정보', ['학과소개', '뭐 하는', '정체성']);
add('contact', '학과 문의 · AI융합대학 교학행정팀', `${dept.contact.office}\n행정 실무: ${dept.contact.phone} / ${dept.contact.email}\n${dept.contact.additional.map(c=>`${c.role}: ${c.phone} / ${c.email}`).join('\n')}\n학과 문의의 기본 연락처입니다. 입학처 링크는 최종 모집요강 확인 경로로 구분합니다.`, '/data/department.json',dept.contact.updated,'학과 담당자 제공',['학과사무실','문의','연락처','전화','이메일','행정']);
markdown('content/education-philosophy.md', 'philosophy', '2026-11-17', '교육·연구 지향점');
markdown('content/conversation-guide.md', 'conversation', null, '기존 상담 안내 · 원본 기준 확인');
// Canonical is long-form authority; section-level links remain stable when reordered.
markdown('content/canonical.md', 'canonical', null, '기존 통합 원문 · 항목별 기준 확인');
const careers=json('data/careers.json');
for(const c of careers.roles) add(`career-${c.id}`,c.title,`${c.label}\n하는 일: ${c.work}\n결과물 예시: ${c.output}\n준비 역량: ${c.skills}\n${careers.notice}${c.id==='fde'?'\n팔란티어의 공식 FDSE 직무는 고객의 문제를 파악하고 데이터와 소프트웨어로 해법을 구현하는 역할을 설명합니다. 이 학과의 건축 적용 예시는 그 방식을 참고한 진로 제안입니다.\n참고: '+careers.source.url:''}`,'/data/careers.json',careers.updated,'진로·업무 예시 · 취업 보장 아님',['진로','취업',c.title,...(c.id==='fde'?['FDE','전진배치','팔란티어','현장도입']:[])]);
const faq = json('data/faq.json');
for (const item of faq) add(`faq-${item.id}`, item.question, item.answer, '/data/faq.json', item.last_updated, item.category, [...(item.aliases || []), ...(item.keywords || [])]);
add('admissions', '입학·모집인원·지원 안내', `${admissions.source}\n${admissions.admission_year}\n${admissions.admission_breakdown_regular.map(r => `${r.period} ${r.name}: ${r.count}명 (${r.note})`).join('\n')}\n${admissions.important_notice}\n자료 기준일: ${admissions.last_updated}. 현재 모집요강을 재확인해야 합니다.\n입학안내: ${admissions.official_admissions_url}\n문의: ${admissions.admissions_phone}`, '/data/admissions.json', admissions.last_updated, '기존 입학자료 · 최종 모집요강 확인', ['수시','정시','모집','입학']);
const plan = json('data/curriculum-plan.json');
for (const year of plan.years) add(`year-${year.year}`, `${year.label} ${year.name}`, `${year.title}\n${year.description}\n${year.semesters.map(s => `${s.code}: ${s.courses.map(c=>c.name).join(', ')}`).join('\n')}\n${plan.notice}`, '/data/curriculum-plan.json', plan.source_date, '교육과정 구상안', ['교육과정','수업','배우','학년']);
for (const course of json('data/curriculum-course-details.json').courses) add(`course-${course.id}`, course.name, `${course.card}\n${course.detail.join('\n')}\n학습 목표: ${course.objectives.join(', ')}\n결과물: ${course.outputs.join(', ')}\n${plan.notice}`, '/data/curriculum-course-details.json', plan.source_date, '과목 상세 구상안', [course.field, course.subtitle]);
const faculty = json('data/faculty.json');
for (const p of [...faculty.faculty, ...faculty.industry_experts]) add(`person-${p.id}`, `${p.name} ${p.title}`, `${p.company || '단국대학교'}\n${p.domain}\n${(p.research_areas || []).join('\n')}\n${(p.achievements || []).join('\n')}\n${faculty.disclaimer}`, '/data/faculty.json', faculty.last_updated, '소개 자료 · 참여 조건 별도 확인', [p.name,'교수','전문가']);
const revision = crypto.createHash('sha256').update(JSON.stringify(chunks)).digest('hex').slice(0, 16);
const data = {revision, generated_from: '원본에서 자동 생성 · 직접 편집하지 않음', chunks};
fs.writeFileSync(path.join(pub, 'data/wiki-index.json'), JSON.stringify(data, null, 2)+'\n');
const wiki = `# AI건축융합학과 LLM Wiki\n\n원본에서 자동 생성. 버전: ${revision}. 입학자료는 최종 모집요강을 확인합니다.\n\n` + chunks.map(c=>`## ${c.title}\n\n${c.text}\n\n출처: ${c.source} · 기준: ${c.date} · 상태: ${c.status}\n`).join('\n');
fs.writeFileSync(path.join(pub, 'content/llm-wiki.md'), wiki);
fs.mkdirSync(path.join(pub, 'wiki'), {recursive:true});
fs.writeFileSync(path.join(pub, 'wiki/index.html'), `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>학과 지식 위키 | AI건축융합학과</title><meta name="description" content="학과 소개, 교육철학, 교육과정과 입학자료를 출처와 기준일로 확인하세요."><link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/design-v2.css"><link rel="canonical" href="${json('data/site.json').base_url}/wiki/"></head><body><a class="skip" href="#main">본문 바로가기</a><header class="site-header"><a class="brand" href="/">단국대학교 <strong>AI건축융합학과</strong></a><nav><a href="/#chat">질문하기 ↗</a></nav></header><main id="main" class="wiki-page"><p class="eyebrow">DEPARTMENT KNOWLEDGE</p><h1>학과 지식 위키</h1><p>답변의 근거를 직접 읽어보세요. 기존 자료의 기준일과 운영 구상 여부를 함께 안내합니다.</p><label for="wikiSearch">문서 검색</label><input id="wikiSearch" type="search" placeholder="예: 거꾸로 배우기, 코딩, 수시"><p id="wikiCount" role="status">${chunks.length}개 문서</p><div id="wikiDocuments">${chunks.map(c=>`<article class="wiki-document" id="${c.id}"><p class="eyebrow">${escape(c.status)}</p><h2>${escape(c.title)}</h2><p class="source-meta">자료 기준: ${escape(c.date)} · <a href="${c.source}">원본 보기</a></p><div class="document-text">${escape(c.text)}</div><a class="text-link" href="/#chat" data-question="${escape(c.title)}">이 내용 질문하기 ↗</a></article>`).join('')}</div></main><footer>지식 버전 ${revision} · <a href="/">학과 홈페이지</a></footer><script src="/assets/wiki.js" defer></script></body></html>`);
console.log(`Knowledge built: ${chunks.length} documents, revision ${revision}`);

fs.writeFileSync(path.join(pub,'content/faq.md'), '# 학과 FAQ\n\n'+faq.map(f=>`## ${f.question}\n\n${f.answer}\n`).join('\n'));
