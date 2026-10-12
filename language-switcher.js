import {getLocale,setLocale,tr,languageName,localeCode,metaFor} from './i18n.js?v=20261012-i18n-1';

const textSource=new WeakMap();
const attrSource=new WeakMap();
const SKIP='script,style,code,pre,[data-i18n-skip]';
let applying=false;

function shouldSkip(node){const el=node.nodeType===1?node:node.parentElement;return !el||!!el.closest(SKIP);}
function replaceTrimmed(raw,value){const lead=(raw.match(/^\s*/)||[''])[0],tail=(raw.match(/\s*$/)||[''])[0];return lead+value+tail;}
function translateText(node){
 if(node.nodeType!==Node.TEXT_NODE||shouldSkip(node))return;
 if(!textSource.has(node))textSource.set(node,node.nodeValue||'');
 const source=textSource.get(node),clean=source.replace(/\s+/g,' ').trim();if(!clean)return;
 const out=tr(clean);if(out!==clean)node.nodeValue=replaceTrimmed(source,out);else if(getLocale()==='ru')node.nodeValue=source;
}
function translateAttrs(el){
 if(!(el instanceof Element)||shouldSkip(el))return;
 const attrs=['aria-label','title','placeholder'];let saved=attrSource.get(el);if(!saved){saved={};attrSource.set(el,saved);}
 for(const name of attrs){if(!el.hasAttribute(name))continue;if(!(name in saved))saved[name]=el.getAttribute(name)||'';const source=saved[name];const out=tr(source);el.setAttribute(name,getLocale()==='ru'?source:out);}
}
function walk(root=document){
 if(root.nodeType===Node.TEXT_NODE){translateText(root);return;}
 if(root instanceof Element)translateAttrs(root);
 const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);let n;while((n=walker.nextNode())){if(n.nodeType===Node.TEXT_NODE)translateText(n);else translateAttrs(n);}
}
function syncMeta(){const m=metaFor();document.title=m.title;document.querySelector('meta[name="description"]')?.setAttribute('content',m.description);document.querySelector('meta[property="og:title"]')?.setAttribute('content',m.title);document.querySelector('meta[property="og:description"]')?.setAttribute('content',m.description);document.querySelector('meta[name="twitter:title"]')?.setAttribute('content',m.title);document.querySelector('meta[name="twitter:description"]')?.setAttribute('content',m.description);}
function syncBannerTitle(){
 const h=document.querySelector('#banner .banner-copy h2');if(!h)return;
 const one=tr('Живой дизайн'),two=tr('для вашего сайта');const spans=[...h.querySelectorAll(':scope > .banner-title-line')];
 if(spans.length===2&&spans[0].textContent===one&&spans[1].textContent===two)return;
 const a=document.createElement('span'),b=document.createElement('span');a.className=b.className='banner-title-line';a.textContent=one;b.textContent=two;h.replaceChildren(a,b);h.dataset.i18nSkip='title';
}
function addStyle(){if(document.getElementById('syolana-language-style'))return;const s=document.createElement('style');s.id='syolana-language-style';s.textContent=`
.top-actions{position:relative}.syolana-lang{position:absolute;right:0;top:58px;z-index:260;pointer-events:auto}.syolana-lang-toggle{position:relative;width:47px!important;height:47px!important;padding:0!important}.syolana-lang-toggle svg{width:21px;height:21px}.syolana-lang-code{position:absolute;right:-2px;bottom:-3px;min-width:23px;height:18px;padding:0 4px;border-radius:9px;border:1px solid rgba(236,225,255,.28);background:rgba(11,15,29,.94);display:grid;place-items:center;font:800 9px/1 system-ui,sans-serif;letter-spacing:.04em}.syolana-lang-menu{position:absolute;right:0;top:55px;width:188px;padding:8px;border:1px solid rgba(224,211,255,.22);border-radius:18px;background:rgba(7,11,23,.92);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);box-shadow:0 24px 65px rgba(0,0,0,.32);display:grid;gap:4px}.syolana-lang-menu[hidden]{display:none!important}.syolana-lang-menu button{min-height:42px;padding:9px 11px;border:0;border-radius:12px;background:transparent;color:#f8f6ff;text-align:left;font:650 .88rem/1.2 var(--body,system-ui);display:flex;align-items:center;justify-content:space-between;gap:10px}.syolana-lang-menu button:hover,.syolana-lang-menu button[aria-current="true"]{background:rgba(255,255,255,.075)}.syolana-lang-menu small{color:var(--dim,#cfc8dc);font-size:.72rem}.banner-copy h2{font-size:clamp(2.15rem,8vw,4.8rem)!important;line-height:.94!important}.banner-title-line{display:block;white-space:nowrap}.banner-title-line+ .banner-title-line{margin-top:.08em}body.zen .syolana-lang{display:none!important}@media(max-width:520px){.syolana-lang{top:56px}.syolana-lang-menu{width:172px}.banner-copy h2{font-size:clamp(2rem,8.2vw,3.1rem)!important;letter-spacing:-.02em}.banner-title-line{white-space:nowrap}}
`;document.head.append(s);}
function mount(){
 addStyle();const actions=document.querySelector('.top-actions');if(!actions||document.getElementById('syolana-lang'))return;
 const wrap=document.createElement('div');wrap.id='syolana-lang';wrap.className='syolana-lang';wrap.dataset.i18nSkip='controls';
 const toggle=document.createElement('button');toggle.type='button';toggle.className='icon-btn glass syolana-lang-toggle';toggle.setAttribute('aria-haspopup','menu');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Язык интерфейса');toggle.title='Язык интерфейса';toggle.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.6 4 5.6 4 9s-1.4 6.4-4 9c-2.6-2.6-4-5.6-4-9s1.4-6.4 4-9Z"></path></svg><span class="syolana-lang-code"></span>';
 const menu=document.createElement('div');menu.className='syolana-lang-menu';menu.hidden=true;menu.setAttribute('role','menu');
 const labels={ru:['Русский','RU'],en:['English','EN'],es:['Español','ES'],fr:['Français','FR']};
 for(const locale of Object.keys(labels)){const b=document.createElement('button');b.type='button';b.dataset.locale=locale;b.setAttribute('role','menuitem');const [name,code]=labels[locale];b.innerHTML='<span>'+name+'</span><small>'+code+'</small>';b.onclick=()=>{setLocale(locale);menu.hidden=true;toggle.setAttribute('aria-expanded','false');};menu.append(b);}
 toggle.onclick=(e)=>{e.stopPropagation();menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));};wrap.append(toggle,menu);actions.append(wrap);
 document.addEventListener('click',e=>{if(!wrap.contains(e.target)){menu.hidden=true;toggle.setAttribute('aria-expanded','false');}});
 syncControl();
}
function syncControl(){const locale=getLocale();document.documentElement.lang=locale;const code=document.querySelector('.syolana-lang-code');if(code)code.textContent=localeCode(locale);const toggle=document.querySelector('.syolana-lang-toggle');if(toggle){toggle.setAttribute('aria-label',tr('Язык интерфейса'));toggle.title=tr('Язык интерфейса');}document.querySelectorAll('.syolana-lang-menu button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.locale===locale)));}
function apply(root=document){if(applying)return;applying=true;try{document.documentElement.lang=getLocale();walk(root);syncMeta();syncBannerTitle();syncControl();}finally{applying=false;}}

mount();apply();
window.addEventListener('syolana:locale',()=>apply(document));
let queued=false;const observer=new MutationObserver(records=>{if(applying)return;const roots=[];for(const r of records)for(const n of r.addedNodes)roots.push(n);if(!roots.length)return;if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;for(const r of roots)if(r.isConnected)walk(r);syncBannerTitle();});});observer.observe(document.documentElement,{childList:true,subtree:true});
export {apply as applyI18n};
