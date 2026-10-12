import assert from 'node:assert/strict';
import {wildflowerGeometry,wildflowerInstances} from '../themes/wildflowers.mjs';
import {createFlowerControl,flowerBasePose,pickFlower,rotateVector} from '../themes/flower-interaction.mjs';
import {themeTypography,contrastRatio} from '../themes/theme-typography.mjs';
import {lookAt,perspective,multiply} from '../themes/world-gl.mjs';
import {projectPoint} from '../themes/sea-interaction.mjs';
import {createSceneMotion} from '../themes/scene-motion.mjs';
import fs from 'node:fs/promises';
const field=wildflowerInstances(),geometry=Array.from({length:5},(_,i)=>wildflowerGeometry(i)),eye=[0,2.5,24];
const close=(a,b)=>a.forEach((v,i)=>assert(Math.abs(v-b[i])<1e-8,`${i}: ${v} != ${b[i]}`));
const controls=createFlowerControl(field);let poses=controls.step(0,eye,0);
assert.equal(controls.rotate(1,1),false);assert.equal(controls.move(1,1,1),false);
for(let id=0;id<120;id++){
 const before=poses[id];controls.select(id);poses=controls.step(0,eye,0);close(poses[id].position,before.position);close(poses[id].rotation,before.rotation);controls.clear();poses=controls.step(0,eye,0);close(poses[id].position,before.position);close(poses[id].rotation,before.rotation);
}
controls.select(3);const initial=poses[3];controls.rotate(.25,.30);controls.move(.2,.12,3);
for(let frame=1;frame<=180;frame++){
 const previous=poses[3];poses=controls.step(frame/60,eye,frame/60*2.8,960);const p=poses[3];assert(p.position.every(Number.isFinite));assert(Math.abs(Math.hypot(...p.rotation)-1)<1e-9);assert(Math.hypot(...p.position.map((v,i)=>v-previous.position[i]))<=80/60*Math.sqrt(3)+1e-7);assert(p.position[2]<=eye[2]-5+1e-8);
}assert(Math.hypot(...poses[3].position.map((v,i)=>v-initial.position[i]))>1);
assert(Math.hypot(...poses[3].rotation.map((v,i)=>v-initial.rotation[i]))>.3);
const held=poses[3];poses=controls.step(3.1,eye,100);assert(Math.hypot(...poses[3].position.map((v,i)=>v-held.position[i]))<.001);
controls.clear();const released=controls.step(3.1,eye,100)[3];close(released.position,poses[3].position);close(released.rotation,poses[3].rotation);
controls.select(3);const reselected=controls.step(3.1,eye,100)[3];close(reselected.position,released.position);close(reselected.rotation,released.rotation);
for(let n=0;n<2000;n++)controls.rotate(Math.sin(n)*.6,Math.cos(n)*.7);
poses=controls.step(3.2,eye,100);assert(poses.every(p=>p.position.every(Number.isFinite)&&p.rotation.every(Number.isFinite)));assert(Math.abs(Math.hypot(...poses[3].rotation)-1)<1e-9);const normal=rotateVector(poses[3].rotation,[0,0,1]);assert(Math.abs(Math.hypot(...normal)-1)<1e-9);
for(const [width,height]of [[360,780],[709,1536],[1440,900]]){
 const view=new Float32Array(16),projection=new Float32Array(16),vp=new Float32Array(16);lookAt(view,eye,[0,2.5,-20]);perspective(projection,1,width/height);multiply(vp,projection,view);
 for(let id=0;id<120;id++){
  const pose={...flowerBasePose(field,id,0,eye,0),position:[0,2.5,0],rotation:[0,0,0,1]};
  const point=projectPoint(vp,[0,2.5,.1]);assert.equal(pickFlower([pose],geometry,{eye,view,width,height},point[0]*width,point[1]*height),id);
 }
 const near={id:0,species:0,scale:1,position:[0,2.5,10],rotation:[0,0,0,1]},far={...near,id:1,position:[0,2.5,-10]};
 assert.equal(pickFlower([far,near],geometry,{eye,view,width,height},width/2,height/2),0);
 assert.equal(pickFlower([near],geometry,{eye,view,width,height},0,0),-1);
}
const manifest=JSON.parse(await fs.readFile(new URL('../themes/manifest.json',import.meta.url)));
for(const entry of manifest){
 assert(!/прежн|стар(ая|ые|ый)/i.test(entry.description));const theme=(await import('../themes/'+entry.id+'.js')).default,ink=themeTypography(theme),rgba=ink.panelBackground.match(/[\d.]+/g).map(Number);
 for(const backdrop of [[0,0,0],[255,255,255],[160,205,225],[235,200,130]]){
  const background=rgba.slice(0,3).map((v,i)=>v*rgba[3]+backdrop[i]*(1-rgba[3]));
  for(const color of [ink.panelText,ink.panelMuted,ink.panelLabel])assert(contrastRatio(color,background)>=4.5,`${entry.id}: ${color}`);
 }
 if(entry.id==='living-sea'){assert.notEqual(themeTypography(theme,0).pageHeading,themeTypography(theme,200).pageHeading);}
 if(entry.id==='violet-bloom')for(const color of [ink.pageText,ink.pageMuted,ink.pageHeading,ink.pageLabel])assert(contrastRatio(color,'#faf9fc')>=7);
}
for(const camera of [null,{x:0,y:0,z:0}]){const old=createSceneMotion({rest:.55,flight:2.2}),next=createSceneMotion({rest:.72,flight:2.8});let a,b;for(let f=0;f<600;f++){a=old.step(f/60,camera);b=next.step(f/60,camera);}assert(b.travel/a.travel>1.2&&b.travel/a.travel<1.35);}
console.log('PASS: all 120 flowers selectable, stable selection/release, full 3D rotation, bounded smooth movement, faster continuous flight, readable text across seven palettes and clean theme descriptions.');

