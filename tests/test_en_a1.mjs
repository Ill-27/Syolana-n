import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {cleanSpeech,segmentsFor,voiceFor,SpeechPlayer,secondsFor} from '../courses/en-a1/audio.js';
import {makeCurriculum} from '../courses/en-a1/curriculum.js';
import {numberWords,ordinalWords,phonePair,spellingPair,timePair,pricePair,referencePairs,generatedPair,trainerGroups} from '../courses/en-a1/trainers.js';
import {displayIPA,displayText,dayDescription,resolveView} from '../courses/en-a1/presentation.js';

const data=JSON.parse(await readFile('courses/en-a1/data.json','utf8'));
const seen=new Set();let pairs=0;
function inspect(x){
  if(!x||typeof x!=='object')return;
  if(x.en&&x.ipa){
    assert(x.id&&!seen.has(x.id),'Duplicate teaching identifier: '+x.id);seen.add(x.id);pairs++;
    assert(x.ru?.trim(),'Missing translation: '+x.en);
    assert(/^\/[^<>?]+\/$/.test(x.ipa),'Invalid or absent IPA: '+x.en);
    assert(!/[А-Яа-яЁё]/.test(x.en),'Mixed language in English');
    assert(['en-GB','en-US'].includes(x.lang));
    for(const mode of ['en','en-ru','ru-en'])for(const s of segmentsFor({pair:x},mode))assert(!/[əɪʊɑɔɜθðʃʒŋˈˌː]/.test(s.text));
  }
  for(const v of Object.values(x))if(typeof v==='object')inspect(v);
}
inspect(data);
assert(data.statistics.uniqueHeadwords>=1300);
assert.equal(data.alphabet.length,26);assert.equal(data.phonetics.length,44);
assert.equal(data.rules.length,40);
for(const w of data.vocabulary){assert.equal(w.examples.length,4,w.word);assert.equal(new Set(w.examples.map(x=>x.en)).size,4,'Repeated example: '+w.word);}
const word=(name,kind)=>data.vocabulary.find(w=>w.word===name&&(!kind||w.kind===kind));
assert.equal(word('child').forms[0].en,'children');
assert.equal(word('woman').forms[0].en,'women');
assert.equal(word('tooth').forms[0].en,'teeth');
assert.equal(word('advice').head.en,'advice');assert(!word('advice').forms.some(x=>x.en==='advices'));
assert.equal(word('headphones').head.en,'headphones');
assert(word('good').forms.some(p=>p.en==='better'));
assert(word('far').forms.some(p=>p.en==='further'));
assert(word('be').forms.some(p=>p.en==='being'));
assert(word('go','verb').forms.some(p=>p.en==='went'));
assert.equal(word('midnight').head.en,'midnight');
assert.equal(word('sky').head.en,'the sky');
assert(word('singer').examples.some(p=>p.ru.includes('певцом')));
assert(word('shop assistant').examples.some(p=>p.ru.includes('продавцом')));
assert(word('firefighter').examples.some(p=>p.ru.includes('пожарным')));
assert(word('study','verb').examples[0].ru.includes('изучать английский'));
assert(word('wear','verb').forms.some(p=>p.en==='wearing'&&p.ipa==='/ˈweərɪŋ/'));
assert(word('prefer','verb').forms.some(p=>p.en==='preferring'));
assert(word('travel','verb').forms.some(p=>p.en==='travelled'));
assert(word('travel','verb').forms.some(p=>p.en==='travelling'));
assert(word('information').examples.some(p=>p.ru.includes('об информации')));
assert(word('grow','verb').examples[0].ru.includes('выращивать цветы'));
assert(word('take off','verb').examples[0].ru.includes('снимать мои ботинки'));
assert(word('come in','verb').examples.every(p=>!p.en.includes('Yesterday I came in now')));

