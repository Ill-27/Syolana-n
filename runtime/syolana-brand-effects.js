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
.syolana-logo-holo-host{position:relative!important}
.syolana-logo-holo-sheen{position:absolute;z-index:3;pointer-events:none;background:linear-gradient(105deg,transparent 18%,rgba(222,247,255,.12) 31%,rgba(250,229,255,.62) 45%,rgba(255,241,197,.58) 53%,rgba(222,247,255,.24) 64%,transparent 79%);background-size:280% 100%;mix-blend-mode:screen;filter:drop-shadow(0 0 7px rgba(247,232,255,.24));animation:syolanaPassportSheen 7.4s linear infinite;will-change:background-position}
.syolana-avito-float,.syolana-avito-float:visited,.syolana-avito-float:hover,.syolana-avito-float:focus-visible,.syolana-avito-float-label{color:#fffdfb!important;text-shadow:0 1px 8px rgba(0,0,0,.58)!important}
@keyframes syolanaPassportSheen{0%{background-position:215% 0}100%{background-position:-65% 0}}
@media(prefers-reduced-motion:reduce){.syolana-logo-holo-sheen{animation:none!important;background-position:52% 0;opacity:.75}}
`;
  document.head.append(style);
}

function placeSheen(img, sheen) {
  if (!img?.isConnected || !sheen?.isConnected) return;
  const parent = img.parentElement;
  if (!parent) return;
  const parentRect = parent.getBoundingClientRect();
  const rect = img.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  Object.assign(sheen.style, {
    left: `${rect.left - parentRect.left + parent.scrollLeft}px`,
    top: `${rect.top - parentRect.top + parent.scrollTop}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    WebkitMask: `url("${img.currentSrc || img.src}") center / contain no-repeat`,
    mask: `url("${img.currentSrc || img.src}") center / contain no-repeat`
  });
}

function shouldDecorate(img) {
  if (!img.matches('img[src*="assets/logo.svg"]')) return false;
  if (img.classList.contains('banner-media') || img.closest('.banner-orb')) return false;
  return true;
}

function decorateSyolanaLogos(root = document) {
  installBrandStyles();
  root.querySelectorAll?.('img[src*="assets/logo.svg"]').forEach(img => {
    if (!shouldDecorate(img) || img.dataset.syolanaHolo === "true") return;
    const parent = img.parentElement;
    if (!parent) return;
    parent.classList.add("syolana-logo-holo-host");
    img.dataset.syolanaHolo = "true";
    const sheen = document.createElement("span");
    sheen.className = "syolana-logo-holo-sheen";
    sheen.setAttribute("aria-hidden", "true");
    parent.append(sheen);
    requestAnimationFrame(() => placeSheen(img, sheen));
    img.addEventListener("load", () => placeSheen(img, sheen));
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => placeSheen(img, sheen));
      ro.observe(img);
      ro.observe(parent);
    }
  });
}

function refreshAllSheens() {
  document.querySelectorAll('img[data-syolana-holo="true"]').forEach(img => {
    const sheen = img.parentElement?.querySelector(':scope > .syolana-logo-holo-sheen');
    if (sheen) placeSheen(img, sheen);
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
  requestAnimationFrame(refreshAllSheens);
}

syncBrandEffects();
window.addEventListener("syolana:locale", () => queueMicrotask(syncBrandEffects));
window.addEventListener("syolana:theme", () => requestAnimationFrame(refreshAllSheens));
window.addEventListener("resize", () => requestAnimationFrame(refreshAllSheens), {passive:true});
window.addEventListener("pageshow", syncBrandEffects);
new MutationObserver(() => queueMicrotask(syncBrandEffects)).observe(document.body, {childList:true, subtree:true});
