"""Compile Syolana's original English course. No third-party word-list ingestion.
Every spoken sentence has explicit language, Russian meaning and broad UK IPA.
The phoneme dictionary is closed: unknown tokens fail the build, never guessed.
"""
from pathlib import Path
import json, re, collections
from a1_russian import noun, plural_noun
from a1_examples import examples as authored_examples
ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'courses/en-a1'
PH={}
UNKNOWN=collections.Counter()
WEAK={'a':'ə','an':'ən','the':'ðə','to':'tə','of':'əv','and':'ənd','for':'fə','from':'frəm','at':'ət','can':'kən','are':'ə','was':'wəz','were':'wə','have':'həv','has':'həz','you':'juː','your':'jə','her':'hə','them':'ðəm','than':'ðən','as':'əz'}
def words(s): return re.findall(r"[A-Za-zÀ-ÿ]+(?:['’][A-Za-z]+)?",s.replace('-',' '))
def addph(en,ip): PH[en.lower().replace('’',"'")]=ip.strip('/')
def suffix(ip,kind):
    if kind=='s': return ip+('ɪz' if ip.endswith(('s','z','ʃ','ʒ','tʃ','dʒ')) else 's' if ip.endswith(('p','t','k','f','θ')) else 'z')
    if kind=='ed': return ip+('ɪd' if ip.endswith(('t','d')) else 't' if ip.endswith(('p','k','f','θ','s','ʃ','tʃ')) else 'd')
    return ip+'ɪŋ'
IRREGULAR={}
for line in (SRC/'irregular.txt').read_text().splitlines():
    if not line or line.startswith('#'): continue
    w,p,pp,pip,ppip=line.split('|');IRREGULAR[w]=(p,pp,pip,ppip);addph(p,pip);addph(pp,ppip)
REG_SPELL={'have':'has','do':'does','go':'goes','be':'is'}
def inflect(w,kind):
    head,*tail=w.split(' ')
    if kind=='ing' and head=='be':return ' '.join(['being']+tail)
    if kind=='past' and head in IRREGULAR: out=IRREGULAR[head][0]
    elif kind=='s': out=REG_SPELL.get(head, head[:-1]+'ies' if head.endswith('y') and head[-2] not in 'aeiou' else head+'es' if head.endswith(('s','sh','ch','x','z','o')) else head+'s')
    elif kind=='past':
        out=head+'d' if head.endswith('e') else head[:-1]+'ied' if head.endswith('y') and head[-2] not in 'aeiou' else head+head[-1]+'ed' if head in {'stop','plan','drop','shop','fit','prefer'} else head+'ed'
    else: out=head[:-1]+'ing' if head.endswith('e') and not head.endswith(('ee','ye')) else head+head[-1]+'ing' if head in {'run','swim','sit','get','put','begin','stop','plan','win','shop'} else head+'ing'
    return ' '.join([out]+tail)
PLURALS={'person':'people','man':'men','woman':'women','child':'children','tooth':'teeth','foot':'feet','mouse':'mice','sheep':'sheep','fish':'fish','wife':'wives','life':'lives','knife':'knives','leaf':'leaves','shelf':'shelves','half':'halves','scarf':'scarves','potato':'potatoes','tomato':'tomatoes','penny':'pence','businessperson':'businesspeople'}
PL_IP={'people':'ˈpiːpl','men':'men','women':'ˈwɪmɪn','children':'ˈtʃɪldrən','teeth':'tiːθ','feet':'fiːt','mice':'maɪs','wives':'waɪvz','lives':'laɪvz','knives':'naɪvz','leaves':'liːvz','shelves':'ʃelvz','halves':'hɑːvz','scarves':'skɑːvz','pence':'pens','businesspeople':'ˈbɪznəspiːpl'}
def plural(w):
    if w in PLURALS: return PLURALS[w]
    if w.endswith("'s"): return w
    if ' ' in w:
        head,tail=w.rsplit(' ',1);return head+' '+plural(tail)
    return w[:-1]+'ies' if w.endswith('y') and w[-2] not in 'aeiou' else w+'es' if w.endswith(('s','sh','ch','x','z')) else w+'s'
def article(ip): return 'an' if ip.lstrip('ˈˌ')[0] in 'æɑɒʌəɛeiɪɔuʊɜa' else 'a'
records=[];groups=[]
for line in (SRC/'lexicon.txt').read_text().splitlines():
    if not line or line.startswith('#'):continue
    if line.startswith('['):
        gid,title,typ=line[1:-1].split('|');groups.append({'id':gid,'title':title,'type':typ});continue
    a=line.split('|'); w,ip,ru=a[:3]
    records.append({'id':gid+'-'+str(len(records)+1),'word':w,'ipa':ip,'ru':ru,'group':gid,'kind':typ,'extra':a[3] if len(a)>3 else ''})
    if typ=='verb' or w.lower() not in PH:addph(w,ip)
