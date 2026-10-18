import {startDesignLoading,finishDesignLoading} from './design-start.js';
const secureURL=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.hash?u:null;}catch{return null;}};

export function watchRegisteredDesign({license,activate,deactivate,nativeFetch=fetch,page=location,clock=Date.now,interval=10000,schedule=setTimeout,cancel=clearTimeout,update=()=>{}}) {
 let destroyed=false,checking=false,active=false,generation=0,timer,expiry,nextCheck=interval,approvedUntil=0;
 const lose=(reason='inactive')=>{active=false;approvedUntil=0;nextCheck=interval;generation++;cancel(expiry);deactivate(reason);};
 async function verify(){
  if(destroyed||checking)return;checking=true;let activation,transportFailure=false;nextCheck=interval;
  try{
   const endpoint=secureURL(license?.endpoint),site=secureURL(license?.siteUrl);
   if(!endpoint||endpoint.pathname!=='/api/course-access/partner-license'||endpoint.search||!site||site.hostname!==page.hostname||!page.pathname.startsWith(site.pathname)||!/^p-[a-f0-9]{12}$/.test(license.partnerId||''))throw Error('Inactive');
   endpoint.searchParams.set('partnerId',license.partnerId);endpoint.searchParams.set('hostname',page.hostname);endpoint.searchParams.set('pathname',page.pathname);
   let response;try{response=await nativeFetch(endpoint.href,{cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(5000)});}catch(error){transportFailure=true;throw error;}
   if(!response.ok){transportFailure=response.status>=500||response.status===429;throw Error('Inactive');}const state=await response.json(),until=Date.parse(state.expiresAt),stamp=clock();if(destroyed)return;
   if(state.active!==true||state.partnerId!==license.partnerId||!state.allowedHosts?.includes(page.hostname)||!Number.isFinite(until)||until<=stamp||until>stamp+30000)throw Error('Inactive');
   approvedUntil=until;cancel(expiry);expiry=schedule(()=>lose('unavailable'),until-stamp);
   nextCheck=Math.min(interval,Math.max(1000,(until-stamp)/2));
   if(update(state)===false)active=false;
   if(!active){
    active=true;const version=++generation,isCurrent=()=>!destroyed&&active&&version===generation;
    activation=Promise.resolve().then(()=>{if(isCurrent())return activate(isCurrent,state);}).catch(()=>{if(isCurrent())lose('unavailable');});
   }
  }catch{if(!destroyed){if(transportFailure&&active&&approvedUntil>clock())nextCheck=Math.max(1,Math.min(1000,(approvedUntil-clock())/2));else lose(transportFailure?'unavailable':'inactive');}}finally{
   checking=false;cancel(timer);
   if(!destroyed)timer=schedule(()=>{void verify();},nextCheck);
  }
  if(activation)await activation;
 }
 const ready=verify();
 const focus=()=>{if(!document.hidden)verify();};window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);
 return{ready,verify,destroy(){if(destroyed)return;destroyed=true;cancel(timer);cancel(expiry);lose();window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);}};
}

export function prepareDesignFonts({timeout=1800}={}){
 const links=[...document.querySelectorAll('link[data-design-fonts]')],cleanup=[];
 let timer,finish,cancelled=false;
 const stylesheet=link=>new Promise(resolve=>{
  const done=()=>{link.removeEventListener('load',done);link.removeEventListener('error',done);resolve();};
  cleanup.push(done);link.addEventListener('load',done);link.addEventListener('error',done);link.disabled=false;
  if(link.sheet)done();
 });
 const loaded=Promise.all(links.map(stylesheet)).then(()=>!cancelled&&document.fonts?Promise.all([
  document.fonts.load('400 28px "Syolana Script"'),
  document.fonts.load('italic 500 28px "Syolana Display"'),
  document.fonts.load('400 20px "Literata"')
 ]):undefined).catch(()=>{});
 const ready=new Promise(resolve=>{finish=resolve;timer=setTimeout(resolve,timeout);loaded.then(resolve);}).finally(()=>{clearTimeout(timer);cleanup.forEach(done=>done());});
 return{ready,cancel:()=>{cancelled=true;finish();}};
}

export class ThemeEngine {
 constructor({license=window.__syolanaDesignLicense,load=()=>import('https://syolana.com/themes.js?v=20261018-identity-1')}={}){this.license=license;this.load=load;this.engine=null;this.selected='';}
 async init(){
  this.baseStyle=document.documentElement.getAttribute('style');
  this.baseTheme=document.documentElement.getAttribute('data-theme');
  void import('https://syolana.com/partner-attribution.js?v=20261018-identity-1').then(m=>{this.baseView=m;m.setPlainSite(document.documentElement.dataset.syolanaDesign==='off');}).catch(()=>{});
  this.stop({pending:true});
  this.permission=watchRegisteredDesign({license:this.license,update:state=>{const key=JSON.stringify(state.themeAccess||null);const changed=this.engine&&this.themeAccessKey!==key;if(changed)this.stop({pending:true});this.themeAccessKey=key;return !changed;},activate:async (isCurrent,state)=>{
   startDesignLoading(state.themeAccess?.theme||this.selected);
   const fonts=prepareDesignFonts();this.fonts=fonts;
   const {ThemeEngine:Engine}=await this.load();if(!isCurrent())return;
   const access=state.themeAccess;const engine=new Engine({watermarks:'authorship',initialTheme:access?.theme||this.selected,rememberTheme:true,allowedThemes:access?.allowedThemes||null});this.engine=engine;
   await Promise.all([engine.init(),fonts.ready]);if(this.engine!==engine||!isCurrent()){engine.destroy();return;}
   document.documentElement.dataset.syolanaDesign='active';
   document.documentElement.removeAttribute('data-syolana-plain');this.baseView?.setPlainSite(false);
   this.guard=engine.protectIdentity?.(()=>{this.permission?.destroy();this.stop();});
   void import('https://syolana.com/avito-dock.js?v=20261018-identity-1').then(m=>{if(isCurrent())this.contacts=m.ensureContactDock();}).catch(()=>{});
   engine.resize?.();
   finishDesignLoading(engine.id);
  },deactivate:reason=>this.stop({pending:reason==='unavailable'})});
  await this.permission.ready;
 }
 stop({pending=false}={}){
  if(pending)startDesignLoading(this.engine?.id||this.selected);else finishDesignLoading();
  if(this.engine?.id)this.selected=this.engine.id;
  this.guard?.();this.guard=null;this.contacts?.destroy();this.contacts=null;this.engine?.destroy();this.engine=null;this.fonts?.cancel();this.fonts=null;document.documentElement.dataset.syolanaDesign=pending?'pending':'off';document.documentElement.toggleAttribute('data-syolana-plain',!pending);this.baseView?.setPlainSite(!pending);
  if(this.baseTheme===null)document.documentElement.removeAttribute('data-theme');else if(this.baseTheme!==undefined)document.documentElement.setAttribute('data-theme',this.baseTheme);
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

