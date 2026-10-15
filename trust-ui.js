import {registerTranslations, getLocale as currentLocale, tr as t} from "./i18n.js";
import {mountAvitoDock} from './avito-dock.js';

const MAIN_URL = "https://syolana.com/";
const YANDEX_URL = "https://syolana.website.yandexcloud.net/";
const AVITO_URL = "https://www.avito.ru/brands/i223140984";

registerTranslations({
  "Проверка подлинности": ["Authenticity check", "Verificación de autenticidad", "Vérification d’authenticité"],
  "Официальные адреса Syolana": ["Official Syolana addresses", "Direcciones oficiales de Syolana", "Adresses officielles de Syolana"],
  "Используйте только два официальных адреса Syolana, указанных ниже.": [
    "Use only the two official Syolana addresses shown below.",
    "Utiliza únicamente las dos direcciones oficiales de Syolana indicadas abajo.",
    "Utilisez uniquement les deux adresses officielles de Syolana indiquées ci-dessous."
  ],
  "Общение по заказам, доступам к курсам, дизайну и согласованию оплаты ведётся только через официальный профиль Syolana на Авито.": [
    "All communication about orders, course access, design services and payment arrangements takes place only through Syolana’s official Avito profile.",
    "Toda comunicación sobre pedidos, acceso a cursos, servicios de diseño y acuerdos de pago se realiza únicamente a través del perfil oficial de Syolana en Avito.",
    "Tous les échanges concernant les commandes, l’accès aux cours, les services de design et les modalités de paiement passent uniquement par le profil officiel Syolana sur Avito."
  ],
  "Любые другие сайты, аккаунты, сообщения, письма, чаты, мессенджеры и ссылки не являются официальными каналами Syolana.": [
    "Any other websites, accounts, messages, emails, chats, messengers or links are not official Syolana channels.",
    "Cualquier otro sitio, cuenta, mensaje, correo, chat, mensajería o enlace no es un canal oficial de Syolana.",
    "Tout autre site, compte, message, e-mail, chat, messagerie ou lien n’est pas un canal officiel de Syolana."
  ],
  "Если кто-либо пишет от имени Syolana вне официального профиля на Авито или предлагает оплату другим способом, такое обращение не относится к официальной работе Syolana.": [
    "If anyone contacts you in Syolana’s name outside the official Avito profile or proposes another payment method, that contact is not part of Syolana’s official activity.",
    "Si alguien se pone en contacto contigo en nombre de Syolana fuera del perfil oficial de Avito o propone otro método de pago, ese contacto no forma parte de la actividad oficial de Syolana.",
    "Si quelqu’un vous contacte au nom de Syolana en dehors du profil officiel Avito ou propose un autre mode de paiement, ce contact ne relève pas de l’activité officielle de Syolana."
  ],
  "Syolana не просит переводить оплату на личные карты, по реквизитам из сторонних сообщений или через сторонние ссылки.": [
    "Syolana does not ask you to send payment to personal bank cards, to details received in third-party messages, or through third-party links.",
    "Syolana no solicita pagos a tarjetas bancarias personales, a datos enviados en mensajes de terceros ni mediante enlaces externos.",
    "Syolana ne demande pas de paiement vers des cartes bancaires personnelles, des coordonnées reçues dans des messages tiers ou via des liens externes."
  ],
  "Перед заказом или оплатой сверяйте адрес сайта и официальный профиль Syolana на Авито. Ключи доступа вводите только на двух официальных адресах выше.": [
    "Before ordering or paying, verify the website address and Syolana’s official Avito profile. Enter access keys only on the two official addresses above.",
    "Antes de realizar un pedido o pagar, comprueba la dirección del sitio y el perfil oficial de Syolana en Avito. Introduce las claves de acceso únicamente en las dos direcciones oficiales indicadas arriba.",
    "Avant toute commande ou paiement, vérifiez l’adresse du site et le profil officiel Syolana sur Avito. Saisissez les clés d’accès uniquement sur les deux adresses officielles ci-dessus."
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
    <svg class="syolana-trust-shield" viewBox="0 0 28 28" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="syolana-trust-holo" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff"/>
          <stop offset="26%" stop-color="#dff7ff"/>
          <stop offset="48%" stop-color="#f7e6ff"/>
          <stop offset="68%" stop-color="#fff0c9"/>
          <stop offset="100%" stop-color="#ffffff"/>
        </linearGradient>
      </defs>
      <path d="M14 3.2 22 6.4v6.7c0 5.35-3.2 9.15-8 11.1-4.8-1.95-8-5.75-8-11.1V6.4L14 3.2Z" fill="none" stroke="url(#syolana-trust-holo)" stroke-width="1.7"/>
      <path d="m10.05 13.6 2.45 2.45 5.45-5.7" fill="none" stroke="url(#syolana-trust-holo)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
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
#syolana-official-notice{--trust-text:#fffdfb;--trust-muted:rgba(255,253,251,.84);--trust-soft:rgba(255,253,251,.68);position:relative;isolation:isolate;overflow:hidden;margin:18px 0 28px;padding:26px 25px 23px;border:1px solid color-mix(in srgb,var(--panel-border,rgba(255,255,255,.18)) 88%,rgba(255,255,255,.13));border-radius:calc(var(--radius,24px) * .96);background:linear-gradient(145deg,rgba(255,255,255,.055),rgba(255,255,255,.018) 56%),color-mix(in srgb,var(--panel-bg,rgba(18,19,31,.78)) 94%,rgba(5,7,12,.88))!important;box-shadow:0 20px 58px rgba(0,0,0,.2),0 0 32px color-mix(in srgb,var(--panel-glow,transparent) 80%,transparent),inset 0 1px 0 rgba(255,255,255,.075);backdrop-filter:blur(20px) saturate(118%);-webkit-backdrop-filter:blur(20px) saturate(118%);color:var(--trust-text)!important}
#syolana-official-notice::before{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(circle at 13% 8%,color-mix(in srgb,var(--accent,#e5d6ff) 11%,transparent),transparent 31%),linear-gradient(115deg,transparent 0 45%,rgba(255,255,255,.028) 50%,transparent 56%);opacity:.85}
.syolana-trust-auth{position:relative;z-index:1;display:inline-flex;align-items:center;gap:10px;min-height:34px;color:var(--trust-text)!important}.syolana-trust-icon{position:relative;display:grid;place-items:center;flex:0 0 auto;width:34px;height:34px;border:1px solid rgba(255,255,255,.21);border-radius:12px;background:rgba(255,255,255,.045);box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 0 20px color-mix(in srgb,var(--accent,#e5d6ff) 10%,transparent);overflow:hidden}.syolana-trust-shield{width:21px;height:21px;filter:drop-shadow(0 0 6px rgba(255,255,255,.14));animation:syolanaTrustShield 8s ease-in-out infinite}.syolana-trust-kicker{position:relative;margin:0;font:650 .7rem/1.2 var(--body,system-ui)!important;letter-spacing:.145em;text-transform:uppercase;color:transparent!important;background:linear-gradient(105deg,#fff 0%,#dff7ff 18%,#f7e8ff 37%,#fff1cb 50%,#dff7ff 63%,#fff 82%);background-size:260% 100%;-webkit-background-clip:text;background-clip:text;text-shadow:0 0 14px rgba(255,255,255,.08);animation:syolanaPassportSheen 8s linear infinite}.syolana-trust-auth::after{content:"";position:absolute;left:-8px;right:-10px;top:2px;height:30px;border-radius:999px;background:linear-gradient(105deg,transparent 22%,rgba(222,247,255,.06) 36%,rgba(250,229,255,.13) 47%,rgba(255,241,197,.12) 53%,rgba(222,247,255,.06) 62%,transparent 78%);background-size:260% 100%;mix-blend-mode:screen;pointer-events:none;animation:syolanaPassportSheen 8s linear infinite}
.syolana-trust-title{position:relative;z-index:1;margin:15px 0 15px!important;color:var(--trust-text)!important;font-family:var(--display,"Syolana Script","Cormorant Garamond",Georgia,serif)!important;font-size:clamp(2rem,4.6vw,3rem)!important;font-weight:400!important;line-height:1.08!important;letter-spacing:.01em!important;text-wrap:balance;text-shadow:0 2px 16px rgba(0,0,0,.32),0 0 24px color-mix(in srgb,var(--accent,#e5d6ff) 10%,transparent)!important;opacity:1!important}
.syolana-trust-copy{position:relative;z-index:1;display:grid;gap:10px;max-width:76ch;margin:0!important;color:var(--trust-muted)!important;font:470 .89rem/1.62 var(--body,system-ui)!important;letter-spacing:.001em;text-shadow:none!important}.syolana-trust-copy p{margin:0!important;color:inherit!important;opacity:1!important}.syolana-trust-copy strong{color:var(--trust-text)!important;font-weight:650}.syolana-trust-copy .syolana-trust-warning{color:var(--trust-text)!important}
.syolana-trust-addresses{position:relative;z-index:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:19px}.syolana-trust-address{min-width:0;display:grid;grid-template-columns:minmax(0,1fr) auto;grid-template-areas:"label arrow" "url arrow";align-items:center;column-gap:14px;row-gap:5px;padding:14px 15px 15px;border:1px solid rgba(255,255,255,.16)!important;border-radius:18px;background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.025))!important;color:var(--trust-text)!important;text-decoration:none;box-shadow:inset 0 1px 0 rgba(255,255,255,.055);transition:transform .2s ease,background .2s ease,border-color .2s ease,box-shadow .2s ease}.syolana-trust-address:hover,.syolana-trust-address:focus-visible{transform:translateY(-1px);background:linear-gradient(135deg,rgba(255,255,255,.105),rgba(255,255,255,.04))!important;border-color:color-mix(in srgb,var(--accent,#e5d6ff) 46%,rgba(255,255,255,.17))!important;box-shadow:0 10px 28px rgba(0,0,0,.12),inset 0 1px 0 rgba(255,255,255,.08);outline:none}.syolana-trust-label{grid-area:label;color:var(--trust-soft)!important;font:650 .68rem/1.2 var(--body,system-ui)!important;letter-spacing:.07em;text-transform:uppercase;opacity:1!important}.syolana-trust-url{grid-area:url;min-width:0;color:var(--trust-text)!important;font:620 .89rem/1.28 var(--body,system-ui)!important;letter-spacing:-.008em;overflow-wrap:anywhere;text-shadow:none!important}.syolana-trust-arrow{grid-area:arrow;width:19px;height:19px;color:var(--trust-muted)!important;opacity:.9}.syolana-trust-foot{position:relative;z-index:1;display:flex;align-items:flex-start;gap:8px;margin:14px 1px 0!important;color:var(--trust-soft)!important;font:470 .76rem/1.5 var(--body,system-ui)!important;opacity:1!important;text-shadow:none!important}.syolana-trust-foot::before{content:"•";color:var(--trust-text);font-size:.9rem;line-height:1.18;opacity:.76}
.syolana-avito-mark{width:27px;height:27px;flex:0 0 auto}.syolana-avito-float{position:fixed;z-index:390;right:max(12px,env(safe-area-inset-right));bottom:max(104px,calc(env(safe-area-inset-bottom) + 96px));display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:9px 13px 9px 10px;border:1px solid var(--panel-border,rgba(255,255,255,.18));border-radius:999px;background:var(--panel-bg,rgba(12,16,30,.9));box-shadow:0 18px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%);color:var(--panel-text,#fff);text-decoration:none;font:790 .82rem/1 var(--body,system-ui);white-space:nowrap;animation:syolanaAvitoFloat 4.8s ease-in-out infinite;transition:box-shadow .2s ease,filter .2s ease}.syolana-avito-float::after{content:"";position:absolute;inset:-6px;border-radius:inherit;border:1px solid color-mix(in srgb,var(--accent,#e5d6ff) 22%,transparent);opacity:.65;pointer-events:none}.syolana-avito-float:hover,.syolana-avito-float:focus-visible{filter:brightness(1.08);box-shadow:0 20px 54px rgba(0,0,0,.34),0 0 0 3px color-mix(in srgb,var(--accent,#e5d6ff) 14%,transparent);outline:none}.syolana-avito-float .syolana-avito-mark{width:29px;height:29px}.syolana-avito-float-label{padding-right:1px}
@keyframes syolanaPassportSheen{0%{background-position:210% 0}100%{background-position:-60% 0}}@keyframes syolanaTrustShield{0%,100%{opacity:.88;filter:drop-shadow(0 0 5px rgba(223,247,255,.12))}35%{opacity:1;filter:drop-shadow(0 0 7px rgba(248,231,255,.24))}65%{opacity:.95;filter:drop-shadow(0 0 7px rgba(255,240,201,.2))}}@keyframes syolanaAvitoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}body.zen .syolana-avito-float{animation:none;opacity:.76}.reader-application .syolana-avito-float{bottom:max(90px,calc(env(safe-area-inset-bottom) + 82px))}
@media(max-width:760px){#syolana-official-notice{margin:14px 0 23px;padding:21px 17px 19px;border-radius:23px}.syolana-trust-auth{gap:9px}.syolana-trust-icon{width:33px;height:33px;border-radius:11px}.syolana-trust-shield{width:20px;height:20px}.syolana-trust-kicker{font-size:.66rem!important;letter-spacing:.13em}.syolana-trust-title{margin:14px 0 14px!important;font-size:clamp(2rem,9.4vw,2.75rem)!important;line-height:1.03!important}.syolana-trust-copy{gap:9px;font-size:.87rem!important;line-height:1.6!important}.syolana-trust-addresses{grid-template-columns:1fr;gap:9px;margin-top:17px}.syolana-trust-address{padding:13px 14px 14px;border-radius:16px}.syolana-trust-url{font-size:.86rem!important;overflow-wrap:normal;word-break:normal}.syolana-trust-foot{margin-top:12px!important;font-size:.73rem!important}.syolana-avito-float{right:max(9px,env(safe-area-inset-right));bottom:max(100px,calc(env(safe-area-inset-bottom) + 92px));min-height:46px;padding:8px 11px 8px 9px;font-size:.76rem}.syolana-avito-float .syolana-avito-mark{width:27px;height:27px}}
@media(max-width:390px){#syolana-official-notice{padding-left:15px;padding-right:15px}.syolana-trust-title{font-size:clamp(1.9rem,9.2vw,2.45rem)!important}.syolana-trust-url{font-size:.8rem!important;letter-spacing:-.015em}.syolana-avito-float{max-width:152px}.syolana-avito-float-label{white-space:normal;line-height:1.08}}
@media(prefers-reduced-motion:reduce){.syolana-avito-float,.syolana-trust-kicker,.syolana-trust-auth::after,.syolana-trust-shield{animation:none!important}.syolana-trust-address{transition:none}}
body.zen .syolana-avito-float{bottom:max(100px,calc(env(safe-area-inset-bottom) + 92px),var(--zen-contact-bottom,200px))}
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
    <div class="syolana-trust-auth">
      <span class="syolana-trust-icon">${shieldMark()}</span>
      <p class="syolana-trust-kicker">${t("Проверка подлинности")}</p>
    </div>
    <h2 class="syolana-trust-title">${title}</h2>
    <div class="syolana-trust-copy">
      <p>${t("Используйте только два официальных адреса Syolana, указанных ниже.")}</p>
      <p><strong>${t("Общение по заказам, доступам к курсам, дизайну и согласованию оплаты ведётся только через официальный профиль Syolana на Авито.")}</strong></p>
      <p>${t("Любые другие сайты, аккаунты, сообщения, письма, чаты, мессенджеры и ссылки не являются официальными каналами Syolana.")}</p>
      <p class="syolana-trust-warning">${t("Если кто-либо пишет от имени Syolana вне официального профиля на Авито или предлагает оплату другим способом, такое обращение не относится к официальной работе Syolana.")}</p>
      <p>${t("Syolana не просит переводить оплату на личные карты, по реквизитам из сторонних сообщений или через сторонние ссылки.")}</p>
    </div>
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
    <p class="syolana-trust-foot">${t("Перед заказом или оплатой сверяйте адрес сайта и официальный профиль Syolana на Авито. Ключи доступа вводите только на двух официальных адресах выше.")}</p>`;
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
  mountAvitoDock(button);
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
