const CONTACT_KEY = "partner-studio.contacts.v3";
const SESSION_KEY = "partner-studio.session.v2";

const $ = (selector) => document.querySelector(selector);

function displayDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(date) : "";
}

let cfg = {};
let apiEndpoint = "";
let token = "";
let feed = [];
let currentPostId = "";
let editingPostId = "";
const isPublisher = () => ['publisher','hybrid'].includes(cfg.publishingSource);
const isDemo = () => cfg.mode === "demo" && !apiEndpoint;
const demoFeedKey = () => "partner-demo.feed." + cfg.partnerId;

function endpoint(path) {
  return new URL(path.replace(/^\//, ""), apiEndpoint.replace(/\/?$/, "/")).href;
}

function saveSession(value) {
  token = String(value || "");
  if (token) sessionStorage.setItem(SESSION_KEY, token);
  else sessionStorage.removeItem(SESSION_KEY);
}

async function api(path, { method = "GET", body } = {}) {
  if (!apiEndpoint) throw new Error("Studio API is not configured");

  const response = await fetch(endpoint(path), {
    method,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: "Bearer " + token } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "omit",
    cache: "no-store",
    signal: AbortSignal.timeout(6000),
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 401) {
    saveSession("");
    showLogin("Сессия закончилась. Войдите снова.");
    throw new Error("Сессия закончилась. Войдите снова.");
  }

  if (!response.ok) {
    if (response.status === 403 && data?.error === "partner_disabled") {
      throw new Error("Доступ к настройкам Studio сейчас отключён.");
    }
    const messages={settings_changed_retry:'Запись уже обновилась. Обновите список и повторите изменение.',invalid_image:'Выберите фото из вашего хранилища.',invalid_video:'Выберите видео MP4 или WebM из вашего хранилища.',media_too_large:'Файл должен быть не больше 2 МБ.',invalid_media:'Выберите JPG, PNG, WebP, MP4 или WebM.',post_not_found:'Эта запись уже удалена. Обновите список.',storage_unavailable:'Хранилище временно недоступно. Повторите сохранение позже.',not_configured:'Редактор ещё не подключён. Обратитесь к Syolana.'};
    throw new Error(messages[data?.error] || 'Не удалось сохранить. Обновите страницу и попробуйте ещё раз.');
  }

  return data;
}

function showLogin(message = "") {
  $("#studio-login").hidden = false;
  $("#login-partner-id").value =
    $("#login-partner-id").value || cfg.partnerId || "";
  $("#login-status").textContent = message;
}

function hideLogin() {
  $("#studio-login").hidden = true;
  $("#login-access-key").value = "";
  $("#login-status").textContent = "";
}

function sourceUrl(post) {
  const direct = String(post?.source?.url || "").trim();
  if (/^https:\/\/vk\.com\//i.test(direct)) return direct;

  for (const item of Array.isArray(post?.links) ? post.links : []) {
    const href = String(item?.href || "").trim();
    if (/^https:\/\/vk\.com\//i.test(href)) return href;
  }

  return "";
}

function previewMediaAllowed(value) {
  const src = String(value || "");
  return /^https:\/\//i.test(src) || (isDemo() && /^data:(?:image\/(?:png|jpeg|webp)|video\/(?:mp4|webm));base64,[A-Za-z0-9+/=]+$/.test(src));
}

function renderPreview(post) {
  currentPostId = String(post?.id || "");

  if (!post) {
    $("#preview-heading").textContent = "Публикация";
    $("#preview-meta").textContent = "";
    $("#preview-title").textContent = "Публикаций пока нет";
    $("#preview-text").textContent =
      "После первой синхронизации публичные записи из VK появятся здесь.";
    $("#preview-media").hidden = true;
    $("#open-vk-post").hidden = true;
    return;
  }

  $("#preview-heading").textContent = post.title || "Публикация";
  $("#preview-meta").textContent = [post.category || "VK", displayDate(post.publishedAt)]
    .filter(Boolean)
    .join(" · ");
  $("#preview-title").textContent = post.title || "Публикация";
  $("#preview-text").textContent = String(post.text || "");

  const firstImage = (Array.isArray(post.media) ? post.media : []).find(
    (item) => (item?.type || "image") === "image" && previewMediaAllowed(item?.src),
  );

  const figure = $("#preview-media");
  const image = figure.querySelector("img");

  if (firstImage) {
    image.src = firstImage.src;
    image.alt = String(firstImage.alt || "");
    figure.hidden = false;
  } else {
    image.removeAttribute("src");
    image.alt = "";
    figure.hidden = true;
  }
  document.querySelector('#preview-video')?.remove();
  const clip=(post.media||[]).find(m=>m.type==='video' && previewMediaAllowed(m.src));
  if(clip){const video=document.createElement('video');video.id='preview-video';video.src=clip.src;video.controls=true;video.preload='metadata';video.playsInline=true;video.style.maxWidth='100%';$('#post-preview').append(video);}

  const vk = sourceUrl(post);
  const button = $("#open-vk-post");
  button.hidden = !vk;
  if (vk) button.href = vk;
  else button.removeAttribute("href");
}

function renderList() {
  const root = $("#post-list");
  root.replaceChildren();

  if (!feed.length) {
    const empty = document.createElement("p");
    empty.className = "studio-copy";
    empty.textContent = "Пока нет синхронизированных публичных записей.";
    root.append(empty);
    renderPreview(null);
    return;
  }

  for (const post of feed) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "post-item";
    button.dataset.active = String(String(post.id) === currentPostId);

    const title = document.createElement("strong");
    title.textContent = post.title || "Публикация";

    const meta = document.createElement("small");
    meta.textContent = [post.source?.type === "publisher" ? "Ваш сайт" : "VK", post.hidden?'Скрыта':'',displayDate(post.publishedAt)].filter(Boolean).join(" · ");

    button.append(title, meta);
    button.onclick = () => {
      renderPreview(post);
      renderList();
    };
    root.append(button);
  }
}

async function loadFeed() {
  $("#feed-status").textContent = "Обновляем предпросмотр…";

  try {
    const response = await fetch(apiEndpoint ? endpoint(token?'/posts':"/public/feed") : "../feed.json", {
      cache: "no-store",
    signal: AbortSignal.timeout(6000),
      headers: { accept: "application/json",...(token?{authorization:'Bearer '+token}:{}) },
    });

    if (!response.ok) throw new Error("feed.json unavailable");

    const data = await response.json();
    feed = Array.isArray(data) ? data : [];
    if (isDemo() && isPublisher()) {
      try { const saved = JSON.parse(localStorage.getItem(demoFeedKey()) || "null");if (Array.isArray(saved)) feed = saved; } catch {}
    }
    feed.sort((a, b) =>
      String(b.publishedAt || "").localeCompare(String(a.publishedAt || "")),
    );

    const keep =
      feed.find((item) => String(item.id) === currentPostId) || feed[0] || null;

    renderPreview(keep);
    renderList();

    $("#feed-status").textContent = feed.length
      ? "В предпросмотре: " + feed.length + " публичных записей."
      : "Синхронизированных записей пока нет.";
  } catch (error) {
    feed = [];
    renderList();
    $("#feed-status").textContent =
      "Не удалось загрузить предпросмотр. Публикации во VK не изменены.";
  }
}

function contactsFromPartner(partner) {
  const byType = Object.fromEntries(
    (Array.isArray(partner?.contacts) ? partner.contacts : []).map((item) => [
      item.type,
      item.href,
    ]),
  );

  return {
    email: String(byType.email || "").replace(/^mailto:/i, ""),
    vk: String(byType.vk || ""),
    avito: String(byType.avito || ""),
  };
}

function fillContacts(value = {}) {
  $("#contact-email").value = value.email || "";
  $("#contact-vk").value = value.vk || "";
  $("#contact-avito").value = value.avito || "";
}

async function loadPublicContacts() {
  try {
    const partner = await fetch("../partner.json", { cache: "no-store" }).then(
      (response) => {
        if (!response.ok) throw new Error("partner.json unavailable");
        return response.json();
      },
    );
    fillContacts(contactsFromPartner(partner));
  } catch {}

  if (!apiEndpoint) {
    try {
      const saved = JSON.parse(localStorage.getItem(CONTACT_KEY) || "{}");
      if (saved && Object.keys(saved).length) fillContacts(saved);
    } catch {}
  }
}

async function loadProtectedContacts() {
  if (!apiEndpoint || !token) return;
  const data = await api("/contacts");
  fillContacts(data);
}

$("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  $("#login-status").textContent = "Проверяем доступ…";

  try {
    const data = await api("/session", {
      method: "POST",
      body: {
        partnerId: $("#login-partner-id").value.trim(),
        accessKey: $("#login-access-key").value,
      },
    });

    saveSession(data.token || "");
    await loadProtectedContacts();
    const state = await api("/status");
    cfg.publishingSource = state.publishingSource;
    configurePublisher();
    await loadFeed();
    hideLogin();
    $("#contact-status").textContent =
      "Защищённые настройки подключены.";
  } catch (error) {
    $("#login-status").textContent =
      error.message || "Не удалось войти.";
  }
});

$("#save-contacts").addEventListener("click", async () => {
  const contacts = {
    email: $("#contact-email").value.trim(),
    vk: $("#contact-vk").value.trim(),
    avito: $("#contact-avito").value.trim(),
  };

  $("#contact-status").textContent = "Сохраняем…";

  if (!apiEndpoint) {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(contacts));
    $("#contact-status").textContent =
      "Демо: сохранено только в этом браузере.";
    return;
  }

  if (!token) {
    showLogin("Войдите, чтобы изменить контакты.");
    $("#contact-status").textContent =
      "Для сохранения контактов нужен вход в Studio.";
    return;
  }

  try {
    await api("/contacts", {
      method: "PUT",
      body: { contacts },
    });
    $("#contact-status").textContent = "Контакты сохранены.";
  } catch (error) {
    $("#contact-status").textContent =
      error.message || "Не удалось сохранить.";
  }
});

$("#refresh-feed").addEventListener("click", loadFeed);

function configurePublisher() {
  $("#publisher-panel").hidden = !isPublisher();
  if (!isPublisher()) return;
  $("#post-image").closest("label").hidden = isDemo();
  $("#post-video").closest("label").hidden = isDemo();
  $("#studio-title").textContent = "Ваши публикации";
  $("#studio-lead").textContent = "Напишите пост или получите его из VK. Фото и видео можно добавить вместе с текстом.";
  $("#source-instruction").textContent = "Изменяйте любые записи здесь. Удаление записи VK скрывает только копию на сайте. Новая правка в VK заменяет местные изменения; скрытая копия остаётся скрытой.";
  $("#source-description").textContent = "Источник — ваше хранилище. Текст не проходит через сервер Syolana.";
  $("#publisher-help").textContent = isDemo()
    ? "Демонстрация: изменения видны только в этом браузере. Облачная публикация ещё не подключена."
    : "Записи сохраняются в вашем аккаунте Яндекс Cloud. Здесь нет автоматической проверки прав на ваши материалы.";
}
function resetEditor() {
  editingPostId = "";$("#publisher-form").reset();$("#publish-post").textContent = "Опубликовать";
}
$("#new-post").onclick = resetEditor;
$("#edit-post").onclick = () => {
  const post = feed.find(p => p.id === currentPostId);
  if (!post) { $("#publisher-status").textContent = "Выберите свою запись в списке.";return; }
  editingPostId = post.id;$("#post-title").value = post.title;$("#post-text").value = post.text;
  $("#post-category").value = post.category || "Новости";$("#post-image").value = post.source?.type==='vk'?'':post.media?.find(m=>m.type==='image')?.src || "";
  $("#post-video").value = post.source?.type==='vk'?'':post.media?.find(m=>m.type==='video' && previewMediaAllowed(m.src))?.src || '';
  $("#publish-post").textContent = "Сохранить изменения";$("#post-title").focus();
};
$("#publisher-form").addEventListener("submit", async event => {
  event.preventDefault();if (!isPublisher()) return;
  if (!isDemo() && !token) { showLogin("Войдите, чтобы опубликовать запись.");return; }
  const body = { title: $("#post-title").value.trim(), text: $("#post-text").value.trim(),
    category: $("#post-category").value.trim(), imageUrl: $("#post-image").value.trim(),videoUrl:$("#post-video").value.trim(),keepSourceMedia:true };
  if (!body.title) return;
  $("#publish-post").disabled = true;$("#publisher-status").textContent = "Сохраняем…";
  try {
    const file=$('#post-file').files[0];let demoMedia=[];
    if(file){
      if(file.size>2*1024*1024)throw Error('Файл должен быть не больше 2 МБ. Для длинного видео используйте публикацию VK.');
      const data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)});
      if(isDemo())demoMedia=[{type:file.type.startsWith('video/')?'video':'image',src:data,alt:''}];
      else{const upload=await api('/media',{method:'POST',body:{contentType:file.type,data:data.split(',')[1]}});body[upload.type==='video'?'videoUrl':'imageUrl']=upload.url;}
    }
    if (isDemo()) {
      // Demo never transmits drafts, contacts or tokens to a server.
      const old = feed.find(p => p.id === editingPostId);
      const post = { ...old, id: editingPostId || "post-" + crypto.randomUUID(), title: body.title,
        text: body.text, category: body.category || "Новости", media: demoMedia.length?demoMedia:old?.media||[], publishedAt: old?.publishedAt || new Date().toISOString(),
        source: old?.source || { type: "publisher", partnerId: cfg.partnerId } };
      feed = [post, ...feed.filter(p => p.id !== post.id)].slice(0,100);
      localStorage.setItem(demoFeedKey(),JSON.stringify(feed));currentPostId = post.id;
    } else {
      const data = await api(editingPostId ? "/posts/" + editingPostId : "/posts", { method: editingPostId ? "PUT" : "POST", body });
      currentPostId = data.post?.id || currentPostId;
    }
    resetEditor();await loadFeed();$("#publisher-status").textContent = isDemo() ? "Сохранено для демонстрации в этом браузере." : "Опубликовано на вашем сайте.";
  } catch(error) { $("#publisher-status").textContent = error.message || "Не удалось опубликовать."; }
  finally { $("#publish-post").disabled = false; }
});
$("#delete-post").onclick = async () => {
  const post = feed.find(p => p.id === currentPostId);
  if (!isPublisher() || !post) return;
  if (!confirm("Удалить выбранную публикацию с сайта?")) return;
  try {
    if (isDemo()) { feed = post.source?.type==='vk'?feed.map(p=>p.id===post.id?{...p,hidden:true}:p):feed.filter(p => p.id !== post.id);localStorage.setItem(demoFeedKey(),JSON.stringify(feed)); }
    else await api("/posts/" + post.id,{method:"DELETE"});
    resetEditor();currentPostId = "";await loadFeed();$("#publisher-status").textContent = "Запись удалена.";
  } catch(error) { $("#publisher-status").textContent = error.message; }
};
$('#restore-post').onclick=async()=>{
  const post=feed.find(p=>p.id===currentPostId&&p.source?.type==='vk');if(!post)return;
  try{if(isDemo()){post.hidden=false;localStorage.setItem(demoFeedKey(),JSON.stringify(feed));}else await api('/posts/'+post.id,{method:'PUT',body:{restore:true}});await loadFeed();$('#publisher-status').textContent='Запись снова видна на сайте.';}catch(error){$('#publisher-status').textContent=error.message;}
};

