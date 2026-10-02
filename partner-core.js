const ROOT = new URL("./", import.meta.url);

const THEMES = [
  {
    id: "aurora",
    name: "Сияние звёзд",
    accent: "#d0b4ff",
    surface: "12,12,25",
    colors: ["#FF003C", "#0055FF", "#FFB300", "#00C853", "#AA00FF", "#00E5FF"],
    mode: "stars",
  },
  {
    id: "golden",
    name: "Золотая волна",
    accent: "#efd39e",
    surface: "24,20,20",
    colors: ["#ffd48c", "#d9a7fd", "#f0e1b4", "#eaaa66", "#efe1ff"],
    mode: "waves",
  },
  {
    id: "moon",
    name: "Лунный сад",
    accent: "#b4dbef",
    surface: "10,20,32",
    colors: ["#bce6f4", "#acb6ff", "#e8d9ff", "#8fcfd5", "#d9e8ff"],
    mode: "petals",
  },
  {
    id: "white-ocean-city",
    name: "Белый город над океаном",
    accent: "#dce9e8",
    surface: "17,28,33",
    colors: ["#eef4f2", "#d8e6e5", "#b7ced0", "#f4e9da"],
    mode: "ocean",
  },
];

function make(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function coreStyles() {
  return `
    body.syolana-core-active {
      background: transparent !important;
    }
    #syolana-partner-layer {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
      background: #06070d;
    }
    #syolana-partner-layer canvas {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }
    .syolana-core-controls {
      position: fixed;
      right: max(16px, env(safe-area-inset-right));
      top: max(16px, env(safe-area-inset-top));
      z-index: 50;
      display: flex;
      gap: 8px;
      align-items: center;
      pointer-events: auto;
    }
    .syolana-core-pill,
    .syolana-core-btn {
      border: 1px solid rgba(225,211,255,.26);
      background: rgba(12,10,22,.72);
      color: #f7f2fb;
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      box-shadow: 0 10px 34px rgba(0,0,0,.24);
    }
    .syolana-core-pill {
      min-height: 42px;
      padding: 7px 11px 7px 8px;
      border-radius: 999px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font: 600 12px/1 system-ui, sans-serif;
      letter-spacing: .04em;
    }
    .syolana-core-pill img {
      width: 28px;
      height: 28px;
      object-fit: contain;
    }
    .syolana-core-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      cursor: pointer;
      font: 600 16px/1 system-ui, sans-serif;
    }
    .syolana-core-player {
      position: fixed;
      left: 50%;
      bottom: max(18px, env(safe-area-inset-bottom));
      transform: translateX(-50%);
      z-index: 50;
      width: min(520px, calc(100vw - 32px));
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 13px;
      border: 1px solid rgba(225,211,255,.25);
      border-radius: 20px;
      background: rgba(10,9,18,.82);
      color: #f7f3fb;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 16px 50px rgba(0,0,0,.35);
      pointer-events: auto;
    }
    .syolana-core-player button {
      flex: 0 0 auto;
      width: 42px;
      height: 42px;
      border: 1px solid rgba(225,211,255,.26);
      border-radius: 50%;
      background: rgba(130,101,177,.20);
      color: inherit;
      cursor: pointer;
    }
    .syolana-core-track {
      min-width: 0;
      flex: 1;
    }
    .syolana-core-track strong,
    .syolana-core-track small {
      display: block;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
    }
    .syolana-core-track small {
      margin-top: 4px;
      color: #bdb4c8;
      font: 12px/1.3 system-ui, sans-serif;
    }
    @media (max-width: 620px) {
      .syolana-core-pill span { display: none; }
      .syolana-core-pill { padding-right: 7px; }
    }
  `;
}

function createParticleState(theme, width, height) {
  return Array.from({ length: width <= 700 ? 220 : 420 }, (_, i) => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: .5 + Math.random() * 2.4,
    vx: -8 + Math.random() * 16,
    vy: 12 + Math.random() * 56,
    color: theme.colors[i % theme.colors.length],
    phase: Math.random() * Math.PI * 2,
  }));
}

