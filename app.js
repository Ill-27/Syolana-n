import {PRIVACY_SUMMARY,PRIVACY_URL} from './privacy-notice.js';
import {PARTNER_CALENDAR_TERMS} from './partner-periods.mjs';
import initialConfig from './config.json' with {type:'json'};
import initialFeed from './feed.json' with {type:'json'};
import songDetails from './song-details.json' with {type:'json'};
import {getLocale,tr,registerTranslations} from './i18n.js';
import {coursePurchaseButton,songLanguage,songCourseLink,songCoursePromo} from './course-discovery.js';
import {finishUI} from './render-ui.js';
import {positionView,clearPositionView} from './positioning.js';
import {loadPublicJSON} from "./public-data.js?v=20261011-poems-2";
import { lessonFiles } from "./catalog.js?v=20261012-fr-a2-1";
import { mountCourseBranding } from "./course-branding.js?v=20261007-language-marks-3";
import {
  $,
  el,
  link,
  button,
  notify,
  safeURL,
  getPref,
  setPref,
  moods,
  moodColors,
  moodFor,
  formatDate,
} from "./utils.js";
import { ThemeEngine } from "./themes.js?v=20261012-zen-polish-1";
import { Player } from "./player.js?v=20261012-zen-polish-1";
import { API } from "./api.js";
import { lessons } from "./content.js";

import { renderFeed, feedEditor } from "./feed.js";
import {mountShowcaseBanner} from './video-showcase.js';
import { setupDiscovery } from "./discovery.js?v=20261009-platform-1";

registerTranslations({'Ключи и подписки':['Keys and subscriptions','Claves y suscripciones','Clés et abonnements']});

document.querySelector(".skip-link").onclick = (e) => {
  e.preventDefault();
  $("page").focus();
  $("page").scrollIntoView();
};
const api = new API();
let apiReady;
const ensureAPI=()=>apiReady??=(api.init());
const config=initialConfig;
const player = new Player(config.songs || []);
const theme = new ThemeEngine();
theme
  .init()
  .catch(() => notify("Фон временно недоступен. Содержимое сайта доступно."));
let studio;
async function getStudio(){if(!studio){const {Studio}=await import("./studio.js");studio=new Studio(api,route);}return studio;}
window.addEventListener('syolana:builder-theme',event=>{if(event.detail?.theme)theme.select(event.detail.theme).catch(()=>{});});
const sceneAudio = { stop() {} };
function businessContact(subject, kind = "website") {
  const raw = String(config.contactChannels?.[kind]?.url || "").trim();
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" && !u.username && !u.password &&
        (u.hostname === "avito.ru" || u.hostname.endsWith(".avito.ru"))) return u.href;
  } catch {}
  return "https://www.avito.ru/brands/i223140984";
}

setupDiscovery({ theme, zen, player, contactURL: businessContact() });
let cleanup = () => {};
let routeToken = 0;
let siteTimer = 0;
let accessTimer = 0;
document.addEventListener(
  "play",
  (e) => {
    if (
      e.target !== $("audio") &&
      e.target instanceof HTMLMediaElement &&
      !e.target.muted
    )
      player.pause();
  },
  true,
);
document
  .querySelectorAll("dialog [data-close]")
  .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
function zen(active) {
  document.body.classList.toggle("zen", active);
  $("zen-toggle").setAttribute("aria-pressed", String(active));
  $("zen-toggle").setAttribute(
    "aria-label",
    active ? "Вернуть интерфейс" : "Режим созерцания",
  );
  $("zen-toggle").title = active ? "Вернуть интерфейс" : "Скрыть интерфейс";
  $("content-shell").inert = active;
  theme.setZen?.(active);
  document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  if (active) $("zen-toggle").focus();
}
$("zen-toggle").onclick = () => zen(!document.body.classList.contains("zen"));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && document.body.classList.contains("zen") && !document.querySelector("dialog[open]")) zen(false);
});
const fullscreen = $("fullscreen");
function fullUpdate() {
  const active = Boolean(
    document.fullscreenElement || document.webkitFullscreenElement,
  );
  fullscreen.setAttribute("aria-pressed", String(active));
  fullscreen.setAttribute(
    "aria-label",
    active ? "Выйти из полноэкранного режима" : "На весь экран",
  );
  fullscreen.title = fullscreen.getAttribute("aria-label");
}
fullscreen.onclick = async () => {
  try {
    if (document.fullscreenElement || document.webkitFullscreenElement)
      await (document.exitFullscreen || document.webkitExitFullscreen).call(
        document,
      );
    else {
      const fn =
        document.documentElement.requestFullscreen ||
        document.documentElement.webkitRequestFullscreen;
      if (!fn) {
        notify(
          "Этот браузер не поддерживает полный экран. Используйте режим созерцания.",
        );
        return;
      }
      await fn.call(document.documentElement);
    }
  } catch {
    notify("Браузер не разрешил полноэкранный режим.");
  }
  fullUpdate();
};
document.addEventListener("fullscreenchange", fullUpdate);
document.addEventListener("webkitfullscreenchange", fullUpdate);
function renderBanner() {
  mountShowcaseBanner($("banner"), {contactURL:config.contactChannels?.general?.url});
}
renderBanner();
function heading(kicker, title, text) {
  const h = el("header", "hero");
  h.append(el("p", "eyebrow", kicker), el("h1", "", title));
  if (text) h.append(el("p", "muted", text));
  return h;
}
function platformPromo(kind = "themes") {
  const article = el("article", "feed-post glass platform-promo");

  if (kind === "themes") {
    article.append(
      el("p", "promo-kicker", "НОВЫЕ ТЕМЫ · СОЗДАЁМ ПОСТОЯННО"),
      el("h2", "", "Следующий мир может начаться с вашей идеи"),
    );

    const body = el("div", "feed-body");
    body.append(
      el(
        "p",
        "",
        "Темы Syolana мы выпускаем постепенно и каждую доводим как отдельный живой мир — с движением, светом, глубиной и настроением.",
      ),
      el(
        "p",
        "",
        "Если у вас есть образ, атмосфера или движение, которое вы давно хотели увидеть на сайте, расскажите нам. Возможно, одна из следующих тем родится именно из вашей идеи.",
      ),
    );
    article.append(body);

    const actions = el("div", "promo-actions");
    const idea = el("a", "btn small", "Предложить идею темы");
    idea.href = businessContact("Идея новой темы Syolana");
    actions.append(
      idea,
      link("Подключить Syolana", "#/join", "text-link"),
    );
    article.append(actions);
    return article;
  }

  article.append(
    el("p", "promo-kicker", "SYOLANA · БОЛЬШЕ, ЧЕМ ОФОРМЛЕНИЕ"),
    el("h2", "", "Ваш проект — на красивом и понятном сайте"),
  );
  const body = el("div", "feed-body");
  body.append(
    el(
      "p",
      "",
      "Выберите готовую основу сайта и наполните её своими материалами. Syolana предоставляет темы, шаблон и редактор; домен, хостинг и размещение выбираете вы.",
    ),
    el(
      "p",
      "",
      "Сначала посмотрите демо-сайт и редактор. Состав, стоимость и размещение вашего проекта согласуются до оплаты.",
    ),
  );
  article.append(body);

  const actions = el("div", "promo-actions");
  actions.append(
    link("Посмотреть возможности", "#/join", "btn small"),
    link("Изучать языки", "#/languages", "text-link"),
  );
  article.append(actions);
  return article;
}

