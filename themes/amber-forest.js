const TAU=Math.PI*2;

function seeded(seed=48127){
  let s=seed>>>0;
  return ()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};
}

function compile(gl,type,source){
  const shader=gl.createShader(type);
  gl.shaderSource(shader,source);
  gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){
    const message=gl.getShaderInfoLog(shader)||"Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function program(gl,vertex,fragment){
  const p=gl.createProgram();
  const vs=compile(gl,gl.VERTEX_SHADER,vertex);
  const fs=compile(gl,gl.FRAGMENT_SHADER,fragment);
  gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
  gl.deleteShader(vs);gl.deleteShader(fs);
  if(!gl.getProgramParameter(p,gl.LINK_STATUS)){
    const message=gl.getProgramInfoLog(p)||"Program link failed";
    gl.deleteProgram(p);
    throw new Error(message);
  }
  return p;
}

function perspective(out,fovy,aspect,near,far){
  const f=1/Math.tan(fovy/2);
  out.fill(0);
  out[0]=f/aspect;out[5]=f;out[11]=-1;out[15]=0;
  const nf=1/(near-far);
  out[10]=(far+near)*nf;out[14]=2*far*near*nf;
  return out;
}

function lookAt(out,eye,center,up){
  let x0,x1,x2,y0,y1,y2,z0,z1,z2,len;
  z0=eye[0]-center[0];z1=eye[1]-center[1];z2=eye[2]-center[2];
  len=Math.hypot(z0,z1,z2)||1;z0/=len;z1/=len;z2/=len;
  x0=up[1]*z2-up[2]*z1;x1=up[2]*z0-up[0]*z2;x2=up[0]*z1-up[1]*z0;
  len=Math.hypot(x0,x1,x2)||1;x0/=len;x1/=len;x2/=len;
  y0=z1*x2-z2*x1;y1=z2*x0-z0*x2;y2=z0*x1-z1*x0;
  out[0]=x0;out[1]=y0;out[2]=z0;out[3]=0;
  out[4]=x1;out[5]=y1;out[6]=z1;out[7]=0;
  out[8]=x2;out[9]=y2;out[10]=z2;out[11]=0;
  out[12]=-(x0*eye[0]+x1*eye[1]+x2*eye[2]);
  out[13]=-(y0*eye[0]+y1*eye[1]+y2*eye[2]);
  out[14]=-(z0*eye[0]+z1*eye[1]+z2*eye[2]);
  out[15]=1;
  return out;
}

function multiply(out,a,b){
  const r=new Float32Array(16);
  for(let c=0;c<4;c++)for(let row=0;row<4;row++)
    r[c*4+row]=a[row]*b[c*4]+a[4+row]*b[c*4+1]+a[8+row]*b[c*4+2]+a[12+row]*b[c*4+3];
  out.set(r);return out;
}

const SKY_VS=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}
`;

const SKY_FS=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uAspect;
uniform float uZen;

float waves(vec2 p){
  float v=0.0;
  v+=sin(p.x*.91+sin(p.y*.71)*1.18);
  v+=sin(p.y*1.16-cos(p.x*.62)*1.08)*.68;
  v+=sin((p.x+p.y)*1.72)*.31;
  v+=sin(p.x*.47-p.y*1.39+sin(p.x*.32)*.8)*.20;
  return .5+.5*(v/2.19);
}
float cloud(vec2 p){
  float a=waves(p);
  float b=waves(vec2(p.x*.82-p.y*.57,p.x*.57+p.y*.82)*1.74+vec2(2.3,5.1));
  float c=waves(vec2(p.x*.94+p.y*.34,-p.x*.34+p.y*.94)*2.85+vec2(-3.8,1.7));
  return a*.59+b*.29+c*.12;
}
void main(){
  vec2 uv=vUv;
  float horizon=.44;
  vec3 top=vec3(.20,.28,.31);
  vec3 upper=vec3(.50,.48,.42);
  vec3 haze=vec3(.86,.77,.62);
  vec3 dawn=vec3(1.0,.60,.23);
  vec3 col=mix(haze,mix(upper,top,smoothstep(.62,1.0,uv.y)),smoothstep(horizon,1.0,uv.y));

  float sun=exp(-pow((uv.x-.72)*5.0,2.0)-pow((uv.y-.47)*19.0,2.0));
  col+=dawn*sun*.53;

  vec2 p=vec2((uv.x-.5)*uAspect*3.2,uv.y*3.2)+vec2(uTime*.006,-uTime*.0018);
  float low=cloud(p);
  float mid=cloud(p*.61+vec2(3.1,-2.0));
  float lowMask=smoothstep(.39,.46,uv.y)*(1.0-smoothstep(.66,.76,uv.y));
  float midMask=smoothstep(.49,.56,uv.y)*(1.0-smoothstep(.83,.93,uv.y));
  float d1=smoothstep(.48,.67,low)*lowMask;
  float d2=smoothstep(.50,.68,mid)*midMask;
  vec3 shadow=vec3(.40,.39,.36);
  vec3 body=vec3(.75,.70,.61);
  vec3 light=vec3(.96,.84,.67);
  vec3 c1=mix(shadow,body,smoothstep(.47,.68,low));
  c1=mix(c1,light,sun*.35+smoothstep(.58,.72,low)*.34);
  col=mix(col,c1,d1*.78);
  col=mix(col,vec3(.73,.68,.60),d2*.26);

  float mist=exp(-pow((uv.y-horizon)*28.0,2.0));
  col=mix(col,vec3(.92,.80,.62),mist*(.34+.07*uZen));
  col*=1.0-.13*pow(length((uv-.5)*vec2(.82,1.0)),1.75);
  outColor=vec4(col,1.0);
}
`;

