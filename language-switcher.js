import {getLocale,setLocale,tr,sourceFor,localeCode,metaFor} from './i18n.js';
const texts=new WeakMap(),attributes=new WeakMap();
const SKIP='script,style,code,[data-i18n-skip],.poem-text,.book-text,.reader-text,.sketch-site,.partner-site-content,.song-title,#dock-title,#player-name,.book-title,.book-author';
function skip(node){if(node.nodeType===Node.TEXT_NODE&&node.parentElement?.hasAttribute('data-original-title'))return true;return !!(node.nodeType===1?node:node.parentElement)?.closest(SKIP);}
function updateText(node,restore=false){
 if(skip(node))return;const current=node.nodeValue||'';let saved=texts.get(node);
 if(!saved||current!==saved.last){const clean=sourceFor(current),lead=current.match(/^\s*/)?.[0]||'',tail=current.match(/\s*$/)?.[0]||'';saved={source:lead+clean.trim()+tail,last:current};texts.set(node,saved);}
 const clean=saved.source.trim();const next=restore||getLocale()==='ru'?saved.source:(clean?saved.source.replace(clean,tr(clean)):saved.source);
 if(next!==current)node.nodeValue=next;saved.last=next;
}
function updateAttributes(el,restore=false){
 if(skip(el))return;let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}
 for(const name of ['aria-label','title','placeholder','alt']){
  if(!el.hasAttribute(name))continue;const current=el.getAttribute(name);let state=saved[name];
  if(!state||current!==state.last)state=saved[name]={source:sourceFor(current),last:current};
  const next=restore||getLocale()==='ru'?state.source:tr(state.source);if(next!==current)el.setAttribute(name,next);state.last=next;
 }
}
function walk(root,restore=false){
 if(root.nodeType===Node.TEXT_NODE){updateText(root,restore);return;}
 if(root instanceof Element)updateAttributes(root,restore);
 const iterator=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT,{acceptNode(n){return skip(n)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT;}});
 let n;while((n=iterator.nextNode()))if(n.nodeType===Node.TEXT_NODE)updateText(n,restore);else updateAttributes(n,restore);
}
export function restoreI18n(root=document){walk(root,true);}
function syncMeta(){const m=metaFor();document.title=m.title;for(const [selector,key]of [['meta[name="description"]','description'],['meta[property="og:title"]','title'],['meta[property="og:description"]','description'],['meta[name="twitter:title"]','title'],['meta[name="twitter:description"]','description']])document.querySelector(selector)?.setAttribute('content',m[key]);}
function addStyle(){if(document.getElementById('syolana-language-style'))return;const s=document.createElement('style');s.id='syolana-language-style';s.textContent=`
.top-actions{position:relative}.syolana-lang{position:absolute;right:0;top:58px;z-index:260;pointer-events:auto}.syolana-lang-toggle{position:relative;width:47px!important;height:47px!important;padding:0!important}.syolana-lang-toggle svg{width:21px;height:21px}.syolana-lang-code{position:absolute;right:-2px;bottom:-3px;min-width:23px;height:18px;padding:0 4px;border-radius:9px;border:1px solid rgba(236,225,255,.28);background:rgba(11,15,29,.94);display:grid;place-items:center;font:800 9px/1 system-ui,sans-serif;letter-spacing:.04em}.syolana-lang-menu{position:absolute;right:0;top:55px;width:188px;padding:8px;border:1px solid rgba(224,211,255,.22);border-radius:18px;background:rgba(7,11,23,.92);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);box-shadow:0 24px 65px rgba(0,0,0,.32);display:grid;gap:4px}.syolana-lang-menu[hidden]{display:none!important}.syolana-lang-menu button{min-height:42px;padding:9px 11px;border:0;border-radius:12px;background:transparent;color:#f8f6ff;text-align:left;font:650 .88rem/1.2 var(--body,system-ui);display:flex;align-items:center;justify-content:space-between;gap:10px}.syolana-lang-menu button:hover,.syolana-lang-menu button[aria-current="true"]{background:rgba(255,255,255,.075)}.syolana-lang-menu small{color:var(--dim,#cfc8dc);font-size:.72rem}body:not(.reader-application) .banner-copy h2{font-size:clamp(2.15rem,8vw,4.8rem)!important;line-height:.94!important}.banner-title-line{display:block;white-space:nowrap}.banner-title-line+.banner-title-line{margin-top:.08em}body.zen .syolana-lang{display:none!important}@media(max-width:520px){.syolana-lang{top:56px}.syolana-lang-menu{width:172px}body:not(.reader-application) .banner-copy h2{font-size:clamp(2rem,8.2vw,3.1rem)!important;letter-spacing:-.02em}.banner-title-line{white-space:nowrap}}
`;document.head.append(s);}
function mount(){addStyle();const actions=document.querySelector('.top-actions');if(!actions||document.getElementById('syolana-lang')?.dataset.ready)return;const wrap=document.getElementById('syolana-lang')||document.createElement('div');wrap.replaceChildren();wrap.dataset.ready='true';wrap.id='syolana-lang';wrap.className='syolana-lang';wrap.dataset.i18nSkip='controls';const toggle=document.createElement('button');toggle.type='button';toggle.className='icon-btn glass syolana-lang-toggle';toggle.setAttribute('aria-haspopup','menu');toggle.setAttribute('aria-expanded','false');toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z"></path></svg><span class="syolana-lang-code"></span>';const menu=document.createElement('div');menu.className='syolana-lang-menu';menu.hidden=true;menu.setAttribute('role','menu');const labels={ru:['Русский','RU'],en:['English','EN'],es:['Español','ES'],fr:['Français','FR']};for(const locale of Object.keys(labels)){const b=document.createElement('button');b.type='button';b.dataset.locale=locale;b.setAttribute('role','menuitem');const [name,code]=labels[locale];b.innerHTML='<span>'+name+'</span><small>'+code+'</small>';b.onclick=()=>{setLocale(locale);menu.hidden=true;toggle.setAttribute('aria-expanded','false');};menu.append(b);}toggle.onclick=e=>{e.stopPropagation();menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};wrap.append(toggle,menu);actions.append(wrap);document.addEventListener('click',e=>{if(!wrap.contains(e.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}});syncControl();}

function syncControl(){const locale=getLocale();document.documentElement.lang=locale;const code=document.querySelector('.syolana-lang-code');if(code&&code.textContent!==localeCode(locale))code.textContent=localeCode(locale);const toggle=document.querySelector('.syolana-lang-toggle');if(toggle){toggle.setAttribute('aria-label',tr('Язык интерфейса'));toggle.title=tr('Язык интерфейса');}document.querySelectorAll('.syolana-lang-menu button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.locale===locale)));}
export function applyI18n(root=document){walk(root);if(!document.body.dataset.i18nMetaSkip)syncMeta();syncControl();}
mount();applyI18n();
window.addEventListener('syolana:locale',()=>{if(!window.__syolanaRenderUI)applyI18n();});
