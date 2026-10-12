import {createGLWorld,FULLSCREEN_VS,LIGHT_GLSL,perspective,lookAt,multiply} from './world-gl.mjs?v=20261012-refined-1';
import {createSceneMotion} from './scene-motion.mjs';
import {createLuminousRenderer} from './luminous-atmosphere.js';

export const SKY_FS=`#version 300 es
precision highp float;precision highp int;
in vec2 vUv;out vec4 outColor;
uniform float uTime,uAspect;uniform int uKind;
uniform vec3 uEye,uForward,uRight,uUp;
float hash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float n=.52*noise(p);p=p*2.03+vec3(4.1,1.7,9.2);n+=.27*noise(p);p=p*2.01+vec3(8.3,5.1,2.8);return n+.14*noise(p);}
vec3 stars(vec3 rd){
 vec2 p=vec2(atan(rd.x,-rd.z),asin(clamp(rd.y,-1.0,1.0)));vec3 s=vec3(0);
 for(int layer=0;layer<3;layer++){
  float scale=130.0+float(layer)*103.0;vec2 g=p*scale,id=floor(g);float h=hash(vec3(id,float(layer)*5.0));
  vec2 q=fract(g)-vec2(hash(vec3(id,2.3)),hash(vec3(id,4.8)));
  float size=mix(.030,.115,pow(h,32.0)),foot=clamp(length(fwidth(g))*.31,.03,.35),variance=size*size+foot*foot;
  float point=exp(-dot(q,q)/variance)*size*size/variance*step(.9980,h)*3.8;
  float pulse=.82+.18*sin(uTime*.48+h*95.0);vec3 tint=mix(vec3(.67,.77,1),vec3(1,.88,.73),hash(vec3(id,8.1)));
  s+=tint*point*pulse*(.45+pow(h,32.0)*2.0);
 }return s;
}
vec3 moon(vec3 rd,vec3 sky){
 vec3 dir=normalize(vec3(.38,.43,-1.0)),right=normalize(cross(dir,vec3(0,1,0))),up=cross(right,dir);
 vec2 p=vec2(dot(rd,right),dot(rd,up))/.095;float r=length(p);float h=exp(-r*r*.065)*.032;
 sky+=vec3(.32,.46,.88)*h;
 if(r<1.0){vec3 n=vec3(p,sqrt(max(0.0,1.0-r*r)));float terrain=fbm(vec3(p*13.0,3.7)),fine=fbm(vec3(p*67.0,8.1));
  float mare=smoothstep(.32,.69,fbm(vec3(p*4.8,1.0)));float light=.26+.74*max(dot(n,normalize(vec3(-.44,.29,.84))),0.0);
  vec3 c=mix(vec3(.44,.52,.64),vec3(.85,.89,.94),mare)*(.72+terrain*.22+fine*.08)*light;
  float edge=1.0-smoothstep(.97,1.0,r);sky=mix(sky,c*1.55,edge);
 }return sky;
}
vec3 aurora(vec3 ro,vec3 rd){
 vec3 emission=vec3(0.0);float trans=1.0;
 // Soft gas curtains have no lower contour or horizon silhouette.
 for(int i=0;i<28;i++){
  float reach=8.0+(float(i)+.5)*4.9;vec3 p=ro+rd*reach;float wind=uTime*.62;
  float fold=sin(p.x*.083+wind*.31)*10.5+sin(p.x*.19-wind*.19)*4.5+sin(p.x*.37+wind*.13)*1.2+sin(p.y*.043+wind*.18)*3.5+p.y*.075;
  float depth=mod(p.z+fold+22.0,49.0)-24.5;
  float curtain=exp(-depth*depth*.071);
  float band=sin(p.x*.041+p.z*.019+wind*.12)*9.0+7.0;
  float y=sin((p.y-band)*.021)*48.0;float vertical=.18+.82*exp(-y*y*.0009);
  float fibers=.33+.67*pow(.5+.5*sin(p.x*1.72+sin(p.x*.38+p.y*.027+wind*.29)*3.1+wind*.41),2.0);
  fibers*=.64+.40*noise(vec3(p.x*.18,p.y*.032-wind*.08,p.z*.09));
  float d=curtain*vertical*fibers*.054;
  float hue=.5+.5*sin(p.x*.039+p.z*.022+wind*.17+y*.018);
  vec3 color=mix(vec3(.11,.64,.57),vec3(.34,.26,.78),hue);
  color=mix(color,vec3(.64,.18,.55),smoothstep(.55,.98,hue)*.48);
  emission+=trans*color*d*1.65;trans*=1.0-d*.38;
 }return emission;
}
void main(){
 vec2 screen=(vUv*2.0-1.0)*vec2(uAspect,1.0)*.54;
 vec3 rd=normalize(uForward+uRight*screen.x+uUp*screen.y);float h=clamp(rd.y*.5+.5,0.0,1.0);vec3 sky;
 if(uKind==3){float wash=fbm(rd*3.0+vec3(uTime*.003,0,0));sky=mix(vec3(2.72,2.50,2.96),vec3(3.45,3.38,3.52),smoothstep(.05,.8,h))+(wash-.5)*.08;}
 else if(uKind==1){sky=mix(vec3(.012,.008,.008),vec3(.030,.019,.013),h);float glow=pow(max(dot(rd,normalize(vec3(-.6,.4,-1))),0.0),5.0);sky+=vec3(.066,.035,.015)*glow;}
 else{
  sky=mix(vec3(.004,.011,.026),vec3(.005,.009,.031),h);
  float n=fbm(rd*5.4+vec3(uTime*.003,0,0));float mist=pow(max(0.0,n-.33),2.0);
  sky+=mix(vec3(.06,.15,.32),vec3(.21,.06,.31),n)*mist*(uKind==0?.16:.45);
  if(uKind==0){sky=mix(vec3(.012,.006,.025),vec3(.026,.015,.049),h)+aurora(uEye,rd);}
  else sky=moon(rd,sky+stars(rd));
 }
 outColor=vec4(sky,1.0);
}`;

