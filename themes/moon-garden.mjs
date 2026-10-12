import {createGLWorld,FULLSCREEN_VS,LIGHT_GLSL,perspective,lookAt,multiply} from './world-gl.mjs';
import {SKY_FS,drawSky,projectCelestialParticle} from './celestial-world.mjs';
import {createSceneMotion} from './scene-motion.mjs';
import {createLuminousRenderer} from './luminous-atmosphere.js';
const TAU=Math.PI*2,fract=v=>v-Math.floor(v),random=i=>fract(Math.sin(i*127.1+23.17)*43758.5453);
export const GARDEN_SPAN=[100,144,208];
export function gardenPosition(p,eye=[0,2.4,24],travel=0){const wrap=(x,n)=>((x%n)+n)%n;return[wrap(p[0]-eye[0]+50,100)-50+eye[0],wrap(p[1]-eye[1]+72,144)-72+eye[1],wrap(p[2]+travel+158,208)-158];}
function surface(rows,columns,sample){
 const positions=[],normals=[],uvs=[],indices=[];
 for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
  const u=i/rows,v=j/columns,e=.0001,p=sample(u,v),a=sample(Math.min(1,u+e),v).map((x,k)=>x-sample(Math.max(0,u-e),v)[k]),b=sample(u,Math.min(1,v+e)).map((x,k)=>x-sample(u,Math.max(0,v-e))[k]);
  const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],len=Math.hypot(...n);
  positions.push(...p);normals.push(...(len>1e-10?n.map(x=>x/len):[0,0,1]));uvs.push(u,v);
 }
 for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}return{positions,normals,uvs,indices};
}
export function moonPlantGeometry(){
 const pieces=[surface(44,7,(t,v)=>{const y=t<.65?-14*(1-t/.65):(t-.65)/.35,shape=Math.max(0,y),a=v*TAU,r=.012*(1-shape*.86);return[Math.sin(shape*2.3)*.055+Math.cos(a)*r,y,Math.sin(shape*Math.PI)*.025+Math.sin(a)*r];})];
 for(let slot=0;slot<8;slot++){
  const attach=.14+slot*.096,angle=slot*2.399963,length=.24-slot*.011;
  const leaf=surface(14,8,(u,v)=>{const s=v*2-1,width=Math.sin(u*Math.PI)*.048*(1-u*.24),along=u*length;
   const x=along*.92,z=s*width,y=attach+along*.37+Math.sin(u*Math.PI)*.027-s*s*.016;
   return[Math.sin(attach*2.3)*.055+x*Math.cos(angle)-z*Math.sin(angle),y,Math.sin(attach*Math.PI)*.025+x*Math.sin(angle)+z*Math.cos(angle)];});
  leaf.uvs=leaf.uvs.map((x,i)=>i%2?x+2:x);pieces.push(leaf);
 }
 const positions=[],normals=[],uvs=[],indices=[];
 for(const piece of pieces){const offset=positions.length/3;positions.push(...piece.positions);normals.push(...piece.normals);uvs.push(...piece.uvs);indices.push(...piece.indices.map(i=>i+offset));}
 return{positions,normals,uvs,indices};
}
export function moonGardenInstances(){
 const a=[],b=[];
 const near=[[-7,-11,-7,8],[9,-12,-12,9],[-14,-13,-21,10],[18,-14,-25,11],[-4,-15,-36,8],[6,-14,-43,10],[-23,-16,-36,12],[24,-17,-46,12]];
 for(let i=0;i<104;i++){
  const p=near[i]||[(random(i+31)-.5)*96,-12-random(i+171)*17,-20-random(i+71)*134,4.5+random(i+231)*8];
  a.push(p[0],p[1],p[2],random(i+19)*TAU);b.push(p[3],random(i+101)*TAU,random(i+81),random(i+163)*TAU);
 }
 return{a,b};
}
export const MOON_SKY_FS=SKY_FS
 .replace('normalize(vec3(.38,.43,-1.0))','normalize(vec3(.25*uAspect,.31,-1.0))')
 .replace('/.095','/(.10*min(1.0,uAspect))')
 .replace('vec3 c=mix(vec3(.44,.52,.64)',`float craters=0.0;
  for(int i=0;i<22;i++){float f=float(i),a=f*2.399963;vec2 center=vec2(cos(a),sin(a))*(.17+hash(vec3(f,3.1,9.3))*.69);
   float radius=.035+hash(vec3(f,6.7,4.1))*.09,d=length(p-center)/radius;
   float bowl=exp(-d*d*1.9),rim=exp(-pow((d-1.0)*8.0,2.0));
   craters+=rim*.11-bowl*.055+bowl*dot(normalize(p-center+vec2(.0001)),vec2(-.05,.025));
  }
  terrain=clamp(terrain+craters,0.0,1.0);
  vec3 c=mix(vec3(.44,.52,.64)`);
