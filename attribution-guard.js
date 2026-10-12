export const ATTRIBUTION_TEXT='Темы и оформление — Syolana';
export function attributionVisible(node,expectedHref){
 if(!node?.isConnected||node.textContent.trim()!==ATTRIBUTION_TEXT||node.href!==expectedHref)return false;
 const rect=node.getBoundingClientRect();
 if(rect.width<130||rect.height<14||rect.right<=0||rect.bottom<=0||rect.left>=innerWidth||rect.top>=innerHeight)return false;
 let opacity=1;
 for(let p=node;p&&p.nodeType===1;p=p.parentElement){const s=getComputedStyle(p);opacity*=Number(s.opacity||1);if(p.hidden||s.display==='none'||s.visibility==='hidden'||s.visibility==='collapse'||s.contentVisibility==='hidden'||(s.clipPath&&s.clipPath!=='none')||/brightness\(0(?:\.0+)?\)/.test(s.filter)||opacity<.45)return false;}
 const style=getComputedStyle(node);
 if(parseFloat(style.fontSize)<10||/rgba\([^)]*,\s*0(?:\.0+)?\)/.test(style.color))return false;
 return true;
}
export function protectAttribution(node,expectedHref,onLost,{watermark}={}){
 let stopped=false,pending=0;
 const sceneVisible=()=>{if(!watermark)return true;if(!watermark.isConnected)return false;for(let p=watermark;p&&p.nodeType===1;p=p.parentElement){const s=getComputedStyle(p);if(p.hidden||s.display==='none'||s.visibility==='hidden'||Number(s.opacity||1)===0)return false;}return true;};
 const verify=()=>{pending=0;if(stopped)return;if(!attributionVisible(node,expectedHref)||!sceneVisible()){stop();onLost();}};
 const schedule=()=>{if(!pending&&!stopped)pending=setTimeout(verify,50);};
 const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true,attributes:true,characterData:true});
 const interval=setInterval(verify,1000);window.addEventListener('resize',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',schedule);
 function stop(){if(stopped)return;stopped=true;observer.disconnect();clearInterval(interval);clearTimeout(pending);window.removeEventListener('resize',schedule);window.removeEventListener('pageshow',schedule);document.removeEventListener('visibilitychange',schedule);}
 verify();return stop;
}
