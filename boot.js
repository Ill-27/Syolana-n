import './device-access.js';
import './trust-ui.js';
import './brand-effects.js';
import './language-switcher.js';
import './theme-sound.js';
import {installAPITransport} from './api-transport.js';
import {tr} from './i18n.js';
import {prepareStartupTypography,finishStartupUI} from './startup-ui.js';
installAPITransport();
const startupTypography=prepareStartupTypography(document);
if(/^#\/lesson\//.test(location.hash))document.body.classList.add('course-reading');
if(/^\/(?:partner|studio|editor)\/?$/.test(location.pathname))location.replace(new URL('./#/create-site',document.baseURI).href);
let previousHash=location.hash,savedY=0;
const nativeScroll=window.scrollTo.bind(window);
let preserveScroll=false;
window.scrollTo=(...args)=>{const x=args[0];if(preserveScroll&&(x===0||(x&&typeof x==='object'&&x.top===0)))return;nativeScroll(...args);};
window.addEventListener('hashchange',()=>{
 const next=location.hash,isLanguage=hash=>/^#\/languages(?:\/[a-z]{2})?(?:$|\/)/.test(hash);
 preserveScroll=isLanguage(previousHash)&&isLanguage(next);previousHash=next;
 if(!preserveScroll)return;savedY=window.scrollY;
 requestAnimationFrame(()=>{nativeScroll({top:savedY,behavior:'instant'});preserveScroll=false;});
},true);
try {await import('./app.js');}catch(error){
 console.error('Site startup:',error);
 const page=document.getElementById('page');
 if(page&&(!page.children.length||page.querySelector('.loading'))){
  const p=document.createElement('p');p.className='notice';p.textContent=tr('Не удалось загрузить основной модуль. Проверьте соединение и попробуйте ещё раз — уже открытые части сайта не затрагиваются.');
  const retry=document.createElement('button');retry.className='btn';retry.textContent=tr('Попробовать снова');retry.onclick=()=>location.reload();page.replaceChildren(p,retry);
 }
}finally{await finishStartupUI(document,startupTypography);}
if('serviceWorker' in navigator&&location.protocol==='https:'){
 const register=()=>navigator.serviceWorker.register(new URL('./sw.js',document.baseURI),{scope:new URL('./',document.baseURI).pathname,updateViaCache:'none'}).catch(()=>{});
 if('requestIdleCallback' in window)requestIdleCallback(register,{timeout:10000});else setTimeout(register,2500);
}