function prismGeometry(sides=7){
  const p=[],n=[];
  for(let i=0;i<sides;i++){
    const a=i/sides*TAU,b=(i+1)/sides*TAU;
    const ax=Math.cos(a)*.5,az=Math.sin(a)*.5,bx=Math.cos(b)*.5,bz=Math.sin(b)*.5;
    const nx=Math.cos((a+b)*.5),nz=Math.sin((a+b)*.5);
    const verts=[
      ax,-.5,az, bx,-.5,bz, bx,.5,bz,
      ax,-.5,az, bx,.5,bz, ax,.5,az
    ];
    p.push(...verts);
    for(let k=0;k<6;k++)n.push(nx,0,nz);
    p.push(0,.5,0, ax,.5,az, bx,.5,bz);
    for(let k=0;k<3;k++)n.push(0,1,0);
  }
  return {positions:new Float32Array(p),normals:new Float32Array(n)};
}

function sphereGeometry(segments=7,rings=4){
  const p=[],n=[];
  const add=(lat,lon)=>{
    const cl=Math.cos(lat),x=cl*Math.cos(lon),y=Math.sin(lat),z=cl*Math.sin(lon);
    p.push(x*.5,y*.5,z*.5);n.push(x,y,z);
  };
  for(let r=0;r<rings;r++){
    const la=-Math.PI/2+r/rings*Math.PI,lb=-Math.PI/2+(r+1)/rings*Math.PI;
    for(let s=0;s<segments;s++){
      const aa=s/segments*TAU,ab=(s+1)/segments*TAU;
      add(la,aa);add(lb,aa);add(lb,ab);
      add(la,aa);add(lb,ab);add(la,ab);
    }
  }
  return {positions:new Float32Array(p),normals:new Float32Array(n)};
}

const TRUNK_VS=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iOffset;
layout(location=3) in vec3 iScale;
layout(location=4) in float iTone;
layout(location=5) in float iPhase;
uniform mat4 uViewProj;
uniform float uTravel;
uniform float uSpan;
uniform float uTime;
uniform vec3 uCamera;
out vec3 vNormal;
out vec3 vWorld;
out float vTone;
out float vDistance;
void main(){
  float z=mod(iOffset.z+uTravel,uSpan)-uSpan;
  vec3 local=aPosition;
  float y01=clamp(local.y+.5,0.,1.);
  local.xz*=mix(1.0,.68,y01);
  float sway=sin(uTime*.63+iPhase)*.055*y01*y01;
  vec3 world=vec3(iOffset.x+iScale.y*sway,iOffset.y,z)+local*iScale;
  vWorld=world;vNormal=aNormal;vTone=iTone;vDistance=distance(world,uCamera);
  gl_Position=uViewProj*vec4(world,1.0);
}
`;

const TRUNK_FS=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vTone;
in float vDistance;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  vec3 lightDir=normalize(vec3(-.45,.82,.34));
  float diff=max(dot(n,lightDir),0.0);
  float grain=.5+.5*sin(vWorld.y*2.4+vWorld.x*.7+sin(vWorld.z*.31));
  vec3 dark=vec3(.12,.065,.028);
  vec3 warm=vec3(.29,.145,.052);
  vec3 base=mix(dark,warm,.42+.32*vTone);
  base*=.48+.62*diff;
  base*=.87+.13*grain;
  float fog=smoothstep(80.0,300.0,vDistance);
  base=mix(base,vec3(.69,.60,.47),fog*.91);
  outColor=vec4(base,1.0);
}
`;

