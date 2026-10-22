const $ = selector => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const idle = $('#kk-idle');
const orbit = $('#kk-orbit');
const stage = $('#kk-cinema');
const ROOT = '/partner-demo/sample/';
const state = {zen: false, paused: reduced, view: 'idle', busy: false, scene: 0, sound: false};
const sceneNames = ['Розовое золото', 'Лавандовый свет', 'Тёплый свет'];
let generation = 0, audio, audioGain, pointer;

function announce(message) { $('#kk-status').textContent = message; }
function currentVideo() { return state.view === 'orbit' ? orbit : idle; }
function syncControls() {
  document.body.dataset.view = state.view;
  stage.setAttribute('aria-busy', String(state.busy));
  for (const button of document.querySelectorAll('[data-cinema-orbit]')) {
    button.disabled = state.busy;
    button.setAttribute('aria-pressed', String(state.view === 'orbit'));
  }
  for (const button of document.querySelectorAll('[data-cinema-pause]')) {
    button.setAttribute('aria-pressed', String(state.paused));
    button.textContent = state.paused ? 'Продолжить' : 'Пауза';
  }
  $('#kk-cinema-label').textContent = state.view === 'orbit' ? 'Павильон · Другой ракурс' : 'Павильон · Живой портрет';
}
function waitForMedia(video) {
  if (video.readyState >= 2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('media timeout')), 12000);
    const ready = () => finish();
    const error = () => finish(new Error('media unavailable'));
    function finish(problem) {
      clearTimeout(timer);
      video.removeEventListener('loadeddata', ready);
      video.removeEventListener('error', error);
      problem ? reject(problem) : resolve();
    }
    video.addEventListener('loadeddata', ready, {once: true});
    video.addEventListener('error', error, {once: true});
    if (video.preload !== 'auto') { video.preload = 'auto'; video.load(); }
  });
}
async function play(video) {
  await waitForMedia(video);
  if (!state.paused && !document.hidden) await video.play();
}
function setZen(on) {
  state.zen = on;
  document.body.classList.toggle('zen', on);
  $('#zen-toggle').setAttribute('aria-pressed', String(on));
  $('#kk-exit').hidden = !on;
  $('#kk-flight').hidden = !on;
  for (const item of document.querySelectorAll('[data-kk-chrome]')) item.inert = on;
  (on ? $('#kk-exit') : $('#zen-toggle')).focus();
  announce(on ? 'Созерцание. Проведите пальцем влево, чтобы сменить ракурс, вправо — чтобы вернуться.' : 'Интерфейс возвращён.');
}
function setScene(index) {
  state.scene = index;
  document.documentElement.dataset.atmosphere = String(index);
  for (const button of document.querySelectorAll('[data-scene]')) button.setAttribute('aria-pressed', String(+button.dataset.scene === index));
  for (const name of document.querySelectorAll('[data-scene-name]')) name.textContent = sceneNames[index];
  announce('Атмосфера: ' + sceneNames[index]);
}
async function showIdle() {
  const token = ++generation;
  state.busy = true;
  syncControls();
  try {
    await waitForMedia(idle);
    if (token !== generation) return;
    state.view = 'idle';
    orbit.classList.remove('is-visible');
    idle.classList.add('is-visible');
    syncControls();
    try { await play(idle); }
    catch (error) { if (error.name !== 'AbortError') throw error; }
    await new Promise(resolve => setTimeout(resolve, reduced ? 0 : 650));
    if (token !== generation) return;
    orbit.pause();
    state.busy = false;
    syncControls();
  } catch {
    if (token !== generation) return;
    state.busy = false;
    state.paused = true;
    syncControls();
    announce('Нажмите «Продолжить», чтобы запустить сцену.');
  }
}
async function showOrbit() {
  if (state.busy) return;
  const token = ++generation;
  state.busy = true;
  state.paused = false;
  syncControls();
  try {
    await waitForMedia(orbit);
    if (token !== generation) return;
    orbit.currentTime = 0;
    state.view = 'orbit';
    orbit.classList.add('is-visible');
    syncControls();
    try { await play(orbit); }
    catch (error) { if (error.name !== 'AbortError') throw error; }
    if (token !== generation) return;
    setTimeout(() => { if (token === generation) idle.pause(); }, reduced ? 0 : 650);
    announce('Камера облетает павильон. Затем вернётся живой портрет.');
  } catch {
    if (token !== generation) return;
    state.busy = false;
    state.view = 'idle';
    orbit.classList.remove('is-visible');
    idle.classList.add('is-visible');
    play(idle).catch(() => {});
    syncControls();
    announce('Ракурс пока не загрузился. Попробуйте ещё раз.');
  }
}
orbit.addEventListener('ended', showIdle);
idle.addEventListener('playing', () => {
  document.body.classList.add('kk-media-ready');
  $('#kk-play-prompt').hidden = true;
});
idle.addEventListener('error', () => {
  $('#kk-play-prompt').hidden = false;
  announce('Движение временно недоступно. Можно повторить запуск; материалы страницы открыты.');
});
async function togglePause() {
  state.paused = !state.paused;
  syncControls();
  if (state.paused) { idle.pause(); orbit.pause(); }
  else {
    try { await play(currentVideo()); }
    catch (error) { if (error.name === 'AbortError') return; state.paused = true; $('#kk-play-prompt').hidden = false; syncControls(); announce('Не удалось запустить видео. Повторите нажатие.'); }
  }
}
for (const button of document.querySelectorAll('[data-cinema-orbit]')) button.addEventListener('click', showOrbit);
for (const button of document.querySelectorAll('[data-cinema-home]')) button.addEventListener('click', showIdle);
for (const button of document.querySelectorAll('[data-cinema-pause]')) button.addEventListener('click', togglePause);
$('#kk-play-prompt').addEventListener('click', async () => { state.paused = false; syncControls(); await showIdle(); });
$('#zen-toggle').addEventListener('click', () => setZen(!state.zen));
$('#kk-exit').addEventListener('click', () => setZen(false));
$('#kk-enter').addEventListener('click', () => {
  setZen(true);
  state.paused = false;
  syncControls();
  play(currentVideo()).catch(() => { $('#kk-play-prompt').hidden = false; });
});
for (const button of document.querySelectorAll('[data-scene]')) button.addEventListener('click', () => { setScene(+button.dataset.scene); button.closest('dialog')?.close(); });

