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
  const span=12.5,raw=time/span,i=Math.floor(raw)%STATES.length,j=(i+1)%STATES.length,t=smooth(raw-Math.floor(raw)),a=STATES[i],b=STATES[j],o={};
  for(const k of Object.keys(a))o[k]=mix(a[k],b[k],t);
  const pulse=Math.max(0,Math.sin(time*.66+Math.sin(time*.17)*2));o.lightning=o.storm*Math.pow(pulse,38);o.wave=.40+.30*o.wind+.74*o.storm;return o
}

const SKY_VS=`#version 300 es
in vec2 aPosition;out vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}
`;
const SKY_FS=`#version 300 es
precision highp float;in vec2 vUv;out vec4 outColor;uniform float uTime,uAspect,uDay,uSunset,uNight,uStorm,uFog,uLightning;
float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float cw(vec2 p){float v=sin(p.x*.9+sin(p.y*.7)*1.1);v+=sin(p.y*1.2-cos(p.x*.62)*1.0)*.68;v+=sin((p.x+p.y)*1.78)*.31;return .5+.5*(v/1.99);}
float cloud(vec2 p){float a=cw(p),b=cw(vec2(p.x*.82-p.y*.57,p.x*.57+p.y*.82)*1.71+vec2(2.4,5.0)),c=cw(vec2(p.x*.94+p.y*.34,-p.x*.34+p.y*.94)*2.8+vec2(-3.6,1.6));return a*.58+b*.29+c*.13;}
void main(){
  vec2 uv=vUv;float horizon=.435;
  vec3 top=mix(vec3(.12,.40,.70),vec3(.13,.18,.31),uSunset);top=mix(top,vec3(.008,.018,.060),uNight);top=mix(top,vec3(.04,.055,.064),uStorm*.95);
  vec3 mid=mix(vec3(.52,.73,.86),vec3(.61,.34,.35),uSunset);mid=mix(mid,vec3(.035,.055,.12),uNight);mid=mix(mid,vec3(.14,.16,.17),uStorm*.94);
  vec3 haze=mix(vec3(.83,.90,.90),vec3(.98,.58,.29),uSunset);haze=mix(haze,vec3(.12,.17,.23),uNight);haze=mix(haze,vec3(.27,.30,.29),uStorm*.92);
  vec3 col=mix(haze,mix(mid,top,smoothstep(.58,1.,uv.y)),smoothstep(horizon,1.,uv.y));

  float sunY=mix(.67,.49,uSunset),sun=exp(-pow((uv.x-.72)*5.6,2.)-pow((uv.y-sunY)*13.5,2.));
  col+=vec3(1.,.80,.45)*sun*(.88*uDay+.72*uSunset)*(1.-uNight)*(1.-uStorm*.94);

  // Moon and stars move to the atmospheric particle layer.
  vec2 p=vec2((uv.x-.5)*uAspect*3.2,uv.y*3.2)+vec2(uTime*.0055*(1.+uStorm*1.7),-uTime*.0015);
  float c1=cloud(p),c2=cloud(p*.61+vec2(3.2,-1.4)),c3=cloud(p*1.22+vec2(-4.2,3.1));
  float d1=smoothstep(.49-uStorm*.06,.68-uStorm*.04,c1)*smoothstep(.39,.46,uv.y)*(1.-smoothstep(.73,.83,uv.y));
  float d2=smoothstep(.53,.70,c2)*smoothstep(.49,.56,uv.y)*(1.-smoothstep(.87,.96,uv.y));
  float d3=smoothstep(.57,.72,c3)*smoothstep(.64,.72,uv.y)*(1.-smoothstep(.96,1.,uv.y));
  vec3 sh=mix(vec3(.45,.51,.54),vec3(.10,.12,.13),uStorm),body=mix(vec3(.84,.86,.84),vec3(.28,.30,.30),uStorm),light=mix(vec3(.98,.94,.84),vec3(.45,.46,.43),uStorm);
  vec3 cc=mix(sh,body,smoothstep(.47,.67,c1));cc=mix(cc,light,smoothstep(.61,.74,c1)*(.35+.18*uSunset));
  col=mix(col,cc,d1*(.40+.48*uStorm+.18*uFog));col=mix(col,mix(body,light,.55),d2*(.17+.25*uStorm));col=mix(col,body,d3*(.08+.14*uStorm));
  col=mix(col,haze,exp(-pow((uv.y-horizon)*28.,2.))*(.22+.60*uFog));col+=vec3(1.,.98,.92)*uLightning*.78;
  outColor=vec4(col,1.);
}
`;

