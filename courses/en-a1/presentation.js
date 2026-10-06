// Display and navigation helpers do not own or interrupt the speech queue.
export const COURSE_VIEWS = [
  ['days', 'Курс по дням'], ['reading', 'Чтение и звуки'],
  ['grammar', 'Правила и конструкции'], ['vocabulary', 'Словарь'],
  ['variants', 'Британия и США'], ['trainers', 'Повторение до автоматизма'],
  ['practice', 'Говорите, читайте и пишите'], ['coverage', 'Что входит в A1']
];

export function displayIPA(value) {
  return '[' + String(value || '').trim().replace(/^[/\[]|[/\]]$/g, '') + ']';
}
export function displayText(value) {
  return String(value || '').replace(/\/([A-Za-zəɪʊɑɒɔɜθðʃʒŋˈˌːæʌɡɛɹɚɝʔɾ .()-]+)\//g, '[$1]');
}
export function topicTitle(section) {
  return section.title.replace(/^\d+\.\s*/, '');
}
export function entriesLabel(count) {
  const n = Math.abs(count), last = n % 10, teen = n % 100;
  const noun = teen >= 11 && teen <= 14 ? 'словарных статей'
    : last === 1 ? 'словарная статья' : last >= 2 && last <= 4 ? 'словарные статьи' : 'словарных статей';
  return count + ' ' + noun;
}
export function dayDescription(day, groups) {
  const topics = [...new Set(day.rules.map(r => topicTitle(r.section)))];
  const ids = [...new Set(day.words.map(w => w.group))];
  const vocabulary = ids.map(id => groups.find(g => g.id === id)?.title).filter(Boolean);
  return {
    title: day.number === 1 ? 'Сначала — чтение и звуки' : topics[0] || 'Закрепляем слова и фразы',
    topics, vocabulary,
    extras: [...new Set(day.extras.map(u => u.kind === 'comparison' ? 'сравнение британского и американского вариантов' : 'бытовые ситуации'))]
  };
}

export function resolveView(raw, data, curriculum, trainers) {
  const key = String(raw || 'days').replace(/^#/, '');
  if (COURSE_VIEWS.some(([id]) => id === key)) return {key, type: key};
  const day = curriculum.days.find(d => d.id === key);
  if (day) return {key, type: 'day', day};
  const rule = data.rules.find(r => r.id === key);
  if (rule) return {key, type: 'rule', rule};
  const trainer = trainers.find(t => 'repeat-' + t.id === key);
  if (trainer) return {key, type: 'trainer', trainer};
  // Existing bookmarks to word articles remain useful.
  const word = data.vocabulary.find(w => w.id === key);
  if (word) return {key, type: 'word', word};
  return {key: 'days', type: 'days'};
}
