// Speech is a queue of typed content, never a scrape of page text or IPA.
export const LANGUAGES = ['fr-FR'];
export function cleanSpeech(text,lang) {
  if(String(lang).toLowerCase().replace('_','-')!=='fr-fr')throw new Error('Выберите французский голос Франции.');
  let value=String(text||'').normalize('NFC');
  if(/[А-Яа-яЁё]/.test(value))throw new Error('Во французском фрагменте осталось слово другого языка.');
  if(/[ɐ-ʯˈˌː̃]/.test(value))throw new Error('Транскрипция предназначена для чтения глазами.');
  return value.replace(/[\/\\|_*<>={}\[\]«»“”]/g,' ').replace(/[—–]/g,', ').replace(/\s+/g,' ').trim();
}
export function voiceFor(lang,voices,selectedURI='') {
  const normal=value=>String(value).toLowerCase().replace('_','-');
  if(normal(lang)!=='fr-fr')return null;
  const available=voices.filter(voice=>normal(voice.lang)==='fr-fr');
  return available.find(voice=>voice.voiceURI===selectedURI)||available.find(voice=>voice.localService)||available[0]||null;
}
export function segmentsFor(unit, mode = 'en', repeat = 1) {
  const p = unit.pair;
  const text=p?.en?cleanSpeech(p.speak||p.en,'fr-FR'):'';
  const chunks=[];
  // Short complete sentences keep long explanations responsive to pause/resume.
  for(const sentence of text.split(/(?<=[.!?])\s+/u)){
    if(!sentence)continue;
    if(sentence.length<=180){chunks.push(sentence);continue;}
    let chunk='';
    for(const word of sentence.split(/\s+/)){if(chunk&&chunk.length+word.length+1>180){chunks.push(chunk);chunk='';}chunk+=(chunk?' ':'')+word;}
    if(chunk)chunks.push(chunk);
  }
  const base=chunks.map(text=>({text,lang:'fr-FR',pair:p}));
  const list = Array.from({ length: Math.min(3, Math.max(1, repeat)) }, () => base).flat();
  return list;
}
export function secondsFor(unit, rate = 1, mode = 'en', repeat = 1) {
  return segmentsFor(unit, mode, repeat).reduce((sum, s) => {
    const words = s.text.match(/[\p{L}\p{N}]+(?:['’][\p{L}]+)?/gu)?.length || 1;
    // A transparent estimate, not a timer padded with repeated cards.
    return sum + Math.max(0.55, words * 60 / ((s.lang === 'ru-RU' ? 145 : 145) * rate)) + 0.45;
  }, 0);
}
export class SpeechPlayer {
  constructor({ synth = globalThis.speechSynthesis, Utterance = globalThis.SpeechSynthesisUtterance, voices = () => synth?.getVoices() || [], settings = () => ({ rate: 1, repeat: 1, voices: {} }), onChange = () => {}, onUnit = () => {}, onProgress = () => {}, now = () => performance.now() } = {}) {
    Object.assign(this, { synth, Utterance, voices, settings, onChange, onUnit, onProgress, now });
    this.units = []; this.unitIndex = 0; this.segmentIndex = 0; this.token = 0; this.status = 'idle';
    this.activeMs = 0; this.activeStart = 0; this.timer = null; this.gap = null; this.utterance = null; this.error = '';
  }
  elapsed() { return (this.activeMs + (this.status === 'playing' ? this.now() - this.activeStart : 0)) / 1000; }
  snapshot() { return { status: this.status, unitIndex: this.unitIndex, segmentIndex: this.segmentIndex, total: this.units.length, elapsed: this.elapsed(), error: this.error }; }
  emit() { this.onChange(this.snapshot()); }
  haltTimers() { clearTimeout(this.timer); clearTimeout(this.gap); this.timer = this.gap = null; }
  freeze() { if (this.status === 'playing') this.activeMs += this.now() - this.activeStart; }
  start(units, { mode = 'en', unitIndex = 0, segmentIndex = 0, elapsed = 0, loop = false, repeat } = {}) {
    this.stop(false);
    if (!this.synth || !this.Utterance) { this.fail('В этом браузере недоступна озвучка. Материал можно читать.'); return false; }
    this.units = units; this.mode = mode; this.loop = loop; this.repeat = repeat ?? this.settings().repeat ?? 1;
    this.unitIndex = Math.min(Math.max(0, unitIndex), units.length);
    this.segmentIndex = Math.max(0, segmentIndex); this.activeMs = elapsed * 1000; this.error = '';
    try {
      const required = new Set(units.flatMap(u => segmentsFor(u, mode, this.repeat).map(s => s.lang)));
      const missing = [...required].filter(lang => !voiceFor(lang, this.voices(), this.settings().voices?.[lang]));
      if (missing.length) { this.fail('Не найден ' + missing.map(l => ({ 'fr-FR': 'французский', 'ru-RU': 'русский' })[l] + ' голос').join(', ') + '. Добавьте французский голос Франции в настройках речи устройства и нажмите «Обновить голоса».'); return false; }
    } catch (e) { this.fail(e.message); return false; }
    if (!units.length || this.unitIndex === units.length) { this.status = 'ended'; this.emit(); return true; }
    this.status = 'playing'; this.activeStart = this.now(); this.emit(); this.next(); return true;
  }
  next() {
    if (this.status !== 'playing') return;
    if (this.unitIndex >= this.units.length) {
      if (this.loop) { this.unitIndex = 0; this.segmentIndex = 0; this.onProgress(this.snapshot()); }
      else { this.freeze(); this.status = 'ended'; this.emit(); this.onProgress(this.snapshot()); return; }
    }
    const unit = this.units[this.unitIndex];
    let segments;
    try { segments = segmentsFor(unit, this.mode, this.repeat); } catch (e) { this.fail(e.message); return; }
    if (this.segmentIndex >= segments.length) { this.unitIndex++; this.segmentIndex = 0; this.onProgress(this.snapshot()); this.next(); return; }
    const segment = segments[this.segmentIndex], cfg = this.settings();
    const voice = voiceFor(segment.lang, this.voices(), cfg.voices?.[segment.lang]);
    if (!voice) { this.fail('Нужный голос стал недоступен. Обновите список голосов.'); return; }
    let u;try{u=new this.Utterance(segment.text);}catch{this.fail('Не удалось подготовить озвучку. Место сохранено.');return;}
    const token=++this.token;
    this.utterance = u; u.lang = segment.lang; u.voice = voice; u.rate = Math.max(0.55, Math.min(1.5, cfg.rate || 1)); u.pitch = 1; u.volume = 1;
    this.onUnit(unit, this.unitIndex, segment); this.emit();
    u.onend = () => {
      if (token !== this.token || this.status !== 'playing') return;
      clearTimeout(this.timer); this.timer = null; this.segmentIndex++; this.onProgress(this.snapshot());
      this.gap = setTimeout(() => { this.gap = null; this.next(); }, 450);
    };
    u.onerror = e => {
      if (token !== this.token || this.status !== 'playing') return;
      this.fail('Браузер остановил голос: ' + ({ 'not-allowed': 'нужен повторный запуск кнопкой', 'network': 'нет связи с сервисом голоса', 'voice-unavailable': 'голос недоступен', 'audio-busy': 'звук занят другим приложением', 'synthesis-failed': 'не удалось прочитать фразу' }[e.error] || 'фраза не была дочитана') + '. Место сохранено; можно продолжить.');
    };
    const estimated = Math.max(8, segment.text.split(/\s+/).length * 60 / (95 * u.rate));
    this.timer = setTimeout(() => {
      if (token === this.token && this.status === 'playing') this.fail('Голос перестал отвечать. Место сохранено. Нажмите «Продолжить», чтобы повторить текущую фразу.');
    }, Math.min(180, estimated * 2 + 15) * 1000);
    try{this.synth.speak(u);}catch{this.fail('Не удалось начать озвучку. Место сохранено; повторите запуск.');}
  }
  pause() {
    if (this.status !== 'playing') return;
    this.freeze(); this.status = 'paused'; this.token++; this.haltTimers(); this.synth?.cancel(); this.emit(); this.onProgress(this.snapshot());
  }
  resume() {
    if (!['paused', 'error', 'stopped'].includes(this.status)) return;
    this.error = ''; this.status = 'playing'; this.activeStart = this.now(); this.emit(); this.next();
  }
  stop(persist = true) {
    this.freeze(); this.status = 'stopped'; this.token++; this.haltTimers(); this.synth?.cancel();
    if (persist) { this.emit(); this.onProgress(this.snapshot()); }
  }
  seek(unitIndex) {
    const play = this.status === 'playing'; this.pause(); this.token++; this.haltTimers(); this.synth?.cancel();
    this.unitIndex = Math.min(Math.max(0, unitIndex), this.units.length); this.segmentIndex = 0;
    if (play) { this.status = 'playing'; this.activeStart = this.now(); this.next(); } else this.emit();
    this.onProgress(this.snapshot());
  }
  fail(message) {
    this.freeze(); this.status = 'error'; this.error = message; this.token++; this.haltTimers(); this.synth?.cancel(); this.emit(); this.onProgress(this.snapshot());
  }
  dispose() { this.stop(false); }
}
