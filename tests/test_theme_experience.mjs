import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {stormStrike,lightningBranches,fleetPosition,pickShip,projectPoint,createFleetControl} from '../themes/sea-interaction.mjs';
import {createSeaMotion} from '../themes/sea-motion.mjs';
import sea,{shipMasts} from '../themes/living-sea.js';
import forest from '../themes/amber-forest.js';
import city from '../themes/white-ocean-city.js';
import {wildflowerGeometry,wildflowerInstances} from '../themes/wildflowers.mjs';
import {perspective,lookAt,multiply} from '../themes/world-gl.mjs';
import {projectCelestialParticle} from '../themes/celestial-world.mjs';
import {ThemeEngine} from '../themes.js';
import {fetchSceneAudio} from '../scene-audio.js';
import {SceneAudio} from '../scene-audio.js';
import {createThemeAudio} from '../themes/theme-audio.mjs';

for(const aspect of [540/960,16/9]){
 const pose=createSeaMotion().step(8,null,{storm:0,wave:1.2}),p=new Float32Array(16),v=new Float32Array(16),vp=new Float32Array(16);
 perspective(p,.94,aspect,.35,1700);lookAt(v,pose.eye,pose.target);multiply(vp,p,v);
 const ships=Array.from({length:3},(_,slot)=>({...fleetPosition(slot,8,pose.routeZ,aspect),slot,y:.6,scale:slot===0?1.82:1.56,masts:shipMasts(slot===0?3:slot===1?1:0)}));
 for(const ship of ships){const point=projectPoint(vp,[ship.x,ship.y+12*ship.scale,ship.z]);assert(point);assert.equal(pickShip(ships,vp,point[0]*540,point[1]*960,540,960),ship.slot);}
 assert.equal(pickShip(ships,vp,270,900,540,960),-1);
 const control=createFleetControl();control.step(0);assert.equal(control.move(1,1,1),false);
 for(let slot=0;slot<3;slot++){const base=ships[slot];control.select(slot);assert.deepEqual(control.pose(slot,base),{x:base.x,z:base.z,yaw:base.yaw});control.move(.4,.2,.7);let prev=control.pose(slot,base);
  for(let i=1;i<=60;i++){control.step(slot+i/60);const next=control.pose(slot,base);assert(Math.hypot(next.x-prev.x,next.z-prev.z)<6);prev=next;}
  assert(prev.x>base.x+25&&prev.z<base.z-30);assert(Number.isFinite(prev.yaw));control.clear();}
}
const cameraP=new Float32Array(16),cameraV=new Float32Array(16),particleVP=new Float32Array(16);perspective(cameraP,1,540/960);lookAt(cameraV,[0,1,24],[0,1,-16]);multiply(particleVP,cameraP,cameraV);
const particle={x:270,y:480,depth:2},far=projectCelestialParticle(particle,540,960,[0,1,24],0,particleVP),near=projectCelestialParticle(particle,540,960,[0,1,24],10,particleVP);assert(near.scale>far.scale&&near.alpha>0);
for(let z=0;z<500;z+=.3){const point=projectCelestialParticle(particle,540,960,[0,1,24],z,particleVP);assert(Object.values(point).every(Number.isFinite));assert(point.alpha>=0&&point.alpha<=1);}
let strikes=0;for(let cycle=0;cycle<25;cycle++){
 const strike=stormStrike(cycle*13+9);assert.equal(stormStrike(strike.start,0).flash,0);
 assert(stormStrike(strike.start,1).flash>.9);assert.equal(stormStrike(strike.start+1,1).flash,0);assert(strike.delay>2.5&&strike.delay<8);
 const branches=lightningBranches(strike.seed);assert(branches.length>1);assert(branches.flat().flat().every(Number.isFinite));strikes++;
}assert.equal(strikes,25);
const flowers=wildflowerInstances();assert.equal(flowers.flowers.length,120);
for(let kind=0;kind<5;kind++){const g=wildflowerGeometry(kind);assert(g.positions.every(Number.isFinite)&&g.normals.every(Number.isFinite));assert(g.indices.every(i=>i>=0&&i<g.positions.length/3));assert.equal(g.uvs.length,g.positions.length/3*2);assert(Math.max(...g.positions.filter((_,i)=>i%3===2))>.25);assert.equal(flowers.groups[kind].a.length,flowers.groups[kind].b.length);}

class Node extends EventTarget{
 constructor(){super();this.dataset={};this.style={setProperty(){}};this.children=[];this.attributes={};this.hidden=false;this.classList={contains:()=>false};}
 setAttribute(k,v){this.attributes[k]=v;}append(...nodes){this.children.push(...nodes);}remove(){}insertBefore(n){this.children.push(n);}matches(){return false;}
}
const actions=new Node(),doc=new EventTarget(),win=new EventTarget();let offers=[],layer=new Node();
Object.assign(doc,{baseURI:'https://example.test/project/',hidden:false,getElementById:id=>id==='flight-layer'?layer:null,querySelectorAll:selector=>selector==='.flight-planet'?offers:[],querySelector:selector=>selector==='.top-actions'?actions:null,createElement:()=>new Node()});
globalThis.document=doc;globalThis.window=win;globalThis.location=new URL(doc.baseURI);globalThis.localStorage={getItem:()=>null};
globalThis.CustomEvent??=class extends Event{constructor(type,args){super(type);this.detail=args?.detail;}};
const engine=new ThemeEngine();engine.w=540;engine.phase=1;
offers=Array.from({length:5},()=>new Node());engine.drawPlanets();assert.equal(offers.filter(n=>!n.hidden).length,1);assert.equal(offers.filter(n=>n.attributes['aria-hidden']==='true').length,4);
engine.phase=23;engine.drawPlanets();assert.equal(offers.filter(n=>!n.hidden).length,1);
const themeSource=await fs.readFile(new URL('../themes.js',import.meta.url),'utf8');assert(themeSource.includes('body.zen #main-nav{display:none!important'));

