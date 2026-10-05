import {SpeechPlayer,voiceFor,secondsFor} from './audio.js';
import {makeCurriculum,remainingSeconds} from './curriculum.js';
import {numberPair,ordinalWords,generatedPair,phonePair,spellingPair,timePair,pricePair,referencePairs} from './trainers.js';

const el=(tag,cls='',text='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;};
const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
const store={read(k,fallback){try{return JSON.parse(localStorage.getItem('syolana.en.a1.'+k))??fallback;}catch{return fallback;}},write(k,v){try{localStorage.setItem('syolana.en.a1.'+k,JSON.stringify(v));}catch{}}};
const post=data=>{if(window.parent!==window)window.parent.postMessage({syolanaLesson:true,...data},location.origin);};
const duration=s=>{const m=Math.round(s/60);return m<60?m+' мин':Math.floor(m/60)+' ч '+m%60+' мин';};
const clock=s=>{s=Math.floor(s);return Math.floor(s/3600)+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const field=(label,control)=>{const x=el('label','field',label);x.append(control);return x;};
const select=options=>{const x=el('select');for(const [value,text] of options){const o=el('option','',text);o.value=value;x.append(o);}return x;};
const normal=s=>s.toLowerCase().replace(/[’]/g,"'").replace(/[^\p{L}\p{N}' ]/gu,' ').replace(/\s+/g,' ').trim();

async function init(){
  const response=await fetch(new URL('./data.json?v=20261005-6',import.meta.url));
  if(!response.ok)throw new Error('Не удалось загрузить материал курса.');
  const data=await response.json();
  const saved=store.read('settings',{});
  const cfg={mode:['en','en-ru','ru-en'].includes(saved.mode)?saved.mode:'en',rate:Math.max(.55,Math.min(1.5,Number(saved.rate)||1)),repeat:[1,2,3].includes(saved.repeat)?saved.repeat:1,voices:saved.voices||{},loop:false};
  let curriculum=makeCurriculum(data,cfg), bulkLabel='Курс', currentNode=null, activePair=null;
  const learned=new Set(store.read('learned',[])), doneDays=new Set(store.read('days',[]));
  let voices=window.speechSynthesis?.getVoices()||[];
  let lastQueue=null, voiceControls={}, dayList, listeningSummary;
  const shell=el('div','shell'),app=document.getElementById('app');app.append(shell);

  function pairNode(p,{actions=true}={}){
    const card=el('div','pair');card.dataset.pair=p.id;card.dataset.lang=p.lang;
    const en=el('div','en',p.en);en.lang=p.lang;const ip=el('div','ipa',p.ipa);ip.setAttribute('aria-label','Транскрипция');
    const ru=el('div','ru',p.ru);ru.lang='ru';card.append(en,ip,ru);
    if(actions){const a=el('div','pair-actions');a.append(button(p.lang==='en-US'?'▶ Американский':'▶ Британский',()=>playClip(p,'en')),button('▶ С переводом',()=>playClip(p,cfg.mode==='ru-en'?'ru-en':'en-ru')));card.append(a);}
    return card;
  }
  function showCurrent(u,index,segment){
    if(activePair)activePair.classList.remove('active');
    activePair=document.querySelector('[data-pair="'+u.pair.id+'"]');activePair?.classList.add('active');
    currentNode.replaceChildren(pairNode(u.pair,{actions:false}));currentNode.hidden=false;
    currentNode.dataset.language=segment.lang;
  }
  const bulk=new SpeechPlayer({voices:()=>voices,settings:()=>cfg,onUnit:showCurrent,onChange:()=>updatePlayer(),onProgress:()=>{saveProgress();updatePlayer();}});
  const clip=new SpeechPlayer({voices:()=>voices,settings:()=>cfg,onUnit:showCurrent,onChange:()=>updatePlayer()});
  function playClip(p,mode){bulk.pause();clip.start([{pair:p}],{mode,repeat:1});post({audio:true});}
  function saveProgress(){if(!lastQueue)return;store.write('progress',{...bulk.snapshot(),version:data.version,label:bulkLabel,mode:bulk.mode,repeat:bulk.repeat});}
  function start(units,label){clip.stop(false);bulkLabel=label;lastQueue={version:data.version,ids:units.map(u=>u.pair.id),label};store.write('queue',lastQueue);post({audio:true});bulk.start(units,{mode:cfg.mode,loop:cfg.loop,repeat:cfg.repeat});saveProgress();}
  function resume(){clip.stop(false);post({audio:true});bulk.resume();updatePlayer();}

  const hero=el('header','hero'),heroText=el('div');heroText.append(el('div','eyebrow','SYOLANA · АНГЛИЙСКИЙ · A1'),el('h1','','От первых звуков —\nк повседневному общению.'),el('p','','Чтение, понятные правила, слова с примерами и практика в одном месте. Британский вариант — основа; американский разбираем и слушаем рядом.'));
  const stats=el('div','stats');for(const [n,label] of [[data.statistics.uniqueHeadwords,'разных слов'],[data.statistics.examples,'примеров в словаре'],[data.statistics.ruleSections,'разделов правил']]){const s=el('div');s.append(el('strong','',n.toLocaleString('ru-RU')),el('span','',label));stats.append(s);}heroText.append(stats);
  const intro=el('aside','hero-card');intro.append(el('strong','','Ваш темп. Каждый день.'),el('p','','Начните с правил чтения. Затем слушайте дневной блок и пробуйте говорить, читать и писать самостоятельно.'),el('p','muted','Все учебные фразы сопровождаются транскрипцией и переводом. Раскрывайте темы по мере изучения — весь материал остаётся на этой странице.'));
  hero.append(heroText,intro);shell.append(hero);
  const nav=el('nav','nav');nav.setAttribute('aria-label','Разделы курса');for(const [id,title] of [['days','По дням'],['reading','Чтение и звуки'],['grammar','Грамматика'],['vocabulary','Словарь'],['variants','Британия и США'],['trainers','Тренажёры'],['practice','Бытовые ситуации'],['coverage','Что входит в A1']]){const a=el('a','',title);a.href='#'+id;nav.append(a);}shell.append(nav);

  const toolbar=el('section','toolbar');toolbar.setAttribute('aria-label','Озвучка курса');
  const row=el('div','toolbar-row');
  const allButton=button('▶ Весь A1',()=>start(curriculum.all,'Весь A1'),'primary');
  const pauseButton=button('Пауза',()=>{bulk.pause();clip.pause();});
  const resumeButton=button('Продолжить',()=>{if(['paused','error'].includes(clip.status)&&clip.unitIndex<clip.units.length){post({audio:true});clip.resume();}else if(bulk.units.length)resume();});
  const stopButton=button('Стоп',()=>{bulk.stop();clip.stop(false);updatePlayer();});
  const previous=button('←',()=>{clip.stop(false);bulk.seek(Math.max(0,bulk.unitIndex-1));});previous.setAttribute('aria-label','Предыдущая фраза');
  const next=button('→',()=>{clip.stop(false);bulk.seek(bulk.unitIndex+1);});next.setAttribute('aria-label','Следующая фраза');
  const status=el('span','status','Выберите курс, день или отдельную фразу.');row.append(allButton,pauseButton,resumeButton,stopButton,previous,next,status);
  const progressRow=el('div','progress-row'),progress=el('progress'),counts=el('span'),timing=el('span');progress.max=1;progress.value=0;progress.setAttribute('aria-label','Прочитанная часть');progressRow.append(progress,counts,timing);
  currentNode=el('div','player-current');currentNode.hidden=true;
  const error=el('div','error');error.setAttribute('role','status');error.hidden=true;
  const settings=el('details');settings.append(el('summary','','Режим, скорость, повторы и голоса'));const settingsGrid=el('div','setting-grid');
  const mode=select([['en','Только английский'],['en-ru','Английский → русский'],['ru-en','Русский → английский']]);mode.value=cfg.mode;
  const rate=select([[.6,'0,6 × — очень медленно'],[.75,'0,75 × — медленно'],[.9,'0,9 ×'],[1,'1 × — обычно'],[1.15,'1,15 ×'],[1.3,'1,3 ×'],[1.5,'1,5 ×']]);rate.value=String(cfg.rate);if(!rate.value){cfg.rate=1;rate.value='1';}
  const repeat=select([[1,'Один раз'],[2,'Каждую пару дважды'],[3,'Каждую пару трижды']]);repeat.value=cfg.repeat;
  const change=()=>{bulk.pause();clip.stop(false);cfg.mode=mode.value;cfg.rate=+rate.value;cfg.repeat=+repeat.value;bulk.mode=cfg.mode;bulk.repeat=cfg.repeat;bulk.segmentIndex=0;store.write('settings',cfg);curriculum=makeCurriculum(data,cfg);renderDays();saveProgress();updatePlayer();};
  mode.addEventListener('change',change);rate.addEventListener('change',change);repeat.addEventListener('change',change);
  settingsGrid.append(field('Что слушать',mode),field('Скорость',rate),field('Повтор слова или фразы',repeat));
  for(const [lang,title] of [['en-GB','Британский голос'],['en-US','Американский голос'],['ru-RU','Русский голос']]){const s=el('select');s.setAttribute('aria-label',title);voiceControls[lang]=s;s.addEventListener('change',()=>{bulk.pause();clip.stop(false);cfg.voices[lang]=s.value;store.write('settings',cfg);});settingsGrid.append(field(title,s));}
  const loopLabel=el('label','inline-field'),loop=el('input');loop.type='checkbox';loopLabel.append(loop,document.createTextNode('Повторять выбранный курс или день целиком'));loop.addEventListener('change',()=>{cfg.loop=loop.checked;bulk.loop=cfg.loop;});
  settings.append(settingsGrid,loopLabel,button('Обновить голоса',refreshVoices),el('p','muted','Чистота произношения зависит от голосов устройства. Выберите отдельные британский, американский и русский голоса. При отсутствии нужного голоса курс покажет причину и сохранит место. Фонетические значки и служебная разметка не озвучиваются.'));
  toolbar.append(row,progressRow,error,settings,currentNode);shell.append(toolbar);
  function refreshVoices(){
    voices=window.speechSynthesis?.getVoices()||[];
    for(const [lang,s] of Object.entries(voiceControls)){
      const list=voices.filter(v=>v.lang.toLowerCase().replace('_','-')===lang.toLowerCase());s.replaceChildren();
      const auto=el('option','','Автоматически: голос этого варианта');auto.value='';s.append(auto);
      list.forEach((v,i)=>{const o=el('option','',`Голос ${i+1} · ${v.localService?'на устройстве':'через интернет'}`);o.value=v.voiceURI;s.append(o);});
      if(!list.length){auto.textContent='Нужный голос пока не найден';s.disabled=true;}else s.disabled=false;
      s.value=list.some(v=>v.voiceURI===cfg.voices[lang])?cfg.voices[lang]:'';
    }
  }
  function updatePlayer(){
    if(!status)return;
    const p=clip.status==='playing'||clip.status==='error'?clip:bulk, snap=p.snapshot();
    const labels={idle:'Готово к прослушиванию',playing:'Читается',paused:'Пауза',stopped:'Остановлено',ended:'Прочитано',error:'Нужна проверка голоса'};
    status.textContent=(p===bulk?bulkLabel:'Отдельная фраза')+' · '+(labels[snap.status]||'');
    progress.max=Math.max(1,snap.total);progress.value=Math.min(snap.unitIndex,snap.total);
    counts.textContent=snap.total?`Прочитано ${Math.min(snap.unitIndex,snap.total)} из ${snap.total} · осталось ${Math.max(0,snap.total-snap.unitIndex)}`:'';
    timing.textContent=snap.total?`Прошло ${clock(snap.elapsed)} · осталось ≈ ${duration(remainingSeconds(p,cfg.rate))}`:'';
    error.textContent=snap.error;error.hidden=!snap.error;
    pauseButton.disabled=p.status!=='playing';resumeButton.disabled=!(['paused','stopped','error'].includes(bulk.status)&&bulk.unitIndex<bulk.units.length)&&!(['paused','stopped','error'].includes(clip.status)&&clip.unitIndex<clip.units.length);
    previous.disabled=!bulk.units.length;next.disabled=!bulk.units.length||bulk.unitIndex>=bulk.units.length;
  }
  function section(id,title,text){const s=el('section','section');s.id=id;s.append(el('h2','',title));if(text)s.append(el('p','section-intro',text));shell.append(s);return s;}
  function lessonNode(s){const d=el('details','lesson');d.id=s.id;d.append(el('summary','',s.title));const body=el('div','lesson-body');for(const item of s.items){if(s.items.length>1)body.append(el('h3','',item.title));body.append(el('p','explanation',item.body));if(item.instruction){const i=el('div','instruction');i.append(el('div','instruction-label','Краткое правило по-английски — тоже входит в прослушивание'),pairNode(item.instruction));body.append(i);}const p=el('div','pairs');p.append(...item.pairs.map(x=>pairNode(x)));body.append(p);}const units=curriculum.all.filter(u=>u.section===s.id);body.append(button('▶ Слушать этот раздел',()=>start(units,s.title)));d.append(body);return d;}

  const days=section('days','Курс по дням','Около 30 минут английской речи в одном блоке: сначала правила, затем слова с четырьмя примерами. В двух языках блок длится дольше. Последний блок может быть короче; оценка меняется вместе со скоростью и повторами.');
  listeningSummary=el('p','card');dayList=el('div','block-list');days.append(listeningSummary,dayList);
  function renderDays(){
    if(!dayList)return;
    const bilingual=curriculum.all.reduce((s,u)=>s+secondsFor(u,cfg.rate,cfg.mode,cfg.repeat),0);
    listeningSummary.textContent=`Весь курс: примерно ${duration(curriculum.totalSeconds)} только английской речи; ${duration(bilingual)} в выбранном режиме. ${curriculum.days.length} дневных блоков. Расчёт при условных 145 словах в минуту; реальное время зависит от голоса и пауз.`;
    dayList.replaceChildren();
    for(const day of curriculum.days){
      const c=el('article','day-card'),title=el('div','day-number',`День ${day.number} · ≈ ${duration(day.seconds)}`);c.append(title);
      const r=day.rules.map(x=>x.section.title.replace(/^\d+\. /,'')).join('; ');
      c.append(el('p','',r?'Правила: '+r:'Повторите пройденные правила перед словарём.'),el('p','',`Словарных статей: ${day.words.length}. Дополнительных фраз: ${day.extras.length}.`));
      const a=el('div','actions');a.append(button('▶ Слушать день',()=>start(day.units,'День '+day.number),'primary'));
      const dayKey=cfg.rate+':'+cfg.repeat+':'+day.id;const mark=button(doneDays.has(dayKey)?'✓ Пройдено':'Отметить пройденным',()=>{doneDays.has(dayKey)?doneDays.delete(dayKey):doneDays.add(dayKey);store.write('days',[...doneDays]);mark.textContent=doneDays.has(dayKey)?'✓ Пройдено':'Отметить пройденным';});a.append(mark);c.append(a);
      const explore=button('Открыть материал дня',()=>{for(const r of day.rules)document.getElementById(r.section.id).open=true;if(day.words.length){searchInput.value='';renderVocabulary(day.words);document.getElementById('vocabulary').scrollIntoView({behavior:'smooth'});}else if(day.rules[0])document.getElementById(day.rules[0].section.id).scrollIntoView({behavior:'smooth'});});c.append(explore);dayList.append(c);
    }
  }

  const reading=section('reading','Сначала — чтение и звуки','Название буквы и звук в слове — разные вещи. Освойте алфавит, транскрипцию и частые сочетания; затем слушайте каждое слово целиком. Написание даёт подсказки, но исключения приходится запоминать.');
  reading.append(...data.rules.filter(x=>x.area==='reading').map(lessonNode));
  const alphabetDetails=el('details','lesson');alphabetDetails.append(el('summary','','Все 26 букв: название, транскрипция, озвучка'));const alphabet=el('div','alphabet');alphabet.append(...data.alphabet.map(p=>pairNode(p)));alphabetDetails.append(alphabet);reading.append(alphabetDetails);
  const soundDetails=el('details','lesson');soundDetails.append(el('summary','','44 звука: положение рта и слово-образец'));const soundList=el('div','sounds lesson-body');for(const sound of data.phonetics){const a=el('article','sound');a.append(el('div','symbol','/'+sound.symbol+'/'),el('div','badge',sound.type),el('p','',sound.mouth),pairNode(sound.example));soundList.append(a);}soundDetails.append(soundList);reading.append(soundDetails,el('p','muted','Здесь используется традиционная учебная модель южного британского произношения. В живой речи число различаемых гласных и их качество зависят от региона. Кнопка читает слово-образец: браузер не умеет надёжно произносить отдельный фонетический символ.'));
  const grammar=section('grammar','Грамматика, шаг за шагом','Сначала поймите смысл конструкции, затем произнесите примеры и измените их под себя. Краткое английское объяснение, русский разбор и примеры можно слушать отдельно.');grammar.append(...data.rules.filter(x=>x.area!=='reading').map(lessonNode));

  const vocabulary=section('vocabulary','Слова, формы и четыре примера','Артикль у исчисляемого существительного показан для значения «один из многих». Рядом — множественное число, неисчисляемость, формы глагола, степени сравнения и употребление с предлогами, когда это требуется. Одинаковые слова с разными значениями имеют отдельные статьи.');
  const searchBar=el('div','search'),searchInput=el('input');searchInput.type='search';searchInput.placeholder='Слово, перевод или фраза из примера';searchInput.setAttribute('aria-label','Поиск по всему словарю');
  const searchCount=el('span','muted'),vocabList=el('div'),learntLabel=el('span','muted');const onlyNew=button('Показать непройденные',()=>renderVocabulary(data.vocabulary.filter(w=>!learned.has(w.id))));
  searchBar.append(searchInput,button('Все слова',()=>{searchInput.value='';renderVocabulary(data.vocabulary);}),onlyNew);vocabulary.append(searchBar,searchCount,learntLabel,vocabList);
  const wordNodes=new Map();
  function wordNode(w){
    const d=el('details','word-entry');d.id=w.id;
    const sm=el('summary'),head=el('span','word-head'),en=el('span','en',w.head.en);en.lang='en-GB';head.append(en,el('span','ipa',w.head.ipa),el('span','ru',w.head.ru));sm.append(head,el('span','badge',w.level));d.append(sm);
    let rendered=false;d.addEventListener('toggle',()=>{if(!d.open||rendered)return;rendered=true;const b=el('div','word-body');b.append(el('p','note',w.note),pairNode(w.head));if(w.forms.length){b.append(el('h4','','Формы и устойчивые сочетания'));const f=el('div','forms');f.append(...w.forms.map(p=>pairNode(p)));b.append(f);}b.append(el('h4','','Четыре примера'));const ps=el('div','pairs');ps.append(...w.examples.map(p=>pairNode(p)));b.append(ps);const a=el('div','actions');a.append(button('▶ Слушать слово и примеры',()=>start(curriculum.all.filter(u=>u.owner===w.id),'Словарная статья')));const mark=button(learned.has(w.id)?'✓ Запомнил(а)':'Отметить: запомнил(а)',()=>{learned.has(w.id)?learned.delete(w.id):learned.add(w.id);store.write('learned',[...learned]);mark.textContent=learned.has(w.id)?'✓ Запомнил(а)':'Отметить: запомнил(а)';learntLabel.textContent=` · Отмечено ${learned.size} из ${data.vocabulary.length} статей`;});a.append(mark);b.append(a);d.append(b);});wordNodes.set(w.id,d);return d;
  }
  function renderVocabulary(words){
    vocabList.replaceChildren();wordNodes.clear();searchCount.textContent=`Найдено ${words.length} статей`;learntLabel.textContent=` · Отмечено ${learned.size} из ${data.vocabulary.length}`;
    if(!words.length){vocabList.append(el('p','empty','Совпадений нет. Попробуйте другое слово или русский перевод.'));return;}
    for(const g of data.groups){const subset=words.filter(w=>w.group===g.id);if(!subset.length)continue;const d=el('details','word-group');d.append(el('summary','',g.title+' · '+subset.length));let rendered=false;const b=el('div','group-body');d.append(b);const fill=()=>{if(rendered)return;rendered=true;b.append(...subset.map(wordNode));};d.addEventListener('toggle',()=>{if(d.open)fill();});if(words.length<80){fill();d.open=true;}vocabList.append(d);}
  }
  let searchTimer;searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const q=normal(searchInput.value);renderVocabulary(data.vocabulary.filter(w=>normal([w.word,w.ru,w.note,...w.forms.flatMap(p=>[p.en,p.ru]),...w.examples.flatMap(p=>[p.en,p.ru])].join(' ')).includes(q)));},180);});renderVocabulary(data.vocabulary);

  const variants=section('variants','Британский и американский рядом','В британской колонке — британская транскрипция; в американской — американская. Слушайте обе кнопки, чтобы слышать разницу. Таблица охватывает частые различия начального уровня: звуки, написание, повседневные слова и конструкции.');const vg=el('div','variant-grid');
  for(const v of data.variants){const c=el('article','variant-card');c.append(el('span','badge','Великобритания'),pairNode(v.uk),el('span','badge','США'),pairNode(v.us),el('p','',v.note));vg.append(c);}variants.append(vg,el('p','muted','Внутри обеих стран есть много акцентов. Эта таблица сравнивает учебные британский и общеамериканский варианты; разговорные сокращения полезны для понимания, а в нейтральной и официальной речи лучше выбирать полную форму.'));

  const trainers=section('trainers','Тренируйтесь на знакомых задачах','Генераторы показывают проверенную транскрипцию и перевод. Сначала произнесите ответ сами, затем слушайте образец. Для контактов используйте учебные данные.');const tg=el('div','trainer-grid');trainers.append(tg);
  function trainer(title,description,controls,generate){const c=el('article','card trainer');c.append(el('h3','',title),el('p','',description));const f=el('div','setting-grid');f.append(...controls);const out=el('div','output');const run=()=>{try{out.replaceChildren(pairNode(generate()));}catch(e){out.replaceChildren(el('p','error',e.message));}};c.append(f,button('Показать и прослушать образец',()=>{run();const card=out.querySelector('.pair');if(card){const p=generate();playClip(p,'en');}}),out);tg.append(c);run();return c;}
  const number=el('input');number.type='number';number.min='0';number.max='999999999';number.value='125';trainer('Числа','От нуля до миллионов. В британском чтении сотен перед десятками и единицами появляется союз.',[field('Число',number)],()=>numberPair(Number(number.value),data.phonemeDictionary));
  const ordinal=el('input');ordinal.type='number';ordinal.min='1';ordinal.max='1000000';ordinal.value='21';trainer('Порядковые числа','Используются для дат, этажей и порядка. В словосочетании артикль зависит от конструкции.',[field('Номер по порядку',ordinal)],()=>generatedPair(ordinalWords(Number(ordinal.value)),'порядковое числительное: '+ordinal.value,data.phonemeDictionary,'ordinal-practice'));
  const phone=el('input');phone.type='tel';phone.value='+44 7700 900123';trainer('Телефон','Читаем каждую цифру отдельно. Ноль здесь читается полным названием, чтобы его не путать с буквой.',[field('Учебный телефон',phone)],()=>phonePair(phone.value,data.phonemeDictionary));
  const spell=el('input');spell.value='alex@example.org';trainer('Буквы, почта и индекс','Диктуем буквы и называем нужные знаки: точку, дефис, подчёркивание и знак почты. Это смысловые знаки адреса.',[field('Учебный адрес или имя',spell)],()=>spellingPair(spell.value,data));
  const hour=el('input'),minute=el('input');hour.type=minute.type='number';hour.min=minute.min='0';hour.max='23';minute.max='59';hour.value='8';minute.value='45';trainer('Время','Учимся говорить «четверть», «половина», «после» и «без». Сравните с электронными часами.',[field('Часы',hour),field('Минуты',minute)],()=>timePair(+hour.value,+minute.value,data.phonemeDictionary));
  const pounds=el('input'),pence=el('input');pounds.type=pence.type='number';pounds.min=pence.min='0';pounds.max='9999';pence.max='99';pounds.value='3';pence.value='50';trainer('Цены','Сумма в фунтах и пенсах. Единственное и множественное число меняются вместе с количеством.',[field('Фунты',pounds),field('Пенсы',pence)],()=>pricePair(+pounds.value,+pence.value,data.phonemeDictionary));
  const monthWords=data.vocabulary.filter(w=>w.kind==='monthname'),dayWords=data.vocabulary.filter(w=>w.kind==='dayname');
  const date=el('input'),year=el('input');date.type=year.type='number';date.min='1';date.max='31';date.value='5';year.min='1900';year.max='2100';year.value='2026';const month=select(monthWords.map(w=>[w.word,w.ru]));month.value='October';
  trainer('Дата','Сначала порядковое число, затем месяц и год. Предлоги для дат, дней и месяцев разобраны в правилах времени.',[field('Число месяца',date),field('Месяц',month),field('Год',year)],()=>{
    const mi=monthWords.findIndex(w=>w.word===month.value),d=+date.value,y=+year.value;
    if(!Number.isInteger(y)||y<1900||y>2100)throw new Error('Год: от 1900 до 2100.');
    if(!Number.isInteger(d)||d<1||d>new Date(y,mi+1,0).getDate())throw new Error('В этом месяце нет такой даты.');
    const monthsRu=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
    return generatedPair('the '+ordinalWords(d)+' of '+month.value+', '+numberPair(y,data.phonemeDictionary).en,d+' '+monthsRu[mi]+' '+y+' года',data.phonemeDictionary,'date-practice');
  });
  const dictation=el('article','card trainer');dictation.append(el('h3','','Дни и месяцы на слух'),el('p','','Нажмите «Задание», слушайте слово, затем напишите его. Ответ можно открыть и сравнить без оценки уровня.'));let challenge=null;const answerInput=el('input');answerInput.autocomplete='off';answerInput.spellcheck=false;answerInput.setAttribute('aria-label','Ваш ответ по-английски');const answerOutput=el('div','output');dictation.append(button('Новое задание',()=>{const pool=[...monthWords,...dayWords];challenge=pool[Math.floor(Math.random()*pool.length)].head;answerInput.value='';answerOutput.replaceChildren();playClip(challenge,'en');}),field('Запишите услышанное слово',answerInput),button('Ещё раз',()=>{if(challenge)playClip(challenge,'en');}),button('Свериться',()=>{if(!challenge){answerOutput.textContent='Сначала выберите новое задание.';return;}answerOutput.replaceChildren(el('p','answer',normal(answerInput.value)===normal(challenge.en)?'Написание совпало с образцом.':'Сравните своё написание с образцом.'),pairNode(challenge));}),answerOutput);tg.append(dictation);
  const ref=el('details','lesson reference');ref.append(el('summary','','Числа, даты и контакты: весь опорный набор'));const rp=el('div','pairs lesson-body');rp.append(...referencePairs(data).map(p=>pairNode(p)));ref.append(rp);trainers.append(ref);
  const irregulars=el('details','lesson');irregulars.append(el('summary','','Неправильные глаголы: начальная, прошедшая форма и причастие'));const irbody=el('div','lesson-body');let irregularReady=false;irregulars.addEventListener('toggle',()=>{if(!irregulars.open||irregularReady)return;irregularReady=true;for(const w of data.vocabulary.filter(w=>w.kind==='verb'&&w.forms[2]?.en!==w.word+'ed'&&!w.forms[2]?.en.endsWith('ed'))){const c=el('div','card');c.append(pairNode(w.head));const f=el('div','forms');f.append(...w.forms.slice(2,4).map(p=>pairNode(p)));c.append(f);irbody.append(c);}});irregulars.append(irbody);trainers.append(irregulars);
  const verbTrainer=el('article','card trainer');verbTrainer.append(el('h3','','Вспомните прошедшую форму'),el('p','','Послушайте начальную форму, произнесите прошедшую и затем раскройте ответ.'));const verbPrompt=el('div'),verbAnswer=el('div');let chosenVerb;verbTrainer.append(button('Новый глагол',()=>{const vs=data.vocabulary.filter(w=>w.kind==='verb');chosenVerb=vs[Math.floor(Math.random()*vs.length)];verbPrompt.replaceChildren(pairNode(chosenVerb.head));verbAnswer.replaceChildren();playClip(chosenVerb.head,'en');}),verbPrompt,button('Показать формы',()=>{if(chosenVerb)verbAnswer.replaceChildren(...chosenVerb.forms.slice(2,4).map(p=>pairNode(p)));}),verbAnswer);trainers.append(verbTrainer);

  const practice=section('practice','Говорите, читайте и пишите','Это практика без экзамена. Составьте свой ответ, прочитайте его вслух и сравните с образцом. Можно повторять столько раз, сколько нужно. Заметки и рисунок сохраняются на этом устройстве.');
  for(const p of data.practice){const d=el('details','practice');d.id='practice-'+p.id;d.append(el('summary','',p.title));const b=el('div','practice-body');b.append(el('p','',p.task));const ps=el('div','pairs');ps.append(...p.pairs.map(x=>pairNode(x)));b.append(ps);const input=el('textarea');input.rows=3;input.placeholder='Ваш ответ или заметка';input.setAttribute('aria-label','Ваш ответ: '+p.title);input.value=store.read('note.'+p.id,'');input.addEventListener('input',()=>store.write('note.'+p.id,input.value));b.append(input);if(p.model){const model=el('details');model.append(el('summary','','Посмотреть образец ответа'),pairNode(p.model));b.append(model);}b.append(button('▶ Слушать фразы ситуации',()=>start(curriculum.all.filter(u=>p.pairs.some(x=>x.id===u.pair.id)||p.model?.id===u.pair.id),p.title)));d.append(b);practice.append(d);}
  const pad=el('details','lesson');pad.append(el('summary','','Рукописная практика: напишите слово или фразу'));const padBody=el('div','lesson-body');padBody.append(el('p','','Выберите короткую фразу из курса и перепишите её пальцем, стилусом или мышью.'));const canvas=el('canvas','writing-pad');canvas.width=1000;canvas.height=320;canvas.setAttribute('aria-label','Поле для рукописной практики');padBody.append(canvas);const context=canvas.getContext('2d');const strokes=store.read('drawing',[]);let stroke=null;const redraw=()=>{if(!context)return;context.clearRect(0,0,1000,320);context.lineWidth=3;context.lineCap='round';context.strokeStyle='#244f43';for(const s of strokes){context.beginPath();s.forEach(([x,y],i)=>i?context.lineTo(x,y):context.moveTo(x,y));context.stroke();}};redraw();canvas.addEventListener('pointerdown',e=>{e.preventDefault();canvas.setPointerCapture(e.pointerId);const r=canvas.getBoundingClientRect();stroke=[[(e.clientX-r.left)*1000/r.width,(e.clientY-r.top)*320/r.height]];strokes.push(stroke);});canvas.addEventListener('pointermove',e=>{if(!stroke)return;const r=canvas.getBoundingClientRect();stroke.push([(e.clientX-r.left)*1000/r.width,(e.clientY-r.top)*320/r.height]);redraw();});const finish=()=>{stroke=null;store.write('drawing',strokes);};canvas.addEventListener('pointerup',finish);canvas.addEventListener('pointercancel',finish);padBody.append(button('Убрать последний штрих',()=>{strokes.pop();redraw();store.write('drawing',strokes);}),button('Очистить поле',()=>{strokes.length=0;redraw();store.write('drawing',strokes);}));pad.append(padBody);practice.append(pad);

  const coverage=section('coverage','Что вы отрабатываете на A1','A1 описывает то, что человек умеет делать с языком. У CEFR нет единого обязательного списка из строго заданного числа английских слов. Поэтому здесь проверяем покрытие навыков и тем; часть полезного материала отмечена как расширение к A2.');const coverageGrid=el('div','coverage');
  for(const [title,text,ids] of [
    ['Чтение и произношение','Буквы, диктовка, ударение, гласные, согласные, сочетания, окончания, связная речь и частые исключения.',['reading']],
    ['Понимание на слух','Знакомые слова и короткие фразы; имена, числа, время, цены, контакты и медленная бытовая речь.',['trainers','practice']],
    ['Разговор с собеседником','Поздороваться, представиться, спросить и ответить, заказать, купить, попросить помощь или повторение.',['practice']],
    ['Рассказ о себе','Семья, жильё, город, работа, учёба, распорядок, предпочтения и простые планы.',['grammar','practice']],
    ['Чтение коротких текстов','Вывески, формы, меню, адреса, сообщения, описания и простые инструкции.',['practice']],
    ['Письмо','Заполнение личных данных, короткая записка, открытка, приглашение и вежливое сообщение.',['practice']],
    ['Грамматика','Предложение и вопросы; времена, артикли, местоимения, количество, предлоги, модальные конструкции и сравнение.',['grammar']],
    ['Повседневная лексика','Люди, дом, еда, одежда, здоровье, город, путешествия, природа, работа, досуг, числа и календарь.',['vocabulary','trainers']]
  ]){const c=el('article');c.append(el('strong','',title),el('p','',text));for(const id of ids){const a=el('a','',({reading:'Чтение',trainers:'Тренажёры',practice:'Практика',grammar:'Правила',vocabulary:'Слова'})[id]);a.href='#'+id;c.append(a,document.createTextNode(' '));}coverageGrid.append(c);}coverage.append(coverageGrid,el('p','muted','Отметка «пройдено» — ваша заметка, а не проверка уровня. Для закрепления произносите собственные фразы и возвращайтесь к материалу. Транскрипции предложений показывают учебное произношение: темп, интонация и слабые формы могут меняться в живой речи.'));
  const footer=el('footer','footer');footer.append(el('p','','Материал курса написан заново для Syolana. Ориентиры содержания:'));for(const s of data.sources){const p=el('p'),a=el('a','',s.title);a.href=s.url;a.target='_blank';a.rel='noopener';p.append(a);footer.append(p);}footer.append(el('p','','Версия курса: '+data.version+'. Прогресс сохраняется в браузере; на другом устройстве он будет отдельным.'));shell.append(footer);

  renderDays();refreshVoices();updatePlayer();
  const savedQueue=store.read('queue',null),savedProgress=store.read('progress',null);
  if(savedQueue?.version===data.version&&savedProgress?.version===data.version){const units=savedQueue.ids.map(id=>curriculum.map.get(id));if(units.length&&units.every(Boolean)&&savedProgress.unitIndex<units.length){bulk.units=units;bulkLabel=savedProgress.label||savedQueue.label;lastQueue=savedQueue;bulk.unitIndex=savedProgress.unitIndex;bulk.segmentIndex=savedProgress.segmentIndex||0;bulk.activeMs=(savedProgress.elapsed||0)*1000;bulk.mode=savedProgress.mode||cfg.mode;bulk.repeat=savedProgress.repeat||cfg.repeat;bulk.status='paused';updatePlayer();}}
  window.speechSynthesis?.addEventListener?.('voiceschanged',refreshVoices);
  const tick=setInterval(()=>{if(bulk.status==='playing'||clip.status==='playing')updatePlayer();},1000);
  window.addEventListener('pagehide',()=>{bulk.pause();clip.dispose();saveProgress();clearInterval(tick);});
  function anchor(id){const n=document.getElementById(id);if(n){if(n.tagName==='DETAILS')n.open=true;n.scrollIntoView({behavior:'smooth'});}}
  window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==location.origin||!e.data?.syolanaHost)return;const x=e.data;if(x.pauseAudio){bulk.pause();clip.stop(false);updatePlayer();}if(x.anchor)anchor(x.anchor);if(x.theme){const mapping={'body':'--course-font','accent':'--course-accent','panel-bg':'--course-card','panel-border':'--course-line','panel-text':'--course-ink','panel-muted':'--course-muted'};for(const [k,v] of Object.entries(x.theme)){if(mapping[k]&&String(v).trim())document.documentElement.style.setProperty(mapping[k],v);}const surface=String(x.theme.surface||'').trim();if(/^\d+(?:\s*,\s*\d+){2}$/.test(surface))document.documentElement.style.setProperty('--course-bg','rgb('+surface+')');else if(surface&&CSS.supports('color',surface))document.documentElement.style.setProperty('--course-bg',surface);document.documentElement.style.setProperty('--course-soft','color-mix(in srgb, var(--course-accent) 15%, var(--course-bg))');}});
  app.hidden=false;document.getElementById('loading').hidden=true;post({ready:true,height:document.documentElement.scrollHeight});if(location.hash)anchor(decodeURIComponent(location.hash.slice(1)));
}
init().catch(e=>{const loading=document.getElementById('loading');loading.replaceChildren(el('strong','','Курс пока не загрузился'),el('p','',e.message),button('Попробовать снова',()=>location.reload()));post({ready:true,height:450});});
