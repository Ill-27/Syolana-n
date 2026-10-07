// Public access shell. Paid materials exist only in the private repository/server.
const API='/api/course-access/es-a1/',AVITO='https://www.avito.ru/brands/i223140984';
let currentSession=null;
const node=(tag,value='',cls='')=>{const n=document.createElement(tag);n.textContent=value;if(cls)n.className=cls;return n;};
function input(form,label,type,name){const l=node('label',label,'field'),i=document.createElement('input');i.type=type;i.name=name;i.required=true;i.autocomplete=type==='password'?'current-password':'username';l.append(i);form.append(l);return i;}
export function validateCourse(d){
  if(!d||d.schema!=='syolana.course.v1'||d.courseId!=='es-a1'||d.priceRub!==1000)throw new Error('Выберите приватный файл испанского A1 Syolana.');
  for(const k of ['rules','vocabulary','groups','alphabet','phonetics','practice','variants','repetition'])if(!Array.isArray(d[k]))throw new Error('В файле не хватает раздела: '+k+'.');
  if(!d.phonemeDictionary||!d.statistics||d.alphabet.length!==27||d.phonetics.length<20||d.vocabulary.length>5000)throw new Error('Структура курса повреждена.');
  const ids=new Set();let count=0;
  function visit(x,depth=0){
    if(depth>25)throw new Error('Некорректная вложенность файла.');if(!x||typeof x!=='object')return;
    if(Object.hasOwn(x,'en')){
      if(typeof x.id!=='string'||ids.has(x.id)||typeof x.en!=='string'||!x.en.trim()||typeof x.ru!=='string'||!x.ru.trim()||typeof x.ipa!=='string'||!/^\[[^<>]+\]$/.test(x.ipa)||!['es-ES','es-MX','es-AR'].includes(x.lang)||/[А-Яа-яЁё]/.test(x.en))throw new Error('Неполная или повторяющаяся учебная запись.');
      if(x.en.length>10000||x.ru.length>15000||x.ipa.length>15000||++count>40000)throw new Error('Файл курса слишком большой.');ids.add(x.id);
    }
    for(const v of Object.values(x))visit(v,depth+1);
  }
  visit(d);for(const w of d.vocabulary)if(!w.head||!Array.isArray(w.forms)||!Array.isArray(w.examples)||w.examples.length!==4||new Set(w.examples.map(p=>p.en)).size!==4)throw new Error('Повреждена словарная статья.');
  for(const s of d.sources||[])if(new URL(s.url).protocol!=='https:')throw new Error('Некорректная ссылка в материале.');return d;
}
async function request(path,body,csrf=''){
  const r=await fetch(API+path,{method:body?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:body?{'Content-Type':'application/json','X-CSRF-Token':csrf}:{},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(11000)});
  if(!(r.headers.get('content-type')||'').includes('application/json'))throw new Error('Вход покупателей откроется после подключения сервера. Сейчас доступен приватный просмотр владельца.');
  const d=await r.json();if(!r.ok)throw new Error(d.error||'Доступ пока не открыт.');return d;
}
export async function loadCourse(){
  const host=document.getElementById('loading');host.replaceChildren();host.classList.add('access-screen');
  let salesOpen=false;
  try{const s=await request('session');salesOpen=s.salesOpen===true;if(s.access){currentSession=s;host.dataset.access=s.owner?'owner':'buyer';return validateCourse(await request('data'));}}catch{}
  host.append(node('p','ИСПАНСКИЙ A1','eyebrow'),node('h1','Продолжайте в своём темпе'),node('p','Понятные правила, слова с четырьмя разными примерами, формы и сочетания, повторение и озвучка — по тому же принципу, что в бесплатном A1.','view-intro'));
  const intro=node('div','','access-intro');intro.append(node('strong','1 000 ₽','access-price'),node('p',salesOpen?'Оплата и общение — только в официальном профиле Syolana на Авито. После подтверждения оплаты вы получите персональный код для своего аккаунта.':'Продажи откроются после подключения личного доступа. Оплата и общение — только в официальном профиле Syolana на Авито.'),node('p','С принципом обучения можно познакомиться в бесплатном английском A1. Испанский A1 — 1 000 ₽. Платным партнёрам Syolana доступ может предоставляться бесплатно по индивидуальному соглашению.'));host.append(intro);
  const links=node('div','','actions'),a=node('a','Официальный профиль на Авито','primary');a.href=AVITO;a.target='_blank';a.rel='noopener noreferrer';links.append(a);host.append(links);
  function panel(title){const p=document.createElement('details');p.className='access-details';p.append(node('summary',title));host.append(p);return p;}
  const login=panel('У меня уже есть доступ'),form=document.createElement('form');form.className='access-form';const user=input(form,'Логин','text','username'),password=input(form,'Пароль','password','password'),submit=node('button','Войти','primary'),error=node('p','','notice');submit.type='submit';error.setAttribute('role','status');form.append(submit,error);login.append(form);
  const activation=panel('Активировать покупку'),claim=document.createElement('form');claim.className='access-form';const code=input(claim,'Персональный код из переписки на Авито','text','code');code.autocomplete='off';const handle=input(claim,'Придумайте логин','text','username');handle.minLength=3;handle.maxLength=40;const pass=input(claim,'Придумайте пароль — от 12 символов','password','password');pass.minLength=12;pass.autocomplete='new-password';const activate=node('button','Активировать доступ','primary'),claimError=node('p','','notice');activate.type='submit';claimError.setAttribute('role','status');claim.append(activate,claimError);activation.append(claim);
  const preview=panel('Приватный просмотр владельца');preview.classList.add('owner-preview');preview.append(node('p','Скачайте файл data.json из папки courses/es-a1 вашего приватного репозитория и выберите его здесь. Курс откроется на этой странице без оплаты. Файл остаётся на вашем устройстве и не отправляется на сервер. После обновления страницы выберите его снова.'));
  const label=node('label','Выбрать приватный файл курса','file-picker'),file=document.createElement('input');file.type='file';file.accept='.json,application/json';file.setAttribute('aria-label','Приватный файл испанского A1');label.append(file);preview.append(label);const previewError=node('p','','notice');previewError.setAttribute('role','status');preview.append(previewError);
  const observer=new ResizeObserver(()=>{if(window.parent!==window)window.parent.postMessage({syolanaLesson:true,ready:true,height:Math.ceil(host.getBoundingClientRect().height)+64},location.origin);});observer.observe(host);
  return new Promise(resolve=>{
    function done(d,mode){observer.disconnect();host.dataset.access=mode;host.replaceChildren();resolve(d);}
    form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;error.textContent='Проверяем доступ…';try{currentSession=await request('login',{username:user.value,password:password.value});password.value='';done(validateCourse(await request('data')),'buyer');}catch(e){error.textContent=e.message;}finally{submit.disabled=false;}});
    claim.addEventListener('submit',async e=>{e.preventDefault();activate.disabled=true;claimError.textContent='Проверяем персональный код…';try{currentSession=await request('activate',{code:code.value,username:handle.value,password:pass.value});code.value='';pass.value='';done(validateCourse(await request('data')),'buyer');}catch(e){claimError.textContent=e.message;}finally{activate.disabled=false;}});
    file.addEventListener('change',async()=>{const f=file.files?.[0];if(!f)return;try{if(f.size>16*1024*1024)throw new Error('Файл слишком большой. Выберите исходный data.json.');done(validateCourse(JSON.parse(await f.text())),'local-owner');}catch(e){previewError.textContent=e.message;}file.value='';});
  });
}

