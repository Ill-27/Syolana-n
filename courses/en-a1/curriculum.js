import {secondsFor} from './audio.js';
import {referencePairs} from './trainers.js';

export function makeCurriculum(data,{rate=1,repeat=1,target=1800}={}) {
  const units=[],map=new Map(), rules=[];
  function unit(pair,kind,section,explanation='',owner='') {
    if(map.has(pair.id)) return map.get(pair.id);
    const u={pair,kind,section,explanation,owner};map.set(pair.id,u);units.push(u);return u;
  }
  for(const section of data.rules) {
    const list=[];
    if(section.id==='read-alphabet') for(const p of data.alphabet) list.push(unit(p,'rule',section.id));
    if(section.id==='read-vowels') for(const p of data.phonetics) list.push(unit(p.example,'rule',section.id,p.mouth));
    for(const item of section.items) {
      if(item.instruction) list.push(unit(item.instruction,'rule',section.id,item.body));
      for(const p of item.pairs) list.push(unit(p,'rule',section.id));
    }
    if(section.id==='numbers') for(const p of referencePairs(data)) list.push(unit(p,'rule',section.id));
    rules.push({section,units:list});
  }
  const words=data.vocabulary.map(w=>({word:w,units:[unit(w.head,'word','vocabulary',w.note,w.id),...w.forms.map(p=>unit(p,'word','vocabulary','',w.id)),...w.examples.map(p=>unit(p,'word','vocabulary','',w.id))]}));
  const extras=[];
  for(const v of data.variants) extras.push(unit(v.uk,'comparison','variants',v.note),unit(v.us,'comparison','variants'));
  for(const p of data.practice) {for(const v of p.pairs) extras.push(unit(v,'practice','practice'));if(p.model) extras.push(unit(p.model,'practice','practice'));}
  const duration=u=>secondsFor(u,rate,'en',repeat);
  const total=units.reduce((s,u)=>s+duration(u),0);
  const count=Math.max(1,Math.ceil(total/target));
  const lessons=Array.from({length:count},(_,i)=>({id:'day-'+(i+1),number:i+1,rules:[],words:[],extras:[],units:[],seconds:0}));
  const foundation=rules.filter(r=>r.section.area==='reading'), later=rules.filter(r=>r.section.area!=='reading');
  lessons[0].rules.push(...foundation);
  // Every day begins with the rules assigned to it; all reading foundations come first.
  later.forEach((r,i)=>lessons[Math.min(count-1,Math.floor(i*count/later.length))].rules.push(r));
  lessons.forEach(day=>{day.units=day.rules.flatMap(r=>r.units);day.seconds=day.units.reduce((s,u)=>s+duration(u),0);});
  // Fill the remaining space in each day with whole word cards, never split their examples.
  let wi=0;
  for(let i=0;i<count;i++) {
    const day=lessons[i];
    while(wi<words.length) {
      const w=words[wi],n=w.units.reduce((s,u)=>s+duration(u),0);
      const availableLater=lessons.slice(i+1).reduce((s,d)=>s+Math.max(0,target-d.seconds),0);
      if(day.seconds+n>target && i<count-1 && day.words.length && availableLater>0) break;
      day.words.push(w.word);day.units.push(...w.units);day.seconds+=n;wi++;
    }
  }
  for(const u of extras) {
    let day=lessons.find(d=>d.seconds+duration(u)<=target) || lessons.at(-1);
    day.extras.push(u);day.units.push(u);day.seconds+=duration(u);
  }
  const all=lessons.flatMap(d=>d.units);
  return {map,days:lessons,all,totalSeconds:total,rate,repeat};
}
export function remainingSeconds(player,rate=1) {
  let n=0;
  for(let i=player.unitIndex;i<player.units.length;i++) n+=secondsFor(player.units[i],rate,player.mode,player.repeat);
  return n;
}
