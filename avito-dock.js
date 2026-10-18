import {registerTranslations, tr} from './i18n.js';

registerTranslations({
  'Свернуть кнопку Авито': ['Collapse the Avito button', 'Contraer el botón de Avito', 'Réduire le bouton Avito'],
  'Развернуть кнопку Авито': ['Expand the Avito button', 'Expandir el botón de Avito', 'Développer le bouton Avito'],
  'Двигайте вверх или вниз. Вправо — свернуть, влево — развернуть. Клавиатура: стрелки, Home и End.': [
    'Drag up or down. Right to collapse, left to expand. Keyboard: arrows, Home and End.',
    'Arrastra arriba o abajo. A la derecha para contraer; a la izquierda para expandir. Teclado: flechas, Inicio y Fin.',
    'Glissez vers le haut ou le bas. À droite pour réduire, à gauche pour développer. Clavier : flèches, début et fin.'
  ]
});

const ASSETS=new URL(new URL(import.meta.url).pathname.includes('/runtime/')?'../assets/contacts/':'./assets/contacts/',import.meta.url);
const STORAGE = 'syolana.avito-dock.v1';
const GAP = 16, MOTION = 6;
const TOP = '.top-actions,.syolana-lang,.syolana-lang-menu,.reader-topbar';
const BOTTOM = '#music-dock,.course-controls,.flight-hint,.flight-planet,.discovery-tip';
const MIDDLE = '.reader-sound-fab,.reader-toolbar,[data-contact-obstacle],[data-syolana-signature]';
const mounted = new WeakMap();
const clamp = (value, low, high) => Math.min(high, Math.max(low, value));

export function contactBounds({viewport, width, height, right = 16, top = [], bottom = [], obstacles = [], gap = GAP + MOTION}) {
  const left = viewport.right - right - width;
  const crosses = rect => rect.right > left - gap && rect.left < viewport.right - right + gap;
  const upper = Math.max(viewport.top + gap, ...top.filter(crosses).map(r => r.bottom + gap));
  const lower = Math.min(viewport.bottom - gap, ...bottom.filter(crosses).map(r => r.top - gap)) - height;
  let slots = lower >= upper ? [[upper,lower]] : [];
  for (const r of obstacles.filter(crosses)) {
    const from=r.top-height-gap,to=r.bottom+gap;
    slots=slots.flatMap(([a,b])=>to<=a||from>=b?[[a,b]]:[...(from>a?[[a,Math.min(b,from)]]:[]),...(to<b?[[Math.max(a,to),b]]:[])]);
  }
  return {min:slots[0]?.[0]??upper,max:slots.at(-1)?.[1]??lower,fits:slots.length>0,slots};
}

function snap(value,bounds) {
  return bounds.slots.map(([a,b])=>clamp(value,a,b)).reduce((best,next)=>Math.abs(next-value)<Math.abs(best-value)?next:best);
}

