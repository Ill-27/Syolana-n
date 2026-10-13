import { b as registerTranslations, c as currentLocale, d as t } from "./chunk-chunk-RYPJ2WDE.js";

const MAIN_URL = "https://syolana.com/";
const YANDEX_URL = "https://syolana.website.yandexcloud.net/";
const AVITO_URL = "https://www.avito.ru/brands/i223140984";

registerTranslations({
  "ПРОВЕРКА ПОДЛИННОСТИ": ["AUTHENTICITY CHECK", "VERIFICACIÓN DE AUTENTICIDAD", "VÉRIFICATION D’AUTHENTICITÉ"],
  "Официальные адреса Syolana — только эти два": ["Syolana has only these two official web addresses", "Syolana solo tiene estas dos direcciones web oficiales", "Syolana ne possède que ces deux adresses web officielles"],
  "Покупателям и партнёрам: общение, заказы и согласование оплаты — только через официальный профиль Syolana на Авито. Любой другой сайт, аккаунт или способ связи не является официальным каналом Syolana.": [
    "For customers and partners: messages, orders and payment arrangements are handled only through Syolana’s official Avito profile. Any other website, account or contact method is not an official Syolana channel.",
    "Para clientes y colaboradores: la comunicación, los pedidos y los acuerdos de pago se gestionan únicamente a través del perfil oficial de Syolana en Avito. Cualquier otro sitio, cuenta o medio de contacto no es un canal oficial de Syolana.",
    "Pour les clients et partenaires : les échanges, commandes et modalités de paiement passent uniquement par le profil officiel Syolana sur Avito. Tout autre site, compte ou moyen de contact n’est pas un canal officiel de Syolana."
  ],
  "Проверяйте адрес в строке браузера перед входом или оплатой.": [
    "Check the address in your browser bar before signing in or paying.",
    "Comprueba la dirección en la barra del navegador antes de iniciar sesión o pagar.",
    "Vérifiez l’adresse dans la barre du navigateur avant de vous connecter ou de payer."
  ],
  "Основной адрес": ["Main address", "Dirección principal", "Adresse principale"],
  "Резервный адрес Яндекса": ["Yandex backup address", "Dirección alternativa de Yandex", "Adresse de secours Yandex"],
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
      <path d="M12 2.8 19 5.6v5.9c0 4.7-2.8 8-7 9.7-4.2-1.7-7-5-7-9.7V5.6L12 2.8Z" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <path d="m8.5 12 2.2 2.2 4.8-5" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
}

function installStyles() {
  if (document.getElementById("syolana-trust-ui-style")) return;
  const style = document.createElement("style");
  style.id = "syolana-trust-ui-style";
  style.textContent = `
#syolana-official-notice{position:relative;isolation:isolate;overflow:hidden;margin:14px 0 22px;padding:18px 19px;border:1px solid var(--panel-border,rgba(235,225,255,.24));border-radius:calc(var(--radius,24px) * .8);background:linear-gradient(135deg,var(--panel-bg,rgba(14,17,32,.82)),rgba(var(--surface,12,12,25),.58));box-shadow:0 18px 54px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.08);backdrop-filter:blur(18px) saturate(125%);-webkit-backdrop-filter:blur(18px) saturate(125%);color:var(--panel-text,#f8f6ff)}
#syolana-official-notice::before{content:"";position:absolute;inset:-1px auto -1px -1px;width:4px;background:linear-gradient(180deg,var(--accent,#e5d6ff),transparent 86%);opacity:.95;z-index:-1}
.syolana-trust-grid{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px 20px;align-items:center}.syolana-trust-kicker{display:flex;align-items:center;gap:8px;margin:0 0 7px;color:var(--panel-label,var(--accent,#e5d6ff));font:800 .72rem/1.2 var(--body,system-ui);letter-spacing:.12em}.syolana-trust-shield{width:20px;height:20px;flex:0 0 auto}.syolana-trust-title{margin:0;color:var(--panel-text,#fff);font:760 clamp(1rem,2.4vw,1.22rem)/1.2 var(--body,system-ui);letter-spacing:-.012em}.syolana-trust-copy{margin:8px 0 0;max-width:72ch;color:var(--panel-muted,#e4deec);font:500 .88rem/1.55 var(--body,system-ui)}.syolana-trust-tip{display:block;margin-top:6px;color:var(--panel-muted,#e4deec);opacity:.9;font-size:.8rem}.syolana-trust-addresses{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:8px}.syolana-trust-address{min-width:0;display:flex;align-items:center;gap:9px;padding:8px 11px;border:1px solid var(--panel-border,rgba(255,255,255,.14));border-radius:999px;background:rgba(255,255,255,.055);color:var(--panel-text,#fff);text-decoration:none;transition:transform .2s ease,background .2s ease,border-color .2s ease}.syolana-trust-address:hover,.syolana-trust-address:focus-visible{transform:translateY(-1px);background:rgba(255,255,255,.085);border-color:var(--accent,#e5d6ff);outline:none}.syolana-trust-address small{color:var(--panel-muted,#e4deec);font:700 .68rem/1 var(--body,system-ui);text-transform:uppercase;letter-spacing:.07em}.syolana-trust-address strong{font:720 .83rem/1.2 var(--body,system-ui);overflow-wrap:anywhere}.syolana-trust-avito{align-self:center;display:inline-flex;align-items:center;justify-content:center;gap:9px;min-height:46px;padding:10px 14px;border:1px solid rgba(255,255,255,.16);border-radius:999px;background:rgba(255,255,255,.095);box-shadow:0 10px 28px rgba(0,0,0,.14);color:var(--panel-text,#fff);text-decoration:none;font:760 .86rem/1 var(--body,system-ui);white-space:nowrap;transition:transform .2s ease,background .2s ease,box-shadow .2s ease}.syolana-trust-avito:hover,.syolana-trust-avito:focus-visible{transform:translateY(-2px);background:rgba(255,255,255,.14);box-shadow:0 14px 34px rgba(0,0,0,.2);outline:2px solid color-mix(in srgb,var(--accent,#e5d6ff) 65%,transparent);outline-offset:2px}.syolana-avito-mark{width:27px;height:27px;flex:0 0 auto}
.syolana-avito-float{position:fixed;z-index:390;right:max(12px,env(safe-area-inset-right));bottom:max(104px,calc(env(safe-area-inset-bottom) + 96px));display:inline-flex;align-items:center;gap:9px;min-height:48px;padding:9px 13px 9px 10px;border:1px solid var(--panel-border,rgba(255,255,255,.18));border-radius:999px;background:var(--panel-bg,rgba(12,16,30,.9));box-shadow:0 18px 48px rgba(0,0,0,.28),inset 0 1px 0 rgba(255,255,255,.09);backdrop-filter:blur(18px) saturate(130%);-webkit-backdrop-filter:blur(18px) saturate(130%);color:var(--panel-text,#fff);text-decoration:none;font:790 .82rem/1 var(--body,system-ui);white-space:nowrap;animation:syolanaAvitoFloat 4.8s ease-in-out infinite;transition:box-shadow .2s ease,filter .2s ease}.syolana-avito-float::after{content:"";position:absolute;inset:-6px;border-radius:inherit;border:1px solid color-mix(in srgb,var(--accent,#e5d6ff) 22%,transparent);opacity:.65;pointer-events:none}.syolana-avito-float:hover,.syolana-avito-float:focus-visible{filter:brightness(1.08);box-shadow:0 20px 54px rgba(0,0,0,.34),0 0 0 3px color-mix(in srgb,var(--accent,#e5d6ff) 14%,transparent);outline:none}.syolana-avito-float .syolana-avito-mark{width:29px;height:29px}.syolana-avito-float-label{padding-right:1px}
@keyframes syolanaAvitoFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
body.zen .syolana-avito-float{animation:none;opacity:.76}.reader-application .syolana-avito-float{bottom:max(90px,calc(env(safe-area-inset-bottom) + 82px))}
@media(max-width:700px){#syolana-official-notice{padding:16px 15px;margin:12px 0 18px}.syolana-trust-grid{grid-template-columns:1fr;gap:12px}.syolana-trust-avito{justify-self:start}.syolana-trust-addresses{grid-column:1}.syolana-trust-address{width:100%;border-radius:16px}.syolana-avito-float{right:max(9px,env(safe-area-inset-right));bottom:max(100px,calc(env(safe-area-inset-bottom) + 92px));min-height:46px;padding:8px 11px 8px 9px;font-size:.76rem}.syolana-avito-float .syolana-avito-mark{width:27px;height:27px}}
@media(max-width:360px){.syolana-avito-float{max-width:152px}.syolana-avito-float-label{white-space:normal;line-height:1.08}}
@media(prefers-reduced-motion:reduce){.syolana-avito-float{animation:none}.syolana-trust-address,.syolana-trust-avito{transition:none}}
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

  notice.setAttribute("aria-label", t("ПРОВЕРКА ПОДЛИННОСТИ"));
  notice.innerHTML = `
    <div class="syolana-trust-grid">
      <div class="syolana-trust-message">
        <p class="syolana-trust-kicker">${shieldMark()}<span>${t("ПРОВЕРКА ПОДЛИННОСТИ")}</span></p>
        <h2 class="syolana-trust-title">${t("Официальные адреса Syolana — только эти два")}</h2>
        <p class="syolana-trust-copy">${t("Покупателям и партнёрам: общение, заказы и согласование оплаты — только через официальный профиль Syolana на Авито. Любой другой сайт, аккаунт или способ связи не является официальным каналом Syolana.")}<span class="syolana-trust-tip">${t("Проверяйте адрес в строке браузера перед входом или оплатой.")}</span></p>
      </div>
      <a class="syolana-trust-avito" href="${AVITO_URL}" target="_blank" rel="noopener noreferrer">${avitoMark()}<span>${t("Написать на Авито")}</span></a>
      <div class="syolana-trust-addresses" aria-label="${t("Официальные адреса Syolana — только эти два")}">
        <a class="syolana-trust-address" href="${MAIN_URL}" rel="home"><small>${t("Основной адрес")}</small><strong>syolana.com</strong></a>
        <a class="syolana-trust-address" href="${YANDEX_URL}" rel="noopener noreferrer"><small>${t("Резервный адрес Яндекса")}</small><strong>syolana.website.yandexcloud.net</strong></a>
      </div>
    </div>`;
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

// Keep locale access referenced so bundlers/minifiers do not accidentally drop the i18n dependency.
void currentLocale();
