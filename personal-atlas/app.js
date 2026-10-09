(() => {
  'use strict';

  const METHODS = {
    hatha: { label: 'Хатха‑йога', short: 'ЙОГА' },
    tcm: { label: 'ТКМ', short: 'ТКМ' },
    yiquan: { label: 'Ицюань', short: 'ИЦЮАНЬ' },
    karate: { label: 'Каратэ · соло', short: 'КАРАТЭ' }
  };

  const PRACTICES = [
    {
      id: 'cat-cow', method: 'hatha', title: 'Марджариасана ↔ Битиласана', subtitle: 'Мягкая волна позвоночника на четвереньках',
      seconds: 90, animation: 'catCow', kind: 'body', stage: 'Двигайтесь медленно: вдох — раскрытие, выдох — округление.',
      tags: ['позвоночник','спина','поясница','шея','осанка','дыхание','разминка'],
      steps: ['Ладони под плечами, колени под тазом.', 'На вдохе мягко раскройте грудную клетку, не запрокидывая шею.', 'На выдохе плавно округлите спину; живот слегка подтяните.', 'Повторяйте без рывков в комфортной амплитуде.'],
      cues: ['Давление равномерно на обе ладони.', 'Плечи далеко от ушей.', 'Движение распределяйте по всей спине, а не только по пояснице.'],
      safety: 'Не уходите в крайние положения. При боли в запястьях подложите опору под ладони или сократите время.'
    },
    {
      id: 'sphinx', method: 'hatha', title: 'Саламба Бхуджангасана · Сфинкс', subtitle: 'Спокойное разгибание грудного отдела',
      seconds: 45, animation: 'sphinx', kind: 'body', stage: 'Локти под плечами. Подъём небольшой; поясница остаётся спокойной.',
      tags: ['позвоночник','спина','грудной отдел','осанка','дыхание'],
      steps: ['Лягте на живот, поставьте предплечья параллельно.', 'Локти примерно под плечами, макушка тянется вперёд‑вверх.', 'Слегка удлините живот и поясницу; не выталкивайте рёбра вперёд.', 'Дышите спокойно и выйдите из позы до появления дискомфорта.'],
      cues: ['Ягодицы без чрезмерного напряжения.', 'Лопатки мягко вниз.', 'Шея продолжает линию позвоночника.'],
      safety: 'При неприятных ощущениях в пояснице уменьшите подъём или пропустите позу. Сильная боль — повод прекратить практику.'
    },
    {
      id: 'si3', method: 'tcm', title: 'Хоу‑си · SI3', subtitle: 'Мягкий самомассаж точки на кисти',
      seconds: 80, animation: 'handPoint', kind: 'point', stage: 'Точка показана на наружном крае кисти, сразу позади сустава мизинца.',
      tags: ['позвоночник','шея','кисть','точка','самомассаж','ткм'],
      steps: ['Слегка согните кисть в кулак.', 'Найдите небольшой выступ на наружном ребре ладони позади основания мизинца.', 'Надавливайте подушечкой большого пальца другой руки мягко, без боли, около 30–40 секунд.', 'Повторите на другой руке.'],
      cues: ['Давление умеренное, кожа не должна неметь.', 'Дышите обычно.', 'Это традиционная практика ТКМ, а не способ лечения заболевания позвоночника.'],
      safety: 'Не давите на повреждённую, воспалённую или онемевшую кожу. Доказательность точечного массажа для лечения конкретных болезней ограничена.'
    },
    {
      id: 'lumbar-warm', method: 'tcm', title: 'Мягкое согревание поясницы', subtitle: 'Самомассаж вдоль мышц по обе стороны позвоночника',
      seconds: 120, animation: 'backMassage', kind: 'body', stage: 'Ладони работают по мышцам сбоку от позвоночника — не по костным выступам.',
      tags: ['позвоночник','поясница','спина','самомассаж','ткм','разминка'],
      steps: ['Разотрите ладони до приятного тепла.', 'Положите их на мышцы по обе стороны поясницы.', 'Выполняйте мягкие круговые движения или спокойное растирание вверх‑вниз.', 'Сила давления небольшая; дыхание свободное.'],
      cues: ['Не давите прямо на позвоночник.', 'Не массируйте участок с острой болью, отёком или травмой.', 'Цель — комфортное тепло и расслабление.'],
      safety: 'Это способ расслабления, а не лечение спины или внутренних органов. При сохраняющейся боли нужна медицинская оценка.'
    },
    {
      id: 'hunyuan', method: 'yiquan', title: 'Хуньюань чжуан', subtitle: 'Короткая стойка для вертикали и спокойного дыхания',
      seconds: 180, animation: 'zhan', kind: 'body', stage: 'Колени мягкие, макушка вверх, плечи вниз. Никакого терпения через боль.',
      tags: ['позвоночник','осанка','баланс','дыхание','стойка','ицюань','расслабление'],
      steps: ['Стопы примерно на ширине плеч, вес распределён ровно.', 'Колени слегка отпустите; таз и рёбра держите нейтрально.', 'Поднимите руки перед грудью, будто обнимаете большой мяч.', 'Стойте 2–3 минуты спокойно, без дрожи через силу.'],
      cues: ['Макушка тянется вверх, подбородок чуть назад.', 'Плечи и кисти мягкие.', 'Если ноги быстро устают — выпрямитесь и сократите время.'],
      safety: 'Не стремитесь к длительным удержаниям. При боли в коленях, спине, головокружении или онемении сразу прекратите стойку.'
    },
    {
      id: 'weight-shift', method: 'yiquan', title: 'Ши‑ли · мягкий перенос веса', subtitle: 'Контролируемое движение без скручивания поясницы',
      seconds: 120, animation: 'weightShift', kind: 'body', stage: 'Тело перемещается как единое целое. Амплитуда небольшая.',
      tags: ['позвоночник','баланс','осанка','координация','ицюань','дыхание'],
      steps: ['Встаньте устойчиво, колени оставьте мягкими.', 'Медленно перенесите больше веса на одну ногу, не заваливая таз.', 'Вернитесь через центр и перейдите на другую сторону.', 'Сохраняйте длинную спину и спокойное дыхание.'],
      cues: ['Колени смотрят примерно туда же, куда носки.', 'Голова не качается отдельно от корпуса.', 'Движение маленькое и плавное.'],
      safety: 'Держитесь рядом с устойчивой опорой, если баланс неуверенный. Не выполняйте через боль в коленях или голеностопе.'
    },
    {
      id: 'karate-align', method: 'karate', title: 'Сидзэнтай · нейтральная стойка', subtitle: 'Одиночная работа с осью тела и дыханием',
      seconds: 120, animation: 'karateAlign', kind: 'body', stage: 'Это только безопасная работа с осанкой и балансом — без ударов.',
      tags: ['позвоночник','осанка','баланс','дыхание','каратэ','соло'],
      steps: ['Встаньте естественно, стопы устойчиво на полу.', 'Слегка соберите нижние рёбра над тазом, не втягивая живот силой.', 'Макушка вверх, плечи свободны, взгляд прямо.', 'Сделайте несколько спокойных циклов дыхания, сохраняя эту ось.'],
      cues: ['Не прогибайте поясницу.', 'Не блокируйте колени.', 'Положение должно быть устойчивым и обычным, без жёсткого напряжения.'],
      safety: 'Это не боевая техника и не тренировка ударов. Задача — нейтральная стойка, координация и контроль корпуса.'
    },
    {
      id: 'karate-turn', method: 'karate', title: 'Мягкий разворот корпуса в стойке', subtitle: 'Соло‑координация без удара и резкого скручивания',
      seconds: 90, animation: 'karateTurn', kind: 'body', stage: 'Таз и грудная клетка разворачиваются плавно; движение не до крайней точки.',
      tags: ['позвоночник','грудной отдел','координация','каратэ','соло','разминка'],
      steps: ['Встаньте в удобную широкую, но не глубокую стойку.', 'Оставляя колени мягкими, поверните грудную клетку немного вправо.', 'Вернитесь в центр и так же мягко повернитесь влево.', 'Двигайтесь медленно; руки держите расслабленно перед корпусом.'],
      cues: ['Таз не должен резко фиксироваться.', 'Не выкручивайте поясницу.', 'Амплитуда меньше важна, чем плавность.'],
      safety: 'Никаких ударов, резких рывков и глубоких стоек. При боли в спине или коленях прекратите упражнение.'
    }
  ];

  const PURPOSES = [
    { id:'spine', icon:'⌇', label:'Позвоночник', terms:['позвоночник','спина','поясница','грудной отдел'] },
    { id:'neck', icon:'◌', label:'Шея и плечи', terms:['шея','плечи'] },
    { id:'breath', icon:'≈', label:'Дыхание', terms:['дыхание'] },
    { id:'balance', icon:'◇', label:'Баланс и осанка', terms:['баланс','осанка'] },
    { id:'digestion', icon:'○', label:'Пищеварение', terms:['пищеварение'] },
    { id:'vision', icon:'◉', label:'Зрение и отдых глаз', terms:['зрение','глаза'] },
    { id:'cold', icon:'✣', label:'Самочувствие при простуде', terms:['простуда'] },
    { id:'sleep', icon:'☾', label:'Сон и успокоение', terms:['сон','расслабление'] }
  ];

  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const gate = $('#gate');
  const app = $('#app');
  const gateForm = $('#gate-form');
  const gatePassword = $('#gate-password');
  const gateCopy = $('#gate-copy');
  const gateSubmit = $('#gate-submit');
  const gateStatus = $('#gate-status');
  const resetPassword = $('#reset-password');
  const VERIFIER_KEY = 'syolana.atlas.verifier.v1';
  const AUTH_KEY = 'syolana.atlas.auth.v1';
  let gateMode = 'login';

  const b64 = bytes => btoa(String.fromCharCode(...bytes));
  const unb64 = str => Uint8Array.from(atob(str), c => c.charCodeAt(0));
  async function derive(password, salt){
    if (!crypto?.subtle) throw new Error('Web Crypto unavailable');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({name:'PBKDF2', hash:'SHA-256', salt, iterations:120000}, key, 256);
    return b64(new Uint8Array(bits));
  }
  function readVerifier(){
    try { return JSON.parse(localStorage.getItem(VERIFIER_KEY) || 'null'); } catch { return null; }
  }
  function configureGate(){
    const has = !!readVerifier();
    gateMode = has ? 'login' : 'setup';
    gateCopy.textContent = has ? 'Введите локальный пароль этого браузера.' : 'Первый вход: придумайте пароль от 6 символов. Он останется только в этом браузере.';
    gateSubmit.textContent = has ? 'Открыть' : 'Создать пароль и открыть';
    resetPassword.hidden = !has;
    gatePassword.value = '';
    gateStatus.textContent = '';
    setTimeout(() => gatePassword.focus(), 50);
  }
  function unlock(){
    sessionStorage.setItem(AUTH_KEY, '1');
    gate.hidden = true;
    app.hidden = false;
    document.body.classList.remove('locked-scroll');
    initAtlas();
  }
  async function submitGate(ev){
    ev.preventDefault();
    const password = gatePassword.value;
    gateStatus.textContent = '';
    if (password.length < 6){ gateStatus.textContent = 'Минимум 6 символов.'; return; }
    gateSubmit.disabled = true;
    try{
      if (gateMode === 'setup'){
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const hash = await derive(password, salt);
        localStorage.setItem(VERIFIER_KEY, JSON.stringify({salt:b64(salt), hash, v:1}));
        unlock();
      } else {
        const v = readVerifier();
        const hash = await derive(password, unb64(v.salt));
        if (hash !== v.hash){ gateStatus.textContent = 'Пароль не подходит.'; return; }
        unlock();
      }
    } catch (err){
      gateStatus.textContent = 'Не удалось проверить пароль в этом браузере.';
      console.error(err);
    } finally { gateSubmit.disabled = false; }
  }
  gateForm.addEventListener('submit', submitGate);
  $('#password-toggle').addEventListener('click', () => {
    gatePassword.type = gatePassword.type === 'password' ? 'text' : 'password';
  });
  resetPassword.addEventListener('click', () => {
    if (!confirm('Сбросить локальный пароль на этом устройстве?')) return;
    localStorage.removeItem(VERIFIER_KEY);
    sessionStorage.removeItem(AUTH_KEY);
    configureGate();
  });

  if (sessionStorage.getItem(AUTH_KEY) === '1') unlock();
  else { document.body.classList.add('locked-scroll'); configureGate(); }

  let initialized = false;
  let currentMethod = 'all';
  let currentPurpose = 'spine';
  let query = '';
  let selected = PRACTICES[0];
  let remaining = selected.seconds;
  let running = false;
  let deadline = 0;
  let lastSecond = -1;
  let yaw = .16;
  let pitch = -.05;
  let dragX = null;
  let animClock = 0;
  let lastFrame = performance.now();

  const catalog = $('#catalog');
  const emptyState = $('#empty-state');
  const search = $('#search');
  const stage = $('#stage');
  const ctx = stage.getContext('2d');
  const timerEl = $('#timer');
  const playBtn = $('#play');

  function initAtlas(){
    if (initialized) return;
    initialized = true;
    renderPurposes();
    bindTabs();
    bindControls();
    renderCatalog();
    selectPractice(PRACTICES[0].id);
    resizeStage();
    requestAnimationFrame(loop);
  }

  function normalizedText(p){
    return [p.title,p.subtitle,METHODS[p.method].label,...p.tags,...p.steps,...p.cues].join(' ').toLowerCase().replace(/ё/g,'е');
  }
  function matchesPurpose(p, id){
    if (!id || id === 'all') return true;
    const purpose = PURPOSES.find(x => x.id === id);
    if (!purpose) return true;
    const hay = normalizedText(p);
    return purpose.terms.some(t => hay.includes(t.toLowerCase().replace(/ё/g,'е')));
  }
  function filtered(){
    const q = query.trim().toLowerCase().replace(/ё/g,'е');
    return PRACTICES.filter(p => {
      if (currentMethod !== 'all' && p.method !== currentMethod) return false;
      if (currentPurpose && !matchesPurpose(p, currentPurpose)) return false;
      if (q && !normalizedText(p).includes(q)) return false;
      return true;
    });
  }
  function renderCatalog(){
    const items = filtered();
    $('#result-count').textContent = items.length;
    catalog.innerHTML = items.map(p => `
      <button class="practice-card ${selected?.id===p.id?'active':''}" type="button" data-id="${p.id}">
        <span class="meta"><span class="method-dot">${METHODS[p.method].short}</span><span class="time">${formatTime(p.seconds)}</span></span>
        <strong>${p.title}</strong><p>${p.subtitle}</p>
      </button>`).join('');
    emptyState.hidden = !!items.length;
    catalog.hidden = !items.length;
    $$('.practice-card', catalog).forEach(btn => btn.addEventListener('click', () => selectPractice(btn.dataset.id)));
  }
  function renderPurposes(){
    const chips = $('#purpose-chips');
    chips.innerHTML = `<button class="chip" type="button" data-purpose="all">Все</button>` + PURPOSES.slice(0,4).map(p => `<button class="chip ${p.id==='spine'?'active':''}" type="button" data-purpose="${p.id}">${p.label}</button>`).join('');
    const grid = $('#purpose-grid');
    grid.innerHTML = PURPOSES.map(p => {
      const count = PRACTICES.filter(x => matchesPurpose(x,p.id)).length;
      return `<button class="purpose-card" type="button" data-purpose="${p.id}"><span class="icon">${p.icon}</span><strong>${p.label}</strong><small>${count ? `${count} готовых карточек` : 'раздел подготовлен к наполнению'}</small></button>`;
    }).join('');
    $$('[data-purpose]').forEach(btn => btn.addEventListener('click', () => {
      currentPurpose = btn.dataset.purpose === 'all' ? null : btn.dataset.purpose;
      query = ''; search.value = '';
      syncPurposeUI(); renderCatalog();
      if (filtered()[0]) selectPractice(filtered()[0].id);
      document.querySelector('.practice-layout').scrollIntoView({behavior:'smooth',block:'start'});
    }));
  }
  function syncPurposeUI(){
    $$('.chip').forEach(x => x.classList.toggle('active', (x.dataset.purpose==='all'&&!currentPurpose)||x.dataset.purpose===currentPurpose));
    const purpose = PURPOSES.find(x=>x.id===currentPurpose);
    $('#catalog-title').textContent = purpose ? purpose.label : 'Все практики';
  }
  function bindTabs(){
    $$('#method-tabs button').forEach(btn => btn.addEventListener('click', () => {
      currentMethod = btn.dataset.method;
      $$('#method-tabs button').forEach(x => x.classList.toggle('active', x===btn));
      renderCatalog();
      if (filtered()[0]) selectPractice(filtered()[0].id);
    }));
    search.addEventListener('input', () => {
      query = search.value;
      currentPurpose = null; syncPurposeUI(); renderCatalog();
      if (filtered()[0]) selectPractice(filtered()[0].id);
    });
  }
  function bindControls(){
    $('#focus-toggle').addEventListener('click', e => {
      const on = document.body.classList.toggle('focus-mode');
      e.currentTarget.setAttribute('aria-pressed', String(on));
      setTimeout(resizeStage, 60);
    });
    $('#lock-now').addEventListener('click', () => { sessionStorage.removeItem(AUTH_KEY); location.reload(); });
    $$('.view-actions [data-view]').forEach(btn => btn.addEventListener('click', () => {
      yaw = btn.dataset.view === 'front' ? 0 : btn.dataset.view === 'side' ? Math.PI/2 : Math.PI;
    }));
    playBtn.addEventListener('click', toggleTimer);
    $('#minus-time').addEventListener('click', () => adjustTime(-30));
    $('#plus-time').addEventListener('click', () => adjustTime(30));
    stage.addEventListener('pointerdown', e => { dragX = e.clientX; stage.setPointerCapture?.(e.pointerId); });
    stage.addEventListener('pointermove', e => { if (dragX == null) return; const dx=e.clientX-dragX; yaw += dx*.009; dragX=e.clientX; });
    const stop = () => dragX = null;
    stage.addEventListener('pointerup', stop); stage.addEventListener('pointercancel', stop); stage.addEventListener('pointerleave', stop);
    window.addEventListener('resize', resizeStage, {passive:true});
  }
  function selectPractice(id){
    const p = PRACTICES.find(x => x.id === id); if (!p) return;
    selected = p; running = false; remaining = p.seconds; lastSecond=-1; playBtn.textContent='Начать';
    $('#viewer-kicker').textContent = METHODS[p.method].label.toUpperCase();
    $('#viewer-title').textContent = p.title;
    $('#stage-label').textContent = p.stage;
    $('#steps').innerHTML = p.steps.map(x=>`<li>${x}</li>`).join('');
    $('#cues').innerHTML = p.cues.map(x=>`<li>${x}</li>`).join('');
    $('#safety-note').textContent = p.safety;
    updateTimerText(); renderCatalog();
  }
  function formatTime(sec){ const s=Math.max(0,Math.ceil(sec)); return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`; }
  function updateTimerText(){ timerEl.textContent=formatTime(remaining); }
  function toggleTimer(){
    if (running){ remaining=Math.max(0,(deadline-performance.now())/1000); running=false; playBtn.textContent='Продолжить'; return; }
    if (remaining<=0) remaining=selected.seconds;
    running=true; deadline=performance.now()+remaining*1000; playBtn.textContent='Пауза';
  }
  function adjustTime(delta){
    remaining=Math.max(15,Math.min(1200,remaining+delta));
    if (running) deadline=performance.now()+remaining*1000;
    updateTimerText();
  }
  function finishTimer(){
    running=false; remaining=0; playBtn.textContent='Повторить'; updateTimerText();
    try{ const ac=new (window.AudioContext||window.webkitAudioContext)(); const o=ac.createOscillator(); const g=ac.createGain(); o.frequency.value=660; g.gain.setValueAtTime(.0001,ac.currentTime); g.gain.exponentialRampToValueAtTime(.12,ac.currentTime+.02); g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+.32); o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime+.34); }catch{}
  }

  function resizeStage(){
    if (!app || app.hidden) return;
    const rect=stage.getBoundingClientRect(); if(!rect.width) return;
    const dpr=Math.min(2,window.devicePixelRatio||1); const h=Math.max(360,Math.min(640,rect.width*.69));
    stage.style.height=h+'px'; stage.width=Math.round(rect.width*dpr); stage.height=Math.round(h*dpr); ctx.setTransform(dpr,0,0,dpr,0,0);
  }

  function standingBase(){
    return {
      head:[0,2.45,0], neck:[0,1.98,0], shoulderL:[-.58,1.78,0], shoulderR:[.58,1.78,0],
      elbowL:[-.76,1.12,.05], elbowR:[.76,1.12,.05], wristL:[-.72,.52,.05], wristR:[.72,.52,.05],
      hipL:[-.31,.72,0], hipR:[.31,.72,0], kneeL:[-.34,-.32,.03], kneeR:[.34,-.32,.03], ankleL:[-.36,-1.35,0], ankleR:[.36,-1.35,0],
      spine0:[0,.72,0], spine1:[0,1.12,0], spine2:[0,1.52,0], spine3:[0,1.9,0]
    };
  }
  const cp = obj => Object.fromEntries(Object.entries(obj).map(([k,v])=>[k,[...v]]));
  function poseFor(type,t){
    const b=standingBase();
    if(type==='zhan'){
      const breathe=Math.sin(t*Math.PI*2)*.04;
      b.elbowL=[-.72,1.35,.45+breathe]; b.elbowR=[.72,1.35,.45+breathe]; b.wristL=[-.47,1.3,.82+breathe]; b.wristR=[.47,1.3,.82+breathe];
      b.kneeL[1]=b.kneeR[1]=-.22; b.head[1]+=breathe*.2;
    } else if(type==='weightShift'){
      const s=Math.sin(t*Math.PI*2)*.22; Object.values(b).forEach(p=>p[0]+=s*(p[1]>.5?1:.45));
      b.kneeL[1]-=Math.max(0,s)*.16; b.kneeR[1]-=Math.max(0,-s)*.16;
      b.elbowL=[-.67,1.25,.35]; b.elbowR=[.67,1.25,.35]; b.wristL=[-.46,.98,.65]; b.wristR=[.46,.98,.65];
    } else if(type==='karateAlign'){
      const breathe=Math.sin(t*Math.PI*2)*.025; b.shoulderL[1]+=breathe; b.shoulderR[1]+=breathe; b.spine2[1]+=breathe;
      b.elbowL=[-.52,1.15,.12]; b.elbowR=[.52,1.15,.12]; b.wristL=[-.38,.82,.3]; b.wristR=[.38,.82,.3];
    } else if(type==='karateTurn'){
      const a=Math.sin(t*Math.PI*2)*.38;
      ['shoulderL','shoulderR','elbowL','elbowR','wristL','wristR','neck','head','spine2','spine3'].forEach(k=>{ const p=b[k],x=p[0],z=p[2]; p[0]=x*Math.cos(a)-z*Math.sin(a); p[2]=x*Math.sin(a)+z*Math.cos(a); });
      b.kneeL[1]=b.kneeR[1]=-.24;
    }
    if(type==='catCow'){
      const s=Math.sin(t*Math.PI*2), arch=s*.18;
      return {
        head:[0,.85,1.05+arch*.7],neck:[0,.72,.72],shoulderL:[-.48,.52,.42],shoulderR:[.48,.52,.42],
        elbowL:[-.5,-.05,.48],elbowR:[.5,-.05,.48],wristL:[-.5,-.65,.58],wristR:[.5,-.65,.58],
        hipL:[-.38,.48,-.72],hipR:[.38,.48,-.72],kneeL:[-.4,-.58,-.7],kneeR:[.4,-.58,-.7],ankleL:[-.4,-.62,-1.28],ankleR:[.4,-.62,-1.28],
        spine0:[0,.48,-.72],spine1:[0,.46+arch,-.35],spine2:[0,.48+arch*1.6,.05],spine3:[0,.52,.42]
      };
    }
    if(type==='sphinx'){
      const breathe=Math.sin(t*Math.PI*2)*.03;
      return {
        head:[0,.72+breathe,1.12],neck:[0,.47+breathe,.88],shoulderL:[-.52,.24,.56],shoulderR:[.52,.24,.56],
        elbowL:[-.52,-.52,.45],elbowR:[.52,-.52,.45],wristL:[-.52,-.58,1.08],wristR:[.52,-.58,1.08],
        hipL:[-.34,-.46,-.56],hipR:[.34,-.46,-.56],kneeL:[-.32,-.65,-1.28],kneeR:[.32,-.65,-1.28],ankleL:[-.31,-.72,-2.08],ankleR:[.31,-.72,-2.08],
        spine0:[0,-.46,-.56],spine1:[0,-.28,-.2],spine2:[0,-.02,.2],spine3:[0,.24,.56]
      };
    }
    if(type==='backMassage'){
      const s=Math.sin(t*Math.PI*2)*.09;
      b.elbowL=[-.7,.92,-.08]; b.elbowR=[.7,.92,-.08]; b.wristL=[-.34,.72,-.32+s]; b.wristR=[.34,.72,-.32-s];
    }
    return b;
  }

  function loop(now){
    if (!initialized) return;
    const dt=Math.min(.05,(now-lastFrame)/1000); lastFrame=now;
    if(running){
      animClock += dt*.18;
      remaining=Math.max(0,(deadline-now)/1000);
      const whole=Math.ceil(remaining); if(whole!==lastSecond){ lastSecond=whole; updateTimerText(); }
      if(remaining<=0) finishTimer();
    }
    drawStage(animClock%1);
    requestAnimationFrame(loop);
  }

  function project(p,w,h){
    let [x,y,z]=p;
    const cy=Math.cos(yaw),sy=Math.sin(yaw); const x1=x*cy-z*sy, z1=x*sy+z*cy;
    const cp=Math.cos(pitch),sp=Math.sin(pitch); const y1=y*cp-z1*sp, z2=y*sp+z1*cp;
    const f=Math.min(w,h)*1.08/(4.2-z2*.25);
    return {x:w/2+x1*f,y:h*.57-y1*f,z:z2,f};
  }
  function drawSegment(a,b,width,w,h,alpha=1){
    const pa=project(a,w,h), pb=project(b,w,h); const depth=(pa.z+pb.z)*.5;
    ctx.save(); ctx.lineCap='round'; ctx.lineWidth=Math.max(5,width*((pa.f+pb.f)*.5)/170); const light=Math.max(135,Math.min(235,190+depth*22));
    const grad=ctx.createLinearGradient(pa.x,pa.y,pb.x,pb.y); grad.addColorStop(0,`rgba(${light+18},${light},${Math.min(255,light+30)},${alpha})`); grad.addColorStop(1,`rgba(${Math.max(100,light-25)},${Math.max(95,light-32)},${light},${alpha})`); ctx.strokeStyle=grad; ctx.shadowColor='rgba(181,139,235,.18)'; ctx.shadowBlur=12; ctx.beginPath(); ctx.moveTo(pa.x,pa.y);ctx.lineTo(pb.x,pb.y);ctx.stroke();ctx.restore();
  }
  function drawJoint(p,r,w,h,fill='rgba(238,226,255,.95)'){
    const q=project(p,w,h); ctx.save(); ctx.fillStyle=fill; ctx.shadowColor='rgba(196,156,245,.3)'; ctx.shadowBlur=12; ctx.beginPath(); ctx.arc(q.x,q.y,Math.max(3,r*q.f/170),0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawBody(p,w,h){
    const segs=[['shoulderL','elbowL',24],['elbowL','wristL',20],['shoulderR','elbowR',24],['elbowR','wristR',20],['hipL','kneeL',31],['kneeL','ankleL',27],['hipR','kneeR',31],['kneeR','ankleR',27],['neck','head',28],['spine0','spine1',34],['spine1','spine2',38],['spine2','spine3',35]];
    const ordered=segs.map(s=>({s,z:(project(p[s[0]],w,h).z+project(p[s[1]],w,h).z)/2})).sort((a,b)=>a.z-b.z);
    ordered.forEach(({s})=>drawSegment(p[s[0]],p[s[1]],s[2],w,h));
    drawSegment(p.shoulderL,p.shoulderR,38,w,h,.88); drawSegment(p.hipL,p.hipR,44,w,h,.88);
    const head=project(p.head,w,h); ctx.save();ctx.fillStyle='rgba(231,219,247,.96)';ctx.shadowColor='rgba(193,150,244,.3)';ctx.shadowBlur=18;ctx.beginPath();ctx.ellipse(head.x,head.y,Math.max(14,head.f*.11),Math.max(18,head.f*.145),0,0,Math.PI*2);ctx.fill();ctx.restore();
    ['shoulderL','shoulderR','elbowL','elbowR','wristL','wristR','hipL','hipR','kneeL','kneeR','ankleL','ankleR'].forEach(k=>drawJoint(p[k],10,w,h));
    const spine=['spine0','spine1','spine2','spine3'].map(k=>project(p[k],w,h)); ctx.save();ctx.strokeStyle='rgba(145,217,210,.9)';ctx.lineWidth=3;ctx.shadowColor='rgba(145,217,210,.55)';ctx.shadowBlur=9;ctx.beginPath();spine.forEach((q,i)=>i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y));ctx.stroke();ctx.restore();
  }
  function drawPointMarker(p,w,h,label){
    const q=project(p,w,h); const pulse=1+Math.sin(animClock*Math.PI*2)*.12; ctx.save();ctx.strokeStyle='rgba(145,217,210,.95)';ctx.fillStyle='rgba(145,217,210,.18)';ctx.lineWidth=2;ctx.shadowColor='rgba(145,217,210,.8)';ctx.shadowBlur=16;ctx.beginPath();ctx.arc(q.x,q.y,13*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#e9fffc';ctx.font='700 12px Nunito, sans-serif';ctx.fillText(label,q.x+19,q.y+4);ctx.restore();
  }
  function drawHandDemo(w,h){
    ctx.save(); ctx.translate(w/2,h/2+20); const s=Math.min(w,h)/520; ctx.scale(s,s); ctx.rotate(-.12);
    ctx.fillStyle='rgba(224,213,240,.93)'; ctx.strokeStyle='rgba(255,255,255,.24)'; ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-95,150);ctx.quadraticCurveTo(-120,45,-78,-40);ctx.quadraticCurveTo(-66,-70,-72,-145);ctx.quadraticCurveTo(-70,-188,-45,-190);ctx.quadraticCurveTo(-22,-188,-20,-150);ctx.lineTo(-17,-70);ctx.lineTo(-10,-220);ctx.quadraticCurveTo(-8,-255,17,-254);ctx.quadraticCurveTo(40,-252,42,-218);ctx.lineTo(38,-70);ctx.lineTo(55,-205);ctx.quadraticCurveTo(58,-238,80,-235);ctx.quadraticCurveTo(102,-232,100,-199);ctx.lineTo(83,-55);ctx.quadraticCurveTo(120,-115,144,-98);ctx.quadraticCurveTo(161,-84,145,-55);ctx.lineTo(90,45);ctx.quadraticCurveTo(72,91,65,155);ctx.closePath();ctx.fill();ctx.stroke();
    const mx=-84,my=-22; const pulse=1+Math.sin(animClock*Math.PI*2)*.12;ctx.shadowColor='rgba(145,217,210,.95)';ctx.shadowBlur=22;ctx.fillStyle='rgba(145,217,210,.22)';ctx.strokeStyle='#9be0d9';ctx.lineWidth=3;ctx.beginPath();ctx.arc(mx,my,16*pulse,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.shadowBlur=0;ctx.fillStyle='#f0fffd';ctx.font='800 18px Nunito, sans-serif';ctx.fillText('SI3 · Хоу‑си',mx+27,my+6);ctx.restore();
  }
  function drawStage(t){
    const dpr=Math.min(2,window.devicePixelRatio||1); const w=stage.width/dpr,h=stage.height/dpr; ctx.clearRect(0,0,w,h);
    const grd=ctx.createRadialGradient(w*.5,h*.34,10,w*.5,h*.5,Math.max(w,h)*.65);grd.addColorStop(0,'rgba(76,62,108,.34)');grd.addColorStop(.52,'rgba(14,14,31,.18)');grd.addColorStop(1,'rgba(4,4,11,.05)');ctx.fillStyle=grd;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.strokeStyle='rgba(255,255,255,.035)';ctx.lineWidth=1;for(let i=1;i<8;i++){ctx.beginPath();ctx.moveTo(w*i/8,h*.82);ctx.lineTo(w*.5,h*.55);ctx.stroke();}for(let y=h*.64;y<h*.93;y+=38){ctx.beginPath();ctx.moveTo(w*.08,y);ctx.lineTo(w*.92,y);ctx.stroke();}ctx.restore();
    if(selected.kind==='point') return drawHandDemo(w,h);
    const p=poseFor(selected.animation,t);
    drawBody(p,w,h);
    if(selected.animation==='backMassage'){
      drawPointMarker([-.34,.72,-.38],w,h,'мягко'); drawPointMarker([.34,.72,-.38],w,h,'мягко');
    }
  }
})();