// Show a recoverable error if an upload is incomplete; never leave an endless loader.
if (/^#\/lesson\/en\/a1\/course(?:\/|$)/.test(location.hash)) {
  document.body.classList.add("course-reading");
}
const release = new URL(import.meta.url).searchParams.get("v") || "20261006-a1-3";
const appURL = new URL("./app.js", import.meta.url);
appURL.searchParams.set("v", release);
import(appURL.href).catch((error) => {
  console.error("Syolana startup:", error);
  const page = document.getElementById("page");
  if (!page) return;
  const text = document.createElement("p");
  text.className = "notice";
  text.textContent =
    "Не удалось открыть сайт. Проверьте интернет и обновите страницу. Если ошибка повторяется, напишите Syolana на Авито.";
  const retry = document.createElement("button");
  retry.className = "btn";
  retry.textContent = "Попробовать снова";
  retry.onclick = () => location.reload();
  page.replaceChildren(text, retry);
});
