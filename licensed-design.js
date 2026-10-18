import {prepareAttribution,setPlainSite,mountDesignMarks} from './partner-attribution.js';
import {ATTRIBUTION_TEXT,protectAttribution} from './attribution-guard.js';
import {calendarWindow,TRIAL_THEME_IDS} from './partner-periods.mjs';
const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash?u.href:'';}catch{return '';}};
const mountBrandLogo=brand=>prepareAttribution(brand);
export async function mountLicensedDesign({settings,license,themes=[],brand=document.getElementById('syolana-attribution')}){
 const calendar=license?.mode==='calendar';
 setPlainSite(true);
 let contacts,marks,allowed=null,themeChoice=settings.theme;
 let live=false,closed=false,checking=false,expiry=0,frame,stop=()=>{};const remote=[];const previousStyle=document.documentElement.getAttribute('style'),previousTheme=document.documentElement.getAttribute('data-theme');
 const controls=document.querySelector('.export-controls');if(controls)controls.hidden=true;
 const lose=(permanent=false)=>{if(closed)return;if(permanent){closed=true;clearInterval(timer);}live=false;setPlainSite(true);contacts?.destroy();contacts=null;marks?.destroy();marks=null;stop();stop=()=>{};clearTimeout(expiry);for(const n of remote)n.remove();remote.length=0;frame?.remove();frame=undefined;document.getElementById('theme-list')?.replaceChildren();brand?.querySelector('[data-syolana-logo]')?.remove();document.body.classList.remove('zen');document.getElementById('theme-dialog')?.close?.();if(controls)controls.hidden=true;if(previousStyle===null)document.documentElement.removeAttribute('style');else document.documentElement.setAttribute('style',previousStyle);if(previousTheme===null)document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',previousTheme);};
 const palette=e=>{if(!live||e.source!==frame?.contentWindow||e.origin!=='https://syolana.com'||!e.data?.syolanaThemeState)return;if(/^[-a-z0-9]+$/.test(e.data.theme||''))document.documentElement.dataset.theme=e.data.theme;if(typeof e.data.themeName==='string'&&e.data.themeName.length<120)marks?.update(e.data.themeName);for(const [key,value]of Object.entries(e.data.vars||{}))if(/^--[a-z0-9-]{1,50}$/.test(key)&&typeof value==='string'&&value.length<250)document.documentElement.style.setProperty(key,value);};
 window.addEventListener('message',palette);
 async function verify(){
  if(closed||checking)return;checking=true;
  try{
   let until,access;
   if(calendar){
    const state=calendarWindow(license.period);if(!state.active)throw Error('Inactive');until=state.until;if(license.period==='trial-2026'){if(!TRIAL_THEME_IDS.includes(settings.theme))throw Error('Inactive');access={theme:settings.theme,allowedThemes:[settings.theme]};}
   }else{
   if(!license||!/^p-[a-f0-9]{12}$/.test(license.partnerId)||(license.domain&&license.domain!==location.hostname))throw Error('Inactive');
   let endpoint=https(license.endpoint);
   if(license.configUrl==='https://syolana.com/access-service.json'){
    const configResponse=await fetch(license.configUrl,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});if(!configResponse.ok)throw Error('Inactive');
    const config=await configResponse.json(),origin=https(config.origin);if(config.ready!==true||!origin||new URL(origin).pathname!=='/'||new URL(origin).search)throw Error('Inactive');endpoint=new URL('/api/course-access/partner-license',origin).href;
   }
   if(!endpoint)throw Error('Inactive');
   const url=new URL(endpoint);url.searchParams.set('partnerId',license.partnerId);url.searchParams.set('hostname',location.hostname);url.searchParams.set('pathname',location.pathname);
   const response=await fetch(url,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Inactive');const state=await response.json();until=Date.parse(state.expiresAt);
   if(state.active!==true||state.partnerId!==license.partnerId||!state.allowedHosts?.includes(location.hostname)||!Number.isFinite(until)||until<=Date.now()||until>Date.now()+15*60*1000+30000)throw Error('Inactive');
   access=state.themeAccess||{theme:TRIAL_THEME_IDS.includes(settings.theme)?settings.theme:'aurora',allowedThemes:[TRIAL_THEME_IDS.includes(settings.theme)?settings.theme:'aurora']};
   }
   const nextAllowed=access?.allowedThemes||null;const nextTheme=access?.theme||settings.theme;if(live&&(JSON.stringify(allowed)!==JSON.stringify(nextAllowed)||themeChoice!==nextTheme))lose();allowed=nextAllowed;themeChoice=nextTheme;
   clearTimeout(expiry);expiry=setTimeout(calendar?verify:()=>lose(),Math.max(0,Math.min(2147480000,until-Date.now())));
   if(!live){
    live=true;setPlainSite(false);marks=mountDesignMarks();void import('https://syolana.com/avito-dock.js?v=20261018-identity-1').then(m=>{if(live&&!closed)contacts=m.ensureContactDock();}).catch(()=>{});for(const path of ['assets/fonts/fonts.css','styles.css']){const link=document.createElement('link');link.rel='stylesheet';link.href='https://syolana.com/'+path;link.referrerPolicy='no-referrer';link.dataset.syolanaStyle='true';document.head.append(link);remote.push(link);}
    frame=document.createElement('iframe');frame.className='export-theme';frame.title='';frame.allow='autoplay';frame.referrerPolicy='no-referrer';frame.setAttribute('aria-hidden','true');frame.src='https://syolana.com/theme-embed.html?outsideMarks=1&theme='+encodeURIComponent(themeChoice)+(allowed?'&allowedTheme='+encodeURIComponent(allowed[0]):'');document.body.prepend(frame);
    if(controls)controls.hidden=false;
    mountBrandLogo(brand);
    stop=protectAttribution(brand,'https://syolana.com/',()=>lose(true),{watermark:frame,marks:marks.nodes});
    const list=document.getElementById('theme-list');if(list){for(const item of themes.filter(t=>!allowed||allowed.includes(t.id))){const button=document.createElement('button');button.type='button';button.className='theme-option';const image=document.createElement('img');image.className='theme-swatch';image.alt='';image.src='https://syolana.com/themes/previews/'+encodeURIComponent(item.id)+'.jpg';button.append(image,document.createTextNode(item.name));button.onclick=()=>{frame.contentWindow?.postMessage({syolanaEmbed:true,theme:item.id},'https://syolana.com');document.getElementById('theme-dialog').close();};list.append(button);}}
    const sound=document.getElementById('sound-toggle');if(sound)sound.onclick=()=>frame.contentWindow?.postMessage({syolanaEmbed:true,sound:true},'https://syolana.com');
    const zen=document.getElementById('zen-toggle');if(zen)zen.onclick=()=>{const active=document.body.classList.toggle('zen');frame.contentWindow?.postMessage({syolanaEmbed:true,zen:active},'https://syolana.com');};
    const theme=document.getElementById('theme-toggle');if(theme)theme.onclick=()=>document.getElementById('theme-dialog')?.showModal();
    document.getElementById('close-theme')?.addEventListener('click',()=>document.getElementById('theme-dialog').close());
   }
  }catch{lose();}finally{checking=false;}
 }
 const timer=setInterval(verify,calendar?60000:10000);const onFocus=()=>{if(!document.hidden)verify();};window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);
 await verify();return{destroy(){lose(true);window.removeEventListener('message',palette);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus);}};
}