function installStyle(doc) {
  if (doc.getElementById('syolana-avito-dock-style')) return;
  const style = doc.createElement('style');
  style.id = 'syolana-avito-dock-style';
  style.textContent = `
.syolana-avito-shell{position:fixed;z-index:390;right:max(16px,env(safe-area-inset-right));touch-action:none;user-select:none;-webkit-user-select:none;animation:syolanaAvitoFloat 4.8s ease-in-out infinite;display:flex;flex-direction:column;align-items:flex-end;gap:16px;width:max-content}
.syolana-avito-shell .syolana-avito-float{display:flex;align-items:center;gap:9px;border:1px solid var(--panel-border,rgba(255,255,255,.18));border-radius:999px;background:var(--panel-bg,rgba(12,16,30,.9));box-shadow:0 18px 48px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px);color:#fff!important;text-decoration:none;font:790 .82rem/1 var(--body,system-ui,sans-serif);padding:9px 50px 9px 12px;position:relative!important;inset:auto!important;box-sizing:border-box;min-height:56px;max-width:210px;padding-right:50px;cursor:grab;touch-action:none;-webkit-user-drag:none;animation:none!important}
.syolana-avito-mark{width:28px;height:28px;flex:0 0 28px}.syolana-avito-shell .syolana-avito-float-label{white-space:normal;line-height:1.15;max-width:110px}
.syolana-avito-shell[data-dragging]{animation:none!important;transform:none!important}
.syolana-avito-shell[data-dragging] .syolana-avito-float{cursor:grabbing;animation:none!important;transform:none!important}
.syolana-avito-shell[data-compact] .syolana-avito-float{width:56px;height:56px;min-height:56px;padding:0;display:grid;place-items:center;border-radius:50%}
.syolana-avito-shell[data-compact] .syolana-avito-float-label{display:none}
.syolana-avito-shell[data-unavailable]{visibility:hidden;pointer-events:none}
.syolana-avito-shell .syolana-avito-fold{position:absolute;right:2px;bottom:6px;top:auto;transform:none;display:grid;place-items:center;width:44px;min-width:44px;height:44px;min-height:44px;margin:0;padding:0;border:0;border-radius:999px;background:transparent!important;color:#fff!important;box-shadow:none;cursor:pointer;touch-action:manipulation}
.syolana-avito-fold svg{width:14px;height:14px;position:relative;pointer-events:none}
.syolana-avito-shell[data-compact] .syolana-avito-fold{right:56px}
.syolana-avito-shell[data-compact] .syolana-avito-fold::before{content:'';position:absolute;inset:10px;border:1px solid var(--panel-border,rgba(255,255,255,.18));border-radius:50%;background:var(--panel-bg,rgba(12,16,30,.82));backdrop-filter:blur(12px)}
.syolana-avito-shell[data-compact] .syolana-avito-fold svg{rotate:180deg}
.syolana-avito-fold:hover{filter:brightness(1.2)}
.syolana-avito-fold:focus-visible{outline:2px solid var(--accent,#e5d6ff);outline-offset:2px}

.syolana-contact-circle{position:relative;display:grid;place-items:center;box-sizing:border-box;flex:0 0 56px;width:56px;height:56px;min-width:56px;min-height:56px;padding:0;border:1px solid var(--panel-border,rgba(255,255,255,.18));border-radius:50%;background:var(--panel-bg,rgba(12,16,30,.9));color:var(--panel-text,#fff);box-shadow:0 18px 48px rgba(0,0,0,.24),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px) saturate(130%);text-decoration:none;cursor:grab;touch-action:none;-webkit-user-drag:none}
.syolana-avito-shell[data-row]{flex-direction:row;align-items:center}.syolana-avito-shell[data-row] .syolana-avito-fold{display:none}.zen .syolana-avito-shell{display:none!important}
.syolana-contact-circle svg,.syolana-contact-circle img{display:block;width:28px;height:28px;pointer-events:none}.syolana-contact-circle::after,.syolana-avito-shell .syolana-avito-float::after{content:'';position:absolute;inset:-6px;border:1px solid color-mix(in srgb,var(--accent,#e5d6ff) 22%,transparent);border-radius:inherit;opacity:.65;pointer-events:none}.syolana-contact-circle:focus-visible{outline:2px solid var(--accent,#e5d6ff);outline-offset:5px}.syolana-contact-circle:hover{filter:brightness(1.1)}
@keyframes syolanaAvitoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
@media(prefers-reduced-motion:reduce){.syolana-avito-shell{animation:none!important}}
@media print{.syolana-avito-shell{display:none!important}}
`;
  doc.head.append(style);
}

