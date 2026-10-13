import { b as registerTranslations, c as currentLocale, d as t } from "./chunk-chunk-RYPJ2WDE.js";

const MAIN_URL = "https://syolana.com/";
const YANDEX_URL = "https://syolana.website.yandexcloud.net/";
const AVITO_URL = "https://www.avito.ru/brands/i223140984";

registerTranslations({
  "Проверка подлинности": ["Authenticity check", "Verificación de autenticidad", "Vérification d’authenticité"],
  "Официальные адреса Syolana": ["Official Syolana addresses", "Direcciones oficiales de Syolana", "Adresses officielles de Syolana"],
  "Только 2 адреса": ["Only 2 addresses", "Solo 2 direcciones", "Seulement 2 adresses"],
  "Используйте только адреса ниже. Общение, заказы и согласование оплаты — только через официальный профиль Syolana на Авито. Сайты и аккаунты с другими адресами не относятся к Syolana.": [
    "Use only the addresses below. Messages, orders and payment arrangements are handled only through Syolana’s official Avito profile. Websites and accounts using other addresses are not affiliated with Syolana.",
    "Utiliza únicamente las direcciones indicadas abajo. La comunicación, los pedidos y los acuerdos de pago se gestionan solo a través del perfil oficial de Syolana en Avito. Los sitios y cuentas con otras direcciones no pertenecen a Syolana.",
    "Utilisez uniquement les adresses ci-dessous. Les échanges, commandes et modalités de paiement passent uniquement par le profil officiel Syolana sur Avito. Les sites et comptes utilisant d’autres adresses ne sont pas liés à Syolana."
  ],
  "Перед входом или оплатой сверяйте адрес в строке браузера.": [
    "Before signing in or paying, check the address in your browser bar.",
    "Antes de iniciar sesión o pagar, comprueba la dirección en la barra del navegador.",
    "Avant de vous connecter ou de payer, vérifiez l’adresse dans la barre du navigateur."
  ],
  "Основной сайт": ["Main website", "Sitio principal", "Site principal"],
  "Резервный адрес": ["Backup address", "Dirección alternativa", "Adresse de secours"],
  "Открыть официальный сайт": ["Open official website", "Abrir el sitio oficial", "Ouvrir le site officiel"],
  "Написать на Авито": ["Contact on Avito", "Contactar en Avito", "Contacter sur Avito"]
});

function avitoMark() {
  return `
    <svg class="syolana-avito-mark" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <circle cx="8" cy="8" r="5.2" fill="#00AAFF"/>
      <circle cx="20" cy="7" r="4.3" fill="#FF4053"/>
      <circle cx="8" cy="20" r="4.3" fill="#97CF26"/>
      <circle cx="20" cy="20" r="5.2" fill="#A169F7"/>
    </svg>`;
}