for line in (SRC/'functions.txt').read_text().splitlines():
    if not line or line.startswith('#'):continue
    w,ip,ru,raw=line.split('|',3);addph(w,ip)
    records.append({'id':'function-'+str(len(records)+1),'word':w,'ipa':ip,'ru':ru,'group':'functions','kind':'function','rawExamples':[x.split('~',1) for x in raw.split('||')]})
groups.append({'id':'functions','title':'Служебные слова и вежливые формулы','type':'function'})
for line in (SRC/'phonemes.txt').read_text().splitlines():
    if line and not line.startswith('#'):
        en,ip=line.split('|');addph(en,ip)
for p,ip in PL_IP.items():addph(p,ip)
for r in records:
    w,ip=r['word'],r['ipa']
    if r['kind']=='verb':
        base=w.split(' ')[0];bip=PH.get(base,ip.split(' ')[0]);addph(inflect(base,'s'),suffix(bip,'s'));addph(inflect(base,'ing'),suffix(bip,'ing'))
        if base not in IRREGULAR: addph(inflect(base,'past'),suffix(bip,'ed'))
    elif r['kind'] not in {'adjective','feeling','colour','adverb','function','country','nationality','activity','mass','massFood','plural','dayname','monthname'}:
        p=plural(w)
        if p!=w and p not in PH:
            addph(p, PL_IP.get(p,suffix(ip,'s')))
# Homographs and exceptional inflections, authored and checked explicitly.
for line in (SRC/'phonemes.txt').read_text().splitlines():
    if line and not line.startswith('#'):
        en,ip=line.split('|');addph(en,ip)
def ipa(en,overrides=None):
    toks=words(en);out=[];i=0; overrides=overrides or {}
    while i<len(toks):
        found=None
        for n in range(min(4,len(toks)-i),0,-1):
            key=' '.join(toks[i:i+n]).lower().replace('’',"'")
            if key in PH:found=(key,n);break
        if found:
            key,n=found;ip=overrides.get(key,PH[key]);
            if len(toks)>1 and n==1 and key in WEAK:ip=WEAK[key]
            if key=='the' and i+1<len(toks):
                nxt=PH.get(toks[i+1].lower(),'').lstrip('ˈˌ')
                if nxt and nxt[0] in 'æɑɒʌəɛeiɪɔuʊɜa':ip='ði'
            # Linking r: spelling-final r is sounded before a following vowel in this model.
            if key.endswith('r') and not ip.endswith('r') and ip.endswith(('ə','ɜː','ɑː','ɔː','eə','ɪə','ʊə')) and i+n<len(toks):
                nxt=PH.get(toks[i+n].lower(),'').lstrip('ˈˌ')
                if nxt and nxt[0] in 'æɑɒʌəɛeiɪɔuʊɜa':ip+='r'
            out.append(ip);i+=n
        else:
            key=toks[i].lower().replace('’',"'")
            if key.endswith("'s") and key[:-2] in PH:out.append(suffix(PH[key[:-2]],'s'))
            else:UNKNOWN[key]+=1;out.append('<?>')
            i+=1
    return '/'+ ' '.join(out)+'/'
counter=0
def pair(en,ru,**kw):
    global counter
    overrides=kw.pop('phoneticOverrides',{})
    if 'read' in words(en) and any(x in ru for x in ['прочитал','прочла','читал','прочли']):overrides={**overrides,'read':'red'}
    counter+=1;obj={'id':'p'+str(counter),'en':en,'ru':ru,'ipa':kw.pop('ipa',None) or ipa(en,overrides),'lang':kw.pop('lang','en-GB')}
    obj.update(kw);return obj
OVERRIDES={}
for line in (SRC/'special-examples.txt').read_text().splitlines():
    if line and not line.startswith('#'):
        key,raw=line.split('|',1);OVERRIDES[key]=[x.split('~',1) for x in raw.split('||')]
PAST_RU={}
for l in (SRC/'verb-russian.txt').read_text().splitlines():
    if l and not l.startswith('#'):w,past=l.split('|');PAST_RU[w]=past
