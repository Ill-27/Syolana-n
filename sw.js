/* Public offline shell only. Server access checks always use the network. */
const PREFIX='syolana-public-';
const CACHE=PREFIX+'autonomous-device-20261011-2';
const BASE=new URL('./',self.location.href);
const assets=['index.html','boot.js','styles.css','config.json'].map(path=>new URL(path,BASE).href);
function publicRequest(request){
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('Authorization'))return false;
 if(url.pathname.includes('/api/')||url.pathname.startsWith('/personal-atlas/')||url.pathname.startsWith('/_deploy/'))return false;
 if([...url.searchParams.keys()].some(k=>/token|key|signature|credential/i.test(k)))return false;
 if(/\/courses\/(?!en-a1\/)[^/]+\/(?:data|pronunciation)\.json$/.test(url.pathname))return false;
 // Access, device binding, current positioning and owner recovery always come from the current deployment.
 if(/\/(?:api-transport|course-api-bridge|owner-vault|device-access|positioning|sketch-builder)\.m?js$/.test(url.pathname))return false;
 if(url.pathname.includes('/owner-vault/'))return false;
 if(url.pathname.endsWith('/song-details.json'))return false;
 if(url.pathname.endsWith('.json'))return /\/(config|feed|partner|studio-config|site-settings|manifest)\.json$/.test(url.pathname);
 return request.mode==='navigate'||/\.(?:html|js|mjs|css|woff2?|svg|png|jpg|jpeg|webp)$/.test(url.pathname);
}
function keyFor(request){const url=new URL(request.url),version=url.searchParams.get('v');url.search='';if(version)url.searchParams.set('v',version);url.hash='';return url.href;}
self.addEventListener('install',event=>event.waitUntil((async()=>{
 const cache=await caches.open(CACHE);
 for (const path of assets) {
  try {const response=await fetch(path,{cache:'reload',credentials:'omit',signal:AbortSignal.timeout(5000)});if(response.ok)await cache.put(path,response);} catch {}
 }
 await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 const keys=(await caches.keys()).filter(k=>k.startsWith(PREFIX));
 await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(!publicRequest(event.request))return;
 event.respondWith((async()=>{
  const key=keyFor(event.request),cache=await caches.open(CACHE);
  const cached=await cache.match(key);
  const network=fetch(event.request).then(async response=>{
   if(response.ok){try{await cache.put(key,response.clone());}catch{}return response;}
   if(cached&&response.status>=500)return cached;
   return response;
  });
  event.waitUntil(network.then(()=>{},()=>{}));
  if(!cached)return network;
  let timer;const fast=new Promise(resolve=>{timer=setTimeout(()=>resolve(cached),event.request.mode==='navigate'?1800:1200);});
  try{return await Promise.race([network.catch(()=>cached),fast]);}finally{clearTimeout(timer);}
 })());
});