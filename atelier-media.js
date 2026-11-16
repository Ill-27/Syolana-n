import {el,button} from './utils.js';
import {registerTranslations,tr} from './i18n.js';

registerTranslations({
 'Открыть живой макет':['Open the live design','Abrir el diseño vivo','Ouvrir la maquette vivante'],
 'Закрыть пример':['Close example','Cerrar ejemplo','Fermer l’exemple'],
 'Живой пример оформления':['Live design example','Ejemplo de diseño vivo','Exemple d’habillage vivant'],
 'Открыть пример отдельной страницей':['Open the example in a separate page','Abrir el ejemplo en otra página','Ouvrir l’exemple sur une page séparée'],
 'Книга · единый мягкий фон':['Book · one soft backdrop','Libro · fondo suave unificado','Livre · décor doux et continu'],
 'Глэмпинг · стеклянные блоки':['Glamping · glass panels','Glamping · paneles de cristal','Glamping · panneaux de verre'],
 'Студия · смешанное оформление':['Studio · a combined design','Estudio · diseño combinado','Studio · habillage mixte']
});
const designs={
 book:{src:'examples/book.html',poster:'assets/atelier/preview-book.jpg',backdrop:'assets/atelier/scene-3e91dca1d27d3e.webp',width:440,height:330,label:'Книга · единый мягкий фон'},
 glamping:{src:'examples/glamping.html',poster:'assets/atelier/preview-glamping.jpg',backdrop:'assets/atelier/scene-662c9e320fb3c0.webp',width:760,height:570,label:'Глэмпинг · стеклянные блоки'},
 studio:{src:'examples/studio.html',poster:'assets/atelier/preview-studio.jpg',backdrop:'themes/previews/amber-forest.jpg',width:760,height:570,label:'Студия · смешанное оформление'}
};
let eventsReady=false,viewer,viewerTimer,opener;
function clearBusy(){opener?.removeAttribute('aria-busy');opener=null;}
function cancelPreparation(){
 if(!viewer?.hasAttribute('data-preparing'))return;
 clearTimeout(viewerTimer);clearBusy();viewer.querySelector('iframe')?.remove();
 delete viewer.dataset.preparing;viewer.inert=false;viewer.removeAttribute('aria-hidden');
}
function revealViewer(){
 clearBusy();delete viewer.dataset.preparing;viewer.inert=false;viewer.removeAttribute('aria-hidden');
 if(viewer.open)return;
 viewer.showModal();document.body.classList.add('atelier-viewing');
 window.dispatchEvent(new CustomEvent('syolana:atelier-viewer',{detail:{open:true}}));
}
function initialize(){
 if(eventsReady)return;eventsReady=true;
 document.addEventListener('keydown',event=>{if(event.key==='Escape')cancelPreparation();});
 document.addEventListener('click',event=>{if(event.target.closest?.('#main-nav a'))cancelPreparation();});
 window.addEventListener('hashchange',cancelPreparation);
 window.addEventListener('message',event=>{
  if(event.origin!==location.origin)return;
  const frame=viewer?.querySelector('iframe');
  if(frame&&event.source===frame.contentWindow){
   if(event.data?.syolanaDemoReady){
    clearTimeout(viewerTimer);delete viewer.dataset.stalled;viewer.classList.add('demo-ready');
    viewer.querySelector('.atelier-viewer-fallback').hidden=true;revealViewer();
   }
   if(event.data?.syolanaDemoSound)window.dispatchEvent(new Event('syolana:foreground-media'));
  }
 });
}
export function openAtelierExample(kind){
 const spec=designs[kind];if(!spec)return;initialize();
 if(viewer?.dataset.preparing===kind||viewer?.open)return;
 if(!viewer){
  viewer=el('dialog','atelier-viewer');viewer.setAttribute('aria-label',tr('Живой пример оформления'));
  const close=button(tr('Закрыть пример'),()=>viewer.close(),'atelier-viewer-close');close.setAttribute('aria-label',tr('Закрыть пример'));viewer.append(close);
  const fallback=el('a','atelier-viewer-fallback',tr('Открыть пример отдельной страницей'));fallback.target='_blank';fallback.rel='noopener';fallback.hidden=true;viewer.append(fallback);document.body.append(viewer);
  viewer.addEventListener('close',()=>{clearTimeout(viewerTimer);clearBusy();viewer.querySelector('iframe')?.remove();document.body.classList.remove('atelier-viewing');window.dispatchEvent(new CustomEvent('syolana:atelier-viewer',{detail:{open:false}}));});
 }
 clearTimeout(viewerTimer);clearBusy();viewer.querySelector('iframe')?.remove();viewer.classList.remove('demo-ready');delete viewer.dataset.stalled;
 opener=document.activeElement?.matches('button,a')?document.activeElement:null;opener?.setAttribute('aria-busy','true');
 viewer.dataset.preparing=kind;viewer.inert=true;viewer.setAttribute('aria-hidden','true');
 viewer.style.setProperty('--viewer-backdrop','url("'+spec.backdrop+'")');const fallback=viewer.querySelector('.atelier-viewer-fallback');fallback.hidden=true;fallback.href=spec.src;
 const frame=el('iframe');frame.title=tr(spec.label);frame.referrerPolicy='no-referrer';frame.setAttribute('sandbox','allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox');frame.allowFullscreen=true;
 frame.addEventListener('load',()=>frame.contentWindow?.postMessage({syolanaRequestReady:true},location.origin));frame.src=spec.src;viewer.append(frame);
 viewerTimer=setTimeout(()=>{if(!viewer.classList.contains('demo-ready')){viewer.dataset.stalled='true';fallback.hidden=false;revealViewer();}},12000);
}
export function liveAtelierPreview(kind,{doc=document,action=true}={}){
 const make=(tag,cls,text)=>{const e=doc.createElement(tag);if(cls)e.className=cls;if(text)e.textContent=text;return e;},spec=designs[kind];
 const root=make('div','atelier-preview');root.dataset.previewKind=kind;
 const surface=make('div','atelier-preview-surface'),poster=make('img');poster.src=spec.poster;poster.alt='';poster.decoding='sync';poster.loading='eager';poster.width=spec.width;poster.height=spec.height;surface.append(poster);
 const open=make('button','atelier-preview-open','Открыть живой макет');open.type='button';open.onclick=()=>openAtelierExample(kind);open.setAttribute('aria-label',spec.label);if(!action)open.classList.add('atelier-preview-overlay');root.append(surface,open);
 return root;
}