const LEAF_VS=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iOffset;
layout(location=3) in vec3 iScale;
layout(location=4) in float iTone;
layout(location=5) in float iPhase;
uniform mat4 uViewProj;
uniform float uTravel;
uniform float uSpan;
uniform float uTime;
uniform vec3 uCamera;
out vec3 vNormal;
out vec3 vWorld;
out float vTone;
out float vPhase;
out float vDistance;
void main(){
  float z=mod(iOffset.z+uTravel,uSpan)-uSpan;
  float sway=sin(uTime*.54+iPhase)*.24+sin(uTime*.31+iPhase*1.7)*.13;
  vec3 world=vec3(iOffset.x+sway,iOffset.y,z)+aPosition*iScale;
  vNormal=aNormal;vWorld=world;vTone=iTone;vPhase=iPhase;vDistance=distance(world,uCamera);
  gl_Position=uViewProj*vec4(world,1.0);
}
`;

const LEAF_FS=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vTone;
in float vPhase;
in float vDistance;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  vec3 sunDir=normalize(vec3(-.52,.79,.30));
  float diff=max(dot(n,sunDir),0.0);
  float hemi=n.y*.5+.5;
  vec3 gold=vec3(.96,.60,.10);
  vec3 amber=vec3(.89,.34,.055);
  vec3 rust=vec3(.62,.15,.045);
  vec3 olive=vec3(.42,.38,.085);
  vec3 col=vTone<.34?mix(gold,amber,vTone/.34):
           vTone<.72?mix(amber,rust,(vTone-.34)/.38):
           mix(rust,olive,(vTone-.72)/.28);
  float mottled=.5+.5*sin(vWorld.x*.91+vWorld.y*1.17+vWorld.z*.43+vPhase);
  col*=.55+.45*diff+.12*hemi;
  col*=.91+.09*mottled;
  float rim=pow(1.0-abs(n.z),2.0);
  col+=vec3(.15,.075,.025)*rim*.24;
  float fog=smoothstep(75.0,310.0,vDistance);
  col=mix(col,vec3(.73,.62,.48),fog*.93);
  outColor=vec4(col,1.0);
}
`;

function terrainGeometry(cols=72,rows=120){
  const verts=[],idx=[];
  const x0=-110,x1=110,z0=32,z1=-620;
  for(let r=0;r<=rows;r++){
    const v=r/rows,z=z0+(z1-z0)*v;
    for(let c=0;c<=cols;c++){
      const u=c/cols;
      verts.push(x0+(x1-x0)*u,z);
    }
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const a=r*(cols+1)+c,b=a+1,d=(r+1)*(cols+1)+c,e=d+1;
    idx.push(a,d,b,b,d,e);
  }
  return {vertices:new Float32Array(verts),indices:new Uint32Array(idx)};
}

const GROUND_VS=`#version 300 es
layout(location=0) in vec2 aPosition;
uniform mat4 uViewProj;
out vec3 vWorld;
float heightAt(float x){
  float bank=smoothstep(7.5,24.0,abs(x));
  return -.72+bank*(1.75+.28*sin(abs(x)*.16));
}
void main(){
  float x=aPosition.x,z=aPosition.y;
  float y=heightAt(x);
  vWorld=vec3(x,y,z);
  gl_Position=uViewProj*vec4(vWorld,1.0);
}
`;

const GROUND_FS=`#version 300 es
precision highp float;
in vec3 vWorld;
out vec4 outColor;
uniform vec3 uCamera;
uniform float uTime;
void main(){
  float bank=smoothstep(8.0,24.0,abs(vWorld.x));
  float leaf=.5+.5*sin(vWorld.x*.42+sin(vWorld.z*.17)*1.7);
  float leaf2=.5+.5*sin(vWorld.z*.31-vWorld.x*.19);
  vec3 soil=vec3(.105,.062,.026);
  vec3 moss=vec3(.20,.18,.052);
  vec3 ochre=vec3(.49,.205,.045);
  vec3 col=mix(soil,moss,bank*.38);
  col=mix(col,ochre,bank*(.18+.22*leaf*leaf2));
  float light=.68+.18*sin(vWorld.x*.035+vWorld.z*.018);
  col*=light;
  float fog=smoothstep(85.0,330.0,distance(vWorld,uCamera));
  col=mix(col,vec3(.67,.57,.44),fog*.94);
  outColor=vec4(col,1.0);
}
`;

function riverGeometry(cols=34,rows=120){
  const verts=[],idx=[];
  const x0=-8.5,x1=8.5,z0=34,z1=-620;
  for(let r=0;r<=rows;r++){
    const v=r/rows,z=z0+(z1-z0)*v;
    for(let c=0;c<=cols;c++){
      const u=c/cols;verts.push(x0+(x1-x0)*u,z);
    }
  }
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    const a=r*(cols+1)+c,b=a+1,d=(r+1)*(cols+1)+c,e=d+1;
    idx.push(a,d,b,b,d,e);
  }
  return {vertices:new Float32Array(verts),indices:new Uint32Array(idx)};
}

const RIVER_VS=`#version 300 es
layout(location=0) in vec2 aPosition;
uniform mat4 uViewProj;
uniform float uTime;
out vec3 vWorld;
void main(){
  float x=aPosition.x,z=aPosition.y;
  float y=-.34+sin(z*.09+uTime*.42)*.055+sin(x*.39-z*.055-uTime*.31)*.035;
  vWorld=vec3(x,y,z);
  gl_Position=uViewProj*vec4(vWorld,1.0);
}
`;

