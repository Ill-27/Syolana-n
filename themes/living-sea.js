import { createSeaMotion, shipHullGeometry, shipDeckGeometry, shipRailGeometry } from "./sea-motion.mjs?v=20261005-sea12";

const TAU=Math.PI*2;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const mix=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t);return t*t*(3-2*t)};
function hash1(n){const x=Math.sin(n*12.9898+78.233)*43758.5453;return x-Math.floor(x)}
function compile(gl,type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const m=gl.getShaderInfoLog(s)||"shader";gl.deleteShader(s);throw Error(m)}return s}
function program(gl,vs,fs){const p=gl.createProgram(),a=compile(gl,gl.VERTEX_SHADER,vs),b=compile(gl,gl.FRAGMENT_SHADER,fs);gl.attachShader(p,a);gl.attachShader(p,b);gl.linkProgram(p);gl.deleteShader(a);gl.deleteShader(b);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const m=gl.getProgramInfoLog(p)||"program";gl.deleteProgram(p);throw Error(m)}return p}
function perspective(o,fovy,aspect,near,far){const f=1/Math.tan(fovy/2),nf=1/(near-far);o.fill(0);o[0]=f/aspect;o[5]=f;o[10]=(far+near)*nf;o[11]=-1;o[14]=2*far*near*nf;return o}
function lookAt(o,e,c,u){let z0=e[0]-c[0],z1=e[1]-c[1],z2=e[2]-c[2],l=Math.hypot(z0,z1,z2)||1;z0/=l;z1/=l;z2/=l;let x0=u[1]*z2-u[2]*z1,x1=u[2]*z0-u[0]*z2,x2=u[0]*z1-u[1]*z0;l=Math.hypot(x0,x1,x2)||1;x0/=l;x1/=l;x2/=l;const y0=z1*x2-z2*x1,y1=z2*x0-z0*x2,y2=z0*x1-z1*x0;o[0]=x0;o[1]=y0;o[2]=z0;o[3]=0;o[4]=x1;o[5]=y1;o[6]=z1;o[7]=0;o[8]=x2;o[9]=y2;o[10]=z2;o[11]=0;o[12]=-(x0*e[0]+x1*e[1]+x2*e[2]);o[13]=-(y0*e[0]+y1*e[1]+y2*e[2]);o[14]=-(z0*e[0]+z1*e[1]+z2*e[2]);o[15]=1;return o}
function multiply(o,a,b){const r=new Float32Array(16);for(let c=0;c<4;c++)for(let row=0;row<4;row++)r[c*4+row]=a[row]*b[c*4]+a[4+row]*b[c*4+1]+a[8+row]*b[c*4+2]+a[12+row]*b[c*4+3];o.set(r);return o}

const STATES=[
{day:.8,sunset:.2,night:0,storm:0,fog:.22,rain:0,wind:.18},
{day:1,sunset:0,night:0,storm:0,fog:.02,rain:0,wind:.16},
{day:.7,sunset:0,night:0,storm:.18,fog:.25,rain:.08,wind:.48},
{day:.16,sunset:0,night:.08,storm:1,fog:.42,rain:1,wind:1},
{day:.52,sunset:.18,night:0,storm:.25,fog:.18,rain:.24,wind:.55},
{day:.48,sunset:1,night:.08,storm:0,fog:.08,rain:0,wind:.18},
{day:.08,sunset:.14,night:1,storm:0,fog:.10,rain:0,wind:.11},
{day:.3,sunset:.28,night:.55,storm:0,fog:.24,rain:0,wind:.10}
];
function stateAt(time){
  const span=34,raw=time/span,i=Math.floor(raw)%STATES.length,j=(i+1)%STATES.length,t=smooth(raw-Math.floor(raw)),a=STATES[i],b=STATES[j],o={};
  for(const k of Object.keys(a))o[k]=mix(a[k],b[k],t);
  const pulse=Math.max(0,Math.sin(time*.66+Math.sin(time*.17)*2));o.lightning=o.storm*Math.pow(pulse,38);o.wave=1.15+.40*o.wind+1.65*o.storm;return o
}

const SKY_VS=`#version 300 es
layout(location=0)in vec2 aPosition;out highp vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}
`;
const SKY_FS=`#version 300 es
precision highp float;
in highp vec2 vUv;out vec4 outColor;
uniform float uTime,uAspect,uDay,uSunset,uNight,uStorm,uFog,uLightning,uPitch,uYaw;
// Continuous smoke puffs: no tessellated cloud mesh, hash cells or projected grid.
// Analytic soft density also avoids mobile GPU noise precision artefacts.
vec2 smoke(vec2 p){
  p+=vec2(sin(p.y*11.+uTime*.017),cos(p.x*9.-uTime*.012))*.024;
  float density=0.,shade=0.;
  for(int i=0;i<22;i++){
    float s=float(i)+1.;
    vec2 center=vec2(sin(s*2.19)*.78,.13+(sin(s*.91)*.5+.5)*.31);
    center.x+=sin(uTime*.014+s*.7)*.11;
    center.y+=sin(uTime*.009+s)*.012;
    vec2 radius=vec2(.07+(sin(s*.47)*.5+.5)*.12,.025+(cos(s*1.31)*.5+.5)*.050);
    radius*=1.+uStorm*.48;
    vec2 d=(p-center)/radius;
    density+=exp(-dot(d,d)*1.6)*(.70+.26*sin(s*.73));
    vec2 under=(p-center+vec2(.009,.035))/radius;
    shade+=exp(-dot(under,under)*1.7)*.30;
  }
  return vec2(1.-exp(-density*(1.4+uStorm*1.8)),clamp(shade,0.,1.));
}
void main(){
  vec3 rd=normalize(vec3((vUv.x-.5)*uAspect+uYaw,(vUv.y-.5)+uPitch,-1.));
  float h=max(rd.y,0.),sunHeight=mix(.28,.045,uSunset);
  vec3 sunDir=normalize(vec3(.40,sunHeight,-1.));
  float sunDot=max(dot(rd,sunDir),0.);
  vec3 zenith=mix(vec3(.055,.25,.51),vec3(.10,.075,.19),uSunset);
  vec3 horizon=mix(vec3(.68,.82,.87),vec3(.95,.49,.22),uSunset);
  zenith=mix(zenith,vec3(.006,.014,.038),uNight);
  horizon=mix(horizon,vec3(.075,.12,.18),uNight);
  zenith=mix(zenith,vec3(.040,.059,.074),uStorm*.93);
  horizon=mix(horizon,vec3(.27,.31,.32),uStorm*.91);
  vec3 col=mix(horizon,zenith,1.-exp(-h*3.2));
  col+=vec3(1.,.65,.31)*pow(sunDot,22.)*(.16+.32*uSunset)*(1.-uNight)*(1.-uStorm);
  col+=vec3(1.,.90,.69)*smoothstep(.9995,.99985,sunDot)*(1.-uNight)*(1.-uStorm)*.66;

  vec2 vapour=smoke(vec2(atan(rd.x,-rd.z),rd.y));
  vec3 shade=mix(vec3(.50,.60,.67),vec3(.12,.16,.19),uStorm);
  vec3 lit=mix(vec3(.96,.97,.95),vec3(.49,.54,.56),uStorm);
  lit=mix(lit,vec3(1.,.69,.43),uSunset*.65);
  vec3 cloud=mix(lit,shade,vapour.y*.70);
  cloud*=mix(1.,.20,uNight);
  float aerial=smoothstep(.012,.14,h);
  col=mix(col,cloud,vapour.x*aerial*mix(.78,.94,uStorm));
  col=mix(col,horizon,exp(-h*28.)*(.13+.52*uFog));
  col+=vec3(.82,.91,1.)*uLightning*.16;
  outColor=vec4(col,1.);
}
`;