async function home(token) {
  $("page").append(
    heading(
      "САЙТЫ · ДИЗАЙН · ЯЗЫКИ",
      "Место для вашего проекта",
      "Сайты на общем шаблоне с живыми темами и языковые курсы по подписке. Новое в Syolana — здесь.",
    ),
  );
  const tabs = el("div", "feed-filters");
  const list = el("div", "feed-list");
  let items = [],
    selected = "Все";
  function draw() {
    list.replaceChildren();
    renderFeed(
      list,
      items.filter((p) => selected === "Все" || p.category === selected),
    );

    if (selected === "Все") {
      const posts = [...list.querySelectorAll(".feed-post")];
      const themePromo = platformPromo("themes");

      if (posts[0]?.nextSibling)
        list.insertBefore(themePromo, posts[0].nextSibling);
      else list.append(themePromo);

      list.append(platformPromo("features"));
    }
  }
  ["Все", "Дизайн", "Языки", "Песни"].forEach((name) => {
    const b = button(
      name,
      () => {
        selected = name;
        tabs
          .querySelectorAll("button")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        draw();
      },
      "btn small",
    );
    b.setAttribute("aria-pressed", String(name === "Все"));
    tabs.append(b);
  });
  $("page").append(tabs, list);
  try {
    items = structuredClone(initialFeed);
    if (!Array.isArray(items)) items = [];
    items = items.filter(p => p.category !== "Книги");
  } catch {
    items = [];
  }
  if (token !== routeToken) return;
  draw();
  if(config.legacyStudioEnabled)ensureAPI().then(async () => {
    if (!api.online || token !== routeToken) return;
    try {
      const data = await api.request("feed");
      if (token === routeToken && data.posts.length) {
        items = data.posts.filter(p => p.category !== "Книги" && p.kind !== "book");
        draw();
      }
    } catch {}
  });
  const explore = el("section", "strip glass");
  explore.append(
    el("h3", "", "Творчество с полным погружением"),
    button("Остаться в этом мире", () => zen(true), "btn"),
  );
  $("page").append(explore);
}
function languages(lang = "en") {
  if (!lessons[lang]) lang = "en";
  const data = lessons[lang];
  $("page").append(heading("ЯЗЫКИ · АВТОРСКАЯ МЕТОДИКА", "Слушайте. Пишите. Двигайтесь по уровням.", "Понятные правила, слова в контексте и ежедневная практика — в одном последовательном курсе."));
  const intro = el("section", "card stack language-intro");
  intro.append(el("h2", "", "Язык, для которого найдётся время"),
    el("p", "", "С детства меня увлекали языки и способы их изучения. Я пробовал сотни методик и изучал больше 20 языков на разных уровнях. Из этого опыта выросла собственная система: идти по порядку, соединять правила со словами и не теряться в разрозненных знаниях."),
    el("p", "", "Каждый курс собран по уровням и дневным блокам. У слов — четыре разных примера, у правил — объяснения и практика. Материал можно читать и слушать с переводом, в том числе во время привычных дел. А затем вернуться к экрану, произнести фразы и закрепить их письменно."),
    el("p", "", "Моя рекомендация — слушать каждый день: новую часть или повторение предыдущей. И каждый день немного писать от руки: в тетради или стилусом на телефоне и планшете. В моём опыте такая запись помогает вниманию и памяти. Вы сами выбираете темп."),
    link("Попробовать английский A1 бесплатно", "#/lesson/en/a1/course", "btn primary"));
  $("page").append(intro);
  const tabs = el("div", "pill-tabs language-tabs");
  for (const [key, value] of Object.entries(lessons)) { const item=link(value.name, "#/languages/"+key,"btn");item.setAttribute("aria-current",key===lang?"page":"false");tabs.append(item); }
  $("page").append(tabs);
  const levels=el("div","grid two language-levels");
  for (const [level,description] of Object.entries({A1:"Основы языка и первые повседневные разговоры",A2:"Больше слов, времен и уверенности в обычных ситуациях"})) {
    const key=lang+"/"+level.toLowerCase()+"/course",published=Boolean(lessonFiles[key]),free=lang==="en"&&level==="A1";
    const item=el("article","card stack language-level");item.dataset.level=level;
    item.append(el("span","badge",free?"БЕСПЛАТНО ДЛЯ ВСЕХ":published?"В ОБЩЕЙ ПОДПИСКЕ":"ГОТОВИТСЯ"),el("h3","course-level",data.name+" "+level),el("p","",description),el("p","course-price",free?"Бесплатно":published?"650 ₽ / 30 дней · все платные курсы":"Дата появится после подготовки"),published?link(free?"Начать бесплатно":"Открыть курс", "#/lesson/"+key,"btn primary"):link("Предложить следующий язык",businessContact("Хочу изучать "+data.name+" "+level,"languages"),"text-link"));
    if(published&&!free)item.append(coursePurchaseButton());
    levels.append(item);
  }
  $("page").append(levels);
  const details=el("details","card stack language-details");details.append(el("summary","","Подписка, новые уровни и авторские права"),el("p","","Одна подписка за 650 ₽ открывает все опубликованные платные языковые курсы на 30 дней. Продление — только по вашему решению, без автоматических списаний. Английский A1 доступен без подписки. Партнёрам с оплаченным обслуживанием сайта языковой доступ включён на оплаченный период."),el("p","fine","Это материалы для самостоятельной практики: без занятий с преподавателем, экзаменов и выдачи документов об образовании. Название уровня обозначает сложность материала. Озвучка зависит от голосов браузера и устройства; прогресс хранится в этом браузере."),el("p","fine","© Syolana. Материалы предназначены для личного использования. Публикация, копирование и распространение требуют разрешения правообладателя, кроме случаев, разрешённых законом."),link("Условия доступа", "#/offer","text-link"));$("page").append(details);
}
function songsPage() {
  $("page").append(
    heading(
      "ПЕСНИ · ТВОРЧЕСТВО БЕЗ ГРАНИЦ",
      "У каждой песни есть свой мир",
      "Слушайте. Вдохновляйтесь. Открывайте историю за мелодией.",
    ),
  );
  const intro = el("section", "card stack");
  intro.append(
    el("h2", "", "Творчество, которое звучит"),
    el(
      "p",
      "",
      "Мы создаём с помощью ИИ песни на разных языках — по книгам и другим творческим проектам. Общий плеер Syolana соединяет музыку, живые темы и новые знакомства с авторами.",
    ),
    el(
      "p",
      "",
      "У каждой записи есть ссылка на её источник: книгу, сайт, картину или другое творчество. Если песня отозвалась — шагните в мир, который её вдохновил.",
    ),
    el(
      "p",
      "",
      "Иногда проект партнёра вдохновляет нас на песню или новую тему. Мы можем предложить такой подарок по отдельной договорённости. Это творческая возможность, а не обязательная часть подписки.",
    ),
    link("Создать свой сайт", "#/join", "btn primary"),
  );
  $("page").append(
    intro,
    heading(
      "СЕЙЧАС В ПЛЕЕРЕ",
      "Начните с мелодии",
      "Коллекция пополняется: включите любую из опубликованных песен.",
    ),
  );
  const promo=songCoursePromo(player.songs.map(song=>songLanguage(song,songDetails.songs)));
  if(promo)$("page").append(promo);
  const list = el("div", "grid two songs-grid");
  player.songs.forEach((song, i) => {
    const card = el("article", "card stack");
    card.append(
      el("h3", "song-title", song.title),
      el("p", "muted", song.sourceTitle || "Творческий проект"),
      button("Слушать песню", () => player.select(i, true), "btn primary"),
    );
    if (song.sourceUrl)
      card.append(
        link("Открыть источник вдохновения", song.sourceUrl, "text-link"),
      );
    const courseLink=songCourseLink(songLanguage(song,songDetails.songs));
    if(courseLink)card.append(courseLink);
    list.append(card);
  });
  $("page").append(list);
}
async function songPage(id, token) {
  const data=songDetails;
  if(token!==routeToken)return;
  const song=data.songs.find(s=>s.id===id);
  if(!song)throw Error('Эта песня пока не опубликована.');
  document.title=song.titleRu+' · Syolana';
  const index=player.songs.findIndex(s=>s.id===id);
  $('page').append(link('Все песни','#/songs','text-link'),heading('МУЗЫКА И ПОЭЗИЯ',song.title,song.titleRu));$('page').querySelector(':scope>.hero h1').classList.add('song-title');
  const introduction=el('section','card stack song-introduction');
  introduction.append(el('p','eyebrow',song.author+' · '+song.authorYears),el('h2','',song.sourceTitle),el('p','',song.about),el('p','muted',song.publication));
  if(index>=0)introduction.append(button('Слушать песню',()=>player.select(index,true),'btn primary'));
  introduction.append(el('p','fine','Ниже — полный литературный первоисточник песни. Повторы и изменения в музыкальной версии не приписываются автору оригинала.'));
  const poems=el('div','song-poems grid two');
  poems.dataset.i18nSkip='poetry';
  function renderPoems(){
    const locale=getLocale(),originalLanguage=song.originalLanguage;
    const translation=locale==='ru'?song.translationRu:song.translations?.[locale];
    const labels={ru:song.translationLabel,en:'Новый перевод на английский для Syolana',fr:'Новый перевод на французский для Syolana'};
    const rows=[['Полный текст первоисточника',song.original,originalLanguage]];
    if(locale!==originalLanguage&&translation)rows.push([labels[locale],translation,locale]);
    poems.replaceChildren();poems.classList.toggle('two',rows.length>1);
    for(const [title,text,language]of rows){
      const card=el('section','card stack song-poem');card.append(el('h2','',tr(title)));const poem=el('p','poem-text',text);poem.lang=language;card.append(poem);if(language!==originalLanguage)card.append(el('p','fine',tr(song.translationNote)));poems.append(card);
    }
  }
  renderPoems();window.addEventListener('syolana:locale',renderPoems);cleanup=()=>window.removeEventListener('syolana:locale',renderPoems);
  const rights=el('section','card stack song-rights');rights.append(el('p','eyebrow','АВТОР И ПРАВА'),el('h2','','Исторический текст — общественное достояние'),el('p','',song.publicDomain.explanation),el('p','fine',song.publicDomain.scopeNote),link('ГК РФ: статьи 1281 и 1282',song.publicDomain.lawUrl,'text-link'));
  const notes=el('details','card stack song-notes');notes.append(el('summary','','Примечания и проверенные источники'));for(const text of song.notes)notes.append(el('p','',text));for(const source of song.sources||[])notes.append(link(source.label,source.url,'text-link'));
  const promo=songCoursePromo([songLanguage(song)]);
  $('page').append(introduction,...(promo?[promo]:[]),poems,rights,notes,link('К списку песен','#/songs','btn'));
}
function join() {
  $("page").append(heading("ТЕМЫ И ШАБЛОНЫ · 7 ДНЕЙ ЗНАКОМСТВА", "Ваш сайт. Ваши материалы. Общая забота о дизайне.", "Готовый шаблон с живыми темами и понятным редактором. Домен, хостинг и размещение — по вашему выбору. Для авторов, мастеров, студий и небольших проектов."));
  const grid=el("div","grid two");
  for(const [title,paragraphs] of [["Начните с готовой основы",["Выберите блоки, расставьте их по порядку и заполните своими текстами. Добавьте фотографии, контакты и публикации, выберите тему — без написания кода. Редактор подсказывает следующий шаг и показывает результат до публикации.","Вы выбираете домен, хостинг и место размещения. Помощь с первоначальной настройкой можно согласовать отдельно. Содержание, домен и материалы остаются вашими."]],["Попробуйте спокойно",["Демо-сайт и редактор доступны для знакомства до заказа. Цена настройки и дальнейшего обслуживания зависит от объёма проекта; вы узнаете её до оплаты.","В оплаченный период обслуживания включён доступ ко всем опубликованным платным языковым курсам Syolana. Для изучения языков без сайта есть отдельная подписка — 650 ₽ за 30 дней."]]]){const card=el("section","card stack");card.append(el("h2","",title),...paragraphs.map(t=>el("p","",t)));grid.append(card);}
  $("page").append(grid);
  const practical=el("section","card stack partner-practical");practical.append(el("h3","","Как это работает"),el("p","","Syolana предоставляет темы, шаблон, готовые блоки и редактор. Вы добавляете свои материалы и скачиваете готовый сайт. Домен, хостинг и размещение выбираете самостоятельно; подключение серверных функций согласуется отдельно."),el("p","","Сохраните основной и запасной адреса Syolana. При ограничениях интернета доступность конкретного адреса зависит от оператора. Для вашего сайта можно выбрать подходящий домен и место размещения; доступ во всех сетях не гарантируется."),el("p","","На сайте сохраняется нейтральная подпись «Сайт создан на Syolana». Обновления оформления предоставляются по условиям обслуживания. Файлы сайта, домен и материалы остаются у владельца. Стоимость домена, хостинга и дополнительных серверных функций согласуется отдельно и не входит в шаблон автоматически."),el("p","","Иногда творческий проект вдохновляет нас на новую тему или песню. Такой подарок возможен по отдельной договорённости: он не входит в обязательный состав обслуживания и не обещается каждому партнёру."),link("Обсудить мой сайт",businessContact(),"btn primary"),link("Создать и опубликовать сайт","#/create-site","btn primary"),link("Попробовать редактор без входа","partner-demo/studio/","btn"),link("Партнёр: Артивид",config.artividUrl||"https://ill-27.github.io/Immersivebooks/","btn"),link("Условия сотрудничества","#/offer","text-link"));$("page").append(practical);
}
async function publicSite(slug, token) {
  document.body.classList.add("partner-site");
  const data = await api.request("public/" + encodeURIComponent(slug));
  if (token !== routeToken) return;
  applyEntitlement(data);
  watchAccess(slug, token, data.active);
  const head = el("header", "creator-head");
  head.append(
    el("p", "eyebrow", data.site.category || "АВТОРСКОЕ ПРОСТРАНСТВО"),
    el("h1", "", data.site.name),
    el("p", "", data.site.bio || ""),
  );
  if (data.site.link)
    head.append(link("Связаться с автором", data.site.link, "text-link"));
  $("page").append(head);
  const grid = el("div", "grid two");

  const feed = el("div", "feed-list");
  renderFeed(
    feed,
    data.posts.filter((p) => p.kind !== "book" && p.kind !== "portfolio"),
    { slug },
  );
  $("page").append(feed);
  if (!data.posts.length) grid.append(el("p", "empty", "Публикаций пока нет."));
  $("page").append(grid);
  if (!data.active)
    $("page").append(link("Вход владельца", "#/studio", "text-link"));
  document.title = data.site.name + (data.active ? " · Syolana" : "");
}
function watchAccess(slug, token, active) {
  accessTimer = setTimeout(async () => {
    if (token !== routeToken) return;
    try {
      const fresh = await api.request("public/" + encodeURIComponent(slug));
      if (token !== routeToken) return;
      if (fresh.active !== active) {
        route();
        return;
      }
      watchAccess(slug, token, active);
    } catch {
      if (token === routeToken) route();
    }
  }, 60000);
}
function applyEntitlement(data) {
  document.body.classList.toggle("no-effects", !data.active);
  theme.setBlocked(!data.active);
  if (!data.active) {
    player.pause();
    sceneAudio.stop();
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
  }
  if (data.active && data.accessUntil) {
    const ms = Math.min(
      2147480000,
      Math.max(1000, data.accessUntil * 1000 - Date.now() + 200),
    );
    siteTimer = setTimeout(() => route(), ms);
  }
}
function contactPage() {
  const box=el("article","card stack legal-page");
  box.append(el("h1","","Связаться с Syolana"));
  box.append(el("h3","","Идея, сайт или языковой доступ"),el("p","","Создание сайта, условия обслуживания, ключ доступа и поддержка — в официальном профиле Syolana на Авито: avito.ru/brands/i223140984. Состав работы, цену и сроки согласуем до оплаты."));
  box.append(el("h3","","Для заявлений о нарушении прав"),el("p","","Я также могу отвечать с официальной почты syolana@yandex.ru. По этому адресу принимаются и юридически значимые заявления. Не отправляйте по почте пароли, ключи доступа и реквизиты карты."));
  box.append(link("Сведения об исполнителе","legal-info/index.html","text-link"));
  box.append(link("Связаться на Авито",businessContact(),"btn"),link("Условия доступа","#/offer","text-link"),link("Как используются данные","#/privacy","text-link"));
  $("page").append(box);
}

