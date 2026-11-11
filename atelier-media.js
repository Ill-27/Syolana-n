import {el,button} from './utils.js';
import {registerTranslations,tr} from './i18n.js';

registerTranslations({
 'Иммерсивная книга — живой образец':['Immersive book — live example','Libro inmersivo — ejemplo vivo','Livre immersif — exemple vivant'],
 'Открыть и прочитать':['Open and read','Abrir y leer','Ouvrir et lire'],
 'Открыть живой макет':['Open the live design','Abrir el diseño vivo','Ouvrir la maquette vivante'],
 'Закрыть пример':['Close example','Cerrar ejemplo','Fermer l’exemple'],
 'Живой пример оформления':['Live design example','Ejemplo de diseño vivo','Exemple d’habillage vivant'],
 'Книга · единый мягкий фон':['Book · one soft backdrop','Libro · fondo suave unificado','Livre · décor doux et continu'],
 'Глэмпинг · стеклянные блоки':['Glamping · glass panels','Glamping · paneles de cristal','Glamping · panneaux de verre'],
 'Студия · смешанное оформление':['Studio · a combined design','Estudio · diseño combinado','Studio · habillage mixte']
});

const designs={
 book:{src:'examples/book.html',poster:'assets/atelier/scene-3e91dca1d27d3e.webp',width:440,label:'Книга · единый мягкий фон'},
 glamping:{src:'examples/glamping.html',poster:'assets/atelier/scene-662c9e320fb3c0.webp',width:760,label:'Глэмпинг · стеклянные блоки'},
 studio:{src:'examples/studio.html',poster:'themes/previews/amber-forest.jpg',width:760,label:'Студия · смешанное оформление'}
};
let observer,resize,eventsReady=false,viewer;
const previews=new Map();
const motion=()=>!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
function dimensions(state){const width=state.root.getBoundingClientRect().width;if(!width)return;const scale=width/state.spec.width;state.root.style.setProperty('--preview-scale',String(scale));state.root.style.setProperty('--preview-width',state.spec.width+'px');state.root.style.setProperty('--preview-height',Math.ceil(state.root.getBoundingClientRect().height/scale)+'px');}
function tell(state){state.frame?.contentWindow?.postMessage({syolanaPreviewState:true,active:state.visible&&!document.hidden&&!viewer?.open&&motion()},location.origin);}
function activate(state){
 if(state.frame||!state.root.isConnected||!motion())return;
 const frame=el('iframe');frame.title=tr(state.spec.label);frame.src=state.spec.src+'?preview=card';frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.setAttribute('sandbox','allow-scripts allow-same-origin');frame.loading='lazy';frame.referrerPolicy='no-referrer';
 state.frame=frame;dimensions(state);state.root.append(frame);frame.addEventListener('load',()=>{tell(state);state.root.classList.add('preview-loaded');});
}
function initialize(){
 if(eventsReady)return;eventsReady=true;
 if(typeof window.IntersectionObserver==='function')observer=new window.IntersectionObserver(rows=>{for(const row of rows){const state=previews.get(row.target);if(!state)continue;state.visible=row.isIntersecting;if(state.visible)activate(state);tell(state);}},{rootMargin:'100px 0px',threshold:0});
 if(typeof window.ResizeObserver==='function')resize=new window.ResizeObserver(rows=>{for(const row of rows){const state=previews.get(row.target);if(state)dimensions(state);}});
 document.addEventListener('visibilitychange',()=>{for(const state of previews.values())tell(state);});
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  for(const state of previews.values())if(event.source===state.frame?.contentWindow&&event.data?.syolanaPreviewReady){tell(state);return;}
  if(event.source===viewer?.querySelector('iframe')?.contentWindow&&event.data?.syolanaDemoSound)window.dispatchEvent(new Event('syolana:foreground-media'));
 });
 window.addEventListener('resize',()=>{for(const state of previews.values())if(state.visible)dimensions(state);},{passive:true});
}
export function openAtelierExample(kind){
 const spec=designs[kind];if(!spec)return;
 initialize();
 if(!viewer){
  viewer=el('dialog','atelier-viewer');viewer.setAttribute('aria-label',tr('Живой пример оформления'));
  const close=button(tr('Закрыть пример'),()=>viewer.close(),'atelier-viewer-close');viewer.append(close);document.body.append(viewer);
  viewer.addEventListener('close',()=>{viewer.querySelector('iframe')?.remove();document.body.classList.remove('atelier-viewing');for(const state of previews.values())tell(state);});
 }
 viewer.querySelector('iframe')?.remove();const frame=el('iframe');frame.src=spec.src;frame.title=tr(spec.label);frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');frame.allowFullscreen=true;viewer.append(frame);
 document.body.classList.add('atelier-viewing');viewer.showModal();for(const state of previews.values())tell(state);
}
export function liveAtelierPreview(kind,{hero=false,doc=document,action=true}={}){
 const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;};
 const spec=designs[kind],root=make('div','atelier-preview'+(hero?' atelier-preview-hero':''));root.dataset.previewKind=kind;
 const surface=make('div','atelier-preview-surface'),poster=make('img');poster.src=spec.poster;poster.alt='';poster.decoding='async';poster.loading=hero?'eager':'lazy';poster.width=760;poster.height=570;surface.append(poster);
 const open=make('button','atelier-preview-open',hero?'Открыть и прочитать':'Открыть живой макет');open.type='button';open.onclick=()=>openAtelierExample(kind);open.setAttribute('aria-label',hero?'Открыть и прочитать':spec.label);const arrow=doc.createElementNS('http://www.w3.org/2000/svg','svg'),arrowPath=doc.createElementNS('http://www.w3.org/2000/svg','path');arrow.setAttribute('viewBox','0 0 20 20');arrow.setAttribute('aria-hidden','true');arrowPath.setAttribute('d','M4 16 16 4M4 4h12v12');arrowPath.setAttribute('fill','none');arrowPath.setAttribute('stroke','currentColor');arrowPath.setAttribute('stroke-width','1.25');arrow.append(arrowPath);open.append(arrow);if(!action){open.classList.add('atelier-preview-overlay');}root.append(surface,open);
 const state={root:surface,spec,visible:false,frame:null};
 queueMicrotask(()=>{if(!root.isConnected||typeof window==='undefined'||!window.IntersectionObserver)return;initialize();for(const [node,old]of previews)if(!node.isConnected){observer?.unobserve(node);resize?.unobserve(node);previews.delete(node);}previews.set(surface,state);observer?.observe(surface);resize?.observe(surface);if(!observer&&typeof window.IntersectionObserver==='function')activate(state);});
 return root;
}

