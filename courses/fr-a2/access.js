import {createCourseAccess} from '../subscription-access.js?v=20261017-owner-1';
export function validateCourse(d){
  if(!d||d.schema!=='syolana.course.v1'||d.courseId!=='fr-a2')throw new Error('Выберите приватный файл французского A2 Syolana.');
  for(const k of ['rules','vocabulary','groups','alphabet','phonetics','practice','variants','repetition'])if(!Array.isArray(d[k]))throw new Error('В файле не хватает раздела: '+k+'.');
  if(!d.phonemeDictionary||!d.statistics||d.alphabet.length!==26||d.phonetics.length<20||d.vocabulary.length>5000)throw new Error('Структура курса повреждена.');
  const ids=new Set();let count=0;
  function visit(x,depth=0){
    if(depth>25)throw new Error('Некорректная вложенность файла.');if(!x||typeof x!=='object')return;
    if(Object.hasOwn(x,'en')){
      if(typeof x.id!=='string'||ids.has(x.id)||typeof x.en!=='string'||!x.en.trim()||typeof x.ru!=='string'||!x.ru.trim()||typeof x.ipa!=='string'||!/^\[[^<>]+\]$/.test(x.ipa)||x.lang!=='fr-FR'||/[А-Яа-яЁё]/.test(x.en))throw new Error('Неполная или повторяющаяся учебная запись.');
      if(x.en.length>10000||x.ru.length>15000||x.ipa.length>15000||++count>60000)throw new Error('Файл курса слишком большой.');ids.add(x.id);
    }
    for(const v of Object.values(x))visit(v,depth+1);
  }
  visit(d);for(const w of d.vocabulary)if(!w.head||!Array.isArray(w.forms)||!Array.isArray(w.examples)||w.examples.length!==4||new Set(w.examples.map(p=>p.en)).size!==4)throw new Error('Повреждена словарная статья.');
  for(const s of d.sources||[])if(new URL(s.url).protocol!=='https:')throw new Error('Некорректная ссылка в материале.');return d;
}

const access=createCourseAccess({course:'fr-a2',title:'французского A2',validateCourse});
export const loadCourse=access.loadCourse,mountAccountPanel=access.mountAccountPanel,monitorAccess=access.monitorAccess,watchSession=access.watchSession,sessionMark=access.sessionMark;

