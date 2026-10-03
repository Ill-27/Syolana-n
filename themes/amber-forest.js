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
  v+=sin(p.x*.86+sin(p.y*.68)*1.08);
  v+=sin(p.y*1.11-cos(p.x*.59)*1.02)*.64;
  v+=sin((p.x+p.y)*1.66)*.28;
  return .5+.5*(v/1.92);
}
float cloud(vec2 p){
  float a=waves(p),b=waves(vec2(p.x*.84-p.y*.54,p.x*.54+p.y*.84)*1.72+vec2(2.6,4.7));
  return a*.67+b*.33;
}
void main(){
  vec2 uv=vUv;
  float horizon=.43;
  vec3 top=vec3(.24,.52,.72);
  vec3 mid=vec3(.54,.72,.82);
  vec3 haze=vec3(.88,.84,.70);
  vec3 col=mix(haze,mix(mid,top,smoothstep(.58,1.0,uv.y)),smoothstep(horizon,1.0,uv.y));

  // Bright autumn sun.
  float sun=exp(-pow((uv.x-.72)*5.2,2.0)-pow((uv.y-.66)*13.0,2.0));
  float halo=exp(-pow((uv.x-.72)*2.0,2.0)-pow((uv.y-.66)*5.0,2.0));
  col+=vec3(1.0,.82,.50)*sun*.92+vec3(1.0,.72,.35)*halo*.15;

  vec2 p=vec2((uv.x-.5)*uAspect*3.0,uv.y*3.0)+vec2(uTime*.0045,-uTime*.0012);
  float low=cloud(p),high=cloud(p*.62+vec2(-2.4,3.2));
  float lowMask=smoothstep(.47,.54,uv.y)*(1.0-smoothstep(.78,.88,uv.y));
  float highMask=smoothstep(.64,.71,uv.y)*(1.0-smoothstep(.95,1.0,uv.y));
  float d1=smoothstep(.54,.70,low)*lowMask;
  float d2=smoothstep(.57,.72,high)*highMask;
  col=mix(col,vec3(.91,.92,.87),d1*.28);
  col=mix(col,vec3(.84,.88,.87),d2*.11);

  float mist=exp(-pow((uv.y-horizon)*28.0,2.0));
  col=mix(col,vec3(.91,.82,.65),mist*(.22+.04*uZen));
  col*=1.0-.09*pow(length((uv-.5)*vec2(.82,1.0)),1.7);
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
uniform float uSpanZ;
uniform float uSpanX;
uniform float uTime;
uniform vec3 uCamera;
out vec3 vNormal;
out vec3 vWorld;
out float vTone;
out float vBranch;
out float vDistance;
void main(){
  float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;
  float z=mod(iOffset.z+uTravel+56.0,uSpanZ)-uSpanZ+56.0;
  bool branch=iTone<0.0;
  vec3 center=vec3(x,iOffset.y,z);
  vec3 world;
  vec3 normal;

  if(branch){
    float az=iPhase;
    float pitch=.40+.27*(.5+.5*sin(iScale.y*.47+az*1.73));
    vec3 dir=normalize(vec3(cos(az)*cos(pitch),sin(pitch),sin(az)*cos(pitch)));
    vec3 ref=abs(dir.y)>.94?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);
    vec3 side=normalize(cross(dir,ref));
    vec3 binormal=normalize(cross(side,dir));
    float along=clamp(aPosition.y+.5,0.0,1.0);
    float taper=mix(1.0,.30,along);
    world=center
      +dir*(aPosition.y*iScale.y)
      +side*(aPosition.x*iScale.x*taper)
      +binormal*(aPosition.z*iScale.z*taper);
    normal=normalize(side*aNormal.x+binormal*aNormal.z+dir*aNormal.y*.12);
  }else{
    vec3 local=aPosition;
    float y01=clamp(local.y+.5,0.,1.);
    local.xz*=mix(1.0,.61,smoothstep(.12,1.0,y01));
    float sway=sin(uTime*.34+iPhase)*.018*y01*y01;
    world=center+vec3(sway*iScale.y,0.0,0.0)+local*iScale;
    normal=aNormal;
  }

  vWorld=world;
  vNormal=normal;
  vTone=abs(iTone);
  vBranch=branch?1.0:0.0;
  vDistance=distance(world,uCamera);
  gl_Position=uViewProj*vec4(world,1.0);
}
`;

const TRUNK_FS=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vTone;
in float vBranch;
in float vDistance;
out vec4 outColor;
void main(){
  vec3 n=normalize(vNormal);
  vec3 lightDir=normalize(vec3(-.48,.83,.28));
  float diff=max(dot(n,lightDir),0.0);
  float bark=.5+.5*sin(vWorld.y*2.6+sin(vWorld.x*.83+vWorld.z*.27)*2.0);
  float fine=.5+.5*sin(vWorld.y*8.4+vWorld.x*1.7);
  vec3 base;

  if(vTone<.18){
    float scar=smoothstep(.78,.96,.5+.5*sin(vWorld.y*3.1+sin(vWorld.x*2.0+vWorld.z*.9)*1.9));
    base=mix(vec3(.66,.63,.55),vec3(.93,.89,.79),.48+.35*diff);
    base=mix(base,vec3(.17,.15,.13),scar*(.20+.12*fine));
  }else{
    vec3 dark=vec3(.105,.054,.025);
    vec3 warm=vec3(.31,.15,.052);
    base=mix(dark,warm,.40+.34*vTone);
    base*=.48+.60*diff;
    base*=.84+.16*bark;
  }

  if(vBranch>.5)base*=.88;
  float fog=smoothstep(95.0,355.0,vDistance);
  base=mix(base,vec3(.72,.64,.52),fog*.92);
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
out float vBacklight;
out float vDistance;
void main(){
  float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;
  float z=mod(iOffset.z+uTravel+56.0,uSpanZ)-uSpanZ+56.0;
  float phase=iMeta.z;
  float size=iMeta.w;
  vec3 center=vec3(x,iOffset.y,z);

  float az=iAngle+phase*.19;
  float tilt=.28+1.05*(.5+.5*sin(phase*1.37+2.1));
  vec3 normal=normalize(vec3(cos(az)*sin(tilt),cos(tilt),sin(az)*sin(tilt)));
  vec3 ref=abs(normal.y)<.90?vec3(0.0,1.0,0.0):vec3(1.0,0.0,0.0);
  vec3 axisX=normalize(cross(ref,normal));
  vec3 axisY=normalize(cross(normal,axisX));

  float gust=sin(uTime*.58+phase)+.37*sin(uTime*.27+phase*1.71);
  float flutter=sin(uTime*1.08+phase*2.13+aCorner.x*2.7);
  axisX=normalize(axisX+normal*(gust*.045+flutter*.018));
  axisY=normalize(axisY+normal*flutter*.035);

  float fold=.84+.16*cos(uTime*.73+phase*1.41);
  vec3 world=center
    +axisX*(aCorner.x*size*fold)
    +axisY*(aCorner.y*size*1.12)
    +normal*(sin((aCorner.y+.5)*3.14159)*.05*size)
    +vec3(gust*.020,0.0,sin(uTime*.31+phase)*.018);

  vec3 sunDir=normalize(vec3(-.56,.79,.24));
  vSun=max(0.0,dot(normal,sunDir));
  vBacklight=max(0.0,dot(-normal,sunDir));
  vLeaf=aCorner;
  vTone=iMeta.x;vType=iMeta.y;vPhase=phase;
  vDistance=distance(world,uCamera);
  gl_Position=uViewProj*vec4(world,1.0);
}
`;

