import {SceneAudio} from './scene-audio.js?v=20261012-atmosphere-2';

export const THEME_AUDIO_LIBRARY={
  forest:{src:'audio-library/ambience/deep_forest.ogg',loop:true,volume:.18},
  ocean:{src:'audio-library/nature/ocean_waves.ogg',fallback:'audio-library/compatible/nature/ocean_waves.m4a',loop:true,volume:.13},
  night:{src:'audio-library/ambience/night_air.ogg',fallback:'audio-library/compatible/ambience/night_air.m4a',loop:true,volume:.14},
  glow:{src:'audio-library/music/synth_mystic_pad.ogg',loop:true,volume:.12},
  meadow:{src:'audio-library/nature/forest_morning.ogg',loop:true,volume:.14},
  breeze:{src:'audio-library/nature/wind_soft.ogg',loop:true,volume:.09},
  warm:{src:'audio-library/music/piano_romantic_soft.ogg',loop:true,volume:.1}
};
export const THEME_AUDIO_SCENES={
  'living-sea':'ocean',
  'amber-forest':'forest',
  'white-ocean-city':'ocean,night',
  'aurora':'night,glow',
  'golden':'warm',
  'moon':'night,glow',
  'violet-bloom':'meadow,breeze'
};
const silentPlayer={pause(){}};
const audio=new SceneAudio(THEME_AUDIO_LIBRARY,silentPlayer);audio.controller='theme-atmosphere';
const actions=document.querySelector('.top-actions');
const themeButton=document.getElementById('theme-toggle');
let button;

function icon(){
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
  const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d','M4 10v4h4l5 4V6L8 10H4m12.5-1.5a5 5 0 0 1 0 7M18.8 6.2a8.2 8.2 0 0 1 0 11.6');path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.8');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
function currentTheme(){return document.documentElement.dataset.theme||'aurora';}
async function syncScene(){const native=!!document.querySelector('.theme-sound-toggle');if(button)button.hidden=false;if(native){audio.stop();return;}if(audio.enabled)await audio.scene(THEME_AUDIO_SCENES[currentTheme()]||'',currentTheme());}
function update(detail={}){
  if(!button)return;button.setAttribute('aria-pressed',String(!!detail.enabled));button.title=detail.enabled?'Выключить звук темы':'Включить звук темы';button.setAttribute('aria-label',button.title);button.classList.toggle('active',!!detail.enabled);
}
if(actions&&themeButton){
  button=document.getElementById('ambient-theme-sound-toggle')||document.createElement('button');button.id='ambient-theme-sound-toggle';button.type='button';button.className='icon-btn glass';button.setAttribute('aria-pressed','false');button.replaceChildren(icon());themeButton.insertAdjacentElement('afterend',button);update({enabled:false});syncScene();
  button.addEventListener('click',async()=>{const native=document.querySelector('.theme-sound-toggle');if(native){native.click();return;}if(audio.enabled&&audio.context?.state==='suspended'){await audio.context.resume();return;}const enabled=await audio.toggle();update({enabled});if(enabled)await syncScene();});
  window.addEventListener('syolana:sceneaudio',e=>{if(e.detail?.controller!==audio.controller&&e.detail?.enabled)audio.stop();update({enabled:document.querySelector('.theme-sound-toggle')?.dataset.enabled==='true'||audio.enabled});});
  window.addEventListener('syolana:theme',syncScene);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)syncScene();});
}
