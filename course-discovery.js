import {registerTranslations, tr} from './i18n.js';

registerTranslations({
  'Испанский A1': ['Spanish A1', 'Español A1', 'Espagnol A1'],
  'Французский A1': ['French A1', 'Francés A1', 'Français A1'],
  'Купить месячную подписку на все курсы': ['Buy a monthly subscription to all courses', 'Comprar la suscripción mensual a todos los cursos', 'Acheter un abonnement mensuel à tous les cours'],
  'Уже попробовали бесплатный A1?': ['Have you tried the free A1 course?', '¿Ya has probado el curso A1 gratuito?', 'Avez-vous essayé le cours A1 gratuit ?'],
  'Сначала попробуйте бесплатный английский A1. Если методика вам подходит, оформите доступ ко всем платным курсам на Авито.': [
    'Try the free English A1 course first. If the method suits you, get access to all paid courses on Avito.',
    'Prueba primero el curso gratuito de inglés A1. Si el método te gusta, accede a todos los cursos de pago a través de Avito.',
    'Essayez d’abord le cours gratuit d’anglais A1. Si la méthode vous convient, abonnez-vous à tous les cours payants sur Avito.'
  ],
  '650 ₽ / 30 дней · без автопродления': ['650 ₽ / 30 days · no automatic renewal', '650 ₽ / 30 días · sin renovación automática', '650 ₽ / 30 jours · sans renouvellement automatique'],
  'Да, перейти на Авито': ['Yes, continue to Avito', 'Sí, continuar en Avito', 'Oui, continuer sur Avito'],
  'Сначала попробовать A1': ['Try A1 first', 'Probar A1 primero', 'Essayer A1 d’abord'],
  'Слушайте и понимайте': ['Listen and understand', 'Escucha y comprende', 'Écoutez et comprenez'],
  'Чтобы понимать стихи и песни в оригинале, изучайте язык с A1. Сначала попробуйте бесплатный английский A1 — проверьте, подходит ли вам методика.': [
    'To understand poems and songs in the original, start learning the language at A1. Try the free English A1 course first to see if the method suits you.',
    'Para entender poemas y canciones en su idioma original, empieza por A1. Prueba primero el curso gratuito de inglés A1 para ver si el método te gusta.',
    'Pour comprendre poèmes et chansons dans leur langue d’origine, commencez au niveau A1. Essayez d’abord l’anglais A1 gratuit pour voir si la méthode vous convient.'
  ],
  'Понимайте песни на английском': ['Understand songs in English', 'Comprende canciones en inglés', 'Comprenez les chansons en anglais'],
  'Понимайте песни на испанском': ['Understand songs in Spanish', 'Comprende canciones en español', 'Comprenez les chansons en espagnol'],
  'Понимайте песни на французском': ['Understand songs in French', 'Comprende canciones en francés', 'Comprenez les chansons en français']
});

const FREE = '#/lesson/en/a1/course';
const AVITO = 'https://www.avito.ru/brands/i223140984';
const LANGUAGES = {
  en:['Английский A1','Понимайте песни на английском'],
  es:['Испанский A1','Понимайте песни на испанском'],
  fr:['Французский A1','Понимайте песни на французском']
};
function node(tag, text, cls = '') { const n = document.createElement(tag); n.textContent = tr(text); n.className = cls; return n; }
function link(text, href, cls = 'text-link') { const n = node('a',text,cls); n.href = href; return n; }
function installStyle() {
  if (document.getElementById('course-discovery-style')) return;
  const style = document.createElement('style'); style.id = 'course-discovery-style';
  style.textContent = `
.language-level .course-buy{line-height:1.45;white-space:normal;text-align:center}
.song-course-link{margin-top:8px;padding-top:14px;border-top:1px solid var(--panel-border);font-size:.85rem;line-height:1.5}
.song-course-actions{display:flex;flex-wrap:wrap;align-items:center;gap:12px 20px}
.song-course-promo{margin-block:24px}
.song-course-promo h2{font-size:clamp(1.6rem,4vw,2.2rem)}
dialog.course-purchase{box-sizing:border-box;width:min(470px,calc(100% - 32px));padding:26px;max-height:calc(100dvh - 32px);color:var(--panel-text);background:var(--panel-bg);border-color:var(--panel-border)}
.course-purchase .dialog-head{align-items:center;margin-bottom:16px;gap:16px}
.course-purchase h2{margin:0;font-family:var(--heading);font-size:clamp(1.5rem,5vw,1.9rem);line-height:1.2}
.course-purchase p{font-size:.9rem;line-height:1.65;margin:0 0 16px}
.course-purchase .course-purchase-price{font-weight:650;font-size:.85rem}
.course-purchase .course-purchase-actions{display:grid;gap:12px}
.course-purchase-actions .btn{width:100%;box-sizing:border-box;line-height:1.4;text-align:center;white-space:normal}
.course-purchase .course-purchase-close{display:grid;place-items:center;flex:0 0 44px;width:44px;height:44px;min-width:44px;min-height:44px;padding:0;border-radius:50%;line-height:0}
.course-purchase-close svg{width:18px;height:18px}
@media(max-width:390px){dialog.course-purchase{padding:21px}}
`;
  document.head.append(style);
}