function oceanGeometry(cols=82,rows=138){
  const v=[],idx=[],x0=-300,x1=300,z0=85,z1=-1250;
  for(let r=0;r<=rows;r++){const q=r/rows,z=mix(z0,z1,q);for(let c=0;c<=cols;c++)v.push(mix(x0,x1,c/cols),z)}
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){const a=r*(cols+1)+c,b=a+1,d=(r+1)*(cols+1)+c,e=d+1;idx.push(a,d,b,b,d,e)}
  return{vertices:new Float32Array(v),indices:new Uint32Array(idx)}
}
const OCEAN_VS=`#version 300 es
layout(location=0) in vec2 aPosition;uniform mat4 uViewProj;uniform float uTime,uCameraZ,uWave;out vec3 vWorld;out float vCrest;
void W(inout vec3 p,vec2 d,float amp,float freq,float speed,float steep){d=normalize(d);float ph=dot(d,p.xz)*freq+uTime*speed,a=amp*uWave;p.xz+=d*(steep*a*cos(ph));p.y+=a*sin(ph);}
void main(){vec3 p=vec3(aPosition.x,0.,aPosition.y+uCameraZ);W(p,vec2(1.,.28),.56,.030,.72,.34);W(p,vec2(.34,1.),.38,.052,-.94,.27);W(p,vec2(-.72,.44),.23,.089,1.31,.19);W(p,vec2(.91,-.40),.11,.151,-1.74,.12);W(p,vec2(-.18,.98),.055,.235,2.18,.07);vWorld=p;vCrest=p.y;gl_Position=uViewProj*vec4(p,1.);}
`;
const OCEAN_FS=`#version 300 es
precision highp float;in vec3 vWorld;in float vCrest;out vec4 outColor;uniform vec3 uCamera;uniform float uTime,uDay,uSunset,uNight,uStorm,uFog,uLightning,uWave;
void main(){
  vec3 n=normalize(cross(dFdx(vWorld),dFdy(vWorld)));if(n.y<0.)n=-n;vec3 V=normalize(uCamera-vWorld),L=normalize(vec3(-.53,.82,.28));
  float fres=pow(1.-max(dot(n,V),0.),3.),spec=pow(max(dot(reflect(-L,n),V),0.),mix(108.,30.,uStorm)),micro=.5+.5*sin(vWorld.x*.26+vWorld.z*.21-uTime*2.15);
  float filament=.5+.5*sin(vWorld.x*.095-vWorld.z*.155+uTime*.62);
  vec3 deep=mix(vec3(.018,.13,.20),vec3(.075,.095,.16),uSunset);deep=mix(deep,vec3(.005,.018,.045),uNight);deep=mix(deep,vec3(.016,.052,.058),uStorm);
  vec3 sky=mix(vec3(.27,.55,.68),vec3(.56,.31,.24),uSunset);sky=mix(sky,vec3(.045,.085,.15),uNight);sky=mix(sky,vec3(.14,.20,.20),uStorm);
  vec3 col=mix(deep,sky,.16+.60*fres+.05*micro);col+=sky*pow(filament,12.)*(.018+.030*fres);col+=vec3(1.,.74,.43)*spec*(.36+.55*uDay+.36*uSunset)*(1.-uNight*.72);col+=vec3(.46,.60,.82)*spec*uNight*.18;
  float foam=smoothstep(.34*uWave,.78*uWave,vCrest)*(.10+.26*uStorm)*(.35+.65*micro);col=mix(col,vec3(.86,.94,.92),foam);
  float f=smoothstep(170.,830.,distance(vWorld,uCamera));vec3 haze=mix(vec3(.72,.81,.83),vec3(.23,.27,.28),uStorm);haze=mix(haze,vec3(.09,.13,.19),uNight);col=mix(col,haze,f*(.54+.38*uFog));col+=vec3(1.)*uLightning*.34;
  outColor=vec4(col,1.);
}
`;

function boxGeometry(){const p=[],n=[],F=[[[-.5,-.5,.5],[.5,-.5,.5],[.5,.5,.5],[-.5,.5,.5],[0,0,1]],[[.5,-.5,-.5],[-.5,-.5,-.5],[-.5,.5,-.5],[.5,.5,-.5],[0,0,-1]],[[ -.5,-.5,-.5],[-.5,-.5,.5],[-.5,.5,.5],[-.5,.5,-.5],[-1,0,0]],[[.5,-.5,.5],[.5,-.5,-.5],[.5,.5,-.5],[.5,.5,.5],[1,0,0]],[[-.5,.5,.5],[.5,.5,.5],[.5,.5,-.5],[-.5,.5,-.5],[0,1,0]],[[-.5,-.5,-.5],[.5,-.5,-.5],[.5,-.5,.5],[-.5,-.5,.5],[0,-1,0]]];for(const f of F){const[a,b,c,d,no]=f;for(const v of[a,b,c,a,c,d]){p.push(...v);n.push(...no)}}return{positions:new Float32Array(p),normals:new Float32Array(n)}}
function prismGeometry(sides=10){const p=[],n=[];for(let i=0;i<sides;i++){const a=i/sides*TAU,b=(i+1)/sides*TAU,ax=Math.cos(a)*.5,az=Math.sin(a)*.5,bx=Math.cos(b)*.5,bz=Math.sin(b)*.5,nx=Math.cos((a+b)*.5),nz=Math.sin((a+b)*.5);p.push(ax,-.5,az,bx,-.5,bz,bx,.5,bz,ax,-.5,az,bx,.5,bz,ax,.5,az);for(let k=0;k<6;k++)n.push(nx,0,nz)}return{positions:new Float32Array(p),normals:new Float32Array(n)}}
function hullGeometry(){const p=[],n=[],A=[-.52,.31,.48],B=[.52,.31,.48],C=[.38,.28,-.25],D=[0,.20,-.55],a=[-.33,-.34,.38],b=[.33,-.34,.38],c=[.20,-.33,-.24],d=[0,-.31,-.46],add=(x,y,z,no)=>{for(const v of[x,y,z]){p.push(...v);n.push(...no)}};add(A,B,C,[0,.36,.93]);add(A,C,D,[0,.45,.86]);add(a,c,b,[0,-1,0]);add(a,d,c,[0,-1,0]);add(A,a,B,[0,0,1]);add(a,b,B,[0,0,1]);add(B,b,C,[.88,.10,.34]);add(b,c,C,[.88,.10,.34]);add(C,c,D,[.64,.08,-.76]);add(c,d,D,[.64,.08,-.76]);add(D,d,A,[-.64,.08,-.76]);add(d,a,A,[-.64,.08,-.76]);add(A,D,C,[0,1,0]);add(A,C,B,[0,1,0]);return{positions:new Float32Array(p),normals:new Float32Array(n)}}
function sailGeometry(rows=10){const p=[],n=[];for(let r=0;r<rows;r++)for(let c=0;c<=r;c++){const y0=-.5+r/rows,y1=-.5+(r+1)/rows,h0=(1-r/rows)*.5,h1=(1-(r+1)/rows)*.5,x00=r===0?0:mix(-h0,h0,c/r),x10=mix(-h1,h1,c/(r+1)),x11=mix(-h1,h1,(c+1)/(r+1)),a=[x00,y0,0],b=[x10,y1,0],cc=[x11,y1,0];for(const v of[a,b,cc]){p.push(...v);n.push(0,0,1)}if(c<r){const x01=mix(-h0,h0,(c+1)/r),d=[x01,y0,0];for(const v of[a,cc,d]){p.push(...v);n.push(0,0,1)}}}const copy=[...p];for(let i=copy.length-3;i>=0;i-=3){p.push(copy[i],copy[i+1],copy[i+2]);n.push(0,0,-1)}return{positions:new Float32Array(p),normals:new Float32Array(n)}}

