import {installAPITransport} from "./api-transport.js?v=20261011-workspace-6";
installAPITransport();
import {renderSiteBlocks,renderContactLinks} from './site-builder.js';
import {validateSiteSettings} from './builder-model.mjs';
import { loadCatalog, loadBook } from "./catalog.js?v=20261009-artivid-1";
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
import { ThemeEngine } from "./themes.js?v=20261012-zen-polish-2";
import { SceneAudio } from "./scene-audio.js?v=20261012-zen-polish-2";
document.querySelector(".skip-link").onclick = (e) => {
  e.preventDefault();
  $("page").focus();
  $("page").scrollIntoView();
};

let config;
try {
  config = await fetch("config.json", {
    signal: AbortSignal.timeout(6000),
  }).then((r) => r.json());
} catch {
  config = { songs: [], banner: {}, plan: { pricing: "custom", priceRub: null, trialDays: 7 } };
}
const player = { pause() {} };
const theme = new ThemeEngine();
const themeReady = theme
  .init()
  .catch(() => notify("Фон временно недоступен. Содержимое сайта доступно."));

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
    m.alt = media.alt || "Артивид";
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
      fallback.alt = "Артивид";
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
  brand.append(logo, el("span", "", "АРТИВИД"));

  txt.append(
    brand,
    el("p", "eyebrow", c.eyebrow || "ЧТЕНИЕ СО ЗВУКОМ"),
    el("h2", "", c.title || "История звучит. Темп выбираете вы."),
    el(
      "p",
      "banner-description",
      c.description ||
        "Музыка и окружающие звуки сопровождают текст. Темп чтения выбираете вы.",
    ),
  );

  const features = el("div", "banner-features");
  (c.features || ["В своём темпе", "Музыка и звуки сцен", "Сохранение места"]).forEach(
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
      c.invitation || "Чтение в вашем темпе · звуки по нажатию",
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
    el("p", "meta", book.author || "Автор"),
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
  a.append(el("strong", "", book.title), el("small", "", "АРТИВИД"));
  return a;
}

async function library(token) {
 let settings=await fetch('site-settings.json',{cache:'no-store'}).then(r=>r.json());
 try{const r=await fetch('/api/course-access/studio/artivid/public',{cache:'no-store',signal:AbortSignal.timeout(6000)});if(r.ok){const d=await r.json();if(d.settings)settings=validateSiteSettings(d.settings,{books:true});}}catch{}
 if(token!==routeToken)return;
 await themeReady;
 if(settings.theme){try{await theme.select(settings.theme);}catch{}}
 $("page").append(heading("КНИГИ СО ЗВУКОВЫМИ СЦЕНАМИ",settings.tagline||settings.name,settings.description));
 const blocks=el("div","site-blocks");$("page").append(blocks);let catalogHost=null;
 if(settings.contacts)$("page").append(renderContactLinks(settings.contacts));
 renderSiteBlocks(blocks,settings,{books:(root,b)=>{catalogHost=el("section","book-catalog");catalogHost.id="books";catalogHost.append(el("h2","",b.title||"Книги"));root.append(catalogHost);}});
 if(catalogHost){const search=el("input","search-input");search.type="search";search.placeholder="Книга или автор";search.setAttribute("aria-label","Поиск книги");const grid=el("div","grid two");catalogHost.append(search,grid);
 const books=await loadCatalog();if(token!==routeToken)return;
 function draw(){const q=search.value.trim().toLocaleLowerCase("ru");const found=books.filter(b=>(b.title+" "+b.author).toLocaleLowerCase("ru").includes(q));grid.replaceChildren(...found.map(b=>card(b)));if(!found.length)grid.append(el("p","empty","Не нашли книгу. Попробуйте другое название."));}search.oninput=draw;draw();}
 const author=el("details","card stack");author.append(el("summary","","Для авторов и правообладателей"),el("p","","Хотите предложить первую книгу для Артивида? Обсудим права на текст, работу со сценами, условия подписки и вознаграждение до публикации. Права на ваше произведение остаются у вас."),link("Обсудить книгу на Авито",businessContact(),"btn"));$("page").append(author);
}
function info(view){const box=el("section","card stack legal-page");
 const parts=view==="privacy"?[["Конфиденциальность","Артивид не требует регистрации для бесплатной классики. Место чтения, тема и громкость сохраняются в браузере этого устройства. Очистка данных браузера удаляет их; облачной копии нет."],["Сетевые запросы","Тексты, оформление и звуки загружаются с текущего адреса сайта. Провайдер получает технические данные запросов. Текст обращения и сведения об авторе вы сообщаете в переписке на Авито по правилам площадки."],["Платная коллекция","Она пока не открыта. Правила обработки данных и сведения о фактическом операторе будут опубликованы до платного запуска."]]:[["Условия чтения","Опубликованная классика доступна бесплатно. Музыка и окружающие звуки включаются по вашему нажатию. Читайте в удобном темпе и возвращайтесь к сохранённому месту."],["Права на материалы","Тексты классиков находятся в общественном достоянии в России. Звуковое оформление и интерфейс охраняются отдельно. Современные книги публикуются только после получения необходимых прав; подписка на них пока не продаётся."],["Обращения","Вопросы о проекте и сотрудничестве — в официальном профиле Syolana на Авито. Заявления о нарушении прав: syolana@yandex.ru. Артивид — отдельный книжный проект на шаблоне Syolana."]];
 parts.forEach(([title,text],i)=>box.append(el(i?"h3":"h1","",title),el("p","",text)));box.append(link("Вернуться к книгам","#/","btn"));$("page").append(box);
}
async function reader({ id, slug, chapter = 0 }, token) {
  let book, data, loaded;
  loaded = await loadBook(id, chapter);
  if (token !== routeToken) return;
  book = loaded.book; chapter = loaded.index;
  const chapters = book.chapters;
  chapter = Math.max(0, Math.min(Number(chapter) || 0, chapters.length - 1));
  const ch = slug ? data.chapter : loaded.chapter;
  document.body.classList.add("reading");
  document.title = book.title + (!slug || data.active ? " · Артивид" : "");
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

async function route(){const token=++routeToken;const reading=/^#\/book\//.test(location.hash);cleanup({preserveAudio:reading});if(!reading)sceneAudio.stop();cleanup=()=>{};zen(false);document.body.classList.remove("reading");$("page").replaceChildren();window.scrollTo({top:0,behavior:"instant"});const [view,id,index]=(location.hash.replace(/^#\/?/,"")||"home").split("/");$("banner").hidden=reading||["privacy","terms"].includes(view);document.title="Артивид · Книги в вашем темпе";try{if(view==="book")await reader({id,chapter:index},token);else if(["privacy","terms"].includes(view))info(view);else {await library(token);if(view==="books")$("books")?.scrollIntoView({behavior:"smooth",block:"start"});}}catch(error){sceneAudio.stop();$("page").replaceChildren(el("p","notice",error.message),link("К книгам","#/","btn"));}}
window.addEventListener("hashchange",route);await route();
