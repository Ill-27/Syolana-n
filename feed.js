import {
  el,
  link,
  button,
  safeURL,
  download,
  notify,
  getPref,
  setPref,
} from "./utils.js";
export function renderFeed(root, posts, { slug } = {}) {
  if (!posts.length) {
    root.append(el("p", "empty", "Публикаций в этом разделе пока нет."));
    return;
  }
  for (const post of [...posts].sort((a, b) => stamp(b) - stamp(a))) {
    const article = el("article", "feed-post glass");
    const meta = el("div", "row between feed-meta");
    meta.append(
      el(
        "span",
        "badge",
        post.category || (post.kind === "music" ? "Песни" : "Лента"),
      ),
    );
    article.append(meta, el("h2", "", post.title || "Публикация"));
    const body = el("div", "feed-body");
    const text = post.text || post.description || "";
    for (const p of text.split(/\n\s*\n/).filter(Boolean))
      body.append(el("p", "", p));
    article.append(body);
    for (const media of (
      post.media || [post.cover, post.mediaUrl].filter(Boolean)
    ).slice(0, 6)) {
      const src = safeURL(typeof media === "string" ? media : media.src, {
        media: true,
      });
      if (!src) continue;
      const video = /\.(mp4|webm)(?:[?#]|$)/i.test(src),
        picture = /\.(jpe?g|png|webp|avif|gif)(?:[?#]|$)/i.test(src);
      if (!video && !picture) {
        article.append(link("Открыть материал ↗", src, "text-link"));
        continue;
      }
      const m = el(video ? "video" : "img", "feed-media");
      m.src = src;
      if (video) {
        m.muted = true;
        m.defaultMuted = true;
        m.autoplay = true;
        m.loop = true;
        m.playsInline = true;
        m.preload = "metadata";
        m.dataset.motion = "true";
        m.setAttribute("muted", "");
        m.setAttribute("playsinline", "");
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches)
          m.play().catch(() => (m.controls = true));
      } else {
        m.alt =
          (typeof media === "object" ? media.alt : "") ||
          post.title ||
          "Иллюстрация публикации";
        m.loading = "lazy";
        m.decoding = "async";
      }
      m.addEventListener("error", () => m.remove(), { once: true });
      article.append(m);
    }
    const actions = el("div", "row");
    if (post.href)
      actions.append(
        link(post.linkLabel || "Подробнее", post.href, "btn small"),
      );
    if (slug && post.id)
      actions.append(
        link(
          "Открыть публикацию",
          "#/s/" + slug + "/book/" + post.id + "/0",
          "text-link",
        ),
      );
    article.append(actions);
    root.append(article);
  }
}
function stamp(p) {
  const v = p.publishedAt || p.updated || p.date;
  return typeof v === "number" ? v * 1000 : Date.parse(v || "") || 0;
}
export async function feedEditor(root) {
  root.append(
    el("h1", "", "Редактор ленты"),
    el(
      "p",
      "notice",
      "Этот редактор готовит файл для GitHub. Черновик хранится только в этом браузере. Публикация произойдёт после загрузки feed.json в репозиторий. Для сохранения прямо на сайте нужен подключённый сервер и вход в аккаунт.",
    ),
  );
  let posts = [];
  try {
    const r = await fetch("feed.json");
    posts = await r.json();
    if (!Array.isArray(posts)) posts = [];
  } catch {}
  const form = el("form", "card form");
  const draft = getPref("feed-draft", {});
  const inputs = {};
  const fields = [
    ["title", "Заголовок", "input"],
    ["category", "Раздел: Дизайн, Книги, Языки или Песни", "select"],
    ["text", "Текст публикации", "textarea"],
    ["media", "Картинка или MP4: путь в репозитории или HTTPS-ссылка", "input"],
    ["href", "Ссылка кнопки (необязательно)", "input"],
    ["linkLabel", "Подпись кнопки", "input"],
  ];
  for (const [name, label, tag] of fields) {
    const wrap = el("label", "field", label);
    const input = el(tag);
    input.name = name;
    input.value = draft[name] || "";
    if (tag === "select") {
      ["Дизайн", "Книги", "Языки", "Песни"].forEach((x) =>
        input.append(el("option", "", x)),
      );
      input.value = draft[name] || "Дизайн";
    }
    if (name === "title" || name === "text") input.required = true;
    input.maxLength = name === "text" ? 20000 : 1000;
    wrap.append(input);
    form.append(wrap);
    inputs[name] = input;
  }
  function values() {
    return Object.fromEntries(
      Object.entries(inputs).map(([k, v]) => [k, v.value.trim()]),
    );
  }
  form.oninput = () => setPref("feed-draft", values());
  const preview = el("div", "feed-list");
  const actions = el("div", "row");
  const submit = el("button", "btn primary", "Скачать обновлённый feed.json");
  submit.type = "submit";
  actions.append(
    submit,
    button("Предпросмотр", () => {
      preview.replaceChildren();
      renderFeed(preview, [makePost()]);
    }),
  );
  const load = el(
    "label",
    "field",
    "Продолжить редактировать другой feed.json",
  );
  const upload = el("input");
  upload.type = "file";
  upload.accept = ".json,application/json";
  upload.onchange = async () => {
    try {
      const value = JSON.parse(await upload.files[0].text());
      if (!Array.isArray(value)) throw Error();
      posts = value;
      notify("Файл загружен. Новая публикация будет добавлена в начало.");
    } catch {
      notify("Не удалось прочитать JSON.");
    }
  };
  load.append(upload);
  function makePost() {
    const v = values();
    return {
      id: crypto.randomUUID(),
      title: v.title,
      category: v.category,
      text: v.text,
      publishedAt: new Date().toISOString(),
      media: v.media ? [v.media] : [],
      href: v.href,
      linkLabel: v.linkLabel,
    };
  }
  form.onsubmit = (e) => {
    e.preventDefault();
    const post = makePost();
    posts = [post, ...posts];
    download("feed.json", JSON.stringify(posts, null, 2));
    setPref("feed-draft", {});
    notify("Файл готов. Загрузите его в корень репозитория вместо feed.json.");
  };
  form.append(actions, load);
  root.append(form, preview);
}