const RIVER_FS=`#version 300 es
precision highp float;
in vec3 vWorld;
out vec4 outColor;
uniform vec3 uCamera;
uniform float uTime;
void main(){
  vec3 dx=dFdx(vWorld),dy=dFdy(vWorld);
  vec3 n=normalize(cross(dx,dy));if(n.y<0.0)n=-n;
  vec3 viewDir=normalize(uCamera-vWorld);
  vec3 sunDir=normalize(vec3(-.52,.82,.28));
  float fres=pow(1.0-max(dot(n,viewDir),0.0),3.1);
  float spec=pow(max(dot(reflect(-sunDir,n),viewDir),0.0),68.0);
  float ripple=.5+.5*sin(vWorld.z*.38+vWorld.x*.21-uTime*.75);
  vec3 deep=vec3(.055,.115,.102);
  vec3 tea=vec3(.18,.20,.115);
  vec3 sky=vec3(.67,.56,.38);
  vec3 col=mix(deep,tea,.22+.18*ripple);
  col=mix(col,sky,.18+.48*fres);
  col+=vec3(1.0,.58,.20)*spec*.55;
  float fog=smoothstep(95.0,350.0,distance(vWorld,uCamera));
  col=mix(col,vec3(.69,.59,.45),fog*.94);
  outColor=vec4(col,1.0);
}
`;

function terrainHeight(x){
  const bank=Math.max(0,Math.min(1,(Math.abs(x)-7.5)/(24-7.5)));
  const s=bank*bank*(3-2*bank);
  return -.72+s*(1.75+.28*Math.sin(Math.abs(x)*.16));
}

function buildForest(){
  const rnd=seeded(91277),span=560,trunks=[],crowns=[];
  const addTree=(x,z)=>{
    const base=terrainHeight(x);
    const h=8+rnd()*12;
    const radius=.42+rnd()*.44;
    const tone=rnd();
    const phase=rnd()*TAU;
    trunks.push(x,base+h*.5,z,radius*2,h,radius*2,tone,phase);
    const clusters=2+(rnd()>.40?1:0)+(rnd()>.78?1:0);
    for(let i=0;i<clusters;i++){
      const ang=rnd()*TAU;
      const spread=(i===0?0:rnd()*(2.0+radius*2.2));
      const cx=x+Math.cos(ang)*spread;
      const cz=z+Math.sin(ang)*spread;
      const cy=base+h*(.72+rnd()*.18)+(i===0?1.1:0);
      const sx=4.0+rnd()*4.0;
      const sy=3.2+rnd()*3.1;
      const sz=4.0+rnd()*4.0;
      const localTone=Math.max(0,Math.min(1,tone+(rnd()-.5)*.25));
      crowns.push(cx,cy,cz,sx,sy,sz,localTone,phase+i*.81);
    }
  };
  for(let z=10;z<span;z+=8.5+rnd()*3.2){
    for(const side of [-1,1]){
      const near=side*(12.5+rnd()*18);
      addTree(near,z+rnd()*5);
      if(rnd()>.28)addTree(side*(31+rnd()*26),z+rnd()*7);
      if(rnd()>.58)addTree(side*(59+rnd()*38),z+rnd()*10);
    }
  }
  return {
    span,
    trunks:new Float32Array(trunks),
    trunkCount:trunks.length/8,
    crowns:new Float32Array(crowns),
    crownCount:crowns.length/8
  };
}

function makeLeafSprites(){
  const colors=[
    ["#f7c45f","#a95314"],
    ["#e7882f","#7b2d0c"],
    ["#cf5424","#6c1f12"],
    ["#d5a73a","#77671b"]
  ];
  return colors.map((pair,idx)=>{
    const c=document.createElement("canvas");c.width=64;c.height=64;
    const x=c.getContext("2d");
    const g=x.createLinearGradient(18,12,48,52);
    g.addColorStop(0,pair[0]);g.addColorStop(1,pair[1]);
    x.fillStyle=g;x.strokeStyle="rgba(73,37,15,.35)";x.lineWidth=1.1;
    x.beginPath();
    x.moveTo(32,8);
    x.bezierCurveTo(49,15,53,31,32,53);
    x.bezierCurveTo(11,31,15,15,32,8);
    x.closePath();x.fill();x.stroke();
    x.strokeStyle="rgba(92,48,18,.38)";
    x.beginPath();x.moveTo(32,12);x.lineTo(32,56);x.stroke();
    x.globalAlpha=.42;
    x.beginPath();x.moveTo(32,27);x.lineTo(20,20);x.moveTo(32,34);x.lineTo(45,25);x.stroke();
    return c;
  });
}

