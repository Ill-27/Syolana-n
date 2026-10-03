import { el, link } from "./utils.js";

export const FLIGHT_HINT =
  "Перемещайтесь в пространстве с помощью мыши или жестов";

export function setupFlightLayer({
  theme,
  offers = [],
  markInjected = false,
} = {}) {
  const existing = document.getElementById("flight-layer");
  if (existing) return existing;

  const layer = el("div");
  layer.id = "flight-layer";
  layer.hidden = true;
  if (markInjected) layer.dataset.syolanaInjected = "true";
  layer.setAttribute("aria-label", FLIGHT_HINT);

  for (const [title, subtitle, url] of offers) {
    const a = link("", url, "flight-planet");
    a.append(
      el("span", "planet-orb", "✧"),
      el("strong", "", title),
      el("small", "", subtitle),
    );
    layer.append(a);
  }

  layer.append(el("p", "flight-hint", FLIGHT_HINT));
  document.body.append(layer);

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
        const panScale =
          Math.min(innerWidth, innerHeight) <= 700
            ? 175
            : Math.max(360, Math.min(innerWidth, innerHeight));

        if (theme.theme?.pathDepthGestures) {
          theme.move(
            dx / (panScale * 0.82),
            -dy / (panScale * 3.8),
            -dy / (panScale * 0.52),
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

  let touchLast = null;
  let touchPinch = 0;
  let touchCenterY = 0;

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
        touchLast = { x: t.clientX, y: t.clientY };
        touchPinch = 0;
      } else if (e.touches.length >= 2) {
        touchLast = null;
        touchPinch = touchDistance(e.touches);
        touchCenterY = (e.touches[0].clientY + e.touches[1].clientY) * 0.5;
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
          const dx = t.clientX - touchLast.x;
          const dy = t.clientY - touchLast.y;
          const scale = Math.min(innerWidth, innerHeight) <= 700 ? 74 : 180;

          if (theme.theme?.pathDepthGestures) {
            theme.move(
              dx / (scale * 1.05),
              -dy / (scale * 4.4),
              -dy / (scale * 0.62),
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
        if (touchCenterY) dz += (touchCenterY - centerY) / 28;
        if (Math.abs(dz) > 0.001) theme.move(0, 0, dz);

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
      touchLast = null;
      touchPinch = 0;
      touchCenterY = 0;
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

  document.addEventListener("keydown", (e) => {
    if (
      !document.body.classList.contains("zen") ||
      e.target.closest("dialog,input,textarea,select")
    )
      return;

    const keys = {
      ArrowLeft: [-0.15, 0, 0],
      ArrowRight: [0.15, 0, 0],
      ArrowUp: [0, -0.15, 0],
      ArrowDown: [0, 0.15, 0],
      "+": [0, 0, 0.9],
      "=": [0, 0, 0.9],
      "-": [0, 0, -0.9],
    };

    if (keys[e.key]) {
      e.preventDefault();
      theme.move(...keys[e.key]);
    }
  });

  return layer;
}
