const CORE_BASE = new URL("./", import.meta.url);
let mounted = null;

const make = (tag, cls = "", text = "") => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== "") node.textContent = text;
  return node;
};

const central = (path) => new URL(path, CORE_BASE).href;

async function readJSON(path) {
  const response = await fetch(central(path), { cache: "no-store" });
  if (!response.ok) throw new Error("Central Syolana resource unavailable: " + path);
  return response.json();
}

function resolveSong(song) {
  const next = { ...song };
  if (next.src) next.src = central(next.src);
  if (next.sourceUrl) {
    if (next.sourceUrl.startsWith("#")) next.sourceUrl = central(next.sourceUrl);
    else if (!/^https?:/i.test(next.sourceUrl)) next.sourceUrl = central(next.sourceUrl);
  }
  return next;
}

function buildBackground() {
  const aurora = make("div", "aurora-background");
  aurora.dataset.syolanaInjected = "true";
  aurora.setAttribute("aria-hidden", "true");
  ["one", "two", "three"].forEach((name) =>
    aurora.append(make("div", "aurora-layer " + name)),
  );

  const canvas = make("canvas");
  canvas.id = "starCanvas";
  canvas.dataset.syolanaInjected = "true";
  canvas.setAttribute("aria-hidden", "true");

  document.body.prepend(canvas);
  document.body.prepend(aurora);
}

function buildTopBar(partner) {
  const header = make("header", "top-bar");
  header.id = "chrome";
  header.dataset.syolanaInjected = "true";

  const brand = make("a", "brand glass");
  brand.href = "#top";
  brand.setAttribute("aria-label", (partner.name || "Проект") + " — главная");

  const mark = make("span", "partner-brand-mark", partner.brandMark || "•");
  if (partner.logoUrl) {
    mark.textContent = "";
    const img = make("img");
    img.src = partner.logoUrl;
    img.alt = "";
    img.width = 47;
    img.height = 47;
    mark.append(img);
  }

  const copy = make("span");
  copy.append(
    make("strong", "", partner.name || "Имя проекта"),
    make("small", "", partner.tagline || "АВТОРСКИЙ САЙТ"),
  );
  brand.append(mark, copy);

  const actions = make("div", "top-actions");

  const themeToggle = make("button", "icon-btn glass", "✧");
  themeToggle.id = "theme-toggle";
  themeToggle.type = "button";
  themeToggle.title = "Выбрать тему";
  themeToggle.setAttribute("aria-label", "Выбрать тему");

  const zenToggle = make("button", "icon-btn glass");
  zenToggle.id = "zen-toggle";
  zenToggle.type = "button";
  zenToggle.title = "Режим созерцания";
  zenToggle.setAttribute("aria-label", "Режим созерцания");
  zenToggle.setAttribute("aria-pressed", "false");
  zenToggle.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>';

  const fullscreen = make("button", "icon-btn glass");
  fullscreen.id = "fullscreen";
  fullscreen.type = "button";
  fullscreen.title = "На весь экран";
  fullscreen.setAttribute("aria-label", "На весь экран");
  fullscreen.setAttribute("aria-pressed", "false");
  fullscreen.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>';

  actions.append(themeToggle, zenToggle, fullscreen);
  header.append(brand, actions);
  document.body.prepend(header);

  return { header, themeToggle, zenToggle, fullscreen };
}

