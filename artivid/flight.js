import { el, link } from "./utils.js";

export const FLIGHT_HINT =
  "Мышь: тяните фон, колесо — глубина. Экран: свайп — направление, щипок — глубина.";

export const PLATFORM_FLIGHT_OFFERS = [
  [
    "Сайт с вашей атмосферой",
    "Обсудить на Авито",
    "https://www.avito.ru/brands/i223140984"
  ],
  [
    "Книги с живым фоном",
    "Читать с музыкой",
    "#/library"
  ],
  [
    "Английский A1",
    "Начать бесплатно",
    "#/languages/en"
  ],
  [
    "Песни Syolana",
    "Включить музыку",
    "#/songs"
  ],
  [
    "Выберите свой язык",
    "Слова, правила, практика",
    "#/languages"
  ]
];

export function platformFlightOffers(baseURL = document.baseURI) {
  return PLATFORM_FLIGHT_OFFERS.map(([title, subtitle, href]) => [
    title,
    subtitle,
    href.startsWith("#") ? new URL(href, baseURL).href : href,
  ]);
}

export function updateFlightSpacing(layer,dock,hint,viewportBottom=innerHeight){
  const layerBox=layer.getBoundingClientRect?.(),dockBox=dock?.getBoundingClientRect?.(),hintBox=hint?.getBoundingClientRect?.();
  const bottom=layerBox?.height?layerBox.bottom:viewportBottom;
  const computed=dock?.ownerDocument?.defaultView?.getComputedStyle?.(dock);
  const cssBottom=parseFloat(computed?.bottom);
  const oldPlayerOffset=parseFloat(layer.parentElement?.style.getPropertyValue?.('--zen-player-row-offset'))||0;
  const bottomGap=Math.max(16,Number.isFinite(cssBottom)?cssBottom-oldPlayerOffset:dockBox?.height?bottom-dockBox.bottom:16);
  const cards=[...layer.querySelectorAll('.flight-planet')];
  layer.style.removeProperty?.('--zen-card-height');
  const cardHeight=cards.length?Math.ceil(Math.max(56,...cards.map(node=>node.getBoundingClientRect?.().height||0))):0;
  const playerHeight=dockBox?.height||56;
  const playerOffset=cardHeight?Math.max(0,(cardHeight-playerHeight)/2):0;
  layer.parentElement?.style.setProperty('--zen-player-row-offset',playerOffset+'px');
  layer.style.setProperty('--zen-card-height',cardHeight+'px');
  const hintHeight=Math.ceil(hintBox?.height||0);
  layer.style.setProperty('--zen-player-space',bottomGap+'px');
  layer.style.setProperty('--zen-hint-height',hintHeight+'px');
  layer.style.setProperty('--zen-card-bottom',bottomGap+'px');
  const hintBottom=bottomGap+(cardHeight?cardHeight+10:0);
  layer.style.setProperty('--zen-hint-bottom',hintBottom+'px');
  layer.parentElement?.style.setProperty('--zen-contact-bottom',(hintBottom+hintHeight+18)+'px');
  return{bottomGap,cardHeight,hintHeight};
}

