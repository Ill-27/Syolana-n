const PREFIX='syolana-public-';
const CACHE=PREFIX+'3fb1973f8adbea10';
const IMMUTABLE_CACHE=PREFIX+'immutable-v1';
function allowed(request){
 const url=new URL(request.url);
 if(request.method!=='GET'||request.cache==='no-store'||url.origin!==self.location.origin||request.headers.has('Authorization'))return false;
 if(/\/(?:api|owner-vault|personal-atlas|_deploy)(?:\/|$)/.test(url.pathname))return false;
 if([...url.searchParams.keys()].some(key=>/token|key|signature|credential/i.test(key)))return false;
 return request.mode==='navigate'||/\/(?:runtime|assets|themes)\/.+\.(?:js|mjs|css|woff2?|svg|jpg|webp)$/.test(url.pathname);
}
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
 try{
  await Promise.all((await caches.keys()).filter(key=>key.startsWith(PREFIX)&&key!==CACHE&&key!==IMMUTABLE_CACHE).map(key=>caches.delete(key)));
  const assets=await caches.open(IMMUTABLE_CACHE),keys=await assets.keys();
  await Promise.all(keys.slice(0,Math.max(0,keys.length-160)).map(key=>assets.delete(key)));
 }catch{}
 try{await self.registration.navigationPreload?.enable();}catch{}
 await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
 if(new URL(event.request.url).pathname.startsWith('/legal-info/'))return;
 if(!allowed(event.request))return;
 event.respondWith((async()=>{
  const url=new URL(event.request.url);
  const immutable=/\/runtime\/[^/]+-[A-Z0-9]{8,}\.(?:js|css)$/.test(url.pathname);
  let cache;
  try{cache=await caches.open(immutable?IMMUTABLE_CACHE:CACHE);}catch{}
  const cached=async()=>{try{return await cache?.match(event.request);}catch{return undefined;}};
  if(immutable){const response=await cached();if(response)return response;}
  try{
   let response;
   try{response=await event.preloadResponse;}catch{}
   response??=await fetch(event.request);
   if(cache&&response.ok&&!/\b(?:private|no-store)\b/i.test(response.headers.get('Cache-Control')||''))event.waitUntil(cache.put(event.request,response.clone()).catch(()=>{}));
   return response;
  }catch(error){const response=await cached();if(response)return response;throw error;}
 })());
});