for(const rate of [.6,1,1.5])for(const repeat of [1,3]){
  const c=makeCurriculum(data,{rate,repeat});
  assert.equal(c.days[0].rules[0].section.id,'read-start');
  assert(c.days[0].rules.every(r=>r.section.area==='reading'),'Day one mixes grammar into the reading foundation');
  assert.equal(c.days[0].units[0].section,'read-start');
  assert.equal(c.all.length,c.map.size,'A day lost a unit');
  assert.equal(new Set(c.all.map(x=>x.pair.id)).size,c.map.size,'A day repeated a unit');
  assert.equal(c.all.filter(x=>x.owner).length,data.vocabulary.reduce((s,w)=>s+1+w.forms.length+4,0));
  for(const d of c.days){let enteredWords=false;for(const u of d.units){if(u.kind==='word')enteredWords=true;if(u.kind==='rule')assert(!enteredWords,'Rules follow words');}
    if(d!==c.days.at(-1))assert(Math.abs(d.seconds-1800)<100,'Non-final day is far from half an hour: '+d.seconds);
    for(const u of d.units)segmentsFor(u,'en-ru',repeat);
  }
  assert.equal(c.all.filter(u=>u.pair.lang==='en-US').length,data.variants.length);
  for(const variant of data.variants){
    const day=c.days.find(d=>d.units.some(u=>u.pair.id===variant.uk.id));
    assert(day.units.some(u=>u.pair.id===variant.us.id),'A UK/US comparison was split between days');
  }
  for(const situation of data.practice){
    const day=c.days.find(d=>d.units.some(u=>u.pair.id===situation.pairs[0].id));
    for(const pair of [...situation.pairs,...(situation.model?[situation.model]:[])])assert(day.units.some(u=>u.pair.id===pair.id),'A conversation was split between days');
  }
  assert(Math.abs(c.days.reduce((s,d)=>s+d.seconds,0)-c.totalSeconds)<.01);
}
const uk={lang:'en-GB',voiceURI:'uk',localService:true},us={lang:'en-US',voiceURI:'us',localService:true},ru={lang:'ru-RU',voiceURI:'ru',localService:true};
assert.equal(voiceFor('en-GB',[us]),null,'US voice must not replace a missing UK voice');
assert.equal(voiceFor('en-US',[uk]),null);
assert.equal(voiceFor('en-US',[uk,us],'uk'),us,'An incompatible selection must not mix accents');
const example={pair:data.variants[0].us};
assert.deepEqual(segmentsFor(example,'en-ru').map(s=>s.lang),['en-US','ru-RU']);
assert.deepEqual(segmentsFor(example,'ru-en',2).map(s=>s.lang),['ru-RU','en-US','ru-RU','en-US']);
assert.equal(cleanSpeech('Ты свободен(-на)?','ru-RU'),'Ты свободен?');
assert.equal(cleanSpeech('Я счастливый / счастливая.','ru-RU'),'Я счастливый.');
assert.equal(cleanSpeech('a T-shirt /','en-GB'),'a T shirt');
assert.throws(()=>cleanSpeech('Hello привет','en-GB'));
assert.throws(()=>cleanSpeech('Привет hello','ru-RU'));
assert.throws(()=>cleanSpeech('/həˈləʊ/','en-GB'));
assert(secondsFor(example,1,'en-ru')>secondsFor(example,1,'en'));
assert.equal(numberWords(105),'one hundred and five');assert.equal(numberWords(105,false),'one hundred five');
assert.equal(numberWords(1001),'one thousand and one');assert.equal(ordinalWords(21),'twenty-first');assert.equal(ordinalWords(100),'one hundredth');
for(const n of [1,11,20,21,31,100,1000,1000000])generatedPair(ordinalWords(n),'число',data.phonemeDictionary);
assert.throws(()=>numberWords(-1));assert.throws(()=>ordinalWords(0));
assert(phonePair('+44 7700 900123',data.phonemeDictionary).en.startsWith('plus, four, four'));
assert(spellingPair('z_test@example.org',data).ipa.startsWith('/zed'));
assert.equal(timePair(8,45,data.phonemeDictionary).en,'quarter to nine');
assert.equal(pricePair(1,1,data.phonemeDictionary).en,'one pound and one penny');
for(const p of referencePairs(data))segmentsFor({pair:p},'en-ru');
const repetition=trainerGroups(data),plan=makeCurriculum(data);
const group=id=>repetition.find(g=>g.id===id);
for(let n=0;n<=100;n++)assert(group('numbers').pairs.some(p=>p.id==='number-'+n),'Missing number '+n);
for(let n=1;n<=31;n++)assert(group('ordinals').pairs.some(p=>p.en===ordinalWords(n)),'Missing ordinal '+n);
for(let n=0;n<60;n++)assert(group('time').pairs.some(p=>p.id==='time-9-'+n),'Missing minute '+n);
assert.equal(group('alphabet').pairs.length,26);
assert.equal(group('irregular').entries.length,data.vocabulary.filter(w=>w.irregular).length);
assert(group('irregular').entries.some(w=>w.word==='read'));
assert(group('irregular').entries.some(w=>w.word==='get up'));
for(const g of repetition)for(const pair of g.pairs){
  assert(pair.ru&&pair.ipa&&pair.lang);
  for(const m of ['en','en-ru','ru-en'])segmentsFor({pair},m);
  assert(plan.map.has(pair.id),'Displayed repetition is absent from full-course listening: '+pair.id);
  assert(/^\[[^\[\]]+\]$/.test(displayIPA(pair.ipa)));
}
assert(group('calendar').pairs.some(p=>p.en==='on Monday'&&p.ru==='в понедельник'));
assert(group('dates').pairs.some(p=>p.en==='the thirty-first of October'));
assert(group('prices').pairs.some(p=>p.en==='one pound and one penny'));
assert(group('contacts').pairs.some(p=>p.en==='alex@example.org'&&p.speak.includes('at')));
assert(group('time').pairs.find(p=>p.en==='seven a.m.').speak==='seven A M');
assert.equal(displayIPA('/həˈləʊ/'),'[həˈləʊ]');
assert.equal(displayIPA('[eɪ]'),'[eɪ]');
assert.equal(displayText('Звуки /p/, /s/ и /ə/.'),'Звуки [p], [s] и [ə].');
assert.equal(dayDescription(plan.days[0],data.groups).title,'Сначала — чтение и звуки');
assert(!dayDescription(plan.days[0],data.groups).topics.some(t=>t.includes(';')));
assert.equal(resolveView('day-1',data,plan,repetition).type,'day');
assert.equal(resolveView('read-start',data,plan,repetition).type,'rule');
assert.equal(resolveView('repeat-numbers',data,plan,repetition).type,'trainer');
assert.equal(resolveView('missing',data,plan,repetition).key,'days');