function terms() {
  const box=el("article","card stack legal-page");
  box.append(el("h1","","Как заказать сайт"));
  box.append(el("h3","","Сначала знакомство"),el("p","","Демо-сайт и редактор доступны для знакомства до заказа. Если формат подходит, состав вашего проекта, стоимость и размещение согласуются до оплаты."));
  box.append(el("h3","","Ваш сайт и материалы"),el("p","","Вы управляете доменом, выбранным хостингом и своими материалами. После первоначальной настройки в редакторе можно выбирать и переставлять блоки, менять текст, тему, контакты и публикации. Домен и облачный аккаунт подключаются отдельно; редактор не регистрирует их автоматически."));
  box.append(el("h3","","Публикации"),el("p","","Вы размещаете материалы через свой редактор или подключённое публичное сообщество VK и отвечаете за права на них. При подтверждённом нарушении Syolana может приостановить свой подключаемый слой. Обращения рассматриваются в пределах возможностей платформы."));
  box.append(el("h3","","Обслуживание сайта"),el("p","","Платное обслуживание включает общие темы, обновления и личный доступ ко всем опубликованным платным языковым курсам на оплаченный период. Базовый сайт, домен и материалы остаются у вас и после окончания обслуживания. Нейтральная подпись Syolana является частью оформления."));
  box.append(link("Сведения об исполнителе","legal-info/index.html","text-link"));
  box.append(link("Связаться на Авито",businessContact(),"btn"),link("Условия доступа","#/offer","text-link"),link("Как используются данные","#/privacy","text-link"));
  $("page").append(box);
}

