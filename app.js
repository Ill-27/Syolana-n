import { loadCatalog, loadBook, lessonFiles } from "./catalog.js";
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
import { ThemeEngine } from "./themes.js?v=20261005-sea12";
import { Player } from "./player.js";
import { API } from "./api.js";
import { lessons } from "./content.js";
import { Studio } from "./studio.js";
import { renderFeed, feedEditor } from "./feed.js";
import { setupDiscovery } from "./discovery.js?v=20261005-sea12";
import { SceneAudio } from "./scene-audio.js";
document.querySelector(".skip-link").onclick = (e) => {
  e.preventDefault();
  $("page").focus();
  $("page").scrollIntoView();
};
const api = new API();
const apiReady = api.init();
let config;
try {
  config = await fetch("config.json", {
    signal: AbortSignal.timeout(6000),
  }).then((r) => r.json());
} catch {
  config = { songs: [], banner: {}, plan: { pricing: "custom", priceRub: null, trialDays: 7 } };
}
const player = new Player(config.songs || []);
const theme = new ThemeEngine();
theme
  .init()
  .catch(() => notify("Фон временно недоступен. Содержимое сайта доступно."));
const studio = new Studio(api, route);
const sceneAudio = new SceneAudio(config.sceneAudio || {}, player);
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
  if (e.key === "Escape" && document.body.classList.contains("zen")) zen(false);
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
function motionVideo(video) {
  video.muted = true;
  video.defaultMuted = true;
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.preload = "metadata";
  video.dataset.motion = "true";
  if (
    !document.hidden &&
    !matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    video.play().catch(() => {
      video.controls = true;
    });
}
function renderBanner() {
  const c = config.banner || {};
  const media = c.media || {};
  const src = safeURL(media.src, { media: true });

  const visual = el("div", "banner-orb");
  const m = el(
    src && (media.type === "video" || /\.mp4(?:[?#]|$)/i.test(src))
      ? "video"
      : "img",
    "banner-media",
  );
  m.src = src || "assets/logo.svg";

  if (m.tagName === "IMG") {
    m.alt = media.alt || "Syolana";
    m.decoding = "async";
  } else {
    const poster = safeURL(media.poster, { media: true });
    if (poster) m.poster = poster;
    motionVideo(m);
  }

  m.addEventListener(
    "error",
    () => {
      const fallback = el("img", "banner-media");
      fallback.src = "assets/logo.svg";
      fallback.alt = "Syolana";
      visual.replaceChildren(fallback);
    },
    { once: true },
  );
  visual.append(m);

  const txt = el("div", "banner-copy");
  const brand = el("div", "banner-brandmark");
  const logo = el("img");
  logo.src = "assets/logo.svg";
  logo.alt = "";
  logo.width = 34;
  logo.height = 34;
  brand.append(logo, el("span", "", "SYOLANA"));

  txt.append(
    brand,
    el("p", "eyebrow", c.eyebrow || "SYOLANA · ИММЕРСИВНАЯ ПЛАТФОРМА"),
    el("h2", "", c.title || "Ваш сайт может жить."),
    el(
      "p",
      "banner-description",
      c.description ||
        "Живые темы, музыка, иммерсивные книги, языки и публикации — в одной системе.",
    ),
  );

  const features = el("div", "banner-features");
  (c.features || ["Живые темы", "Иммерсивные книги", "Музыка", "Языки"]).forEach(
    (label) => {
      const item = el("span", "banner-feature");
      item.append(el("i", "", "✦"), document.createTextNode(label));
      features.append(item);
    },
  );
  txt.append(features);

  const row = el("div", "row banner-actions");
  (c.links || []).forEach((x, i) => {
    if (x.href === "#explore")
      row.append(button(x.label, () => zen(true), "btn banner-secondary"));
    else
      row.append(
        link(x.label, x.href, "btn " + (!i ? "primary" : "banner-secondary")),
      );
  });
  txt.append(
    row,
    el(
      "p",
      "banner-invitation",
      c.invitation || "7 дней тест-драйва · без предоплаты",
    ),
  );

  $("banner").replaceChildren(visual, txt);
}
renderBanner();
function heading(kicker, title, text) {
  const h = el("header", "hero");
  h.append(el("p", "eyebrow", kicker), el("h1", "", title));
  if (text) h.append(el("p", "muted", text));
  return h;
}
function card(book, slug) {
  const c = el("article", "card");
  if (book.cover && safeURL(book.cover, { media: true })) {
    const video = /\.mp4(?:[?#]|$)/i.test(book.cover);
    const img = el(video ? "video" : "img", "card-cover");
    img.src = safeURL(book.cover, { media: true });
    if (video) {
      img.muted = true;
      img.playsInline = true;
      motionVideo(img);
      img.setAttribute("aria-label", "Буктрейлер: " + book.title);
    } else {
      img.alt = "Обложка: " + book.title;
      img.loading = "lazy";
    }
    img.addEventListener("error", () => img.replaceWith(art(book)));
    c.append(img);
  } else c.append(art(book));
  c.append(
    el("p", "meta", book.author || "Автор Syolana"),
    el("h3", "", book.title),
    el("p", "description", book.description || ""),
  );
  c.append(
    link(
      book.external
        ? "На сайте автора ↗"
        : book.kind === "book"
          ? "Читать историю"
          : "Открыть",
      book.external ||
        (slug
          ? "#/s/" + slug + "/book/" + book.id + "/0"
          : "#/book/" + book.id + "/0"),
    ),
  );
  return c;
}
function art(book) {
  const a = el("div", "card-art");
  a.dataset.art = book.art || "stars";
  a.append(el("strong", "", book.title), el("small", "", "SYOLANA"));
  return a;
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
    el("h2", "", "Один сайт — несколько способов погрузиться"),
  );
  const body = el("div", "feed-body");
  body.append(
    el(
      "p",
      "",
      "Живые темы и режим созерцания, иммерсивное чтение со звуком, музыкальный плеер, языки и публикации работают как одна система — от личного творческого сайта до партнёрского проекта.",
    ),
    el(
      "p",
      "",
      "Партнёрам мы сначала показываем готовый результат и даём 7 дней тест-драйва — без предоплаты за знакомство.",
    ),
  );
  article.append(body);

  const actions = el("div", "promo-actions");
  actions.append(
    link("Посмотреть возможности", "#/join", "btn small"),
    link("Открыть книги", "#/library", "text-link"),
  );
  article.append(actions);
  return article;
}

async function home(token) {
  $("page").append(
    heading(
      "САЙТЫ · КНИГИ · ЯЗЫКИ · МУЗЫКА",
      "Лента вселенной",
      "Новые темы, истории, песни и творческие знакомства. Всё, чем живёт Syolana.",
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
  ["Все", "Дизайн", "Книги", "Языки", "Песни"].forEach((name) => {
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
    const response = await fetch(config.feed?.file || "feed.json");
    if (!response.ok) throw Error();
    items = await response.json();
    if (!Array.isArray(items)) items = [];
  } catch {
    items = [];
  }
  if (token !== routeToken) return;
  draw();
  apiReady.then(async () => {
    if (!api.online || token !== routeToken) return;
    try {
      const data = await api.request("feed");
      if (token === routeToken && data.posts.length) {
        items = data.posts;
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
async function library(token) {
  $("page").append(
    heading(
      "БИБЛИОТЕКА",
      "Найдите свою историю",
      "Начните с короткого текста и настройте чтение под себя.",
    ),
  );
  const rights = el("details", "notice legal-note");
  rights.append(
    el("summary", "", "О правах и источниках"),
    el(
      "p",
      "",
      "В библиотеке используются собственные произведения и тексты с проверенными правами на использование, в том числе из общественного достояния. Права на переводы, иллюстрации и записи проверяются отдельно. Материалы по внешним ссылкам размещают владельцы соответствующих сайтов. Если вы заметили нарушение, отправьте обращение — мы его рассмотрим.",
    ),
  );
  $("page").append(rights);
  const search = el("input", "search-input");
  search.type = "search";
  search.placeholder = "Название или автор";
  search.setAttribute("aria-label", "Поиск книги");
  const grid = el("div", "grid two");
  $("page").append(search, grid);
  let entries = (await loadCatalog()).map((book) => ({ book, slug: null }));
  if (token !== routeToken) return;
  function draw() {
    const q = search.value.toLocaleLowerCase();
    const found = entries.filter((x) =>
      (x.book.title + " " + x.book.author).toLocaleLowerCase().includes(q),
    );
    grid.replaceChildren(...found.map((x) => card(x.book, x.slug)));
    if (!found.length)
      grid.append(
        el("p", "empty", "Ничего не найдено. Попробуйте другое название."),
      );
  }
  search.oninput = draw;
  draw();
  if (api.online) {
    try {
      const { books } = await api.request("catalog");
      if (token !== routeToken) return;
      entries = entries.concat(
        books.map((book) => ({ book, slug: book.slug })),
      );
      draw();
    } catch {}
  }
  
}
function languages(lang = "en") {
  if (!lessons[lang]) lang = "en";
  const data = lessons[lang];
  $("page").append(
    heading(
      "ЯЗЫКИ · АВТОРСКИЕ ПОСОБИЯ",
      "Другой язык. Больше вашего мира.",
      "От первых слов к самостоятельному общению: слушать, понимать, говорить и возвращаться к выученному.",
    ),
  );
  const intro = el("section", "card stack language-intro");
  intro.append(
    el("span", "badge", lang === "en" ? "АНГЛИЙСКИЙ A1 УЖЕ ОТКРЫТ" : "НОВЫЕ ПОСОБИЯ В РАЗРАБОТКЕ"),
    el("h2", "", "Пусть язык звучит в вашей жизни"),
    el(
      "p",
      "",
      "Авторские онлайн-пособия на основе личного опыта изучения языков: правила, слова и выражения, упражнения, браузерная озвучка и повторения. Материалы предназначены для самостоятельного использования, без преподавателя, экзаменов и проверки уровня.",
    ),
    el(
      "p",
      "",
      "Английское пособие A1 открыто бесплатно: 28 разделов, браузерная озвучка, IPA, упражнения, рукописная практика и повторения. Темп выбираете вы. Обозначение A1 — ориентир сложности материалов, а не подтверждение уровня или обещание результата.",
    ),
  );
  $("page").append(intro);
  const methods = el("div", "grid two language-methods");
  for (const [title, text] of [
    [
      "Слушайте и понимайте",
      "В английском A1 есть браузерная озвучка с русским переводом и объяснениями. Голос, доступность и длительность зависят от браузера и устройства. Текст следует за текущей репликой.",
    ],
    [
      "Возвращайтесь к важному",
      "Новые слова и конструкции встречаются снова в разных ситуациях. В упражнениях можно свериться с ответами и выбрать, к каким материалам вернуться. Уровень владения языком не оценивается.",
    ],
    [
      "Пробуйте сами",
      "Отвечайте вслух, читайте и записывайте фразы от руки. В английский A1 писать можно прямо на сайте пальцем или стилусом; штрихи сохраняются на устройстве.",
    ],
    [
      "Замечайте свой прогресс",
      "На устройстве сохраняются отметки о работе с материалами и упражнениями. Можно слушать, читать, писать и произносить фразы в своём темпе. Экзаменов, проверки преподавателем, оценки уровня и выдачи документов об образовании нет.",
    ],
  ]) {
    const card = el("article", "card stack");
    card.append(el("h3", "", title), el("p", "", text));
    methods.append(card);
  }
  $("page").append(methods);
  const tabs = el("div", "pill-tabs language-tabs");
  for (const [key, value] of Object.entries(lessons)) {
    const a = link(value.name, "#/languages/" + key, "btn");
    a.setAttribute("aria-current", key === lang ? "page" : "false");
    tabs.append(a);
  }
  $("page").append(
    heading(
      "ВЫБЕРИТЕ СВОЙ ЯЗЫК",
      data.native,
      "Английский A1 доступен бесплатно. Другие уровни готовятся: продажи ещё не открыты. Состав, окончательная цена и условия доступа появятся до покупки.",
    ),
    tabs,
  );
  const levels = el("div", "grid two language-levels");
  for (const [level, description] of Object.entries({
    A1: "Первое знакомство с языком",
    A2: "Больше уверенности в повседневном общении",
    B1: "Самостоятельность и новые темы",
    B2: "Развёрнутая речь и сложные тексты",
  })) {
    const card = el("article", "card stack language-level");
    const free = lang === "en" && level === "A1";
    card.dataset.level = level;
    card.append(
      el("span", "badge", free ? "БЕСПЛАТНО ДЛЯ ВСЕХ" : "В ПОДГОТОВКЕ"),
      el("h3", "course-level", level),
      el("p", "", description),
      (() => {
        const price = el("p", "course-price");
        if (free) {
          price.textContent = "Бесплатно";
          return price;
        }
        price.textContent = "Продажи ещё не открыты";
        return price;
      })(),
      free
        ? link("Открыть английский A1", "#/lesson/en/a1/course", "btn primary")
        : link("Уточнить выпуск на Авито", businessContact("Языковое пособие " + lang + " " + level, "languages"), "btn"),
    );
    levels.append(card);
  }
  $("page").append(levels);
  const gift = el("section", "strip glass stack language-gift");
  gift.append(
    el("span", "badge", "ПОДАРОК ПАРТНЁРАМ"),
    el("h2", "", "Ваш сайт. И A1 нового языка в подарок."),
    el(
      "p",
      "",
      "Планируем включить пособие A1 одного языка, кроме английского, в отдельные партнёрские предложения после выпуска материалов. До этого бонус не входит в оплачиваемую услугу. Доступный язык и срок будут указаны в конкретном заказе. Английский A1 бесплатен для всех.",
    ),
    link("Подключить Syolana", "#/join", "btn primary"),
  );
  $("page").append(gift);
  const author = el("section", "card stack language-author");
  author.append(
    el("h3", "", "Личный опыт и самостоятельная практика"),
    el(
      "p",
      "",
      "Материалы составлены на основе личного опыта автора: понятные объяснения, слова в контексте, слушание и повторение. Это самостоятельные цифровые пособия и тренажёры; автор не проводит занятия и не проверяет ответы пользователей.",
    ),
    el(
      "p",
      "fine",
      "Английское пособие A1 уже открыто бесплатно. Другие материалы готовятся и публикуются после проверки содержания. Обозначения A1–B2 помогают ориентироваться в сложности; полное освоение уровня не гарантируется.",
    ),
  );
  $("page").append(author);
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
      "Каждому партнёру с подпиской на сайт — одна песня по его творчеству в подарок после первой оплаты. Тему и срок согласуем вместе; песня появится в общем плеере со ссылкой на проект.",
    ),
    link("Получить сайт и песню", "#/join", "btn primary"),
  );
  $("page").append(
    intro,
    heading(
      "СЕЙЧАС В ПЛЕЕРЕ",
      "Начните с мелодии",
      "Коллекция пополняется: включите любую из опубликованных песен.",
    ),
  );
  const list = el("div", "grid two songs-grid");
  player.songs.forEach((song, i) => {
    const card = el("article", "card stack");
    card.append(
      el("h3", "", song.title),
      el("p", "muted", song.sourceTitle || "Творческий проект"),
      button("Слушать песню", () => player.select(i, true), "btn primary"),
    );
    if (song.sourceUrl)
      card.append(
        link("Открыть источник вдохновения", song.sourceUrl, "text-link"),
      );
    list.append(card);
  });
  $("page").append(list);
}
function join() {
  $("page").append(
    heading(
      "ПАРТНЁРСТВО · 7 ДНЕЙ ТЕСТ-ДРАЙВА",
      "Ваш контент. Живой мир вокруг него.",
      "Для авторов, творческих проектов, студий, издательств и площадок. Ваш домен и контент остаются у вас; Syolana подключает иммерсивный слой и обновления.",
    ),
  );
  const grid = el("div", "grid two");
  const offer = el("section", "card stack");
  offer.append(
    el("span", "badge", "ТЕСТ-ДРАЙВ · ПЕРВЫЕ ПАРТНЁРЫ"),
    el("h2", "", "Сначала попробуйте."),
  );
  const price = el("p", "price", "Индивидуальная стоимость");
  price.append(
    el(
      "small",
      "",
      " · зависит от объёма, функций и формата сотрудничества",
    ),
  );
  offer.append(
    price,
    el(
      "p",
      "",
      "Готовим ваш сайт, открываем 7 дней бесплатного тест-драйва. Предоплата и банковская карта для знакомства не нужны. Решение о продолжении вы принимаете после тест-драйва.",
    ),
  );
  const ul = el("ul", "feature-list");
  [
    "Живые темы, плеер, иммерсивные блоки и обновления Syolana — поверх вашего собственного бренда",
    "Ваш домен, хостинг и контент остаются у вас; Syolana подключает оформление, темы, плеер и обновления",
    "Обновления оформления для всех подключённых сайтов",
    "Стоимость согласуем после тест-драйва; для пилотных и взаимовыгодных проектов возможны специальные условия, включая бесплатный пилот",
    "Одна песня по вашему творчеству в подарок после первой оплаты: тему и срок согласуем заранее",
    "После запуска платного партнёрства при активном доступе — A1 одного языка на выбор в подарок, кроме английского. Английский A1 бесплатен для всех; остальные уровни приобретаются отдельно",
  ].forEach((s) => ul.append(el("li", "", s)));
  const contact = el("a", "btn primary", "Обсудить мой сайт");
  contact.href = businessContact("Хочу сайт Syolana · 7 дней тест-драйва");
  if (contact.href.startsWith("https:")) { contact.target = "_blank";contact.rel = "noopener noreferrer"; }
  offer.append(ul, contact);
  grid.append(offer);
  const details = el("section", "card stack");
  details.append(
    el("h3", "", "Общий дизайн. Ваш характер."),
    el(
      "p",
      "",
      "Вы получаете сайт на основе единого оформления Syolana. Вместе подбираем структуру, разделы и первые материалы под ваше дело. Не нужно заново программировать каждую кнопку: общая система обновляется для всех.",
    ),
    el(
      "p",
      "",
      "В режиме VK вы публикуете и исправляете записи на своей публичной странице ВКонтакте. Ваш сайт автоматически получает её публичную ленту после настройки синхронизации. Syolana не создаёт и не редактирует эти записи. Вы отвечаете за свои материалы; обращения о нарушениях направляются владельцу сайта и рассматриваются также в пределах возможностей Syolana.",
    ),
    el(
      "p",
      "",
      "Ваш сайт работает на вашем домене и в вашем аккаунте хостинга. Вы управляете публикациями и медиа; Syolana подключает темы, плеер и инструменты погружения. При подключении выбираем источник записей: ваше публичное сообщество VK либо редактор Partner Studio на вашей инфраструктуре. Объём настройки, цена, сроки и контакты для ваших клиентов согласуются в заказе на Авито. Демонстрационный сайт и редактор можно попробовать бесплатно.",
    ),
    el(
      "p",
      "",
      "После окончания подписки премиальные элементы Syolana перестают подключаться, а собственный домен, хостинг и опубликованный контент партнёра остаются у него.",
    ),
    link("Обсудить настройку на Авито", businessContact(), "btn"),
    link("Посмотреть тестового партнёра", "partner-demo/", "btn"),
    link("Единые условия Syolana", "#/offer", "text-link"),
    link("Условия тест-драйва", "#/terms", "text-link"),
  );
  grid.append(details);
  $("page").append(grid);
  const scale = el("section", "card stack partner-scale");
  scale.style.marginTop = "24px";
  scale.append(
    el("span", "badge", "ДЛЯ ИЗДАТЕЛЬСТВ И ПЛОЩАДОК"),
    el("h3", "", "Иммерсия может подключаться к уже существующей экосистеме"),
    el(
      "p",
      "",
      "Для каталогов, издательств и книжных площадок интеграцию проектируем отдельно: доступы, права, закрытые книги, API и правила публикации согласуются под инфраструктуру партнёра. Syolana может оставаться отдельным иммерсивным слоем, не забирая у площадки её домен и контент.",
    ),
    link(
      "Обсудить интеграцию",
      businessContact("Интеграция Syolana для площадки или издательства"),
      "btn primary",
    ),
  );
  $("page").append(scale);

  const books = el("section", "card stack");
  books.style.marginTop = "24px";
  books.append(
    el("h3", "", "Для книг — отдельная работа с атмосферой"),
    el(
      "p",
      "",
      "Обложку, главы, смену цвета и звуковые сцены готовим и проверяем отдельно. Перед началом согласуем права, объём, стоимость и сроки. Это не обещание безошибочной автоматической обработки всей книги.",
    ),
    el(
      "p",
      "",
      "Индивидуальные закрытые книги обсуждаются отдельно: размещение возможно только при наличии прав и с учётом договоров автора с издательствами и книжными площадками.",
    ),
  );
  $("page").append(books);
  const security = el(
    "p",
    "notice",
    "Мы не требуем переводов до создания сайта и завершения бесплатного тест-драйва. Сверяйте адрес сайта и контакт " +
      businessContact() +
      ". Оплачивайте только согласованный счёт; чек выдаётся после оплаты.",
  );
  $("page").append(security);
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
  data.posts
    .filter((p) => p.kind === "book" || p.kind === "portfolio")
    .forEach((p) => grid.append(card({ ...p, author: data.site.name }, slug)));
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
async function reader({ id, slug, chapter = 0 }, token) {
  let book, data, loaded;
  if (slug) {
    data = await api.request(
      "public/" +
        encodeURIComponent(slug) +
        "/post/" +
        encodeURIComponent(id) +
        "?chapter=" +
        chapter,
    );
    if (token !== routeToken) return;
    applyEntitlement(data);
    watchAccess(slug, token, data.active);
    book = data.post;
    book.author = data.site.name;
  } else {
    loaded = await loadBook(id, chapter);
    if (token !== routeToken) return;
    book = loaded.book;
    chapter = loaded.index;
  }
  const chapters = book.chapters;
  chapter = Math.max(0, Math.min(Number(chapter) || 0, chapters.length - 1));
  const ch = slug ? data.chapter : loaded.chapter;
  document.body.classList.add("reading");
  document.title = book.title + (!slug || data.active ? " · Syolana" : "");
  const base = slug ? "#/s/" + slug + "/book/" + id : "#/book/" + id;
  const back = slug ? "#/s/" + slug : "#/library";
  const header = el("header", "reader-header");
  header.append(
    link(slug ? "Каталог автора" : "Библиотека", back, "text-link"),
    el("h1", "", book.title),
    el("p", "muted", book.author),
  );
  $("page").append(header);
  const bar = el("div", "reader-toolbar");
  const group = el("div", "row");
  group.append(
    button(
      "Оглавление",
      () => {
        $("toc-dialog").showModal();
      },
      "subtle-btn",
    ),
  );
  const smaller = button("A−", () => size(-1), "subtle-btn");
  smaller.setAttribute("aria-label", "Уменьшить текст");
  const bigger = button("A+", () => size(1), "subtle-btn");
  bigger.setAttribute("aria-label", "Увеличить текст");
  group.append(smaller, bigger);
  bar.append(group);
  const control = el("label", "", "Атмосфера");
  const select = el("select");
  [
    ["auto", "По сюжету"],
    ["neutral", "Постоянный цвет"],
  ].forEach(([k, v]) => {
    const o = el("option", "", v);
    o.value = k;
    select.append(o);
  });
  select.value = getPref("reader-mood", "auto");
  control.append(select);
  bar.append(control);
  const toggleSceneSound = async (...buttons) => {
    buttons.forEach((b) => (b.disabled = true));
    await sceneAudio.toggle();
    buttons.forEach((b) => (b.disabled = false));
    if (token === routeToken) update();
  };

  const sound = button(
    "",
    () => toggleSceneSound(sound, soundFab),
    "subtle-btn scene-toggle",
  );
  const soundIcon = el("span", "scene-toggle-icon", "🎧");
  soundIcon.setAttribute("aria-hidden", "true");
  const soundCopy = el("span", "scene-toggle-copy");
  const soundLabel = el("strong", "", "Звуковая атмосфера");
  const soundHint = el("small", "", "Включить");
  soundCopy.append(soundLabel, soundHint);
  sound.replaceChildren(soundIcon, soundCopy);

  const soundStatus = el("span", "scene-status");
  soundStatus.setAttribute("role", "status");
  const volumeLabel = el("label", "scene-volume", "Громкость атмосферы");
  const volume = el("input");
  volume.type = "range"; volume.min = "0"; volume.max = "100";
  volume.value = String(Math.round(sceneAudio.volume * 100));
  volume.setAttribute(
    "aria-label",
    "Громкость звуковой атмосферы. Максимум ограничен комфортным уровнем.",
  );
  volume.oninput = () => sceneAudio.setVolume(Number(volume.value) / 100);
  volumeLabel.append(volume);

  const soundFab = button(
    "🎧",
    () => toggleSceneSound(sound, soundFab),
    "reader-sound-fab",
  );
  soundFab.setAttribute("aria-label", "Включить звуковую атмосферу чтения");
  soundFab.setAttribute("title", "Звуковая атмосфера");

  const soundState = (event) => {
    sound.dataset.enabled = String(sceneAudio.enabled);
    soundHint.textContent = sceneAudio.enabled ? "Включена · нажмите, чтобы выключить" : "Нажмите, чтобы включить";
    sound.setAttribute("aria-pressed", String(sceneAudio.enabled));
    sound.setAttribute(
      "aria-label",
      sceneAudio.enabled
        ? "Звуковая атмосфера включена. Нажмите, чтобы выключить."
        : "Включить звуковую атмосферу чтения.",
    );
    soundFab.dataset.enabled = String(sceneAudio.enabled);
    soundFab.setAttribute("aria-pressed", String(sceneAudio.enabled));
    soundFab.setAttribute(
      "aria-label",
      sceneAudio.enabled
        ? "Выключить звуковую атмосферу чтения"
        : "Включить звуковую атмосферу чтения",
    );
    soundStatus.textContent = event?.detail?.message || "";
  };
  window.addEventListener("syolana:sceneaudio", soundState);
  soundState();
  if (Object.keys(config.sceneAudio || {}).length) {
    bar.append(sound, volumeLabel, soundStatus);
    $("page").append(bar, soundFab);
  } else {
    $("page").append(bar);
  }
  const progress = el("div", "reading-progress");
  const fill = el("div");
  progress.append(fill);
  $("page").append(progress);

  if (Object.keys(config.sceneAudio || {}).length) {
    const audioGuidance = el("aside", "reader-audio-guidance");
    audioGuidance.setAttribute("role", "note");
    audioGuidance.append(
      el("span", "reader-audio-guidance-icon", "🎧"),
      el(
        "p",
        "",
        "Для лучшего погружения слушайте тихо: музыка и звуки должны сопровождать текст, а не перекрывать его.",
      ),
    );
    $("page").append(audioGuidance);
  }

  const text = el("article", "reader-text");
  text.append(el("h2", "", ch.title));
  const rawParagraphs =
    ch.blocks ||
    ch.text
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((text) => ({ text }));

  const paragraphs = book.poetry
    ? rawParagraphs
    : rawParagraphs.flatMap((p, sceneGroup) =>
        String(p.text || "")
          .split(/\n\s*\n/)
          .map((part) => part.trim())
          .filter(Boolean)
          .map((text) => ({
            ...p,
            text,
            sceneGroup,
          })),
      );

  if (book.poetry) text.classList.add("poetry");

  paragraphs.forEach((p, i) => {
    const node = el("p", "", p.text);
    node.dataset.paragraph = i;
    node.dataset.scene = p.sceneGroup ?? i;
    node.dataset.mood =
      ch.mood && ch.mood !== "auto" ? ch.mood : moodFor(p.text);
    if (p.color) node.dataset.color = p.color;
    if (p.audio) node.dataset.audio = p.audio;
    text.append(node);
  });
  if (book.mediaUrl) {
    const m = safeURL(book.mediaUrl, { media: true });
    if (m) {
      if (/\.(mp4|webm)(\?|$)/i.test(m)) {
        const v = el("video");
        v.controls = true;
        v.playsInline = true;
        v.preload = "metadata";
        v.src = m;
        v.style.width = "100%";
        text.append(v);
      } else if (/\.(mp3|ogg|wav|m4a)(\?|$)/i.test(m)) {
        const audio = el("audio");
        audio.controls = true;
        audio.preload = "metadata";
        audio.src = m;
        audio.style.width = "100%";
        text.append(audio);
      } else text.append(link("Открыть материал", m, "text-link"));
    }
  }
  $("page").append(text);
  const end = el("div", "reader-end row between");
  if (chapter > 0)
    end.append(link("Предыдущая глава", base + "/" + (chapter - 1)));
  if (chapter < chapters.length - 1)
    end.append(
      link("Следующая глава", base + "/" + (chapter + 1), "btn primary"),
    );
  else end.append(link("В каталог", back));
  $("page").append(end);
  $("toc-list").replaceChildren();
  chapters.forEach((c, i) =>
    $("toc-list").append(
      button(
        c.title,
        () => {
          $("toc-dialog").close();
          location.hash = base + "/" + i;
        },
        "toc-item",
      ),
    ),
  );
  function size(delta = 0) {
    const next = Math.max(
      19,
      Math.min(34, Number(getPref("reader-size", 24)) + delta),
    );
    setPref("reader-size", next);
    document.documentElement.style.setProperty("--reader-size", next + "px");
  }
  size();
  const key = "reading:" + (slug || "library") + ":" + id;
  let active = 0,
    raf = 0,
    scrollReset = 0,
    lastScrollY = window.scrollY;
  const nodes = [...text.querySelectorAll("[data-paragraph]")];
  const readerMotion = !matchMedia("(prefers-reduced-motion: reduce)").matches;
  const liveNodes = new Set();
  const visibilityObserver =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) liveNodes.add(entry.target);
              else liveNodes.delete(entry.target);
            }
            if (!raf) raf = requestAnimationFrame(update);
          },
          { rootMargin: "80% 0px 80% 0px", threshold: 0 },
        )
      : null;
  visibilityObserver?.observe && nodes.forEach((node) => visibilityObserver.observe(node));

  let dragPointer = null,
    dragStartX = 0,
    dragStartY = 0;

  const resetReaderDrift = () => {
    text.style.setProperty("--reader-drift-x", "0px");
    text.style.setProperty("--reader-drift-y", "0px");
    text.classList.remove("reader-interacting");
  };

  const pointerDown = (event) => {
    if (!readerMotion || !event.isPrimary) return;
    dragPointer = event.pointerId;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    text.classList.add("reader-interacting");
  };

  const pointerMove = (event) => {
    if (!readerMotion || event.pointerId !== dragPointer) return;
    const dx = Math.max(-6, Math.min(6, (event.clientX - dragStartX) * 0.07));
    const dy = Math.max(-5, Math.min(5, (event.clientY - dragStartY) * 0.05));
    text.style.setProperty("--reader-drift-x", dx.toFixed(2) + "px");
    text.style.setProperty("--reader-drift-y", dy.toFixed(2) + "px");
  };

  const pointerUp = (event) => {
    if (event.pointerId !== dragPointer) return;
    dragPointer = null;
    resetReaderDrift();
  };

  if (readerMotion) {
    text.addEventListener("pointerdown", pointerDown, { passive: true });
    text.addEventListener("pointermove", pointerMove, { passive: true });
    window.addEventListener("pointerup", pointerUp, { passive: true });
    window.addEventListener("pointercancel", pointerUp, { passive: true });
  }

  function update() {
    raf = 0;
    const candidates = liveNodes.size ? [...liveNodes] : nodes;
    let closest = candidates[0] || nodes[0];
    let distance = Infinity;
    const anchor = innerHeight * 0.46;

    for (const p of candidates) {
      const r = p.getBoundingClientRect();
      const d =
        r.top > anchor
          ? r.top - anchor
          : r.bottom < anchor
            ? anchor - r.bottom
            : 0;

      if (d < distance) {
        closest = p;
        distance = d;
      }

      const signedDistance =
        r.top > anchor
          ? r.top - anchor
          : r.bottom < anchor
            ? r.bottom - anchor
            : 0;

      let opacity = 1;
      let shift = 0;

      if (readerMotion && signedDistance > 0) {
        const t = Math.min(
          1,
          Math.max(0, signedDistance / Math.max(1, innerHeight - anchor)),
        );
        opacity = 1 - t * 0.72;
        shift = t * 16;
      } else if (readerMotion && signedDistance < 0) {
        const t = Math.min(
          1,
          Math.abs(signedDistance) / Math.max(1, innerHeight * 0.78),
        );
        opacity = 1 - t * 0.22;
        shift = -t * 3;
      }

      p.style.opacity = opacity.toFixed(3);
      p.style.transform =
        `translate3d(var(--reader-drift-x, 0px), calc(${shift.toFixed(2)}px + var(--reader-drift-y, 0px) + var(--reader-scroll-y, 0px)), 0)`;
    }

    if (!closest) return;
    active = Number(closest.dataset.paragraph);
    const mood = select.value === "neutral" ? "neutral" : closest.dataset.mood;
    const accentColor =
      closest.dataset.color ||
      moodColors[mood] ||
      moodColors.neutral;

    document.documentElement.style.setProperty(
      "--prose",
      select.value === "neutral"
        ? "#f6f4f8"
        : `color-mix(in srgb, #f8f7fb 75%, ${accentColor} 25%)`,
    );

    if (!document.body.classList.contains("no-effects"))
      sceneAudio.scene(
        closest.dataset.audio || mood,
        `${slug || "library"}:${id}:${chapter}:${closest.dataset.scene ?? active}`,
      );
    text.dataset.atmosphere = mood;
    fill.style.width =
      Math.round(((active + 1) / Math.max(1, nodes.length)) * 100) + "%";
    setPref(key, { chapter, paragraph: active });
  }
  const scroll = () => {
    if (readerMotion) {
      const y = window.scrollY;
      const delta = y - lastScrollY;
      lastScrollY = y;
      const drift = Math.max(-3.5, Math.min(3.5, -delta * 0.06));
      text.style.setProperty("--reader-scroll-y", drift.toFixed(2) + "px");
      clearTimeout(scrollReset);
      scrollReset = setTimeout(
        () => text.style.setProperty("--reader-scroll-y", "0px"),
        85,
      );
    }
    if (!raf) raf = requestAnimationFrame(update);
  };
  window.addEventListener("scroll", scroll, { passive: true });
  select.onchange = () => {
    setPref("reader-mood", select.value);
    update();
  };
  const saved = getPref(key, null);
  if (saved && (saved.chapter !== chapter || saved.paragraph > 0)) {
    const b = button(
      "Продолжить с сохранённого места",
      () => {
        if (saved.chapter !== chapter)
          location.hash = base + "/" + saved.chapter;
        else
          nodes[Math.min(saved.paragraph, nodes.length - 1)]?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
        b.remove();
      },
      "btn small",
    );
    header.append(b);
  }
  cleanup = ({ preserveAudio = false } = {}) => {
    if (!preserveAudio) sceneAudio.stop();
    window.removeEventListener("syolana:sceneaudio", soundState);
    window.removeEventListener("scroll", scroll);
    text.removeEventListener("pointerdown", pointerDown);
    text.removeEventListener("pointermove", pointerMove);
    window.removeEventListener("pointerup", pointerUp);
    window.removeEventListener("pointercancel", pointerUp);
    visibilityObserver?.disconnect();
    liveNodes.clear();
    clearTimeout(scrollReset);
    cancelAnimationFrame(raf);
  };
  update();
}
function contactPage() {
  $("page").append(
    heading("СВЯЗАТЬСЯ С SYOLANA", "Давайте обсудим вашу идею", "Создание сайта, сотрудничество, поддержка и вопросы о материалах — в профиле Syolana на Авито."),
  );
  const card = el("section", "card stack contact-card contact-card-main");
  card.append(
    el("span", "badge", "SYOLANA · АВИТО"),
    el("h2", "", "От идеи — к вашему сайту"),
    el("p", "", "Расскажите, какой сайт вам нужен. Состав работы, стоимость, сроки и условия согласуем в личной переписке до оплаты."),
    link("Открыть профиль Syolana", businessContact(), "text-link"),
    link("Написать на Авито", businessContact(), "btn primary"),
  );
  $("page").append(card, el("p", "notice", "Заказы, поддержка и согласование оплаты — только в официальном профиле Syolana на Авито: avito.ru/brands/i223140984. Мы не просим переводить переписку в другие мессенджеры. Не оплачивайте заказы по сообщениям от других аккаунтов. На этом сайте нет формы оплаты и автоматических списаний. Способ оплаты зависит от правил и доступных функций Авито для конкретного объявления."));
}

function terms() {
  const box = el("article", "card stack");
  box.append(
    el("h1", "", "Условия тест-драйва"),
    el(
      "p",
      "notice",
      "Это предварительные условия тестовой версии. Онлайн-оплата закрыта. До платного запуска необходимы публичные сведения о владельце сайта, полная оферта и политика обработки данных с реальными реквизитами. Дополнительные сведения о конкретном заказе должны быть доступны до акцепта и оплаты.",
    ),
    el("h3", "", "Кто размещает материалы"),
    el(
      "p",
      "",
      "Владелец партнёрского сайта управляет своим доменом, хостингом и контентом и отвечает за наличие необходимых прав на тексты, изображения, музыку и видео. Публикации создаются, исправляются и удаляются партнёром в выбранном им источнике: публичном сообществе VK либо собственном Partner Studio. Его инфраструктура хранит и отображает ленту. Syolana предоставляет опциональное оформление, темы, плеер и иммерсивные функции.",
    ),
    el("h3", "", "Публикации и проверка"),
    el(
      "p",
      "",
      "Партнёр публикует материалы самостоятельно во ВКонтакте либо через редактор в своём облачном аккаунте. Syolana не создаёт и не редактирует тексты его публикаций и не обязуется проводить предварительную юридическую или редакционную проверку каждой записи. Техническая синхронизация берёт только уже публичные записи настроенного владельца страницы. При надлежащей жалобе или очевидном существенном риске Syolana может приостановить только свой подключаемый слой и прекратить сотрудничество.",
    ),
    el("h3", "", "Доступ и оплата"),
    el(
      "p",
      "",
      "Тест-драйв — 7 дней после предоставления готовой тестовой версии. На этапе тест-драйва предоплата и автоматические списания не требуются. После окончания подписки премиальные элементы Syolana перестают подключаться, а собственный домен, хостинг и контент партнёра остаются у него.",
    ),
    el("h3", "", "Данные и выгрузка"),
    el(
      "p",
      "",
      "На основном сайте в браузере сохраняются настройки темы, плеера, место чтения и учебный прогресс. Связь с Syolana и согласование оплаты происходят в официальном профиле на Авито. Партнёр управляет данными собственного сайта и редактора; доступ к его аккаунтам и порядок выгрузки согласуются отдельно.",
    ),
    el("h3", "", "Контакт"),
    link("Написать на Авито", businessContact(), "text-link"),
  );

  $("page").append(box);
}

function offerPage() {
  const box = el("article", "card stack legal-page");
  box.append(
    el("h1", "", "Единые условия Syolana"),
    el(
      "p",
      "notice",
      "Сайт Syolana — пространство для чтения, самостоятельной языковой практики, музыки, живых тем и знакомства с проектом. Здесь нет оформления заказа, приёма оплаты или автоматических списаний. Конкретные материалы, услуги и цены указываются в объявлениях официального профиля Syolana на Авито. Заказ и условия оплаты обсуждаются только в переписке с этим профилем по правилам площадки. Эти условия описывают использование сайта и не заменяют индивидуальный договор по заказу.",
    ),
    el("h3", "", "Что предоставляет Syolana"),
    el(
      "p",
      "",
      "Syolana может настраивать партнёрский сайт, подключать Syolana Core, Partner Studio, централизованные темы, плеер, иммерсивные функции и обновления, а также предоставлять цифровые языковые продукты и отдельно согласованные творческие работы.",
    ),
    el("h3", "", "Сайт и публикации партнёра"),
    el(
      "p",
      "",
      "Домен, хостинг, репозиторий, тексты, изображения и иные материалы партнёра контролируются самим партнёром. Публикации поступают из открытого сообщества VK партнёра либо из его собственного Partner Studio. В режиме VK записи изменяются во VK; в режиме Studio — в редакторе на инфраструктуре партнёра. Syolana не создаёт и не редактирует эти тексты и не проводит предварительную юридическую экспертизу каждой записи.",
    ),
    el("h3", "", "Стоимость и тест-драйв"),
    el(
      "p",
      "",
      "Стоимость партнёрского проекта определяется индивидуально до подключения и зависит от объёма, функций и формата сотрудничества. Возможны бесплатные пилоты и специальные партнёрские условия. Тест-драйв, если он предложен, не включает автоматическое списание.",
    ),
    el("h3", "", "Подключаемый слой Syolana"),
    el(
      "p",
      "",
      "Право использовать платные компоненты Syolana действует в согласованный период доступа. При его окончании новые подключения иммерсивного слоя прекращаются; домен, хостинг, базовый сайт и контент партнёра остаются у владельца. Уже загруженные браузером файлы нельзя гарантированно изъять с чужого устройства. Рекламные размещения на сайте партнёра согласуются отдельно.",
    ),
    el("h3", "", "Прекращение сотрудничества"),
    el(
      "p",
      "",
      "Syolana сохраняет возможность вручную приостановить или прекратить подключение, в том числе при жалобе, риске нарушения закона или прав третьих лиц, нарушении условий использования либо прекращении сотрудничества. Для платного периода расчёты и возвраты производятся с учётом фактически оказанных услуг, согласованных условий и обязательных требований закона.",
    ),
    el("h3", "", "Жалобы"),
    el(
      "p",
      "",
      "Обычные обращения принимаются на Авито. Адрес для юридически значимых заявлений о нарушении прав указан на странице правовой информации. По обоснованной жалобе Syolana может временно отключить свой слой и передать обращение владельцу партнёрского сайта.",
    ),
    el("h3", "", "Персональные данные"),
    el(
      "p",
      "",
      "Основной сайт не содержит форм заказа или оплаты. Демонстрационный редактор сохраняет записи в этом браузере. Обработка обращений на Авито и локальные настройки описаны на странице конфиденциальности. Владелец реального партнёрского сайта определяет правила обработки данных на своей инфраструктуре.",
    ),
    el("h3", "", "Контакт"),
    link("Написать на Авито", businessContact(), "text-link"),
  );
  $("page").append(box);
}

function privacyPage() {
  const box = el("article", "card stack legal-page");
  box.append(
    el("h1", "", "Конфиденциальность и данные"),
    el(
      "p",
      "notice",
      "Здесь описаны локальные настройки, сетевые запросы сайта и обращения в официальном профиле Syolana на Авито. На основном сайте нет формы заказа и приёма оплаты. Электронная переписка также может содержать персональные данные. Полные сведения о владельце и операторе обработки на сайте не указаны; эта страница не заменяет обязанность их раскрытия.",
    ),
    el("h3", "", "Что происходит сейчас"),
    el(
      "p",
      "",
      "Основной публичный сайт не требует обязательной регистрации. В браузере сохраняются локальные настройки темы, плеера, место чтения и учебный прогресс. Очистка данных сайта удаляет эти настройки; они не являются облачной резервной копией. Российская версия размещена в Yandex Cloud Object Storage; тестовое зеркало — на GitHub Pages. Хостинг получает сетевые данные запросов, например IP-адрес. Использование зеркала передаёт их иностранному провайдеру. Российское размещение само по себе не подтверждает полное выполнение 152-ФЗ. Браузерная озвучка зависит от голосов вашего устройства; отдельные голоса могут использовать сервис поставщика браузера или операционной системы.",
    ),
    el("h3", "", "Переписка на Авито"),
    el(
      "p",
      "",
      "При переходе на Авито вы используете внешнюю площадку по её правилам и политике данных. Информация, которую вы сообщаете в переписке, используется для ответа и согласования заказа. Эта страница не собирает текст обращения через собственную форму. Юридические заявления могут поступать по адресу, указанному в правовой информации.",
    ),
    el("h3", "", "Демонстрационный Partner Studio"),
    el(
      "p",
      "",
      "Редактор демонстрационного партнёра сохраняет созданные вами записи в локальном хранилище этого браузера. Эти записи не отправляются на сервер и не появляются у других посетителей. Реальный партнёр управляет своим редактором и данными на собственной инфраструктуре; его правила обработки данных указываются на его сайте.",
    ),
    el("h3", "", "Контакт"),
    link("Написать на Авито", businessContact(), "text-link"),
  );
  $("page").append(box);
}

function legalInfo() {
  const box = el("article", "card stack legal-page");
  box.append(
    el("h1", "", "Правовая информация"),
    el(
      "p",
      "notice",
      "Syolana — название проекта. Этот сайт предоставляет материалы и демонстрирует его возможности; он не принимает платежи. Заказы, общение и согласование оплаты проходят только в официальном профиле Syolana на Авито. Сведения и условия конкретного исполнителя сообщаются покупателю до заключения договора. Полные обязательные сведения о фактическом владельце сайта здесь не указаны.",
    ),
    el("h3", "", "Сейчас доступны"),
    link("Единые условия Syolana", "#/offer", "text-link"),
    link("Условия тест-драйва", "#/terms", "text-link"),
    link("Конфиденциальность и данные", "#/privacy", "text-link"),
    link("Подать жалобу или сообщить о нарушении", "#/report", "text-link"),
    link("Связаться на Авито", businessContact(), "text-link"),
    el("h3", "", "Юридические заявления о нарушении прав"),
    el("p", "", "Адрес для заявлений, предусмотренных статьёй 15.7 149-ФЗ: syolana@yandex.ru. Для обсуждения услуг и обычной поддержки используйте Авито."),
    el("h3", "", "Владелец сайта и исполнитель заказа"),
    el(
      "p",
      "",
      "Владелец сайта и исполнитель заказа обязаны предоставлять сведения в объёме, установленном законом. Перенос переписки и оплаты на Авито не отменяет эти обязанности. Цена, состав результата, сроки, доступ и порядок возврата согласуются до оплаты; обязательные права потребителя сохраняются. При расчётах с плательщиком НПД покупателю передаётся чек «Мой налог». Подтверждение профиля на Авито не заменяет сведения в договоре и чеке.",
    ),
  );
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
  document.title = "Syolana · Иммерсивная платформа для творчества";
  const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
  const [view, a, b, c, d] = parts;
  const informationTitles = {
    legal: "Правовая информация", offer: "Предварительные условия",
    privacy: "Конфиденциальность", terms: "Условия тест-драйва",
    report: "Обращения о нарушениях", contact: "Контакты",
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
    if (view === "home") await home(token);
    else if (view === "library") await library(token);
    else if (view === "languages") languages(a, b);
    else if (view === "songs") songsPage();
    else if (view === "lesson") {
      const key = [a, b, c].join("/");
      if (!lessonFiles[key]) throw Error("Этот урок пока не опубликован.");
      $("page").append(
        link("К уровням языка", "#/languages/" + a, "text-link"),
      );
      await openLesson(key, d ? decodeURIComponent(d) : "", token);
    } else if (view === "join") join();
    else if (view === "contact") contactPage();
    else if ((view === "studio" || view === "editor") && config.legacyStudioEnabled !== true) {
      $("page").append(
        heading("КАБИНЕТ ПАРТНЁРА", "Настройки на вашем сайте", "Кабинет подключается отдельно на инфраструктуре владельца сайта. Ссылку на него вы получаете после настройки. В режиме VK записи создаются и исправляются во ВКонтакте."),
        link("Обсудить настройку на Авито", businessContact(), "btn primary"),
      );
    } else if (view === "studio") {
      await apiReady;
      if (token === routeToken)
        await studio.render($("page"), token, () => routeToken);
    } else if (view === "admin") {
      await apiReady;
      if (token === routeToken) await studio.admin($("page"));
    } else if (view === "editor") feedEditor($("page"));
    else if (view === "book") await reader({ id: a, chapter: b }, token);
    else if (view === "s" && b === "book")
      await reader({ slug: a, id: c, chapter: d }, token);
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
}
window.addEventListener("hashchange", route);
await route();

function lessonFrame(key, anchor = "") {
  const filename = lessonFiles[key];
  if (!filename) return;
  const frame = el("iframe", "lesson-frame");
  frame.title = "Учебный материал Syolana";
  if (key === "en/a1/course") frame.allow = "microphone 'self'";
  frame.src = filename + "?embed=1";
  const status = el("p", "loading", "Открываем учебный материал…");
  $("page").append(status, frame);
  let active = true,
    anchored = false;
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
    if (typeof data.navigate === "string") {
      const url = new URL(data.navigate, location.origin);
      const file = decodeURIComponent(url.pathname.split("/").pop());
      const aliases = {
        "a2-spanish-rules.html": "es/a2/rules",
        "a2-spanish-words.html": "es/a2/words",
        "b1-spanish-rules.html": "es/b1/rules",
        "b2-spanish-rules.html": "es/b2/rules",
      };
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
    await apiReady;
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
