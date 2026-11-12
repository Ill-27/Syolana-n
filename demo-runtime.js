(()=>{
 'use strict';
 const root=document.documentElement,preview=new URLSearchParams(location.search).has('preview');
 root.dataset.demoPreview=String(preview);root.dataset.demoPaused=String(preview);root.dataset.demoReady='false';
 let viewportWidth=innerWidth;
 const worldHeight=()=>Math.max(innerHeight,Math.min(screen.height||innerHeight,innerHeight+180));
 root.style.setProperty('--demo-world-height',worldHeight()+'px');
 addEventListener('resize',()=>{if(innerWidth!==viewportWidth){viewportWidth=innerWidth;root.style.setProperty('--demo-world-height',worldHeight()+'px');}},{passive:true});
 const nativeFrame=window.requestAnimationFrame.bind(window),nativeCancel=window.cancelAnimationFrame.bind(window);
 let active=!preview,frame=0,last=0,serial=0,ready=false;const pending=new Map();
 function schedule(){if(active&&!document.hidden&&pending.size&&!frame)frame=nativeFrame(flush);}
 function flush(now){frame=0;if(!active||document.hidden)return;if(preview&&now-last<1000/24){schedule();return;}last=now;const batch=[...pending];pending.clear();for(const [,callback]of batch)callback(now);schedule();}
 window.requestAnimationFrame=callback=>{const id=++serial;pending.set(id,callback);schedule();return id;};
 window.cancelAnimationFrame=id=>{pending.delete(id);};
 function setActive(value){active=value;root.dataset.demoPaused=String(!active||document.hidden);if(!active&&frame){nativeCancel(frame);frame=0;}schedule();}
 function announce(){if(ready)parent.postMessage({syolanaDemoReady:true},location.origin);}
 addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin)return;if(event.data?.syolanaPreviewState)setActive(Boolean(event.data.active));if(event.data?.syolanaRequestReady)announce();});
 document.addEventListener('visibilitychange',()=>{root.dataset.demoPaused=String(document.hidden||!active);if(document.hidden&&frame){nativeCancel(frame);frame=0;}schedule();});
 const editable=target=>target?.closest?.('input,textarea,[contenteditable="true"]');
 for(const type of ['copy','cut','contextmenu','dragstart'])document.addEventListener(type,event=>{if(!editable(event.target))event.preventDefault();});
 document.addEventListener('keydown',event=>{if(editable(event.target))return;if((event.ctrlKey||event.metaKey)&&['s','p','u','c'].includes(event.key.toLowerCase()))event.preventDefault();});
 document.addEventListener('DOMContentLoaded',async()=>{
  parent.postMessage({syolanaPreviewReady:true},location.origin);
  document.getElementById('sound-toggle')?.addEventListener('click',()=>parent.postMessage({syolanaDemoSound:true},location.origin));
  const assets={book:'../assets/atelier/scene-3e91dca1d27d3e.webp',glamping:innerWidth<=640?'../assets/atelier/scene-ff51f57ed17035.webp':'../assets/atelier/scene-662c9e320fb3c0.webp',studio:'../themes/previews/amber-forest.jpg'};
  const image=new Image(),decoded=new Promise(resolve=>{image.onload=()=>{if(image.decode)image.decode().catch(()=>{}).then(resolve);else resolve();};image.onerror=resolve;});image.src=assets[root.dataset.syolanaDemo]||assets.book;
  await Promise.allSettled([decoded,document.fonts?.load('16px "Syolana Script"')||Promise.resolve()]);
  if(document.fonts?.ready)await document.fonts.ready;
  root.dataset.demoFontsReady=String(document.fonts?.check('16px "Syolana Script"')??true);
  const scroller=document.getElementById('text-scroll');
  if(preview&&root.dataset.syolanaDemo==='book'&&scroller){const story=document.getElementById('story');if(story)scroller.scrollTop=Math.max(0,story.offsetTop-15);root.dataset.demoReader='true';scroller.dispatchEvent(new Event('scroll'));}
  nativeFrame(()=>nativeFrame(()=>{ready=true;root.dataset.demoReady='true';announce();schedule();}));
 });
 addEventListener('pagehide',()=>setActive(false));addEventListener('pageshow',()=>{if(!preview)setActive(true);});
})();
