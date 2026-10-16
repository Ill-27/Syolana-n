import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {contactBounds,mountAvitoDock} from '../avito-dock.js';
import {coursePurchaseButton,songCoursePromo,songCourseLink,songLanguage} from '../course-discovery.js';
import {setLocale} from '../i18n.js';

const rect=(left,top,width,height)=>({left,top,width,height,right:left+width,bottom:top+height});
test('contact leaves space around language, course audio and music controls at phone, tablet and desktop sizes',()=>{
  for(const [width,height] of [[320,568],[360,780],[393,852],[709,1536],[820,412],[1440,900]]) {
    for(const compact of [false,true]) {
      const header=rect(width-60,16,44,44),language=rect(width-60,74,44,47),music=rect(16,height-88,width-32,72),course=rect(70,height-154,width-86,54);
      const bounds=contactBounds({viewport:{top:0,bottom:height,right:width},width:compact?92:190,height:56,top:[header,language],bottom:[music,course]});
      assert(bounds.fits);assert(bounds.min>=language.bottom+16);assert(bounds.max+56<=course.top-16);
      const lowerPanel=rect(16,height-235,width-32,147);
      const expanded=contactBounds({viewport:{top:0,bottom:height,right:width},width:190,height:56,top:[language],bottom:[lowerPanel]});
      if(expanded.fits)assert(expanded.max+56<=lowerPanel.top-16);
    }
  }
  const bounds=contactBounds({viewport:{top:0,bottom:800,right:400},width:190,height:56,top:[rect(340,70,44,47)],bottom:[rect(16,700,368,80)],obstacles:[rect(350,400,50,50)]});
  assert.equal(bounds.slots.length,2);assert(bounds.slots[0][1]+56<=384);assert(bounds.slots[1][0]>=466);
  assert.equal(contactBounds({viewport:{top:0,bottom:200,right:320},width:56,height:56,top:[rect(260,10,44,100)],bottom:[rect(0,140,320,60)]}).fits,false);
});

