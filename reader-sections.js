(()=>{'use strict';
 const start=()=>{
  const nav=document.querySelector('.syolana-reader-sections');if(!nav)return;
  const owned=new Set(['https://syolana.com','https://www.syolana.com','https://syolana.website.yandexcloud.net']);
  if(owned.has(location.origin)||(location.protocol==='http:'&&['localhost','127.0.0.1'].includes(location.hostname)))for(const a of document.querySelectorAll('a[href]')){const u=new URL(a.href,location.href);if(owned.has(u.origin))a.href=location.origin+u.pathname+u.search+u.hash;}
  const root=document.documentElement,header=document.querySelector('.topbar');let frame=0,last='';
  const measure=()=>{frame=0;const h=header?.getBoundingClientRect(),bottom=Math.round((h?.height?h.bottom:nav.getBoundingClientRect().bottom)+14),key=String(bottom);if(key===last)return;last=key;root.style.setProperty('--syolana-reader-bottom',bottom+'px');root.style.setProperty('--syolana-reader-extra',Math.max(0,bottom-92)+'px');root.dataset.readerSectionsBottom=String(bottom);window.dispatchEvent(new Event('resize'));};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  if('ResizeObserver'in window){const observer=new ResizeObserver(schedule);observer.observe(nav);if(header)observer.observe(header);}
  window.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);schedule();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
