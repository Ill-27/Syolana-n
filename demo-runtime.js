(()=>{
 'use strict';
 const root=document.documentElement,preview=new URLSearchParams(location.search).has('preview');
 root.dataset.demoPreview=String(preview);root.dataset.demoPaused=String(preview);
 const nativeFrame=window.requestAnimationFrame.bind(window),nativeCancel=window.cancelAnimationFrame.bind(window);
 let active=!preview,frame=0,last=0,serial=0;const pending=new Map();
 function schedule(){if(active&&!document.hidden&&pending.size&&!frame)frame=nativeFrame(flush);}
 function flush(now){frame=0;if(!active||document.hidden)return;if(preview&&now-last<1000/24){schedule();return;}last=now;const batch=[...pending];pending.clear();for(const [,callback]of batch)callback(now);schedule();}
 window.requestAnimationFrame=callback=>{const id=++serial;pending.set(id,callback);schedule();return id;};
 window.cancelAnimationFrame=id=>{pending.delete(id);};
 function setActive(value){active=value;root.dataset.demoPaused=String(!active||document.hidden);if(!active&&frame){nativeCancel(frame);frame=0;}schedule();}
 addEventListener('message',event=>{if(event.source!==parent||event.origin!==location.origin)return;if(event.data?.syolanaPreviewState)setActive(Boolean(event.data.active));});
 document.addEventListener('visibilitychange',()=>{root.dataset.demoPaused=String(document.hidden||!active);if(document.hidden&&frame){nativeCancel(frame);frame=0;}schedule();});
 const editable=target=>target?.closest?.('input,textarea,[contenteditable="true"]');
 for(const type of ['copy','cut','contextmenu','dragstart'])document.addEventListener(type,event=>{if(!editable(event.target))event.preventDefault();});
 document.addEventListener('keydown',event=>{if(editable(event.target))return;if((event.ctrlKey||event.metaKey)&&['s','p','u','c'].includes(event.key.toLowerCase()))event.preventDefault();});
 document.addEventListener('DOMContentLoaded',()=>{
  parent.postMessage({syolanaPreviewReady:true},location.origin);
  const sound=document.getElementById('sound-toggle');
  sound?.addEventListener('click',()=>{parent.postMessage({syolanaDemoSound:true},location.origin);});
  const scroller=document.getElementById('text-scroll');
  if(preview&&root.dataset.syolanaDemo==='book'&&scroller){
   const story=document.getElementById('story');
   if(story)scroller.scrollTop=Math.max(0,story.offsetTop-20);
   root.dataset.demoReader='true';
   scroller.dispatchEvent(new Event('scroll'));
  }
  schedule();
 });
 addEventListener('pagehide',()=>setActive(false));
 addEventListener('pageshow',()=>{if(!preview)setActive(true);});
})();