function oceanGeometry(cols=104,rows=180){
  const v=[],idx=[],z0=85,z1=-1500;
  for(let r=0;r<=rows;r++){
    const q=r/rows,z=mix(z0,z1,q*q),reach=85+(z0-z)*1.35;
    for(let c=0;c<=cols;c++)v.push(mix(-reach,reach,c/cols),z);
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const a=r*(cols+1)+c,b=a+1,d=(r+1)*(cols+1)+c,e=d+1;idx.push(a,d,b,b,d,e);
  }
  return{vertices:new Float32Array(v),indices:new Uint32Array(idx)};
}
const OCEAN_VS=`#version 300 es
layout(location=0) in vec2 aPosition;
uniform mat4 uViewProj;
uniform float uTime,uCameraX,uCameraZ,uWave,uStorm;
out vec3 vWorld,vNormal;
void W(inout vec3 p,inout vec3 tx,inout vec3 tz,vec2 d,float amp,float freq,float speed,float steep){
  d=normalize(d);float ph=dot(d,p.xz)*freq+uTime*speed,a=amp*uWave;
  float dx=dot(d,tx.xz)*freq,dz=dot(d,tz.xz)*freq;
  vec3 derivative=vec3(-d.x*steep*a*sin(ph),a*cos(ph),-d.y*steep*a*sin(ph));
  tx+=derivative*dx;tz+=derivative*dz;
  p+=vec3(d.x*steep*a*cos(ph),a*sin(ph),d.y*steep*a*cos(ph));
}
void main(){
  vec3 p=vec3(aPosition.x+uCameraX,0.,aPosition.y+uCameraZ),tx=vec3(1,0,0),tz=vec3(0,0,1);
  W(p,tx,tz,vec2(1.,.22),.78,.023,.62,.43);
  W(p,tx,tz,vec2(.31,1.),.48,.043,-.84,.31);
  W(p,tx,tz,vec2(-.72,.43),.30,.074,1.13,.23);
  W(p,tx,tz,vec2(.88,-.47),.145,.132,-1.54,.14);
  W(p,tx,tz,vec2(-.16,.99),.072,.205,1.88,.08);
  if(uStorm>.02){
    W(p,tx,tz,vec2(.94,.18),1.55*uStorm,.013,.48,.68);
    W(p,tx,tz,vec2(-.48,.88),1.05*uStorm,.022,-.68,.56);
    W(p,tx,tz,vec2(.26,.97),.56*uStorm,.052,1.00,.39);
  }
  vWorld=p;vNormal=normalize(cross(tz,tx));gl_Position=uViewProj*vec4(p,1.);
}
`;
const OCEAN_FS=`#version 300 es
precision highp float;
in vec3 vWorld,vNormal;out vec4 outColor;
uniform vec3 uCamera;
uniform float uTime,uDay,uSunset,uNight,uStorm,uFog,uLightning,uWave;
void main(){
  vec3 n=normalize(vNormal);
  float dist=distance(vWorld,uCamera);
  float micro=(1.-smoothstep(35.,230.,dist))*mix(.012,.025,uStorm);
  vec2 ripple=vec2(sin(vWorld.x*.43+vWorld.z*.31-uTime*2.3),sin(vWorld.x*.29-vWorld.z*.51+uTime*1.77));
  n=normalize(n+vec3(ripple.x*micro,0.,ripple.y*micro));
  vec3 V=normalize(uCamera-vWorld),L=normalize(vec3(.40,mix(.48,.045,uSunset),-1.));
  float below=1.-step(0.,V.y);if(below>.5)n=-n;
  float fres=.025+.975*pow(1.-max(dot(n,V),0.),5.);
  vec3 deep=mix(vec3(.008,.102,.151),vec3(.044,.070,.12),uSunset);
  deep=mix(deep,vec3(.003,.016,.031),uNight);deep=mix(deep,vec3(.010,.049,.059),uStorm);
  vec3 reflected=mix(vec3(.27,.53,.66),vec3(.53,.30,.23),uSunset);
  reflected=mix(reflected,vec3(.040,.075,.13),uNight);
  reflected=mix(reflected,vec3(.19,.27,.29),uStorm);
  float light=max(dot(n,normalize(vec3(-.4,.75,.25))),0.);
  vec3 col=mix(deep*(.80+.26*light),reflected,.12+.72*fres);
  float glint=pow(max(dot(reflect(-L,n),V),0.),180.);
  col+=vec3(.92,.64,.31)*glint*.32*(1.-uStorm)*(1.-uNight);
  // There is no height-threshold foam: it painted whole wave faces white.
  vec3 haze=mix(vec3(.68,.80,.84),vec3(.24,.30,.32),uStorm);
  haze=mix(haze,vec3(.073,.11,.16),uNight);
  col=mix(col,haze,smoothstep(240.,1250.,dist)*(.48+.38*uFog));
  col=mix(col,vec3(.055,.28,.32)*(1.-uNight*.65),below*.52);
  col+=vec3(.16,.22,.24)*uLightning*.09;
  outColor=vec4(col,1.);
}
`;

const UNDERWATER_FS=`#version 300 es
precision highp float;in vec2 vUv;out vec4 outColor;
uniform float uTime,uAspect,uDepth,uNight,uStorm;
void main(){
  vec2 uv=vUv;float depth=max(uDepth,0.);
  float amount=smoothstep(0.,1.8,depth);
  vec3 surface=vec3(.055,.30,.34),deep=vec3(.005,.070,.12);
  vec3 col=mix(deep,surface,pow(uv.y,1.4)*exp(-depth*.065));
  float beams=pow(max(0.,sin((uv.x-.65)*19./(.5+uv.y)+uTime*.10)*.5+.5),9.);
  beams+=pow(max(0.,sin((uv.x-.65)*31./(.5+uv.y)-uTime*.065)*.5+.5),15.)*.35;
  col+=vec3(.12,.28,.29)*beams*pow(uv.y,2.)*exp(-depth*.11)*(1.-uStorm*.72);
  // Suspended particles drift at different depths, with soft round edges.
  for(int i=0;i<3;i++){
    float f=float(i)+1.;vec2 p=uv*vec2(uAspect,1.)*(28.+f*14.)+vec2(uTime*.11*f,-uTime*.08*f);
    vec2 cell=floor(p),q=fract(p)-.5;
    float seed=fract(sin(dot(cell,vec2(127.1,311.7))+f*17.)*43758.5453);
    float particle=(1.-smoothstep(.02,.10,length(q)))*step(.976,seed);
    col+=vec3(.22,.42,.43)*particle*(.13/f);
  }
  col*=mix(1.,.28,uNight)*mix(1.,.76,uStorm);
  outColor=vec4(col,amount*mix(.38,.88,1.-exp(-depth*.18)));
}
`;

function seaHeight(x,z,t,c){
  let y=0;
  const wave=(dx,dz,amp,freq,speed)=>{
    const l=Math.hypot(dx,dz)||1,ph=((dx/l)*x+(dz/l)*z)*freq+t*speed;
    y+=amp*c.wave*Math.sin(ph);
  };
  wave(1,.22,.78,.023,.62);
  wave(.31,1,.48,.043,-.84);
  wave(-.72,.43,.30,.074,1.13);
  wave(.88,-.47,.145,.132,-1.54);
  wave(-.16,.99,.072,.205,1.88);
  if(c.storm>.02){
    wave(.94,.18,1.55*c.storm,.013,.48);
    wave(-.48,.88,1.05*c.storm,.022,-.68);
    wave(.26,.97,.56*c.storm,.052,1.00);
  }
  return y;
}

function boxGeometry(){const p=[],n=[],F=[[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[0,0,1]],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[0,0,-1]],[[ -.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-1,0,0]],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[1,0,0]],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5],[0,1,0]],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],[0,-1,0]]];for(const f of F){const[a,b,c,d,no]=f;for(const v of[a,b,c,a,c,d]){p.push(...v);n.push(...no)}}return{positions:new Float32Array(p),normals:new Float32Array(n)}}
function prismGeometry(sides=10){const p=[],n=[];for(let i=0;i<sides;i++){const a=i/sides*TAU,b=(i+1)/sides*TAU,ax=Math.cos(a)*.5,az=Math.sin(a)*.5,bx=Math.cos(b)*.5,bz=Math.sin(b)*.5,nx=Math.cos((a+b)*.5),nz=Math.sin((a+b)*.5);p.push(ax,-.5,az,bx,-.5,bz,bx,.5,bz,ax,-.5,az,bx,.5,bz,ax,.5,az);for(let k=0;k<6;k++)n.push(nx,0,nz)}return{positions:new Float32Array(p),normals:new Float32Array(n)}}
function squareSailGeometry(rows=16,cols=18){
  const p=[],n=[];
  const vertex=(x,y)=>[x,y-.035*Math.sin((x+.5)*Math.PI)*(1.-(y+.5)),0];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const a=vertex(c/cols-.5,r/rows-.5),b=vertex((c+1)/cols-.5,r/rows-.5),d=vertex(c/cols-.5,(r+1)/rows-.5),e=vertex((c+1)/cols-.5,(r+1)/rows-.5);
    for(const v of[a,b,d,b,e,d]){p.push(...v);n.push(0,0,1)};
  }
  return{positions:new Float32Array(p),normals:new Float32Array(n)};
}
function sailGeometry(rows=10){const p=[],n=[];for(let r=0;r<rows;r++)for(let c=0;c<=r;c++){const y0=-.5+r/rows,y1=-.5+(r+1)/rows,h0=(1-r/rows)*.5,h1=(1-(r+1)/rows)*.5,x00=r===0?0:mix(-h0,h0,c/r),x10=mix(-h1,h1,c/(r+1)),x11=mix(-h1,h1,(c+1)/(r+1)),a=[x00,y0,0],b=[x10,y1,0],cc=[x11,y1,0];for(const v of[a,b,cc]){p.push(...v);n.push(0,0,1)}if(c<r){const x01=mix(-h0,h0,(c+1)/r),d=[x01,y0,0];for(const v of[a,cc,d]){p.push(...v);n.push(0,0,1)}}}const copy=[...p];for(let i=copy.length-3;i>=0;i-=3){p.push(copy[i],copy[i+1],copy[i+2]);n.push(0,0,-1)}return{positions:new Float32Array(p),normals:new Float32Array(n)}}

