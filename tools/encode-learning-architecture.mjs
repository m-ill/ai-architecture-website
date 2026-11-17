import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {learningOverlay} from './learning-motion-overlay.mjs';
const root=path.resolve(import.meta.dirname,'..'),dir=path.join(root,'output/learning-film'),out=path.join(dir,'composited');
fs.mkdirSync(out,{recursive:true});
const overlay=(frame,fade=0)=>Buffer.from(`<svg width="720" height="760"><rect width="720" height="760" fill="white" opacity="${fade}"/></svg>`);
for(let frame=1;frame<=288;frame++){
 const source=path.join(dir,'frames',`frame_${String(Math.min(frame,230)).padStart(4,'0')}.png`);
 if(!fs.existsSync(source))throw new Error(`Missing rendered frame ${frame}`);
 const original=await sharp(source).resize(720,760).ensureAlpha().raw().toBuffer();
 const light=Buffer.alloc(original.length);
 for(let i=0;i<original.length;i+=4){
  if(original[i+2]>180&&original[i+1]>105&&original[i]<original[i+2]*.75&&original[i+3]>0){
   light[i]=20;light[i+1]=145;light[i+2]=255;light[i+3]=110;
  }
 }
 const glow=await sharp(light,{raw:{width:720,height:760,channels:4}}).blur(4).png().toBuffer();
 const lit=await sharp(original,{raw:{width:720,height:760,channels:4}}).flatten({background:'#fff'}).composite([{input:glow,blend:'screen'}]).png().toBuffer();
 await sharp(lit).composite([{input:learningOverlay(frame)},{input:overlay(frame,Math.max(frame<12?1-frame/12:0,frame>272?(frame-272)/16:0))}]).png().toFile(path.join(out,`frame_${String(frame).padStart(4,'0')}.png`));
}
const assets=path.join(root,'public/assets');
fs.copyFileSync(path.join(out,'frame_0230.png'),path.join(assets,'learning-ai-partner-poster.png'));
const run=args=>{const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{stdio:'inherit'});if(r.status!==0)throw new Error('ffmpeg failed');};
run(['-framerate','12','-i',path.join(out,'frame_%04d.png'),'-vf','minterpolate=fps=24:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1','-c:v','libx264','-preset','slow','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',path.join(assets,'learning-ai-partner.mp4')]);
run(['-framerate','12','-i',path.join(out,'frame_%04d.png'),'-filter_complex','split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=sierra2_4a:diff_mode=rectangle','-loop','0',path.join(assets,'learning-ai-partner.gif')]);
const meta=await sharp(path.join(assets,'learning-ai-partner.gif'),{animated:true}).metadata();
console.log(JSON.stringify({frames:meta.pages,duration:meta.delay.reduce((a,b)=>a+b,0),gifBytes:fs.statSync(path.join(assets,'learning-ai-partner.gif')).size,videoBytes:fs.statSync(path.join(assets,'learning-ai-partner.mp4')).size}));