const paths={
 scissors:'M22 28C7 43 2 29 9 25c9-5 16 10 22 19M23 31 52 8M27 36 56 51M23 28C13 9 1 14 6 24c4 8 14 2 18 2M28 31l8 1',
 spool:'M18 13c0-8 30-8 30 0s-30 8-30 0Zm2 1 2 30m24-30-2 30M17 45c0-8 32-8 32 0s-32 8-32 0Zm6-23 21 5m-21 2 21 5m-21 2 21 4M46 45c19 2 9 13 0 11',
 needle:'M19 48 44 11c5-7 10-4 7 3L24 52l-8 7 3-11Zm24-32 5-7M45 12C22-2 5 12 15 21c6 6 15-3 21 3',
 pattern:'m15 8 14 5 14-5 10 16-10 9v20H16V33L5 24 15 8Zm14 5v14m-13 8h27M23 51l1-9h12l1 9M9 22l9 6m30-6-8 6',
 ruler:'M8 17 45 6l13 41-38 12L8 17Zm9 1 4 10m4-12 3 7m5-10 4 10m4-12 3 7M16 38l4 12m4-15 2 7m6-9 4 10m4-12 2 7',
 film:'M12 15h40v37H12V15Zm0 12h40M22 15l5-9m10 9 5-9M28 33l12 7-12 7V33Z',
 book:'M32 16C23 9 12 11 7 14v39c9-5 17-3 25 2 8-5 16-7 25-2V14c-8-4-17-3-25 2Zm0 0v39'
};
export function atelierGlyph(kind='needle',className='atelier-glyph',doc=document){
 const ns='http://www.w3.org/2000/svg',svg=doc.createElementNS(ns,'svg'),path=doc.createElementNS(ns,'path');svg.setAttribute('viewBox','0 0 64 64');svg.setAttribute('aria-hidden','true');svg.setAttribute('class',className);path.setAttribute('d',paths[kind]||paths.needle);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.1');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);return svg;
}
