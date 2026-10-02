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
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.0,a=.52;for(int i=0;i<6;i++){v+=a*noise(p);p=p*2.03+vec2(17.7,9.4);a*=.51;}return v;}
void main(){
  vec2 uv=vUv;
  float horizon=.455;
  vec3 zenith=vec3(.19,.34,.43),upper=vec3(.42,.59,.67),haze=vec3(.81,.86,.84),dawn=vec3(.96,.82,.67);
  vec3 col=mix(haze,mix(upper,zenith,smoothstep(.58,1.0,uv.y)),smoothstep(horizon,1.0,uv.y));
  float sun=exp(-pow((uv.x-.73)*4.8,2.0)-pow((uv.y-.47)*18.0,2.0));
  col+=dawn*sun*.34;
  vec2 p=vec2((uv.x-.5)*uAspect,uv.y);
  float lowMask=smoothstep(.40,.47,uv.y)*(1.0-smoothstep(.63,.73,uv.y));
  float highMask=smoothstep(.52,.62,uv.y)*(1.0-smoothstep(.83,.96,uv.y));
  float low=fbm(p*3.25+vec2(uTime*.007,-uTime*.002))+.34*fbm(p*8.1+vec2(-uTime*.012,uTime*.003));
  float high=fbm(p*2.35+vec2(-uTime*.004,uTime*.001));
  float cloudLow=smoothstep(.49,.78,low)*lowMask,cloudHigh=smoothstep(.57,.82,high)*highMask;
  col=mix(col,mix(vec3(.34,.46,.51),vec3(.88,.90,.87),smoothstep(.48,.78,low)),cloudLow*.88);
  col=mix(col,vec3(.75,.81,.81),cloudHigh*.34);
  float distant=exp(-pow((uv.y-horizon)*27.0,2.0));
  col=mix(col,vec3(.85,.88,.85),distant*(.44+.08*uZen));
  col+=(hash(gl_FragCoord.xy+floor(uTime*12.0))-.5)*.012;
  col*=1.0-.14*pow(length((uv-.5)*vec2(.84,1.0)),1.75);
  col*=mix(.90,1.0,uZen);
  outColor=vec4(col,1.0);
}`;

const CITY_VS = `#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iOffset;
layout(location=3) in vec3 iScale;
layout(location=4) in float iTone;
layout(location=5) in float iShape;
uniform mat4 uViewProj;
uniform vec3 uCamera;
uniform float uTravel;
uniform float uSpan;
out vec3 vNormal;
out vec3 vWorld;
out float vTone;
out float vShape;
out float vDistance;
out vec3 vLocal;
void main(){
  float z=mod(iOffset.z+uTravel,uSpan)-uSpan;
  vec3 local=aPosition;
  float y01=clamp(local.y+.5,0.0,1.0);
  if(iShape>0.5&&iShape<1.5){float taper=mix(1.0,.46,smoothstep(.28,1.0,y01));local.xz*=taper;}
  else if(iShape>1.5&&iShape<2.5){float neck=mix(1.0,.72,smoothstep(.45,.82,y01));local.xz*=neck;}
  else if(iShape>2.5){float terrace=1.0-.12*floor(y01*4.0);local.xz*=terrace;}
  vec3 world=vec3(iOffset.x,iOffset.y,z)+local*iScale;
  vWorld=world;vNormal=aNormal;vTone=iTone;vShape=iShape;vDistance=distance(world,uCamera);vLocal=local;
  gl_Position=uViewProj*vec4(world,1.0);
}`;

const CITY_FS = `#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vTone;
in float vShape;
in float vDistance;
in vec3 vLocal;
out vec4 outColor;
uniform float uTime;
uniform float uZen;
float stoneNoise(vec3 p){return sin(p.x*.73+p.z*.31)*sin(p.y*.91-p.z*.17);}
void main(){
  vec3 n=normalize(vNormal),key=normalize(vec3(-.48,.80,.32)),warm=normalize(vec3(.70,.24,.18));
  float diff=max(dot(n,key),0.0),rim=pow(1.0-max(dot(n,normalize(vec3(.1,.45,.89))),0.0),2.2),up=max(n.y,0.0);
  vec3 base=mix(vec3(.68,.76,.77),vec3(.965,.955,.915),.57+.33*vTone);
  base*=.48+.54*diff+.13*up;
  base+=vec3(.13,.075,.035)*max(0.0,dot(n,warm))*.52+vec3(.055,.075,.078)*rim*.34;
  base*=1.0-.045*(.5+.5*stoneNoise(vWorld*.16))*(1.0-vTone);
  float terrace=step(2.5,vShape)*smoothstep(.46,.50,abs(fract((vLocal.y+.5)*4.0)-.5));
  base*=1.0-.035*terrace;
  float fog=smoothstep(92.0,315.0,vDistance);
  base=mix(base,vec3(.72,.80,.81),fog*.94);
  base*=mix(.89,1.0,uZen);
  outColor=vec4(base,1.0);
}`;

const OCEAN_VS = `#version 300 es
layout(location=0) in vec2 aPosition;
uniform mat4 uViewProj;
uniform float uTime;
out vec3 vWorld;
out float vWave;
void main(){
  float x=aPosition.x,z=aPosition.y;
  float w1=sin(x*.073+z*.029+uTime*.42),w2=sin(x*.031-z*.061-uTime*.27),w3=sin((x+z)*.145+uTime*.19),w4=sin(x*.19-z*.113+uTime*.31);
  float y=-.46+w1*.18+w2*.12+w3*.055+w4*.028;
  vWave=y;vWorld=vec3(x,y,z);gl_Position=uViewProj*vec4(vWorld,1.0);
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
  vec3 dx=dFdx(vWorld),dy=dFdy(vWorld),n=normalize(cross(dx,dy));if(n.y<0.0)n=-n;
  vec3 viewDir=normalize(uCamera-vWorld),sunDir=normalize(vec3(-.52,.82,.27));
  float fres=pow(1.0-max(dot(n,viewDir),0.0),3.4),diffuse=max(dot(n,sunDir),0.0);
  float spec=max(dot(reflect(-sunDir,n),viewDir),0.0),glint=pow(spec,92.0),ribbon=pow(spec,16.0);
  vec3 col=mix(vec3(.075,.22,.28),vec3(.22,.43,.47),.28+.24*diffuse);
  col=mix(col,vec3(.63,.75,.77),.28+.52*fres);
  col+=vec3(.92,.73,.48)*glint*.72+vec3(.34,.31,.24)*ribbon*.11;
  col+=vec3(.05,.09,.10)*(.5+.5*sin(vWorld.x*.62+sin(vWorld.z*.27+uTime*.8)))*.08;
  float fog=smoothstep(105.0,380.0,distance(vWorld,uCamera));
  col=mix(col,vec3(.73,.81,.81),fog*.95);col*=mix(.88,1.0,uZen);
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
  const rnd=seeded(90317),span=520,data=[];
  const add=(x,y,z,sx,sy,sz,tone=.6,shape=0)=>data.push(x,y,z,sx,sy,sz,tone,shape);
  const tower=(x,z,w,h,d,tone,shape=1)=>{
    add(x,h*.5+.08,z,w,h,d,tone,shape);
    if(h>19){const ch=2.2+rnd()*4.8;add(x,h+ch*.5,z,w*(.56+rnd()*.16),ch,d*(.56+rnd()*.16),Math.min(1,tone+.12),2);}
  };
  const arch=(cx,z,width,height,depth,tone)=>{
    const p=Math.max(1.3,width*.12);
    add(cx-width*.5+p*.5,height*.5,z,p,height,depth,tone,0);
    add(cx+width*.5-p*.5,height*.5,z,p,height,depth,tone,0);
    add(cx,height-p*.45,z,width,p*.9,depth,tone+.08,2);
  };
  for(let z=14,block=0;z<span;z+=13.2,block++){
    const avenue=10.5+Math.sin(block*.61)*2.4;
    for(const side of [-1,1]){
      const lane=avenue+5+rnd()*15,x=side*(lane+rnd()*6.5),w=4.8+rnd()*8.8,d=5.5+rnd()*10,h=10+rnd()*33,tone=.38+rnd()*.58;
      tower(x,z+rnd()*5,w,h,d,tone,rnd()>.48?1:3);
      if(rnd()>.24)add(x,h*.18,z+d*.35,w*(1.12+rnd()*.72),2.1+rnd()*2.3,d*(1.0+rnd()*.55),tone+.06,3);
      if(rnd()>.56)tower(x+side*(w*.72+1.7+rnd()*2.8),z+2+rnd()*5,1.2+rnd()*2.1,7+rnd()*16,1.2+rnd()*2.6,.68+rnd()*.24,1);
      if(rnd()>.72){const cz=z-3+rnd()*7;for(let j=0;j<3;j++)add(x+side*(w*.56+2+j*2.25),3.4,cz,1.05,6.8,1.05,.78,1);}
    }
    if(block%5===2)arch(0,z+3,20+rnd()*7,13+rnd()*7,2.3+rnd()*1.8,.79+rnd()*.14);
    if(block%8===5){const y=10+rnd()*8;add(0,y,z-1,31+rnd()*11,1.15,2.4,.84,2);add(-15,y*.48,z-1,1.5,y,2.4,.74,1);add(15,y*.48,z-1,1.5,y,2.4,.74,1);}
    for(const side of [-1,1]){
      if(rnd()>.18){const fx=side*(46+rnd()*48),fh=17+rnd()*54;tower(fx,z+rnd()*10,6+rnd()*14,fh,7+rnd()*15,.26+rnd()*.42,rnd()>.5?1:3);}
      if(rnd()>.58)arch(side*(36+rnd()*12),z+rnd()*7,12+rnd()*8,9+rnd()*8,2.2,.52+rnd()*.25);
    }
  }
  for(let z=96;z<span;z+=128){
    const side=(Math.floor(z/128)%2)?-1:1;
    tower(side*27,z,11,58,11,.91,1);tower(side*27,z,6.5,72,6.5,.96,1);add(side*27,73.2,z,2.1,7.5,2.1,.98,1);
    for(let i=-2;i<=2;i++)add(side*27+i*3.1,2.8,z+10,1.15,5.6,1.15,.82,1);
  }
  return {span,data:new Float32Array(data),count:data.length/8};
}

