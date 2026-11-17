import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),assets=path.join(root,'public/assets');
const W=720,H=760,COUNT=240,DELAY=100;
// x, y, width, height, label, arrival time; negative times identify AI gaps.
const blocks=[
 [300,66,120,74,'프로젝트',2.3],
 [242,150,142,82,'현장 관찰',2.8],[394,150,104,82,'실무',3.1],
 [200,242,124,70,'건축설계',3.5],[334,242,164,70,'AI와|대안 탐색',-1],
 [158,322,178,88,'BIM·|디지털트윈',3.9],[346,322,118,88,'구조안전',4.1],[474,322,88,88,'건축|환경',4.3],
 [158,420,114,76,'구조역학',1.8],[282,420,166,76,'AI와|개념 학습',-2],[458,420,104,76,'디지털|모델링',2],
 [108,506,150,64,'코딩',1.1],[268,506,194,64,'건축의 이해',1.3],[472,506,140,64,'AI와|도구 실습',-3],
 [108,580,124,66,'수학',.2],[242,580,210,66,'비판적 사고',.45],[462,580,150,66,'소통·협업',.7]
];
const clamp=t=>Math.min(1,Math.max(0,t)),ease=t=>t*t*(3-2*t);
const icons=Object.fromEntries(['arrow-up','arrow-down','arrow-right'].map(name=>[name,fs.readFileSync(path.join(root,'node_modules/lucide-static/icons',name+'.svg'),'utf8').match(/<svg[\s\S]*?>([\s\S]*?)<\/svg>/)[1]]));
function arrow(name,x,y,opacity=1){return `<g transform="translate(${x},${y}) scale(1.25)" opacity="${opacity}" fill="none" stroke="#0066cc" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</g>`;}
function svg(time,poster=false){
 const fade=poster?1:time>22?clamp((24-time)/2):1;
 let shapes='',motion='';
 for(const [x,y,w,h,label,arrival] of blocks){
  const ai=arrival<0,index=-arrival-1,start=ai?7+index*3:arrival;
  const progress=poster?1:ease(clamp((time-start)/(ai?2.1:.9)));
  const active=ai&&!poster&&time>=start-.8&&time<start+2.5;
  if(ai&&(poster||time>=4.5))shapes+=`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="#fafcff" stroke="${active?'#0071e3':'#c8d2df'}" stroke-width="${active?2:1.3}" stroke-dasharray="5 6"/>`;
  if(progress>0){
   const shift=ai?0:(1-progress)*(y>=420?30:-30),fill=ai?'#0071e3':y>=506?'#dce6f0':y<242?'#dfe4e9':'#e9edf1',lines=label.split('|');
   const text=lines.map((line,i)=>`<tspan x="${x+w/2}" dy="${i?25:0}">${line}</tspan>`).join('');
   shapes+=`<g transform="translate(0,${shift})" opacity="${ai?1:progress}"><defs><clipPath id="fill-${x}-${y}"><rect x="${x}" y="${y+h*(1-progress)}" width="${w}" height="${h*progress}" rx="7"/></clipPath></defs><g ${ai?`clip-path="url(#fill-${x}-${y})"`:''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="${fill}"/></g><text x="${x+w/2}" y="${y+h/2+(lines.length>1?-7:7)}" text-anchor="middle" fill="${ai?'white':'#253849'}" font-size="${lines.length>1?19:20}" opacity="${ai?clamp((progress-.65)/.35):1}">${text}</text></g>`;
  }
  if(active){
   const pulse=.55+.45*Math.sin((time-start+1)*4)**2,right=index!==1,edge=right?660:60,target=right?x+w+14:x-14,cy=y+h/2;
   const travel=clamp((time-(start-.8))/1.2),tip=edge+(target-edge)*ease(travel);
   if(index===1){
    const lane=y-5,cx=x+w/2,end=60+(cx-60)*ease(travel);
    motion+=`<path d="M60 ${lane}H${end}" fill="none" stroke="#0071e3" stroke-width="1.6" opacity="${pulse}"/><circle cx="60" cy="${lane}" r="18" fill="white" stroke="#d7e5f5"/><text x="60" y="${lane+5}" text-anchor="middle" font-size="13" fill="#0066cc">AI</text>`;
    if(travel===1)motion+=arrow('arrow-down',cx-15,lane-8,pulse);
   }else motion+=`<path d="M${edge} ${cy}H${tip}" fill="none" stroke="#0071e3" stroke-width="1.6" opacity="${pulse}"/><circle cx="${edge}" cy="${cy}" r="18" fill="white" stroke="#d7e5f5"/><text x="${edge}" y="${cy+5}" text-anchor="middle" font-size="13" fill="#0066cc">AI</text><g transform="translate(${tip},${cy}) rotate(${right?180:0})">${arrow('arrow-right',-15,-15,pulse)}</g>`;
  }
 }
 if(!poster&&time<5.4){const p=(time%1.8)/1.8,alpha=Math.sin(p*Math.PI)*.75;motion+=arrow('arrow-up',66,580-p*200,alpha)+arrow('arrow-down',605,165+p*190,alpha);}
 const phase=poster||time>=16?'스스로 검증하며 완성':time>=6.2?'빈 곳은 AI와 함께':time>=2.3?'실무에서 필요한 지식으로':'기초부터 차곡차곡';
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="white"/><g font-family="Malgun Gothic, sans-serif" opacity="${fade}"><path d="M360 35V56" stroke="#abbaca" stroke-width="2"/>${shapes}${motion}<path d="M96 658H624" stroke="#b7c5d3" stroke-width="1.5"/><text x="360" y="713" text-anchor="middle" fill="${time>=6.2&&time<16?'#0066cc':'#253849'}" font-size="22">${phase}</text></g></svg>`;
}
const frames=[];
for(let i=0;i<COUNT;i++)frames.push(await sharp(Buffer.from(svg(i*DELAY/1000))).ensureAlpha().raw().toBuffer());
await sharp(Buffer.concat(frames),{raw:{width:W,height:H*COUNT,channels:4,pageHeight:H}}).gif({loop:0,delay:Array(COUNT).fill(DELAY),colours:128,dither:0,effort:7}).toFile(path.join(assets,'learning-blocks.gif'));
await sharp(Buffer.from(svg(18,true))).png().toFile(path.join(assets,'learning-blocks-poster.png'));
const meta=await sharp(path.join(assets,'learning-blocks.gif'),{animated:true}).metadata();
if(meta.delay.reduce((a,b)=>a+b,0)!==COUNT*DELAY)throw new Error('Incorrect duration');
const out=path.join(root,'output/rebuild-review');fs.mkdirSync(out,{recursive:true});
for(const [name,time] of [['gaps',5.8],['ai',8.1],['complete',18]])await sharp(Buffer.from(svg(time))).png().toFile(path.join(out,`learning-blocks-${name}.png`));
console.log(JSON.stringify({frames:meta.pages,duration:COUNT*DELAY,bytes:fs.statSync(path.join(assets,'learning-blocks.gif')).size}));
