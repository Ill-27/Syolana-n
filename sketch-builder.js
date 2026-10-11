const STORAGE_KEY='syolana.partner.sketch.v1';
const THEMES=[['aurora','Северное сияние'],['golden','Золотые струны'],['moon','Лунный сад'],['amber-forest','Янтарный лес'],['living-sea','Море странствий'],['white-ocean-city','Белый город']];
const SOURCE_TYPES=[['none','Без автоленты'],['vk','VK'],['telegram','Telegram'],['youtube','YouTube'],['instagram','Instagram'],['facebook','Facebook'],['other','Другой публичный источник']];
const defaults={name:'Мой проект',eyebrow:'АВТОРСКИЙ ПРОЕКТ',description:'Коротко расскажите, чем вы занимаетесь и почему это важно.',about:'Расскажите о себе, подходе или проекте.',services:'Опишите основные направления, услуги или материалы.',cta:'Связаться',contact:'',sourceType:'none',sourceUrl:'',theme:'aurora',blocks:['about','services','publications','contacts']};

function el(tag,cls='',text=''){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
function safeParse(value){try{const data=JSON.parse(value);return data&&typeof data==='object'?data:{};}catch{return {};}}
function load(){return {...defaults,...safeParse(localStorage.getItem(STORAGE_KEY)||'{}')};}
function save(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data));}
function field(label,key,value,{type='text',placeholder='',rows=0}={}){const wrap=el('label','sketch-field');wrap.append(el('span','',label));const input=rows?document.createElement('textarea'):document.createElement(type==='select'?'select':'input');input.dataset.key=key;if(rows)input.rows=rows;if(type!=='select')input.type=type;input.value=value||'';input.placeholder=placeholder;wrap.append(input);return {wrap,input};}
function optionSelect(label,key,value,options){const {wrap,input}=field(label,key,value,{type:'select'});for(const [v,t] of options){const o=document.createElement('option');o.value=v;o.textContent=t;o.selected=v===value;input.append(o);}return {wrap,input};}
function cleanUrl(value){try{const u=new URL(String(value||'').trim());return /^https?:$/.test(u.protocol)?u.href:'';}catch{return '';}}
function addStyles(){if(document.getElementById('sketch-builder-style'))return;const s=document.createElement('style');s.id='sketch-builder-style';s.textContent=`
.sketch-builder{display:grid;grid-template-columns:minmax(300px,.82fr) minmax(360px,1.18fr);gap:16px;align-items:start}.sketch-panel{padding:20px}.sketch-panel h2{margin-bottom:8px}.sketch-note{color:var(--panel-muted,#c9c5d7);font-size:.92rem;line-height:1.55}.sketch-form{display:grid;gap:13px}.sketch-field{display:grid;gap:6px}.sketch-field>span{font-size:.82rem;letter-spacing:.04em;color:var(--panel-muted,#c9c5d7)}.sketch-field input,.sketch-field textarea,.sketch-field select{width:100%;border:1px solid rgba(255,255,255,.16);background:rgba(5,7,14,.42);color:inherit;border-radius:14px;padding:11px 12px;font:inherit}.sketch-field textarea{resize:vertical;min-height:88px}.sketch-blocks{display:grid;gap:8px}.sketch-block{display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.12);border-radius:14px;background:rgba(255,255,255,.035)}.sketch-block-actions{display:flex;gap:5px}.sketch-block button{min-width:34px;min-height:34px;border-radius:10px}.sketch-preview{position:sticky;top:88px;overflow:hidden}.sketch-devicebar{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.1)}.sketch-devicebar strong{font-size:.9rem}.sketch-canvas{padding:14px;min-height:620px;background:radial-gradient(circle at 20% 0%,rgba(115,132,255,.18),transparent 35%),radial-gradient(circle at 86% 20%,rgba(199,109,255,.16),transparent 32%),rgba(4,5,12,.58)}.sketch-site{border:1px solid rgba(255,255,255,.13);border-radius:25px;overflow:hidden;background:rgba(7,8,16,.72);box-shadow:0 28px 80px rgba(0,0,0,.26)}.sketch-hero{padding:clamp(25px,6vw,58px);min-height:280px;display:flex;flex-direction:column;justify-content:end;background:linear-gradient(145deg,rgba(255,255,255,.04),rgba(255,255,255,.01))}.sketch-kicker{font-size:.7rem;letter-spacing:.18em;text-transform:uppercase;opacity:.7}.sketch-site h1{font-size:clamp(2.2rem,6vw,4.7rem);line-height:.95;margin:.35rem 0 1rem}.sketch-lead{max-width:680px;line-height:1.6;opacity:.8}.sketch-section{padding:24px;border-top:1px solid rgba(255,255,255,.1)}.sketch-section h3{font-size:1.35rem;margin-bottom:8px}.sketch-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.sketch-theme-chip{display:inline-flex;padding:6px 9px;border-radius:999px;border:1px solid rgba(255,255,255,.13);font-size:.75rem;opacity:.75}.sketch-buttons{display:flex;flex-wrap:wrap;gap:8px;margin-top:15px}.sketch-private{display:flex;gap:9px;align-items:flex-start;padding:12px 13px;border-radius:14px;background:rgba(115,189,148,.08);border:1px solid rgba(115,189,148,.16);font-size:.86rem;line-height:1.5}.sketch-empty{opacity:.62;font-style:italic}.sketch-mobile .sketch-canvas{max-width:410px;margin:auto}.sketch-mobile .sketch-site h1{font-size:2.5rem}@media(max-width:900px){.sketch-builder{grid-template-columns:1fr}.sketch-preview{position:relative;top:auto}.sketch-canvas{min-height:auto}}`;
document.head.append(s);}

