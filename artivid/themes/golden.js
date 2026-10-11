import {createCelestialRenderer} from './celestial-world.mjs?v=20261011-worlds-2';
export default {
  createRenderer:ctx=>createCelestialRenderer(ctx,"golden"),
  id: "golden",
  marks: true,
  cameraSmoothing: 4.2,
  renderer: "webgl-golden-filaments",
  particles: false,
  continuousDepth: true,
  depthDirectScale: .45,
  depthGain: .6,
  depthCap: 1.5,
  accent: "#efd39e",
  dim: "#d8cfbf",
  surface: "24,20,20",
  panel: {
    bg: "rgba(42,31,23,.58)",
    border: "rgba(239,211,158,.29)",
    glow: "rgba(229,178,91,.18)",
    text: "#fff7e8",
    muted: "#ded2be"
  },
  radius: "14px",
  heading: "Georgia, serif",
  body: '"Nunito", system-ui, sans-serif',
  colors: ["#ffd48c", "#d9a7fd", "#f0e1b4", "#eaaa66", "#efe1ff"],
};
