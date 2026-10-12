import {createBotanicalRenderer} from './botanical-world.mjs?v=20261012-bloom-control-1';
export default {
 id:'violet-bloom',renderer:'webgl-sculpted-bloom',particles:false,marks:true,markDark:true,continuousDepth:true,
 gesturePanScale:260,cameraSmoothing:4.2,depthDirectScale:.4,depthGain:.5,depthCap:1.3,depthDamping:4,
 accent:'#ecd7ff',dim:'#e7d9ef',surface:'43,24,58',radius:'28px',buttonRadius:'28px',
 colors:['#b875e1','#e987cc','#916add','#d4b5f0'],
 panel:{bg:'rgba(45,23,59,.78)',border:'rgba(238,215,255,.34)',glow:'rgba(143,70,187,.18)',text:'#fffaff',muted:'#ebddef'},
 createRenderer:ctx=>createBotanicalRenderer(ctx,'bloom'),
};