const OBJ_VS=`#version 300 es
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;
uniform mat4 uViewProj;uniform vec3 uOffset,uScale,uRotation;
out vec3 vNormal,vWorld,vLocal;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){vec3 p=aPosition*uScale;vLocal=p;p=rz(rx(ry(p,uRotation.y),uRotation.x),uRotation.z);
  vNormal=normalize(rz(rx(ry(aNormal/uScale,uRotation.y),uRotation.x),uRotation.z));
  vWorld=p+uOffset;gl_Position=uViewProj*vec4(vWorld,1.);}
`;
const OBJ_FS=`#version 300 es
precision highp float;in vec3 vNormal,vWorld,vLocal;out vec4 outColor;
uniform vec3 uColor,uCamera,uFogColor;uniform float uNight,uStorm,uFog;
void main(){
  vec3 n=normalize(vNormal),L=normalize(vec3(-.48,.82,.28));
  float d=max(dot(n,L),0.),rim=pow(1.-max(dot(n,normalize(uCamera-vWorld)),0.),2.2);
  float planks=mix(vLocal.y*6.5,vLocal.x*3.5,smoothstep(.6,.9,n.y));
  float grain=sin(vLocal.z*13.+sin(planks*2.7)*.54)*sin(vLocal.z*3.1+planks*.7);
  float seam=(1.-smoothstep(.012,.055,abs(fract(planks)-.5)))*(1.-smoothstep(.06,.45,fwidth(planks)));
  vec3 V=normalize(uCamera-vWorld),H=normalize(L+V);
  float varnish=pow(max(dot(n,H),0.),28.)*.075;
  vec3 col=uColor*(.43+.53*d)*(1.+grain*.055-seam*.16)+vec3(.13,.21,.23)*rim*.12+vec3(.58,.48,.32)*varnish;
  col*=mix(1.,.55,uNight)*mix(1.,.78,uStorm);
  float f=smoothstep(165.,760.,distance(vWorld,uCamera))*(.46+.40*uFog);
  col=mix(col,uFogColor,clamp(f,0.,.95));outColor=vec4(col,1.);
}
`;
const SAIL_VS=`#version 300 es
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;
uniform mat4 uViewProj;uniform vec3 uOffset,uScale,uRotation;
uniform float uTime,uWind,uPhase;out vec3 vNormal,vWorld;out vec2 vCloth;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){
  vec3 q=aPosition;vCloth=q.xy+.5;
  float fx=clamp(q.x+.5,0.,1.),fy=clamp(q.y+.5,0.,1.);
  float wind=.32+.68*uWind,phase=fx*6.+uTime*1.7+uPhase;
  float inflate=sin(fx*3.14159)*sin(fy*3.14159);
  float clothScale=min(uScale.x,uScale.y);
  q.z+=(inflate*.19*wind+sin(phase)*.019*wind*(1.-fy))*clothScale;
  float dx=(cos(fx*3.14159)*sin(fy*3.14159)*.597*wind+cos(phase)*.114*wind*(1.-fy))*clothScale;
  float dy=(sin(fx*3.14159)*cos(fy*3.14159)*.597*wind-sin(phase)*.019*wind)*clothScale;
  vec3 n=normalize(vec3(-dx/uScale.x,-dy/uScale.y,1.));
  vec3 p=rz(rx(ry(q*uScale,uRotation.y),uRotation.x),uRotation.z);
  vNormal=normalize(rz(rx(ry(n,uRotation.y),uRotation.x),uRotation.z));
  vWorld=p+uOffset;gl_Position=uViewProj*vec4(vWorld,1.);
}
`;
const SAIL_FS=`#version 300 es
precision highp float;in vec3 vNormal,vWorld;in vec2 vCloth;out vec4 outColor;
uniform vec3 uColor,uCamera,uFogColor;uniform float uNight,uStorm,uFog;
void main(){
  vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
  vec3 L=normalize(vec3(-.48,.82,.28));float diffuse=.58+.38*max(dot(n,L),0.);
  float back=max(dot(-n,L),0.)*.16;
  float panels=abs(fract(vCloth.x*7.)-.5),seam=(1.-smoothstep(.018,.033,panels))*.065;
  seam*=1.-smoothstep(.04,.20,fwidth(vCloth.x*7.));
  float edge=smoothstep(0.,.10,min(min(vCloth.x,1.-vCloth.x),min(vCloth.y,1.-vCloth.y)));
  vec3 col=uColor*(diffuse+back-seam)*mix(.88,1.,edge);
  col*=mix(1.,.42,uNight)*mix(1.,.84,uStorm);
  float f=smoothstep(165.,760.,distance(vWorld,uCamera))*(.44+.42*uFog);
  col=mix(col,uFogColor,clamp(f,0.,.94));outColor=vec4(col,1.);
}
`;


function shipWireGeometries(){
  const line=(arr,a,b)=>arr.push(...a,...b);
  const addHull=(wood,deck,len,width,height,sections=12)=>{
    const sec=[];
    for(let i=0;i<=sections;i++){
      const f=i/sections,z=mix(-len*.56,len*.48,f);
      const shape=Math.pow(Math.sin(Math.PI*clamp(f*.96+.025)),.58);
      const w=width*(.16+.84*shape);
      const top=1.70+.18*Math.sin(f*Math.PI);
      const keel=-height*(.52+.28*(1-shape));
      sec.push({z,w,top,keel});
      line(wood,[-w,top,z],[w,top,z]);
      line(wood,[-w,top,z],[-w*.52,keel,z]);
      line(wood,[w,top,z],[w*.52,keel,z]);
      line(wood,[-w*.52,keel,z],[w*.52,keel,z]);
      if(i>0){
        const q=sec[i-1];
        line(wood,[-q.w,q.top,q.z],[-w,top,z]);
        line(wood,[q.w,q.top,q.z],[w,top,z]);
        line(wood,[-q.w*.52,q.keel,q.z],[-w*.52,keel,z]);
        line(wood,[q.w*.52,q.keel,q.z],[w*.52,keel,z]);
      }
    }
    // deck planks and rails
    for(const xf of [-.78,-.52,-.26,0,.26,.52,.78]){
      let prev=null;
      for(const q of sec){
        const p=[q.w*xf,q.top+.03,q.z];
        if(prev)line(deck,prev,p);prev=p;
      }
    }
    for(let i=1;i<sections;i+=2){
      const q=sec[i];line(deck,[-q.w*.92,q.top+.06,q.z],[q.w*.92,q.top+.06,q.z]);
    }
    line(wood,[0,sec[0].keel,sec[0].z],[0,sec[sec.length-1].keel,sec[sec.length-1].z]);
    return sec;
  };

  const addSailGrid=(sail,z,y0,y1,w0,w1,rows=6,cols=6)=>{
    for(let r=0;r<=rows;r++){
      const f=r/rows,y=mix(y0,y1,f),w=mix(w0,w1,f);
      line(sail,[-w,y,z],[w,y,z]);
    }
    for(let c=0;c<=cols;c++){
      const f=c/cols;
      line(sail,[mix(-w0,w0,f),y0,z],[mix(-w1,w1,f),y1,z]);
    }
    line(sail,[-w0,y0,z],[0,(y0+y1)*.52,z]);
    line(sail,[w0,y0,z],[0,(y0+y1)*.52,z]);
  };

  const addTriSail=(sail,a,b,c,steps=7)=>{
    line(sail,a,b);line(sail,b,c);line(sail,c,a);
    for(let i=1;i<steps;i++){
      const f=i/steps;
      const p1=[mix(a[0],c[0],f),mix(a[1],c[1],f),mix(a[2],c[2],f)];
      const p2=[mix(b[0],c[0],f),mix(b[1],c[1],f),mix(b[2],c[2],f)];
      line(sail,p1,p2);
    }
  };

  const addMast=(g,z,h,wide,withUpper=true)=>{
    const {wood,rig,sail}=g;
    line(wood,[0,1.8,z],[0,h,z]);
    const yards=withUpper?[[h*.58,wide],[h*.78,wide*.76],[h*.91,wide*.50]]:[[h*.62,wide],[h*.82,wide*.62]];
    for(const [y,w] of yards)line(wood,[-w,y,z],[w,y,z]);
    line(rig,[0,h,z],[-4.5,1.8,z+5.8]);line(rig,[0,h,z],[4.5,1.8,z-5.8]);
    line(rig,[-wide,h*.58,z],[0,1.8,z]);line(rig,[wide,h*.58,z],[0,1.8,z]);
    addSailGrid(sail,z-.08,h*.31,h*.57,wide*.88,wide*.98,5,6);
    if(withUpper)addSailGrid(sail,z-.10,h*.61,h*.77,wide*.67,wide*.74,4,5);
  };

  const make=(type)=>{
    const g={wood:[],deck:[],rig:[],sail:[],accent:[]};
    if(type===2){
      addHull(g.wood,g.deck,13,3.4,2.1,10);
      addMast(g,1.5,10.5,3.7,false);
      addTriSail(g.sail,[0,9.8,1.35],[0,2.5,1.35],[4.6,2.5,1.35],8);
      line(g.wood,[0,2.1,-6.8],[0,4.0,-11.0]);
      line(g.rig,[0,4.0,-11.0],[0,10.5,1.5]);
    }else{
      const frigate=type===3,pirate=type===0;
      addHull(g.wood,g.deck,frigate?22:20.5,frigate?5.2:4.8,frigate?3.3:3.0,frigate?16:14);
      const masts=type===1?2:3;
      const zs=masts===3?[-5.7,0,5.3]:[-4.0,4.0];
      zs.forEach((z,i)=>addMast(g,z,(frigate?17.8:16.3)-(i===0?1.0:0),frigate?4.9:4.5,true));
      line(g.wood,[0,2.0,-10.5],[0,4.4,-16.0]);
      for(const z of zs){
        line(g.rig,[0,16.0,z],[-4.5,1.8,8.5]);
        line(g.rig,[0,16.0,z],[4.5,1.8,-8.0]);
      }
      addTriSail(g.sail,[0,15.4,zs[0]],[0,3.5,-14.5],[0,4.8,zs[0]],7);
      if(masts===3)addTriSail(g.sail,[0,16.4,zs[1]],[0,15.0,zs[2]],[0,4.8,zs[1]],6);
      // stern/bow detailing
      for(let y=2.2;y<=4.4;y+=.55){
        line(g.accent,[-3.7,y,8.6],[3.7,y,8.6]);
      }
      if(pirate){
        // flag frame
        line(g.rig,[0,16.3,zs[1]],[0,18.1,zs[1]]);
        line(g.sail,[0,18.0,zs[1]],[2.7,17.35,zs[1]]);
        line(g.sail,[2.7,17.35,zs[1]],[0,16.75,zs[1]]);
        line(g.sail,[0,16.75,zs[1]],[0,18.0,zs[1]]);
      }
    }
    return Object.fromEntries(Object.entries(g).map(([k,v])=>[k,new Float32Array(v)]));
  };
  return [make(0),make(1),make(2),make(3)];
}