function buildBanner(config) {
  const c = config.partnerBanner || config.banner || {};
  const banner = make("aside", "banner glass");
  banner.id = "banner";
  banner.dataset.syolanaInjected = "true";
  banner.setAttribute("aria-label", "О Syolana");

  const visual = make("div", "banner-orb");
  const media = c.media || {};
  const src = media.src ? central(media.src) : "";
  const node =
    src && (media.type === "video" || /\.mp4(?:[?#]|$)/i.test(src))
      ? make("video", "banner-media")
      : make("img", "banner-media");

  node.src = src || central("assets/logo.svg");
  if (node.tagName === "VIDEO") {
    node.muted = true;
    node.defaultMuted = true;
    node.autoplay = true;
    node.loop = true;
    node.playsInline = true;
    node.preload = "metadata";
    node.setAttribute("muted", "");
    node.setAttribute("playsinline", "");
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
      node.play().catch(() => {});
  } else {
    node.alt = media.alt || "Syolana";
    node.decoding = "async";
  }
  visual.append(node);

  const copy = make("div", "banner-copy");
  const badge = make("div", "banner-brandmark");
  const logo = make("img");
  logo.src = central("assets/logo.svg");
  logo.alt = "";
  logo.width = 28;
  logo.height = 28;
  badge.append(logo, make("span", "", "SYOLANA"));

  copy.append(
    badge,
    make("p", "eyebrow", c.eyebrow || "ИММЕРСИВНАЯ ПЛАТФОРМА"),
    make("h2", "", c.title || "Ваш сайт — живой мир."),
    make(
      "p",
      "banner-description",
      c.description ||
        "Живые темы, музыка, иммерсивные книги, языки и публикации — в одной системе.",
    ),
  );

  const features = make("div", "banner-features");
  (c.features || []).forEach((label) => {
    const item = make("span", "banner-feature");
    item.append(make("i", "", "✦"), document.createTextNode(label));
    features.append(item);
  });
  copy.append(features);

  const row = make("div", "row banner-actions");
  let zenAction = null;
  (c.links || []).forEach((item, index) => {
    if (item.href === "#explore") {
      const button = make("button", "btn banner-secondary", item.label);
      button.type = "button";
      button.dataset.zenAction = "true";
      zenAction = button;
      row.append(button);
      return;
    }

    const link = make(
      "a",
      "btn " + (!index ? "primary" : "banner-secondary"),
      item.label,
    );
    link.href = item.href?.startsWith("#")
      ? central(item.href)
      : item.href || central("#/join");
    if (/^https?:/i.test(link.href)) {
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    }
    row.append(link);
  });

  copy.append(
    row,
    make(
      "p",
      "banner-invitation",
      c.invitation || "7 дней тест-драйва · без предоплаты",
    ),
  );

  banner.append(visual, copy);
  return { banner, zenAction };
}

function buildPlatformPitch(config) {
  const c = config.partnerPitch || {};
  const section = make("section", "partner-platform-pitch glass");
  section.dataset.syolanaInjected = "true";
  section.setAttribute("aria-label", "О платформе Syolana");

  const copy = make("div", "partner-platform-pitch-copy");
  copy.append(
    make("p", "eyebrow", c.eyebrow || "SYOLANA · ЕДИНАЯ ПЛАТФОРМА"),
    make("h2", "", c.title || "Один сайт — целая творческая экосистема."),
    make(
      "p",
      "partner-platform-pitch-text",
      c.text ||
        "Живые 3D-темы, музыка и звуковые сцены, иммерсивные книги, языковые курсы, публикации и режим созерцания работают как одна система и обновляются вместе с Syolana.",
    ),
  );

  const features = make("div", "partner-platform-pitch-features");
  (c.features || [
    "Живые темы",
    "Музыка",
    "Книги со звуком",
    "Языки",
    "Публикации",
    "Автообновления",
  ]).forEach((label) => {
    const item = make("span", "partner-platform-pitch-feature");
    item.append(make("i", "", "✦"), document.createTextNode(label));
    features.append(item);
  });
  copy.append(features);

  const actions = make("div", "row partner-platform-pitch-actions");
  const primary = make("a", "btn primary", c.primaryLabel || "Открыть Syolana");
  primary.href = central(c.primaryHref || "#/");
  primary.target = "_blank";
  primary.rel = "noopener noreferrer";

  const secondary = make(
    "a",
    "btn banner-secondary",
    c.secondaryLabel || "Получить свой сайт",
  );
  secondary.href = central(c.secondaryHref || "#/join");
  secondary.target = "_blank";
  secondary.rel = "noopener noreferrer";

  actions.append(primary, secondary);
  copy.append(actions);

  const note = make(
    "p",
    "partner-platform-pitch-note",
    c.note ||
      "Вы сейчас на сайте партнёра Syolana. Такой же иммерсивный слой можно подключить к вашему проекту.",
  );

  section.append(copy, note);
  return section;
}

function buildMainNav() {
  const nav = make("nav", "main-nav");
  nav.id = "main-nav";
  nav.dataset.syolanaInjected = "true";
  nav.setAttribute("aria-label", "Разделы сайта");
  for (const [label, href] of [
    ["Публикации", "#feed"],
    ["О проекте", "#about"],
  ]) {
    const a = make("a", "", label);
    a.href = href;
    nav.append(a);
  }
  return nav;
}

function buildThemeDialog() {
  const dialog = make("dialog");
  dialog.id = "theme-dialog";
  dialog.dataset.syolanaInjected = "true";
  dialog.innerHTML =
    '<div class="dialog-head"><div><p class="eyebrow">АТМОСФЕРА</p><h2>Выберите свой мир</h2></div><button class="icon-btn" data-close aria-label="Закрыть">×</button></div><div id="theme-list" class="theme-list"></div><p class="muted">При обновлении страницы может открыться другая тема. Во время просмотра выбранная атмосфера сохраняется.</p>';
  document.body.append(dialog);
  return dialog;
}

function buildPlayerUI() {
  const dock = make("aside", "music-dock glass");
  dock.id = "music-dock";
  dock.dataset.syolanaInjected = "true";
  dock.setAttribute("aria-label", "Музыкальный плеер");
  dock.innerHTML =
    '<button id="player-expand" class="track-summary" aria-expanded="false" aria-controls="player-dialog"><span class="track-art" aria-hidden="true">♫</span><span><strong id="dock-title">Музыка Syolana</strong><small id="dock-subtitle">Откройте музыкальную библиотеку</small></span></button><div class="dock-transport"><button id="dock-prev" class="icon-btn" aria-label="Предыдущая песня">‹</button><button id="dock-play" class="icon-btn play" aria-label="Слушать">▶</button><button id="dock-next" class="icon-btn" aria-label="Следующая песня">›</button></div><span id="theme-name" class="dock-theme">Тема</span>';

  const audio = make("audio");
  audio.id = "audio";
  audio.preload = "none";
  audio.dataset.syolanaInjected = "true";

  const dialog = make("dialog");
  dialog.id = "player-dialog";
  dialog.dataset.syolanaInjected = "true";
  dialog.innerHTML =
    '<div class="dialog-head"><div><p class="eyebrow">МУЗЫКАЛЬНАЯ БИБЛИОТЕКА</p><h2>Истории, ставшие песнями</h2></div><button class="icon-btn" data-close aria-label="Свернуть плеер">×</button></div><p id="player-name" class="player-name"></p><a id="source-link" class="text-link" hidden>Открыть источник вдохновения</a><p id="player-status" class="muted" role="status"></p><label class="sr-only" for="seek">Позиция воспроизведения</label><input id="seek" type="range" min="0" max="1000" value="0" disabled/><div class="time-row"><span id="elapsed">0:00</span><span id="duration">0:00</span></div><div class="player-transport"><button id="prev" class="icon-btn" aria-label="Предыдущая песня">‹</button><button id="play" class="btn primary">Слушать</button><button id="next" class="icon-btn" aria-label="Следующая песня">›</button></div><div class="player-modes"><button id="shuffle" class="btn" aria-pressed="false">Вперемешку</button><button id="repeat" class="btn">Повтор: выключен</button></div><label class="volume-row">Громкость<input id="volume" type="range" min="0" max="1" step="0.01" value="0.65"/></label><ol id="playlist" class="playlist"></ol><p class="muted fine">Музыка запускается по нажатию и продолжается во время просмотра сайта.</p>';

  document.body.append(dock, audio, dialog);
  return { dock, audio, dialog };
}

function buildToast() {
  const toast = make("div", "toast glass");
  toast.id = "toast";
  toast.hidden = true;
  toast.dataset.syolanaInjected = "true";
  toast.setAttribute("role", "status");
  document.body.append(toast);
}

function closeDialogs() {
  document
    .querySelectorAll("dialog [data-close]")
    .forEach((button) => (button.onclick = () => button.closest("dialog")?.close()));

  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog.addEventListener("click", (event) => {
      if (event.target !== dialog) return;
      const r = dialog.getBoundingClientRect();
      if (
        event.clientX < r.left ||
        event.clientX > r.right ||
        event.clientY < r.top ||
        event.clientY > r.bottom
      )
        dialog.close();
    });
  });
}

function wireFullscreen(button) {
  const sync = () => {
    const active = Boolean(
      document.fullscreenElement || document.webkitFullscreenElement,
    );
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      active ? "Выйти из полноэкранного режима" : "На весь экран",
    );
    button.title = button.getAttribute("aria-label");
  };

  button.onclick = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement)
        await (document.exitFullscreen || document.webkitExitFullscreen).call(
          document,
        );
      else {
        const fn =
          document.documentElement.requestFullscreen ||
          document.documentElement.webkitRequestFullscreen;
        if (fn) await fn.call(document.documentElement);
      }
    } catch {}
    sync();
  };

  document.addEventListener("fullscreenchange", sync);
  document.addEventListener("webkitfullscreenchange", sync);

  return () => {
    document.removeEventListener("fullscreenchange", sync);
    document.removeEventListener("webkitfullscreenchange", sync);
  };
}

