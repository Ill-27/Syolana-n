import translations from './interface-translations.json' with {type:'json'};
export const LOCALES=['ru','en','es','fr'];
const STORAGE='syolana.locale.v1';
const IDX={en:0,es:1,fr:2};
const norm=value=>String(value??'').replace(/\s+/g,' ').trim();
let locale='ru';
try {const saved=localStorage.getItem(STORAGE);if(LOCALES.includes(saved))locale=saved;} catch {}
const reverse=new Map();
for(const [source,row] of Object.entries(translations))for(const value of row)if(value&&!reverse.has(norm(value)))reverse.set(norm(value),source);
export function sourceFor(value){const raw=String(value??''),clean=norm(raw);return translations[clean]?clean:(reverse.get(clean)||raw);}
export function registerTranslations(rows){Object.assign(translations,rows);for(const [source,row]of Object.entries(rows))for(const value of row)if(value&&!reverse.has(norm(value)))reverse.set(norm(value),source);}
export function getLocale(){return locale;}
export function tr(source,language=locale){const raw=String(source??'');if(language==='ru')return raw;const clean=norm(raw),row=translations[clean];if(row?.[IDX[language]])return row[IDX[language]];
 const level=clean.match(/^(Английский|Испанский|Французский)\s+(A[12])$/);if(level)return tr(level[1],language)+' '+level[2];
 const plus=clean.match(/^([＋+]\s*)(.+)$/);if(plus&&translations[plus[2]])return plus[1]+tr(plus[2],language);
 return raw;
}
export function setLocale(value){if(!LOCALES.includes(value)||value===locale)return;locale=value;try{localStorage.setItem(STORAGE,value);}catch{}document.documentElement.lang=value;window.dispatchEvent(new CustomEvent('syolana:locale',{detail:{locale:value}}));}
export function locales(){return [...LOCALES];}
export function languageName(value){return {ru:'Русский',en:'English',es:'Español',fr:'Français'}[value]||value;}
export function localeCode(value=locale){return value.toUpperCase();}
export function missingTranslation(value){return /[А-Яа-яЁё]/.test(value)&&tr(value,'en')===value;}
export function metaFor(locale=getLocale()){const data={ru:{title:'Syolana · Сайты, видео и автоматизация',description:'Сайты в вашем стиле, доработки, автоматизация данных и видео на заказ. Разовые задачи и постоянное сотрудничество. Английский A1 — бесплатно.'},en:{title:'Syolana · Websites, video and automation',description:'Custom websites, website updates, data automation and video. One-off projects and ongoing collaboration. English A1 is free.'},es:{title:'Syolana · Sitios web, vídeo y automatización',description:'Sitios web a medida, mejoras, automatización de datos y vídeo. Proyectos puntuales y colaboración continua. Inglés A1 gratis.'},fr:{title:'Syolana · Sites web, vidéo et automatisation',description:'Sites sur mesure, améliorations, automatisation des données et vidéo. Projets ponctuels et collaboration régulière. Anglais A1 gratuit.'}};return data[locale]||data.ru;}

