/* Public offline shell only. Server access checks always use the network. */
const PREFIX='syolana-public-';
const CACHE=PREFIX+'bloom-control-20261012-2';
const BASE=new URL('./',self.location.href);
const assets=['index.html','boot.js','styles.css','config.json','language-switcher.js?v=20261012-i18n-3','content-i18n.js?v=20261012-i18n-3','i18n.js?v=20261012-i18n-2'].map(path=>new URL(path,BASE).href);
const SCENE_RELEASE='20261012-bloom-control-1';
async function cacheScenes(cache){
 const modules=['aurora.js','golden.js','moon.js','violet-bloom.js','living-sea.js','amber-forest.js','white-ocean-city.js','sky-camera.mjs','scene-quality.mjs','world-gl.mjs','celestial-world.mjs','botanical-world.mjs','sea-interaction.mjs','wildflowers.mjs','flower-interaction.mjs','theme-typography.mjs','theme-audio.mjs'];
 const paths=['scene-audio.js','scene-audio.js?v='+SCENE_RELEASE,'theme-sound.js?v='+SCENE_RELEASE,'flight.js','utils.js','themes/manifest.json','themes/scene-motion.mjs','themes/luminous-atmosphere.js','themes/luminous-atmosphere.js?v='+SCENE_RELEASE,'themes/leaf-motion.mjs?v=20261011-fall-1','themes/sea-motion.mjs?v=20261011-sea13','themes.js?v='+SCENE_RELEASE,...modules.map(p=>'themes/'+p+'?v='+SCENE_RELEASE)];
 await Promise.all(paths.map(async path=>{const url=new URL(path,BASE).href;try{const response=await fetch(url,{cache:'reload',credentials:'omit',signal:AbortSignal.timeout(5000)});if(response.ok)await cache.put(url,response);}catch{}}));
}
function publicRequest(request){
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('Authorization'))return false;
 if(url.pathname.includes('/api/')||url.pathname.startsWith('/personal-atlas/')||url.pathname.startsWith('/_deploy/'))return false;
 if(url.pathname.includes('/partner-demo/')||/\/partner\/?$/.test(url.pathname))return false;
 if([...url.searchParams.keys()].some(k=>/token|key|signature|credential/i.test(k)))return false;
 if(/\/courses\/(?!en-a1\/)[^/]+\/(?:data|pronunciation)\.json$/.test(url.pathname))return false;
 if(/\/(?:api-transport|course-api-bridge|course-trial-warning|owner-vault|device-access|positioning|sketch-builder|copy-polish|public-polish|content-i18n)\.m?js$/.test(url.pathname))return false;
 if(url.pathname.includes('/owner-vault/'))return false;
 if(url.pathname.endsWith('/song-details.json'))return false;
 if(url.pathname.endsWith('.json'))return /\/(config|feed|partner|studio-config|site-settings|manifest)\.json$/.test(url.pathname);
 return request.mode==='navigate'||/\.(?:html|js|mjs|css|woff2?|svg|png|jpg|jpeg|webp)$/.test(url.pathname);
}
function keyFor(request){const url=new URL(request.url),version=url.searchParams.get('v');url.search='';if(version)url.searchParams.set('v',version);url.hash='';return url.href;}
self.addEventListener('install',event=>event.waitUntil((async()=>{const cache=await caches.open(CACHE);for(const path of assets){try{const response=await fetch(path,{cache:'reload',credentials:'omit',signal:AbortSignal.timeout(5000)});if(response.ok)await cache.put(path,response);}catch{}}await cacheScenes(cache);await self.skipWaiting();})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{const keys=(await caches.keys()).filter(k=>k.startsWith(PREFIX));await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));await self.clients.claim();})()));
self.addEventListener('fetch',event=>{if(!publicRequest(event.request))return;event.respondWith((async()=>{const key=keyFor(event.request),cache=await caches.open(CACHE);const cached=await cache.match(key);const network=fetch(event.request).then(async response=>{if(response.ok){try{await cache.put(key,response.clone());}catch{}return response;}if(cached&&response.status>=500)return cached;return response;});event.waitUntil(network.then(()=>{},()=>{}));if(!cached)return network;let timer;const fast=new Promise(resolve=>{timer=setTimeout(()=>resolve(cached),event.request.mode==='navigate'?1800:1200);});try{return await Promise.race([network.catch(()=>cached),fast]);}finally{clearTimeout(timer);}})());});