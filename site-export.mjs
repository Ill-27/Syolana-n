import {validateSiteSettings} from './partner-demo/builder-model.mjs';
import {fetchSceneAudio} from './scene-audio.js?v=20261012-atmosphere-2';
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
const RUNTIME = `import {ThemeEngine} from './themes.js';
import {setupFlightLayer} from './flight.js';
const n=(tag,text='',cls='')=>{const v=document.createElement(tag);v.textContent=text;v.className=cls;return v;};
const response=await fetch('./site-settings.json');if(!response.ok)throw Error('Настройки сайта не найдены.');const {settings,posts}=await response.json();
document.title=settings.name;const main=document.getElementById('page');const head=n('header','','hero card');head.append(n('h1',settings.name),n('p',settings.tagline,'muted'),n('p',settings.description));main.append(head);
for(const b of settings.blocks){const section=n('section','','card stack');section.append(n('h2',b.title));if(b.type==='features'){const list=n('ul');for(const text of b.text.split('\\n').filter(Boolean))list.append(n('li',text));section.append(list);}else if(b.type==='publications'){for(const post of posts.filter(p=>!p.hidden)){const article=n('article','','card stack');article.append(n('h3',post.title),n('p',post.text));for(const m of post.media||[]){const media=n(m.type==='video'?'video':'img');media.src=m.src;if(m.type==='video'){media.controls=true;media.playsInline=true;}else{media.alt=post.title;media.loading='lazy';}article.append(media);}section.append(article);}}else section.append(n('p',b.text));if(b.image){const image=n('img');image.src=b.image;image.alt=b.title;image.loading='lazy';section.append(image);}if(b.href){const a=n('a',b.linkLabel||'Открыть','btn');a.href=b.href;a.rel='noopener noreferrer';section.append(a);}main.append(section);}
const contacts=n('nav','','card row');for(const [type,value]of Object.entries(settings.contacts||{})){if(!value)continue;const a=n('a',type==='email'?'Написать письмо':type==='vk'?'VK':'Авито','btn');a.href=type==='email'?'mailto:'+value:value;a.rel='noopener noreferrer';contacts.append(a);}if(contacts.children.length)main.append(contacts);
const engine=new ThemeEngine();await engine.init();if(settings.theme)await engine.select(settings.theme);setupFlightLayer({theme:engine});await import('./theme-sound.js');document.getElementById('zen-toggle').onclick=()=>{const active=document.body.classList.toggle('zen');engine.setZen(active);};document.getElementById('close-theme').onclick=()=>document.getElementById('theme-dialog').close();`;
const PAGE = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><link rel="stylesheet" href="assets/fonts/fonts.css"><link rel="stylesheet" href="styles.css"><title>Авторский сайт</title><style>body{margin:0;overflow-x:hidden}#starCanvas,.aurora-background{position:fixed;inset:0;z-index:-1}#page{width:min(1040px,calc(100% - 32px));margin:100px auto 48px}#page>section{margin-block:24px}#page img,#page video{max-width:100%;border-radius:16px}.export-controls{position:fixed;top:16px;right:16px;z-index:5}.export-brand{max-width:1040px;margin:24px auto;padding:24px}body.zen #page,body.zen .export-brand{visibility:hidden}#theme-name{font:14px system-ui}.theme-list{display:grid;gap:16px}dialog{max-height:85dvh;overflow:auto;width:min(600px,88vw)}.theme-swatch{max-width:100%}</style></head><body><div class="aurora-background"></div><canvas id="starCanvas" aria-hidden="true"></canvas><div class="export-controls row top-actions"><button class="btn" id="theme-toggle">Тема</button><button class="btn" id="zen-toggle">Созерцание</button><span id="theme-name"></span></div><aside class="export-brand card"><a href="https://syolana.com/#/join">Этот сайт создан на Syolana</a><p>Живые темы, готовые блоки и редактор. Домен, хостинг и размещение выбирает владелец сайта.</p></aside><main id="page"></main><aside class="export-brand card"><a href="https://syolana.com/#/join">Сделаем вам сайт на Syolana</a></aside><dialog id="theme-dialog"><button class="btn" id="close-theme">Закрыть</button><div id="theme-list" class="theme-list"></div></dialog><div id="toast" role="status"></div><script type="module" src="site.js"></script></body></html>`;
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
  const manifestResponse=await nativeFetch(new URL('themes/manifest.json',baseURL),{cache:'no-store'});
  if(!manifestResponse.ok)throw Error('Не удалось загрузить список живых тем.');
  const themes=await manifestResponse.json();
  if(!Array.isArray(themes)||!themes.length||themes.some(t=>!/^[a-z0-9-]+$/.test(t.id)||t.module!=='./'+t.id+'.js'))throw Error('Не удалось проверить список живых тем.');
  const soundFiles=['nature/ocean_waves','nature/wind_soft','nature/storm_heavy_rain','nature/thunder_claps','nature/forest_morning','nature/crow_caw','nature/bird_wings_flutter','ambience/deep_forest','ambience/park_path','ambience/night_air','music/synth_mystic_pad','music/piano_romantic_soft'];
  const assets=['flight.js','scene-audio.js','theme-sound.js','themes/theme-audio.mjs','themes/sea-interaction.mjs','themes/wildflowers.mjs',...soundFiles.flatMap(path=>['audio-library/'+path+'.ogg','audio-library/compatible/'+path+'.m4a']),'styles.css','polish.css','themes.js','utils.js','assets/logo.svg','assets/fonts/fonts.css','assets/fonts/syolana-script.woff','assets/fonts/literata-400-normal.woff2','assets/fonts/literata-600-normal.woff2','assets/fonts/syolana-display-500-italic.woff2','assets/fonts/syolana-display-500-normal.woff2','assets/vendor/three.module.min.js','assets/vendor/three.core.min.js','assets/vendor/three-LICENSE.txt','themes/manifest.json','themes/luminous-atmosphere.js','themes/sea-motion.mjs','themes/scene-motion.mjs','themes/leaf-motion.mjs','themes/sky-camera.mjs','themes/scene-quality.mjs','themes/world-gl.mjs','themes/celestial-world.mjs','themes/botanical-world.mjs',...themes.flatMap(t=>['themes/'+t.id+'.js','themes/previews/'+t.id+'.jpg'])];
  const files=[['index.html',PAGE],['site.js',RUNTIME],['site-settings.json',JSON.stringify({settings,posts},null,2)],['START.txt','Syolana: готовый шаблон сайта.\nЗагрузите содержимое архива в корень сайта на выбранном хостинге с HTTPS. Домен и хостинг выбираете вы.\nОткрытие index.html как файла не заменяет размещение: модулям нужен веб-сервер.\nТексты, настройки и вложения включены в архив. Изменения в редакторе после экспорта требуют нового экспорта и загрузки.\n']];
  const loaded=await Promise.all(assets.map(async path=>{const url=new URL(path,baseURL),r=path.startsWith('audio-library/')?await fetchSceneAudio(url,{nativeFetch}):await nativeFetch(url,{cache:'no-store'});if(!r.ok)throw Error('Не удалось загрузить файл шаблона: '+path);return[path,new Uint8Array(await r.arrayBuffer())];}));
  return zipFiles([...files,...loaded]);
}