export function mountAvitoDock(link) {
  if (mounted.has(link)) { mounted.get(link).refresh(); return mounted.get(link); }
  const doc = link.ownerDocument, win = doc.defaultView;
  installStyle(doc);
  let preference = {position: 1, compact: false};
  try {
    const saved = JSON.parse(win.localStorage.getItem(STORAGE));
    if (Number.isFinite(saved?.position)) preference.position = clamp(saved.position, 0, 1);
    if (typeof saved?.compact === 'boolean') preference.compact = saved.compact;
  } catch {}
  const shell = doc.createElement('div');
  shell.className = 'syolana-avito-shell'; shell.dataset.i18nSkip = 'contact';
  link.before(shell); shell.append(link);
  const fold = doc.createElement('button');
  fold.className = 'syolana-avito-fold'; fold.type = 'button';
  fold.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="m7 5 5 5-5 5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  shell.append(fold);
  const mail=doc.createElement('a');mail.className='syolana-contact-circle';mail.draggable=false;mail.dataset.contact='email';mail.href='mailto:syolana@yandex.ru';mail.innerHTML='<img src="'+new URL('yandex-mail.svg',ASSETS).href+'" alt="" width="28" height="28" draggable="false" loading="lazy" decoding="async">';
  const vk=doc.createElement('button');vk.type='button';vk.className='syolana-contact-circle';vk.dataset.contact='vk';vk.setAttribute('aria-disabled','true');vk.innerHTML='<img src="'+new URL('vk.svg',ASSETS).href+'" alt="" width="28" height="28" draggable="false" loading="lazy" decoding="async">';
  shell.prepend(mail,vk);
  function labels(){mail.setAttribute('aria-label',tr('Написать на почту')+': syolana@yandex.ru');mail.title=mail.getAttribute('aria-label');vk.setAttribute('aria-label',tr('ВКонтакте — ссылка скоро появится'));vk.title=vk.getAttribute('aria-label');}
  labels();
  link.draggable = false;
  link.setAttribute('aria-keyshortcuts', 'ArrowUp ArrowDown ArrowLeft ArrowRight Home End');
  let destroyed=false, raf = 0, drag = null, suppressClick = false, bounds = null, currentTop = 0, compact = preference.compact;
  let observed = [];
  const resize = typeof win.ResizeObserver === 'function' ? new win.ResizeObserver(schedule) : null;
  const layout = new win.MutationObserver(schedule);
  function schedule() { if (!destroyed && !raf) raf = win.requestAnimationFrame(measure); }
  function visible(node) {
    if (node.hidden || node.closest('[hidden]')) return false;
    const css = win.getComputedStyle(node);
    const r=node.getBoundingClientRect(),v=win.visualViewport,top=v?.offsetTop||0;
    return css.display !== 'none' && css.visibility !== 'hidden' && r.height > 0 && r.bottom > top && r.top < top+(v?.height||win.innerHeight);
  }
  function setCompact(value) {
    compact = value; shell.toggleAttribute('data-compact', value);
    fold.setAttribute('aria-label', tr(value ? 'Развернуть кнопку Авито' : 'Свернуть кнопку Авито'));
    fold.title = fold.getAttribute('aria-label');
    fold.setAttribute('aria-expanded', String(!value));
    link.title = tr('Двигайте вверх или вниз. Вправо — свернуть, влево — развернуть. Клавиатура: стрелки, Home и End.');
  }
  function track(nodes) {
    if (nodes.length === observed.length && nodes.every((n, i) => n === observed[i])) return;
    observed = nodes; resize?.disconnect(); layout.disconnect();
    layout.observe(doc.body,{attributes:true,attributeFilter:['style']});
    resize?.observe(link);resize?.observe(mail);resize?.observe(vk);
    for (const n of nodes) {
      resize?.observe(n);
      // Moving scene cards use transforms each frame; their reserved row stays fixed.
      if (!n.matches('.flight-planet')) layout.observe(n, {attributes:true, attributeFilter:['style','hidden','class']});
    }
  }
  function measure() {
    raf = 0;if(doc.body.classList.contains('zen'))return;
    const tops = [...doc.querySelectorAll(TOP)], bottoms = [...doc.querySelectorAll(BOTTOM)], middle = [...doc.querySelectorAll(MIDDLE)];
    track([...tops, ...bottoms, ...middle]);
    const view = win.visualViewport;
    const viewport = {top:view?.offsetTop || 0, bottom:(view?.offsetTop || 0) + (view?.height || win.innerHeight), right:doc.documentElement.clientWidth || win.innerWidth};
    const rects = nodes => nodes.filter(visible).map(n => n.getBoundingClientRect());
    const top = rects(tops), bottom = rects(bottoms), obstacles = rects(middle);
    // Reserve the tallest zen row, including inactive cards, so changing offers never moves the contact.
    if (doc.body.classList.contains('zen')) {
      const reserved = parseFloat(doc.body.style.getPropertyValue('--zen-contact-bottom'));
      if (Number.isFinite(reserved)) bottom.push({left:0,right:viewport.right,top:viewport.bottom-reserved+GAP+MOTION});
    }
    shell.removeAttribute('data-row');let horizontal=false;labels();setCompact(preference.compact);
    function calculate() {
      const rect = link.getBoundingClientRect();
      const height=rect.height+(mail.getBoundingClientRect().height||56)+(vk.getBoundingClientRect().height||56)+2*(parseFloat(win.getComputedStyle(shell).gap)||GAP);
      return contactBounds({viewport,width:horizontal?rect.width+144:rect.width+(compact?44:0),height:horizontal?rect.height:height,right:parseFloat(win.getComputedStyle(shell).right) || GAP,top,bottom,obstacles});
    }
    bounds = calculate();
    if (!bounds.fits && !compact) { setCompact(true); bounds = calculate(); }
    if(!bounds.fits){setCompact(true);horizontal=true;shell.setAttribute('data-row','');bounds=calculate();}
    shell.toggleAttribute('data-unavailable', !bounds.fits);
    if (!bounds.fits) return;
    const next = drag?.moving ? drag.desired : bounds.min + preference.position * (bounds.max - bounds.min);
    place(snap(next,bounds));
  }
  function place(value) { currentTop = value; const css = Math.round(value * 2) / 2 + 'px'; if (shell.style.top !== css) shell.style.top = css; }
  function remember() { try { win.localStorage.setItem(STORAGE, JSON.stringify(preference)); } catch {} }
  function savePosition() {
    if (bounds?.fits && bounds.max > bounds.min) preference.position = clamp((currentTop - bounds.min) / (bounds.max - bounds.min), 0, 1);
    remember();
  }
  function toggle(value = !preference.compact) { preference.compact = value; remember(); measure(); }
  fold.addEventListener('click', () => toggle());
  link.addEventListener('dragstart', e => e.preventDefault());
  shell.addEventListener('pointerdown', e => {
    if(e.target.closest('.syolana-avito-fold'))return;
    if (e.isPrimary === false || (e.button !== undefined && e.button !== 0)) return;
    suppressClick = false;
    drag = {id:e.pointerId,x:e.clientX,y:e.clientY,top:currentTop,moving:false,desired:currentTop,dx:0};
  });
  shell.addEventListener('pointermove', e => {
    if (!drag || drag.id !== e.pointerId) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.moving && Math.hypot(dx,dy) < 7) return;
    if(!drag.moving)shell.setPointerCapture?.(e.pointerId);
    drag.moving = true; drag.dx = dx; drag.desired = drag.top + dy;
    shell.setAttribute('data-dragging','');
    if (bounds?.fits) place(snap(drag.desired,bounds));
    e.preventDefault();
  });
  function release(e) {
    if (!drag || drag.id !== e.pointerId) return;
    const finished = drag; drag = null; shell.removeAttribute('data-dragging');
    if (finished.moving) {
      suppressClick = true; savePosition();
      if (e.type !== 'pointercancel' && Math.abs(finished.dx) >= 36 && Math.abs(finished.dx) > Math.abs(e.clientY - finished.y) * .65) toggle(finished.dx > 0);
      else measure();
    }
    if (shell.hasPointerCapture?.(e.pointerId)) shell.releasePointerCapture(e.pointerId);
  }
  shell.addEventListener('pointerup',release); shell.addEventListener('pointercancel',release);
  shell.addEventListener('lostpointercapture',e=>{if(e.target===shell)release(e);});
  shell.addEventListener('click',e=>{if(suppressClick&&e.detail!==0){e.preventDefault();e.stopImmediatePropagation();suppressClick=false;}},true);
  shell.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {e.preventDefault();toggle(e.key==='ArrowRight');return;}
    if (!['ArrowUp','ArrowDown','Home','End'].includes(e.key) || !bounds?.fits) return;
    e.preventDefault();
    let next=e.key==='Home'?bounds.min:e.key==='End'?bounds.max:currentTop+(e.key==='ArrowUp'?-24:24);
    if(e.key==='ArrowDown'&&bounds.slots.some(([,b])=>Math.abs(b-currentTop)<1))next=bounds.slots.find(([a])=>a>currentTop)?.[0]??next;
    if(e.key==='ArrowUp'&&bounds.slots.some(([a])=>Math.abs(a-currentTop)<1))next=bounds.slots.slice().reverse().find(([,b])=>b<currentTop)?.[1]??next;
    place(snap(next,bounds));
    savePosition();
  });
  const structure = new win.MutationObserver(records => {
    if (records.some(r => !shell.contains(r.target))) schedule();
  });
  structure.observe(doc.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','open']});
  layout.observe(doc.body,{attributes:true,attributeFilter:['style']});
  for (const event of ['resize','orientationchange','pageshow','syolana:locale']) win.addEventListener(event,schedule);
  win.addEventListener('scroll',schedule,{passive:true,capture:true});
  viewEvents(win.visualViewport);
  function viewEvents(view) {view?.addEventListener('resize',schedule);view?.addEventListener('scroll',schedule);}
  const controller = {refresh:schedule,destroy(){if(destroyed)return;destroyed=true;resize?.disconnect();layout.disconnect();structure.disconnect();win.cancelAnimationFrame(raf);for(const event of ['resize','orientationchange','pageshow','syolana:locale'])win.removeEventListener(event,schedule);win.removeEventListener('scroll',schedule,true);win.visualViewport?.removeEventListener('resize',schedule);win.visualViewport?.removeEventListener('scroll',schedule);mounted.delete(link);shell.remove();}}; mounted.set(link,controller);
  measure(); doc.fonts?.ready?.then(schedule);
  return controller;
}