const sources=[];let resumes=0,failOgg=false;
const param=()=>({value:0,setTargetAtTime(v){this.value=v;},setValueAtTime(v){this.value=v;},linearRampToValueAtTime(v){this.value=v;},cancelScheduledValues(){},cancelAndHoldAtTime(){}});
class Context{
 constructor(){this.currentTime=0;this.state='suspended';this.destination={};}
 async resume(){resumes++;this.state='running';}async close(){this.state='closed';}
 createGain(){return{gain:param(),connect(){},disconnect(){}};}
 createDynamicsCompressor(){return{threshold:param(),knee:param(),ratio:param(),attack:param(),release:param(),connect(){}};}
 createStereoPanner(){return{pan:param(),connect(){},disconnect(){}};}
 createBuffer(channels,length,sampleRate){const data=Array.from({length:channels},()=>new Float32Array(length));return{numberOfChannels:channels,length,sampleRate,getChannelData:i=>data[i]};}
 async decodeAudioData(bytes){assert(bytes.byteLength>100);if(failOgg&&Buffer.from(bytes).subarray(0,4).toString()==='OggS')throw Error('Unsupported OGG');return this.createBuffer(1,8000,1000);}
 createBufferSource(){const source={connect(){},disconnect(){},start(time=0){this.started=time;sources.push(this);},stop(){this.stopped=true;}};return source;}
}win.AudioContext=Context;
const fetched=[];globalThis.fetch=async url=>{const parsed=new URL(url,doc.baseURI),path=parsed.pathname.replace(/^\/project\//,'').replace(/^artivid\//,'');fetched.push(path);try{let data;try{data=await fs.readFile(new URL('../artivid/'+path,import.meta.url));}catch{data=await fs.readFile(new URL('../'+path,import.meta.url));}return new Response(data);}catch{return new Response('',{status:404});}};
const {THEME_AUDIO_LIBRARY:library,THEME_AUDIO_SCENES:scenes}=await import('../theme-sound.js');
for(const id of ['aurora','golden','moon','violet-bloom']){
 const audio=new SceneAudio(library,{pause(){}});assert.equal(await audio.toggle(),true);await audio.scene(scenes[id],id);assert(audio.tracks.size>0);assert([...audio.tracks.values()].every(s=>s.source.started===0&&s.source.loop));
 failOgg=true;audio.cache.clear();audio.stop();assert.equal(await audio.toggle(),true);await audio.scene(scenes[id],id);assert(audio.tracks.size>0);audio.dispose();failOgg=false;
}
// A fresh controller must recover through AAC when OGG decoding is unavailable.
failOgg=true;const compatible=new SceneAudio(library,{pause(){}});await compatible.toggle();await compatible.scene(scenes.aurora,'aurora');assert(fetched.includes('audio-library/compatible/music/synth_mystic_pad.m4a'));compatible.dispose();failOgg=false;
for(const theme of [sea,forest,city]){
 const url=src=>new URL(src,doc.baseURI).href,spec={...theme.soundscape,loops:theme.soundscape.loops.map(e=>({...e,src:url(e.src),fallback:e.fallback?url(e.fallback):undefined}))};
 if(spec.thunder)spec.thunder={...spec.thunder,src:url(spec.thunder.src)};
 const native=createThemeAudio(spec),button=actions.children.at(-1);failOgg=true;await button.onclick();assert.equal(button.attributes['aria-pressed'],'true');
 if(theme===sea){const before=sources.length,strike=stormStrike(100);native.setWeather({wind:1,rain:1,storm:1,strike:stormStrike(strike.start,1)});for(let attempt=0;attempt<50&&sources.length===before;attempt++)await new Promise(resolve=>setTimeout(resolve,10));assert.equal(sources.length,before+1);assert(sources.at(-1).started>2.5);native.setWeather({wind:1,rain:1,storm:1,strike:stormStrike(strike.start+.02,1)});assert.equal(sources.length,before+1);}
 native.dispose();failOgg=false;
}
const redirected=[];const movedFetch=async url=>{redirected.push(String(url));return String(url).includes('/artivid/')?new Response(await fs.readFile(new URL('../audio-library/nature/ocean_waves.ogg',import.meta.url))):Response.json({status:'moved',movedTo:'https://example.test/project/artivid/'});};
const moved=await fetchSceneAudio('https://example.test/project/audio-library/nature/ocean_waves.ogg',{nativeFetch:movedFetch});assert(Buffer.from(await moved.arrayBuffer()).subarray(0,4).toString()==='OggS');assert(redirected.at(-1).endsWith('/artivid/audio-library/nature/ocean_waves.ogg'));
const unavailableRoot=async url=>String(url).includes('/artivid/')?new Response(await fs.readFile(new URL('../audio-library/nature/ocean_waves.ogg',import.meta.url))):new Response('',{status:403});
const recovered=await fetchSceneAudio('https://example.test/project/audio-library/nature/ocean_waves.ogg',{nativeFetch:unavailableRoot});assert(Buffer.from(await recovered.arrayBuffer()).subarray(0,4).toString()==='OggS');
assert(resumes>=7);assert(sources.length>=15);
console.log('PASS: three selectable ships, smooth steering, delayed storm thunder, five 3D wildflowers, one zen card, hidden navigation and audio start/AAC recovery for all seven themes.');