function buildOcean(cols=86, rows=96) {
  const vertices=[];
  const indices=[];
  const x0=-190, x1=190, z0=34, z1=-560;
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
  ctx.save();ctx.lineCap="round";ctx.strokeStyle="rgba(248,250,247,.72)";
  for(let i=0;i<(isZen?7:4);i++){
    const x=((time*.014+i*.173)%1.35-.15)*width,y=height*(.18+(i%4)*.055),s=4+(i%3)*1.7;
    ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x-s,y);ctx.quadraticCurveTo(x-s*.45,y-s*.62,x,y);ctx.quadraticCurveTo(x+s*.45,y-s*.62,x+s,y);ctx.stroke();
  }ctx.restore();
}
function createFlock(){
  const rnd=seeded(19077);
  return {
    birds:Array.from({length:18},(_,i)=>({x:.18+rnd()*.64,y:.12+rnd()*.22,vx:(rnd()-.5)*.018,vy:(rnd()-.5)*.008,size:.7+rnd()*.9,phase:rnd()*TAU,wing:5.2+rnd()*2.8,depth:.65+rnd()*.7,delay:i*.13})),
    target:{x:.5,y:.22,active:false,last:0},
    guide({x,y,active}){this.target.active=Boolean(active);if(Number.isFinite(x))this.target.x=Math.max(.08,Math.min(.92,x));if(Number.isFinite(y))this.target.y=Math.max(.08,Math.min(.43,y));this.target.last=performance.now();},
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      const target=this.target;if(target.active&&performance.now()-target.last>900)target.active=false;
      ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
      for(let i=0;i<this.birds.length;i++){
        const b=this.birds[i],leader=this.birds[(i+this.birds.length-1)%this.birds.length];
        const tx=target.active?target.x:.50+Math.sin(time*.115+i*.71)*.22,ty=target.active?target.y:.20+Math.cos(time*.083+i*.53)*.055,follow=i===0?1:.52;
        b.vx+=(tx-b.x)*(.00072*follow)+(leader.x-b.x)*.00024;b.vy+=(ty-b.y)*(.00062*follow)+(leader.y-b.y)*.00018;
        b.vx+=Math.sin(time*.61+i*1.9)*.000025;b.vy+=Math.cos(time*.47+i*1.3)*.000018;
        const sp=Math.hypot(b.vx,b.vy),mx=.0048+(zen?.0014:0);if(sp>mx){b.vx=b.vx/sp*mx;b.vy=b.vy/sp*mx;}
        b.vx*=.986;b.vy*=.986;b.x+=b.vx;b.y+=b.vy;if(b.x<-.08)b.x=1.08;if(b.x>1.08)b.x=-.08;b.y=Math.max(.075,Math.min(.405,b.y));
        const x=b.x*width,y=b.y*height,s=(4.2+b.size*4.8)*(zen?1.05:.88)/b.depth,flap=Math.sin(time*b.wing+b.phase),alpha=Math.min(.84,.38+.30/b.depth);
        ctx.strokeStyle=`rgba(248,250,247,\${alpha})`;ctx.shadowColor="rgba(210,232,232,.25)";ctx.shadowBlur=5;ctx.lineWidth=Math.max(.9,1.35/b.depth);
        ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-s*.52,y-s*(.40+.23*flap),x-s,y-s*.04);ctx.moveTo(x,y);ctx.quadraticCurveTo(x+s*.52,y-s*(.40-.23*flap),x+s,y-s*.04);ctx.stroke();
      }ctx.restore();
    }
  };
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
  const assetRoot=new URL("../",import.meta.url);
  const same=(raw)=>{try{const u=new URL(raw,assetRoot);return u.origin===assetRoot.origin?u.href:""}catch{return ""}};
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
  style.textContent='html[data-theme="white-ocean-city"] .flight-hint{opacity:.72;color:#e4efed}html[data-theme="white-ocean-city"] .theme-sound-toggle svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}html[data-theme="white-ocean-city"] .theme-sound-toggle svg path:first-child{fill:currentColor;stroke:none}html[data-theme="white-ocean-city"] .theme-sound-toggle[data-enabled="true"]{color:#f1fbfa;box-shadow:0 0 0 1px #d9eeee55,0 0 28px #bde5e533}html[data-theme="white-ocean-city"] .flight-planet{color:#f5fbfa}html[data-theme="white-ocean-city"] .planet-orb{background:radial-gradient(circle at 32% 26%,rgba(245,252,250,.56),rgba(106,145,150,.26) 44%,rgba(20,38,45,.52) 82%);border-color:rgba(222,242,239,.48)}';
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
  const stride=8*4;
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2,3,gl.FLOAT,false,stride,0); gl.vertexAttribDivisor(2,1);
  gl.enableVertexAttribArray(3); gl.vertexAttribPointer(3,3,gl.FLOAT,false,stride,3*4); gl.vertexAttribDivisor(3,1);
  gl.enableVertexAttribArray(4); gl.vertexAttribPointer(4,1,gl.FLOAT,false,stride,6*4); gl.vertexAttribDivisor(4,1);
  gl.enableVertexAttribArray(5); gl.vertexAttribPointer(5,1,gl.FLOAT,false,stride,7*4); gl.vertexAttribDivisor(5,1);

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
  const flock=createFlock();
  const hint=document.querySelector(".flight-hint"),oldHint=hint?.textContent||"";
  if(hint)hint.textContent="Перетаскивайте мир · два пальца — глубина · ведите стаю пальцем";

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
    const zen=Boolean(camera),cx=Math.max(-.62,Math.min(.62,camera?.x||0)),cy=Math.max(-.30,Math.min(.30,camera?.y||0)),cz=Math.max(-8,Math.min(8,camera?.z||0));
    const travel=time*(zen?2.72:.44)+cz*27;
    const autoX=Math.sin(time*.043)*4.2+Math.sin(time*.017+1.4)*2.1,eyeX=autoX+cx*17,eyeY=8.9+Math.sin(time*.041)*.72+cy*8.1;
    const eye=[eyeX,eyeY,14.5],target=[eyeX+Math.sin(time*.028)*2.4,4.6+Math.sin(time*.023)*.55,-48];
    perspective(projection,zen?0.94:1.00,cssWidth/cssHeight,.12,520);
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
    guideBirds(point){flock.guide(point||{});},
    draw({time,width,height,camera}){
      if(disposed)return;
      if(width!==cssWidth||height!==cssHeight)resize({width,height,ratio:window.devicePixelRatio||1});
      renderWorld(time,camera);
      flock.draw(ctx,time,width,height,Boolean(camera));
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
      canvas.remove(); style.remove(); sound.dispose(); ctx.fillText=originalFillText; if(hint)hint.textContent=oldHint;
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
  flightCards:true,
  autoFlightCards:true,
  flightBounds:{x:.62,y:.30,z:8},
  accent:"#dce9e8",
  dim:"#c7d3d3",
  surface:"17,28,33",
  panel:{bg:"rgba(22,41,48,.52)",border:"rgba(211,236,233,.27)",glow:"rgba(160,211,211,.17)",text:"#f4fbfa",muted:"#c7d7d5"},
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