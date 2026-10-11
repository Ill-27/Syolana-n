import {validateSiteSettings} from './partner-demo/builder-model.mjs';
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export function browserWorkshopStore() {
  let promise;
  const open = () => promise ||= new Promise((resolve,reject) => {
    const request = indexedDB.open('syolana.owner.workshop.v1', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('projects', {keyPath:'id'});
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(Error('Не удалось открыть хранилище мастерской на этом устройстве.'));
  });
  async function run(mode, call) {
    const db = await open();
    return new Promise((resolve,reject) => {
      const tx=db.transaction('projects',mode), request=call(tx.objectStore('projects'));let result;
      request.onsuccess=()=>{result=request.result;};
      tx.oncomplete=()=>resolve(result);
      tx.onerror=()=>reject(Error('Не удалось сохранить черновик. Освободите место на устройстве и скачайте копию.'));
      tx.onabort=tx.onerror;
    });
  }
  return {all:()=>run('readonly',s=>s.getAll()), get:id=>run('readonly',s=>s.get(id)), put:value=>run('readwrite',s=>s.put(value))};
}
export function createLocalWorkshop({store=browserWorkshopStore(), clock=()=>Math.floor(Date.now()/1000), uuid=()=>crypto.randomUUID() }={}) {
  const project=p=>({id:p.id, name:p.settings.name, status:p.status, local:true});
  const view=p=>({project:project(p),settings:p.settings,posts:p.posts,revision:p.revision,local:true});
  async function handle(path,method,body={}) {
    const parts=path.replace(/^.*\/api\/course-access\//,'').split('/');
    if(parts[0]!=='studio')return null;
    if(parts[1]==='projects') {
      if(method==='GET')return json({projects:(await store.all()).map(project),local:true});
      if(method==='POST') {
        const id='draft-'+uuid(),name=String(body.name||'').trim();
        const settings=validateSiteSettings({version:1,name,tagline:'Ваше пространство для идей',description:'',theme:body.theme||'aurora',contacts:{},blocks:[{id:'welcome',type:'intro',title:name,text:'Расскажите о своём проекте.'},{id:'stories',type:'publications',title:'Публикации',text:''}]});
        const p={id,settings,posts:[],media:[],revision:1,status:'draft'};await store.put(p);return json({project:project(p),local:true});
      }
    }
    const p=await store.get(parts[1]);if(!p)return json({error:'Этот черновик хранится на другом устройстве или адресе сайта. Здесь можно создать новый либо загрузить скачанную копию.'},404);
    const endpoint=parts[2];
    if(['settings','public'].includes(endpoint)&&method==='GET')return json(view(p));
    if(endpoint==='export'&&method==='GET')return json({...view(p),media:p.media,schema:'syolana.workshop.backup.v1'});
    if(endpoint==='publish'&&method==='POST') {
      if(body.revision!==p.revision)return json({error:'Черновик изменился в другой вкладке. Откройте редактор заново, чтобы сохранить обе версии.'},409);
      p.settings=validateSiteSettings(body.settings,{embeddedMedia:true});p.revision++;p.status='ready';await store.put(p);return json(view(p));
    }
    if(endpoint==='visibility'&&method==='POST')return json({error:'Резервный черновик доступен на этом устройстве. Для публикации скачайте сайт и загрузите на выбранный хостинг.'},409);
    if(endpoint==='media'&&method==='POST') {
      if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(body.contentType)||typeof body.data!=='string'||body.data.length>2800000||!/^[A-Za-z0-9+/]*={0,2}$/.test(body.data))return json({error:'Выберите фото или видео до 2 МБ.'},400);
      const id=uuid().replaceAll('-',''),type=body.contentType.startsWith('video/')?'video':'image',url='data:'+body.contentType+';base64,'+body.data;
      p.media.push({id,type,src:url});await store.put(p);return json({id,type,url,local:true});
    }
    if(endpoint==='posts') {
      if(method==='GET')return json({posts:p.posts,local:true});
      const existing=parts[3]?p.posts.find(v=>v.id===parts[3]):null;
      if(parts[3]&&!existing)return json({error:'Запись не найдена.'},404);
      if(existing&&body.revision!==existing.revision)return json({error:'Запись уже изменена в другой вкладке. Откройте её снова.'},409);
      if(existing&&['hide','restore'].includes(body.action)){existing.hidden=body.action==='hide';existing.revision++;}
      else {
        const title=String(body.title||'').trim(),text=String(body.text||''),category=String(body.category||'');
        if(!title||title.length>140||text.length>10000||category.length>50)return json({error:'Проверьте длину заголовка и текста.'},400);
        const media=(body.media||[]).map(m=>p.media.find(v=>v.id===m.id)).filter(Boolean);
        if(media.length>2)return json({error:'В записи может быть одно фото и одно видео.'},400);
        const post={id:existing?.id||uuid().replaceAll('-',''),title,text,category,media,revision:(existing?.revision||0)+1,hidden:false,publishedAt:existing?.publishedAt||clock()};
        if(existing)Object.assign(existing,post);else p.posts.unshift(post);
      }
      await store.put(p);return json({posts:p.posts,local:true});
    }
    return json({error:'Это действие требует сервера публикации. Ваш резервный черновик сохранён на устройстве.'},503);
  }
  return {handle};
}
