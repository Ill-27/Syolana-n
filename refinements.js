const SHORT_SITE='https://syolana.website.yandexcloud.net/';
const replacements=new Map([
 ['ТЕМЫ И ШАБЛОНЫ · 7 ДНЕЙ БЕСПЛАТНО','ТЕМЫ И ШАБЛОНЫ · СНАЧАЛА ПОСМОТРИТЕ РЕДАКТОР'],
 ['Попробуйте спокойно','Сначала посмотрите, потом решайте'],
 ['Сначала подготовим тестовую версию и дадим 7 дней знакомства без предоплаты и банковской карты. Цена настройки и дальнейшего обслуживания зависит от объёма проекта; вы узнаете её до оплаты.','Откройте демо-сайт и редактор: так заранее видно темы, блоки и принцип работы. Если формат подходит, обсудим ваш сайт на Авито и до оплаты согласуем состав, стоимость и размещение.'],
 ['Партнёрам мы сначала показываем готовый результат и даём 7 дней тест-драйва — без предоплаты за знакомство.','Сначала посмотрите демо-сайт и редактор. Если формат подходит, обсудим ваш проект на Авито и заранее согласуем состав, стоимость и размещение.'],
 ['Условия тест-драйва','Как заказать сайт'],
 ['Сначала знакомство','Сначала посмотрите демо'],
 ['Тест-драйв сайта — 7 дней после предоставления готовой тестовой версии. Предоплата и банковская карта не нужны. После знакомства вы решаете, продолжать ли обслуживание; стоимость согласуется заранее.','Демо-сайт и редактор доступны для знакомства до заказа. Они показывают, как устроены темы, блоки и публикации. Если формат подходит, состав вашего проекта, стоимость и размещение согласуются на Авито до оплаты.'],
 ['После теста','После заказа'],
 ['План — готовить примерно один новый уровень в месяц.','План — готовить примерно один новый уровень раз в несколько месяцев.'],
 ['Cookie сессии работает до 7 дней, имеет защитные атрибуты HttpOnly, Secure и SameSite. Вход на другом устройстве завершает прежнюю сессию. Для ограничения попыток сервер кратковременно хранит хеш технических данных запроса; записи ограничения удаляются примерно через 30 минут. Прежние аккаунты сохраняются для ранее выданного доступа.','После входа по ключу браузер получает защищённую сессию. Вход на другом устройстве завершает предыдущую активную сессию. Для защиты от перебора сервер кратковременно хранит технические записи ограничения попыток.'],
 ['Правила обработки','Как используются данные'],
 ['Вход по ключу уменьшает объём собираемых данных, но не отменяет требований к обработке данных заказа, переписки и технических записей. До платного запуска необходимо указать фактического оператора, цели, сроки хранения и применимые основания обработки, а также проверить обязанность уведомления Роскомнадзора. Продажи до завершения этих действий закрыты.','Для работы ключей доступа, поддержки и выполнения заказа используются только необходимые технические данные. Оплата и переписка проходят через официальный профиль Syolana на Авито. Подробности собраны на этой странице.'],
 ['До открытия продаж','Заказ и оплата'],
 ['Необходимо опубликовать реальные сведения о владельце и продавце, окончательную оферту и правила обработки данных. Сейчас приём оплаты закрыт. Цена, срок и состав конкретного заказа должны быть известны до оплаты. Обязательные права потребителя сохраняются; чек выдаётся в применимом к продавцу порядке.','На сайте Syolana оплата не принимается. Заказ, стоимость, срок доступа и согласование оплаты проходят через официальный профиль Syolana на Авито до оплаты.'],
 ['Сведения о продавце','Заказ и оплата'],
 ['Платные продажи пока закрыты. До их открытия должны быть опубликованы реальные сведения о продавце, полные условия покупки, порядок возврата и сведения об обработке данных. Syolana — название проекта, а не юридические реквизиты.','На сайте Syolana оплата не принимается. Заказ, стоимость, срок доступа и согласование оплаты проходят через официальный профиль Syolana на Авито до оплаты.'],
 ['Тестовый сайт Ланы','Тестовый сайт']
]);

