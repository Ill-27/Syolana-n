import {validateSiteSettings} from './partner-demo/builder-model.mjs';
import {calendarLicense} from './partner-periods.mjs';
const utf8=new TextEncoder();
const table=Uint32Array.from({length:256},(_,v)=>{for(let n=0;n<8;n++)v=(v&1)?0xedb88320^(v>>>1):v>>>1;return v>>>0;});
function crc32(bytes){let crc=0xffffffff;for(const byte of bytes)crc=table[(crc^byte)&255]^(crc>>>8);return (crc^0xffffffff)>>>0;}
function header(size, values){const bytes=new Uint8Array(size),view=new DataView(bytes.buffer);for(const [offset,value,width=4]of values)width===2?view.setUint16(offset,value,true):view.setUint32(offset,value,true);return bytes;}
export function zipFiles(files){
  const parts=[],central=[];let offset=0,total=0;
  for(const [path,input]of files){
    if(!path||path.startsWith('/')||path.split('/').some(v=>v==='..'||v==='.')||path.includes('\\'))throw Error('Неверное имя файла в архиве.');
    const name=utf8.encode(path),data=typeof input==='string'?utf8.encode(input):new Uint8Array(input),crc=crc32(data);
    if(name.length>65535||data.length>0xffffffff)throw Error('Файл слишком большой для экспорта.');
    const local=header(30,[[0,0x04034b50],[4,20,2],[6,0x800,2],[10,0,2],[12,33,2],[14,crc],[18,data.length],[22,data.length],[26,name.length,2]]);
    parts.push(local,name,data);
    const entry=header(46,[[0,0x02014b50],[4,20,2],[6,20,2],[8,0x800,2],[12,0,2],[14,33,2],[16,crc],[20,data.length],[24,data.length],[28,name.length,2],[42,offset]]);
    central.push(entry,name);offset+=local.length+name.length+data.length;total+=entry.length+name.length;
  }
  if(files.length>65535)throw Error('Слишком много файлов в архиве.');
  return new Blob([...parts,...central,header(22,[[0,0x06054b50],[8,files.length,2],[10,files.length,2],[12,total],[16,offset]])],{type:'application/zip'});
}
const RUNTIME = `import {mountLicensedDesign} from './licensed-design.js';
const n=(tag,text='',cls='')=>{const v=document.createElement(tag);v.textContent=text;v.className=cls;return v;};
const response=await fetch('./site-settings.json');if(!response.ok)throw Error('Настройки сайта не найдены.');const {settings,posts,license,themes}=await response.json();
document.title=settings.name;const main=document.getElementById('page');const head=n('header','','hero card');head.append(n('h1',settings.name),n('p',settings.tagline,'muted'),n('p',settings.description));main.append(head);
for(const b of settings.blocks){const section=n('section','','card stack');section.append(n('h2',b.title));if(b.type==='features'){const list=n('ul');for(const text of b.text.split('\\n').filter(Boolean))list.append(n('li',text));section.append(list);}else if(b.type==='publications'){for(const post of posts.filter(p=>!p.hidden)){const article=n('article','','card stack');article.append(n('h3',post.title),n('p',post.text));for(const m of post.media||[]){const media=n(m.type==='video'?'video':'img');media.src=m.src;if(m.type==='video'){media.controls=true;media.playsInline=true;}else{media.alt=post.title;media.loading='lazy';}article.append(media);}section.append(article);}}else section.append(n('p',b.text));if(b.image){const image=n('img');image.src=b.image;image.alt=b.title;image.loading='lazy';section.append(image);}if(b.href){const a=n('a',b.linkLabel||'Открыть','btn');a.href=b.href;a.rel='noopener noreferrer';section.append(a);}main.append(section);}
const contacts=n('nav','','card row');for(const [type,value]of Object.entries(settings.contacts||{})){if(!value)continue;const a=n('a',type==='email'?'Написать письмо':type==='vk'?'VK':'Авито','btn');a.href=type==='email'?'mailto:'+value:value;a.rel='noopener noreferrer';contacts.append(a);}if(contacts.children.length)main.append(contacts);
await mountLicensedDesign({settings,license,themes});`;
const PAGE = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>Авторский сайт</title><style>body{isolation:isolate;margin:0;overflow-x:hidden;font:16px/1.6 system-ui;background:#f5f5f8;color:#242433}#page{width:min(1040px,calc(100% - 32px));margin:80px auto 64px}#page>section{margin-block:24px}.card{padding:24px;background:rgba(255,255,255,.9);border-radius:20px}#page img,#page video{max-width:100%;border-radius:16px}.export-controls{position:fixed;top:16px;right:16px;z-index:90}button{font:inherit;padding:10px 15px;border:1px solid #d8d8df;border-radius:12px;background:#fff;color:#272735}.export-theme{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:-1}.export-attribution{position:static;display:flex;justify-content:center;margin:24px 16px;padding:0;background:transparent}.export-attribution a{display:block!important;color:#fff!important;font:12px/1.4 system-ui!important;text-decoration:none}body.zen #page{visibility:hidden}body.zen .export-theme{z-index:50}.export-controls[hidden]{display:none!important}dialog{width:min(500px,88vw);max-height:85dvh;overflow:auto}</style></head><body><div class="export-controls" hidden><button id="theme-toggle" type="button">Тема</button><button id="sound-toggle" type="button">Звук темы</button><button id="zen-toggle" type="button">Созерцание</button></div><main id="page"></main><footer class="export-attribution"><a id="syolana-attribution" href="https://syolana.com/" target="_blank" rel="noopener noreferrer">Сайт создан на Syolana</a></footer><dialog id="theme-dialog"><button id="close-theme" type="button">Закрыть</button><div id="theme-list" class="theme-list"></div></dialog><script type="module" src="site.js"></script></body></html>`;
export async function createSiteArchive(value,{nativeFetch=fetch,baseURL=new URL('./',import.meta.url)}={}){
  const settings=validateSiteSettings(value.settings,{embeddedMedia:true});
  const posts=structuredClone(value.posts||[]);
  for(const post of posts)for(const item of post.media||[]){
    if(/^data:(?:image\/(?:jpeg|png|webp)|video\/(?:mp4|webm));base64,[A-Za-z0-9+/]+={0,2}$/.test(item.src))continue;
    if(!/^\/api\/course-access\/studio\/[a-z0-9-]+\/media\/[a-f0-9]{32}$/.test(item.src))throw Error('Проверьте адрес вложения в публикации.');
    const response=await nativeFetch(item.src);if(!response.ok)throw Error('Не удалось скачать вложение. Повторите экспорт после восстановления связи.');
    const mime=response.headers.get('content-type')?.split(';')[0];if(!/^(?:image\/(?:jpeg|png|webp)|video\/(?:mp4|webm))$/.test(mime))throw Error('Неверный формат вложения.');
    const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));item.src='data:'+mime+';base64,'+btoa(binary);
  }
  const manifest=await nativeFetch(new URL('themes/manifest.json',baseURL),{cache:'no-store'});if(!manifest.ok)throw Error('Не удалось получить список тем.');const themes=(await manifest.json()).map(t=>({id:t.id,name:t.name}));if(!themes.length||themes.some(t=>!/^[-a-z0-9]+$/.test(t.id)||typeof t.name!=='string'))throw Error('Не удалось проверить список тем.');
  const assets=['licensed-design.js','attribution-guard.js','partner-attribution.js','partner-attribution.css','partner-periods.mjs'];
  const files=[['index.html',PAGE],['site.js',RUNTIME],['site-settings.json',JSON.stringify({settings,posts,themes,license:value.license||calendarLicense()},null,2)],['START.txt','Syolana: готовый шаблон сайта.\nЗагрузите содержимое архива в корень сайта на выбранном хостинге с HTTPS. Домен и хостинг выбираете вы.\nНовый календарный файл по умолчанию даёт бесплатное оформление до 1 января 2027 года, 00:00 МСК. Оплаченный файл 2027 года выдаётся вручную отдельно и заканчивается 1 января 2028 года, 00:00 МСК. Регистрация домена на сервере лицензий для календарного файла не нужна. Срок проверяется по часам браузера, поэтому защита от изменения часов или кода не гарантируется. При отключении оформления тексты и вложения остаются доступны. Открытие index.html как файла не заменяет размещение: модулям нужен веб-сервер.\nТексты, настройки и вложения включены в архив. Изменения в редакторе после экспорта требуют нового экспорта и загрузки.\n']];
  const loaded=await Promise.all(assets.map(async path=>{const r=await nativeFetch(new URL(path,baseURL),{cache:'no-store'});if(!r.ok)throw Error('Не удалось подготовить оформление сайта. Повторите экспорт.');return[path,new Uint8Array(await r.arrayBuffer())];}));
  return zipFiles([...files,...loaded]);
}