$('#fullscreen').addEventListener('click', async () => {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
    else { setZen(true); announce('Включён просмотр без интерфейса.'); }
  } catch { setZen(true); }
});
document.addEventListener('fullscreenchange', () => $('#fullscreen').setAttribute('aria-pressed', String(!!document.fullscreenElement)));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.zen) setZen(false);
  if (!state.zen || event.target.closest('button,a,input,select,textarea,dialog')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); showOrbit(); }
  if (event.key === 'ArrowRight') { event.preventDefault(); showIdle(); }
  if (event.key === ' ') { event.preventDefault(); togglePause(); }
});
document.addEventListener('pointerdown', event => {
  if (!state.zen || event.target.closest('button,a,dialog')) return;
  pointer = {id: event.pointerId, x: event.clientX, y: event.clientY};
});
document.addEventListener('pointerup', event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y;
  pointer = null;
  if (Math.abs(dx) < 45 || Math.abs(dx) < Math.abs(dy)) return;
  dx < 0 ? showOrbit() : showIdle();
});
document.addEventListener('pointercancel', () => { pointer = null; });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { idle.pause(); orbit.pause(); audio?.suspend(); }
  else { play(currentVideo()).catch(() => {}); if (state.sound) audio?.resume(); }
});
window.addEventListener('pagehide', () => { idle.pause(); orbit.pause(); audio?.suspend(); });
window.addEventListener('pageshow', () => { play(currentVideo()).catch(() => {}); });

$('#ambient-toggle').addEventListener('click', () => {
  if (!audio) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) { announce('Звук в этом браузере недоступен.'); return; }
    audio = new Context();
    audioGain = audio.createGain(); audioGain.gain.value = 0; audioGain.connect(audio.destination);
    for (const frequency of [130.81, 196, 261.63]) {
      const oscillator = audio.createOscillator(), gain = audio.createGain();
      oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.value = .06;
      oscillator.connect(gain); gain.connect(audioGain); oscillator.start();
    }
  }
  state.sound = !state.sound;
  if (state.sound) audio.resume();
  audioGain.gain.setTargetAtTime(state.sound ? .22 : 0, audio.currentTime, .3);
  $('#ambient-toggle').setAttribute('aria-pressed', String(state.sound));
  announce(state.sound ? 'Включён звук атмосферы.' : 'Звук выключен.');
});
for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
  for (const item of document.querySelectorAll('[data-filter]')) item.setAttribute('aria-pressed', String(item === button));
  for (const post of document.querySelectorAll('[data-category]')) post.hidden = button.dataset.filter !== 'all' && post.dataset.category !== button.dataset.filter;
});
for (const button of document.querySelectorAll('[data-kk-dialog]')) button.addEventListener('click', () => $(button.dataset.kkDialog).showModal());
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => button.closest('dialog').close());
for (const button of document.querySelectorAll('[data-photo]')) button.addEventListener('click', () => {
  $('#kk-photo').src = ROOT + 'assets/' + button.dataset.photo;
  $('#kk-photo').alt = button.dataset.photoTitle;
  $('#kk-photo-title').textContent = button.dataset.photoTitle;
  $('#kk-photo-dialog').showModal();
});

idle.muted = orbit.muted = true;
idle.autoplay = !reduced;
if (reduced) idle.pause();
else play(idle).catch(() => { state.paused = true; $('#kk-play-prompt').hidden = false; syncControls(); });
setScene(0);
syncControls();
