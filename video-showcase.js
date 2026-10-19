import catalog from './video-showcase.json' with {type:'json'};
import {registerTranslations,tr} from './i18n.js';
import './video-copy.js';

registerTranslations({
 'Включить звук видео':['Turn video sound on','Activar el sonido del vídeo','Activer le son de la vidéo'],
 'Выключить звук видео':['Mute video','Silenciar el vídeo','Couper le son de la vidéo'],
 'Воспроизвести видео':['Play video','Reproducir vídeo','Lire la vidéo'],
 'Открыть видео':['Open video','Abrir vídeo','Ouvrir la vidéo'],
 'Видео':['Video','Vídeo','Vidéo'],
 'Обсудить видео':['Discuss a video','Consultar un vídeo','Parler de votre vidéo']
});

const selections=new WeakMap(),documents=new WeakMap();
const SPEAKER='<path d="M4 9v6h4l5 4V5L8 9H4"/>';
const SOUND='<path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>';
const MUTE='<path d="m17 9 5 6m0-6-5 6"/>';
const svg=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';

export function selectBannerVariant(random=Math.random){return ['none','short','long'][Math.max(0,Math.min(2,Math.floor(random()*3)))];}
export function chooseVideoSource(entry,win){
 const connection=win.navigator?.connection;
 const compact=win.innerWidth<800||connection?.saveData||Number(connection?.downlink)<6||/^(slow-2g|2g|3g)$/.test(connection?.effectiveType||'');
 return entry.sources.find(s=>s.width===(compact?1280:1920))||entry.sources[0];
}
function mediaURL(value){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&/\.(?:mp4|jpe?g)(?:$)/i.test(u.pathname)?u.href:'';}catch{return '';}
}
function installStyle(doc){
 if(doc.getElementById('syolana-video-style'))return;
 const style=doc.createElement('style');style.id='syolana-video-style';style.textContent=`
.syolana-video{position:relative;isolation:isolate;display:block;aspect-ratio:16/9;width:100%;max-width:100%;margin:0;overflow:hidden;border-radius:20px;background:#030309;contain:layout paint}
.syolana-video>video{position:absolute;inset:0;display:block;width:100%!important;height:100%!important;max-height:none!important;object-fit:contain!important;object-position:center;border:0;margin:0!important;border-radius:inherit;filter:none!important;background:#030309}
.syolana-video .video-sound,.syolana-video .video-play{position:absolute;z-index:3;display:grid;place-items:center;width:44px;height:44px;min-width:44px;min-height:44px;padding:10px;border:1px solid #ffffff60;border-radius:50%;color:#fff;background:rgba(7,12,24,.68);box-shadow:0 3px 16px #0005;backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);cursor:pointer;touch-action:manipulation}
.syolana-video .video-sound{top:clamp(10px,1.5vw,18px);right:clamp(10px,1.5vw,18px)}
.syolana-video .video-play{top:50%;left:50%;transform:translate(-50%,-50%);width:62px;height:62px;padding:17px}
.syolana-video button svg{display:block;width:100%;height:100%;pointer-events:none}.syolana-video button:hover{background:rgba(20,29,47,.85)}.syolana-video button:focus-visible{outline:2px solid #fff;outline-offset:3px}
.syolana-video [hidden]{display:none!important}.syolana-video .video-open{position:absolute;z-index:3;inset:auto 12px 12px;display:block;padding:10px 14px;text-align:center;color:#fff;background:#080e20da;border-radius:12px;font:600 14px/1.5 system-ui,sans-serif}
#banner.video-banner{display:block!important;padding:0!important;min-height:0!important;overflow:hidden}#banner.video-banner:before,#banner.video-banner:after{display:none!important}#banner.video-banner>.syolana-video{border-radius:inherit}
.feed-post>.syolana-video{margin:20px 0!important}.zen #banner.video-banner{display:none!important}
@supports not (aspect-ratio:16/9){.syolana-video{height:0;padding-top:56.25%}}
`;doc.head.append(style);
}
function documentPlayers(doc){
 let state=documents.get(doc);if(state)return state;
 const win=doc.defaultView,players=new Set();
 const each=fn=>{for(const p of players)fn(p);};
 doc.addEventListener('play',event=>{if(event.target instanceof win.HTMLMediaElement&&!event.target.muted)each(p=>{if(p.video!==event.target)p.mute();});},true);
 win.addEventListener('syolana:sceneaudio',event=>{if(event.detail?.enabled)each(p=>p.mute());});
 doc.addEventListener('visibilitychange',()=>each(p=>p.refreshPlayback()));
 win.addEventListener('pagehide',()=>each(p=>p.video.pause()));
 win.addEventListener('syolana:locale',()=>each(p=>p.labels()));
 const removed=new win.MutationObserver(()=>{for(const p of players){if(p.root.isConnected)p.connected=true;else if(p.connected)p.destroy();}});
 removed.observe(doc.body,{childList:true,subtree:true});
 state={players};documents.set(doc,state);return state;
}

