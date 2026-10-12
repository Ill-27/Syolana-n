const COPY_REPLACEMENTS=[
 ['Без обязательной CMS и без передачи паролей от вашего хостинга','Готовый сайт-файл · ваш хостинг · ваш домен'],
 ['Платный языковой доступ действует на указанный период и не является платой за партнёрский сайт.','Подписка на языковые курсы оформляется отдельно от шаблонов сайтов.'],
 ['Автоматической ежемесячной платы за партнёрский сайт Syolana сейчас нет.','Ежемесячной платы за шаблон сайта нет.'],
 ['Если индивидуальная подготовка шаблона платная, цена и состав согласуются до оплаты через официальный канал заказа.','Если нужна индивидуальная доработка, цену и состав согласуем заранее.'],
 ['Без общего кабинета, обязательного хостинга и передачи паролей.','Сначала эскиз — затем готовый файл. Размещаете там, где удобно вам.'],
 ['Публикации без отдельной CMS','Автоматические публикации из вашего источника'],
 ['Где правила источника это позволяют, сайт может показывать публичные записи из выбранного вами источника. Вы продолжаете публиковать там, где привыкли; отдельную ленту в Syolana вести не нужно.','Если вам нужны обновления публикаций на сайте, их можно автоматически получать из вашего открытого канала или группы — если источник поддерживает такое подключение. Вы продолжаете публиковать только там, где привыкли.'],
 ['VK, Telegram, YouTube, Instagram, Facebook и другие платформы отличаются по правилам и API, поэтому способ интеграции подбирается под конкретный источник без обхода ограничений.','Способ автоматического подключения зависит от возможностей выбранного открытого источника. Syolana использует только доступный для него способ подключения.'],
 ['Для VK, Telegram, YouTube, Instagram, Facebook и других площадок способ подключения подбирается отдельно — только тем способом, который разрешает сама площадка.','Способ автоматического подключения зависит от возможностей выбранного открытого источника.'],
 ['Syolana проектирует и оформляет шаблон под материалы владельца и передаёт готовый файл. После передачи владелец самостоятельно выбирает хостинг и домен, хранит доступы и управляет содержанием.','Syolana превращает ваши материалы в готовый дизайнерский шаблон. После утверждения вы получаете HTML-файл и размещаете его там, где удобно вам.'],
 ['Syolana не становится постоянным администратором партнёрского сайта после передачи. За собственные публикации, права на материалы, сведения о товарах и услугах и иные данные отвечает владелец сайта в пределах применимого законодательства.','После передачи сайта владелец сам размещает и ведёт его. Тексты, изображения, товары, услуги и публикации остаются под его ответственностью.'],
 ['Подключаемые темы, фирменные шрифты и обновления предоставляются при сохранении официальной интеграции и фирменного блока Syolana. Изменение или удаление интеграции может отключить подключаемое оформление, но не удаляет собственный контент владельца.','Живые темы, фирменные шрифты и обновления работают вместе с официальным блоком Syolana. Если этот блок или подключение изменить, оформление Syolana может отключиться, но материалы владельца останутся на месте.'],
 ['Для платных курсов используется ключ доступа и техническая привязка к одному активному устройству. Учебный прогресс может храниться локально в браузере; сервис доступа хранит только данные, необходимые для проверки действующего доступа, устройства и защиты от злоупотреблений.','Для платных курсов нужен ключ доступа. Один ключ работает на одном активном устройстве. Прогресс хранится в браузере; сервер хранит только технические данные, необходимые для проверки доступа и защиты от злоупотреблений.'],
 ['Перед подпиской попробуйте английский A1 бесплатно — так вы заранее поймёте, подходит ли вам методика.','Сначала пройдите английский A1 бесплатно. Не оформляйте подписку, пока не убедитесь, что вам подходит этот формат: методика и структура едины для всех языков Syolana.'],
 ['Технические журналы','Служебные данные']
];

