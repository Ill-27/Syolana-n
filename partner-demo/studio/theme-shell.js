import {setupStudioScene} from './scene-controls.mjs';
import {setupFlightLayer} from '../../flight.js';
const style=document.createElement('style');
style.textContent=`
  html,body{background:transparent!important;min-height:100%;}
  body{position:relative;color:#f6f1ff;}
  #studio-theme-backdrop{position:fixed;inset:-12px;z-index:-6;background:radial-gradient(circle at 50% 15%,rgba(38,47,73,.34),rgba(4,5,11,.50) 65%,rgba(1,2,5,.62));pointer-events:none;backdrop-filter:blur(1px)}
  #starCanvas{position:fixed!important;inset:-8px!important;width:calc(100vw + 16px)!important;height:calc(100vh + 16px)!important;z-index:-5!important;display:block!important;pointer-events:none!important;opacity:.82;filter:blur(2.2px) saturate(.88) brightness(.86);transform:scale(1.018);transform-origin:center}
  .studio-shell{position:relative;z-index:1}
  .studio-shell>.glass,.studio-grid>.glass,.builder-preview,.builder-block{background:rgba(var(--surface,9,9,23),.53)!important;backdrop-filter:blur(12px) saturate(112%);-webkit-backdrop-filter:blur(12px) saturate(112%);border-color:rgba(226,211,255,.22)!important;box-shadow:0 18px 46px rgba(0,0,0,.18),inset 0 1px 0 rgba(255,255,255,.055)}
  .syolana-studio-banner{margin-bottom:18px!important;display:grid!important;grid-template-columns:1fr auto!important;gap:16px!important;align-items:center!important;padding:18px 20px!important}
  .syolana-studio-banner h2{margin:.15rem 0 .45rem!important;font-family:"Syolana Script","Cormorant Garamond",Georgia,serif!important;font-weight:400!important}
  .syolana-studio-banner p{margin:0!important;color:#d8d0e3!important}.syolana-studio-banner .studio-head-actions{align-self:center!important}
  #studio-theme-helper{position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);pointer-events:none;opacity:0}
  .builder-theme-picker{border:0!important;padding:0!important;margin:16px 0 8px!important;min-width:0}
  .builder-theme-picker legend{padding:0 0 12px!important;font-weight:700}
  .builder-theme-choices{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:18px!important;margin-top:12px!important}
  .builder-theme-choice{position:relative!important;display:grid!important;grid-template-rows:minmax(160px,18vw) auto!important;grid-template-columns:1fr!important;overflow:hidden!important;border:1px solid rgba(218,199,242,.24)!important;border-radius:26px!important;background:rgba(var(--surface,9,8,22),.60)!important;min-width:0!important;min-height:0!important;align-items:stretch!important}
  .builder-theme-choice:has(input:checked){border-color:#d9bdf8!important;box-shadow:0 0 0 2px rgba(211,184,247,.17) inset,0 16px 40px rgba(0,0,0,.16)!important;background:rgba(var(--surface,9,8,22),.72)!important}
  .builder-theme-choice input{position:absolute!important;z-index:3!important;top:14px!important;right:14px!important;width:22px!important;height:22px!important;margin:0!important;accent-color:#d9bdf8!important}
  .builder-theme-swatch{display:block!important;width:100%!important;height:100%!important;min-height:160px!important;background-size:cover!important;background-position:center!important;filter:saturate(.92) brightness(.9)!important;border:0!important}
  .builder-theme-copy{display:grid!important;align-content:start!important;gap:9px!important;padding:18px 20px 20px!important;min-width:0!important;overflow:visible!important}
  .builder-theme-copy strong{font-family:"Syolana Script","Cormorant Garamond",Georgia,serif!important;font-size:clamp(1.45rem,3vw,1.9rem)!important;font-weight:400!important;line-height:1.22!important;color:#f6f0ff!important;overflow-wrap:anywhere!important;white-space:normal!important}
  .builder-theme-copy small{display:block!important;font:500 .84rem/1.55 system-ui,sans-serif!important;color:#d8d0e3!important;overflow-wrap:anywhere!important;white-space:normal!important;max-width:100%!important}
  @media(max-width:760px){
    .syolana-studio-banner{grid-template-columns:1fr!important}.syolana-studio-banner .studio-head-actions{justify-content:flex-start!important}
    .builder-theme-choices{grid-template-columns:1fr!important;gap:18px!important}
    .builder-theme-choice{grid-template-columns:1fr!important;grid-template-rows:clamp(148px,48vw,210px) auto!important}
    .builder-theme-swatch{min-height:148px!important;height:100%!important}
    .builder-theme-copy{padding:17px 18px 20px!important}
    .builder-theme-copy strong{font-size:1.55rem!important;line-height:1.25!important}
    .builder-theme-copy small{font-size:.82rem!important;line-height:1.5!important}
  }
  @media(max-width:420px){.builder-theme-choice{border-radius:22px!important}.builder-theme-copy{padding:15px 16px 18px!important}.builder-theme-copy strong{font-size:1.42rem!important}}
`;
document.head.append(style);

