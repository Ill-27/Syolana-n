import {createOwnerVault} from './owner-vault.mjs';
import {createDomainBook,validateDomainRow} from './owner-registry-store.mjs';
import {installAPITransport} from './api-transport.js';
import {mountPartnerFileBuilder} from './partner-file.mjs';

const make=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const stamp=()=>Math.floor(Date.now()/1000);
const day=n=>new Date(n*1000).toLocaleDateString('ru-RU',{timeZone:'Europe/Moscow'});
const iso=n=>new Date(n*1000).toISOString().slice(0,10);
const names={draft:'Запись без серверной лицензии',active:'Активна',suspended:'Приостановлена',ended:'Завершена',expired:'Срок истёк'};
function input(form,title,type,name,required=false){const label=make('label',title,'field'),n=make('input');n.type=type;n.name=name;n.required=required;n.autocomplete='off';label.append(n);form.append(label);return n;}
export async function mountOwnerSites(host,{isCurrent=()=>true}={}){
 installAPITransport();
 const vault=createOwnerVault({nativeFetch:window.fetch.bind(window),storage:window.sessionStorage});
 const book=createDomainBook({storage:window.localStorage,vault});
 let rows=[],online=false,csrf='',disposed=false;
 const current=()=>!disposed&&isCurrent();
 host.dataset.i18nSkip='owner-private';
 const section=make('section','','card stack owner-sites');
 const style=make('style');style.textContent='.owner-sites{max-width:760px;margin:auto}.owner-sites input,.owner-sites select{max-width:100%;width:100%;box-sizing:border-box;min-height:44px}.owner-sites .field{display:grid;gap:6px;margin:10px 0}.owner-sites form{display:grid;gap:10px}.owner-sites button{min-height:44px;white-space:normal}.owner-sites .owner-actions{display:flex;flex-wrap:wrap;gap:10px}.owner-sites .owner-entry{border:1px solid var(--line,#888);border-radius:14px;padding:16px;margin:12px 0;overflow-wrap:anywhere}.owner-sites .owner-note{font-size:.94em;opacity:.86}.owner-sites [hidden]{display:none!important}';
 section.append(style,make('h1','Мои партнёрские сайты'),make('p','Здесь разрешаются домены и продление на 2027 год. Посетители партнёрских сайтов сюда не записываются.'));
 const message=make('p','','notice');message.setAttribute('role','status');message.setAttribute('aria-live','polite');
 const login=make('form'),key=input(login,'Ключ владельца','password','ownerKey',true);key.minLength=43;key.maxLength=43;
 const show=make('button','Показать ключ');show.type='button';show.onclick=()=>{key.type=key.type==='password'?'text':'password';show.textContent=key.type==='password'?'Показать ключ':'Скрыть ключ';};
 const unlock=make('button','Открыть закрытый список','btn primary');unlock.type='submit';login.append(show,unlock);
 const panel=make('div');panel.hidden=true;
 const disposePartnerFiles=mountPartnerFileBuilder(panel,{isOwner:()=>vault.isOwner(),onPrepared:code=>{partnerId.value=code;details.open=true;}});
 const connection=make('p','Сервер не подключён. Здесь хранится зашифрованная копия на этом устройстве. Сохранённый статус не подтверждает текущую работу лицензии.','owner-note');
 const onlineButton=make('button','Подключить сервер лицензий');onlineButton.type='button';
 const toolbar=make('div','','owner-actions'),backup=make('button','Скачать зашифрованную копию'),restore=make('input'),restoreLabel=make('label','Восстановить копию','field');backup.type='button';restore.type='file';restore.accept='.json,application/json';restoreLabel.append(restore);toolbar.append(onlineButton,backup,restoreLabel);
 const search=input(panel,'Найти домен или хостинг','search','search');const filter=make('select');filter.setAttribute('aria-label','Состояние лицензии');for(const [v,t]of[['all','Все сайты'],['expiring','Срок заканчивается в течение 30 дней'],['draft','Без серверной лицензии'],['active','Активные'],['suspended','Приостановленные'],['expired','Срок истёк'],['ended','Завершённые']]){const o=make('option',t);o.value=v;filter.append(o);}
 const count=make('p'),list=make('div');panel.append(connection,toolbar,filter,count,list);
 const details=make('details');details.append(make('summary','Ввести домен и включить оформление'));
 const form=make('form'),partnerId=input(form,'Код оформления из выданного файла (p-...)','text','partnerId',true),url=input(form,'Полный адрес сайта партнёра с HTTPS','url','siteUrl',true);
 partnerId.pattern='p-[a-f0-9]{12}';partnerId.placeholder='p-123456789abc';url.placeholder='https://example.ru/';
 const paymentLabel=make('label','Оплата за 2027 год проверена, индивидуальная цена и состав согласованы','field'),payment=make('input');payment.type='checkbox';payment.name='paymentVerified';paymentLabel.prepend(payment);
 const add=make('button','Подтвердить адрес и включить оформление','btn primary');add.type='submit';form.append(make('p','Без отметки оплаты: бесплатный тест до 1 января 2027, 00:00 МСК. С отметкой: продолжение до 1 января 2028, 00:00 МСК. Платёж автоматически не списывается. Не вводите имена, телефоны и данные посетителей.','owner-note'),paymentLabel,add);details.append(form);panel.append(details);
 section.append(login,panel,message);host.append(section);
 async function api(path,body){const response=await fetch('/api/course-access/languages/'+path,{method:body===undefined?'GET':'POST',cache:'no-store',credentials:'same-origin',signal:AbortSignal.timeout(20000),headers:body===undefined?{}:{'Content-Type':'application/json','X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});if(!(response.headers.get('content-type')||'').includes('application/json'))throw Error('Сервер лицензий временно недоступен. Зашифрованная копия остаётся на устройстве.');const result=await response.json();if(!response.ok)throw Error(result.error||'Сервер лицензий недоступен.');return result;}
 function render(){if(!current())return;const q=search.value.trim().toLowerCase(),now=stamp();list.replaceChildren();const selected=rows.filter(r=>{const state=r.status!=='draft'&&r.licenseUntil<=now?'expired':r.status;return (!q||(r.domain+' '+r.hosting).includes(q))&&(filter.value==='all'||filter.value===state||(filter.value==='expiring'&&state==='active'&&r.licenseUntil<=now+30*86400));}).sort((a,b)=>a.licenseUntil-b.licenseUntil);count.textContent='Сайтов: '+rows.length+' · показано: '+selected.length;
  for(const row of selected){const state=row.status!=='draft'&&row.licenseUntil<=now?'expired':row.status,item=make('article','','owner-entry'),link=make('a',row.siteUrl);link.href=row.siteUrl;link.target='_blank';link.rel='noopener noreferrer';item.append(link,make('p',names[state]+' · '+day(row.licenseStart)+' — '+day(row.licenseUntil)),make('p','Хостинг: '+(row.hosting||'не указан')+(row.hostingCountry?' · '+row.hostingCountry:'')),make('p','Проверка владельцем: '+(row.lastPublicCheck?day(row.lastPublicCheck):'пока не отмечена')));
   if(row.serverCheckedAt)item.append(make('p','Состояние получено от сервера: '+day(row.serverCheckedAt),'owner-note'));
   const actions=make('div','','owner-actions'),checked=make('button','Проверено мной');checked.type='button';checked.onclick=async()=>{try{if(online&&row.serverConfirmed)await change(row,{publicChecked:true});else{row.lastPublicCheck=stamp();rows=await book.write(rows);render();message.textContent='Личная проверка отмечена в зашифрованной копии.';}}catch(e){message.textContent=e.message;}};actions.append(checked);
   if(row.serverConfirmed){
    const pause=make('button',row.status==='active'?'Приостановить оформление':'Возобновить оформление');pause.type='button';pause.disabled=!online||state==='expired'||row.status==='ended';pause.onclick=()=>change(row,{status:row.status==='active'?'suspended':'active',reason:'owner-review'});actions.append(pause);
    if(!row.paid2027){const renew=make('button','Оплата проверена: включить 2027 год');renew.type='button';renew.disabled=!online||Date.now()>=Date.parse('2028-01-01T00:00:00+03:00');renew.onclick=()=>{if(confirm('Цена и состав согласованы, оплата за 2027 год проверена для '+row.domain+'? Оформление продолжится до 1 января 2028, 00:00 МСК.'))change(row,{status:'active',paid2027:true,paymentVerified:true});};actions.append(renew);}
    else item.append(make('p','2027 год включён. Общее окончание: 1 января 2028, 00:00 МСК.'));
   }
   item.append(actions);list.append(item);
  }if(!selected.length)list.append(make('p',rows.length?'Нет сайтов с выбранным условием.':'Список пуст. Добавьте адрес после согласования с партнёром.'));
 }
 async function refreshServer(){const result=await api('admin/partner-registry');if(!Array.isArray(result.sites))throw Error('Сервер вернул неверный список.');const checked=stamp(),received=result.sites.map(r=>validateDomainRow({...r,serverConfirmed:true,serverCheckedAt:checked}));const ids=new Set(received.map(r=>r.partnerId));rows=await book.write([...received,...rows.filter(r=>!ids.has(r.partnerId)&&!r.serverConfirmed)]);render();}
 async function change(row,body){try{const result=await api('admin/partner-registry',{partnerId:row.partnerId,...body});if(!result.site)throw Error('Сервер не подтвердил изменение.');const saved=validateDomainRow({...result.site,serverConfirmed:true,serverCheckedAt:stamp()});rows=await book.write(rows.map(r=>r.partnerId===row.partnerId?saved:r));render();message.textContent='Изменение лицензии подтверждено сервером.';}catch(e){online=false;connection.textContent='Подключение прервалось. Повторно подключите сервер и обновите список перед новым изменением.';render();message.textContent=e.message;}}
 async function open(){rows=await book.read();if(!current())return;panel.hidden=false;unlock.textContent='Список открыт';render();}
 login.onsubmit=async e=>{e.preventDefault();unlock.disabled=true;try{if(!await vault.unlock(key.value.trim()))throw Error('Ключ владельца не подошёл либо не удалось получить защищённый доступ.');key.value='';await open();message.textContent='Список открыт. Копия защищена ключом владельца.';}catch(e){message.textContent=e.message;}finally{unlock.disabled=false;}};
 onlineButton.onclick=async()=>{onlineButton.disabled=true;try{if(!vault.isOwner())throw Error('Сначала откройте список ключом владельца.');if(!/^[A-Za-z0-9_-]{43}$/.test(key.value.trim()))throw Error('Введите ключ владельца ещё раз в верхнем поле для отдельного подключения сервера.');const session=await api('key-login',{key:key.value.trim(),onlineOnly:true});key.value='';if(!session.owner||session.reserve)throw Error('Серверный вход владельца не подтверждён.');csrf=session.csrf;online=true;await refreshServer();connection.textContent='Список обновлён с сервера. Изменение лицензии выполняется только после его подтверждения.';message.textContent='Сервер подключён.';}catch(e){online=false;message.textContent=e.message;render();}finally{onlineButton.disabled=false;}};
 search.oninput=render;filter.onchange=render;
 form.onsubmit=async e=>{e.preventDefault();add.disabled=true;try{
  if(!online)throw Error('Сначала подключите сервер лицензий кнопкой выше.');
  if(!/^p-[a-f0-9]{12}$/.test(partnerId.value.trim()))throw Error('Укажите код оформления из выданного файла.');
  const result=await api('admin/partner-registry',{partnerId:partnerId.value.trim(),siteUrl:url.value,paid2027:payment.checked,paymentVerified:payment.checked,status:'active'});
  if(!result.site)throw Error('Сервер не подтвердил разрешение.');
  const saved=validateDomainRow({...result.site,serverConfirmed:true,serverCheckedAt:stamp()});rows=await book.write([...rows.filter(r=>r.partnerId!==saved.partnerId),saved]);render();url.value='';partnerId.value='';payment.checked=false;details.open=false;message.textContent='Адрес разрешён сервером. На сайте партнёра оформление включится при следующей проверке, обычно в течение 10 секунд.';
 }catch(e){message.textContent=e.message;}finally{add.disabled=false;}};
 backup.onclick=()=>{const raw=book.exportEncrypted();if(!raw){message.textContent='Сначала добавьте сайт либо получите список от сервера.';return;}const a=make('a');a.href=URL.createObjectURL(new Blob([raw],{type:'application/json'}));a.download='Syolana-domains-encrypted-'+iso(stamp())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);message.textContent='Сохраните зашифрованную копию. На другом адресе сайта откройте её тем же ключом владельца.';};
 restore.onchange=async()=>{try{const file=restore.files[0];if(!file)return;if(file.size>1024*1024)throw Error('Файл слишком большой.');if(rows.length&&!confirm('Заменить локальную копию выбранным файлом? Серверные лицензии этим действием не изменяются.'))return;rows=await book.importEncrypted(await file.text());online=false;connection.textContent='Копия восстановлена на устройстве. Подключите сервер отдельно, чтобы проверить актуальные лицензии.';render();message.textContent='Зашифрованная копия восстановлена.';}catch(e){message.textContent=e.message;}finally{restore.value='';}};
 if(vault.isOwner())try{await open();}catch(e){message.textContent=e.message;}
 return()=>{disposed=true;disposePartnerFiles();};
}
