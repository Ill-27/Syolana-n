import {createSiteArchive} from './site-export.mjs';
import {mountSiteBuilder,renderSiteBlocks,renderContactLinks} from './partner-demo/site-builder.js?v=20261011-independent-1';
import {prepareMediaUpload} from './partner-demo/media-upload.mjs?v=20261009-studio-2';
const AVITO='https://www.avito.ru/brands/i223140984';
const node=(tag,text='',className='')=>{const n=document.createElement(tag);n.textContent=text;if(className)n.className=className;return n;};
const action=(text,fn,className='btn')=>{const n=node('button',text,className);n.type='button';n.onclick=fn;return n;};
const link=(text,href,className='btn')=>{const n=node('a',text,className);n.href=href;return n;};
let session={};
async function request(path,body){
 const r=await fetch('/api/course-access/'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',
 headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':session.csrf||''},
 ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(16000)});
 const data=await r.json().catch(()=>({}));if(!r.ok)throw Error(data.error||'Не удалось выполнить действие. Попробуйте ещё раз.');
 if(path==='session'||path==='key-login'||path==='login')session=data;return data;
}
function field(form,label,name,{type='text',max=240,required=false,value='',tag='input'}={}){
 const wrap=node('label','','field'),i=node(tag);wrap.append(node('span',label));i.name=name;if(tag==='input')i.type=type;i.maxLength=max;i.required=required;i.value=value;
 if(type==='password')i.autocomplete=name==='password'?'current-password':'off';wrap.append(i);form.append(wrap);return i;
}
function status(){const n=node('p','','managed-status');n.setAttribute('role','status');return n;}
function login(host,onSuccess){
 const card=node('section','','card stack managed-login');card.append(node('p','ВАШ КЛЮЧ · ВАШ САЙТ','eyebrow'),node('h2','Откройте свою мастерскую'),node('p','Введите выданный ключ оплаченного сайта. Регистрация и новый пароль не нужны.'));
 const key=node('form','','form');field(key,'Ключ владельца сайта','key',{type:'password',max:43,required:true});const enter=node('button','Войти по ключу','btn primary');enter.type='submit';const message=status();key.append(enter,message);card.append(key);
 const details=node('details','','managed-owner-login');details.append(node('summary','Служебный вход Syolana'));
 const owner=node('form','','form');field(owner,'Логин владельца','username',{max:40,required:true});field(owner,'Пароль','password',{type:'password',max:300,required:true});const sign=node('button','Войти','btn');sign.type='submit';const ownerMessage=status();owner.append(sign,ownerMessage);details.append(owner);card.append(details,link('Получить доступ через Авито',AVITO,'text-link'));
 for(const [form,path,button,out] of [[key,'key-login',enter,message],[owner,'login',sign,ownerMessage]])form.onsubmit=async e=>{e.preventDefault();button.disabled=true;out.textContent='Проверяем ключ…';try{await request(path,Object.fromEntries(new FormData(form)));form.reset();await onSuccess();}catch(error){out.textContent=error.message;}finally{button.disabled=false;}};
 host.append(card);
}
function attribution(position='bottom'){
 const section=node('aside','','card managed-attribution syolana-passport-button managed-attribution-'+position);const logo=node('img');logo.src='assets/logo.svg?v=20261014-passport-1';logo.alt='';logo.width=50;logo.height=50;
 const text=node('div');text.append(link('Темы и оформление — Syolana','https://syolana.com/','text-link'));section.append(logo,text);return section;
}
function postsView(posts){
 const list=node('section','','managed-posts');
 for(const post of posts.filter(p=>!p.hidden)){
  const card=node('article','','card stack');card.append(node('p',[post.category,new Date(post.publishedAt*1000).toLocaleDateString('ru-RU')].filter(Boolean).join(' · '),'eyebrow'),node('h3',post.title),node('p',post.text));
  for(const item of post.media||[]){if(!/^\/api\/course-access\/studio\/[a-z0-9-]+\/media\/[a-f0-9]{32}$/.test(item.src)&&!/^data:(?:image\/(?:jpeg|png|webp)|video\/(?:mp4|webm));base64,[A-Za-z0-9+/]+={0,2}$/.test(item.src))continue;const media=node(item.type==='video'?'video':'img');media.src=item.src;media.className='managed-media';if(item.type==='video'){media.controls=true;media.playsInline=true;media.preload='metadata';}else{media.alt=post.title;media.loading='lazy';}card.append(media);}
  list.append(card);
 }
 if(!list.children.length)list.append(node('p','Новые публикации скоро появятся здесь.','empty'));return list;
}
export async function mountManagedSite(host,site,{isCurrent=()=>true,selectTheme}={}){
 try{
  const d=await request('studio/'+site+'/public');if(!isCurrent())return;
  document.title=d.settings.name+' · Syolana';document.querySelector('#footer>span').textContent='© '+d.settings.name+'. Материалы принадлежат владельцу сайта.';
  host.append(attribution('top'),node('header','','hero managed-site-hero'));
  const head=host.lastChild;head.append(node('p','АВТОРСКОЕ ПРОСТРАНСТВО','eyebrow'),node('h1',d.settings.name),node('p',d.settings.tagline,'muted'));if(d.settings.description)head.append(node('p',d.settings.description,'managed-description'));
  if(d.settings.contacts)head.append(renderContactLinks(d.settings.contacts));
  const blocks=node('div','','managed-blocks');host.append(blocks);renderSiteBlocks(blocks,d.settings,{publications:target=>target.append(postsView(d.posts||[]))});host.append(attribution('bottom'),link('Редактор владельца','#/site-editor/'+site,'text-link managed-editor-link'));
  if(d.settings.theme&&selectTheme)await selectTheme(d.settings.theme);
 }catch(error){if(isCurrent())host.append(node('section',error.message,'card managed-status'),link('На главную Syolana','#/','btn'));}
}
export async function mountSiteCreator(host,{isCurrent=()=>true}={}){
 let disposed=false;const valid=()=>!disposed&&isCurrent();
 const header=node('header','','hero managed-creator-hero');header.append(node('p','SYOLANA · ВАША МАСТЕРСКАЯ','eyebrow'),node('h1','Пусть у вашей идеи будет свой сайт'),node('p','Выберите тему и шаблон, добавьте свои материалы. Домен, хостинг и размещение — по вашему выбору.','muted'));host.append(header);
 const quick=node('div','','row managed-workshop-actions');quick.append(link('Открыть редактор без входа','partner-demo/studio/','btn primary'),link('Посмотреть тестовый сайт','partner-demo/','btn'));host.append(quick);
 const root=node('div','','managed-workspace');host.append(root);
 async function open(){
  root.replaceChildren();login(root,open);try{await request('session');}catch(e){if(valid()){const connection=node('aside','','workspace-connection');connection.append(node('p','Демо открывается без сервера. Ключ владельца открывает резервную мастерскую на этом устройстве. Серверная публикация требует восстановления связи.'),action('Повторить подключение',open));root.append(connection);}return;}if(!valid())return;
  if(!session.canCreateSite)return;root.replaceChildren();if(session.reserve)root.append(node('p','Резервная мастерская владельца. Черновики сохраняются на этом устройстве. Готовый сайт можно скачать и разместить на выбранном хостинге. Серверные проекты остаются на сервере и появятся после восстановления связи.','card'));
  const response=await request('studio/projects');if(!valid())return;
  if(response.projects.length){const list=node('section','','card stack');list.append(node('h2','Ваши сайты'));for(const p of response.projects){const row=node('div','','managed-project-row');row.append(node('strong',p.name),node('span',p.local?(p.status==='ready'?'Готов к экспорту':'Черновик на устройстве'):p.status==='published'?'Опубликован':'Черновик','badge'),link('Редактировать','#/site-editor/'+p.id,'btn'));if(p.status==='published'||p.local)row.append(link('Открыть сайт','#/site/'+p.id,'btn'));list.append(row);}root.append(list);}
  if(!session.owner&&response.projects.length)return;
  const card=node('section','','card stack');card.append(node('h2','Создайте новое пространство'));const form=node('form','','form');const name=field(form,'Название сайта','name',{max:100,required:true});name.placeholder='Например, Мастерская света';
  const choices=node('div','','managed-template-choices');let template='portfolio';
  for(const [id,title,text]of [['portfolio','Творчество','Работы, фотографии и новые проекты'],['author','Истории','Тексты, заметки и публикации'],['business','Свое дело','Предложение, преимущества и контакты']]){const label=node('label','','managed-template');const input=node('input');input.type='radio';input.name='template';input.value=id;input.checked=id===template;input.onchange=()=>{template=id;};label.append(input,node('strong',title),node('span',text));choices.append(label);}form.append(choices);
  const themeLabel=node('label','','field');themeLabel.append(node('span','Первая тема сайта'));const theme=node('select');theme.name='theme';
  try{const r=await fetch('themes/manifest.json',{signal:AbortSignal.timeout(5000)});if(!r.ok)throw Error();for(const t of await r.json()){const option=node('option',t.name);option.value=t.id;theme.append(option);}}catch{const option=node('option','Сияние звёзд');option.value='aurora';theme.append(option);}themeLabel.append(theme);form.append(themeLabel);
  if(session.owner){const slug=field(form,'Короткий адрес · необязательно','slug',{max:50});slug.placeholder='my-studio';slug.pattern='[a-z0-9][a-z0-9-]{2,49}';}
  const button=node('button','Создать сайт','btn primary');button.type='submit';const message=status();form.append(button,message);card.append(form,node('p',session.reserve?'Сначала создаётся черновик на устройстве. Скачайте готовый сайт и разместите его на выбранном хостинге.':'Сначала создаётся закрытый черновик. Посетители увидят страницу после нажатия «Опубликовать изменения». Собственный домен можно подключить отдельно.','fine'));root.append(card);
  const requestId=crypto.randomUUID();form.onsubmit=async e=>{e.preventDefault();button.disabled=true;message.textContent='Создаём сайт…';try{const d=await request('studio/projects',{name:name.value.trim(),template,theme:theme.value,slug:form.elements.slug?.value.trim()||'',requestId});if(valid())location.hash='#/site-editor/'+d.project.id;}catch(error){message.textContent=error.message;}finally{button.disabled=false;}};
 }
 try{await open();}catch(error){if(valid())root.append(node('p',error.message,'managed-status'));}return()=>{disposed=true;};
}
async function upload(site,file){
 file=await prepareMediaUpload(file);
 if(file.size>2*1024*1024)throw Error('Файл должен быть не больше 2 МБ.');
 if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type))throw Error('Выберите JPG, PNG, WebP, MP4 или WebM.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result).split(',')[1]);r.onerror=()=>reject(Error('Не удалось прочитать файл с телефона.'));r.readAsDataURL(file);});
 return request('studio/'+site+'/media',{data,contentType:file.type});
}
export async function mountManagedEditor(host,site,{isCurrent=()=>true}={}){
 let disposed=false;const valid=()=>!disposed&&isCurrent();
 const header=node('header','','managed-editor-head card');const copy=node('div');copy.append(node('p','SYOLANA · ВАША МАСТЕРСКАЯ','eyebrow'),node('h1','Место, где рождается ваш сайт'),node('p','Ваши тексты, выбранная тема и готовые блоки. Каждое изменение — в вашем темпе.'));
 const links=node('div','','row');links.append(link('Мои сайты','#/create-site','btn'));header.append(copy,links);host.append(header);
 const root=node('div','','managed-workspace');host.append(root);
 async function open(){
  root.replaceChildren();login(root,open);try{await request('session');}catch(error){root.append(node('p',error.message,'managed-status'));return;}if(!valid())return;
  if(!session.canCreateSite)return;root.replaceChildren();
  let data;try{data=await request('studio/'+site+'/settings');}catch(error){if(valid())root.append(node('section',error.message,'card managed-status'));return;}if(!valid())return;
  const local=Boolean(data.local);document.title=data.settings.name+' · Редактор';let revision=data.revision,published=data.project.status==='published';
  const notice=node('section','','managed-share card stack'),state=node('p',local?'Резервная мастерская: изменения сохраняются на этом устройстве. Для публикации скачайте сайт и загрузите его на выбранный хостинг.':data.project.status==='published'?'Сайт опубликован. Последние изменения сохранены на сервере.':'Это черновик. Нажмите «Опубликовать изменения», когда страница будет готова.');const url=new URL('#/site/'+site,location.href).href;
  const live=link(local?'Предпросмотр сохранённого сайта':'Открыть сайт',url,'btn primary');live.hidden=!local&&data.project.status!=='published';const visibility=action(published?'Скрыть сайт':'Вернуть сайт',async()=>{visibility.disabled=true;try{const d=await request('studio/'+site+'/visibility',{visible:!published});published=d.project.status==='published';visibility.textContent=published?'Скрыть сайт':'Вернуть сайт';live.hidden=!published;share.hidden=!published;state.textContent=published?'Сайт снова доступен посетителям.':'Сайт скрыт. Тексты и настройки сохранены; страницу можно вернуть.';}catch(error){state.textContent=error.message;}finally{visibility.disabled=false;}});visibility.hidden=local||data.project.status==='draft';const share=action('Скопировать адрес',async()=>{try{await navigator.clipboard.writeText(url);state.textContent='Адрес сайта скопирован.';}catch{state.textContent='Адрес вашего сайта: '+url;}});share.hidden=local||live.hidden;
  notice.append(state,live,share,visibility,action('Скачать готовый сайт',async()=>{try{const exported=await request('studio/'+site+'/export');await downloadSite(exported,site);state.textContent='Архив готового сайта скачан. Загрузите его содержимое на выбранный хостинг.';}catch(error){state.textContent=error.message;}}),action('Скачать тексты и настройки',async()=>{try{const exported=await request('studio/'+site+'/export');const blob=new Blob([JSON.stringify(exported,null,2)],{type:'application/json;charset=utf-8'}),href=URL.createObjectURL(blob),a=link('Скачать',href);a.download='syolana-'+site+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(href),1000);}catch(error){state.textContent=error.message;}}));root.append(notice);
  const builder=node('section','','card managed-builder');root.append(builder);
  await mountSiteBuilder(builder,{initial:data.settings,local,exportSite:async settings=>{const exported=await request('studio/'+site+'/export');await downloadSite({...exported,settings},site);},themeBase:new URL('themes/',document.baseURI),uploadImage:file=>upload(site,file),save:async settings=>{const saved=await request('studio/'+site+'/publish',{settings,revision});revision=saved.revision;published=!local;visibility.hidden=local;visibility.textContent='Скрыть сайт';state.textContent=local?'Изменения сохранены на устройстве. Обновите предпросмотр или скачайте готовый сайт для размещения.':'Опубликовано. Ваш сайт уже доступен по адресу ниже.';live.hidden=false;share.hidden=local;return saved;}});
  if(!valid())return;const panel=node('section','','card stack managed-publisher');panel.append(node('p','ВАШИ ИСТОРИИ','eyebrow'),node('h2',local?'Новая запись':'Новая публикация'),node('p','Добавьте текст, фото или короткое видео. На сайте запись появится в блоке «Публикации».'));root.append(panel);
  const form=node('form','','form');const title=field(form,'Заголовок','title',{max:140,required:true});const text=field(form,'Текст','text',{max:10000,tag:'textarea'});const category=field(form,'Категория','category',{max:50,value:'Новости'});const files=field(form,'Фото и короткое видео · до 2 МБ каждый','files',{type:'file',max:0});files.multiple=true;files.accept='image/jpeg,image/png,image/webp,video/mp4,video/webm';
  const message=status(),submit=node('button','Опубликовать запись','btn primary');submit.type='submit';let editing=null,rows=[];const reset=()=>{editing=null;form.reset();category.value='Новости';submit.textContent='Опубликовать запись';};form.append(submit,action('Новая запись',reset),message);panel.append(form);
  const list=node('section','','managed-post-list');panel.append(list);
  function draw(){list.replaceChildren();for(const p of rows){const item=node('article','','managed-post-row');item.append(node('h3',p.title),node('p',p.text),node('span',p.hidden?'Скрыта':'На сайте','badge'));const buttons=node('div','','row');buttons.append(action('Изменить',()=>{editing=p;title.value=p.title;text.value=p.text;category.value=p.category;files.value='';submit.textContent='Сохранить запись';title.focus();}),action(p.hidden?'Вернуть':'Скрыть',async()=>{try{const d=await request('studio/'+site+'/posts/'+p.id,{action:p.hidden?'restore':'hide',revision:p.revision});rows=d.posts;draw();message.textContent=p.hidden?'Запись возвращена.':'Запись скрыта. Её можно вернуть.';}catch(error){message.textContent=error.message;}}));item.append(buttons);list.append(item);}}
  async function refreshPosts(){const d=await request('studio/'+site+'/posts');if(valid()){rows=d.posts;draw();}}
  form.onsubmit=async e=>{e.preventDefault();submit.disabled=true;message.textContent='Сохраняем запись…';try{const selected=[...files.files];const types=selected.map(f=>f.type.startsWith('video/')?'video':'image');if(selected.length>2||new Set(types).size!==types.length)throw Error('Выберите одно фото и одно видео.');let media=(editing?.media||[]).map(m=>({id:m.id,type:m.type}));for(const file of selected){const d=await upload(site,file);media=media.filter(m=>m.type!==d.type);media.push({id:d.id,type:d.type});}const d=await request('studio/'+site+'/posts'+(editing?'/'+editing.id:''),{title:title.value,text:text.value,category:category.value,media,...(editing?{revision:editing.revision}:{})});if(valid()){rows=d.posts;draw();reset();message.textContent=local?'Запись сохранена на устройстве. Она будет включена в новый экспорт сайта.':'Запись сохранена. На опубликованном сайте она уже видна посетителям.';}}catch(error){message.textContent=error.message;}finally{submit.disabled=false;}};
  try{await refreshPosts();}catch(error){message.textContent=error.message;}
  root.append(action('Выйти из редактора',async()=>{try{await request('logout',{});location.reload();}catch(error){state.textContent=error.message;}}));
 }
 await open();return()=>{disposed=true;};
}

async function downloadSite(value,site){if(!value.license){try{const info=await request('session'),registry=await request('admin/partner-registry');const row=registry.sites.find(r=>r.siteId===site);if(row)value.license={partnerId:row.partnerId,domain:row.domain,endpoint:info.partnerLicenseEndpoint};}catch{}}const archive=await createSiteArchive(value),url=URL.createObjectURL(archive),a=link('Скачать',url);a.download='syolana-'+site+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
