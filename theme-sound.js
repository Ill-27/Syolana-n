import {SceneAudio} from './scene-audio.js?v=20261011-theme-audio-2';

const library={
  forest:{src:'audio-library/ambience/deep_forest.ogg',loop:true,volume:.18},
  ocean:{src:'audio-library/ambience/wind_howl_window.ogg',fallback:'audio-library/compatible/ambience/wind_howl_window.m4a',loop:true,volume:.13},
  night:{src:'audio-library/ambience/night_air.ogg',fallback:'audio-library/compatible/ambience/night_air.m4a',loop:true,volume:.14},
  distant:{src:'audio-library/ambience/distant_rumble.ogg',loop:true,volume:.1},
  glow:{src:'audio-library/music/ghostly_apparition.ogg',loop:true,volume:.12},
  warm:{src:'audio-library/music/comedy_pizzicato.ogg',loop:true,volume:.1}
};
const scenes={
  'living-sea':'ocean,distant',
  'amber-forest':'forest',
  'white-ocean-city':'ocean,night',
  'aurora':'night,glow',
  'golden':'warm',
  'moon':'night,glow',
  'violet-bloom':'forest'
};
const silentPlayer={pause(){}};
const audio=new SceneAudio(library,silentPlayer);
const actions=document.querySelector('.top-actions');
const themeButton=document.getElementById('theme-toggle');
let button;

function icon(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M4 10v4h4l5 4V6L8 10H4m12.5-1.5a5 5 0 0 1 0 7M18.8 6.2a8.2 8.2 0 0 1 0 11.6');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
function currentTheme(){return document.documentElement.dataset.theme||'aurora';}
async function syncScene(){const native=!!document.querySelector('.theme-sound-toggle');if(button)button.hidden=native;if(native){audio.stop();return;}if(audio.enabled)await audio.scene(scenes[currentTheme()]||'',currentTheme());}
function update(detail={}){
  if(!button)return;button.setAttribute('aria-pressed',String(!!detail.enabled));button.title=detail.enabled?'Выключить звук темы':'Включить звук темы';button.setAttribute('aria-label',button.title);button.classList.toggle('active',!!detail.enabled);
}
if(actions&&themeButton){
  button=document.createElement('button');button.id='ambient-theme-sound-toggle';button.type='button';button.className='icon-btn glass';button.setAttribute('aria-pressed','false');button.append(icon());themeButton.insertAdjacentElement('afterend',button);update({enabled:false});syncScene();
  button.addEventListener('click',async()=>{const enabled=await audio.toggle();update({enabled});if(enabled)await syncScene();});
  window.addEventListener('syolana:sceneaudio',e=>update(e.detail||{}));
  window.addEventListener('syolana:theme',syncScene);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncScene();});
}