const THREAD_VS=`#version 300 es
layout(location=0)in vec3 aPosition;
uniform mat4 uViewProj;
uniform vec3 uOffset,uScale,uRotation;
uniform float uTime,uWind,uPhase,uFlutter;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){
  vec3 p=aPosition;
  if(uFlutter>.5){
    float fy=clamp((p.y-1.5)/17.0,0.,1.);
    float wave=sin(p.x*.72+p.y*.37+uTime*(.70+1.6*uWind)+uPhase);
    float wave2=sin(p.x*.31-p.y*.61-uTime*(.48+1.1*uWind)+uPhase*1.7);
    p.z+=(wave*.11+wave2*.055)*(.24+.92*uWind)*(sin(fy*3.14159)*.8+.2);
  }
  p*=uScale;
  p=rz(rx(ry(p,uRotation.y),uRotation.x),uRotation.z);
  gl_Position=uViewProj*vec4(p+uOffset,1.);
}
`;
const THREAD_FS=`#version 300 es
precision highp float;
out vec4 outColor;
uniform vec3 uColor;
uniform float uAlpha,uNight,uStorm,uFog;
void main(){
  vec3 c=uColor;
  c=mix(c,c*vec3(.72,.80,.90)+vec3(.04,.07,.10),uNight*.44);
  c=mix(c,c*vec3(.84,.88,.88),uStorm*.25);
  outColor=vec4(c,uAlpha*(1.0-uFog*.34));
}
`;

function makeCloudSprites(){
  const make=(dark=false,variant=0)=>{
    const c=document.createElement("canvas");c.width=320;c.height=180;const x=c.getContext("2d");
    x.clearRect(0,0,c.width,c.height);
    const rnd=n=>hash1(n*13.17+variant*21.7+(dark?8.2:1.3));
    const base=dark?[70,78,82]:[220,226,222];
    for(let i=0;i<23;i++){
      const px=36+rnd(i*.71)*248,py=48+rnd(i*1.37)*80,rx=26+rnd(i*2.11)*58,ry=13+rnd(i*3.17)*26;
      const g=x.createRadialGradient(px-rx*.18,py-ry*.30,2,px,py,rx);
      const a=.13+rnd(i*5.3)*.18;
      g.addColorStop(0,`rgba(${base[0]+(dark?12:18)},${base[1]+(dark?12:18)},${base[2]+(dark?12:18)},${a})`);
      g.addColorStop(.48,`rgba(${base[0]},${base[1]},${base[2]},${a*.72})`);
      g.addColorStop(1,`rgba(${base[0]-18},${base[1]-18},${base[2]-18},0)`);
      x.fillStyle=g;x.beginPath();x.ellipse(px,py,rx,ry,0,0,TAU);x.fill();
    }
    return c;
  };
  return{
    light:[0,1,2,3].map(i=>make(false,i)),
    dark:[0,1,2,3].map(i=>make(true,i))
  };
}

function atmosphere(){
  const stars=Array.from({length:138},(_,i)=>({
    x:.025+hash1(i*13.71+1.2)*.95,
    y:.025+Math.pow(hash1(i*7.91+4.3),1.28)*.40,
    r:.22+Math.pow(hash1(i*19.17+2.8),2.8)*.88,
    phase:hash1(i*3.27+9.4)*TAU,
    warm:hash1(i*11.8+5.2)
  }));
  const clouds=makeCloudSprites();
  const cloudField=Array.from({length:13},(_,i)=>({
    seed:hash1(i*7.13+2.2),
    side:hash1(i*11.27+4.8)>.5?1:-1,
    speed:.0045+hash1(i*17.31+1.9)*.0065,
    lane:.10+hash1(i*23.71+8.4)*.26,
    variant:i%4
  }));

  return{draw(ctx,time,w,h,c){
    const horizon=h*(c.horizon??.435);

    // Layered smoky clouds travel from the horizon toward the viewer.
    ctx.save();
    for(let i=0;i<(c.proceduralSky?0:cloudField.length);i++){
      const q=cloudField[i],p=(q.seed+time*q.speed*(1+c.wind*.75+c.storm*1.1))%1;
      const depth=Math.pow(p,1.62),fade=Math.min(1,p/.12)*Math.min(1,(1-p)/.20);
      const x=w*.5+q.side*w*(.035+depth*(.42+q.lane*.28))+Math.sin(time*.05+i)*w*.018;
      const y=h*(.39-depth*(.13+q.lane*.22));
      const sc=.20+depth*(1.18+q.lane*.55);
      const sprite=(c.storm>.42?clouds.dark:clouds.light)[q.variant];
      ctx.globalAlpha=fade*(.055+.14*depth)*(.72+.78*c.storm+.22*c.fog);
      ctx.drawImage(sprite,x-160*sc,y-90*sc,320*sc,180*sc);
    }
    ctx.restore();

    if(c.night>.08&&c.storm<.88){
      const a=c.night*(1-c.storm*.92)*(1-c.fog*.55);
      ctx.save();ctx.globalCompositeOperation="screen";
      for(let i=0;i<stars.length;i++){
        const st=stars[i],tw=.84+.16*Math.sin(time*(.28+hash1(i*.91)*.48)+st.phase);
        const r=st.r*(.68+Math.min(w,h)/900);
        ctx.globalAlpha=a*(.20+.58*hash1(i*5.3+2))*tw;
        ctx.fillStyle=st.warm>.84?"#f7e8c7":st.warm>.52?"#d9e8ff":"#eef5ff";
        ctx.beginPath();ctx.arc(st.x*w,st.y*h,r,0,TAU);ctx.fill();
        if(r>.78&&hash1(i*2.37)>.82){
          ctx.globalAlpha*=.34;ctx.lineWidth=.38;
          ctx.beginPath();ctx.moveTo(st.x*w-r*2.0,st.y*h);ctx.lineTo(st.x*w+r*2.0,st.y*h);ctx.moveTo(st.x*w,st.y*h-r*2.0);ctx.lineTo(st.x*w,st.y*h+r*2.0);ctx.strokeStyle=ctx.fillStyle;ctx.stroke();
        }
      }
      ctx.restore();

      const mx=w*.72,my=h*.20,mr=Math.max(7,Math.min(w,h)*.022);
      ctx.save();ctx.globalCompositeOperation="screen";
      const halo=ctx.createRadialGradient(mx,my,mr*.2,mx,my,mr*4.2);halo.addColorStop(0,"rgba(214,229,255,"+(.17*a)+")");halo.addColorStop(1,"rgba(180,210,255,0)");
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(mx,my,mr*4.2,0,TAU);ctx.fill();
      const moon=ctx.createRadialGradient(mx-mr*.25,my-mr*.30,mr*.12,mx,my,mr);
      moon.addColorStop(0,"rgba(250,249,237,.96)");moon.addColorStop(.66,"rgba(210,220,228,.92)");moon.addColorStop(1,"rgba(145,164,184,.82)");
      ctx.globalAlpha=a*.92;ctx.fillStyle=moon;ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();ctx.restore();
    }

    if(c.rain>.035){
      ctx.save();ctx.lineCap="round";
      const layers=[
        {n:24,s:170,a:.032,l:5,w:.30,drift:3},
        {n:38,s:285,a:.060,l:9,w:.44,drift:6},
        {n:48,s:430,a:.092,l:15,w:.60,drift:10}
      ];
      for(let L=0;L<layers.length;L++){
        const q=layers[L],count=Math.round(q.n*(.28+.95*c.rain));
        for(let i=0;i<count;i++){
          const seed=hash1(i*17.7+L*93.1),xx=((seed*w*1.8+time*q.s)%(w+160))-80,yy=((hash1(i*41.3+L)*h*1.7+time*q.s*.80)%(h+120))-60;
          ctx.globalAlpha=q.a*c.rain;ctx.strokeStyle="rgba(202,220,226,.90)";ctx.lineWidth=q.w;
          ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-q.drift*c.wind,yy+q.l);ctx.stroke();
        }
      }
      ctx.strokeStyle="rgba(222,239,239,.52)";
      for(let i=0;i<Math.round(18*c.rain);i++){
        const px=hash1(i*31.7+Math.floor(time*2.0))*w,depth=.18+hash1(i*5.27)*.76,py=horizon+depth*(h-horizon),r=.55+depth*2.7;
        ctx.globalAlpha=.055+.11*c.rain;ctx.lineWidth=.38+depth*.25;ctx.beginPath();ctx.ellipse(px,py,r,r*.20,0,0,TAU);ctx.stroke();
      }
      ctx.restore();
    }

    if(c.storm>.32){
      ctx.save();ctx.fillStyle="rgba(224,238,236,.72)";
      const spray=Math.round(18*c.storm);
      for(let i=0;i<spray;i++){
        const d=.35+hash1(i*4.7+Math.floor(time*.7))*.60,x=hash1(i*9.9+3)*w,y=horizon+d*(h-horizon)*.72;
        ctx.globalAlpha=.025+.08*c.storm;ctx.beginPath();ctx.ellipse(x,y,1+d*2.9,.35+d*.8,-.25,0,TAU);ctx.fill();
      }
      ctx.restore();
    }

    if(c.fog>.05){
      const g=ctx.createLinearGradient(0,h*.28,0,h*.64);g.addColorStop(0,"rgba(211,223,221,0)");g.addColorStop(.46,"rgba(211,223,221,"+(.045+.24*c.fog)+")");g.addColorStop(1,"rgba(211,223,221,0)");
      ctx.fillStyle=g;ctx.fillRect(0,h*.26,w,h*.42);
    }
  }}
}

