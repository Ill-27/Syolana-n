import {createSketchHTML,normalizeSketch,parseSketchFile} from './sketch-model.mjs';
import {calendarLicense,calendarWindow,PARTNER_CALENDAR_TERMS} from './partner-periods.mjs';

const THEMES=[['aurora','Северное сияние'],['golden','Золотые струны'],['moon','Лунный сад'],['amber-forest','Янтарный лес'],['living-sea','Море странствий'],['white-ocean-city','Белый город'],['violet-bloom','Фиолетовое цветение']].map(([id,name])=>({id,name}));
const json=value=>JSON.stringify(value).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
export function createCalendarPartnerHTML(value,{period='trial-2026',now=Date.now()}={}){
 const license=calendarLicense(period),window=calendarWindow(period,now);
 if(!Number.isFinite(now)||window.until<=now)throw Error('Этот период оформления уже закончился.');
 const project=normalizeSketch(value);
 const controls='<nav class="export-controls" hidden><button id="theme-toggle" type="button">Тема</button><button id="sound-toggle" type="button">Звук темы</button><button id="zen-toggle" type="button">Созерцание</button></nav><footer class="export-attribution"><a id="syolana-attribution" href="https://syolana.com/" target="_blank" rel="noopener noreferrer">Сайт создан на Syolana</a></footer><dialog id="theme-dialog"><button id="close-theme" type="button">Закрыть</button><div id="theme-list" class="theme-list"></div></dialog>';
 const style='<style>.export-controls{position:fixed;top:16px;right:16px;z-index:90;display:flex;gap:8px}.export-controls[hidden]{display:none!important}.export-controls button,dialog button{font:inherit;padding:10px;border:1px solid #aaa;border-radius:10px}.export-theme{position:fixed;inset:0;width:100%;height:100%;border:0;z-index:-1}.export-attribution{position:static;display:flex;justify-content:center;margin:24px 16px;padding:0;background:transparent}.export-attribution a{padding:0!important;border:0!important;color:#fff!important;font:12px/1.4 system-ui!important;text-decoration:none}.export-attribution a:focus-visible{outline:2px solid white}body{isolation:isolate}body.zen #page{visibility:hidden}body.zen .export-theme{z-index:50}dialog{width:min(500px,88vw);max-height:85dvh;overflow:auto}html[data-theme] body{background:transparent}</style>';
 const script='<script type="module">import {mountLicensedDesign} from "https://syolana.com/licensed-design.js";await mountLicensedDesign('+json({settings:{theme:project.theme},license,themes:THEMES})+');</script>';
 return createSketchHTML(project).replace('<head>','<head><meta name="referrer" content="no-referrer">').replace('</head>',style+'</head>').replace('<main>','<main id="page">').replace(/<(header|section)>/g,'<$1 class="card">').replace('</body>',controls+script+'</body>');
}

export function mountPartnerFileBuilder(host,{isOwner,download}={}){
 const make=(tag,text='')=>{const n=document.createElement(tag);n.textContent=text;return n;};
 const box=make('section'),form=make('form'),label=make('label','Файл согласованного эскиза'),file=make('input');
 file.type='file';file.accept='.html,.json,text/html,application/json';file.required=true;file.name='partnerSketch';label.append(file);
 const select=make('select');select.name='partnerPeriod';select.setAttribute('aria-label','Общий срок оформления');
 for(const [value,text]of [['trial-2026','Бесплатный тест до 1 января 2027, 00:00 МСК'],['paid-2027','Оплаченный период до 1 января 2028, 00:00 МСК']]){const option=make('option',text);option.value=value;select.append(option);}
 const paymentLabel=make('label','Цена и состав согласованы, оплата за 2027 год проверена мной'),payment=make('input');payment.type='checkbox';payment.name='partnerPaymentVerified';paymentLabel.prepend(payment);paymentLabel.hidden=true;
 select.onchange=()=>{paymentLabel.hidden=select.value!=='paid-2027';payment.checked=false;};
 const button=make('button','Скачать готовый сайт с общим сроком');button.type='submit';const message=make('p');message.setAttribute('role','status');
 box.append(make('h2','Новый партнёр: файл без сервера лицензий'),make('p',PARTNER_CALENDAR_TERMS),make('p','Загрузите согласованный эскиз. Он обрабатывается на этом устройстве; адрес сайта, идентификатор партнёра и браузера в разрешение не добавляются. Проверка срока зависит от часов и кода браузера; изменение файла или часов технически не исключено.'));
 form.append(label,select,paymentLabel,button,message);box.append(form);host.append(box);let disposed=false,url='';
 const save=download||((name,text)=>{if(url)URL.revokeObjectURL(url);url=URL.createObjectURL(new Blob([text],{type:'text/html;charset=utf-8'}));const a=make('a');a.href=url;a.download=name;a.click();});
 form.onsubmit=async e=>{e.preventDefault();button.disabled=true;try{
  if(!isOwner?.())throw Error('Сначала откройте раздел ключом владельца.');
  const source=file.files?.[0];if(!source||source.size>1000000)throw Error('Выберите файл эскиза не больше 1 МБ.');
  const period=select.value;if(period==='paid-2027'&&!payment.checked)throw Error('Сначала подтвердите согласованную цену и проверенную оплату.');
  const project=parseSketchFile(await source.text());if(disposed||!isOwner())return;
  const html=createCalendarPartnerHTML(project,{period});save('Syolana-partner-'+period+'.html',html);message.textContent='Готовый файл сохранён. Передайте его партнёру вместе с согласованными условиями. Сам по себе файл не подтверждает юридическую готовность продажи.';
 }catch(error){if(!disposed)message.textContent=error.message;}finally{if(!disposed)button.disabled=false;}};
 return()=>{disposed=true;if(url)URL.revokeObjectURL(url);box.remove();};
}