const TRIAL_TEXT='Не оформляйте подписку, пока не пройдёте бесплатный английский A1 и не убедитесь, что вам подходит этот формат. Методика, структура уроков и принцип практики едины для всех языков Syolana.';
const SOURCE_TEXT='Если вам нужны обновления публикаций на сайте, их можно автоматически получать из вашего открытого канала или группы — если источник поддерживает такое подключение. Вы продолжаете публиковать только там, где привыкли.';
const BRAND_RULE='По условиям использования фирменного оформления нельзя удалять или изменять баннер Syolana, водяные знаки syolana.com, подключение живых тем и фирменные шрифты — вручную или с помощью ИИ. Если фирменный слой изменить, живые темы, фирменные шрифты и визуальные обновления Syolana отключатся. Ваши собственные материалы останутся на месте.';

function injectStyle(){
 if(document.getElementById('syolana-public-polish'))return;
 const style=document.createElement('style');style.id='syolana-public-polish';style.textContent=`
#banner{margin-bottom:18px!important}
#main-nav{display:flex!important;visibility:visible!important;margin:0 0 18px!important;gap:8px;overflow-x:auto;scrollbar-width:none;padding-bottom:2px}
#main-nav[hidden]{display:flex!important}
#main-nav a{white-space:nowrap;flex:0 0 auto}
#page>*+*{margin-top:clamp(16px,2.6vw,24px)!important}
#page>.grid+*,#page>.hero+*,#page>.card+*,#page>.row+*{margin-top:clamp(16px,2.6vw,24px)!important}
#page>.row{gap:10px;flex-wrap:wrap}
.card.stack{overflow:visible}
/* Light atmospheric softness on ordinary pages. The watermark/particle canvas stays sharp. */
body:not(.zen) .theme-world-canvas{filter:blur(1.45px) saturate(.96) brightness(.96)!important;transform:translateZ(0) scale(1.014)!important;transform-origin:center!important}
body:not(.zen) .aurora-background{filter:blur(1.2px) saturate(.97)!important;transform:scale(1.006)!important}
body:not(.zen) #starCanvas{filter:none!important;transform:translateZ(0)!important;opacity:1!important}
/* Reading and language-course routes keep a stronger quiet background. */
body:not(.zen):is(.reading,.course-reading) .theme-world-canvas{filter:blur(5.8px) saturate(.90) brightness(.82)!important;transform:translateZ(0) scale(1.035)!important}
body:not(.zen):is(.reading,.course-reading) .aurora-background{filter:blur(5px) saturate(.90) brightness(.84)!important;transform:scale(1.025)!important}
body.zen .theme-world-canvas,body.zen .aurora-background,body.zen #starCanvas{filter:none!important;transform:translateZ(0)!important;opacity:1!important}
.method-trial-notice,.syolana-brand-rule{border-color:rgba(224,199,255,.32)!important;background:linear-gradient(135deg,rgba(139,104,190,.14),rgba(255,255,255,.025)),rgba(var(--surface),.64)!important}
.method-trial-notice h2,.syolana-brand-rule h2{font-size:clamp(1.65rem,4vw,2.45rem)}
.method-trial-notice .eyebrow,.syolana-brand-rule .eyebrow{margin-bottom:8px}
@media(max-width:760px){#banner{margin-bottom:14px!important}#main-nav{margin-bottom:14px!important}#page>*+*{margin-top:16px!important}}
`;
 document.head.append(style);
}

