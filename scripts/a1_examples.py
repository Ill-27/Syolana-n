from a1_russian import noun, gender, case, adj, needed, demonstrative, new

def examples(r, overrides, subjects, russian, past, plural, article, inflect):
    w,ru,k=r['word'],r['ru'],r['kind'];aw=article(r['ipa'])+' '+w
    rn=noun(ru);g=gender(rn);ac=case(rn,'acc',k in {'person','job','animal'});pr=case(rn,'prep');gn=case(rn,'gen');ins=case(rn,'inst')
    key=r['group']+':'+w
    if key in overrides:return overrides[key]
    if w in overrides:return overrides[w]
    if k=='function':return r['rawExamples']
    if k=='verb':
        comp,cru=r['extra'].split('~');p=inflect(w,'past');inf=ru.split(';')[0]
        # A broad dictionary gloss is not always the sense used with this complement.
        inf={'study':'изучать','ride':'ездить','wear':'носить','clean':'убирать','brush':'чистить','decide':'решить','move':'переезжать','take off':'снимать','give back':'возвращать','grow':'выращивать','print':'печатать','save':'копить'}.get(w,inf)
        if w=='tell' and cru=='рассказ':cru='историю'
        return [(f'I can {w} {comp}.',f'Я могу {inf} {cru}.'),(f'Can you {w} {comp}?',f'Ты можешь {inf} {cru}?'),(f'Yesterday I {p} {comp}.',f'Вчера я {past[w]} {cru}.'),(f'I am going to {w} {comp}.',f'Я собираюсь {inf} {cru}.')]
    if k=='person':return [(f'This {w} is in the photo.',f'На фотографии — {rn}.'),(f'The {w} is in the garden.',f'В саду — {rn}.'),(f'Can you see the {w}?',f'Ты видишь {ac}?'),(f'I drew a picture of the {w}.',f'Я нарисовал(а) {ac}.')]
    if k=='job':return [(f'Alex is {aw}.',f'Алекс — {rn}.'),(f'Do you work as {aw}?',f'Ты работаешь {ins}?'),(f'I want to be {aw}.',f'Я хочу стать {ins}.'),(f'The {w} is busy today.',f'{rn.capitalize()} сегодня '+('занята' if g=='f' else 'занят')+'.')]
    if k=='place':return [(f'This is the {w}.',f'Это {rn}.'),(f'Is the {w} near here?',f'Здесь рядом есть {rn}?'),(f'The {w} is open today.',f'{rn.capitalize()} сегодня '+('открыта' if g=='f' else 'открыто' if g=='n' else 'открыт')+'.'),(f'The {w} is very big.',f'{rn.capitalize()} очень '+adj('большой',g)+'.')]
    if k=='object':return [(f'Where is the {w}?',f'Где {rn}?'),(f'I need {aw}.',f'Мне {needed(rn)} {rn}.'),(f'This {w} is new.',f'{demonstrative(rn)} {rn} '+new(rn)+'.'),(f'There is {aw} here.',f'Здесь есть {rn}.')]
    if k=='clothing':return [(f'I am wearing {aw}.',f'На мне {rn}.'),(f'How much is this {w}?',f'Сколько стоит {demonstrative(rn).lower()} {rn}?'),(f'I need a new {w}.',f'Мне {needed(rn)} '+new(rn)+f' {rn}.'),(f'Please try on this {w}.',f'Пожалуйста, примерь {ac}.')]
    if k=='plural':return [(f'These {w} are new.',f'{demonstrative(rn)} {rn} '+new(rn)+'.'),(f'How much are those {w}?',f'Сколько стоят эти вещи: {rn}?'),(f'I need a pair of {w}.',f'Мне нужна пара '+gn+'.'),(f'I am wearing my {w}.',f'На мне '+('мои ' if g=='p' else 'моя ')+rn+'.')]
    if k=='food':return [(f'I bought {aw}.',f'Я купил(а) {ac}.'),(f'How much is {aw}?',f'Сколько стоит {rn}?'),(f'Could I have {aw}, please?',f'Можно мне {ac}, пожалуйста?'),(f'There is {aw} on the plate.',f'На тарелке {rn}.')]
    if k=='massFood':return [(f'I like {w}.',f'Я люблю {ac}.'),(f'Is there any {w}?',f'Есть {rn}?'),(f'We do not have any {w}.',f'У нас нет {gn}.'),(f'Could I have some {w}, please?',f'Можно мне немного {gn}, пожалуйста?')]
    if k=='body':return [(f'My {w} hurts.',f'У меня болит {rn}.'),(f'The doctor checked my {w}.',f'Врач осмотрел {ac}.'),(f'This is a picture of {aw}.',f'На картинке изображена эта часть тела: {rn}.'),(f'Can you see the {w} in this picture?',f'Ты видишь {ac} на этой картинке?')]
    if k=='animal':return [(f'I saw {aw} yesterday.',f'Вчера я видел(а) {ac}.'),(f'Is that {aw}?',f'Это {rn}?'),(f'There is {aw} in the picture.',f'На картинке {rn}.'),(f'Look at the {w}.',f'Посмотри на {ac}.')]
    if k=='nature':return [(f'I can see {aw}.',f'Я вижу {ac}.'),(f'Is there {aw} near here?',f'Рядом есть {rn}?'),(f'We took a photo of the {w}.',f'Мы сфотографировали {ac}.'),(f'Look at this {w}.',f'Посмотри на {ac}.')]
    if k=='mass':
        about='об ' if pr[0] in 'аеёиоуыэюя' else 'о '
        important={'m':'важен','f':'важна','n':'важно','p':'важны'}[g]
        return [(f'The {w} is important.',f'{rn.capitalize()} {important}.'),(f'There is not much {w} here.',f'Здесь мало {gn}.'),(f'We need some {w}.',f'Нам {needed(rn)} {rn}.'),(f'Can you tell me about the {w}?',f'Можешь рассказать мне {about}{pr}?')]
    if k=='transport':return [(f'This is {aw}.',f'Это {rn}.'),(f'Where is the {w}?',f'Где {rn}?'),(f'I can see {aw}.',f'Я вижу {ac}.'),(f'The {w} is late.',f'{rn.capitalize()} опаздывает.')]
    if k in {'leisure','concept','health'}:
        det='the '+w
        about='об ' if pr[0] in 'аеёиоуыэюя' else 'о '
        return [(f'We talked about {det}.',f'Мы говорили {about}{pr}.'),(f'Can you tell me about {det}?',f'Можешь рассказать мне {about}{pr}?'),(f'I remember {det}.',f'Я помню {ac}.'),(f'What do you think about {det}?',f'Что ты думаешь {about}{pr}?')]
    if k=='adjective':
        su=subjects.get(w,['room','house','place','building']);q=[russian.get(s,s) for s in su]
        return [(f'The {su[0]} is {w}.',f'{q[0].capitalize()} '+adj(ru,gender(q[0]))+'.'),(f'Is this {su[1]} {w}?',f'{demonstrative(q[1])} {q[1]} '+adj(ru,gender(q[1]))+'?'),(f'That {su[2]} is not {w}.',f'{q[2].capitalize()} не '+adj(ru,gender(q[2]))+'.'),(f'I think the {su[3]} is {w}.',f'Я думаю, что {q[3]} '+adj(ru,gender(q[3]))+'.')]
    if k=='feeling':
        m,f,p=adj(ru),adj(ru,'f'),adj(ru,'p')
        return [(f'I am {w}.',f'Я {m} / {f}.'),(f'Are you {w}?',f'Ты {m} / {f}?'),(f'She is not {w}.',f'Она не {f}.'),(f'We were {w} yesterday.',f'Вчера мы были '+adj(ru,'p','inst')+'.')]
    if k=='colour':return [(f'The bag is {w}.',f'Сумка '+adj(ru,'f')+'.'),(f'Is your coat {w}?',f'Твоё пальто '+adj(ru,'n')+'?'),(f'I like {w}.',f'Мне нравится {ru} цвет.'),(f'Please give me the {w} pen.',f'Пожалуйста, дай мне '+adj(ru,'f','acc')+' ручку.')]
    if k=='dayname':
        ac=case(rn,'acc');last={'понедельник':'прошлый понедельник','вторник':'прошлый вторник','среда':'прошлую среду','четверг':'прошлый четверг','пятница':'прошлую пятницу','суббота':'прошлую субботу','воскресенье':'прошлое воскресенье'}[rn]
        prep='во' if rn=='вторник' else 'в'
        return [(f'I work on {w}.',f'Я работаю {prep} {ac}.'),(f'Are you free on {w}?',f'Ты свободен(-на) {prep} {ac}?'),(f'The shop is closed on {w}.',f'Магазин закрыт {prep} {ac}.'),(f'We met last {w}.',f'Мы встретились в {last}.')]
    if k=='monthname':return [(f'My birthday is in {w}.',f'Мой день рождения в {case(rn,"prep")}.'),(f'Is the shop open in {w}?',f'Магазин открыт в {case(rn,"prep")}?'),(f'We went there last {w}.',f'Мы были там в прошлом {case(rn,"prep")}.'),(f'I am going to travel in {w}.',f'Я собираюсь путешествовать в {case(rn,"prep")}.')]
    if k=='country':return [(f'I am from {w}.',f'Я из {gn}.'),(f'Do you live in {w}?',f'Ты живёшь в {pr}?'),(f'She went to {w}.',f'Она поехала в {ac}.'),(f'I am going to visit {w}.',f'Я собираюсь посетить {ac}.')]
    if k=='nationality':return [(f'This is {article(r["ipa"])} {w} book.',f'Это '+adj(ru,'f')+' книга.'),(f'I like {w} music.',f'Мне нравится '+adj(ru,'f')+' музыка.'),(f'We study {w} history.',f'Мы изучаем '+adj(ru,'f','acc')+' историю.'),(f'Is that {article(r["ipa"])} {w} name?',f'Это '+adj(ru,'n')+' имя?')]
    if k=='activity':return [(f'I like {w}.',f'Я люблю {ac}.'),(f'Do you like {w}?',f'Ты любишь {ac}?'),(f'We often talk about {w}.',f'Мы часто говорим о {pr}.'),(f'I want to learn about {w}.',f'Я хочу больше узнать о {pr}.')]
    if k in {'adverb','time'}:raise ValueError('Needs authored examples: '+w)
    raise ValueError('Unhandled kind: '+k)