function createAirLeaves(){
  const rnd=seeded(22771),sprites=makeLeafSprites();
  const leaves=Array.from({length:18},()=>({
    x:rnd(),y:rnd()*1.15-.1,depth:.35+rnd()*.85,
    speed:.018+rnd()*.026,drift:(rnd()-.5)*.035,
    spin:(rnd()-.5)*1.2,phase:rnd()*TAU,sprite:Math.floor(rnd()*sprites.length)
  }));
  let last=0;
  return {
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      const dt=last?Math.min(.05,time-last):1/30;last=time;
      const count=zen?leaves.length:12;
      for(let i=0;i<count;i++){
        const l=leaves[i];
        l.y+=l.speed*dt*(zen?1.12:.82);
        l.x+=Math.sin(time*.43+l.phase)*.0024+l.drift*dt;
        if(l.y>1.10||l.x>1.12||l.x<-.12){
          l.y=-.12-rnd()*.20;l.x=.04+rnd()*.92;l.depth=.35+rnd()*.85;
          l.drift=(rnd()-.5)*.035;l.sprite=Math.floor(rnd()*sprites.length);
        }
        const s=(7+18*l.depth)*(zen?1.04:.92);
        const alpha=.18+.45*l.depth;
        ctx.save();
        ctx.translate(l.x*width,l.y*height);
        ctx.rotate(time*l.spin+l.phase);
        ctx.globalAlpha=alpha;
        ctx.drawImage(sprites[l.sprite],-s/2,-s/2,s,s);
        ctx.restore();
      }
    }
  };
}

const SOUND={
  title:"Звучание Янтарного леса",
  loops:[
    {src:"audio-library/nature/forest_morning.ogg",volume:.15},
    {src:"audio-library/nature/wind_soft.ogg",fallback:"audio-library/compatible/nature/wind_soft.m4a",volume:.12},
    {src:"audio-library/nature/river_flow_fast.ogg",volume:.07},
    {src:"audio-library/ambience/deep_forest.ogg",fallback:"audio-library/compatible/ambience/deep_forest.m4a",volume:.055}
  ],
  oneShots:[
    {src:"audio-library/nature/crow_caw.ogg",volume:.065,minDelay:30,maxDelay:72}
  ]
};

