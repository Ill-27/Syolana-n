const SESSION_KEY = 'syolana.owner.reserve.v1';
const COURSES = ['en-a2', 'es-a1', 'es-a2', 'fr-a1'];
const encode = bytes => btoa(String.fromCharCode(...bytes));
const decode = text => Uint8Array.from(atob(text), c => c.charCodeAt(0));
const json = (value, status = 200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}});

// Only the owner can unwrap this capability. No plaintext course or owner key
// is published, and customer sessions remain subject to server verification.
export function createOwnerVault({nativeFetch, crypto = globalThis.crypto, storage, baseURL = new URL('./', import.meta.url)}) {
  let capability, manifestPromise;
  const read = () => {
    if (capability) return capability;
    try {
      const value = JSON.parse(storage?.getItem(SESSION_KEY) || 'null');
      if (value?.role === 'owner' && decode(value.contentKey).length === 32 && value.version === 1) capability = value;
    } catch {}
    return capability;
  };
  const manifest = () => manifestPromise ||= nativeFetch(new URL('owner-vault/manifest.json', baseURL), {cache:'no-store', signal:AbortSignal.timeout(3500)})
    .then(r => {if (!r.ok) throw Error('Резерв владельца пока не опубликован.'); return r.json();})
    .catch(error => {manifestPromise = null; throw error;});
  async function unlock(key) {
    if (!/^[A-Za-z0-9_-]{43}$/.test(key)) return false;
    let record; try {record = await manifest();} catch {return false;}
    if (record.schema !== 'syolana.owner-vault.v1' || record.iterations !== 250000) return false;
    try {
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(key), 'PBKDF2', false, ['deriveKey']);
      const wrapping = await crypto.subtle.deriveKey({name:'PBKDF2', hash:'SHA-256', salt:decode(record.salt), iterations:record.iterations}, material, {name:'AES-GCM', length:256}, false, ['decrypt']);
      const plaintext = await crypto.subtle.decrypt({name:'AES-GCM', iv:decode(record.iv), additionalData:new TextEncoder().encode('syolana.owner-capability.v1')}, wrapping, decode(record.ciphertext));
      const candidate = JSON.parse(new TextDecoder().decode(plaintext));
      if (candidate.role !== 'owner' || candidate.version !== 1 || decode(candidate.contentKey).length !== 32) return false;
      capability = candidate;
      try {storage?.setItem(SESSION_KEY, JSON.stringify(candidate));} catch {}
      return true;
    } catch {return false;}
  }
  function session() {return {access:true, owner:true, canCreateSite:true, reserve:true, salesOpen:false, automaticPayments:false, csrf:'owner-reserve', watermark:'Syolana · владелец · резервный доступ'};}
  async function courseData(id) {
    if (!COURSES.includes(id) || !read()) return json({error:'Введите ключ владельца.'}, 403);
    const response = await nativeFetch(new URL('owner-vault/'+id+'.json', baseURL), {cache:'no-store'});
    if (!response.ok) throw Error('Не удалось загрузить защищённую копию курса. Проверьте интернет и повторите.');
    const record = await response.json();
    if (record.schema !== 'syolana.course.aesgcm.v1' || record.course !== id) throw Error('Защищённая копия курса имеет неверный формат.');
    const aes = await crypto.subtle.importKey('raw', decode(read().contentKey), 'AES-GCM', false, ['decrypt']);
    const packed = await crypto.subtle.decrypt({name:'AES-GCM', iv:decode(record.iv), additionalData:new TextEncoder().encode('syolana.course.v1:'+id)}, aes, decode(record.ciphertext));
    const stream = new Blob([packed]).stream().pipeThrough(new DecompressionStream('gzip'));
    const text = await new Response(stream).text();
    return new Response(text, {headers:{'Content-Type':'application/json', 'Cache-Control':'no-store'}});
  }
  async function handle(path, method, body) {
    const endpoint = path.split('/').filter(Boolean).at(-1);
    if (method === 'POST' && endpoint === 'key-login' && await unlock(String(body?.key || '').trim())) return json(session());
    if (!read()) return null;
    if (endpoint === 'session' && method === 'GET') return json(session());
    if (endpoint === 'logout' && method === 'POST') {capability = null; try {storage?.removeItem(SESSION_KEY);} catch {} return json({ok:true});}
    const course = path.split('/').filter(Boolean).at(-2);
    if (endpoint === 'data' && method === 'GET' && COURSES.includes(course)) return courseData(course);
    if (/\/admin\//.test(path)) return json({error:'Резерв открывает ваши материалы. Выдача и продление ключей покупателей требуют работающего сервера доступа.'}, 503);
    return null;
  }
  return {handle, unlock, isOwner:() => Boolean(read()), session, courseData};
}
