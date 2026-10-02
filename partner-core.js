import { ThemeEngine } from "./themes.js";

const CORE_BASE = new URL("./", import.meta.url);
const DEFAULT_JOIN = "https://ill-27.github.io/Syolana-n/#/join";
let mounted = null;

function el(tag, cls = "", text = "") {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text) node.textContent = text;
  return node;
}

function iconButton(label, html) {
  const b = el("button", "syolana-icon-btn");
  b.type = "button";
  b.setAttribute("aria-label", label);
  b.title = label;
  b.innerHTML = html;
  return b;
}

async function fetchConfig() {
  return fetch(new URL("config.json", CORE_BASE), { cache: "no-store" }).then((r) => {
    if (!r.ok) throw new Error("Syolana config unavailable");
    return r.json();
  });
}

function resolveMedia(raw) {
  if (!raw || typeof raw !== "string") return "";
  try {
    return new URL(raw, CORE_BASE).href;
  } catch {
    return "";
  }
}

function makeBackground(root) {
  const bg = el("div", "aurora-background syolana-core-background");
  bg.setAttribute("aria-hidden", "true");
  for (const cls of ["one", "two", "three"]) bg.append(el("div", "aurora-layer " + cls));

  const canvas = el("canvas", "syolana-core-canvas");
  canvas.id = "starCanvas";
  canvas.setAttribute("aria-hidden", "true");

  root.append(bg, canvas);
}

function makeThemeDialog(root) {
  const dialog = el("dialog", "syolana-theme-dialog");
  dialog.id = "theme-dialog";
  const head = el("div", "syolana-dialog-head");
  const copy = el("div");
  copy.append(el("p", "eyebrow", "АТМОСФЕРА"), el("h2", "", "Выберите свой мир"));
  const close = iconButton("Закрыть", "×");
  close.onclick = () => dialog.close();
  head.append(copy, close);
  const list = el("div");
  list.id = "theme-list";
  dialog.append(head, list);
  root.append(dialog);
  return dialog;
}

function makeControls(host, root) {
  const controls = el("div", "top-actions syolana-controls");
  controls.dataset.syolanaUi = "controls";

  const themeToggle = iconButton("Выбрать тему", "✧");
  themeToggle.id = "theme-toggle";

  const zenToggle = iconButton(
    "Режим созерцания",
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
  );
  zenToggle.id = "zen-toggle";
  zenToggle.setAttribute("aria-pressed", "false");

  const fullscreen = iconButton(
    "На весь экран",
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5"/></svg>',
  );
  fullscreen.id = "fullscreen";
  fullscreen.setAttribute("aria-pressed", "false");

  controls.append(themeToggle, zenToggle, fullscreen);
  host.append(controls);

  const flight = el("div", "syolana-flight-layer");
  flight.id = "flight-layer";
  flight.hidden = true;
  const hint = el(
    "div",
    "flight-hint syolana-flight-hint",
    "Перемещайтесь в пространстве, используя мышь или жесты",
  );
  flight.append(hint);
  root.append(flight);

  return { controls, themeToggle, zenToggle, fullscreen, flight };
}

function makeBanner(config, mountPoint) {
  const c = config.banner || {};
  const banner = el("aside", "syolana-banner");
  banner.dataset.syolanaUi = "banner";

  const brand = el("div", "syolana-banner-brand");
  const logo = el("img");
  logo.src = new URL("assets/logo.svg", CORE_BASE).href;
  logo.alt = "";
  brand.append(logo, el("span", "", "SYOLANA"));

  banner.append(
    brand,
    el("p", "eyebrow", c.eyebrow || "ИММЕРСИВНАЯ ПЛАТФОРМА"),
    el("h2", "", c.title || "Ваш сайт — живой мир."),
    el(
      "p",
      "",
      c.description ||
        "Живые темы, музыка, иммерсивные книги, языки и публикации — в одной системе.",
    ),
  );

  const features = el("div", "syolana-banner-features");
  for (const item of c.features || []) {
    const chip = el("span", "syolana-banner-feature");
    chip.append(el("i", "", "✦"), document.createTextNode(item));
    features.append(chip);
  }
  banner.append(features);

  const actions = el("div", "syolana-banner-actions");
  const primary = el("a", "primary", "Подключить Syolana");
  primary.href = DEFAULT_JOIN;
  const explore = el("button", "", "Попробовать вживую");
  explore.type = "button";
  actions.append(primary, explore);
  banner.append(actions, el("p", "syolana-banner-note", c.invitation || "7 дней тест-драйва · без предоплаты"));

  mountPoint.prepend(banner);
  return { banner, explore };
}