export function ensureContactDock(){
 let link=document.getElementById('syolana-avito-float');
 if(!link){link=document.createElement('a');link.id='syolana-avito-float';link.className='syolana-avito-float';link.href='https://www.avito.ru/brands/i223140984';link.target='_blank';link.rel='noopener noreferrer';link.innerHTML='<svg class="syolana-avito-mark" viewBox="0 0 28 28" aria-hidden="true"><circle cx="8" cy="8" r="5.2" fill="#00aaff"/><circle cx="20" cy="7" r="4.3" fill="#ff4053"/><circle cx="8" cy="20" r="4.3" fill="#97cf26"/><circle cx="20" cy="20" r="5.2" fill="#a169f7"/></svg><span class="syolana-avito-float-label">'+tr('Написать на Авито')+'</span>';document.body.append(link);}
 return mountAvitoDock(link);
}
registerTranslations({'Написать на почту':['Send an email','Enviar un correo','Envoyer un e-mail'],'ВКонтакте — ссылка скоро появится':['VK — link coming soon','VK — enlace próximamente','VK — lien bientôt disponible'],'Написать на Авито':['Contact on Avito','Contactar en Avito','Contacter sur Avito']});

if(typeof document!=='undefined'&&document.querySelector('script[data-syolana-contact-dock]'))ensureContactDock();
