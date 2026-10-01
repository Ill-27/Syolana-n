import { el, link, button, getPref, setPref } from "./utils.js";
export function setupDiscovery({ theme, zen, player }) {
  const layer = el("div");
  layer.id = "flight-layer";
  layer.hidden = true;
  layer.setAttribute(
    "aria-label",
    "Полёт: перетаскивайте фон; колесо мыши или два пальца меняют глубину",
  );
  const offers = [
    ["Свой сайт", "7 дней знакомства — в подарок", "#/join"],
    ["Иммерсивные книги", "Внутрь новой истории", "#/library"],
    ["Английский A1", "Первый курс будет бесплатным", "#/languages/en"],
    ["Песня в подарок", "Ваше творчество в общем плеере", "#/songs"],
    ["Один язык в подарок", "На выбор партнёрам Syolana", "#/languages"],
  ];
  for (const [title, subtitle, url] of offers) {
    const a = link("", url, "flight-planet");
    a.append(
      el("span", "planet-orb", "✧"),
      el("strong", "", title),
      el("small", "", subtitle),
    );
    layer.append(a);
  }
  const hint = el(
    "p",
    "flight-hint",
    "Перетаскивайте фон · Колесо или два пальца — в глубину",
  );
  layer.append(hint);
  document.body.append(layer);
  const pointers = new Map();
  let pinch = 0;
  function distance() {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  }
  layer.addEventListener("pointerdown", (e) => {
    if (e.target.closest("a,button")) {
      theme.settle?.();
      return;
    }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    layer.setPointerCapture(e.pointerId);
    pinch = distance();
  });
  layer.addEventListener("pointermove", (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const dx = e.clientX - prev.x,
      dy = e.clientY - prev.y;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size > 1) {
      const next = distance();
      if (pinch && next) theme.move(0, 0, Math.log(next / pinch) * 6);
      pinch = next;
    } else
      theme.move(
        -dx / Math.max(300, innerWidth),
        -dy / Math.max(300, innerHeight),
        0,
      );
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    pinch = distance();
  };
  layer.addEventListener("pointerup", end);
  layer.addEventListener("pointercancel", end);
  layer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      theme.move(0, 0, Math.max(-160, Math.min(160, delta)) * 0.009);
    },
    { passive: false },
  );
  document.addEventListener("keydown", (e) => {
    if (
      !document.body.classList.contains("zen") ||
      e.target.closest("dialog,input,textarea,select")
    )
      return;
    const keys = {
      ArrowLeft: [-0.15, 0, 0],
      ArrowRight: [0.15, 0, 0],
      ArrowUp: [0, -0.15, 0],
      ArrowDown: [0, 0.15, 0],
      "+": [0, 0, 0.9],
      "=": [0, 0, 0.9],
      "-": [0, 0, -0.9],
    };
    if (keys[e.key]) {
      e.preventDefault();
      theme.move(...keys[e.key]);
    }
  });
  // In-page guide; no browser push subscription or permission prompt.
  const tip = el("aside", "discovery-tip glass");
  tip.id = "discovery-tip";
  tip.hidden = true;
  tip.setAttribute("aria-label", "Возможности Syolana");
  const close = button(
    "×",
    () => {
      tip.hidden = true;
      setPref("tips-dismissed", Date.now());
    },
    "icon-btn",
  );
  close.setAttribute("aria-label", "Скрыть подсказки на неделю");
  tip.append(
    close,
    el("p", "eyebrow", "ОТКРОЙТЕ SYOLANA"),
    el("h3", "", "Ваш сайт может выглядеть так же"),
    el(
      "p",
      "",
      "Общие темы, плеер и ваш собственный контент. 7 дней тест-драйва без предоплаты.",
    ),
    link("Узнать условия", "#/join", "text-link"),
  );
  document.body.append(tip);
  let shown = false;
  setTimeout(() => {
    if (
      shown ||
      Date.now() - getPref("tips-dismissed", 0) < 7 * 864e5 ||
      document.hidden ||
      document.body.matches(".reading,.zen,.no-effects") ||
      document.querySelector("dialog[open]")
    )
      return;
    shown = true;
    tip.hidden = false;
    setTimeout(() => (tip.hidden = true), 14000);
  }, 35000);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) tip.hidden = true;
  });
}