export const GARDEN_VS=`#version 300 es
precision highp float;precision highp int;
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;layout(location=2)in vec2 aUv;
layout(location=3)in vec4 aInstance;layout(location=4)in vec4 aDetail;
uniform mat4 uViewProj;uniform vec3 uEye;uniform float uTime,uTravel;
out vec3 vWorld,vNormal;out vec2 vUv;out float vSeed,vVisibility;
void main(){
 vec3 center=vec3(mod(aInstance.x-uEye.x+50.0,100.0)-50.0+uEye.x,mod(aInstance.y-uEye.y+72.0,144.0)-72.0+uEye.y,mod(aInstance.z+uTravel+158.0,208.0)-158.0);
 float c=cos(aDetail.y),s=sin(aDetail.y);mat3 turn=mat3(c,0,-s,0,1,0,s,0,c);
 vec3 p=turn*aPosition*aDetail.x,N=turn*aNormal;
 float height=max(aPosition.y,0.0),phase=aDetail.w+center.x*.027;
 vec2 breeze=vec2(sin(uTime*.43+phase)*.031+sin(uTime*.77+phase*1.9)*.011,cos(uTime*.37+phase)*.018);
 p.xz+=breeze*height*height*aDetail.x;N=normalize(N-vec3(breeze.x*height*2.0,0,breeze.y*height*2.0));
 vWorld=center+p;vNormal=N;vUv=aUv;vSeed=aDetail.z;
 vVisibility=smoothstep(0.0,9.0,50.0-abs(center.x-uEye.x))*smoothstep(0.0,12.0,72.0-abs(center.y-uEye.y));
 gl_Position=uViewProj*vec4(vWorld,1.0);
}`;
export const GARDEN_FS=`#version 300 es
precision highp float;precision highp int;
in vec3 vWorld,vNormal;in vec2 vUv;in float vSeed,vVisibility;out vec4 outColor;
uniform vec3 uEye;
${LIGHT_GLSL}
void main(){
 float distance=length(uEye-vWorld),alpha=vVisibility*smoothstep(1.2,5.5,distance)*(1.0-smoothstep(158.0,209.0,distance));
 if(vUv.y<1.5)alpha*=smoothstep(0.0,.09,vUv.x);
 if(alpha<.008)discard;
 vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
 vec3 V=normalize(uEye-vWorld),L=normalize(vec3(.24,.62,.74));
 bool leaf=vUv.y>1.5;float across=mod(vUv.y,2.0);
 vec3 base=leaf?mix(vec3(.071,.16,.18),vec3(.13,.24,.255),vSeed):vec3(.038,.089,.091);
 if(leaf){float rib=exp(-abs(across-.5)*85.0),veins=sin(vUv.x*70.0+abs(across-.5)*47.0);base*=.93+veins*.034;base+=rib*vec3(.038,.05,.047);}
 vec3 color=shadeSurface(base,N,V,L,leaf?.52:.67,.08,.92);
 float rim=pow(1.0-max(dot(N,V),0.0),3.0),transmission=pow(max(dot(-N,L),0.0),1.7);
 color+=base*(.22+rim*.28+transmission*(leaf?.38:.07));
 color+=vec3(.025,.06,.075)*rim;
 color=mix(vec3(.007,.019,.034),color,exp(-distance*.009));
 outColor=vec4(color,alpha);
}`;
export function moonGardenView(eye,width,height,time=0){
 const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16);
 lookAt(view,eye,[eye[0]+Math.sin(time*.032)*.12,eye[1],-22]);perspective(projection,1,width/height);multiply(vp,projection,view);return{view,vp};
}
export function createMoonGardenRenderer(ctx){
 const world=createGLWorld(ctx,'moon',{exposure:1.08,bloom:.16,vignette:.08,resolution:{maxPixels:1350000}});
 if(!world)return createLuminousRenderer(ctx,'moon');
 const{gl,loc}=world;let sky,plants,mesh;
 try{sky=world.program(FULLSCREEN_VS,MOON_SKY_FS);plants=world.program(GARDEN_VS,GARDEN_FS);mesh=world.mesh(moonPlantGeometry(),moonGardenInstances());}
 catch(error){world.dispose();return createLuminousRenderer(ctx,'moon');}
 const motion=createSceneMotion({rest:.22,flight:1.05,xLimit:1e6,yLimit:1e6});let eye=[0,2.4,24],travel=0,vp=new Float32Array(16);
 return{canvas:world.canvas,resize:world.resize,
  projectParticle:(s,w,h)=>projectCelestialParticle(s,w,h,eye,travel,vp),
  draw({time,width,height,camera}){
   if(width!==world.width||height!==world.height)world.resize({width,height,ratio:globalThis.devicePixelRatio||1});
   if(!world.begin())return;
   const pose=motion.step(time,camera);eye=[pose.input.x*3,2.4+pose.input.y*1.7,24];travel=pose.travel+pose.input.z*5;
   const frame=moonGardenView(eye,width,height,time);vp=frame.vp;drawSky(world,sky,time,2,eye,frame.view);
   gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.useProgram(plants);
   gl.uniformMatrix4fv(loc(plants,'uViewProj'),false,vp);gl.uniform3fv(loc(plants,'uEye'),eye);gl.uniform1f(loc(plants,'uTime'),time);gl.uniform1f(loc(plants,'uTravel'),travel);world.draw(mesh);world.finish();
  },dispose:world.dispose};
}
