import { ThemeEngine } from "./themes.js";

const ROOT = new URL("./", import.meta.url);
const byId = (id) => document.getElementById(id);

function node(tag, cls = "", text = "") {
  const el = document.createElement(tag);
  if (cls) el.className = cls;
  if (text) el.textContent = text;
  return el;
}

function addStyles() {
  for (const [id, href] of [
    ["syolana-partner-fonts", new URL("assets/fonts/fonts.css", ROOT).href],
    ["syolana-partner-core-style", new URL("partner-core.css", ROOT).href],
  ]) {
    if (byId(id)) continue;
    const link = node("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.append(link);
  }
}

function iconButton(id, label, html) {
  const button = node("button", "sy-core-icon");
  button.id = id;
  button.type = "button";
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = html;
  return button;
}

function buildChrome() {
  const aurora = node("div", "sy-core-aurora aurora-background");
  aurora.setAttribute("aria-hidden", "true");
  for (const cls of ["one", "two", "three"]) aurora.append(node("span", "aurora-layer " + cls));

  const canvas = node("canvas");
  canvas.id = "starCanvas";
  canvas.setAttribute("aria-hidden", "true");

  const top = node("header", "sy-core-top-bar");
  top.id = "syolana-core-chrome";

  const brand = node("a", "sy-core-brand");
  brand.href = new URL("./", ROOT).href;
  brand.target = "_blank";
  brand.rel = "noopener";
  brand.setAttribute("aria-label", "Открыть Syolana");

  const logo = node("img");
  logo.src = new URL("assets/logo.svg", ROOT).href;
  logo.alt = "";
  logo.width = 47;
  logo.height = 47;

  const brandText = node("span");
  brandText.append(
    node("strong", "", "Syolana"),
    node("small", "", "ИММЕРСИВНАЯ ПЛАТФОРМА"),
  );
  brand.append(logo, brandText);

  const actions = node("div", "sy-core-actions top-actions");
  const theme = iconButton("theme-toggle", "Выбрать тему", "✧");
  const zen = iconButton(
    "zen-toggle",
    "Режим созерцания",
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  );
  const full = iconButton(
    "fullscreen",
    "На весь экран",
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>',
  );

  actions.append(theme, zen, full);
  top.append(brand, actions);

  const flight = node("div", "sy-core-flight-layer");
  flight.id = "flight-layer";
  flight.hidden = true;
  flight.append(
    node(
      "div",
      "flight-hint",
      "Перетаскивайте мир · колесо или два пальца — в глубину",
    ),
  );

  document.body.prepend(aurora, canvas, top, flight);
  return { aurora, canvas, top, flight, zen, full };
}

function buildThemeDialog() {
  const dialog = node("dialog", "sy-core-dialog");
  dialog.id = "theme-dialog";

  const head = node("div", "sy-core-dialog-head");
  const titleWrap = node("div");
  titleWrap.append(
    node("div", "eyebrow", "АТМОСФЕРА"),
    node("h2", "", "Выберите свой мир"),
  );

  const close = iconButton("", "Закрыть", "×");
  close.onclick = () => dialog.close();
  head.append(titleWrap, close);

  const list = node("div");
  list.id = "theme-list";

  const current = node("span");
  current.id = "theme-name";
  current.hidden = true;

  dialog.append(head, list, current);
  document.body.append(dialog);

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
  return dialog;
}

function buildBanner(partnerName = "", config = {}) {
  const slot = byId("platform-banner-slot") || byId("syolana-banner-slot");
  if (!slot) return null;

  const bannerConfig = config.banner || {};
  slot.hidden = false;

  const banner = node("aside", "sy-core-banner");
  banner.setAttribute("aria-label", "О Syolana");

  const mark = node("div", "sy-core-banner-mark");
  const logo = node("img");
  logo.src = new URL("assets/logo.svg", ROOT).href;
  logo.alt = "";
  mark.append(logo, node("span", "", "SYOLANA"));

  banner.append(
    mark,
    node(
      "div",
      "eyebrow",
      bannerConfig.eyebrow || "ИММЕРСИВНАЯ ПЛАТФОРМА ДЛЯ ТВОРЧЕСТВА",
    ),
    node("h2", "", bannerConfig.title || "Ваш сайт — живой мир."),
    node(
      "p",
      "",
      bannerConfig.description ||
        (partnerName
          ? `${partnerName} использует живые темы и иммерсивные функции Syolana.`
          : "Живые темы, музыка, иммерсивное чтение и публикации — в одной системе."),
    ),
  );

  const features = node("div", "sy-core-features");
  const labels =
    Array.isArray(bannerConfig.features) && bannerConfig.features.length
      ? bannerConfig.features
      : ["Живые темы", "Музыка", "Иммерсивное чтение", "Обновления"];

  for (const label of labels.slice(0, 4)) {
    features.append(node("span", "sy-core-feature", label));
  }

  const actions = node("div", "sy-core-banner-actions");
  const cta = node(
    "a",
    "sy-core-cta",
    bannerConfig.links?.[0]?.label || "Открыть Syolana",
  );
  const href = bannerConfig.links?.[0]?.href || "#/join";
  cta.href = new URL(href, ROOT).href;
  cta.target = "_blank";
  cta.rel = "noopener";
  actions.append(cta);

  banner.append(
    features,
    actions,
    node(
      "p",
      "sy-core-note",
      bannerConfig.invitation ||
        "Иммерсивный слой активен, пока действует сотрудничество.",
    ),
  );

  slot.replaceChildren(banner);
  return banner;
}

async function buildPlayer(config = {}) {
  const songs = (config.songs || []).filter((song) => song?.src);
  if (!songs.length) return null;

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.28;

  const dock = node("aside", "sy-core-player");
  dock.setAttribute("aria-label", "Музыкальный плеер Syolana");

  const track = node("div", "sy-core-track");
  track.append(node("span", "sy-core-track-icon", "♫"));
  const copy = node("div");
  const title = node("strong", "", "Музыка Syolana");
  const subtitle = node("small", "", "Откройте музыкальную библиотеку");
  copy.append(title, subtitle);
  track.append(copy);

  const controls = node("div", "sy-core-player-controls");
  const prev = node("button", "", "‹");
  const play = node("button", "play", "▶");
  const next = node("button", "", "›");
  prev.type = play.type = next.type = "button";
  prev.setAttribute("aria-label", "Предыдущая песня");
  play.setAttribute("aria-label", "Слушать");
  next.setAttribute("aria-label", "Следующая песня");
  controls.append(prev, play, next);
  dock.append(track, controls);
  document.body.append(dock);

  let index = 0;

  function select(i, autoplay = false) {
    index = (i + songs.length) % songs.length;
    const song = songs[index];
    title.textContent = song.title || "Музыка Syolana";
    subtitle.textContent = song.sourceTitle || song.artist || "Syolana";
    audio.src = new URL(song.src, ROOT).href;
    audio.load();
    play.textContent = "▶";
    if (autoplay) audio.play().catch(() => {});
  }

  prev.onclick = () => select(index - 1, true);
  next.onclick = () => select(index + 1, true);
  play.onclick = () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  audio.addEventListener("playing", () => (play.textContent = "❚❚"));
  audio.addEventListener("pause", () => (play.textContent = "▶"));
  audio.addEventListener("ended", () => select(index + 1, true));

  select(0, false);
  return { dock, audio };
}

function setupFullscreen(button) {
  const sync = () => {
    const active = Boolean(
      document.fullscreenElement || document.webkitFullscreenElement,
    );
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      active ? "Выйти из полноэкранного режима" : "На весь экран",
    );
  };

  button.onclick = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        await (document.exitFullscreen || document.webkitExitFullscreen).call(
          document,
        );
      } else {
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
}

