import{a as X}from"./chunk-chunk-JAGATSO7.js";import{a as O}from"./chunk-chunk-2H2FWMJN.js";import{a as I}from"./chunk-chunk-OEUN6SWS.js";var z=`#version 300 es
precision highp float;precision highp int;
out vec2 vUv;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`,te=`#version 300 es
precision highp float;precision highp int;
in vec2 vUv;out vec4 outColor;
uniform sampler2D uScene;uniform vec2 uTexel;uniform float uBloom,uExposure,uVignette;
vec3 bright(vec2 uv){return max(texture(uScene,uv).rgb-.72,0.0);}
vec3 film(vec3 x){return clamp((x*(2.51*x+.03))/(x*(2.43*x+.59)+.14),0.0,1.0);}
void main(){
 vec3 c=texture(uScene,vUv).rgb,b=vec3(0.0);
 for(int i=0;i<8;i++){float a=float(i)*.785398;vec2 d=vec2(cos(a),sin(a))*uTexel;
  b+=bright(vUv+d*3.0)*.055+bright(vUv+d*9.0)*.04+bright(vUv+d*21.0)*.027;}
 c=film((c+b*uBloom)*uExposure);c=pow(c,vec3(1.0/2.2));
 vec2 p=vUv-.5;c*=1.0-uVignette*dot(p,p);
 float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)-.5;
 outColor=vec4(c+grain/255.0,1.0);
}`,W=`
vec3 shadeSurface(vec3 base,vec3 N,vec3 V,vec3 L,float roughness,float metal,float ao){
 vec3 H=normalize(V+L);float nl=max(dot(N,L),0.0),nv=max(dot(N,V),.05),nh=max(dot(N,H),0.0),vh=max(dot(V,H),0.0);
 float a=roughness*roughness,a2=a*a,d=nh*nh*(a2-1.0)+1.0;
 float D=a2/(3.141593*d*d+.0001),k=(roughness+1.0)*(roughness+1.0)*.125;
 float G=nl/(nl*(1.0-k)+k)*nv/(nv*(1.0-k)+k);
 vec3 F0=mix(vec3(.04),base,metal),F=F0+(1.0-F0)*pow(1.0-vh,5.0);
 vec3 spec=D*G*F/max(.06,4.0*nl*nv);
 return base*(.20+.17*max(N.y,0.0))*ao+(base*(1.0-metal)*nl*.92+spec*nl*1.7)*ao;
}
`;function Y(i,o,a,r=.1,s=240){i.fill(0);let n=1/Math.tan(o/2);return i[0]=n/a,i[5]=n,i[10]=(s+r)/(r-s),i[11]=-1,i[14]=2*s*r/(r-s),i}function fe(i,o,a,r,s,n,t){return i.fill(0),i[0]=2/(a-o),i[5]=2/(s-r),i[10]=-2/(t-n),i[12]=-(a+o)/(a-o),i[13]=-(s+r)/(s-r),i[14]=-(t+n)/(t-n),i[15]=1,i}function j(i,o,a){let r=o[0]-a[0],s=o[1]-a[1],n=o[2]-a[2],t=Math.hypot(r,s,n)||1;r/=t,s/=t,n/=t;let e=n,l=0,d=-r;t=Math.hypot(e,d)||1,e/=t,d/=t;let h=s*d,p=n*e-r*d,y=-s*e;return i.set([e,h,r,0,l,p,s,0,d,y,n,0,-e*o[0]-d*o[2],-h*o[0]-p*o[1]-y*o[2],-r*o[0]-s*o[1]-n*o[2],1]),i}function K(i,o,a){for(let r=0;r<4;r++)for(let s=0;s<4;s++)i[r*4+s]=o[s]*a[r*4]+o[4+s]*a[r*4+1]+o[8+s]*a[r*4+2]+o[12+s]*a[r*4+3];return i}function q(i,o,{exposure:a=1,bloom:r=.3,vignette:s=.14,resolution:n={}}={}){let t=document.createElement("canvas");t.className="theme-world-canvas",t.dataset.world=o,t.setAttribute("aria-hidden","true"),t.style.cssText="position:fixed;inset:0;width:100%;height:100lvh;pointer-events:none;z-index:-2;",i.canvas.parentNode?.insertBefore(t,i.canvas);let e=t.getContext("webgl2",{alpha:!1,antialias:!0,depth:!0,stencil:!1,powerPreference:"high-performance"});if(!e)return t.remove(),null;let l=[],d=!1,h=1,p=1,y=1,E=(c,f)=>(l.push(()=>f.call(e,c)),c);function b(c,f){let m=(U,_)=>{let R=e.createShader(U);if(e.shaderSource(R,_),e.compileShader(R),!e.getShaderParameter(R,e.COMPILE_STATUS)){let M=e.getShaderInfoLog(R);throw e.deleteShader(R),Error(M)}return R},F=m(e.VERTEX_SHADER,c),u,v;try{if(u=m(e.FRAGMENT_SHADER,f),v=e.createProgram(),e.attachShader(v,F),e.attachShader(v,u),e.linkProgram(v),!e.getProgramParameter(v,e.LINK_STATUS))throw Error(e.getProgramInfoLog(v))}catch(U){throw v&&e.deleteProgram(v),U}finally{e.deleteShader(F),u&&e.deleteShader(u)}return E(v,e.deleteProgram),v}let x;try{x=b(z,te)}catch{t.remove();for(let f of l)f();return null}let g=E(e.createTexture(),e.deleteTexture),w=E(e.createFramebuffer(),e.deleteFramebuffer),S=E(e.createRenderbuffer(),e.deleteRenderbuffer),A=!!e.getExtension("EXT_color_buffer_float"),T=A?e.RGBA16F:e.RGBA8,P=e.getInternalformatParameter(e.RENDERBUFFER,T,e.SAMPLES)||[],B=[...P].filter(c=>c<=4).sort((c,f)=>f-c)[0]||0,L=B?E(e.createFramebuffer(),e.deleteFramebuffer):null,C=B?E(e.createRenderbuffer(),e.deleteRenderbuffer):null,V=B?E(e.createRenderbuffer(),e.deleteRenderbuffer):null;e.bindTexture(e.TEXTURE_2D,g),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let G=new Map;function N(c,f){let m=G.get(c);return m||(m=new Map,G.set(c,m)),m.has(f)||m.set(f,e.getUniformLocation(c,f)),m.get(f)}function Z(c,f=null){let m=[],F=E(e.createVertexArray(),e.deleteVertexArray);e.bindVertexArray(F);let u=(_,R,M,D=0,H=!1)=>{if(!_)return;let k=E(e.createBuffer(),e.deleteBuffer);e.bindBuffer(e.ARRAY_BUFFER,k),e.bufferData(e.ARRAY_BUFFER,_ instanceof Float32Array?_:new Float32Array(_),H?e.DYNAMIC_DRAW:e.STATIC_DRAW),H&&m.push([R,k]),e.enableVertexAttribArray(R),e.vertexAttribPointer(R,M,e.FLOAT,!1,0,0),D&&e.vertexAttribDivisor(R,D)};u(c.positions,0,3),u(c.normals,1,3),u(c.uvs,2,2),f&&(u(f.a,3,4,1),u(f.b,4,4,1),u(f.c,5,4,1,!0),u(f.d,6,4,1,!0));let v=E(e.createBuffer(),e.deleteBuffer),U=c.indices.length>65535?new Uint32Array(c.indices):new Uint16Array(c.indices);return e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,v),e.bufferData(e.ELEMENT_ARRAY_BUFFER,U,e.STATIC_DRAW),e.bindVertexArray(null),{vao:F,count:U.length,type:U instanceof Uint32Array?e.UNSIGNED_INT:e.UNSIGNED_SHORT,instances:f?f.a.length/4:1,updateInstances(_){for(let[R,M]of m){let D=_[R===5?"c":"d"];D&&(e.bindBuffer(e.ARRAY_BUFFER,M),e.bufferSubData(e.ARRAY_BUFFER,0,D))}}}}function $(c){e.bindVertexArray(c.vao),e.drawElementsInstanced(e.TRIANGLES,c.count,c.type,0,c.instances)}function J({width:c,height:f,ratio:m=1}){let F=O({width:c,height:f,ratio:m},n);h=F.cssWidth,p=F.cssHeight,y=F.pixelRatio;let u=F.width,v=F.height;if(!(t.width===u&&t.height===v)){if(t.width=u,t.height=v,e.bindTexture(e.TEXTURE_2D,g),e.texImage2D(e.TEXTURE_2D,0,A?e.RGBA16F:e.RGBA,u,v,0,e.RGBA,A?e.HALF_FLOAT:e.UNSIGNED_BYTE,null),e.bindRenderbuffer(e.RENDERBUFFER,S),e.renderbufferStorage(e.RENDERBUFFER,e.DEPTH_COMPONENT24,u,v),e.bindFramebuffer(e.FRAMEBUFFER,w),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,g,0),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.RENDERBUFFER,S),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw Error("Scene target unavailable");if(L&&(e.bindFramebuffer(e.FRAMEBUFFER,L),e.bindRenderbuffer(e.RENDERBUFFER,C),e.renderbufferStorageMultisample(e.RENDERBUFFER,B,T,u,v),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,C),e.bindRenderbuffer(e.RENDERBUFFER,V),e.renderbufferStorageMultisample(e.RENDERBUFFER,B,e.DEPTH_COMPONENT24,u,v),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.RENDERBUFFER,V),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE))throw Error("Scene sampling unavailable");e.bindFramebuffer(e.FRAMEBUFFER,null)}}function Q(){return d||e.isContextLost()?!1:(e.bindFramebuffer(e.FRAMEBUFFER,L||w),e.viewport(0,0,t.width,t.height),e.depthMask(!0),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT|e.DEPTH_BUFFER_BIT),!0)}function ee(){L&&(e.bindFramebuffer(e.READ_FRAMEBUFFER,L),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,w),e.blitFramebuffer(0,0,t.width,t.height,0,0,t.width,t.height,e.COLOR_BUFFER_BIT,e.NEAREST)),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,t.width,t.height),e.disable(e.DEPTH_TEST),e.disable(e.BLEND),e.disable(e.CULL_FACE),e.depthMask(!1),e.useProgram(x),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,g),e.uniform1i(N(x,"uScene"),0),e.uniform2f(N(x,"uTexel"),1/t.width,1/t.height),e.uniform1f(N(x,"uBloom"),r),e.uniform1f(N(x,"uExposure"),a),e.uniform1f(N(x,"uVignette"),s),e.bindVertexArray(null),e.drawArrays(e.TRIANGLES,0,3)}return{gl:e,canvas:t,keep:E,program:b,loc:N,mesh:Z,draw:$,resize:J,begin:Q,finish:ee,get width(){return h},get height(){return p},get ratio(){return y},dispose(){if(!d){d=!0;for(let c of l.reverse())try{c()}catch{}t.remove(),e.getExtension("WEBGL_lose_context")?.loseContext()}}}}var re=`#version 300 es
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
 vec3 emission=vec3(0);float trans=1.0;
 for(int i=0;i<48;i++){
  float reach=5.0+(float(i)+.5)*3.8;vec3 p=ro+rd*reach;
  float seed=p.z*.036;
  float warpedX=p.x+sin(p.y*.039+seed)*2.5+p.y*.09;
  float fold=sin(warpedX*.073+uTime*.16)*10.0+sin(warpedX*.157-p.y*.012-uTime*.11)*4.5+sin(warpedX*.29+uTime*.09)*1.1+p.y*.16;
  float depth=mod(p.z+fold+13.0,26.0)-13.0;
  float curtain=exp(-depth*depth*.062);
  float base=-13.0+sin(p.x*.061+seed+uTime*.07)*10.0+sin(p.x*.12+seed*.37-uTime*.05)*4.0;
  float elevation=p.y-base,height=elevation/38.0;
  float envelope=exp(-pow((elevation-14.0)/21.0,2.0))*smoothstep(-12.0,1.0,elevation);
  envelope*=.10+.90*pow(.5+.5*sin(p.x*.046+seed+uTime*.06),3.0);
  float ray=warpedX*3.8+sin(p.x*.21+p.y*.026-uTime*.21+seed)*2.7;
  float foot=clamp(fwidth(ray),0.0,3.0),filament=.70+.11*sin(ray)*exp(-foot*foot*.12)+.045*sin(ray*2.37+seed)*exp(-foot*foot*.7);
  float lace=.85+.15*sin(p.y*.12+p.x*.37+seed-uTime*.045);
  float density=curtain*envelope*filament*lace*.066*(1.0-smoothstep(145.0,188.0,reach));
  float hue=.5+.5*sin(p.x*.022+p.z*.013+uTime*.07);
  vec3 color=mix(vec3(.035,.58,.40),vec3(.08,.35,.70),hue);
  color=mix(color,vec3(.39,.16,.68),smoothstep(-.18,.8,height)*.75);
  color=mix(color,vec3(.66,.12,.39),smoothstep(.45,1.4,height)*.47);
  emission+=trans*color*density;trans*=1.0-density*.15;
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
}`;function oe(i,o,a,r,s,n){let{gl:t,loc:e}=i;t.disable(t.DEPTH_TEST),t.disable(t.BLEND),t.disable(t.CULL_FACE),t.useProgram(o),t.bindVertexArray(null),t.uniform1f(e(o,"uTime"),a),t.uniform1f(e(o,"uAspect"),i.width/i.height),t.uniform1i(e(o,"uKind"),r),t.uniform3fv(e(o,"uEye"),s),t.uniform3f(e(o,"uForward"),-n[2],-n[6],-n[10]),t.uniform3f(e(o,"uRight"),n[0],n[4],n[8]),t.uniform3f(e(o,"uUp"),n[1],n[5],n[9]),t.drawArrays(t.TRIANGLES,0,3)}var ae=`#version 300 es
precision highp float;precision highp int;
layout(location=0)in vec3 aPosition;layout(location=2)in vec2 aUv;
layout(location=3)in vec4 aInstance;layout(location=4)in vec4 aDetail;
uniform mat4 uViewProj;uniform vec3 uEye;uniform float uTime,uTravel;
out vec3 vWorld,vNormal;out vec2 vUv;out float vSeed,vVisibility;
vec3 path(float t){float b=aInstance.x,s=aInstance.y;
 float x=(t-.5)*300.0+uEye.x;
 float helix=s*6.283185+x*.025+uTime*.15;
 float baseY=mod(-22.0+b*9.0+(s-.5)*16.0-uEye.y+48.0,96.0)-48.0+uEye.y;
 float y=baseY+sin(x*.025+uTime*.13+b*.71)*9.2+sin(x*.056-uTime*.09+b)*2.5+cos(helix)*(3.4+s*.8);
 float z=mod(-b*29.0+s*26.0+uTravel+132.0,184.0)-132.0+sin(x*.036+uTime*.12+b)*12.0+sin(helix)*(5.0+s*1.8);
 return vec3(x,y,z);
}
void main(){float t=aPosition.x;vec3 p=path(t),T=normalize(path(t+.0008)-path(t-.0008)),B=normalize(cross(T,vec3(0,1,0))),N=cross(B,T);
 vec3 normal=B*aPosition.y+N*aPosition.z;float width=aInstance.w*(.92+.08*sin(t*19.0+uTime*.2+aInstance.z));
 float centerY=mod(-22.0+aInstance.x*9.0+(aInstance.y-.5)*16.0-uEye.y+48.0,96.0)-48.0;
 float centerZ=mod(-aInstance.x*29.0+aInstance.y*26.0+uTravel+132.0,184.0)-132.0;
 vVisibility=smoothstep(0.0,8.0,48.0-abs(centerY))*(1.0-smoothstep(119.0,153.0,uEye.z-centerZ))*smoothstep(-12.0,7.0,uEye.z-centerZ);
 vWorld=p+normal*width;vNormal=normal;vUv=aUv;vSeed=aInstance.z;gl_Position=uViewProj*vec4(vWorld,1.0);
}`,ie=`#version 300 es
precision highp float;precision highp int;in vec3 vWorld,vNormal;in vec2 vUv;in float vSeed,vVisibility;out vec4 outColor;
uniform vec3 uEye;uniform float uTime;
${W}
void main(){vec3 V=normalize(uEye-vWorld),N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
 vec3 base=mix(vec3(.63,.28,.052),vec3(1.0,.75,.30),.5+.5*sin(vSeed*4.1));
 vec3 c=shadeSurface(base,N,V,normalize(vec3(-.6,.8,.6)),.23,.86,1.0);
 float crest=pow(max(0.0,sin(vUv.x*17.0-uTime*.34+vSeed*9.0)),24.0);
 float edge=pow(1.0-abs(dot(N,V)),3.0);c+=base*(.04+crest*.30+edge*.12);
 float distance=length(uEye-vWorld),near=smoothstep(2.0,8.0,distance),fog=exp(-distance*.0105);
 float alpha=vVisibility*near*(1.0-smoothstep(135.0,190.0,distance));c=mix(vec3(.019,.011,.007),c,fog);outColor=vec4(c,alpha);
}`;function ne(i=160,o=8){let a=[],r=[],s=[];for(let n=0;n<=i;n++)for(let t=0;t<=o;t++){let e=t/o*Math.PI*2;a.push(n/i,Math.cos(e),Math.sin(e)),r.push(n/i,t/o)}for(let n=0;n<i;n++)for(let t=0;t<o;t++){let e=n*(o+1)+t,l=e+o+1;s.push(e,l,e+1,e+1,l,l+1)}return{positions:a,uvs:r,indices:s}}function se(){let i=[],o=[];for(let a=0;a<6;a++)for(let r=0;r<30;r++)i.push(a,r/29,a*1.731+r*.219,.009+r%5*.0014),o.push(0,0,0,0);return{a:i,b:o}}function ce(i,o,a,r,s,n){let t=(h,p)=>(h%p+p)%p,e=[t((i.x/o-.5)*92-r[0]+46,92)-46+r[0],t((.5-i.y/a)*72-r[1]+36,72)-36+r[1],t(-i.depth*48+s+176,208)-176],l=[0,0,0,0];for(let h=0;h<4;h++)l[h]=n[h]*e[0]+n[4+h]*e[1]+n[8+h]*e[2]+n[12+h];if(l[3]<1)return{x:-200,y:-200,scale:0,alpha:0};let d=Math.min(1,(l[3]-2)/6,(200-l[3])/35,(46-Math.abs(e[0]-r[0]))/5,(36-Math.abs(e[1]-r[1]))/5);return{x:(l[0]/l[3]+1)*o/2,y:(1-l[1]/l[3])*a/2,scale:Math.max(.3,Math.min(3.2,Math.pow(85/l[3],.7))),alpha:Math.max(0,d)}}function me(i,o){let a=q(i,o,{exposure:1.04,bloom:o==="aurora"?.2:.14,vignette:.1,resolution:{maxPixels:14e5}});if(!a)return I(i,o);a.canvas.dataset.layered="true";let{gl:r,loc:s}=a,n,t,e;try{n=a.program(z,re),o==="golden"&&(t=a.program(ae,ie),e=a.mesh(ne(),se()))}catch{return a.dispose(),I(i,o)}let l=0,d=[0,1,24],h=new Float32Array(16),p=new Float32Array(16),y=new Float32Array(16),E=X({rest:.72,flight:2.2,xLimit:1e6,yLimit:1e6});return{canvas:a.canvas,resize:a.resize,projectParticle:(b,x,g)=>ce(b,x,g,d,l,y),draw({time:b,width:x,height:g,camera:w}){if((x!==a.width||g!==a.height)&&a.resize({width:x,height:g,ratio:devicePixelRatio||1}),!a.begin())return;let{travel:S,input:A}=E.step(b,w),T=[A.x*3,A.y*1.7+(o==="aurora"?1:2),24];j(p,T,[T[0]+Math.sin(b*.035)*.25,T[1],-16]),Y(h,1,x/g),K(y,h,p),l=S+A.z*5,d=T;let P=o==="aurora"?[T[0],T[1],T[2]-S-A.z*5]:T;oe(a,n,b,o==="aurora"?0:1,P,p),t&&(r.enable(r.DEPTH_TEST),r.depthMask(!0),r.disable(r.CULL_FACE),r.enable(r.BLEND),r.blendFunc(r.SRC_ALPHA,r.ONE_MINUS_SRC_ALPHA),r.useProgram(t),r.uniformMatrix4fv(s(t,"uViewProj"),!1,y),r.uniform3fv(s(t,"uEye"),T),r.uniform1f(s(t,"uTime"),b),r.uniform1f(s(t,"uTravel"),S+A.z*5),a.draw(e)),a.finish()},dispose:a.dispose}}export{z as a,W as b,Y as c,fe as d,j as e,K as f,q as g,re as h,oe as i,me as j};
