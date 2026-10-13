import {defaultSketch,normalizeSketch,createSketchHTML,parseSketchFile,sketchPayload,sketchFieldText,sketchBlockTitle,TEMPLATE_FIELDS} from './sketch-model.mjs';
import {getLocale,tr} from './i18n.js';
import {fitHeadings} from './heading-layout.js';
const STORAGE_KEY='syolana.partner.sketch.v2';
const THEMES=[['aurora','Северное сияние'],['golden','Золотые струны'],['moon','Лунный сад'],['amber-forest','Янтарный лес'],['living-sea','Море странствий'],['white-ocean-city','Белый город'],['violet-bloom','Фиолетовое цветение']];
const SOURCE_TYPES=[['none','Без автоматических публикаций'],['public','Из открытого канала или группы']];
const BLOCKS={about:'О проекте',services:'Направления / услуги',gallery:'Галерея',publications:'Публикации',faq:'Вопросы и ответы',contacts:'Контакты'};
const defaults=defaultSketch;

function el(tag,cls='',text=''){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function safeParse(value){try{const data=JSON.parse(value);return data&&typeof data==='object'?data:{};}catch{return {};}}
function load(){try{const old=safeParse(localStorage.getItem('syolana.partner.sketch.v1')||'');const current=safeParse(localStorage.getItem(STORAGE_KEY)||'');return normalizeSketch({...old,...current});}catch{return normalizeSketch();}}
function save(data){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(data));return true;}catch{return false;}}
function downloadFile(name,text,type){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);}
function field(label,key,value,{type='text',placeholder='',rows=0}={}){const wrap=el('label','sketch-field');wrap.append(el('span','',label));const input=rows?document.createElement('textarea'):document.createElement(type==='select'?'select':'input');input.dataset.key=key;if(rows)input.rows=rows;if(!rows&&type!=='select')input.type=type;input.value=value||'';input.placeholder=placeholder;wrap.append(input);return {wrap,input};}
function optionSelect(label,key,value,options){const {wrap,input}=field(label,key,value,{type:'select'});for(const [v,t]of options){const o=document.createElement('option');o.value=v;o.textContent=t;o.selected=v===value;input.append(o);}return {wrap,input};}
function cleanUrl(value){try{const u=new URL(String(value||'').trim());return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function addStyles(){if(document.getElementById('sketch-builder-style'))return;const s=document.createElement('style');s.id='sketch-builder-style';s.textContent=`
.sketch-builder{display:grid;grid-template-columns:minmax(300px,.82fr) minmax(360px,1.18fr);gap:18px;align-items:start}
.sketch-builder>*{min-width:0}
.sketch-panel{display:grid;gap:20px;align-content:start;padding:22px}
.sketch-panel>*{min-width:0;margin-block:0}
.sketch-panel>.eyebrow{margin-bottom:-8px}
.sketch-panel>h1{line-height:1.25}
.sketch-panel>h3{margin-top:4px}
.sketch-note{color:var(--panel-muted,#c9c5d7);font-size:.92rem;line-height:1.65}
.sketch-form{display:grid;gap:18px}
.sketch-field{display:grid;gap:8px;min-width:0}
.sketch-field>span{font-size:.82rem;letter-spacing:.04em;color:var(--panel-muted,#c9c5d7)}
.sketch-field input,.sketch-field textarea,.sketch-field select{width:100%;min-width:0;max-width:100%;border:1px solid rgba(255,255,255,.16);background:rgba(5,7,14,.42);color:inherit;border-radius:14px;padding:11px 12px;font:inherit;scroll-margin-block:110px 160px}
.sketch-field textarea{resize:vertical;min-height:88px}
.sketch-field :is(input,textarea,select):focus-visible,.sketch-builder :is(button,summary):focus-visible{outline:2px solid var(--panel-label,var(--accent));outline-offset:4px}
.sketch-blocks,.sketch-library,.sketch-custom-fields{display:grid;gap:12px}
.sketch-blocks:empty,.sketch-library:empty{display:none}
.sketch-block{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)}
.sketch-block>span{overflow-wrap:break-word}
.sketch-block-actions{display:flex;gap:6px}
.sketch-block button{min-width:44px;min-height:44px;padding:6px;border-radius:10px}
.sketch-custom-fields{grid-column:1/-1;gap:18px;padding-top:4px}
.sketch-library{grid-template-columns:repeat(2,minmax(0,1fr))}
.sketch-library button{text-align:left;justify-content:flex-start}
.sketch-builder .btn{margin:0;max-width:100%;white-space:normal}
.sketch-builder .btn:disabled{opacity:.42;cursor:default;transform:none;box-shadow:none}
.sketch-panel>.btn{justify-self:start}
.sketch-preview{position:sticky;top:88px;overflow:hidden}
.sketch-devicebar{display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;align-items:center;padding:16px 14px;border-bottom:1px solid rgba(255,255,255,.1)}
.sketch-devicebar strong{font-size:.9rem}
.sketch-canvas{padding:14px;min-height:620px;background:radial-gradient(circle at 20% 0%,rgba(115,132,255,.18),transparent 35%),radial-gradient(circle at 86% 20%,rgba(199,109,255,.16),transparent 32%),rgba(4,5,12,.58)}
.sketch-canvas.sketch-mobile{width:min(100%,410px);margin-inline:auto}
.sketch-site{border:1px solid rgba(255,255,255,.13);border-radius:25px;overflow:hidden;background:rgba(7,8,16,.72);box-shadow:0 28px 80px rgba(0,0,0,.26)}
.sketch-hero{padding:clamp(25px,6vw,58px);min-height:280px;display:flex;flex-direction:column;justify-content:end;background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01))}
.sketch-hero>*{min-width:0}
.sketch-hero>.btn{align-self:start;margin-top:16px}
.sketch-kicker{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;opacity:.7}
.sketch-site h1{font-size:clamp(2.2rem,6vw,4.7rem);line-height:1.15;margin:.35rem 0 1rem}
.sketch-site :is(h1,h2,h3){overflow-wrap:break-word}
.sketch-lead{max-width:680px;line-height:1.6;opacity:.8}
.sketch-section{padding:24px;border-top:1px solid rgba(255,255,255,.1)}
.sketch-section>*+*{margin-top:12px}
.sketch-section h3{font-size:1.35rem;margin-bottom:0}
.sketch-section>p{white-space:pre-wrap;overflow-wrap:break-word}
.sketch-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.sketch-actions>.btn{width:100%;height:100%}
.sketch-theme-chip{display:inline-flex;align-self:start;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.13);font-size:.75rem;opacity:.75;margin-bottom:12px}
.sketch-buttons{display:flex;flex-wrap:wrap;gap:12px}
.sketch-private{display:flex;gap:10px;align-items:flex-start;padding:14px 15px;border-radius:14px;background:rgba(115,189,148,.08);border:1px solid rgba(115,189,148,.16);font-size:.86rem;line-height:1.5}
.sketch-private>span:first-child{flex:none}
.sketch-empty{opacity:.62;font-style:italic}
.sketch-mobile .sketch-site h1{font-size:2.5rem}
.sketch-theme-picker{min-width:0}
.sketch-theme-picker>summary{cursor:pointer;line-height:1.5;padding:8px 0}
.sketch-theme-choices{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin-top:12px}
.sketch-theme-choice{display:grid;grid-template-rows:auto 1fr;align-content:start;gap:12px;padding:12px!important;text-align:left;white-space:normal;min-width:0;border-radius:22px;line-height:1.5}
.sketch-theme-choice>span{display:block;min-width:0;padding:0 3px 4px;line-height:1.5;font-size:.92rem;overflow-wrap:normal;word-break:normal}
.sketch-theme-choice img{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:10px}
.sketch-theme-choice[aria-pressed="true"]{border-color:var(--panel-label)}
.sketch-save-state{font-size:.78rem;opacity:.7;line-height:1.5}
@media(max-width:900px){.sketch-builder{grid-template-columns:1fr}.sketch-preview{position:relative;top:auto}.sketch-canvas{min-height:auto}}
@media(max-width:520px){.sketch-panel{padding:24px 20px;gap:18px}.sketch-library{grid-template-columns:1fr}.sketch-block{grid-template-columns:1fr}.sketch-block-actions{justify-content:flex-end}}
@media(max-width:600px){.sketch-theme-choices{grid-template-columns:1fr;gap:12px}.sketch-theme-choice{grid-template-columns:minmax(88px,38%) minmax(0,1fr);grid-template-rows:auto;align-items:center;gap:16px;padding:12px!important}.sketch-theme-choice img{aspect-ratio:16/10;max-height:105px}.sketch-theme-choice>span{padding:4px 4px 4px 0;font-size:1rem;line-height:1.5}}
`;document.head.append(s);}

export function mountSketchBuilder(host){
 addStyles();const data=load();let history=[JSON.stringify(data)],historyIndex=0;const root=el('section','sketch-builder');root.dataset.positioningView='create-site';
 const editor=el('div','card sketch-panel');root.setAttribute('aria-labelledby','sketch-title');
 editor.append(el('p','eyebrow','БЕЗ РЕГИСТРАЦИИ · ЧЕРНОВИК ТОЛЬКО У ВАС'),el('h1','','Соберите эскиз сайта'),el('p','sketch-note','Здесь можно собрать структуру, тексты и настроение будущего шаблона. Эскиз сохраняется только в вашем браузере. Затем его можно передать Syolana для дизайнерской доработки и подготовки готового HTML-файла.'));
 editor.querySelector('h1').id='sketch-title';
 const privacy=el('div','sketch-private');const privacyIcon=el('span','','◌');privacyIcon.setAttribute('aria-hidden','true');privacy.append(privacyIcon,el('span','','Syolana не получает этот черновик автоматически. Ничего не отправляется без вашего действия.'));editor.append(privacy);
 const toolbar=el('div','sketch-actions');const undo=el('button','btn small','Отменить'),redo=el('button','btn small','Повторить'),importButton=el('button','btn small','Открыть эскиз'),saveProject=el('button','btn small','Сохранить проект');
 for(const b of [undo,redo,importButton,saveProject])b.type='button';toolbar.append(undo,redo,importButton,saveProject);editor.append(toolbar);
 const fileInput=el('input');fileInput.type='file';fileInput.accept='.json,.html';fileInput.hidden=true;editor.append(fileInput);
 const form=el('div','sketch-form');
 const fields=[
  field('Название проекта','name',data.name,{placeholder:'Например: Atelier Nocturne'}),
  field('Короткая надпись над заголовком','eyebrow',data.eyebrow,{placeholder:'СТУДИЯ · АВТОР · ПРОЕКТ'}),
  field('Главное описание','description',data.description,{rows:3}),
  field('Заголовок блока «О проекте»','aboutTitle',data.aboutTitle),field('Текст «О проекте»','about',data.about,{rows:4}),
  field('Заголовок направлений','servicesTitle',data.servicesTitle),field('Направления / услуги','services',data.services,{rows:4}),
  field('Заголовок галереи','galleryTitle',data.galleryTitle),field('Что показать в галерее','galleryText',data.galleryText,{rows:3}),
  field('Заголовок вопросов','faqTitle',data.faqTitle),field('Вопросы и ответы','faqText',data.faqText,{rows:4}),
  field('Текст главной кнопки','cta',data.cta,{placeholder:'Связаться'}),field('Ссылка для связи','contact',data.contact,{type:'url',placeholder:'https://…'}),
  optionSelect('Автоматические публикации','sourceType',data.sourceType,SOURCE_TYPES),field('Ссылка на открытый источник','sourceUrl',data.sourceUrl,{type:'url',placeholder:'https://…'}),
  optionSelect('Настроение темы','theme',data.theme,THEMES)
 ];fields.forEach(x=>form.append(x.wrap));editor.append(form,el('h3','','Блоки и порядок'));
 const blocks=el('div','sketch-blocks'),library=el('div','sketch-library');editor.append(blocks,library);
 const saveState=el('p','sketch-save-state','Черновик сохранён на этом устройстве.');saveState.setAttribute('role','status');saveState.setAttribute('aria-live','polite');editor.append(saveState);
 function updateHistory(){undo.disabled=historyIndex===0;redo.disabled=historyIndex===history.length-1;}
 updateHistory();
 function renderBlocks(){
  addText.disabled=data.extraBlocks.length>=30;blocks.replaceChildren();for(const [index,id]of data.blocks.entries()){const row=el('div','sketch-block');row.dataset.blockId=id;row.append(el('span','',BLOCKS[id]||'Текстовый блок'));const actions=el('div','sketch-block-actions');const up=el('button','btn','↑'),down=el('button','btn','↓'),remove=el('button','btn','×');up.type=down.type=remove.type='button';up.title='Поднять';down.title='Опустить';remove.title='Убрать блок';up.setAttribute('aria-label','Поднять');down.setAttribute('aria-label','Опустить');remove.setAttribute('aria-label','Убрать блок');up.disabled=index===0;down.disabled=index===data.blocks.length-1;up.onclick=()=>move(index,-1);down.onclick=()=>move(index,1);remove.onclick=()=>{data.blocks.splice(index,1);data.extraBlocks=data.extraBlocks.filter(b=>b.id!==id);commit();renderBlocks();};actions.append(up,down,remove);row.append(actions);const custom=data.extraBlocks.find(b=>b.id===id);if(custom){const edit=el('div','sketch-custom-fields');edit.style.gridColumn='1 / -1';const title=field('Заголовок','custom-title',sketchBlockTitle(custom,tr)),text=field('Текст блока','custom-text',custom.text,{rows:4});for(const x of [title,text])edit.append(x.wrap);title.input.oninput=()=>{custom.title=title.input.value;custom.templateTitle=false;commit();};text.input.oninput=()=>{custom.text=text.input.value;commit();};row.append(edit);}blocks.append(row);}
  library.replaceChildren();for(const [id,label]of Object.entries(BLOCKS)){if(data.blocks.includes(id))continue;const b=el('button','btn small','＋ '+label);b.type='button';b.onclick=()=>{data.blocks.push(id);commit();renderBlocks();};library.append(b);}
 }
 function move(index,delta){const j=index+delta;if(j<0||j>=data.blocks.length)return;[data.blocks[index],data.blocks[j]]=[data.blocks[j],data.blocks[index]];commit();renderBlocks();}
 const addText=el('button','btn small','＋ Текстовый блок');addText.type='button';addText.onclick=()=>{if(data.extraBlocks.length>=30)return;const id='text-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);data.extraBlocks.push({id,title:'Заголовок',text:'',templateTitle:true});data.blocks.push(id);commit();renderBlocks();};editor.append(addText);
 renderBlocks();
 editor.append(el('p' ,'sketch-note','Если вам нужны обновления публикаций на сайте, укажите ссылку на открытый канал или группу. Когда источник поддерживает такое подключение, новые доступные записи можно добавлять на сайт автоматически.'));
 const buttons=el('div','sketch-buttons');const download=el('button','btn primary','Скачать эскиз'),copy=el('button','btn','Скопировать бриф'),reset=el('button','btn','Начать заново');download.type=copy.type=reset.type='button';buttons.append(download,copy,reset);editor.append(buttons);
 const preview=el('div','card sketch-preview');const bar=el('div','sketch-devicebar');bar.append(el('strong','','Живой предпросмотр'));const modes=el('div','row');const desktop=el('button','btn small','Широко'),mobile=el('button','btn small','Телефон');desktop.type=mobile.type='button';modes.append(desktop,mobile);bar.append(modes);const canvas=el('div','sketch-canvas');preview.append(bar,canvas);root.append(editor,preview);host.replaceChildren(root);canvas.dataset.i18nSkip='project';
 function textOr(v,fallback){return String(v||'').trim()||tr(fallback);}
 function projectText(key,fallback){return textOr(sketchFieldText(data,key,tr),fallback);}
 function renderPreview(){
  canvas.replaceChildren();const site=el('article','sketch-site'),hero=el('header','sketch-hero');hero.style.background='linear-gradient(180deg,rgba(8,9,22,.26),rgba(8,9,22,.78)),url("themes/previews/'+data.theme+'.jpg") center/cover';hero.append(el('span','sketch-theme-chip',tr(THEMES.find(x=>x[0]===data.theme)?.[1]||'Тема Syolana')),el('p','sketch-kicker',projectText('eyebrow','ВАШ ПРОЕКТ')),el('h1','',projectText('name','Название проекта')),el('p','sketch-lead',projectText('description','Короткое описание проекта.')));const actionUrl=cleanUrl(data.contact);if(actionUrl){const a=el('a','btn primary',projectText('cta','Связаться'));a.href=actionUrl;a.target='_blank';a.rel='noopener noreferrer';hero.append(a);}site.append(hero);
  for(const id of data.blocks){const s=el('section','sketch-section');if(id==='about')s.append(el('p','sketch-kicker',tr('О ПРОЕКТЕ')),el('h3','',projectText('aboutTitle','О проекте')),el('p','',projectText('about','Здесь появится рассказ о проекте.')));else if(id==='services')s.append(el('p','sketch-kicker',tr('НАПРАВЛЕНИЯ')),el('h3','',projectText('servicesTitle','Что вы предлагаете')),el('p','',projectText('services','Здесь появятся основные направления или услуги.')));else if(id==='gallery')s.append(el('p','sketch-kicker',tr('ГАЛЕРЕЯ')),el('h3','',projectText('galleryTitle','Галерея')),el('p','',projectText('galleryText','Здесь будет галерея ваших материалов.')));else if(id==='publications'){s.append(el('p','sketch-kicker',tr('ПУБЛИКАЦИИ')),el('h3','',tr('Последнее из вашего источника')));const url=cleanUrl(data.sourceUrl);s.append(el('p',url?'':'sketch-empty',tr(url?'Открытый источник указан.':'Укажите открытый источник — способ подключения подберём после согласования.')));if(url){const a=el('a','btn',tr('Открыть источник'));a.href=url;a.target='_blank';a.rel='noopener noreferrer';s.append(a);}}else if(id==='faq')s.append(el('p','sketch-kicker',tr('ВОПРОСЫ')),el('h3','',projectText('faqTitle','Частые вопросы')),el('p','',projectText('faqText','Здесь появятся важные вопросы и ответы.')));else if(id==='contacts')s.append(el('p','sketch-kicker',tr('КОНТАКТЫ')),el('h3','',projectText('cta','Связаться')),el('p',actionUrl?'':'sketch-empty',tr(actionUrl?'Контактная ссылка уже добавлена.':'Добавьте ссылку для связи.')));else{const custom=data.extraBlocks.find(b=>b.id===id);if(custom)s.append(el('h3','',sketchBlockTitle(custom,tr)),el('p','',custom.text));}site.append(s);}canvas.append(site);fitHeadings();
 }
 function commit(record=true){
 const next=JSON.stringify(data);if(record&&next!==history[historyIndex]){history=history.slice(0,historyIndex+1);history.push(next);if(history.length>80)history.shift();historyIndex=history.length-1;}
 choices.querySelectorAll('button').forEach(b=>{const selected=b.dataset.theme===data.theme;if(b.getAttribute('aria-pressed')!==String(selected))b.setAttribute('aria-pressed',String(selected));});
 const persisted=save(data);const message=persisted?'Черновик сохранён на этом устройстве.':'Браузер не разрешил сохранение. Скачайте эскиз, чтобы сохранить изменения.';if(saveState.textContent!==message)saveState.textContent=message;updateHistory();renderPreview();}
 function syncFields(){for(const {input}of fields){const next=sketchFieldText(data,input.dataset.key,tr)??'';if(input.value!==next)input.value=next;}}
 function restore(value,record=true){const previousTheme=data.theme;Object.assign(data,normalizeSketch(value));syncFields();renderBlocks();commit(record);if(previousTheme!==data.theme)window.dispatchEvent(new CustomEvent('syolana:builder-theme',{detail:{theme:data.theme}}));}
 undo.onclick=()=>{if(historyIndex>0){historyIndex--;restore(JSON.parse(history[historyIndex]),false);}};
 redo.onclick=()=>{if(historyIndex<history.length-1){historyIndex++;restore(JSON.parse(history[historyIndex]),false);}};
 importButton.onclick=()=>fileInput.click();fileInput.onchange=async()=>{const file=fileInput.files?.[0];if(!file)return;try{if(file.size>1000000)throw Error('Файл эскиза слишком большой.');restore(parseSketchFile(await file.text()));}catch(error){saveState.textContent=error.message;}fileInput.value='';};
 saveProject.onclick=()=>{commit();downloadFile('syolana-sketch.json',JSON.stringify(sketchPayload(data),null,2),'application/json');};
 const keyboard=event=>{if(!root.contains(document.activeElement)||!(event.ctrlKey||event.metaKey))return;const key=event.key.toLowerCase();if(key==='s'){event.preventDefault();saveProject.click();}else if(key==='z'&&!event.target.matches('input,textarea,[contenteditable]')){event.preventDefault();(event.shiftKey?redo:undo).click();}};document.addEventListener('keydown',keyboard);
 fields.forEach(({input})=>input.addEventListener('input',()=>{const key=input.dataset.key;data[key]=input.value;if(TEMPLATE_FIELDS.includes(key))data.templateFields=data.templateFields.filter(field=>field!==key);commit();}));
 download.onclick=()=>{commit();downloadFile('syolana-sketch.html',createSketchHTML(data,{locale:getLocale(),translate:tr}),'text/html;charset=utf-8');};
 copy.onclick=async()=>{commit();const pairs=[['Название проекта',sketchFieldText(data,'name',tr)],['Главное описание',sketchFieldText(data,'description',tr)],['О проекте',sketchFieldText(data,'about',tr)],['Направления / услуги',sketchFieldText(data,'services',tr)],['Галерея',sketchFieldText(data,'galleryText',tr)],['Вопросы и ответы',sketchFieldText(data,'faqText',tr)],['Текст главной кнопки',sketchFieldText(data,'cta',tr)],['Ссылка для связи',data.contact||'—'],['Автоматические публикации',tr(SOURCE_TYPES.find(x=>x[0]===data.sourceType)?.[1]||'—')+' '+(data.sourceUrl||'')],['Настроение темы',tr(THEMES.find(x=>x[0]===data.theme)?.[1]||data.theme)],['Блоки и порядок',data.blocks.map(id=>BLOCKS[id]?tr(BLOCKS[id]):sketchBlockTitle(data.extraBlocks.find(b=>b.id===id),tr)).join(' → ')]];const brief=[...pairs.map(([label,value])=>tr(label)+': '+value),...data.blocks.map(id=>data.extraBlocks.find(b=>b.id===id)).filter(Boolean).map(b=>sketchBlockTitle(b,tr)+'\n'+b.text)].join('\n');try{await navigator.clipboard.writeText(brief);copy.textContent=tr('Скопировано');setTimeout(()=>copy.textContent=tr('Скопировать бриф'),1500);}catch{downloadFile('syolana-brief.txt',brief,'text/plain;charset=utf-8');}};
 reset.onclick=()=>{if(!confirm('Очистить этот локальный эскиз?'))return;try{localStorage.removeItem(STORAGE_KEY);}catch{}restore(defaults);};
 const themes=el('details','sketch-theme-picker');themes.append(el('summary','','Выбрать тему по превью'));const choices=el('div','sketch-theme-choices');
 for(const [id,name]of THEMES){const b=el('button','btn sketch-theme-choice');b.type='button';b.dataset.theme=id;const image=el('img');image.src='themes/previews/'+id+'.jpg?v=20261012-moon-garden-1';image.alt='';image.loading='lazy';image.decoding='async';b.append(image,el('span','',name));b.onclick=()=>{const select=fields.find(x=>x.input.dataset.key==='theme').input;select.value=id;data.theme=id;commit();window.dispatchEvent(new CustomEvent('syolana:builder-theme',{detail:{theme:id}}));};choices.append(b);}themes.append(choices);form.append(themes);
 fields.find(x=>x.input.dataset.key==='theme').input.addEventListener('change',e=>window.dispatchEvent(new CustomEvent('syolana:builder-theme',{detail:{theme:e.target.value}})));
 desktop.setAttribute('aria-pressed','true');mobile.setAttribute('aria-pressed','false');desktop.onclick=()=>{canvas.classList.remove('sketch-mobile');desktop.setAttribute('aria-pressed','true');mobile.setAttribute('aria-pressed','false');fitHeadings();};mobile.onclick=()=>{canvas.classList.add('sketch-mobile');desktop.setAttribute('aria-pressed','false');mobile.setAttribute('aria-pressed','true');fitHeadings();};
 const localeChanged=()=>{syncFields();for(const block of data.extraBlocks){const row=[...blocks.children].find(n=>n.dataset.blockId===block.id),input=row?.querySelector('[data-key="custom-title"]');if(input)input.value=sketchBlockTitle(block,tr);}renderPreview();};
 window.addEventListener('syolana:locale',localeChanged);syncFields();commit(false);return()=>{document.removeEventListener('keydown',keyboard);window.removeEventListener('syolana:locale',localeChanged);};
}
