const WINDOWS=Object.freeze({
 'trial-2026':Object.freeze({from:0,until:Date.parse('2027-01-01T00:00:00+03:00')}),
 'paid-2027':Object.freeze({from:Date.parse('2027-01-01T00:00:00+03:00'),until:Date.parse('2028-01-01T00:00:00+03:00')})
});
export function calendarWindow(period,now=Date.now()){
 const window=Object.hasOwn(WINDOWS,period)?WINDOWS[period]:null;
 if(!window||!Number.isFinite(now))return{active:false,from:0,until:0};
 return{...window,active:window.from<=now&&now<window.until};
}
export function calendarLicense(period='trial-2026'){
 if(!Object.hasOwn(WINDOWS,period))throw Error('Неизвестный период оформления.');
 return{mode:'calendar',period};
}
export const PARTNER_CALENDAR_TERMS="Авторское оформление, его стоимость, срок и состав согласуются для каждого проекта до оплаты. Если сайт использует подключаемые темы, фирменные шрифты или обновления Syolana, срок доступа, продление и поддержка фиксируются отдельно. Подключаемый слой может быть отключён по согласованным условиям или по решению владельца. При отключении ваши тексты, фотографии, базовая структура и переданный HTML-файл не удаляются. Подключение не становится платным автоматически; автоматических списаний и продления нет.";
export const PARTNER_CALENDAR_PRIVACY="Для подключаемого оформления владелец Syolana разрешает адрес сайта и код оформления в закрытом серверном списке. Срок и условия доступа задаются для каждого подключения. Посетители не регистрируются в этом списке. Проверка оформления передаёт серверу домен и путь сайта без строки поиска и фрагмента; запросы выполняются без cookie и Referer. Приложение не записывает сведения об устройствах, IP-адресах, местонахождении и просмотрах посетителей. Хостинг получает сетевые запросы и может вести собственные журналы. Переписка, оплата и домены, позволяющие определить физическое лицо, требуют отдельной оценки по законодательству о персональных данных.";

export const TRIAL_THEME_CHOICES=Object.freeze([['living-sea','Море странствий'],['amber-forest','Янтарный лес'],['white-ocean-city','Белый город над океаном'],['aurora','Северное сияние'],['golden','Золотые струны'],['moon','Лунный сад'],['violet-bloom','Фиолетовое цветение']].map(([id,name])=>Object.freeze({id,name})));
export const TRIAL_THEME_IDS=Object.freeze(TRIAL_THEME_CHOICES.map(t=>t.id));
