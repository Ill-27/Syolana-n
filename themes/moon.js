import {createBotanicalRenderer} from './botanical-world.mjs?v=20261011-worlds-2';
export default {
  createRenderer:ctx=>createBotanicalRenderer(ctx,"moon"),
  id: "moon",
  marks: true,
  cameraSmoothing: 4.2,
  renderer: "webgl-moonlit-garden",
  particles: false,
  continuousDepth: true,
  depthDirectScale: .40,
  depthGain: .5,
  depthCap: 1.3,
  accent: "#b4dbef",
  dim: "#c0d0e2",
  surface: "10,20,32",
  panel: {
    bg: "rgba(14,29,45,.58)",
    border: "rgba(180,219,239,.28)",
    glow: "rgba(116,184,218,.19)",
    text: "#f4fbff",
    muted: "#c7d8e5"
  },
  radius: "32px",
  heading: '"Cormorant Garamond", Georgia, serif',
  body: "Verdana, system-ui, sans-serif",
  colors: ["#bce6f4", "#acb6ff", "#e8d9ff", "#8fcfd5", "#d9e8ff"],
};
