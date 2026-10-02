const TAU = Math.PI * 2;

function seeded(seed = 73421) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function program(gl, vertex, fragment) {
  const p = gl.createProgram();
  const vs = compile(gl, gl.VERTEX_SHADER, vertex);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.linkProgram(p);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(p) || "Program link failed";
    gl.deleteProgram(p);
    throw new Error(message);
  }
  return p;
}

function perspective(out, fovy, aspect, near, far) {
  const f = 1 / Math.tan(fovy / 2);
  out.fill(0);
  out[0] = f / aspect;
  out[5] = f;
  out[11] = -1;
  out[15] = 0;
  if (far !== Infinity) {
    const nf = 1 / (near - far);
    out[10] = (far + near) * nf;
    out[14] = 2 * far * near * nf;
  } else {
    out[10] = -1;
    out[14] = -2 * near;
  }
  return out;
}

function lookAt(out, eye, center, up) {
  let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
  z0 = eye[0] - center[0];
  z1 = eye[1] - center[1];
  z2 = eye[2] - center[2];
  len = Math.hypot(z0, z1, z2) || 1;
  z0 /= len; z1 /= len; z2 /= len;
  x0 = up[1] * z2 - up[2] * z1;
  x1 = up[2] * z0 - up[0] * z2;
  x2 = up[0] * z1 - up[1] * z0;
  len = Math.hypot(x0, x1, x2) || 1;
  x0 /= len; x1 /= len; x2 /= len;
  y0 = z1 * x2 - z2 * x1;
  y1 = z2 * x0 - z0 * x2;
  y2 = z0 * x1 - z1 * x0;
  out[0] = x0; out[1] = y0; out[2] = z0; out[3] = 0;
  out[4] = x1; out[5] = y1; out[6] = z1; out[7] = 0;
  out[8] = x2; out[9] = y2; out[10] = z2; out[11] = 0;
  out[12] = -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]);
  out[13] = -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]);
  out[14] = -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]);
  out[15] = 1;
  return out;
}

function multiply(out, a, b) {
  const r = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let row = 0; row < 4; row++) {
      r[c * 4 + row] =
        a[row] * b[c * 4] +
        a[4 + row] * b[c * 4 + 1] +
        a[8 + row] * b[c * 4 + 2] +
        a[12 + row] * b[c * 4 + 3];
    }
  }
  out.set(r);
  return out;
}