function createThemeSound(){
  const button=document.createElement("button");
  button.type="button";button.className="icon-btn glass theme-sound-toggle";
  button.setAttribute("aria-label","Включить звучание Янтарного леса");
  button.setAttribute("aria-pressed","false");button.title="Звучание темы";
  button.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="M16 9c1.7 1.5 1.7 4.5 0 6M18.5 6.8c3.5 3 3.5 7.4 0 10.4"/></svg>';
  document.querySelector(".top-actions")?.insertBefore(button,document.querySelector("#zen-toggle"));
  const Ctx=window.AudioContext||window.webkitAudioContext;
  let ac=null,master=null,enabled=false,seq=0;
  const cache=new Map(),tracks=new Set(),timers=new Set();
  const assetRoot=new URL("../",import.meta.url);
  const same=(raw)=>{try{const u=new URL(raw,assetRoot);return u.origin===assetRoot.origin?u.href:""}catch{return ""}};
  const norm=(e)=>{const src=same(e.src);return src?{...e,src,fallback:same(e.fallback),volume:Math.max(0,Math.min(.5,Number(e.volume)||.1))}:null};
  const sync=()=>{button.dataset.enabled=String(enabled);button.setAttribute("aria-pressed",String(enabled));button.setAttribute("aria-label",enabled?"Выключить звучание Янтарного леса":"Включить звучание Янтарного леса")};
  const load=async(raw)=>{
    const e=norm(raw);if(!e)throw Error("audio");
    const key=e.src+"|"+e.fallback;if(cache.has(key))return cache.get(key);
    const p=(async()=>{let last;for(const u of [e.src,e.fallback].filter(Boolean)){try{const r=await fetch(u,{cache:"force-cache",signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error("audio");return {buffer:await ac.decodeAudioData(await r.arrayBuffer()),entry:e}}catch(err){last=err}}throw last||Error("audio")})();
    cache.set(key,p);try{return await p}catch(err){cache.delete(key);throw err}
  };
  const clearTimers=()=>{for(const t of timers)clearTimeout(t);timers.clear()};
  const fadeOut=(seconds=1.6)=>{
    if(!ac)return;const now=ac.currentTime;
    for(const t of [...tracks]){
      const g=t.gain.gain;g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+seconds);
      setTimeout(()=>{try{t.source.stop();t.source.disconnect();t.gain.disconnect()}catch{}tracks.delete(t)},seconds*1000+90)
    }
  };
  const stop=(silent=false)=>{if(!enabled&&!tracks.size)return;enabled=false;seq++;clearTimers();fadeOut();if(!silent)sync()};
  const scheduleOneShot=(request)=>{
    const raw=SOUND.oneShots[0],e=norm(raw);if(!e)return;
    const again=()=>{
      if(!enabled||request!==seq)return;
      const delay=(e.minDelay+Math.random()*(e.maxDelay-e.minDelay))*1000;
      const timer=setTimeout(async()=>{
        timers.delete(timer);if(!enabled||request!==seq)return;
        try{
          const {buffer}=await load(e);if(!enabled||request!==seq)return;
          const source=ac.createBufferSource(),gain=ac.createGain(),pan=ac.createStereoPanner?.();
          source.buffer=buffer;gain.gain.value=e.volume;source.connect(gain);
          if(pan){gain.connect(pan);pan.connect(master);pan.pan.value=Math.random()*1.2-.6}else gain.connect(master);
          source.start()
        }catch{}
        again();
      },delay);
      timers.add(timer);
    };
    again();
  };
  const start=async()=>{
    if(!Ctx)return;
    if(!ac){
      ac=new Ctx();master=ac.createGain();master.gain.value=.16;
      const comp=ac.createDynamicsCompressor();comp.threshold.value=-15;comp.knee.value=24;comp.ratio.value=4;
      master.connect(comp);comp.connect(ac.destination);
    }
    enabled=true;const request=++seq;sync();await ac.resume();
    const ready=await Promise.allSettled(SOUND.loops.map(load));
    if(!enabled||request!==seq)return;
    ready.forEach((r,i)=>{
      if(r.status!=="fulfilled")return;
      const source=ac.createBufferSource(),gain=ac.createGain();
      source.buffer=r.value.buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(master);
      tracks.add({source,gain});source.start();gain.gain.linearRampToValueAtTime(SOUND.loops[i].volume,ac.currentTime+4+i*.55);
    });
    scheduleOneShot(request);
  };
  button.onclick=()=>{if(enabled)stop();else start().catch(()=>{stop();button.title="Нажмите ещё раз, чтобы браузер разрешил звук"})};
  const onPlay=(e)=>{if(e.target instanceof HTMLMediaElement&&!e.target.muted)stop()};
  const onScene=(e)=>{if(e.detail?.enabled)stop()};
  document.addEventListener("play",onPlay,true);window.addEventListener("syolana:sceneaudio",onScene);
  return {dispose(){stop(true);document.removeEventListener("play",onPlay,true);window.removeEventListener("syolana:sceneaudio",onScene);button.remove();try{ac?.close()}catch{}}};
}

function fallbackRenderer(ctx){
  const rnd=seeded(611);
  return {
    resize(){},
    draw({time,width,height,camera}){
      const zen=Boolean(camera);
      const g=ctx.createLinearGradient(0,0,0,height);
      g.addColorStop(0,"#364b4a");g.addColorStop(.44,"#b28a58");g.addColorStop(.58,"#77502d");g.addColorStop(1,"#17130d");
      ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
      const horizon=height*.53;
      for(let i=0;i<46;i++){
        const side=i%2?-1:1;
        const z=((i*61+time*(zen?30:7))%1000)/1000;
        const scale=.12+z*1.18;
        const x=width*.5+side*(50+z*width*.52);
        const h=(45+(i%7)*9)*scale;
        ctx.fillStyle=["#d89a31","#c95b24","#e1b94c","#8f4d20"][i%4];
        ctx.beginPath();ctx.arc(x,horizon-h*.55,12*scale,0,TAU);ctx.fill();
        ctx.fillStyle="#4b2813";ctx.fillRect(x-1.6*scale,horizon-h*.55,3.2*scale,h*.55);
      }
      const water=ctx.createLinearGradient(0,horizon,0,height);
      water.addColorStop(0,"rgba(94,103,72,.65)");water.addColorStop(1,"rgba(18,30,26,.94)");
      ctx.fillStyle=water;ctx.fillRect(width*.43,horizon,width*.14,height-horizon);
    },
    dispose(){}
  };
}

function createRenderer(ctx){
  const sourceCanvas=ctx?.canvas;
  if(!sourceCanvas||!document.body)return fallbackRenderer(ctx);

  const canvas=document.createElement("canvas");
  canvas.className="theme-world-canvas amber-forest-world";
  canvas.setAttribute("aria-hidden","true");
  Object.assign(canvas.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block",transform:"translateZ(0)",backfaceVisibility:"hidden",willChange:"transform"});
  sourceCanvas.parentNode?.insertBefore(canvas,sourceCanvas);

  const style=document.createElement("style");
  style.textContent='html[data-theme="amber-forest"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="amber-forest"] .flight-hint{color:#f4dcc0;opacity:.78}html[data-theme="amber-forest"] .theme-sound-toggle svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}html[data-theme="amber-forest"] .theme-sound-toggle svg path:first-child{fill:currentColor;stroke:none}html[data-theme="amber-forest"] .theme-sound-toggle[data-enabled="true"]{color:#fff0d2;box-shadow:0 0 0 1px #ffd28b55,0 0 28px #ec9a3d38}';
  document.head.append(style);
  const sound=createThemeSound();

  const gl=canvas.getContext("webgl2",{alpha:false,antialias:true,depth:true,stencil:false,powerPreference:"high-performance",preserveDrawingBuffer:false});
  if(!gl){
    canvas.remove();const fallback=fallbackRenderer(ctx),base=fallback.dispose;
    fallback.dispose=()=>{base?.();style.remove();sound.dispose()};return fallback;
  }

  let skyProgram,trunkProgram,leafProgram,groundProgram,riverProgram;
  try{
    skyProgram=program(gl,SKY_VS,SKY_FS);
    trunkProgram=program(gl,TRUNK_VS,TRUNK_FS);
    leafProgram=program(gl,LEAF_VS,LEAF_FS);
    groundProgram=program(gl,GROUND_VS,GROUND_FS);
    riverProgram=program(gl,RIVER_VS,RIVER_FS);
  }catch(error){
    console.warn("Amber Forest WebGL unavailable",error);
    canvas.remove();const fallback=fallbackRenderer(ctx),base=fallback.dispose;
    fallback.dispose=()=>{base?.();style.remove();sound.dispose()};return fallback;
  }

  const resources=[],keep=(x)=>{if(x)resources.push(x);return x};

  const skyVao=keep(gl.createVertexArray()),skyBuffer=keep(gl.createBuffer());
  gl.bindVertexArray(skyVao);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const skyLoc=gl.getAttribLocation(skyProgram,"aPosition");gl.enableVertexAttribArray(skyLoc);gl.vertexAttribPointer(skyLoc,2,gl.FLOAT,false,0,0);

  const forest=buildForest();
  const trunkGeo=prismGeometry(7),leafGeo=sphereGeometry(7,4);

  const makeInstanced=(geo,data)=>{
    const vao=keep(gl.createVertexArray());gl.bindVertexArray(vao);
    const pos=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,pos);gl.bufferData(gl.ARRAY_BUFFER,geo.positions,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
    const norm=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,norm);gl.bufferData(gl.ARRAY_BUFFER,geo.normals,gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
    const inst=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,inst);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
    const stride=8*4;
    gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,3,gl.FLOAT,false,stride,0);gl.vertexAttribDivisor(2,1);
    gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,3,gl.FLOAT,false,stride,3*4);gl.vertexAttribDivisor(3,1);
    gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,1,gl.FLOAT,false,stride,6*4);gl.vertexAttribDivisor(4,1);
    gl.enableVertexAttribArray(5);gl.vertexAttribPointer(5,1,gl.FLOAT,false,stride,7*4);gl.vertexAttribDivisor(5,1);
    return vao;
  };
  const trunkVao=makeInstanced(trunkGeo,forest.trunks);
  const leafVao=makeInstanced(leafGeo,forest.crowns);

  const terrain=terrainGeometry();
  const groundVao=keep(gl.createVertexArray());gl.bindVertexArray(groundVao);
  const groundPos=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,groundPos);gl.bufferData(gl.ARRAY_BUFFER,terrain.vertices,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const groundIdx=keep(gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,groundIdx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,terrain.indices,gl.STATIC_DRAW);

  const river=riverGeometry();
  const riverVao=keep(gl.createVertexArray());gl.bindVertexArray(riverVao);
  const riverPos=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,riverPos);gl.bufferData(gl.ARRAY_BUFFER,river.vertices,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const riverIdx=keep(gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,riverIdx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,river.indices,gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16);
  let cssWidth=1,cssHeight=1,disposed=false;
  const airLeaves=createAirLeaves();

  const uniforms={
    sky:{time:gl.getUniformLocation(skyProgram,"uTime"),aspect:gl.getUniformLocation(skyProgram,"uAspect"),zen:gl.getUniformLocation(skyProgram,"uZen")},
    trunk:{vp:gl.getUniformLocation(trunkProgram,"uViewProj"),travel:gl.getUniformLocation(trunkProgram,"uTravel"),span:gl.getUniformLocation(trunkProgram,"uSpan"),time:gl.getUniformLocation(trunkProgram,"uTime"),camera:gl.getUniformLocation(trunkProgram,"uCamera")},
    leaf:{vp:gl.getUniformLocation(leafProgram,"uViewProj"),travel:gl.getUniformLocation(leafProgram,"uTravel"),span:gl.getUniformLocation(leafProgram,"uSpan"),time:gl.getUniformLocation(leafProgram,"uTime"),camera:gl.getUniformLocation(leafProgram,"uCamera")},
    ground:{vp:gl.getUniformLocation(groundProgram,"uViewProj"),camera:gl.getUniformLocation(groundProgram,"uCamera"),time:gl.getUniformLocation(groundProgram,"uTime")},
    river:{vp:gl.getUniformLocation(riverProgram,"uViewProj"),camera:gl.getUniformLocation(riverProgram,"uCamera"),time:gl.getUniformLocation(riverProgram,"uTime")}
  };

  function resize({width,height,ratio=1}){
    cssWidth=Math.max(1,width);cssHeight=Math.max(1,height);
    const mobile=cssWidth<=760;
    const q=Math.min(ratio,mobile?1.16:1.55);
    const w=Math.max(1,Math.round(cssWidth*q)),h=Math.max(1,Math.round(cssHeight*q));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  }

  function renderWorld(time,camera){
    const zen=Boolean(camera);
    const cx=Math.max(-1.08,Math.min(1.08,camera?.x||0));
    const cy=Math.max(-.78,Math.min(.78,camera?.y||0));
    const cz=camera?.z||0;
    const travel=time*(zen?2.35:.40)+cz*24;
    const eyeX=Math.sin(time*.035)*1.7+cx*7.6;
    const eyeY=7.7+cy*4.9+Math.sin(time*.041)*.32;
    const eye=[eyeX,eyeY,15.2];
    const target=[eyeX+cx*.8,eyeY-1.9+cy*.28,-49];
    perspective(projection,zen ? .91 : 1.0,cssWidth/cssHeight,.12,610);
    lookAt(view,eye,target,[0,1,0]);multiply(vp,projection,view);

    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);gl.bindVertexArray(skyVao);
    gl.uniform1f(uniforms.sky.time,time);gl.uniform1f(uniforms.sky.aspect,cssWidth/cssHeight);gl.uniform1f(uniforms.sky.zen,zen?1:0);
    gl.drawArrays(gl.TRIANGLES,0,3);

    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(groundProgram);gl.bindVertexArray(groundVao);
    gl.uniformMatrix4fv(uniforms.ground.vp,false,vp);gl.uniform3f(uniforms.ground.camera,...eye);gl.uniform1f(uniforms.ground.time,time);
    gl.drawElements(gl.TRIANGLES,terrain.indices.length,gl.UNSIGNED_INT,0);

    gl.useProgram(riverProgram);gl.bindVertexArray(riverVao);
    gl.uniformMatrix4fv(uniforms.river.vp,false,vp);gl.uniform3f(uniforms.river.camera,...eye);gl.uniform1f(uniforms.river.time,time);
    gl.drawElements(gl.TRIANGLES,river.indices.length,gl.UNSIGNED_INT,0);

    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    gl.useProgram(trunkProgram);gl.bindVertexArray(trunkVao);
    gl.uniformMatrix4fv(uniforms.trunk.vp,false,vp);gl.uniform1f(uniforms.trunk.travel,travel);gl.uniform1f(uniforms.trunk.span,forest.span);gl.uniform1f(uniforms.trunk.time,time);gl.uniform3f(uniforms.trunk.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,trunkGeo.positions.length/3,forest.trunkCount);

    gl.useProgram(leafProgram);gl.bindVertexArray(leafVao);
    gl.uniformMatrix4fv(uniforms.leaf.vp,false,vp);gl.uniform1f(uniforms.leaf.travel,travel);gl.uniform1f(uniforms.leaf.span,forest.span);gl.uniform1f(uniforms.leaf.time,time);gl.uniform3f(uniforms.leaf.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,leafGeo.positions.length/3,forest.crownCount);

    gl.disable(gl.CULL_FACE);gl.bindVertexArray(null);
  }

  return {
    resize,
    draw({time,width,height,camera}){
      if(disposed)return;
      if(width!==cssWidth||height!==cssHeight)resize({width,height,ratio:window.devicePixelRatio||1});
      renderWorld(time,camera);
      airLeaves.draw(ctx,time,width,height,Boolean(camera));

      const mist=ctx.createLinearGradient(0,height*.28,0,height*.82);
      mist.addColorStop(0,"rgba(236,202,153,0)");
      mist.addColorStop(.48,"rgba(232,194,140,.055)");
      mist.addColorStop(.70,"rgba(104,79,52,.035)");
      mist.addColorStop(1,"rgba(30,22,15,.12)");
      ctx.fillStyle=mist;ctx.fillRect(0,0,width,height);

      if(!camera){
        const veil=ctx.createLinearGradient(0,0,0,height);
        veil.addColorStop(0,"rgba(28,19,12,.08)");
        veil.addColorStop(.48,"rgba(22,15,10,.13)");
        veil.addColorStop(1,"rgba(14,10,7,.38)");
        ctx.fillStyle=veil;ctx.fillRect(0,0,width,height);
      }
    },
    dispose(){
      disposed=true;canvas.remove();style.remove();sound.dispose();
      try{
        for(const p of [skyProgram,trunkProgram,leafProgram,groundProgram,riverProgram])gl.deleteProgram(p);
        for(const r of resources){
          if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);
          else gl.deleteBuffer(r);
        }
      }catch{}
    }
  };
}