export function mountAccountPanel(host,beforeLeave){
  if(!currentSession)return;
  const panel=node('details','','access-details'),status=node('p','','notice');status.setAttribute('role','status');
  panel.append(node('summary',currentSession.owner?'Управление покупками A1':'Мой доступ к A1'));host.append(panel);
  if(!currentSession.owner){
    panel.append(node('p','Это ваш личный доступ. Вход в другом браузере завершит предыдущую сессию.'));
    const logout=node('button','Выйти из аккаунта');logout.type='button';logout.addEventListener('click',async()=>{logout.disabled=true;try{await request('logout',{},currentSession.csrf);beforeLeave();location.reload();}catch(e){status.textContent=e.message;logout.disabled=false;}});panel.append(logout,status);return;
  }
  panel.append(node('p','Подтверждайте покупку только после проверки получения 1 000 ₽ в конкретной переписке на Авито. Код показывается один раз и действует семь дней до активации.'));
  const form=node('form','','access-form'),reference=input(form,'Уникальный номер оплаченной покупки на Авито','text','orderReference');reference.autocomplete='off';
  const verified=node('label','','inline-field'),check=document.createElement('input');check.type='checkbox';check.required=true;verified.append(check,document.createTextNode('Я проверила получение 1 000 ₽ по этой покупке'));
  const create=node('button','Выдать персональный код','primary');create.type='submit';form.append(verified,create);panel.append(form,status);
  const delivery=node('div','','access-code'),orders=node('div','','access-orders');panel.append(delivery,orders);
  function showCode(d){delivery.dataset.copyAllowed='true';delivery.replaceChildren(node('p','Отправьте этот код покупателю в той же переписке на Авито. Не публикуйте его.'),node('output',d.code),node('p','Активировать до '+new Date(d.expires*1000).toLocaleDateString('ru-RU')+'. После активации доступ закрепляется за аккаунтом.'));}
  async function refresh(){
    const data=await request('admin/orders');orders.replaceChildren();
    for(const o of data.orders){const card=node('div','','access-order');card.append(node('strong',o.order_reference),node('p',o.revoked?'Доступ отозван':o.used_by?'Активирован · '+o.username:'Ожидает активации'));
      if(!o.revoked){const action=node('button',o.used_by?'Отозвать доступ':'Выдать новый код');action.type='button';action.addEventListener('click',async()=>{if(o.used_by&&!confirm('Отозвать доступ по покупке '+o.order_reference+'?'))return;action.disabled=true;try{const d=await request(o.used_by?'admin/revoke':'admin/reissue',{orderReference:o.order_reference,...(o.used_by?{reason:'Отзыв владельцем через управление покупками'}:{})},currentSession.csrf);if(d.code)showCode(d);else delivery.replaceChildren();await refresh();status.textContent=o.used_by?'Доступ отозван.':'Предыдущий код заменён.';}catch(e){status.textContent=e.message;action.disabled=false;}});card.append(action);}orders.append(card);
    }
  }
  form.addEventListener('submit',async e=>{e.preventDefault();create.disabled=true;try{showCode(await request('admin/confirm',{orderReference:reference.value,paymentVerified:check.checked},currentSession.csrf));reference.value='';check.checked=false;await refresh();status.textContent='Персональный код создан.';}catch(e){status.textContent=e.message;}finally{create.disabled=false;}});
  const reset=node('details','','access-details');reset.append(node('summary','Сбросить пароль покупателя'));
  const resetForm=node('form','','access-form'),resetUser=input(resetForm,'Логин покупателя','text','username'),resetPass=input(resetForm,'Новый пароль — от 12 символов','password','password');resetPass.minLength=12;resetPass.autocomplete='new-password';
  const resetButton=node('button','Сбросить пароль и завершить сессии');resetButton.type='submit';resetForm.append(resetButton);reset.append(resetForm);panel.append(reset);
  resetForm.addEventListener('submit',async e=>{e.preventDefault();resetButton.disabled=true;try{await request('admin/reset-password',{username:resetUser.value,password:resetPass.value},currentSession.csrf);resetPass.value='';status.textContent='Пароль изменён. Передайте новый пароль покупателю в его переписке на Авито.';}catch(e){status.textContent=e.message;}finally{resetButton.disabled=false;}});
  const ownerLogout=node('button','Выйти из аккаунта владельца');ownerLogout.type='button';ownerLogout.addEventListener('click',async()=>{try{await request('logout',{},currentSession.csrf);beforeLeave();location.reload();}catch(e){status.textContent=e.message;}});panel.append(ownerLogout);
  const partner=node('details','','access-details');partner.append(node('summary','Бесплатный доступ платному партнёру — по соглашению'));
  const pf=node('form','','access-form'),pr=input(pf,'Уникальный номер выдачи курса','text','orderReference'),po=input(pf,'Номер оплаченного партнёрского заказа на Авито','text','partnerOrderReference'),pu=input(pf,'Согласованный логин партнёра','text','partnerUsername');
  const pl=node('label','','inline-field'),pc=document.createElement('input');pc.type='checkbox';pc.required=true;pl.append(pc,document.createTextNode('Оплата партнёрского заказа проверена, бесплатный доступ согласован индивидуально'));
  const pb=node('button','Выдать код партнёру');pb.type='submit';pf.append(pl,pb);partner.append(pf);panel.append(partner);
  pf.addEventListener('submit',async e=>{e.preventDefault();pb.disabled=true;try{showCode(await request('admin/partner-grant',{orderReference:pr.value,partnerOrderReference:po.value,partnerUsername:pu.value,paymentVerified:pc.checked,partnerPaymentVerified:pc.checked},currentSession.csrf));pc.checked=false;await refresh();status.textContent='Код партнёра создан и привязан к указанному логину.';}catch(e){status.textContent=e.message;}finally{pb.disabled=false;}});
  panel.addEventListener('toggle',()=>{if(panel.open)refresh().catch(e=>status.textContent=e.message);});
}