const SOUND={title:"Звучание Моря странствий",ocean:"audio-library/nature/ocean_waves.ogg",wind:"audio-library/nature/wind_soft.ogg",rain:"audio-library/nature/storm_heavy_rain.ogg",thunder:"audio-library/nature/thunder_claps.ogg"};
function soundscape(){
  const button=document.createElement("button");button.type="button";button.className="icon-btn glass theme-sound-toggle";button.setAttribute("aria-label","Включить звучание Моря странствий");button.setAttribute("aria-pressed","false");button.title="Звучание темы";button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="M16 9c1.7 1.5 1.7 4.5 0 6M18.5 6.8c3.5 3 3.5 7.4 0 10.4"/></svg>';document.querySelector(".top-actions")?.insertBefore(button,document.querySelector("#zen-toggle"));
  const Ctx=window.AudioContext||window.webkitAudioContext;let ac=null,master=null,enabled=false,current={wind:0,rain:0},seq=0,lastThunder=-99;const tracks={},cache=new Map(),root=new URL("../",import.meta.url);
  const load=async p=>{if(cache.has(p))return cache.get(p);const q=(async()=>{const r=await fetch(new URL(p,root),{cache:"force-cache"});if(!r.ok)throw Error("audio");return ac.decodeAudioData(await r.arrayBuffer())})();cache.set(p,q);return q};
  const sync=()=>{button.dataset.enabled=String(enabled);button.setAttribute("aria-pressed",String(enabled))};
  const gain=(k,v)=>{const t=tracks[k];if(!t||!ac)return;const now=ac.currentTime;t.gain.gain.cancelScheduledValues(now);t.gain.gain.setValueAtTime(t.gain.gain.value,now);t.gain.gain.linearRampToValueAtTime(v,now+1)};
  const apply=()=>{if(enabled){gain("ocean",.13+.05*current.wind);gain("wind",.02+.13*current.wind);gain("rain",.15*current.rain)}};
  const start=async()=>{if(!Ctx)return;if(!ac){ac=new Ctx();master=ac.createGain();master.gain.value=.82;master.connect(ac.destination)}enabled=true;const r=++seq;sync();await ac.resume();const all=await Promise.allSettled([SOUND.ocean,SOUND.wind,SOUND.rain,SOUND.thunder].map(load));if(!enabled||r!==seq)return;["ocean","wind","rain"].forEach((k,i)=>{if(all[i].status!=="fulfilled")return;const src=ac.createBufferSource(),g=ac.createGain();src.buffer=all[i].value;src.loop=true;g.gain.value=0;src.connect(g);g.connect(master);src.start();tracks[k]={source:src,gain:g}});if(all[3].status==="fulfilled")tracks.thunderBuffer=all[3].value;apply()};
  const stop=()=>{enabled=false;seq++;sync();for(const k of["ocean","wind","rain"]){try{tracks[k]?.source.stop()}catch{}delete tracks[k]}};
  const setWeather=(c,time)=>{current=c;apply();if(enabled&&c.lightning>.55&&time-lastThunder>9&&tracks.thunderBuffer&&ac){lastThunder=time;const src=ac.createBufferSource(),g=ac.createGain();src.buffer=tracks.thunderBuffer;g.gain.value=.10+.12*c.storm;src.connect(g);g.connect(master);src.start()}};
  button.onclick=()=>enabled?stop():start().catch(stop);return{setWeather,dispose(){stop();button.remove();try{ac?.close()}catch{}}}
}

