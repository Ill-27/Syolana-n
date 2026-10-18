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
export const PARTNER_CALENDAR_TERMS='Для всех партнёров тестовое оформление бесплатно до 00:00 1 января 2027 года по Москве. Для одного бесплатного сайта выбирается одна из семи тем 2026 года; новые темы в этот доступ не входят. Продолжение в 2027 году подключается вручную после отдельного согласования и оплаты: до 00:00 1 января 2028 года по Москве. Для подключившихся в течение 2027 года окончание то же, поэтому срок может быть короче 12 месяцев; индивидуальная цена и состав согласуются до оплаты. Бесплатный период сам по себе не становится платным. Автоматических списаний и продления нет. После окончания срока отключаются темы, фирменные шрифты и обновления Syolana; ваш HTML-файл, домен, собственные тексты, фото и базовая структура сайта остаются у вас.';
export const PARTNER_CALENDAR_PRIVACY='Для нового файла оформления владелец Syolana разрешает полный адрес сайта и код оформления в закрытом серверном списке. Оплата за 2027 год отмечается отдельно. Посетители не регистрируются в этом списке. Проверка оформления передаёт серверу домен и путь сайта без строки поиска и фрагмента; запросы выполняются без cookie и Referer. Приложение не записывает сведения об устройствах, IP-адресах, местонахождении и просмотрах посетителей. Хостинг получает сетевые запросы и может вести собственные журналы. Переписка, оплата и домены, позволяющие определить физическое лицо, требуют отдельной оценки по законодательству о персональных данных.';

export const TRIAL_THEME_CHOICES=Object.freeze([['living-sea','Море странствий'],['amber-forest','Янтарный лес'],['white-ocean-city','Белый город над океаном'],['aurora','Северное сияние'],['golden','Золотые струны'],['moon','Лунный сад'],['violet-bloom','Фиолетовое цветение']].map(([id,name])=>Object.freeze({id,name})));
export const TRIAL_THEME_IDS=Object.freeze(TRIAL_THEME_CHOICES.map(t=>t.id));