let ms=0,cancelCount=0,spoken=[];
class Utterance{constructor(text){this.text=text;}}
const synth={getVoices:()=>[uk,us,ru],speak:u=>spoken.push(u),cancel:()=>cancelCount++};
const make=()=>new SpeechPlayer({synth,Utterance,now:()=>ms,settings:()=>({rate:.75,repeat:1,voices:{}})});
const p=make();
assert(p.start([example],{mode:'en-ru'}));assert.equal(spoken.at(-1).lang,'en-US');assert.equal(spoken.at(-1).voice,us);assert.equal(spoken.at(-1).rate,.75);
const stale=spoken.at(-1);ms=2500;p.pause();const frozen=p.elapsed();ms=12000;assert.equal(p.elapsed(),frozen,'Pause counted as listening time');
const beforeNavigation=p.snapshot();
for(const view of ['day-1','read-start','vocabulary','repeat-numbers','days'])resolveView(view,data,plan,repetition);
assert.deepEqual(p.snapshot(),beforeNavigation,'Navigation changed the listening queue');
stale.onend();assert.equal(p.segmentIndex,0,'Cancelled callbacks advanced the queue');p.resume();assert.equal(spoken.at(-1).text,stale.text,'Resume must replay an unfinished phrase');
spoken.at(-1).onend();await new Promise(r=>setTimeout(r,470));assert.equal(spoken.at(-1).lang,'ru-RU');
spoken.at(-1).onend();await new Promise(r=>setTimeout(r,470));assert.equal(p.status,'ended');assert.equal(p.unitIndex,1,'Finite queue did not finish');
p.start([example],{mode:'en-ru'});spoken.at(-1).onerror({error:'network'});assert.equal(p.status,'error');assert.equal(p.unitIndex,0,'Audio failure silently skipped content');p.dispose();
const missing=new SpeechPlayer({synth,Utterance,voices:()=>[uk,ru]});assert.equal(missing.start([example]),false);assert.equal(missing.status,'error');missing.dispose();
assert(cancelCount>2);

for(const f of ['course.js','audio.js','trainers.js','curriculum.js','presentation.js','course.css','data.json'])await access('dist/public/courses/en-a1/'+f);
const html=await readFile('dist/public/a1-english.html','utf8');assert(html.includes('courses/en-a1/course.js'));assert(!html.includes('const LESSONS'),'Old course still embedded');
console.log(`PASS: ${pairs} paired texts, ${data.statistics.entries} word articles, complete day partitions, three language modes, exact accents, pause/resume, failure recovery and course bundle.`);