function fallback(ctx){
  const air=atmosphere(),motion=createSeaMotion();
  const color=(a,b,t)=>a.map((n,i)=>mix(n,b[i],t));
  const rgb=a=>`rgb(${a.map(n=>Math.round(n)).join(",")})`;
  const ships=[{x:.30,z:.045,s:.58},{x:.60,z:.018,s:.39},{x:.79,z:.075,s:.94}];
  function ship(x,y,scale,t,c,index){
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.rotate(Math.sin(t*.69+index)*(.017+.036*c.storm));
    const linen=color(color([224,220,198],[80,104,117],c.night*.75),[123,140,143],c.storm*.62);
    const wood=color([88,53,32],[23,30,35],c.night*.68);
    ctx.fillStyle=rgb(wood);ctx.beginPath();ctx.moveTo(-81,-8);ctx.quadraticCurveTo(-69,27,-45,33);ctx.quadraticCurveTo(8,39,65,23);ctx.lineTo(86,-13);ctx.quadraticCurveTo(7,-3,-81,-8);ctx.fill();
    ctx.fillStyle=rgb(color(wood,[177,129,70],.2));ctx.fillRect(-56,-24,49,19);ctx.fillRect(-64,-38,26,14);
    ctx.strokeStyle=rgb(color(wood,[156,146,115],.36));ctx.lineWidth=3;
    ctx.beginPath();ctx.moveTo(-79,-12);ctx.quadraticCurveTo(-3,-6,84,-16);ctx.moveTo(69,-15);ctx.lineTo(103,-25);ctx.stroke();
    ctx.fillStyle=c.night>.4?"#d9a956":"#57717a";for(let i=0;i<5;i++)ctx.fillRect(-60+i*11,-30,5,6);
    const masts=[{x:-38,h:132,w:44},{x:1,h:175,w:55},{x:40,h:128,w:40}];
    for(let k=0;k<masts.length;k++){
      const m=masts[k];ctx.strokeStyle=rgb(color(wood,[159,144,116],.2));ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(m.x,-9);ctx.lineTo(m.x,-m.h);ctx.stroke();
      for(let j=0;j<3;j++){
        const top=-m.h+21+j*(m.h-46)/3,sw=m.w*(.72+j*.14),sh=(m.h-47)/3;
        const billow=4+Math.sin(t*1.8+k*.9+j*.6)*2+4*c.wind;
        const g=ctx.createLinearGradient(m.x-sw,top,m.x+sw,top+sh);g.addColorStop(0,rgb(color(linen,[79,100,108],.16)));g.addColorStop(.48,rgb(linen));g.addColorStop(1,rgb(color(linen,[95,107,113],.24)));ctx.fillStyle=g;
        ctx.beginPath();ctx.moveTo(m.x-sw,top);ctx.quadraticCurveTo(m.x,top+billow,m.x+sw,top);ctx.quadraticCurveTo(m.x+sw-billow,top+sh*.5,m.x+sw+2,top+sh);ctx.quadraticCurveTo(m.x,top+sh+billow,m.x-sw-2,top+sh);ctx.quadraticCurveTo(m.x-sw+billow,top+sh*.5,m.x-sw,top);ctx.fill();
        ctx.strokeStyle="rgba(73,81,77,.18)";ctx.lineWidth=.6;for(let seam=-2;seam<=2;seam++){ctx.beginPath();ctx.moveTo(m.x+seam*sw/3,top+2);ctx.quadraticCurveTo(m.x+seam*sw/3+billow*.3,top+sh*.5,m.x+seam*sw/3,top+sh-2);ctx.stroke();}
        ctx.strokeStyle=rgb(color(wood,[123,117,100],.25));ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(m.x-sw-5,top);ctx.lineTo(m.x+sw+5,top);ctx.stroke();
      }
      ctx.strokeStyle="rgba(38,51,55,.45)";ctx.lineWidth=.75;ctx.beginPath();ctx.moveTo(m.x,-m.h);ctx.lineTo(-71,-11);ctx.moveTo(m.x,-m.h);ctx.lineTo(76,-15);ctx.stroke();
    }
    ctx.fillStyle=rgb(color(linen,[94,111,119],.17));ctx.beginPath();ctx.moveTo(41,-131);ctx.lineTo(97,-26);ctx.quadraticCurveTo(68,-35,48,-32);ctx.closePath();ctx.fill();
    ctx.fillStyle=c.night>.5?"#43566e":"#69494b";ctx.beginPath();ctx.moveTo(1,-175);ctx.quadraticCurveTo(15,-185,26,-177+Math.sin(t*3)*3);ctx.lineTo(3,-166);ctx.closePath();ctx.fill();ctx.restore();
  }
  return{resize(){},draw({time,width:w,height:h,camera}){
    const c=stateAt(time),pose=motion.step(time,camera,c),cx=pose.input.x;
    const elevation=Math.max(0,pose.eye[1]-6.2-(1.775+3.16*c.storm)*c.wave);
    const horizon=h*(.435-Math.min(.17,elevation*.0018));
    const top=color(color([32,105,157],[7,15,33],c.night),[25,39,48],c.storm*.9);
    const edge=color(color(color([190,212,215],[32,46,63],c.night),[105,111,111],c.storm*.82),[225,149,96],c.sunset*.54);
    const sky=ctx.createLinearGradient(0,0,0,horizon);sky.addColorStop(0,rgb(top));sky.addColorStop(1,rgb(edge));ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    if(c.night<.8&&c.storm<.8){const sx=w*(.70-cx*.025),sy=horizon*(.42+c.sunset*.47),r=Math.min(w,h)*.022;const glow=ctx.createRadialGradient(sx,sy,r*.5,sx,sy,r*11);glow.addColorStop(0,`rgba(255,221,158,${.36*(1-c.night)*(1-c.storm)})`);glow.addColorStop(1,"rgba(255,204,140,0)");ctx.fillStyle=glow;ctx.fillRect(0,0,w,horizon);ctx.fillStyle=`rgba(255,231,179,${.74*(1-c.storm)})`;ctx.beginPath();ctx.arc(sx,sy,r,0,TAU);ctx.fill();}
    const deep=color(color([13,60,77],[3,16,27],c.night),[11,37,44],c.storm*.7);
    const distant=color(color([66,119,135],[14,39,57],c.night),[41,70,77],c.storm*.72);
    const sea=ctx.createLinearGradient(0,horizon,0,h);sea.addColorStop(0,rgb(distant));sea.addColorStop(1,rgb(deep));ctx.fillStyle=sea;ctx.fillRect(0,horizon,w,h-horizon);
    const bands=36;
    for(let i=1;i<=bands;i++){
      const q=i/bands,y=horizon+(h-horizon)*q*q,amp=(1+q*q*19)*(1+c.storm*.67),speed=.55+q*.85;
      const crest=color(color(distant,deep,q*.84),[124,157,158],.055+.055*c.storm);
      const trough=color(crest,[2,22,29],.13+q*.24);
      const grad=ctx.createLinearGradient(0,y-amp,0,y+(h-horizon)*(.019+q*.055));grad.addColorStop(0,rgb(crest));grad.addColorStop(1,rgb(trough));ctx.fillStyle=grad;ctx.beginPath();ctx.moveTo(-12,h+24);
      for(let x=-12;x<=w+24;x+=12){const a=x/w;const wav=Math.sin(a*(6+q*18)+time*speed+i*.63)*.62+Math.sin(a*(11+q*13)-time*.72+i*1.19)*.30+Math.sin(a*24+time*.28)*.08;ctx.lineTo(x,y+wav*amp);}
      ctx.lineTo(w+24,h+24);ctx.closePath();ctx.fill();
    }
    for(const [i,p] of ships.entries()){
      const distance=[290,365,145][i]+pose.eye[2]-pose.routeZ;
      if(distance<18)continue;
      const zoom=([290,365,145][i]+18)/distance;
      const size=Math.min(w,h)*.00185*p.s*zoom,px=w*(.5+(p.x-.5)*zoom-pose.eye[0]/distance*.8),py=horizon+h*p.z*zoom+elevation/distance*h*.7+Math.sin(time*.78+i)*(.7+c.storm*2.4);
      ship(px,py,size,time,c,i);
      const wake=ctx.createLinearGradient(0,py+size*18,0,py+size*48);wake.addColorStop(0,"rgba(30,83,99,0)");wake.addColorStop(1,rgb(color(distant,deep,.14)));ctx.fillStyle=wake;ctx.beginPath();ctx.ellipse(px,py+size*38,size*88,size*14,0,0,TAU);ctx.fill();
    }
    air.draw(ctx,time,w,h,{...c,horizon:horizon/h});
  },dispose(){}};
}

