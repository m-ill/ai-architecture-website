import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),pub=path.join(root,'public');
const pages=JSON.parse(fs.readFileSync(path.join(pub,'data/seo_pages.json'),'utf8'));
const home=fs.readFileSync(path.join(pub,'index.html'),'utf8');
const header=home.match(/<header class="site-header">[\s\S]*?<\/header>/)[0].replaceAll('href="#','href="/#');
const footer=home.match(/<footer>[\s\S]*?<\/footer>/)[0];
const sourceDir=path.join(root,'docs/guide-sources');fs.mkdirSync(sourceDir,{recursive:true});
const e=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
for(const page of pages){
 const file=path.join(pub,page.slug,'index.html');if(!fs.existsSync(file))continue;
 const sourceFile=path.join(sourceDir,page.slug+'.html');
 if(!fs.existsSync(sourceFile)){
  const original=fs.readFileSync(file,'utf8');const content=original.match(/<article[^>]*>([\s\S]*?)<\/article>/)?.[1];
  if(!content)throw new Error(`Missing source article: ${page.slug}`);
  fs.writeFileSync(sourceFile,content);
 }
 let content=fs.readFileSync(sourceFile,'utf8');
 content=content.replace(/ style="[^"]*"/g,'').replace(/<i\b[^>]*>[\s\S]*?<\/i>/g,'');
 content=content.replace(/<div class="faq-acc-item">\s*<button[\s\S]*?<span>([\s\S]*?)<\/span>[\s\S]*?<\/button>\s*<div class="faq-acc-panel">\s*<div>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/g,'<details class="guide-faq"><summary>$1</summary><p>$2</p></details>');
 content=content.replace(/[🙋‍♂️🔗💡]/gu,'');
 fs.writeFileSync(file,`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(page.meta_title)}</title><meta name="description" content="${e(page.meta_description)}"><link rel="canonical" href="https://ai-architecture-website.pages.dev/${page.slug}/"><link rel="stylesheet" href="/assets/site.css"><link rel="stylesheet" href="/assets/design-v2.css"><script src="/assets/navigation.js" defer></script></head><body><a class="skip" href="#main">본문 바로가기</a>${header}<main id="main" class="guide-page"><a class="text-link" href="/#resources">학과 자료실</a><article>${content}</article><aside class="guide-contact"><h2>학과에 궁금한 점이 있다면</h2><a class="button primary" href="/#chat">학과 Q&A</a><p>AI융합대학 교학행정팀 · <a href="tel:03180053142">031-8005-3142</a> · <a href="mailto:jhj1218@dankook.ac.kr">jhj1218@dankook.ac.kr</a></p></aside></main>${footer}</body></html>`);
}
console.log(`${pages.length} existing guide pages refreshed`);
const wikiPath=path.join(pub,'wiki/index.html');
let wiki=fs.readFileSync(wikiPath,'utf8').replace(/<header class="site-header">[\s\S]*?<\/header>/,header).replace(/<footer>[\s\S]*?<\/footer>/,footer).replace('DEPARTMENT KNOWLEDGE','학과 자료');
const arrow=fs.readFileSync(path.join(root,'node_modules/lucide-static/icons/arrow-up-right.svg'),'utf8').replace('<svg','<svg aria-hidden="true" focusable="false"');
wiki=wiki.replaceAll('↗',arrow).replace('</body>','<script src="/assets/navigation.js" defer></script></body>');
fs.writeFileSync(wikiPath,wiki);
for(const relative of ['index.html','wiki/index.html','content/faq.md','content/llm-wiki.md',...pages.map(p=>p.slug+'/index.html')]){
 const file=path.join(pub,relative);fs.writeFileSync(file,fs.readFileSync(file,'utf8').replace(/[ \t]+$/gm,'').trimEnd()+'\n');
}
