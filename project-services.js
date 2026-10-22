import {el,link} from './utils.js';
import {registerTranslations} from './i18n.js';
const lines=[
['Обсудим вашу задачу','Let’s discuss your project','Hablemos de tu proyecto','Parlons de votre projet'],
['Напишите, что нужно сделать. Можно прислать ссылку, макет или пример результата. Готовое техническое задание не обязательно.','Tell us what you need. Send a link, design or example if available. A complete technical brief is not required.','Cuéntanos qué necesitas. Puedes enviar un enlace, diseño o ejemplo. No hace falta un documento técnico completo.','Expliquez votre besoin. Vous pouvez joindre un lien, une maquette ou un exemple. Un cahier des charges complet n’est pas nécessaire.'],
['Написать на почту','Send an email','Escribir por correo','Écrire par e-mail'],
['Написать во ВКонтакте','Message us on VK','Escribir por VK','Écrire sur VK'],
['Написать на Авито','Message us on Avito','Escribir por Avito','Écrire sur Avito'],
['Что полезно знать в начале','What helps us get started','Qué nos ayuda a empezar','Pour bien commencer'],
['Какой результат вам нужен и для кого.','The result you need and who it is for.','Qué resultado necesitas y para quién.','Le résultat souhaité et à qui il s’adresse.'],
['Что уже готово: сайт, макет, тексты или пример данных.','What you have: a website, design, content or sample data.','Qué tienes ya: sitio, diseño, textos o datos de ejemplo.','Ce qui existe : site, maquette, textes ou données d’exemple.'],
['Есть ли желаемый срок и бюджет.','Your preferred deadline and budget, if known.','El plazo y presupuesto previstos, si los conoces.','Le délai et le budget envisagés, si vous les connaissez.'],
['Всё обсудим в переписке. Состав, стоимость, срок, правки и условия передачи согласуем до начала работы и оплаты.','We discuss everything in writing. Scope, price, delivery time, revisions and handover terms are agreed before work and payment.','Lo hablamos todo por escrito. Acordamos alcance, precio, plazo, revisiones y entrega antes de trabajar y pagar.','Tout se discute par écrit. Périmètre, prix, délai, retouches et remise sont convenus avant le travail et le paiement.'],
['Для первого сообщения достаточно описания. Пароли, ключи доступа и реквизиты карты не присылайте.','A description is enough for your first message. Do not send passwords, access keys or card details.','Para el primer mensaje basta una descripción. No envíes contraseñas, claves de acceso ni datos de tarjeta.','Une description suffit pour le premier message. N’envoyez ni mots de passe, ni clés d’accès, ni coordonnées bancaires.'],
['Нужен постоянный исполнитель?','Need ongoing help?','¿Buscas colaboración continua?','Besoin d’une collaboration suivie ?'],
['Начнём с одной оплачиваемой задачи. Затем можно согласовать регулярные доработки: отдельные страницы, исправления и помощь с текущими проектами. Объём и стоимость каждого периода фиксируем заранее.','Start with one paid task. Then agree on ongoing work: individual pages, fixes and help with current projects. The scope and price of each period are agreed in advance.','Empecemos con una tarea remunerada. Después podemos acordar páginas, correcciones y apoyo continuo. Fijamos de antemano el alcance y precio de cada periodo.','Commençons par une mission rémunérée. Puis convenons d’un suivi : pages, corrections et aide aux projets. Le périmètre et le prix de chaque période sont fixés à l’avance.'],
['Посмотреть услуги и цены','View services and prices','Ver servicios y precios','Voir les services et tarifs'],
['Выбранное направление','Your selected service','Servicio seleccionado','Service choisi'],
['Сайт в вашем стиле','A website in your own style','Un sitio con tu estilo','Un site à votre image'],
['Автоматизация таблиц и отчётов','Spreadsheet and report automation','Automatización de tablas e informes','Automatisation de tableaux et rapports'],
['Видео по вашей идее','A video inspired by your idea','Un vídeo a partir de tu idea','Une vidéo à partir de votre idée'],
['Регулярные доработки','Ongoing improvements','Mejoras continuas','Améliorations régulières'],
['Посмотрите примеры','Explore the examples','Mira los ejemplos','Découvrez les exemples'],
['Это демонстрационные работы Syolana, а не проекты заказчиков. Откройте их и попробуйте разные размеры экрана.','These are Syolana demonstrations, not client projects. Open them and try different screen sizes.','Son demostraciones de Syolana, no proyectos de clientes. Ábrelas y prueba distintos tamaños de pantalla.','Ce sont des démonstrations Syolana, pas des projets clients. Ouvrez-les et essayez plusieurs tailles d’écran.'],
['Сайт небольшой студии','A small studio website','Sitio de un pequeño estudio','Site d’un petit studio'],
['Спокойное оформление, услуги, этапы и понятная кнопка обращения. Живая тема — по желанию.','A clear layout, services, process and a simple contact action. A living theme is optional.','Diseño claro, servicios, proceso y contacto sencillo. El tema animado es opcional.','Une présentation claire, des services, les étapes et un contact simple. Le thème animé est facultatif.'],
['Из таблицы — в понятный отчёт','From a table to a clear report','De una tabla a un informe claro','D’un tableau à un rapport clair'],
['На учебных данных: убираем точные повторы, отмечаем ошибки и считаем итог. Отчёт можно скачать.','Sample data: remove exact duplicates, flag errors and calculate totals. Download the report.','Con datos de ejemplo: eliminamos duplicados exactos, marcamos errores y calculamos el total. El informe se puede descargar.','Sur des données d’exemple : suppression des doublons exacts, signalement des erreurs et calcul du total. Le rapport est téléchargeable.'],
['Открыть пример','Open example','Abrir ejemplo','Ouvrir l’exemple'],
['Как начинается работа','How work begins','Cómo empezamos','Comment commencer'],
['Описание задачи → согласованные условия → результат и приёмка. Эскиз в редакторе — по желанию.','Describe the task → agree on terms → receive and accept the result. The sketch editor is optional.','Describe la tarea → acordamos las condiciones → entrega y aceptación. El editor de bocetos es opcional.','Décrivez le besoin → convenons des conditions → livraison et validation. L’éditeur d’esquisse est facultatif.']
];
registerTranslations(Object.fromEntries(lines.map(([ru,...rest])=>[ru,rest])));
registerTranslations({
 'Сайт, живые темы, музыкальный плеер и ваше содержание собираются в одно пространство. Посмотрите примеры и выберите подходящий вариант.':['A website, living themes, a music player and your content come together in one space. Explore the examples and choose what suits you.','Un sitio, temas animados, un reproductor de música y tu contenido se reúnen en un solo espacio. Mira los ejemplos y elige tu opción.','Un site, des thèmes animés, un lecteur musical et vos contenus se réunissent dans un même espace. Découvrez les exemples et choisissez votre formule.'],
 'САЙТЫ · ВИДЕО · ЯЗЫКИ':['WEBSITES · VIDEO · LANGUAGES','SITIOS · VÍDEO · IDIOMAS','SITES · VIDÉO · LANGUES'],
 'SYOLANA · НА ЗАКАЗ':['SYOLANA · MADE TO ORDER','SYOLANA · POR ENCARGO','SYOLANA · SUR MESURE'],
 'Обсудить задачу можно по':['Discuss your project by','Habla de tu proyecto por','Parlez de votre projet par'],
 'почте':['email','correo','e-mail'],
 ', во':[', on',', en',', sur'],
 'ВКонтакте':['VK','VK','VK'],
 'или на':['or on','o en','ou sur'],
 'Авито':['Avito','Avito','Avito'],
 '. Состав, стоимость и срок согласуем до оплаты. Языковая подписка оформляется отдельно; автоматических списаний нет.':['. Scope, price and delivery time are agreed before payment. Language subscriptions are separate, with no automatic charges.','. Acordamos alcance, precio y plazo antes del pago. La suscripción de idiomas es independiente y no tiene cobros automáticos.','. Le périmètre, le prix et le délai sont convenus avant paiement. L’abonnement aux langues est distinct, sans prélèvement automatique.'],
 'Задачи обсуждаются по почте, во ВКонтакте или на Авито. Для языковой подписки используется отдельная оферта на Авито. Сайт не запрашивает имя, телефон, email или банковскую карту для просмотра материалов.':['Tasks are discussed by email, on VK or on Avito. Language subscriptions use a separate offer on Avito. The site does not ask for your name, phone number, email or bank card to view materials.','Las tareas se hablan por correo, VK o Avito. La suscripción de idiomas tiene una oferta independiente en Avito. El sitio no solicita nombre, teléfono, correo ni tarjeta para consultar materiales.','Les missions se discutent par e-mail, sur VK ou Avito. L’abonnement aux langues relève d’une offre distincte sur Avito. Le site ne demande ni nom, ni téléphone, ni e-mail, ni carte bancaire pour consulter les contenus.']
});
const t=i=>lines[i][0];
export function renderProjectContact(kind=''){
 const root=el('article','card stack project-contact');
 root.append(el('p','eyebrow','SYOLANA'),el('h1','',t(0)),el('p','project-contact-lead',t(1)));
 const topic={site:15,data:16,video:17,support:18}[kind];
 if(topic){const p=el('p','notice');p.append(el('span','',t(14)),': ',el('strong','',t(topic)));root.append(p);}
 const actions=el('div','project-contact-actions'),subject='Задача для Syolana'+(topic?' — '+t(topic):'');
 actions.append(link(t(2),'mailto:syolana@yandex.ru?subject='+encodeURIComponent(subject),'btn primary'),link(t(3),'https://vk.ru/club242389282','btn'),link(t(4),'https://www.avito.ru/brands/i223140984','btn'));
 const address=el('p','project-email');address.append(link('syolana@yandex.ru','mailto:syolana@yandex.ru','text-link'));
 const list=el('ol','project-brief');for(const i of [6,7,8])list.append(el('li','',t(i)));
 const repeat=el('section','project-recurring');repeat.append(el('h2','',t(11)),el('p','',t(12)));
 root.append(actions,address,el('h2','',t(5)),list,el('p','',t(9)),el('p','fine',t(10)),repeat,link(t(13),'#/services','text-link'));return root;
}
export function renderProjectExamples(){
 const root=el('section','project-examples');root.setAttribute('aria-labelledby','project-examples-title');
 const title=el('h2','',t(19));title.id='project-examples-title';root.append(title,el('p','fine',t(20)));
 const grid=el('div','project-example-grid');
 for(const [key,title,body] of [['site',21,22],['data',23,24]]){
  const card=el('article','project-example');card.dataset.example=key;const art=el('div','project-example-art');art.setAttribute('aria-hidden','true');
  art.innerHTML=key==='site'?'<i></i><i></i><i></i><i></i>':'<i>01</i><i>02</i><i>03</i><b>Σ</b>';
  card.append(art,el('h3','',t(title)),el('p','',t(body)),link(t(25),'examples/index.html?example='+key,'text-link'));grid.append(card);
 }
 root.append(grid);return root;
}
export function renderProjectSteps(){const root=el('section','project-steps');root.append(el('h2','',t(26)),el('p','',t(27)));return root;}