function offerPage() {
  const box=el("article","card stack legal-page");
  box.append(el("h1","","Условия сайтов и языкового доступа"));
  box.append(el("h3","","Два самостоятельных продукта"),el("p","","Syolana предоставляет основу сайта с оформлением и редактором, а также авторские материалы для самостоятельного изучения языков. Для языков не требуется покупать сайт. Артивид — самостоятельный книжный проект и партнёр Syolana."));
  box.append(el("h3","","Языковая подписка"),el("p","","650 ₽ открывают все опубликованные платные языковые курсы на 30 дней. Английский A1 бесплатен для всех. Для локального файла срок начинается с выдачи. При согласованном серверном доступе по ключу — с первого входа после ручной выдачи. Способ доступа согласуется до оплаты. Продление добавляет 30 дней к оставшемуся сроку или начинает новый период после его окончания. Автоматических списаний нет."));
  box.append(el("h3","","Один готовый ключ"),el("p","","Серверный ключ работает без создания нового логина и пароля. Ключ даёт одну активную сессию и одну открытую вкладку платного курса: новый вход или открытие платного курса в другой вкладке завершает предыдущий доступ. Не передавайте его другим. При потере обратитесь в исходной переписке покупки; прежний ключ будет заменён. Прогресс и настройки хранятся в браузере и сохраняются после окончания оплаченного доступа, пока вы не очистите данные сайта."));
  box.append(el("h3","","Локальное разрешение для браузера"),el("p","","Отдельный зашифрованный файл выдаётся вручную для браузера, в котором создан запрос. Срок — 30 дней с момента выдачи. Файл открывается в этом браузере без серверной проверки ключа. Очистка данных сайта может уничтожить локальный ключ. Дистанционный отзыв и немедленный перенос такого разрешения недоступны. Способ доступа согласуется до оплаты."));
  box.append(el("h3","","Что входит в курс"),el("p","","Правила с примерами, словарь, практика, повторение и браузерная озвучка. Это самостоятельные цифровые материалы без занятий с преподавателем, экзаменов и выдачи документов об образовании. Новые выпуски планируются, но подписка оплачивает доступ к уже опубликованным материалам. Озвучка зависит от устройства и установленных голосов."));
  box.append(el("h3","","Сайты партнёров"),el("p","",PARTNER_CALENDAR_TERMS));
  box.append(el("h3","","Дизайн и творческие подарки"),el("p","","В оформлении сохраняется нейтральная подпись «Сайт создан на Syolana» со ссылкой на платформу. Рекламное размещение согласуется отдельно с соблюдением требований к рекламе. Песня или отдельная тема по проекту партнёра возможны по отдельной договорённости; они не являются обязательным подарком каждому и не входят в стоимость по умолчанию."));
  box.append(el("h3","","Оплата и возвраты"),el("p","","Цена и условия показываются до оплаты. Заказ и условия оплаты согласуются в личной переписке в официальном профиле на Авито. На сайте оплата не принимается. При проблеме с доступом или вопросе о возврате напишите в исходной переписке заказа; обращение рассматривается с учётом фактически предоставленного результата и обязательных прав потребителя. Прекращение продления не прекращает уже оплаченный период."));
  box.append(el("h3","","Права на материалы"),el("p","","Курсы предназначены для личного использования. Публикация и распространение требуют разрешения правообладателя, кроме случаев, разрешённых законом. Владелец партнёрского сайта отвечает за права на собственные публикации."));
  box.append(el("h3","","Сведения о продавце"),el("p","","Заказ, сведения об исполнителе, цена, состав, срок и условия возврата согласуются до оплаты в личной переписке на Авито. На сайте нет оформления заказа, приёма оплаты и автоматических списаний. Покупателю выдаётся чек «Мой налог»."));
  box.append(link("Сведения об исполнителе","legal-info/index.html","text-link"));
  box.append(link("Оферта на языковые материалы","legal-info/index.html#course-offer","text-link"));
  box.append(link("Связаться на Авито",businessContact(),"btn"),link("Условия доступа","#/offer","text-link"),link("Как используются данные","#/privacy","text-link"));
  $("page").append(box);
}

