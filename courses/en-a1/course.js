import {SpeechPlayer,secondsFor} from './audio.js?v=20261006-4';
import {makeCurriculum,remainingSeconds} from './curriculum.js?v=20261006-4';
import {trainerGroups} from './trainers.js?v=20261006-4';
import {COURSE_VIEWS,displayIPA,displayText,topicTitle,dayDescription,resolveView,entriesLabel} from './presentation.js?v=20261006-4';

const el=(tag,cls='',text='')=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=displayText(text);return n;};
const button=(text,fn,cls='')=>{const b=el('button',cls,text);b.type='button';b.addEventListener('click',fn);return b;};
const storage={read(k,fallback){try{return JSON.parse(localStorage.getItem('syolana.en.a1.'+k))??fallback;}catch{return fallback;}},write(k,v){try{localStorage.setItem('syolana.en.a1.'+k,JSON.stringify(v));}catch{}}};
const post=data=>{if(window.parent!==window)window.parent.postMessage({syolanaLesson:true,...data},location.origin);};
const duration=s=>{const m=Math.round(s/60);return m<60?m+' мин':Math.floor(m/60)+' ч '+m%60+' мин';};
const clock=s=>{s=Math.floor(s);return Math.floor(s/3600)+':'+String(Math.floor(s%3600/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');};
const field=(label,control)=>{const x=el('label','field',label);x.append(control);return x;};
const select=options=>{const x=el('select');for(const [value,text] of options){const o=el('option','',text);o.value=value;x.append(o);}return x;};
const normal=s=>s.toLowerCase().replace(/[’]/g,"'").replace(/[^\p{L}\p{N}' ]/gu,' ').replace(/\s+/g,' ').trim();
document.documentElement.classList.toggle('embedded',window.parent!==window);
function applyTheme(theme){
  const mapping={heading:'--course-heading',body:'--course-font',accent:'--course-accent',dim:'--course-muted','panel-border':'--course-line','panel-text':'--course-ink','panel-muted':'--course-muted','button-radius':'--course-button-radius'};
  for(const [k,v] of Object.entries(theme))if(mapping[k]&&String(v).trim())document.documentElement.style.setProperty(mapping[k],v);
  const surface=String(theme.surface||'').trim();
  if(/^\d+(?:\s*,\s*\d+){2}$/.test(surface))document.documentElement.style.setProperty('--course-surface',surface);
}
window.addEventListener('message',e=>{if(e.source===window.parent&&e.origin===location.origin&&e.data?.syolanaHost&&e.data.theme)applyTheme(e.data.theme);});

async function init(){
  const response=await fetch(new URL('./data.json?v=20261006-4',import.meta.url));
  if(!response.ok)throw new Error('Не удалось загрузить материал курса.');
  const data=await response.json(), trainers=trainerGroups(data), saved=storage.read('settings',{});
  const cfg={mode:['en','en-ru','ru-en'].includes(saved.mode)?saved.mode:'en',rate:Math.max(.55,Math.min(1.5,Number(saved.rate)||1)),repeat:[1,2,3].includes(saved.repeat)?saved.repeat:1,voices:saved.voices||{},loop:false};
  let curriculum=makeCurriculum(data,cfg),bulkLabel='Курс',activePair=null,lastQueue=null,clipSelected=false;
  let voices=window.speechSynthesis?.getVoices()||[],voiceControls={},currentKey='',returnKey='days',pageOffset=0,overlay=null,overlayOffset=0;
  const learned=new Set(storage.read('learned',[]));
  const app=document.getElementById('app'),shell=el('div','shell');app.append(shell);
  const views=new Map(),scrollPositions=new Map();

  function pairNode(p,{actions=true}={}){
    const card=el('div','pair');card.dataset.pair=p.id;card.dataset.lang=p.lang;
    if(p.tag)card.append(el('span','pair-tag',p.tag));
    const content=el('div','pair-content'),en=el('div','en',p.en);en.lang=p.lang;
    const ip=el('div','ipa',displayIPA(p.ipa));ip.setAttribute('aria-label',p.ipaLabel||'Транскрипция');
    const ru=el('div','ru',p.ru);ru.lang='ru';content.append(en,ip,ru);card.append(content);
    if(actions){const a=el('div','pair-actions');a.append(button(p.lang==='en-US'?'▶ США':'▶ Британия',()=>playClip(p,'en'),'listen-small'),button('С переводом',()=>playClip(p,cfg.mode==='ru-en'?'ru-en':'en-ru'),'listen-small'));card.append(a);}
    return card;
  }
  const header=el('header','course-header'),home=button('Английский A1',()=>go('days'),'course-brand');
  const breadcrumb=el('span','breadcrumb','Курс по дням'),headerActions=el('div','header-actions');
  const backButton=button('← К дням',()=>go(returnKey),'back-button');backButton.hidden=true;
  const tocButton=button('☰ Оглавление',()=>setTOC(toc.hidden));tocButton.setAttribute('aria-expanded','false');tocButton.setAttribute('aria-controls','course-toc');
  headerActions.append(tocButton);const trail=el('div','course-trail');trail.append(backButton);header.append(home,breadcrumb,headerActions,trail);
  const workspace=el('div','workspace'),scroll=el('main','course-scroll');scroll.id='course-content';
  const stage=el('div','stage');scroll.append(stage);workspace.append(scroll);
  const toc=el('aside','toc');toc.id='course-toc';toc.hidden=true;toc.setAttribute('aria-label','Оглавление курса');
  const tocHead=el('div','drawer-heading');tocHead.append(el('h2','','Оглавление'),button('Закрыть',()=>setTOC(false),'quiet'));toc.append(tocHead);
  const tocNav=el('nav','toc-nav');tocNav.setAttribute('aria-label','Разделы курса');
  for(const [id,title] of COURSE_VIEWS)tocNav.append(button(title,()=>go(id),'toc-link'));
  toc.append(tocNav);const tocDays=el('details','toc-days');tocDays.append(el('summary','','Выбрать день'));const tocDayList=el('div','toc-nav');tocDays.append(tocDayList);toc.append(tocDays);workspace.append(toc);
  const dock=el('footer','audio-dock'),audioPill=button('',()=>setPlayer(playerPanel.hidden),'audio-pill');
  audioPill.setAttribute('aria-expanded','false');audioPill.setAttribute('aria-controls','course-player');
  audioPill.append(el('span','audio-icon','♫'));const pillCopy=el('span','pill-copy'),pillLabel=el('strong','','Озвучка курса'),pillStatus=el('small','','Режим, скорость и голоса');pillCopy.append(pillLabel,pillStatus);audioPill.append(pillCopy,el('span','pill-arrow','⌃'));
  const miniProgress=el('progress','mini-progress');miniProgress.max=1;miniProgress.value=0;miniProgress.setAttribute('aria-label','Прогресс прослушивания');audioPill.append(miniProgress);dock.append(audioPill);
  shell.append(header,workspace,dock);

  const playerPanel=el('section','player-panel');playerPanel.id='course-player';playerPanel.hidden=true;playerPanel.setAttribute('aria-label','Озвучка курса');
  const playerHeading=el('div','drawer-heading');playerHeading.append(el('h2','','Слушайте в своём темпе'),button('Свернуть',()=>setPlayer(false),'quiet'));
  const row=el('div','toolbar-row'),allButton=button('▶ Весь A1',()=>start(curriculum.all,'Весь A1'),'primary');
  const toggleButton=button('Продолжить',()=>{
    const p=selectedPlayer();
    if(p.status==='playing'){p.pause();saveProgress();}
    else if(['paused','stopped','error'].includes(p.status)&&p.unitIndex<p.units.length){post({audio:true});p.resume();}
    else start(curriculum.all,'Весь A1');
    updatePlayer();
  });
  const previous=button('←',()=>{clip.stop(false);clipSelected=false;bulk.seek(Math.max(0,bulk.unitIndex-1));});previous.setAttribute('aria-label','Предыдущая фраза');
  const next=button('→',()=>{clip.stop(false);clipSelected=false;bulk.seek(bulk.unitIndex+1);});next.setAttribute('aria-label','Следующая фраза');
  row.append(allButton,toggleButton,previous,next);
  const status=el('p','status','Выберите курс, день или отдельную фразу.');
  const progressRow=el('div','progress-row'),progress=el('progress'),counts=el('span'),timing=el('span');progress.max=1;progress.value=0;progress.setAttribute('aria-label','Прочитанная часть');progressRow.append(progress,counts,timing);
  const error=el('div','error');error.setAttribute('role','status');error.hidden=true;
  const settings=el('details','audio-settings');settings.append(el('summary','','Режим, скорость, повторы и голоса'));const settingsGrid=el('div','setting-grid');
  const mode=select([['en','Только английский'],['en-ru','Английский → русский'],['ru-en','Русский → английский']]);mode.value=cfg.mode;
  const rate=select([[.6,'0,6 × — очень медленно'],[.75,'0,75 × — медленно'],[.9,'0,9 ×'],[1,'1 × — обычно'],[1.15,'1,15 ×'],[1.3,'1,3 ×'],[1.5,'1,5 ×']]);rate.value=String(cfg.rate);if(!rate.value){cfg.rate=1;rate.value='1';}
  const repeat=select([[1,'Один раз'],[2,'Каждую пару дважды'],[3,'Каждую пару трижды']]);repeat.value=cfg.repeat;
  const change=()=>{
    bulk.pause();clip.stop(false);clipSelected=false;
    cfg.mode=mode.value;cfg.rate=+rate.value;cfg.repeat=+repeat.value;bulk.mode=cfg.mode;bulk.repeat=cfg.repeat;bulk.segmentIndex=0;
    storage.write('settings',cfg);curriculum=makeCurriculum(data,cfg);renderDays();
    for(const [key,node] of views)if(key.startsWith('day-')){node.remove();views.delete(key);scrollPositions.delete(key);}
    if(currentKey.startsWith('day-')){const key=currentKey;currentKey='';show(key);}
    saveProgress();updatePlayer();
  };
  mode.addEventListener('change',change);rate.addEventListener('change',change);repeat.addEventListener('change',change);
  settingsGrid.append(field('Что слушать',mode),field('Скорость',rate),field('Повтор слова или фразы',repeat));
  for(const [lang,title] of [['en-GB','Британский голос'],['en-US','Американский голос'],['ru-RU','Русский голос']]){
    const s=el('select');s.setAttribute('aria-label',title);voiceControls[lang]=s;
    s.addEventListener('change',()=>{bulk.pause();clip.stop(false);clipSelected=false;cfg.voices[lang]=s.value;storage.write('settings',cfg);updatePlayer();});settingsGrid.append(field(title,s));
  }
  const loopLabel=el('label','inline-field'),loop=el('input');loop.type='checkbox';loopLabel.append(loop,document.createTextNode('Повторять выбранный курс или день целиком'));loop.addEventListener('change',()=>{cfg.loop=loop.checked;bulk.loop=cfg.loop;});
  const settingsActions=el('div','actions');settingsActions.append(button('Обновить голоса',refreshVoices));
  settings.append(settingsGrid,loopLabel,settingsActions,el('p','muted','Выберите отдельные британский, американский и русский голоса. Если нужного голоса нет, место сохранится. Качество звучания зависит от голосов устройства; транскрипция и служебные значки не читаются.'));
  const currentNode=el('div','player-current');currentNode.hidden=true;
  playerPanel.append(playerHeading,row,status,progressRow,error,settings,currentNode);workspace.append(playerPanel);
  function pageScroll(y){requestAnimationFrame(()=>{if(window.parent!==window)post({height:Math.ceil(shell.getBoundingClientRect().height),scroll:y});else window.scrollTo({top:y,behavior:'instant'});});}
  function setOverlay(name,restore=true){
    if(name===overlay)return;
    if(name&&!overlay)overlayOffset=window.parent!==window?pageOffset:window.scrollY;
    const wasOpen=!!overlay;overlay=name;stage.hidden=!!name;toc.hidden=name!=='toc';playerPanel.hidden=name!=='player';
    audioPill.setAttribute('aria-expanded',String(name==='player'));tocButton.setAttribute('aria-expanded',String(name==='toc'));
    post({courseOverlay:name});
    if(name)pageScroll(0);else if(wasOpen&&restore)pageScroll(overlayOffset);
  }
  function setPlayer(open){if(open)setOverlay('player');else if(overlay==='player')setOverlay(null);}
  function setTOC(open){if(open)setOverlay('toc');else if(overlay==='toc')setOverlay(null);}
  function selectedPlayer(){if(clipSelected&&clip.status==='ended')clipSelected=false;return clipSelected?clip:bulk;}
  function showCurrent(u,index,segment){
    activePair?.classList.remove('active');activePair=views.get(currentKey)?.querySelector('[data-pair="'+u.pair.id+'"]');activePair?.classList.add('active');
    currentNode.replaceChildren(pairNode(u.pair,{actions:false}));currentNode.hidden=false;currentNode.dataset.language=segment.lang;
  }
  const bulk=new SpeechPlayer({voices:()=>voices,settings:()=>cfg,onUnit:showCurrent,onChange:updatePlayer,onProgress:()=>{saveProgress();updatePlayer();}});
  const clip=new SpeechPlayer({voices:()=>voices,settings:()=>cfg,onUnit:showCurrent,onChange:updatePlayer});
  function playClip(p,mode){bulk.pause();clipSelected=true;post({audio:true});clip.start([{pair:p}],{mode,repeat:1});}
  function saveProgress(){if(lastQueue)storage.write('progress',{...bulk.snapshot(),version:data.version,label:bulkLabel,mode:bulk.mode,repeat:bulk.repeat});}
  function start(units,label){clip.stop(false);clipSelected=false;bulkLabel=label;lastQueue={version:data.version,ids:units.map(u=>u.pair.id),label};storage.write('queue',lastQueue);post({audio:true});bulk.start(units,{mode:cfg.mode,loop:cfg.loop,repeat:cfg.repeat});saveProgress();}
  function refreshVoices(){
    voices=window.speechSynthesis?.getVoices()||[];
    for(const [lang,s] of Object.entries(voiceControls)){
      const list=voices.filter(v=>v.lang.toLowerCase().replace('_','-')===lang.toLowerCase());s.replaceChildren();
      const auto=el('option','','Автоматически: голос этого варианта');auto.value='';s.append(auto);
      list.forEach((v,i)=>{const o=el('option','',`Голос ${i+1} · ${v.localService?'на устройстве':'через интернет'}`);o.value=v.voiceURI;s.append(o);});
      auto.textContent=list.length?'Автоматически: голос этого варианта':'Нужный голос пока не найден';s.disabled=!list.length;
      s.value=list.some(v=>v.voiceURI===cfg.voices[lang])?cfg.voices[lang]:'';
    }
  }
  function updatePlayer(){
    const p=selectedPlayer(),snap=p.snapshot(),labels={idle:'Готово к прослушиванию',playing:'Читается',paused:'Пауза',stopped:'Пауза',ended:'Прочитано',error:'Проверьте голос'};
    const label=p===bulk?bulkLabel:'Отдельная фраза';status.textContent=label+' · '+(labels[snap.status]||'');
    progress.max=miniProgress.max=Math.max(1,snap.total);progress.value=miniProgress.value=Math.min(snap.unitIndex,snap.total);
    counts.textContent=snap.total?`Прочитано ${Math.min(snap.unitIndex,snap.total)} из ${snap.total} · осталось ${Math.max(0,snap.total-snap.unitIndex)}`:'';
    timing.textContent=snap.total?`Прошло ${clock(snap.elapsed)} · осталось ≈ ${duration(remainingSeconds(p,cfg.rate))}`:'';
    pillLabel.textContent=snap.total?label:'Озвучка курса';pillStatus.textContent=snap.total?(labels[snap.status]||'')+' · '+Math.min(snap.unitIndex,snap.total)+' / '+snap.total:'Режим, скорость и голоса';
    audioPill.setAttribute('aria-label',pillLabel.textContent+'. '+pillStatus.textContent+'. Открыть панель озвучки');
    post({courseAudio:{label:pillLabel.textContent,status:pillStatus.textContent,index:Math.min(snap.unitIndex,snap.total),total:snap.total}});
    error.textContent=snap.error;error.hidden=!snap.error;
    toggleButton.textContent=p.status==='playing'?'Ⅱ Пауза':p.units.length&&p.unitIndex<p.units.length?'▶ Продолжить':'▶ Начать';
    previous.disabled=!bulk.units.length;next.disabled=!bulk.units.length||bulk.unitIndex>=bulk.units.length;
    if(snap.error)setPlayer(true);
  }

  function screen(id,title,text,eyebrow='АНГЛИЙСКИЙ · A1'){
    const s=el('section','view');s.dataset.view=id;s.hidden=true;const head=el('header','view-heading');head.append(el('p','eyebrow',eyebrow));
    const h=el('h1','',title);h.tabIndex=-1;head.append(h);if(text)head.append(el('p','view-intro',text));s.append(head);views.set(id,s);stage.append(s);return s;
  }
  function go(key){if(currentKey===key){setOverlay(null);return;}location.hash=key;show(key);}
  function show(raw){
    const view=resolveView(raw,data,curriculum,trainers),key=view.key;
    if(currentKey&&currentKey!==key)scrollPositions.set(currentKey,overlay?overlayOffset:(window.parent!==window?pageOffset:window.scrollY));
    if(!views.has(key))createDetail(view);
    for(const [id,node] of views)node.hidden=id!==key;
    const changed=currentKey!==key;currentKey=key;storage.write('view',key);shell.dataset.view=key;
    const parent=['day','rule','trainer','word'].includes(view.type);
    returnKey=view.type==='day'?'days':view.type==='rule'?(view.rule.area==='reading'?'reading':'grammar'):view.type==='trainer'?'trainers':view.type==='word'?'vocabulary':'days';
    backButton.hidden=key==='days';backButton.textContent='← '+(COURSE_VIEWS.find(([id])=>id===returnKey)?.[1]||'К дням');
    breadcrumb.textContent=parent?(view.type==='day'?'День '+view.day.number:view.type==='rule'?topicTitle(view.rule):view.type==='trainer'?view.trainer.title:view.word.head.ru):COURSE_VIEWS.find(([id])=>id===key)?.[1]||'';
    for(const b of tocNav.querySelectorAll('button'))b.setAttribute('aria-current',String(b.textContent===COURSE_VIEWS.find(([id])=>id===(parent?returnKey:key))?.[1]));
    setOverlay(null,false);if(changed){pageScroll(scrollPositions.get(key)||0);views.get(key)?.querySelector('h1')?.focus({preventScroll:true});}
  }
  window.addEventListener('hashchange',()=>show(decodeURIComponent(location.hash.slice(1))));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){setPlayer(false);setTOC(false);}});

  function ruleBody(s){
    const body=el('div','lesson-body');
    for(const item of s.items){
      if(s.items.length>1)body.append(el('h2','',item.title));body.append(el('p','explanation',item.body));
      if(item.instruction){const i=el('div','instruction');i.append(el('span','instruction-label','Краткое правило — по-английски'),pairNode(item.instruction));body.append(i);}
      const pairs=el('div','pairs');pairs.append(...item.pairs.map(p=>pairNode(p)));body.append(pairs);
    }
    if(s.id==='read-alphabet'){const a=el('div','alphabet');a.append(...data.alphabet.map(p=>pairNode(p)));body.append(el('h2','','Все 26 букв по порядку'),a);}
    if(['read-vowels','read-consonants'].includes(s.id)){
      const sounds=el('div','sounds');
      for(const sound of data.phonetics.filter(p=>s.id==='read-consonants'?p.type==='Согласный':p.type!=='Согласный')){
        const a=el('article','sound');a.append(el('span','symbol',displayIPA(sound.symbol)),el('span','badge',sound.type),el('p','',sound.mouth),pairNode(sound.example));sounds.append(a);
      }body.append(el('h2','','Звуки: как поставить рот и что произнести'),sounds);
    }
    const actions=el('div','actions');actions.append(button('▶ Слушать эту тему',()=>start(curriculum.all.filter(u=>u.section===s.id),topicTitle(s))));body.append(actions);return body;
  }
  function ruleDisclosure(s,open=false){const d=el('details','lesson');d.append(el('summary','',topicTitle(s)));let ready=false;
    const fill=()=>{if(!ready){ready=true;d.append(ruleBody(s));}};d.addEventListener('toggle',()=>{if(d.open)fill();});if(open){fill();d.open=true;}return d;}
  function topicIndex(view,sections){
    const list=el('div','topic-list');sections.forEach((s,i)=>{const b=button('',()=>go(s.id),'topic-link');const n=el('span','topic-number',String(i+1).padStart(2,'0')),copy=el('span','topic-copy');copy.append(el('strong','',topicTitle(s)));const day=curriculum.days.find(d=>d.rules.some(r=>r.section.id===s.id));const dayLabel=el('small','',day?'Входит в день '+day.number:'Правило курса');dayLabel.dataset.topicDay=s.id;copy.append(dayLabel);b.append(n,copy,el('span','topic-arrow','→'));list.append(b);});view.append(list);
  }

  const days=screen('days','Английский с первого звука','Начните с дня 1 или выберите тему в оглавлении. В каждом дне сначала идут правила, затем — слова с примерами. Слушать можно весь курс, один день или отдельную фразу.');
  const introActions=el('div','actions welcome-actions');introActions.append(button('Начать с дня 1 →',()=>go('day-1'),'primary'),button('▶ Слушать весь A1',()=>start(curriculum.all,'Весь A1')));days.append(introActions);
  const stats=el('div','stats');for(const [n,label] of [[data.statistics.uniqueHeadwords,'разных слов'],[data.statistics.examples,'примеров'],[data.statistics.ruleSections,'тем правил']]){const s=el('div');s.append(el('strong','',n.toLocaleString('ru-RU')),el('span','',label));stats.append(s);}days.append(stats);
  const listeningSummary=el('p','listening-summary'),dayList=el('div','day-list');days.append(listeningSummary,dayList);
  function renderDays(){
    const bilingual=curriculum.all.reduce((sum,u)=>sum+secondsFor(u,cfg.rate,cfg.mode,cfg.repeat),0);
    listeningSummary.textContent=`${curriculum.days.length} дневных блоков · весь английский ≈ ${duration(curriculum.totalSeconds)}${cfg.mode!=="en"?" · с переводом ≈ "+duration(bilingual):""}. В блоке — около 30 минут английской речи. Оценка учитывает скорость и повторы; реальное время зависит от голоса.`;
    dayList.replaceChildren();tocDayList.replaceChildren();
    for(const label of stage.querySelectorAll('[data-topic-day]')){const day=curriculum.days.find(d=>d.rules.some(r=>r.section.id===label.dataset.topicDay));label.textContent=day?'Входит в день '+day.number:'Правило курса';}
    for(const day of curriculum.days){
      const info=dayDescription(day,data.groups),c=el('article','day-card');c.append(el('div','day-meta','День '+day.number+' · ≈ '+duration(day.seconds)),el('h2','',info.title));
      const topics=el('ul','day-topics');for(const title of info.topics)topics.append(el('li','',title));if(!info.topics.length)topics.append(el('li','','Повторение знакомых правил в новых словах и фразах'));c.append(topics);
      if(info.vocabulary.length){c.append(el('span','card-label','Затем — слова с четырьмя примерами'));const chips=el('div','topic-chips');info.vocabulary.forEach(t=>chips.append(el('span','',t)));c.append(chips);}
      if(info.extras.length)c.append(el('p','day-extra','В конце — '+info.extras.join(' и ')+'.'));
      c.append(el('p','day-count',entriesLabel(day.words.length)));
      const actions=el('div','actions');actions.append(button('Открыть день →',()=>go(day.id),'primary'),button('▶ Слушать',()=>start(day.units,'День '+day.number)));c.append(actions);dayList.append(c);
      tocDayList.append(button('День '+day.number+' · '+info.title,()=>go(day.id),'toc-link'));
    }
  }
  const reading=screen('reading','Сначала — чтение и звуки','Буква и звук — разные вещи. Идите от алфавита к сочетаниям и окончаниям, слушайте примеры и произносите их вслух.');topicIndex(reading,data.rules.filter(s=>s.area==='reading'));
  const grammar=screen('grammar','Правила, которые превращаются в речь','Понятный русский разбор, короткое английское правило и примеры. Открывайте одну тему и возвращайтесь к оглавлению в любой момент.');topicIndex(grammar,data.rules.filter(s=>s.area!=='reading'));

  const vocabulary=screen('vocabulary','Слова, формы и четыре примера','У существительных показаны артикли и формы множественного числа. У глаголов — формы и сочетания, у прилагательных — степени сравнения. Раскрывайте нужное слово, чтобы увидеть четыре примера.');
  const searchBar=el('div','search'),searchInput=el('input');searchInput.type='search';searchInput.placeholder='Слово, перевод или фраза';searchInput.setAttribute('aria-label','Поиск по всему словарю');
  const searchCount=el('span','muted'),learnedLabel=el('span','muted'),vocabList=el('div','vocabulary-list');
  searchBar.append(searchInput,button('Все слова',()=>{searchInput.value='';renderVocabulary(data.vocabulary);}),button('Ещё не запомнил(а)',()=>renderVocabulary(data.vocabulary.filter(w=>!learned.has(w.id)))));
  const searchSummary=el('p','search-summary');searchSummary.append(searchCount,learnedLabel);vocabulary.append(searchBar,searchSummary,vocabList);
  function wordNode(w,{open=false}={}){
    const d=el('details','word-entry');d.dataset.word=w.id;const summary=el('summary'),head=el('span','word-head'),en=el('span','en',w.head.en);en.lang='en-GB';
    head.append(en,el('span','ipa',displayIPA(w.head.ipa)),el('span','ru',w.head.ru));summary.append(head,el('span','badge',w.level));d.append(summary);let rendered=false;
    const fill=()=>{if(rendered)return;rendered=true;const body=el('div','word-body');body.append(el('p','note',w.note),pairNode(w.head));
      if(w.forms.length){body.append(el('h3','','Формы и устойчивые сочетания'));const f=el('div','forms');f.append(...w.forms.map(p=>pairNode(p)));body.append(f);}
      body.append(el('h3','','Четыре разных примера'));const pairs=el('div','pairs');pairs.append(...w.examples.map(p=>pairNode(p)));body.append(pairs);
      const actions=el('div','actions');actions.append(button('▶ Слушать слово и примеры',()=>start(curriculum.all.filter(u=>u.owner===w.id),'Словарная статья')));
      const mark=button(learned.has(w.id)?'✓ Запомнил(а)':'Запомнил(а)',()=>{learned.has(w.id)?learned.delete(w.id):learned.add(w.id);storage.write('learned',[...learned]);mark.textContent=learned.has(w.id)?'✓ Запомнил(а)':'Запомнил(а)';learnedLabel.textContent=' · Запомнил(а) '+learned.size;});actions.append(mark);body.append(actions);d.append(body);
    };d.addEventListener('toggle',()=>{if(d.open)fill();});if(open){fill();d.open=true;}return d;
  }
  function renderVocabulary(words){
    vocabList.replaceChildren();searchCount.textContent=entriesLabel(words.length);learnedLabel.textContent=' · Запомнил(а) '+learned.size;
    if(!words.length){vocabList.append(el('p','empty','Совпадений нет. Попробуйте другое слово или русский перевод.'));return;}
    for(const group of data.groups){const subset=words.filter(w=>w.group===group.id);if(!subset.length)continue;
      const details=el('details','word-group');details.append(el('summary','',group.title+' · '+subset.length));let ready=false;const body=el('div','group-body');details.append(body);const fill=()=>{if(!ready){ready=true;body.append(...subset.map(w=>wordNode(w)));}};
      details.addEventListener('toggle',()=>{if(details.open)fill();});if(words.length<80){fill();details.open=true;}vocabList.append(details);
    }
  }
  let searchTimer;searchInput.addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{const q=normal(searchInput.value);renderVocabulary(data.vocabulary.filter(w=>normal([w.word,w.ru,w.note,...w.forms.flatMap(p=>[p.en,p.ru]),...w.examples.flatMap(p=>[p.en,p.ru])].join(' ')).includes(q)));},180);});renderVocabulary(data.vocabulary);

  const variants=screen('variants','Британский и американский рядом','Сравнивайте написание, слова и произношение. У каждого варианта своя транскрипция и свой голос.');
  const variantList=el('div','variant-grid');for(const v of data.variants){const c=el('article','variant-card');c.append(el('span','card-label','Великобритания'),pairNode(v.uk),el('span','card-label','США'),pairNode(v.us),el('p','',v.note));variantList.append(c);}variants.append(variantList,el('p','muted','Внутри каждой страны есть разные акценты. Здесь сравниваются учебный британский и общеамериканский варианты.'));
  const repetition=screen('trainers','Повторение до автоматизма','Готовые списки без ввода ответов. Читайте по порядку, повторяйте вслух, слушайте весь список или отдельную запись.');
  const trainerList=el('div','trainer-list');for(const group of trainers){const c=el('article','trainer-card');c.append(el('h2','',group.title),el('p','',group.description));const actions=el('div','actions');actions.append(button('Открыть список →',()=>go('repeat-'+group.id),'primary'),button('▶ Слушать список',()=>start(unitsFor(group.pairs),group.title)));c.append(actions);trainerList.append(c);}repetition.append(trainerList);
  function unitsFor(pairs){return pairs.map(p=>curriculum.map.get(p.id)||{pair:p});}

  function createDetail(view){
    if(view.type==='rule'){
      const s=view.rule,node=screen(view.key,topicTitle(s),'',s.area==='reading'?'ЧТЕНИЕ И ЗВУКИ':'ПРАВИЛА И КОНСТРУКЦИИ');node.append(ruleBody(s));
      const sequence=data.rules.filter(r=>(r.area==='reading')===(s.area==='reading')),i=sequence.indexOf(s),actions=el('nav','page-turns');actions.setAttribute('aria-label','Переход между темами');
      if(i>0)actions.append(button('← '+topicTitle(sequence[i-1]),()=>go(sequence[i-1].id)));if(i<sequence.length-1)actions.append(button(topicTitle(sequence[i+1])+' →',()=>go(sequence[i+1].id)));node.append(actions);
    }else if(view.type==='day'){
      const day=view.day,info=dayDescription(day,data.groups),node=screen(view.key,info.title,'Сначала разберите темы ниже. Затем переходите к словам и их примерам. Озвучка читает материал в том же порядке.','ДЕНЬ '+day.number+' · ≈ '+duration(day.seconds)+' АНГЛИЙСКОЙ РЕЧИ');
      const actions=el('div','actions');actions.append(button('▶ Слушать день '+day.number,()=>start(day.units,'День '+day.number),'primary'));node.append(actions);
      const outline=el('details','day-outline');outline.append(el('summary','','Что входит в этот день'));const contents=el('ul');info.topics.forEach(t=>contents.append(el('li','',t)));info.vocabulary.forEach(t=>contents.append(el('li','','Слова: '+t)));outline.append(contents);node.append(outline);
      if(day.rules.length){node.append(el('h2','section-label',day.number===1?'Правила чтения':'Сначала — правила и повторение'));
        day.rules.forEach((r,i)=>{if(r.section.area==='repetition'){const d=el('details','lesson');d.append(el('summary','',r.section.title));const body=el('div','lesson-body pairs');body.append(...r.units.map(u=>pairNode(u.pair)));d.append(body);node.append(d);}else node.append(ruleDisclosure(r.section,i===0));});
      }
      if(day.words.length){node.append(el('h2','section-label','Затем — слова и четыре примера'));for(const gid of [...new Set(day.words.map(w=>w.group))]){const words=day.words.filter(w=>w.group===gid),group=el('details','word-group');group.append(el('summary','',(data.groups.find(g=>g.id===gid)?.title||'Слова')+' · '+words.length));let ready=false;group.addEventListener('toggle',()=>{if(group.open&&!ready){ready=true;const body=el('div','group-body');body.append(...words.map(w=>wordNode(w)));group.append(body);}});node.append(group);}}
      if(day.extras.length){node.append(el('h2','section-label','В конце — сравнение вариантов и бытовые фразы'));const extras=el('div','pairs');extras.append(...day.extras.map(u=>pairNode(u.pair)));node.append(extras);}
      const turns=el('nav','page-turns');turns.setAttribute('aria-label','Переход между днями');if(day.number>1)turns.append(button('← День '+(day.number-1),()=>go('day-'+(day.number-1))));turns.append(button('Ко всем дням',()=>go('days')));if(day.number<curriculum.days.length)turns.append(button('День '+(day.number+1)+' →',()=>go('day-'+(day.number+1))));node.append(turns);if(day.number===curriculum.days.length)node.append(nextLevel());
    }else if(view.type==='trainer'){
      const group=view.trainer,node=screen(view.key,group.title,group.description,'ПОВТОРЕНИЕ ДО АВТОМАТИЗМА');const actions=el('div','actions');actions.append(button('▶ Слушать весь список',()=>start(unitsFor(group.pairs),group.title),'primary'));node.append(actions);if(group.note)node.append(el('p','explanation',group.note));
      if(group.entries){for(const w of group.entries){const c=el('article','verb-row');c.append(pairNode(w.head));const forms=el('div','forms');forms.append(pairNode(w.forms[2]));if(w.word==='be')forms.append(...w.forms.filter(p=>p.en==='were').map(p=>pairNode(p)));forms.append(pairNode(w.forms[3]));c.append(forms);node.append(c);}}
      else{const list=el('div',group.id==='alphabet'?'alphabet':'pairs repetition-list');list.append(...group.pairs.map(p=>pairNode(p)));node.append(list);}
    }else if(view.type==='word'){const node=screen(view.key,'Словарная статья','');node.append(wordNode(view.word,{open:true}));}
  }

  const practice=screen('practice','Говорите, читайте и пишите','Составьте свой ответ, прочитайте его вслух и сравните с образцом. Ваши ответы и заметки сохраняются на этом устройстве.');
  for(const p of data.practice){const d=el('details','practice');d.append(el('summary','',p.title));const body=el('div','practice-body');body.append(el('p','',p.task));const pairs=el('div','pairs');pairs.append(...p.pairs.map(x=>pairNode(x)));body.append(pairs);
    const input=el('textarea');input.rows=3;input.placeholder='Ваш ответ или заметка';input.setAttribute('aria-label','Ваш ответ: '+p.title);input.value=storage.read('note.'+p.id,'');input.addEventListener('input',()=>storage.write('note.'+p.id,input.value));body.append(input);
    if(p.model){const model=el('details','model-answer');model.append(el('summary','','Посмотреть образец ответа'),pairNode(p.model));body.append(model);}const actions=el('div','actions');actions.append(button('▶ Слушать фразы ситуации',()=>start(unitsFor([...p.pairs,...(p.model?[p.model]:[])]),p.title)));body.append(actions);d.append(body);practice.append(d);
  }
  function authorAdvice(){const note=el('aside','author-advice');note.append(el('h2','','Совет от автора'),el('p','','Чтобы слова лучше запоминались, записывайте их от руки вместе с транскрипцией и коротким примером. Подойдёт тетрадь или планшет / смартфон со стилусом. Произносите слово, пока пишете, а потом закройте образец и попробуйте вспомнить его самостоятельно. Возвращайтесь к этим записям в следующие дни.'));return note;}
  function nextLevel(){const note=el('aside','next-level');note.append(el('h2','','Продолжение — A2'),el('p','','A2 будет построен по тому же принципу: понятные правила, слова с разными примерами, повторение и озвучка в удобном темпе.'),el('p','','Сначала пройдите бесплатный A1 и попробуйте этот способ учиться. Приобретайте A2, только если метод вам подходит и вы хотите продолжить.'));return note;}
  practice.append(authorAdvice(),nextLevel());days.append(authorAdvice(),nextLevel());

  const coverage=screen('coverage','Что вы отрабатываете на A1','Уровень описывает то, что человек умеет делать с языком. У CEFR нет единого обязательного списка английских слов; здесь собраны основные навыки и темы, а расширение к A2 отмечено отдельно.');
  const coverageGrid=el('div','coverage');for(const [title,text,ids] of [
    ['Чтение и произношение','Буквы, диктовка, ударение, гласные, согласные, сочетания, окончания и частые исключения.',['reading']],
    ['Понимание на слух','Знакомые слова и короткие фразы, числа, время, цены и контакты.',['trainers','practice']],
    ['Разговор с собеседником','Представиться, спросить и ответить, заказать, купить, попросить помощь и повторение.',['practice']],
    ['Рассказ о себе','Семья, дом, город, работа, учёба, распорядок, предпочтения и планы.',['grammar','practice']],
    ['Чтение коротких текстов','Вывески, меню, адреса, сообщения и простые инструкции.',['practice']],
    ['Письмо','Личные данные, записка, открытка, приглашение и вежливое сообщение.',['practice']],
    ['Грамматика','Предложение, вопросы, времена, артикли, местоимения, количество, предлоги и сравнение.',['grammar']],
    ['Лексика','Дом, люди, еда, одежда, здоровье, поездки, работа, досуг и календарь.',['vocabulary','trainers']]
  ]){const c=el('article','coverage-card');c.append(el('h2','',title),el('p','',text));const actions=el('div','actions');ids.forEach(id=>actions.append(button(COURSE_VIEWS.find(([key])=>key===id)[1],()=>go(id),'quiet')));c.append(actions);coverageGrid.append(c);}coverage.append(coverageGrid,el('p','muted','Транскрипции показывают учебное произношение. Темп, интонация и слабые формы могут меняться в живой речи.'));
  const sources=el('footer','sources');sources.append(el('h2','','Ориентиры содержания'));for(const source of data.sources){const p=el('p'),a=el('a','',source.title);a.href=source.url;a.target='_blank';a.rel='noopener';p.append(a);sources.append(p);}sources.append(el('p','muted','Версия '+data.version+'. Настройки, место прослушивания и заметки сохраняются в этом браузере.'));coverage.append(sources);

  renderDays();refreshVoices();
  const savedQueue=storage.read('queue',null),savedProgress=storage.read('progress',null);
  if(savedQueue&&savedProgress&&savedQueue.version===savedProgress.version&&savedQueue.version===data.version){const units=savedQueue.ids.map(id=>curriculum.map.get(id));if(units.length&&units.every(Boolean)&&savedProgress.unitIndex<units.length){bulk.units=units;bulkLabel=savedProgress.label||savedQueue.label;lastQueue={...savedQueue,version:data.version};storage.write('queue',lastQueue);bulk.unitIndex=savedProgress.unitIndex;bulk.segmentIndex=savedProgress.segmentIndex||0;bulk.activeMs=(savedProgress.elapsed||0)*1000;bulk.mode=savedProgress.mode||cfg.mode;bulk.repeat=savedProgress.repeat||cfg.repeat;bulk.status='paused';}}
  updatePlayer();show(decodeURIComponent(location.hash.slice(1))||storage.read('view','days'));
  window.speechSynthesis?.addEventListener?.('voiceschanged',refreshVoices);const tick=setInterval(()=>{if(bulk.status==='playing'||clip.status==='playing')updatePlayer();},1000);
  window.addEventListener('pagehide',()=>{bulk.pause();clip.dispose();saveProgress();clearInterval(tick);});
  window.addEventListener('message',e=>{if(e.source!==window.parent||e.origin!==location.origin||!e.data?.syolanaHost)return;const x=e.data;if(x.pauseAudio){bulk.pause();clip.stop(false);clipSelected=false;updatePlayer();}if(x.anchor)go(x.anchor);if(Number.isFinite(x.courseScroll))pageOffset=Math.max(0,x.courseScroll);if(x.openPlayer)setPlayer(overlay!=='player');if(x.openTOC)setTOC(overlay!=='toc');});
  app.hidden=false;document.getElementById('loading').hidden=true;const resize=new ResizeObserver(()=>post({height:Math.ceil(shell.getBoundingClientRect().height)}));resize.observe(shell);post({ready:true,height:Math.ceil(shell.getBoundingClientRect().height)});
}
init().catch(e=>{const loading=document.getElementById('loading');loading.replaceChildren(el('strong','','Курс пока не загрузился'),el('p','',e.message),button('Попробовать снова',()=>location.reload()));post({ready:true,height:450});});
