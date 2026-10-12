import {wildflowerGeometry,wildflowerInstances} from './wildflowers.mjs?v=20261012-bloom-control-1';
import {createGLWorld,FULLSCREEN_VS,LIGHT_GLSL,perspective,orthographic,lookAt,multiply} from './world-gl.mjs?v=20261012-bloom-control-1';
import {SKY_FS,drawSky} from './celestial-world.mjs?v=20261012-bloom-control-1';
import {createSceneMotion} from './scene-motion.mjs';
import {createLuminousRenderer} from './luminous-atmosphere.js';

import {createFlowerControl,pickFlower,rotateVector} from './flower-interaction.mjs?v=20261012-bloom-control-1';
const TAU=Math.PI*2;
const fract=x=>x-Math.floor(x),random=i=>fract(Math.sin(i*127.1+19.7)*43758.5453);
function surface(rows,columns,sample){
 const positions=[],normals=[],uvs=[],indices=[];
 for(let i=0;i<=rows;i++)for(let j=0;j<=columns;j++){
  const u=i/rows,v=j/columns,p=sample(u,v),e=.0005,p1=sample(Math.min(1,u+e),v),p0=sample(Math.max(0,u-e),v),q1=sample(u,Math.min(1,v+e)),q0=sample(u,Math.max(0,v-e));
  const a=p1.map((x,k)=>x-p0[k]),b=q1.map((x,k)=>x-q0[k]),n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],l=Math.hypot(...n)||1;
  positions.push(...p);normals.push(...n.map(x=>x/l));uvs.push(u,v);
 }
 for(let i=0;i<rows;i++)for(let j=0;j<columns;j++){const a=i*(columns+1)+j,b=a+columns+1;indices.push(a,b,a+1,a+1,b,b+1);}return{positions,normals,uvs,indices};
}
export function petalGeometry(){return surface(18,10,(t,v)=>{const s=v*2-1,w=.10+.52*Math.sin(Math.PI*t*.86);return[s*w,t*1.13-.24*Math.pow(t,5)*s*s,(.18-.12*s*s)*Math.sin(t*Math.PI)+.03*t*t];});}
export function leafGeometry(){return surface(18,8,(t,v)=>{const s=v*2-1;return[s*Math.sin(Math.PI*t)*.28,t*1.55,.15*Math.sin(t*Math.PI)+.08*s*s];});}
export function stemGeometry(){return surface(18,8,(t,v)=>{const a=v*TAU;return[Math.cos(a)*.034+Math.sin(t*2.6)*.16,-t*3.6,Math.sin(a)*.034-.25];});}
function mergeGeometry(items){const positions=[],normals=[],uvs=[],indices=[];for(const g of items){const offset=positions.length/3;positions.push(...g.positions);normals.push(...g.normals);uvs.push(...g.uvs);indices.push(...g.indices.map(i=>i+offset));}return{positions,normals,uvs,indices};}
export function butterflyGeometry(){
 const shapes=[];for(const side of [-1,1])for(const upper of [true,false])shapes.push(surface(15,20,(r,v)=>{
  const a=v*TAU;const cx=upper?.63:.36,cy=upper?.25:-.40,rx=upper?.69:.41,ry=upper?.72:.48;
  const scallop=1.0-.035*Math.pow(.5+.5*Math.sin(a*9),3);const x=(cx+Math.cos(a)*rx)*r*side,y=(cy+Math.sin(a)*ry)*r;
  return[x*scallop,y*scallop,.048*Math.sin(r*Math.PI)];
 }));return mergeGeometry(shapes);
}
export function butterflyBodyGeometry(){
 const body=surface(14,12,(u,v)=>{const a=u*Math.PI,b=v*TAU;return[Math.sin(a)*Math.cos(b)*.065,Math.cos(a)*.43,Math.sin(a)*Math.sin(b)*.065];});
 const antenna=[];for(const side of [-1,1])antenna.push(surface(12,4,(u,v)=>{const a=v*TAU;return[side*(.025+u*.18)+Math.cos(a)*.007,.34+u*.48,Math.sin(a)*.007-.03];}));return mergeGeometry([body,...antenna]);
}
export const BOTANICAL_SPAN=[92,72,156];
export function wrapBotanicalPosition(position,eye=[0,2.5,24],travel=0){
 const wrap=(v,n)=>((v%n)+n)%n;
 return[wrap(position[0]-eye[0]+46,92)-46+eye[0],wrap(position[1]-eye[1]+36,72)-36+eye[1],wrap(position[2]+travel+120,156)-120];
}
export function botanicalInstances(){
 const flowers=[],petals={a:[],b:[]},leaves={a:[],b:[]},loose={a:[],b:[]},butterflies={a:[],b:[]};
 for(let i=0;i<36;i++){
  const ix=i%3,iy=Math.floor(i/3)%3,iz=Math.floor(i/9);
  const f=[(ix-1)*30+(random(i+11)-.5)*8,(iy-1)*24+(random(i+83)-.5)*6,9-iz*39+(random(i+91)-.5)*12,random(i+19)*TAU,1.15+random(i+73)*1.05];
  if(i===0){f[0]=-8;f[1]=-7;f[2]=-13;f[4]=3.45;}
  if(i===4){f[0]=8;f[1]=8;f[2]=-11;f[4]=3.40;}
  if(i===31){f[0]=3;f[1]=-11;f[2]=-49;f[4]=3.0;}
  flowers.push(f);
  for(let ring=0;ring<7;ring++){const n=5+ring*3;for(let p=0;p<n;p++){petals.a.push(...f.slice(0,4));petals.b.push(p/n*TAU+ring*2.399,.18+ring*.145,(random(i*103+p+ring*19)-.5)*.13,f[4]);}}
  for(let j=0;j<3;j++){leaves.a.push(...f.slice(0,4));leaves.b.push(j*2.28+.4,1.0+j*.11,j,f[4]);}
 }
 for(let i=0;i<24;i++){loose.a.push((random(i+277)-.5)*88,(random(i+381)-.5)*68,-118+random(i+331)*152,random(i+271)*TAU);loose.b.push(random(i+779)*TAU,.6,random(i+777)*.12,.13+random(i+743)*.20);}
 for(let i=0;i<24;i++){const f=flowers[(i*11+4)%flowers.length];const pose=i===0?[-2,6,-10,1.3]:i===1?[4,-2,-20,3.4]:[f[0]+(random(i+477)-.5)*6,f[1]+2+random(i+411)*3,f[2]+random(i+451)*8,random(i+431)*TAU];butterflies.a.push(...pose);butterflies.b.push(i<2?.70:.28+random(i+432)*.37,random(i+763),0,0);}
 return{flowers,petals,leaves,loose,butterflies};
}
const FIELD_GLSL=`
vec3 wrapField(vec3 p){return vec3(mod(p.x-uEye.x+46.0,92.0)-46.0+uEye.x,mod(p.y-uEye.y+36.0,72.0)-36.0+uEye.y,mod(p.z+uTravel+120.0,156.0)-120.0);}
float fieldVisibility(vec3 p){return smoothstep(0.0,6.0,46.0-abs(p.x-uEye.x))*smoothstep(0.0,6.0,36.0-abs(p.y-uEye.y));}
`;
export const PLANT_VS=`#version 300 es
precision highp float;precision highp int;
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;layout(location=2)in vec2 aUv;
layout(location=3)in vec4 aInstance;layout(location=4)in vec4 aDetail;layout(location=5)in vec4 aControl;layout(location=6)in vec4 aRotation;
uniform mat4 uViewProj,uLightMatrix;uniform float uTime,uTravel;uniform vec3 uEye;uniform int uPart;
out vec3 vWorld,vNormal;out vec2 vUv;out vec4 vShadow;out float vSeed,vLayer,vVisibility,vMaterial;
${FIELD_GLSL}
mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1,0,0,0,c,s,0,-s,c);}
mat3 ry(float a){float c=cos(a),s=sin(a);return mat3(c,0,-s,0,1,0,s,0,c);}
mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0,-s,c,0,0,0,1);}
vec3 turn(vec4 q,vec3 v){return v+2.0*cross(q.xyz,cross(q.xyz,v)+q.w*v);}
void main(){
 float seed=aInstance.w,scale=aDetail.w;vec3 p=aPosition,N=aNormal;
 float breeze=sin(uTime*.59+seed)*.027+sin(uTime*.97+seed*2.0)*.011;
 mat3 flower=rz(sin(seed)*.35+breeze)*ry(sin(seed*1.71)*.58)*rx(cos(seed*1.23)*.49);
 mat3 part=rz(aDetail.x);
 vMaterial=0.0;
 if(uPart>=4){flower=rz(seed+uTime*(.027+.013*sin(seed)))*ry(aDetail.x+uTime*.033)*rx(aDetail.y+sin(uTime*.19+seed)*.21);vMaterial=floor(aUv.y/2.0);}

 if(uPart==0){p*=aDetail.y;p.y+=(aDetail.y-.18)*.23;p.z+=.28*(1.10-aDetail.y)+.18*dot(p.xy,p.xy)+aPosition.x*aDetail.y*.05;p.z+=sin(uTime*.81+seed+aDetail.x)*.012*p.y*p.y;
  N=normalize(vec3(N.x-(.36*p.x+.05)*N.z,N.y-.36*p.y*N.z,N.z));p=part*p;N=part*N;}
 else if(uPart==1){part=rz(aDetail.x)*rx(.4+aDetail.z*.25);p*=aDetail.y;p.y+=.60;p.z-=.38;p=part*p;N=part*N;}
 else if(uPart==3){flower=rz(seed+uTime*.13)*rx(seed*.7+uTime*.26)*ry(seed+uTime*.11);p*=aDetail.y;}
 vec3 center=wrapField(aInstance.xyz);vVisibility=fieldVisibility(center);
 if(uPart>=4){center.y+=sin(uTime*.27+seed)*1.1;center.x+=sin(uTime*.19+seed)*.75;center.z+=sin(uTime*.23+seed)*.8;}
 if(uPart==3){center.y+=sin(uTime*.38+seed)*1.2;center.x+=sin(uTime*.27+seed)*.8;center.z+=sin(uTime*.31+seed)*.7;}
 vec3 rotated=flower*p,normal=flower*N;
 if(uPart>=4&&aControl.w>.5){center=aControl.xyz;vVisibility=aControl.w>1.5?1.0:fieldVisibility(center);rotated=turn(aRotation,p);normal=turn(aRotation,N);}
 vWorld=center+rotated*scale;vNormal=normalize(normal);vUv=vec2(aUv.x,mod(aUv.y,2.0));vSeed=seed;vLayer=aDetail.y;vShadow=uLightMatrix*vec4(vWorld,1.0);gl_Position=uViewProj*vec4(vWorld,1.0);
}`;
export const PLANT_FS=`#version 300 es
precision highp float;precision highp int;
in vec3 vWorld,vNormal;in vec2 vUv;in vec4 vShadow;in float vSeed,vLayer,vVisibility,vMaterial;out vec4 outColor;
uniform vec3 uEye;uniform float uTime;uniform int uKind,uPart;uniform sampler2D uShadowMap;
${LIGHT_GLSL}
float shadow(){vec3 p=vShadow.xyz/vShadow.w*.5+.5;if(any(lessThan(p,vec3(0)))||any(greaterThan(p,vec3(1))))return 1.0;
 float s=0.0;vec2 texel=1.0/vec2(textureSize(uShadowMap,0));float bias=.0012;
 for(int y=-2;y<=2;y++)for(int x=-2;x<=2;x++)s+=step(p.z-bias,texture(uShadowMap,p.xy+vec2(x,y)*texel).r);
 return .40+s/25.0*.60;
}
void main(){
 vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uEye-vWorld),L=normalize(vec3(-.45,.8,.6));
 float phase=.5-.5*cos(uTime*.031+sin(vSeed)*.32);vec3 base;
 if(uPart>=4){
  float variation=.5+.5*sin(vSeed*7.3+sin(uTime*.016)*.16);
  if(uPart==4)base=mix(vec3(.93,.92,.87),vec3(.99,.98,.95),variation);
  else if(uPart==5)base=mix(vec3(.68,.09,.28),vec3(.95,.39,.59),variation);
  else if(uPart==6)base=mix(vec3(.075,.25,.77),vec3(.32,.12,.67),variation);
  else if(uPart==7)base=mix(vec3(.78,.026,.045),vec3(.94,.09,.065),variation);
  else base=mix(vec3(.96,.59,.055),vec3(1.0,.81,.21),variation);
  if(vMaterial==1.0||vMaterial==2.0)base=mix(vec3(.12,.30,.08),vec3(.23,.44,.13),variation);
  else if(vMaterial==3.0||vMaterial==4.0)base=vec3(.79,.45,.032);
  else if(vMaterial==5.0)base=vec3(.055,.028,.037);
  else if(vMaterial==6.0)base=vec3(.19,.12,.39);
 }
 else if(uKind==3)base=mix(vec3(.28,.024,.54),vec3(.67,.045,.31),phase*.44);
 else if(uKind==4)base=mix(vec3(.015,.072,.36),vec3(.21,.09,.54),phase*.45);
 else base=mix(vec3(.36,.58,.74),vec3(.49,.37,.72),phase*.52);
 if(uPart==1)base=uKind==3?vec3(.09,.17,.09):vec3(.035,.10,.12);
 if(uPart==2)base=uKind==3?vec3(.04,.10,.048):vec3(.035,.070,.10);
 float veins=sin(vUv.x*85.0+sin(vUv.y*26.0)*2.0)*sin(vUv.x*213.0-vUv.y*17.0);
 base*=.85+vUv.x*.17+veins*.021;
 if(uPart==1){float rib=exp(-abs(vUv.y-.5)*110.0);base+=rib*vec3(.055,.07,.035);base*=.90+.10*sin(vUv.x*65.0+abs(vUv.y-.5)*42.0);}
 float ao=uPart>=4?mix(.76,1.0,smoothstep(.02,.48,vUv.x)):uPart==0?mix(.62,1.0,smoothstep(.05,.68,vUv.x)):.91;
 if(uPart>=4){if(uPart==7&&vMaterial<.5)base*=mix(.13,1.0,smoothstep(.02,.24,vUv.x));base=pow(base,vec3(2.2));}
 float roughness=uPart==0?.39:.54;
 if(uPart>=4)roughness=vMaterial<.5?(uPart==8?.24:uPart==7?.55:uPart==6?.63:.58):vMaterial==5.0?.82:vMaterial<=2.0?.74:.66;
 vec3 c=shadeSurface(base,N,V,L,roughness,0.0,ao);
 float rim=pow(1.0-max(0.0,dot(N,V)),3.5);
 c+=base*rim*.12+base*pow(max(0.0,dot(-N,L)),2.0)*.23;
 c*=shadow();if(uKind!=3)c+=vec3(.065,.14,.28)*pow(max(0.0,dot(N,normalize(vec3(.4,.6,-.7)))),3.0);
 float distance=length(uEye-vWorld),near=smoothstep(1.8,5.0,distance),fog=exp(-max(0.0,distance-92.0)*.007);
 float alpha=vVisibility*near*fog*(1.0-smoothstep(126.0,165.0,distance));if(alpha<.01)discard;outColor=vec4(c,alpha);
}`;
export const SHADOW_FS=`#version 300 es
precision highp float;precision highp int;void main(){}`;
export const BUTTERFLY_VS=`#version 300 es
precision highp float;precision highp int;
layout(location=0)in vec3 aPosition;layout(location=1)in vec3 aNormal;layout(location=2)in vec2 aUv;
layout(location=3)in vec4 aInstance;layout(location=4)in vec4 aDetail;
uniform mat4 uViewProj;uniform vec3 uEye;uniform float uTime,uTravel;uniform int uPart;
out vec3 vWorld,vNormal;out vec2 vUv;out float vSeed,vVisibility;
${FIELD_GLSL}
vec3 path(float t){float s=aInstance.w;t*=.78+.22*sin(s*2.7);return aInstance.xyz+vec3(sin(t*.17+s)*6.3+sin(t*.39+s*.71)*1.3+t*.32*cos(s),sin(t*.23+s*1.6)*3.0+sin(t*.51+s)*.42,sin(t*.13+s)*7.5+sin(t*.31+s)*1.6); }
void main(){
 float seed=aInstance.w;vec3 center=wrapField(path(uTime)),vel=path(uTime+.03)-path(uTime-.03);vVisibility=fieldVisibility(center);
 vec3 p=aPosition,N=aNormal;float side=sign(p.x),beat=sin(uTime*(27.0+sin(seed)*3.0)+seed);
 float a=beat*.93+sin(uTime*.47+seed)*.08,c=cos(a),s=sin(a);
 if(uPart==0){p=vec3(p.x*c-side*p.z*s,p.y,side*p.x*s+p.z*c);N=normalize(vec3(N.x*c-side*N.z*s,N.y,side*N.x*s+N.z*c));}
 vec3 forward=normalize(vel),right=normalize(cross(forward,vec3(0,.7,1))),normal=normalize(cross(right,forward));
 vec3 accel=path(uTime+.08)+path(uTime-.08)-2.0*path(uTime);float bank=clamp(dot(accel,right)*110.0,-.42,.42);
 mat3 turn=mat3(right*cos(bank)+normal*sin(bank),forward,normal*cos(bank)-right*sin(bank));
 vWorld=center+turn*p*aDetail.x;vNormal=normalize(turn*N);vUv=aUv;vSeed=seed;gl_Position=uViewProj*vec4(vWorld,1.0);
}`;
export const BUTTERFLY_FS=`#version 300 es
precision highp float;precision highp int;in vec3 vWorld,vNormal;in vec2 vUv;in float vSeed,vVisibility;out vec4 outColor;
uniform vec3 uEye;uniform float uTime;uniform int uKind,uPart;
${LIGHT_GLSL}
void main(){
 vec3 N=normalize(vNormal);if(!gl_FrontFacing)N=-N;vec3 V=normalize(uEye-vWorld);float angle=1.0-abs(dot(N,V));
 vec3 base=uKind==3?mix(vec3(.23,.02,.45),vec3(.78,.13,.51),angle):mix(vec3(.014,.18,.52),vec3(.18,.64,.84),angle);
 float veins=pow(abs(sin(vUv.y*31.416+vUv.x*2.1)),38.0);base*=1.0-veins*.52;
 float edge=smoothstep(.79,.98,vUv.x);base=mix(base,vec3(.030,.021,.040),edge*.85);
 float spots=pow(max(0.0,sin(vUv.y*62.832)),20.0)*smoothstep(.81,.88,vUv.x)*(1.0-smoothstep(.93,1.0,vUv.x));base+=spots*vec3(.7,.52,.24);
 if(uPart==1)base=vec3(.025,.019,.03);
 vec3 c=shadeSurface(base,N,V,normalize(vec3(-.4,.8,.6)),.31,.14,1.0)+base*.16+vec3(.08,.16,.25)*pow(angle,4.0);
 float d=length(uEye-vWorld),fog=exp(-max(0.0,d-92.0)*.007)*smoothstep(2.0,6.0,d);
 float alpha=vVisibility*fog*(1.0-smoothstep(126.0,165.0,d));if(alpha<.01)discard;outColor=vec4(c,alpha);
}`;
function createShadow(world){
 const{gl,keep}=world,texture=keep(gl.createTexture(),gl.deleteTexture),fbo=keep(gl.createFramebuffer(),gl.deleteFramebuffer),size=1024;
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,gl.DEPTH_COMPONENT24,size,size,0,gl.DEPTH_COMPONENT,gl.UNSIGNED_INT,null);
 gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.TEXTURE_2D,texture,0);gl.drawBuffers([gl.NONE]);gl.readBuffer(gl.NONE);const valid=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;gl.bindFramebuffer(gl.FRAMEBUFFER,null);return{texture,fbo,size,valid};
}
function botanicalFallback(ctx){
 const field=wildflowerInstances(),insects=botanicalInstances().butterflies,control=createFlowerControl(field),geometry=Array.from({length:5},(_,i)=>wildflowerGeometry(i)),view=new Float32Array(16),projection=new Float32Array(16),vp=new Float32Array(16),motion=createSceneMotion({rest:.72,flight:2.8,xLimit:1e6,yLimit:1e6}),butterflyMotion=createSceneMotion({rest:.55,flight:2.2,xLimit:1e6,yLimit:1e6});
 let pickCamera=null;
 const palette=['#eee5ce','#d17698','#6384cb','#da6853','#e7c75d'];
 return{resize(){},selectAt(x,y,clear=false){if(pickCamera){const id=pickFlower(control.poses,geometry,pickCamera,x,y);if(id>=0)control.select(id);else if(clear)control.clear();}return control.selected;},clearSelection(){control.clear();},moveSelected(dx,dy,dz){return control.move(dx,dy,dz);},rotateSelected(dx,dy){return control.rotate(dx,dy);},draw({time,width:w,height:h,camera}){
  const {travel,input}=motion.step(time,camera),eye=[input.x*3,2.5+input.y*3,24],depth=travel+input.z*4,focal=h/(2*Math.tan(.5));
  ctx.save();ctx.fillStyle='#faf9fc';ctx.fillRect(0,0,w,h);
  const project=p=>{const d=eye[2]-p[2];return{x:w*.5+(p[0]-eye[0])*focal/d,y:h*.5-(p[1]-eye[1]+d*.016)*focal/d,d};};
  lookAt(view,eye,[eye[0]+Math.sin(time*.019)*.24,eye[1]-.7,-20]);perspective(projection,1,w/h);multiply(vp,projection,view);pickCamera={eye,view:[...view],width:w,height:h};
  const flowers=control.step(time,eye,depth,h).map(pose=>({f:field.flowers[pose.id],i:pose.id,p:pose.position,pose})).sort((a,b)=>a.p[2]-b.p[2]);
  for(const {f,i,p,pose}of flowers){
   const center=project(p),size=focal*f[4]/center.d;if(center.d<5||center.d>170||center.x< -size*3||center.x>w+size*3||center.y< -size*3||center.y>h+size*3)continue;
   ctx.globalAlpha=Math.min(1,(center.d-5)/5,(170-center.d)/30,(46-Math.abs(p[0]-eye[0]))/6,(36-Math.abs(p[1]-eye[1]))/6);
   const turn=f[3]+time*.037,tilt=field.groups[i%5].b[Math.floor(i/5)*4+1]+Math.sin(time*.19+f[3])*.21;
   const rotate=(x,y,z)=>{const point=rotateVector(pose.rotation,[x,y,z]);return project(p.map((v,i)=>v+point[i]*f[4]));};
   const stem=rotate(.13,-1.8,-.22);ctx.strokeStyle='#779155';ctx.lineWidth=Math.max(.35,size*.025);ctx.beginPath();ctx.moveTo(center.x,center.y);ctx.quadraticCurveTo(center.x+size*.12,(center.y+stem.y)*.5,stem.x,stem.y);ctx.stroke();
   const petals=[],n=[19,8,12,4,5][i%5];
   for(let j=0;j<n;j++){
    const angle=j/n*TAU,r=[.95,1.02,.85,1.08,.70][i%5],width=[.095,.39,.18,.53,.36][i%5],cup=[.14,.32,.28,.55,.53][i%5];
    const vertices=[[-.018,.16,.06],[-width,.65*r,.10+cup*.45],[0,r+.16,.06+cup],[width,.65*r,.10+cup*.45],[.018,.16,.06]].map(([x,y,z])=>rotate(x*Math.cos(angle)-y*Math.sin(angle),x*Math.sin(angle)+y*Math.cos(angle),z));petals.push({vertices,d:vertices[2].d});
   }
   petals.sort((a,b)=>b.d-a.d);
   for(const petal of petals){const points=petal.vertices,g=ctx.createLinearGradient(points[0].x,points[0].y,points[2].x,points[2].y);g.addColorStop(0,i%5===0?'#d6bd85':'#79566e');g.addColorStop(.4,palette[i%5]);g.addColorStop(1,i%5===0?'#fffdf3':palette[i%5]);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(points[0].x,points[0].y);ctx.quadraticCurveTo(points[1].x,points[1].y,points[2].x,points[2].y);ctx.quadraticCurveTo(points[3].x,points[3].y,points[4].x,points[4].y);ctx.closePath();ctx.fill();}
   const disk=rotate(0,0,.2),radius=Math.max(.7,size*.17),g=ctx.createRadialGradient(disk.x-radius*.3,disk.y-radius*.3,0,disk.x,disk.y,radius);g.addColorStop(0,i%5===3?'#665541':'#ffe493');g.addColorStop(1,i%5===3?'#312a30':'#b49742');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(disk.x,disk.y,radius,radius*(.45+.55*Math.abs(Math.cos(tilt))),0,0,TAU);ctx.fill();
  }
  const insectDepth=butterflyMotion.step(time,camera).travel+input.z*4;
  for(let i=0;i<insects.a.length;i+=4){
   const s=insects.a[i+3],t=time*(.78+.22*Math.sin(s*2.7)),pos=[insects.a[i]+Math.sin(t*.17+s)*6.3+Math.sin(t*.39+s*.71)*1.3+t*.32*Math.cos(s),insects.a[i+1]+Math.sin(t*.23+s*1.6)*3+Math.sin(t*.51+s)*.42,insects.a[i+2]+Math.sin(t*.13+s)*7.5+Math.sin(t*.31+s)*1.6],p=project(wrapBotanicalPosition(pos,eye,insectDepth));
   if(p.d<6||p.d>160)continue;const size=focal*insects.b[i]/p.d,fold=.25+.75*Math.abs(Math.cos(Math.sin(time*(27+Math.sin(s)*3)+s)*.93));
   ctx.save();ctx.translate(p.x,p.y);ctx.rotate(Math.sin(t*.17+s)*.45);ctx.globalAlpha=Math.min(1,(p.d-6)/5,(160-p.d)/25);ctx.fillStyle='#bb72cb';
   for(const side of [-1,1]){ctx.beginPath();ctx.ellipse(side*size*.6*fold,-size*.18,size*.62*fold,size*.70,side*.25,0,TAU);ctx.fill();ctx.beginPath();ctx.ellipse(side*size*.33*fold,size*.42,size*.36*fold,size*.43,-side*.2,0,TAU);ctx.fill();}ctx.fillStyle='#55404d';ctx.fillRect(-size*.035,-size*.42,size*.07,size*.85);ctx.restore();
  }ctx.restore();
 },dispose(){}};
}
export function createBotanicalRenderer(ctx){
 const mode=3,world=createGLWorld(ctx,'bloom',{exposure:1.16,bloom:.16,vignette:0,resolution:{maxPixels:1600000}});
 if(!world)return botanicalFallback(ctx,'bloom');
 const{gl,loc}=world,instances=botanicalInstances(),field=wildflowerInstances(),control=createFlowerControl(field),geometry=Array.from({length:5},(_,i)=>wildflowerGeometry(i));
 for(const group of field.groups){group.c=new Float32Array(group.a.length);group.d=new Float32Array(group.a.length);}
 let pickCamera=null;let sky,plant,shadowProgram,fly,dead=false;
 let flowers,loose,wings,bodies,shadow;
 try{
  sky=world.program(FULLSCREEN_VS,SKY_FS);plant=world.program(PLANT_VS,PLANT_FS);shadowProgram=world.program(PLANT_VS,SHADOW_FS);fly=world.program(BUTTERFLY_VS,BUTTERFLY_FS);
  flowers=field.groups.map((instances,species)=>world.mesh(geometry[species],instances));loose=world.mesh(petalGeometry(),instances.loose);wings=world.mesh(butterflyGeometry(),instances.butterflies);bodies=world.mesh(butterflyBodyGeometry(),instances.butterflies);shadow=createShadow(world);
 }catch(e){world.dispose();return botanicalFallback(ctx,'bloom');}
 const projection=new Float32Array(16),view=new Float32Array(16),vp=new Float32Array(16),lightP=new Float32Array(16),lightV=new Float32Array(16),lightVP=new Float32Array(16);
 const motion=createSceneMotion({rest:.72,flight:2.8,xLimit:1e6,yLimit:1e6}),butterflyMotion=createSceneMotion({rest:.55,flight:2.2,xLimit:1e6,yLimit:1e6});let shadowTime=-1,shadowEye=[1e8,1e8,1e8];
 const plantDraw=(p,m,part,eye,time,travel,matrix)=>{gl.useProgram(p);gl.uniformMatrix4fv(loc(p,'uViewProj'),false,matrix);gl.uniformMatrix4fv(loc(p,'uLightMatrix'),false,lightVP);gl.uniform3fv(loc(p,'uEye'),eye);gl.uniform1f(loc(p,'uTime'),time);gl.uniform1f(loc(p,'uTravel'),travel);gl.uniform1i(loc(p,'uKind'),mode);gl.uniform1i(loc(p,'uPart'),part);gl.uniform1i(loc(p,'uShadowMap'),1);world.draw(m);};
 return{canvas:world.canvas,resize:world.resize,
  selectAt(x,y,clear=false){if(pickCamera){const id=pickFlower(control.poses,geometry,pickCamera,x,y);if(id>=0)control.select(id);else if(clear)control.clear();}return control.selected;},
  clearSelection(){control.clear();},moveSelected(dx,dy,dz){return control.move(dx,dy,dz);},rotateSelected(dx,dy){return control.rotate(dx,dy);},draw({time,width,height,camera}){
  if(width!==world.width||height!==world.height)world.resize({width,height,ratio:devicePixelRatio||1});if(dead||!world.begin())return;
  const{travel,input}=motion.step(time,camera),depth=travel+input.z*4,eye=[input.x*3,2.5+input.y*3,24];
  lookAt(view,eye,[eye[0]+Math.sin(time*.019)*.24,eye[1]-.7,-20]);perspective(projection,1.0,width/height);multiply(vp,projection,view);pickCamera={eye,view:[...view],width,height};
  const poses=control.step(time,eye,depth,height);
  for(const pose of poses){const group=field.groups[pose.species],offset=Math.floor(pose.id/5)*4;group.c.set([...pose.position,pose.id===control.selected?2:1],offset);group.d.set(pose.rotation,offset);}
  flowers.forEach((mesh,species)=>mesh.updateInstances(field.groups[species]));
  if(shadow.valid&&(time-shadowTime>=1/30||eye.some((v,i)=>Math.abs(v-shadowEye[i])>.08))){
   lookAt(lightV,[eye[0]-18,eye[1]+30,35],[eye[0],eye[1]-2.5,-15]);orthographic(lightP,-42,42,-38,38,1,180);multiply(lightVP,lightP,lightV);
   gl.bindFramebuffer(gl.FRAMEBUFFER,shadow.fbo);gl.viewport(0,0,shadow.size,shadow.size);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.clear(gl.DEPTH_BUFFER_BIT);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.5,2);
   flowers.forEach((mesh,species)=>plantDraw(shadowProgram,mesh,4+species,eye,time,depth,lightVP));gl.disable(gl.POLYGON_OFFSET_FILL);world.begin();shadowTime=time;shadowEye=[...eye];
  }
  drawSky(world,sky,time,mode,eye,view);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,shadow.texture);
  flowers.forEach((mesh,species)=>plantDraw(plant,mesh,4+species,eye,time,depth,vp));plantDraw(plant,loose,3,eye,time,depth,vp);
  gl.useProgram(fly);gl.uniformMatrix4fv(loc(fly,'uViewProj'),false,vp);gl.uniform3fv(loc(fly,'uEye'),eye);gl.uniform1f(loc(fly,'uTime'),time);gl.uniform1f(loc(fly,'uTravel'),butterflyMotion.step(time,camera).travel+input.z*4);gl.uniform1i(loc(fly,'uKind'),mode);gl.uniform1i(loc(fly,'uPart'),0);world.draw(wings);gl.uniform1i(loc(fly,'uPart'),1);world.draw(bodies);world.finish();
 },dispose(){if(dead)return;dead=true;world.dispose();}};
}
