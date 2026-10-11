export const $ = (id) => document.getElementById(id);
export function getPref(k, def) {
  try {
    return JSON.parse(localStorage.getItem("syolana:" + k)) ?? def;
  } catch {
    return def;
  }
}
export function setPref(k, v) {
  try {
    localStorage.setItem("syolana:" + k, JSON.stringify(v));
  } catch {}
}
let timer;
export function notify(message) {
  const node = $("toast");
  node.textContent = message;
  node.hidden = false;
  clearTimeout(timer);
  timer = setTimeout(() => (node.hidden = true), 5000);
}
export function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = String(text);
  return node;
}
export function safeURL(value, { media = false } = {}) {
  if (!value || typeof value !== "string") return "";
  const input = value.trim();

  // Contact links need to work, but never accept control characters or
  // executable schemes.
  if (!media && /^(?:mailto:|tel:)/i.test(input)) {
    if (/[\u0000-\u001F\u007F]/.test(input)) return "";
    try {
      const u = new URL(input);
      return ["mailto:", "tel:"].includes(u.protocol) ? u.href : "";
    } catch {
      return "";
    }
  }

  try {
    const u = new URL(input, document.baseURI);
    if (!["http:", "https:"].includes(u.protocol)) return "";
    if (location.protocol === "https:" && u.protocol !== "https:") return "";
    if (media && u.origin !== location.origin && u.protocol !== "https:")
      return "";
    return u.href;
  } catch {
    return "";
  }
}
export function link(text, href, cls = "btn") {
  const a = el("a", cls, text);
  const url = safeURL(href);
  if (url) {
    a.href = url;
    const protocol = new URL(url, document.baseURI).protocol;
    if (
      ["http:", "https:"].includes(protocol) &&
      new URL(url, document.baseURI).origin !== location.origin
    ) {
      a.target = "_blank";
      a.rel = "noopener noreferrer";
    }
  }
  return a;
}
export function button(text, fn, cls = "btn") {
  const b = el("button", cls, text);
  b.type = "button";
  b.addEventListener("click", fn);
  return b;
}
export function download(name, data, type = "application/json") {
  const blob = new Blob([data], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const moods = {
  auto: "По тексту",
  calm: "Спокойствие",
  hope: "Свет и надежда",
  tension: "Напряжение",
  wonder: "Тайна",
  neutral: "Без изменения",
};
export const moodColors = {
  calm: "#a6d9f8",
  hope: "#f3d395",
  tension: "#f3aabc",
  wonder: "#cbb0fa",
  neutral: "#ece8f5",
};
export function moodFor(text) {
  const t = text.toLowerCase();
  const scores = { calm: 0, hope: 0, tension: 0, wonder: 0 };
  const keys = {
    calm: [
      "тишин",
      "спокой",
      "море",
      "тихо",
      "покой",
      "quiet",
      "calm",
      "silence",
    ],
    hope: ["свет", "радост", "надежд", "солн", "улыб", "warm", "hope", "light"],
    tension: [
      "страх",
      "темнот",
      "крик",
      "буря",
      "опас",
      "гроз",
      "fear",
      "storm",
      "danger",
    ],
    wonder: [
      "звёзд",
      "звезд",
      "тайн",
      "лун",
      "сон",
      "чуд",
      "moon",
      "star",
      "dream",
    ],
  };
  for (const [m, words] of Object.entries(keys))
    for (const w of words) if (t.includes(w)) scores[m]++;
  const ordered = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return ordered[0][1] ? ordered[0][0] : "neutral";
}
export function chaptersFrom(text) {
  const input = String(text).replace(/\r\n?/g, "\n").trim();
  if (!input) return [];
  const chapters = [];
  let title = "Глава 1",
    lines = [],
    length = 0;
  const flush = () => {
    const body = lines.join("\n").trim();
    if (body) chapters.push({ title, text: body, mood: "auto" });
    lines = [];
    length = 0;
  };
  for (const line of input.split("\n")) {
    const head = line.trim();
    if (
      /^(?:(?:глава|часть|chapter|chapitre|capítulo)\s+[\divxlcdmа-яё]+|#{1,3}\s+.+)/iu.test(
        head,
      ) &&
      head.length <= 160
    ) {
      flush();
      title = head.replace(/^#{1,3}\s+/, "");
    } else {
      lines.push(line);
      length += line.length + 1;
      if (length > 40000 && !head) {
        flush();
        title = "Продолжение " + (chapters.length + 1);
      }
    }
  }
  flush();
  return chapters;
}
export function textFromChapters(chapters) {
  return chapters.map((c) => "# " + c.title + "\n\n" + c.text).join("\n\n");
}
export function formatDate(v) {
  return v
    ? new Intl.DateTimeFormat("ru", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(v * 1000))
    : "—";
}