const LEAF_FS=`#version 300 es
precision highp float;
in vec2 vLeaf;
in float vTone;
in float vType;
in float vPhase;
in float vSun;
in float vBacklight;
in float vDistance;
out vec4 outColor;

float mapleMask(vec2 p){
  p.y*=1.04;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.55+.20*cos(5.0*a)+.070*cos(10.0*a)+.024*cos(15.0*a);
  float leaf=1.0-smoothstep(lobes-.028,lobes+.018,r);
  float stem=(1.0-smoothstep(.025,.060,abs(p.x)))*(1.0-smoothstep(-1.02,-.58,p.y));
  return max(leaf,stem*.74);
}
float birchMask(vec2 p){
  p.y+=.04;
  float body=pow(abs(p.x)*1.47,2.35)+pow(abs(p.y)*.90,2.0);
  float serr=.020*sin(26.0*atan(p.y,p.x));
  return 1.0-smoothstep(.80+serr,.98+serr,body);
}
float oakMask(vec2 p){
  p.y*=.94;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.55+.118*cos(4.0*a)+.058*cos(8.0*a)+.025*cos(12.0*a);
  return 1.0-smoothstep(lobes-.028,lobes+.020,r);
}
float beechMask(vec2 p){
  float body=pow(abs(p.x)*1.18,2.15)+pow(abs(p.y)*.93,2.28);
  float serr=.014*sin(32.0*atan(p.y,p.x));
  return 1.0-smoothstep(.82+serr,1.0+serr,body);
}
void main(){
  vec2 p=vLeaf;
  float mask=vType<.5?mapleMask(p):(vType<1.5?birchMask(p):(vType<2.5?oakMask(p):beechMask(p)));
  if(mask<.055)discard;

  float variation=.5+.5*sin(vPhase*2.37+vTone*8.1);
  vec3 col;
  if(vType<.5){
    col=mix(vec3(1.0,.72,.16),vec3(.80,.12,.035),smoothstep(.18,.88,variation));
    col=mix(col,vec3(.98,.40,.055),.32);
  }else if(vType<1.5){
    col=mix(vec3(.98,.86,.30),vec3(.77,.59,.10),variation*.72);
  }else if(vType<2.5){
    col=mix(vec3(.76,.47,.12),vec3(.42,.16,.055),variation);
    col=mix(col,vec3(.48,.43,.10),.16);
  }else{
    col=mix(vec3(.92,.43,.11),vec3(.53,.19,.060),variation*.86);
  }

  float r=length(p);
  float edge=1.0-smoothstep(.72,1.02,r);
  float midrib=exp(-abs(p.x)*27.0)*(.07+.23*(1.0-abs(p.y)));
  float veins=(.5+.5*sin((abs(p.y)*10.5+abs(p.x)*6.2)*3.14159))*exp(-abs(p.x)*3.8)*.042;

  col*=.75+.28*edge;
  col+=vec3(.18,.065,.015)*(midrib+veins);
  col+=vec3(1.0,.72,.27)*pow(vSun,3.7)*(.10+.28*edge);
  col+=vec3(1.0,.52,.16)*pow(vBacklight,2.4)*.28;

  float fog=smoothstep(110.0,405.0,vDistance);
  col=mix(col,vec3(.79,.70,.57),fog*.91);
  float alpha=mask*(1.0-smoothstep(320.0,450.0,vDistance));
  outColor=vec4(col,alpha);
}
`;