export function drawSky(world,p,time,kind,eye,view){
 const{gl,loc}=world;gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.useProgram(p);gl.bindVertexArray(null);
 gl.uniform1f(loc(p,'uTime'),time);gl.uniform1f(loc(p,'uAspect'),world.width/world.height);gl.uniform1i(loc(p,'uKind'),kind);gl.uniform3fv(loc(p,'uEye'),eye);
 gl.uniform3f(loc(p,'uForward'),-view[2],-view[6],-view[10]);gl.uniform3f(loc(p,'uRight'),view[0],view[4],view[8]);gl.uniform3f(loc(p,'uUp'),view[1],view[5],view[9]);gl.drawArrays(gl.TRIANGLES,0,3);
}
export const STRING_VS=`#version 300 es
precision highp float;precision highp int;
layout(location=0)in vec3 aPosition;layout(location=2)in vec2 aUv;
layout(location=3)in vec4 aInstance;layout(location=4)in vec4 aDetail;
uniform mat4 uViewProj;uniform vec3 uEye;uniform float uTime,uTravel;
out vec3 vWorld,vNormal;out vec2 vUv;out float vSeed;
vec3 path(float t){float b=aInstance.x,s=aInstance.y;
 float x=(t-.5)*340.0+uEye.x;
 float helix=s*6.283185+x*.046+uTime*.23;
 float baseY=mod(-12.0+b*.9-uEye.y+40.0,80.0)-40.0+uEye.y;
 float y=baseY+sin(x*.042+uTime*.28+b*.71)*7.2+sin(x*.094-uTime*.16+b)*1.8+cos(helix)*(1.15+.25*sin(x*.03));
 float z=mod(-b*23.0+uTravel+120.0,156.0)-120.0+sin(x*.063+uTime*.18+b)*7.0+sin(helix)*(2.8+.4*cos(x*.03));
 return vec3(x,y,z);
}
void main(){float t=aPosition.x;vec3 p=path(t),T=normalize(path(t+.0008)-path(t-.0008)),B=normalize(cross(T,vec3(0,1,0))),N=cross(B,T);
 vec3 normal=B*aPosition.y+N*aPosition.z;float width=aInstance.w*(.92+.08*sin(t*19.0+uTime*.2+aInstance.z));
 vWorld=p+normal*width;vNormal=normal;vUv=aUv;vSeed=aInstance.z;gl_Position=uViewProj*vec4(vWorld,1.0);
}`;
export const STRING_FS=`#version 300 es
precision highp float;precision highp int;in vec3 vWorld,vNormal;in vec2 vUv;in float vSeed;out vec4 outColor;
uniform vec3 uEye;uniform float uTime;
${LIGHT_GLSL}
void main(){vec3 V=normalize(uEye-vWorld),N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
 vec3 base=mix(vec3(.63,.28,.052),vec3(1.0,.75,.30),.5+.5*sin(vSeed*4.1));
 vec3 c=shadeSurface(base,N,V,normalize(vec3(-.6,.8,.6)),.23,.86,1.0);
 float crest=pow(max(0.0,sin(vUv.x*17.0-uTime*.34+vSeed*9.0)),24.0);
 float edge=pow(1.0-abs(dot(N,V)),3.0);c+=base*(.06+crest*.65+edge*.22);
 float distance=length(uEye-vWorld),near=smoothstep(2.0,8.0,distance),fog=exp(-distance*.0105);
 c=mix(vec3(.019,.011,.007),c,fog*near);outColor=vec4(c,1.0);
}`;
export function stringGeometry(segments=160,sides=8){
 const positions=[],uvs=[],indices=[];for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2;positions.push(i/segments,Math.cos(a),Math.sin(a));uvs.push(i/segments,j/sides);}
 for(let i=0;i<segments;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;indices.push(a,b,a+1,a+1,b,b+1);}return{positions,uvs,indices};
}
export function stringInstances(){const a=[],b=[];for(let layer=0;layer<6;layer++)for(let i=0;i<30;i++){a.push(layer,i/29,layer*1.731+i*.219,.024+(i%5)*.004);b.push(0,0,0,0);}return{a,b};}
export function createCelestialRenderer(ctx,kind){
 const world=createGLWorld(ctx,kind,{exposure:1.04,bloom:kind==='aurora'?.28:.28,vignette:.10,resolution:{maxPixels:1400000}});
 if(!world)return createLuminousRenderer(ctx,kind);
 world.canvas.dataset.layered='true';
 const{gl,loc}=world;let sky,threads,mesh;
 try{sky=world.program(FULLSCREEN_VS,SKY_FS);if(kind==='golden'){threads=world.program(STRING_VS,STRING_FS);mesh=world.mesh(stringGeometry(),stringInstances());}}
 catch(e){world.dispose();return createLuminousRenderer(ctx,kind);}
 const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16),motion=createSceneMotion({rest:.72,flight:2.2,xLimit:1e6,yLimit:1e6});
 return{canvas:world.canvas,resize:world.resize,draw({time,width,height,camera}){
  if(width!==world.width||height!==world.height)world.resize({width,height,ratio:devicePixelRatio||1});if(!world.begin())return;
  const{travel,input}=motion.step(time,camera);const eye=[input.x*3,input.y*1.7+(kind==='aurora'?1:2),24];
  lookAt(view,eye,[eye[0]+Math.sin(time*.035)*.25,eye[1],-16]);perspective(projection,1.0,width/height);multiply(vp,projection,view);
  const gasEye=kind==='aurora'?[eye[0],eye[1],eye[2]-travel-input.z*5]:eye;
  drawSky(world,sky,time,kind==='aurora'?0:1,gasEye,view);
  if(threads){gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.useProgram(threads);gl.uniformMatrix4fv(loc(threads,'uViewProj'),false,vp);gl.uniform3fv(loc(threads,'uEye'),eye);gl.uniform1f(loc(threads,'uTime'),time);gl.uniform1f(loc(threads,'uTravel'),travel+input.z*5);world.draw(mesh);}
  world.finish();
 },dispose:world.dispose};
}
