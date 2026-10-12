import{a as N,b as P,c as S,e as w,f as E,g as z,h as M,i as L,j as _,k as T}from"./chunk-chunk-5CMIDVJD.js";import{a as A}from"./chunk-chunk-JAGATSO7.js";import"./chunk-chunk-2H2FWMJN.js";var x=Math.PI*2,D=r=>r-Math.floor(r),b=r=>D(Math.sin(r*127.1+23.17)*43758.5453);function U(r,e,o){let i=[],l=[],t=[],v=[];for(let s=0;s<=r;s++)for(let c=0;c<=e;c++){let n=s/r,a=c/e,p=1e-4,u=o(n,a),m=o(Math.min(1,n+p),a).map((y,g)=>y-o(Math.max(0,n-p),a)[g]),f=o(n,Math.min(1,a+p)).map((y,g)=>y-o(n,Math.max(0,a-p))[g]),h=[m[1]*f[2]-m[2]*f[1],m[2]*f[0]-m[0]*f[2],m[0]*f[1]-m[1]*f[0]],d=Math.hypot(...h);i.push(...u),l.push(...d>1e-10?h.map(y=>y/d):[0,0,1]),t.push(n,a)}for(let s=0;s<r;s++)for(let c=0;c<e;c++){let n=s*(e+1)+c,a=n+e+1;v.push(n,a,n+1,n+1,a,a+1)}return{positions:i,normals:l,uvs:t,indices:v}}function G(){let r=[U(44,7,(t,v)=>{let s=t<.65?-14*(1-t/.65):(t-.65)/.35,c=Math.max(0,s),n=v*x,a=.012*(1-c*.86);return[Math.sin(c*2.3)*.055+Math.cos(n)*a,s,Math.sin(c*Math.PI)*.025+Math.sin(n)*a]})];for(let t=0;t<8;t++){let v=.14+t*.096,s=t*2.399963,c=.24-t*.011,n=U(14,8,(a,p)=>{let u=p*2-1,m=Math.sin(a*Math.PI)*.048*(1-a*.24),f=a*c,h=f*.92,d=u*m,y=v+f*.37+Math.sin(a*Math.PI)*.027-u*u*.016;return[Math.sin(v*2.3)*.055+h*Math.cos(s)-d*Math.sin(s),y,Math.sin(v*Math.PI)*.025+h*Math.sin(s)+d*Math.cos(s)]});n.uvs=n.uvs.map((a,p)=>p%2?a+2:a),r.push(n)}let e=[],o=[],i=[],l=[];for(let t of r){let v=e.length/3;e.push(...t.positions),o.push(...t.normals),i.push(...t.uvs),l.push(...t.indices.map(s=>s+v))}return{positions:e,normals:o,uvs:i,indices:l}}function F(){let r=[],e=[],o=[[-7,-11,-7,8],[9,-12,-12,9],[-14,-13,-21,10],[18,-14,-25,11],[-4,-15,-36,8],[6,-14,-43,10],[-23,-16,-36,12],[24,-17,-46,12]];for(let i=0;i<104;i++){let l=o[i]||[(b(i+31)-.5)*96,-12-b(i+171)*17,-20-b(i+71)*134,4.5+b(i+231)*8];r.push(l[0],l[1],l[2],b(i+19)*x),e.push(l[3],b(i+101)*x,b(i+81),b(i+163)*x)}return{a:r,b:e}}var I=L.replace("normalize(vec3(.38,.43,-1.0))","normalize(vec3(.25*uAspect,.31,-1.0))").replace("/.095","/(.10*min(1.0,uAspect))").replace("vec3 c=mix(vec3(.44,.52,.64)",`float craters=0.0;
  for(int i=0;i<22;i++){float f=float(i),a=f*2.399963;vec2 center=vec2(cos(a),sin(a))*(.17+hash(vec3(f,3.1,9.3))*.69);
   float radius=.035+hash(vec3(f,6.7,4.1))*.09,d=length(p-center)/radius;
   float bowl=exp(-d*d*1.9),rim=exp(-pow((d-1.0)*8.0,2.0));
   craters+=rim*.11-bowl*.055+bowl*dot(normalize(p-center+vec2(.0001)),vec2(-.05,.025));
  }
  terrain=clamp(terrain+craters,0.0,1.0);
  vec3 c=mix(vec3(.44,.52,.64)`),R=`#version 300 es
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
}`,C=`#version 300 es
precision highp float;precision highp int;
in vec3 vWorld,vNormal;in vec2 vUv;in float vSeed,vVisibility;out vec4 outColor;
uniform vec3 uEye;
${P}
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
}`;function j(r,e,o,i=0){let l=new Float32Array(16),t=new Float32Array(16),v=new Float32Array(16);return w(t,r,[r[0]+Math.sin(i*.032)*.12,r[1],-22]),S(l,1,e/o),E(v,l,t),{view:t,vp:v}}function V(r){let e=z(r,"moon",{exposure:1.08,bloom:.16,vignette:.08,resolution:{maxPixels:135e4}});if(!e)return M(r,"moon");let{gl:o,loc:i}=e,l,t,v;try{l=e.program(N,I),t=e.program(R,C),v=e.mesh(G(),F())}catch{return e.dispose(),M(r,"moon")}let s=A({rest:.22,flight:1.05,xLimit:1e6,yLimit:1e6}),c=[0,2.4,24],n=0,a=new Float32Array(16);return{canvas:e.canvas,resize:e.resize,projectParticle:(p,u,m)=>T(p,u,m,c,n,a),draw({time:p,width:u,height:m,camera:f}){if((u!==e.width||m!==e.height)&&e.resize({width:u,height:m,ratio:globalThis.devicePixelRatio||1}),!e.begin())return;let h=s.step(p,f);c=[h.input.x*3,2.4+h.input.y*1.7,24],n=h.travel+h.input.z*5;let d=j(c,u,m,p);a=d.vp,_(e,l,p,2,c,d.view),o.enable(o.DEPTH_TEST),o.depthMask(!0),o.disable(o.CULL_FACE),o.enable(o.BLEND),o.blendFunc(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA),o.useProgram(t),o.uniformMatrix4fv(i(t,"uViewProj"),!1,a),o.uniform3fv(i(t,"uEye"),c),o.uniform1f(i(t,"uTime"),p),o.uniform1f(i(t,"uTravel"),n),e.draw(v),e.finish()},dispose:e.dispose}}var B={createRenderer:r=>V(r),id:"moon",marks:!0,particles:!0,continuousDepth:!0,cameraSmoothing:4.2,renderer:"petals",accent:"#b4dbef",dim:"#c0d0e2",surface:"10,20,32",panel:{bg:"rgba(14,29,45,.58)",border:"rgba(180,219,239,.28)",glow:"rgba(116,184,218,.19)",text:"#f4fbff",muted:"#c7d8e5"},radius:"32px",heading:'"Cormorant Garamond", Georgia, serif',body:"Verdana, system-ui, sans-serif",colors:["#bce6f4","#acb6ff","#e8d9ff","#8fcfd5","#d9e8ff"]};export{B as default};
