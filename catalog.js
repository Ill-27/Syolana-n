// Reads the existing GitHub catalog. Book/chapter text stays in books/*.json.
import { safeURL } from "./utils.js";
let catalogPromise;
const chapters = new Map();
function idPath(id) {
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw Error("Некорректный адрес главы.");
  return "books/" + id + ".json";
}
export async function loadChapter(id) {
  if (!chapters.has(id)) {
    const pending = fetch(idPath(id))
      .then(async (response) => {
        if (!response.ok)
          throw Error(
            "Не удалось загрузить главу. Вернитесь в каталог и попробуйте снова.",
          );
        const chapter = await response.json();
        if (!Array.isArray(chapter.blocks))
          throw Error("Неверный формат главы.");
        return chapter;
      })
      .catch((error) => {
        chapters.delete(id);
        throw error;
      });
    chapters.set(id, pending);
  }
  return chapters.get(id);
}
export function loadCatalog() {
  if (!catalogPromise)
    catalogPromise = fetch("books/catalog.json", { cache: "no-cache" })
      .then(async (r) => {
        if (!r.ok)
          throw Error("Библиотека временно недоступна. Обновите страницу.");
        const data = await r.json();
        if (!Array.isArray(data)) throw Error("Не удалось прочитать каталог.");
        return data.map((b) => ({
          ...b,
          title: b.title_ru || b.title_en || "Без названия",
          author: b.author_ru || b.author_en || "Автор",
          kind: "book",
          external: safeURL(b.external_url),
        }));
      })
      .catch((e) => {
        catalogPromise = null;
        throw e;
      });
  return catalogPromise;
}
export async function loadBook(id, chapterIndex = 0) {
  const book = (await loadCatalog()).find((b) => b.id === id);
  if (!book || book.external) throw Error("Книга не найдена в библиотеке.");
  const first = await loadChapter(id);
  const contents = book.chapters ||
    first.meta?.chapters || [{ id, title_ru: "Начало истории" }];
  const list = contents.map((c) => ({
    id: c.id,
    title: c.title_ru || c.title_en || "Глава",
  }));
  const index = Math.max(
    0,
    Math.min(Number(chapterIndex) || 0, list.length - 1),
  );
  const raw = list[index].id === id ? first : await loadChapter(list[index].id);
  const blocks = raw.blocks
    .filter((b) => b.type === "stanza")
    .flatMap((b) => {
      const lines = b.ru || b.en || [];
      const cues = [{ line: 0, color: b.color, audio: b.audio }, ...(Array.isArray(b.cues) ? b.cues : [])]
        .filter(c => Number.isInteger(c.line) && c.line >= 0 && c.line < lines.length)
        .sort((a, z) => a.line - z.line)
        .filter((c, i, all) => !i || c.line !== all[i - 1].line);
      return cues.map((c, i) => ({
        text: lines.slice(c.line, cues[i + 1]?.line ?? lines.length).join(raw.type === "poetry" ? "\n" : "\n\n"),
        color: readingColor(c.color || b.color),
        audio: typeof (c.audio ?? b.audio) === "string" ? (c.audio ?? b.audio) : "",
      }));
    })
    .filter((b) => b.text);
  return {
    book: { ...book, chapters: list, poetry: raw.type === "poetry" },
    chapter: { title: list[index].title, blocks, mood: "auto" },
    index,
  };
}
// Legacy colors may be too dark. Keep the hue, lift it into a readable pastel.
export function readingColor(value) {
  if (!/^#[\da-f]{6}$/i.test(value || "")) return "#ece8f5";
  const rgb = [1, 3, 5].map((i) => parseInt(value.slice(i, i + 2), 16));
  const lo = Math.min(...rgb),
    hi = Math.max(...rgb);
  if (hi - lo < 8) return "#ece8f5";
  return (
    "#" +
    rgb
      .map((c) =>
        Math.round(150 + ((c - lo) / (hi - lo)) * 105)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("")
  );
}
export const lessonFiles = {
  "en/a1/course": "a1-english.html",
  "en/a2/course": "a2-english.html",
  "es/a1/rules": "a1-spanish-rules.html",
  "es/a1/words": "a1-spanish-words.html",
  "es/a1/practice": "a1-spanish-practice.html",
  "fr/a1/rules": "a1-françes-rules.html",
  "fr/a1/words": "a1-françes-words.html",
  "es/a2/rules": "api/lessons/es/a2/rules",
  "es/a2/words": "api/lessons/es/a2/words",
  "es/b1/rules": "api/lessons/es/b1/rules",
  "es/b2/rules": "api/lessons/es/b2/rules",
};

