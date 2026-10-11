const DOMAIN = { vk: 'vk.com', avito: 'avito.ru' };
export function normalizeContacts(value = {}) {
  const result = {};
  for (const type of ['email', 'vk', 'avito']) {
    const raw = String(value[type] || '').trim();
    if (raw.length > 2000) throw Error('Контакт слишком длинный. Проверьте адрес.');
    if (!raw) { result[type] = ''; continue; }
    if (type === 'email') {
      const email = raw.replace(/^mailto:/i, '');
      if (email.length > 254 || !/^[^\s@<>?#]+@[^\s@<>?#]+\.[^\s@<>?#]+$/.test(email)) throw Error('Проверьте адрес электронной почты.');
      result.email = email;
    } else {
      let url; try { url = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch { throw Error('Проверьте ссылку ' + (type === 'vk' ? 'VK.' : 'Авито.')); }
      const domain = DOMAIN[type];
      if (url.protocol !== 'https:' || url.username || url.password || url.port ||
          !(url.hostname === domain || url.hostname.endsWith('.' + domain))) throw Error('Укажите ссылку https://' + domain + '/…');
      result[type] = url.href;
    }
  }
  return result;
}
export const contactStorageKey = id => 'partner-demo.contacts.' + id;
export function readDemoContacts(storage, id) {
  try {
    const value = storage.getItem(contactStorageKey(id));
    // The earlier demo used a single key. Migrate only its known demo project.
    const legacy = value === null && id === 'lana-test' ? storage.getItem('partner-studio.contacts.v3') : null;
    if (value === null && legacy === null) return null;
    const clean = normalizeContacts(JSON.parse(value ?? legacy));
    if (legacy !== null) storage.setItem(contactStorageKey(id), JSON.stringify(clean));
    return clean;
  } catch { return null; }
}
export function contactLinks(value) {
  const contacts = normalizeContacts(value);
  return ['email', 'vk', 'avito'].filter(type => contacts[type]).map(type => ({
    type, label: { email: 'Написать на почту', vk: 'VK', avito: 'Авито' }[type],
    href: type === 'email' ? 'mailto:' + contacts[type] : contacts[type],
  }));
}
export function announceDemoUpdate(id, section) {
  window.dispatchEvent(new CustomEvent('syolana:demo-update', { detail: { id, section } }));
  try { const channel = new BroadcastChannel('syolana-demo'); channel.postMessage({ id, section }); channel.close(); } catch {}
}