function routeName(){return (location.hash||'#/').replace(/^#\/?/,'').split('/')[0]||'home';}
function polishCopy(root=document){
 for(const el of root.querySelectorAll('p,h1,h2,h3,summary')){
  if(el.children.length)continue;
  let text=el.textContent||'';let changed=false;
  for(const [from,to] of COPY_REPLACEMENTS){if(text.includes(from)){text=text.replace(from,to);changed=true;}}
  if(changed)el.textContent=text;
 }
}
function keepChrome(){
 const banner=document.getElementById('banner');if(banner)banner.hidden=false;
 const nav=document.getElementById('main-nav');if(nav)nav.hidden=false;
}
function stabilizeBanner(){
 const banner=document.getElementById('banner');if(!banner)return;
 const title=banner.querySelector('.banner-copy h2');if(title&&title.textContent!=='Живой дизайн для вашего сайта')title.textContent='Живой дизайн для вашего сайта';
 const description=banner.querySelector('.banner-description');if(description)description.textContent='Соберите эскиз сами или расскажите о проекте. Syolana превращает ваши материалы в дизайнерский шаблон с живыми темами и передаёт готовый HTML-файл.';
 const invitation=banner.querySelector('.banner-invitation');if(invitation)invitation.textContent='Ваш эскиз → дизайнерская доработка → готовый сайт-файл';
}
function ensureTrialNotice(){
 const route=routeName();if(route!=='languages')return;
 const page=document.getElementById('page');if(!page||page.querySelector('.method-trial-notice'))return;
 const card=document.createElement('section');card.className='card stack method-trial-notice';
 card.innerHTML='<p class="eyebrow">ПЕРЕД ПОДПИСКОЙ</p><h2>Сначала попробуйте методику бесплатно</h2><p></p><div class="row"><a class="btn primary" href="#/lesson/en/a1/course">Открыть английский A1</a></div>';
 card.querySelector('p:not(.eyebrow)').textContent=TRIAL_TEXT;
 const hero=page.querySelector(':scope > .hero');if(hero?.nextSibling)page.insertBefore(card,hero.nextSibling);else page.prepend(card);
}
function ensureBrandRule(){
 const route=routeName();if(!['join','create-site','terms'].includes(route))return;
 const page=document.getElementById('page');if(!page||page.querySelector('.syolana-brand-rule'))return;
 const card=document.createElement('section');card.className='card stack syolana-brand-rule';
 card.innerHTML='<p class="eyebrow">ВАЖНО ДЛЯ ЖИВОГО ОФОРМЛЕНИЯ</p><h2>Фирменный слой Syolana сохраняется целиком</h2><p></p>';
 card.querySelector('p:not(.eyebrow)').textContent=BRAND_RULE;
 const hero=page.querySelector(':scope > .hero');if(hero?.nextSibling)page.insertBefore(card,hero.nextSibling);else page.prepend(card);
}
function genericizeSketchSource(){
 const root=document.querySelector('.sketch-builder');if(!root)return;
 for(const span of root.querySelectorAll('.sketch-field>span'))if((span.textContent||'').includes('Источник публикаций'))span.textContent='Автоматические публикации';
 const select=root.querySelector('select[data-key="sourceType"]');
 if(select&&!select.dataset.genericSource){
  const existing=select.value;select.replaceChildren();
  const none=document.createElement('option');none.value='none';none.textContent='Без автоматических публикаций';
  const source=document.createElement('option');source.value='other';source.textContent='Из открытого канала или группы';
  select.append(none,source);select.value=existing==='none'?'none':'other';select.dataset.genericSource='1';select.dispatchEvent(new Event('input',{bubbles:true}));
 }
 for(const p of root.querySelectorAll('.sketch-note')){
  const t=p.textContent||'';
  if(/VK|Telegram|YouTube|Instagram|Facebook|платформ/i.test(t))p.textContent=SOURCE_TEXT;
 }
}
function retireWorkshop(){
 for(const a of document.querySelectorAll('a,button')){
  const text=(a.textContent||'').trim();if(!/мастерск|studio/i.test(text))continue;
  if(a.tagName==='A')a.setAttribute('href','#/create-site');a.textContent='Собрать эскиз';
 }
 const route=routeName();if(['studio','site-editor','editor','admin'].includes(route))location.hash='#/create-site';
}
function syncReading(){document.body.classList.toggle('course-reading',/^#\/lesson\//.test(location.hash));}
function apply(){injectStyle();keepChrome();syncReading();polishCopy();stabilizeBanner();genericizeSketchSource();retireWorkshop();ensureTrialNotice();ensureBrandRule();}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
apply();
window.addEventListener('hashchange',schedule);
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