function shieldMark() {
  return `
    <svg class="syolana-trust-shield" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 2.9 19 5.7v5.8c0 4.7-2.8 8-7 9.7-4.2-1.7-7-5-7-9.7V5.7L12 2.9Z" fill="none" stroke="currentColor" stroke-width="1.55"/>
      <path d="m8.55 12 2.15 2.15 4.75-4.95" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function arrowMark() {
  return `
    <svg class="syolana-trust-arrow" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
      <path d="M5.5 10h8.2m-3.1-3.2L13.8 10l-3.2 3.2" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function installStyles() {
  if (document.getElementById("syolana-trust-ui-style")) return;
  const style = document.createElement("style");
  style.id = "syolana-trust-ui-style";
  style.textContent = `
#syolana-official-notice{position:relative;isolation:isolate;overflow:hidden;margin:18px 0 26px;padding:24px 24px 22px;border:1px solid color-mix(in srgb,var(--panel-border,rgba(255,255,255,.16)) 86%,transparent);border-radius:calc(var(--radius,24px) * .92);background:linear-gradient(145deg,color-mix(in srgb,var(--panel-bg,rgba(18,19,31,.78)) 92%,transparent),rgba(var(--surface,12,12,25),.5));box-shadow:0 18px 52px rgba(0,0,0,.13),inset 0 1px 0 rgba(255,255,255,.055);backdrop-filter:blur(20px) saturate(118%);-webkit-backdrop-filter:blur(20px) saturate(118%);color:var(--panel-text,#f8f6ff)}
#syolana-official-notice::before{content:"";position:absolute;left:0;top:22px;bottom:22px;width:2px;border-radius:0 2px 2px 0;background:linear-gradient(180deg,transparent,var(--accent,#e5d6ff) 24%,var(--accent,#e5d6ff) 76%,transparent);opacity:.55}
.syolana-trust-head{display:flex;align-items:flex-start;gap:13px}.syolana-trust-icon{display:grid;place-items:center;flex:0 0 auto;width:38px;height:38px;margin-top:1px;border:1px solid color-mix(in srgb,var(--panel-border,rgba(255,255,255,.14)) 82%,transparent);border-radius:13px;background:rgba(255,255,255,.045);color:var(--panel-label,var(--accent,#e5d6ff));box-shadow:inset 0 1px 0 rgba(255,255,255,.045)}.syolana-trust-shield{width:21px;height:21px}.syolana-trust-heading{min-width:0;flex:1}.syolana-trust-kicker-row{display:flex;align-items:center;flex-wrap:wrap;gap:7px;margin:0 0 5px}.syolana-trust-kicker{margin:0;color:var(--panel-muted,#ded8e6);font:650 .7rem/1.2 var(--body,system-ui);letter-spacing:.075em;text-transform:uppercase;opacity:.82}.syolana-trust-count{display:inline-flex;align-items:center;padding:3px 7px;border:1px solid color-mix(in srgb,var(--accent,#e5d6ff) 26%,transparent);border-radius:999px;background:color-mix(in srgb,var(--accent,#e5d6ff) 7%,transparent);color:var(--panel-label,var(--accent,#e5d6ff));font:650 .64rem/1.15 var(--body,system-ui);letter-spacing:.035em;white-space:nowrap}.syolana-trust-title{margin:0;color:var(--panel-text,#fff);font:650 clamp(1.08rem,2.2vw,1.3rem)/1.22 var(--body,system-ui);letter-spacing:-.018em;text-wrap:balance}.syolana-trust-copy{margin:15px 0 0;max-width:70ch;color:var(--panel-muted,#e4deec);font:450 .9rem/1.58 var(--body,system-ui);letter-spacing:.002em}.syolana-trust-addresses{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:18px}.syolana-trust-address{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"label arrow" "url arrow";align-items:center;column-gap:14px;row-gap:5px;padding:13px 14px 14px;border:1px solid color-mix(in srgb,var(--panel-border,rgba(255,255,255,.14)) 88%,transparent);border-radius:17px;background:rgba(255,255,255,.038);color:var(--panel-text,#fff);text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.035);transition:transform .2s ease,background .2s ease,border-color .2s ease,box-shadow .2s ease}.syolana-trust-address:hover,.syolana-trust-address:focus-visible{transform:translateY(-1px);background:rgba(255,255,255,.064);border-color:color-mix(in srgb,var(--accent,#e5d6ff) 42%,var(--panel-border,rgba(255,255,255,.16)));box-shadow:0 10px 24px rgba(0,0,0,.08),inset 0 1px 0 rgba(255,255,255,.05);outline:none}.syolana-trust-label{grid-area:label;color:var(--panel-muted,#e4deec);font:600 .68rem/1.2 var(--body,system-ui);letter-spacing:.055em;text-transform:uppercase;opacity:.72}.syolana-trust-url{grid-area:url;min-width:0;color:var(--panel-text,#fff);font:590 .87rem/1.28 var(--body,system-ui);letter-spacing:-.006em;overflow-wrap:anywhere}.syolana-trust-arrow{grid-area:arrow;width:19px;height:19px;color:var(--panel-label,var(--accent,#e5d6ff));opacity:.72}.syolana-trust-foot{display:flex;align-items:flex-start;gap:7px;margin:13px 1px 0;color:var(--panel-muted,#e4deec);font:450 .76rem/1.45 var(--body,system-ui);opacity:.72}.syolana-trust-foot::before{content:"•";color:var(--panel-label,var(--accent,#e5d6ff));font-size:.9rem;line-height:1.16}
.syolana-avito-mark{width:27px;height:27px;flex:0 0 auto}.syolana-avito-float{position:fixed;z-index:390;right:max(12px,env(safe-area-inset-right));bottom:max(104px,calc(env(safe-area-inset-bottom) + 96px));display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:9px 13px 9px 10px;border:1px solid var(--panel-border,rgba(255,255,255,.18));border-radius:999px;background:var(--panel-bg,rgba(12,16,30,.9));box-shadow:0 18px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%);color:var(--panel-text,#fff);text-decoration:none;font:790 .82rem/1 var(--body,system-ui);white-space:nowrap;animation:syolanaAvitoFloat 4.8s ease-in-out infinite;transition:box-shadow .2s ease,filter .2s ease}.syolana-avito-float::after{content:"";position:absolute;inset:-6px;border-radius:inherit;border:1px solid color-mix(in srgb,var(--accent,#e5d6ff) 22%,transparent);opacity:.65;pointer-events:none}.syolana-avito-float:hover,.syolana-avito-float:focus-visible{filter:brightness(1.08);box-shadow:0 20px 54px rgba(0,0,0,.34),0 0 0 3px color-mix(in srgb,var(--accent,#e5d6ff) 14%,transparent);outline:none}.syolana-avito-float .syolana-avito-mark{width:29px;height:29px}.syolana-avito-float-label{padding-right:1px}@keyframes syolanaAvitoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}body.zen .syolana-avito-float{animation:none;opacity:.76}.reader-application .syolana-avito-float{bottom:max(90px,calc(env(safe-area-inset-bottom) + 82px))}
@media(max-width:760px){#syolana-official-notice{margin:14px 0 21px;padding:20px 17px 18px;border-radius:22px}.syolana-trust-head{gap:11px}.syolana-trust-icon{width:35px;height:35px;border-radius:12px}.syolana-trust-shield{width:19px;height:19px}.syolana-trust-title{font-size:1.12rem}.syolana-trust-copy{margin-top:13px;font-size:.88rem;line-height:1.56}.syolana-trust-addresses{grid-template-columns:1fr;gap:8px;margin-top:15px}.syolana-trust-address{padding:12px 13px 13px;border-radius:15px}.syolana-trust-url{font-size:.84rem;overflow-wrap:normal;word-break:normal}.syolana-trust-foot{margin-top:11px;font-size:.73rem}.syolana-avito-float{right:max(9px,env(safe-area-inset-right));bottom:max(100px,calc(env(safe-area-inset-bottom) + 92px));min-height:46px;padding:8px 11px 8px 9px;font-size:.76rem}.syolana-avito-float .syolana-avito-mark{width:27px;height:27px}}
@media(max-width:390px){#syolana-official-notice{padding-left:15px;padding-right:15px}.syolana-trust-heading{padding-right:2px}.syolana-trust-kicker-row{gap:5px}.syolana-trust-count{font-size:.6rem}.syolana-trust-url{font-size:.8rem;letter-spacing:-.012em}.syolana-avito-float{max-width:152px}.syolana-avito-float-label{white-space:normal;line-height:1.08}}
@media(prefers-reduced-motion:reduce){.syolana-avito-float{animation:none}.syolana-trust-address{transition:none}}
@media print{#syolana-official-notice,.syolana-avito-float{display:none!important}}
`;
  document.head.append(style);
}

function renderNotice() {
  installStyles();
  const shell = document.getElementById("content-shell");
  if (!shell) return;

  let notice = document.getElementById("syolana-official-notice");
  if (!notice) {
    notice = document.createElement("section");
    notice.id = "syolana-official-notice";
    notice.className = "syolana-official-notice";
    notice.dataset.i18nSkip = "trust";
    notice.setAttribute("role", "note");
    const nav = document.getElementById("main-nav");
    if (nav) nav.insertAdjacentElement("afterend", notice);
    else shell.prepend(notice);
  }

  const title = t("Официальные адреса Syolana");
  notice.setAttribute("aria-label", title);
  notice.innerHTML = `
    <div class="syolana-trust-head">
      <div class="syolana-trust-icon">${shieldMark()}</div>
      <div class="syolana-trust-heading">
        <div class="syolana-trust-kicker-row">
          <p class="syolana-trust-kicker">${t("Проверка подлинности")}</p>
          <span class="syolana-trust-count">${t("Только 2 адреса")}</span>
        </div>
        <h2 class="syolana-trust-title">${title}</h2>
      </div>
    </div>
    <p class="syolana-trust-copy">${t("Используйте только адреса ниже. Общение, заказы и согласование оплаты — только через официальный профиль Syolana на Авито. Сайты и аккаунты с другими адресами не относятся к Syolana.")}</p>
    <div class="syolana-trust-addresses" aria-label="${title}">
      <a class="syolana-trust-address" href="${MAIN_URL}" rel="home" aria-label="${t("Открыть официальный сайт")}: syolana.com">
        <span class="syolana-trust-label">${t("Основной сайт")}</span>
        <strong class="syolana-trust-url">syolana.com</strong>
        ${arrowMark()}
      </a>
      <a class="syolana-trust-address" href="${YANDEX_URL}" rel="noopener noreferrer" aria-label="${t("Открыть официальный сайт")}: syolana.website.yandexcloud.net">
        <span class="syolana-trust-label">${t("Резервный адрес")}</span>
        <strong class="syolana-trust-url">syolana.website.yandexcloud.net</strong>
        ${arrowMark()}
      </a>
    </div>
    <p class="syolana-trust-foot">${t("Перед входом или оплатой сверяйте адрес в строке браузера.")}</p>`;
}

function renderFloatingButton() {
  let button = document.getElementById("syolana-avito-float");
  if (!button) {
    button = document.createElement("a");
    button.id = "syolana-avito-float";
    button.className = "syolana-avito-float";
    button.dataset.i18nSkip = "trust";
    button.href = AVITO_URL;
    button.target = "_blank";
    button.rel = "noopener noreferrer";
    document.body.append(button);
  }
  const label = t("Написать на Авито");
  button.setAttribute("aria-label", label);
  button.title = label;
  button.innerHTML = `${avitoMark()}<span class="syolana-avito-float-label">${label}</span>`;
}

function renderTrustUI() {
  renderNotice();
  renderFloatingButton();
}

renderTrustUI();
window.addEventListener("syolana:locale", renderTrustUI);
window.addEventListener("pageshow", renderTrustUI);

const hostObserver = new MutationObserver(() => {
  if (!document.getElementById("syolana-official-notice") || !document.getElementById("syolana-avito-float")) renderTrustUI();
});
hostObserver.observe(document.body, { childList: true, subtree: true });

void currentLocale();
