import {createThemeAudio} from './theme-audio.mjs?v=20261012-bloom-control-1';
import {SKY_CAMERA_GLSL,SMOKE_FIELD_GLSL,skyCameraUniforms,setSkyCamera} from './sky-camera.mjs?v=20261012-bloom-control-1';
import {sceneResolution} from './scene-quality.mjs?v=20261012-bloom-control-1';
import {createSceneMotion} from './scene-motion.mjs';
const TAU = Math.PI * 2;
const MODULE_ORIGIN = new URL(import.meta.url).origin;
const centralAsset = (path) => new URL("../" + path, import.meta.url).href;

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

${SKY_CAMERA_GLSL}
${SMOKE_FIELD_GLSL}
void main(){
  vec3 rd=skyRay(vUv,uAspect);
  float h=max(0.0,rd.y);
  vec3 zenith=vec3(.17,.32,.41),upper=vec3(.39,.57,.66),haze=vec3(.83,.88,.86);
  vec3 dawn=vec3(.98,.82,.64);
  vec3 col=mix(haze,mix(upper,zenith,smoothstep(.12,.70,h)),1.0-exp(-h*3.0));
  vec3 sunDir=normalize(vec3(.36,.09,-1.0));
  float sunDot=max(dot(rd,sunDir),0.0);
  col+=dawn*pow(sunDot,96.0)*.24;
  vec2 vapour=smokeField(vec2(atan(rd.x,-rd.z),rd.y),uTime,0.0);
  vec3 cloud=mix(vec3(.95,.94,.90),vec3(.50,.62,.67),vapour.y*.74);
  col=mix(col,cloud,vapour.x*smoothstep(.012,.09,h)*.78);
  col=mix(col,haze,exp(-h*29.0)*(.38+.05*uZen));
  col=mix(haze,col,smoothstep(0.0,.009,h));
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
  if(iShape>0.5){
    // One uninterrupted pyramid-like peak. Shape 0 stays a clean architectural cut.
    float taper=mix(1.0,.018,smoothstep(.34,1.0,y01));
    local.xz*=taper;
  }
  vec3 world=vec3(iOffset.x,iOffset.y,z)+local*iScale;
  vWorld=world;
  vNormal=normalize(aNormal+vec3(0.0,(abs(aNormal.x)*iScale.x+abs(aNormal.z)*iScale.z)*.491/iScale.y*iShape,0.0));
  vTone=iTone;vShape=iShape;vDistance=distance(world,uCamera);vLocal=local;
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
  col*=mix(.94,1.0,uZen);
  col=mix(col,vec3(.83,.88,.86),fog);
  outColor=vec4(col,1.0);
}`;

const FOAM_VS = `#version 300 es
layout(location=0) in vec2 aPosition;
layout(location=1) in vec2 iCenter;
layout(location=2) in vec2 iSize;
layout(location=3) in float iPhase;
uniform mat4 uViewProj;
uniform float uTravel;
uniform float uSpan;
uniform float uTime;
out vec2 vLocal;
out float vPhase;
out float vDistance;
void main(){
  float z=mod(iCenter.y+uTravel,uSpan)-uSpan;
  float pulse=1.0+.055*sin(uTime*1.55+iPhase);
  vec2 local=aPosition;
  vec2 footprint=local*iSize*pulse;
  float ripple=sin((footprint.x+footprint.y)*.58-uTime*2.3+iPhase)*.026;
  vec3 world=vec3(iCenter.x+footprint.x,-.22+ripple,z+footprint.y);
  vLocal=local;
  vPhase=iPhase;
  vDistance=length(world.xz);
  gl_Position=uViewProj*vec4(world,1.0);
}`;

const FOAM_FS = `#version 300 es
precision highp float;
in vec2 vLocal;
in float vPhase;
in float vDistance;
out vec4 outColor;
uniform float uTime;
void main(){
  vec2 q=abs(vLocal);
  float edge=pow(pow(q.x,6.0)+pow(q.y,6.0),1.0/6.0);
  float inner=smoothstep(.57,.70,edge);
  float outer=1.0-smoothstep(.84,1.0,edge);
  float ring=inner*outer;
  float broken=.55+.45*sin((vLocal.x*13.0+vLocal.y*17.0)+uTime*3.1+vPhase);
  float crest=.60+.40*sin(edge*28.0-uTime*4.2+vPhase*1.7);
  float alpha=ring*(.13+.29*broken*crest);
  alpha*=1.0-smoothstep(250.0,440.0,vDistance);
  vec3 col=mix(vec3(.72,.86,.87),vec3(.98,.99,.96),.55+.45*crest);
  outColor=vec4(col,alpha);
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
  const rnd=seeded(90317),span=540,data=[];
  const add=(x,y,z,sx,sy,sz,tone=.6,shape=0)=>data.push(x,y,z,sx,sy,sz,tone,shape);
  const tower=(x,z,w,h,d,tone,pointed=false)=>{
    add(x,h*.5+.08,z,w,h,d,tone,pointed?1:0);
  };
  const columns=(x,z,side,tone)=>{
    for(let j=0;j<3;j++)add(x+side*j*2.35,3.5,z,1.0,7.0,1.0,tone,0);
  };

  for(let z=12,block=0;z<span;z+=13.8,block++){
    for(const side of [-1,1]){
      const x=side*(25+rnd()*23);
      const w=4.8+rnd()*8.6;
      const d=5.8+rnd()*10.6;
      const h=11+rnd()*39;
      const tone=.40+rnd()*.56;

      tower(x,z+rnd()*5,w,h,d,tone,rnd()>.50);

      // Waterfront bases sit at water level; they are not roof pieces.
      if(rnd()>.48)
        add(
          x,h*.08,z+d*.24,
          w*(1.04+rnd()*.34),
          1.25+rnd()*1.25,
          d*(1.0+rnd()*.28),
          Math.min(1,tone+.05),
          0
        );

      if(rnd()>.63)
        tower(
          x+side*(w*.75+2.2+rnd()*3.0),
          z+1+rnd()*5,
          1.3+rnd()*2.4,
          9+rnd()*22,
          1.4+rnd()*2.9,
          .68+rnd()*.25,
          true
        );

      if(rnd()>.79)
        columns(x+side*(w*.63+2.1),z-2+rnd()*5,side,.77);
    }

    for(const side of [-1,1]){
      if(rnd()>.16){
        const fx=side*(57+rnd()*54);
        tower(
          fx,z+rnd()*10,
          6+rnd()*14,
          19+rnd()*60,
          7+rnd()*15,
          .28+rnd()*.44,
          rnd()>.46
        );
      }
    }
  }

  for(let z=90;z<span;z+=138){
    const side=(Math.floor(z/138)%2)?-1:1;
    tower(side*38,z,11,64,11,.91,true);
    tower(side*38,z,6.2,82,6.2,.97,true);
    for(let i=-2;i<=2;i++)
      add(side*38+i*3.0,2.8,z+10,1.05,5.6,1.05,.82,0);
  }
  return {span,data:new Float32Array(data),count:data.length/8};
}

