import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const assets=path.join(root,'public/assets');
const W=720,H=760,TH=650,N=12,FPS=12,SECONDS=10;
const {data:tower,info}=await sharp(path.join(assets,'learning-tower-source.png')).resize({height:TH}).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const TW=info.width,LEFT=Math.floor((W-TW)/2),TOP=40;
const bg=Buffer.alloc(W*H*4,255);
const frames=[];
function compose(frame,top,height,dy,opacity){
 for(let y=top;y<top+height;y++)for(let x=0;x<TW;x++){
  const toY=TOP+y+dy,toX=LEFT+x;if(toY<0||toY>=H)continue;
  const from=(y*TW+x)*4,to=(toY*W+toX)*4,a=tower[from+3]/255*opacity;
  if(a===0)continue;
  for(let c=0;c<3;c++)frame[to+c]=Math.round(tower[from+c]*a+frame[to+c]*(1-a));
 }
}
const smooth=t=>1-Math.pow(1-t,3);
for(let f=0;f<FPS*SECONDS;f++){
 const time=f/FPS,frame=Buffer.from(bg);
 const fade=time>8.8?Math.max(0,1-(time-8.8)/1.2):1;
 compose(frame,0,TH,0,.045*fade);
 for(let band=0;band<N;band++){
  const fromBottom=band>=N/2,rank=fromBottom?N-1-band:band;
  const start=.6+rank*.9+(fromBottom?0:.2);
  const t=Math.max(0,Math.min(1,(time-start)/.8));if(!t)continue;
  const y=Math.floor(band*TH/N),end=Math.floor((band+1)*TH/N);
  const offset=Math.round((1-smooth(t))*(fromBottom?44:-44));
  compose(frame,y,end-y,offset,smooth(t)*fade);
 }
 frames.push(frame);
}
const full=Buffer.from(bg);compose(full,0,TH,0,1);
await sharp(full,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(assets,'learning-tower-poster.png'));
// GIF is a real 120-frame looping asset, not a CSS animation or static surrogate.
await sharp(Buffer.concat(frames),{raw:{width:W,height:H*frames.length,channels:4,pageHeight:H}}).gif({loop:0,delay:frames.map(()=>80),colours:128,dither:.25,effort:7}).toFile(path.join(assets,'learning-tower.gif'));
const checks=await sharp(path.join(assets,'learning-tower.gif'),{animated:true}).metadata();
if(checks.pages<60 || checks.delay.reduce((a,b)=>a+b,0)!==frames.length*80)throw new Error('GIF animation duration mismatch');
for(const [name,frame] of [['start',frames[12]],['middle',frames[48]],['complete',full]]){
 fs.mkdirSync(path.join(root,'output/rebuild-review'),{recursive:true});
 await sharp(frame,{raw:{width:W,height:H,channels:4}}).png().toFile(path.join(root,`output/rebuild-review/gif-${name}.png`));
}
console.log(JSON.stringify({frames:checks.pages,width:checks.width,height:checks.pageHeight,bytes:fs.statSync(path.join(assets,'learning-tower.gif')).size}));
