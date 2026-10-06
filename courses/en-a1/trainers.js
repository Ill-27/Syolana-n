// Number and spelling practice uses an authored, closed phoneme dictionary.
const SMALL = ['zero','one','two','three','four','five','six','seven','eight','nine','ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen','seventeen','eighteen','nineteen'];
const TENS = ['', '', 'twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
const ORD = ['','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth','thirteenth','fourteenth','fifteenth','sixteenth','seventeenth','eighteenth','nineteenth'];
const ORD_TENS = {twenty:'twentieth',thirty:'thirtieth',forty:'fortieth',fifty:'fiftieth',sixty:'sixtieth',seventy:'seventieth',eighty:'eightieth',ninety:'ninetieth',hundred:'hundredth',thousand:'thousandth',million:'millionth'};
export function numberWords(n, british = true) {
  if (!Number.isSafeInteger(n) || n < 0 || n > 999999999) throw new Error('Введите целое число от 0 до 999 999 999.');
  if (n < 20) return SMALL[n];
  if (n < 100) return TENS[Math.floor(n/10)] + (n%10 ? '-' + SMALL[n%10] : '');
  if (n < 1000) return SMALL[Math.floor(n/100)] + ' hundred' + (n%100 ? (british ? ' and ' : ' ') + numberWords(n%100,british) : '');
  const size = n >= 1000000 ? 1000000 : 1000, name = size === 1000 ? 'thousand' : 'million';
  const rest=n%size;
  return numberWords(Math.floor(n/size),british)+' '+name+(rest ? (british && rest<100 ? ' and ' : ' ')+numberWords(rest,british) : '');
}
export function ordinalWords(n) {
  if (!Number.isSafeInteger(n) || n<1 || n>1000000) throw new Error('Порядковое число: от 1 до 1 000 000.');
  if(n<20) return ORD[n];
  const base=numberWords(n), parts=base.split(/([ -])/), last=parts.at(-1);
  parts[parts.length-1]=ORD_TENS[last] || ORD[SMALL.indexOf(last)];
  return parts.join('');
}
export function transcribe(text, dictionary) {
  const tokens=text.replace(/-/g,' ').match(/[A-Za-z]+(?:['’][A-Za-z]+)?/g)||[];
  const weak={a:'ə',an:'ən',the:'ðə',and:'ənd',of:'əv',to:'tə',at:'ət',in:'ɪn',for:'fə'};
  const result=tokens.map((t,i)=>{
    const key=t.toLowerCase().replace('’',"'");
    let ip=dictionary[key];
    if(!ip) throw new Error('Для слова «'+t+'» нет проверенной транскрипции.');
    if(tokens.length>1&&weak[key])ip=weak[key];
    const next=dictionary[tokens[i+1]?.toLowerCase()]?.replace(/^[ˈˌ]/,'');
    if(key==='the'&&next&&/[æɑɒʌəɛeiɪɔuʊɜa]/.test(next[0]))ip='ði';
    if(key.endsWith('r')&&!ip.endsWith('r')&&ip.endsWith('ə')&&next&&/[æɑɒʌəɛeiɪɔuʊɜa]/.test(next[0]))ip+='r';
    return ip;
  });
  return '/'+result.join(' ')+'/';
}
export function generatedPair(en,ru,dictionary,id='trainer',extras={}) {
  return {id,en,ru,ipa:transcribe(en,dictionary),lang:'en-GB',...extras};
}
export function numberPair(n,dictionary) {return generatedPair(numberWords(n),String(n),dictionary,'number-'+n);}
export function phonePair(value,dictionary) {
  if(!/^[+\d ()-]{3,30}$/.test(value) || value.replace(/\D/g,'').length<3) throw new Error('Введите учебный номер: цифры, пробелы, скобки и при необходимости плюс.');
  const spoken=[...value].filter(c=>/[+\d]/.test(c)).map(c=>c==='+'?'plus':SMALL[Number(c)]).join(', ');
  return generatedPair(spoken,'Телефон: '+value,dictionary,'phone-'+value);
}
export function spellingPair(value,data) {
  const text=value.trim();
  if(!text || text.length>70 || !/^[A-Za-z\d@._+ -]+$/.test(text)) throw new Error('Для диктовки используйте латинские буквы, цифры, пробел, точку, плюс, дефис, подчёркивание и знак почты; до 70 знаков.');
  const parts=[...text].map(c=>{
    if(/[A-Za-z]/.test(c)) {const a=data.alphabet[c.toUpperCase().charCodeAt(0)-65];return {en:c.toUpperCase(),ipa:a.ipa.slice(1,-1)};}
    const en=/\d/.test(c)?SMALL[+c]:({'@':'at','.':'dot','-':'dash','_':'underscore','+':'plus',' ':'space'})[c];
    return {en,ipa:data.phonemeDictionary[en]};
  });
  return {id:'spell-'+text,en:parts.map(x=>x.en).join(' · '),speak:parts.map(x=>x.en).join('. '),ipa:'/'+parts.map(x=>x.ipa).join(' ')+'/',ru:'По буквам: '+(/[A-Za-z]/.test(text)?'последовательность из '+parts.length+' знаков':text),lang:'en-GB'};
}
export function timePair(hour,minute,dictionary) {
  if(!Number.isInteger(hour)||hour<0||hour>23||!Number.isInteger(minute)||minute<0||minute>59) throw new Error('Время: часы от 0 до 23, минуты от 0 до 59.');
  const h=hour%12||12,next=(h%12)+1;
  const en=minute===0?numberWords(h)+" o'clock":minute===15?'quarter past '+numberWords(h):minute===30?'half past '+numberWords(h):minute===45?'quarter to '+numberWords(next):minute<30?numberWords(minute)+(minute===1?' minute':' minutes')+' past '+numberWords(h):numberWords(60-minute)+(minute===59?' minute':' minutes')+' to '+numberWords(next);
  return generatedPair(en,'Время '+String(hour).padStart(2,'0')+':'+String(minute).padStart(2,'0')+'; утро или вечер уточняются по ситуации',dictionary,'time-'+hour+'-'+minute);
}
export function pricePair(pounds,pence,dictionary) {
  if(!Number.isInteger(pounds)||pounds<0||pounds>9999||!Number.isInteger(pence)||pence<0||pence>99) throw new Error('Фунты: 0–9999. Пенсы: 0–99.');
  let en=pounds ? numberWords(pounds)+(pounds===1?' pound':' pounds') : '';
  if(pence) en+=(en?' and ':'')+numberWords(pence)+(pence===1?' penny':' pence');
  if(!en) en='zero pounds';
  return generatedPair(en,'Цена: '+pounds+' фунтов и '+pence+' пенсов',dictionary,'price-'+pounds+'-'+pence);
}
const RU_SMALL=['ноль','один','два','три','четыре','пять','шесть','семь','восемь','девять','десять','одиннадцать','двенадцать','тринадцать','четырнадцать','пятнадцать','шестнадцать','семнадцать','восемнадцать','девятнадцать'];
const RU_TENS=['','','двадцать','тридцать','сорок','пятьдесят','шестьдесят','семьдесят','восемьдесят','девяносто'];
const RU_HUNDREDS=['','сто','двести','триста','четыреста','пятьсот','шестьсот','семьсот','восемьсот','девятьсот'];
export function russianNumber(n) {
  if(n<20)return RU_SMALL[n];
  if(n<100)return RU_TENS[Math.floor(n/10)]+(n%10?' '+RU_SMALL[n%10]:'');
  if(n<1000)return RU_HUNDREDS[Math.floor(n/100)]+(n%100?' '+russianNumber(n%100):'');
  const size=n>=1000000?1000000:1000,q=Math.floor(n/size),r=n%size;
  let first=russianNumber(q);
  if(size===1000)first=first.replace(/один$/,'одна').replace(/два$/,'две');
  const suffix=q%100>=11&&q%100<=14?2:q%10===1?0:q%10>=2&&q%10<=4?1:2;
  return first+' '+(size===1000?['тысяча','тысячи','тысяч']:['миллион','миллиона','миллионов'])[suffix]+(r?' '+russianNumber(r):'');
}
const RU_ORD=['','первый','второй','третий','четвёртый','пятый','шестой','седьмой','восьмой','девятый','десятый','одиннадцатый','двенадцатый','тринадцатый','четырнадцатый','пятнадцатый','шестнадцатый','семнадцатый','восемнадцатый','девятнадцатый'];
const RU_ORD_TENS={20:'двадцатый',30:'тридцатый',40:'сороковой',50:'пятидесятый',60:'шестидесятый',70:'семидесятый',80:'восьмидесятый',90:'девяностый',100:'сотый',1000:'тысячный',1000000:'миллионный'};
function russianOrdinal(n) {return RU_ORD[n]||RU_ORD_TENS[n]||russianNumber(Math.floor(n/10)*10)+' '+RU_ORD[n%10];}

// These are finite, ordered repetition lists. There are no random tasks or inputs.
export function trainerGroups(data) {
  const d=data.phonemeDictionary;
  const p=(en,ru,id,extras={})=>generatedPair(en,ru,d,'repeat-'+id,extras);
  const numbers=[...Array(101).keys(),101,105,110,125,150,199,200,250,500,999,1000,1001,1010,1100,1500,2000,10000,100000,1000000];
  const ordinals=[...Array.from({length:31},(_,i)=>i+1),40,50,60,70,80,90,100,1000,1000000];
  const weekdays=data.vocabulary.filter(w=>w.kind==='dayname');
  const months=data.vocabulary.filter(w=>w.kind==='monthname');
  const monthRu=['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
  const onRu=['в понедельник','во вторник','в среду','в четверг','в пятницу','в субботу','в воскресенье'];
  const inRu=['в январе','в феврале','в марте','в апреле','в мае','в июне','в июле','в августе','в сентябре','в октябре','в ноябре','в декабре'];
  const minuteForm=n=>n%100>=11&&n%100<=14?'минут':n%10===1?'минута':n%10>=2&&n%10<=4?'минуты':'минут';
  const traditional=Array.from({length:60},(_,m)=>({...timePair(9,m,d),ru:'09:'+String(m).padStart(2,'0')+' — '+(m===0?'девять часов':m===15?'четверть десятого':m===30?'половина десятого':m===45?'без четверти десять':m<30?m+' '+minuteForm(m)+' после девяти':'до десяти — '+(60-m)+' '+minuteForm(60-m)),tag:'09:'+String(m).padStart(2,'0')}));
  const digital=[[0,0],[7,0],[7,5],[7,10],[7,15],[7,30],[7,45],[9,55],[12,0],[13,20],[18,30],[21,5],[23,59]].map(([h,m])=>p(numberWords(h)+(m===0?' hundred':m<10?' oh '+numberWords(m):' '+numberWords(m)),'В расписании: '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'),'digital-'+h+'-'+m,{tag:String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}));
  // Ordinary clock readings use twelve hours. 24-hour readings above are for schedules.
  const twelve=[[7,0],[7,5],[7,10],[7,15],[7,30],[7,45],[9,55]].map(([h,m])=>p(numberWords(h)+(m===0?" o'clock":m<10?' oh '+numberWords(m):' '+numberWords(m)),'На часах: '+String(h).padStart(2,'0')+':'+String(m).padStart(2,'0'),'clock-digital-'+h+'-'+m));
  const dayparts=[
    ['seven a.m.','семь часов утра','am',{speak:'seven A M',ipa:'/ˈsevn eɪ em/'}],
    ['seven p.m.','семь часов вечера','pm',{speak:'seven P M',ipa:'/ˈsevn piː em/'}],
    ['noon','полдень','noon'],['midnight','полночь','midnight'],
    ['at noon','в полдень','at-noon'],['at midnight','в полночь','at-midnight'],
    ['in the morning','утром','morning'],['in the afternoon','днём, после полудня','afternoon'],
    ['in the evening','вечером','evening'],['at night','ночью','night']
  ].map(([en,ru,id,extras])=>extras?.ipa?{id:'repeat-'+id,en,ru,lang:'en-GB',...extras}:p(en,ru,id));
  const priceSpecs=[[0,1],[0,2],[0,5],[0,10],[0,25],[0,50],[0,99],[1,0],[1,1],[1,50],[2,0],[3,50],[10,5],[12,99],[20,0],[100,0]];
  const prices=priceSpecs.map(([a,b])=>({...pricePair(a,b,d),ru:'Цена в фунтах стерлингов: '+a+','+String(b).padStart(2,'0'),tag:'£'+a+'.'+String(b).padStart(2,'0')}));
  prices.push(p('three fifty','три фунта пятьдесят пенсов; коротко, когда валюта уже понятна','short-price'),p('twelve ninety-nine','двенадцать фунтов девяносто девять пенсов; коротко','short-price-2'),p('one euro','один евро','euro'),p('two euros and fifty cents','два евро и пятьдесят центов','euros'),p('one dollar','один доллар','dollar'),p('five dollars and ten cents','пять долларов и десять центов','dollars'));
  const contact=[phonePair('+44 7700 900123',d),phonePair('020 7946 0000',d),p('oh two oh, seven nine four six, double oh, double oh','Учебный номер: 020 7946 0000. Здесь ноль назван как буква, а две одинаковые цифры объединены.','phone-oh'),...['Alex Green','alex@example.org','a.green@example.org','alex_green@example.org','SW1A 1AA'].map(t=>spellingPair(t,data)),p('Alex Green','Алекс Грин; учебное имя','contact-name',{id:'contact-name'}),p('ten Green Street, London','дом десять, Грин-стрит, Лондон; учебный адрес','address',{id:'contact-address'}),p('the fifth of October','пятое октября','contact-date',{id:'contact-date'}),p('flat two, ten Green Street','квартира два, дом десять, Грин-стрит; учебный адрес','flat'),p('My first name is Alex.','Меня зовут Алекс.','first-name'),p('My surname is Green.','Моя фамилия — Грин.','surname')];
  for(const pair of contact){if(pair.id.startsWith('spell-')){const text=pair.id.slice(6);pair.en=text;pair.ru=text.includes('@')?'Учебный адрес электронной почты: диктовка по буквам.':/\d/.test(text)?'Учебный почтовый индекс: диктовка по буквам.':'Учебное имя и фамилия: диктовка по буквам.';pair.ipaLabel='Произношение по буквам';}}
  const years=[['nineteen hundred','1900 год'],['nineteen oh five','1905 год'],['nineteen ninety-nine','1999 год'],['two thousand','2000 год'],['two thousand and one','2001 год'],['two thousand and ten','2010 год'],['twenty ten','2010 год; ещё один способ'],['twenty twenty','2020 год'],['twenty twenty-six','2026 год'],['two thousand and twenty-six','2026 год; полная форма'],['twenty thirty','2030 год']].map(([en,ru],i)=>p(en,ru,'year-'+i));
  const irregular=data.vocabulary.filter(w=>w.irregular);
  return [
    {id:'alphabet',title:'Алфавит и диктовка',description:'Все 26 букв по порядку. Произнесите название, затем повторите за британским голосом.',pairs:data.alphabet},
    {id:'numbers',title:'Обычный счёт',description:'Все числа от 0 до 100 без пропусков. Затем — сотни, тысячи, миллион и примеры составных чисел.',pairs:numbers.map(n=>({...numberPair(n,d),ru:russianNumber(n),tag:String(n)}))},
    {id:'ordinals',title:'Порядковые числа',description:'С первого по тридцать первое: даты и порядок. После них — десятки, сотый, тысячный и миллионный.',pairs:ordinals.map(n=>p(ordinalWords(n),russianOrdinal(n),'ordinal-'+n,{id:'ordinal-'+n,tag:String(n)}))},
    {id:'time',title:'Время: часы и минуты',description:'Каждая минута от 09:00 до 09:59: «после», «без», четверть и половина. Затем — чтение цифр, время в расписании, утро и вечер.',note:'Обычное время чаще называют по 12-часовой системе. Чтение с «сотней» относится к 24-часовым расписаниям и формальным сообщениям. У полуночи и полудня есть отдельные названия.',pairs:[...traditional,...[[7,0],[8,15],[10,45],[11,5],[12,55]].map(([h,m])=>timePair(h,m,d)),...twelve,...digital,...dayparts]},
    {id:'calendar',title:'Дни недели и месяцы',description:'Сначала название, затем готовое сочетание с предлогом: день недели или месяц.',pairs:[...weekdays.flatMap((w,i)=>[w.head,p('on '+w.word,onRu[i],'on-'+w.word)]),...months.flatMap((w,i)=>[w.head,p('in '+w.word,inRu[i],'in-'+w.word)]),p('at the weekend','на выходных; британский вариант','weekend'),p('on weekdays','по будням','weekdays')]},
    {id:'dates',title:'Даты и годы',description:'Все 31 число месяца, даты с каждым месяцем и основные способы чтения годов. В конце — фразы с предлогами.',pairs:[...Array.from({length:31},(_,i)=>p('the '+ordinalWords(i+1)+' of October',(i+1)+' октября','date-'+(i+1))),...months.map((w,i)=>p('the first of '+w.word,'первое '+monthRu[i],'date-'+w.word)),...years,p('on the fifth of October','пятого октября','on-date'),p('in twenty twenty-six','в 2026 году','in-year')]},
    {id:'prices',title:'Цены и деньги',description:'Пенни и пенсы, фунты с пенсами, короткое чтение цены, евро и доллары. Сравнивайте сумму с произношением.',pairs:prices},
    {id:'contacts',title:'Телефоны, почта и адреса',description:'Учебные номера, разные способы назвать ноль, диктовка имени, электронной почты и индекса, квартира и почтовый адрес.',pairs:contact},
    {id:'irregular',title:'Неправильные глаголы',description:'Для каждого глагола: начальная форма, прошедшая форма и причастие. У глагола «быть» дополнительно показаны обе формы прошедшего времени.',entries:irregular,pairs:irregular.flatMap(w=>[w.head,w.forms[2],...(w.word==='be'?w.forms.filter(p=>p.en==='were'):[]),w.forms[3]])}
  ];
}
export function referencePairs(data) {
  // Original alphabet, word heads and verb forms already belong to the course.
  const unique=new Map();
  for(const g of trainerGroups(data))for(const p of g.pairs)if(!/^p\d+$/.test(p.id))unique.set(p.id,p);
  return [...unique.values()];
}
