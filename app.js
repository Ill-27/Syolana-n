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
import { ThemeEngine } from "./themes.js";
import { Player } from "./player.js";
import { API } from "./api.js";
import { lessons } from "./content.js";
import { Studio } from "./studio.js";
import { renderFeed, feedEditor } from "./feed.js";
import { setupDiscovery } from "./discovery.js";
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
  config = { songs: [], banner: {}, plan: { priceRub: 1000, trialDays: 7 } };
}
const player = new Player(config.songs || []);
const theme = new ThemeEngine();
theme
  .init()
  .catch(() => notify("Фон временно недоступен. Содержимое сайта доступно."));
const studio = new Studio(api, route);
const sceneAudio = new SceneAudio(config.sceneAudio || {}, player);
setupDiscovery({ theme, zen, player });
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
  const visual = el("div", "banner-orb");
  const media = c.media || {};
  const src = safeURL(media.src, { media: true });
  const m = el(
    src && (media.type === "video" || /\.mp4(?:[?#]|$)/i.test(src))
      ? "video"
      : "img",
    "banner-media",
  );
  m.src = src || "assets/logo.svg";
  if (m.tagName === "IMG") {
    m.alt = media.alt || "Syolana — вселенная творчества";
    m.decoding = "async";
  } else {
    const poster = safeURL(media.poster, { media: true });
    if (poster) m.poster = poster;
    motionVideo(m);
  }
  m.addEventListener(
    "error",
    () => {
      const fallback = el("img");
      fallback.src = "assets/logo.svg";
      fallback.alt = "Syolana";
      visual.replaceChildren(fallback);
    },
    { once: true },
  );
  visual.append(m);
  const txt = el("div", "banner-copy");
  txt.append(
    el("p", "eyebrow", c.eyebrow || "SYOLANA · ВСЕЛЕННАЯ ТВОРЧЕСТВА"),
    el("h2", "", c.title || "Ваше творчество. Целая вселенная."),
    el(
      "p",
      "banner-description",
      c.description || "Единый иммерсивный дизайн сайтов.",
    ),
  );
  const features = el("div", "banner-features");
  (c.features || ["Дизайн сайтов", "Книги", "Языки", "Песни"]).forEach(
    (s, i) => {
      const item = el("div");
      item.append(
        el("span", "feature-number", String(i + 1).padStart(2, "0")),
        el("span", "", s),
      );
      features.append(item);
    },
  );
  txt.append(
    features,
    el(
      "p",
      "banner-invitation",
      c.invitation || "Получите свой сайт и 7 дней бесплатно для тест-драйва.",
    ),
  );
  const row = el("div", "row");
  (c.links || []).forEach((x, i) => {
    if (x.href === "#explore")
      row.append(button(x.label, () => zen(true), "btn"));
    else row.append(link(x.label, x.href, "btn " + (!i ? "primary" : "")));
  });
  txt.append(
    row,
    el(
      "p",
      "banner-footnote",
      "Сначала готовый сайт и тест-драйв. Затем — ваше решение о сотрудничестве.",
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
async function home(token) {
  $("page").append(
    heading(
      "ДИЗАЙН · КНИГИ · ЯЗЫКИ · ПЕСНИ",
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
    button("Остаться среди звёзд", () => zen(true), "btn"),
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
  $("page").append(
    el(
      "p",
      "notice",
      "Библиотека Syolana предназначена для собственных произведений и текстов с проверенными правами на использование, в том числе из общественного достояния. Права на переводы, иллюстрации и записи проверяются отдельно. Книги по внешним ссылкам размещают владельцы соответствующих сайтов. Если вы заметили нарушение, подайте жалобу — мы рассмотрим обращение.",
    ),
  );
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
  $("page").append(
    el(
      "p",
      "notice",
      "На внешних страницах оформление и условия определяются владельцами этих сайтов.",
    ),
  );
}
function languages(lang = "en") {
  if (!lessons[lang]) lang = "en";
  const data = lessons[lang];
  $("page").append(
    heading(
      "ЯЗЫКИ · АВТОРСКАЯ ПРОГРАММА",
      "Другой язык. Больше вашего мира.",
      "От первых слов к самостоятельному общению: слушать, понимать, говорить и возвращаться к выученному.",
    ),
  );
  const intro = el("section", "card stack language-intro");
  intro.append(
    el("span", "badge", "НОВЫЕ КУРСЫ В РАЗРАБОТКЕ"),
    el("h2", "", "Пусть язык звучит в вашей жизни"),
    el(
      "p",
      "",
      "Мы готовим последовательные курсы A1–B2: правила, слова и выражения в понятном контексте, тренажёры и система повторений. Цели каждого уровня сверяем с CEFR и программой конкретного языка.",
    ),
    el(
      "p",
      "",
      "Первый полный курс английского A1 будет бесплатным для всех. Познакомьтесь с подходом Syolana и выберите, какой мир открыть следующим.",
    ),
  );
  $("page").append(intro);
  const methods = el("div", "grid two language-methods");
  for (const [title, text] of [
    [
      "Слушайте и понимайте",
      "В готовящихся уроках — озвучка языка с русским переводом и объяснениями. Планируем около 60 минут на день; без русского — около 30 минут. Текст будет следовать за озвучкой, чтобы можно было заниматься без постоянных нажатий.",
    ],
    [
      "Возвращайтесь к важному",
      "Новые слова и конструкции встречаются снова в разных ситуациях. Регулярное повторение и короткие проверки помогут увидеть, что уже освоено, а к чему ещё стоит вернуться.",
    ],
    [
      "Пробуйте сами",
      "Отвечайте вслух, читайте и записывайте фразы от руки — стилусом или в тетради. Аудио станет частью занятий, а задания на речь и письмо помогут применять язык самостоятельно.",
    ],
    [
      "Замечайте свой прогресс",
      "В конце уровня — внутренний пробный экзамен Syolana с заданиями на понимание, речь и письмо. Книги и фильмы будем подбирать по навыкам, которые вы уже подтвердили на практике.",
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
      "Стоимость отдельного курса каждого уровня после его выхода.",
    ),
    tabs,
  );
  const levels = el("div", "grid two language-levels");
  const prices = config.languageProgram?.pricesRub || {
    A1: 500,
    A2: 1000,
    B1: 2000,
    B2: 4000,
  };
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
      el("span", "badge", free ? "БЕСПЛАТНО ДЛЯ ВСЕХ" : "ОТДЕЛЬНЫЙ КУРС"),
      el("h3", "course-level", level),
      el("p", "", description),
      el(
        "p",
        "course-price",
        free ? "Бесплатно" : Number(prices[level]).toLocaleString("ru") + " ₽",
      ),
      el("p", "fine", "Готовится к выпуску"),
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
      "При действующей подписке на сайт Syolana за 1 000 ₽ в месяц — уровень A1 одного языка на выбор в подарок, кроме английского. Остальные уровни и курсы приобретаются отдельно. Английский A1 остаётся бесплатным для всех.",
    ),
    link("Хочу такой же сайт", "#/join", "btn primary"),
  );
  $("page").append(gift);
  const author = el("section", "card stack language-author");
  author.append(
    el("h3", "", "Из личного опыта — в общую практику"),
    el(
      "p",
      "",
      "Автор Syolana знакома с более чем 20 языками и развивает программу на основе собственных занятий и опыта обучения близких. В её основе — регулярное слушание, понятные объяснения, повторение и письмо от руки.",
    ),
    el(
      "p",
      "fine",
      "Полные курсы и итоговые задания сейчас создаются. Покупки откроются после публикации программы и условий доступа к конкретному уровню.",
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
      "ХОЧУ ТАКОЙ ЖЕ САЙТ",
      "Ваше дело заслуживает красивого мира.",
      "Для писателей, музыкантов, фотографов, дизайнеров, блогеров, турагентов и всех, кто создаёт своё.",
    ),
  );
  const grid = el("div", "grid two");
  const offer = el("section", "card stack");
  offer.append(
    el("span", "badge", "ТЕСТ-ДРАЙВ · ПЕРВЫЕ ПАРТНЁРЫ"),
    el("h2", "", "Сначала попробуйте."),
  );
  const price = el(
    "p",
    "price",
    Number(config.plan.priceRub || 1000).toLocaleString("ru") + " ₽",
  );
  price.append(el("small", "", " / месяц после тест-драйва"));
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
    "Общие темы, логотип, баннер, кнопки и плеер Syolana — как на этом сайте",
    "Ваши тексты, ссылки, каталог работ и лента публикаций",
    "Обновления оформления для всех подключённых сайтов",
    "1 000 ₽ в месяц на 12 месяцев с первой оплаты для первых партнёров",
    "Одна песня по вашему творчеству в подарок после первой оплаты: тему и срок согласуем заранее",
    "Уровень A1 одного языка на выбор в подарок при активной подписке, кроме английского. Остальные уровни и курсы — отдельно платно. Английский A1 будет бесплатным для всех",
  ].forEach((s) => ul.append(el("li", "", s)));
  const contact = el("a", "btn primary", "Обсудить мой сайт");
  contact.href =
    "mailto:" +
    config.contactEmail +
    "?subject=" +
    encodeURIComponent("Хочу сайт Syolana · 7 дней тест-драйва");
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
      "Публикации отправляются через редактор и появляются после проверки правил платформы. Политическая и религиозная агитация, оскорбления, материалы 18+ и противоправный контент не подходят формату Syolana. Решение можно обсудить с поддержкой.",
    ),
    el(
      "p",
      "",
      "На старте: до 50 публикаций, 200 МБ загруженных медиа и 20 МБ на файл. Объёмные видео можно разместить на внешнем видеосервисе и добавить ссылку. Другие объёмы согласуем до подключения.",
    ),
    el(
      "p",
      "",
      "После окончания доступа оформление, плеер и элементы Syolana отключаются. Опубликованное содержание сохраняется в простом виде; тексты и медиа можно выгрузить. Независимый домен и хостинг обсуждаются отдельно.",
    ),
    link("Вход в редактор моего сайта", "#/studio", "btn"),
    link("Условия тест-драйва", "#/terms", "text-link"),
  );
  grid.append(details);
  $("page").append(grid);
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
      config.contactEmail +
      ". Оплачивайте только согласованный счёт; чек выдаётся после оплаты.",
  );
  $("page").append(security);
}
async function publicSite(slug, token) {
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
    let closest = nodes[0];
    let distance = Infinity;
    const anchor = innerHeight * 0.46;

    for (const p of nodes) {
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
    clearTimeout(scrollReset);
    cancelAnimationFrame(raf);
  };
  update();
}
function terms() {
  const box = el("article", "card stack");
  box.append(
    el("h1", "", "Условия тест-драйва"),
    el(
      "p",
      "notice",
      "Это описание функций тестовой версии. Перед платным запуском оператор должен опубликовать окончательную оферту и политику обработки данных со своими реквизитами.",
    ),
    el("h3", "", "Кто размещает материалы"),
    el(
      "p",
      "",
      "Автор отвечает за наличие прав на тексты, изображения, музыку и видео, которые он загружает. Syolana предоставляет редактор, размещение и оформление. Ответственность сторон определяется применимым законом и договором.",
    ),
    el("h3", "", "Публикации и проверка"),
    el(
      "p",
      "",
      "Черновики доступны владельцу. Публикации и изменения проходят проверку правил платформы до появления на сайте; проверку может выполнять администратор. Автоматическая ИИ-проверка пока не подключена. Не допускаются противоправные материалы, оскорбления и травля, контент 18+, политическая и религиозная агитация. Ограничения тематики — правила платформы, а не утверждение, что вся такая тематика запрещена законом. Проверка может ошибаться; свяжитесь с нами для пересмотра решения.",
    ),
    el("h3", "", "Доступ и оплата"),
    el(
      "p",
      "",
      "Пробный доступ — 7 дней после одобрения первой страницы. Онлайн-оплата в этой версии выключена до настройки платёжного провайдера и окончательных документов. Автоматическое списание не включается. После окончания доступа опубликованный текст сохраняется в простом оформлении.",
    ),
    el("h3", "", "Данные и выгрузка"),
    el(
      "p",
      "",
      "Сервер сохраняет учётную запись, профиль, черновики, материалы и историю рассмотрения заявок. Пароль хранится в виде вычисленного хеша. Локально в браузере сохраняются настройки темы, плеера и место чтения. В студии можно скачать свои тексты.",
    ),
    el("h3", "", "Контакт"),
    link("sy@syolana.com", "mailto:sy@syolana.com", "text-link"),
  );
  const contact = box.lastChild;
  contact.href = "mailto:sy@syolana.com";
  $("page").append(box);
}
function report() {
  const box = el("section", "auth card stack");
  box.append(
    el("h1", "", "Подать жалобу"),
    el(
      "p",
      "muted",
      "Укажите страницу, причину жалобы и способ связаться с вами. Для авторских прав приложите описание вашего права и конкретного материала.",
    ),
  );
  const form = el("form", "form");
  for (const [name, label, type] of [
    ["url", "Ссылка на страницу", "url"],
    ["email", "Ваш email", "email"],
    ["reason", "Описание обращения", "textarea"],
  ]) {
    const l = el("label", "field", label);
    const input = el(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    input.name = name;
    input.required = true;
    input.maxLength = type === "textarea" ? 5000 : 500;
    l.append(input);
    form.append(l);
  }
  const submit = el("button", "btn primary", "Отправить обращение");
  submit.type = "submit";
  form.append(submit);
  form.onsubmit = async (e) => {
    e.preventDefault();
    submit.disabled = true;
    try {
      if (!api.online)
        throw Error("Форма пока не подключена. Напишите на sy@syolana.com.");
      await api.request("reports", {
        method: "POST",
        body: Object.fromEntries(new FormData(form)),
      });
      form.replaceChildren(
        el(
          "p",
          "notice",
          "Обращение зарегистрировано. Оно поступило в очередь администратора.",
        ),
      );
    } catch (err) {
      notify(err.message);
      submit.disabled = false;
    }
  };
  box.append(form);
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
  document.body.classList.remove("reading", "no-effects");
  theme.setBlocked(false);
  document.documentElement.style.setProperty("--prose", moodColors.neutral);
  $("page").replaceChildren();
  window.scrollTo({ top: 0, behavior: "instant" });
  document.title = "Syolana · Вселенная творчества";
  const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
  const [view, a, b, c, d] = parts;
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
    else if (view === "studio") {
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
        ["heading", "body", "accent", "dim", "surface", "radius"].map((k) => [
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
