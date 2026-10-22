import {mountDesignMarks, prepareAttribution} from '/partner-attribution.js';

const $ = selector => document.querySelector(selector);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
prepareAttribution($('.kp-credit'));
const designMarks = mountDesignMarks();
designMarks.update('Эскиз');
const route = $('#kp-route');
const state = {zen:false, paused:reduced, position:0, target:reduced ? 0 : 1, loaded:false, loading:false, sound:false};
let loadingPromise, frame, lastStamp, pointer, audio, audioGain, seekRequested = 0, nativeMotion = false, playRequest = 0;
const clamp = value => Math.max(0, Math.min(1, value));
const routeDuration = () => Math.max(0, (Number.isFinite(route.duration) ? route.duration : 8) - 1 / 24);
const announce = message => { $('#kp-status').textContent = message; };
function sync() {
  document.body.dataset.cameraPosition = state.position.toFixed(3);
  document.body.dataset.cameraMoving = String(Math.abs(state.target - state.position) > .0003 && !state.paused);
  for (const button of document.querySelectorAll('[data-camera]')) {
    button.disabled = state.loading || (button.dataset.camera === 'left' ? state.position >= .999 && state.target >= .999 : state.position <= .001 && state.target <= .001);
  }
  for (const button of document.querySelectorAll('[data-pause]')) {
    button.setAttribute('aria-pressed', String(state.paused));
    const text = state.paused ? 'Продолжить' : 'Пауза';
    if (button.textContent !== text) button.textContent = text;
  }
  const moving = Math.abs(state.target - state.position) > .001;
  const text = state.loading ? 'Готовим пространство…' : moving ? 'Павильон · Движение камеры' : state.position > .99 ? 'Павильон · Боковой ракурс' : state.position > .01 ? 'Павильон · Выбранный ракурс' : 'Павильон над водой';
  for (const label of document.querySelectorAll('[data-view-label]')) if (label.textContent !== text) label.textContent = text;
}
function stopNative() {
  if (nativeMotion) state.position = clamp(route.currentTime / routeDuration());
  nativeMotion = false; playRequest++; route.pause();
}
function playForward() {
  if (nativeMotion) return;
  nativeMotion = true;
  const request = ++playRequest;
  route.playbackRate = 1;
  route.play().then(() => {
    if (request === playRequest) $('#kp-play-prompt').hidden = true;
  }).catch(error => {
    if (request !== playRequest || error.name === 'AbortError') return;
    nativeMotion = false; state.paused = true; $('#kp-play-prompt').hidden = false; sync();
  });
}
function ensureRoute() {
  if (route.readyState >= 2) { state.loaded = true; return Promise.resolve(); }
  if (loadingPromise) return loadingPromise;
  state.loading = true; sync();
  loadingPromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => finish(new Error('Camera unavailable')), 15000);
    const ready = () => finish();
    const error = () => finish(new Error('Camera unavailable'));
    function finish(problem) {
      clearTimeout(timer);
      route.removeEventListener('loadeddata', ready); route.removeEventListener('error', error);
      state.loading = false; state.loaded = !problem; sync();
      problem ? reject(problem) : resolve();
    }
    route.addEventListener('loadeddata', ready, {once:true}); route.addEventListener('error', error, {once:true});
    route.preload = 'auto'; route.load();
  }).finally(() => { loadingPromise = null; });
  return loadingPromise;
}
function seek() {
  if (!state.loaded || nativeMotion || route.seeking) return;
  const time = clamp(state.position) * routeDuration();
  if (Math.abs(route.currentTime - time) >= .018) { seekRequested = time; route.currentTime = time; }
}
route.addEventListener('seeked', () => { if (Math.abs(route.currentTime - seekRequested) < .06) seek(); });
route.addEventListener('loadeddata', () => { route.removeAttribute('poster'); state.loaded = true; });
function tick(stamp) {
  frame = undefined;
  if (document.hidden || state.paused) { stopNative(); lastStamp = undefined; return; }
  const dt = lastStamp === undefined ? 1/60 : Math.min((stamp - lastStamp)/1000, .5); lastStamp = stamp;
  if (nativeMotion) state.position = clamp(route.currentTime / routeDuration());
  let difference = state.target - state.position;
  if (nativeMotion && difference <= .0003) {
    stopNative(); state.position = state.target; seek();
  } else if (difference > .0003) {
    playForward();
  } else if (difference < -.0003) {
    stopNative();
    state.position -= Math.min(-difference, Math.min(.16, -difference*5) * dt);
    seek();
  } else { stopNative(); state.position = state.target; seek(); }
  if (Math.abs(state.target - state.position) <= .0003) {
    stopNative(); state.position = state.target; lastStamp = undefined; seek();
  }
  sync();
  if (Math.abs(state.target - state.position) > .0003) frame = requestAnimationFrame(tick);
}
function wake() {
  if (frame === undefined && !state.paused && !document.hidden && state.loaded) frame = requestAnimationFrame(tick);
}
async function moveTo(value) {
  if (nativeMotion) state.position = clamp(route.currentTime / routeDuration());
  state.target = clamp(value); state.paused = false; sync();
  if (state.target <= state.position) stopNative();
  try { await ensureRoute(); wake(); }
  catch { state.target = state.position; sync(); announce('Маршрут пока не загрузился. Попробуйте нажать ещё раз.'); }
}
function pause() {
  state.paused = !state.paused;
  if (state.paused) { stopNative(); if (frame !== undefined) cancelAnimationFrame(frame); frame = undefined; lastStamp = undefined; }
  else wake();
  sync();
}
function setZen(on) {
  state.zen = on; document.body.classList.toggle('zen', on);
  $('#kp-zen').setAttribute('aria-pressed', String(on)); $('#kp-exit').hidden = !on; $('#kp-camera-panel').hidden = !on;
  for (const element of document.querySelectorAll('[data-proposal-chrome]')) element.inert = on;
  (on ? $('#kp-exit') : $('#kp-zen')).focus();
  announce(on ? 'Созерцание. Меняйте ракурс жестом влево или вправо. Обратное движение запускаете вы.' : 'Интерфейс возвращён.');
}
for (const button of document.querySelectorAll('[data-camera]')) button.addEventListener('click', () => {
  moveTo(button.dataset.camera === 'left' ? 1 : 0);
  announce(button.dataset.camera === 'left' ? 'Камера движется влево.' : 'Камера возвращается к начальному ракурсу.');
});
for (const button of document.querySelectorAll('[data-pause]')) button.addEventListener('click', pause);
$('#kp-enter').addEventListener('click', () => { setZen(true); state.paused = false; wake(); sync(); });
$('#kp-zen').addEventListener('click', () => setZen(!state.zen)); $('#kp-exit').addEventListener('click', () => setZen(false));
$('#kp-play-prompt').addEventListener('click', () => { state.paused = false; wake(); sync(); });
document.addEventListener('pointerdown', event => {
  if (!state.zen || event.target.closest('button,a,input,dialog')) return;
  pointer = {id:event.pointerId,x:event.clientX,position:state.position};
});
document.addEventListener('pointermove', event => {
  if (!pointer || event.pointerId !== pointer.id) return;
  const dx = event.clientX - pointer.x;
  if (Math.abs(dx) < 4) return;
  event.preventDefault();
  moveTo(pointer.position - dx / Math.max(innerWidth * .7, 240));
});
for (const name of ['pointerup','pointercancel']) document.addEventListener(name, () => { pointer = null; });
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && state.zen) setZen(false);
  if (!state.zen || event.target.closest('input,select,textarea,dialog')) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); moveTo(state.target + .12); }
  if (event.key === 'ArrowRight') { event.preventDefault(); moveTo(state.target - .12); }
  if (event.key === 'Home') { event.preventDefault(); moveTo(0); }
  if (event.key === ' ' && !event.target.closest('button,a')) { event.preventDefault(); pause(); }
});
const lightNames = {rose:'Розовое золото',evening:'Мягкий вечер',soft:'Жемчужный свет'};
for (const button of document.querySelectorAll('[data-light]')) button.addEventListener('click', () => {
  document.documentElement.dataset.light = button.dataset.light;
  for (const item of document.querySelectorAll('[data-light]')) item.setAttribute('aria-pressed', String(item.dataset.light === button.dataset.light));
  button.closest('dialog')?.close(); announce('Свет эскиза: ' + lightNames[button.dataset.light]);
});
for (const button of document.querySelectorAll('[data-open]')) button.addEventListener('click', () => $(button.dataset.open).showModal());
for (const button of document.querySelectorAll('[data-close]')) button.addEventListener('click', () => button.closest('dialog').close());
$('#kp-fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else setZen(true); }
  catch { setZen(true); }
});
document.addEventListener('fullscreenchange', () => $('#kp-fullscreen').setAttribute('aria-pressed', String(!!document.fullscreenElement)));
$('#kp-sound').addEventListener('click', () => {
  if (!audio) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) { announce('Звук в этом браузере недоступен.'); return; }
    audio = new Context(); audioGain = audio.createGain(); audioGain.gain.value = 0; audioGain.connect(audio.destination);
    for (const frequency of [130.81,196,261.63]) { const oscillator = audio.createOscillator(), gain = audio.createGain(); oscillator.frequency.value = frequency; gain.gain.value = .06; oscillator.connect(gain); gain.connect(audioGain); oscillator.start(); }
  }
  state.sound = !state.sound; if (state.sound) audio.resume(); audioGain.gain.setTargetAtTime(state.sound ? .22 : 0,audio.currentTime,.3);
  $('#kp-sound').setAttribute('aria-pressed',String(state.sound));
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { stopNative(); if (frame !== undefined) cancelAnimationFrame(frame); frame = undefined; lastStamp = undefined; audio?.suspend(); }
  else { wake(); if (state.sound) audio?.resume(); }
});
addEventListener('pagehide', () => { stopNative(); audio?.suspend(); if (frame !== undefined) cancelAnimationFrame(frame); frame = undefined; lastStamp = undefined; });
addEventListener('pageshow', wake);
route.muted = true; route.pause();
route.addEventListener('error', () => { state.paused = true; sync(); $('#kp-play-prompt').hidden = false; announce('Движение временно недоступно. Тексты эскиза открыты.'); });
ensureRoute().then(wake).catch(() => { state.target = state.position; sync(); announce('Маршрут пока не загрузился. Попробуйте нажать ещё раз.'); });
sync();