SUBJECTS=json.loads((SRC/'adjective-subjects.json').read_text())
COUNTLESS={'time','cash','space','health','pain','energy','heat','ice','fire','internet','wifi','reception','laundry','stress','success','transport','population','skin','petrol','rubbish','blood','midday','midnight','toothache'}
NON_GRADE={'same','different','real','dead','alive','asleep','awake','married','single','sure','perfect','public','private','online','offline','available','necessary','possible','impossible','international','local','daily','usual','own','other','another','each','every','both','all','enough','several','next','last'}
COMPS={'good':('better','best'),'well':('better','best'),'bad':('worse','worst'),'far':('farther','farthest'),'little':('less','least'),'many':('more','most'),'much':('more','most')}
NOTES=json.loads((SRC/'notes.json').read_text())
RU_NOUNS={r['word']:noun(r['ru']) for r in records if r['kind'] not in {'verb','adjective','feeling','colour','function','adverb'}}
RU_NOUNS.update({'pool':'бассейн','line':'линия','path':'тропа'})
def examples(r):
    return authored_examples(r, OVERRIDES, SUBJECTS, RU_NOUNS, PAST_RU, plural, article, inflect)

for r in records:
    w,ip,k=r['word'],r['ipa'],r['kind']; meta=[]
    if w=='headphones':k=r['kind']='plural'
    if w in {'hen','lamb','duckling','chick'}:k=r['kind']='animal'
    if w=='zoo':k=r['kind']='place'
    uncount=k in {'massFood','mass'} or w in COUNTLESS
    r['level']='расширение A1 → A2' if w in {'already','yet','especially','probably','borrow','lend','download','upload','sell out','decide','should','must','if'} else 'база A1'
    if k=='verb':
        r['en']=w;r['note']='Глагол. В инфинитиве перед ним может стоять показатель инфинитива; после модального глагола он не нужен.'
        base=w.split(' ')[0];tail=' '.join(w.split(' ')[1:]);p,pp,pip,ppip=IRREGULAR.get(base,(inflect(base,'past'),inflect(base,'past'),PH[inflect(base,'past')],PH[inflect(base,'past')]))
        forms=[(w,'начальная форма',ip),(inflect(w,'s'),'форма для третьего лица настоящего времени',None),(p+(' '+tail if tail else ''),'прошедшее время',pip+(' '+PH.get(tail,ipa(tail).strip('/')) if tail else '')),(pp+(' '+tail if tail else ''),'причастие; понадобится также на следующем уровне',ppip+(' '+PH.get(tail,ipa(tail).strip('/')) if tail else '')),(inflect(w,'ing'),'форма с окончанием действия в процессе',None)]
        for en,ru,fip in forms:
            meaning=PAST_RU.get(w,r['ru']) if ru=='прошедшее время' else r['ru']
            meta.append(pair(en,meaning+'; '+ru,ipa='/'+fip+'/' if fip else None))
    elif k in {'adjective','feeling','colour','adverb','function','country','nationality','activity','dayname','monthname'}:
        r['en']=w;r['note']='Без постоянного артикля: артикль относится к существительному, а не к этому слову.'
        if w in COMPS:
            c,s=COMPS[w];translations={'good':('лучше; более хороший','лучший; самый хороший'),'well':('лучше','лучше всего; лучший'),'bad':('хуже','худший'),'far':('дальше; более далёкий','самый далёкий'),'little':('меньше','меньше всего; наименьший'),'many':('больше','больше всего'),'much':('больше','больше всего')};cr,sr=translations[w];meta.extend([pair(c,cr),pair('the '+s,sr)])
        elif k in {'adjective','feeling'} and w not in NON_GRADE:
            if len(words(w))>1 or len(ip)>8 and not w.endswith('y') or w.endswith(('ful','ous','ing','ed','able','ant','ent','ive')) or w in {'afraid','ill','fun','polite','tired','worried','pleased'}:
                c,s='more '+w,'most '+w
            else:c,s=(w[:-1]+'ier',w[:-1]+'iest') if w.endswith('y') else (w+'r',w+'st') if w.endswith('e') else (w+w[-1]+'er',w+w[-1]+'est') if w in {'big','hot','wet','thin','sad','red'} else (w+'er',w+'est')
            if c not in PH and not c.startswith('more '):addph(c,ip[:-1]+'iə' if w.endswith('y') else ip+'ə')
            if s not in PH and not s.startswith('most '):addph(s,ip[:-1]+'iɪst' if w.endswith('y') else ip+'ɪst')
            meaning=r['ru'].split(';')[0];meta.extend([pair(c,'более '+meaning),pair('the '+s,'самый '+meaning)])
    elif k=='plural':
        r['en']=w;r['note']='Грамматически множественное число.'
        if r['group']!='extraFood':r['note']+=' Для одной единицы используем слово «пара».';meta.append(pair('a pair of '+w,'одна пара'))
    elif uncount:
        r['en']=w;r['note']='В этом значении неисчисляемое: неопределённый артикль и обычное множественное число не используются. Определённый артикль возможен, когда речь о конкретном количестве или объекте.';meta.append(pair('some '+w,'некоторое количество: '+r['ru']))
    else:
        a=article(ip);r['en']=a+' '+w;r['note']='Исчисляемое. Артикль зависит от контекста: здесь показана форма «один из многих». Для конкретного, известного собеседнику предмета нужен определённый артикль.';meta.append(pair(plural(w),plural_noun(noun(r['ru']))+'; множественное число'))
        if w in PLURALS:r['note']+=' У формы множественного числа есть особенность; см. ниже.'
        if w=='sky':r['en']='the sky';r['note']='Когда говорим о небе над нами, обычно употребляем определённый артикль. В художественном описании возможны и другие формы.'
    n=NOTES.get(w)
    if n:
        r['note']+=' '+n.get('ru','')
        meta.extend(pair(en,ru) for en,ru in n.get('pairs',[]))
    r['head']=pair(r['en'],r['ru'],ipa='/'+ (('ə ' if r['en'].startswith('a ') else 'ən ' if r['en'].startswith('an ') else 'ðə ' if r['en'].startswith('the ') else '')+ip)+'/')
    meta=list({(p['en'],p['ru']):p for p in meta}.values())
    r['forms']=meta;r['examples']=[pair(en,ru,phoneticOverrides={'read':'red'} if re.search(r'\b(Yesterday|yesterday|read his email)\b',en) and 'read' in en else {}) for en,ru in examples(r)]
    for key in ['en','ipa','extra','rawExamples']:r.pop(key,None)

