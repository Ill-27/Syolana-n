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
 ,'САЙТЫ И ВИДЕО':['WEBSITES AND VIDEO','SITIOS Y VÍDEOS','SITES ET VIDÉOS']
 ,'Сайты и видео по вашей идее':['Websites and videos inspired by your idea','Sitios y vídeos a partir de tu idea','Sites et vidéos à partir de votre idée']
 ,'Живые темы, видеобаннеры, клипы и мультфильмы — для бренда или в подарок близкому.':['Living themes, video banners, music videos and animated films — for your brand or a gift for someone you love.','Temas animados, videobanners, videoclips y cortos de animación: para tu marca o como regalo para alguien especial.','Thèmes animés, bannières vidéo, clips et films d’animation : pour votre marque ou pour offrir à un proche.']
 ,'Стоимость и сроки согласуем под вашу задачу.':['We agree on the price and delivery time for your project.','Acordamos el precio y los plazos según tu proyecto.','Nous convenons du prix et des délais selon votre projet.']
 ,'Заказать видео':['Order a video','Encargar un vídeo','Commander une vidéo']
 ,'Оформить сайт':['Design my website','Diseñar mi sitio','Créer mon site']
});

const selections=new WeakMap(),documents=new WeakMap();
const SPEAKER='<path d="M4 9v6h4l5 4V5L8 9H4"/>';
const SOUND='<path d="M16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>';
const MUTE='<path d="m17 9 5 6m0-6-5 6"/>';
const svg=paths=>'<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+paths+'</svg>';

export function selectBannerVariant(random=Math.random){return random()<.5?'short':'long';}
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
#banner.showcase-hero{position:relative;display:block!important;isolation:isolate;width:100%;padding:0!important;min-height:0!important;overflow:hidden;border-radius:clamp(18px,2.5vw,28px);background:rgba(8,10,20,.26)!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;border:1px solid rgba(255,255,255,.22);box-shadow:0 18px 54px #0002}
#banner.showcase-hero::before,#banner.showcase-hero::after{display:none!important}
#banner.showcase-hero>.showcase-film{position:relative;width:100%;max-width:none;margin:0;border-radius:0;background:#030309}
#banner.showcase-hero .showcase-copy{position:relative;isolation:isolate;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:14px 26px;padding:clamp(18px,2.4vw,30px);overflow:hidden;background:linear-gradient(115deg,rgba(8,10,20,.78),rgba(8,10,20,.64));color:#fff}
#banner.showcase-hero .showcase-copy::before{content:'';position:absolute;inset:-35px;z-index:-1;background:var(--showcase-backdrop) center/cover no-repeat;filter:blur(24px) saturate(.8);opacity:.34;pointer-events:none}
#banner.showcase-hero .showcase-kicker{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin:0 0 12px;color:#e7e9f2;font:600 11px/1.4 system-ui,sans-serif;letter-spacing:.12em}
#banner.showcase-hero .banner-brandmark{margin:0;padding:5px 9px 5px 6px;min-height:28px;letter-spacing:.12em}#banner.showcase-hero .banner-brandmark img{width:20px;height:20px}
#banner.showcase-hero .showcase-title{max-width:none;margin:0 0 10px;color:#fff!important;font:400 clamp(1.8rem,3.1vw,2.75rem)/1.12 "Syolana Script",cursive;letter-spacing:0;text-shadow:0 2px 12px #0004;text-wrap:balance}
#banner.showcase-hero .showcase-description{max-width:650px;margin:0;color:#f0f0f6!important;font:400 clamp(.94rem,1.25vw,1.02rem)/1.55 system-ui,sans-serif}
#banner.showcase-hero .showcase-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;align-self:end}
#banner.showcase-hero .showcase-actions .btn{display:flex!important;align-items:center;justify-content:center;box-sizing:border-box;min-height:48px;margin:0;padding:12px 18px!important;border-radius:999px;border:1px solid #ffffff50;background:rgba(255,255,255,.07);color:#fff!important;font:650 14px/1.3 system-ui,sans-serif;text-align:center;text-decoration:none;white-space:normal;box-shadow:none;transition:background-color .18s ease,transform .18s ease}
#banner.showcase-hero .showcase-actions .primary{background:#f6f3fc!important;color:#171323!important;border-color:transparent!important}
#banner.showcase-hero .showcase-actions .btn:hover{transform:translateY(-1px);background-color:rgba(255,255,255,.16)}
#banner.showcase-hero .showcase-note{grid-column:1/-1;margin:0;color:#d6d9e4!important;font:400 13px/1.5 system-ui,sans-serif}
@media(max-width:760px){#banner.showcase-hero .showcase-copy{grid-template-columns:minmax(0,1fr);gap:16px}#banner.showcase-hero .showcase-actions{width:100%;grid-column:1}#banner.showcase-hero .showcase-note{margin-top:-6px}#banner.showcase-hero .showcase-kicker{margin-bottom:10px}#banner.showcase-hero .showcase-actions .btn{padding-inline:12px!important}}
@media(prefers-reduced-motion:reduce){#banner.showcase-hero .showcase-actions .btn{transition:none}}
.feed-post>.syolana-video{margin:20px 0!important}
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
export function mountShowcaseBanner(banner,{random=Math.random,contactURL='https://www.avito.ru/brands/i223140984'}={}){
 const doc=banner.ownerDocument;
 if(!selections.has(doc))selections.set(doc,selectBannerVariant(random));
 const selected=selections.get(doc);banner.dataset.videoVariant=selected;
 if(banner.querySelector('[data-showcase-video]'))return selected;
 const entry=showcaseEntry(selected),player=createShowcaseVideo(entry,{doc,priority:true});
 if(!player)return selected;
 const make=(tag,className,text)=>{const node=doc.createElement(tag);node.className=className;if(text)node.textContent=tr(text);return node;};
 const copy=make('div','showcase-copy'),words=make('div','showcase-words'),kicker=make('div','showcase-kicker');
 const brand=make('div','banner-brandmark syolana-passport-button'),logo=doc.createElement('img');logo.src=new URL('assets/logo.svg',doc.baseURI).href;logo.width=20;logo.height=20;logo.alt='';logo.decoding='async';brand.append(logo,make('span','','SYOLANA'));
 kicker.append(brand,make('span','','САЙТЫ И ВИДЕО'));
 words.append(kicker,make('h2','showcase-title','Сайты и видео по вашей идее'),make('p','showcase-description','Живые темы, видеобаннеры, клипы и мультфильмы — для бренда или в подарок близкому.'));
 const actions=make('div','showcase-actions'),order=make('a','btn primary','Заказать видео'),site=make('a','btn banner-secondary','Оформить сайт');
 try{const url=new URL(contactURL);order.href=url.protocol==='https:'&&!url.username&&!url.password?url.href:'https://www.avito.ru/brands/i223140984';}catch{order.href='https://www.avito.ru/brands/i223140984';}
 order.target='_blank';order.rel='noopener noreferrer';site.href='#/create-site';actions.append(order,site);
 copy.append(words,actions,make('p','showcase-note','Стоимость и сроки согласуем под вашу задачу.'));
 player.classList.add('showcase-film');banner.classList.add('showcase-hero');banner.style.setProperty('--showcase-backdrop','url("'+mediaURL(entry.poster)+'")');
 banner.replaceChildren(player,copy);
 return selected;
}
