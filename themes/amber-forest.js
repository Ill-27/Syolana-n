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

const LEAF_VS=`#version 300 es
layout(location=0) in vec2 aCorner;
layout(location=1) in vec3 iOffset;
layout(location=2) in vec4 iMeta;
layout(location=3) in float iAngle;
uniform mat4 uViewProj;
uniform float uTravel;
uniform float uSpanZ;
uniform float uSpanX;
uniform float uTime;
uniform vec3 uCamera;
out vec2 vLeaf;
out float vTone;
out float vType;
out float vPhase;
out float vSun;
out float vDistance;
void main(){
  float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;
  float z=mod(iOffset.z+uTravel,uSpanZ)-uSpanZ;
  float phase=iMeta.z;
  float size=iMeta.w;
  float heightFactor=clamp((iOffset.y-1.5)/18.0,0.0,1.0);
  float gust=sin(uTime*.72+phase)+.42*sin(uTime*.31+phase*1.73);
  float angle=iAngle+gust*.16;
  float ca=cos(angle),sa=sin(angle);
  vec2 q=vec2(aCorner.x*ca-aCorner.y*sa,aCorner.x*sa+aCorner.y*ca);
  float flutter=sin(uTime*1.35+phase*2.1+aCorner.x*2.4)*.16;
  vec3 world=vec3(
    x+gust*(.12+.22*heightFactor)+q.x*size,
    iOffset.y+q.y*size,
    z+flutter*size*.42+sin(uTime*.47+phase)*.07
  );
  gl_Position=uViewProj*vec4(world,1.0);
  vLeaf=aCorner;
  vTone=iMeta.x;vType=iMeta.y;vPhase=phase;
  vDistance=distance(world,uCamera);
  vSun=.5+.5*sin(uTime*.58+phase*2.13+world.x*.025+world.y*.14);
}`;

const LEAF_FS=`#version 300 es
precision highp float;
in vec2 vLeaf;
in float vTone;
in float vType;
in float vPhase;
in float vSun;
in float vDistance;
out vec4 outColor;

float mapleMask(vec2 p){
  p.y*=1.02;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.58+.18*cos(5.0*a)+.065*cos(10.0*a);
  float leaf=1.0-smoothstep(lobes-.038,lobes+.030,r);
  float stem=(1.0-smoothstep(.045,.095,abs(p.x)))*(1.0-smoothstep(-.98,-.52,p.y));
  return max(leaf,stem*.72);
}
float birchMask(vec2 p){
  p.y+=.02;
  float r=pow(abs(p.x)*1.32,2.18)+pow(abs(p.y)*.91,2.05);
  float tip=1.0-smoothstep(.72,1.02,r);
  return tip;
}
float oakMask(vec2 p){
  p.y*=.91;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.55+.105*cos(4.0*a)+.052*cos(8.0*a)+.025*cos(12.0*a);
  return 1.0-smoothstep(lobes-.040,lobes+.032,r);
}
float beechMask(vec2 p){
  float r=pow(abs(p.x)*1.14,2.0)+pow(abs(p.y)*.95,2.22);
  return 1.0-smoothstep(.80,1.01,r);
}
void main(){
  vec2 p=vLeaf;
  float mask=vType<.5?mapleMask(p):(vType<1.5?birchMask(p):(vType<2.5?oakMask(p):beechMask(p)));
  if(mask<.07)discard;

  vec3 yellow=vec3(1.00,.73,.18);
  vec3 gold=vec3(.98,.54,.09);
  vec3 orange=vec3(.91,.29,.055);
  vec3 scarlet=vec3(.69,.105,.035);
  vec3 olive=vec3(.49,.44,.085);
  vec3 col=vTone<.22?mix(yellow,gold,vTone/.22):
           vTone<.50?mix(gold,orange,(vTone-.22)/.28):
           vTone<.78?mix(orange,scarlet,(vTone-.50)/.28):
           mix(scarlet,olive,(vTone-.78)/.22);

  float edge=1.0-smoothstep(.72,1.02,length(p));
  float midrib=exp(-abs(p.x)*23.0)*(.08+.22*(1.0-abs(p.y)));
  float sideVeins=(.5+.5*sin((abs(p.y)*9.0+abs(p.x)*5.5)*3.14159))*exp(-abs(p.x)*3.0)*.055;
  float translucency=.08+.18*max(0.0,vSun);
  col*=.78+.28*edge;
  col+=vec3(.28,.13,.035)*(midrib+sideVeins);
  col+=vec3(1.0,.64,.20)*pow(max(0.0,vSun),6.0)*(.12+.28*edge);
  col=mix(col,vec3(1.0,.72,.28),translucency*max(0.0,-p.y));

  float fog=smoothstep(95.0,360.0,vDistance);
  col=mix(col,vec3(.77,.68,.53),fog*.93);
  float alpha=mask*(1.0-smoothstep(285.0,390.0,vDistance));
  outColor=vec4(col,alpha);
}`;