const style=document.createElement('style');
style.textContent=`
  .managed-editor-view #starCanvas{opacity:.88!important;filter:blur(1.4px) saturate(.9) brightness(.88);transform:scale(1.012);transform-origin:center}
  .managed-editor-view .managed-editor-head,.managed-editor-view .managed-share,.managed-editor-view .managed-builder,.managed-editor-view .managed-publisher,.managed-editor-view .card{background:rgba(var(--surface),.50)!important;backdrop-filter:blur(13px) saturate(112%)!important;-webkit-backdrop-filter:blur(13px) saturate(112%)!important;border-color:rgba(226,211,255,.22)!important}
  .managed-editor-view .builder-block,.managed-editor-view .builder-preview{background:rgba(var(--surface),.43)!important;backdrop-filter:blur(10px)!important;-webkit-backdrop-filter:blur(10px)!important}
  .managed-site-view .managed-attribution-top{margin-top:20px!important;margin-bottom:34px!important}
  .managed-site-view .managed-attribution-bottom{margin-top:40px!important;margin-bottom:calc(118px + env(safe-area-inset-bottom,0px))!important}
  .managed-site-view #page{padding-bottom:22px}
  .builder-theme-copy,.managed-theme-copy{min-width:0!important;overflow:visible!important}
  .builder-theme-copy strong,.managed-theme-copy strong,.builder-theme-copy small,.managed-theme-copy small{white-space:normal!important;overflow-wrap:anywhere!important;word-break:normal!important}
  @media(max-width:780px){
    .builder-theme-choice,.managed-theme-choice{grid-template-columns:1fr!important;grid-template-rows:minmax(150px,50vw) auto!important;min-height:0!important}
    .builder-theme-swatch,.managed-theme-swatch{width:100%!important;height:100%!important;min-height:150px!important}
    .builder-theme-copy,.managed-theme-copy{padding:16px 18px 20px!important}
    .builder-theme-copy strong,.managed-theme-copy strong{font-size:1.5rem!important;line-height:1.23!important}
    .builder-theme-copy small,.managed-theme-copy small{font-size:.82rem!important;line-height:1.5!important}
  }
`;
document.head.append(style);

function replaceText(root=document){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);for(let node=walker.nextNode();node;node=walker.nextNode()){const raw=node.nodeValue;if(!raw||!raw.trim())continue;const exact=replacements.get(raw.trim());if(exact===undefined)continue;const left=raw.match(/^\s*/)?.[0]||'',right=raw.match(/\s*$/)?.[0]||'';node.nodeValue=left+exact+right;}}
function removeLegacyPurchases(){document.querySelectorAll('.legal-page h3').forEach(h=>{if(h.textContent.trim()!=='Прежние покупки')return;const next=h.nextElementSibling;h.remove();if(next?.tagName==='P')next.remove();});}
function keepGlobalChrome(){const banner=document.getElementById('banner'),nav=document.getElementById('main-nav');if(banner&&!document.body.classList.contains('information-view'))banner.hidden=false;if(nav){nav.hidden=false;const site=nav.querySelector('[data-nav="join"]');if(site)site.textContent='Сайт';}}
function polishFooter(){document.querySelectorAll('a[href="#/terms"]').forEach(a=>{a.textContent='Как заказать сайт';});const note=document.querySelector('.network-note p');if(note&&note.dataset.shortAddress!=='1'){note.dataset.shortAddress='1';note.replaceChildren(document.createTextNode('Сохраните запасной адрес Syolana: '));const a=document.createElement('a');a.href=SHORT_SITE;a.textContent='syolana.website.yandexcloud.net';a.rel='noopener';note.append(a,document.createTextNode('. На нём открываются те же публичные страницы и курсы. При мобильных белых списках доступ к отдельным серверным функциям может зависеть от оператора.'));}}
function fixCourseCardSpacing(){document.querySelectorAll('.language-level').forEach(card=>{const button=card.querySelector(':scope > a.btn,:scope > button.btn');if(button)button.style.marginTop='20px';const note=card.querySelector('.try-first-note');if(note)note.style.marginBottom='4px';});}
function wireOfferTop(){if(document.documentElement.dataset.offerTopWired)return;document.documentElement.dataset.offerTopWired='1';document.addEventListener('click',event=>{const a=event.target.closest?.('a[href="#/offer"]');if(!a||location.hash!=='#/offer')return;event.preventDefault();window.scrollTo({top:0,behavior:'smooth'});});}
function wireThemePreview(){document.querySelectorAll('.builder-theme-choice input[type="radio"],.managed-theme-choice input[type="radio"]').forEach(input=>{if(input.dataset.liveThemeWired)return;input.dataset.liveThemeWired='1';input.addEventListener('change',()=>{if(!input.checked||!input.value)return;const option=document.querySelector(`.theme-option[data-theme="${CSS.escape(input.value)}"]`);if(option)option.click();});});}
function wireThemeDialogClose(){if(document.documentElement.dataset.themeDialogCloseWired)return;document.documentElement.dataset.themeDialogCloseWired='1';document.addEventListener('click',event=>{const option=event.target.closest?.('#theme-list .theme-option');if(!option)return;const dialog=option.closest('dialog');if(dialog?.open)setTimeout(()=>dialog.close(),60);});}
function normalizeDemoName(){document.querySelectorAll('input,textarea').forEach(input=>{if(input.value==='Тестовый сайт Ланы'){input.value='Тестовый сайт';input.dispatchEvent(new Event('input',{bubbles:true}));}});}
function polish(){keepGlobalChrome();replaceText();removeLegacyPurchases();polishFooter();fixCourseCardSpacing();wireOfferTop();wireThemePreview();wireThemeDialogClose();normalizeDemoName();}
export {polish as refineView};
