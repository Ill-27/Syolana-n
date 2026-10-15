import assert from 'node:assert/strict';
import {test} from 'node:test';
import {JSDOM} from 'jsdom';
import {readFile} from 'node:fs/promises';
import {ATTRIBUTION_TEXT,protectAttribution,attributionVisible} from '../attribution-guard.js';
function page(){
 const dom=new JSDOM('<!doctype html><body><main><p>Тексты партнёра</p></main><aside><a href="https://syolana.com/">'+ATTRIBUTION_TEXT+'</a></aside></body>',{url:'https://example.ru/',pretendToBeVisual:true});
 const w=dom.window;Object.assign(globalThis,{window:w,document:w.document,MutationObserver:w.MutationObserver,getComputedStyle:w.getComputedStyle.bind(w),innerWidth:390,innerHeight:844});
 const a=w.document.querySelector('a');a.style.fontSize='12px';a.getBoundingClientRect=()=>({left:12,top:800,right:212,bottom:822,width:200,height:22});
 return{dom,a};
}
test('removed attribution closes the optional layer once and leaves partner content',async()=>{
 const {dom,a}=page();let revoked=0;const stop=protectAttribution(a,a.href,()=>revoked++);a.remove();await new Promise(r=>setTimeout(r,90));
 assert.equal(revoked,1);assert.equal(document.querySelector('main').textContent,'Тексты партнёра');stop();dom.window.close();
});
test('hidden ancestors, edited link and edited author text fail validation',()=>{
 const {dom,a}=page();assert.equal(attributionVisible(a,a.href),true);a.parentElement.style.opacity='0';assert.equal(attributionVisible(a,a.href),false);a.parentElement.style.opacity='1';
 a.href='https://example.ru/';assert.equal(attributionVisible(a,'https://syolana.com/'),false);a.href='https://syolana.com/';a.textContent='';assert.equal(attributionVisible(a,a.href),false);dom.window.close();
});
test('premium teardown restores the complete original main and footer',async()=>{
 const {dom}=page();document.body.innerHTML='<header class="site-header">Свой заголовок</header><main><p>Тексты партнёра</p></main><footer>Свой подвал</footer>';
 const w=dom.window;w.HTMLElement.prototype.getBoundingClientRect=()=>({left:12,top:30,right:212,bottom:52,width:200,height:22});w.HTMLMediaElement.prototype.pause=()=>{};
 Object.assign(globalThis,{matchMedia:()=>({matches:false}),CustomEvent:w.CustomEvent,fetch:async()=>({ok:true,json:async()=>({songs:[]})})});
 class Theme{async init(){}setZen(){}destroy(){this.destroyed=true;}}
 globalThis.__partnerFakes={themes:{ThemeEngine:Theme},player:{Player:class{}},flight:{setupFlightLayer:()=>({destroy(){}}),platformFlightOffers:()=>[]}};
 const url=new URL('../partner-core.js',import.meta.url);let source=await readFile(url,'utf8');
 source=source.replace("'./attribution-guard.js'",JSON.stringify(new URL('../attribution-guard.js',import.meta.url).href)).replace("'./partner-attribution.js'",JSON.stringify(new URL('../partner-attribution.js',import.meta.url).href)).replaceAll('import.meta.url',JSON.stringify(url.href));
 for(const [name,fake]of [['themes','themes'],['player','player'],['flight','flight']])source=source.replace('import(central("'+name+'.js") + "?v=" + encodeURIComponent(version))','Promise.resolve(globalThis.__partnerFakes.'+fake+')');
 const module=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
 const handle=await module.mountPartnerCore();assert.equal(document.querySelector('main').parentElement.id,'content-shell');
 document.querySelector('.syolana-attribution').remove();await new Promise(r=>setTimeout(r,90));
 assert.equal(handle.theme.destroyed,true);assert.equal(document.querySelector('main').parentElement,document.body);assert.equal(document.querySelector('main').textContent,'Тексты партнёра');assert.equal(document.querySelector('footer').textContent,'Свой подвал');assert.equal(document.querySelector('.site-header').hidden,false);assert.equal(document.querySelector('[data-syolana-injected]'),null);dom.window.close();
});
test('a footer credit may scroll below the viewport and remains valid in contemplation',()=>{
 const {dom,a}=page();const footer=document.createElement('footer');footer.append(a);document.body.append(footer);
 a.getBoundingClientRect=()=>({left:12,top:1800,right:212,bottom:1822,width:200,height:22});
 assert.equal(attributionVisible(a,a.href),true);footer.style.display='none';assert.equal(attributionVisible(a,a.href),false);
 document.body.classList.add('zen');assert.equal(attributionVisible(a,a.href),true);a.remove();assert.equal(attributionVisible(a,'https://syolana.com/'),false);dom.window.close();
});