function makeMusicDock(config, root) {
  const songs = (config.songs || [])
    .map((song) => ({ ...song, src: resolveMedia(song.src) }))
    .filter((song) => song.src);

  if (!songs.length) {
    const themeName = el("span", "syolana-theme-name");
    themeName.id = "theme-name";
    themeName.hidden = true;
    root.append(themeName);
    return {
      destroy() {
        themeName.remove();
      },
    };
  }

  const dock = el("aside", "syolana-music-dock");
  dock.dataset.syolanaUi = "music";
  const track = el("div", "syolana-track");
  const title = el("strong", "", "Музыка Syolana");
  const subtitle = el("small", "", "Музыкальная библиотека");
  track.append(title, subtitle);

  const transport = el("div", "syolana-transport");
  const prev = el("button", "", "‹");
  const play = el("button", "", "▶");
  const next = el("button", "", "›");
  prev.type = play.type = next.type = "button";
  prev.setAttribute("aria-label", "Предыдущая песня");
  play.setAttribute("aria-label", "Слушать");
  next.setAttribute("aria-label", "Следующая песня");
  transport.append(prev, play, next);

  const themeName = el("span", "syolana-theme-name", "Тема");
  themeName.id = "theme-name";
  dock.append(track, transport, themeName);

  const audio = new Audio();
  audio.preload = "none";
  audio.volume = 0.42;
  let index = 0;

  function select(nextIndex, autoplay = false) {
    index = (nextIndex + songs.length) % songs.length;
    const song = songs[index];
    audio.src = song.src;
    title.textContent = song.title || "Музыка Syolana";
    subtitle.textContent = song.artist || song.sourceTitle || "Syolana";
    play.textContent = "▶";
    if (autoplay) audio.play().catch(() => {});
  }

  play.onclick = () => {
    if (audio.paused) audio.play().catch(() => {});
    else audio.pause();
  };
  prev.onclick = () => select(index - 1, true);
  next.onclick = () => select(index + 1, true);
  audio.onplay = () => (play.textContent = "Ⅱ");
  audio.onpause = () => (play.textContent = "▶");
  audio.onended = () => select(index + 1, true);

  select(0, false);
  root.append(dock);

  return {
    dock,
    audio,
    destroy() {
      audio.pause();
      audio.src = "";
      dock.remove();
    },
  };
}

