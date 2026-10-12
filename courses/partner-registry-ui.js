const make=(tag,text='',cls='')=>{const n=document.createElement(tag);n.textContent=text;if(cls)n.className=cls;return n;};
const when=s=>s?new Date(s*1000).toLocaleDateString('ru-RU'):'не проверен';
const names={active:'Активна',suspended:'Приостановлена',ended:'Завершена',expired:'Срок истёк'};
export function mountPartnerRegistry(host,request){
 const section=make('details','','access-details');section.append(make('summary','Мои партнёрские сайты'));
 section.append(make('p','Закрытый список адресов и лицензий. Новая лицензия действует 12 месяцев. Список виден только после входа владельца.'));
 const message=make('p','','notice');message.setAttribute('role','status');
 const form=make('form','','access-form'),label=make('label','Адрес сайта','field'),url=make('input');url.name='siteUrl';url.type='url';url.required=true;url.placeholder='https://example.ru/';label.append(url);
 const projectLabel=make('label','Эскиз в мастерской · необязательно','field'),project=make('select');project.name='siteId';const external=make('option','Внешний сайт');external.value='';project.append(external);projectLabel.append(project);
 const add=make('button','Добавить на 12 месяцев');add.type='submit';form.append(label,projectLabel,add);
 const list=make('div','','access-orders');section.append(form,list,message);host.append(section);
 async function refresh(){
  const d=await request('admin/partner-registry');list.replaceChildren();
  try{const value=await request('studio/projects');const selected=project.value;project.replaceChildren(external);for(const p of value.projects){const option=make('option',p.name);option.value=p.id;project.append(option);}project.value=selected;}catch{}
  for(const row of d.sites){
   const item=make('section','','access-order'),link=make('a',row.siteUrl);link.href=row.siteUrl;link.target='_blank';link.rel='noopener noreferrer';
   item.append(link,make('p',names[row.effectiveStatus]+' · '+when(row.licenseStart)+' — '+when(row.licenseUntil)),make('p','Публичная проверка: '+when(row.lastPublicCheck)));
   async function change(body){try{await request('admin/partner-registry',{partnerId:row.partnerId,...body});await refresh();message.textContent='Состояние лицензии сохранено.';}catch(e){message.textContent=e.message;}}
   const checked=make('button','Сайт проверен мной');checked.type='button';checked.onclick=()=>change({publicChecked:true});item.append(checked);
   const toggle=make('button',row.status==='active'?'Приостановить':'Возобновить');toggle.type='button';toggle.disabled=row.effectiveStatus==='expired';toggle.onclick=()=>change({status:row.status==='active'?'suspended':'active',reason:'owner-review'});item.append(toggle);
   if(row.effectiveStatus==='expired'){const renew=make('button','Новый согласованный год');renew.type='button';renew.onclick=()=>change({status:'active',licenseStart:Math.floor(Date.now()/1000),licenseUntil:undefined});item.append(renew);}
   list.append(item);
  }
  if(!d.sites.length)list.append(make('p','Список пока пуст. Добавляйте адрес после согласования лицензии.'));
 }
 form.onsubmit=async e=>{e.preventDefault();add.disabled=true;try{await request('admin/partner-registry',{siteUrl:url.value,siteId:project.value});url.value='';await refresh();message.textContent='Адрес добавлен; срок лицензии — 12 месяцев.';}catch(e){message.textContent=e.message;}finally{add.disabled=false;}};
 let loaded=false;section.addEventListener('toggle',()=>{if(section.open&&!loaded){loaded=true;refresh().catch(e=>{loaded=false;message.textContent=e.message;});}});
}
