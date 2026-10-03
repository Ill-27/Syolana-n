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
  float horizon=.40;
  vec3 top=vec3(.28,.48,.61);
  vec3 upper=vec3(.55,.69,.72);
  vec3 haze=vec3(.88,.82,.68);
  vec3 sunlight=vec3(1.0,.78,.39);
  vec3 col=mix(haze,mix(upper,top,smoothstep(.60,1.0,uv.y)),smoothstep(horizon,1.0,uv.y));
  float sun=exp(-pow((uv.x-.72)*6.2,2.0)-pow((uv.y-.69)*8.8,2.0));
  float halo=exp(-pow((uv.x-.72)*2.55,2.0)-pow((uv.y-.69)*3.9,2.0));
  col+=sunlight*sun*.86+sunlight*halo*.10;
  vec2 p=vec2((uv.x-.5)*uAspect*3.0,uv.y*3.0)+vec2(uTime*.0036,-uTime*.0010);
  float low=cloud(p),high=cloud(p*.57+vec2(3.1,-2.0));
  float lowMask=smoothstep(.40,.48,uv.y)*(1.0-smoothstep(.62,.73,uv.y));
  float highMask=smoothstep(.57,.66,uv.y)*(1.0-smoothstep(.89,.98,uv.y));
  float d1=smoothstep(.54,.72,low)*lowMask,d2=smoothstep(.56,.74,high)*highMask;
  vec3 cloudShadow=vec3(.56,.58,.55),cloudBody=vec3(.85,.84,.76),cloudLight=vec3(.99,.94,.81);
  vec3 lowCol=mix(cloudShadow,cloudBody,smoothstep(.54,.70,low));
  lowCol=mix(lowCol,cloudLight,sun*.34);
  col=mix(col,lowCol,d1*.42);
  col=mix(col,vec3(.88,.88,.82),d2*.14);
  float mist=exp(-pow((uv.y-horizon)*30.0,2.0));
  col=mix(col,vec3(.92,.82,.66),mist*(.22+.05*uZen));
  col*=1.0-.08*pow(length((uv-.5)*vec2(.80,1.0)),1.72);
  outColor=vec4(col,1.0);
}`;

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

const LEAF_POINT_VS=`#version 300 es
layout(location=0) in vec3 iOffset;
layout(location=1) in vec4 iMeta;
uniform mat4 uViewProj;
uniform float uTravel;
uniform float uSpanZ;
uniform float uSpanX;
uniform float uTime;
uniform vec3 uCamera;
out float vTone;
out float vType;
out float vPhase;
out float vSun;
out float vDistance;
void main(){
  float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;
  float z=mod(iOffset.z+uTravel,uSpanZ)-uSpanZ;
  float phase=iMeta.z;
  float hf=clamp((iOffset.y-2.0)/17.0,0.0,1.0);
  float gust=sin(uTime*.82+phase)+.45*sin(uTime*.39+phase*1.71);
  x+=gust*(.20+.38*hf);
  z+=sin(uTime*.53+phase*1.17)*(.07+.18*hf);
  vec3 world=vec3(x,iOffset.y,z);
  vec4 clip=uViewProj*vec4(world,1.0);
  gl_Position=clip;
  float dist=max(1.0,distance(world,uCamera));
  gl_PointSize=clamp(iMeta.w*(260.0/max(8.0,clip.w)),1.35,18.0);
  vTone=iMeta.x;vType=iMeta.y;vPhase=phase;vDistance=dist;
  vSun=.5+.5*sin(uTime*.72+phase*2.37+world.x*.035);
}`;

const LEAF_POINT_FS=`#version 300 es
precision highp float;
in float vTone;
in float vType;
in float vPhase;
in float vSun;
in float vDistance;
out vec4 outColor;
float mapleMask(vec2 p){
  p.y*=1.05;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.58+.16*cos(5.0*a)+.07*cos(10.0*a);
  float stem=(1.0-smoothstep(.08,.15,abs(p.x)))*(1.0-smoothstep(-.98,-.48,p.y));
  float leaf=1.0-smoothstep(lobes-.045,lobes+.035,r);
  return max(leaf,stem*.72);
}
float birchMask(vec2 p){
  float r=pow(abs(p.x)*1.20,2.15)+pow(abs(p.y)*.88,2.05);
  return 1.0-smoothstep(.82,1.03,r);
}
float oakMask(vec2 p){
  p.y*=.88;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.56+.10*cos(4.0*a)+.06*cos(8.0*a);
  return 1.0-smoothstep(lobes-.05,lobes+.035,r);
}
void main(){
  vec2 p=gl_PointCoord*2.0-1.0;
  float ang=vPhase*.37;
  mat2 rot=mat2(cos(ang),-sin(ang),sin(ang),cos(ang));
  p=rot*p;
  float mask=vType<.5?mapleMask(p):(vType<1.5?birchMask(p):oakMask(p));
  if(mask<.08)discard;
  vec3 yellow=vec3(1.00,.70,.16),gold=vec3(.95,.48,.075),orange=vec3(.88,.25,.045),scarlet=vec3(.66,.095,.035),olive=vec3(.43,.40,.075);
  vec3 col=vTone<.24?mix(yellow,gold,vTone/.24):
           vTone<.53?mix(gold,orange,(vTone-.24)/.29):
           vTone<.80?mix(orange,scarlet,(vTone-.53)/.27):
           mix(scarlet,olive,(vTone-.80)/.20);
  float edge=smoothstep(.0,.22,mask);
  float vein=exp(-abs(p.x)*17.0)*(.10+.18*(1.0-abs(p.y)));
  col*=.82+.22*edge;
  col+=vec3(.25,.13,.035)*vein;
  float sparkle=pow(max(0.0,vSun),7.0)*(.18+.36*(1.0-abs(p.y)));
  col+=vec3(1.0,.63,.20)*sparkle;
  float fog=smoothstep(85.0,330.0,vDistance);
  col=mix(col,vec3(.75,.66,.51),fog*.92);
  float alpha=mask*(1.0-smoothstep(250.0,355.0,vDistance));
  outColor=vec4(col,alpha);
}`;

function buildForest(){
  const rnd=seeded(91277),spanZ=560,spanX=190,trunks=[],leaves=[];
  const addTree=(x,z)=>{
    const base=-.55+.18*Math.sin(x*.047)+.10*Math.sin(z*.031+x*.018);
    const h=8.8+rnd()*13.5,radius=.38+rnd()*.48,tone=rnd(),phase=rnd()*TAU;
    trunks.push(x,base+h*.5,z,radius*2,h,radius*2,tone,phase);
    const crownY=base+h*(.74+rnd()*.08),crownR=3.5+rnd()*2.8;
    const leafCount=42+Math.floor(rnd()*36);
    for(let i=0;i<leafCount;i++){
      const theta=rnd()*TAU,phi=Math.acos(2*rnd()-1),rr=Math.pow(rnd(),.54);
      const ex=Math.sin(phi)*Math.cos(theta)*crownR*(.92+rnd()*.20);
      const ey=Math.cos(phi)*crownR*(.70+rnd()*.16);
      const ez=Math.sin(phi)*Math.sin(theta)*crownR*(.92+rnd()*.20);
      const localTone=Math.max(0,Math.min(1,tone+(rnd()-.5)*.34));
      const q=rnd(),type=q<.42?0:(q<.70?1:2);
      leaves.push(x+ex,crownY+ey,z+ez,localTone,type,phase+rnd()*TAU,.72+rnd()*1.30);
    }
    const wisps=9+Math.floor(rnd()*8);
    for(let i=0;i<wisps;i++){
      const a=rnd()*TAU,rr=crownR*(.72+rnd()*.55);
      const localTone=Math.max(0,Math.min(1,tone+(rnd()-.5)*.42));
      const q=rnd();
      leaves.push(x+Math.cos(a)*rr,crownY+crownR*(.35+rnd()*.62),z+Math.sin(a)*rr,localTone,q<.48?0:(q<.74?1:2),phase+rnd()*TAU,.66+rnd()*1.1);
    }
  };
  for(let z=8;z<spanZ;z+=9.8+rnd()*4.0){
    const rows=4+Math.floor(rnd()*3);
    for(let j=0;j<rows;j++)addTree(-spanX*.48+rnd()*spanX*.96,z+rnd()*7);
  }
  return {spanZ,spanX,trunks:new Float32Array(trunks),trunkCount:trunks.length/8,leaves:new Float32Array(leaves),leafCount:leaves.length/7};
}

function makeAirLeafSprites(){
  const make=(kind,top,bottom)=>{
    const c=document.createElement("canvas");c.width=96;c.height=96;
    const x=c.getContext("2d");x.translate(48,46);
    const g=x.createLinearGradient(-26,-28,25,32);g.addColorStop(0,top);g.addColorStop(1,bottom);
    x.fillStyle=g;x.strokeStyle="rgba(82,39,14,.34)";x.lineWidth=1.2;x.beginPath();
    if(kind==="maple"){
      x.moveTo(0,-38);x.lineTo(8,-19);x.lineTo(25,-29);x.lineTo(20,-9);x.lineTo(38,-5);x.lineTo(20,7);x.lineTo(24,27);x.lineTo(5,18);x.lineTo(0,37);
      x.lineTo(-5,18);x.lineTo(-24,27);x.lineTo(-20,7);x.lineTo(-38,-5);x.lineTo(-20,-9);x.lineTo(-25,-29);x.lineTo(-8,-19);x.closePath();
    }else if(kind==="oak"){
      x.moveTo(0,-35);x.bezierCurveTo(18,-29,13,-20,26,-14);x.bezierCurveTo(13,-7,25,4,15,9);x.bezierCurveTo(7,15,12,26,0,34);
      x.bezierCurveTo(-12,26,-7,15,-15,9);x.bezierCurveTo(-25,4,-13,-7,-26,-14);x.bezierCurveTo(-13,-20,-18,-29,0,-35);x.closePath();
    }else{
      x.moveTo(0,-37);x.bezierCurveTo(27,-21,26,14,0,35);x.bezierCurveTo(-26,14,-27,-21,0,-37);x.closePath();
    }
    x.fill();x.stroke();
    x.strokeStyle="rgba(91,49,18,.36)";x.beginPath();x.moveTo(0,-31);x.lineTo(0,42);x.stroke();
    x.globalAlpha=.46;x.strokeStyle="rgba(255,223,135,.48)";x.beginPath();x.moveTo(-2,-12);x.lineTo(-17,-4);x.moveTo(2,2);x.lineTo(17,10);x.stroke();
    return c;
  };
  return [make("maple","#ffd768","#b94b1e"),make("oval","#f6c24f","#9e381b"),make("oak","#e79b34","#7b2a17"),make("maple","#d86b2f","#7d2b17"),make("oval","#d5bd45","#6f7024")];
}

function createAirLeaves(){
  const rnd=seeded(22771),sprites=makeAirLeafSprites();
  const leaves=Array.from({length:44},()=>({x:rnd()*1.18-.09,y:rnd()*1.24-.16,depth:.28+rnd()*.92,vy:.012+rnd()*.022,vx:(rnd()-.5)*.018,spin:(rnd()-.5)*1.25,phase:rnd()*TAU,sprite:Math.floor(rnd()*sprites.length)}));
  let last=0;
  return {
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      const dt=last?Math.min(.05,time-last):1/30;last=time;
      const count=zen?leaves.length:30,sunX=width*.72,sunY=height*.29;
      for(let i=0;i<count;i++){
        const l=leaves[i];l.y+=l.vy*dt*(zen?1.10:.82);l.x+=(l.vx+Math.sin(time*.38+l.phase)*.010)*dt;
        if(l.y>1.12||l.x>1.14||l.x<-.14){l.y=-.14-rnd()*.24;l.x=.02+rnd()*.96;l.depth=.28+rnd()*.92;l.sprite=Math.floor(rnd()*sprites.length)}
        const px=l.x*width,py=l.y*height,s=(8+24*l.depth)*(zen?1.05:.93);
        const shimmer=Math.max(0,1-Math.hypot(px-sunX,py-sunY)/Math.max(width,height)*2.2)*(.25+.75*(.5+.5*Math.sin(time*1.7+l.phase)));
        ctx.save();ctx.translate(px,py);ctx.rotate(time*l.spin+l.phase);ctx.globalAlpha=.22+.58*l.depth;
        ctx.shadowColor=`rgba(255,190,76,\${.10+.24*shimmer})`;ctx.shadowBlur=3+9*shimmer;
        ctx.drawImage(sprites[l.sprite],-s/2,-s/2,s,s);
        if(shimmer>.32){ctx.globalCompositeOperation="screen";ctx.globalAlpha=shimmer*.20;ctx.fillStyle="#ffd98a";ctx.beginPath();ctx.ellipse(-s*.08,-s*.14,s*.13,s*.07,-.5,0,TAU);ctx.fill()}
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
    {src:"audio-library/ambience/deep_forest.ogg",fallback:"audio-library/compatible/ambience/deep_forest.m4a",volume:.060},
    {src:"audio-library/ambience/park_path.ogg",fallback:"audio-library/compatible/ambience/park_path.m4a",volume:.045}
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
  const sprites=makeAirLeafSprites();
  return {
    resize(){},
    draw({time,width,height,camera}){
      const zen=Boolean(camera);
      const g=ctx.createLinearGradient(0,0,0,height);
      g.addColorStop(0,"#5f8290");g.addColorStop(.40,"#d8bd82");g.addColorStop(.59,"#8b6235");g.addColorStop(1,"#21160d");
      ctx.fillStyle=g;ctx.fillRect(0,0,width,height);
      const horizon=height*.55;
      for(let i=0;i<64;i++){
        const z=((i*53+time*(zen?23:5))%1000)/1000,scale=.10+z*1.22,x=((i*83.1)%(width*1.6))-width*.3,h=(48+(i%8)*8)*scale;
        ctx.fillStyle="#4b2813";ctx.fillRect(x-1.4*scale,horizon-h*.52,2.8*scale,h*.52);
        for(let j=0;j<5;j++){const ox=(j-2)*8*scale,oy=(j%2)*8*scale;ctx.globalAlpha=.76;ctx.drawImage(sprites[j%sprites.length],x+ox-10*scale,horizon-h-oy-10*scale,20*scale,20*scale)}
      }
      ctx.globalAlpha=1;
      const sun=ctx.createRadialGradient(width*.72,height*.28,4,width*.72,height*.28,width*.30);
      sun.addColorStop(0,"rgba(255,218,126,.55)");sun.addColorStop(1,"rgba(255,218,126,0)");
      ctx.fillStyle=sun;ctx.fillRect(0,0,width,height);
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
  style.textContent='html[data-theme="amber-forest"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="amber-forest"] .flight-hint{color:#fff0d8;opacity:.82}html[data-theme="amber-forest"] .theme-sound-toggle[data-enabled="true"]{color:#fff3d5;box-shadow:0 0 0 1px #ffd89566,0 0 30px #efaa463d}';
  document.head.append(style);
  const sound=createThemeSound();
  const gl=canvas.getContext("webgl2",{alpha:false,antialias:true,depth:true,stencil:false,powerPreference:"high-performance",preserveDrawingBuffer:false});
  if(!gl){canvas.remove();const fallback=fallbackRenderer(ctx),base=fallback.dispose;fallback.dispose=()=>{base?.();style.remove();sound.dispose()};return fallback}

  const GROUND_VS_LOCAL=`#version 300 es
  layout(location=0) in vec2 aPosition;
  uniform mat4 uViewProj;
  uniform vec3 uCamera;
  uniform float uTravel;
  out vec3 vWorld;
  void main(){
    float x=aPosition.x+uCamera.x;
    float z=aPosition.y;
    float y=-.62+.12*sin((x+uTravel*.04)*.055)+.08*sin((z-uTravel)*.032+x*.018);
    vWorld=vec3(x,y,z);
    gl_Position=uViewProj*vec4(vWorld,1.0);
  }`;
  const GROUND_FS_LOCAL=`#version 300 es
  precision highp float;
  in vec3 vWorld;
  out vec4 outColor;
  uniform vec3 uCamera;
  uniform float uTravel;
  void main(){
    float leaf=.5+.5*sin((vWorld.x+uTravel*.07)*.41+sin((vWorld.z-uTravel)*.16)*1.6);
    float leaf2=.5+.5*sin((vWorld.z-uTravel)*.28-vWorld.x*.19);
    float moss=.5+.5*sin(vWorld.x*.12+vWorld.z*.07);
    vec3 soil=vec3(.12,.073,.032),green=vec3(.24,.23,.065),ochre=vec3(.53,.245,.052),rust=vec3(.49,.115,.035);
    vec3 col=mix(soil,green,.22+.16*moss);
    col=mix(col,ochre,(.16+.22*leaf)*leaf2);col=mix(col,rust,.11*(1.0-leaf2));
    col*=.72+.20*(.5+.5*sin(vWorld.x*.035-vWorld.z*.021));
    float fog=smoothstep(90.0,350.0,distance(vWorld,uCamera));
    col=mix(col,vec3(.73,.64,.49),fog*.93);
    outColor=vec4(col,1.0);
  }`;

  let skyProgram,trunkProgram,leafProgram,groundProgram;
  try{
    const trunkVs=TRUNK_VS
      .replace("uniform float uSpan;","uniform float uSpanZ;\\nuniform float uSpanX;")
      .replace("float z=mod(iOffset.z+uTravel,uSpan)-uSpan;","float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;\\n  float z=mod(iOffset.z+uTravel,uSpanZ)-uSpanZ;")
      .replace("vec3 world=vec3(iOffset.x+iScale.y*sway,iOffset.y,z)+local*iScale;","vec3 world=vec3(x+iScale.y*sway,iOffset.y,z)+local*iScale;");
    skyProgram=program(gl,SKY_VS,SKY_FS);trunkProgram=program(gl,trunkVs,TRUNK_FS);leafProgram=program(gl,LEAF_POINT_VS,LEAF_POINT_FS);groundProgram=program(gl,GROUND_VS_LOCAL,GROUND_FS_LOCAL);
  }catch(error){
    console.warn("Amber Forest WebGL unavailable",error);canvas.remove();
    const fallback=fallbackRenderer(ctx),base=fallback.dispose;fallback.dispose=()=>{base?.();style.remove();sound.dispose()};return fallback;
  }

  const resources=[],keep=(x)=>{if(x)resources.push(x);return x};
  const skyVao=keep(gl.createVertexArray()),skyBuffer=keep(gl.createBuffer());
  gl.bindVertexArray(skyVao);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const skyLoc=gl.getAttribLocation(skyProgram,"aPosition");gl.enableVertexAttribArray(skyLoc);gl.vertexAttribPointer(skyLoc,2,gl.FLOAT,false,0,0);

  const forest=buildForest(),trunkGeo=prismGeometry(7);
  const trunkVao=keep(gl.createVertexArray());gl.bindVertexArray(trunkVao);
  const tp=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,tp);gl.bufferData(gl.ARRAY_BUFFER,trunkGeo.positions,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,0,0);
  const tn=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,tn);gl.bufferData(gl.ARRAY_BUFFER,trunkGeo.normals,gl.STATIC_DRAW);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,0,0);
  const ti=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,ti);gl.bufferData(gl.ARRAY_BUFFER,forest.trunks,gl.STATIC_DRAW);
  const ts=8*4;
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,3,gl.FLOAT,false,ts,0);gl.vertexAttribDivisor(2,1);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,3,gl.FLOAT,false,ts,3*4);gl.vertexAttribDivisor(3,1);
  gl.enableVertexAttribArray(4);gl.vertexAttribPointer(4,1,gl.FLOAT,false,ts,6*4);gl.vertexAttribDivisor(4,1);
  gl.enableVertexAttribArray(5);gl.vertexAttribPointer(5,1,gl.FLOAT,false,ts,7*4);gl.vertexAttribDivisor(5,1);

  const leafVao=keep(gl.createVertexArray());gl.bindVertexArray(leafVao);
  const lb=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,lb);gl.bufferData(gl.ARRAY_BUFFER,forest.leaves,gl.STATIC_DRAW);
  const ls=7*4;gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,3,gl.FLOAT,false,ls,0);gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,4,gl.FLOAT,false,ls,3*4);

  const terrain=terrainGeometry(64,116);
  const groundVao=keep(gl.createVertexArray());gl.bindVertexArray(groundVao);
  const gp=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,gp);gl.bufferData(gl.ARRAY_BUFFER,terrain.vertices,gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const gi=keep(gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,gi);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,terrain.indices,gl.STATIC_DRAW);gl.bindVertexArray(null);

  const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16);
  let cssWidth=1,cssHeight=1,disposed=false;
  const airLeaves=createAirLeaves();
  const uniforms={
    sky:{time:gl.getUniformLocation(skyProgram,"uTime"),aspect:gl.getUniformLocation(skyProgram,"uAspect"),zen:gl.getUniformLocation(skyProgram,"uZen")},
    trunk:{vp:gl.getUniformLocation(trunkProgram,"uViewProj"),travel:gl.getUniformLocation(trunkProgram,"uTravel"),spanZ:gl.getUniformLocation(trunkProgram,"uSpanZ"),spanX:gl.getUniformLocation(trunkProgram,"uSpanX"),time:gl.getUniformLocation(trunkProgram,"uTime"),camera:gl.getUniformLocation(trunkProgram,"uCamera")},
    leaf:{vp:gl.getUniformLocation(leafProgram,"uViewProj"),travel:gl.getUniformLocation(leafProgram,"uTravel"),spanZ:gl.getUniformLocation(leafProgram,"uSpanZ"),spanX:gl.getUniformLocation(leafProgram,"uSpanX"),time:gl.getUniformLocation(leafProgram,"uTime"),camera:gl.getUniformLocation(leafProgram,"uCamera")},
    ground:{vp:gl.getUniformLocation(groundProgram,"uViewProj"),camera:gl.getUniformLocation(groundProgram,"uCamera"),travel:gl.getUniformLocation(groundProgram,"uTravel")}
  };

  function resize({width,height,ratio=1}){
    cssWidth=Math.max(1,width);cssHeight=Math.max(1,height);
    const q=Math.min(ratio,cssWidth<=760?1.13:1.52),w=Math.max(1,Math.round(cssWidth*q)),h=Math.max(1,Math.round(cssHeight*q));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  }

  function renderWorld(time,camera){
    const zen=Boolean(camera),cx=camera?.x||0,cy=Math.max(-.82,Math.min(.82,camera?.y||0)),cz=camera?.z||0;
    const worldX=cx*27.0+Math.sin(time*.030)*1.6,travel=time*(zen?2.15:.38)+cz*23.0,eyeY=6.9+cy*4.7+Math.sin(time*.039)*.24;
    const eye=[worldX,eyeY,15.2],target=[worldX+Math.sin(time*.021)*.65,eyeY-1.35+cy*.22,-49];
    perspective(projection,zen ? .93 : 1.01,cssWidth/cssHeight,.12,620);lookAt(view,eye,target,[0,1,0]);multiply(vp,projection,view);

    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);gl.bindVertexArray(skyVao);gl.uniform1f(uniforms.sky.time,time);gl.uniform1f(uniforms.sky.aspect,cssWidth/cssHeight);gl.uniform1f(uniforms.sky.zen,zen?1:0);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(groundProgram);gl.bindVertexArray(groundVao);gl.uniformMatrix4fv(uniforms.ground.vp,false,vp);gl.uniform3f(uniforms.ground.camera,...eye);gl.uniform1f(uniforms.ground.travel,travel);gl.drawElements(gl.TRIANGLES,terrain.indices.length,gl.UNSIGNED_INT,0);

    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.useProgram(trunkProgram);gl.bindVertexArray(trunkVao);
    gl.uniformMatrix4fv(uniforms.trunk.vp,false,vp);gl.uniform1f(uniforms.trunk.travel,travel);gl.uniform1f(uniforms.trunk.spanZ,forest.spanZ);gl.uniform1f(uniforms.trunk.spanX,forest.spanX);gl.uniform1f(uniforms.trunk.time,time);gl.uniform3f(uniforms.trunk.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,trunkGeo.positions.length/3,forest.trunkCount);

    gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    gl.useProgram(leafProgram);gl.bindVertexArray(leafVao);gl.uniformMatrix4fv(uniforms.leaf.vp,false,vp);gl.uniform1f(uniforms.leaf.travel,travel);gl.uniform1f(uniforms.leaf.spanZ,forest.spanZ);gl.uniform1f(uniforms.leaf.spanX,forest.spanX);gl.uniform1f(uniforms.leaf.time,time);gl.uniform3f(uniforms.leaf.camera,...eye);
    gl.drawArrays(gl.POINTS,0,forest.leafCount);gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
  }

  return {
    resize,
    draw({time,width,height,camera}){
      if(disposed)return;if(width!==cssWidth||height!==cssHeight)resize({width,height,ratio:window.devicePixelRatio||1});
      renderWorld(time,camera);airLeaves.draw(ctx,time,width,height,Boolean(camera));
      const sun=ctx.createRadialGradient(width*.72,height*.22,4,width*.72,height*.22,Math.max(width,height)*.46);
      sun.addColorStop(0,"rgba(255,224,144,.20)");sun.addColorStop(.32,"rgba(255,186,78,.075)");sun.addColorStop(1,"rgba(255,186,78,0)");ctx.fillStyle=sun;ctx.fillRect(0,0,width,height);
      if(!camera){const veil=ctx.createLinearGradient(0,0,0,height);veil.addColorStop(0,"rgba(26,20,13,.025)");veil.addColorStop(.55,"rgba(22,15,9,.09)");veil.addColorStop(1,"rgba(14,10,6,.30)");ctx.fillStyle=veil;ctx.fillRect(0,0,width,height)}
    },
    dispose(){
      disposed=true;canvas.remove();style.remove();sound.dispose();
      try{for(const p of [skyProgram,trunkProgram,leafProgram,groundProgram])gl.deleteProgram(p);for(const r of resources){if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);else gl.deleteBuffer(r)}}catch{}
    }
  };
}

export default {
  id:"amber-forest",
  renderer:"webgl-infinite-autumn-forest",
  particles:false,
  marks:false,
  flightCards:true,
  autoFlightCards:true,
  continuousDepth:true,
  flightBounds:{y:.82},
  accent:"#f2b45b",
  dim:"#dbc9b4",
  surface:"34,23,15",
  panel:{bg:"rgba(48,31,20,.56)",border:"rgba(244,193,117,.27)",glow:"rgba(232,143,52,.17)",text:"#fff7e8",muted:"#dbc9b4"},
  radius:"26px",
  buttonRadius:"26px",
  heading:'"Cormorant Garamond", Georgia, serif',
  body:'"Nunito", system-ui, sans-serif',
  colors:["#ffd15c","#ee8d31","#c84d26","#8f8b2f"],
  backgrounds:[
    "radial-gradient(ellipse at 72% 20%,rgba(248,166,65,.40),transparent 42%),radial-gradient(ellipse at 20% 15%,rgba(121,94,63,.32),transparent 56%)",
    "radial-gradient(ellipse at 55% 42%,rgba(210,117,39,.16),transparent 54%)",
    "linear-gradient(to bottom,rgba(72,56,42,.16),rgba(25,18,12,.48))"
  ],
  soundscape:SOUND,
  createRenderer
};
