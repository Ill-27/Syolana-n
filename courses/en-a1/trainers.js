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
  const result=tokens.map(t=>{
    const key=t.toLowerCase().replace('’',"'");
    const ip=dictionary[key];
    if(!ip) throw new Error('Для этой фразы нет проверенной транскрипции.');
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
export function referencePairs(data) {
  const d=data.phonemeDictionary;
  return [
    ...[...Array(21).keys(),30,40,50,60,70,80,90,100,101,150,1000,1001,1000000].map(n=>numberPair(n,d)),
    ...Array.from({length:31},(_,i)=>generatedPair(ordinalWords(i+1),'порядковое числительное: '+(i+1),d,'ordinal-'+(i+1))),
    ...[[7,0],[8,15],[9,30],[10,45],[11,5],[12,55]].map(([h,m])=>timePair(h,m,d)),
    pricePair(1,0,d),pricePair(3,50,d),pricePair(0,25,d),
    phonePair('+44 7700 900123',d),spellingPair('alex@example.org',data),spellingPair('SW1A 1AA',data),
    generatedPair('Alex Green','Алекс Грин; учебное имя',d,'contact-name'),
    generatedPair('ten Green Street, London','дом десять, Грин-стрит, Лондон; учебный адрес',d,'contact-address'),
    generatedPair('the fifth of October','пятое октября',d,'contact-date')
  ];
}
