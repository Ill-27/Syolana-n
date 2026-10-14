// Local, recipient-bound course packages. No customer API or device fingerprint.
export const LOCAL_COURSES = ['en-a2', 'es-a1', 'es-a2', 'fr-a1', 'fr-a2'];
const SCHEMA = 'syolana.local-course-package.v1';
const REQUEST_PREFIX = 'SYR1.';
const MAX_FILE = 24 * 1024 * 1024;
const MAX_COURSE = 16 * 1024 * 1024;
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = bytes => {let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');};
const unb64 = text => {if(typeof text!=='string'||!/^[A-Za-z0-9_-]+$/.test(text))throw Error('Некорректный файл разрешения.');return Uint8Array.from(atob(text.replaceAll('-','+').replaceAll('_','/')),x=>x.charCodeAt(0));};
const canonicalOrigin = value => {const url=new URL(value);if(url.protocol!=='https:'&&url.hostname!=='localhost')throw Error('Откройте защищённый адрес сайта.');return url.origin;};
const publicRecord = key => ({kty:'RSA',n:key.n,e:key.e,alg:'RSA-OAEP-256',ext:true,key_ops:['wrapKey']});
const recipientID = async (crypto,key) => b64(new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(key.n+'.'+key.e))));
const label = (origin,recipient) => enc.encode(SCHEMA+':'+origin+':'+recipient);
const aad = (id,section) => enc.encode(SCHEMA+':'+id+':'+section);

export function createLocalCourseStore(indexedDB=globalThis.indexedDB) {
 let pending;
 function db(){if(!indexedDB)return Promise.reject(Error('Этот браузер не разрешает локальное хранение. Откройте обычное окно браузера.'));return pending ||= new Promise((resolve,reject)=>{
  const r=indexedDB.open('syolana-local-course-access-v1',1);
  r.onupgradeneeded=()=>r.result.createObjectStore('access');
  r.onsuccess=()=>{r.result.onversionchange=()=>{r.result.close();pending=null;};resolve(r.result);};
  r.onerror=()=>{pending=null;reject(Error('Не удалось открыть локальное хранилище браузера.'));};
  r.onblocked=()=>{pending=null;reject(Error('Закройте другие окна сайта и повторите.'));};
 });}
 return {async get(key){const d=await db();return new Promise((resolve,reject)=>{const r=d.transaction('access').objectStore('access').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});},
  async put(key,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('access','readwrite');tx.objectStore('access').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Хранилище недоступно.'));});},
  async claim(key,value){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('access','readwrite'),s=tx.objectStore('access'),r=s.get(key);let chosen;r.onsuccess=()=>{chosen=r.result||value;if(!r.result)s.put(value,key);};tx.oncomplete=()=>resolve(chosen);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Хранилище недоступно.'));});},
  async remove(key){const d=await db();return new Promise((resolve,reject)=>{const tx=d.transaction('access','readwrite');tx.objectStore('access').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});}};
}

export function parseActivationRequest(text) {
 if(typeof text!=='string'||text.length>1600||!text.trim().startsWith(REQUEST_PREFIX))throw Error('Вставьте запрос браузера покупателя целиком.');
 let r;try{r=JSON.parse(dec.decode(unb64(text.trim().slice(REQUEST_PREFIX.length))));}catch{throw Error('Запрос браузера повреждён. Попросите скопировать его ещё раз.');}
 if(r?.v!==1||typeof r.n!=='string'||unb64(r.n).length!==256||r.e!=='AQAB'||canonicalOrigin(r.origin)!==r.origin)throw Error('Неверный формат запроса браузера.');
 return r;
}

async function seal(crypto,key,bytes,additionalData) {
 const iv=crypto.getRandomValues(new Uint8Array(12));
 const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData},key,bytes);
 return {iv:b64(iv),ciphertext:b64(new Uint8Array(ciphertext))};
}
async function open(crypto,key,record,additionalData) {
 const iv=unb64(record?.iv);if(iv.length!==12)throw Error('Файл разрешения повреждён.');
 return crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData},key,unb64(record.ciphertext));
}
async function packed(bytes) {return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());}
async function unpacked(bytes) {
 const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();let length=0;const chunks=[];
 try{for(;;){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>MAX_COURSE){await reader.cancel();throw Error('Файл курса слишком большой.');}chunks.push(value);}}
 finally{reader.releaseLock();}
 const result=new Uint8Array(length);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.length;}return result;
}

