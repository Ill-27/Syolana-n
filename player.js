import { $, el, safeURL, getPref, setPref, notify } from "./utils.js";
export class Player {
  constructor(songs) {
    this.audio = $("audio");
    this.songs = songs.filter((s) => s && safeURL(s.src, { media: true }));
    this.index = -1;
    this.shuffle = getPref("shuffle", false);
    this.repeat = ["off", "all", "one"].includes(getPref("repeat", "off"))
      ? getPref("repeat", "off")
      : "off";
    this.bag = [];
    this.history = [];
    this.request = 0;
    this.changing = false;
    this.audio.volume = Math.max(
      0,
      Math.min(1, Number(getPref("volume", 0.65)) || 0),
    );
    $("volume").value = this.audio.volume;
    $("player-expand").onclick = () => {
      $("player-dialog").showModal();
      $("player-expand").setAttribute("aria-expanded", "true");
    };
    $("player-dialog").addEventListener("close", () =>
      $("player-expand").setAttribute("aria-expanded", "false"),
    );
    for (const id of ["play", "dock-play"])
      $(id).onclick = () => (this.audio.paused ? this.play() : this.pause());
    for (const id of ["next", "dock-next"])
      $(id).onclick = () => this.next(false);
    for (const id of ["prev", "dock-prev"]) $(id).onclick = () => this.prev();
    $("shuffle").onclick = () => {
      this.shuffle = !this.shuffle;
      this.resetBag();
      setPref("shuffle", this.shuffle);
      this.update();
    };
    $("repeat").onclick = () => {
      this.repeat = { off: "all", all: "one", one: "off" }[this.repeat];
      this.audio.loop = this.repeat === "one";
      setPref("repeat", this.repeat);
      this.update();
    };
    $("volume").oninput = (e) => {
      this.audio.volume = Number(e.target.value);
      setPref("volume", this.audio.volume);
    };
    $("seek").oninput = (e) => {
      if (Number.isFinite(this.audio.duration) && this.audio.duration > 0)
        this.audio.currentTime =
          (Number(e.target.value) / 1000) * this.audio.duration;
    };
    ["timeupdate", "loadedmetadata", "durationchange", "emptied"].forEach((e) =>
      this.audio.addEventListener(e, () => this.progress()),
    );
    this.audio.addEventListener("playing", () => {
      this.status("Приятного прослушивания.");
      this.update();
    });
    this.audio.addEventListener("pause", () => this.update());
    this.audio.addEventListener("waiting", () => {
      if (!this.audio.paused) this.status("Загружаем аудио…");
    });
    this.audio.addEventListener("error", () => {
      if (this.index < 0) return;
      this.request++;
      this.status(
        "Не удалось открыть аудио. Выберите другой трек или повторите попытку.",
      );
      this.update();
    });
    this.audio.addEventListener("ended", () => {
      if (this.repeat === "one") {
        this.audio.currentTime = 0;
        this.play();
      } else this.next(true);
    });
    this.songs.forEach((song, i) => {
      const li = el("li");
      const b = el("button");
      b.type = "button";
      const n = el("span", "track-number", String(i + 1).padStart(2, "0"));
      const txt = el("span", "", song.title || "Без названия");
      txt.append(el("small", "", song.sourceTitle || "Syolana"));
      b.append(n, txt);
      b.onclick = () => {
        this.select(i, true);
        this.resetBag();
      };
      b.dataset.index = i;
      li.append(b);
      const url = safeURL(song.sourceUrl);
      if (url) {
        const a = el("a", "", "Источник");
        a.href = url;
        a.target = new URL(url).origin === location.origin ? "_self" : "_blank";
        a.rel = "noopener noreferrer";
        a.setAttribute("aria-label", "Источник песни " + (song.title || ""));
        li.append(a);
      }
      $("playlist").append(li);
    });
    if ("mediaSession" in navigator) {
      for (const [name, fn] of Object.entries({
        play: () => this.play(),
        pause: () => this.pause(),
        nexttrack: () => this.next(false),
        previoustrack: () => this.prev(),
        seekto: (d) => {
          if (
            Number.isFinite(d.seekTime) &&
            Number.isFinite(this.audio.duration)
          )
            this.audio.currentTime = Math.max(
              0,
              Math.min(this.audio.duration, d.seekTime),
            );
        },
      }))
        try {
          navigator.mediaSession.setActionHandler(name, fn);
        } catch {}
    }
    if (this.songs.length) {
      this.select(0, false);
      this.resetBag();
    } else
      this.status(
        "Авторские песни ещё не добавлены. Плеер готов для вашей музыкальной библиотеки.",
      );
    this.update();
  }
  status(t) {
    $("player-status").textContent = t;
  }
  resetBag(full = false) {
    this.bag = this.songs
      .map((_, i) => i)
      .filter((i) => full || i !== this.index);
    for (let i = this.bag.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
    }
    if (full && this.bag.length > 1 && this.bag.at(-1) === this.index) {
      [this.bag[0], this.bag[this.bag.length - 1]] = [
        this.bag.at(-1),
        this.bag[0],
      ];
    }
  }
  select(i, autoplay, remember = true) {
    if (i < 0 || i >= this.songs.length) return;
    this.request++;
    this.changing = true;
    if (remember && this.index >= 0 && this.index !== i)
      this.history.push(this.index);
    if (this.history.length > 100) this.history.shift();
    this.audio.pause();
    this.index = i;
    this.audio.src = safeURL(this.songs[i].src, { media: true });
    this.audio.loop = this.repeat === "one";
    this.audio.load();
    this.changing = false;
    this.status("Нажмите «Слушать».");
    this.update();
    this.progress();
    if (autoplay) this.play();
  }
  async play() {
    if (this.index < 0) {
      notify("Добавьте песни в музыкальную библиотеку.");
      return;
    }
    const req = ++this.request;
    try {
      if (this.audio.error) this.audio.load();
      if (this.audio.ended) this.audio.currentTime = 0;
      await this.audio.play();
      if (req === this.request) this.update();
    } catch (e) {
      if (req !== this.request || e.name === "AbortError") return;
      this.status(
        e.name === "NotAllowedError"
          ? "Нажмите «Слушать», чтобы разрешить звук."
          : "Аудиофайл недоступен. Попробуйте другой трек.",
      );
      this.update();
    }
  }
  pause() {
    this.request++;
    this.audio.pause();
    this.status("На паузе.");
    this.update();
  }
  next(automatic) {
    if (!this.songs.length) return;
    let i;
    if (this.shuffle) {
      if (!this.bag.length) {
        if (automatic && this.repeat === "off") {
          this.pause();
          this.status("Плейлист завершён.");
          return;
        }
        this.resetBag(true);
        if (!this.bag.length) {
          this.select(this.index, true);
          return;
        }
      }
      i = this.bag.pop();
    } else {
      i = this.index + 1;
      if (i >= this.songs.length) {
        if (automatic && this.repeat === "off") {
          this.pause();
          this.status("Плейлист завершён.");
          return;
        }
        i = 0;
      }
    }
    this.select(i, true);
  }
  prev() {
    if (this.audio.currentTime > 3) {
      this.audio.currentTime = 0;
      return;
    }
    const i = this.history.length
      ? this.history.pop()
      : (this.index - 1 + this.songs.length) % this.songs.length;
    this.select(i, true, false);
    this.resetBag();
  }
  update() {
    const ok = this.songs.length > 0,
      playing = ok && !this.audio.paused && !this.audio.ended;
    for (const id of [
      "play",
      "dock-play",
      "next",
      "dock-next",
      "prev",
      "dock-prev",
      "shuffle",
      "repeat",
    ])
      $(id).disabled = !ok;
    $("play").textContent = playing ? "Пауза" : "Слушать";
    $("dock-play").textContent = playing ? "Ⅱ" : "▶";
    $("dock-play").setAttribute("aria-label", playing ? "Пауза" : "Слушать");
    $("shuffle").setAttribute("aria-pressed", String(this.shuffle));
    $("repeat").textContent =
      "Повтор: " + { off: "выключен", all: "все", one: "одна" }[this.repeat];
    $("repeat").setAttribute("aria-label", $("repeat").textContent);
    $("playlist")
      .querySelectorAll("button")
      .forEach((b) =>
        b.setAttribute(
          "aria-current",
          String(Number(b.dataset.index) === this.index),
        ),
      );
    if (this.index >= 0) {
      const s = this.songs[this.index];
      $("dock-title").textContent = $("player-name").textContent =
        s.title || "Без названия";
      $("dock-subtitle").textContent = s.sourceTitle || "Syolana";
      const url = safeURL(s.sourceUrl);
      $("source-link").hidden = !url;
      if (url) {
        $("source-link").href = url;
        $("source-link").textContent = s.sourceTitle
          ? "По мотивам: " + s.sourceTitle
          : "Открыть источник вдохновения";
        $("source-link").target =
          new URL(url).origin === location.origin ? "_self" : "_blank";
        $("source-link").rel = "noopener noreferrer";
        $("source-link").onclick = () => $("player-dialog").close();
      }
      try {
        if ("mediaSession" in navigator) {
          if ("MediaMetadata" in window)
            navigator.mediaSession.metadata = new MediaMetadata({
              title: s.title,
              artist: s.artist || "Syolana",
              album: s.sourceTitle || "Syolana",
            });
          navigator.mediaSession.playbackState = playing ? "playing" : "paused";
        }
      } catch {}
    } else $("player-name").textContent = "Здесь будут ваши песни";
  }
  progress() {
    const a = this.audio;
    const valid = Number.isFinite(a.duration) && a.duration > 0;
    $("seek").disabled = !valid;
    $("seek").value = valid
      ? Math.round((a.currentTime / a.duration) * 1000)
      : 0;
    const f = (s) => {
      if (!Number.isFinite(s)) return "0:00";
      return (
        Math.floor(s / 60) + ":" + String(Math.floor(s % 60)).padStart(2, "0")
      );
    };
    $("elapsed").textContent = f(a.currentTime);
    $("duration").textContent = f(a.duration);
    $("seek").setAttribute(
      "aria-valuetext",
      f(a.currentTime) + " / " + f(a.duration),
    );
  }
}