export async function mountPartnerCore(options = {}) {
  if (mounted) return mounted;

  const partner = options.partner || {};
  const version = String(options.version || Date.now());

  document.documentElement.classList.add("syolana-active");
  document.body.classList.add("partner-site", "syolana-active");

  const fallbackHeader = document.querySelector(".site-header");
  if (fallbackHeader) fallbackHeader.hidden = true;

  const main = document.querySelector("main");
  const footer = document.querySelector("footer");
  if (!main) throw new Error("Partner content unavailable");

  const shell = make("div", "shell");
  shell.id = "content-shell";
  shell.dataset.syolanaInjected = "true";

  const parent = main.parentNode;
  parent.insertBefore(shell, main);
  shell.append(main);
  if (footer) shell.append(footer);

  buildBackground();
  const controls = buildTopBar(partner);
  const config = await readJSON("config.json");
  const { banner, zenAction } = buildBanner(config);
  const pitch = buildPlatformPitch(config);
  const nav = buildMainNav();
  shell.prepend(nav);
  shell.prepend(pitch);
  shell.prepend(banner);

  // The visual shell is complete at this point. Reveal it immediately while
  // the selected 3D theme finishes initializing in the background.
  window.dispatchEvent(new CustomEvent("syolana:shell-ready"));

  const themeDialog = buildThemeDialog();
  const playerUI = buildPlayerUI();
  buildToast();
  closeDialogs();

  const [{ ThemeEngine }, { Player }, { setupFlightLayer, platformFlightOffers }] = await Promise.all([
    import(central("themes.js") + "?v=" + encodeURIComponent(version)),
    import(central("player.js") + "?v=" + encodeURIComponent(version)),
    import(central("flight.js") + "?v=" + encodeURIComponent(version)),
  ]);

  const player = new Player((config.songs || []).map(resolveSong));
  const theme = new ThemeEngine();
  await theme.init();

  const flight = setupFlightLayer({
    theme,
    offers: platformFlightOffers(CORE_BASE),
    markInjected: true,
  });

  const setZen = (active) => {
    const next = Boolean(active);
    document.body.classList.toggle("zen", next);
    controls.zenToggle.setAttribute("aria-pressed", String(next));
    controls.zenToggle.setAttribute(
      "aria-label",
      next ? "Вернуть интерфейс" : "Режим созерцания",
    );
    controls.zenToggle.title = controls.zenToggle.getAttribute("aria-label");
    shell.inert = next;
    theme.setZen?.(next);
  };

  controls.zenToggle.onclick = () =>
    setZen(!document.body.classList.contains("zen"));
  zenAction?.addEventListener("click", () => setZen(true));

  const unwireFullscreen = wireFullscreen(controls.fullscreen);

  const escape = (e) => {
    if (e.key === "Escape" && document.body.classList.contains("zen"))
      setZen(false);
  };
  document.addEventListener("keydown", escape);

  mounted = {
    theme,
    player,
    setZen,
    destroy() {
      setZen(false);
      unwireFullscreen();
      document.removeEventListener("keydown", escape);
      playerUI.audio.pause();
      theme.custom?.dispose?.();

      document
        .querySelectorAll("[data-syolana-injected='true']")
        .forEach((node) => node.remove());

      if (shell.isConnected) {
        parent.insertBefore(main, shell);
        if (footer) parent.insertBefore(footer, shell);
        shell.remove();
      }

      if (fallbackHeader) fallbackHeader.hidden = false;
      document.documentElement.classList.remove("syolana-active");
      document.body.classList.remove("partner-site", "syolana-active", "zen");
      mounted = null;
    },
  };

  return mounted;
}
