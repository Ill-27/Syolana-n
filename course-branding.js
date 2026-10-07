import {protectCourseText} from './course-protection.js?v=20261007-1';
const BASE=new URL('./',import.meta.url);
let configuration;
const cardSelector='.pair,.day-card,.trainer-card,.coverage-card,.variant-card,.practice-body,.lesson-body,.word-body';
export async function brandingConfig(){
  if(!configuration)configuration=fetch(new URL('course-branding.json',BASE),{cache:'no-cache',signal:AbortSignal.timeout(4000)}).then(r=>r.ok?r.json():{}).catch(()=>({})).then(v=>({brand:'Syolana',domain:/^[a-z0-9](?:[a-z0-9.-]{1,80})\.[a-z]{2,15}$/.test(v.domain||'')?v.domain:'syolana.com'}));
  return configuration;
}
export async function mountCourseBranding({root=document,course='',personalMark='',cards=true}={}){
  const config=await brandingConfig(),doc=root.ownerDocument||root;
  if(!doc.getElementById('syolana-course-attribution-style')){const css=doc.createElement('link');css.id='syolana-course-attribution-style';css.rel='stylesheet';css.href=new URL('course-branding.css?v=20261007-language-marks-3',BASE).href;doc.head.append(css);}
  let mark=/^S-[a-f0-9]{12}$/.test(personalMark)?personalMark:'',disposed=false;
  const removeProtection=protectCourseText(doc),frames=new Map();
  function protectFrames(){for(const frame of doc.querySelectorAll('iframe.lesson-frame')){if(frames.has(frame))continue;const state={dispose:null,onload:null};state.onload=()=>{state.dispose?.();try{const d=frame.contentDocument;if(d?.body){if(!d.getElementById('syolana-course-protection-style')){const link=d.createElement('link');link.id='syolana-course-protection-style';link.rel='stylesheet';link.href=new URL('course-branding.css?v=20261007-1',BASE).href;d.head.append(link);}state.dispose=protectCourseText(d);}}catch{}};frame.addEventListener('load',state.onload);frames.set(frame,state);state.onload();}}
  const label=()=>config.domain+(mark?' · '+mark:'');
  const overlay=doc.createElement('div');overlay.className='course-attribution-layer';overlay.setAttribute('aria-hidden','true');overlay.setAttribute('role','presentation');overlay.inert=true;
  const nodes=[];
  if(window.parent===window){for(let i=0;i<12;i++){const n=doc.createElement('span'),copy=doc.createElement('small');n.className='course-attribution-mark';n.append(doc.createTextNode(config.domain),copy);copy.textContent=mark||course||config.brand;overlay.append(n);nodes.push(copy);}doc.body.append(overlay);}
  function attribute(){if(!cards||disposed)return;const target=root.querySelectorAll?root:doc;for(const node of target.querySelectorAll(cardSelector)){if(!node.classList.contains('pair')&&node.querySelector('.pair'))continue;node.classList.add('course-attributed-card');node.dataset.syolanaAttribution=label();}}
  let queued=false;const observer=new MutationObserver(()=>{if(!queued&&!disposed){queued=true;requestAnimationFrame(()=>{queued=false;attribute();protectFrames();});}});
  attribute();protectFrames();observer.observe(doc.body,{childList:true,subtree:true});
  function receive(e){if(e.origin!==location.origin||!e.data?.syolanaLesson||!/^S-[a-f0-9]{12}$/.test(e.data.courseAttribution||''))return;const frame=doc.querySelector('iframe.lesson-frame');if(!frame||e.source!==frame.contentWindow)return;mark=e.data.courseAttribution;nodes.forEach(n=>{n.textContent=mark;});attribute();}
  doc.defaultView.addEventListener('message',receive);
  return ()=>{disposed=true;observer.disconnect();overlay.remove();removeProtection();for(const [frame,s] of frames){frame.removeEventListener('load',s.onload);s.dispose?.();}doc.defaultView.removeEventListener('message',receive);};
}