const OBJ_VS=`#version 300 es
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;uniform mat4 uViewProj;uniform vec3 uOffset,uScale,uRotation;out vec3 vNormal,vWorld;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){vec3 p=aPosition*uScale;p=rz(rx(ry(p,uRotation.y),uRotation.x),uRotation.z);vec3 n=normalize(rz(rx(ry(aNormal,uRotation.y),uRotation.x),uRotation.z));vWorld=p+uOffset;vNormal=n;gl_Position=uViewProj*vec4(vWorld,1.);}
`;
const OBJ_FS=`#version 300 es
precision highp float;in vec3 vNormal,vWorld;out vec4 outColor;uniform vec3 uColor,uCamera,uFogColor;uniform float uNight,uStorm,uFog;
void main(){vec3 n=normalize(vNormal),L=normalize(vec3(-.48,.82,.28));float d=max(dot(n,L),0.),rim=pow(1.-max(dot(n,normalize(uCamera-vWorld)),0.),2.2);vec3 col=uColor*(.24+.48*d)+vec3(.14,.22,.24)*rim*.34;col*=mix(1.,.62,uNight);col*=mix(1.,.76,uStorm);float f=smoothstep(145.,690.,distance(vWorld,uCamera))*(.48+.40*uFog);col=mix(col,uFogColor,clamp(f,0.,.95));outColor=vec4(col,1.);}
`;
const SAIL_VS=`#version 300 es
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;uniform mat4 uViewProj;uniform vec3 uOffset,uScale,uRotation;uniform float uTime,uWind,uPhase;out vec3 vNormal,vWorld;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){vec3 p=aPosition;float fy=clamp(p.y+.5,0.,1.),bulge=sin(fy*3.14159);p.z+=(sin((p.x+fy)*5.2+uTime*1.65+uPhase)*.035+bulge*.11)*(.30+.70*uWind);p.x+=sin(uTime*.77+uPhase+fy*2.4)*.018*uWind;p*=uScale;p=rz(rx(ry(p,uRotation.y),uRotation.x),uRotation.z);vec3 n=normalize(rz(rx(ry(aNormal,uRotation.y),uRotation.x),uRotation.z));vWorld=p+uOffset;vNormal=n;gl_Position=uViewProj*vec4(vWorld,1.);}
`;
const SAIL_FS=`#version 300 es
precision highp float;in vec3 vNormal,vWorld;out vec4 outColor;uniform vec3 uColor,uCamera,uFogColor;uniform float uNight,uStorm,uFog;
void main(){vec3 n=normalize(vNormal),L=normalize(vec3(-.48,.82,.28));float d=.48+.42*max(dot(n,L),0.);float rim=pow(1.-max(dot(n,normalize(uCamera-vWorld)),0.),2.);vec3 col=uColor*d+vec3(.16,.20,.20)*rim*.14;col*=mix(1.,.68,uNight);col*=mix(1.,.83,uStorm);float f=smoothstep(150.,690.,distance(vWorld,uCamera))*(.44+.42*uFog);col=mix(col,uFogColor,clamp(f,0.,.94));outColor=vec4(col,1.);}
`;