function wireFullscreen(button) {
  const sync = () => {
    const active = Boolean(document.fullscreenElement || document.webkitFullscreenElement);
    button.setAttribute("aria-pressed", String(active));
    button.setAttribute("aria-label", active ? "Выйти из полноэкранного режима" : "На весь экран");
  };
  button.onclick = async () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement) {
        await (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      } else {
        const fn = document.documentElement.requestFullscreen || document.documentElement.webkitRequestFullscreen;
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

function wireFlight(theme, flight) {
  const pointers = new Map();
  let pinch = 0;
  const distance = () => {
    const pts = [...pointers.values()];
    if (pts.length < 2) return 0;
    return Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
  };

  const down = (e) => {
    if (e.pointerType === "touch") return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    flight.setPointerCapture?.(e.pointerId);
    pinch = distance();
  };
  const move = (e) => {
    if (e.pointerType === "touch") return;
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x;
    const dy = e.clientY - prev.y;
    prev.x = e.clientX;
    prev.y = e.clientY;
    pointers.set(e.pointerId, prev);
    if (pointers.size > 1) {
      const next = distance();
      if (pinch && next) theme.move(0, 0, Math.log(next / pinch) * 6);
      pinch = next;
    } else {
      theme.move(-dx / 180, -dy / 180, 0);
    }
  };
  const up = (e) => {
    pointers.delete(e.pointerId);
    pinch = distance();
    theme.settle?.();
  };

  let touchLast = null;
  let touchPinch = 0;
  const touchDistance = (list) =>
    list.length >= 2
      ? Math.hypot(list[0].clientX - list[1].clientX, list[0].clientY - list[1].clientY)
      : 0;

  const touchStart = (e) => {
    if (e.touches.length === 1) {
      touchLast = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      touchPinch = 0;
    } else if (e.touches.length >= 2) {
      touchLast = null;
      touchPinch = touchDistance(e.touches);
    }
  };
  const touchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      if (touchLast) theme.move(-(t.clientX - touchLast.x) / 165, -(t.clientY - touchLast.y) / 165, 0);
      touchLast = { x: t.clientX, y: t.clientY };
      touchPinch = 0;
    } else if (e.touches.length >= 2) {
      const next = touchDistance(e.touches);
      if (touchPinch && next) theme.move(0, 0, Math.log(next / touchPinch) * 4.2);
      touchPinch = next;
      touchLast = null;
    }
  };
  const touchEnd = (e) => {
    if (e.touches.length === 1) touchLast = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    else {
      touchLast = null;
      touchPinch = 0;
      theme.settle?.();
    }
  };
  const wheel = (e) => {
    e.preventDefault();
    theme.move(0, 0, Math.max(-160, Math.min(160, e.deltaY)) * 0.009);
  };

  flight.addEventListener("pointerdown", down);
  flight.addEventListener("pointermove", move);
  flight.addEventListener("pointerup", up);
  flight.addEventListener("pointercancel", up);
  flight.addEventListener("touchstart", touchStart, { passive: true });
  flight.addEventListener("touchmove", touchMove, { passive: false });
  flight.addEventListener("touchend", touchEnd, { passive: true });
  flight.addEventListener("touchcancel", touchEnd, { passive: true });
  flight.addEventListener("wheel", wheel, { passive: false });

  return () => {
    flight.removeEventListener("pointerdown", down);
    flight.removeEventListener("pointermove", move);
    flight.removeEventListener("pointerup", up);
    flight.removeEventListener("pointercancel", up);
    flight.removeEventListener("touchstart", touchStart);
    flight.removeEventListener("touchmove", touchMove);
    flight.removeEventListener("touchend", touchEnd);
    flight.removeEventListener("touchcancel", touchEnd);
    flight.removeEventListener("wheel", wheel);
  };
}

export async function mountPartnerCore(options = {}) {
  if (mounted) return mounted;

  const root = document.body;
  const header = document.querySelector(options.headerSelector || ".site-header");
  const main = document.querySelector(options.mainSelector || "main");
  if (!header || !main) throw new Error("Partner shell unavailable");

  const style = document.createElement("link");
  style.rel = "stylesheet";
  style.href = new URL("partner-core.css", CORE_BASE).href;
  style.dataset.syolanaCore = "style";
  document.head.append(style);

  document.documentElement.classList.add("syolana-active");
  makeBackground(root);
  const dialog = makeThemeDialog(root);
  const controls = makeControls(header, root);
  const config = await fetchConfig();
  const banner = makeBanner(config, main);
  const music = makeMusicDock(config, root);

  const theme = new ThemeEngine();
  await theme.init();

  let zen = false;
  const setZen = (active) => {
    zen = Boolean(active);
    document.body.classList.toggle("syolana-zen", zen);
    controls.flight.hidden = !zen;
    controls.zenToggle.setAttribute("aria-pressed", String(zen));
    controls.zenToggle.setAttribute("aria-label", zen ? "Вернуть интерфейс" : "Режим созерцания");
    theme.setZen?.(zen);
  };
  controls.zenToggle.onclick = () => setZen(!zen);
  banner.explore.onclick = () => setZen(true);

  const unwireFlight = wireFlight(theme, controls.flight);
  const unwireFullscreen = wireFullscreen(controls.fullscreen);
  const esc = (e) => {
    if (e.key === "Escape" && zen) setZen(false);
  };
  document.addEventListener("keydown", esc);

  mounted = {
    theme,
    setZen,
    destroy() {
      setZen(false);
      unwireFlight();
      unwireFullscreen();
      document.removeEventListener("keydown", esc);
      theme.custom?.dispose?.();
      music.destroy();
      dialog.remove();
      controls.controls.remove();
      controls.flight.remove();
      banner.banner.remove();
      document.querySelectorAll(".syolana-core-background,.syolana-core-canvas,[data-syolana-core='style']").forEach((n) => n.remove());
      document.documentElement.classList.remove("syolana-active");
      mounted = null;
    },
  };

  return mounted;
}
