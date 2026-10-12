import {applyI18n} from './language-switcher.js';
import readerTranslations from './reader-translations.json' with {type:'json'};
import {tr,sourceFor,registerTranslations} from './i18n.js';
registerTranslations(readerTranslations);
document.body.dataset.i18nMetaSkip='true';
window.__syolanaRenderUI=true;
let working=false;
const observer=new MutationObserver(apply);
function observe(){observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['aria-label','title','placeholder','alt']});}
function apply(){
 if(working)return;working=true;observer.disconnect();
 try{applyI18n();document.title=tr(sourceFor(document.title));}finally{working=false;observe();}
}
window.addEventListener('syolana:locale',apply);
window.addEventListener('syolana:theme',apply);
apply();