export function sessionMark(){return /^S-[a-f0-9]{12}$/.test(currentSession?.watermark||'')?currentSession.watermark:'';}
export function watchSession(beforeLeave){
 if(!currentSession||currentSession.owner)return ()=>{};
 let busy=false,failures=0,closed=false;
 const verify=async()=>{
  if(closed||busy||document.hidden)return;busy=true;
  try{const s=await request('session');failures=0;if(!s.access)close('Ваш сеанс завершён. Войдите снова в свой аккаунт.');}
  catch{if(++failures>=3)close('Не удаётся проверить личный доступ. Восстановите интернет и войдите снова.');}
  finally{busy=false;}
 };
 function close(message){if(closed)return;closed=true;beforeLeave();document.getElementById('app').replaceChildren();const host=document.getElementById('loading');host.hidden=false;host.replaceChildren(node('h1','Личный доступ'),node('p',message));const b=node('button','Проверить вход');b.type='button';b.addEventListener('click',()=>location.reload());host.append(b);if(window.parent!==window)window.parent.postMessage({syolanaLesson:true,courseAudio:null,ready:true,height:400},location.origin);clearInterval(timer);}
 const timer=setInterval(verify,30000);window.addEventListener('focus',verify);document.addEventListener('visibilitychange',verify);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});
 return ()=>{closed=true;clearInterval(timer);window.removeEventListener('focus',verify);document.removeEventListener('visibilitychange',verify);};
}