export default {
  id:"amber-forest",
  renderer:"webgl-autumn-forest",
  particles:false,
  marks:false,
  flightCards:true,
  autoFlightCards:true,
  continuousDepth:true,
  flightBounds:{x:1.08,y:.78},
  accent:"#f2b45b",
  dim:"#dbc9b4",
  surface:"34,23,15",
  panel:{bg:"rgba(48,31,20,.56)",border:"rgba(244,193,117,.27)",glow:"rgba(232,143,52,.17)",text:"#fff7e8",muted:"#dbc9b4"},
  radius:"26px",
  buttonRadius:"26px",
  heading:'"Cormorant Garamond", Georgia, serif',
  body:'"Nunito", system-ui, sans-serif',
  colors:["#f2b45b","#d96b2f","#a83f20","#8f7c2b"],
  backgrounds:[
    "radial-gradient(ellipse at 72% 20%,rgba(248,166,65,.40),transparent 42%),radial-gradient(ellipse at 20% 15%,rgba(121,94,63,.32),transparent 56%)",
    "radial-gradient(ellipse at 55% 42%,rgba(210,117,39,.16),transparent 54%)",
    "linear-gradient(to bottom,rgba(72,56,42,.16),rgba(25,18,12,.48))"
  ],
  soundscape:SOUND,
  createRenderer
};
