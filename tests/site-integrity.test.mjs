import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..'),pub=path.join(root,'public');
const read=p=>fs.readFileSync(path.join(pub,p),'utf8');
const pages=['index.html','wiki/index.html',...JSON.parse(read('data/seo_pages.json')).map(p=>p.slug+'/index.html')];
test('generated page assets and internal links resolve',()=>{
 for(const page of pages){
  const html=read(page);
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)){
   const target=path.join(pub,decodeURIComponent(match[1]));
   assert.ok(fs.existsSync(target)||fs.existsSync(path.join(target,'index.html')),`${page}: ${match[1]}`);
  }
  assert.doesNotMatch(html,/onclick=/,page);
 }
});
test('professor portraits, sticky header and current contact are present',()=>{
 const html=read('index.html');
 assert.equal((html.match(/class="portrait"/g)||[]).length,7);
 assert.match(html,/031-8005-3142/);assert.doesNotMatch(html,/개설 예정|person-monogram/);
 assert.match(read('assets/design-v2.css'),/position:sticky;top:0;z-index:50/);
});
test('learning GIF contains timed looping motion and a poster',async()=>{
 const meta=await sharp(path.join(pub,'assets/learning-ai-partner.gif'),{animated:true}).metadata();
 assert.ok(meta.pages>=60);assert.equal(meta.loop,0);assert.ok(meta.delay.every(d=>d>0));
 assert.ok(Math.abs(meta.delay.reduce((a,b)=>a+b,0)-24000)<=20);
 assert.ok(fs.existsSync(path.join(pub,'assets/learning-ai-partner-poster.png')));
 assert.ok(fs.existsSync(path.join(pub,'assets/learning-ai-partner.mp4')));
 assert.match(read('index.html'), /<video id="learningAnimation"[^>]*muted loop playsinline/);
});
test('project implementation contains no plaintext API credentials',()=>{
 function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
 for(const dir of ['public','functions','tools','docs'])for(const file of files(path.join(root,dir))){
  if(!/\.(?:js|mjs|json|html|md|css|txt)$/.test(file))continue;
  assert.ok(!/sk-[A-Za-z0-9_-]{16,}/.test(fs.readFileSync(file,'utf8')),`Credential-like value in ${path.relative(root,file)}`);
 }
});