test('real pointer handlers drag, clamp, collapse, expand and preserve the contact link',async()=>{
  const dom=new JSDOM('<div class="top-actions"></div><div class="syolana-lang"></div><div class="course-controls"></div><div id="music-dock"></div><a id="contact" class="syolana-avito-float" href="https://www.avito.ru/brands/i223140984"><span class="syolana-avito-float-label">Написать на Авито</span></a>',{url:'https://syolana.com/',pretendToBeVisual:true});
  const w=dom.window,d=w.document,link=d.getElementById('contact');
  Object.defineProperty(w,'innerWidth',{value:393});Object.defineProperty(w,'innerHeight',{value:852});
  d.querySelector('.top-actions').getBoundingClientRect=()=>rect(190,16,187,48);
  d.querySelector('.syolana-lang').getBoundingClientRect=()=>rect(330,78,47,47);
  d.querySelector('.course-controls').getBoundingClientRect=()=>rect(80,640,297,58);
  d.getElementById('music-dock').getBoundingClientRect=()=>rect(16,718,361,118);
  link.getBoundingClientRect=()=>rect(187,parseFloat(link.parentElement.style.top)||0,link.parentElement.hasAttribute('data-compact')?56:190,56);
  const key=key=>link.dispatchEvent(new w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true}));
  const pointer=(type,x,y)=>{const e=new w.Event(type,{bubbles:true,cancelable:true});Object.assign(e,{pointerId:1,isPrimary:true,button:0,clientX:x,clientY:y});link.dispatchEvent(e);};
  try {
    mountAvitoDock(link);const shell=link.parentElement;
    assert.equal(parseFloat(shell.style.top),562);
    pointer('pointerdown',340,580);pointer('pointermove',340,-200);pointer('pointerup',340,-200);
    assert.equal(parseFloat(shell.style.top),147,'Drag is clamped below the language control');
    assert.equal(link.dispatchEvent(new w.MouseEvent('click',{cancelable:true,detail:1})),false,'Dragging must not open Avito');
    pointer('pointerdown',340,170);pointer('pointermove',390,170);pointer('pointerup',390,170);
    assert(shell.hasAttribute('data-compact'));assert.equal(link.href,'https://www.avito.ru/brands/i223140984');
    pointer('pointerdown',370,170);pointer('pointermove',320,170);pointer('pointerup',320,170);assert(!shell.hasAttribute('data-compact'));
    key('End');assert.equal(parseFloat(shell.style.top),562);key('Home');assert.equal(parseFloat(shell.style.top),147);
    key('ArrowDown');assert.equal(parseFloat(shell.style.top),171);key('ArrowRight');assert(shell.hasAttribute('data-compact'));
    shell.querySelector('button').click();assert(!shell.hasAttribute('data-compact'));
    const saved=JSON.parse(w.localStorage.getItem('syolana.avito-dock.v1'));assert(saved.position>0&&saved.position<1);assert.equal(saved.compact,false);
    const folded=link.parentElement.querySelector('button');assert.equal(folded.getAttribute('aria-expanded'),'true');
    pointer('pointerdown',350,170);pointer('pointerup',350,170);
    let prevented;
    link.addEventListener('click',e=>{prevented=e.defaultPrevented;e.preventDefault();},{once:true});
    link.dispatchEvent(new w.MouseEvent('click',{cancelable:true,detail:1}));
    assert.equal(prevented,false,'An ordinary tap keeps the original link behaviour');
    d.querySelector('.course-controls').hidden=true;w.dispatchEvent(new w.Event('resize'));await new Promise(r=>w.setTimeout(r,25));
    key('End');assert.equal(parseFloat(shell.style.top),640,'The free range grows when course controls disappear');
    d.body.classList.add('zen');d.body.style.setProperty('--zen-contact-bottom','250px');w.dispatchEvent(new w.Event('resize'));await new Promise(r=>w.setTimeout(r,25));
    key('End');assert(parseFloat(shell.style.top)+56<=602,'Zen reserves space for its full stable hint row');
  }finally{dom.window.close();}
});

test('songs lead to their actual language and purchase links open Avito directly in every interface language',async()=>{
  const dom=new JSDOM('<main></main>',{url:'https://syolana.com/',pretendToBeVisual:true});
  const previous=new Map();
  for(const [key,value]of Object.entries({window:dom.window,document:dom.window.document,localStorage:dom.window.localStorage,CustomEvent:dom.window.CustomEvent})) {previous.set(key,Object.getOwnPropertyDescriptor(globalThis,key));Object.defineProperty(globalThis,key,{value,writable:true,configurable:true});}
  const d=dom.window.document;
  d.defaultView.HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','');};
  d.defaultView.HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new d.defaultView.Event('close'));};
  try {
    assert.equal(songLanguage({id:'poem'},[{id:'poem',originalLanguage:'es'}]),'es');assert.equal(songLanguage({language:'ru'}),null);
    for(const locale of ['ru','en','es','fr']) {
      setLocale(locale);
      const promo=songCoursePromo(['es','es']),inline=songCourseLink('es');
      assert.equal(promo.querySelectorAll('a').length,2);assert.equal(inline.querySelector('a').getAttribute('href'),'#/lesson/es/a1/course');
      assert(promo.querySelector('a[href="#/lesson/en/a1/course"]'));
      const button=coursePurchaseButton();d.body.append(button);
      assert.equal(button.tagName,'A');assert.equal(button.href,'https://www.avito.ru/brands/i223140984');assert.equal(button.target,'_blank');assert.match(button.rel,/noopener/);assert.equal(d.querySelector('dialog'),null);
      if(locale!=='ru')assert(!/[А-Яа-яЁё]/.test(promo.textContent+inline.textContent+button.textContent));
      button.remove();
    }
    setLocale('ru');
  }finally{
    dom.window.close();for(const [key,descriptor]of previous)if(descriptor)Object.defineProperty(globalThis,key,descriptor);else delete globalThis[key];
  }
});

