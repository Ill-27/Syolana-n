import {getLocale,setLocale,tr,localeCode,metaFor} from './i18n.js?v=20261012-i18n-1';

const textSource=new WeakMap(),attrSource=new WeakMap(),valueSource=new WeakMap(),dirtyValues=new WeakSet();
const SKIP='script,style,code,pre,[data-i18n-skip]';
const EXTRA={
 'Мой проект':['My project','Mi proyecto','Mon projet'],
 'АВТОРСКИЙ ПРОЕКТ':['INDEPENDENT PROJECT','PROYECTO DE AUTOR','PROJET D’AUTEUR'],
 'Коротко расскажите, чем вы занимаетесь и почему это важно.':['Briefly explain what you do and why it matters.','Explica brevemente qué haces y por qué es importante.','Présentez brièvement votre activité et ce qui la rend importante.'],
 'Расскажите о себе, подходе или проекте.':['Tell visitors about you, your approach or your project.','Habla de ti, de tu enfoque o de tu proyecto.','Présentez-vous, votre démarche ou votre projet.'],
 'Что мы предлагаем':['What we offer','Lo que ofrecemos','Ce que nous proposons'],
 'Опишите основные направления, услуги или материалы.':['Describe your main activities, services or materials.','Describe tus principales actividades, servicios o contenidos.','Décrivez vos principales activités, services ou contenus.'],
 'Опишите, какие работы или изображения должны быть показаны.':['Describe the work or images you want to show.','Describe las obras o imágenes que quieres mostrar.','Décrivez les œuvres ou images que vous souhaitez présenter.'],
 'Частые вопросы':['Frequently asked questions','Preguntas frecuentes','Questions fréquentes'],
 'Напишите вопросы и короткие ответы, которые важно увидеть посетителю.':['Add the questions and short answers visitors should see.','Añade las preguntas y respuestas breves que deberían ver los visitantes.','Ajoutez les questions et réponses courtes que les visiteurs devraient voir.'],
 'Связаться':['Contact','Contactar','Contacter'],
 'Например: Atelier Nocturne':['For example: Atelier Nocturne','Por ejemplo: Atelier Nocturne','Par exemple : Atelier Nocturne'],
 'СТУДИЯ · АВТОР · ПРОЕКТ':['STUDIO · CREATOR · PROJECT','ESTUDIO · AUTOR · PROYECTO','STUDIO · AUTEUR · PROJET'],
 'Очистить этот локальный эскиз?':['Clear this local draft?','¿Borrar este boceto local?','Effacer cette ébauche locale ?'],
 'Скопировано':['Copied','Copiado','Copié'],
 'Поднять':['Move up','Subir','Monter'],
 'Опустить':['Move down','Bajar','Descendre'],
 'Убрать блок':['Remove section','Quitar sección','Retirer le bloc'],
 'Проект':['Project','Proyecto','Projet'],
 'Описание':['Description','Descripción','Description'],
 'Направления':['Activities','Servicios','Activités'],
 'Кнопка':['Button','Botón','Bouton'],
 'Контакт':['Contact','Contacto','Contact'],
 'Публикации':['Posts','Publicaciones','Publications'],
 'Тема':['Theme','Tema','Thème'],
 'Блоки':['Sections','Secciones','Blocs']
};
const IDX={en:0,es:1,fr:2};
let applying=false;
function norm(v){return String(v??'').replace(/\s+/g,' ').trim();}
function xtr(source,locale=getLocale()){const base=tr(source,locale);if(base!==String(source??''))return base;if(locale==='ru')return String(source??'');const row=EXTRA[norm(source)];return row?.[IDX[locale]]||String(source??'');}
function knownSource(value){return ['en','es','fr'].some(locale=>xtr(value,locale)!==String(value??''));}
function shouldSkip(node){const el=node.nodeType===1?node:node.parentElement;return !el||!!el.closest(SKIP);}
function replaceTrimmed(raw,value){const lead=(raw.match(/^\s*/)||[''])[0],tail=(raw.match(/\s*$/)||[''])[0];return lead+value+tail;}
function translateText(node){if(node.nodeType!==Node.TEXT_NODE||shouldSkip(node))return;if(!textSource.has(node))textSource.set(node,node.nodeValue||'');const source=textSource.get(node),clean=norm(source);if(!clean)return;const out=xtr(clean);node.nodeValue=getLocale()==='ru'?source:(out!==clean?replaceTrimmed(source,out):source);}
function translateValue(el){if(!(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement)||dirtyValues.has(el)||!el.closest('.sketch-field'))return;const current=el.value;if(!valueSource.has(el)&&knownSource(current))valueSource.set(el,current);const source=valueSource.get(el);if(source==null)return;el.value=getLocale()==='ru'?source:xtr(source);}
function translateAttrs(el){
 if(!(el instanceof Element)||shouldSkip(el))return;const attrs=['aria-label','title','placeholder'];let saved=attrSource.get(el);if(!saved){saved={};attrSource.set(el,saved);}
 for(const name of attrs){if(!el.hasAttribute(name))continue;const current=el.getAttribute(name)||'';if(!(name in saved))saved[name]=current;else{const rendered=getLocale()==='ru'?saved[name]:xtr(saved[name]);if(current!==rendered&&knownSource(current))saved[name]=current;}const source=saved[name];el.setAttribute(name,getLocale()==='ru'?source:xtr(source));}
 translateValue(el);
}
function walk(root=document){if(root.nodeType===Node.TEXT_NODE){translateText(root);return;}if(root instanceof Element)translateAttrs(root);const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)translateText(n);else translateAttrs(n);}}
function syncMeta(){const m=metaFor();document.title=m.title;document.querySelector('meta[name="description"]')?.setAttribute('content',m.description);document.querySelector('meta[property="og:title"]')?.setAttribute('content',m.title);document.querySelector('meta[property="og:description"]')?.setAttribute('content',m.description);document.querySelector('meta[name="twitter:title"]')?.setAttribute('content',m.title);document.querySelector('meta[name="twitter:description"]')?.setAttribute('content',m.description);}
function syncBannerTitle(){const h=document.querySelector('#banner .banner-copy h2');if(!h)return;const one=xtr('Живой дизайн'),two=xtr('для вашего сайта');const spans=[...h.querySelectorAll(':scope > .banner-title-line')];if(spans.length===2&&spans[0].textContent===one&&spans[1].textContent===two)return;const a=document.createElement('span'),b=document.createElement('span');a.className=b.className='banner-title-line';a.textContent=one;b.textContent=two;h.replaceChildren(a,b);h.dataset.i18nSkip='title';}
function addStyle(){if(document.getElementById('syolana-language-style'))return;const s=document.createElement('style');s.id='syolana-language-style';s.textContent=`
.top-actions{position:relative}.syolana-lang{position:absolute;right:0;top:58px;z-index:260;pointer-events:auto}.syolana-lang-toggle{position:relative;width:47px!important;height:47px!important;padding:0!important}.syolana-lang-toggle svg{width:21px;height:21px}.syolana-lang-code{position:absolute;right:-2px;bottom:-3px;min-width:23px;height:18px;padding:0 4px;border-radius:9px;border:1px solid rgba(236,225,255,.28);background:rgba(11,15,29,.94);display:grid;place-items:center;font:800 9px/1 system-ui,sans-serif;letter-spacing:.04em}.syolana-lang-menu{position:absolute;right:0;top:55px;width:188px;padding:8px;border:1px solid rgba(224,211,255,.22);border-radius:18px;background:rgba(7,11,23,.92);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);box-shadow:0 24px 65px rgba(0,0,0,.32);display:grid;gap:4px}.syolana-lang-menu[hidden]{display:none!important}.syolana-lang-menu button{min-height:42px;padding:9px 11px;border:0;border-radius:12px;background:transparent;color:#f8f6ff;text-align:left;font:650 .88rem/1.2 var(--body,system-ui);display:flex;align-items:center;justify-content:space-between;gap:10px}.syolana-lang-menu button:hover,.syolana-lang-menu button[aria-current="true"]{background:rgba(255,255,255,.075)}.syolana-lang-menu small{color:var(--dim,#cfc8dc);font-size:.72rem}.banner-copy h2{font-size:clamp(2.15rem,8vw,4.8rem)!important;line-height:.94!important}.banner-title-line{display:block;white-space:nowrap}.banner-title-line+.banner-title-line{margin-top:.08em}body.zen .syolana-lang{display:none!important}@media(max-width:520px){.syolana-lang{top:56px}.syolana-lang-menu{width:172px}.banner-copy h2{font-size:clamp(2rem,8.2vw,3.1rem)!important;letter-spacing:-.02em}.banner-title-line{white-space:nowrap}}
`;document.head.append(s);}
function mount(){
 addStyle();const actions=document.querySelector('.top-actions');if(!actions||document.getElementById('syolana-lang'))return;const wrap=document.createElement('div');wrap.id='syolana-lang';wrap.className='syolana-lang';wrap.dataset.i18nSkip='controls';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='icon-btn glass syolana-lang-toggle';toggle.setAttribute('aria-haspopup','menu');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z"></path></svg><span class="syolana-lang-code"></span>';
 const menu=document.createElement('div');menu.className='syolana-lang-menu';menu.hidden=true;menu.setAttribute('role','menu');const labels={ru:['Русский','RU'],en:['English','EN'],es:['Español','ES'],fr:['Français','FR']};
 for(const locale of Object.keys(labels)){const b=document.createElement('button');b.type='button';b.dataset.locale=locale;b.setAttribute('role','menuitem');const [name,code]=labels[locale];b.innerHTML='<span>'+name+'</span><small>'+code+'</small>';b.onclick=()=>{setLocale(locale);menu.hidden=true;toggle.setAttribute('aria-expanded','false');};menu.append(b);}toggle.onclick=e=>{e.stopPropagation();menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};wrap.append(toggle,menu);actions.append(wrap);document.addEventListener('click',e=>{if(!wrap.contains(e.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}});syncControl();
}
function syncControl(){const locale=getLocale();document.documentElement.lang=locale;const code=document.querySelector('.syolana-lang-code');if(code)code.textContent=localeCode(locale);const toggle=document.querySelector('.syolana-lang-toggle');if(toggle){toggle.setAttribute('aria-label',xtr('Язык интерфейса'));toggle.title=xtr('Язык интерфейса');}document.querySelectorAll('.syolana-lang-menu button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.locale===locale)));}
function apply(root=document){if(applying)return;applying=true;try{document.documentElement.lang=getLocale();walk(root);syncMeta();syncBannerTitle();syncControl();}finally{applying=false;}}
mount();apply();
document.addEventListener('input',e=>{if((e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)&&e.target.closest('.sketch-field'))dirtyValues.add(e.target);},true);
window.addEventListener('syolana:locale',()=>apply(document));
let queued=false;const observer=new MutationObserver(records=>{if(applying)return;const roots=[];for(const r of records){if(r.type==='childList')for(const n of r.addedNodes)roots.push(n);else if(r.target instanceof Element)roots.push(r.target);}if(!roots.length||queued)return;queued=true;requestAnimationFrame(()=>{queued=false;for(const r of roots)if(r.isConnected)walk(r);syncBannerTitle();syncControl();});});observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-label','title','placeholder']});
export {apply as applyI18n};
