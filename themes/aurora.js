import {createCelestialRenderer} from './celestial-world.mjs?v=20261011-worlds-2';
export default {
  createRenderer:ctx=>createCelestialRenderer(ctx,"aurora"),
  id: "aurora",
  marks: true,
  cameraSmoothing: 4.2,
  renderer: "webgl-volumetric-aurora",
  particles: false,
  continuousDepth: true,
  depthDirectScale: .45,
  depthGain: .6,
  depthCap: 1.5,
  accent: "#d0b4ff",
  dim: "#d0cadf",
  surface: "12,12,25",
  panel: {
    bg: "rgba(18,14,36,.58)",
    border: "rgba(213,186,255,.27)",
    glow: "rgba(171,122,255,.20)",
    text: "#faf6ff",
    muted: "#d8cdea"
  },
  radius: "24px",
  heading: '"Cormorant Garamond", Georgia, serif',
  body: '"Nunito", system-ui, sans-serif',
  colors: ["#FF003C", "#0055FF", "#FFB300", "#00C853", "#AA00FF", "#00E5FF"],
};
