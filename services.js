import {el,link} from './utils.js';
import {registerTranslations} from './i18n.js';

registerTranslations({
 'Услуги':['Services','Servicios','Services'],
 'Услуги и цены':['Services and prices','Servicios y precios','Services et tarifs'],
 'ЗАКРЕПЛЕНО · УСЛУГИ И ЦЕНЫ':['PINNED · SERVICES AND PRICES','FIJADO · SERVICIOS Y PRECIOS','ÉPINGLÉ · SERVICES ET TARIFS'],
 'Оформление на 2027 год и дополнительные услуги':['Styling for 2027 and optional extras','Diseño para 2027 y servicios opcionales','Habillage 2027 et options'],
 'Обсудить мой проект':['Discuss my project','Hablar de mi proyecto','Parler de mon projet'],
 'Бесплатно собрать эскиз':['Create a free sketch','Crear un boceto gratis','Créer une esquisse gratuite'],
 'Английский A1 — бесплатно':['English A1 — free','Inglés A1 — gratis','Anglais A1 — gratuit'],
 'Все платные курсы — 650 ₽ / 30 дней':['All paid courses — 650 ₽ / 30 days','Todos los cursos de pago — 650 ₽ / 30 días','Tous les cours payants — 650 ₽ / 30 jours'],
 'Назад в ленту':['Back to the feed','Volver al feed','Retour au fil'],
 'Идеи, примеры и услуги':['Ideas, examples and services','Ideas, ejemplos y servicios','Idées, exemples et services'],
 'САЙТЫ · ВИДЕО · ТВОРЧЕСТВО':['WEBSITES · VIDEO · CREATIVITY','SITIOS · VÍDEO · CREATIVIDAD','SITES · VIDÉO · CRÉATION'],
 'Посмотрите, что можно создать вместе с Syolana. В каждом посте — результат, условия и простой следующий шаг.':['See what you can create with Syolana. Each post explains the result, the terms and the next step.','Descubre qué puedes crear con Syolana. Cada publicación explica el resultado, las condiciones y el siguiente paso.','Découvrez ce que vous pouvez créer avec Syolana. Chaque publication présente le résultat, les conditions et la prochaine étape.'],
 'Услуги и цены ↓':['Services and prices ↓','Servicios y precios ↓','Services et tarifs ↓'],
 'Подробнее об услуге':['Service details','Detalles del servicio','Détails du service'],
 'Публикация не найдена.':['Post not found.','Publicación no encontrada.','Publication introuvable.']
});

export function registerFeedCopy(posts){
 const dictionary={};
 const walk=(source,rows)=>{
  if(typeof source==='string'&&rows.every(row=>typeof row==='string')){
   const parts=source.split(/\n\s*\n/),variants=rows.map(row=>row.split(/\n\s*\n/));
   if(variants.every(row=>row.length===parts.length))parts.forEach((part,i)=>{dictionary[part.replace(/\s+/g,' ').trim()]=variants.map(row=>row[i]);});
  }else if(source&&typeof source==='object'){
   for(const key of Object.keys(source))if(key!=='translations'&&rows.every(row=>row&&Object.hasOwn(row,key)))walk(source[key],rows.map(row=>row[key]));
  }
 };
 for(const post of posts)if(['en','es','fr'].every(locale=>post.translations?.[locale]))walk(post,['en','es','fr'].map(locale=>post.translations[locale]));
 registerTranslations(dictionary);
}

export function renderServices(post,{standalone=false}={}){
 const section=el('section','services-pin glass');
 section.id='services-pinned';
 section.setAttribute('aria-labelledby','services-title');
 const head=el('header','services-head'),title=el(standalone?'h1':'h2','',post.title);
 title.id='services-title';
 head.append(el('p','eyebrow','ЗАКРЕПЛЕНО · УСЛУГИ И ЦЕНЫ'),title,el('p','services-lead',post.lead));
 const offers=el('div','services-offers');
 for(const offer of post.offers){
  const item=link('','#/post/'+encodeURIComponent(offer.post),'service-offer'+(offer.featured?' service-offer-featured':''));
  const heading=el('div','service-offer-heading');
  heading.append(el('h3','',offer.title),el('span','service-arrow','↗'));
  item.append(heading,el('strong','service-price',offer.price),el('p','service-summary',offer.summary));
  offers.append(item);
 }
 const extras=el('details','services-extras');
 extras.append(el('summary','','Оформление на 2027 год и дополнительные услуги'));
 const list=el('ul','services-extra-list');
 for(const offer of post.extras){
  const row=el('li'),item=link('','#/post/'+encodeURIComponent(offer.post),'service-extra');
  item.append(el('span','',offer.title),el('strong','',offer.price));row.append(item);list.append(row);
 }
 extras.append(list);
 const actions=el('div','row services-actions');
 actions.append(link('Обсудить мой проект',post.href,'btn primary'),link('Бесплатно собрать эскиз','#/create-site','text-link'));
 const learning=el('div','services-learning');
 learning.append(link('Английский A1 — бесплатно','#/lesson/en/a1/course','text-link'),link('Все платные курсы — 650 ₽ / 30 дней','#/languages','text-link'));
 section.append(head,offers,extras,el('p','services-note',post.note),actions,learning);
 return section;
}

export function mountServicesNavigation(banner,nav){
 if(!nav.querySelector('[data-nav="services"]')){
  const item=link('Услуги и цены','#/services');item.dataset.nav='services';
  nav.querySelector('[data-nav="home"]')?.after(item);
 }
 const note=banner.querySelector('.showcase-note');
 if(note&&!note.querySelector('a'))note.append(' ',link('Услуги и цены ↓','#/services','showcase-price-link'));
}