export function openCoursePurchase(opener) {
  const existing = document.querySelector('dialog.course-purchase');
  if (existing) return;
  installStyle();
  const dialog = node('dialog','','course-purchase');
  const head = node('div','','dialog-head');
  const title = node('h2','Уже попробовали бесплатный A1?'); title.id = 'course-purchase-title';
  const close = node('button','','icon-btn course-purchase-close'); close.type='button'; close.setAttribute('aria-label',tr('Закрыть'));
  close.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';
  head.append(title,close);
  const copy = node('p','Сначала попробуйте бесплатный английский A1. Если методика вам подходит, оформите доступ ко всем платным курсам на Авито.'); copy.id='course-purchase-copy';
  const actions = node('div','','course-purchase-actions');
  const yes = link('Да, перейти на Авито',AVITO,'btn primary'); yes.target='_blank'; yes.rel='noopener noreferrer';
  const free = link('Сначала попробовать A1',FREE,'btn');
  actions.append(yes,free);
  dialog.append(head,copy,node('p','650 ₽ / 30 дней · без автопродления','course-purchase-price'),actions);
  dialog.setAttribute('aria-labelledby',title.id); dialog.setAttribute('aria-describedby',copy.id);
  function cleanup() {dialog.remove();if(opener?.isConnected)opener.focus({preventScroll:true});}
  function dismiss() {if(typeof dialog.close==='function')dialog.close();else cleanup();}
  dialog.addEventListener('close',cleanup,{once:true});
  close.addEventListener('click',dismiss);
  // Let the link's native navigation start before removing the dialog.
  for(const action of [yes,free])action.addEventListener('click',()=>document.defaultView.setTimeout(dismiss,0));
  dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dismiss();});
  dialog.addEventListener('keydown',e=>{
    if(e.key==='Escape'){e.preventDefault();dismiss();}
    if(e.key==='Tab'){
      const targets=[close,yes,free],first=targets[0],last=targets.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  document.body.append(dialog);
  if(typeof dialog.showModal==='function')dialog.showModal();else {dialog.setAttribute('open','');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');}
  free.focus({preventScroll:true});
  return dialog;
}

export function coursePurchaseButton() {
  installStyle();
  const button = node('button','Купить месячную подписку на все курсы','btn primary course-buy');
  button.type='button';button.setAttribute('aria-haspopup','dialog');
  button.addEventListener('click',()=>openCoursePurchase(button));
  return button;
}

export function songLanguage(song, details = []) {
  const language = song.originalLanguage || song.language || details.find(s=>s.id===song.id)?.originalLanguage;
  return LANGUAGES[language] ? language : null;
}

export function songCourseLink(language) {
  if (!LANGUAGES[language]) return null;
  installStyle();
  const box=node('div','','song-course-link');
  box.append(link(LANGUAGES[language][0],'#/lesson/'+language+'/a1/course'));
  return box;
}

export function songCoursePromo(languages) {
  const available = [...new Set(languages)].filter(l=>LANGUAGES[l]);
  if(!available.length)return null;
  installStyle();
  const box=node('section','','card stack song-course-promo');
  const actions=node('div','','song-course-actions');
  for(const lang of available)actions.append(link(LANGUAGES[lang][0],'#/lesson/'+lang+'/a1/course','btn'));
  if(!available.includes('en'))actions.append(link('Попробовать английский A1 бесплатно',FREE));
  box.append(node('h2','Слушайте и понимайте'),node('p','Чтобы понимать стихи и песни в оригинале, изучайте язык с A1. Сначала попробуйте бесплатный английский A1 — проверьте, подходит ли вам методика.'),actions);
  return box;
}
