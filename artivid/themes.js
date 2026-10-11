import { getPref, setPref, notify } from "./utils.js";
const SOFT_SCENE_CSS=`
body #starCanvas,body .theme-world-canvas{filter:none!important;transition:filter .45s ease,opacity .45s ease;transform:translateZ(0)!important}
body:not(.zen):is(.reading,.course-reading,.managed-editor-view) #starCanvas,body:not(.zen):is(.reading,.course-reading,.managed-editor-view) .theme-world-canvas,body:not(.zen):has(.editor,.builder-editor,#site-builder) #starCanvas,body:not(.zen):has(.editor,.builder-editor,#site-builder) .theme-world-canvas{filter:blur(1.35px) saturate(.96) brightness(.96)!important;transform:translateZ(0) scale(1.012)!important}
body #starCanvas{z-index:-1!important}
body.reading #reading-shade,body.course-reading #reading-shade{backdrop-filter:blur(1.1px)!important;-webkit-backdrop-filter:blur(1.1px)!important}
body.zen #starCanvas,body.zen .theme-world-canvas{filter:none!important;opacity:1!important;transform:translateZ(0)!important}
.builder-theme-swatch,.theme-swatch{aspect-ratio:16/9;object-fit:cover}
body:has(.theme-world-canvas) .aurora-layer{animation:none!important;opacity:0!important}
`;
const FALLBACK_THEMES=[
  {
    "id": "living-sea",
    "name": "Море странствий",
    "description": "Живой штормовой океан · крупные парусники, объёмные волны, дымные облака и смена суток",
    "module": "./living-sea.js",
    "preview": "linear-gradient(145deg,#1c5d88,#9fc3cc 38%,#f0d49b 56%,#052238)"
  },
  {
    "id": "amber-forest",
    "name": "Янтарный лес",
    "description": "Солнечный осенний лес · шелестящие кроны, многослойные листья и свободный полёт",
    "module": "./amber-forest.js",
    "preview": "linear-gradient(135deg,#5f92a3,#f1c76a 38%,#df7d2f 62%,#4d2a18)"
  },
  {
    "id": "white-ocean-city",
    "name": "Белый город над океаном",
    "description": "Живой океан · низкие облака, белая архитектура, птицы и кинематографический полёт",
    "module": "./white-ocean-city.js",
    "preview": "linear-gradient(135deg,#3f6574,#cbd8d5 44%,#e6d9c9 58%,#17404c)"
  },
  {
    "id": "aurora",
    "name": "Северное сияние",
    "description": "Световые завесы с глубиной · изумрудные лучи, сапфировые и фиолетовые переливы",
    "module": "./aurora.js",
    "preview": "linear-gradient(135deg,#031127,#147e78,#692c92)"
  },
  {
    "id": "golden",
    "name": "Золотые струны",
    "description": "Объёмные спирали золотых нитей · мягкие блики, изгибы и полёт сквозь свет",
    "module": "./golden.js",
    "preview": "linear-gradient(135deg,#21192b,#70502f,#181626)"
  },
  {
    "id": "moon",
    "name": "Лунный сад",
    "description": "Луна с рельефом · серебристые цветы, объёмные лепестки и ночные бабочки",
    "module": "./moon.js",
    "preview": "linear-gradient(135deg,#122a38,#40517b,#1b193e)"
  },
  {
    "id": "violet-bloom",
    "name": "Фиолетовое цветение",
    "description": "Светлый цветочный мир · объёмные лепестки, мягкие тени и переливчатые бабочки",
    "module": "./violet-bloom.js",
    "preview": "linear-gradient(135deg,#faf7ff,#9758d5,#d987bf)"
  },
  {
    "id": "lunar-muse",
    "name": "Лунная муза",
    "description": "Сапфировая муза · лунный свет, звёзды, цветы и полёт синих бабочек",
    "module": "./lunar-muse.js",
    "preview": "linear-gradient(135deg,#03091d,#2458a9,#8a56b1)"
  }
];
export class ThemeEngine {
  async init() {
    if(!document.getElementById('syolana-scene-softness')){const style=document.createElement('style');style.id='syolana-scene-softness';style.textContent=SOFT_SCENE_CSS;document.head.append(style);}
    this.canvas = document.querySelector("#starCanvas");
    this.ctx = this.canvas.getContext("2d");
    this.reduced = matchMedia("(prefers-reduced-motion: reduce)");
    // Retire the old manual pause preference. Device motion settings still apply.
    this.paused = false;
    setPref("motionPaused", false);
    this.blocked = false;
    this.frame = 0;
    this.last = 0;
    this.phase = 0;
    this.sequence = 0;
    this.forwardFlightUntil = 0;
    const themeBase = new URL("./themes/", import.meta.url);
    this.themeBase = themeBase;
    this.manifest = await fetch(new URL("manifest.json", themeBase), {
      cache: "no-store", signal:AbortSignal.timeout(5000),
    }).then((r) => {
      if (!r.ok) throw Error("Темы недоступны");
      return r.json();
    }).catch(()=>FALLBACK_THEMES);
    if(!Array.isArray(this.manifest)||!this.manifest.length)this.manifest=FALLBACK_THEMES;
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
    this.reduced.addEventListener("change", () => this.sync());
    window.addEventListener('syolana:scene-ready',()=>this.draw(0));
    this.sync();
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
  async select(id,{force=false}={}) {
    if(!force&&this.id===id&&this.theme)return;
    const seq = ++this.sequence;
    const item = this.manifest.find((t) => t.id === id);
    if (!item) return;
    const url = new URL(item.module, this.themeBase || new URL("./themes/", import.meta.url));
    if (url.origin !== (this.themeBase || url).origin) throw Error("Invalid theme");
    const version = new URL(import.meta.url).searchParams.get("v") || "20261011-worlds-2";
    if (version) url.searchParams.set("v", version);
    let module;try{module=await import(url.href);}catch{url.searchParams.set('retry','1');module=await import(url.href);}const theme=module.default;
    if (seq !== this.sequence) return;
    this.sceneEvents?.abort();
    this.custom?.dispose?.();
    this.sceneLost = false;
    this.qualityScale = 1;
    this.custom =
      this.ctx && theme.createRenderer ? theme.createRenderer(this.ctx) : null;
    this.theme = theme;
    const sceneCanvas=this.custom?.canvas||this.canvas.previousElementSibling;
    if(sceneCanvas?.classList?.contains('theme-world-canvas')){
      this.sceneEvents=new AbortController();
      sceneCanvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.sceneLost=true;},{signal:this.sceneEvents.signal});
      sceneCanvas.addEventListener('webglcontextrestored',()=>{if(this.id===id)this.select(id,{force:true}).catch(()=>{});},{signal:this.sceneEvents.signal});
    }
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
      ratio = Math.min(devicePixelRatio || 1, w <= 700 ? 1.75 : 2);
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
    this.custom?.resize?.({ width: w, height: h, ratio:ratio*(this.qualityScale||1) });
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
    if(!this.sceneLost)this.custom?.draw?.({
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
      const light=this.theme.markDark?35:75;
      g.addColorStop(0, `hsl(${hue},76%,${light}%)`);
      g.addColorStop(0.48, `hsl(${(hue + 58) % 360},82%,${light+5}%)`);
      g.addColorStop(1, `hsl(${(hue + 116) % 360},76%,${light-2}%)`);
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
    this.custom?.resize?.({width:this.w,height:this.h,ratio:this.ratio*(this.qualityScale||1)});
    this.forwardFlightUntil = 0;
    // Enter the exact current theme, without replacing or restarting its animation.
    this.camera = { x: 0, y: 0, z: 0, tx: 0, ty: 0, tz: 0, vz: 0 };
    const background=document.querySelector(".aurora-background");if(background)background.style.transform = "";
    document.getElementById("flight-layer")?.toggleAttribute("hidden", !active);
    this.sync();
  }
  move(dx = 0, dy = 0, dz = 0) {
    if (!this.zen) return;
    const cam = this.camera;

    // Only forward depth flight clears the view. Sideways/up/down exploration
    // and backwards movement keep Syolana feature cards available.
    if (dz > 0.001) this.forwardFlightUntil = performance.now() + 1050;
    else if (dz < -0.001) this.forwardFlightUntil = 0;
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
    const blend = d ? 1 - Math.exp(-d * cameraSmoothing) : this.reduced?.matches?1:0;
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
    const bounds=this.theme?.flightBounds;
    if(bounds){
      for(const [key,target] of [['x','tx'],['y','ty'],['z','tz']]){
        if(Number.isFinite(bounds[key]))cam[target]=Math.max(-bounds[key],Math.min(bounds[key],cam[target]));
      }
    }
    cam.x += (cam.tx - cam.x) * blend;
    cam.y += (cam.ty - cam.y) * blend;
    cam.z += (cam.tz - cam.z) * blend;
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
    const nodes = [...document.querySelectorAll(".flight-planet")];
    if (!nodes.length) return;
    const layer = document.getElementById("flight-layer");
    const count = this.w >= 1000 ? Math.min(2, nodes.length) : 1;
    // Keep the invitation still while someone reads, taps, hovers or focuses it.
    if (!layer?.matches(":focus-within") && !layer?.dataset.cardEngaged)
      this.flightOffer = (Number(layer?.dataset.offerIndex || 0) + Math.floor(this.phase / 18)) % nodes.length;
    const start = this.flightOffer || 0;
    nodes.forEach((node, i) => {
      const position = (i - start + nodes.length) % nodes.length;
      const visible = position < count;
      node.style.opacity = visible ? "1" : "0";
      node.style.pointerEvents = visible ? "auto" : "none";
      node.tabIndex = visible ? 0 : -1;
      node.setAttribute("aria-hidden", String(!visible));
      const offset = count === 2 ? (position ? 210 : -210) : 0;
      node.style.transform = `translateX(calc(-50% + ${offset}px))`;
    });
  }
  startPreviews() {
    cancelAnimationFrame(this.previewFrame);
    this.previewImages ||= new Map();let painted=-1000;
    const draw=time=>{
      if(document.hidden)return;
      if(time-painted<1000/12){this.previewFrame=requestAnimationFrame(draw);return;}painted=time;
      for(const canvas of document.querySelectorAll('canvas[data-preview]')){
        const rect=canvas.getBoundingClientRect();
        if(!rect.width||!rect.height||rect.bottom<0||rect.top>innerHeight||rect.right<0||rect.left>innerWidth)continue;
        const id=canvas.dataset.preview,c=canvas.getContext('2d');if(!c)continue;
        let poster=this.previewImages.get(id);
        if(!poster){poster=new Image();poster.decoding='async';poster.src=new URL('previews/'+id+'.jpg?v=20261011-worlds-2',this.themeBase).href;poster.onload=()=>{if(this.reduced.matches)this.startPreviews();};this.previewImages.set(id,poster);}
        if(!poster.complete||!poster.naturalWidth)continue;
        const w=canvas.width,h=canvas.height,zoom=this.reduced.matches?1:1.035+Math.sin(time/1000*.14)*.012;
        const base=Math.max(w/poster.naturalWidth,h/poster.naturalHeight),dw=poster.naturalWidth*base*zoom,dh=poster.naturalHeight*base*zoom;
        c.clearRect(0,0,w,h);c.drawImage(poster,(w-dw)/2,(h-dh)/2,dw,dh);
      }
      if(!this.reduced.matches)this.previewFrame=requestAnimationFrame(draw);
    };draw(0);
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
    let sampleFrames=0,sampleStart=0;
    const tick = t => {
      const elapsed=this.last?(t-this.last)/1000:1/60;
      this.last=t;this.draw(Math.min(elapsed,.1));
      if(!sampleStart)sampleStart=t;sampleFrames++;
      if(t-sampleStart>2400){
        const fps=sampleFrames*1000/(t-sampleStart),previous=this.qualityScale||1;
        if(this.custom&&fps<36)this.qualityScale=Math.max(.62,previous-.12);
        else if(this.custom&&fps>56)this.qualityScale=Math.min(1,previous+.04);
        if((this.qualityScale||1)!==previous)this.custom?.resize?.({width:this.w,height:this.h,ratio:this.ratio*this.qualityScale});
        sampleFrames=0;sampleStart=t;
      }
      this.frame=requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }
}