function privacyPage() {
  const box=el("article","card stack legal-page");
  box.append(el("h1","","Конфиденциальность"));
  for(const [title,text] of PRIVACY_SUMMARY)box.append(el("h2","",title),el("p","",text));
  box.append(link("Политика обработки персональных данных",PRIVACY_URL,"btn primary"),link("Связаться на Авито",businessContact(),"btn"));
  $("page").append(box);
}

function legalInfo() {
  const box=el("article","card stack legal-page");
  box.append(el("h1","","Правовая информация"));
  box.append(el("h3","","О проекте"),el("p","","Syolana — название платформы шаблонов сайтов и авторских языковых материалов. Артивид — самостоятельный книжный проект и партнёр Syolana. Syolana предоставляет темы и шаблоны; домен, хостинг и размещение выбирает владелец."));
  box.append(el("h3","","Контакты"),el("p","","Заказы и поддержка: официальный профиль Syolana на Авито, avito.ru/brands/i223140984. Заявления о нарушении прав по статье 15.7 149-ФЗ: syolana@yandex.ru."));
  box.append(el("h3","","Заказ на Авито"),el("p","","Заказ, сведения об исполнителе, цена, состав, срок и условия возврата согласуются до оплаты в личной переписке на Авито. На сайте нет оформления заказа, приёма оплаты и автоматических списаний. Покупателю выдаётся чек «Мой налог»."));
  box.append(link("Сведения об исполнителе","legal-info/index.html","text-link"));
  box.append(link("Связаться на Авито",businessContact(),"btn"),link("Условия доступа","#/offer","text-link"),link("Как используются данные","#/privacy","text-link"));
  $("page").append(box);
}

