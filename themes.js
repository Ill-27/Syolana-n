import { getPref, setPref, notify } from "./utils.js";
export class ThemeEngine {
  async init() {
    this.canvas = document.querySelector("#starCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");
    this.paused = this.reduced.matches;
    this.blocked = false;
    this.frame = 0;
    this.last = 0;
    this.phase = 0;
    this.sequence = 0;
    this.manifest = await fetch("themes/manifest.json", {
      cache: "no-cache",
    }).then((r) => {
      if (!r.ok) throw Error("Темы недоступны");
      return r.json();
    });
    const old = getPref("theme", "");
    const choices = this.manifest.filter((t) => t.id !== old);
    await this.select(
      (choices.length ? choices : this.manifest)[
        Math.floor(Math.random() * (choices.length || this.manifest.length))
      ].id,
    );
    const dialog = document.querySelector("#theme-dialog");
    const list = document.querySelector("#theme-list");
    this.manifest.forEach((t) => {
      const b = document.createElement("button");
      b.className = "theme-option";
      b.type = "button";
      b.dataset.theme = t.id;
      const sw = document.createElement("span");
      sw.className = "theme-swatch";
      sw.style.background = t.preview;
      sw.setAttribute("aria-hidden", "true");
      const txt = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = t.name;
      const small = document.createElement("small");
      small.textContent = t.description;
      txt.append(strong, small);
      b.append(sw, txt);
      b.addEventListener("click", () =>
        this.select(t.id)
          .then(() => dialog.close())
          .catch(() => notify("Не удалось открыть тему. Попробуйте ещё раз.")),
      );
      list.append(b);
    });
    this.updateChoices();
    document.querySelector("#theme-toggle").onclick = () => dialog.showModal();
    document.querySelector("#motion").onclick = () => {
      this.paused = !this.paused;
      this.sync();
    };
    this.reduced.addEventListener("change", () => {
      this.paused = this.reduced.matches;
      this.sync();
    });
    document.addEventListener("visibilitychange", () => this.sync());
    window.addEventListener("resize", () => this.resize(), { passive: true });
    window.visualViewport?.addEventListener("resize", () => this.resize(), {
      passive: true,
    });
    window.addEventListener("pageshow", () => this.sync());
    window.addEventListener("pagehide", () => cancelAnimationFrame(this.frame));
    document.fonts?.ready.then(() => this.draw(0));
  }
  async select(id) {
    const seq = ++this.sequence;
    const item = this.manifest.find((t) => t.id === id);
    if (!item) return;
    const url = new URL(item.module, new URL("themes/", document.baseURI));
    if (url.origin !== location.origin) throw Error("Invalid theme");
    const { default: theme } = await import(url.href);
    if (seq !== this.sequence) return;
    this.custom?.dispose?.();
    this.custom =
      this.ctx && theme.createRenderer ? theme.createRenderer(this.ctx) : null;
    this.theme = theme;
    this.id = id;
    const s = document.documentElement.style;
    for (const [k, v] of Object.entries({
      accent: theme.accent,
      dim: theme.dim,
      surface: theme.surface,
      radius: theme.radius,
      heading: theme.heading,
      body: theme.body,
      "button-radius": theme.buttonRadius || "30px",
    }))
      s.setProperty("--" + k, v);
    for (let i = 0; i < 3; i++) {
      const name = "--theme-background-" + i;
      if (theme.backgrounds?.[i]) s.setProperty(name, theme.backgrounds[i]);
      else s.removeProperty(name);
    }
    document.documentElement.dataset.theme = id;
    document.querySelector("#theme-name").textContent = item.name;
    setPref("theme", id);
    this.sprites = theme.colors.map((c) => this.sprite(c));
    this.resize(true);
    this.updateChoices();
    this.sync();
    window.dispatchEvent(new CustomEvent("syolana:theme"));
  }
  updateChoices() {
    document
      .querySelectorAll(".theme-option")
      .forEach((b) =>
        b.setAttribute("aria-pressed", String(b.dataset.theme === this.id)),
      );
  }
  setBlocked(blocked) {
    this.blocked = blocked;
    this.sync();
  }
  sprite(color) {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const x = c.getContext("2d");
    if (!x) return c;
    x.shadowColor = color;
    x.shadowBlur = 12;
    x.fillStyle = color;
    x.beginPath();
    x.arc(32, 32, 6.4, 0, Math.PI * 2);
    x.fill();
    x.shadowBlur = 0;
    x.fillStyle = "rgba(255,255,255,.72)";
    x.beginPath();
    x.arc(32, 32, 2.1, 0, Math.PI * 2);
    x.fill();
    return c;
  }
  resize(force = false) {
    if (!this.ctx || !this.theme) return;
    const bounds = this.canvas.getBoundingClientRect();
    const w = Math.max(1, bounds.width),
      h = Math.max(1, bounds.height),
      ratio = Math.min(devicePixelRatio || 1, 2);
    if (!force && w === this.w && h === this.h && ratio === this.ratio) return;
    this.w = w;
    this.h = h;
    this.ratio = ratio;
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.stars = Array.from({ length: w <= 700 ? 260 : 500 }, () =>
      this.star(true),
    );
    this.marks = [];
    const cols = Math.max(2, Math.min(10, Math.floor(w / 170))),
      rows = Math.max(6, Math.min(10, Math.ceil(h / 115)));
    for (let c = 0; c < cols; c++)
      for (let r = 0; r < rows; r++)
        this.marks.push({
          x:
            (w / cols) * (c + 0.5) +
            this.rand((-w / cols) * 0.12, (w / cols) * 0.12),
          y: ((r + this.rand(0, 0.6)) / rows) * h,
          size: this.rand(14, w <= 700 ? 17 : 20),
          speed: this.rand(10, 22),
          opacity: this.rand(0.16, 0.29),
          phase: this.rand(0, Math.PI * 2),
          drift: this.rand(4, w <= 700 ? 10 : 18),
          hue: this.rand(155, 330),
          hueSpeed: this.rand(3.5, 9.5),
        });
    this.custom?.resize?.({ width: w, height: h, ratio });
    this.draw(0);
  }
  rand(a, b) {
    return a + Math.random() * (b - a);
  }
  star(initial) {
    return {
      x: this.rand(0, this.w),
      y: initial ? this.rand(0, this.h) : this.h + 15,
      size: this.rand(0.5, 3),
      sy: this.rand(30, 120),
      sx: this.rand(-24, 24),
      ci: Math.floor(this.rand(0, this.theme.colors.length)),
      phase: this.rand(0, Math.PI * 2),
      blink: this.rand(0.6, 3),
      opacity: this.rand(0.2, 0.8),
    };
  }
  draw(d) {
    const ctx = this.ctx;
    if (!ctx || !this.stars) return;
    ctx.clearRect(0, 0, this.w, this.h);
    this.phase += d;
    this.custom?.draw?.({
      delta: d,
      time: this.phase,
      width: this.w,
      height: this.h,
    });
    if (this.theme.renderer === "waves") {
      ctx.save();
      for (let line = 0; line < 24; line++) {
        ctx.beginPath();
        for (let x = 0; x <= this.w + 8; x += 8) {
          const y =
            this.h * 0.58 +
            Math.sin((x / this.w) * 5.2 + this.phase * 0.12 + line * 0.075) *
              this.h *
              0.17 +
            Math.sin((x / this.w) * 9 - this.phase * 0.1) * this.h * 0.03 +
            line * 9;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(240,200,133,${0.13 - line * 0.0035})`;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      ctx.restore();
    }
    for (const m of this.marks) {
      m.y -= m.speed * d;
      m.phase += d * 0.23;
      m.hue = (m.hue + m.hueSpeed * d) % 360;
      if (m.y < -45) m.y = this.h + this.rand(30, 110);
      const fade =
        Math.max(0, Math.min(1, (m.y + 20) / 95)) *
        Math.max(0, Math.min(1, (this.h + 30 - m.y) / 100));
      const x = m.x + Math.sin(m.phase) * m.drift;
      const hue = (m.hue + Math.sin(m.phase * 0.7) * 42 + 360) % 360;
      ctx.font = `600 ${m.size}px "Nunito",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText("syolana.com").width;
      const g = ctx.createLinearGradient(x - tw / 2, m.y, x + tw / 2, m.y);
      g.addColorStop(0, `hsl(${hue},76%,75%)`);
      g.addColorStop(0.48, `hsl(${(hue + 58) % 360},82%,80%)`);
      g.addColorStop(1, `hsl(${(hue + 116) % 360},76%,73%)`);
      ctx.globalAlpha = m.opacity * fade;
      ctx.fillStyle = g;
      ctx.shadowColor = `hsla(${hue},84%,74%,.42)`;
      ctx.shadowBlur = 9;
      ctx.fillText("syolana.com", x, m.y);
      ctx.shadowBlur = 0;
    }
    for (
      let i = 0;
      i < (this.theme.particles === false ? 0 : this.stars.length);
      i++
    ) {
      let s = this.stars[i];
      const slow = this.theme.renderer === "stars" ? 1 : 0.3;
      s.x += s.sx * d * slow;
      s.y -= s.sy * d * slow;
      s.phase += s.blink * d;
      if (s.y < -25) s = this.stars[i] = this.star(false);
      if (s.x < -25) s.x = this.w + 25;
      else if (s.x > this.w + 25) s.x = -25;
      ctx.globalAlpha = Math.max(
        0.1,
        Math.min(1, s.opacity + Math.sin(s.phase) * 0.4),
      );
      if (this.theme.renderer === "petals" && i % 4 === 0) {
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.phase * 0.15);
        ctx.fillStyle = this.theme.colors[s.ci];
        ctx.beginPath();
        ctx.ellipse(0, 0, s.size * 2, s.size * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else {
        const sz = s.size * 10;
        ctx.drawImage(this.sprites[s.ci], s.x - sz / 2, s.y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }
  sync() {
    cancelAnimationFrame(this.frame);
    this.last = 0;
    const stopped =
      document.hidden || this.paused || this.reduced.matches || this.blocked;
    document.body.classList.toggle("paused", stopped);
    document.querySelector("#motion").textContent = this.paused
      ? "Включить анимацию"
      : "Остановить анимацию";
    document.querySelectorAll("video[data-motion]").forEach((v) => {
      if (stopped || v.dataset.manualPause === "true") v.pause();
      else v.play().catch(() => {});
    });
    if (stopped) {
      if (!document.hidden) this.draw(0);
      return;
    }
    const tick = (t) => {
      const delta = this.last ? Math.min((t - this.last) / 1000, 0.05) : 1 / 60;
      this.last = t;
      this.draw(delta);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
}
