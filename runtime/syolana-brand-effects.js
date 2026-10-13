const trustDirectionFixes = [
  ["Ключи доступа вводите только на двух официальных адресах ниже.", "Ключи доступа вводите только на двух официальных адресах выше."],
  ["Enter access keys only on the two official addresses below.", "Enter access keys only on the two official addresses above."],
  ["Introduce las claves de acceso únicamente en las dos direcciones oficiales indicadas abajo.", "Introduce las claves de acceso únicamente en las dos direcciones oficiales indicadas arriba."],
  ["Saisissez les clés d’accès uniquement sur les deux adresses officielles ci-dessous.", "Saisissez les clés d’accès uniquement sur les deux adresses officielles ci-dessus."]
];

function fixTrustDirection() {
  const foot = document.querySelector(".syolana-trust-foot");
  if (!foot) return;
  let text = foot.textContent || "";
  for (const [from, to] of trustDirectionFixes) text = text.replace(from, to);
  if (foot.textContent !== text) foot.textContent = text;
}

fixTrustDirection();
window.addEventListener("syolana:locale", () => queueMicrotask(fixTrustDirection));
window.addEventListener("pageshow", fixTrustDirection);

const trustObserver = new MutationObserver(() => fixTrustDirection());
trustObserver.observe(document.body, { childList: true, subtree: true });