function report() {
  const box = el("section", "card stack");
  box.append(
    el("h1", "", "Сообщить о публикации"),
    el("p", "", "В сообщении укажите ссылку на страницу, конкретный материал и причину обращения. Для авторских прав добавьте сведения о правообладателе и основании заявления."),
    link("Написать на Авито", businessContact(), "btn primary"),
    link("Порядок юридических обращений", "#/legal", "text-link"),
  );
  $("page").append(box);
}

async function route() {
  const token = ++routeToken;
  const preserveAudio = /^#\/book\//.test(location.hash) || /^#\/s\/[^/]+\/book\//.test(location.hash);
  cleanup({ preserveAudio });
  clearPositionView();
  if (!preserveAudio) sceneAudio.stop();
  cleanup = () => {};
  clearTimeout(siteTimer);
  clearTimeout(accessTimer);
  zen(false);
  document.body.classList.remove("reading", "no-effects", "partner-site");
  theme.setBlocked(false);
  document.documentElement.style.setProperty("--prose", moodColors.neutral);
  $("page").replaceChildren();
  window.scrollTo({ top: 0, behavior: "instant" });
  document.title = "Syolana · Темы, сайты и языки";
  document.querySelector('#footer>span').textContent='© Syolana. Все права защищены.';
  const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
  const [view, a, b, c, d] = parts;
  const managedView=['site','site-editor','create-site'].includes(view);
  document.body.classList.toggle('managed-site-view',view==='site');
  if(view==='site')$('page').dataset.i18nSkip='partner-content';else $('page').removeAttribute('data-i18n-skip');
  document.body.classList.toggle('managed-editor-view',view==='site-editor'||view==='create-site');
  $('main-nav').hidden=managedView;
  const informationTitles = {
    legal: "Правовая информация", offer: "Предварительные условия",
    privacy: "Конфиденциальность", terms: "Как заказать сайт",
    report: "Обращения о нарушениях", contact: "Контакты",
    'site':'Авторский сайт','site-editor':'Мастерская сайта','create-site':'Создать сайт',
    'song':'История песни','owner-sites':'Мои партнёрские сайты',
  };
  const informationView = Boolean(informationTitles[view]);
  $("banner").hidden = informationView;
  $("provider-notice").hidden = informationView;
  document.body.classList.toggle("information-view", informationView);
  if (informationView) document.title = informationTitles[view] + " · Syolana";
  document
    .querySelectorAll("[data-nav]")
    .forEach((x) =>
      x.setAttribute("aria-current", x.dataset.nav === view ? "page" : "false"),
    );
  try {
    if (['create-site','site-editor','studio','editor','admin'].includes(view) && config.legacyStudioEnabled!==true) {positionView();}
    else if(view==='site-editor'&&/^[a-z0-9][a-z0-9-]{2,49}$/.test(a||'')) {const {mountManagedEditor}=await import('./managed-sites.js');const next=await mountManagedEditor($('page'),a,{isCurrent:()=>token===routeToken});if(token===routeToken)cleanup=next||(()=>{});else next?.();}
    else if(view==='site'&&/^[a-z0-9][a-z0-9-]{2,49}$/.test(a||'')) {const {mountManagedSite}=await import('./managed-sites.js');await mountManagedSite($('page'),a,{isCurrent:()=>token===routeToken,selectTheme:id=>theme.select(id)});}
    else if(view==='owner-sites'){const {mountOwnerSites}=await import('./owner-sites.js');const next=await mountOwnerSites($('page'),{isCurrent:()=>token===routeToken});if(token===routeToken)cleanup=next;else next?.();}
    else if (view === "home") await home(token);
    else if (view === "library" || view === "book") { location.replace((config.artividUrl || "https://ill-27.github.io/Immersivebooks/") + (view === "book" ? "#/book/"+encodeURIComponent(a)+"/"+(Number(b)||0) : "#/")); return; }
    else if (view === "languages") languages(a, b);
    else if (view === "songs") songsPage();
    else if (view === "song") await songPage(a,token);
    else if (view === "lesson") {
      const key = [a, b, c].join("/");
      if (!lessonFiles[key]) throw Error("Этот урок пока не опубликован.");
      const removeAttribution = await mountCourseBranding({course: `${a.toUpperCase()} ${b.toUpperCase()}`, cards:false});
      if (token !== routeToken) { removeAttribution(); return; }
      $("page").append(
        link("К уровням языка", "#/languages/" + a, "text-link"),
      );
      try { await openLesson(key, d ? decodeURIComponent(d) : "", token); } catch (error) { removeAttribution(); throw error; }
      const lessonCleanup = cleanup;
      cleanup = (...args) => { lessonCleanup(...args); removeAttribution(); };
    } else if (view === "join") join();
    else if (view === "contact") contactPage();
    else if (["studio", "editor", "admin"].includes(view) && config.legacyStudioEnabled !== true) {
      $("page").append(
        heading("КАБИНЕТ ПАРТНЁРА", "Настройки на вашем сайте", "Кабинет подключается отдельно на инфраструктуре владельца сайта. Ссылку на него вы получаете после настройки. В режиме VK записи создаются и исправляются во ВКонтакте."),
        link("Обсудить настройку на Авито", businessContact(), "btn primary"),
      );
    } else if (view === "studio") {
      await ensureAPI();
      if (token === routeToken)
        await (await getStudio()).render($("page"), token, () => routeToken);
    } else if (view === "admin") {
      await ensureAPI();
      if (token === routeToken) await (await getStudio()).admin($("page"));
    } else if (view === "editor") feedEditor($("page"));
    else if (view === "s" && b === "book") { location.replace(config.artividUrl || "https://ill-27.github.io/Immersivebooks/"); return; }
    else if (view === "s") await publicSite(a, token);
    else if (view === "terms") terms();
    else if (view === "offer") offerPage();
    else if (view === "privacy") privacyPage();
    else if (view === "legal") legalInfo();
    else if (view === "report") report();
    else
      $("page").append(
        el("p", "empty", "Эта страница не найдена."),
        link("На главную", "#/"),
      );
  } catch (err) {
    if (token !== routeToken) return;
    sceneAudio.stop();
    $("page").replaceChildren(
      el("p", "notice error", err.message),
      link("На главную", "#/"),
    );
  }
  if(token===routeToken)finishUI();
}
window.addEventListener("hashchange", route);
await route();

