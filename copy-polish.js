const exact=new Map([
 ['Сайты на общем шаблоне с живыми темами и языковые курсы по подписке. Новое в Syolana — здесь.','Дизайнерские шаблоны с живыми темами и авторские языковые курсы. Новое в Syolana — здесь.'],
 ['Выберите готовую основу сайта и наполните её своими материалами. Syolana предоставляет темы, шаблон и редактор; домен, хостинг и размещение выбираете вы.','Соберите эскиз сами или начните с готовой структуры. Syolana оформляет проект как дизайнерский шаблон; хостинг и домен выбираете вы.'],
 ['Сначала посмотрите демо-сайт и редактор. Состав, стоимость и размещение вашего проекта согласуются до оплаты.','Сначала соберите эскиз или посмотрите формат. Состав индивидуальной доработки и стоимость согласуются заранее.'],
 ['САЙТЫ · ДИЗАЙН · ЯЗЫКИ','ШАБЛОНЫ · ДИЗАЙН · ЯЗЫКИ'],
 ['Посмотреть сайты и редактор','Посмотреть шаблоны'],
 ['Понятный редактор','Локальный эскиз без регистрации']
]);
function injectLayoutFixes(){if(document.getElementById('syolana-final-layout-fixes'))return;const s=document.createElement('style');s.id='syolana-final-layout-fixes';s.textContent=`
#main-nav{gap:8px!important;row-gap:8px!important;padding:0 0 2px!important;margin-bottom:14px!important}
#main-nav a{min-height:46px!important;padding-inline:15px!important;margin-inline:0!important}
#page>.row:has(a[href="#/create-site"]):has(a[href*="avito.ru"]){column-gap:16px!important;row-gap:14px!important}
#page>a.btn[href="#/create-site"]+a.btn[href*="avito.ru"]{margin-left:16px!important}
@media(max-width:760px){#main-nav{gap:7px!important;row-gap:8px!important;margin-bottom:14px!important}#main-nav a{min-height:46px!important;padding-inline:14px!important}#main-nav a[href="#/create-site"]{padding-inline:18px!important;margin-inline:0!important}#page>.row:has(a[href="#/create-site"]):has(a[href*="avito.ru"]){column-gap:16px!important;row-gap:14px!important}#page>a.btn[href="#/create-site"]+a.btn[href*="avito.ru"]{margin-left:14px!important}}
`;document.head.append(s);}
function polish(root=document){for(const n of root.querySelectorAll?.('p,h1,h2,h3,span,a,button')||[]){const t=(n.textContent||'').trim();if(exact.has(t)&&n.childElementCount===0)n.textContent=exact.get(t);}}
let queued=false;function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;polish();});}
injectLayoutFixes();polish();new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
