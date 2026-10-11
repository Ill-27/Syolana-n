import { safeURL, notify, getPref, setPref } from "./utils.js";

// Sound is decoded only after the reader's gesture. No page-load audio downloads.
export class SceneAudio {
  constructor(library, player) {
    this.library = library;
    this.player = player;
    this.enabled = false;
    this.key = "";
    this.sceneId = "";
    this.sequence = 0;
    this.tracks = new Map();
    this.cache = new Map();
    // The slider remains 0–100%, but the actual scene mix is deliberately
    // capped so ambience stays behind the text even at maximum device volume.
    this.maxOutput = 0.21;
    this.volume = Math.max(0, Math.min(1, Number(getPref("scene-volume", 0.65)) || 0));
    document.getElementById("audio")?.addEventListener("play", () => this.stop());
    window.addEventListener("pagehide", () => this.stop());
  }
  emit(message = "") {
    window.dispatchEvent(new CustomEvent("syolana:sceneaudio", { detail: { enabled: this.enabled, message } }));
  }
  async toggle() {
    if (this.enabled) { this.stop(); return false; }
    const Constructor = window.AudioContext || window.webkitAudioContext;
    if (!Constructor) { notify("Этот браузер не поддерживает звуки сцен. Общий плеер доступен отдельно."); return false; }
    if (!this.context) {
      this.context = new Constructor();
      this.master = this.context.createGain();
      this.master.gain.value = this.volume * this.maxOutput;
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -12; compressor.knee.value = 18;
      compressor.ratio.value = 6; compressor.attack.value = 0.01; compressor.release.value = 0.25;
      this.master.connect(compressor); compressor.connect(this.context.destination);
    }
    const request = ++this.sequence;
    this.enabled = true;
    this.player.pause();
    this.emit("Включаем атмосферу…");
    try {
      await this.context.resume();
      if (request !== this.sequence || !this.enabled) return false;
      this.emit();
      return true;
    } catch {
      if (request === this.sequence) { this.stop(); notify("Нажмите «Звуки и музыка» ещё раз, чтобы браузер разрешил воспроизведение."); }
      return false;
    }
  }
  setVolume(value) {
    this.volume = Math.max(0, Math.min(1, Number(value) || 0));
    setPref("scene-volume", this.volume);
    if (this.master) this.master.gain.setTargetAtTime(this.volume * this.maxOutput, this.context.currentTime, 0.08);
  }
  resolve(key) {
    const result = [];
    for (const name of String(key || "").split(",").map(s => s.trim()).filter(Boolean)) {
      const value = this.library[name];
      if (!value) continue;
      const names = typeof value === "object" && value.tracks ? value.tracks : [name];
      for (const trackName of names) {
        const raw = this.library[trackName];
        const entry = typeof raw === "string" ? { src: raw } : raw;
        const src = safeURL(entry?.src, { media: true });
        if (!src || result.some(t => t.src === src)) continue;
        result.push({ ...entry, src, fallback: safeURL(entry.fallback, { media: true }), loop: entry.loop !== false, volume: Math.max(0, Math.min(0.55, entry.volume ?? 0.2)) });
      }
    }
    return result.slice(0, 4);
  }
  async load(entry) {
    const cacheKey = entry.src + (entry.loop ? "|loop" : "|once");
    if (this.cache.has(cacheKey)) {
      const value = this.cache.get(cacheKey); this.cache.delete(cacheKey); this.cache.set(cacheKey, value); return value;
    }
    const promise = (async () => {
      for (const url of [entry.src, entry.fallback].filter(Boolean)) {
        try {
          const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
          if (!response.ok) throw Error("Audio unavailable");
          const buffer = await this.context.decodeAudioData(await response.arrayBuffer());
          return entry.loop ? this.seamless(buffer) : buffer;
        } catch (error) { if (url === (entry.fallback || entry.src)) throw error; }
      }
    })();
    this.cache.set(cacheKey, promise);
    while (this.cache.size > 10) this.cache.delete(this.cache.keys().next().value);
    try { return await promise; } catch (error) { this.cache.delete(cacheKey); throw error; }
  }
  seamless(buffer) {
    // Blend the tail into the head once. Native looping remains smooth even in a hidden tab.
    const overlap = Math.min(Math.floor(buffer.sampleRate * 0.32), Math.floor(buffer.length / 8));
    if (overlap < 2) return buffer;
    const length = buffer.length - overlap;
    const out = this.context.createBuffer(buffer.numberOfChannels, length, buffer.sampleRate);
    for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
      const original = buffer.getChannelData(ch), samples = out.getChannelData(ch);
      samples.set(original.subarray(overlap));
      for (let i = 0; i < overlap; i++) {
        const mix = i / (overlap - 1);
        samples[length - overlap + i] = original[buffer.length - overlap + i] * (1 - mix) + original[i] * mix;
      }
    }
    return out;
  }
  async scene(key, sceneId = "") {
    if (!this.enabled || !this.context) return;

    const entries = this.resolve(key);
    const nextKey = entries.map((e) => e.src).join("|");
    if (nextKey === this.key && sceneId === this.sceneId) return;

    this.key = nextKey;
    this.sceneId = sceneId;
    const request = ++this.sequence;

    // Keep the old scene audible while the next files are loading.
    // Only after the new scene is ready do both sides crossfade together.
    const prepared = await Promise.all(
      entries.map(async (entry) => {
        const current = this.tracks.get(entry.src);
        if (current && !current.finished)
          return { entry, current, buffer: null };

        try {
          return { entry, current: null, buffer: await this.load(entry) };
        } catch {
          return { entry, current: null, buffer: null, failed: true };
        }
      }),
    );

    if (!this.enabled || request !== this.sequence) return;

    const wanted = new Set(entries.map((e) => e.src));
    const fadeSeconds = 3.2;
    let failed = false;

    // Start all new layers first at zero gain.
    for (const item of prepared) {
      const { entry, current, buffer } = item;

      if (item.failed || (!current && !buffer)) {
        failed = true;
        continue;
      }

      if (current && !current.finished) {
        this.fade(entry.src, current, entry.volume, 1.2);
        continue;
      }

      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = entry.loop;
      gain.gain.value = 0;
      source.connect(gain);
      gain.connect(this.master);

      const state = {
        source,
        gain,
        timer: 0,
        loop: entry.loop,
        finished: false,
      };

      this.tracks.set(entry.src, state);
      source.onended = () => {
        state.finished = true;
        if (!entry.loop && this.tracks.get(entry.src) === state)
          this.remove(entry.src, state);
      };

      source.start();
      this.fade(entry.src, state, entry.volume, fadeSeconds);
    }

    // At the same moment, gently remove layers that belong to the old scene.
    for (const [url, state] of [...this.tracks]) {
      if (!wanted.has(url))
        this.fade(url, state, 0, entries.length ? fadeSeconds : 2.4);
    }

    if (!entries.length) this.emit("Для этой сцены звуков пока нет.");
    else if (failed)
      this.emit("Один из звуков недоступен. Остальные продолжают звучать.");
    else this.emit();
  }
  fade(url, state, target, seconds = 2.8) {
    clearTimeout(state.timer);
    const now = this.context.currentTime, gain = state.gain.gain;
    if (gain.cancelAndHoldAtTime) gain.cancelAndHoldAtTime(now);
    else { const value = gain.value; gain.cancelScheduledValues(now); gain.setValueAtTime(value, now); }
    gain.linearRampToValueAtTime(target, now + seconds);
    if (!target) state.timer = setTimeout(() => this.remove(url, state), seconds * 1000 + 60);
  }
  remove(url, state) {
    clearTimeout(state.timer);
    try { state.source.stop(); } catch {}
    try { state.source.disconnect(); } catch {}
    try { state.gain.disconnect(); } catch {}
    if (this.tracks.get(url) === state) this.tracks.delete(url);
  }
  stop() {
    this.enabled = false; this.key = ""; this.sceneId = ""; this.sequence++;
    for (const [url, state] of this.tracks) this.remove(url, state);
    this.emit();
  }
}
