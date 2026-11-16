(()=>{'use strict';
 const start=()=>{
  const nav=document.querySelector('.syolana-reader-sections');if(!nav)return;
  const root=document.documentElement,header=document.querySelector('.topbar');let frame=0,last='';
  const measure=()=>{frame=0;const h=header?.getBoundingClientRect(),top=h&&h.height?Math.round(h.bottom+12):12;root.style.setProperty('--syolana-reader-top',top+'px');const bottom=Math.round(top+nav.getBoundingClientRect().height+14),key=top+':'+bottom;if(key===last)return;last=key;root.style.setProperty('--syolana-reader-bottom',bottom+'px');root.style.setProperty('--syolana-reader-extra',Math.max(0,bottom-92)+'px');root.dataset.readerSectionsBottom=String(bottom);window.dispatchEvent(new Event('resize'));};
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(measure);};
  if('ResizeObserver'in window){const observer=new ResizeObserver(schedule);observer.observe(nav);if(header)observer.observe(header);}
  window.addEventListener('resize',schedule,{passive:true});window.visualViewport?.addEventListener('resize',schedule,{passive:true});document.fonts?.ready.then(schedule);schedule();
 };
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