// The issuer supplies authorised course data; each package gets a new AES key.
// Owner vault keys and the owner's other private data are never handed to buyers.
export async function issueLocalCoursePackage({request,getCourseData,until,crypto=globalThis.crypto,origin=globalThis.location?.origin,now=Date.now}) {
 const r=parseActivationRequest(request);if(r.origin!==canonicalOrigin(origin))throw Error('Покупатель должен создать запрос на том же адресе Syolana.');
 const issuedAt=Math.floor(now()/1000);if(!Number.isSafeInteger(until)||until<=issuedAt||until>issuedAt+366*86400)throw Error('Проверьте оплаченный срок.');
 const recipient=await recipientID(crypto,r),id=b64(crypto.getRandomValues(new Uint8Array(18)));
 const publicKey=await crypto.subtle.importKey('jwk',publicRecord(r),{name:'RSA-OAEP',hash:'SHA-256'},false,['wrapKey']);
 const aes=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']);
 const wrapped=await crypto.subtle.wrapKey('raw',aes,publicKey,{name:'RSA-OAEP',label:label(r.origin,recipient)});
 const meta={v:1,id,recipient,origin:r.origin,issuedAt,until,courses:[...LOCAL_COURSES]};
 const envelope=await seal(crypto,aes,enc.encode(JSON.stringify(meta)),aad(id,'metadata'));
 const courses={};
 for(const course of LOCAL_COURSES){
  const data=await getCourseData(course);if(data?.schema!=='syolana.course.v1'||data.courseId!==course)throw Error('Не удалось прочитать закрытый курс '+course+'.');
  const bytes=enc.encode(JSON.stringify(data));if(bytes.length>MAX_COURSE)throw Error('Курс слишком большой.');
  courses[course]=await seal(crypto,aes,await packed(bytes),aad(id,course));
 }
 const result={schema:SCHEMA,id,origin:r.origin,recipient,wrappedKey:b64(new Uint8Array(wrapped)),envelope,courses};
 if(enc.encode(JSON.stringify(result)).length>MAX_FILE)throw Error('Пакет слишком большой.');
 return result;
}

