const KEY='syolana.private-domain-book.v1';
const SCHEMA='syolana.private-domain-book.v1';
const states=new Set(['draft','active','suspended','ended']);
export function yearLater(stamp){const d=new Date(stamp*1000),year=d.getUTCFullYear()+1,month=d.getUTCMonth();return Math.floor(Date.UTC(year,month,Math.min(d.getUTCDate(),new Date(Date.UTC(year,month+1,0)).getUTCDate()),d.getUTCHours(),d.getUTCMinutes(),d.getUTCSeconds())/1000);}
export function validateDomainRow(input){
 if(!input||typeof input!=='object')throw Error('Проверьте запись сайта.');
 let u;try{u=new URL(input.siteUrl);}catch{throw Error('Укажите полный HTTPS-адрес сайта.');}
 if(u.protocol!=='https:'||u.username||u.password||u.port||u.search||u.hash||u.hostname.length>253||!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/.test(u.hostname))throw Error('Нужен публичный HTTPS-адрес без пароля и параметров.');
 const hosting=String(input.hosting||'').trim().toLowerCase();if(hosting&&!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$/.test(hosting))throw Error('Для хостинга укажите домен провайдера без имён и контактов.');
 const hostingCountry=String(input.hostingCountry||'').toUpperCase();if(hostingCountry&&!/^[A-Z]{2}$/.test(hostingCountry))throw Error('Страна хостинга — код из двух букв, например RU.');
 const start=Number(input.licenseStart),until=Number(input.licenseUntil);if(!Number.isSafeInteger(start)||!Number.isSafeInteger(until)||start<946684800||until<=start||until>Date.parse('2028-01-01T00:00:00+03:00')/1000)throw Error('Проверьте общий период оформления.');
 const status=states.has(input.status)?input.status:'draft';
 return {partnerId:/^p-[a-f0-9]{12}$/.test(input.partnerId||'')?input.partnerId:'p-'+crypto.randomUUID().replaceAll('-','').slice(0,12),siteUrl:u.href,domain:u.hostname,paid2027:input.paid2027===true,hosting,hostingCountry,siteId:/^[a-z0-9-]{3,50}$/.test(input.siteId||'')?input.siteId:'',licenseStart:start,licenseUntil:until,status,lastPublicCheck:Number.isSafeInteger(input.lastPublicCheck)&&input.lastPublicCheck>=0?input.lastPublicCheck:0,reasonForSuspension:['','owner-review','attribution','illegal-content','expired','contract-ended'].includes(input.reasonForSuspension)?input.reasonForSuspension:'',serverConfirmed:input.serverConfirmed===true,serverCheckedAt:Number.isSafeInteger(input.serverCheckedAt)&&input.serverCheckedAt>=0?input.serverCheckedAt:0};
}
export function createDomainBook({storage,vault}){
 const read=async()=>{if(!vault.isOwner())throw Error('Введите ключ владельца.');const raw=storage.getItem(KEY);if(!raw)return[];const v=await vault.openPrivate(JSON.parse(raw),'domain-book');if(v.schema!==SCHEMA||!Array.isArray(v.sites)||v.sites.length>500)throw Error('Закрытый список имеет неверный формат.');return v.sites.map(validateDomainRow);};
 const write=async rows=>{if(rows.length>500)throw Error('В списке не более 500 адресов.');const sites=rows.map(validateDomainRow);if(new Set(sites.map(x=>x.siteUrl)).size!==sites.length)throw Error('Этот адрес уже есть в списке.');const encrypted=await vault.sealPrivate({schema:SCHEMA,sites},'domain-book');storage.setItem(KEY,JSON.stringify(encrypted));return sites;};
 return {read,write,exportEncrypted:()=>storage.getItem(KEY)||'',async importEncrypted(raw){if(raw.length>1024*1024)throw Error('Файл слишком большой.');const v=await vault.openPrivate(JSON.parse(raw),'domain-book');if(v.schema!==SCHEMA||!Array.isArray(v.sites))throw Error('Выберите резервную копию списка Syolana.');return write(v.sites);}};
}