function buildForest(){
  const rnd=seeded(91277),spanZ=620,spanX=260,trunks=[],leaves=[];
  const addLeaf=(x,y,z,tone,type,phase,size,angle)=>{
    leaves.push(x,y,z,tone,type,phase,size,angle);
  };
  const addTree=(x,z)=>{
    const base=-.58+.16*Math.sin(x*.043)+.11*Math.sin(z*.029+x*.017);
    const h=9.5+rnd()*14.8;
    const radius=.38+rnd()*.52;
    const tone=rnd();
    const phase=rnd()*TAU;
    trunks.push(x,base+h*.5,z,radius*2,h,radius*2,tone,phase);

    const crownBase=base+h*(.56+rnd()*.06);
    const crownTop=base+h*(.96+rnd()*.04);
    const branchCount=5+Math.floor(rnd()*3);
    const centers=[{x,y:crownTop-.8,z,r:2.6+rnd()*1.6}];

    for(let b=0;b<branchCount;b++){
      const a=b/branchCount*TAU+rnd()*.65;
      const reach=2.1+rnd()*3.4;
      const y=crownBase+(crownTop-crownBase)*(.25+rnd()*.66);
      centers.push({
        x:x+Math.cos(a)*reach,
        y,
        z:z+Math.sin(a)*reach,
        r:2.0+rnd()*1.85
      });
      // slim secondary stems make silhouettes less like poles with balls
      if(rnd()>.35){
        const sh=.20*h+rnd()*.15*h;
        trunks.push(
          x+Math.cos(a)*reach*.52,
          y-sh*.48,
          z+Math.sin(a)*reach*.52,
          radius*.44,radius*.44+sh,radius*.44,
          Math.min(1,tone+.08),
          phase+a
        );
      }
    }

    const totalLeaves=72+Math.floor(rnd()*48);
    for(let i=0;i<totalLeaves;i++){
      const c=centers[Math.floor(rnd()*centers.length)];
      const a=rnd()*TAU;
      const u=rnd()*2-1;
      const rr=Math.pow(rnd(),.56)*c.r;
      const radial=Math.sqrt(Math.max(0,1-u*u))*rr;
      const lx=c.x+Math.cos(a)*radial*(.88+rnd()*.22);
      const ly=c.y+u*rr*(.58+rnd()*.24);
      const lz=c.z+Math.sin(a)*radial*(.88+rnd()*.22);
      const localTone=Math.max(0,Math.min(1,tone+(rnd()-.5)*.38));
      const q=rnd();
      const type=q<.36?0:(q<.61?1:(q<.84?2:3));
      addLeaf(lx,ly,lz,localTone,type,phase+rnd()*TAU,.42+rnd()*.42,(rnd()-.5)*1.6);
    }

    // sparse outer leaves break the crown edge and create real depth
    const outer=18+Math.floor(rnd()*16);
    for(let i=0;i<outer;i++){
      const c=centers[Math.floor(rnd()*centers.length)];
      const a=rnd()*TAU,rr=c.r*(.88+rnd()*.55);
      const q=rnd(),type=q<.42?0:(q<.68?1:(q<.88?2:3));
      addLeaf(
        c.x+Math.cos(a)*rr,
        c.y+(rnd()-.45)*c.r*.95,
        c.z+Math.sin(a)*rr,
        Math.max(0,Math.min(1,tone+(rnd()-.5)*.44)),
        type,phase+rnd()*TAU,.38+rnd()*.40,(rnd()-.5)*1.8
      );
    }
  };

  for(let z=4;z<spanZ;z+=10.5+rnd()*4.2){
    const rows=5+Math.floor(rnd()*3);
    for(let j=0;j<rows;j++){
      let x=-spanX*.48+rnd()*spanX*.96;
      // soft clear pockets instead of a straight corridor/path
      const pocket=Math.sin(z*.027)*15+Math.sin(z*.011)*9;
      if(Math.abs(x-pocket)<8&&rnd()>.34)x+=x<pocket?-10:10;
      addTree(x,z+rnd()*8);
    }
  }
  return {
    spanZ,spanX,
    trunks:new Float32Array(trunks),
    trunkCount:trunks.length/8,
    leaves:new Float32Array(leaves),
    leafCount:leaves.length/8
  };
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
  const leaves=Array.from({length:92},()=>({x:rnd()*1.18-.09,y:rnd()*1.24-.16,depth:.28+rnd()*.92,vy:.050+rnd()*.060,vx:(rnd()-.5)*.028,spin:(rnd()-.5)*1.25,phase:rnd()*TAU,sprite:Math.floor(rnd()*sprites.length)}));
  let last=0;
  return {
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      const dt=last?Math.min(.05,time-last):1/30;last=time;
      const count=zen?leaves.length:62,sunX=width*.72,sunY=height*.22;
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
  const drifting=createAirLeaves();
  return {
    resize(){},
    draw({time,width,height,camera}){
      const zen=Boolean(camera);
      const camX=(camera?.x||0)*52;
      const g=ctx.createLinearGradient(0,0,0,height);
      g.addColorStop(0,"#6d94a0");
      g.addColorStop(.36,"#c6b382");
      g.addColorStop(.56,"#d39a50");
      g.addColorStop(1,"#2a1a10");
      ctx.fillStyle=g;
      ctx.fillRect(0,0,width,height);

      const sun=ctx.createRadialGradient(width*.72,height*.22,4,width*.72,height*.22,width*.34);
      sun.addColorStop(0,"rgba(255,235,162,.82)");
      sun.addColorStop(.25,"rgba(255,190,84,.24)");
      sun.addColorStop(1,"rgba(255,190,84,0)");
      ctx.fillStyle=sun;
      ctx.fillRect(0,0,width,height*.72);

      const horizon=height*.54;
      const layers=[
        {count:34,scale:.36,alpha:.32,y:horizon-18,parallax:.10},
        {count:28,scale:.62,alpha:.55,y:horizon+5,parallax:.22},
        {count:22,scale:1.00,alpha:.88,y:horizon+28,parallax:.42}
      ];

      for(let li=0;li<layers.length;li++){
        const layer=layers[li];
        for(let i=0;i<layer.count;i++){
          const raw=((i*97.3+li*41.7-camX*layer.parallax)%(width*1.65)+width*1.65)%(width*1.65);
          const x=raw-width*.32;
          const sway=Math.sin(time*.25+i*.91+li)*5*layer.scale;
          const base=layer.y+(i%4)*4*layer.scale;
          const trunkH=(60+(i%7)*12)*layer.scale;
          const trunkW=(4+(i%3))*layer.scale;
          ctx.globalAlpha=layer.alpha;
          ctx.fillStyle=li===2?"#5b3119":"#684225";
          ctx.fillRect(x-trunkW/2+sway*.12,base-trunkH,trunkW,trunkH);

          const crownY=base-trunkH;
          const leafCount=li===2?12:8;
          for(let j=0;j<leafCount;j++){
            const ang=j/leafCount*TAU+i*.37;
            const rr=(18+(j%3)*7)*layer.scale;
            const lx=x+sway+Math.cos(ang)*rr;
            const ly=crownY+Math.sin(ang)*rr*.62;
            const size=(22+(j%4)*5)*layer.scale;
            ctx.drawImage(
              sprites[(i+j+li)%sprites.length],
              lx-size/2,ly-size/2,size,size
            );
          }
        }
      }
      ctx.globalAlpha=1;

      const mist=ctx.createLinearGradient(0,horizon-80,0,horizon+100);
      mist.addColorStop(0,"rgba(248,222,178,0)");
      mist.addColorStop(.48,"rgba(248,222,178,.18)");
      mist.addColorStop(1,"rgba(248,222,178,0)");
      ctx.fillStyle=mist;
      ctx.fillRect(0,horizon-80,width,180);

      drifting.draw(ctx,time,width,height,zen);
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
    skyProgram=program(gl,SKY_VS,SKY_FS);trunkProgram=program(gl,trunkVs,TRUNK_FS);leafProgram=program(gl,LEAF_VS,LEAF_FS);groundProgram=program(gl,GROUND_VS_LOCAL,GROUND_FS_LOCAL);
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
  const leafQuad=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,leafQuad);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([
    -1,-1, 1,-1, 1,1,
    -1,-1, 1,1, -1,1
  ]),gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);

  const lb=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,lb);
  gl.bufferData(gl.ARRAY_BUFFER,forest.leaves,gl.STATIC_DRAW);
  const ls=8*4;
  gl.enableVertexAttribArray(1);gl.vertexAttribPointer(1,3,gl.FLOAT,false,ls,0);gl.vertexAttribDivisor(1,1);
  gl.enableVertexAttribArray(2);gl.vertexAttribPointer(2,4,gl.FLOAT,false,ls,3*4);gl.vertexAttribDivisor(2,1);
  gl.enableVertexAttribArray(3);gl.vertexAttribPointer(3,1,gl.FLOAT,false,ls,7*4);gl.vertexAttribDivisor(3,1);

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
    const q=Math.min(ratio,cssWidth<=760?1.14:1.52),w=Math.max(1,Math.round(cssWidth*q)),h=Math.max(1,Math.round(cssHeight*q));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  }

  function renderWorld(time,camera){
    const zen=Boolean(camera);
    const cx=camera?.x||0;
    const cy=Math.max(-1.08,Math.min(1.08,camera?.y||0));
    const cz=camera?.z||0;

    // Camera coordinates are world travel, not tiny look offsets.
    const worldX=cx*44.0+Math.sin(time*.026)*1.25;
    const travel=time*(zen?3.35:.34)+cz*44.0;
    const eyeY=8.6+cy*6.3+Math.sin(time*.035)*.20;
    const eye=[worldX,eyeY,16.2];
    const target=[
      worldX+Math.sin(time*.019)*.55,
      eyeY-1.25+cy*.12,
      -58
    ];
    perspective(projection,zen ? .91 : 1.0,cssWidth/cssHeight,.12,700);
    lookAt(view,eye,target,[0,1,0]);multiply(vp,projection,view);

    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);gl.bindVertexArray(skyVao);gl.uniform1f(uniforms.sky.time,time);gl.uniform1f(uniforms.sky.aspect,cssWidth/cssHeight);gl.uniform1f(uniforms.sky.zen,zen?1:0);gl.drawArrays(gl.TRIANGLES,0,3);
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(groundProgram);gl.bindVertexArray(groundVao);gl.uniformMatrix4fv(uniforms.ground.vp,false,vp);gl.uniform3f(uniforms.ground.camera,...eye);gl.uniform1f(uniforms.ground.travel,travel);gl.drawElements(gl.TRIANGLES,terrain.indices.length,gl.UNSIGNED_INT,0);

    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);gl.useProgram(trunkProgram);gl.bindVertexArray(trunkVao);
    gl.uniformMatrix4fv(uniforms.trunk.vp,false,vp);gl.uniform1f(uniforms.trunk.travel,travel);gl.uniform1f(uniforms.trunk.spanZ,forest.spanZ);gl.uniform1f(uniforms.trunk.spanX,forest.spanX);gl.uniform1f(uniforms.trunk.time,time);gl.uniform3f(uniforms.trunk.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,trunkGeo.positions.length/3,forest.trunkCount);

    gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    gl.useProgram(leafProgram);gl.bindVertexArray(leafVao);gl.uniformMatrix4fv(uniforms.leaf.vp,false,vp);gl.uniform1f(uniforms.leaf.travel,travel);gl.uniform1f(uniforms.leaf.spanZ,forest.spanZ);gl.uniform1f(uniforms.leaf.spanX,forest.spanX);gl.uniform1f(uniforms.leaf.time,time);gl.uniform3f(uniforms.leaf.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,forest.leafCount);gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
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
  flightBounds:{y:1.08},
  depthGain:3.2,
  depthCap:8.5,
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