const SKY_VS = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){
  vUv = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const SKY_FS = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uAspect;
uniform float uZen;

float hash(vec2 p){
  p = fract(p * vec2(123.34,456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
}
float fbm(vec2 p){
  float v=0.0, a=.5;
  for(int i=0;i<5;i++){
    v += a * noise(p);
    p = p * 2.03 + vec2(11.7,7.4);
    a *= .5;
  }
  return v;
}
void main(){
  vec2 uv=vUv;
  vec3 top=vec3(.43,.55,.64);
  vec3 mid=vec3(.70,.77,.80);
  vec3 horizon=vec3(.91,.88,.83);
  float h=smoothstep(.10,.88,uv.y);
  vec3 col=mix(horizon,top,h);
  col=mix(col,mid,.18);

  float dawn=exp(-pow((uv.x-.76)*3.2,2.0)-pow((uv.y-.47)*6.8,2.0));
  col += vec3(.20,.12,.055)*dawn*.9;

  vec2 p=vec2((uv.x-.5)*uAspect,uv.y);
  float cloudBand=smoothstep(.34,.52,uv.y)*(1.0-smoothstep(.78,.97,uv.y));
  float n=fbm(p*3.0+vec2(uTime*.006,-uTime*.003));
  n += .45*fbm(p*6.6+vec2(-uTime*.009,uTime*.002));
  float cloud=smoothstep(.62,1.05,n)*cloudBand;
  vec3 cloudColor=mix(vec3(.48,.56,.60),vec3(.86,.88,.87),smoothstep(.42,.78,uv.y));
  col=mix(col,cloudColor,cloud*.80);

  float mist=exp(-pow((uv.y-.38)*8.2,2.0));
  col=mix(col,vec3(.79,.84,.84),mist*(.28+.10*uZen));

  float vignette=1.0-.18*pow(length((uv-.5)*vec2(.82,1.0)),1.7);
  col*=vignette;
  col*=mix(.86,1.0,uZen);
  outColor=vec4(col,1.0);
}`;

const CITY_VS = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iOffset;
layout(location=3) in vec3 iScale;
layout(location=4) in float iTone;
uniform mat4 uViewProj;
uniform vec3 uCamera;
uniform float uTravel;
uniform float uSpan;
out vec3 vNormal;
out vec3 vWorld;
out float vTone;
out float vDistance;
void main(){
  float z = mod(iOffset.z + uTravel, uSpan) - uSpan;
  vec3 world = vec3(iOffset.x, iOffset.y, z) + aPosition * iScale;
  vWorld = world;
  vNormal = aNormal;
  vTone = iTone;
  vDistance = distance(world, uCamera);
  gl_Position = uViewProj * vec4(world,1.0);
}`;

const CITY_FS = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vTone;
in float vDistance;
out vec4 outColor;
uniform float uTime;
uniform float uZen;
void main(){
  vec3 n=normalize(vNormal);
  vec3 lightDir=normalize(vec3(-.44,.78,.35));
  float diff=max(dot(n,lightDir),0.0);
  float up=max(n.y,0.0);
  float edge=pow(1.0-max(abs(n.z),abs(n.x)),2.0);
  vec3 cool=vec3(.76,.81,.82);
  vec3 white=vec3(.97,.96,.92);
  vec3 base=mix(cool,white,.62+.28*vTone);
  base*=.52+.50*diff+.12*up;
  base += vec3(.11,.07,.035)*max(0.0,dot(n,normalize(vec3(.72,.32,.18))));
  base += vec3(.06,.09,.10)*edge;
  float stains=(sin(vWorld.y*.41+vWorld.x*.17)+sin(vWorld.z*.08))*0.5+0.5;
  base*=1.0-.035*stains*(1.0-vTone);
  float fog=smoothstep(82.0,260.0,vDistance);
  vec3 fogColor=vec3(.74,.80,.81);
  base=mix(base,fogColor,fog*.92);
  base*=mix(.88,1.0,uZen);
  outColor=vec4(base,1.0);
}`;

const OCEAN_VS = `#version 300 es
layout(location=0) in vec2 aPosition;
uniform mat4 uViewProj;
uniform float uTime;
out vec3 vWorld;
out float vWave;
void main(){
  float x=aPosition.x;
  float z=aPosition.y;
  float w1=sin(x*.105+uTime*.34+z*.025);
  float w2=sin(x*.043-uTime*.22-z*.075);
  float w3=sin((x+z)*.16+uTime*.14);
  float y=-.42 + w1*.16+w2*.10+w3*.045;
  vWave=y;
  vWorld=vec3(x,y,z);
  gl_Position=uViewProj*vec4(vWorld,1.0);
}`;

const OCEAN_FS = `#version 300 es
precision highp float;
in vec3 vWorld;
in float vWave;
out vec4 outColor;
uniform vec3 uCamera;
uniform float uTime;
uniform float uZen;
void main(){
  vec3 dx=dFdx(vWorld), dy=dFdy(vWorld);
  vec3 n=normalize(cross(dx,dy));
  if(n.y<0.0)n=-n;
  vec3 viewDir=normalize(uCamera-vWorld);
  float fres=pow(1.0-max(dot(n,viewDir),0.0),3.0);
  float glint=pow(max(dot(reflect(-normalize(vec3(-.44,.78,.35)),n),viewDir),0.0),70.0);
  vec3 deep=vec3(.14,.25,.30);
  vec3 pale=vec3(.54,.67,.70);
  vec3 col=mix(deep,pale,.25+.48*fres);
  col+=vec3(.42,.34,.21)*glint*.55;
  float dist=distance(vWorld,uCamera);
  float fog=smoothstep(90.0,320.0,dist);
  col=mix(col,vec3(.73,.80,.81),fog*.94);
  col*=mix(.82,1.0,uZen);
  outColor=vec4(col,1.0);
}`;

function cubeGeometry() {
  const p = [
    // +X
    .5,-.5,-.5, .5,.5,-.5, .5,.5,.5, .5,-.5,-.5, .5,.5,.5, .5,-.5,.5,
    // -X
    -.5,-.5,.5, -.5,.5,.5, -.5,.5,-.5, -.5,-.5,.5, -.5,.5,-.5, -.5,-.5,-.5,
    // +Y
    -.5,.5,-.5, -.5,.5,.5, .5,.5,.5, -.5,.5,-.5, .5,.5,.5, .5,.5,-.5,
    // -Y
    -.5,-.5,.5, -.5,-.5,-.5, .5,-.5,-.5, -.5,-.5,.5, .5,-.5,-.5, .5,-.5,.5,
    // +Z
    .5,-.5,.5, .5,.5,.5, -.5,.5,.5, .5,-.5,.5, -.5,.5,.5, -.5,-.5,.5,
    // -Z
    -.5,-.5,-.5, -.5,.5,-.5, .5,.5,-.5, -.5,-.5,-.5, .5,.5,-.5, .5,-.5,-.5,
  ];
  const n=[];
  [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(v=>{
    for(let i=0;i<6;i++)n.push(...v);
  });
  return { positions:new Float32Array(p), normals:new Float32Array(n) };
}

function buildCity() {
  const rnd=seeded(90317);
  const span=360;
  const data=[];
  const add=(x,y,z,sx,sy,sz,tone=.6)=>data.push(x,y,z,sx,sy,sz,tone);
  for(let z=6, block=0; z<span; z+=10.5, block++){
    for(const side of [-1,1]){
      const lane=12+rnd()*24;
      const x=side*(lane+rnd()*7);
      const w=5+rnd()*8;
      const d=5+rnd()*8;
      const h=8+rnd()*28;
      const tone=.25+rnd()*.72;
      add(x,h*.5+.05,z+rnd()*4,w,h,d,tone);
      if(rnd()>.28){
        const th=5+rnd()*17;
        add(x+side*(rnd()-.5)*2.5,h+th*.5,z+rnd()*4,w*(.45+rnd()*.25),th,d*(.45+rnd()*.3),Math.min(1,tone+.12));
      }
      if(rnd()>.72){
        const crown=2+rnd()*5;
        add(x,h+crown*.5+.2,z+rnd()*3,w*.7,crown,d*.7,.92);
      }
      if(rnd()>.62){
        const px=x+side*(w*.65+1.1);
        const ph=4+rnd()*9;
        add(px,ph*.5,z+1.5+rnd()*3,1.2+rnd()*1.2,ph,1.2+rnd()*1.5,.7);
      }
    }
    // Monumental gateways: rare enough to remain surprising in the flight.
    if(block%7===4){
      const archY=12+rnd()*5;
      add(-9.8,archY*.5,z+3,2.0,archY,2.6,.86);
      add(9.8,archY*.5,z+3,2.0,archY,2.6,.86);
      add(0,archY-.55,z+3,19.6,1.1,2.8,.94);
    }
    // Distant skyline keeps the ocean-city feeling endless beyond the corridor.
    for(const side of [-1,1]){
      if(rnd()>.36){
        const x=side*(47+rnd()*38);
        const h=18+rnd()*43;
        add(x,h*.5,z+rnd()*8,7+rnd()*13,h,7+rnd()*12,.25+rnd()*.45);
      }
    }
  }
  return { span, data:new Float32Array(data), count:data.length/7 };
}

function buildOcean(cols=86, rows=96) {
  const vertices=[];
  const indices=[];
  const x0=-135, x1=135, z0=25, z1=-390;
  for(let r=0;r<=rows;r++){
    const v=r/rows;
    const z=z0+(z1-z0)*v;
    for(let c=0;c<=cols;c++){
      const u=c/cols;
      vertices.push(x0+(x1-x0)*u,z);
    }
  }
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      const a=r*(cols+1)+c,b=a+1,d=(r+1)*(cols+1)+c,e=d+1;
      indices.push(a,d,b,b,d,e);
    }
  }
  return { vertices:new Float32Array(vertices), indices:new Uint32Array(indices) };
}

function drawBirds(ctx,time,width,height,isZen){
  if(!ctx||!width||!height)return;
  ctx.save();
  ctx.lineCap="round";
  ctx.lineJoin="round";
  const count=isZen?11:6;
  for(let i=0;i<count;i++){
    const cycle=19+(i%4)*6.7;
    const phase=(time+i*7.91)%cycle/cycle;
    const visibleWindow=.19+(i%3)*.018;
    if(phase>visibleWindow)continue;
    const u=phase/visibleWindow;
    const dir=i%2?1:-1;
    const x=dir>0?(-.14+1.28*u)*width:(1.14-1.28*u)*width;
    const y=height*(.18+(i%5)*.055+Math.sin(time*.22+i)*.018);
    const depth=.55+(i%4)*.32;
    const size=Math.max(3,Math.min(13,(isZen?9:6.5)/depth));
    const flap=Math.sin(time*7.4+i*1.7)*.45;
    const alpha=(.28+.58*(1-Math.abs(u-.5)*1.55))/depth;
    ctx.strokeStyle=`rgba(247,249,247,${Math.min(.78,alpha)})`;
    ctx.lineWidth=Math.max(1,1.25/depth);
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x-dir*size*.52,y-size*(.54+flap*.3),x-dir*size,y-size*.12);
    ctx.moveTo(x,y);
    ctx.quadraticCurveTo(x+dir*size*.52,y-size*(.54-flap*.3),x+dir*size,y-size*.12);
    ctx.stroke();
  }
  ctx.restore();
}

function fallbackRenderer(ctx){
  return {
    resize(){},
    draw({time,width,height,camera}){
      const zen=Boolean(camera);
      const g=ctx.createLinearGradient(0,0,0,height);
      g.addColorStop(0,"#718b9a");
      g.addColorStop(.42,"#c6d0d0");
      g.addColorStop(.58,"#b4c4c6");
      g.addColorStop(1,"#1f3540");
      ctx.fillStyle=g;
      ctx.fillRect(0,0,width,height);
      const horizon=height*.56;
      ctx.fillStyle="rgba(238,240,235,.82)";
      for(let i=0;i<28;i++){
        const lane=i%2?-1:1;
        const z=((i*47+time*(zen?26:6))%900)/900;
        const scale=.12+z*1.25;
        const w=22*scale,h=(60+(i%7)*18)*scale;
        const x=width*.5+lane*(75+z*width*.58);
        ctx.fillRect(x-w*.5,horizon-h,w,h);
      }
      const water=ctx.createLinearGradient(0,horizon,0,height);
      water.addColorStop(0,"rgba(138,164,168,.78)");
      water.addColorStop(1,"rgba(22,48,59,.96)");
      ctx.fillStyle=water; ctx.fillRect(0,horizon,width,height-horizon);
      drawBirds(ctx,time,width,height,zen);
    },
    dispose(){}
  };
}

const SOUND = {
  title:"Звучание Белого города",
  loops:[
    {src:"audio-library/nature/ocean_waves.ogg",volume:.24},
    {src:"audio-library/nature/wind_soft.ogg",fallback:"audio-library/compatible/nature/wind_soft.m4a",volume:.14},
    {src:"audio-library/ambience/night_air.ogg",fallback:"audio-library/compatible/ambience/night_air.m4a",volume:.08}
  ],
  oneShots:[{src:"audio-library/nature/bird_wings_flutter.ogg",fallback:"audio-library/compatible/nature/bird_wings_flutter.m4a",volume:.17,minDelay:11,maxDelay:27}]
};

function createThemeSound(){
  const button=document.createElement("button");
  button.id="theme-sound-toggle";
  button.type="button";
  button.className="icon-btn glass theme-sound-toggle";
  button.setAttribute("aria-label","Включить звучание Белого города");
  button.setAttribute("aria-pressed","false");
  button.title="Звучание темы";
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z"/><path class="sound-wave" d="M16 9c1.7 1.5 1.7 4.5 0 6M18.5 6.8c3.5 3 3.5 7.4 0 10.4"/></svg>';
  document.querySelector(".top-actions")?.insertBefore(button,document.querySelector("#zen-toggle"));
  const Ctx=window.AudioContext||window.webkitAudioContext;
  let ac=null, master=null, enabled=false, seq=0;
  const cache=new Map(), tracks=new Set(), timers=new Set();
  const same=(raw)=>{try{const u=new URL(raw,document.baseURI);return u.origin===location.origin?u.href:""}catch{return ""}};
  const norm=(e)=>{const src=same(e.src);return src?{...e,src,fallback:same(e.fallback),volume:Math.max(0,Math.min(.5,Number(e.volume)||.1))}:null};
  const sync=()=>{button.dataset.enabled=String(enabled);button.setAttribute("aria-pressed",String(enabled));button.setAttribute("aria-label",enabled?"Выключить звучание Белого города":"Включить звучание Белого города");};
  const load=async(raw)=>{const e=norm(raw);if(!e)throw Error("audio");const key=e.src+"|"+e.fallback;if(cache.has(key))return cache.get(key);const p=(async()=>{let last;for(const u of [e.src,e.fallback].filter(Boolean)){try{const r=await fetch(u,{cache:"force-cache",signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error("audio");return {buffer:await ac.decodeAudioData(await r.arrayBuffer()),entry:e}}catch(err){last=err}}throw last||Error("audio")})();cache.set(key,p);try{return await p}catch(err){cache.delete(key);throw err}};
  const fadeOut=(seconds=1.8)=>{if(!ac)return;const now=ac.currentTime;for(const t of [...tracks]){const g=t.gain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+seconds);setTimeout(()=>{try{t.source.stop();t.source.disconnect();t.gain.disconnect()}catch{}tracks.delete(t)},seconds*1000+80)}};
  const clearTimers=()=>{for(const t of timers)clearTimeout(t);timers.clear()};
  const stop=(silent=false)=>{if(!enabled&&!tracks.size)return;enabled=false;seq++;clearTimers();fadeOut();if(!silent)sync()};
  const scheduleBird=(request)=>{const raw=SOUND.oneShots[0], e=norm(raw);if(!e)return;const again=()=>{if(!enabled||request!==seq)return;const delay=(e.minDelay+Math.random()*(e.maxDelay-e.minDelay))*1000;const timer=setTimeout(async()=>{timers.delete(timer);if(!enabled||request!==seq)return;try{const {buffer}=await load(e);if(!enabled||request!==seq)return;const source=ac.createBufferSource(),gain=ac.createGain(),pan=ac.createStereoPanner?.();source.buffer=buffer;gain.gain.value=e.volume;source.connect(gain);if(pan){gain.connect(pan);pan.connect(master);pan.pan.value=Math.random()*1.4-.7}else gain.connect(master);source.start()}catch{}again()},delay);timers.add(timer)};again()};
  const start=async()=>{if(!Ctx)return; if(!ac){ac=new Ctx();master=ac.createGain();master.gain.value=.18;const comp=ac.createDynamicsCompressor();comp.threshold.value=-14;comp.knee.value=22;comp.ratio.value=5;master.connect(comp);comp.connect(ac.destination)}enabled=true;const request=++seq;sync();await ac.resume();const ready=await Promise.allSettled(SOUND.loops.map(load));if(!enabled||request!==seq)return;ready.forEach((r,i)=>{if(r.status!=="fulfilled")return;const source=ac.createBufferSource(),gain=ac.createGain();source.buffer=r.value.buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(master);const state={source,gain};tracks.add(state);source.start();gain.gain.linearRampToValueAtTime(SOUND.loops[i].volume,ac.currentTime+4+i*.45)});scheduleBird(request)};
  button.onclick=()=>{if(enabled)stop();else start().catch(()=>{stop();button.title="Нажмите ещё раз, чтобы браузер разрешил звук"})};
  const onPlay=(e)=>{if(e.target instanceof HTMLMediaElement&&!e.target.muted)stop()};
  const onScene=(e)=>{if(e.detail?.enabled)stop()};
  document.addEventListener("play",onPlay,true);window.addEventListener("syolana:sceneaudio",onScene);window.addEventListener("pagehide",()=>stop(true),{once:true});
  return {dispose(){stop(true);document.removeEventListener("play",onPlay,true);window.removeEventListener("syolana:sceneaudio",onScene);button.remove();try{ac?.close()}catch{}}};
}

function createRenderer(ctx){
  const sourceCanvas=ctx?.canvas;
  if(!sourceCanvas||!document.body)return fallbackRenderer(ctx);
  const canvas=document.createElement("canvas");
  canvas.className="theme-world-canvas white-ocean-world";
  canvas.setAttribute("aria-hidden","true");
  Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block"});
  sourceCanvas.parentNode?.insertBefore(canvas,sourceCanvas);
  const style=document.createElement("style");
  style.textContent='html[data-theme="white-ocean-city"] .flight-planet{display:none!important}html[data-theme="white-ocean-city"] .flight-hint{opacity:.56}html[data-theme="white-ocean-city"] .theme-sound-toggle svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}html[data-theme="white-ocean-city"] .theme-sound-toggle svg path:first-child{fill:currentColor;stroke:none}html[data-theme="white-ocean-city"] .theme-sound-toggle[data-enabled="true"]{color:#f1fbfa;box-shadow:0 0 0 1px #d9eeee55,0 0 28px #bde5e533}';
  document.head.append(style);
  const sound=createThemeSound();
  const originalFillText=ctx.fillText;
  ctx.fillText=function(text,...args){if(text==="syolana.com")return;return originalFillText.call(this,text,...args)};

  const gl=canvas.getContext("webgl2",{
    alpha:false,
    antialias:true,
    depth:true,
    stencil:false,
    powerPreference:"high-performance",
    preserveDrawingBuffer:false,
  });
  if(!gl){
    canvas.remove();
    const fallback=fallbackRenderer(ctx), baseDispose=fallback.dispose;
    fallback.dispose=()=>{baseDispose?.();style.remove();sound.dispose();ctx.fillText=originalFillText};
    return fallback;
  }

  let skyProgram, cityProgram, oceanProgram;
  try{
    skyProgram=program(gl,SKY_VS,SKY_FS);
    cityProgram=program(gl,CITY_VS,CITY_FS);
    oceanProgram=program(gl,OCEAN_VS,OCEAN_FS);
  }catch(error){
    console.warn("White Ocean City WebGL unavailable",error);
    canvas.remove();
    const fallback=fallbackRenderer(ctx), baseDispose=fallback.dispose;
    fallback.dispose=()=>{baseDispose?.();style.remove();sound.dispose();ctx.fillText=originalFillText};
    return fallback;
  }

  const resources=[];
  const keep=(x)=>{ if(x)resources.push(x); return x; };
  const skyVao=keep(gl.createVertexArray());
  const skyBuffer=keep(gl.createBuffer());
  gl.bindVertexArray(skyVao);
  gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const skyLoc=gl.getAttribLocation(skyProgram,"aPosition");
  gl.enableVertexAttribArray(skyLoc);
  gl.vertexAttribPointer(skyLoc,2,gl.FLOAT,false,0,0);

  const cube=cubeGeometry();
  const city=buildCity();
  const cityVao=keep(gl.createVertexArray());
  gl.bindVertexArray(cityVao);
  const cityPos=keep(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER,cityPos);
  gl.bufferData(gl.ARRAY_BUFFER,cube.positions,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const cityNorm=keep(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER,cityNorm);
  gl.bufferData(gl.ARRAY_BUFFER,cube.normals,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  const instance=keep(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER,instance);
  gl.bufferData(gl.ARRAY_BUFFER,city.data,gl.STATIC_DRAW);
  const stride=7*4;
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,3,gl.FLOAT,false,stride,0); gl.vertexAttribDivisor(2,1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3,3,gl.FLOAT,false,stride,3*4); gl.vertexAttribDivisor(3,1);
  gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4,1,gl.FLOAT,false,stride,6*4); gl.vertexAttribDivisor(4,1);

  const ocean=buildOcean();
  const oceanVao=keep(gl.createVertexArray());
  gl.bindVertexArray(oceanVao);
  const oceanPos=keep(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER,oceanPos);
  gl.bufferData(gl.ARRAY_BUFFER,ocean.vertices,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const oceanIdx=keep(gl.createBuffer());
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,oceanIdx);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ocean.indices,gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  const projection=new Float32Array(16);
  const view=new Float32Array(16);
  const vp=new Float32Array(16);
  let cssWidth=1,cssHeight=1,quality=1;
  let disposed=false;

  const uniforms={
    sky:{
      time:gl.getUniformLocation(skyProgram,"uTime"),
      aspect:gl.getUniformLocation(skyProgram,"uAspect"),
      zen:gl.getUniformLocation(skyProgram,"uZen"),
    },
    city:{
      vp:gl.getUniformLocation(cityProgram,"uViewProj"),
      camera:gl.getUniformLocation(cityProgram,"uCamera"),
      travel:gl.getUniformLocation(cityProgram,"uTravel"),
      span:gl.getUniformLocation(cityProgram,"uSpan"),
      time:gl.getUniformLocation(cityProgram,"uTime"),
      zen:gl.getUniformLocation(cityProgram,"uZen"),
    },
    ocean:{
      vp:gl.getUniformLocation(oceanProgram,"uViewProj"),
      camera:gl.getUniformLocation(oceanProgram,"uCamera"),
      time:gl.getUniformLocation(oceanProgram,"uTime"),
      zen:gl.getUniformLocation(oceanProgram,"uZen"),
    },
  };

  function resize({width,height,ratio=1}){
    cssWidth=Math.max(1,width);
    cssHeight=Math.max(1,height);
    const mobile=cssWidth<=760;
    quality=Math.min(ratio,mobile?1.35:1.6);
    const w=Math.max(1,Math.round(cssWidth*quality));
    const h=Math.max(1,Math.round(cssHeight*quality));
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w; canvas.height=h;
      gl.viewport(0,0,w,h);
    }
  }

  function renderWorld(time,camera){
    const zen=Boolean(camera);
    const travel=time*(zen?3.05:.58)+(camera?.z||0)*26;
    const autoX=Math.sin(time*.055)*4.8+Math.sin(time*.019+1.4)*2.6;
    const eyeX=autoX+(camera?.x||0)*18;
    const eyeY=7.4+Math.sin(time*.047)*1.05+(camera?.y||0)*8.5;
    const eye=[eyeX,eyeY,12.5];
    const target=[eyeX+Math.sin(time*.033)*2.8,4.0+Math.sin(time*.025)*.9,-42];
    perspective(projection,zen?0.98:1.02,cssWidth/cssHeight,.12,430);
    lookAt(view,eye,target,[0,1,0]);
    multiply(vp,projection,view);

    gl.disable(gl.BLEND);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);
    gl.bindVertexArray(skyVao);
    gl.uniform1f(uniforms.sky.time,time);
    gl.uniform1f(uniforms.sky.aspect,cssWidth/cssHeight);
    gl.uniform1f(uniforms.sky.zen,zen?1:0);
    gl.drawArrays(gl.TRIANGLES,0,3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.clearDepth(1);
    gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(oceanProgram);
    gl.bindVertexArray(oceanVao);
    gl.uniformMatrix4fv(uniforms.ocean.vp,false,vp);
    gl.uniform3f(uniforms.ocean.camera,eye[0],eye[1],eye[2]);
    gl.uniform1f(uniforms.ocean.time,time);
    gl.uniform1f(uniforms.ocean.zen,zen?1:0);
    gl.drawElements(gl.TRIANGLES,ocean.indices.length,gl.UNSIGNED_INT,0);

    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);
    gl.useProgram(cityProgram);
    gl.bindVertexArray(cityVao);
    gl.uniformMatrix4fv(uniforms.city.vp,false,vp);
    gl.uniform3f(uniforms.city.camera,eye[0],eye[1],eye[2]);
    gl.uniform1f(uniforms.city.travel,travel);
    gl.uniform1f(uniforms.city.span,city.span);
    gl.uniform1f(uniforms.city.time,time);
    gl.uniform1f(uniforms.city.zen,zen?1:0);
    gl.drawArraysInstanced(gl.TRIANGLES,0,cube.positions.length/3,city.count);

    gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(null);
  }

  return {
    resize,
    draw({time,width,height,camera}){
      if(disposed)return;
      if(width!==cssWidth||height!==cssHeight)resize({width,height,ratio:window.devicePixelRatio||1});
      renderWorld(time,camera);
      drawBirds(ctx,time,width,height,Boolean(camera));
      if(!camera){
        const veil=ctx.createLinearGradient(0,0,0,height);
        veil.addColorStop(0,"rgba(6,14,19,.11)");
        veil.addColorStop(.48,"rgba(5,13,18,.20)");
        veil.addColorStop(1,"rgba(3,9,13,.48)");
        ctx.fillStyle=veil;
        ctx.fillRect(0,0,width,height);
      }
    },
    dispose(){
      disposed=true;
      canvas.remove(); style.remove(); sound.dispose(); ctx.fillText=originalFillText;
      try{
        gl.deleteProgram(skyProgram);
        gl.deleteProgram(cityProgram);
        gl.deleteProgram(oceanProgram);
        for(const r of resources){
          if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);
          else gl.deleteBuffer(r);
        }
      }catch{}
    },
  };
}

export default {
  id:"white-ocean-city",
  renderer:"webgl-city",
  particles:false,
  marks:false,
  flightCards:false,
  accent:"#dce9e8",
  dim:"#c7d3d3",
  surface:"17,28,33",
  radius:"26px",
  buttonRadius:"26px",
  heading:'"Cormorant Garamond", Georgia, serif',
  body:'"Nunito", system-ui, sans-serif',
  colors:["#eef4f2","#d8e6e5","#b7ced0","#f4e9da"],
  backgrounds:[
    "radial-gradient(ellipse at 76% 18%,rgba(235,197,153,.34),transparent 45%),radial-gradient(ellipse at 30% 8%,rgba(109,143,160,.30),transparent 58%)",
    "radial-gradient(ellipse at 60% 35%,rgba(190,211,211,.16),transparent 55%)",
    "linear-gradient(to bottom,rgba(67,91,103,.18),rgba(12,24,30,.42))",
  ],
  soundscape:SOUND,
  createRenderer,
};