import { el, link, button, getPref, setPref } from "./utils.js";
import { setupFlightLayer, platformFlightOffers } from "./flight.js";

export function setupDiscovery({ theme, zen, player }) {
  setupFlightLayer({
    theme,
    offers: platformFlightOffers(document.baseURI),
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
        "mailto:syolana@yandex.ru?subject=" +
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
      !document.hidden &&
      !document.body.matches(".reading,.zen,.no-effects,.information-view") &&
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
        hideTip();
      },
      "icon-btn",
    );
    close.setAttribute("aria-label", "Закрыть эту подсказку");

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
  window.addEventListener("hashchange", hideTip);
}