function buildFoam(city){
  const src=city.data,out=[];
  for(let i=0;i<src.length;i+=8){
    const x=src[i],y=src[i+1],z=src[i+2],sx=src[i+3],sy=src[i+4],sz=src[i+5];
    const base=y-sy*.5;
    if(base>.72||sy<5.2||sx<1.15||sz<1.15)continue;
    const phase=((i/8)*1.61803398875)%6.28318;
    out.push(x,z,sx*.64+2.0,sz*.64+2.0,phase);
  }
  return {data:new Float32Array(out),count:out.length/5};
}

function buildOcean(cols=96, rows=116) {
  const vertices=[];
  const indices=[];
  const z0=34, z1=-1900;
  for(let r=0;r<=rows;r++){
    const v=r/rows;
    const z=z0+(z1-z0)*Math.pow(v,1.65),reach=190+(z0-z)*1.9;
    for(let c=0;c<=cols;c++){
      const u=c/cols;
      vertices.push(-reach+reach*2*u,z);
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
    const p=(time*.17+i*.41)%1,x=width*(.18+(i%3)*.28+(p-.5)*.06),y=height*(.68-p*.43),s=5-p*2.8;
    ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(x-s,y);ctx.quadraticCurveTo(x-s*.45,y-s*.62,x,y);ctx.quadraticCurveTo(x+s*.45,y-s*.62,x+s,y);ctx.stroke();
  }ctx.restore();
}
function buildBirdSprites(){
  const sprites=[];
  for(let frame=0;frame<14;frame++){
    const c=document.createElement("canvas");
    c.width=128;c.height=72;
    const x=c.getContext("2d");
    const flap=Math.sin(frame/14*TAU);
    const cx=64,cy=36,lift=8+flap*6.5;
    x.translate(cx,cy);
    x.shadowColor="rgba(195,220,222,.38)";
    x.shadowBlur=7;
    const wing=x.createLinearGradient(0,-18,0,18);
    wing.addColorStop(0,"#ffffff");
    wing.addColorStop(.5,"#edf4f2");
    wing.addColorStop(1,"#b9cbcc");
    x.fillStyle=wing;
    x.strokeStyle="rgba(154,176,178,.34)";
    x.lineWidth=.9;

    x.beginPath();
    x.moveTo(-2,-1);
    x.bezierCurveTo(-15,-7,-27,-lift,-45,-12-lift*.24);
    x.bezierCurveTo(-32,3,-18,11,-2,5);
    x.closePath();x.fill();x.stroke();

    x.beginPath();
    x.moveTo(2,-1);
    x.bezierCurveTo(15,-7,27,-lift,45,-12-lift*.24);
    x.bezierCurveTo(32,3,18,11,2,5);
    x.closePath();x.fill();x.stroke();

    x.shadowBlur=4;
    const body=x.createLinearGradient(0,-8,0,10);
    body.addColorStop(0,"#ffffff");
    body.addColorStop(.6,"#eef4f2");
    body.addColorStop(1,"#afc2c4");
    x.fillStyle=body;
    x.beginPath();x.ellipse(0,3,6.7,15.5,0,0,TAU);x.fill();
    x.fillStyle="#fbfdfc";
    x.beginPath();x.ellipse(0,-9.5,4.7,6.0,0,0,TAU);x.fill();

    x.fillStyle="#d6e3e2";
    x.beginPath();x.moveTo(-5,13);x.lineTo(-11,22);x.lineTo(-1,17);x.closePath();x.fill();
    x.beginPath();x.moveTo(5,13);x.lineTo(11,22);x.lineTo(1,17);x.closePath();x.fill();

    x.globalAlpha=.72;x.fillStyle="#ffffff";
    x.beginPath();x.ellipse(-2,-4,2.1,8,-.15,0,TAU);x.fill();
    sprites.push(c);
  }
  return sprites;
}

function createBirdTraffic(){
  const rnd=seeded(41027),sprites=buildBirdSprites(),flights=[];
  let nextAt=.55;
  const spawn=(time,zen)=>{
    const side=rnd()<.5?-1:1;
    const sx=side<0?.12+rnd()*.26:.62+rnd()*.26;
    const sy=.56+rnd()*.16;
    const ex=.47+(rnd()-.5)*.055;
    const ey=.27+rnd()*.075;
    flights.push({
      born:time,
      duration:(zen?2.85:3.25)+rnd()*1.05,
      sx,sy,ex,ey,
      size:18+rnd()*7,
      bank:(rnd()-.5)*.055,
      phase:rnd()*TAU,
      curve:(rnd()-.5)*.035
    });
    nextAt=time+(zen?2.1:2.8)+rnd()*(zen?2.1:2.8);
  };
  return {
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      if(time>=nextAt&&flights.length===0)spawn(time,zen);
      for(let i=flights.length-1;i>=0;i--){
        const b=flights[i],p=(time-b.born)/b.duration;
        if(p<0)continue;
        if(p>=1){flights.splice(i,1);continue;}

        // Screen-space perspective: every bird rises toward the vanishing point
        // while shrinking smoothly, so it always reads as flying away from us.
        const e=1-Math.pow(1-p,1.62);
        const arc=Math.sin(p*Math.PI);
        const x=(b.sx+(b.ex-b.sx)*e+arc*b.curve)*width;
        const y=(b.sy+(b.ey-b.sy)*e-arc*.018)*height;
        const depth=Math.max(.07,1-e);
        const scale=.20+depth*1.02;
        const size=b.size*scale*(zen?1.03:1);

        // About 1.2–1.5 full wing cycles per second: no hummingbird-like flicker.
        const frame=((Math.floor(time*19+b.phase*2.1)%sprites.length)+sprites.length)%sprites.length;
        const fadeIn=Math.min(1,p/.08),fadeOut=Math.min(1,(1-p)/.16);
        const alpha=Math.min(fadeIn,fadeOut)*(.72+.24*depth);

        ctx.save();
        ctx.translate(x,y);
        ctx.rotate(b.bank+(b.ex-b.sx)*.035);
        ctx.globalAlpha=alpha;
        ctx.drawImage(sprites[frame],-size*1.25,-size*.70,size*2.5,size*1.4);
        ctx.restore();
      }
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
    {src:centralAsset("audio-library/nature/ocean_waves.ogg"),volume:.24},
    {src:centralAsset("audio-library/nature/wind_soft.ogg"),fallback:centralAsset("audio-library/compatible/nature/wind_soft.m4a"),volume:.14},
    {src:centralAsset("audio-library/ambience/night_air.ogg"),fallback:centralAsset("audio-library/compatible/ambience/night_air.m4a"),volume:.08}
  ],
  oneShots:[{src:centralAsset("audio-library/nature/bird_wings_flutter.ogg"),fallback:centralAsset("audio-library/compatible/nature/bird_wings_flutter.m4a"),volume:.17,minDelay:11,maxDelay:27}]
};

function createThemeSound(){return createThemeAudio(SOUND);}

function createRenderer(ctx){
  const sourceCanvas=ctx?.canvas;
  if(!sourceCanvas||!document.body)return fallbackRenderer(ctx);
  const canvas=document.createElement("canvas");
  canvas.className="theme-world-canvas white-ocean-world";
  canvas.setAttribute("aria-hidden","true");
  Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block",transform:"translateZ(0)",backfaceVisibility:"hidden",willChange:"transform"});
  sourceCanvas.parentNode?.insertBefore(canvas,sourceCanvas);
  const style=document.createElement("style");
  style.textContent='html[data-theme="white-ocean-city"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="white-ocean-city"] .flight-hint{opacity:.72;color:#e4efed}html[data-theme="white-ocean-city"] .theme-sound-toggle svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}html[data-theme="white-ocean-city"] .theme-sound-toggle svg path:first-child{fill:currentColor;stroke:none}html[data-theme="white-ocean-city"] .theme-sound-toggle[data-enabled="true"]{color:#f1fbfa;box-shadow:0 0 0 1px #d9eeee55,0 0 28px #bde5e533}html[data-theme="white-ocean-city"] .flight-planet{color:#f5fbfa}html[data-theme="white-ocean-city"] .planet-orb{background:radial-gradient(circle at 32% 26%,rgba(245,252,250,.56),rgba(106,145,150,.26) 44%,rgba(20,38,45,.52) 82%);border-color:rgba(222,242,239,.48)}';
  document.head.append(style);
  const sound=createThemeSound();
  const originalFillText=ctx.fillText;

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

  let skyProgram, cityProgram, oceanProgram, foamProgram;
  try{
    skyProgram=program(gl,SKY_VS,SKY_FS);
    cityProgram=program(gl,CITY_VS,CITY_FS);
    oceanProgram=program(gl,OCEAN_VS,OCEAN_FS);
    foamProgram=program(gl,FOAM_VS,FOAM_FS);
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

  const foam=buildFoam(city);
  const foamVao=keep(gl.createVertexArray());
  gl.bindVertexArray(foamVao);
  const foamQuad=keep(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER,foamQuad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const foamInstances=keep(gl.createBuffer());
  gl.bindBuffer(gl.ARRAY_BUFFER,foamInstances);
  gl.bufferData(gl.ARRAY_BUFFER,foam.data,gl.STATIC_DRAW);
  const foamStride=5*4;
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,2,gl.FLOAT,false,foamStride,0);gl.vertexAttribDivisor(1,1);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,2,gl.FLOAT,false,foamStride,2*4);gl.vertexAttribDivisor(2,1);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,foamStride,4*4);gl.vertexAttribDivisor(3,1);

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
  const birds=createBirdTraffic();
  const hint=document.querySelector(".flight-hint"),oldHint=hint?.textContent||"";
  if(hint)hint.textContent="Перемещайтесь в пространстве с помощью мыши или жестов";

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
    foam:{
      vp:gl.getUniformLocation(foamProgram,"uViewProj"),
      travel:gl.getUniformLocation(foamProgram,"uTravel"),
      span:gl.getUniformLocation(foamProgram,"uSpan"),
      time:gl.getUniformLocation(foamProgram,"uTime"),
    },
  };

  const skyView=skyCameraUniforms(gl,skyProgram);

  function resize({width,height,ratio=1}){
    cssWidth=Math.max(1,width);
    cssHeight=Math.max(1,height);
    const mobile=cssWidth<=760;
    const size=sceneResolution({width:cssWidth,height:cssHeight,ratio});quality=size.pixelRatio;
    const w=size.width,h=size.height;
    if(canvas.width!==w||canvas.height!==h){
      canvas.width=w; canvas.height=h;
      gl.viewport(0,0,w,h);
    }
  }

  const motion=createSceneMotion({rest:0.4,flight:2.45,xLimit:1.45,yLimit:1.0});
  function renderWorld(time,camera){
    const zen=Boolean(camera);
    const pose=motion.step(time,camera);
    const {x:cx,y:cy,z:cz}=pose.input;
    const travel=pose.travel+cz*24;
    const autoX=Math.sin(time*.043)*2.8+Math.sin(time*.017+1.4)*1.3;

    // Real camera translation in all directions, inside a deliberately wide empty corridor.
    const eyeX=autoX+cx*10.2;
    const eyeY=9.4+cy*7.2+Math.sin(time*.041)*.52;
    const eye=[eyeX,eyeY,14.5];
    const target=[
      eyeX+cx*1.35+Math.sin(time*.028)*1.7,
      eyeY-4.35+cy*.58+Math.sin(time*.023)*.40,
      -55
    ];
    const fov=zen ? .91 : 1.00;
    perspective(projection,fov,cssWidth/cssHeight,.12,1800);
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
    setSkyCamera(gl,skyView,view,fov);
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

    if(foam.count){
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);
      gl.depthMask(false);
      gl.useProgram(foamProgram);
      gl.bindVertexArray(foamVao);
      gl.uniformMatrix4fv(uniforms.foam.vp,false,vp);
      gl.uniform1f(uniforms.foam.travel,travel);
      gl.uniform1f(uniforms.foam.span,city.span);
      gl.uniform1f(uniforms.foam.time,time);
      gl.drawArraysInstanced(gl.TRIANGLES,0,6,foam.count);
      gl.depthMask(true);
      gl.disable(gl.BLEND);
    }

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
    canvas,
    resize,
    draw({time,width,height,camera}){
      if(disposed)return;
      if(width!==cssWidth||height!==cssHeight)resize({width,height,ratio:window.devicePixelRatio||1});
      renderWorld(time,camera);
      birds.draw(ctx,time,width,height,Boolean(camera));
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
        gl.deleteProgram(foamProgram);
        for(const r of resources){
          if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);
          else gl.deleteBuffer(r);
        }
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }catch{}
    },
  };
}

export default {
  id:"white-ocean-city",
  renderer:"webgl-city",
  particles:false,
  marks:true,
  flightCards:true,
  autoFlightCards:true,
  continuousDepth:true,
  flightBounds:{x:1.45,y:1.0},
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
