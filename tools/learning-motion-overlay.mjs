import fs from 'node:fs';
const baysFile=new URL('../output/learning-film/learning-bays.json',import.meta.url);
const bays=JSON.parse(fs.readFileSync(baysFile,'utf8'));
const icon=name=>fs.readFileSync(new URL(`../node_modules/lucide-static/icons/${name}.svg`,import.meta.url),'utf8').match(/<svg[\s\S]*?>([\s\S]*?)<\/svg>/)[1];
const icons={up:icon('arrow-up'),down:icon('arrow-down'),book:icon('book-open'),check:icon('check')};
const clamp=v=>Math.max(0,Math.min(1,v)),ease=t=>t*t*(3-2*t);
const glyph=(key,x,y,size=20,color='white')=>`<g transform="translate(${x},${y}) scale(${size/24})" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icons[key]}</g>`;
const support=[{name:'수학',start:64,end:102},{name:'실무 프로젝트',start:64,end:102}];
const repairs=[{name:'데이터 분석',start:96,end:133},{name:'건축설계',start:127,end:164},{name:'설계 실무',start:158,end:195}];
const pill=(x,y,word,color)=>`<rect x="${x-31}" y="${y-16}" width="62" height="32" rx="16" fill="${color}"/><text x="${x}" y="${y+6}" text-anchor="middle" font-size="18" font-weight="700" fill="white">${word}</text>`;
export function learningOverlay(frame){
 let s='';
 // Spatial labels are part of the diagram; no explanatory subtitle.
 s+=pill(75,180,'실무','#344b65')+pill(75,603,'기초','#344b65');
 if(frame<65){
  const p=ease(clamp((frame-8)/48));
  s+=`<path d="M75 210V${210+155*p} M75 570V${570-155*p}" fill="none" stroke="#7290ac" stroke-width="2" opacity=".65"/>`;
  s+=glyph('down',63,200+155*p,24,'#426989')+glyph('up',63,558-155*p,24,'#426989');
 }
 const hub=clamp((frame-56)/8);
 if(hub>0){
  s+=`<g opacity="${hub}"><circle cx="650" cy="370" r="32" fill="#e8f3ff"/><rect x="625" y="345" width="50" height="50" rx="16" fill="#0071e3"/><text x="650" y="378" text-anchor="middle" font-size="24" font-weight="700" fill="white">AI</text></g>`;
 }
 for(const event of [...support,...repairs]){
  const {name,start,end}=event,b=bays[name],isRepair=repairs.includes(event);
  const [tx,ty]=b.center;
  if(isRepair&&frame>=58&&frame<start){s+=`<text x="${tx}" y="${ty+8}" text-anchor="middle" font-size="26" font-weight="600" fill="#8aa0b5">?</text>`;}
  if(frame<start||frame>end+8)continue;
  const p=ease(clamp((frame-start)/12)),pulse=.55+.25*Math.sin(frame*.3)**2;
  const cx=605,cy=ty,px=(1-p)*(1-p)*650+2*(1-p)*p*cx+p*p*tx,py=(1-p)*(1-p)*370+2*(1-p)*p*cy+p*p*ty;
  const poly=b.corners.map(pt=>pt.join(',')).join(' ');
  s+=`<path d="M650 370 Q${cx} ${cy} ${tx} ${ty}" fill="none" stroke="#0071e3" stroke-width="1.5" stroke-dasharray="3 6" opacity=".35"/>`;
  if(p<1)s+=`<g transform="translate(${px-28},${py-16})"><rect width="56" height="32" rx="10" fill="#0071e3"/>${glyph('book',6,6,19)}<text x="41" y="22" text-anchor="middle" font-size="14" font-weight="700" fill="white">AI</text></g>`;
  if(p>=1){s+=`<polygon points="${poly}" fill="#0071e3" fill-opacity=".12" stroke="#009bff" stroke-width="2.5" stroke-opacity="${pulse}"/>`;}
 }
 // Small AI marks remain attached to supported course spaces, not just gaps.
 for(const [name,b] of Object.entries(bays)){
  const repair=repairs.find(e=>e.name===name),explicit=support.find(e=>e.name===name);
  const at=repair?repair.end:explicit?explicit.end:205;
  if(frame<at)continue;
  const [x,y]=b.corners[2];
  s+=`<g transform="translate(${x-32},${y+5})"><rect width="29" height="18" rx="5" fill="#0071e3"/><text x="14.5" y="13" text-anchor="middle" font-size="11" font-weight="700" fill="white">AI</text></g>`;
  if(frame<at+10)s+=glyph('check',b.center[0]+30,b.center[1]-9,18,'#34c28b');
 }
 return Buffer.from(`<svg width="720" height="760"><g font-family="Malgun Gothic, sans-serif">${s}</g></svg>`);
}
