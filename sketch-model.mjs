export const BLOCK_IDS=['about','services','gallery','publications','faq','contacts'];
const THEMES=['aurora','golden','moon','amber-forest','living-sea','white-ocean-city','violet-bloom'];
export const defaultSketch={name:'Мой проект',eyebrow:'АВТОРСКИЙ ПРОЕКТ',description:'Коротко расскажите, чем вы занимаетесь и почему это важно.',aboutTitle:'О проекте',about:'Расскажите о себе, подходе или проекте.',servicesTitle:'Что мы предлагаем',services:'Опишите основные направления, услуги или материалы.',galleryTitle:'Галерея',galleryText:'Опишите, какие работы или изображения должны быть показаны.',faqTitle:'Частые вопросы',faqText:'Напишите вопросы и короткие ответы, которые важно увидеть посетителю.',cta:'Связаться',contact:'',sourceType:'none',sourceUrl:'',theme:'aurora',extraBlocks:[],blocks:['about','services','publications','contacts']};
export const TEMPLATE_FIELDS=['name','eyebrow','description','aboutTitle','about','servicesTitle','services','galleryTitle','galleryText','faqTitle','faqText','cta'];
export function sketchFieldText(data,key,translate=value=>value){return data.templateFields?.includes(key)?translate(defaultSketch[key]):data[key];}
export function sketchBlockTitle(block,translate=value=>value){return block.templateTitle?translate('Заголовок'):block.title;}
export function normalizeSketch(value={}){
 const data=structuredClone(defaultSketch);
 data.templateFields=[...TEMPLATE_FIELDS];
 if(!value||typeof value!=='object'||Array.isArray(value))return data;
 for(const key of Object.keys(data))if(key!=='blocks'&&typeof value[key]==='string')data[key]=value[key].slice(0,key==='name'?300:40000);
 const candidates=Array.isArray(value.templateFields)?value.templateFields:TEMPLATE_FIELDS;
 data.templateFields=TEMPLATE_FIELDS.filter(key=>candidates.includes(key)&&data[key]===defaultSketch[key]);
 data.extraBlocks=Array.isArray(value.extraBlocks)?value.extraBlocks.filter(b=>b&&typeof b.id==='string'&&/^text-[a-z0-9-]{1,40}$/.test(b.id)).slice(0,30).map(b=>({id:b.id,title:String(b.title??'').slice(0,300),text:String(b.text??'').slice(0,40000),templateTitle:b.templateTitle===true&&b.title==='Заголовок'})):[];
 const allowed=new Set([...BLOCK_IDS,...data.extraBlocks.map(b=>b.id)]);
 data.blocks=Array.isArray(value.blocks)?[...new Set(value.blocks.filter(x=>allowed.has(x)))]:data.blocks;
 if(!THEMES.includes(data.theme))data.theme='aurora';
 if(!['none','public'].includes(data.sourceType))data.sourceType='none';
 return data;
}
export function contactURL(value){try{const u=new URL(String(value||'').trim());return /^https?:$/.test(u.protocol)&&!u.username&&!u.password?u.href:'';}catch{return '';}}
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function sketchPayload(value){return {format:'syolana-sketch-v3',project:normalizeSketch(value)};}
export function createSketchHTML(value,{locale='ru',translate=text=>text}={}){
 const project=normalizeSketch(value),p={...project},section=(title,text)=>'<section><h2>'+escape(title)+'</h2><p>'+escape(text)+'</p></section>';
 for(const key of TEMPLATE_FIELDS)p[key]=sketchFieldText(project,key,translate);
 const sections={about:[p.aboutTitle,p.about],services:[p.servicesTitle,p.services],gallery:[p.galleryTitle,p.galleryText],faq:[p.faqTitle,p.faqText],publications:[translate('Публикации'),p.sourceType==='public'?p.sourceUrl:''],contacts:[p.cta,p.contact]};
 for(const b of p.extraBlocks)sections[b.id]=[sketchBlockTitle(b,translate),b.text];
 const url=contactURL(p.contact),cta=url?'<a href="'+escape(url)+'" rel="noopener noreferrer">'+escape(p.cta)+'</a>':'';
 const data=JSON.stringify(sketchPayload(project)).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');
 const language=['ru','en','es','fr'].includes(locale)?locale:'ru';
 return '<!doctype html><html lang="'+language+'"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+escape(p.name)+'</title><style>body{margin:0;background:#f7f7f7;color:#222;font:17px/1.65 system-ui,sans-serif}main{max-width:960px;margin:40px auto;padding:0 20px}header,section{padding:24px;background:#fff;border:1px solid #ddd;border-radius:12px;margin-bottom:20px}h1,h2{line-height:1.2;overflow-wrap:anywhere}h1{font-size:clamp(28px,6vw,48px)}p{white-space:pre-wrap;overflow-wrap:anywhere}a{display:inline-block;padding:10px 18px;border:1px solid #aaa;border-radius:8px;color:inherit}</style></head><body><main><header><p>'+escape(p.eyebrow)+'</p><h1>'+escape(p.name)+'</h1><p>'+escape(p.description)+'</p>'+cta+'</header>'+p.blocks.map(id=>section(...sections[id])).join('')+'</main><script type="application/json" id="sketch-data">'+data+'</script></body></html>';
}
export function parseSketchFile(text){
 if(typeof text!=='string'||text.length>1000000)throw Error('Файл эскиза слишком большой.');
 let raw=text;
 if(text.trimStart().startsWith('<')){const match=text.match(/<script\b[^>]*\bid=["']sketch-data["'][^>]*>([\s\S]*?)<\/script\s*>/i);if(!match)throw Error('В этом файле нет эскиза Syolana.');raw=match[1];}
 let data;try{data=JSON.parse(raw);}catch{throw Error('Не удалось прочитать файл эскиза.');}
 if(!['syolana-sketch-v2','syolana-sketch-v3'].includes(data?.format)||!data.project||typeof data.project.name!=='string')throw Error('В этом файле нет эскиза Syolana.');
 return normalizeSketch(data.project);
}
