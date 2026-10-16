import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {mountLicensedDesign} from '../licensed-design.js';
import {calendarLicense,calendarWindow} from '../partner-periods.mjs';
import {createCalendarPartnerHTML,createRegisteredPartnerHTML,mountPartnerFileBuilder} from '../partner-file.mjs';
import {sketchPayload} from '../sketch-model.mjs';
import {createSiteArchive} from '../site-export.mjs';
const setup=()=>{const dom=new JSDOM('<!doctype html><body><div class="export-controls"></div><main>Свои тексты и фото</main><a id="syolana-attribution" href="https://syolana.com/">Сайт создан на Syolana</a><dialog id="theme-dialog"></dialog></body>',{url:'https://example.ru/',pretendToBeVisual:true});const w=dom.window;Object.assign(globalThis,{window:w,document:w.document,location:w.location,MutationObserver:w.MutationObserver,getComputedStyle:w.getComputedStyle.bind(w),innerWidth:390,innerHeight:844});w.HTMLElement.prototype.getBoundingClientRect=()=>({width:200,height:22,left:12,top:20,right:212,bottom:42});document.querySelector('a').style.fontSize='12px';return dom;};
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
  assert.match(root.textContent,/12 месяцев/);assert.match(root.textContent,/базовая структура сайта остаются у вас/);assert.doesNotMatch(root.textContent,/Ранее согласованные|ранее выдан|Прежние покупки/);assert.match(root.textContent,/Для всех партнёров/);
 }
 assert.match(root.textContent,/650 ₽/);assert.match(root.textContent,/одну активную браузерную сессию/);assert.match(root.textContent,/На сайте нет оформления заказа/);assert.match(root.textContent,/права потребителя сохраняются/);
 window.location.hash='#/privacy';root.replaceChildren();positionView();
 assert.match(root.textContent,/случайная сессия/);assert.match(root.textContent,/Приложение не определяет/);assert.ok(root.querySelector('a[href="legal-info/index.html#privacy"]'));assert.doesNotMatch(root.textContent,/одном активном устройстве/);
 window.location.hash='#/legal';root.replaceChildren();positionView();assert.ok(root.querySelector('a[href="legal-info/index.html"]'));
 dom.window.close();
});
test('shared Moscow calendar boundaries do not convert a trial into a paid period',()=>{
 const first=Date.parse('2027-01-01T00:00:00+03:00'),last=Date.parse('2028-01-01T00:00:00+03:00');
 assert.equal(first,Date.parse('2026-12-31T21:00:00Z'));assert.equal(last,Date.parse('2027-12-31T21:00:00Z'));
 assert.equal(calendarWindow('trial-2026',first-1).active,true);assert.equal(calendarWindow('trial-2026',first).active,false);
 assert.equal(calendarWindow('paid-2027',first-1).active,false);assert.equal(calendarWindow('paid-2027',first).active,true);
 assert.equal(calendarWindow('paid-2027',last-1).active,true);assert.equal(calendarWindow('paid-2027',last).active,false);
 assert.equal(calendarWindow('paid-2027',Date.parse('2027-11-20T18:00:00+03:00')).until,last);
 assert.deepEqual(calendarLicense(),{mode:'calendar',period:'trial-2026'});assert.equal(calendarWindow('constructor',first).active,false);assert.equal(calendarWindow('paid-2028',first).active,false);
});
test('calendar design makes no licence API calls and removes all styling at the shared deadline',async()=>{
 const actualNow=Date.now;let calls=0;
 try{for(const period of ['trial-2026','paid-2027']){
  const dom=setup(),until=calendarWindow(period).until;let now=until-60000;Date.now=()=>now;
  document.documentElement.dataset.theme='base';document.documentElement.setAttribute('style','--own-colour: green');
  globalThis.fetch=async()=>{calls++;throw Error('Calendar mode must not call a licence server');};
  const h=await mountLicensedDesign({settings:{theme:'moon'},license:calendarLicense(period)});assert.ok(document.querySelector('iframe'));assert.equal(document.querySelectorAll('link[data-syolana-style]').length,2);
  now=until;window.dispatchEvent(new dom.window.Event('focus'));
  assert.equal(document.querySelector('iframe'),null);assert.equal(document.querySelector('link[data-syolana-style]'),null);assert.equal(document.querySelector('[data-syolana-logo]'),null);assert.equal(document.documentElement.dataset.theme,'base');assert.equal(document.documentElement.getAttribute('style'),'--own-colour: green');assert.equal(document.querySelector('main').textContent,'Свои тексты и фото');assert.equal(document.querySelector('.export-controls').hidden,true);h.destroy();dom.window.close();
 }}finally{Date.now=actualNow;}assert.equal(calls,0);
});
test('expired trial cannot load paid design and generated files carry only a shared permission',async()=>{
 const actualNow=Date.now,cutoff=Date.parse('2027-01-01T00:00:00+03:00'),dom=setup();let calls=0;
 try{Date.now=()=>cutoff;globalThis.fetch=async()=>{calls++;throw Error('No licence API');};const h=await mountLicensedDesign({settings:{theme:'moon'},license:calendarLicense()});assert.equal(document.querySelector('iframe'),null);h.destroy();}finally{Date.now=actualNow;dom.window.close();}assert.equal(calls,0);
 const hostile='</script><script>alert(1)</script>',html=createCalendarPartnerHTML({name:hostile,theme:'moon'},{now:cutoff-1});
 assert.ok(html.includes('"mode":"calendar","period":"trial-2026"'));assert.ok(html.includes('https://syolana.com/licensed-design.js'));assert.ok(html.includes('name="referrer" content="no-referrer"'));assert.ok(!html.includes('<script>alert(1)</script>'));assert.ok(!/partnerId|licenseEndpoint|api\/course-access|sessionToken/.test(html));
 const paid=createCalendarPartnerHTML({name:'My site'},{period:'paid-2027',now:cutoff});assert.ok(paid.includes('"period":"paid-2027"'));assert.throws(()=>createCalendarPartnerHTML({},{now:cutoff}),/закончился/);
});
test('owner prepares a pending registered file without uploading the sketch',async()=>{
 const dom=setup(),root=document.createElement('div');document.body.append(root);const saved=[],prepared=[];let owner=false,calls=0;
 globalThis.fetch=async()=>{calls++;throw Error('The sketch stays local');};const dispose=mountPartnerFileBuilder(root,{isOwner:()=>owner,download:(name,html)=>saved.push({name,html}),onPrepared:code=>prepared.push(code)});
 const input=root.querySelector('input[type=file]');Object.defineProperty(input,'files',{value:[{size:100,text:async()=>JSON.stringify(sketchPayload({name:'Own project'}))}]});
 const submit=async()=>root.querySelector('form').onsubmit({preventDefault(){}});await submit();assert.equal(saved.length,0);owner=true;await submit();assert.equal(saved.length,1);
 assert.match(prepared[0],/^p-[a-f0-9]{12}$/);assert.ok(saved[0].html.includes('"mode":"registered"'));assert.ok(saved[0].html.includes(prepared[0]));assert.ok(!saved[0].html.includes('"mode":"calendar"'));assert.equal(calls,0);dispose();dom.window.close();
});
test('registered file waits for approval, activates, and removes design after revocation',async()=>{
 const dom=setup();let allowed=false,paths=[];
 globalThis.fetch=async value=>{const u=new URL(value);paths.push(u);return new Response(JSON.stringify(u.pathname.endsWith('access-service.json')?{ready:true,origin:'https://api.syolana.com'}:allowed?{active:true,partnerId:'p-123456789abc',allowedHosts:['example.ru'],expiresAt:new Date(Date.now()+15000).toISOString()}:{active:false}));};
 const h=await mountLicensedDesign({settings:{theme:'moon'},license:{mode:'registered',partnerId:'p-123456789abc',configUrl:'https://syolana.com/access-service.json'}});
 assert.equal(document.querySelector('iframe'),null);allowed=true;window.dispatchEvent(new dom.window.Event('focus'));await new Promise(r=>setTimeout(r,30));assert.ok(document.querySelector('iframe'));
 assert.equal(paths.at(-1).searchParams.get('pathname'),'/');assert.equal(paths.at(-1).searchParams.has('search'),false);
 allowed=false;window.dispatchEvent(new dom.window.Event('focus'));await new Promise(r=>setTimeout(r,30));assert.equal(document.querySelector('iframe'),null);assert.equal(document.querySelector('main').textContent,'Свои тексты и фото');h.destroy();dom.window.close();
});
test('the website archive includes its calendar dependency and preserves an existing server licence',async()=>{
 const legacy={partnerId:'p-123456789abc',domain:'example.ru',endpoint:'https://api.syolana.com/partner-license'};
 for(const license of [undefined,legacy]){
  const requested=[],blob=await createSiteArchive({settings:{name:'Own site',theme:'moon',blocks:[]},...(license?{license}:{})},{nativeFetch:async value=>{const url=new URL(value);requested.push(url.pathname);return new Response(url.pathname.endsWith('themes/manifest.json')?JSON.stringify([{id:'moon',name:'Moon'}]):'module source');}});
  const bytes=new Uint8Array(await blob.arrayBuffer()),view=new DataView(bytes.buffer),decoder=new TextDecoder(),files=new Map();let offset=0;
  while(view.getUint32(offset,true)===0x04034b50){const size=view.getUint32(offset+18,true),names=view.getUint16(offset+26,true),extra=view.getUint16(offset+28,true),start=offset+30+names+extra;files.set(decoder.decode(bytes.slice(offset+30,offset+30+names)),decoder.decode(bytes.slice(start,start+size)));offset=start+size;}
  assert.ok(files.has('partner-periods.mjs'));assert.ok(requested.some(v=>v.endsWith('/partner-periods.mjs')));const permission=JSON.parse(files.get('site-settings.json')).license;if(license)assert.deepEqual(permission,license);else{assert.equal(permission.mode,'registered');assert.match(permission.partnerId,/^p-[a-f0-9]{12}$/);}assert.equal(requested.some(v=>v.includes('/api/')),false);
 }
});

