import accessService from './access-service.json' with {type:'json'};
import {createOwnerVault} from './owner-vault.mjs?v=20261012-fr-a2-1';
import {createLocalWorkshop} from './local-workshop.mjs';
// Only public API reads may be retried. A timed-out write can already have
// reached the server; repeating it on a second host could publish twice.
export const API_ORIGINS = [
  'https://d5d8t0nr36g6la3o7n9k.4kscn31j.apigw.yandexcloud.net',
  'https://d5d4n4741658tqprc4uc.4kscn31j.apigw.yandexcloud.net',
];
const STORAGE_KEY = 'syolana-api-session';
const TRANSIENT = new Set([502, 503, 504]);
const NETWORK_MESSAGE = 'Соединение с сервером прервалось. Ваш черновик остаётся в редакторе. Повторите сохранение после восстановления связи.';

function storedToken(storage) {
  try { return storage?.getItem(STORAGE_KEY) || ''; } catch { return ''; }
}
function rememberToken(storage, value) {
  try {
    if (/^[A-Za-z0-9_-]{43}$/.test(value)) storage?.setItem(STORAGE_KEY, value);
    else if (!value) storage?.removeItem(STORAGE_KEY);
  } catch { /* Cookie authentication remains available. */ }
}

export function createAPITransport({ nativeFetch, origin, storage, origins = API_ORIGINS, timeout = 3500, vault, workshop, preferService = () => false }) {
  let preferred = 0;
  let reserveMode = false;
  const bridged = true;
  return async (input, init = {}) => {
    const original = input instanceof Request ? input : null;
    const url = new URL(original ? original.url : String(input), origin);
    if (!url.pathname.startsWith('/api/course-access/') || url.origin !== new URL(origin).origin) {
      return nativeFetch(input, init);
    }
    const method = String(init.method || original?.method || 'GET').toUpperCase();
    const read = method === 'GET' || method === 'HEAD';
    const callerSignal = init.signal || original?.signal;
    const headers = new Headers(original?.headers);
    new Headers(init.headers || {}).forEach((v, k) => headers.set(k, v));
    const token = storedToken(storage);
    if (/^[A-Za-z0-9_-]{43}$/.test(token)) headers.set('Authorization', 'Bearer ' + token);
    const order = bridged ? [preferred, ...origins.map((_, i) => i).filter(i => i !== preferred)] : [-1];
    const body = init.body !== undefined ? init.body : original && !read ? await original.clone().arrayBuffer() : undefined;
    let decodedBody={};if(typeof body==='string')try{decodedBody=JSON.parse(body);}catch{}
    const localReply=async()=>{
      if(!vault)return null;
      const local=await vault.handle(url.pathname,method,decodedBody);
      if(local){
        if(url.pathname.endsWith('/key-login')||url.pathname.endsWith('/session'))reserveMode=true;
        if(url.pathname.endsWith('/logout'))reserveMode=false;
        return local;
      }
      if(vault.isOwner()&&workshop&&url.pathname.includes('/studio/'))return workshop.handle(url.pathname,method,decodedBody);
      return null;
    };
    if(callerSignal?.aborted)throw callerSignal.reason||new DOMException('Aborted','AbortError');

    const ownerFirst = url.pathname.endsWith('/key-login') || reserveMode || vault?.isOwner() || !preferService();
    if(ownerFirst){const local=await localReply();if(local)return local;}

    let lastResponse;
    for (const index of read ? order : order.slice(0, 1)) {
      if (callerSignal?.aborted) throw callerSignal.reason || new DOMException('Aborted', 'AbortError');
      const controller = new AbortController();
      const abort = () => controller.abort(callerSignal.reason);
      callerSignal?.addEventListener('abort', abort, { once: true });
      const timer = setTimeout(() => controller.abort(), read ? timeout : 18000);
      const target = index < 0 ? url : new URL(url.pathname + url.search, origins[index]);
      try {
        const response = await nativeFetch(target.href, {
          ...init, method, body, headers, signal: controller.signal,
          credentials: index < 0 ? 'same-origin' : 'include', cache: 'no-store',
        });
        lastResponse = response;
        if(!read&&TRANSIENT.has(response.status)&&url.pathname.endsWith('/key-login')){const local=await localReply();if(local)return local;}
        if (read && TRANSIENT.has(response.status)) continue;
        if (index >= 0 && !TRANSIENT.has(response.status)) preferred = index;
        if (response.ok && url.pathname.endsWith('/key-login')) {
          const data = await response.clone().json().catch(() => null);
          if (data?.sessionToken) rememberToken(storage, data.sessionToken);
        }
        if (response.ok && url.pathname.endsWith('/logout')) rememberToken(storage, '');
        return response;
      } catch (error) {
        if (callerSignal?.aborted) throw callerSignal.reason || error;
        if (!read) {
          if(url.pathname.endsWith('/key-login')){const local=await localReply();if(local)return local;}
          throw new Error(NETWORK_MESSAGE, { cause: error });
        }
      } finally {
        clearTimeout(timer);
        callerSignal?.removeEventListener('abort', abort);
      }
    }
    if(read||url.pathname.endsWith('/key-login')){const local=await localReply();if(local)return local;}
    if (lastResponse) return lastResponse;
    throw new Error(NETWORK_MESSAGE);
  };
}

export function installAPITransport() {
  if (window.__syolanaAPITransport) return;
  window.__syolanaAPITransport = true;
  let storage; try { storage = window.localStorage; } catch {}
  const nativeFetch=window.fetch.bind(window);
  let reserveStorage;try{reserveStorage=window.sessionStorage;}catch{}
  const vault=createOwnerVault({nativeFetch,storage:reserveStorage});
  const origins=[...API_ORIGINS];let primaryReady=false;
  window.fetch = createAPITransport({ nativeFetch, origin: location.href, storage, origins, vault, workshop:createLocalWorkshop(),preferService:()=>primaryReady });
  try{
    if(accessService?.ready===true){const url=new URL(accessService.origin);if(url.protocol==='https:'&&!url.username&&!url.password&&!url.search&&!url.hash&&url.pathname==='/'){origins.unshift(url.origin);primaryReady=true;}}
  }catch{}

}


