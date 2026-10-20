import{b as se}from"./chunk-chunk-AM4UQ47E.js";import{a as le,b as ce,c as fe,d as ue,e as me}from"./chunk-chunk-N4A2HCF7.js";import"./chunk-chunk-RQK7W35P.js";import"./chunk-chunk-AM55BNCL.js";import{a as ie}from"./chunk-chunk-424P3C67.js";var Ce=Math.PI*2,pe=(o,a,i)=>Math.max(a,Math.min(i,o));function ve(o,a){return Array.from({length:o},(i,t)=>{let r=t%5;return{layer:r,offset:a(),speed:[.016,.022,.03,.039,.049][r]*(.84+a()*.32),x:a(),sway:.007+r*.004+a()*.006,phase:a()*Ce,roll:.18+a()*.62,sprite:Math.floor(a()*4),size:[3.1,5,7.2,10.4,15][r]*(.8+a()*.4)}})}function de(o,a,i,t){let r=((o.offset+a*o.speed)%1+1)%1,e=Math.max(28,o.size*2),m=Math.sin(a*.42+o.phase)+.32*Math.sin(a*.19+o.phase*1.71),p=i+e*2,u=((o.x*i+m*i*o.sway+e)%p+p)%p-e,n=-e+r*(t+e*2),s=pe(r/.065,0,1)*pe((1-r)/.085,0,1);return{x:u,y:n,progress:r,fade:s,size:o.size}}var L=Math.PI*2;function oe(o=48127){let a=o>>>0;return()=>(a=a*1664525+1013904223>>>0,a/4294967296)}function he(o,a,i){let t=o.createShader(a);if(o.shaderSource(t,i),o.compileShader(t),!o.getShaderParameter(t,o.COMPILE_STATUS)){let r=o.getShaderInfoLog(t)||"Shader compilation failed";throw o.deleteShader(t),new Error(r)}return t}function H(o,a,i){let t=o.createProgram(),r=he(o,o.VERTEX_SHADER,a),e=he(o,o.FRAGMENT_SHADER,i);if(o.attachShader(t,r),o.attachShader(t,e),o.linkProgram(t),o.deleteShader(r),o.deleteShader(e),!o.getProgramParameter(t,o.LINK_STATUS)){let m=o.getProgramInfoLog(t)||"Program link failed";throw o.deleteProgram(t),new Error(m)}return t}function Fe(o,a,i,t,r){let e=1/Math.tan(a/2);o.fill(0),o[0]=e/i,o[5]=e,o[11]=-1,o[15]=0;let m=1/(t-r);return o[10]=(r+t)*m,o[14]=2*r*t*m,o}function Le(o,a,i,t){let r,e,m,p,l,u,n,s,v,f;return n=a[0]-i[0],s=a[1]-i[1],v=a[2]-i[2],f=Math.hypot(n,s,v)||1,n/=f,s/=f,v/=f,r=t[1]*v-t[2]*s,e=t[2]*n-t[0]*v,m=t[0]*s-t[1]*n,f=Math.hypot(r,e,m)||1,r/=f,e/=f,m/=f,p=s*m-v*e,l=v*r-n*m,u=n*e-s*r,o[0]=r,o[1]=p,o[2]=n,o[3]=0,o[4]=e,o[5]=l,o[6]=s,o[7]=0,o[8]=m,o[9]=u,o[10]=v,o[11]=0,o[12]=-(r*a[0]+e*a[1]+m*a[2]),o[13]=-(p*a[0]+l*a[1]+u*a[2]),o[14]=-(n*a[0]+s*a[1]+v*a[2]),o[15]=1,o}function Re(o,a,i){let t=new Float32Array(16);for(let r=0;r<4;r++)for(let e=0;e<4;e++)t[r*4+e]=a[e]*i[r*4]+a[4+e]*i[r*4+1]+a[8+e]*i[r*4+2]+a[12+e]*i[r*4+3];return o.set(t),o}var ze=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}
`,Pe=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uAspect;
uniform float uZen;

${ce}
${fe}
void main(){
  vec3 rd=skyRay(vUv,uAspect);
  float h=max(0.0,rd.y);
  vec3 top=vec3(.24,.52,.72),mid=vec3(.54,.72,.82),haze=vec3(.80,.75,.64);
  vec3 col=mix(haze,mix(mid,top,smoothstep(.10,.72,h)),1.0-exp(-h*3.0));
  vec3 sunDir=normalize(vec3(.43,.31,-1.0));
  float sunDot=max(dot(rd,sunDir),0.0);
  col+=vec3(.65,.46,.22)*pow(sunDot,160.0)*.34+vec3(.54,.34,.13)*pow(sunDot,24.0)*.12;
  vec2 vapour=smokeField(vec2(atan(rd.x,-rd.z),rd.y),uTime,0.0);
  vec3 cloud=mix(vec3(.95,.94,.87),vec3(.64,.73,.76),vapour.y*.58);
  col=mix(col,cloud,vapour.x*smoothstep(.012,.10,h)*.40);
  col=mix(col,haze,exp(-h*28.0)*(.22+.04*uZen));
  col=mix(haze,col,smoothstep(0.0,.009,h));
  outColor=vec4(col,1.0);
}`;function ke(o=7){let a=[],i=[];for(let t=0;t<o;t++){let r=t/o*L,e=(t+1)/o*L,m=Math.cos(r)*.5,p=Math.sin(r)*.5,l=Math.cos(e)*.5,u=Math.sin(e)*.5,n=Math.cos((r+e)*.5),s=Math.sin((r+e)*.5),v=[m,-.5,p,l,-.5,u,l,.5,u,m,-.5,p,l,.5,u,m,.5,p];a.push(...v);for(let f=0;f<6;f++)i.push(n,0,s);a.push(0,.5,0,m,.5,p,l,.5,u);for(let f=0;f<3;f++)i.push(0,1,0)}return{positions:new Float32Array(a),normals:new Float32Array(i)}}var we=`#version 300 es
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
    float pitch=iScale.z;
    vec3 dir=normalize(vec3(cos(az)*cos(pitch),sin(pitch),sin(az)*cos(pitch)));
    vec3 ref=abs(dir.y)>.94?vec3(1.0,0.0,0.0):vec3(0.0,1.0,0.0);
    vec3 side=normalize(cross(dir,ref));
    vec3 binormal=normalize(cross(side,dir));
    float along=clamp(aPosition.y+.5,0.0,1.0);
    float taper=mix(1.0,.055,smoothstep(.06,1.0,along));
    world=center
      +dir*(aPosition.y*iScale.y)
      +side*(aPosition.x*iScale.x*taper)
      +binormal*(aPosition.z*iScale.x*.86*taper);
    normal=normalize(side*aNormal.x+binormal*aNormal.z+dir*aNormal.y*.12);
  }else{
    vec3 local=aPosition;
    float y01=clamp(local.y+.5,0.,1.);
    local.xz*=mix(1.0,.095,smoothstep(.16,.98,y01));
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
`,_e=`#version 300 es
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
`,De=`#version 300 es
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
uniform float uFalling;
out vec2 vLeaf;
out float vTone;
out float vType;
out float vPhase;
out float vSun;
out float vBacklight;
out float vDistance;
out float vFade;
void main(){
  float x=mod(iOffset.x-uCamera.x+uSpanX*.5,uSpanX)-uSpanX*.5+uCamera.x;
  float z=mod(iOffset.z+uTravel+56.0,uSpanZ)-uSpanZ+56.0;
  float phase=iMeta.z;
  float size=iMeta.w*2.45;
  vec3 center=vec3(x,iOffset.y,z);
  vFade=1.0;
  if(uFalling>.5){
    float range=iOffset.y+.52;
    float rate=.38+.42*(.5+.5*sin(phase*2.173));
    float progress=fract(phase/6.2831853+uTime*rate/range);
    center.y=iOffset.y-progress*range;
    center.x+=sin(uTime*.42+phase)*.82+sin(uTime*.19+phase*1.71)*.26;
    center.z+=sin(uTime*.24+phase*.93)*.28;
    vFade=smoothstep(0.0,.055,progress)*(1.0-smoothstep(.93,1.0,progress));
  }

  float az=iAngle+phase*.19+uTime*.27*uFalling;
  float tilt=mix(.28+1.05*(.5+.5*sin(phase*1.37+2.1)),1.06+sin(uTime*.69+phase)*.36,uFalling);
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
`,Ee=`#version 300 es
precision highp float;
in vec2 vLeaf;
in float vTone;
in float vType;
in float vPhase;
in float vSun;
in float vBacklight;
in float vDistance;
in float vFade;
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
  float alpha=mask*vFade*(1.0-smoothstep(320.0,450.0,vDistance));
  outColor=vec4(col,alpha);
}
`;function J(o,a,i,t){let r=a[0]-o[0],e=a[1]-o[1],m=a[2]-o[2];return[(o[0]+a[0])*.5,(o[1]+a[1])*.5,(o[2]+a[2])*.5,i,Math.hypot(r,e,m),Math.atan2(e,Math.hypot(r,m)),-Math.max(.02,t),Math.atan2(m,r)]}function Be(){let o=oe(91277),a=720,i=360,t=[],r=[],e=(p,l,u,n,s,v,f,g)=>r.push(p,l,u,n,s,v,f,g),m=(p,l)=>{let u=-.6+.1*Math.sin(p*.037)+.07*Math.sin(l*.026+p*.014),n=Math.floor(o()*4),s=n===1?15+o()*11:n===2?11+o()*8:12+o()*9,v=n===1?.2+o()*.18:.34+o()*.34,f=[.36,.08,.68,.52][n]+(o()-.5)*.1,g=o()*L;t.push(p,u+s*.5,l,v*2,s,v*2,Math.max(.02,f),g);let A=[],x=(d,c,h,b)=>A.push({x:d,y:c,z:h,r:b});if(n===1)for(let d=0;d<11;d++){let c=d/10,h=d*2.399+o()*.2,b=.7+o()*1.35;x(p+Math.cos(h)*b,u+s*(.47+c*.45),l+Math.sin(h)*b,.92+o()*.48)}else if(n===2){x(p,u+s*.79,l,2.55+o()*.58);for(let d=0;d<13;d++){let c=d/13*L+o()*.24,h=2.35+o()*3.05;x(p+Math.cos(c)*h,u+s*(.53+o()*.27),l+Math.sin(c)*h,1.38+o()*.72)}}else if(n===0){x(p,u+s*.84,l,2.18+o()*.62);for(let d=0;d<12;d++){let c=d/12*L+o()*.32,h=1.75+o()*2.7;x(p+Math.cos(c)*h,u+s*(.56+o()*.31),l+Math.sin(c)*h,1.24+o()*.69)}}else for(let d=0;d<12;d++){let c=d/11,h=d*2.12+o()*.22,b=1.05+o()*1.72;x(p+Math.cos(h)*b,u+s*(.49+c*.41),l+Math.sin(h)*b,1.28+o()*.62)}let C=u+s*(n===2?.31:.37),z=Math.min(n===1?9:12,A.length);for(let d=0;d<z;d++){let c=A[d];if(o()<.06)continue;let h=c.x-p,b=c.z-l,P=Math.atan2(b,h),F=Math.max(2,Math.hypot(Math.hypot(h,b),c.y-C)*(.58+o()*.12)),O=[p,Math.min(c.y-1.8,C+s*.12*d/z),l],N=[c.x,c.y-c.r*.15,c.z];if(t.push(...J(O,N,v*.26,f)),o()>.14){let k=P+(o()-.5)*.78,E=F*(.28+o()*.24),G=p+h*.7,K=C+(c.y-C)*.62,$=l+b*.7,Z=O.map((B,U)=>B+(N[U]-B)*.72),X=[c.x+Math.cos(k)*c.r*.55,c.y+c.r*.28,c.z+Math.sin(k)*c.r*.55];if(t.push(...J(Z,X,v*.1,f)),o()>.32){let B=k+(o()-.5)*.88,U=E*(.32+o()*.22),I=G+Math.cos(k)*E*.42,Q=K+E*.34,T=$+Math.sin(k)*E*.42}}}let _=n===1?3:4;for(let d=0;d<_;d++){let c=g+d/_*L+(o()-.5)*.42,h=s*(.15+o()*.09),b=p+Math.cos(c)*v*.22,P=u+s*(.79+o()*.055),F=l+Math.sin(c)*v*.22;t.push(...J([p,P,l],[b+Math.cos(c)*h*.18,P+h*.7,F+Math.sin(c)*h*.18],v*.07,f))}let w=(n===1?565:690)+Math.floor(o()*(n===1?90:125));for(let d=0;d<w;d++){let c=A[Math.floor(o()*A.length)],h=o()*L,b=o()*2-1,P=c.r*(.1+Math.pow(o(),.58)*1.02),F=Math.sqrt(Math.max(0,1-b*b))*P;e(c.x+Math.cos(h)*F,c.y+b*P*(n===1?.97:.79),c.z+Math.sin(h)*F,Math.max(0,Math.min(1,f+(o()-.5)*.14)),n,g+o()*L,n===1?.07+o()*.052:.082+o()*.06,(o()-.5)*L)}let V=(n===1?125:175)+Math.floor(o()*48);for(let d=0;d<V;d++){let c=A[Math.floor(o()*A.length)],h=o()*L,b=c.r*(.91+o()*.32);e(c.x+Math.cos(h)*b,c.y+(o()-.5)*c.r*(n===1?1.03:.84),c.z+Math.sin(h)*b,Math.max(0,Math.min(1,f+(o()-.5)*.16)),n,g+o()*L,n===1?.06+o()*.042:.068+o()*.048,(o()-.5)*L)}};for(let p=4;p<a;p+=19+o()*6)for(let l of[-1,1])o()>.06&&m(l*(12+o()*17)+(o()-.5)*3.2,p+o()*7),o()>.55&&m(l*(34+o()*28),p+o()*9),o()>.88&&m(l*(70+o()*40),p+o()*12);return{spanZ:a,spanX:i,trunks:new Float32Array(t),trunkCount:t.length/8,leaves:new Float32Array(r),leafCount:r.length/8}}function Ue(o){let a=oe(77329),i=[];for(let t=0;t<1280;t++)i.push((a()-.5)*128,16+a()*15,a()*o,.18+a()*.68,Math.floor(a()*4),a()*L,.066+a()*.06,a()*L);return{data:new Float32Array(i),count:i.length/8}}function be(){let o=(a,i,t)=>{let r=document.createElement("canvas");r.width=128,r.height=128;let e=r.getContext("2d");e.translate(64,61);let m=e.createLinearGradient(-34,-38,34,42);return m.addColorStop(0,i),m.addColorStop(1,t),e.fillStyle=m,e.strokeStyle="rgba(76,37,14,.31)",e.lineWidth=1.1,e.beginPath(),a==="maple"?(e.moveTo(0,-50),e.lineTo(9,-25),e.lineTo(31,-39),e.lineTo(25,-12),e.lineTo(49,-7),e.lineTo(26,10),e.lineTo(31,35),e.lineTo(7,23),e.lineTo(0,48),e.lineTo(-7,23),e.lineTo(-31,35),e.lineTo(-26,10),e.lineTo(-49,-7),e.lineTo(-25,-12),e.lineTo(-31,-39),e.lineTo(-9,-25),e.closePath()):a==="oak"?(e.moveTo(0,-47),e.bezierCurveTo(22,-39,16,-27,33,-18),e.bezierCurveTo(17,-8,31,5,18,13),e.bezierCurveTo(8,22,14,35,0,46),e.bezierCurveTo(-14,35,-8,22,-18,13),e.bezierCurveTo(-31,5,-17,-8,-33,-18),e.bezierCurveTo(-16,-27,-22,-39,0,-47),e.closePath()):a==="birch"?(e.moveTo(0,-50),e.bezierCurveTo(29,-31,24,17,0,47),e.bezierCurveTo(-24,17,-29,-31,0,-50),e.closePath()):(e.moveTo(0,-47),e.bezierCurveTo(34,-27,32,19,0,44),e.bezierCurveTo(-32,19,-34,-27,0,-47),e.closePath()),e.fill(),e.stroke(),e.strokeStyle="rgba(87,45,16,.34)",e.beginPath(),e.moveTo(0,-42),e.lineTo(0,54),e.stroke(),e.globalAlpha=.44,e.strokeStyle="rgba(255,228,155,.46)",e.beginPath(),e.moveTo(-2,-13),e.lineTo(-20,-3),e.moveTo(2,3),e.lineTo(21,13),e.stroke(),r};return[o("maple","#ffd86d","#b9471d"),o("birch","#f4d75a","#9b7c1f"),o("oak","#e7a03b","#7b2a17"),o("beech","#e88935","#8e321d")]}function Ve(){let o=oe(22771),a=be(),i=ve(128,o);return{draw(t,r,e,m,p){if(!t||!e||!m)return;let l=e<=760?88:i.length,u=e*.72,n=m*.2;for(let s=0;s<l;s++){let v=i[s],{x:f,y:g,size:A,fade:x}=de(v,r,e,m),C=.2+v.layer*.2,z=x*(.22+.44*C),w=Math.max(0,1-Math.hypot(f-u,g-n)/Math.max(e,m)*1.8)*(.28+.72*(.5+.5*Math.sin(r*1.35+v.phase)));t.save(),t.translate(f,g),t.rotate(Math.sin(r*.62+v.phase)*v.roll+r*.16),t.scale(.38+.62*Math.abs(Math.cos(r*.72+v.phase)),1),t.globalAlpha=z,t.shadowColor=`rgba(255,202,96,${.05+.25*w})`,t.shadowBlur=.5+2.5*w,t.drawImage(a[v.sprite],-A/2,-A/2,A,A),w>.34&&C>.28&&(t.globalCompositeOperation="screen",t.globalAlpha=z*w*.15,t.fillStyle="#ffe9ad",t.beginPath(),t.ellipse(-A*.1,-A*.16,A*.13,A*.055,-.45,0,L),t.fill()),t.restore()}}}}var Ae={title:"Звучание Янтарного леса",loops:[{src:"audio-library/nature/forest_morning.ogg",volume:.15},{src:"audio-library/nature/wind_soft.ogg",fallback:"audio-library/compatible/nature/wind_soft.m4a",volume:.12},{src:"audio-library/ambience/deep_forest.ogg",fallback:"audio-library/compatible/ambience/deep_forest.m4a",volume:.06},{src:"audio-library/ambience/park_path.ogg",fallback:"audio-library/compatible/ambience/park_path.m4a",volume:.045}],oneShots:[{src:"audio-library/nature/crow_caw.ogg",volume:.065,minDelay:30,maxDelay:72}]};function Oe(){return le(Ae)}function Ne(o=84,a=188){let i=[],t=[];for(let l=0;l<=a;l++){let u=l/a,n=38+-1838*u;for(let s=0;s<=o;s++){let v=s/o;i.push(-220+440*v,n)}}for(let l=0;l<a;l++)for(let u=0;u<o;u++){let n=l*(o+1)+u,s=n+1,v=(l+1)*(o+1)+u,f=v+1;t.push(n,v,s,s,v,f)}return{vertices:new Float32Array(i),indices:new Uint32Array(t)}}function ee(o){let a=be(),i=Ve();return{resize(){},draw({time:t,width:r,height:e,camera:m}){let p=!!m,l=(m?.x||0)*52,u=o.createLinearGradient(0,0,0,e);u.addColorStop(0,"#6d94a0"),u.addColorStop(.36,"#c6b382"),u.addColorStop(.56,"#d39a50"),u.addColorStop(1,"#2a1a10"),o.fillStyle=u,o.fillRect(0,0,r,e);let n=o.createRadialGradient(r*.72,e*.22,4,r*.72,e*.22,r*.34);n.addColorStop(0,"rgba(255,235,162,.82)"),n.addColorStop(.25,"rgba(255,190,84,.24)"),n.addColorStop(1,"rgba(255,190,84,0)"),o.fillStyle=n,o.fillRect(0,0,r,e*.72);let s=e*.54,v=[{count:34,scale:.36,alpha:.32,y:s-18,parallax:.1},{count:28,scale:.62,alpha:.55,y:s+5,parallax:.22},{count:22,scale:1,alpha:.88,y:s+28,parallax:.42}];for(let g=0;g<v.length;g++){let A=v[g];for(let x=0;x<A.count;x++){let z=((x*97.3+g*41.7-l*A.parallax)%(r*1.65)+r*1.65)%(r*1.65)-r*.32,_=Math.sin(t*.25+x*.91+g)*5*A.scale,w=A.y+x%4*4*A.scale,V=(60+x%7*12)*A.scale,d=(4+x%3)*A.scale;o.globalAlpha=A.alpha,o.fillStyle=g===2?"#5b3119":"#684225",o.fillRect(z-d/2+_*.12,w-V,d,V);let c=w-V,h=g===2?12:8;for(let b=0;b<h;b++){let P=b/h*L+x*.37,F=(18+b%3*7)*A.scale,O=z+_+Math.cos(P)*F,N=c+Math.sin(P)*F*.62,k=(22+b%4*5)*A.scale;o.drawImage(a[(x+b+g)%a.length],O-k/2,N-k/2,k,k)}}}o.globalAlpha=1;let f=o.createLinearGradient(0,s-80,0,s+100);f.addColorStop(0,"rgba(248,222,178,0)"),f.addColorStop(.48,"rgba(248,222,178,.18)"),f.addColorStop(1,"rgba(248,222,178,0)"),o.fillStyle=f,o.fillRect(0,s-80,r,180),i.draw(o,t,r,e,p)},dispose(){}}}function We(o){let a=o?.canvas;if(!a||!document.body)return ee(o);let i=document.createElement("canvas");i.className="theme-world-canvas amber-forest-world",i.setAttribute("aria-hidden","true"),Object.assign(i.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block",transform:"translateZ(0)",backfaceVisibility:"hidden",willChange:"transform"}),a.parentNode?.insertBefore(i,a);let t=document.createElement("style");t.textContent='html[data-theme="amber-forest"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="amber-forest"] .flight-hint{color:#fff0d8;opacity:.82}html[data-theme="amber-forest"] .theme-sound-toggle[data-enabled="true"]{color:#fff3d5;box-shadow:0 0 0 1px #ffd89566,0 0 30px #efaa463d}',document.head.append(t);let r=Oe(),e=i.getContext("webgl2",{alpha:!1,antialias:!0,depth:!0,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1});if(!e){i.remove();let y=ee(o),S=y.dispose;return y.dispose=()=>{S?.(),t.remove(),r.dispose()},y}let m=`#version 300 es
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
  }`,p=`#version 300 es
  precision highp float;
  in vec3 vWorld;
  in float vLogicalZ;
  out vec4 outColor;
  uniform vec3 uCamera;
  uniform float uTravel;

  float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
  float field(vec2 p){
    vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
    return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);
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
    col*=.78+.22*shadow;
    float sunPatch=smoothstep(.78,.91,field(p*.031+vec2(.7,2.8)));
    col+=vec3(.115,.080,.026)*sunPatch;

    // Fine fallen-leaf speckle without geometric tiles.
    vec2 cell=floor(p*2.2),local=fract(p*2.2)-.5;
    float speck=smoothstep(.69,.91,hash(cell))*(1.0-smoothstep(.09,.28,length(local*vec2(1.,1.8))));
    col=mix(col,mix(ochre,copper,n2),speck*.16);

    float dist=distance(vWorld,uCamera);
    float fog=smoothstep(92.0,360.0,dist);
    float farFog=smoothstep(270.0,520.0,dist);
    vec3 haze=vec3(.80,.75,.64);
    col=mix(col,haze,fog*.94);
    col=mix(col,haze,farFog);
    outColor=vec4(col,1.0);
  }`,l,u,n,s;try{l=H(e,ze,Pe),u=H(e,we,_e),n=H(e,De,Ee),s=H(e,m,p)}catch(y){console.warn("Amber Forest WebGL unavailable",y),i.remove();let S=ee(o),M=S.dispose;return S.dispose=()=>{M?.(),t.remove(),r.dispose()},S}let v=[],f=y=>(y&&v.push(y),y),g=f(e.createVertexArray()),A=f(e.createBuffer());e.bindVertexArray(g),e.bindBuffer(e.ARRAY_BUFFER,A),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let x=e.getAttribLocation(l,"aPosition");e.enableVertexAttribArray(x),e.vertexAttribPointer(x,2,e.FLOAT,!1,0,0);let C=Be(),z=ke(10),_=f(e.createVertexArray());e.bindVertexArray(_);let w=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,w),e.bufferData(e.ARRAY_BUFFER,z.positions,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0);let V=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,V),e.bufferData(e.ARRAY_BUFFER,z.normals,e.STATIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,0,0);let d=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,d),e.bufferData(e.ARRAY_BUFFER,C.trunks,e.STATIC_DRAW);let c=32;e.enableVertexAttribArray(2),e.vertexAttribPointer(2,3,e.FLOAT,!1,c,0),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,3,e.FLOAT,!1,c,12),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,1,e.FLOAT,!1,c,24),e.vertexAttribDivisor(4,1),e.enableVertexAttribArray(5),e.vertexAttribPointer(5,1,e.FLOAT,!1,c,28),e.vertexAttribDivisor(5,1);let h=f(e.createVertexArray());e.bindVertexArray(h);let b=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,b),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let P=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,P),e.bufferData(e.ARRAY_BUFFER,C.leaves,e.STATIC_DRAW);let F=32;e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,F,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,4,e.FLOAT,!1,F,12),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,1,e.FLOAT,!1,F,28),e.vertexAttribDivisor(3,1);let O=Ue(C.spanZ),N=f(e.createVertexArray());e.bindVertexArray(N),e.bindBuffer(e.ARRAY_BUFFER,b),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let k=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,k),e.bufferData(e.ARRAY_BUFFER,O.data,e.STATIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,F,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,4,e.FLOAT,!1,F,12),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,1,e.FLOAT,!1,F,28),e.vertexAttribDivisor(3,1);let E=Ne(84,188),G=f(e.createVertexArray());e.bindVertexArray(G);let K=f(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,K),e.bufferData(e.ARRAY_BUFFER,E.vertices,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let $=f(e.createBuffer());e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,$),e.bufferData(e.ELEMENT_ARRAY_BUFFER,E.indices,e.STATIC_DRAW),e.bindVertexArray(null);let Z=new Float32Array(16),X=new Float32Array(16),B=new Float32Array(16),U=1,I=1,Q=!1,T={sky:{time:e.getUniformLocation(l,"uTime"),aspect:e.getUniformLocation(l,"uAspect"),zen:e.getUniformLocation(l,"uZen")},trunk:{vp:e.getUniformLocation(u,"uViewProj"),travel:e.getUniformLocation(u,"uTravel"),spanZ:e.getUniformLocation(u,"uSpanZ"),spanX:e.getUniformLocation(u,"uSpanX"),time:e.getUniformLocation(u,"uTime"),camera:e.getUniformLocation(u,"uCamera")},leaf:{vp:e.getUniformLocation(n,"uViewProj"),travel:e.getUniformLocation(n,"uTravel"),spanZ:e.getUniformLocation(n,"uSpanZ"),spanX:e.getUniformLocation(n,"uSpanX"),time:e.getUniformLocation(n,"uTime"),camera:e.getUniformLocation(n,"uCamera"),falling:e.getUniformLocation(n,"uFalling")},ground:{vp:e.getUniformLocation(s,"uViewProj"),camera:e.getUniformLocation(s,"uCamera"),travel:e.getUniformLocation(s,"uTravel")}},ye=ue(e,l);function ae({width:y,height:S,ratio:M=1}){U=Math.max(1,y),I=Math.max(1,S);let{width:D,height:R}=ie({width:U,height:I,ratio:M});(i.width!==D||i.height!==R)&&(i.width=D,i.height=R,e.viewport(0,0,D,R))}let ge=se({rest:.34,flight:5.8,xLimit:1.12,yLimit:1.08});function xe(y,S){let M=!!S,D=ge.step(y,S),{x:R,y:W,z:Y}=D.input,q=D.travel+Y*64,Te=Math.sin(y*.075)*1.45+Math.sin(y*.031+1.2)*.85,Se=Math.sin(y*.052+.5)*.22,te=Te+R*8.2,re=7.8+Se+W*5.35,j=[te,re,12],Me=[te+Math.sin(y*.041)*1.15+R*.55,re-1.55+W*.12,-94],ne=M?.9:.98;Fe(Z,ne,U/I,.12,980),Le(X,j,Me,[0,1,0]),Re(B,Z,X),e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.useProgram(l),e.bindVertexArray(g),e.uniform1f(T.sky.time,y),e.uniform1f(T.sky.aspect,U/I),e.uniform1f(T.sky.zen,M?1:0),me(e,ye,X,ne),e.drawArrays(e.TRIANGLES,0,3),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.clearDepth(1),e.clear(e.DEPTH_BUFFER_BIT),e.useProgram(s),e.bindVertexArray(G),e.uniformMatrix4fv(T.ground.vp,!1,B),e.uniform3f(T.ground.camera,...j),e.uniform1f(T.ground.travel,q),e.drawElements(e.TRIANGLES,E.indices.length,e.UNSIGNED_INT,0),e.enable(e.CULL_FACE),e.cullFace(e.BACK),e.useProgram(u),e.bindVertexArray(_),e.uniformMatrix4fv(T.trunk.vp,!1,B),e.uniform1f(T.trunk.travel,q),e.uniform1f(T.trunk.spanZ,C.spanZ),e.uniform1f(T.trunk.spanX,C.spanX),e.uniform1f(T.trunk.time,y),e.uniform3f(T.trunk.camera,...j),e.drawArraysInstanced(e.TRIANGLES,0,z.positions.length/3,C.trunkCount),e.disable(e.CULL_FACE),e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.depthMask(!1),e.useProgram(n),e.bindVertexArray(h),e.uniformMatrix4fv(T.leaf.vp,!1,B),e.uniform1f(T.leaf.travel,q),e.uniform1f(T.leaf.spanZ,C.spanZ),e.uniform1f(T.leaf.spanX,C.spanX),e.uniform1f(T.leaf.time,y),e.uniform3f(T.leaf.camera,...j),e.uniform1f(T.leaf.falling,0),e.drawArraysInstanced(e.TRIANGLES,0,6,C.leafCount),e.bindVertexArray(N),e.uniform1f(T.leaf.falling,1),e.drawArraysInstanced(e.TRIANGLES,0,6,O.count),e.depthMask(!0),e.disable(e.BLEND),e.bindVertexArray(null)}return{canvas:i,resize:ae,draw({time:y,width:S,height:M,camera:D}){if(Q)return;(S!==U||M!==I)&&ae({width:S,height:M,ratio:window.devicePixelRatio||1}),xe(y,D);let R=o.createLinearGradient(0,M*.31,0,M*.62);R.addColorStop(0,"rgba(226,211,181,0)"),R.addColorStop(.38,"rgba(226,211,181,.035)"),R.addColorStop(.58,"rgba(210,192,160,.090)"),R.addColorStop(.82,"rgba(202,181,147,.035)"),R.addColorStop(1,"rgba(202,181,147,0)"),o.fillStyle=R,o.fillRect(0,M*.28,S,M*.38);let W=o.createRadialGradient(S*.72,M*.22,4,S*.72,M*.22,Math.max(S,M)*.46);if(W.addColorStop(0,"rgba(255,224,144,.20)"),W.addColorStop(.32,"rgba(255,186,78,.075)"),W.addColorStop(1,"rgba(255,186,78,0)"),o.fillStyle=W,o.fillRect(0,0,S,M),!D){let Y=o.createLinearGradient(0,0,0,M);Y.addColorStop(0,"rgba(26,20,13,.025)"),Y.addColorStop(.55,"rgba(22,15,9,.09)"),Y.addColorStop(1,"rgba(14,10,6,.30)"),o.fillStyle=Y,o.fillRect(0,0,S,M)}},dispose(){Q=!0,i.remove(),t.remove(),r.dispose();try{for(let y of[l,u,n,s])e.deleteProgram(y);for(let y of v)typeof WebGLVertexArrayObject<"u"&&y instanceof WebGLVertexArrayObject?e.deleteVertexArray(y):e.deleteBuffer(y);e.getExtension("WEBGL_lose_context")?.loseContext()}catch{}}}}var He={id:"amber-forest",renderer:"webgl-infinite-autumn-forest",particles:!1,marks:!0,flightCards:!0,autoFlightCards:!0,continuousDepth:!0,flightBounds:{x:1.12,y:1.08},depthGain:2.8,depthCap:6,depthDirectScale:.22,cameraSmoothing:4.2,depthDamping:4.8,accent:"#f2b45b",dim:"#dbc9b4",surface:"34,23,15",panel:{bg:"rgba(48,31,20,.56)",border:"rgba(244,193,117,.27)",glow:"rgba(232,143,52,.17)",text:"#fff7e8",muted:"#dbc9b4"},radius:"26px",buttonRadius:"26px",heading:'"Cormorant Garamond", Georgia, serif',body:'"Nunito", system-ui, sans-serif',colors:["#ffd15c","#ee8d31","#c84d26","#8f8b2f"],backgrounds:["radial-gradient(ellipse at 72% 20%,rgba(248,166,65,.40),transparent 42%),radial-gradient(ellipse at 20% 15%,rgba(121,94,63,.32),transparent 56%)","radial-gradient(ellipse at 55% 42%,rgba(210,117,39,.16),transparent 54%)","linear-gradient(to bottom,rgba(72,56,42,.16),rgba(25,18,12,.48))"],soundscape:Ae,createRenderer:We};export{J as branchSegment,He as default};