export function mountSketchBuilder(host){
 addStyles();
 const data=load();
 const root=el('section','sketch-builder');root.dataset.positioningView='create-site';
 const editor=el('div','card sketch-panel');
 editor.append(el('p','eyebrow','БЕЗ РЕГИСТРАЦИИ · СОХРАНЯЕТСЯ ТОЛЬКО У ВАС'),el('h1','', 'Соберите эскиз сайта'),el('p','sketch-note','Это не хостинг и не CMS. Здесь можно спокойно собрать структуру, тексты и настроение будущего шаблона. Черновик хранится только в вашем браузере. Затем его можно передать Syolana для профессиональной доработки.'));
 const privacy=el('div','sketch-private');privacy.append(el('span','','◌'),el('span','','Syolana не получает этот черновик автоматически. Ничего не отправляется без вашего действия.'));
 editor.append(privacy);
 const form=el('div','sketch-form');
 const fields=[
  field('Название проекта','name',data.name,{placeholder:'Например: Atelier Nocturne'}),
  field('Короткая надпись над заголовком','eyebrow',data.eyebrow,{placeholder:'СТУДИЯ · АВТОР · МАСТЕРСКАЯ'}),
  field('Главное описание','description',data.description,{rows:3}),
  field('О проекте','about',data.about,{rows:4}),
  field('Что вы предлагаете','services',data.services,{rows:4}),
  field('Текст главной кнопки','cta',data.cta,{placeholder:'Связаться'}),
  field('Ссылка для связи','contact',data.contact,{type:'url',placeholder:'https://…'}),
  optionSelect('Источник публикаций','sourceType',data.sourceType,SOURCE_TYPES),
  field('Ссылка на публичный источник','sourceUrl',data.sourceUrl,{type:'url',placeholder:'https://…'}),
  optionSelect('Настроение темы','theme',data.theme,THEMES),
 ];
 fields.forEach(x=>form.append(x.wrap));
 editor.append(form,el('h3','','Блоки и порядок'));
 const blocks=el('div','sketch-blocks');
 const labels={about:'О проекте',services:'Направления / услуги',publications:'Публикации',contacts:'Контакты'};
 function renderBlocks(){blocks.replaceChildren();data.blocks.forEach((id,index)=>{const row=el('div','sketch-block');row.append(el('span','',labels[id]||id));const actions=el('div','sketch-block-actions');const up=el('button','btn','↑'),down=el('button','btn','↓');up.type=down.type='button';up.title='Поднять блок';down.title='Опустить блок';up.disabled=index===0;down.disabled=index===data.blocks.length-1;up.onclick=()=>move(index,-1);down.onclick=()=>move(index,1);actions.append(up,down);row.append(actions);blocks.append(row);});}
 function move(index,delta){const j=index+delta;if(j<0||j>=data.blocks.length)return;[data.blocks[index],data.blocks[j]]=[data.blocks[j],data.blocks[index]];commit();renderBlocks();}
 renderBlocks();editor.append(blocks);
 const note=el('p','sketch-note','Для VK, Telegram, YouTube, Instagram, Facebook и других платформ способ автопубликации зависит от официально доступных интерфейсов конкретного источника. На этапе эскиза достаточно указать ссылку.');editor.append(note);
 const buttons=el('div','sketch-buttons');const download=el('button','btn primary','Скачать эскиз'),copy=el('button','btn','Скопировать бриф'),reset=el('button','btn','Начать заново');download.type=copy.type=reset.type='button';buttons.append(download,copy,reset);editor.append(buttons);
 const preview=el('div','card sketch-preview');const bar=el('div','sketch-devicebar');bar.append(el('strong','','Живой предпросмотр'));const modes=el('div','row');const desktop=el('button','btn small','Широко'),mobile=el('button','btn small','Телефон');desktop.type=mobile.type='button';modes.append(desktop,mobile);bar.append(modes);const canvas=el('div','sketch-canvas');preview.append(bar,canvas);
 root.append(editor,preview);host.replaceChildren(root);
 function textOr(v,fallback){return String(v||'').trim()||fallback;}
 function renderPreview(){
  canvas.replaceChildren();const site=el('article','sketch-site');const hero=el('header','sketch-hero');hero.append(el('span','sketch-theme-chip',THEMES.find(x=>x[0]===data.theme)?.[1]||'Тема Syolana'),el('p','sketch-kicker',textOr(data.eyebrow,'ВАШ ПРОЕКТ')),el('h1','',textOr(data.name,'Название проекта')),el('p','sketch-lead',textOr(data.description,'Короткое описание проекта.')));const actionUrl=cleanUrl(data.contact);if(actionUrl){const a=el('a','btn primary',textOr(data.cta,'Связаться'));a.href=actionUrl;a.target='_blank';a.rel='noopener noreferrer';hero.append(a);}site.append(hero);
  for(const id of data.blocks){const s=el('section','sketch-section');if(id==='about'){s.append(el('p','sketch-kicker','О ПРОЕКТЕ'),el('h3','',textOr(data.name,'Ваш проект')),el('p','',textOr(data.about,'Здесь появится рассказ о проекте.')));}else if(id==='services'){s.append(el('p','sketch-kicker','НАПРАВЛЕНИЯ'),el('h3','','Что вы предлагаете'),el('p','',textOr(data.services,'Здесь появятся основные направления или услуги.')));}else if(id==='publications'){s.append(el('p','sketch-kicker','ПУБЛИКАЦИИ'),el('h3','','Последнее из вашего источника'));const url=cleanUrl(data.sourceUrl);s.append(el('p',url?'':'sketch-empty',url?`Источник: ${SOURCE_TYPES.find(x=>x[0]===data.sourceType)?.[1]||'публичная лента'}`:'Укажите публичный источник — способ подключения подберём после согласования.'));if(url){const a=el('a','btn','Открыть источник');a.href=url;a.target='_blank';a.rel='noopener noreferrer';s.append(a);}}else if(id==='contacts'){s.append(el('p','sketch-kicker','КОНТАКТЫ'),el('h3','',textOr(data.cta,'Связаться')),el('p',actionUrl?'':'sketch-empty',actionUrl?'Контактная ссылка уже добавлена.':'Добавьте ссылку для связи.'));}site.append(s);}canvas.append(site);
 }
 function commit(){for(const {input} of fields)data[input.dataset.key]=input.value;save(data);renderPreview();}
 fields.forEach(({input})=>input.addEventListener('input',commit));
 desktop.onclick=()=>{canvas.classList.remove('sketch-mobile');};mobile.onclick=()=>{canvas.classList.add('sketch-mobile');};
 download.onclick=()=>{commit();const payload={format:'syolana-sketch-v1',createdAt:new Date().toISOString(),project:data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='syolana-sketch.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
 copy.onclick=async()=>{commit();const brief=[`Проект: ${data.name}`,`Описание: ${data.description}`,`О проекте: ${data.about}`,`Направления: ${data.services}`,`Кнопка: ${data.cta}`,`Контакт: ${data.contact||'—'}`,`Публикации: ${SOURCE_TYPES.find(x=>x[0]===data.sourceType)?.[1]||'—'} ${data.sourceUrl||''}`,`Тема: ${THEMES.find(x=>x[0]===data.theme)?.[1]||data.theme}`,`Блоки: ${data.blocks.map(x=>labels[x]).join(' → ')}`].join('\n');try{await navigator.clipboard.writeText(brief);copy.textContent='Скопировано';setTimeout(()=>copy.textContent='Скопировать бриф',1500);}catch{download.click();}};
 reset.onclick=()=>{if(!confirm('Очистить этот локальный эскиз?'))return;localStorage.removeItem(STORAGE_KEY);Object.assign(data,defaults,{blocks:[...defaults.blocks]});for(const {input} of fields)input.value=data[input.dataset.key]||'';renderBlocks();commit();};
 renderPreview();
 return ()=>{};
}
