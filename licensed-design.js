import {ATTRIBUTION_TEXT,protectAttribution} from './attribution-guard.js';
const https=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash?u.href:'';}catch{return '';}};
const mountBrandLogo=brand=>{
 if(!brand||brand.querySelector('[data-syolana-logo]'))return;
 const logo=document.createElement('img');
 logo.src='https://syolana.com/assets/logo.svg?v=20261013-holo-1';
 logo.alt='';logo.width=34;logo.height=34;logo.dataset.syolanaLogo='true';
 Object.assign(logo.style,{display:'inline-block',width:'34px',height:'34px',marginRight:'8px',verticalAlign:'middle',objectFit:'contain',filter:'drop-shadow(0 0 10px rgba(197,164,255,.28))'});
 brand.prepend(logo);
};
export async function mountLicensedDesign({settings,license,themes=[],brand=document.getElementById('syolana-attribution')}){
 let live=false,closed=false,checking=false,expiry=0,frame,stop=()=>{};const remote=[];const previousStyle=document.documentElement.getAttribute('style');
 const controls=document.querySelector('.export-controls');if(controls)controls.hidden=true;
 const lose=()=>{if(closed)return;closed=true;live=false;stop();clearTimeout(expiry);clearInterval(timer);for(const n of remote)n.remove();frame?.remove();document.body.classList.remove('zen');if(controls)controls.hidden=true;if(previousStyle===null)document.documentElement.removeAttribute('style');else document.documentElement.setAttribute('style',previousStyle);};
 const palette=e=>{if(!live||e.source!==frame?.contentWindow||e.origin!=='https://syolana.com'||!e.data?.syolanaThemeState)return;if(/^[-a-z0-9]+$/.test(e.data.theme||''))document.documentElement.dataset.theme=e.data.theme;for(const [key,value]of Object.entries(e.data.vars||{}))if(/^--[a-z0-9-]{1,50}$/.test(key)&&typeof value==='string'&&value.length<250)document.documentElement.style.setProperty(key,value);};
 window.addEventListener('message',palette);
 async function verify(){
  if(closed||checking)return;checking=true;
  try{
   if(!license||!/^p-[a-f0-9]{12}$/.test(license.partnerId)||license.domain!==location.hostname)throw Error('Inactive');
   const endpoint=https(license.endpoint);if(!endpoint)throw Error('Inactive');
   const url=new URL(endpoint);url.searchParams.set('partnerId',license.partnerId);url.searchParams.set('hostname',location.hostname);
   const response=await fetch(url,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(5000)});if(!response.ok)throw Error('Inactive');const state=await response.json(),until=Date.parse(state.expiresAt);
   if(state.active!==true||state.partnerId!==license.partnerId||!state.allowedHosts?.includes(location.hostname)||!Number.isFinite(until)||until<=Date.now()||until>Date.now()+15*60*1000+30000)throw Error('Inactive');
   clearTimeout(expiry);expiry=setTimeout(lose,until-Date.now());
   if(!live){
    live=true;for(const path of ['assets/fonts/fonts.css','styles.css']){const link=document.createElement('link');link.rel='stylesheet';link.href='https://syolana.com/'+path;link.dataset.syolanaStyle='true';document.head.append(link);remote.push(link);}
    frame=document.createElement('iframe');frame.className='export-theme';frame.title='';frame.allow='autoplay';frame.setAttribute('aria-hidden','true');frame.src='https://syolana.com/theme-embed.html?theme='+encodeURIComponent(settings.theme);document.body.prepend(frame);
    if(controls)controls.hidden=false;
    mountBrandLogo(brand);
    stop=protectAttribution(brand,'https://syolana.com/',lose,{watermark:frame});
    const list=document.getElementById('theme-list');if(list){for(const item of themes){const button=document.createElement('button');button.type='button';button.className='theme-option';const image=document.createElement('img');image.className='theme-swatch';image.alt='';image.src='https://syolana.com/themes/previews/'+encodeURIComponent(item.id)+'.jpg';button.append(image,document.createTextNode(item.name));button.onclick=()=>{frame.contentWindow?.postMessage({syolanaEmbed:true,theme:item.id},'https://syolana.com');document.getElementById('theme-dialog').close();};list.append(button);}}
    const sound=document.getElementById('sound-toggle');if(sound)sound.onclick=()=>frame.contentWindow?.postMessage({syolanaEmbed:true,sound:true},'https://syolana.com');
    const zen=document.getElementById('zen-toggle');if(zen)zen.onclick=()=>{const active=document.body.classList.toggle('zen');frame.contentWindow?.postMessage({syolanaEmbed:true,zen:active},'https://syolana.com');};
    const theme=document.getElementById('theme-toggle');if(theme)theme.onclick=()=>document.getElementById('theme-dialog')?.showModal();
    document.getElementById('close-theme')?.addEventListener('click',()=>document.getElementById('theme-dialog').close());
   }
  }catch{lose();window.removeEventListener('message',palette);}finally{checking=false;}
 }
 const timer=setInterval(verify,10000);const onFocus=()=>{if(!document.hidden)verify();};window.addEventListener('focus',onFocus);document.addEventListener('visibilitychange',onFocus);
 await verify();return{destroy(){lose();window.removeEventListener('message',palette);window.removeEventListener('focus',onFocus);document.removeEventListener('visibilitychange',onFocus);}};
}