function shipThreadGeometry(){
  const p=[],L=(a,b)=>p.push(...a,...b);
  L([-4.7,1.8,8.5],[4.7,1.8,8.5]);L([4.7,1.8,8.5],[3.5,.2,-7.5]);L([3.5,.2,-7.5],[0,-1.1,-10.2]);
  L([0,-1.1,-10.2],[-3.5,.2,-7.5]);L([-3.5,.2,-7.5],[-4.7,1.8,8.5]);L([-4.2,2.45,7.4],[4.2,2.45,7.4]);
  for(const z of [-5,0,5])L([-3.9,2.45,z],[3.9,2.45,z]);
  const mastZ=[-5,0,5];
  for(let i=0;i<mastZ.length;i++){
    const z=mastZ[i],top=i===1?17.0:15.6;
    L([0,2.2,z],[0,top,z]);L([-4.4,9.8,z],[4.4,9.8,z]);L([-3.4,13.0,z],[3.4,13.0,z]);
    L([-4.0,9.6,z],[0,4.2,z]);L([0,4.2,z],[4.0,9.6,z]);L([-4.0,9.6,z],[4.0,9.6,z]);
    L([-3.1,12.8,z],[0,9.9,z]);L([0,9.9,z],[3.1,12.8,z]);L([-3.1,12.8,z],[3.1,12.8,z]);
    L([0,top,z],[-4.1,2.45,z+5.2]);L([0,top,z],[4.1,2.45,z-5.2]);
  }
  L([0,16.8,0],[0,15.2,-5]);L([0,16.8,0],[0,15.2,5]);L([0,15.2,-5],[0,15.2,5]);
  L([0,15.2,-5],[-4.2,2.45,8]);L([0,15.2,5],[4.2,2.45,-8]);
  L([0,3.0,-8.5],[0,5.0,-14.0]);L([0,5.0,-14.0],[0,15.6,-5]);L([0,5.0,-14.0],[0,17.0,0]);
  return new Float32Array(p);
}

