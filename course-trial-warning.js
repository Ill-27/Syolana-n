import {getLocale,tr} from './i18n.js?v=20261012-i18n-2';

const TEXT='Не оформляйте подписку, пока не пройдёте бесплатный английский A1 и не убедитесь, что вам подходит этот формат. Методика, структура уроков и принцип практики едины для всех языков Syolana.';
const TITLE='Сначала попробуйте методику бесплатно';
const CTA='Открыть английский A1 бесплатно';

function style(){
  if(document.getElementById('syolana-course-trial-style'))return;
  const s=document.createElement('style');
  s.id='syolana-course-trial-style';
  s.textContent=`.syolana-course-trial{margin:22px 0;padding:22px 20px;border:1px solid rgba(220,195,255,.34);border-radius:24px;background:linear-gradient(135deg,rgba(135,99,190,.14),rgba(255,255,255,.025)),rgba(10,10,24,.62);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);font-family:Inter,system-ui,sans-serif}.syolana-course-trial strong{display:block;margin:0 0 13px;font-family:Inter,system-ui,sans-serif;font-size:1.06rem;line-height:1.35;font-weight:700}.syolana-course-trial p{margin:0 0 18px;line-height:1.68;font-family:Inter,system-ui,sans-serif}.syolana-course-trial a{display:flex;align-items:center;justify-content:center;text-align:center;min-height:58px;padding:13px 18px;border:1px solid rgba(220,195,255,.38);border-radius:999px;color:inherit;text-decoration:none;font-family:Inter,system-ui,sans-serif;font-weight:700;line-height:1.28;white-space:normal}`;
  document.head.append(s);
}

function renderText(note){
  const title=note.querySelector('strong');
  const p=note.querySelector('p');
  const a=note.querySelector('a');
  const titleText=tr(TITLE,getLocale());
  const bodyText=tr(TEXT,getLocale());
  const ctaText=tr(CTA,getLocale());
  if(title&&title.textContent!==titleText)title.textContent=titleText;
  if(p&&p.textContent!==bodyText)p.textContent=bodyText;
  if(a&&a.textContent!==ctaText)a.textContent=ctaText;
  document.documentElement.lang=getLocale();
}

function apply(){
  style();
  const screen=document.querySelector('.access-screen');
  if(!screen)return;
  let note=screen.querySelector('.syolana-course-trial');
  if(!note){
    note=document.createElement('section');
    note.className='syolana-course-trial';
    const title=document.createElement('strong');
    const p=document.createElement('p');
    const a=document.createElement('a');
    a.href=new URL('./#/lesson/en/a1/course',import.meta.url).href;
    a.target='_top';
    note.append(title,p,a);
    const intro=screen.querySelector('.access-intro');
    if(intro?.nextSibling)screen.insertBefore(note,intro.nextSibling);else screen.prepend(note);
  }
  renderText(note);
}

apply();
new MutationObserver(()=>requestAnimationFrame(apply)).observe(document.documentElement,{childList:true,subtree:true});
window.addEventListener('storage',event=>{if(event.key==='syolana.locale.v1')requestAnimationFrame(apply);});
window.addEventListener('syolana:locale',()=>requestAnimationFrame(apply));