function createRenderer(ctx){
  const src=ctx?.canvas;if(!src||!document.body)return fallback(ctx);
  const canvas=document.createElement("canvas");canvas.className="theme-world-canvas living-sea-world";canvas.setAttribute("aria-hidden","true");Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block",transform:"translateZ(0)",backfaceVisibility:"hidden"});src.parentNode?.insertBefore(canvas,src);
  const style=document.createElement("style");style.textContent='html[data-theme="living-sea"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="living-sea"] .flight-hint{color:#e7f2f2;opacity:.8}';document.head.append(style);
  const sound=soundscape(),fx=atmosphere(),gl=canvas.getContext("webgl2",{alpha:false,antialias:true,depth:true,powerPreference:"high-performance"});
  if(!gl){canvas.remove();const f=fallback(ctx),d=f.dispose;f.dispose=()=>{d?.();style.remove();sound.dispose()};return f}
  let skyP,oceanP,objP,sailP,threadP,underP;try{skyP=program(gl,SKY_VS,SKY_FS);oceanP=program(gl,OCEAN_VS,OCEAN_FS);objP=program(gl,OBJ_VS,OBJ_FS);sailP=program(gl,SAIL_VS,SAIL_FS);threadP=program(gl,THREAD_VS,THREAD_FS);underP=program(gl,SKY_VS,UNDERWATER_FS)}catch(e){console.warn("Living sea renderer unavailable",e.message);canvas.remove();const f=fallback(ctx),d=f.dispose;f.dispose=()=>{d?.();style.remove();sound.dispose()};return f}
  const R=[],keep=x=>{R.push(x);return x},skyVao=keep(gl.createVertexArray()),sb=keep(gl.createBuffer());gl.bindVertexArray(skyVao);gl.bindBuffer(gl.ARRAY_BUFFER,sb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const ocean=oceanGeometry(),oceanVao=keep(gl.createVertexArray());gl.bindVertexArray(oceanVao);const ob=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,ob);gl.bufferData(gl.ARRAY_BUFFER,ocean.vertices,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);const oi=keep(gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,oi);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ocean.indices,gl.STATIC_DRAW);
  const vao=g=>{const v=keep(gl.createVertexArray());gl.bindVertexArray(v);const p=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,g.positions,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);const n=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,g.normals,gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);return{vao:v,count:g.positions.length/3}};
  const M={box:vao(boxGeometry()),mast:vao(prismGeometry()),hull:vao(shipHullGeometry()),deck:vao(shipDeckGeometry()),sail:vao(squareSailGeometry()),jib:vao(sailGeometry())};
  const wireData=shipWireGeometries();
  const wireVao=data=>{const v=keep(gl.createVertexArray());gl.bindVertexArray(v);const b=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);return{vao:v,count:data.length/3}};
  const shipWires=wireData.map(g=>({wood:wireVao(g.wood),deck:wireVao(g.deck),rig:wireVao(g.rig),sail:wireVao(g.sail),accent:wireVao(g.accent)}));
  const railMesh=wireVao(shipRailGeometry());
  gl.bindVertexArray(null);
  const P=new Float32Array(16),V=new Float32Array(16),VP=new Float32Array(16);let W=1,H=1,dead=false;
  const su={time:gl.getUniformLocation(skyP,"uTime"),aspect:gl.getUniformLocation(skyP,"uAspect"),day:gl.getUniformLocation(skyP,"uDay"),sunset:gl.getUniformLocation(skyP,"uSunset"),night:gl.getUniformLocation(skyP,"uNight"),storm:gl.getUniformLocation(skyP,"uStorm"),fog:gl.getUniformLocation(skyP,"uFog"),lightning:gl.getUniformLocation(skyP,"uLightning"),pitch:gl.getUniformLocation(skyP,"uPitch"),yaw:gl.getUniformLocation(skyP,"uYaw")};
  const uu=Object.fromEntries(["time","aspect","depth","night","storm"].map(k=>[k,gl.getUniformLocation(underP,"u"+k[0].toUpperCase()+k.slice(1))]));
  const ou={vp:gl.getUniformLocation(oceanP,"uViewProj"),time:gl.getUniformLocation(oceanP,"uTime"),cameraX:gl.getUniformLocation(oceanP,"uCameraX"),cameraZ:gl.getUniformLocation(oceanP,"uCameraZ"),wave:gl.getUniformLocation(oceanP,"uWave"),camera:gl.getUniformLocation(oceanP,"uCamera"),day:gl.getUniformLocation(oceanP,"uDay"),sunset:gl.getUniformLocation(oceanP,"uSunset"),night:gl.getUniformLocation(oceanP,"uNight"),storm:gl.getUniformLocation(oceanP,"uStorm"),fog:gl.getUniformLocation(oceanP,"uFog"),lightning:gl.getUniformLocation(oceanP,"uLightning")};
  const ju={vp:gl.getUniformLocation(objP,"uViewProj"),offset:gl.getUniformLocation(objP,"uOffset"),scale:gl.getUniformLocation(objP,"uScale"),rotation:gl.getUniformLocation(objP,"uRotation"),color:gl.getUniformLocation(objP,"uColor"),camera:gl.getUniformLocation(objP,"uCamera"),fogColor:gl.getUniformLocation(objP,"uFogColor"),night:gl.getUniformLocation(objP,"uNight"),storm:gl.getUniformLocation(objP,"uStorm"),fog:gl.getUniformLocation(objP,"uFog")};
  const au={vp:gl.getUniformLocation(sailP,"uViewProj"),offset:gl.getUniformLocation(sailP,"uOffset"),scale:gl.getUniformLocation(sailP,"uScale"),rotation:gl.getUniformLocation(sailP,"uRotation"),color:gl.getUniformLocation(sailP,"uColor"),camera:gl.getUniformLocation(sailP,"uCamera"),fogColor:gl.getUniformLocation(sailP,"uFogColor"),night:gl.getUniformLocation(sailP,"uNight"),storm:gl.getUniformLocation(sailP,"uStorm"),fog:gl.getUniformLocation(sailP,"uFog"),time:gl.getUniformLocation(sailP,"uTime"),wind:gl.getUniformLocation(sailP,"uWind"),phase:gl.getUniformLocation(sailP,"uPhase")};
  const lu={vp:gl.getUniformLocation(threadP,"uViewProj"),offset:gl.getUniformLocation(threadP,"uOffset"),scale:gl.getUniformLocation(threadP,"uScale"),rotation:gl.getUniformLocation(threadP,"uRotation"),color:gl.getUniformLocation(threadP,"uColor"),alpha:gl.getUniformLocation(threadP,"uAlpha"),night:gl.getUniformLocation(threadP,"uNight"),storm:gl.getUniformLocation(threadP,"uStorm"),fog:gl.getUniformLocation(threadP,"uFog"),time:gl.getUniformLocation(threadP,"uTime"),wind:gl.getUniformLocation(threadP,"uWind"),phase:gl.getUniformLocation(threadP,"uPhase"),flutter:gl.getUniformLocation(threadP,"uFlutter")};
  function resize({width,height,ratio=1}){W=Math.max(1,width);H=Math.max(1,height);const q=Math.min(ratio,W<=760?1.18:1.55),w=Math.round(W*q),h=Math.round(H*q);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
  const setC=(u,c)=>{gl.uniform1f(u.day,c.day);gl.uniform1f(u.sunset,c.sunset);gl.uniform1f(u.night,c.night);gl.uniform1f(u.storm,c.storm);gl.uniform1f(u.fog,c.fog);gl.uniform1f(u.lightning,c.lightning)};
  function obj(mesh,o,s,r,col,eye,fog,c){gl.useProgram(objP);gl.bindVertexArray(mesh.vao);gl.uniformMatrix4fv(ju.vp,false,VP);gl.uniform3f(ju.offset,...o);gl.uniform3f(ju.scale,...s);gl.uniform3f(ju.rotation,...r);gl.uniform3f(ju.color,...col);gl.uniform3f(ju.camera,...eye);gl.uniform3f(ju.fogColor,...fog);gl.uniform1f(ju.night,c.night);gl.uniform1f(ju.storm,c.storm);gl.uniform1f(ju.fog,c.fog);gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
  function sail(o,s,r,col,eye,fog,c,t,ph,triangular=false){const mesh=triangular?M.jib:M.sail;gl.disable(gl.CULL_FACE);gl.useProgram(sailP);gl.bindVertexArray(mesh.vao);gl.uniformMatrix4fv(au.vp,false,VP);gl.uniform3f(au.offset,...o);gl.uniform3f(au.scale,...s);gl.uniform3f(au.rotation,...r);gl.uniform3f(au.color,...col);gl.uniform3f(au.camera,...eye);gl.uniform3f(au.fogColor,...fog);gl.uniform1f(au.night,c.night);gl.uniform1f(au.storm,c.storm);gl.uniform1f(au.fog,c.fog);gl.uniform1f(au.time,t);gl.uniform1f(au.wind,c.wind);gl.uniform1f(au.phase,ph);gl.drawArrays(gl.TRIANGLES,0,mesh.count);gl.enable(gl.CULL_FACE)}
  function wirePart(mesh,o,scale,rot,color,alpha,c,t,phase,flutter=0){
    if(!mesh||!mesh.count)return;
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    gl.useProgram(threadP);gl.bindVertexArray(mesh.vao);
    gl.uniformMatrix4fv(lu.vp,false,VP);gl.uniform3f(lu.offset,...o);gl.uniform3f(lu.scale,scale,scale,scale);gl.uniform3f(lu.rotation,...rot);
    gl.uniform3f(lu.color,...color);gl.uniform1f(lu.alpha,alpha);gl.uniform1f(lu.night,c.night);gl.uniform1f(lu.storm,c.storm);gl.uniform1f(lu.fog,c.fog);
    gl.uniform1f(lu.time,t);gl.uniform1f(lu.wind,c.wind);gl.uniform1f(lu.phase,phase);gl.uniform1f(lu.flutter,flutter);
    gl.drawArrays(gl.LINES,0,mesh.count);gl.depthMask(true);gl.disable(gl.BLEND);
  }

  function ship(slot,t,camZ,eye,fog,c){
    // A steady fleet rather than ships racing through a loop and respawning.
    const epoch=0,type=slot===0?3:slot===1?1:0;
    const lane=Math.min(1,(W/H)*1.7),phasePath=t*.016+slot*2.1;
    const x=([-11,48,-62][slot]+Math.sin(phasePath)*[8,12,14][slot])*lane;
    const z=camZ-[145,290,365][slot]+Math.cos(phasePath)*[22,35,42][slot];
    const bs=slot===0?1.82:1.56;
    const y=.60+seaHeight(x,z,t,c)*.96;
    const yaw=[-.52,.28,-.22][slot]+Math.sin(phasePath*.7)*.065;
    const roll=clamp(Math.atan((seaHeight(x+5,z,t,c)-seaHeight(x-5,z,t,c))/10),-.15,.15);
    const pitch=clamp(-Math.atan((seaHeight(x,z+11,t,c)-seaHeight(x,z-11,t,c))/22),-.12,.12);
    const rot=[pitch,yaw,roll],g=shipWires[type],phase=epoch*.73+slot*1.7;
    const blackShip=slot===2;

    const hull=blackShip?[.14,.10,.075]:type===1?[.28,.125,.045]:type===2?[.23,.18,.095]:type===3?[.31,.115,.038]:[.25,.095,.032];
    const hullHi=blackShip?[.085,.075,.070]:type===2?[.38,.29,.14]:[.43,.20,.065];
    const deckDark=blackShip?[.105,.085,.065]:type===2?[.30,.23,.13]:[.30,.145,.052];
    const deckMid=blackShip?[.155,.125,.085]:type===2?[.43,.33,.18]:[.46,.245,.085];
    const deckLight=blackShip?[.20,.16,.11]:type===2?[.52,.40,.22]:[.58,.33,.12];
    const mastCol=blackShip?[.12,.095,.070]:[.28,.145,.055];
    const sailCol=blackShip?[.10,.12,.14]:[.965,.955,.900];
    const rigCol=blackShip?[.18,.17,.16]:[.34,.30,.24];
    const flagCol=blackShip?[.015,.015,.018]:(slot%2?[.32,.055,.045]:[.055,.14,.28]);

    const local=(lx,ly,lz)=>{
      let X=lx*bs,Y=ly*bs,Z=lz*bs;
      let c0=Math.cos(yaw),s0=Math.sin(yaw),x1=X*c0+Z*s0,z1=-X*s0+Z*c0;
      let c1=Math.cos(pitch),s1=Math.sin(pitch),y1=Y*c1-z1*s1,z2=Y*s1+z1*c1;
      let c2=Math.cos(roll),s2=Math.sin(roll),x2=x1*c2-y1*s2,y2=x1*s2+y1*c2;
      return[x+x2,y+y2,z+z2];
    };

    // One closed sculpted hull and a deck that follows its real outline.
    obj(M.hull,local(0,-.12,0),[9.4*bs,5.5*bs,22.8*bs],rot,hull,eye,fog,c);
    obj(M.deck,local(0,-.12,0),[9.4*bs,5.5*bs,22.8*bs],rot,deckMid,eye,fog,c);
    wirePart(railMesh,[x,y,z],bs,rot,deckLight,.94,c,t,phase,0);
    // Raised stern deck, quarterdeck and forecastle.
    obj(M.box,local(0,2.42,6.25),[5.6*bs,.92*bs,4.25*bs],rot,deckMid,eye,fog,c);
    obj(M.box,local(0,3.02,6.55),[5.25*bs,.28*bs,3.75*bs],rot,deckLight,eye,fog,c);
    obj(M.box,local(0,2.20,-7.35),[5.15*bs,.40*bs,3.25*bs],rot,deckMid,eye,fog,c);
    if(type!==2){
      obj(M.box,local(0,3.45,7.0),[4.55*bs,1.25*bs,2.95*bs],rot,blackShip?[.075,.065,.060]:[.34,.16,.055],eye,fog,c);
      obj(M.box,local(0,4.16,7.0),[3.45*bs,.30*bs,2.25*bs],rot,deckLight,eye,fog,c);
      for(const lx of[-1.35,-.45,.45,1.35])
        obj(M.box,local(lx,3.45,8.50),[.42*bs,.55*bs,.07*bs],rot,c.night>.4?[1.05,.53,.16]:[.11,.18,.20],eye,fog,c);
    }
    obj(M.mast,local(0,2.65,-11.1),[.16*bs,6.4*bs,.16*bs],[pitch-Math.PI*.40,yaw,roll],mastCol,eye,fog,c);

    const mastSpec=type===2
      ?[{z:1.4,h:11.2,w:3.9}]
      :type===1
        ?[{z:-4.2,h:15.1,w:4.5},{z:4.1,h:16.0,w:4.2}]
        :[{z:-5.8,h:15.6,w:4.5},{z:0,h:17.2,w:4.9},{z:5.35,h:15.9,w:4.35}];

    mastSpec.forEach((m,mi)=>{
      obj(M.mast,local(0,1.8+m.h*.50,m.z),[.25*bs,m.h*bs,.25*bs],rot,mastCol,eye,fog,c);
      // Multiple solid yards.
      const yardData=[[.58,1.00],[.77,.77],[.91,.53]];
      yardData.forEach(([fy,fw])=>{
        obj(M.box,local(0,m.h*fy,m.z),[m.w*2*fw*bs,.18*bs,.18*bs],rot,mastCol,eye,fog,c);
      });

      // White fabric for every normal ship; the one black ship stays black.
      sail(local(0,m.h*.44,m.z-.12),[m.w*1.90*bs,m.h*.28*bs,1],rot,sailCol,eye,fog,c,t,phase+mi*.71);
      if(type!==2){
        sail(local(0,m.h*.69,m.z-.15),[m.w*1.36*bs,m.h*.18*bs,1],rot,sailCol,eye,fog,c,t,phase+mi*.71+1.2);
        sail(local(0,m.h*.86,m.z-.12),[m.w*.86*bs,m.h*.12*bs,1],rot,sailCol,eye,fog,c,t,phase+mi*.71+2.1);
      }

      // Fluttering triangular flag at each main mast top; center mast is largest.
      if(mi===Math.floor(mastSpec.length/2)){
        sail(local(1.05,m.h+1.0,m.z),[2.05*bs,1.08*bs,1],rot,flagCol,eye,fog,c,t,phase+4.2,true);
      }
    });

    // Fore-and-aft sails add volume between masts/bowsprit.
    if(type!==2){
      sail(local(0,7.0,-11.0),[4.2*bs,7.7*bs,1],[pitch,yaw+Math.PI*.5,roll],sailCol,eye,fog,c,t,phase+2.4,true);
      if(mastSpec.length===3)sail(local(0,8.4,2.65),[3.2*bs,6.3*bs,1],[pitch,yaw+Math.PI*.5,roll],sailCol,eye,fog,c,t,phase+3.1,true);
    }

    // Fine linework now serves only as rigging/rail detail, not the body of the ship.
    wirePart(g.wood,[x,y,z],bs,rot,mastCol,0.,c,t,phase,0);
    wirePart(g.deck,[x,y,z],bs,rot,deckLight,0.,c,t,phase,0);
    wirePart(g.rig,[x,y,z],bs,rot,rigCol,.56,c,t,phase,0);
    wirePart(g.sail,[x,y,z],bs,rot,sailCol,0.,c,t,phase,1);
    wirePart(g.accent,[x,y,z],bs,rot,blackShip?[.30,.20,.12]:[.70,.50,.20],.44,c,t,phase,0);
  }

  const motion=createSeaMotion();
  function render(t,camera,c){
    const pose=motion.step(t,camera,c),{eye,target,camZ,routeZ}=pose;
    const cx=pose.input.x;
    perspective(P,.94,W/H,.35,1700);lookAt(V,eye,target,[0,1,0]);multiply(VP,P,V);
    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.useProgram(skyP);gl.bindVertexArray(skyVao);gl.uniform1f(su.time,t);gl.uniform1f(su.aspect,W/H);setC(su,c);gl.uniform1f(su.pitch,(eye[1]-target[1])/Math.max(1,eye[2]-target[2]));gl.uniform1f(su.yaw,(target[0]-eye[0])/148);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.enable(gl.DEPTH_TEST);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(oceanP);gl.bindVertexArray(oceanVao);gl.uniformMatrix4fv(ou.vp,false,VP);gl.uniform1f(ou.time,t);gl.uniform1f(ou.cameraX,eye[0]);gl.uniform1f(ou.cameraZ,camZ);gl.uniform1f(ou.wave,c.wave);gl.uniform3f(ou.camera,...eye);setC(ou,c);gl.drawElements(gl.TRIANGLES,ocean.indices.length,gl.UNSIGNED_INT,0);
    const fog=[mix(.73,.22,c.storm),mix(.81,.27,c.storm),mix(.82,.28,c.storm)];fog[0]=mix(fog[0],.09,c.night);fog[1]=mix(fog[1],.13,c.night);fog[2]=mix(fog[2],.19,c.night);gl.enable(gl.CULL_FACE);ship(0,t,routeZ,eye,fog,c);ship(1,t,routeZ,eye,fog,c);ship(2,t,routeZ,eye,fog,c);gl.disable(gl.CULL_FACE);
    gl.bindVertexArray(null);
  }
  return{resize,draw({time,width,height,camera}){if(dead)return;if(width!==W||height!==H)resize({width,height,ratio:devicePixelRatio||1});const c=stateAt(time);render(time,camera,c);fx.draw(ctx,time,width,height,{...c,proceduralSky:true});sound.setWeather(c,time)},dispose(){dead=true;canvas.remove();style.remove();sound.dispose();try{for(const p of[skyP,oceanP,objP,sailP,threadP,underP])gl.deleteProgram(p);for(const r of R){if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);else gl.deleteBuffer(r)}}catch{}}}
}