rules=json.loads((SRC/'rules.json').read_text())
for sec in rules:
    for item in sec['items']:
        item['pairs']=[pair(en,ru) for en,ru in item.get('examples',[])];item.pop('examples',None)
        if 'summary' in item:
            item['instruction']=pair(*item.pop('summary'))
phonetics=json.loads((SRC/'sounds.json').read_text())
for item in phonetics:item['example']=pair(item.pop('word'),item.pop('ru'),ipa=item.pop('ipa'))
alphabet=[]
names=['eɪ','biː','siː','diː','iː','ef','dʒiː','eɪtʃ','aɪ','dʒeɪ','keɪ','el','em','en','əʊ','piː','kjuː','ɑː','es','tiː','juː','viː','ˈdʌbljuː','eks','waɪ','zed']
for char,ip in zip('ABCDEFGHIJKLMNOPQRSTUVWXYZ',names):alphabet.append(pair(char,f'буква номер {len(alphabet)+1}; её название',ipa='/'+ip+'/',speak='zed' if char=='Z' else 'double u' if char=='W' else char))
variants=[]
for line in (SRC/'variants.txt').read_text().splitlines():
    if not line or line.startswith('#'):continue
    en,ip,us,uip,ru,note=line.split('|');variants.append({'uk':pair(en,ru,ipa='/'+ip+'/'),'us':pair(us,ru,ipa='/'+uip+'/',lang='en-US'),'note':note})
practices=json.loads((SRC/'practice.json').read_text())
for p in practices:
    p['pairs']=[pair(en,ru) for en,ru in p.pop('examples',[])];p['model']=pair(*p.pop('model')) if 'model' in p else None
for r in records:
    if len(r['examples'])!=4:raise ValueError('Exactly four examples required: '+r['word'])
if UNKNOWN:
    (SRC/'unknown-phonemes.json').write_text(json.dumps(UNKNOWN,ensure_ascii=False,indent=2))
    raise ValueError('Missing authored phonemes: '+', '.join(UNKNOWN.keys()))
data={'version':'2026-10-05.4','title':'Английский A1 · Syolana','sources':[{'title':'CEFR: рамка и описания навыков','url':'https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors'},{'title':'Ориентиры содержания английского: British Council и Eaquals','url':'https://www.teachingenglish.org.uk/sites/teacheng/files/pub-british-council-eaquals-core-inventoryv2.pdf'}],'phonetics':phonetics,'alphabet':alphabet,'rules':rules,'groups':groups,'vocabulary':records,'variants':variants,'practice':practices,'phonemeDictionary':PH,'statistics':{'entries':len(records),'uniqueHeadwords':len(set(r['word'].lower() for r in records)),'examples':len(records)*4,'ruleSections':len(rules),'sounds':len(phonetics)}}
(SRC/'data.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n')
print(json.dumps(data['statistics'],ensure_ascii=False));print('Compiled',counter,'bilingual units with IPA.')
