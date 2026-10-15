import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountLicensedDesign} from '../licensed-design.js';
const setup=()=>{const dom=new JSDOM('<!doctype html><body><div class="export-controls"></div><main>Свои тексты и фото</main><a id="syolana-attribution" href="https://syolana.com/">Темы и оформление — Syolana</a><dialog id="theme-dialog"></dialog></body>',{url:'https://example.ru/',pretendToBeVisual:true});const w=dom.window;Object.assign(globalThis,{window:w,document:w.document,location:w.location,MutationObserver:w.MutationObserver,getComputedStyle:w.getComputedStyle.bind(w),innerWidth:390,innerHeight:844});w.HTMLElement.prototype.getBoundingClientRect=()=>({width:200,height:22,left:12,top:20,right:212,bottom:42});document.querySelector('a').style.fontSize='12px';return dom;};
test('a registered licence starts design; removal of attribution removes all remote styling and retains content',async()=>{const dom=setup();globalThis.fetch=async()=>new Response(JSON.stringify({active:true,partnerId:'p-123456789abc',allowedHosts:['example.ru'],expiresAt:new Date(Date.now()+60000).toISOString()}));const handle=await mountLicensedDesign({settings:{theme:'moon'},license:{partnerId:'p-123456789abc',domain:'example.ru',endpoint:'https://api.syolana.com/api/course-access/partner-license'}});assert.equal(document.querySelectorAll('iframe').length,1);document.getElementById('syolana-attribution').remove();await new Promise(r=>setTimeout(r,90));assert.equal(document.querySelector('iframe'),null);assert.equal(document.querySelector('link[data-syolana-style]'),null);assert.equal(document.querySelector('main').textContent,'Свои тексты и фото');handle.destroy();dom.window.close();});
test('an unapproved domain never loads the premium iframe',async()=>{const dom=setup();let calls=0;globalThis.fetch=async()=>{calls++;throw Error('Network');};const h=await mountLicensedDesign({settings:{theme:'moon'},license:{partnerId:'p-123456789abc',domain:'wrong.ru',endpoint:'https://api.syolana.com/api/course-access/partner-license'}});assert.equal(calls,0);assert.equal(document.querySelector('iframe'),null);assert.equal(document.querySelector('main').textContent,'Свои тексты и фото');h.destroy();dom.window.close();});
test('expiry removes the licensed layer, restores base colours and retains client content',async()=>{
 const dom=setup();document.documentElement.dataset.theme='base';document.documentElement.style.setProperty('--client-colour','green');const before=document.documentElement.getAttribute('style');
 let options;globalThis.fetch=async(_url,init)=>{options=init;return new Response(JSON.stringify({active:true,partnerId:'p-123456789abc',allowedHosts:['example.ru'],expiresAt:new Date(Date.now()+220).toISOString()}));};
 const h=await mountLicensedDesign({settings:{theme:'moon'},license:{partnerId:'p-123456789abc',domain:'example.ru',endpoint:'https://api.syolana.com/api/course-access/partner-license'}});
 const frame=document.querySelector('iframe');assert.ok(frame);assert.equal(frame.referrerPolicy,'no-referrer');assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
 window.dispatchEvent(new dom.window.MessageEvent('message',{origin:'https://syolana.com',source:frame.contentWindow,data:{syolanaThemeState:true,theme:'moon',vars:{'--accent':'red'}}}));assert.equal(document.documentElement.dataset.theme,'moon');
 await new Promise(r=>setTimeout(r,320));assert.equal(document.querySelector('iframe'),null);assert.equal(document.querySelector('link[data-syolana-style]'),null);assert.equal(document.documentElement.dataset.theme,'base');assert.equal(document.documentElement.getAttribute('style'),before);assert.equal(document.querySelector('main').textContent,'Свои тексты и фото');h.destroy();dom.window.close();
});
test('an expired partner reaches export without receiving editing controls',async()=>{
 const dom=setup();const {mountManagedEditor}=await import('../managed-sites.js');const calls=[];
 globalThis.fetch=async url=>{const path=String(url).split('/api/course-access/')[1];calls.push(path);return new Response(JSON.stringify(path==='session'?{access:false,canCreateSite:false,canManageSite:true,siteId:'owned-site'}:{readOnly:true,settings:{name:'My own site'},project:{status:'published'},revision:1}),{headers:{'Content-Type':'application/json'}});};
 const root=document.createElement('div');document.body.append(root);const destroy=await mountManagedEditor(root,'owned-site');
 assert.ok(root.textContent.includes('Ваши материалы сохранены'));assert.ok([...root.querySelectorAll('button')].some(n=>n.textContent==='Скачать готовый сайт'));assert.equal(root.querySelector('.managed-builder'),null);assert.equal(root.querySelector('.managed-publisher'),null);assert.equal(root.querySelector('input[name="key"]'),null);assert.deepEqual(calls,['session','studio/owned-site/settings']);destroy();dom.window.close();
});
test('the final public pages retain licence terms, session rules and data disclosures',async()=>{
 const dom=setup();const root=document.createElement('main');root.id='page';document.body.append(root);
 const {positionView}=await import('../positioning.js');
 for(const route of ['join','terms','offer']){
  window.location.hash='#/'+route;root.replaceChildren();positionView();
  assert.match(root.textContent,/12 месяцев/);assert.match(root.textContent,/базовая структура сайта остаются у вас/);assert.match(root.textContent,/Ранее согласованные условия/);
 }
 assert.match(root.textContent,/650 ₽/);assert.match(root.textContent,/одну активную браузерную сессию/);assert.match(root.textContent,/Платные продажи пока закрыты/);assert.match(root.textContent,/права потребителя сохраняются/);
 window.location.hash='#/privacy';root.replaceChildren();positionView();
 assert.match(root.textContent,/случайную сессию/);assert.match(root.textContent,/Приложение не определяет/);assert.match(root.textContent,/уведомления Роскомнадзора/);assert.doesNotMatch(root.textContent,/одном активном устройстве/);
 window.location.hash='#/legal';root.replaceChildren();positionView();assert.match(root.textContent,/реальные сведения о продавце/);
 dom.window.close();
});

