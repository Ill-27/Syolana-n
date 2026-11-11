import {secondsFor} from './audio.js?v=20261022-fr-a1-review-1';
import {trainerGroups} from './trainers.js?v=20261022-fr-a1-review-1';

export function explanationPair(id,text,ru='') {
  return {id:'fr-explanation-'+id,en:text,ru,ipa:'',phoneticIPA:'',lang:'fr-FR',tag:'Пояснение'};
}
export function restoreQueue(savedQueue,savedProgress,data,curriculum) {
  const allowed=new Set([data.version,...(data.progressCompatibility?.versions||[])]);
  if(!savedQueue||!savedProgress||savedQueue.version!==savedProgress.version||!allowed.has(savedQueue.version)||!Array.isArray(savedQueue.ids))return null;
  const cursor=Number.isInteger(savedProgress.unitIndex)&&savedProgress.unitIndex>=0?savedProgress.unitIndex:0;
  const units=[],seen=new Set();let unitIndex=0;
  savedQueue.ids.forEach((id,i)=>{const unit=curriculum.map.get(id);if(unit&&!seen.has(id)){seen.add(id);if(i<cursor)unitIndex++;units.push(unit);}});
  if(!units.length||unitIndex>=units.length)return null;
  const sameVersion=savedQueue.version===data.version;
  return {units,unitIndex,segmentIndex:sameVersion?Math.max(0,savedProgress.segmentIndex||0):0,elapsed:sameVersion?Math.max(0,savedProgress.elapsed||0):0};
}

export function makeCurriculum(data,{rate=1,repeat=1,target=1800}={},preparedGroups) {
  const units=[],map=new Map(),rules=[],groups=preparedGroups??trainerGroups(data);
  function unit(pair,kind,section,explanation='',owner='') {
    if(map.has(pair.id))return map.get(pair.id);
    const u={pair,kind,section,explanation,owner};map.set(pair.id,u);units.push(u);return u;
  }
  const duration=u=>secondsFor(u,rate,'en',repeat);
  function repetition(ids){
    for(const group of groups.filter(g=>ids.includes(g.id))){
      const pairs=group.pairs.filter(p=>!map.has(p.id));let chunk=[],seconds=0;
      const push=()=>{if(chunk.length)rules.push({section:{id:'repeat-'+group.id,title:group.title,area:'repetition'},units:chunk});chunk=[];seconds=0;};
      for(const pair of pairs){const u=unit(pair,'rule','repeat-'+group.id),n=duration(u);if(seconds+n>target*.22)push();chunk.push(u);seconds+=n;}push();
    }
  }
  for(const section of data.rules){
    const list=[];
    for(const [index,item] of section.items.entries()){
      if(item.bodyFr)list.push(unit(explanationPair('rule-'+section.id+'-'+index,item.bodyFr,item.body),'rule',section.id));
      else if(item.instruction)list.push(unit(item.instruction,'rule',section.id,item.body));
      for(const p of item.pairs)list.push(unit(p,'rule',section.id));
    }
    if(section.id==='read-alphabet')for(const p of data.alphabet)list.push(unit(p,'rule',section.id));
    if(['read-vowels','read-consonants'].includes(section.id))for(const p of data.phonetics.filter(p=>section.id==='read-consonants'?p.type==='Согласный':p.type!=='Согласный')){if(p.mouthFr)list.push(unit(explanationPair('sound-'+p.id,p.mouthFr,p.mouth),'rule',section.id));list.push(unit(p.example,'rule',section.id,p.mouth));}
    rules.push({section,units:list});
    if(section.id==='numbers')repetition(['numbers','ordinals','time','calendar','dates','prices','measurements']);
    if(section.id==='contacts')repetition(['contacts']);
    if(section.id==='weather')repetition(['weather']);
    if(section.id==='perfect-duration')repetition(['duration','tense-patterns']);
    if(section.id==='necessity')repetition(['modal-patterns']);
    if(section.id==='verb-gerund')repetition(['verb-patterns']);
    if(section.id==='comparison')repetition(['comparison-patterns']);
  }
  repetition(groups.filter(g=>g.pairs.some(p=>!map.has(p.id))).map(g=>g.id));
  const words=data.vocabulary.map(w=>({word:w,units:[unit(w.head,'word','vocabulary',w.note,w.id),...w.forms.map(p=>unit(p,'word','vocabulary','',w.id)),...w.examples.map(p=>unit(p,'word','vocabulary','',w.id))]}));
  const extras=[];
  // Keep each regional comparison and each conversation together in one day.
  for(const [index,v] of data.variants.entries())extras.push([unit(v.uk,'comparison','variants'),unit(v.us,'comparison','variants'),...(v.noteFr?[unit(explanationPair('variant-'+index,v.noteFr,v.note),'comparison','variants')]:[])]);
  for(const p of data.practice)extras.push([...(p.taskFr?[explanationPair('task-'+p.id,p.taskFr,p.task)]:[]),...p.pairs,...(p.model?[p.model]:[])].map(pair=>unit(pair,'practice','practice')));
  const total=units.reduce((s,u)=>s+duration(u),0),count=Math.max(2,Math.ceil(total/target));
  const lessons=Array.from({length:count},(_,i)=>({id:'day-'+(i+1),number:i+1,rules:[],words:[],extras:[],units:[],seconds:0}));
  const foundation=rules.filter(r=>r.section.area==='reading'),later=rules.filter(r=>r.section.area!=='reading');
  lessons[0].rules.push(...foundation);
  later.forEach((r,i)=>lessons[Math.min(count-1,1+Math.floor(i*(count-1)/later.length))].rules.push(r));
  lessons.forEach(day=>{day.units=day.rules.flatMap(r=>r.units);day.seconds=day.units.reduce((s,u)=>s+duration(u),0);});
  let wi=0;
  for(let i=0;i<count;i++){
    const day=lessons[i];
    while(wi<words.length){
      const w=words[wi],n=w.units.reduce((s,u)=>s+duration(u),0);
      const availableLater=lessons.slice(i+1).reduce((s,d)=>s+Math.max(0,target-d.seconds),0);
      if(day.seconds+n>target&&i<count-1&&day.words.length&&availableLater>0)break;
      day.words.push(w.word);day.units.push(...w.units);day.seconds+=n;wi++;
    }
  }
  for(const bundle of extras){const seconds=bundle.reduce((s,u)=>s+duration(u),0),day=lessons.find(d=>d.seconds+seconds<=target)||lessons.at(-1);day.extras.push(...bundle);day.units.push(...bundle);day.seconds+=seconds;}
  return {map,days:lessons,all:lessons.flatMap(d=>d.units),totalSeconds:total,rate,repeat};
}
const remainingCache=new WeakMap();
export function remainingSeconds(player,rate=1){
  const units=player.units;let cached=remainingCache.get(units);
  if(!cached||cached.rate!==rate||cached.mode!==player.mode||cached.repeat!==player.repeat||cached.length!==units.length){
    const seconds=new Float64Array(units.length+1);
    for(let i=units.length-1;i>=0;i--)seconds[i]=seconds[i+1]+secondsFor(units[i],rate,player.mode,player.repeat);
    cached={rate,mode:player.mode,repeat:player.repeat,length:units.length,seconds};remainingCache.set(units,cached);
  }
  return cached.seconds[player.unitIndex]??0;
}
