import {issueLocalCoursePackage,localCourseAccess} from './local-course-access.mjs';
const node=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
function input(form,label,name,type='text'){const l=node('label',label,'field'),i=node('input');i.name=name;i.type=type;i.autocomplete='off';l.append(i);form.append(l);return i;}
async function copy(text,message){try{await navigator.clipboard.writeText(text);message.textContent='Скопировано. Отправьте в той же переписке на Авито.';}catch{message.textContent='Выделите текст и скопируйте через меню браузера.';}}
async function readLicenseResponse(response){const reader=response.body?.getReader();if(!reader){const text=await response.text();if(new TextEncoder().encode(text).length>24*1024*1024)throw Error('Файл слишком большой.');return text;}let size=0;const chunks=[];try{for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>24*1024*1024){await reader.cancel();throw Error('Файл слишком большой.');}chunks.push(value);}}finally{reader.releaseLock();}return new Blob(chunks).text();}

export function mountLocalBuyer(host,{onOpen,onStart=()=>{},access=localCourseAccess()}={}){
 const wrapper=node('div','','local-course-option'),box=node('details','','access-details');box.append(node('summary','Дополнительно: локальное разрешение для одного браузера'),node('p','1. Создайте запрос в том браузере и на том адресе сайта, где будете учиться. 2. Отправьте его продавцу на Авито. 3. После оплаты загрузите выданный файл разрешения.'),node('p','Запрос создаётся здесь. Сайт не отправляет его продавцу автоматически. Другой браузер не сможет открыть копию этого файла. После очистки данных браузера ключ может быть утрачен.'));
 const make=node('button','Создать запрос браузера');make.type='button';const request=node('textarea');request.readOnly=true;request.rows=4;request.setAttribute('aria-label','Запрос браузера');request.dataset.copyAllowed='true';request.style.width='100%';request.style.boxSizing='border-box';request.hidden=true;
 const copyButton=node('button','Скопировать запрос');copyButton.type='button';copyButton.hidden=true;const message=node('p','','notice');message.setAttribute('role','status');
 make.onclick=async()=>{make.disabled=true;try{request.value=await access.activationRequest();request.hidden=false;copyButton.hidden=false;message.textContent='Отправьте этот запрос продавцу на Авито. Не создавайте новый запрос в другом браузере.';}catch(e){message.textContent=e.message;}finally{make.disabled=false;}};
 copyButton.onclick=()=>copy(request.value,message);
 const form=node('form','','access-form'),file=input(form,'Выбрать файл разрешения','localLicense','file');file.accept='.syolicense,application/json';file.required=true;const open=node('button','Открыть моё разрешение','primary');open.type='submit';form.append(open);
 async function activate(text){onStart();await access.activate(text);await onOpen(await access.session());}
 form.onsubmit=async e=>{e.preventDefault();const selected=file.files?.[0];if(!selected)return;open.disabled=true;message.textContent='Проверяем разрешение в этом браузере…';try{if(selected.size>24*1024*1024)throw Error('Файл слишком большой.');await activate(await selected.text());}catch(err){message.textContent=err.message;}finally{open.disabled=false;file.value='';}};
 const linkForm=node('form','','access-form'),link=input(linkForm,'Или ссылка на файл разрешения на этом сайте','licenseURL','url');link.placeholder=location.origin+'/course-packages/… .syolicense';link.required=true;const load=node('button','Загрузить по ссылке');load.type='submit';linkForm.append(load);
 linkForm.onsubmit=async e=>{e.preventDefault();load.disabled=true;message.textContent='Загружаем зашифрованное разрешение…';try{const url=new URL(link.value);if(url.origin!==location.origin||!/^\/course-packages\/[A-Za-z0-9_-]+\.syolicense$/.test(url.pathname)||url.search||url.hash)throw Error('Нужна ссылка на файл разрешения на этом адресе сайта.');const r=await fetch(url.href,{credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Файл разрешения пока недоступен. Уточните ссылку у продавца.');if(Number(r.headers.get('content-length'))>24*1024*1024)throw Error('Файл слишком большой.');await activate(await readLicenseResponse(r));}catch(err){message.textContent=err.message;}finally{load.disabled=false;}};
 box.append(make,request,copyButton,form,linkForm,message);wrapper.append(box);host.append(wrapper);return box;
}

export function mountLocalIssuer(host,{getCourseData,origin=location.origin,now=Date.now}={}){
 const box=node('details','','access-details');box.append(node('summary','Выдать разрешение вручную — один браузер'),node('p','Покупатель создаёт запрос на странице курса и присылает его на Авито. После проверки оплаты вставьте запрос сюда. Будет создан отдельный зашифрованный файл всех платных курсов на 30 дней. Файл и запрос автоматически на сервер не отправляются.'),node('p','Сохраните файл на телефоне. Его можно вручную разместить в папке course-packages на вашем хостинге и передать ссылку в той же переписке. Выдача нового файла для другого браузера не отключает старый: дождитесь окончания прежнего срока либо используйте серверный доступ.'));
 const form=node('form','','access-form'),request=input(form,'Запрос браузера покупателя','activationRequest');request.required=true;request.maxLength=1600;
 const deadline=input(form,'Доступ до · при продлении сохраните оплаченный остаток','localAccessUntil','datetime-local');deadline.required=true;
 const initial=new Date(now()+30*86400000);deadline.value=new Date(initial.getTime()-initial.getTimezoneOffset()*60000).toISOString().slice(0,16);
 const verify=node('label','','inline-field'),check=node('input');check.type='checkbox';check.required=true;verify.append(check,document.createTextNode('Я проверила оплату 650 ₽ за 30 дней и выдаю одно разрешение по этой покупке'));
 const create=node('button','Создать зашифрованное разрешение','primary');create.type='submit';const message=node('p','','notice');message.setAttribute('role','status');const delivery=node('div','','access-code');delivery.dataset.copyAllowed='true';let downloadURL;
 form.append(verify,create);box.append(form,delivery,message);host.append(box);
 form.onsubmit=async e=>{e.preventDefault();if(!check.checked)return;create.disabled=true;message.textContent='Готовим защищённые курсы. Не закрывайте страницу…';try{
  const until=Math.floor(new Date(deadline.value).getTime()/1000);
  const record=await issueLocalCoursePackage({request:request.value.trim(),getCourseData,origin,now,until});
  if(downloadURL)URL.revokeObjectURL(downloadURL);downloadURL=URL.createObjectURL(new Blob([JSON.stringify(record)],{type:'application/json'}));
  const filename=record.id+'.syolicense',download=node('a','Сохранить файл разрешения','primary');download.href=downloadURL;download.download=filename;
  const path='/course-packages/'+filename,copyLink=node('button','Скопировать ссылку после загрузки на хостинг');copyLink.type='button';copyLink.onclick=()=>copy(origin+path,message);
  delivery.replaceChildren(download,node('p','После ручной загрузки файла на хостинг: '+origin+path),copyLink,node('p','Срок: до '+new Date(until*1000).toLocaleDateString('ru-RU')+'.'));
  request.value='';check.checked=false;message.textContent='Разрешение создано. Сначала сохраните файл. Ссылка заработает только после вашей загрузки файла на хостинг.';
 }catch(err){message.textContent=err.message;}finally{create.disabled=false;}};
 return box;
}
