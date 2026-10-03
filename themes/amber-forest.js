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
  if(vTone<.18){
    float barkMark=smoothstep(.74,.94,.5+.5*sin(vWorld.y*3.2+sin(vWorld.x*2.1)*1.7));
    base=mix(vec3(.64,.61,.53),vec3(.90,.87,.78),.54+.28*diff);
    base=mix(base,vec3(.18,.16,.13),barkMark*.26);
  }else{
    base*=.48+.62*diff;
    base*=.87+.13*grain;
  }
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

  vec3 center=vec3(x,iOffset.y,z);
  vec3 toCam=normalize(vec3(uCamera.x-center.x,0.0,uCamera.z-center.z));
  vec3 right=normalize(cross(vec3(0.0,1.0,0.0),toCam));
  vec3 up=vec3(0.0,1.0,0.0);

  float gust=sin(uTime*.72+phase)+.38*sin(uTime*.31+phase*1.73);
  float angle=iAngle+gust*.11;
  float ca=cos(angle),sa=sin(angle);
  vec2 q=vec2(aCorner.x*ca-aCorner.y*sa,aCorner.x*sa+aCorner.y*ca);

  float flutter=sin(uTime*.82+phase*2.1+aCorner.x*2.8);
  float fold=.34+.66*abs(cos(uTime*.63+phase*1.37));
  q.x*=fold;
  vec3 world=center
    +right*(q.x*size)
    +up*(q.y*size)
    +toCam*(aCorner.x*sin(uTime*.63+phase*1.37)*.22*size+flutter*.028*size)
    +vec3(gust*.035,0.0,sin(uTime*.37+phase)*.024);

  gl_Position=uViewProj*vec4(world,1.0);
  vLeaf=aCorner;
  vTone=iMeta.x;vType=iMeta.y;vPhase=phase;
  vDistance=distance(world,uCamera);

  vec3 sunDir=normalize(vec3(-.60,.78,.22));
  vec3 pseudoNormal=normalize(toCam+up*.22+right*flutter*.08);
  vSun=max(0.0,dot(pseudoNormal,sunDir));
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
  p.y*=1.04;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.57+.19*cos(5.0*a)+.074*cos(10.0*a)+.025*cos(15.0*a);
  float leaf=1.0-smoothstep(lobes-.030,lobes+.020,r);
  float stem=(1.0-smoothstep(.030,.065,abs(p.x)))*(1.0-smoothstep(-1.02,-.60,p.y));
  return max(leaf,stem*.74);
}
float birchMask(vec2 p){
  p.y+=.05;
  float body=pow(abs(p.x)*1.42,2.28)+pow(abs(p.y)*.92,2.0);
  float serr=.018*sin(24.0*atan(p.y,p.x));
  return 1.0-smoothstep(.80+serr,.98+serr,body);
}
float oakMask(vec2 p){
  p.y*=.92;
  float a=atan(p.y,p.x),r=length(p);
  float lobes=.56+.115*cos(4.0*a)+.058*cos(8.0*a)+.028*cos(12.0*a);
  return 1.0-smoothstep(lobes-.030,lobes+.022,r);
}
float beechMask(vec2 p){
  float body=pow(abs(p.x)*1.16,2.12)+pow(abs(p.y)*.94,2.26);
  float serr=.012*sin(34.0*atan(p.y,p.x));
  return 1.0-smoothstep(.82+serr,1.0+serr,body);
}
void main(){
  vec2 p=vLeaf;
  float mask=vType<.5?mapleMask(p):(vType<1.5?birchMask(p):(vType<2.5?oakMask(p):beechMask(p)));
  if(mask<.065)discard;

  vec3 yellow=vec3(1.00,.77,.22);
  vec3 gold=vec3(1.00,.59,.08);
  vec3 orange=vec3(.94,.33,.045);
  vec3 scarlet=vec3(.72,.105,.028);
  vec3 olive=vec3(.52,.47,.09);
  vec3 col=vTone<.22?mix(yellow,gold,vTone/.22):
           vTone<.50?mix(gold,orange,(vTone-.22)/.28):
           vTone<.78?mix(orange,scarlet,(vTone-.50)/.28):
           mix(scarlet,olive,(vTone-.78)/.22);

  float r=length(p);
  float edge=1.0-smoothstep(.70,1.02,r);
  float midrib=exp(-abs(p.x)*26.0)*(.08+.24*(1.0-abs(p.y)));
  float veins=(.5+.5*sin((abs(p.y)*10.0+abs(p.x)*6.0)*3.14159))*exp(-abs(p.x)*3.6)*.052;

  col*=.80+.24*edge;
  col+=vec3(.20,.075,.018)*(midrib+veins);
  col+=vec3(1.0,.72,.28)*pow(vSun,5.0)*(.18+.36*edge);
  col=mix(col,vec3(1.0,.80,.36),vSun*.16);

  float fog=smoothstep(105.0,390.0,vDistance);
  col=mix(col,vec3(.80,.70,.55),fog*.92);
  float alpha=mask*(1.0-smoothstep(305.0,420.0,vDistance));
  outColor=vec4(col,alpha);
}`;

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
    const base=-.58+.11*Math.sin(x*.038)+.08*Math.sin(z*.025+x*.013);
    const species=Math.floor(rnd()*4); // 0 maple, 1 birch, 2 oak, 3 beech
    const h=(species===1?14:11)+rnd()*(species===1?13:12);
    const radius=(species===1?.25:.36)+rnd()*(species===1?.24:.42);
    const baseTone=[.36,.08,.67,.52][species]+(rnd()-.5)*.12;
    const tone=Math.max(0,Math.min(1,baseTone));
    const phase=rnd()*TAU;
    trunks.push(x,base+h*.5,z,radius*2,h,radius*2,tone,phase);

    const centers=[];
    const addCenter=(cx,cy,cz,r)=>centers.push({x:cx,y:cy,z:cz,r});

    if(species===1){
      // Birch: narrow, high and airy, but still leaf-rich.
      const count=9;
      for(let i=0;i<count;i++){
        const f=i/(count-1),a=i*2.399+rnd()*.28,reach=(1.0+rnd()*1.45)*(1.0-f*.20);
        addCenter(x+Math.cos(a)*reach,base+h*(.49+f*.43),z+Math.sin(a)*reach,1.0+rnd()*.58);
      }
    }else if(species===2){
      // Oak: broad, layered, horizontal crown.
      addCenter(x,base+h*.84,z,2.55+rnd()*.65);
      for(let i=0;i<11;i++){
        const a=i/11*TAU+rnd()*.27,reach=2.6+rnd()*2.7;
        addCenter(x+Math.cos(a)*reach,base+h*(.58+rnd()*.27),z+Math.sin(a)*reach,1.45+rnd()*.72);
      }
    }else if(species===0){
      // Maple: rounded irregular crown with many fine branch tips.
      addCenter(x,base+h*.88,z,2.25+rnd()*.60);
      for(let i=0;i<10;i++){
        const a=i/10*TAU+rnd()*.42,reach=2.0+rnd()*2.65;
        addCenter(x+Math.cos(a)*reach,base+h*(.60+rnd()*.29),z+Math.sin(a)*reach,1.35+rnd()*.70);
      }
    }else{
      // Beech: dense oval crown.
      for(let i=0;i<10;i++){
        const f=i/9,a=i*2.17+rnd()*.25,reach=1.25+rnd()*1.75;
        addCenter(x+Math.cos(a)*reach,base+h*(.54+f*.37),z+Math.sin(a)*reach,1.35+rnd()*.62);
      }
    }

    // Slim internal branch/stem structure prevents the crown from reading as a floating mass.
    const stems=Math.min(9,centers.length);
    for(let i=0;i<stems;i++){
      const c=centers[i];
      if(rnd()<.18)continue;
      const sh=Math.max(2.2,c.y-(base+h*.39));
      trunks.push(
        x+(c.x-x)*.53,
        base+h*.39+sh*.5,
        z+(c.z-z)*.53,
        radius*.19,radius*.19+sh,radius*.19,
        Math.min(1,tone+.06),
        phase+i*.67
      );
    }

    // Hundreds of small leaves rather than a few oversized billboards.
    const totalLeaves=(species===1?430:540)+Math.floor(rnd()*(species===1?90:130));
    for(let i=0;i<totalLeaves;i++){
      const c=centers[Math.floor(rnd()*centers.length)];
      const a=rnd()*TAU,u=rnd()*2-1;
      const rr=c.r*(.18+Math.pow(rnd(),.56)*.92);
      const radial=Math.sqrt(Math.max(0,1-u*u))*rr;
      const lx=c.x+Math.cos(a)*radial;
      const ly=c.y+u*rr*(species===1?.92:.76);
      const lz=c.z+Math.sin(a)*radial;
      const localTone=Math.max(0,Math.min(1,tone+(rnd()-.5)*.16));
      addLeaf(
        lx,ly,lz,
        localTone,
        species, // exactly one leaf morphology per tree
        phase+rnd()*TAU,
        species===1 ? .065+rnd()*.060 : .075+rnd()*.070,
        (rnd()-.5)*2.5
      );
    }

    // A fine outer shell of smaller leaves catches sunlight and breaks up the silhouette.
    const outer=(species===1?120:150)+Math.floor(rnd()*48);
    for(let i=0;i<outer;i++){
      const c=centers[Math.floor(rnd()*centers.length)],a=rnd()*TAU,rr=c.r*(.88+rnd()*.34);
      addLeaf(
        c.x+Math.cos(a)*rr,
        c.y+(rnd()-.48)*c.r*(species===1?1.02:.82),
        c.z+Math.sin(a)*rr,
        Math.max(0,Math.min(1,tone+(rnd()-.5)*.18)),
        species,
        phase+rnd()*TAU,
        species===1 ? .055+rnd()*.050 : .065+rnd()*.055,
        (rnd()-.5)*2.7
      );
    }
  };

  // A real winding woodland trail: trees never spawn inside this corridor.
  for(let z=2;z<spanZ;z+=13.0+rnd()*4.2){
    const trail=trailCenter(z);
    const rows=5+Math.floor(rnd()*2);
    for(let j=0;j<rows;j++){
      const side=rnd()<.5?-1:1;
      const near=side*(8.5+rnd()*20);
      const x=trail+near+(rnd()-.5)*4.0;
      addTree(x,z+rnd()*7);
      if(rnd()>.54)addTree(trail+side*(34+rnd()*28),z+rnd()*9);
      if(rnd()>.80)addTree(trail+side*(70+rnd()*48),z+rnd()*12);
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
  const leaves=Array.from({length:112},(_,i)=>({
    offset:rnd(),
    speed:.052+rnd()*.075,
    targetX:.03+rnd()*.94,
    targetY:.04+rnd()*.92,
    curve:(rnd()-.5)*.14,
    spin:(rnd()-.5)*1.05,
    phase:rnd()*TAU,
    sprite:i%4,
    layer:i%4
  }));
  return {
    draw(ctx,time,width,height,zen){
      if(!ctx||!width||!height)return;
      const vanishX=width*.50,vanishY=height*.46;
      const count=zen?leaves.length:74;
      const sunX=width*.72,sunY=height*.20;

      for(let i=0;i<count;i++){
        const l=leaves[i];
        const p=(l.offset+time*l.speed*(zen?1.10:.76))%1;
        const depth=Math.pow(p,1.70);
        const scaleLayer=[.58,.76,.94,1.14][l.layer];

        const tx=l.targetX*width,ty=l.targetY*height;
        const px=vanishX+(tx-vanishX)*depth+Math.sin(p*Math.PI)*l.curve*width;
        const py=vanishY+(ty-vanishY)*depth-Math.sin(p*Math.PI)*height*.025;

        const size=(2.4+48*Math.pow(depth,1.45))*scaleLayer;
        const fadeIn=Math.min(1,p/.075),fadeOut=Math.min(1,(1-p)/.10);
        const alpha=Math.max(0,Math.min(fadeIn,fadeOut))*(.22+.72*depth);

        const sunProximity=Math.max(0,1-Math.hypot(px-sunX,py-sunY)/Math.max(width,height)*1.75);
        const shimmer=sunProximity*(.34+.66*(.5+.5*Math.sin(time*1.55+l.phase)));

        ctx.save();
        ctx.translate(px,py);
        ctx.rotate(time*l.spin+l.phase+Math.sin(time*.74+l.phase)*.24);
        ctx.globalAlpha=alpha;
        ctx.shadowColor=`rgba(255,199,91,${.07+.28*shimmer})`;
        ctx.shadowBlur=2+11*shimmer;
        ctx.drawImage(sprites[l.sprite],-size/2,-size/2,size,size);

        if(shimmer>.25&&depth>.25){
          ctx.globalCompositeOperation="screen";
          ctx.globalAlpha=alpha*shimmer*.18;
          ctx.fillStyle="#ffe6a4";
          ctx.beginPath();
          ctx.ellipse(-size*.10,-size*.15,size*.14,size*.06,-.45,0,TAU);
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

function trailGeometry(segments=180,span=720){
  const verts=[],idx=[];
  for(let i=0;i<=segments;i++){
    const z=i/segments*span;
    const center=trailCenter(z);
    const width=7.2+.90*Math.sin(z*.023+1.2)+.45*Math.sin(z*.071);
    verts.push(center-width,z,center+width,z);
  }
  for(let i=0;i<segments;i++){
    const a=i*2,b=a+1,c=a+2,d=a+3;
    idx.push(a,c,b,b,c,d);
  }
  return {vertices:new Float32Array(verts),indices:new Uint32Array(idx)};
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
  out float vLogicalZ;
  void main(){
    float x=aPosition.x+uCamera.x;
    float z=aPosition.y;
    float logicalZ=z-uTravel;
    float y=-.62+.07*sin(x*.045)+.055*sin(logicalZ*.030+x*.015);
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

  float trail(float z){
    float a=6.28318530718*z/720.0;
    return sin(a*2.0)*7.2+sin(a*5.0+1.35)*2.7+sin(a+0.72)*3.9;
  }
  void main(){
    float center=trail(vLogicalZ);
    float dist=abs(vWorld.x-center);
    float edge=smoothstep(3.6,6.8,dist);
    float leaf=.5+.5*sin(vWorld.x*.43+sin(vLogicalZ*.17)*1.7);
    float leaf2=.5+.5*sin(vLogicalZ*.31-vWorld.x*.19);
    float mottled=.5+.5*sin(vWorld.x*.12+vLogicalZ*.071);

    vec3 pathDry=vec3(.38,.235,.105);
    vec3 pathLight=vec3(.57,.36,.16);
    vec3 soil=vec3(.115,.071,.031);
    vec3 moss=vec3(.25,.25,.072);
    vec3 ochre=vec3(.57,.265,.055);
    vec3 rust=vec3(.50,.12,.035);

    vec3 path=mix(pathDry,pathLight,.25+.28*mottled);
    vec3 forest=mix(soil,moss,.22+.18*mottled);
    forest=mix(forest,ochre,(.15+.25*leaf)*leaf2);
    forest=mix(forest,rust,.12*(1.0-leaf2));
    vec3 col=mix(path,forest,edge);

    // Irregular leaf litter softens the trail edges.
    float litter=smoothstep(2.4,7.8,dist)*(.18+.22*leaf*leaf2);
    col=mix(col,ochre,litter*.42);
    col*=.78+.18*(.5+.5*sin(vWorld.x*.031-vLogicalZ*.022));

    float fog=smoothstep(105.0,390.0,distance(vWorld,uCamera));
    col=mix(col,vec3(.74,.66,.52),fog*.92);
    outColor=vec4(col,1.0);
  }`;

  const PATH_VS_LOCAL=`#version 300 es
  layout(location=0) in vec2 aPosition;
  uniform mat4 uViewProj;
  uniform float uTravel;
  uniform float uSpan;
  out vec2 vPath;
  void main(){
    float logicalZ=aPosition.y;
    float z=mod(logicalZ+uTravel,uSpan)-uSpan;
    float y=-.43+.026*sin(logicalZ*.052)+.016*sin(aPosition.x*.17);
    vPath=aPosition;
    gl_Position=uViewProj*vec4(aPosition.x,y,z,1.0);
  }`;
  const PATH_FS_LOCAL=`#version 300 es
  precision highp float;
  in vec2 vPath;
  out vec4 outColor;
  void main(){
    float fine=.5+.5*sin(vPath.x*.82+vPath.y*.41);
    float coarse=.5+.5*sin(vPath.x*.18-vPath.y*.117+sin(vPath.y*.031));
    float litter=.5+.5*sin(vPath.x*1.73+vPath.y*.69);
    vec3 earth=vec3(.51,.325,.155);
    vec3 warm=vec3(.72,.49,.245);
    vec3 ochre=vec3(.58,.285,.070);
    vec3 russet=vec3(.42,.115,.035);
    vec3 col=mix(earth,warm,.26+.30*fine*coarse);
    col=mix(col,ochre,.055+.075*litter);
    col=mix(col,russet,.026*(1.0-coarse));
    float sunfleck=pow(max(0.0,sin(vPath.y*.087+vPath.x*.22)),8.0);
    col+=vec3(.13,.085,.030)*sunfleck;
    outColor=vec4(col,1.0);
  }`;

  let skyProgram,trunkProgram,leafProgram,groundProgram,pathProgram;
  try{
    const trunkVs=TRUNK_VS
      .replace("uniform float uSpan;","uniform float uSpanZ;\\nuniform float uSpanX;")
      .replace("float z=mod(iOffset.z+uTravel,uSpan)-uSpan;","float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;\\n  float z=mod(iOffset.z+uTravel,uSpanZ)-uSpanZ;")
      .replace("vec3 world=vec3(iOffset.x+iScale.y*sway,iOffset.y,z)+local*iScale;","vec3 world=vec3(x+iScale.y*sway,iOffset.y,z)+local*iScale;");
    skyProgram=program(gl,SKY_VS,SKY_FS);trunkProgram=program(gl,trunkVs,TRUNK_FS);leafProgram=program(gl,LEAF_VS,LEAF_FS);groundProgram=program(gl,GROUND_VS_LOCAL,GROUND_FS_LOCAL);pathProgram=program(gl,PATH_VS_LOCAL,PATH_FS_LOCAL);
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

  const trail=trailGeometry(180,forest.spanZ);
  const pathVao=keep(gl.createVertexArray());gl.bindVertexArray(pathVao);
  const pathPos=keep(gl.createBuffer());gl.bindBuffer(gl.ARRAY_BUFFER,pathPos);gl.bufferData(gl.ARRAY_BUFFER,trail.vertices,gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
  const pathIdx=keep(gl.createBuffer());gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,pathIdx);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,trail.indices,gl.STATIC_DRAW);
  gl.bindVertexArray(null);

  const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16);
  let cssWidth=1,cssHeight=1,disposed=false;
  const airLeaves=createAirLeaves();
  const uniforms={
    sky:{time:gl.getUniformLocation(skyProgram,"uTime"),aspect:gl.getUniformLocation(skyProgram,"uAspect"),zen:gl.getUniformLocation(skyProgram,"uZen")},
    trunk:{vp:gl.getUniformLocation(trunkProgram,"uViewProj"),travel:gl.getUniformLocation(trunkProgram,"uTravel"),spanZ:gl.getUniformLocation(trunkProgram,"uSpanZ"),spanX:gl.getUniformLocation(trunkProgram,"uSpanX"),time:gl.getUniformLocation(trunkProgram,"uTime"),camera:gl.getUniformLocation(trunkProgram,"uCamera")},
    leaf:{vp:gl.getUniformLocation(leafProgram,"uViewProj"),travel:gl.getUniformLocation(leafProgram,"uTravel"),spanZ:gl.getUniformLocation(leafProgram,"uSpanZ"),spanX:gl.getUniformLocation(leafProgram,"uSpanX"),time:gl.getUniformLocation(leafProgram,"uTime"),camera:gl.getUniformLocation(leafProgram,"uCamera")},
    ground:{vp:gl.getUniformLocation(groundProgram,"uViewProj"),camera:gl.getUniformLocation(groundProgram,"uCamera"),travel:gl.getUniformLocation(groundProgram,"uTravel")},
    path:{vp:gl.getUniformLocation(pathProgram,"uViewProj"),travel:gl.getUniformLocation(pathProgram,"uTravel"),span:gl.getUniformLocation(pathProgram,"uSpan")}
  };

  function resize({width,height,ratio=1}){
    cssWidth=Math.max(1,width);cssHeight=Math.max(1,height);
    const q=Math.min(ratio,cssWidth<=760?1.08:1.50),w=Math.max(1,Math.round(cssWidth*q)),h=Math.max(1,Math.round(cssHeight*q));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h)}
  }

  function renderWorld(time,camera){
    const zen=Boolean(camera);
    const cx=Math.max(-1.0,Math.min(1.0,camera?.x||0));
    const cy=Math.max(-1.15,Math.min(1.15,camera?.y||0));
    const cz=camera?.z||0;

    // Constant forward glide in contemplation mode + manual depth acceleration.
    const travel=time*(zen?15.2:.36)+cz*96.0;
    const nearLogical=16.0-travel;
    const farLogical=-58.0-travel;
    const pathNear=trailCenter(nearLogical);
    const pathFar=trailCenter(farLogical);

    const eyeX=pathNear+cx*7.4;
    const eyeY=4.35+cy*3.2+Math.sin(time*.031)*.10;
    const eye=[eyeX,eyeY,16.0];
    const target=[
      pathFar+cx*3.0,
      3.10+cy*.34,
      -58
    ];
    perspective(projection,zen ? .88 : .98,cssWidth/cssHeight,.12,860);
    lookAt(view,eye,target,[0,1,0]);multiply(vp,projection,view);

    gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.disable(gl.DEPTH_TEST);
    gl.useProgram(skyProgram);gl.bindVertexArray(skyVao);
    gl.uniform1f(uniforms.sky.time,time);gl.uniform1f(uniforms.sky.aspect,cssWidth/cssHeight);gl.uniform1f(uniforms.sky.zen,zen?1:0);
    gl.drawArrays(gl.TRIANGLES,0,3);

    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.clearDepth(1);gl.clear(gl.DEPTH_BUFFER_BIT);

    gl.useProgram(groundProgram);gl.bindVertexArray(groundVao);
    gl.uniformMatrix4fv(uniforms.ground.vp,false,vp);gl.uniform3f(uniforms.ground.camera,...eye);gl.uniform1f(uniforms.ground.travel,travel);
    gl.drawElements(gl.TRIANGLES,terrain.indices.length,gl.UNSIGNED_INT,0);

    gl.useProgram(pathProgram);gl.bindVertexArray(pathVao);
    gl.uniformMatrix4fv(uniforms.path.vp,false,vp);gl.uniform1f(uniforms.path.travel,travel);gl.uniform1f(uniforms.path.span,forest.spanZ);
    gl.drawElements(gl.TRIANGLES,trail.indices.length,gl.UNSIGNED_INT,0);

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
      try{for(const p of [skyProgram,trunkProgram,leafProgram,groundProgram,pathProgram])gl.deleteProgram(p);for(const r of resources){if(typeof WebGLVertexArrayObject!=="undefined"&&r instanceof WebGLVertexArrayObject)gl.deleteVertexArray(r);else gl.deleteBuffer(r)}}catch{}
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
  pathDepthGestures:true,
  flightBounds:{x:1.0,y:.62},
  depthGain:7.4,
  depthCap:22,
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