async function boot() {
  try {
    cfg = await fetch("./studio-config.json", { cache: "no-store" }).then(
      (response) => (response.ok ? response.json() : {}),
    );
  } catch {
    cfg = {};
  }

  apiEndpoint = String(cfg.apiEndpoint || "").trim();
  token = sessionStorage.getItem(SESSION_KEY) || "";
  configurePublisher();

  await Promise.all([loadFeed(), loadPublicContacts()]);

  if (!apiEndpoint) {
    $("#security-title").textContent = isPublisher() ? "Тестовый редактор" : "VK — источник публикаций";
    $("#security-text").textContent =
      isPublisher() ? "Демо ничего не отправляет в облако. Попробуйте текст, затем откройте сайт в этом браузере."
      : "Публичные записи отображаются из feed.json. В рабочем варианте синхронизация выполняется в облачном аккаунте партнёра.";
    return;
  }

  $("#security-title").textContent = "Раздельная архитектура";
  $("#security-text").textContent =
    "Публикации синхронизируются у партнёра; Настройки хранятся у владельца сайта в российском облаке и не зависят от подписки на оформление Syolana.";

  if (!token) {
    showLogin();
    return;
  }

  try {
    await loadProtectedContacts();
    const state = await api("/status");cfg.publishingSource = state.publishingSource;configurePublisher();
    hideLogin();
  } catch (error) {
    showLogin(error.message);
  }
}

boot();
