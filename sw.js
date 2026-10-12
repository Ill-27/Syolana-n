const PREFIX='syolana-public-';
const CACHE=PREFIX+'9e28637d780ead5d';
function allowed(request){
 const url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||request.headers.has('Authorization'))return false;
 if(/\/(?:api|owner-vault|personal-atlas|_deploy)\//.test(url.pathname))return false;
 if([...url.searchParams.keys()].some(key=>/token|key|signature|credential/i.test(key)))return false;
 return request.mode==='navigate'||/\/(?:runtime|assets|themes)\/.+\.(?:js|mjs|css|woff2?|svg|jpg|webp)$/.test(url.pathname);
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 await Promise.all((await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)));
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(!allowed(event.request))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE),url=new URL(event.request.url);
  const immutable=/\/runtime\/[^/]+-[A-Z0-9]{8,}\.(?:js|css)$/.test(url.pathname);
  if(immutable){const cached=await cache.match(event.request);if(cached)return cached;}
  try{const response=await fetch(event.request);if(response.ok)event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));return response;}
  catch(error){const cached=await cache.match(event.request);if(cached)return cached;throw error;}
 })());
});

