import {createBotanicalRenderer} from './botanical-world.mjs?v=20261011-worlds-2';
export default {
 id:'lunar-muse',renderer:'webgl-lunar-muse',particles:false,marks:true,continuousDepth:true,
 cameraSmoothing:4.2,depthDirectScale:.4,depthGain:.5,depthCap:1.3,depthDamping:4,
 accent:'#d8c6ff',dim:'#d3daef',surface:'10,14,36',radius:'28px',buttonRadius:'28px',
 colors:['#82b5f2','#c6b6ed','#deb76b','#547bc3'],
 panel:{bg:'rgba(13,17,42,.68)',border:'rgba(153,180,244,.31)',glow:'rgba(96,118,204,.18)',text:'#faf8ff',muted:'#d5dcef'},
 createRenderer:ctx=>createBotanicalRenderer(ctx,'lunar'),
};
