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
    const themeBase = new URL("./themes/", import.meta.url);
    this.themeBase = themeBase;
    this.manifest = await fetch(new URL("manifest.json", themeBase), {
      cache: "no-store",
    }).then((r) => {
      if (!r.ok) throw Error("Темы недоступны");
      return r.json();
    });
    const requested = new URLSearchParams(location.search).get("theme");
    const old = getPref("theme", "");
    if (requested && this.manifest.some((t) => t.id === requested)) {
      await this.select(requested);
    } else {
      const choices = this.manifest.filter((t) => t.id !== old);
      await this.select(
        (choices.length ? choices : this.manifest)[
          Math.floor(Math.random() * (choices.length || this.manifest.length))
        ].id,
      );
    }
    const dialog = document.querySelector("#theme-dialog");
    const list = document.querySelector("#theme-list");
    this.manifest.forEach((t) => {
      const b = document.createElement("button");
      b.className = "theme-option";
      b.type = "button";
      b.dataset.theme = t.id;
      const sw = document.createElement("canvas");
      sw.width = 640;
      sw.height = 360;
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
    this.resizeTimer = 0;
    const scheduleResize = (delay = 0) => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.resize(), delay);
    };
    window.addEventListener("resize", () => scheduleResize(innerWidth <= 800 ? 150 : 0), { passive: true });
    if (innerWidth > 800)
      window.visualViewport?.addEventListener("resize", () => scheduleResize(120), { passive: true });
    window.addEventListener("pageshow", () => this.sync());
    window.addEventListener("pagehide", () => cancelAnimationFrame(this.frame));
    document.fonts?.ready.then(() => this.draw(0));
  }
  async select(id) {
    const seq = ++this.sequence;
    const item = this.manifest.find((t) => t.id === id);
    if (!item) return;
    const url = new URL(item.module, this.themeBase || new URL("./themes/", import.meta.url));
    if (url.origin !== (this.themeBase || url).origin) throw Error("Invalid theme");
    const version = new URL(import.meta.url).searchParams.get("v");
    if (version) url.searchParams.set("v", version);
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
      "panel-bg": theme.panel?.bg || `rgba(${theme.surface},.68)`,
      "panel-border": theme.panel?.border || "rgba(224,211,255,.20)",
      "panel-glow": theme.panel?.glow || "rgba(190,160,245,.14)",
      "panel-text": theme.panel?.text || "#f8f6ff",
      "panel-muted": theme.panel?.muted || theme.dim,
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
    const addressBarOnly =
      !force &&
      this.w &&
      w <= 800 &&
      Math.abs(w - this.w) < 2 &&
      Math.abs(h - this.h) < 220;
    if (addressBarOnly) return;
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

    // Very faint blue-noise-like dust exists only in zen mode. It does not
    // change the flight physics; it simply prevents large empty rectangles
    // from appearing between the perspective layers.
    const dustCount = w <= 700 ? 92 : 150;
    const fract = (n) => n - Math.floor(n);
    this.zenDust = Array.from({ length: dustCount }, (_, i) => ({
      u: fract((i + 1) * 0.754877666 + this.rand(-0.035, 0.035)),
      v: fract((i + 1) * 0.569840296 + this.rand(-0.035, 0.035)),
      depth: this.rand(0.35, 4.45),
      size: this.rand(0.45, 1.35),
      opacity: this.rand(0.08, 0.22),
      ci: Math.floor(this.rand(0, this.theme.colors.length)),
      phase: this.rand(0, Math.PI * 2),
      drift: this.rand(0.25, 0.8),
    }));

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

    // Keep depth continuous instead of visible slabs. A light layer hint is
    // retained only to guarantee coverage, while random offsets break up any
    // rectangular clustering caused by the repeating world cells.
    const layers = Math.max(2, this.zenLayers || 6);
    const slot =
      layer == null ? Math.floor(this.rand(0, layers)) : layer % layers;
    const slotDepth = 0.95 + (slot / (layers - 1)) * 3.05;
    s.depth = Math.max(0.84, Math.min(4.15, slotDepth + this.rand(-0.34, 0.34)));
    s.size *= this.rand(0.55, 0.88);
    s.opacity *= this.rand(0.46, 0.76);
    s.sy *= this.rand(0.72, 0.95);
    s.sx *= this.rand(0.70, 0.95);
    s.wrapX = this.rand(0.90, 1.16);
    s.wrapY = this.rand(0.90, 1.18);
    s.worldX = this.rand(-0.42, 0.42);
    s.worldY = this.rand(-0.42, 0.42);
    return s;
  }

  drawZenDust(d) {
    const ctx = this.ctx;
    const cam = this.camera;
    if (!ctx || !cam || !this.zenDust?.length) return;

    const fract = (n) => n - Math.floor(n);
    const wrap = (v, n) => ((v % n) + n) % n;

    for (const p of this.zenDust) {
      p.phase += d * p.drift;

      const depth = wrap(p.depth - cam.z * 0.62, 4.55);
      const near = 1 - depth / 4.55;
      const parallax = 0.035 + near * 0.19;

      const x =
        fract(
          p.u -
            cam.x * parallax +
            Math.sin(p.phase * 0.63) * 0.0028,
        ) * this.w;
      const y =
        fract(
          p.v -
            cam.y * parallax +
            Math.cos(p.phase * 0.57) * 0.0024,
        ) * this.h;

      const edge = Math.max(
        0,
        Math.min(1, depth / 0.22, (4.55 - depth) / 0.22),
      );
      const size = Math.max(1.25, p.size * (1.4 + near * 4.2));
      const alpha =
        p.opacity *
        edge *
        (0.76 + Math.sin(p.phase) * 0.16) *
        (0.72 + near * 0.36);

      if (alpha <= 0.01) continue;
      ctx.globalAlpha = Math.min(0.32, alpha);
      ctx.drawImage(
        this.sprites[p.ci],
        x - size / 2,
        y - size / 2,
        size,
        size,
      );
    }

    ctx.globalAlpha = 1;
  }

  projectZenStar(s) {
    const cam = this.camera;
    if (!cam) return this.project(s.x, s.y, s.depth);

    const wrap = (v, n) => ((v % n) + n) % n;
    const depth = wrap(s.depth - cam.z - 0.24, 4.2) + 0.24;
    const scale = s.depth / depth;
    const spanX = this.w * (s.wrapX || 1) + 220;
    const spanY = this.h * (s.wrapY || 1) + 220;
    const wx =
      wrap(
        s.x +
          (s.worldX || 0) * this.w -
          cam.x * this.w +
          110,
        spanX,
      ) - 110;
    const wy =
      wrap(
        s.y +
          (s.worldY || 0) * this.h -
          cam.y * this.h +
          110,
        spanY,
      ) - 110;

    return {
      x: this.w / 2 + (wx - this.w / 2) * scale,
      y: this.h / 2 + (wy - this.h / 2) * scale,
      scale,
      alpha: Math.max(
        0,
        Math.min(1, (depth - 0.24) * 5, (4.44 - depth) * 3),
      ),
    };
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
    if (this.zen && this.theme.particles !== false) this.drawZenDust(d);

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

        const point = isZenExtra
          ? this.projectZenStar(s)
          : this.project(s.x, s.y, s.depth);
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
    const depthDirectScale=Number.isFinite(this.theme?.depthDirectScale)
      ? this.theme.depthDirectScale
      : 1;
    cam.tz += dz * depthDirectScale;
    const bounds=this.theme?.flightBounds;
    if(bounds){
      if(Number.isFinite(bounds.x))cam.tx=Math.max(-bounds.x,Math.min(bounds.x,cam.tx));
      if(Number.isFinite(bounds.y))cam.ty=Math.max(-bounds.y,Math.min(bounds.y,cam.ty));
      if(Number.isFinite(bounds.z))cam.tz=Math.max(-bounds.z,Math.min(bounds.z,cam.tz));
    }
    const depthGain=Number.isFinite(this.theme?.depthGain)
      ? this.theme.depthGain
      : (this.theme?.continuousDepth?1.7:5);
    const depthCap=Number.isFinite(this.theme?.depthCap)
      ? this.theme.depthCap
      : (this.theme?.continuousDepth?3.8:12);
    cam.vz = this.reduced?.matches
      ? 0
      : Math.max(-depthCap, Math.min(depthCap, cam.vz + dz * depthGain));
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
    const cameraSmoothing=Number.isFinite(this.theme?.cameraSmoothing)
      ? this.theme.cameraSmoothing
      : 8;
    const blend = d ? 1 - Math.exp(-d * cameraSmoothing) : 1;
    cam.tz += cam.vz * d;
    if (
      d &&
      Number.isFinite(this.theme?.autoForwardSpeed) &&
      !this.reduced?.matches
    )
      cam.tz += this.theme.autoForwardSpeed * d;
    const depthDamping=Number.isFinite(this.theme?.depthDamping)
      ? this.theme.depthDamping
      : 2.8;
    cam.vz *= Math.exp(-d * depthDamping);
    if (Math.abs(cam.vz) < 0.002) cam.vz = 0;
    cam.x += (cam.tx - cam.x) * blend;
    cam.y += (cam.ty - cam.y) * blend;
    cam.z += (cam.tz - cam.z) * blend;
    const bounds=this.theme?.flightBounds;
    if(bounds){
      if(Number.isFinite(bounds.x))cam.x=Math.max(-bounds.x,Math.min(bounds.x,cam.x));
      if(Number.isFinite(bounds.y))cam.y=Math.max(-bounds.y,Math.min(bounds.y,cam.y));
      if(Number.isFinite(bounds.z))cam.z=Math.max(-bounds.z,Math.min(bounds.z,cam.z));
    }
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
    const drift=this.theme?.autoFlightCards?this.phase*.10:0,virtualZ=cam.z+drift;
    const scale = Math.min(this.w, this.h) * 0.9;
    document.querySelectorAll(".flight-planet").forEach((node, i) => {
      const z = wrap(i * 1.53 + 1.4 - virtualZ, 8) + 0.45;
      const x = wrap((i % 2 ? 0.58 : -0.34) - cam.x + 2, 4) - 2;
      const y = wrap(((i % 3) - 1) * 0.7 - cam.y + 2, 4) - 2;
      const px = this.w / 2 + (x * scale) / z,
        py = this.h * 0.48 + (y * scale) / z;
      const visible =
        (Math.abs(virtualZ) > 0.04 || this.theme?.autoFlightCards) &&
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
        if (id === "amber-forest") {
          const horizon=Math.round(h*.54),vanX=w*.50;
          const sky=c.createLinearGradient(0,0,0,horizon);
          sky.addColorStop(0,"#6395aa");sky.addColorStop(.55,"#b9c7b0");sky.addColorStop(1,"#efc477");
          c.fillStyle=sky;c.fillRect(0,0,w,horizon);

          const sun=c.createRadialGradient(w*.73,h*.26,4,w*.73,h*.26,w*.28);
          sun.addColorStop(0,"rgba(255,236,172,.78)");sun.addColorStop(.28,"rgba(255,193,84,.25)");sun.addColorStop(1,"rgba(255,193,84,0)");
          c.fillStyle=sun;c.fillRect(w*.42,0,w*.58,h*.58);

          const ground=c.createLinearGradient(0,horizon,0,h);
          ground.addColorStop(0,"#76552e");ground.addColorStop(.52,"#432a17");ground.addColorStop(1,"#1a120c");
          c.fillStyle=ground;c.fillRect(0,horizon,w,h-horizon);

          // Natural sunlit forest floor — no geometric road.
          const clearing=c.createRadialGradient(vanX,h*.72,8,vanX,h*.72,w*.33);
          clearing.addColorStop(0,"rgba(186,126,54,.22)");
          clearing.addColorStop(.46,"rgba(116,82,38,.12)");
          clearing.addColorStop(1,"rgba(39,29,18,0)");
          c.fillStyle=clearing;c.fillRect(0,horizon,w,h-horizon);

          const tree=(side,depth,species)=>{
            const sc=.20+depth*.98,x=vanX+side*(56+depth*w*.44),base=horizon+depth*(h-horizon)*.16;
            const trunkH=74*sc,trunkW=7*sc;
            c.fillStyle=species===1?"#8a704e":"#5b3219";c.fillRect(x-trunkW/2,base-trunkH,trunkW,trunkH);
            const palettes=[
              ["#ffd45b","#e36d2d","#b83e22"],
              ["#f1d65c","#c2a12e","#8c7f26"],
              ["#e3a13b","#ae4c24","#74301b"],
              ["#e88a35","#bd5727","#82361e"]
            ][species];
            for(let k=0;k<7;k++){
              const a=k/7*Math.PI*2,rx=(24+((k*7)%9))*sc,ry=(18+((k*5)%7))*sc;
              const cx=x+Math.cos(a)*18*sc,cy=base-trunkH-(k%3)*12*sc;
              const g=c.createRadialGradient(cx-rx*.25,cy-ry*.30,2,cx,cy,rx);
              g.addColorStop(0,palettes[0]);g.addColorStop(.52,palettes[1]);g.addColorStop(1,palettes[2]);
              c.fillStyle=g;c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);c.fill();
            }
          };
          const rows=[[.14,1],[.25,0],[.38,3],[.55,2],[.73,0],[.93,2]];
          rows.forEach((r,i)=>{tree(-1,r[0],r[1]);tree(1,r[0],(r[1]+2)%4);});

          // Leaves flying toward the viewer.
          for(let i=0;i<16;i++){
            const p=((t*.16+i/16)%1),d=Math.pow(p,1.55);
            const x=vanX+((i%2)?1:-1)*d*w*(.06+(i%5)*.035);
            const y=h*.43+d*h*(.10+(i%4)*.055);
            const size=2+d*13;
            c.fillStyle=["#f4c44e","#df7a2d","#c64b24","#d5b93c"][i%4];
            c.save();c.translate(x,y);c.rotate(t+i*.7);
            c.beginPath();c.ellipse(0,0,size*.58,size,0,0,Math.PI*2);c.fill();c.restore();
          }

          const mist=c.createLinearGradient(0,horizon-25,0,horizon+65);
          mist.addColorStop(0,"rgba(247,220,176,0)");mist.addColorStop(.48,"rgba(247,220,176,.14)");mist.addColorStop(1,"rgba(247,220,176,0)");
          c.fillStyle=mist;c.fillRect(0,horizon-25,w,95);
          continue;
        }
        if (id === "white-ocean-city") {
          const horizon=Math.round(h*.56);
          const vanX=w*.50;

          // Early morning sky.
          const sky=c.createLinearGradient(0,0,0,horizon);
          sky.addColorStop(0,"#355a6b");
          sky.addColorStop(.48,"#7696a0");
          sky.addColorStop(.83,"#c8d4d2");
          sky.addColorStop(1,"#eee3d7");
          c.fillStyle=sky;c.fillRect(0,0,w,horizon);

          // Low cloud banks: broad, soft and layered.
          c.save();
          c.filter="blur(18px)";
          for(let i=0;i<9;i++){
            const cx=(i*137+t*5.0)%(w+260)-130;
            const cy=44+(i%4)*27;
            const rw=112+(i%3)*38;
            const rh=20+(i%2)*10;
            c.globalAlpha=.085+(i%3)*.035;
            c.fillStyle=i%2?"#f5f5ef":"#9fb5b9";
            c.beginPath();c.ellipse(cx,cy,rw,rh,0,0,Math.PI*2);c.fill();
          }
          c.restore();
          c.globalAlpha=1;c.filter="none";

          // Warm horizon light.
          const dawn=c.createRadialGradient(w*.72,horizon-16,4,w*.72,horizon-16,w*.25);
          dawn.addColorStop(0,"rgba(248,214,174,.42)");
          dawn.addColorStop(.45,"rgba(245,207,166,.15)");
          dawn.addColorStop(1,"rgba(245,207,166,0)");
          c.fillStyle=dawn;c.fillRect(w*.43,h*.18,w*.56,h*.55);

          // Ocean.
          const sea=c.createLinearGradient(0,horizon,0,h);
          sea.addColorStop(0,"#7f9c9f");
          sea.addColorStop(.30,"#557b80");
          sea.addColorStop(.68,"#315d66");
          sea.addColorStop(1,"#153a47");
          c.fillStyle=sea;c.fillRect(0,horizon,w,h-horizon);

          // Perspective wave ribbons become wider toward the viewer.
          for(let j=0;j<13;j++){
            const depth=(j+1)/13;
            const y=horizon+Math.pow(depth,1.55)*(h-horizon)*.90;
            const half=42+depth*w*.54;
            c.strokeStyle=`rgba(235,246,242,${.08+depth*.12})`;
            c.lineWidth=.8+depth*1.35;
            c.beginPath();
            for(let x=vanX-half;x<=vanX+half;x+=10){
              const yy=y+Math.sin(x*.035+t*.42+j*.63)*(1.0+depth*2.1);
              x===vanX-half?c.moveTo(x,yy):c.lineTo(x,yy);
            }
            c.stroke();
          }

          // 3D-ish architectural volumes placed along both sides of the corridor.
          const tower=(side,depth,offset,w0,h0,pointed)=>{
            const scale=.24+depth*.96;
            const center=vanX+side*(44+depth*w*.43+offset*scale);
            const base=horizon+depth*(h-horizon)*.18;
            const bw=w0*scale;
            const bh=h0*scale;
            const sideW=Math.max(4,bw*.22);
            const topY=base-bh;
            const bodyTop=pointed?topY+bh*.25:topY;

            // shadow face
            c.fillStyle="rgba(105,137,144,.72)";
            c.beginPath();
            c.moveTo(center+bw/2,base);
            c.lineTo(center+bw/2+sideW,base-sideW*.18);
            c.lineTo(center+bw/2+sideW,bodyTop-sideW*.15);
            c.lineTo(center+bw/2,bodyTop);
            c.closePath();c.fill();

            // front face
            const fg=c.createLinearGradient(center-bw/2,0,center+bw/2,0);
            fg.addColorStop(0,"#b9c8c7");
            fg.addColorStop(.42,"#f7f5ec");
            fg.addColorStop(1,"#d6dfdc");
            c.fillStyle=fg;
            c.beginPath();
            c.moveTo(center-bw/2,base);
            c.lineTo(center-bw/2,bodyTop);
            if(pointed){
              c.lineTo(center,topY);
              c.lineTo(center+bw/2,bodyTop);
            }else{
              c.lineTo(center+bw/2,bodyTop);
            }
            c.lineTo(center+bw/2,base);
            c.closePath();c.fill();

            // water contact / foam
            c.strokeStyle=`rgba(250,253,248,${.24+depth*.42})`;
            c.lineWidth=.8+depth*1.7;
            c.beginPath();
            c.ellipse(center,base+2,bw*.58,2+depth*4.2,0,0,Math.PI*2);
            c.stroke();
          };

          const rows=[
            [.18,0,38,92,true],
            [.31,8,42,118,false],
            [.47,-4,44,142,true],
            [.66,8,50,160,false],
            [.88,0,58,188,true]
          ];
          for(const row of rows){
            const [depth,offset,bw,bh,pointed]=row;
            tower(-1,depth,offset,bw,bh,pointed);
            tower(1,depth,-offset,bw,bh,!pointed);
          }

          // Mist softens the far city and deepens the corridor.
          const mist=c.createLinearGradient(0,horizon-28,0,horizon+58);
          mist.addColorStop(0,"rgba(231,237,233,0)");
          mist.addColorStop(.48,"rgba(231,237,233,.24)");
          mist.addColorStop(1,"rgba(231,237,233,0)");
          c.fillStyle=mist;c.fillRect(0,horizon-28,w,90);

          // Single white bird receding into the open centre.
          const p=(t*.16)%1;
          const bx=vanX+Math.sin(t*.31)*8;
          const by=h*.42-p*h*.10;
          const bs=11-p*4;
          c.strokeStyle="rgba(255,255,252,.92)";
          c.lineWidth=2.4;
          c.beginPath();
          c.moveTo(bx-bs,by+2);
          c.quadraticCurveTo(bx-bs*.45,by-bs*.60,bx,by);
          c.quadraticCurveTo(bx+bs*.45,by-bs*.60,bx+bs,by+2);
          c.stroke();

          // Subtle cinematic vignette.
          const vignette=c.createRadialGradient(vanX,h*.46,w*.16,vanX,h*.46,w*.67);
          vignette.addColorStop(0,"rgba(4,18,24,0)");
          vignette.addColorStop(1,"rgba(4,18,24,.23)");
          c.fillStyle=vignette;c.fillRect(0,0,w,h);

          continue;
        }
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
