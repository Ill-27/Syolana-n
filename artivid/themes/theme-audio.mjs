import {SceneAudio} from '../scene-audio.js?v=20261012-atmosphere-2';

const root=new URL('../',import.meta.url);
export function audioEntry(raw){
 const entry=typeof raw==='string'?{src:raw}:raw;
 const src=new URL(entry.src,root).href;
 return{...entry,src,fallback:new URL(entry.fallback||entry.src.replace('audio-library/','audio-library/compatible/').replace(/\.ogg$/,'.m4a'),root).href,loop:entry.loop!==false};
}
export function createThemeAudio(spec){
 const entries=spec.loops.map(audioEntry),library=Object.fromEntries(entries.map((e,i)=>['layer'+i,e]));
 const audio=new SceneAudio(library,{pause(){document.getElementById('audio')?.pause();}});
 audio.controller=spec.title;audio.maxOutput=.6;
 const button=document.createElement('button');button.type='button';button.className='icon-btn glass theme-sound-toggle';
 button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="M16 9c1.7 1.5 1.7 4.5 0 6M18.5 6.8c3.5 3 3.5 7.4 0 10.4"/></svg>';
 document.querySelector('.top-actions')?.insertBefore(button,document.querySelector('#zen-toggle'));
 let dead=false,shotTimer=0,lastStrike=-1;const shots=new Set();
 const sync=()=>{button.dataset.enabled=String(audio.enabled);button.setAttribute('aria-pressed',String(audio.enabled));button.title=audio.enabled?'Выключить '+spec.title.toLowerCase():'Включить '+spec.title.toLowerCase();button.setAttribute('aria-label',button.title);};sync();
 const stop=()=>{clearTimeout(shotTimer);for(const s of shots){try{s.stop();s.disconnect();}catch{}}shots.clear();audio.stop();sync();};
 async function playShot(raw,delay=0,pan=0){
  const request=audio.sequence,entry=audioEntry({...raw,loop:false});
  try{const buffer=await audio.load(entry);if(dead||!audio.enabled||request!==audio.sequence)return;
   const source=audio.context.createBufferSource(),gain=audio.context.createGain(),panner=audio.context.createStereoPanner?.();source.buffer=buffer;gain.gain.value=entry.volume??.15;source.connect(gain);
   if(panner){panner.pan.value=pan;gain.connect(panner);panner.connect(audio.master);}else gain.connect(audio.master);
   shots.add(source);source.onended=()=>{shots.delete(source);source.disconnect();gain.disconnect();panner?.disconnect();};source.start(audio.context.currentTime+delay);
  }catch{}
 }
 const schedule=()=>{const shot=spec.oneShots?.[0];if(!shot||!audio.enabled||dead)return;shotTimer=setTimeout(()=>{playShot(shot,0,Math.random()*1.2-.6);schedule();},1000*(shot.minDelay+Math.random()*(shot.maxDelay-shot.minDelay)));};
 button.onclick=async()=>{
  if(audio.enabled&&audio.context?.state==='suspended'){await audio.context.resume();return;}
  if(audio.enabled){stop();return;}
  if(await audio.toggle()){await audio.scene(entries.map((_,i)=>'layer'+i).join(','),spec.title);if(audio.enabled)schedule();}sync();
 };
 const onScene=e=>{if(e.detail?.enabled&&e.detail.controller!==audio.controller)stop();else if(e.detail?.controller===audio.controller)sync();};
 const onPlay=e=>{if(e.target?.tagName==='AUDIO'&&!e.target.paused)stop();};
 window.addEventListener('syolana:sceneaudio',onScene);document.addEventListener('play',onPlay,true);
 return{setWeather(c){if(!audio.enabled)return;
   const levels=[.13+.05*c.wind,.02+.13*c.wind,.15*c.rain];entries.forEach((e,i)=>{const track=audio.tracks.get(e.src);if(track)track.gain.gain.setTargetAtTime(levels[i]??e.volume,audio.context.currentTime,.65);});
   const strike=c.strike;if(strike?.flash>.05&&strike.id!==lastStrike&&spec.thunder){lastStrike=strike.id;playShot({...spec.thunder,volume:(.16+.18*c.storm)*(1400/strike.distance)},Math.max(.05,strike.delay-strike.age),strike.pan);}
  },dispose(){dead=true;stop();window.removeEventListener('syolana:sceneaudio',onScene);document.removeEventListener('play',onPlay,true);button.remove();audio.dispose();}};
}