export function createShowcaseVideo(entry,{doc=document,priority=false}={}){
 if(!entry?.sources?.length)return null;
 const win=doc.defaultView;installStyle(doc);
 const root=doc.createElement('figure');root.className='syolana-video';root.dataset.i18nSkip='video-player';
 const video=doc.createElement('video');video.width=1920;video.height=1080;video.muted=true;video.defaultMuted=true;video.loop=true;video.playsInline=true;video.preload='none';video.setAttribute('muted','');video.setAttribute('playsinline','');video.dataset.showcaseVideo=entry.id;
 const poster=mediaURL(entry.poster);if(poster)video.poster=poster;
 const sound=doc.createElement('button');sound.type='button';sound.className='video-sound';sound.setAttribute('aria-pressed','false');
 const play=doc.createElement('button');play.type='button';play.className='video-play';play.hidden=true;play.innerHTML=svg('<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>');
 const open=doc.createElement('a');open.className='video-open';open.hidden=true;open.target='_blank';open.rel='noopener noreferrer';
 root.append(video,sound,play,open);
 let loaded=false,visible=priority,destroyed=false,backup=false,selected,manuallyStarted=false;
 const reduced=win.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 const state=documentPlayers(doc);
 const setText=(node,key,value)=>{if(node.getAttribute(key)!==value)node.setAttribute(key,value);};
 function labels(){
  setText(sound,'aria-label',tr(video.muted?'Включить звук видео':'Выключить звук видео'));setText(sound,'title',sound.getAttribute('aria-label'));
  setText(sound,'aria-pressed',String(!video.muted));setText(play,'aria-label',tr('Воспроизвести видео'));
  if(sound.dataset.muted!==String(video.muted)){sound.dataset.muted=String(video.muted);sound.innerHTML=svg(SPEAKER+(video.muted?MUTE:SOUND));}
  const text=tr('Открыть видео');if(open.textContent!==text)open.textContent=text;
 }
 function load(){
  if(loaded||destroyed)return;
  selected=chooseVideoSource(entry,win);const source=mediaURL(selected.src);if(!source)return;
  loaded=true;video.src=source;video.preload=priority?'auto':'metadata';open.href=source;
 }
 function start(){
  if(destroyed||(!visible&&video.muted)||doc.hidden)return;
  load();if(!loaded)return;
  if(reduced&&!manuallyStarted){play.hidden=false;return;}
  Promise.resolve(video.play()).then(()=>{if(!destroyed)play.hidden=true;}).catch(()=>{if(!destroyed)play.hidden=false;});
 }
 function refreshPlayback(){if(doc.hidden||(video.muted&&!visible))video.pause();else start();}
 function mute(){video.muted=true;labels();refreshPlayback();}
 function foreground(){
  for(const media of doc.querySelectorAll('audio,video'))if(media!==video){if(media.tagName==='VIDEO')media.muted=true;else media.pause();}
  win.dispatchEvent(new win.Event('syolana:foreground-media'));
 }
 sound.addEventListener('click',()=>{manuallyStarted=true;if(video.muted){foreground();video.muted=false;}else video.muted=true;labels();load();Promise.resolve(video.play()).then(()=>{play.hidden=true;}).catch(()=>{video.muted=true;labels();play.hidden=false;});});
 play.addEventListener('click',()=>{manuallyStarted=true;load();Promise.resolve(video.play()).then(()=>{play.hidden=true;}).catch(()=>{video.controls=true;play.hidden=true;});});
 video.addEventListener('volumechange',labels);
 video.addEventListener('error',()=>{const source=mediaURL(selected?.backup);if(source&&!backup){backup=true;video.src=source;open.href=source;if(entry.posterBackup)video.poster=mediaURL(entry.posterBackup);start();}else{open.hidden=false;play.hidden=true;}});
 const observer=typeof win.IntersectionObserver==='function'?new win.IntersectionObserver(entries=>{for(const item of entries)if(item.target===root){visible=item.isIntersecting;refreshPlayback();}},{rootMargin:'180px 0px',threshold:0}):null;
 const controller={root,video,connected:false,labels,mute,refreshPlayback,destroy(){if(destroyed)return;destroyed=true;observer?.disconnect();video.pause();video.removeAttribute('src');video.load();state.players.delete(controller);}};
 state.players.add(controller);labels();observer?.observe(root);
 if(priority||!observer){visible=true;start();}
 return root;
}

export function showcaseEntry(id){return catalog.videos.find(video=>video.id===id);}
export function mountShowcaseBanner(banner,{random=Math.random}={}){
 const doc=banner.ownerDocument;
 if(!selections.has(doc))selections.set(doc,selectBannerVariant(random));
 const selected=selections.get(doc);banner.dataset.videoVariant=selected;
 if(selected==='none')return selected;
 if(banner.querySelector('[data-showcase-video]'))return selected;
 const player=createShowcaseVideo(showcaseEntry(selected),{doc,priority:true});
 if(player){banner.classList.add('video-banner');banner.replaceChildren(player);}
 return selected;
}
