const SEED_KEY='syolana.course.device.v1';
let cachedPromise;
function b64url(bytes){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function seed(){let value='';try{value=localStorage.getItem(SEED_KEY)||'';}catch{}if(/^[A-Za-z0-9_-]{43}$/.test(value))return value;const bytes=new Uint8Array(32);crypto.getRandomValues(bytes);value=b64url(bytes);try{localStorage.setItem(SEED_KEY,value);}catch{}return value;}
async function deviceId(){if(cachedPromise)return cachedPromise;cachedPromise=(async()=>{const raw=new TextEncoder().encode(seed());const digest=await crypto.subtle.digest('SHA-256',raw);return b64url(new Uint8Array(digest));})();return cachedPromise;}
function isCourseAPI(url){try{return new URL(url,location.href).pathname.includes('/api/course-access/');}catch{return false;}}
function isKeyLogin(url){try{return /\/api\/course-access\/(?:[^/]+\/)?key-login$/.test(new URL(url,location.href).pathname);}catch{return false;}}
if(!window.__syolanaDeviceFetch){
 window.__syolanaDeviceFetch=true;
 const nativeFetch=window.fetch.bind(window);
 window.fetch=async(input,init={})=>{
  const rawUrl=typeof input==='string'||input instanceof URL?String(input):input.url;
  if(!isCourseAPI(rawUrl))return nativeFetch(input,init);
  const id=await deviceId();
  const base=input instanceof Request?input:new Request(input,init);
  const headers=new Headers(base.headers);headers.set('X-Syolana-Device',id);
  let request;
  if(isKeyLogin(rawUrl)&&base.method.toUpperCase()==='POST'){
   let data={};try{data=JSON.parse(await base.clone().text()||'{}');}catch{}
   if(data&&typeof data==='object'&&!Array.isArray(data))data.deviceId=id;
   headers.set('Content-Type','application/json');
   request=new Request(base,{headers,body:JSON.stringify(data)});
  }else request=new Request(base,{headers});
  return nativeFetch(request);
 };
}
window.SyolanaDevice={id:deviceId};