const THREAD_VS=\`#version 300 es
layout(location=0)in vec3 aPosition;uniform mat4 uViewProj;uniform vec3 uOffset,uScale,uRotation;
vec3 rx(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x,p.y*c-p.z*s,p.y*s+p.z*c);}
vec3 ry(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c+p.z*s,p.y,-p.x*s+p.z*c);}
vec3 rz(vec3 p,float a){float c=cos(a),s=sin(a);return vec3(p.x*c-p.y*s,p.x*s+p.y*c,p.z);}
void main(){vec3 p=aPosition*uScale;p=rz(rx(ry(p,uRotation.y),uRotation.x),uRotation.z);gl_Position=uViewProj*vec4(p+uOffset,1.);}
\`;
const THREAD_FS=\`#version 300 es
precision highp float;out vec4 outColor;uniform vec3 uColor;uniform float uAlpha,uNight,uStorm,uFog;
void main(){vec3 c=mix(uColor,vec3(.72,.88,1.0),uNight*.58);c=mix(c,vec3(.78,.86,.84),uStorm*.42);outColor=vec4(c,uAlpha*(1.0-uFog*.38));}
\`;

function atmosphere(){
  const stars=Array.from({length:92},(_,i)=>({
    x:.035+hash1(i*13.71+1.2)*.93,
    y:.035+Math.pow(hash1(i*7.91+4.3),1.34)*.42,
    r:.35+hash1(i*19.17+2.8)*1.45,
    phase:hash1(i*3.27+9.4)*TAU,
    warm:hash1(i*11.8+5.2)
  }));
  const starSprites=[0,1,2].map(k=>{
    const c=document.createElement("canvas");c.width=c.height=40;const x=c.getContext("2d");
    const g=x.createRadialGradient(20,20,0,20,20,18);
    g.addColorStop(0,k===2?"rgba(255,235,190,1)":"rgba(225,240,255,1)");
    g.addColorStop(.18,k===1?"rgba(190,220,255,.78)":"rgba(225,235,255,.70)");
    g.addColorStop(1,"rgba(180,215,255,0)");x.fillStyle=g;x.fillRect(0,0,40,40);return c
  });
  return{draw(ctx,time,w,h,c){
    const horizon=h*.435;
    if(c.night>.08&&c.storm<.88){
      const a=c.night*(1-c.storm*.92)*(1-c.fog*.50);
      ctx.save();ctx.globalCompositeOperation="screen";
      for(let i=0;i<stars.length;i++){
        const s=stars[i],tw=.78+.22*Math.sin(time*(.45+hash1(i*.91)*.65)+s.phase),size=1.1+s.r*1.25;
        ctx.globalAlpha=a*(.18+.52*hash1(i*5.3+2))*tw;
        const sprite=starSprites[s.warm>.82?2:s.warm>.48?1:0];
        ctx.drawImage(sprite,s.x*w-size*3,s.y*h-size*3,size*6,size*6);
      }
      const milky=ctx.createLinearGradient(0,h*.03,w*.74,h*.40);
      milky.addColorStop(0,"rgba(140,175,220,0)");
      milky.addColorStop(.47,"rgba(135,165,215,"+(.018*a)+")");
      milky.addColorStop(.60,"rgba(180,194,230,"+(.035*a)+")");
      milky.addColorStop(1,"rgba(140,175,220,0)");
      ctx.fillStyle=milky;ctx.fillRect(0,0,w,h*.48);ctx.restore();

      const mx=w*.72,my=h*.21,mr=Math.max(10,Math.min(w,h)*.026);
      ctx.save();ctx.globalCompositeOperation="screen";
      const halo=ctx.createRadialGradient(mx,my,mr*.2,mx,my,mr*4.8);halo.addColorStop(0,"rgba(214,229,255,"+(.22*a)+")");halo.addColorStop(1,"rgba(180,210,255,0)");
      ctx.fillStyle=halo;ctx.beginPath();ctx.arc(mx,my,mr*4.8,0,TAU);ctx.fill();
      const moon=ctx.createRadialGradient(mx-mr*.25,my-mr*.30,mr*.12,mx,my,mr);
      moon.addColorStop(0,"rgba(249,248,233,.96)");moon.addColorStop(.62,"rgba(210,220,228,.92)");moon.addColorStop(1,"rgba(155,173,190,.84)");
      ctx.globalAlpha=a*.92;ctx.fillStyle=moon;ctx.beginPath();ctx.arc(mx,my,mr,0,TAU);ctx.fill();
      ctx.globalAlpha=a*.10;ctx.fillStyle="#718397";
      for(const q of [[-.25,-.10,.18],[.18,.20,.13],[.28,-.25,.09],[-.10,.32,.11]]){ctx.beginPath();ctx.arc(mx+q[0]*mr,my+q[1]*mr,q[2]*mr,0,TAU);ctx.fill()}
      ctx.restore();
    }

    ctx.save();ctx.globalCompositeOperation="screen";ctx.lineCap="round";
    const baseR=mix(130,205,c.sunset),baseG=mix(205,176,c.sunset),baseB=mix(220,125,c.sunset);
    for(let j=0;j<24;j++){
      const d=(j+1)/24,y=horizon+Math.pow(d,1.58)*(h-horizon)*.88,amp=(.6+d*4.8)*(1+c.storm*1.1),freq=.026+d*.024;
      const alpha=(.020+d*.070)*(1-c.fog*.55)*(1+c.night*.35);
      ctx.strokeStyle="rgba("+Math.round(baseR)+","+Math.round(baseG)+","+Math.round(baseB)+","+alpha+")";
      ctx.lineWidth=.45+d*.75;ctx.beginPath();
      for(let x=-18;x<=w+18;x+=10){
        const yy=y+Math.sin(x*freq+time*(.42+.28*d)+j*.61)*amp+Math.sin(x*.011-time*.25+j)*amp*.42;
        x<0?ctx.moveTo(x,yy):ctx.lineTo(x,yy)
      }
      ctx.stroke();
    }
    for(let i=0;i<34;i++){
      const d=.52+hash1(i*4.91)*.46,x=hash1(i*11.73+2.1)*w,y=horizon+Math.pow(d,1.58)*(h-horizon)*.86+Math.sin(x*.04+time*.7+i)*3*d;
      ctx.globalAlpha=(.035+.08*d)*(1-c.storm*.35);ctx.fillStyle=c.night>.45?"#9fc8e8":"#d9edf0";ctx.beginPath();ctx.arc(x,y,.45+1.2*d,0,TAU);ctx.fill()
    }
    ctx.restore();

    if(c.rain>.035){
      ctx.save();ctx.lineCap="round";const layers=[{n:34,s:190,a:.06,l:7,w:.45},{n:44,s:300,a:.095,l:13,w:.64},{n:38,s:460,a:.14,l:21,w:.86}];
      for(let L=0;L<layers.length;L++){
        const q=layers[L],count=Math.round(q.n*(.35+.90*c.rain));
        for(let i=0;i<count;i++){
          const seed=hash1(i*17.7+L*93.1),xx=((seed*w*1.7+time*q.s)%(w+140))-70,yy=((hash1(i*41.3+L)*h*1.6+time*q.s*.76)%(h+100))-50;
          ctx.globalAlpha=q.a*c.rain;ctx.strokeStyle="rgba(200,221,229,.96)";ctx.lineWidth=q.w;ctx.beginPath();ctx.moveTo(xx,yy);ctx.lineTo(xx-2-c.wind*(4+L*4),yy+q.l);ctx.stroke()
        }
      }
      ctx.strokeStyle="rgba(222,239,239,.62)";
      for(let i=0;i<Math.round(18*c.rain);i++){
        const px=hash1(i*31.7+Math.floor(time*2.2))*w,depth=.14+hash1(i*5.27)*.78,py=horizon+depth*(h-horizon),r=.8+depth*4;
        ctx.globalAlpha=.08+.16*c.rain;ctx.lineWidth=.5+depth*.35;ctx.beginPath();ctx.ellipse(px,py,r,r*.22,0,0,TAU);ctx.stroke()
      }
      ctx.restore();
    }
    if(c.fog>.05){
      const g=ctx.createLinearGradient(0,h*.28,0,h*.64);g.addColorStop(0,"rgba(211,223,221,0)");g.addColorStop(.46,"rgba(211,223,221,"+(.045+.24*c.fog)+")");g.addColorStop(1,"rgba(211,223,221,0)");
      ctx.fillStyle=g;ctx.fillRect(0,h*.26,w,h*.42)
    }
  }}
}

const SOUND=const SOUND={title:"Звучание Моря странствий",ocean:"audio-library/nature/ocean_waves.ogg",wind:"audio-library/nature/wind_soft.ogg",rain:"audio-library/nature/storm_heavy_rain.ogg",thunder:"audio-library/nature/thunder_claps.ogg"};
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

function fallback(ctx){return{resize(){},draw({time,width,height}){const c=stateAt(time),h=height*.44,g=ctx.createLinearGradient(0,0,0,h);g.addColorStop(0,c.night>.5?"#071226":"#2e6c9c");g.addColorStop(1,c.storm>.5?"#50595a":"#bdd2d6");ctx.fillStyle=g;ctx.fillRect(0,0,width,h);const s=ctx.createLinearGradient(0,h,0,height);s.addColorStop(0,"#477f8d");s.addColorStop(1,"#082b3c");ctx.fillStyle=s;ctx.fillRect(0,h,width,height-h)},dispose(){}}}

function createRenderer(ctx){
  const src=ctx?.canvas;if(!src||!document.body)return fallback(ctx);
  const canvas=document.createElement("canvas");canvas.className="theme-world-canvas living-sea-world";canvas.setAttribute("aria-hidden","true");Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block",transform:"translateZ(0)",backfaceVisibility:"hidden"});src.parentNode?.insertBefore(canvas,src);
  const style=document.createElement("style");style.textContent='html[data-theme="living-sea"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="living-sea"] .flight-hint{color:#e7f2f2;opacity:.8}';document.head.append(style);
  const sound=soundscape(),fx=atmosphere(),gl=canvas.getContext("webgl2",{alpha:false,antialias:true,depth:true,powerPreference:"high-performance"});
  if(!gl){canvas.remove();const f=fallback(ctx),d=f.dispose;f.dispose=()=>{d?.();style.remove();sound.dispose()};return f}
  let skyP,oceanP,objP,sailP,threadP;try{skyP=program(gl,SKY_VS,SKY_FS);oceanP=program(gl,OCEAN_VS,OCEAN_FS);objP=program(gl,OBJ_VS,OBJ_FS);sailP=program(gl,SAIL_VS,SAIL_FS);threadP=program(gl,THREAD_VS,THREAD_FS)}catch(e){canvas.remove();const f=fallback(ctx),d=f.dispose;f.dispose=()=>{d?.();style.remove();sound.dispose()};return f}
  const R=[],keep=x=>{R.push(x);return x},skyVao=keep(gl.createVertexArray()),sb=keep(gl.createBuffer());gl.bindVertexArray(skyVao);gl.bindBuffer(gl.ARRAY_BUFFER,sb);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const ocean=oceanGeometry(),oceanVao=keep(gl.createVertexArray());gl.bindVertexArray(oceanVao);const ob=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,ob);gl.bufferData(gl.ARRAY_BUFFER,ocean.vertices,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);const oi=keep(gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,oi);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,ocean.indices,gl.STATIC_DRAW);
  const vao=g=>{const v=keep(gl.createVertexArray());gl.bindVertexArray(v);const p=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,p);gl.bufferData(gl.ARRAY_BUFFER,g.positions,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);const n=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,n);gl.bufferData(gl.ARRAY_BUFFER,g.normals,gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);return{vao:v,count:g.positions.length/3}};
  const M={box:vao(boxGeometry()),mast:vao(prismGeometry()),hull:vao(hullGeometry()),sail:vao(sailGeometry())};
  const threadVerts=shipThreadGeometry(),threadVao=keep(gl.createVertexArray());gl.bindVertexArray(threadVao);const threadBuf=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,threadBuf);gl.bufferData(gl.ARRAY_BUFFER,threadVerts,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);gl.bindVertexArray(null);
  const P=new Float32Array(16),V=new Float32Array(16),VP=new Float32Array(16);let W=1,H=1,dead=false;
  const su={time:gl.getUniformLocation(skyP,"uTime"),aspect:gl.getUniformLocation(skyP,"uAspect"),day:gl.getUniformLocation(skyP,"uDay"),sunset:gl.getUniformLocation(skyP,"uSunset"),night:gl.getUniformLocation(skyP,"uNight"),storm:gl.getUniformLocation(skyP,"uStorm"),fog:gl.getUniformLocation(skyP,"uFog"),lightning:gl.getUniformLocation(skyP,"uLightning")};
  const ou={vp:gl.getUniformLocation(oceanP,"uViewProj"),time:gl.getUniformLocation(oceanP,"uTime"),cameraZ:gl.getUniformLocation(oceanP,"uCameraZ"),wave:gl.getUniformLocation(oceanP,"uWave"),camera:gl.getUniformLocation(oceanP,"uCamera"),day:gl.getUniformLocation(oceanP,"uDay"),sunset:gl.getUniformLocation(oceanP,"uSunset"),night:gl.getUniformLocation(oceanP,"uNight"),storm:gl.getUniformLocation(oceanP,"uStorm"),fog:gl.getUniformLocation(oceanP,"uFog"),lightning:gl.getUniformLocation(oceanP,"uLightning")};
  const ju={vp:gl.getUniformLocation(objP,"uViewProj"),offset:gl.getUniformLocation(objP,"uOffset"),scale:gl.getUniformLocation(objP,"uScale"),rotation:gl.getUniformLocation(objP,"uRotation"),color:gl.getUniformLocation(objP,"uColor"),camera:gl.getUniformLocation(objP,"uCamera"),fogColor:gl.getUniformLocation(objP,"uFogColor"),night:gl.getUniformLocation(objP,"uNight"),storm:gl.getUniformLocation(objP,"uStorm"),fog:gl.getUniformLocation(objP,"uFog")};
  const au={vp:gl.getUniformLocation(sailP,"uViewProj"),offset:gl.getUniformLocation(sailP,"uOffset"),scale:gl.getUniformLocation(sailP,"uScale"),rotation:gl.getUniformLocation(sailP,"uRotation"),color:gl.getUniformLocation(sailP,"uColor"),camera:gl.getUniformLocation(sailP,"uCamera"),fogColor:gl.getUniformLocation(sailP,"uFogColor"),night:gl.getUniformLocation(sailP,"uNight"),storm:gl.getUniformLocation(sailP,"uStorm"),fog:gl.getUniformLocation(sailP,"uFog"),time:gl.getUniformLocation(sailP,"uTime"),wind:gl.getUniformLocation(sailP,"uWind"),phase:gl.getUniformLocation(sailP,"uPhase")};
  const lu={vp:gl.getUniformLocation(threadP,"uViewProj"),offset:gl.getUniformLocation(threadP,"uOffset"),scale:gl.getUniformLocation(threadP,"uScale"),rotation:gl.getUniformLocation(threadP,"uRotation"),color:gl.getUniformLocation(threadP,"uColor"),alpha:gl.getUniformLocation(threadP,"uAlpha"),night:gl.getUniformLocation(threadP,"uNight"),storm:gl.getUniformLocation(threadP,"uStorm"),fog:gl.getUniformLocation(threadP,"uFog")};
  function resize({width,height,ratio=1}){W=Math.max(1,width);H=Math.max(1,height);const q=Math.min(ratio,W<=760?1.18:1.55),w=Math.round(W*q),h=Math.round(H*q);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}}
  const setC=(u,c)=>{gl.uniform1f(u.day,c.day);gl.uniform1f(u.sunset,c.sunset);gl.uniform1f(u.night,c.night);gl.uniform1f(u.storm,c.storm);gl.uniform1f(u.fog,c.fog);gl.uniform1f(u.lightning,c.lightning)};
  function obj(mesh,o,s,r,col,eye,fog,c){gl.useProgram(objP);gl.bindVertexArray(mesh.vao);gl.uniformMatrix4fv(ju.vp,false,VP);gl.uniform3f(ju.offset,...o);gl.uniform3f(ju.scale,...s);gl.uniform3f(ju.rotation,...r);gl.uniform3f(ju.color,...col);gl.uniform3f(ju.camera,...eye);gl.uniform3f(ju.fogColor,...fog);gl.uniform1f(ju.night,c.night);gl.uniform1f(ju.storm,c.storm);gl.uniform1f(ju.fog,c.fog);gl.drawArrays(gl.TRIANGLES,0,mesh.count)}
  function sail(o,s,r,col,eye,fog,c,t,ph){gl.disable(gl.CULL_FACE);gl.useProgram(sailP);gl.bindVertexArray(M.sail.vao);gl.uniformMatrix4fv(au.vp,false,VP);gl.uniform3f(au.offset,...o);gl.uniform3f(au.scale,...s);gl.uniform3f(au.rotation,...r);gl.uniform3f(au.color,...col);gl.uniform3f(au.camera,...eye);gl.uniform3f(au.fogColor,...fog);gl.uniform1f(au.night,c.night);gl.uniform1f(au.storm,c.storm);gl.uniform1f(au.fog,c.fog);gl.uniform1f(au.time,t);gl.uniform1f(au.wind,c.wind);gl.uniform1f(au.phase,ph);gl.drawArrays(gl.TRIANGLES,0,M.sail.count);gl.enable(gl.CULL_FACE)}
  function threadShip(o,scale,rot,c){
    const color=[mix(.58,.76,c.sunset),mix(.88,.74,c.sunset),mix(.94,.48,c.sunset)];
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.depthMask(false);gl.useProgram(threadP);gl.bindVertexArray(threadVao);
    gl.uniformMatrix4fv(lu.vp,false,VP);gl.uniform3f(lu.offset,...o);gl.uniform3f(lu.scale,scale,scale,scale);gl.uniform3f(lu.rotation,...rot);gl.uniform3f(lu.color,...color);gl.uniform1f(lu.alpha,.26+.30*c.night+.10*c.sunset);gl.uniform1f(lu.night,c.night);gl.uniform1f(lu.storm,c.storm);gl.uniform1f(lu.fog,c.fog);
    gl.drawArrays(gl.LINES,0,threadVerts.length/3);gl.depthMask(true);gl.disable(gl.BLEND)
  }
  function ship(slot,t,camZ,eye,fog,c){
    const raw=(t+slot*19.3)/59,p=raw-Math.floor(raw);if(p<.055||p>.94)return;const epoch=Math.floor(raw),r=hash1(epoch*17.3+slot*9.7),type=Math.floor(r*3),side=(epoch+slot)%2?1:-1,x=side*(15+hash1(epoch*3.9+slot*4.7)*34),z=camZ-520+p*610,bs=type===0?1.07:type===1 ? .9 : .58,y=.70+Math.sin(t*.54+slot)*(.08+.20*c.storm),yaw=side*.035+(r-.5)*.06,roll=Math.sin(t*.58+slot)*(.018+.05*c.storm),pitch=Math.sin(t*.42+slot*1.4)*(.01+.03*c.storm),rot=[pitch,yaw,roll],hc=type===0?[.12,.055,.027]:type===1?[.30,.13,.052]:[.19,.23,.21];
    obj(M.hull,[x,y,z],[5.7*bs,2.35*bs,18.4*bs],rot,hc,eye,fog,c);obj(M.box,[x,y+1.55*bs,z+2*bs],[4.8*bs,.48*bs,12.4*bs],rot,type===2?[.34,.33,.26]:[.32,.16,.07],eye,fog,c);
    obj(M.box,[x-2.2*bs,y+2.05*bs,z+1.8*bs],[.12*bs,.42*bs,11*bs],rot,[.20,.10,.045],eye,fog,c);obj(M.box,[x+2.2*bs,y+2.05*bs,z+1.8*bs],[.12*bs,.42*bs,11*bs],rot,[.20,.10,.045],eye,fog,c);
    const mc=type===2?1:type===0?3:2,spread=type===0?5.3:6.4,sc=type===0?[.26,.24,.20]:[.86,.80,.67];
    for(let m=0;m<mc;m++){const off=m-(mc-1)/2,mz=z+off*spread*bs,mh=(type===2?10:type===0?15.8:13.4)*(1-Math.abs(off)*.07)*bs;obj(M.mast,[x,y+mh*.48+2.1*bs,mz],[.145*bs,mh,.145*bs],rot,[.20,.10,.045],eye,fog,c);obj(M.box,[x,y+mh*.70,mz],[6.3*bs,.11*bs,.13*bs],rot,[.18,.09,.04],eye,fog,c);sail([x,y+mh*.62,mz-.15*bs],[type===2?4.4*bs:5.7*bs,type===2?5.5*bs:7*bs,1],rot,type===2?[.80,.77,.66]:sc,eye,fog,c,t,slot*1.7+m*.9);if(type!==2)sail([x,y+mh*.84,mz-.16*bs],[4*bs,4.8*bs,1],rot,sc,eye,fog,c,t,slot*2.1+m*1.2)}
    if(type!==2)obj(M.mast,[x,y+3.2*bs,z-10.3*bs],[.11*bs,7*bs,.11*bs],[1.12,yaw,roll],[.19,.095,.04],eye,fog,c);
    threadShip([x,y+.1,z],bs,rot,c)
  }
  function render(t,camera,c){
    const zen=Boolean(camera),cx=clamp(camera?.x||0,-1.2,1.2),cy=clamp(camera?.y||0,-.86,.86),cz=camera?.z||0,travel=t*(zen?7.2:.52)+cz*38,camZ=-travel,eye=[cx*9.4,6.2+cy*5+c.wave*.28*Math.sin(t*.41),camZ+18],target=[eye[0]+cx*1.2,2.7+cy*.58,camZ-110];
    perspective(P,zen ? .90 : .98,W/H,.12,1280);lookAt(V,eye,target,[0,1,0]);multiply(VP,P,V);
    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);gl.useProgram(skyP);gl.bindVertexArray(skyVao);gl.uniform1f(su.time,t);gl.uniform1f(su.aspect,W/H);setC(su,c);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.enable(gl.DEPTH_TEST);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);gl.useProgram(oceanP);gl.bindVertexArray(oceanVao);gl.uniformMatrix4fv(ou.vp,false,VP);gl.uniform1f(ou.time,t);gl.uniform1f(ou.cameraZ,camZ);gl.uniform1f(ou.wave,c.wave);gl.uniform3f(ou.camera,...eye);setC(ou,c);gl.drawElements(gl.TRIANGLES,ocean.indices.length,gl.UNSIGNED_INT,0);
    const fog=[mix(.73,.22,c.storm),mix(.81,.27,c.storm),mix(.82,.28,c.storm)];fog[0]=mix(fog[0],.09,c.night);fog[1]=mix(fog[1],.13,c.night);fog[2]=mix(fog[2],.19,c.night);gl.enable(gl.CULL_FACE);ship(0,t,camZ,eye,fog,c);ship(1,t+8.5,camZ,eye,fog,c);gl.disable(gl.CULL_FACE);gl.bindVertexArray(null)
  }
  return{resize,draw({time,width,height,camera}){if(dead)return;if(width!==W||height!==H)resize({width,height,ratio:devicePixelRatio||1});const c=stateAt(time);render(time,camera,c);fx.draw(ctx,time,width,height,c);sound.setWeather(c,time)},dispose(){dead=true;canvas.remove();style.remove();sound.dispose();try{for(const p of[skyP,oceanP,objP,sailP,threadP])gl.deleteProgram(p);for(const r of R){if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);else gl.deleteBuffer(r)}}catch{}}}
}

export default{id:"living-sea",renderer:"webgl-living-sea-v4",particles:false,marks:true,flightCards:true,autoFlightCards:true,continuousDepth:true,flightBounds:{x:1.2,y:.86},accent:"#bcdde5",dim:"#c7d9dd",surface:"12,27,38",panel:{bg:"rgba(14,35,47,.54)",border:"rgba(190,224,230,.26)",glow:"rgba(83,174,194,.17)",text:"#f2fbfc",muted:"#c6dce0"},radius:"28px",buttonRadius:"28px",heading:'"Cormorant Garamond", Georgia, serif',body:'"Nunito", system-ui, sans-serif',colors:["#d9eff2","#8fc1ce","#f1c48d","#9eb6c6"],backgrounds:["radial-gradient(ellipse at 72% 18%,rgba(180,220,228,.24),transparent 45%),radial-gradient(ellipse at 28% 8%,rgba(73,124,153,.26),transparent 58%)","radial-gradient(ellipse at 60% 35%,rgba(134,182,193,.12),transparent 55%)","linear-gradient(to bottom,rgba(41,83,105,.14),rgba(6,19,28,.44))"],soundscape:SOUND,createRenderer};
