import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {updateFlightSpacing,FLIGHT_HINT} from '../flight.js';
import {playerMorphFrames} from '../player.js';
import {ThemeEngine} from '../themes.js';
const properties=new Map(),bodyProperties=new Map();
for(const [width,height]of [[320,640],[360,780],[393,852],[709,1536],[780,360],[1440,900]]){
 for(const hintHeight of [0,20,38,62,90])for(const cardHeight of [0,58,82,112]){
  const dock={getBoundingClientRect:()=>({left:width-72,top:height-72,bottom:height-16,width:56,height:56})};
  const card={hidden:false,getBoundingClientRect:()=>({height:cardHeight})},hint={getBoundingClientRect:()=>({height:hintHeight})};
  const layer={parentElement:{style:{setProperty:(k,v)=>bodyProperties.set(k,parseFloat(v))}},style:{setProperty:(k,v)=>properties.set(k,parseFloat(v))},getBoundingClientRect:()=>({bottom:height,height}),querySelectorAll:()=>[card]};
  updateFlightSpacing(layer,dock,hint,height);
  const cardTop=height-properties.get('--zen-card-bottom')-cardHeight,hintBottom=height-properties.get('--zen-hint-bottom');
  if(cardHeight)assert(hintBottom<=cardTop-10,'Wrapped instruction must stay above the invitation');
  if(width<1000){const cardWidth=Math.min(640,width-104),cardRight=width/2-36+cardWidth/2;assert(cardRight<=dock.getBoundingClientRect().left-16,'Invitation must leave room for the compact player');}
  assert(properties.get('--zen-card-bottom')>=16);
  assert(bodyProperties.get('--zen-contact-bottom')>=properties.get('--zen-hint-bottom')+hintHeight+18,'Avito must leave space above the full wrapped instruction');
 }
 const full={left:20,bottom:height-16,width:width-40,height:70},compact={left:width-72,bottom:height-16,width:56,height:56};
 const frames=playerMorphFrames(full,compact,height);assert.equal(frames[0].width,(width-40)+'px');assert.equal(frames[0].maxWidth,(width-40)+'px');assert.equal(frames[1].width,'56px');assert.equal(frames[1].left,(width-72)+'px');assert.equal(frames[1].bottom,'16px');assert(frames.every(f=>!f.transform.includes('scale')),'Glyphs must not be enlarged while the player collapses');
}
// Changing the active invitation must not move the instructions or contact link.
const short={hidden:false,getBoundingClientRect:()=>({height:58})},tall={hidden:true,getBoundingClientRect:()=>({height:112})};
const stableLayer={parentElement:{style:{setProperty:(k,v)=>bodyProperties.set(k,parseFloat(v))}},style:{setProperty:(k,v)=>properties.set(k,parseFloat(v)),removeProperty:k=>properties.delete(k)},getBoundingClientRect:()=>({height:852,bottom:852}),querySelectorAll:()=>[short,tall]};
const stableHint={getBoundingClientRect:()=>({height:38})},stableDock={getBoundingClientRect:()=>({height:56,bottom:836})};
updateFlightSpacing(stableLayer,stableDock,stableHint,852);
const stillHint=properties.get('--zen-hint-bottom'),stillContact=bodyProperties.get('--zen-contact-bottom');
assert.equal(properties.get('--zen-card-height'),112,'Space must include the tallest inactive invitation');
short.hidden=true;tall.hidden=false;updateFlightSpacing(stableLayer,stableDock,stableHint,852);
assert.equal(properties.get('--zen-hint-bottom'),stillHint);assert.equal(bodyProperties.get('--zen-contact-bottom'),stillContact);
// A wider viewport may shrink the reserved space again without stale heights.
tall.getBoundingClientRect=()=>({height:58});updateFlightSpacing(stableLayer,stableDock,stableHint,852);assert.equal(properties.get('--zen-card-height'),58);
assert(/Мышь/.test(FLIGHT_HINT)&&/Экран/.test(FLIGHT_HINT)&&/колесо/.test(FLIGHT_HINT)&&/щипок/.test(FLIGHT_HINT));assert(!/два пальца/i.test(FLIGHT_HINT));
const hint={textContent:''},doc={querySelector:()=>hint,getElementById:()=>({setAttribute(){}})};globalThis.document=doc;
const engine=new ThemeEngine();engine.zen=true;
for(const [id,selection]of [['violet-bloom',null],['violet-bloom',3],['living-sea',null],['living-sea',2],['aurora',null]]){
 engine.theme={id};engine.selectedObject=selection;engine.updateFlightHint();assert(!/два пальца/i.test(hint.textContent));assert(hint.textContent.length>30);
}
const source=await fs.readFile(new URL('../themes.js',import.meta.url),'utf8');assert(source.includes('body.zen #music-dock{'));assert(source.includes('background:none!important;border:0!important;border-radius:0;padding:0!important'));
console.log('PASS: portrait/landscape spacing for long instructions, compact player clearance, unscaled player morph, plain mouse/touch guidance and all selection states.');
