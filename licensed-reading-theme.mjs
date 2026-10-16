const secureURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash?u:null;}catch{return null;}};

export function watchRegisteredDesign({license,activate,deactivate,nativeFetch=fetch,page=location,clock=Date.now,interval=10000,schedule=setTimeout,cancel=clearTimeout}) {
 let destroyed=false,checking=false,active=false,generation=0,timer,expiry;
 const lose=()=>{active=false;generation++;cancel(expiry);deactivate();};
 async function verify(){
  if(destroyed||checking)return;checking=true;
  try{
   const endpoint=secureURL(license?.endpoint),site=secureURL(license?.siteUrl);
   if(!endpoint||endpoint.pathname!=='/api/course-access/partner-license'||endpoint.search||!site||site.hostname!==page.hostname||!page.pathname.startsWith(site.pathname)||!/^p-[a-f0-9]{12}$/.test(license.partnerId||''))throw Error('Inactive');
   endpoint.searchParams.set('partnerId',license.partnerId);endpoint.searchParams.set('hostname',page.hostname);endpoint.searchParams.set('pathname',page.pathname);
   const response=await nativeFetch(endpoint.href,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});
   if(!response.ok)throw Error('Inactive');const state=await response.json(),until=Date.parse(state.expiresAt),stamp=clock();if(destroyed)return;
   if(state.active!==true||state.partnerId!==license.partnerId||!state.allowedHosts?.includes(page.hostname)||!Number.isFinite(until)||until<=stamp||until>stamp+30000)throw Error('Inactive');
   cancel(expiry);expiry=schedule(lose,until-stamp);
   if(!active){active=true;const version=++generation;await activate(()=>!destroyed&&active&&version===generation);if(destroyed||version!==generation)deactivate();}
  }catch{lose();}finally{checking=false;}
 }
 const ready=verify();
 const repeat=()=>{if(destroyed)return;verify().finally(()=>{if(!destroyed)timer=schedule(repeat,interval);});};
 ready.finally(()=>{if(!destroyed)timer=schedule(repeat,interval);});
 const focus=()=>{if(!document.hidden)verify();};window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
 return{ready,verify,destroy(){if(destroyed)return;destroyed=true;cancel(timer);cancel(expiry);lose();window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);}};
}

export class ThemeEngine {
 constructor({license=window.__syolanaDesignLicense,load=()=>import('https://syolana.com/themes.js')}={}){this.license=license;this.load=load;this.engine=null;this.selected='';}
 async init(){
  this.baseStyle=document.documentElement.getAttribute('style');
  this.stop();
  this.permission=watchRegisteredDesign({license:this.license,activate:async isCurrent=>{
   const {ThemeEngine:Engine}=await this.load();if(!isCurrent())return;const engine=new Engine();this.engine=engine;
   await engine.init();if(this.engine!==engine||!isCurrent()){engine.destroy();return;}
   document.documentElement.dataset.syolanaDesign='active';
   for(const css of document.querySelectorAll('link[data-design-fonts]'))css.disabled=false;
   if(this.selected)await engine.select(this.selected);
  },deactivate:()=>this.stop()});
  await this.permission.ready;
 }
 stop(){
  this.engine?.destroy();this.engine=null;document.documentElement.dataset.syolanaDesign='off';
  if(this.baseStyle===null)document.documentElement.removeAttribute('style');else if(this.baseStyle!==undefined)document.documentElement.setAttribute('style',this.baseStyle);
  document.body.classList.remove('zen');const content=document.getElementById('content-shell');if(content)content.inert=false;
  document.getElementById('theme-dialog')?.close?.();
  for(const css of document.querySelectorAll('link[data-design-fonts]'))css.disabled=true;
 }
 select(id,options){this.selected=id;return this.engine?.select(id,options)||Promise.resolve();}
 setZen(active){if(this.engine)this.engine.setZen(active);else{document.body.classList.remove('zen');const content=document.getElementById('content-shell');if(content)content.inert=false;}}
 move(...args){return this.engine?.move(...args);}
 settle(...args){return this.engine?.settle(...args);}
 selectAt(...args){return this.engine?.selectAt(...args);}
 rotateSelected(...args){return this.engine?.rotateSelected(...args);}
 get theme(){return this.engine?.theme;}
 get flowerSelected(){return this.engine?.flowerSelected||false;}
 destroy(){this.permission?.destroy();this.stop();}
}