// Exercise the actual touch/mouse routing: rotate, translate and pinch stay separate.
class Element extends EventTarget{constructor(){super();this.style={setProperty(){}};this.children=[];this.classList={contains:()=>true};}setAttribute(){}append(...nodes){this.children.push(...nodes);}querySelectorAll(){return [];}closest(){return null;}setPointerCapture(){}}
const body=new Element(),doc=new EventTarget(),win=new EventTarget();Object.assign(doc,{body,createElement:()=>new Element(),getElementById:()=>null});globalThis.document=doc;globalThis.window=win;globalThis.innerWidth=360;globalThis.innerHeight=780;
const {setupFlightLayer}=await import('../flight.js');const movements=[],turns=[],selections=[];const theme={flowerSelected:true,theme:{gesturePanScale:260},selectAt(...v){selections.push(v);},move(...v){movements.push(v);},rotateSelected(...v){turns.push(v);return true;}};const layer=setupFlightLayer({theme});
const send=(type,properties)=>{const event=new Event(type,{cancelable:true});Object.assign(event,properties);layer.dispatchEvent(event);};
const touch=(x,y)=>({clientX:x,clientY:y});
send('touchstart',{touches:[touch(100,100)]});send('touchmove',{touches:[touch(120,80)]});close(turns.at(-1),[20/260,20/260]);assert.equal(movements.length,0);
send('touchstart',{touches:[touch(100,100),touch(200,100)]});send('touchmove',{touches:[touch(140,120),touch(240,120)]});close(movements.at(-1),[40/260,-20/260,0]);
send('touchmove',{touches:[touch(120,120),touch(260,120)]});close(movements.at(-1),[0,0,Math.log(1.4)*9]);
send('touchend',{touches:[]});send('pointerdown',{pointerType:'mouse',pointerId:1,clientX:100,clientY:100});send('pointermove',{pointerType:'mouse',pointerId:1,clientX:120,clientY:80,shiftKey:false});close(turns.at(-1),[20/260,20/260]);
send('pointermove',{pointerType:'mouse',pointerId:1,clientX:140,clientY:60,shiftKey:true});close(movements.at(-1),[20/260,20/260,0]);assert(selections.length>=2);
console.log('PASS: real gesture handlers route one finger/mouse drag to rotation, two-finger pan to movement, pinch to depth and Shift-drag to movement.');