function setupZen(theme, button, flight) {
  let active = false;
  const pointers = new Map();
  let lastSingle = null;
  let lastDistance = 0;

  const sync = () => {
    document.body.classList.toggle("syolana-zen", active);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute(
      "aria-label",
      active ? "Вернуть интерфейс" : "Режим созерцания",
    );
    flight.hidden = !active;
    theme.setZen(active);
  };

  button.onclick = () => {
    active = !active;
    sync();
  };

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && active) {
      active = false;
      sync();
    }
  });

  window.addEventListener(
    "wheel",
    (e) => {
      if (!active) return;
      e.preventDefault();
      theme.move(
        0,
        0,
        Math.max(-0.34, Math.min(0.34, e.deltaY * 0.0014)),
      );
    },
    { passive: false },
  );

  window.addEventListener("pointerdown", (e) => {
    if (
      !active ||
      e.target.closest(".sy-core-top-bar,.sy-core-player,.sy-core-dialog")
    )
      return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1)
      lastSingle = { x: e.clientX, y: e.clientY };

    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      lastDistance = Math.hypot(a.x - b.x, a.y - b.y);
    }
  });

  window.addEventListener("pointermove", (e) => {
    if (!active || !pointers.has(e.pointerId)) return;

    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.size === 1 && lastSingle) {
      const dx = (e.clientX - lastSingle.x) / Math.max(320, innerWidth);
      const dy = (e.clientY - lastSingle.y) / Math.max(480, innerHeight);
      theme.move(-dx * 0.9, -dy * 0.9, 0);
      lastSingle = { x: e.clientX, y: e.clientY };
    } else if (pointers.size >= 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (lastDistance)
        theme.move(0, 0, (distance - lastDistance) * 0.004);
      lastDistance = distance;
    }
  });

  const release = (e) => {
    pointers.delete(e.pointerId);
    if (!pointers.size) {
      lastSingle = null;
      lastDistance = 0;
      theme.settle?.();
    }
  };

  window.addEventListener("pointerup", release);
  window.addEventListener("pointercancel", release);
}

export async function mountPartnerCore({ partnerName = "" } = {}) {
  if (window.__syolanaPartnerMounted)
    return window.__syolanaPartnerMounted;

  addStyles();
  document.documentElement.classList.add("syolana-partner-active");

  let config = {};
  try {
    config = await fetch(new URL("config.json", ROOT), {
      cache: "no-store",
    }).then((r) => (r.ok ? r.json() : {}));
  } catch {}

  const chrome = buildChrome();
  const dialog = buildThemeDialog();
  const banner = buildBanner(partnerName, config);
  const player = await buildPlayer(config);

  const theme = new ThemeEngine();
  await theme.init();

  setupFullscreen(chrome.full);
  setupZen(theme, chrome.zen, chrome.flight);

  const api = {
    theme,
    destroy() {
      document.documentElement.classList.remove("syolana-partner-active");
      document.body.classList.remove("syolana-zen");
      player?.audio?.pause();
      player?.dock?.remove();
      dialog.remove();
      banner?.remove();
      chrome.aurora.remove();
      chrome.canvas.remove();
      chrome.top.remove();
      chrome.flight.remove();
      byId("syolana-partner-fonts")?.remove();
      byId("syolana-partner-core-style")?.remove();
      window.__syolanaPartnerMounted = null;
    },
  };

  window.__syolanaPartnerMounted = api;
  return api;
}
