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
      cache: "default",
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
      const sw = document.createElement("canvas");
      sw.width = 240;
      sw.height = 140;
      sw.dataset.preview = t.id;
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
    document.querySelector("#theme-toggle").onclick = () => {
      dialog.showModal();
      this.startPreviews();
    };
    dialog.addEventListener("close", () =>
      cancelAnimationFrame(this.previewFrame),
    );
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
      ratio = Math.min(devicePixelRatio || 1, w <= 700 ? 1.5 : 2);
    if (!force && w === this.w && h === this.h && ratio === this.ratio) return;
    this.w = w;
    this.h = h;
    this.ratio = ratio;
    this.canvas.width = Math.round(w * ratio);
    this.canvas.height = Math.round(h * ratio);
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    // Ordinary pages keep their original density and appearance.
    this.stars = Array.from({ length: w <= 700 ? 260 : 500 }, () =>
      this.star(true),
    );

    // Zen mode reuses the original perspective engine that felt natural,
    // but adds several quieter depth layers only for the flight experience.
    this.zenLayers = w <= 700 ? 6 : 7;
    const extraCount = w <= 700 ? 180 : 300;
    this.zenStars = Array.from({ length: extraCount }, (_, i) =>
      this.zenStar(true, i % this.zenLayers),
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
          depth: this.rand(1.2, 3.1),
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
      depth: this.rand(1.1, 3.3),
    };
  }
  zenStar(initial, layer = null) {
    const s = this.star(initial);
    const layers = Math.max(2, this.zenLayers || 6);
    const slot =
      layer == null ? Math.floor(this.rand(0, layers)) : layer % layers;
    s.depth =
      0.95 +
      (slot / (layers - 1)) * 3.05 +
      this.rand(-0.12, 0.12);
    s.size *= this.rand(0.55, 0.88);
    s.opacity *= this.rand(0.46, 0.76);
    s.sy *= this.rand(0.72, 0.95);
    s.sx *= this.rand(0.70, 0.95);
    return s;
  }
  // One scene in both modes. The camera projects the same particles, marks and waves.
  draw(d) {
    const ctx = this.ctx;
    if (!ctx || !this.stars) return;
    ctx.clearRect(0, 0, this.w, this.h);
    this.phase += d;
    if (this.zen) this.advanceCamera(d);
    this.custom?.draw?.({
      delta: d,
      time: this.phase,
      width: this.w,
      height: this.h,
      camera: this.zen ? this.camera : null,
    });
    if (this.theme.renderer === "waves") this.drawWaves();

    for (const m of this.marks) {
      m.y -= m.speed * d;
      m.phase += d * 0.23;
      m.hue = (m.hue + m.hueSpeed * d) % 360;
      if (m.y < -45) m.y = this.h + this.rand(30, 110);
      const point = this.project(
        m.x + Math.sin(m.phase) * m.drift,
        m.y,
        m.depth,
      );
      const fade =
        Math.max(0, Math.min(1, (point.y + 20) / 95)) *
        Math.max(0, Math.min(1, (this.h + 30 - point.y) / 100));
      if (!fade || point.x < -180 || point.x > this.w + 180) continue;
      const hue = (m.hue + Math.sin(m.phase * 0.7) * 42 + 360) % 360;
      ctx.font = `500 ${Math.max(8, Math.min(42, m.size * point.scale))}px system-ui,sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const tw = ctx.measureText("syolana.com").width;
      const g = ctx.createLinearGradient(
        point.x - tw / 2,
        point.y,
        point.x + tw / 2,
        point.y,
      );
      g.addColorStop(0, `hsl(${hue},76%,75%)`);
      g.addColorStop(0.48, `hsl(${(hue + 58) % 360},82%,80%)`);
      g.addColorStop(1, `hsl(${(hue + 116) % 360},76%,73%)`);
      ctx.globalAlpha = m.opacity * fade * point.alpha;
      ctx.fillStyle = g;
      ctx.shadowColor = `hsla(${hue},84%,74%,.42)`;
      ctx.shadowBlur = 9;
      ctx.fillText("syolana.com", point.x, point.y);
      ctx.shadowBlur = 0;
    }
    const particleGroups =
      this.theme.particles === false
        ? []
        : this.zen
          ? [this.stars, this.zenStars || []]
          : [this.stars];

    let globalParticleIndex = 0;
    for (const group of particleGroups) {
      const isZenExtra = group !== this.stars;

      for (let i = 0; i < group.length; i++, globalParticleIndex++) {
        let s = group[i];
        const speed = this.theme.speed || 1;
        s.x += s.sx * d * speed;
        s.y -= s.sy * d * speed;
        s.phase += s.blink * d;

        if (s.y < -25)
          s = group[i] = isZenExtra
            ? this.zenStar(false, i % Math.max(2, this.zenLayers || 6))
            : this.star(false);

        if (s.x < -25) s.x = this.w + 25;
        else if (s.x > this.w + 25) s.x = -25;

        const point = this.project(s.x, s.y, s.depth);
        if (
          point.x < -110 ||
          point.y < -110 ||
          point.x > this.w + 110 ||
          point.y > this.h + 110
        )
          continue;

        ctx.globalAlpha =
          Math.max(
            0.08,
            Math.min(1, s.opacity + Math.sin(s.phase) * 0.34),
          ) * point.alpha;

        if (
          this.theme.renderer === "petals" &&
          globalParticleIndex % 4 === 0
        ) {
          ctx.save();
          ctx.translate(point.x, point.y);
          ctx.rotate(s.phase * 0.15);
          ctx.fillStyle = this.theme.colors[s.ci];
          ctx.beginPath();
          ctx.ellipse(
            0,
            0,
            s.size * 2 * point.scale,
            s.size * 0.6 * point.scale,
            0,
            0,
            Math.PI * 2,
          );
          ctx.fill();
          ctx.restore();
        } else {
          const size = Math.min(110, s.size * 10 * point.scale);
          ctx.drawImage(
            this.sprites[s.ci],
            point.x - size / 2,
            point.y - size / 2,
            size,
            size,
          );
        }
      }
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    if (this.zen) this.drawPlanets();
  }
  project(x, y, baseDepth = 2) {
    const cam = this.zen ? this.camera : null;
    if (!cam || (!cam.x && !cam.y && !cam.z))
      return { x, y, scale: 1, alpha: 1 };
    const wrap = (v, n) => ((v % n) + n) % n;
    const depth = wrap(baseDepth - cam.z - 0.24, 4.2) + 0.24;
    const scale = baseDepth / depth;
    // Repeating world cells give unlimited panning; depth recycles beyond the camera.
    const wx = wrap(x - cam.x * this.w + 100, this.w + 200) - 100;
    const wy = wrap(y - cam.y * this.h + 100, this.h + 200) - 100;
    return {
      x: this.w / 2 + (wx - this.w / 2) * scale,
      y: this.h / 2 + (wy - this.h / 2) * scale,
      scale,
      alpha: Math.max(0, Math.min(1, (depth - 0.24) * 5, (4.44 - depth) * 3)),
    };
  }
  drawWaves() {
    const ctx = this.ctx,
      cam = this.zen ? this.camera : null;
    const xCamera = cam?.x || 0,
      yCamera = cam?.y || 0,
      zCamera = cam?.z || 0;
    const extra = Math.min(1, Math.abs(zCamera) * 2);
    const wrap = (v, n) => ((v % n) + n) % n;
    const layers = extra > 0.001 ? 3 : 1;
    ctx.save();
    for (let layer = 0; layer < layers; layer++) {
      const depth = wrap(2.4 + layer * 1.4 - zCamera - 0.24, 4.2) + 0.24;
      const scale = cam ? 2.4 / depth : 1;
      const fade = Math.max(
        0,
        Math.min(1, (depth - 0.24) * 3, (4.44 - depth) * 2),
      );
      const strength = layer ? extra * 0.32 : 1;
      const cell = Math.round(yCamera / 1.6);
      const tiles =
        cam && (xCamera || yCamera || zCamera)
          ? [cell - 1, cell, cell + 1]
          : [0];
      for (const tile of tiles)
        for (let line = 0; line < 24; line++) {
          ctx.beginPath();
          for (let px = 0; px <= this.w + 8; px += 8) {
            const wx =
              (px - this.w / 2) / scale + this.w / 2 + xCamera * this.w;
            const wy =
              this.h * 0.58 +
              Math.sin(
                (wx / this.w) * 5.2 +
                  this.phase * 0.32 +
                  line * 0.075 +
                  layer * 0.7,
              ) *
                this.h *
                0.17 +
              Math.sin((wx / this.w) * 9 - this.phase * 0.22) * this.h * 0.03 +
              line * 9;
            const py =
              this.h / 2 +
              (wy - this.h / 2 - yCamera * this.h + tile * this.h * 1.6) *
                scale;
            if (!px) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.strokeStyle = `rgba(240,200,133,${(0.13 - line * 0.0035) * fade * strength})`;
          ctx.lineWidth = Math.max(0.55, Math.min(1.5, 0.8 * Math.sqrt(scale)));
          ctx.stroke();
        }
    }
    ctx.restore();
  }
  setZen(active) {
    this.zen = active;
    // Enter the exact current theme, without replacing or restarting its animation.
    this.camera = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, vz: 0 };
    document.querySelector(".aurora-background").style.transform = "";
    document.getElementById("flight-layer")?.toggleAttribute("hidden", !active);
    this.sync();
  }
  move(dx = 0, dy = 0, dz = 0) {
    if (!this.zen) return;
    const cam = this.camera;
    cam.tx += dx;
    cam.ty += dy;
    cam.tz += dz;
    cam.vz = this.reduced?.matches
      ? 0
      : Math.max(-12, Math.min(12, cam.vz + dz * 5));
    if (this.reduced?.matches) this.draw(0);
  }
  settle() {
    if (!this.camera) return;
    const cam = this.camera;
    cam.tx = cam.x;
    cam.ty = cam.y;
    cam.tz = cam.z;
    cam.vz = 0;
  }
  advanceCamera(d) {
    const cam = this.camera;
    if (!cam) return;
    const blend = d ? 1 - Math.exp(-d * 8) : 1;
    cam.tz += cam.vz * d;
    cam.vz *= Math.exp(-d * 2.8);
    if (Math.abs(cam.vz) < 0.002) cam.vz = 0;
    cam.x += (cam.tx - cam.x) * blend;
    cam.y += (cam.ty - cam.y) * blend;
    cam.z += (cam.tz - cam.z) * blend;
    const amount = Math.min(
      1,
      Math.abs(cam.x) + Math.abs(cam.y) + Math.abs(cam.z),
    );
    const bg = document.querySelector(".aurora-background");
    if (bg)
      bg.style.transform = amount
        ? `translate3d(${-Math.sin(cam.x) * 2}vw,${-Math.sin(cam.y) * 2}vh,0) scale(${1 + amount * 0.12})`
        : "";
  }
  drawPlanets() {
    const cam = this.camera,
      wrap = (v, n) => ((v % n) + n) % n;
    const scale = Math.min(this.w, this.h) * 0.9;
    document.querySelectorAll(".flight-planet").forEach((node, i) => {
      const z = wrap(i * 1.53 + 1.4 - cam.z, 8) + 0.45;
      const x = wrap((i % 2 ? 0.58 : -0.34) - cam.x + 2, 4) - 2;
      const y = wrap(((i % 3) - 1) * 0.7 - cam.y + 2, 4) - 2;
      const px = this.w / 2 + (x * scale) / z,
        py = this.h * 0.48 + (y * scale) / z;
      const visible =
        Math.abs(cam.z) > 0.04 &&
        z > 0.85 &&
        z < 2.8 &&
        px > 95 &&
        px < this.w - 95 &&
        py > 140 &&
        py < this.h - 140;
      node.style.opacity = visible
        ? String(Math.min(1, (z - 0.85) * 2, (2.8 - z) * 2))
        : "0";
      node.style.pointerEvents = visible ? "auto" : "none";
      node.tabIndex = visible ? 0 : -1;
      node.setAttribute("aria-hidden", String(!visible));
      node.style.transform = `translate(-50%,-50%) translate(${px}px,${py}px) scale(${Math.min(1, 1.5 / z)})`;
    });
  }
  startPreviews() {
    cancelAnimationFrame(this.previewFrame);
    const canvases = [...document.querySelectorAll("canvas[data-preview]")];
    const draw = (time) => {
      if (!document.getElementById("theme-dialog").open || document.hidden)
        return;
      for (const canvas of canvases) {
        const c = canvas.getContext("2d");
        if (!c) continue;
        const id = canvas.dataset.preview,
          w = canvas.width,
          h = canvas.height,
          t = this.reduced.matches ? 0 : time / 1000;
        c.clearRect(0, 0, w, h);
        const g = c.createLinearGradient(0, 0, w, h);
        g.addColorStop(
          0,
          id === "golden" ? "#512912" : id === "moon" ? "#193759" : "#1d3370",
        );
        g.addColorStop(
          0.5,
          id === "golden" ? "#180d21" : id === "moon" ? "#191237" : "#3b124b",
        );
        g.addColorStop(1, "#04050e");
        c.fillStyle = g;
        c.fillRect(0, 0, w, h);
        if (id === "golden") {
          c.strokeStyle = "#eac59080";
          for (let j = 0; j < 9; j++) {
            c.beginPath();
            for (let x = 0; x < w; x += 5) {
              const y = 70 + Math.sin(x / 45 + t * 0.5 + j * 0.1) * 25 + j * 5;
              x ? c.lineTo(x, y) : c.moveTo(x, y);
            }
            c.stroke();
          }
        }
        for (let i = 0; i < 38; i++) {
          const x =
              (i * 61.7 + Math.sin(i) * 8 + t * ((i % 3) - 1) * 5 + w) % w,
            y = (((i * 31.3 - t * (15 + (i % 20))) % h) + h) % h;
          c.globalAlpha = 0.4 + (Math.sin(t + i) + 1) * 0.25;
          c.fillStyle =
            id === "golden"
              ? "#f2d6a4"
              : id === "moon"
                ? "#d3e8ff"
                : `hsl(${(i * 51) % 360} 90% 72%)`;
          c.beginPath();
          c.ellipse(
            x,
            y,
            id === "moon" && i % 4 === 0 ? 3 : 1.5,
            id === "moon" && i % 4 === 0 ? 1 : 1.5,
            t * 0.2,
            0,
            Math.PI * 2,
          );
          c.fill();
        }
        c.globalAlpha = 0.4;
        c.font = "11px system-ui";
        c.fillStyle = "#eee";
        c.fillText("syolana.com", 11, 125);
        c.globalAlpha = 1;
      }
      if (!this.reduced.matches)
        this.previewFrame = requestAnimationFrame(draw);
    };
    draw(0);
  }
  sync() {
    if (!this.reduced) return;
    cancelAnimationFrame(this.frame);
    this.last = 0;
    const stopped =
      document.hidden || this.paused || this.reduced.matches || this.blocked;
    document.body.classList.toggle("paused", stopped);
    document.querySelectorAll("video[data-motion]").forEach((v) => {
      if (stopped || v.dataset.manualPause === "true") v.pause();
      else v.play().catch(() => {});
    });
    if (stopped) {
      if (!document.hidden) this.draw(0);
      return;
    }
    let painted = 0;
    const tick = (t) => {
      if (t - painted < (this.w <= 700 ? 1000 / 30 : 1000 / 45)) {
        this.frame = requestAnimationFrame(tick);
        return;
      }
      painted = t;
      const delta = this.last ? Math.min((t - this.last) / 1000, 0.05) : 1 / 60;
      this.last = t;
      this.draw(delta);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
}
