import {polishView} from './polish.js';
import {refineView} from './refinements.js';
import {positionView} from './positioning.js';
import {polishPublicView} from './public-polish.js';
import {finishCopy} from './copy-polish.js';
import {applyI18n,restoreI18n} from './language-switcher.js';

window.__syolanaRenderUI=true;
let applying=false;
const observer=new MutationObserver(records=>{
 const useful=records.filter(r=>!((r.target.nodeType===1?r.target:r.target.parentElement)?.closest('[data-i18n-skip],.poem-text,.reader-text,.sketch-site')));
 if(!useful.length)return;
 const page=document.getElementById('page');
 if(useful.some(r=>r.type==='childList'&&page?.contains(r.target)&&[...r.addedNodes].some(n=>n.nodeType===1))){finishUI();return;}
 observer.disconnect();
 try{const roots=new Set(useful.map(r=>r.target));for(const root of roots)if(root.isConnected)applyI18n(root);}finally{observe();}
});
function observe(){
 for(const id of ['page','banner','main-nav','footer','chrome','music-dock','theme-dialog','player-dialog','toast','flight-layer']){
  const root=document.getElementById(id);
  if(root)observer.observe(root,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});
 }
}
export function finishUI(){
 if(applying)return;applying=true;observer.disconnect();
 try{
  restoreI18n();
  polishView();refineView();positionView();polishPublicView();finishCopy();
  applyI18n();
 }finally{applying=false;observe();}
}
window.addEventListener('syolana:locale',finishUI);
window.addEventListener('syolana:theme',finishUI);
window.addEventListener('hashchange',()=>queueMicrotask(finishUI));
observe();
