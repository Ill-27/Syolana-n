const SHORT_SITE='https://syolana.website.yandexcloud.net/';
const API_ORIGIN='https://d5d8t0nr36g6la3o7n9k.4kscn31j.apigw.yandexcloud.net';
const isShortYandex=location.hostname.endsWith('.website.yandexcloud.net');
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
const set=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text;};

function polishNetworkNotice(){
 const note=document.querySelector('.network-note');if(!note)return;
 set(note.querySelector('summary'),'Если мобильный интернет ограничен');
 const p=note.querySelector('p');if(!p||p.dataset.polished)return;p.dataset.polished='true';
 p.replaceChildren(document.createTextNode('Сохраните запасной адрес Syolana: '));
 const a=document.createElement('a');a.href=SHORT_SITE;a.textContent='syolana.website.yandexcloud.net';a.rel='noopener';
 p.append(a,document.createTextNode('. Он открывает ту же Syolana. При ограничениях отдельные серверные функции редактора могут зависеть от правил мобильного оператора.'));
}
function keepGlobalNavigation(){
 const partnerView=document.body.classList.contains('managed-site-view'),nav=document.getElementById('main-nav'),banner=document.getElementById('banner');
 if(nav&&!partnerView){nav.hidden=false;set(nav.querySelector('[data-nav="join"]'),'Сайт');}
 if(banner&&!banner.classList.contains('showcase-hero')&&!partnerView&&!document.body.classList.contains('information-view')){banner.hidden=false;set(banner.querySelector('h1,h2,h3,strong'),'Сделаем вам сайт на Syolana');}
}
function polishLanguageIntro(){
 const box=document.querySelector('.language-intro');if(!box)return;set(box.querySelector('h2'),'Сначала попробуйте методику — бесплатно');
 const copy=['Я составила эту методику прежде всего для себя: мне важно, чтобы правила, слова, произношение и практика шли в одной понятной последовательности, а не были разбросаны по разным источникам.','Каждый уровень собран как цельный курс: короткие объяснения, живые примеры, слух, речь, письмо и повторение. Учиться можно в своём темпе — читать, слушать и возвращаться к нужной теме.','Именно такой порядок помогает мне самой учить языки. Надеюсь, он подойдёт и вам. Перед подпиской обязательно пройдите английский A1 бесплатно и покупайте доступ только если вам действительно нравится эта методика.'];
 [...box.querySelectorAll(':scope > p')].forEach((p,i)=>copy[i]&&set(p,copy[i]));set(box.querySelector('a.btn'),'Попробовать английский A1 бесплатно');
}
function addTryFirstNotes(){
 document.querySelectorAll('.language-level').forEach(card=>{
  const isFree=/бесплат/i.test(card.querySelector('.badge')?.textContent||'')||/бесплат/i.test(card.querySelector('.course-price')?.textContent||''),buy=card.querySelector('a.btn.primary');if(!buy)return;
  let note=card.querySelector('.try-first-note');if(isFree){note?.remove();return;}
  if(!note){note=document.createElement('p');note.className='fine try-first-note';card.insertBefore(note,buy);}set(note,'Перед подпиской попробуйте английский A1 бесплатно — так вы заранее поймёте, подходит ли вам методика.');
 });
}
function polishPartnerCopy(){
 const block=document.querySelector('.partner-practical');if(!block)return;set(block.querySelector('h1,h2,h3'),'Сделаем вам сайт на Syolana');const ps=[...block.querySelectorAll(':scope > p')];
 set(ps[0],'Syolana предоставляет темы, шаблоны и редактор. Выберите основу, добавьте свои материалы и посмотрите результат. Домен, хостинг и размещение — по вашему выбору.');
 if(ps[1]&&!ps[1].dataset.shortAddress){ps[1].dataset.shortAddress='1';ps[1].replaceChildren(document.createTextNode('Syolana предоставляет темы, шаблоны и редактор. Домен, хостинг и размещение выбираете вы. Запасной адрес Syolana: '));const a=document.createElement('a');a.href=SHORT_SITE;a.textContent='syolana.website.yandexcloud.net';a.rel='noopener';ps[1].append(a,document.createTextNode('.'));}
 set(ps[2],'Сайт и языки — два направления Syolana. В конструкторе вы создаёте своё пространство, а языки изучаете по моей авторской методике. Английский A1 открыт бесплатно, чтобы сначала спокойно понять, подходит ли вам формат.');
}
function removeTrialPromise(){
 document.querySelectorAll('h1,h2,h3,p,li,small,span').forEach(el=>{
  if(el.children.length)return;const t=norm(el.textContent),trial=/тест|знаком|предоплат/i.test(t);
  if((/7\s*(дн|дней|дня)|семь\s+дн/i.test(t))&&trial){
   if(el.matches('h1,h2,h3'))set(el,'Посмотрите редактор до заказа');
   else set(el,'Посмотрите демо и редактор бесплатно. Если формат вам подходит — закажите публикацию сайта через официальный профиль Syolana на Авито.');
  }
  if(/^Условия тест-драйва$/i.test(t))set(el,'Как заказать сайт');
  if(/^После теста$/i.test(t))set(el,'После знакомства с редактором');
 });
 document.querySelectorAll('a').forEach(a=>{if(/тест[- ]?драйв/i.test(a.textContent))set(a,'Условия доступа');});
}
function nextParagraph(h){let n=h?.nextElementSibling;while(n&&!n.matches('p,h1,h2,h3'))n=n.nextElementSibling;return n?.matches('p')?n:null;}
function polishLegalCopy(){
 document.querySelectorAll('h1,h2,h3').forEach(h=>{
  const title=norm(h.textContent),p=nextParagraph(h);
  if(/^Прежние покупки$/i.test(title)){p?.remove();h.remove();return;}
  if(/^До открытия продаж$/i.test(title)||/^Сведения о продавце$/i.test(title)){set(h,'Заказ и оплата');set(p,'На сайте Syolana оплата не принимается. Заказ, стоимость, срок доступа и согласование оплаты проходят через официальный профиль Syolana на Авито до оплаты.');return;}
  if(/^Правила обработки$/i.test(title)){set(h,'Как используются данные');set(p,'Для работы ключей доступа, поддержки и выполнения заказа используются только необходимые технические данные. Оплата и переписка проходят через официальный профиль Syolana на Авито. Подробности — на странице «Как используются данные».');return;}
  if(/^Контакты$/i.test(title)&&p&&/149-ФЗ|нарушени[яе] прав|стать/i.test(p.textContent))set(p,'Заказы и поддержка — через официальный профиль Syolana на Авито. По вопросам материалов и прав можно написать на syolana@yandex.ru.');
  if(/^Сессия и защита доступа$/i.test(title)&&p&&/Прежние аккаунты/i.test(p.textContent))set(p,'После входа по ключу браузер получает защищённую сессию. Вход на другом устройстве завершает предыдущую активную сессию. Для защиты от перебора сервер кратковременно хранит технические записи ограничения попыток.');
 });
 document.querySelectorAll('p').forEach(p=>{if(/Роскомнадзор|уведомлени[яе].+Роском/i.test(p.textContent))set(p,'Для работы ключей доступа, поддержки и выполнения заказа используются только необходимые технические данные. Подробные правила собраны на этой странице; оплата и переписка проходят через официальный профиль Syolana на Авито.');});
}
function polishCreator(){
 const hero=document.querySelector('.managed-creator-hero');if(hero){set(hero.querySelector('h1'),'Сделаем вам сайт на Syolana');set(hero.querySelector('.muted,p:last-child'),'Выберите тему и шаблон, добавьте свои материалы. Домен, хостинг и размещение — по вашему выбору.');}
 document.querySelectorAll('.managed-status,#page .notice,#page .error').forEach(el=>{if(!/failed to fetch|load failed|networkerror|не смогла связаться с сервером/i.test(el.textContent))return;set(el,'Сервер редактора сейчас недоступен через эту сеть. Сам сайт продолжает открываться; для сохранения и публикации подключитесь к обычному интернету или Wi‑Fi и повторите действие.');const parent=el.parentElement;if(parent&&!parent.querySelector('.offline-demo-link')){const a=document.createElement('a');a.className='btn offline-demo-link';a.href='partner-demo/studio/';a.textContent='Посмотреть редактор без входа';parent.append(a);}});
}
async function enhanceCreatorThemeSelect(){
 const select=document.querySelector('.managed-creator-hero ~ .managed-workspace select[name="theme"],.managed-workspace select[name="theme"]');if(!select||select.dataset.visualized)return;select.dataset.visualized='true';select.hidden=true;
 let themes=[];try{const r=await fetch('themes/manifest.json',{cache:'no-store'});if(r.ok)themes=await r.json();}catch{}if(!Array.isArray(themes)||!themes.length){select.hidden=false;return;}
 const grid=document.createElement('div');grid.className='managed-theme-choices theme-list-like';grid.setAttribute('aria-label','Выберите тему сайта');
 for(const theme of themes){const label=document.createElement('label');label.className='managed-theme-choice';const radio=document.createElement('input');radio.type='radio';radio.name='visual-theme';radio.value=theme.id;radio.checked=select.value===theme.id;const swatch=document.createElement('canvas');swatch.width=640;swatch.height=360;swatch.dataset.preview=theme.id;swatch.className='managed-theme-swatch';swatch.style.background=theme.preview||'';const copy=document.createElement('span');copy.className='managed-theme-copy';const strong=document.createElement('strong');strong.textContent=theme.name;const small=document.createElement('small');small.textContent=theme.description||'';copy.append(strong,small);label.append(radio,swatch,copy);radio.onchange=()=>{if(!radio.checked)return;select.value=theme.id;select.dispatchEvent(new Event('change',{bubbles:true}));previewLiveTheme(theme.id);};grid.append(label);}select.parentElement?.append(grid);
}
function previewLiveTheme(id){const option=document.querySelector(`.theme-option[data-theme="${CSS.escape(id)}"]`);if(option instanceof HTMLElement){option.click();return;}window.dispatchEvent(new CustomEvent('syolana:builder-theme',{detail:{theme:id}}));}
function wireBuilderThemePreview(){document.querySelectorAll('.builder-theme-choice input[type="radio"]').forEach(input=>{if(input.dataset.previewWired)return;input.dataset.previewWired='true';input.addEventListener('change',()=>{if(input.checked&&input.value)previewLiveTheme(input.value);});});}
function rewritePrivateMedia(){if(!isShortYandex)return;document.querySelectorAll('img[src^="/api/course-access/"],video[src^="/api/course-access/"]').forEach(media=>{const src=media.getAttribute('src'),next=src?API_ORIGIN+src:src;if(next&&next!==src)media.setAttribute('src',next);});}
function cleanLegacyAccess(){document.querySelectorAll('#loading.access-screen>.access-details,#loading.access-screen>.owner-preview,.managed-owner-login').forEach(el=>el.remove());}
function wireSameRouteTop(){if(document.documentElement.dataset.sameRouteTop)return;document.documentElement.dataset.sameRouteTop='1';document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a)return;let u;try{u=new URL(a.href,location.href);}catch{return;}if(u.origin!==location.origin||u.pathname!==location.pathname||u.search!==location.search||u.hash!==location.hash)return;event.preventDefault();window.scrollTo({top:0,behavior:'smooth'});document.getElementById('page')?.focus({preventScroll:true});});}
function run(){keepGlobalNavigation();polishNetworkNotice();polishLanguageIntro();addTryFirstNotes();polishPartnerCopy();removeTrialPromise();polishLegalCopy();polishCreator();enhanceCreatorThemeSelect();wireBuilderThemePreview();rewritePrivateMedia();cleanLegacyAccess();wireSameRouteTop();}
export {run as polishView};
