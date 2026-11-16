// Display and navigation helpers do not own or interrupt the speech queue.
export const COURSE_VIEWS = [
  ['days', 'Курс по дням'], ['reading', 'Чтение и звуки'],
  ['grammar', 'Правила и конструкции'], ['vocabulary', 'Словарь'],
  ['variants', 'Франция и другие страны'], ['trainers', 'Повторение до автоматизма'],
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
    extras: [...new Set(day.extras.map(u => u.kind === 'comparison' ? 'региональные варианты французского' : 'бытовые ситуации'))]
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

// The current edition uses the same verified access as existing licenses.
export async function currentFrenchEdition(previous,{fetcher=globalThis.fetch,crypto=globalThis.crypto}={}){
 const version='2026-11-15.fr.a1.pronunciation-and-listening.4';
 if(previous.version===version)return previous;
 const response=await fetcher(new URL('../../owner-vault/fr-a1-current.json?v=20261116-current-1',import.meta.url),{cache:'no-store'});
 if(!response.ok)throw Error('Не удалось загрузить обновлённый французский A1. Проверьте интернет и повторите.');
 const record=await response.json();if(record.schema!=='syolana.fr-a1.current.v1'||record.version!==version)throw Error('Обновите страницу французского A1.');
 const material=JSON.stringify(previous.vocabulary.map(w=>[w.id,w.head.en,w.head.ru,...w.examples.map(p=>p.en)]));
 const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(material));
 const key=await crypto.subtle.importKey('raw',digest,'AES-GCM',false,['decrypt']);
 const decode=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
 const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(record.iv),additionalData:new TextEncoder().encode(record.schema)},key,decode(record.ciphertext));
 const raw=await new Response(new Blob([plain]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',raw)),b=>b.toString(16).padStart(2,'0')).join('');
 if(hash!==record.dataSha256)throw Error('Не удалось проверить обновлённый материал.');
 return JSON.parse(new TextDecoder().decode(raw));
}