export function createLocalCourseAccess({store=createLocalCourseStore(),crypto=globalThis.crypto,origin=globalThis.location?.origin,now=Date.now,locks=globalThis.navigator?.locks}={}) {
 const site=canonicalOrigin(origin);let creating;
 async function identity(){
  if(!crypto?.subtle)throw Error('Браузер не поддерживает защищённое разрешение. Обновите его.');
  if(creating)return creating;
  creating=(async()=>{
   const generate=async()=>{const saved=await store.get('identity');if(saved){if(saved.origin!==site||saved.privateKey?.extractable!==false)throw Error('Локальный ключ повреждён.');return saved;}
    const pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},false,['wrapKey','unwrapKey']);
    const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey),record={origin:site,privateKey:pair.privateKey,publicKey:{n:jwk.n,e:jwk.e}};if(store.claim)return store.claim('identity',record);await store.put('identity',record);return record;};
   return locks?.request?locks.request('syolana-local-course-key',generate):generate();
  })();try{return await creating;}finally{creating=null;}
 }
 async function activationRequest(){const record=await identity();return REQUEST_PREFIX+b64(enc.encode(JSON.stringify({v:1,origin:site,n:record.publicKey.n,e:record.publicKey.e})));}
 function validPackage(record){
  if(!record||record.schema!==SCHEMA||typeof record.id!=='string'||!/^[A-Za-z0-9_-]{24}$/.test(record.id)||record.origin!==site||!record.courses||!record.envelope||unb64(record.wrappedKey).length!==256)throw Error('Выберите файл разрешения для этого сайта.');
  if(Object.keys(record.courses).length!==LOCAL_COURSES.length||LOCAL_COURSES.some(c=>!record.courses[c]))throw Error('В файле не хватает языковых курсов.');
 }
 async function decodePackage(record){
  validPackage(record);const local=await identity(),recipient=await recipientID(crypto,local.publicKey);
  if(record.recipient!==recipient)throw Error('Разрешение выдано другому браузеру. Откройте тот браузер, в котором создавали запрос.');
  try{
   const key=await crypto.subtle.unwrapKey('raw',unb64(record.wrappedKey),local.privateKey,{name:'RSA-OAEP',label:label(site,recipient)},{name:'AES-GCM',length:256},false,['decrypt']);
   const meta=JSON.parse(dec.decode(await open(crypto,key,record.envelope,aad(record.id,'metadata'))));
   if(meta.v!==1||meta.id!==record.id||meta.origin!==site||meta.recipient!==recipient||!Number.isSafeInteger(meta.issuedAt)||!Number.isSafeInteger(meta.until)||meta.until<=meta.issuedAt||JSON.stringify(meta.courses)!==JSON.stringify(LOCAL_COURSES))throw Error('metadata');
   return {key,meta};
  }catch{throw Error('Разрешение повреждено или выдано другому браузеру.');}
 }
 async function checkTime(meta){
  const time=Math.floor(now()/1000),last=await store.get('last-seen');
  if(Number.isFinite(last)&&time+300<last)throw Error('Проверьте дату и время на устройстве.');
  if(time<meta.issuedAt-300)throw Error('Проверьте дату и время на устройстве.');
  if(time>=meta.until)throw Error('Срок разрешения закончился. Для продления отправьте тот же запрос на Авито.');
  if(!last||time>last)await store.put('last-seen',time);
 }
 async function activate(text){
  if(typeof text!=='string'||enc.encode(text).length>MAX_FILE)throw Error('Файл разрешения слишком большой.');
  let record;try{record=JSON.parse(text);}catch{throw Error('Выберите исходный файл разрешения.');}
  const decoded=await decodePackage(record);await checkTime(decoded.meta);
  // Authenticate every course before replacing a working local license.
  for(const course of LOCAL_COURSES){const data=JSON.parse(dec.decode(await unpacked(await open(crypto,decoded.key,record.courses[course],aad(record.id,course)))));if(data?.schema!=='syolana.course.v1'||data.courseId!==course)throw Error('Повреждён курс '+course+'.');}
  await store.put('license',record);return session();
 }
 async function session(){const record=await store.get('license');if(!record)return null;const {meta}=await decodePackage(record);await checkTime(meta);return {access:true,owner:false,localLicense:true,accessUntil:meta.until,watermark:'Syolana · копия '+meta.id.slice(0,8),automaticPayments:false};}
 async function courseData(course){
  if(!LOCAL_COURSES.includes(course))throw Error('Неизвестный курс.');const record=await store.get('license');if(!record)throw Error('Выберите своё разрешение.');
  const {key,meta}=await decodePackage(record);await checkTime(meta);
  try{const data=JSON.parse(dec.decode(await unpacked(await open(crypto,key,record.courses[course],aad(record.id,course)))));if(data?.schema!=='syolana.course.v1'||data.courseId!==course)throw Error('course');return data;}catch{throw Error('Защищённый файл курса повреждён. Загрузите исходное разрешение ещё раз.');}
 }
 return {activationRequest,activate,session,courseData,logout:()=>store.remove('license')};
}

let browserAccess;
export function localCourseAccess(){return browserAccess ||= createLocalCourseAccess();}
