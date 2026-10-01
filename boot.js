// Show a recoverable error if an upload is incomplete; never leave an endless loader.
import("./app.js").catch((error) => {
  console.error("Syolana startup:", error);
  const page = document.getElementById("page");
  if (!page) return;
  const text = document.createElement("p");
  text.className = "notice";
  text.textContent =
    "Не удалось открыть сайт. Проверьте интернет и обновите страницу. Если ошибка повторяется, сообщите нам: sy@syolana.com.";
  const retry = document.createElement("button");
  retry.className = "btn";
  retry.textContent = "Попробовать снова";
  retry.onclick = () => location.reload();
  page.replaceChildren(text, retry);
});
