import {
  el,
  link,
  button,
  notify,
  chaptersFrom,
  textFromChapters,
  download,
  formatDate,
  moods,
  safeURL,
} from "./utils.js";
const categories = [
  "Писатель",
  "Блогер",
  "Музыкант",
  "Художник",
  "Дизайнер",
  "Фотограф",
  "Турагент",
  "Организатор событий",
  "Другое творчество",
];
const states = {
  draft: "Черновик",
  pending: "На проверке",
  approved: "Одобрено",
  rejected: "Нужны изменения",
};
function field(label, name, value = "", type = "text") {
  const l = el("label", "field", label);
  const input = el(type === "textarea" ? "textarea" : "input");
  if (type !== "textarea") input.type = type;
  input.name = name;
  input.value = value ?? "";
  l.append(input);
  return [l, input];
}
function selectField(label, name, options, value) {
  const l = el("label", "field", label);
  const s = el("select");
  s.name = name;
  for (const [k, v] of Object.entries(options)) {
    const o = el("option", "", v);
    o.value = k;
    s.append(o);
  }
  s.value = value || Object.keys(options)[0];
  l.append(s);
  return [l, s];
}
export class Studio {
  constructor(api, rerender) {
    this.api = api;
    this.rerender = rerender;
  }
  async render(root, token, getToken) {
    if (!this.api.online) {
      const actions = el("div", "studio-fallback-actions");
      actions.append(
        link("Попробовать читалку", "#/book/turgenev_sparrow/0", "btn primary"),
        link("Условия для партнёров", "#/join", "btn"),
      );
      root.append(
        el("h1", "", "Редактор сайта"),
        el(
          "p",
          "notice",
          "Редактор работает с сервером Syolana. В статическом предпросмотре регистрация и сохранение на сервере недоступны.",
        ),
        actions,
      );
      return;
    }
    await this.api.session();
    if (getToken && token !== getToken()) return;
    if (!this.api.me) {
      this.auth(root);
      return;
    }
    const data = await this.api.request("studio");
    if (getToken && token !== getToken()) return;
    this.data = data;
    const toolbar = el("div", "studio-toolbar");
    toolbar.append(el("h1", "", "Редактор сайта"));
    const actions = el("div", "row");
    if (this.api.me.role === "admin")
      actions.append(link("Публикации и доступ", "#/admin"));
    actions.append(
      button(
        "Выйти",
        async () => {
          await this.api.request("auth/logout", { method: "POST", body: {} });
          this.api.me = null;
          this.rerender();
        },
        "subtle-btn",
      ),
    );
    toolbar.append(actions);
    root.append(toolbar);
    if (!data.site) {
      this.profile(root, null);
      return;
    }
    const site = data.site;
    const top = el("section", "strip glass");
    const left = el("div");
    left.append(
      el("span", "badge", states[site.review_status] || "Черновик"),
      el("h3", "", site.draft.name),
    );
    const desc = data.active
      ? "Полное оформление доступно до " + formatDate(data.accessUntil)
      : site.trial_ends
        ? "Период доступа закончился. Опубликованный текст доступен в простом оформлении."
        : "Пробный период начнётся после одобрения страницы.";
    left.append(el("p", "", desc));
    if (site.review_note) left.append(el("p", "", site.review_note));
    top.append(left);
    if (site.published)
      top.append(link("Открыть мой сайт", "#/s/" + site.slug));
    root.append(top);
    const account = el("div", "row");
    account.append(
      button("Выгрузить мои материалы", async () => {
        try {
          const d = await this.api.request("export");
          download("syolana-my-content.json", JSON.stringify(d, null, 2));
        } catch (e) {
          notify(e.message);
        }
      }),
    );
    if (this.api.settings.paymentsEnabled)
      account.append(
        button(
          "Оплатить месяц · " +
            Number(data.priceRub || 1000).toLocaleString("ru") +
            " ₽",
          async (e) => {
            const b = e.currentTarget;
            b.disabled = true;
            try {
              const x = await this.api.request("checkout", {
                method: "POST",
                body: {},
              });
              const url = safeURL(x.url);
              if (!url) throw Error("Не получена ссылка оплаты.");
              location.assign(url);
            } catch (err) {
              notify(err.message);
              b.disabled = false;
            }
          },
          "btn primary",
        ),
      );
    else
      account.append(el("small", "muted", "Онлайн-оплата ещё не подключена."));
    root.append(account);
    const portable = link(
      "Скачать независимый сайт (.zip)",
      new URL("api/export-site", document.baseURI).href,
    );
    portable.download = "my-independent-site.zip";
    root.append(portable);
    const editProfile = el("details", "card");
    editProfile.style.marginTop = "25px";
    editProfile.append(el("summary", "", "Настройки моего сайта"));
    this.profile(editProfile, site);
    root.append(editProfile);
    const title = el("div", "section-heading");
    title.append(
      el("h2", "", "Мои публикации"),
      button("Добавить", () => this.editor(root, null), "btn primary"),
    );
    root.append(title);
    const list = el("div", "card");
    if (!data.posts.length)
      list.append(
        el("p", "muted", "Начните с первой книги, статьи или работы."),
      );
    data.posts.forEach((p) => {
      const row = el("div", "document-row");
      const meta = el("div");
      meta.append(
        el("h3", "", p.draft.title),
        el(
          "small",
          "",
          states[p.review_status] +
            (p.published ? " · Есть опубликованная версия" : ""),
        ),
      );
      if (p.review_note) meta.append(el("p", "fine muted", p.review_note));
      const controls = el("div", "row");
      controls.append(
        button("Редактировать", () => this.editor(root, p), "btn small"),
      );
      if (p.published)
        controls.append(
          link(
            "Открыть",
            "#/s/" + site.slug + "/book/" + p.id + "/0",
            "btn small",
          ),
        );
      row.append(meta, controls);
      list.append(row);
    });
    root.append(list);
    if (!data.posts.length) this.editor(root, null);
  }
  auth(root, register = false) {
    const wrap = el("section", "auth");
    wrap.append(
      el("h1", "", register ? "Создайте свою студию" : "Добро пожаловать"),
      el(
        "p",
        "muted",
        register
          ? "Сначала создайте черновик. Оплата для знакомства не нужна."
          : "Войдите, чтобы редактировать сайт и добавлять материалы.",
      ),
    );
    const form = el("form", "form card");
    form.style.marginTop = "25px";
    const [emailLabel, email] = field("Email", "email", "", "email");
    email.autocomplete = "email";
    email.required = true;
    email.maxLength = 254;
    const [passLabel, pass] = field("Пароль", "password", "", "password");
    pass.autocomplete = register ? "new-password" : "current-password";
    pass.required = true;
    pass.minLength = register ? 10 : 1;
    pass.maxLength = 128;
    form.append(emailLabel, passLabel);
    if (register) {
      passLabel.append(
        el("small", "", "Минимум 10 символов. Используйте уникальный пароль."),
      );
      const l = el("label", "field");
      const row = el("span", "check");
      const c = el("input");
      c.type = "checkbox";
      c.name = "agreed";
      c.required = true;
      row.append(
        c,
        el(
          "span",
          "",
          "Я прочитал(а) условия тест-драйва и согласен(на) на обработку данных для работы кабинета.",
        ),
      );
      l.append(row, link("Прочитать условия", "#/terms", "text-link"));
      form.append(l);
    }
    const submit = el(
      "button",
      "btn primary",
      register ? "Создать аккаунт" : "Войти",
    );
    submit.type = "submit";
    form.append(submit);
    const status = el("p", "notice error");
    status.hidden = true;
    status.setAttribute("role", "alert");
    form.append(status);
    form.onsubmit = async (e) => {
      e.preventDefault();
      submit.disabled = true;
      status.hidden = true;
      try {
        const values = {
          email: email.value,
          password: pass.value,
          agreed: register,
          termsVersion: this.api.settings.termsVersion,
        };
        await this.api.auth(register ? "register" : "login", values);
        this.rerender();
      } catch (err) {
        status.hidden = false;
        status.textContent = err.message;
        submit.disabled = false;
      }
    };
    wrap.append(
      form,
      button(
        register ? "Уже есть аккаунт? Войти" : "Создать аккаунт",
        () => {
          root.replaceChildren();
          this.auth(root, !register);
        },
        "subtle-btn",
      ),
    );
    if (!register)
      wrap.append(
        el(
          "p",
          "fine muted",
          "По вопросам доступа напишите Syolana в официальном профиле на Авито: https://www.avito.ru/brands/i223140984.",
        ),
      );
    if (register && !this.api.settings.registrationOpen) {
      submit.disabled = true;
      wrap.append(
        el(
          "p",
          "notice",
          "Регистрация пока закрыта. Можно посмотреть библиотеку и условия для партнёров.",
        ),
      );
    }
    root.append(wrap);
  }
  profile(root, site) {
    const form = el("form", "form");
    form.style.marginTop = "23px";
    if (!site) form.append(el("h2", "", "Назовите ваше пространство"));
    const draft = site?.draft || {};
    const [nameLabel, name] = field(
      "Название сайта или имя автора",
      "name",
      draft.name,
    );
    name.required = true;
    name.maxLength = 100;
    const [slugLabel, slug] = field("Короткий адрес", "slug", site?.slug);
    slug.required = true;
    slug.pattern = "[a-z0-9][a-z0-9-]{2,39}";
    slug.maxLength = 40;
    slug.placeholder = "marina-books";
    slug.readOnly = Boolean(site);
    slugLabel.append(
      el(
        "small",
        "",
        "Латинские буквы, цифры и дефис. Например: marina-books.",
      ),
    );
    const [catLabel, cat] = selectField(
      "Ваше творчество",
      "category",
      Object.fromEntries(categories.map((c) => [c, c])),
      draft.category,
    );
    const [bioLabel, bio] = field(
      "О вашем творчестве",
      "bio",
      draft.bio,
      "textarea",
    );
    bio.maxLength = 3000;
    const [linkLabel, contact] = field(
      "Ссылка для связи или ваш основной сайт",
      "link",
      draft.link,
      "url",
    );
    contact.maxLength = 500;
    form.append(nameLabel, slugLabel, catLabel, bioLabel, linkLabel);
    const save = el(
      "button",
      "btn primary",
      site
        ? "Сохранить и отправить на проверку"
        : "Создать сайт и отправить на проверку",
    );
    save.type = "submit";
    form.append(save);
    form.onsubmit = async (e) => {
      e.preventDefault();
      save.disabled = true;
      try {
        await this.api.request("site", {
          method: "POST",
          body: {
            name: name.value,
            slug: slug.value,
            category: cat.value,
            bio: bio.value,
            link: contact.value,
          },
        });
        notify("Страница отправлена на проверку.");
        this.rerender();
      } catch (err) {
        notify(err.message);
        save.disabled = false;
      }
    };
    root.append(form);
  }
  editor(root, post) {
    root.querySelector("#editor")?.remove();
    const card = el("section", "card editor stack");
    card.id = "editor";
    card.style.marginTop = "28px";
    card.append(
      el("h2", "", post ? "Редактирование публикации" : "Новая публикация"),
    );
    const d = post?.draft || {};
    const form = el("form", "form");
    const [titleLabel, title] = field("Название", "title", d.title);
    title.required = true;
    title.maxLength = 160;
    const [kindLabel, kind] = selectField(
      "Тип публикации",
      "kind",
      {
        book: "Книга",
        post: "Статья или пост",
        music: "Музыкальная работа",
        portfolio: "Работа в портфолио",
      },
      d.kind,
    );
    const [descLabel, description] = field(
      "Описание для каталога",
      "description",
      d.description,
      "textarea",
    );
    description.maxLength = 1000;
    description.style.minHeight = "90px";
    const importLabel = el("label", "field", "Загрузить книгу в TXT (UTF-8)");
    const file = el("input");
    file.type = "file";
    file.accept = ".txt,text/plain";
    importLabel.append(
      file,
      el(
        "small",
        "",
        "Или вставьте текст ниже. Заголовки «Глава 1» или строки с # станут главами. DOCX и EPUB пока нужно преобразовать в TXT.",
      ),
    );
    const [textLabel, text] = field(
      "Текст публикации",
      "text",
      textFromChapters(d.chapters || []),
      "textarea",
    );
    text.classList.add("editor-text");
    text.required = true;
    text.maxLength = 2000000;
    let chapters = d.chapters || [];
    file.onchange = async () => {
      const f = file.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        notify("Текстовый файл должен быть меньше 5 МБ.");
        return;
      }
      text.value = (await f.text()).replace(/^\uFEFF/, "");
      segment();
    };
    const manual = el("details");
    manual.append(el("summary", "", "Главы и настроение"));
    const chapterFields = el("div", "chapter-fields");
    manual.append(chapterFields);
    function segment() {
      const previous = chapters;
      chapters = chaptersFrom(text.value);
      chapters.forEach((c, i) => {
        if (previous[i]?.title === c.title) c.mood = previous[i].mood;
      });
      chapterFields.replaceChildren();
      chapters.forEach((c, i) => {
        const [l, s] = selectField(c.title, "mood-" + i, moods, c.mood);
        s.onchange = () => (chapters[i].mood = s.value);
        chapterFields.append(l);
      });
      if (!chapters.length)
        chapterFields.append(el("p", "muted", "Сначала добавьте текст."));
    }
    segment();
    manual.addEventListener("toggle", () => {
      if (manual.open) segment();
    });
    const [coverLabel, cover] = field(
      "Обложка: PNG, JPEG, WEBP или MP4",
      "cover",
      "",
      "file",
    );
    cover.accept = "image/png,image/jpeg,image/webp,video/mp4";
    const [mediaLabel, media] = field(
      "Видео MP4 или аудио MP3 (до 20 МБ)",
      "media",
      "",
      "file",
    );
    media.accept = "video/mp4,audio/mpeg";
    const [externalLabel, external] = field(
      "Или ссылка на видео / другую работу",
      "mediaUrl",
      d.mediaUrl,
      "url",
    );
    external.maxLength = 1500;
    const rights = el("label", "field");
    const row = el("span", "check");
    const check = el("input");
    check.type = "checkbox";
    row.append(
      check,
      el(
        "span",
        "",
        "У меня есть права на публикацию этих материалов и разрешение на их оформление в Syolana.",
      ),
    );
    rights.append(row);
    const controls = el("div", "row");
    const save = el("button", "btn", "Сохранить черновик");
    save.type = "submit";
    const submit = button(
      "Отправить на публикацию",
      () => savePost(true),
      "btn primary",
    );
    controls.append(
      save,
      submit,
      button("Закрыть", () => card.remove(), "subtle-btn"),
    );
    const result = el("p", "notice");
    result.hidden = true;
    result.setAttribute("role", "status");
    form.append(
      titleLabel,
      kindLabel,
      descLabel,
      importLabel,
      textLabel,
      manual,
      coverLabel,
      mediaLabel,
      externalLabel,
      rights,
      controls,
      result,
    );
    let id = post?.id;
    let saving = false;
    const savePost = async (publish) => {
      if (saving || !form.reportValidity()) return;
      if (publish && !check.checked) {
        notify("Подтвердите наличие прав на материал.");
        check.focus();
        return;
      }
      saving = true;
      save.disabled = submit.disabled = true;
      try {
        segment();
        if (!chapters.length) throw Error("Добавьте текст.");
        let coverUrl = d.cover || "",
          mediaUrl = external.value.trim();
        if (cover.files[0])
          coverUrl = (await this.api.upload(cover.files[0])).url;
        if (media.files[0])
          mediaUrl = (await this.api.upload(media.files[0])).url;
        const payload = {
          id,
          title: title.value,
          description: description.value,
          kind: kind.value,
          chapters,
          cover: coverUrl,
          mediaUrl,
        };
        const response = await this.api.request("posts", {
          method: "POST",
          body: payload,
        });
        id = response.id;
        if (publish)
          await this.api.request("posts/" + id + "/submit", {
            method: "POST",
            body: { rights: true },
          });
        notify(
          publish ? "Материал отправлен на проверку." : "Черновик сохранён.",
        );
        this.rerender();
      } catch (err) {
        result.hidden = false;
        result.textContent = err.message;
        save.disabled = submit.disabled = false;
        saving = false;
      }
    };
    form.onsubmit = (e) => {
      e.preventDefault();
      savePost(false);
    };
    card.append(form);
    root.append(card);
    if (post) card.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  async admin(root) {
    await this.api.session();
    if (this.api.me?.role !== "admin")
      throw Error("Эта страница доступна администратору.");
    const data = await this.api.request("admin/queue");
    root.append(
      el("h1", "", "Проверка публикаций"),
      el(
        "p",
        "notice",
        "Одобрение относится именно к показанной версии. Сохранение автором нового черновика не изменяет уже опубликованный текст.",
      ),
      link("Редактор сайта", "#/studio", "text-link"),
    );
    if (!data.queue.length)
      root.append(el("p", "empty", "В очереди нет материалов."));
    for (const q of data.queue) {
      const item = el("article", "admin-item");
      item.append(
        el(
          "span",
          "badge",
          q.type === "site" ? "СТРАНИЦА АВТОРА" : "ПУБЛИКАЦИЯ",
        ),
        el("h2", "", q.payload.title || q.payload.name),
        el("p", "muted", q.email),
      );
      const content = el(
        "pre",
        "",
        q.type === "site"
          ? [q.payload.category, q.payload.bio, q.payload.link].join("\n\n")
          : [
              q.payload.description,
              ...(q.payload.chapters || []).map(
                (c) => c.title + "\n\n" + c.text,
              ),
            ].join("\n\n"),
      );
      item.append(content);
      if (q.payload.cover) {
        const img = el(
          /\.mp4(?:[?#]|$)/i.test(q.payload.cover) ? "video" : "img",
        );
        if (img.tagName === "VIDEO") {
          img.controls = true;
          img.muted = true;
          img.playsInline = true;
        }
        img.src = q.payload.cover;
        img.alt = "Обложка для проверки";
        item.append(img);
      }
      if (q.payload.mediaUrl)
        item.append(
          link("Проверить приложенное медиа", q.payload.mediaUrl, "text-link"),
        );
      const [label, note] = field(
        "Комментарий к решению",
        "note",
        "",
        "textarea",
      );
      note.maxLength = 1000;
      item.append(label);
      const actions = el("div", "row");
      for (const [decision, text] of [
        ["approve", "Одобрить"],
        ["reject", "Вернуть автору"],
      ])
        actions.append(
          button(
            text,
            async (e) => {
              e.currentTarget.disabled = true;
              try {
                await this.api.request("admin/review", {
                  method: "POST",
                  body: {
                    type: q.type,
                    id: q.id,
                    version: q.version,
                    decision,
                    note: note.value,
                  },
                });
                notify("Решение сохранено.");
                this.rerender();
              } catch (err) {
                notify(err.message);
                e.currentTarget.disabled = false;
              }
            },
            "btn " + (decision === "approve" ? "primary" : ""),
          ),
        );
      item.append(actions);
      root.append(item);
    }
    root.append(el("h2", "", "Обращения"));
    if (!data.reports.length)
      root.append(el("p", "muted", "Новых обращений нет."));
    data.reports.forEach((r) => {
      const c = el("article", "admin-item stack");
      c.append(
        link(r.url, r.url, "text-link"),
        el("p", "", r.reason),
        el("p", "muted", r.email),
        button("Отметить рассмотренным", async () => {
          await this.api.request("admin/reports/" + r.id, {
            method: "POST",
            body: {},
          });
          this.rerender();
        }),
      );
      root.append(c);
    });
    root.append(el("h2", "", "Доступ партнёров"));
    const partners = await this.api.request("admin/partners");
    const list = el("div", "stack");
    for (const partner of partners.partners) {
      const item = el("div", "notice");
      item.append(
        el("strong", "", partner.name + " · " + partner.slug),
        el("p", "", partner.email),
        el(
          "p",
          "",
          (partner.active
            ? "Оформление включено до " + formatDate(partner.accessUntil)
            : "Оформление выключено") +
            " · " +
            partner.priceRub +
            " ₽/месяц",
        ),
      );
      list.append(item);
    }
    root.append(list);
    const control = el("form", "form card");
    const [slugLabel, slug] = field("Адрес автора", "slug");
    const [daysLabel, days] = field(
      "Дней доступа после подтверждённой внешней оплаты",
      "days",
      "30",
      "number",
    );
    days.min = 1;
    days.max = 366;
    const [reasonLabel, reason] = field(
      "Основание: подтверждение оплаты или причины ограничения",
      "reason",
    );
    reason.required = true;
    reason.maxLength = 500;
    const [referenceLabel, reference] = field(
      "Уникальный номер подтверждённой оплаты / чека",
      "reference",
    );
    reference.maxLength = 100;
    const btns = el("div", "row");
    for (const [action, title] of [
      ["grant_month", "Оплата получена — добавить месяц"],
      ["grant", "Добавить указанное число дней"],
      ["expire", "Отключить оформление, сохранить тексты"],
      ["suspend", "Приостановить сайт"],
      ["restore", "Восстановить сайт"],
    ])
      btns.append(
        button(
          title,
          async () => {
            if (!control.reportValidity()) return;
            try {
              await this.api.request("admin/access", {
                method: "POST",
                body: {
                  slug: slug.value,
                  action,
                  days: Number(days.value),
                  reference: reference.value,
                  reason: reason.value,
                },
              });
              notify("Статус доступа обновлён.");
              this.rerender();
            } catch (err) {
              notify(err.message);
            }
          },
          "btn " + (action === "suspend" ? "danger" : ""),
        ),
      );
    control.append(
      slugLabel,
      daysLabel,
      referenceLabel,
      reasonLabel,
      btns,
      el(
        "p",
        "fine muted",
        "Возврат денег выполняется отдельно через платёжный кабинет. Приостановка здесь сама по себе не возвращает оплату.",
      ),
    );
    root.append(control);
  }
}