const paths={
 scissors:'M22 28C7 43 2 29 9 25c9-5 16 10 22 19M23 31 52 8M27 36 56 51M23 28C13 9 1 14 6 24c4 8 14 2 18 2M28 31l8 1',
 spool:'M18 13c0-8 30-8 30 0s-30 8-30 0Zm2 1 2 30m24-30-2 30M17 45c0-8 32-8 32 0s-32 8-32 0Zm6-23 21 5m-21 2 21 5m-21 2 21 4M46 45c19 2 9 13 0 11',
 needle:'M19 48 44 11c5-7 10-4 7 3L24 52l-8 7 3-11Zm24-32 5-7M45 12C22-2 5 12 15 21c6 6 15-3 21 3',
 pattern:'m15 8 14 5 14-5 10 16-10 9v20H16V33L5 24 15 8Zm14 5v14m-13 8h27M23 51l1-9h12l1 9M9 22l9 6m30-6-8 6',
 ruler:'M8 17 45 6l13 41-38 12L8 17Zm9 1 4 10m4-12 3 7m5-10 4 10m4-12 3 7M16 38l4 12m4-15 2 7m6-9 4 10m4-12 2 7'
};
export function atelierGlyph(kind='needle',className='atelier-glyph',doc=document){
 const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg'),path=doc.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');svg.setAttribute('class',className);path.setAttribute('d',paths[kind]||paths.needle);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.1');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
