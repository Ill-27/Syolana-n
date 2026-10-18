export const ATTRIBUTION_TEXT='Сайт создан на Syolana';
const ROOT=new URL(new URL(import.meta.url).pathname.includes('/runtime/')?'../':'./',import.meta.url);
const BRAND_ROOT=/^(?:www\.)?syolana\.com$|^syolana(?:-pilot-[a-z0-9]+)?\.website\.yandexcloud\.net$/.test(ROOT.hostname)?ROOT:new URL('https://syolana.com/');
export function prepareAttribution(link){
 if(!link)return link;
 if(!document.querySelector('link[data-syolana-credit-style]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('partner-attribution.css',ROOT).href;css.dataset.syolanaCreditStyle='true';css.referrerPolicy='no-referrer';document.head.append(css);
 }
 link.dataset.i18nSkip='design-credit';link.title='syolana.com — автор оформления';link.href='https://syolana.com/';link.target='_blank';link.rel='noopener noreferrer';link.classList.add('syolana-credit');
 link.replaceChildren();
 const image=document.createElement('img');image.src=new URL('assets/logo.svg?v=20261014-passport-1',BRAND_ROOT).href;image.alt='';image.width=28;image.height=28;image.dataset.syolanaLogo='true';image.decoding='async';
 const text=document.createElement('span');text.textContent=ATTRIBUTION_TEXT;link.append(image,text);return link;
}
export function normalizePartnerFooter(link){
 const footer=link?.closest('footer');if(!footer)return prepareAttribution(link);
 if(!footer.classList.contains('partner-footer')){
  footer.classList.add('partner-footer');
  const meta=document.createElement('div');meta.className='partner-footer-meta';
  const nav=document.createElement('nav');nav.className='partner-footer-nav';nav.setAttribute('aria-label','Информация о сайте');
  for(const node of [...footer.children])if(node!==link){if(node.tagName==='A')nav.append(node);else meta.append(node);}
  if(nav.childElementCount)meta.append(nav);
  const row=document.createElement('p');row.className='partner-footer-credit';row.append(link);footer.append(meta,row);
 }
 return prepareAttribution(link);
}

export function signaturePlacement({viewport,width,height,right=24,gap=16,obstacles=[]}){
 const left=viewport.right-right-width,min=viewport.top+gap,max=Math.max(min,viewport.bottom-gap-height);
 let slots=[[min,max]];
 for(const r of obstacles){
  if(r.right<=left-gap||r.left>=viewport.right-right+gap)continue;
  const from=r.top-height-gap,to=r.bottom+gap;
  slots=slots.flatMap(([a,b])=>to<=a||from>=b?[[a,b]]:[...(from>a?[[a,Math.min(b,from)]]:[]),...(to<b?[[Math.max(a,to),b]]:[])]);
 }
 return {left,top:slots.at(-1)?.[1]??max};
}

export function mountDesignMarks({translate=value=>value}={}){
 document.querySelectorAll('[data-syolana-design-marks]').forEach(n=>n.remove());
 if(!document.getElementById('syolana-design-marks-style')){
  const style=document.createElement('style');style.id='syolana-design-marks-style';style.textContent=`
[data-syolana-design-marks]{display:contents;pointer-events:none;color:var(--page-label,var(--accent,#eee7ff));text-shadow:0 1px 8px rgba(0,0,0,.22)}
.syolana-copyright-corner{position:fixed;z-index:2;left:max(20px,env(safe-area-inset-left));top:var(--syolana-mark-top,116px);max-width:min(230px,54vw);animation:syolanaAuthorDrift 19s ease-in-out infinite}body.zen .syolana-copyright-corner{z-index:70}
[data-syolana-copyright]{display:grid;gap:3px;font:500 11px/1.4 system-ui,sans-serif;letter-spacing:.015em;opacity:.72}
[data-syolana-copyright] span:first-child{font-weight:650;letter-spacing:.035em}[data-syolana-copyright] span:last-child{font-size:10px}
[data-syolana-signature]{position:fixed;z-index:420;right:max(24px,env(safe-area-inset-right));bottom:var(--syolana-mark-bottom,28px);font:400 clamp(28px,4vw,38px)/1.3 "Syolana Script",cursive;letter-spacing:.025em;opacity:.96;color:#fff8ff;text-shadow:0 1px 2px rgba(0,0,0,.88),0 0 8px rgba(0,0,0,.45);animation:syolanaSignatureDrift 23s ease-in-out infinite;white-space:nowrap}
.syolana-mark-credit{display:none!important;pointer-events:auto;margin-top:10px!important}body.zen .syolana-mark-credit{display:inline-flex!important;min-height:34px!important;font-size:11px!important;padding:4px 8px!important;background:transparent!important}.syolana-mark-credit img{width:22px!important;height:22px!important}
@keyframes syolanaAuthorDrift{0%,100%{transform:translate3d(0,0,0)}30%{transform:translate3d(3px,-2px,0)}65%{transform:translate3d(-2px,3px,0)}}
@keyframes syolanaSignatureDrift{0%,100%{transform:translate3d(0,0,0) rotate(-2deg)}35%{transform:translate3d(-3px,2px,0) rotate(-1deg)}70%{transform:translate3d(2px,-3px,0) rotate(-2.5deg)}}
@media(prefers-reduced-motion:reduce){.syolana-copyright-corner,[data-syolana-signature]{animation:none!important}}
@media print{[data-syolana-design-marks]{display:none}}
`;document.head.append(style);
 }
 const root=document.createElement('div');root.dataset.syolanaDesignMarks='true';root.dataset.i18nSkip='design-authorship';
 const corner=document.createElement('div');corner.className='syolana-copyright-corner';
 const copyright=document.createElement('div');copyright.dataset.syolanaCopyright='true';
 const lines=['© syolana.com','Веб-дизайн и оформление','2026'];for(const text of lines){const span=document.createElement('span');span.textContent=text;copyright.append(span);}
 const signature=document.createElement('div');signature.dataset.syolanaSignature='true';signature.textContent='Syolana';
 const credit=prepareAttribution(document.createElement('a'));credit.classList.add('syolana-mark-credit');
 corner.append(copyright,credit);root.append(corner,signature);document.body.append(root);
 let themeName='',stopped=false,frame=0,observed=[];
 const requestFrame=window.requestAnimationFrame?.bind(window)||((fn)=>setTimeout(fn,16)),cancelFrame=window.cancelAnimationFrame?.bind(window)||clearTimeout;
 const controls='#music-dock,.course-controls,.flight-hint,.flight-planet,.reader-toolbar,.reader-sound-fab';
 const visible=node=>{if(node.hidden||node.closest('[hidden]'))return false;for(let p=node;p;p=p.parentElement){const s=window.getComputedStyle(p);if(s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse')return false;}return true;};
 function schedule(){if(!stopped&&!frame)frame=requestFrame(layout);}
 const resize=typeof window.ResizeObserver==='function'?new window.ResizeObserver(schedule):null;
 function layout(){
  frame=0;if(stopped)return;
  const nodes=[signature,...document.querySelectorAll(controls)];
  if(nodes.length!==observed.length||nodes.some((n,i)=>n!==observed[i])){resize?.disconnect();nodes.forEach(n=>resize?.observe(n));observed=nodes;}
  const view=window.visualViewport,screenHeight=window.innerHeight,viewport={top:view?.offsetTop||0,bottom:(view?.offsetTop||0)+(view?.height||screenHeight),right:document.documentElement.clientWidth||window.innerWidth};
  const obstacles=nodes.slice(1).filter(visible).map(n=>n.getBoundingClientRect()).filter(r=>r.width&&r.height&&r.bottom>viewport.top&&r.top<viewport.bottom);
  const rect=signature.getBoundingClientRect(),height=rect.height||46,width=rect.width||160;
  const placement=signaturePlacement({viewport,width,height,obstacles,gap:20});
  const bottom=Math.max(16,screenHeight-placement.top-height)+'px';if(root.style.getPropertyValue('--syolana-mark-bottom')!==bottom)root.style.setProperty('--syolana-mark-bottom',bottom);
  let top=116;const brand=document.querySelector('.top-actions .brand,.brand-link,.reader-home');if(brand){const r=brand.getBoundingClientRect();if(r.bottom>0&&r.bottom<180)top=Math.max(top,r.bottom+16);}const value=top+'px';if(root.style.getPropertyValue('--syolana-mark-top')!==value)root.style.setProperty('--syolana-mark-top',value);
 }
 const changes=new window.MutationObserver(schedule);changes.observe(document.body,{childList:true,subtree:true});
 const mode=new window.MutationObserver(schedule);mode.observe(document.body,{attributes:true,attributeFilter:['class','style']});
 for(const event of ['resize','orientationchange','syolana:scene-ready'])window.addEventListener(event,schedule);
 window.visualViewport?.addEventListener('resize',schedule);window.visualViewport?.addEventListener('scroll',schedule);
 const yearText=()=> '2026'+(themeName?' • '+translate(themeName):'');const updateText=()=>{copyright.children[1].textContent=translate(lines[1]);copyright.lastElementChild.textContent=yearText();schedule();};window.addEventListener('syolana:locale',updateText);document.fonts?.ready?.then(schedule);layout();
 return{root,nodes:[{node:copyright,expected:()=>lines[0]+translate(lines[1])+yearText()},{node:signature,expected:()=> 'Syolana'},{node:credit,expected:()=>ATTRIBUTION_TEXT,href:'https://syolana.com/',when:()=>document.body.classList.contains('zen')}],update(name){themeName=name;updateText();},destroy(){stopped=true;cancelFrame(frame);resize?.disconnect();changes.disconnect();mode.disconnect();for(const event of ['resize','orientationchange','syolana:scene-ready'])window.removeEventListener(event,schedule);window.visualViewport?.removeEventListener('resize',schedule);window.visualViewport?.removeEventListener('scroll',schedule);window.removeEventListener('syolana:locale',updateText);root.remove();}};
}

export function setPlainSite(active){
 if(!document.getElementById('syolana-plain-site-style')){const style=document.createElement('style');style.id='syolana-plain-site-style';style.textContent=`
html[data-syolana-plain] {color-scheme:light!important;background:white!important;--body:Arial,sans-serif;--heading:Arial,sans-serif;--reader-font:Arial,sans-serif!important;--handwriting:Arial,sans-serif!important}
html[data-syolana-plain] body{background:white!important;color:#111!important;font:16px/1.6 Arial,sans-serif!important;isolation:auto!important;padding:16px!important;margin:0!important}
html[data-syolana-plain] :is(main,header,footer,article,section,.card,.glass,.banner,.hero,.shell,.reader-surface,.reader-text,.reader-topbar,.main-nav,.site-header,.book-card,.managed-attribution){display:block!important;position:static!important;inset:auto!important;width:auto!important;max-width:760px!important;min-height:0!important;margin:0 auto 16px!important;padding:0!important;background:none!important;background-image:none!important;border:0!important;border-radius:0!important;box-shadow:none!important;backdrop-filter:none!important;transform:none!important;filter:none!important;color:#111!important;opacity:1!important;animation:none!important}
html[data-syolana-plain] :is(h1,h2,h3,h4,p,li,small,span,strong,em,label,summary,.brand strong,.reader-title){font-family:Arial,sans-serif!important;color:#111!important;text-shadow:none!important;background:none!important;-webkit-text-fill-color:currentColor!important;letter-spacing:normal!important;animation:none!important}
html[data-syolana-plain] :is(a,a:visited){color:#0645ad!important;text-shadow:none!important;background:none!important;text-decoration:underline!important;border:0!important;border-radius:0!important;box-shadow:none!important}
html[data-syolana-plain] :is(.btn,button,input,select,textarea){font:inherit!important;color:#111!important;background:#f4f4f4!important;border:1px solid #aaa!important;border-radius:2px!important;box-shadow:none!important;min-height:32px!important;padding:3px 7px!important;animation:none!important}
html[data-syolana-plain] :is(#starCanvas,.theme-world-canvas,#reading-shade,#flight-layer,.top-actions,#music-dock,.syolana-avito-shell,[data-syolana-design-marks],.export-controls,.syolana-attribution,.export-attribution,.syolana-credit,.managed-attribution,.ambient-theme-sound){display:none!important}
html[data-syolana-plain] *{font-family:Arial,sans-serif!important;text-shadow:none!important;animation:none!important;transition:none!important;transform:none!important;filter:none!important;opacity:1!important}html[data-syolana-plain] h1{font-size:2em!important}html[data-syolana-plain] h2{font-size:1.5em!important}html[data-syolana-plain] h3{font-size:1.17em!important}html[data-syolana-plain] :is(p,li){font-size:1em!important}html[data-syolana-plain] :is(.grid,.book-grid,.library-grid,.feed-grid){display:block!important}html[data-syolana-plain] body::before,html[data-syolana-plain] body::after,html[data-syolana-plain] .aurora-background{display:none!important}
html[data-syolana-plain] :is(img,video){max-width:100%!important;height:auto!important;border-radius:0!important;box-shadow:none!important}html[data-syolana-plain] [hidden]{display:none!important}
`;document.head.append(style);}
 document.documentElement.toggleAttribute('data-syolana-plain',Boolean(active));
}