function forestPathCenter(z){
  return trailCenter(z);
}

function trailCenter(z){
  const a=TAU*z/720;
  return Math.sin(a*2.0)*7.2+Math.sin(a*5.0+1.35)*2.7+Math.sin(a+0.72)*3.9;
}

function buildForest(){
  const rnd=seeded(91277),spanZ=720,spanX=360,trunks=[],leaves=[];
  const addLeaf=(x,y,z,tone,type,phase,size,angle)=>leaves.push(x,y,z,tone,type,phase,size,angle);

  const addTree=(x,z)=>{
    const base=-.60+.10*Math.sin(x*.037)+.07*Math.sin(z*.026+x*.014);
    const species=Math.floor(rnd()*4);
    const h=species===1?15+rnd()*11:species===2?11+rnd()*8:12+rnd()*9;
    const radius=species===1?.20+rnd()*.18:.34+rnd()*.34;
    const tone=[.36,.08,.68,.52][species]+(rnd()-.5)*.10;
    const phase=rnd()*TAU;
    trunks.push(x,base+h*.5,z,radius*2,h,radius*2,Math.max(.02,tone),phase);

    const centers=[];
    const addCenter=(cx,cy,cz,r)=>centers.push({x:cx,y:cy,z:cz,r});

    if(species===1){
      for(let i=0;i<11;i++){
        const f=i/10,a=i*2.399+rnd()*.20,reach=.70+rnd()*1.35;
        addCenter(x+Math.cos(a)*reach,base+h*(.47+f*.45),z+Math.sin(a)*reach,.92+rnd()*.48);
      }
    }else if(species===2){
      addCenter(x,base+h*.79,z,2.55+rnd()*.58);
      for(let i=0;i<13;i++){
        const a=i/13*TAU+rnd()*.24,reach=2.35+rnd()*3.05;
        addCenter(x+Math.cos(a)*reach,base+h*(.53+rnd()*.27),z+Math.sin(a)*reach,1.38+rnd()*.72);
      }
    }else if(species===0){
      addCenter(x,base+h*.84,z,2.18+rnd()*.62);
      for(let i=0;i<12;i++){
        const a=i/12*TAU+rnd()*.32,reach=1.75+rnd()*2.70;
        addCenter(x+Math.cos(a)*reach,base+h*(.56+rnd()*.31),z+Math.sin(a)*reach,1.24+rnd()*.69);
      }
    }else{
      for(let i=0;i<12;i++){
        const f=i/11,a=i*2.12+rnd()*.22,reach=1.05+rnd()*1.72;
        addCenter(x+Math.cos(a)*reach,base+h*(.49+f*.41),z+Math.sin(a)*reach,1.28+rnd()*.62);
      }
    }

    const branchStartY=base+h*(species===2?.31:.37);
    const mainCount=Math.min(species===1?9:12,centers.length);
    for(let i=0;i<mainCount;i++){
      const c=centers[i];
      if(rnd()<.06)continue;
      const dx=c.x-x,dz=c.z-z;
      const az=Math.atan2(dz,dx);
      const len=Math.max(2.0,Math.hypot(Math.hypot(dx,dz),c.y-branchStartY)*(.58+rnd()*.12));
      const midX=x+dx*.40,midY=branchStartY+(c.y-branchStartY)*.36,midZ=z+dz*.40;
      trunks.push(midX,midY,midZ,radius*.22,len,radius*.19,-Math.max(.02,tone),az);

      // Fine secondary twig: same bark, smaller radius, subtly diverging angle.
      if(rnd()>.14){
        const twigAz=az+(rnd()-.5)*.78;
        const twigLen=len*(.28+rnd()*.24);
        const ox=x+dx*.70,oy=branchStartY+(c.y-branchStartY)*.62,oz=z+dz*.70;
        trunks.push(
          ox+Math.cos(twigAz)*twigLen*.18,
          oy+twigLen*.12,
          oz+Math.sin(twigAz)*twigLen*.18,
          radius*.095,twigLen,radius*.075,
          -Math.max(.02,tone),
          twigAz
        );
      }
    }

    const totalLeaves=(species===1?500:610)+Math.floor(rnd()*(species===1?80:115));
    for(let i=0;i<totalLeaves;i++){
      const c=centers[Math.floor(rnd()*centers.length)];
      const a=rnd()*TAU,u=rnd()*2-1;
      const rr=c.r*(.10+Math.pow(rnd(),.58)*1.02);
      const radial=Math.sqrt(Math.max(0,1-u*u))*rr;
      addLeaf(
        c.x+Math.cos(a)*radial,
        c.y+u*rr*(species===1?.97:.79),
        c.z+Math.sin(a)*radial,
        Math.max(0,Math.min(1,tone+(rnd()-.5)*.14)),
        species,
        phase+rnd()*TAU,
        species===1?.070+rnd()*.052:.082+rnd()*.060,
        (rnd()-.5)*TAU
      );
    }

    const outer=(species===1?105:145)+Math.floor(rnd()*42);
    for(let i=0;i<outer;i++){
      const c=centers[Math.floor(rnd()*centers.length)],a=rnd()*TAU,rr=c.r*(.91+rnd()*.32);
      addLeaf(
        c.x+Math.cos(a)*rr,
        c.y+(rnd()-.50)*c.r*(species===1?1.03:.84),
        c.z+Math.sin(a)*rr,
        Math.max(0,Math.min(1,tone+(rnd()-.5)*.16)),
        species,
        phase+rnd()*TAU,
        species===1?.060+rnd()*.042:.068+rnd()*.048,
        (rnd()-.5)*TAU
      );
    }
  };

  // Invisible flight corridor only: no path is drawn on the ground.
  for(let z=4;z<spanZ;z+=19+rnd()*6.0){
    for(const side of [-1,1]){
      if(rnd()>.06)addTree(side*(12+rnd()*17)+(rnd()-.5)*3.2,z+rnd()*7);
      if(rnd()>.55)addTree(side*(34+rnd()*28),z+rnd()*9);
      if(rnd()>.88)addTree(side*(70+rnd()*40),z+rnd()*12);
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
    const c=document.createElement("canvas");c.width=128;c.height=128;
    const x=c.getContext("2d");x.translate(64,61);
    const g=x.createLinearGradient(-34,-38,34,42);g.addColorStop(0,top);g.addColorStop(1,bottom);
    x.fillStyle=g;x.strokeStyle="rgba(76,37,14,.31)";x.lineWidth=1.1;x.beginPath();
    if(kind==="maple"){
      x.moveTo(0,-50);x.lineTo(9,-25);x.lineTo(31,-39);x.lineTo(25,-12);x.lineTo(49,-7);x.lineTo(26,10);x.lineTo(31,35);x.lineTo(7,23);x.lineTo(0,48);
      x.lineTo(-7,23);x.lineTo(-31,35);x.lineTo(-26,10);x.lineTo(-49,-7);x.lineTo(-25,-12);x.lineTo(-31,-39);x.lineTo(-9,-25);x.closePath();
    }else if(kind==="oak"){
      x.moveTo(0,-47);x.bezierCurveTo(22,-39,16,-27,33,-18);x.bezierCurveTo(17,-8,31,5,18,13);x.bezierCurveTo(8,22,14,35,0,46);
      x.bezierCurveTo(-14,35,-8,22,-18,13);x.bezierCurveTo(-31,5,-17,-8,-33,-18);x.bezierCurveTo(-16,-27,-22,-39,0,-47);x.closePath();
    }else if(kind==="birch"){
      x.moveTo(0,-50);x.bezierCurveTo(29,-31,24,17,0,47);x.bezierCurveTo(-24,17,-29,-31,0,-50);x.closePath();
    }else{
      x.moveTo(0,-47);x.bezierCurveTo(34,-27,32,19,0,44);x.bezierCurveTo(-32,19,-34,-27,0,-47);x.closePath();
    }
    x.fill();x.stroke();
    x.strokeStyle="rgba(87,45,16,.34)";x.beginPath();x.moveTo(0,-42);x.lineTo(0,54);x.stroke();
    x.globalAlpha=.44;x.strokeStyle="rgba(255,228,155,.46)";
    x.beginPath();x.moveTo(-2,-13);x.lineTo(-20,-3);x.moveTo(2,3);x.lineTo(21,13);x.stroke();
    return c;
  };
  return [
    make("maple","#ffd86d","#b9471d"),
    make("birch","#f4d75a","#9b7c1f"),
    make("oak","#e7a03b","#7b2a17"),
    make("beech","#e88935","#8e321d")
  ];
}

function createAirLeaves(){
  const rnd=seeded(22771),sprites=makeAirLeafSprites();
  const count=176;
  const leaves=Array.from({length:count},(_,i)=>{
    const layer=i%5;
    return {
      offset:rnd(),
      speed:[.028,.036,.046,.058,.070][layer]*(.82+rnd()*.36),
      originX:.28+rnd()*.44,
      originY:.34+rnd()*.20,
      targetX:-.08+rnd()*1.16,
      targetY:-.02+rnd()*1.08,
      curve:(rnd()-.5)*(.10+layer*.035),
      roll:(rnd()-.5)*1.15,
      wobble:.25+rnd()*.55,
      phase:rnd()*TAU,
      sprite:Math.floor(rnd()*4),
      layer
    };
  });
  return {
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      const visible=zen?leaves.length:112;
      const sunX=width*.72,sunY=height*.20;
      for(let i=0;i<visible;i++){
        const l=leaves[i];
        const p=(l.offset+time*l.speed*(zen?1.0:.72))%1;
        const depth=Math.pow(p,1.58);
        const ox=l.originX*width,oy=l.originY*height;
        const tx=l.targetX*width,ty=l.targetY*height;
        const arc=Math.sin(p*Math.PI);
        const px=ox+(tx-ox)*depth+arc*l.curve*width;
        const py=oy+(ty-oy)*depth-arc*height*(.018+.010*l.layer);
        const base=[2.2,3.0,4.2,5.8,7.6][l.layer];
        const growth=[12,18,26,36,52][l.layer];
        const size=base+growth*Math.pow(depth,1.43);
        const fade=Math.min(1,p/.075)*Math.min(1,(1-p)/.115);
        const alpha=fade*(.18+.72*depth);
        const sunProximity=Math.max(0,1-Math.hypot(px-sunX,py-sunY)/Math.max(width,height)*1.8);
        const shimmer=sunProximity*(.28+.72*(.5+.5*Math.sin(time*1.35+l.phase)));

        ctx.save();
        ctx.translate(px,py);
        ctx.rotate(l.roll*p*.85+Math.sin(time*.62+l.phase)*l.wobble);
        ctx.globalAlpha=alpha;
        ctx.shadowColor=`rgba(255,202,96,${.05+.25*shimmer})`;
        ctx.shadowBlur=1.5+9*shimmer;
        ctx.drawImage(sprites[l.sprite],-size/2,-size/2,size,size);
        if(shimmer>.34&&depth>.28){
          ctx.globalCompositeOperation="screen";
          ctx.globalAlpha=alpha*shimmer*.15;
          ctx.fillStyle="#ffe9ad";
          ctx.beginPath();
          ctx.ellipse(-size*.10,-size*.16,size*.13,size*.055,-.45,0,TAU);
          ctx.fill();
        }
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

function terrainGeometry(cols=76,rows=132){
  const verts=[],idx=[];
  const x0=-125,x1=125,z0=34,z1=-760;
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

function fallbackRenderer(ctx){function fallbackRenderer(ctx){
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
  out float vLogicalZ;
  void main(){
    float x=aPosition.x+uCamera.x;
    float z=aPosition.y;
    float logicalZ=z-uTravel;
    float relief=sin(x*.031+z*.013)*.038+sin(x*.071-z*.021)*.019;
    float y=-.64+relief;
    vWorld=vec3(x,y,z);
    vLogicalZ=logicalZ;
    gl_Position=uViewProj*vec4(vWorld,1.0);
  }`;

  const GROUND_FS_LOCAL=`#version 300 es
  precision highp float;
  in vec3 vWorld;
  in float vLogicalZ;
  out vec4 outColor;
  uniform vec3 uCamera;
  uniform float uTravel;

  float field(vec2 p){
    float v=0.0;
    v+=sin(p.x+sin(p.y*.71)*1.25);
    v+=sin(p.y*1.27-cos(p.x*.63)*1.05)*.62;
    v+=sin((p.x+p.y)*1.91)*.29;
    return .5+.5*(v/1.91);
  }
  void main(){
    vec2 p=vec2(vWorld.x,vLogicalZ);
    float n1=field(p*.060);
    float n2=field(vec2(p.x*.18-p.y*.12,p.x*.12+p.y*.18)+vec2(3.2,1.7));
    float n3=field(p*.43+vec2(-2.1,5.4));
    float n4=field(p*.94+vec2(7.1,-3.8));

    vec3 soil=vec3(.090,.054,.026);
    vec3 humus=vec3(.135,.085,.038);
    vec3 moss=vec3(.205,.235,.080);
    vec3 ochre=vec3(.55,.255,.055);
    vec3 copper=vec3(.43,.105,.032);
    vec3 pale=vec3(.62,.42,.18);

    vec3 col=mix(soil,humus,.28+.32*n1);
    col=mix(col,moss,smoothstep(.57,.80,n2)*(.18+.18*n1));
    col=mix(col,ochre,smoothstep(.64,.86,n3)*.28);
    col=mix(col,copper,smoothstep(.72,.90,n4)*.16);
    col=mix(col,pale,smoothstep(.86,.96,n3)*.06);

    float shadow=field(p*.025+vec2(1.2,4.1));
    col*=.72+.25*shadow;
    float sunPatch=smoothstep(.78,.91,field(p*.031+vec2(.7,2.8)));
    col+=vec3(.115,.080,.026)*sunPatch;

    // Fine fallen-leaf speckle without geometric tiles.
    float speck=smoothstep(.90,.965,.5+.5*sin(p.x*1.73+sin(p.y*.81)*2.2));
    col=mix(col,mix(ochre,copper,n2),speck*.16);

    float fog=smoothstep(125.0,430.0,distance(vWorld,uCamera));
    col=mix(col,vec3(.74,.67,.55),fog*.90);
    outColor=vec4(col,1.0);
  }`;

  let skyProgram,trunkProgram,leafProgram,groundProgram;
  try{
    skyProgram=program(gl,SKY_VS,SKY_FS);trunkProgram=program(gl,TRUNK_VS,TRUNK_FS);leafProgram=program(gl,LEAF_VS,LEAF_FS);groundProgram=program(gl,GROUND_VS_LOCAL,GROUND_FS_LOCAL);
  }catch(error){
    console.warn("Amber Forest WebGL unavailable",error);canvas.remove();
    const fallback=fallbackRenderer(ctx),base=fallback.dispose;fallback.dispose=()=>{base?.();style.remove();sound.dispose()};return fallback;
  }

  const resources=[],keep=(x)=>{if(x)resources.push(x);return x};
  const skyVao=keep(gl.createVertexArray()),skyBuffer=keep(gl.createBuffer());
  gl.bindVertexArray(skyVao);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),gl.STATIC_DRAW);
  const skyLoc=gl.getAttribLocation(skyProgram,"aPosition");gl.enableVertexAttribArray(skyLoc);gl.vertexAttribPointer(skyLoc,2,gl.FLOAT,false,0,0);

  const forest=buildForest(),trunkGeo=prismGeometry(10);
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
    const q=Math.min(ratio,cssWidth<=760?1.08:1.50),w=Math.max(1,Math.round(cssWidth*q)),h=Math.max(1,Math.round(cssHeight*q));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  }

  function renderWorld(time,camera){
    const zen=Boolean(camera);
    const cx=Math.max(-1.12,Math.min(1.12,camera?.x||0));
    const cy=Math.max(-1.08,Math.min(1.08,camera?.y||0));
    const cz=camera?.z||0;

    // The world itself advances smoothly; manual depth only adds/subtracts travel.
    const travel=time*(zen?5.8:.34)+cz*64.0;
    const autoX=Math.sin(time*.075)*1.45+Math.sin(time*.031+1.2)*.85;
    const autoY=Math.sin(time*.052+.5)*.22;
    const eyeX=autoX+cx*8.2;
    const eyeY=7.8+autoY+cy*5.35;
    const eye=[eyeX,eyeY,12.0];
    const target=[
      eyeX+Math.sin(time*.041)*1.15+cx*.55,
      eyeY-1.55+cy*.12,
      -94
    ];
    perspective(projection,zen ? .90 : .98,cssWidth/cssHeight,.12,980);
    lookAt(view,eye,target,[0,1,0]);multiply(vp,projection,view);

    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);gl.bindVertexArray(skyVao);
    gl.uniform1f(uniforms.sky.time,time);gl.uniform1f(uniforms.sky.aspect,cssWidth/cssHeight);gl.uniform1f(uniforms.sky.zen,zen?1:0);
    gl.drawArrays(gl.TRIANGLES,0,3);

    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(groundProgram);gl.bindVertexArray(groundVao);
    gl.uniformMatrix4fv(uniforms.ground.vp,false,vp);gl.uniform3f(uniforms.ground.camera,...eye);gl.uniform1f(uniforms.ground.travel,travel);
    gl.drawElements(gl.TRIANGLES,terrain.indices.length,gl.UNSIGNED_INT,0);

    gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK);
    gl.useProgram(trunkProgram);gl.bindVertexArray(trunkVao);
    gl.uniformMatrix4fv(uniforms.trunk.vp,false,vp);gl.uniform1f(uniforms.trunk.travel,travel);gl.uniform1f(uniforms.trunk.spanZ,forest.spanZ);gl.uniform1f(uniforms.trunk.spanX,forest.spanX);gl.uniform1f(uniforms.trunk.time,time);gl.uniform3f(uniforms.trunk.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,trunkGeo.positions.length/3,forest.trunkCount);

    gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);
    gl.useProgram(leafProgram);gl.bindVertexArray(leafVao);
    gl.uniformMatrix4fv(uniforms.leaf.vp,false,vp);gl.uniform1f(uniforms.leaf.travel,travel);gl.uniform1f(uniforms.leaf.spanZ,forest.spanZ);gl.uniform1f(uniforms.leaf.spanX,forest.spanX);gl.uniform1f(uniforms.leaf.time,time);gl.uniform3f(uniforms.leaf.camera,...eye);
    gl.drawArraysInstanced(gl.TRIANGLES,0,6,forest.leafCount);
    gl.depthMask(true);gl.disable(gl.BLEND);gl.bindVertexArray(null);
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
  flightBounds:{x:1.12,y:1.08},
  depthGain:2.8,
  depthCap:6.0,
  depthDirectScale:.22,
  cameraSmoothing:4.2,
  depthDamping:4.8,
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