export function setupFlightLayer({
  theme,
  offers = [],
  markInjected = false,
} = {}) {
  const existing = document.getElementById("flight-layer");
  if (existing) return existing;

  const cleanups=[];
  const listen=(target,event,handler,options)=>{if(!target)return;target.addEventListener(event,handler,options);cleanups.push(()=>target.removeEventListener(event,handler,options));};
  let resizeObserver;
  const layer = el("div");
  layer.id = "flight-layer";
  layer.hidden = true;
  if (markInjected) layer.dataset.syolanaInjected = "true";
  layer.setAttribute("aria-label", FLIGHT_HINT);

  for (const [title, subtitle, url] of offers) {
    const a = link("", url, "flight-planet");
    const copy = el("span", "flight-copy");
    copy.append(el("strong", "", title), el("small", "", subtitle));
    const icon = el("span", "planet-orb");
    icon.innerHTML="<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" aria-hidden=\"true\" focusable=\"false\"><path d=\"m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6L12 3Z\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linejoin=\"round\"/></svg>";
    icon.setAttribute("aria-hidden", "true");
    const arrow = el("span", "flight-arrow");
    arrow.innerHTML="<svg viewBox=\"0 0 24 24\" width=\"16\" height=\"16\" aria-hidden=\"true\" focusable=\"false\"><path d=\"M6 18 18 6M6 6h12v12\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.7\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg>";
    arrow.setAttribute("aria-hidden", "true");
    a.append(icon, copy, arrow);
    a.hidden=layer.querySelectorAll(".flight-planet").length>0;
    a.style.opacity="1";
    layer.append(a);
  }

  const hint=el("p", "flight-hint", FLIGHT_HINT);
  layer.append(hint);
  document.body.append(layer);

  const measurePlayer = () => updateFlightSpacing(layer,document.getElementById("music-dock"),hint);
  if (typeof ResizeObserver !== "undefined") {
    const dock = document.getElementById("music-dock");
    const observer=new ResizeObserver(measurePlayer);resizeObserver=observer;
    if (dock) observer.observe(dock);
    observer.observe(hint);
    for(const card of layer.querySelectorAll('.flight-planet')){
      observer.observe(card);
      const copy=card.querySelector('.flight-copy');if(copy)observer.observe(copy);
    }
    observer.observe(layer);
  }
  listen(window,"resize", measurePlayer, { passive: true });
  listen(window.visualViewport,'resize',measurePlayer,{passive:true});
  document.fonts?.ready.then(measurePlayer);
  measurePlayer();
  for (const node of layer.querySelectorAll(".flight-planet")) {
    node.addEventListener("pointerenter", () => { layer.dataset.cardEngaged = "true"; });
    node.addEventListener("pointerleave", () => { delete layer.dataset.cardEngaged; });
    node.addEventListener("touchend", () => { delete layer.dataset.cardEngaged; }, { passive: true });
  }

  const pointers = new Map();
  let pinch = 0;
  const distance = () => {
    const [a, b] = [...pointers.values()];
    return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
  };

  let suppressClickUntil = 0;

  layer.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch") return;
    const interactive = e.target.closest("a,button");
    if(!interactive)theme.selectAt?.(e.clientX,e.clientY);
    pointers.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      interactive,
      dragged: false,
    });
    layer.setPointerCapture?.(e.pointerId);
    pinch = distance();
  });

  layer.addEventListener(
    "pointermove",
    (e) => {
      if (e.pointerType === "touch") return;
      const prev = pointers.get(e.pointerId);
      if (!prev) return;

      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;

      if (
        !prev.dragged &&
        Math.hypot(e.clientX - prev.startX, e.clientY - prev.startY) > 7
      )
        prev.dragged = true;

      prev.x = e.clientX;
      prev.y = e.clientY;
      pointers.set(e.pointerId, prev);

      if (prev.dragged && prev.interactive) e.preventDefault();

      if (pointers.size > 1) {
        const next = distance();
        if (pinch && next) theme.move(0, 0, Math.log(next / pinch) * 6);
        pinch = next;
      } else {
        e.preventDefault();
        const panScale = Number.isFinite(theme.theme?.gesturePanScale)
          ? theme.theme.gesturePanScale
          : Math.min(innerWidth, innerHeight) <= 700
            ? 175
            : Math.max(360, Math.min(innerWidth, innerHeight));

        if(theme.flowerSelected){
          if(e.shiftKey)theme.move(dx/260,-dy/260,0);
          else theme.rotateSelected?.(dx/panScale,-dy/panScale);
        } else if (theme.theme?.pathDepthGestures) {
          theme.move(
            dx / (panScale * 0.82),
            -dy / (panScale * 2.15),
            -dy / (panScale * 0.66),
          );
        } else {
          theme.move(dx / (panScale * 0.72), -dy / (panScale * 0.72), 0);
        }
      }
    },
    { passive: false },
  );

  const end = (e) => {
    if (e.pointerType === "touch") return;
    const meta = pointers.get(e.pointerId);
    if (meta?.dragged) suppressClickUntil = performance.now() + 320;
    else if (meta?.interactive) theme.settle?.();
    else if(meta)theme.selectAt?.(e.clientX,e.clientY,true);
    pointers.delete(e.pointerId);
    pinch = distance();
  };

  layer.addEventListener("pointerup", end);
  layer.addEventListener("pointercancel", end);

  layer.addEventListener(
    "click",
    (e) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  let touchTap = null;
  let touchLast = null;
  let touchPinch = 0;
  let touchCenterY = 0, touchCenterX = 0;

  const touchDistance = (list) => {
    if (list.length < 2) return 0;
    const a = list[0];
    const b = list[1];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  layer.addEventListener(
    "touchstart",
    (e) => {
      if (!document.body.classList.contains("zen")) return;

      if (e.touches.length === 1) {
        const t = e.touches[0];
        const interactive=!!e.target.closest('a,button');
        touchTap={x:t.clientX,y:t.clientY,moved:false,interactive};
        if(!interactive)theme.selectAt?.(t.clientX,t.clientY);
        touchLast = { x: t.clientX, y: t.clientY };
        touchPinch = 0;
      } else if (e.touches.length >= 2) {
        if(touchTap)touchTap.moved=true;
        touchLast = null;
        touchPinch = touchDistance(e.touches);
        touchCenterY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
        touchCenterX = (e.touches[0].clientX + e.touches[1].clientX) * 0.5;
      }
    },
    { passive: false },
  );

  layer.addEventListener(
    "touchmove",
    (e) => {
      if (!document.body.classList.contains("zen")) return;
      e.preventDefault();

      if (e.touches.length === 1) {
        const t = e.touches[0];

        if (touchLast) {
          if(touchTap&&Math.hypot(t.clientX-touchTap.x,t.clientY-touchTap.y)>7)touchTap.moved=true;
          const dx = t.clientX - touchLast.x;
          const dy = t.clientY - touchLast.y;
          const scale = Number.isFinite(theme.theme?.gesturePanScale)
            ? theme.theme.gesturePanScale
            : Math.min(innerWidth, innerHeight) <= 700 ? 74 : 180;

          if(theme.flowerSelected){
            theme.rotateSelected?.(dx/scale,-dy/scale);
          } else if (theme.theme?.pathDepthGestures) {
            theme.move(
              dx / (scale * 1.05),
              -dy / (scale * 2.25),
              -dy / (scale * 0.72),
            );
          } else {
            theme.move(dx / scale, -dy / scale, 0);
          }
        }

        touchLast = { x: t.clientX, y: t.clientY };
        touchPinch = 0;
      } else if (e.touches.length >= 2) {
        const next = touchDistance(e.touches);
        const centerY =
          (e.touches[0].clientY + e.touches[1].clientY) * 0.5;

        let dz = 0;
        if (touchPinch && next) dz += Math.log(next / touchPinch) * 9;
        const centerX=(e.touches[0].clientX+e.touches[1].clientX)*.5;
        if(theme.flowerSelected){
          theme.move((centerX-touchCenterX)/260,(touchCenterY-centerY)/260,dz);
        }else{
          if (touchCenterY) dz += (touchCenterY - centerY) / 28;
          if (Math.abs(dz) > 0.001) theme.move(0, 0, dz);
        }
        touchCenterX=centerX;

        touchPinch = next;
        touchCenterY = centerY;
        touchLast = null;
      }
    },
    { passive: false },
  );

  const touchEnd = (e) => {
    if (e.touches.length === 1) {
      const t = e.touches[0];
      touchLast = { x: t.clientX, y: t.clientY };
    } else {
      if(touchTap&&!touchTap.moved&&!touchTap.interactive&&e.type!=="touchcancel")theme.selectAt?.(touchTap.x,touchTap.y,true);
      if(touchTap?.moved)suppressClickUntil=performance.now()+320;
      touchTap=null;
      touchLast = null;
      touchPinch = 0;
      touchCenterY = 0;
      touchCenterX = 0;
    }
  };

  layer.addEventListener("touchend", touchEnd, { passive: true });
  layer.addEventListener("touchcancel", touchEnd, { passive: true });

  layer.addEventListener(
    "wheel",
    (e) => {
      e.preventDefault();
      const delta =
        e.deltaY *
        (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1);
      theme.move(0, 0, Math.max(-160, Math.min(160, delta)) * 0.009);
    },
    { passive: false },
  );

  listen(document,"keydown", (e) => {
    if (
      !document.body.classList.contains("zen") ||
      e.target.closest("dialog,input,textarea,select")
    )
      return;

    const keys = {
      ArrowLeft: [-0.15, 0, 0],
      ArrowRight: [0.15, 0, 0],
      ArrowUp: [0, 0.15, 0],
      ArrowDown: [0, -0.15, 0],
      "+": [0, 0, 0.9],
      "=": [0, 0, 0.9],
      "-": [0, 0, -0.9],
    };

    if (keys[e.key]) {
      e.preventDefault();
      theme.move(...keys[e.key]);
    }
  });

  layer.destroy=()=>{resizeObserver?.disconnect();for(const cleanup of cleanups)cleanup();pointers.clear();layer.parentElement?.style.removeProperty('--zen-contact-bottom');layer.parentElement?.style.removeProperty('--zen-player-row-offset');layer.remove();};
  return layer;
}
