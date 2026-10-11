// Last good PUBLIC snapshots keep the feed and layout available on weak networks.
// Private APIs, access keys and paid course data must never enter this store.
export async function loadPublicJSON(path, { timeout=5000 }={}) {
  const url=new URL(path,location.href);
  if(url.origin!==location.origin||url.pathname.startsWith('/api/'))throw Error('Invalid public snapshot');
  const allowed=/(?:^|\/)(?:config|feed|partner|studio-config|site-settings|manifest)\.json$/;
  if(!allowed.test(url.pathname))throw Error('Invalid public snapshot');
  const key='syolana.public.'+url.pathname;
  try{
    const response=await fetch(url.href,{cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(timeout)});
    if(!response.ok)throw Error('Public resource unavailable');
    const data=await response.json();
    try{localStorage.setItem(key,JSON.stringify(data));}catch{}
    return data;
  }catch(error){
    try{const cached=localStorage.getItem(key);if(cached!==null)return JSON.parse(cached);}catch{}
    throw error;
  }
}
