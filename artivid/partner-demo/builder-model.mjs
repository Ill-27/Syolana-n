import {normalizeContacts} from './contacts.mjs';
export const BLOCK_TYPES=['intro','text','features','gallery','links','publications','books'];
export function validateSiteSettings(value,{books=false,embeddedMedia=false}={}){
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error('Выберите настройки сайта.');
 const text=(v,max)=>{if(typeof v!=='string'||v.length>max)throw Error('Текст слишком длинный или имеет неверный формат.');return v.trim();};
 const name=text(value.name||'',100);if(!name)throw Error('Укажите название сайта.');
 const theme=text(value.theme||'',80);if(theme&&!/^[a-z0-9-]+$/.test(theme))throw Error('Выберите тему из списка.');
 if(!Array.isArray(value.blocks)||value.blocks.length>12)throw Error('На странице может быть до 12 блоков.');
 const used=new Set();const blocks=value.blocks.map(b=>{
  if(!b||!BLOCK_TYPES.includes(b.type)||(b.type==='books'&&!books))throw Error('Выберите доступный тип блока.');
  const id=text(b.id||'',80);if(!/^[a-z0-9-]+$/.test(id)||used.has(id))throw Error('Повторяющийся блок.');used.add(id);
  const result={id,type:b.type,title:text(b.title||'',160),text:text(b.text||'',6000)};
  if(b.href){let u;try{u=new URL(b.href);}catch{throw Error('Проверьте ссылку.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Ссылка должна начинаться с https://.');result.href=u.href;result.linkLabel=text(b.linkLabel||'Открыть',80);}
  if(b.image){if(embeddedMedia&&/^data:image\/(?:jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(b.image)&&b.image.length<=2800000)result.image=b.image;else if(/^\/api\/course-access\/studio\/[a-z0-9][a-z0-9-]{2,49}\/media\/[a-f0-9]{32}$/.test(b.image))result.image=b.image;else{let u;try{u=new URL(b.image);}catch{throw Error('Выберите опубликованное фото.');}if(u.protocol!=='https:'||u.username||u.password)throw Error('Проверьте адрес фото.');result.image=u.href;}}
  return result;
 });
 return{version:1,name,tagline:text(value.tagline||'',240),description:text(value.description||'',2400),theme,blocks,...(value.contacts===undefined?{}:{contacts:normalizeContacts(value.contacts)})};
}