function drawOcean(ctx, w, h, time, theme) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, "#223947");
  g.addColorStop(.5, "#6c858b");
  g.addColorStop(.51, "#315963");
  g.addColorStop(1, "#0b2028");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  ctx.globalAlpha = .32;
  for (let line = 0; line < 18; line++) {
    ctx.beginPath();
    for (let x = 0; x <= w + 8; x += 8) {
      const y = h * .55 + line * 10 + Math.sin(x * .022 + time * .35 + line * .42) * (6 + line * .2);
      if (!x) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = theme.colors[line % theme.colors.length];
    ctx.lineWidth = .7;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function drawWaves(ctx, w, h, time, theme) {
  for (let line = 0; line < 20; line++) {
    ctx.beginPath();
    for (let x = 0; x <= w + 8; x += 8) {
      const y = h * .58 + Math.sin(x / 56 + time * .34 + line * .12) * 34 + line * 8;
      if (!x) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = theme.colors[line % theme.colors.length] + "34";
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawParticles(ctx, state, w, h, delta, time, theme) {
  for (const p of state) {
    p.x += p.vx * delta;
    p.y -= p.vy * delta;
    p.phase += delta * 1.4;
    if (p.y < -20) {
      p.y = h + 20;
      p.x = Math.random() * w;
    }
    if (p.x < -20) p.x = w + 20;
    if (p.x > w + 20) p.x = -20;

    const alpha = .2 + (.5 + Math.sin(p.phase) * .5) * .45;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;

    if (theme.mode === "petals" && Math.round(p.r * 10) % 4 === 0) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.phase * .15);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.r * 2.4, p.r * .7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  ctx.globalAlpha = 1;

  if (theme.mode !== "ocean") {
    ctx.globalAlpha = .12;
    ctx.fillStyle = theme.accent;
    for (let i = 0; i < 8; i++) {
      const x = ((i * 197 + time * 7) % (w + 220)) - 110;
      const y = ((i * 113 + 40) % Math.max(1, h));
      ctx.font = "500 14px system-ui,sans-serif";
      ctx.fillText("syolana.com", x, y);
    }
    ctx.globalAlpha = 1;
  }
}

export async function mountPartnerLayer(options = {}) {
  if (document.querySelector("#syolana-partner-layer")) {
    return { destroy() {} };
  }

  const features = options.features || {};
  const style = make("style");
  style.dataset.syolanaCore = "true";
  style.textContent = coreStyles();
  document.head.append(style);

  const layer = make("div");
  layer.id = "syolana-partner-layer";
  layer.setAttribute("aria-hidden", "true");
  const canvas = make("canvas");
  layer.append(canvas);
  document.body.prepend(layer);

  const controls = make("div", "syolana-core-controls");
  const badge = make("a", "syolana-core-pill");
  badge.href = new URL("./", ROOT).href;
  badge.target = "_blank";
  badge.rel = "noopener noreferrer";
  const logo = make("img");
  logo.src = new URL("assets/logo.svg", ROOT).href;
  logo.alt = "";
  const badgeText = make("span", "", "Syolana");
  badge.append(logo, badgeText);
  controls.append(badge);

  const themeButton = make("button", "syolana-core-btn", "✦");
  themeButton.type = "button";
  themeButton.title = "Сменить живую тему";
  controls.append(themeButton);
  document.body.append(controls);

  let audio = null;
  let player = null;
  let playButton = null;
  let songs = [];
  let songIndex = 0;

  if (features.player !== false) {
    try {
      const config = await fetch(new URL("config.json", ROOT), { cache: "default" }).then((r) => r.json());
      songs = (config.songs || []).map((song) => ({
        ...song,
        src: new URL(song.src, ROOT).href,
      }));
    } catch {}

    if (songs.length) {
      audio = new Audio();
      audio.preload = "metadata";
      audio.volume = .34;
      audio.src = songs[0].src;

      player = make("div", "syolana-core-player");
      playButton = make("button", "", "▶");
      playButton.type = "button";
      playButton.setAttribute("aria-label", "Включить музыку");

      const track = make("div", "syolana-core-track");
      const title = make("strong", "", songs[0].title || "Музыка");
      const meta = make("small", "", songs[0].sourceTitle || "Музыкальная сцена");
      track.append(title, meta);

      const next = make("button", "", "›");
      next.type = "button";
      next.setAttribute("aria-label", "Следующий трек");

      const sync = () => {
        const current = songs[songIndex];
        title.textContent = current.title || "Музыка";
        meta.textContent = current.sourceTitle || "Музыкальная сцена";
        playButton.textContent = audio.paused ? "▶" : "Ⅱ";
        playButton.setAttribute("aria-label", audio.paused ? "Включить музыку" : "Пауза");
      };

      playButton.onclick = async () => {
        try {
          if (audio.paused) await audio.play();
          else audio.pause();
        } catch {}
        sync();
      };

      next.onclick = async () => {
        const wasPlaying = !audio.paused;
        songIndex = (songIndex + 1) % songs.length;
        audio.pause();
        audio.src = songs[songIndex].src;
        audio.load();
        sync();
        if (wasPlaying) {
          try { await audio.play(); } catch {}
          sync();
        }
      };

      audio.addEventListener("play", sync);
      audio.addEventListener("pause", sync);
      audio.addEventListener("ended", () => next.click());

      player.append(playButton, track, next);
      document.body.append(player);
    }
  }

  const ctx = canvas.getContext("2d");
  let themeIndex = Math.max(0, THEMES.findIndex((t) => t.id === options.theme));
  let theme = THEMES[themeIndex];
  let particles = [];
  let width = 1;
  let height = 1;
  let ratio = 1;
  let frame = 0;
  let last = 0;

  const applyTheme = () => {
    theme = THEMES[themeIndex];
    document.documentElement.style.setProperty("--accent", theme.accent);
    document.documentElement.style.setProperty("--surface", theme.surface);
    document.documentElement.dataset.partnerTheme = theme.id;
    themeButton.title = "Тема: " + theme.name;
    particles = createParticleState(theme, width, height);
  };

  const resize = () => {
    width = Math.max(1, innerWidth);
    height = Math.max(1, innerHeight);
    ratio = Math.min(devicePixelRatio || 1, width <= 700 ? 1.4 : 1.8);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    particles = createParticleState(theme, width, height);
  };

  const draw = (now) => {
    const delta = last ? Math.min(.05, (now - last) / 1000) : 0;
    last = now;
    ctx.clearRect(0, 0, width, height);

    if (theme.mode === "ocean") drawOcean(ctx, width, height, now / 1000, theme);
    else {
      const g = ctx.createLinearGradient(0, 0, width, height);
      if (theme.id === "golden") {
        g.addColorStop(0, "#27160f");
        g.addColorStop(.45, "#17101d");
        g.addColorStop(1, "#05060c");
      } else if (theme.id === "moon") {
        g.addColorStop(0, "#132b3a");
        g.addColorStop(.5, "#172036");
        g.addColorStop(1, "#05060d");
      } else {
        g.addColorStop(0, "#101b4b");
        g.addColorStop(.45, "#45264d");
        g.addColorStop(1, "#061016");
      }
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, width, height);
    }

    if (theme.mode === "waves") drawWaves(ctx, width, height, now / 1000, theme);
    drawParticles(ctx, particles, width, height, delta, now / 1000, theme);
    frame = requestAnimationFrame(draw);
  };

  themeButton.onclick = () => {
    themeIndex = (themeIndex + 1) % THEMES.length;
    applyTheme();
  };

  document.body.classList.add("syolana-core-active");
  applyTheme();
  resize();
  addEventListener("resize", resize, { passive: true });
  frame = requestAnimationFrame(draw);

  return {
    destroy() {
      cancelAnimationFrame(frame);
      removeEventListener("resize", resize);
      audio?.pause();
      audio?.removeAttribute("src");
      player?.remove();
      controls.remove();
      layer.remove();
      style.remove();
      document.body.classList.remove("syolana-core-active");
      delete document.documentElement.dataset.partnerTheme;
    },
  };
}
