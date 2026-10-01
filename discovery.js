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
  // Soft in-app feature cards. They never request browser-notification
  // permission and appear at most twice per session.
  const tip = el("aside", "discovery-tip glass");
  tip.id = "discovery-tip";
  tip.hidden = true;
  tip.setAttribute("aria-label", "Возможности Syolana");
  tip.setAttribute("aria-live", "polite");
  document.body.append(tip);

  const tips = [
    {
      eyebrow: "НОВЫЕ МИРЫ",
      title: "А какой фон придумали бы вы?",
      text:
        "Мы постоянно выпускаем новые живые темы и каждую делаем с душой. Расскажите нам об образе или атмосфере, которую хочется увидеть — возможно, следующая тема начнётся с вашей идеи.",
      label: "Предложить идею",
      href:
        "mailto:sy@syolana.com?subject=" +
        encodeURIComponent("Идея новой темы Syolana"),
    },
    {
      eyebrow: "ИММЕРСИВНОЕ ЧТЕНИЕ",
      title: "Историю можно не только читать",
      text:
        "В книгах Syolana текст меняет оттенок, фон остаётся живым, а звуки и музыка мягко следуют за сценой. Всё можно отключить одним нажатием.",
      label: "Открыть библиотеку",
      href: "#/library",
    },
    {
      eyebrow: "РЕЖИМ СОЗЕРЦАНИЯ",
      title: "Иногда интерфейс лучше просто отпустить",
      text:
        "Спрячьте страницу и полетайте внутри выбранной темы: в стороны, вверх, вниз и в глубину. Это отдельный способ почувствовать атмосферу сайта.",
      label: "Попробовать режим",
      action: () => zen(true),
    },
    {
      eyebrow: "ДЛЯ АВТОРОВ И ПРОЕКТОВ",
      title: "Ваше творчество может жить так же",
      text:
        "Сайт, живые темы, музыкальный плеер и ваше содержание собираются в одно пространство. Сначала — готовый результат и 7 дней тест-драйва.",
      label: "Посмотреть условия",
      href: "#/join",
    },
  ];

  let shown = 0;
  let snoozed = false;
  let cursor = Number(getPref("tip-cursor", 0)) || 0;
  let hideTimer = 0;
  let showTimer = 0;

  function eligibleForTip() {
    return (
      !snoozed &&
      Date.now() - getPref("tips-dismissed", 0) >= 7 * 864e5 &&
      !document.hidden &&
      !document.body.matches(".reading,.zen,.no-effects") &&
      !document.querySelector("dialog[open]")
    );
  }

  function hideTip() {
    clearTimeout(hideTimer);
    tip.hidden = true;
  }

  function renderTip(spec) {
    const close = button(
      "×",
      () => {
        snoozed = true;
        hideTip();
        setPref("tips-dismissed", Date.now());
      },
      "icon-btn",
    );
    close.setAttribute("aria-label", "Скрыть подсказки на неделю");

    const action = spec.action
      ? button(
          spec.label,
          () => {
            hideTip();
            spec.action();
          },
          "text-link tip-action",
        )
      : link(spec.label, spec.href, "text-link tip-action");

    tip.replaceChildren(
      close,
      el("p", "eyebrow", spec.eyebrow),
      el("h3", "", spec.title),
      el("p", "", spec.text),
      action,
    );

    tip.hidden = false;
    clearTimeout(hideTimer);
    hideTimer = setTimeout(hideTip, 14000);
  }

  function scheduleTip(delay) {
    clearTimeout(showTimer);
    showTimer = setTimeout(() => {
      if (shown >= 2 || snoozed) return;

      if (!eligibleForTip()) {
        scheduleTip(22000);
        return;
      }

      const spec = tips[cursor % tips.length];
      cursor = (cursor + 1) % tips.length;
      setPref("tip-cursor", cursor);
      shown += 1;
      renderTip(spec);

      if (shown < 2) scheduleTip(72000);
    }, delay);
  }

  scheduleTip(30000);

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) hideTip();
  });
}
