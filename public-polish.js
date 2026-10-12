const COPY_REPLACEMENTS=[
 ['Без обязательной CMS и без передачи паролей от вашего хостинга','Готовый сайт-файл · ваш хостинг · ваш домен'],
 ['Платный языковой доступ действует на указанный период и не является платой за партнёрский сайт.','Подписка на языковые курсы оформляется отдельно от шаблонов сайтов.'],
 ['Автоматической ежемесячной платы за партнёрский сайт Syolana сейчас нет.','Ежемесячной платы за шаблон сайта нет.'],
 ['Без общего кабинета, обязательного хостинга и передачи паролей.','Сначала эскиз — затем готовый файл. Размещаете там, где удобно вам.'],
 ['Публикации без отдельной CMS','Публикации из вашего привычного источника'],
 ['Где правила источника это позволяют, сайт может показывать публичные записи из выбранного вами источника. Вы продолжаете публиковать там, где привыкли; отдельную ленту в Syolana вести не нужно.','Если выбранная платформа это поддерживает, новые публичные записи могут автоматически появляться на сайте. Вы продолжаете вести только свой обычный канал или сообщество.'],
 ['VK, Telegram, YouTube, Instagram, Facebook и другие платформы отличаются по правилам и API, поэтому способ интеграции подбирается под конкретный источник без обхода ограничений.','Для VK, Telegram, YouTube, Instagram, Facebook и других площадок способ подключения подбирается отдельно — только тем способом, который разрешает сама площадка.'],
 ['Syolana не становится постоянным администратором партнёрского сайта после передачи. За собственные публикации, права на материалы, сведения о товарах и услугах и иные данные отвечает владелец сайта в пределах применимого законодательства.','После передачи сайта владелец сам размещает и ведёт его. Тексты, изображения, товары, услуги и публикации остаются под его ответственностью.'],
 ['Подключаемые темы, фирменные шрифты и обновления предоставляются при сохранении официальной интеграции и фирменного блока Syolana. Изменение или удаление интеграции может отключить подключаемое оформление, но не удаляет собственный контент владельца.','Живые темы, фирменные шрифты и обновления работают вместе с официальным блоком Syolana. Если этот блок или подключение изменить, оформление Syolana может отключиться, но материалы владельца останутся на месте.']
];

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
@media(max-width:760px){#banner{margin-bottom:14px!important}#main-nav{margin-bottom:14px!important}#page>*+*{margin-top:16px!important}}
`;
 document.head.append(style);
}
function polishCopy(root=document){
 for(const el of root.querySelectorAll('p,h1,h2,h3,summary,span')){
  const text=(el.textContent||'').trim();
  for(const [from,to] of COPY_REPLACEMENTS){if(text===from){el.textContent=to;break;}}
 }
}
function keepChrome(){
 const banner=document.getElementById('banner');if(banner)banner.hidden=false;
 const nav=document.getElementById('main-nav');if(nav)nav.hidden=false;
}
function apply(){injectStyle();keepChrome();polishCopy();}
let queued=false;const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;apply();});};
apply();
window.addEventListener('hashchange',schedule);
new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden']});