function lessonFrame(key, anchor = "") {
  const filename = lessonFiles[key];
  if (!filename) return;
  const frame = el("iframe", "lesson-frame");
  frame.title = "Учебный материал Syolana";
  const englishCourse = ["en/a1/course", "en/a2/course", "es/a1/course", "es/a1/rules", "es/a1/words", "es/a1/practice", "es/a2/course", "es/a2/rules", "es/a2/words", "es/a2/practice", "fr/a1/course", "fr/a1/rules", "fr/a1/words", "fr/a1/practice", "fr/a2/course", "fr/a2/rules", "fr/a2/words", "fr/a2/practice"].includes(key);
  if (englishCourse) {
    document.body.classList.add("course-reading");
    frame.classList.add("english-course-frame");
  }
  frame.src = filename + "?embed=1" + (englishCourse ? "&v=20261017-owner-1" : "") + (!anchor && /\/(rules|words|practice)$/.test(key) ? "#"+({rules:"grammar",words:"vocabulary",practice:"practice"}[key.split("/").at(-1)]) : "");
  const status = el("p", "loading", "Открываем учебный материал…");
  if (englishCourse) status.hidden = true;
  $("page").append(status, frame);
  let active = true,
    anchored = false;
  let courseBar = null, courseLabel = null, courseStatus = null, courseProgress = null, courseAudio = null, courseTOC = null, courseOwner = null;
  function fitCourse() {
    if (!englishCourse || !active) return;
    const dock = $("music-dock")?.getBoundingClientRect();
    if (courseBar) courseBar.style.bottom = (dock?.height ? Math.max(16, window.innerHeight - dock.top + 12) : 16) + "px";
    send({courseScroll:Math.max(0, window.scrollY - (window.scrollY + frame.getBoundingClientRect().top - 110))});
  }
  const courseObserver = englishCourse && typeof ResizeObserver !== "undefined"
    ? new ResizeObserver(fitCourse) : null;
  if (englishCourse) {
    courseBar = el("div", "course-controls");
    courseBar.hidden = key !== "en/a1/course";
    courseTOC = el("button", "course-controls-toc", "☰");
    courseTOC.type = "button"; courseTOC.setAttribute("aria-label", "Оглавление курса");
    courseTOC.addEventListener("click", () => send({openTOC:true}));
    courseAudio = el("button", "course-controls-audio"); courseAudio.type = "button";
    const icon = el("span", "course-controls-icon", "♫"), copy = el("span", "course-controls-copy");
    courseLabel = el("strong", "", "Озвучка курса");courseStatus = el("small", "", "Режим, скорость и голоса");copy.append(courseLabel,courseStatus);
    courseProgress = el("progress");courseProgress.max=1;courseProgress.value=0;courseProgress.setAttribute("aria-label", "Прогресс прослушивания");
    courseAudio.append(icon,copy,courseProgress);courseAudio.addEventListener("click", () => send({openPlayer:true}));
    courseOwner=el("button","course-controls-owner","Ключи и подписки");courseOwner.type="button";courseOwner.hidden=true;courseOwner.addEventListener("click",()=>send({openOwner:true}));
    courseBar.append(courseOwner,courseTOC,courseAudio);document.body.append(courseBar);
    window.addEventListener("resize", fitCourse);
    window.addEventListener("scroll", fitCourse, {passive:true});
    if ($("music-dock")) courseObserver?.observe($("music-dock"));
    requestAnimationFrame(fitCourse);
  }
  function send(data) {
    frame.contentWindow?.postMessage(
      { syolanaHost: true, ...data },
      location.origin,
    );
  }
  function palette() {
    const style = getComputedStyle(document.documentElement);
    send({
      theme: Object.fromEntries(
        ["heading","body","accent","dim","surface","radius","panel-bg","panel-border","panel-text","panel-muted","button-radius"].map((k) => [
          k,
          style.getPropertyValue("--" + k),
        ]),
      ),
    });
  }
  function message(event) {
    if (
      !active ||
      event.source !== frame.contentWindow ||
      event.origin !== location.origin ||
      !event.data?.syolanaLesson
    )
      return;
    const data = event.data;
    if (Number.isFinite(data.height) && data.height > 0) {
      frame.style.height = Math.min(2000000, data.height) + "px";
      status.hidden = true;
    }
    if (data.ready) {
      palette();
      fitCourse();
      if (anchor && !anchored) {
        anchored = true;
        send({ anchor });
      }
    }
    if (Number.isFinite(data.scroll) && data.scroll >= 0) {
      window.scrollTo({
        top:
          window.scrollY +
          frame.getBoundingClientRect().top +
          data.scroll -
          110,
        behavior: "instant",
      });
    }
    if (data.audio) player.pause();
    if(englishCourse&&Object.hasOwn(data,"courseOwner")){courseOwner.hidden=data.courseOwner!==true;courseBar.classList.toggle("has-owner",data.courseOwner===true);if(data.courseOwner===true)courseBar.hidden=false;}
    if (englishCourse && data.courseAudio) {
      courseBar.hidden = false;
      const audio = data.courseAudio;
      courseLabel.textContent=audio.label;courseStatus.textContent=audio.status;
      courseProgress.max=Math.max(1,audio.total||0);courseProgress.value=audio.index||0;
      courseAudio.setAttribute("aria-label", audio.label + ". " + audio.status + ". Открыть озвучку курса");
    }
    if (englishCourse && Object.hasOwn(data,"courseOverlay")) {
      courseAudio.setAttribute("aria-expanded",String(data.courseOverlay==="player"));
      courseTOC.setAttribute("aria-expanded",String(data.courseOverlay==="toc"));
    }
    if (typeof data.navigate === "string") {
      const url = new URL(data.navigate, location.origin);
      const file = decodeURIComponent(url.pathname.split("/").pop());
      const aliases = {};
      const entry = Object.entries(lessonFiles).find(
        ([key, name]) => name === file || key === aliases[file],
      );
      if (entry)
        location.hash =
          "#/lesson/" +
          entry[0] +
          (url.hash
            ? "/" + encodeURIComponent(decodeURIComponent(url.hash.slice(1)))
            : "");
      else if (/fran|franç/.test(file)) location.hash = "#/languages/fr";
      else if (/espa|spanish/.test(file)) location.hash = "#/languages/es";
      else location.hash = url.hash.startsWith("#/") ? url.hash : "#/";
    }
  }
  frame.addEventListener("load", palette);
  const pauseLesson = () => send({ pauseAudio: true });
  window.addEventListener("message", message);
  window.addEventListener("syolana:theme", palette);
  $("audio").addEventListener("play", pauseLesson);
  const timer = setTimeout(() => {
    if (!status.hidden)
      status.textContent =
        "Загрузка занимает больше времени. Проверьте подключение к интернету.";
  }, 12000);
  cleanup = () => {
    active = false;
    if (englishCourse) document.body.classList.remove("course-reading");
    window.removeEventListener("resize", fitCourse);
    window.removeEventListener("scroll", fitCourse);
    courseBar?.remove();
    courseObserver?.disconnect();
    clearTimeout(timer);
    pauseLesson();
    window.speechSynthesis?.cancel();
    window.removeEventListener("message", message);
    window.removeEventListener("syolana:theme", palette);
    $("audio").removeEventListener("play", pauseLesson);
  };
}

async function openLesson(key, anchor, token) {
  if (lessonFiles[key].startsWith("api/")) {
    await ensureAPI();
    if (token !== routeToken) return;
    if (!api.online) {
      $("page").append(
        heading(
          "УРОК ПО ПОДПИСКЕ",
          "Скоро в Syolana",
          "Кабинеты и доступ по подписке откроются после подключения сервера.",
        ),
        link("Вернуться к A1", "#/languages/es"),
      );
      return;
    }
    if (!api.me) {
      $("page").append(
        heading(
          "УРОК ПО ПОДПИСКЕ",
          "Войдите в студию",
          "Для этого урока нужен активный доступ.",
        ),
        link("Войти", "#/studio"),
      );
      return;
    }
    const access = await api.request("learning-access");
    if (token !== routeToken) return;
    if (!access.active) {
      $("page").append(
        heading(
          "УРОК ПО ПОДПИСКЕ",
          "Нужен активный доступ",
          "Откройте студию, чтобы проверить пробный период или подписку.",
        ),
        link("Открыть студию", "#/studio"),
      );
      return;
    }
  }
  lessonFrame(key, anchor);
}