function addSyolanaBanner(){
  const shell=document.querySelector('.studio-shell');if(!shell||document.getElementById('syolana-studio-banner'))return;
  const banner=document.createElement('aside');banner.id='syolana-studio-banner';banner.className='syolana-studio-banner glass';banner.setAttribute('aria-label','Syolana');
  const copy=document.createElement('div');const eye=document.createElement('p');eye.className='eyebrow';eye.textContent='ОФОРМЛЕНО НА SYOLANA';const title=document.createElement('h2');title.textContent='Живые темы для сайтов';const text=document.createElement('p');text.textContent='Дизайнерские шаблоны, живые темы и авторские языковые курсы.';copy.append(eye,title,text);
  const actions=document.createElement('div');actions.className='studio-head-actions';const home=document.createElement('a');home.className='button primary';home.href='../../#/join';home.textContent='Посмотреть Syolana';const course=document.createElement('a');course.className='button secondary';course.href='../../#/lesson/en/a1/course';course.textContent='Английский A1 бесплатно';actions.append(home,course);banner.append(copy,actions);shell.prepend(banner);
}
addSyolanaBanner();

function normalizeDemoSettings(){
  const key='partner-demo.settings.lana-test';
  try{
    const raw=localStorage.getItem(key);if(!raw)return;
    const value=JSON.parse(raw);if(!value||typeof value!=='object')return;
    if(value.name==='Тестовый сайт Ланы'){value.name='Тестовый сайт';localStorage.setItem(key,JSON.stringify(value));}
  }catch{}
}
normalizeDemoSettings();

const backdrop=document.createElement('div');backdrop.id='studio-theme-backdrop';document.body.prepend(backdrop);
const canvas=document.createElement('canvas');canvas.id='starCanvas';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
const helper=document.createElement('div');helper.id='studio-theme-helper';helper.setAttribute('aria-hidden','true');
helper.innerHTML='<button id="theme-toggle" type="button"></button><span id="theme-name"></span><dialog id="theme-dialog"><div id="theme-list"></div></dialog>';
document.body.append(helper);

let engine,pendingTheme='';
function storedTheme(){try{const raw=localStorage.getItem('partner-demo.settings.lana-test');return raw?JSON.parse(raw)?.theme||'':'';}catch{return '';}}
async function start(){
  try{
    const {ThemeEngine}=await import('../../themes.js?v=20261011-worlds-2');engine=new ThemeEngine();setupStudioScene(engine,setupFlightLayer);await engine.init();
    const saved=pendingTheme||storedTheme();if(saved)await engine.select(saved).catch(()=>{});
    const dialog=document.getElementById('theme-dialog');dialog.setAttribute('open','');engine.startPreviews();
  }catch(error){console.warn('Studio live theme unavailable',error);}
}
function choose(input){if(!input.checked||!input.value)return;pendingTheme=input.value;if(engine)engine.select(input.value).then(()=>engine.startPreviews()).catch(()=>{});}
function wire(){
  document.querySelectorAll('.builder-theme-choice input[type="radio"],.managed-theme-choice input[type="radio"]').forEach(input=>{if(input.dataset.studioThemeWired)return;input.dataset.studioThemeWired='1';input.addEventListener('change',()=>choose(input));if(input.checked)choose(input);});
  if(engine){document.getElementById('theme-dialog')?.setAttribute('open','');engine.startPreviews();}
}
new MutationObserver(wire).observe(document.body,{childList:true,subtree:true});
window.addEventListener('syolana:builder-theme',e=>{const id=e.detail?.theme;if(!id)return;pendingTheme=id;if(engine)engine.select(id).then(()=>engine.startPreviews()).catch(()=>{});});
window.addEventListener('syolana:theme-previews',()=>{if(engine){document.getElementById('theme-dialog')?.setAttribute('open','');engine.startPreviews();}});
window.addEventListener('storage',()=>{const id=storedTheme();if(id){pendingTheme=id;if(engine)engine.select(id).catch(()=>{});}});
await start();wire();
