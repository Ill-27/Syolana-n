const trustDirectionFixes = [
  ["Ключи доступа вводите только на двух официальных адресах ниже.", "Ключи доступа вводите только на двух официальных адресах выше."],
  ["Enter access keys only on the two official addresses below.", "Enter access keys only on the two official addresses above."],
  ["Introduce las claves de acceso únicamente en las dos direcciones oficiales indicadas abajo.", "Introduce las claves de acceso únicamente en las dos direcciones oficiales indicadas arriba."],
  ["Saisissez les clés d’accès uniquement sur les deux adresses officielles ci-dessous.", "Saisissez les clés d’accès uniquement sur les deux adresses officielles ci-dessus."]
];

function installBrandStyles() {
  if (document.getElementById("syolana-brand-effects-style")) return;
  const style = document.createElement("style");
  style.id = "syolana-brand-effects-style";
  style.textContent = `
.syolana-logo-holo-wrap{position:relative;display:inline-grid;place-items:center;flex:0 0 auto;line-height:0;vertical-align:middle;isolation:isolate}
.syolana-logo-holo-wrap>img{grid-area:1/1;position:relative;z-index:0}
.syolana-logo-holo-sheen{position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(105deg,transparent 22%,rgba(222,247,255,.18) 36%,rgba(250,229,255,.46) 47%,rgba(255,241,197,.42) 53%,rgba(222,247,255,.18) 62%,transparent 78%);background-size:260% 100%;-webkit-mask:var(--syolana-logo-mask) center/contain no-repeat;mask:var(--syolana-logo-mask) center/contain no-repeat;mix-blend-mode:screen;filter:drop-shadow(0 0 7px rgba(247,232,255,.22));animation:syolanaPassportSheen 8s linear infinite}
.syolana-avito-float,.syolana-avito-float:visited,.syolana-avito-float-label{color:#fffdfb!important;text-shadow:0 1px 8px rgba(0,0,0,.48)!important}
@keyframes syolanaPassportSheen{0%{background-position:210% 0}100%{background-position:-60% 0}}
@media(prefers-reduced-motion:reduce){.syolana-logo-holo-sheen{animation:none!important;background-position:50% 0;opacity:.72}}
`;
  document.head.append(style);
}

function decorateSyolanaLogos(root = document) {
  installBrandStyles();
  root.querySelectorAll?.('img[src*="assets/logo.svg"]').forEach(img => {
    if (img.dataset.syolanaHolo === "true" || img.closest(".syolana-logo-holo-wrap")) return;
    const src = img.currentSrc || img.src;
    if (!src) return;
    const wrap = document.createElement("span");
    wrap.className = "syolana-logo-holo-wrap";
    wrap.setAttribute("aria-hidden", "true");
    wrap.style.setProperty("--syolana-logo-mask", `url("${src.replace(/"/g, "%22")}")`);
    const sheen = document.createElement("span");
    sheen.className = "syolana-logo-holo-sheen";
    img.dataset.syolanaHolo = "true";
    img.parentNode?.insertBefore(wrap, img);
    wrap.append(img, sheen);
  });
}

function fixTrustDirection() {
  const foot = document.querySelector(".syolana-trust-foot");
  if (!foot) return;
  let text = foot.textContent || "";
  for (const [from, to] of trustDirectionFixes) text = text.replace(from, to);
  if (foot.textContent !== text) foot.textContent = text;
}

function syncBrandEffects() {
  fixTrustDirection();
  decorateSyolanaLogos();
}

syncBrandEffects();
window.addEventListener("syolana:locale", () => queueMicrotask(syncBrandEffects));
window.addEventListener("pageshow", syncBrandEffects);

const trustObserver = new MutationObserver(() => queueMicrotask(syncBrandEffects));
trustObserver.observe(document.body, { childList: true, subtree: true });