export default{id:"living-sea",renderer:"webgl-living-sea-v12",particles:false,marks:true,flightCards:true,autoFlightCards:true,continuousDepth:true,cameraSmoothing:4.2,gesturePanScale:360,depthDirectScale:.65,depthGain:.44,depthCap:1.5,depthDamping:4,flightBounds:{x:60,y:10,z:60},accent:"#bcdde5",dim:"#c7d9dd",surface:"12,27,38",panel:{bg:"rgba(14,35,47,.54)",border:"rgba(190,224,230,.26)",glow:"rgba(83,174,194,.17)",text:"#f2fbfc",muted:"#c6dce0"},radius:"28px",buttonRadius:"28px",heading:'"Cormorant Garamond", Georgia, serif',body:'"Nunito", system-ui, sans-serif',colors:["#d9eff2","#8fc1ce","#f1c48d","#9eb6c6"],backgrounds:["radial-gradient(ellipse at 72% 18%,rgba(180,220,228,.24),transparent 45%),radial-gradient(ellipse at 28% 8%,rgba(73,124,153,.26),transparent 58%)","radial-gradient(ellipse at 60% 35%,rgba(134,182,193,.12),transparent 55%)","linear-gradient(to bottom,rgba(41,83,105,.14),rgba(6,19,28,.44))"],soundscape:SOUND,createRenderer};
