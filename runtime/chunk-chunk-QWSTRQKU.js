import{b as Y}from"./chunk-chunk-AM4UQ47E.js";import{a as W}from"./chunk-chunk-424P3C67.js";var H=`#version 300 es
precision highp float;precision highp int;
out vec2 vUv;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`,re=`#version 300 es
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
}`,$=`
vec3 shadeSurface(vec3 base,vec3 N,vec3 V,vec3 L,float roughness,float metal,float ao){
 vec3 H=normalize(V+L);float nl=max(dot(N,L),0.0),nv=max(dot(N,V),.05),nh=max(dot(N,H),0.0),vh=max(dot(V,H),0.0);
 float a=roughness*roughness,a2=a*a,d=nh*nh*(a2-1.0)+1.0;
 float D=a2/(3.141593*d*d+.0001),k=(roughness+1.0)*(roughness+1.0)*.125;
 float G=nl/(nl*(1.0-k)+k)*nv/(nv*(1.0-k)+k);
 vec3 F0=mix(vec3(.04),base,metal),F=F0+(1.0-F0)*pow(1.0-vh,5.0);
 vec3 spec=D*G*F/max(.06,4.0*nl*nv);
 return base*(.20+.17*max(N.y,0.0))*ao+(base*(1.0-metal)*nl*.92+spec*nl*1.7)*ao;
}
`;function j(r,a,i,o=.1,l=240){r.fill(0);let n=1/Math.tan(a/2);return r[0]=n/i,r[5]=n,r[10]=(l+o)/(o-l),r[11]=-1,r[14]=2*l*o/(o-l),r}function ue(r,a,i,o,l,n,t){return r.fill(0),r[0]=2/(i-a),r[5]=2/(l-o),r[10]=-2/(t-n),r[12]=-(i+a)/(i-a),r[13]=-(l+o)/(l-o),r[14]=-(t+n)/(t-n),r[15]=1,r}function K(r,a,i){let o=a[0]-i[0],l=a[1]-i[1],n=a[2]-i[2],t=Math.hypot(o,l,n)||1;o/=t,l/=t,n/=t;let e=n,s=0,m=-o;t=Math.hypot(e,m)||1,e/=t,m/=t;let h=l*m,R=n*e-o*m,f=-l*e;return r.set([e,h,o,0,s,R,l,0,m,f,n,0,-e*a[0]-m*a[2],-h*a[0]-R*a[1]-f*a[2],-o*a[0]-l*a[1]-n*a[2],1]),r}function q(r,a,i){for(let o=0;o<4;o++)for(let l=0;l<4;l++)r[o*4+l]=a[l]*i[o*4]+a[4+l]*i[o*4+1]+a[8+l]*i[o*4+2]+a[12+l]*i[o*4+3];return r}function Z(r,a,{exposure:i=1,bloom:o=.3,vignette:l=.14,resolution:n={}}={}){let t=document.createElement("canvas");t.className="theme-world-canvas",t.dataset.world=a,t.setAttribute("aria-hidden","true"),t.style.cssText="position:fixed;inset:0;width:100%;height:100lvh;pointer-events:none;z-index:-2;",r.canvas.parentNode?.insertBefore(t,r.canvas);let e=t.getContext("webgl2",{alpha:!1,antialias:!0,depth:!0,stencil:!1,powerPreference:"high-performance"});if(!e)return t.remove(),null;let s=[],m=!1,h=1,R=1,f=1,u=(d,T)=>(s.push(()=>T.call(e,d)),d);function E(d,T){let U=(L,C)=>{let M=e.createShader(L);if(e.shaderSource(M,C),e.compileShader(M),!e.getShaderParameter(M,e.COMPILE_STATUS)){let D=e.getShaderInfoLog(M);throw e.deleteShader(M),Error(D)}return M},N=U(e.VERTEX_SHADER,d),g,F;try{if(g=U(e.FRAGMENT_SHADER,T),F=e.createProgram(),e.attachShader(F,N),e.attachShader(F,g),e.linkProgram(F),!e.getProgramParameter(F,e.LINK_STATUS))throw Error(e.getProgramInfoLog(F))}catch(L){throw F&&e.deleteProgram(F),L}finally{e.deleteShader(N),g&&e.deleteShader(g)}return u(F,e.deleteProgram),F}let b;try{b=E(H,re)}catch{t.remove();for(let T of s)T();return null}let c=u(e.createTexture(),e.deleteTexture),A=u(e.createFramebuffer(),e.deleteFramebuffer),_=u(e.createRenderbuffer(),e.deleteRenderbuffer),v=!!e.getExtension("EXT_color_buffer_float"),p=v?e.RGBA16F:e.RGBA8,S=e.getInternalformatParameter(e.RENDERBUFFER,p,e.SAMPLES)||[],y=[...S].filter(d=>d<=4).sort((d,T)=>T-d)[0]||0,x=y?u(e.createFramebuffer(),e.deleteFramebuffer):null,P=y?u(e.createRenderbuffer(),e.deleteRenderbuffer):null,z=y?u(e.createRenderbuffer(),e.deleteRenderbuffer):null;e.bindTexture(e.TEXTURE_2D,c),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MIN_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_MAG_FILTER,e.LINEAR),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_S,e.CLAMP_TO_EDGE),e.texParameteri(e.TEXTURE_2D,e.TEXTURE_WRAP_T,e.CLAMP_TO_EDGE);let I=new Map;function B(d,T){let U=I.get(d);return U||(U=new Map,I.set(d,U)),U.has(T)||U.set(T,e.getUniformLocation(d,T)),U.get(T)}function G(d,T=null){let U=[],N=u(e.createVertexArray(),e.deleteVertexArray);e.bindVertexArray(N);let g=(C,M,D,w=0,O=!1)=>{if(!C)return;let X=u(e.createBuffer(),e.deleteBuffer);e.bindBuffer(e.ARRAY_BUFFER,X),e.bufferData(e.ARRAY_BUFFER,C instanceof Float32Array?C:new Float32Array(C),O?e.DYNAMIC_DRAW:e.STATIC_DRAW),O&&U.push([M,X]),e.enableVertexAttribArray(M),e.vertexAttribPointer(M,D,e.FLOAT,!1,0,0),w&&e.vertexAttribDivisor(M,w)};g(d.positions,0,3),g(d.normals,1,3),g(d.uvs,2,2),T&&(g(T.a,3,4,1),g(T.b,4,4,1),g(T.c,5,4,1,!0),g(T.d,6,4,1,!0));let F=u(e.createBuffer(),e.deleteBuffer),L=d.indices.length>65535?new Uint32Array(d.indices):new Uint16Array(d.indices);return e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,F),e.bufferData(e.ELEMENT_ARRAY_BUFFER,L,e.STATIC_DRAW),e.bindVertexArray(null),{vao:N,count:L.length,type:L instanceof Uint32Array?e.UNSIGNED_INT:e.UNSIGNED_SHORT,instances:T?T.a.length/4:1,updateInstances(C){for(let[M,D]of U){let w=C[M===5?"c":"d"];w&&(e.bindBuffer(e.ARRAY_BUFFER,D),e.bufferSubData(e.ARRAY_BUFFER,0,w))}}}}function J(d){e.bindVertexArray(d.vao),e.drawElementsInstanced(e.TRIANGLES,d.count,d.type,0,d.instances)}function Q({width:d,height:T,ratio:U=1}){let N=W({width:d,height:T,ratio:U},n);h=N.cssWidth,R=N.cssHeight,f=N.pixelRatio;let g=N.width,F=N.height;if(!(t.width===g&&t.height===F)){if(t.width=g,t.height=F,e.bindTexture(e.TEXTURE_2D,c),e.texImage2D(e.TEXTURE_2D,0,v?e.RGBA16F:e.RGBA,g,F,0,e.RGBA,v?e.HALF_FLOAT:e.UNSIGNED_BYTE,null),e.bindRenderbuffer(e.RENDERBUFFER,_),e.renderbufferStorage(e.RENDERBUFFER,e.DEPTH_COMPONENT24,g,F),e.bindFramebuffer(e.FRAMEBUFFER,A),e.framebufferTexture2D(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.TEXTURE_2D,c,0),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.RENDERBUFFER,_),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE)throw Error("Scene target unavailable");if(x&&(e.bindFramebuffer(e.FRAMEBUFFER,x),e.bindRenderbuffer(e.RENDERBUFFER,P),e.renderbufferStorageMultisample(e.RENDERBUFFER,y,p,g,F),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.COLOR_ATTACHMENT0,e.RENDERBUFFER,P),e.bindRenderbuffer(e.RENDERBUFFER,z),e.renderbufferStorageMultisample(e.RENDERBUFFER,y,e.DEPTH_COMPONENT24,g,F),e.framebufferRenderbuffer(e.FRAMEBUFFER,e.DEPTH_ATTACHMENT,e.RENDERBUFFER,z),e.checkFramebufferStatus(e.FRAMEBUFFER)!==e.FRAMEBUFFER_COMPLETE))throw Error("Scene sampling unavailable");e.bindFramebuffer(e.FRAMEBUFFER,null)}}function ee(){return m||e.isContextLost()?!1:(e.bindFramebuffer(e.FRAMEBUFFER,x||A),e.viewport(0,0,t.width,t.height),e.depthMask(!0),e.clearColor(0,0,0,1),e.clear(e.COLOR_BUFFER_BIT|e.DEPTH_BUFFER_BIT),!0)}function te(){x&&(e.bindFramebuffer(e.READ_FRAMEBUFFER,x),e.bindFramebuffer(e.DRAW_FRAMEBUFFER,A),e.blitFramebuffer(0,0,t.width,t.height,0,0,t.width,t.height,e.COLOR_BUFFER_BIT,e.NEAREST)),e.bindFramebuffer(e.FRAMEBUFFER,null),e.viewport(0,0,t.width,t.height),e.disable(e.DEPTH_TEST),e.disable(e.BLEND),e.disable(e.CULL_FACE),e.depthMask(!1),e.useProgram(b),e.activeTexture(e.TEXTURE0),e.bindTexture(e.TEXTURE_2D,c),e.uniform1i(B(b,"uScene"),0),e.uniform2f(B(b,"uTexel"),1/t.width,1/t.height),e.uniform1f(B(b,"uBloom"),o),e.uniform1f(B(b,"uExposure"),i),e.uniform1f(B(b,"uVignette"),l),e.bindVertexArray(null),e.drawArrays(e.TRIANGLES,0,3)}return{gl:e,canvas:t,keep:u,program:E,loc:B,mesh:G,draw:J,resize:Q,begin:ee,finish:te,get width(){return h},get height(){return R},get ratio(){return f},dispose(){if(!m){m=!0;for(let d of s.reverse())try{d()}catch{}t.remove(),e.getExtension("WEBGL_lose_context")?.loseContext()}}}}var V=Math.PI*2;function k(r,a){let i=1,o=1,l=a==="golden"?["239,184,105","211,152,98","207,175,224"]:a==="moon"?["162,218,234","173,183,248","225,208,244"]:["105,199,207","135,131,235","186,113,219"];function n(t,e,s,m,h){let R=r.createRadialGradient(t,e,0,t,e,s);R.addColorStop(0,`rgba(${m},${h})`),R.addColorStop(.45,`rgba(${m},${h*.3})`),R.addColorStop(1,`rgba(${m},0)`),r.fillStyle=R,r.fillRect(t-s,e-s,s*2,s*2)}return{resize(t){i=t.width,o=t.height},draw({time:t,width:e,height:s,camera:m}){i=e,o=s;let h=(m?.x||0)*e*.07,R=(m?.y||0)*s*.04;if(r.save(),r.globalAlpha=1,n(e*.64+Math.sin(t*.035)*e*.12-h,s*.27-R,Math.max(e,s)*.65,l[0],a==="golden"?.12:.14),n(e*.22+Math.cos(t*.029)*e*.12-h,s*.7-R,Math.max(e,s)*.56,l[2],.085),a==="aurora"){r.globalCompositeOperation="screen";for(let f=0;f<3;f++)for(let u=0;u<30;u++){let E=(u/29*1.6-.3)*e-h*.25,b=s*(.3+f*.1)+Math.sin(u*.24+t*.19+f)*s*.12-R*.3;r.save(),r.translate(E,b),r.scale(e*.047,s*.3);let c=r.createRadialGradient(0,0,0,0,0,1);c.addColorStop(0,`rgba(${l[f%3]},.033)`),c.addColorStop(.48,`rgba(${l[f%3]},.016)`),c.addColorStop(1,`rgba(${l[f%3]},0)`),r.fillStyle=c,r.fillRect(-1,-1,2,2),r.restore()}}else if(a==="golden"){r.globalCompositeOperation="screen";for(let f=0;f<4;f++)for(let u=0;u<20;u++){let E=u/20*V+f*.4,b=(m?.x||0)*3,c=2+(m?.y||0)*1.7,A=((112-f*29+t*.7+(m?.z||0)*5)%156+156)%156-120,_=((-12+f*.9-c+40)%80+80)%80-40+c,v=s*.92;r.beginPath();let p=50;for(let y=0;y<=110;y++){let x=(y/110-.5)*300+b,P=E+x*.046+t*.23,z=_+Math.sin(x*.042+t*.28+f*.71)*7.2+Math.sin(x*.094-t*.16+f)*1.8+Math.cos(P)*1.2,I=A+Math.sin(x*.063+t*.18+f)*7+Math.sin(P)*2.8;p=Math.max(5,24-I);let B=e*.5+(x-b)*v/p,G=s*.5-(z-c)*v/p;y===0?r.moveTo(B,G):r.lineTo(B,G)}let S=.5+.5*Math.sin(t*.35+E);r.strokeStyle=`rgba(239,${170+Math.round(S*38)},${100+Math.round(S*34)},${.08+.1*S})`,r.lineWidth=Math.max(.35,Math.min(1.8,22/p)),r.stroke()}}else{let f=e*.75+Math.sin(t*.021)*e*.018-h*.18,u=s*.21-R*.15,E=Math.min(e,s)*.045;n(f,u,E*7,"176,215,241",.13);let b=r.createRadialGradient(f-E*.3,u-E*.3,E*.12,f,u,E);b.addColorStop(0,"rgba(249,250,245,.82)"),b.addColorStop(.72,"rgba(207,223,239,.74)"),b.addColorStop(1,"rgba(145,168,197,.62)"),r.fillStyle=b,r.beginPath(),r.arc(f,u,E,0,V),r.fill(),r.save(),r.beginPath(),r.arc(f,u,E,0,V),r.clip();for(let c=0;c<11;c++){let A=c*2.399,_=E*(.16+c%4*.14),v=E*(.047+c%3*.031),p=f+Math.cos(A)*_,S=u+Math.sin(A)*_,y=r.createRadialGradient(p-v*.12,S-v*.15,0,p,S,v);y.addColorStop(0,"rgba(114,140,174,.18)"),y.addColorStop(1,"rgba(114,140,174,0)"),r.fillStyle=y,r.fillRect(p-v,S-v,v*2,v*2)}r.restore();for(let c=0;c<24;c++){let A=.3+c%4*.17,_=e+180,v=(c*167.31-h*A+_)%_-90,p=s*1.03-R*.2,S=p-s*(.16+c%5*.047),y=Math.sin(t*.13+c)*13;r.strokeStyle=`rgba(146,192,205,${.04+A*.07})`,r.lineWidth=.7+A,r.beginPath(),r.moveTo(v,p),r.bezierCurveTo(v-12,p-s*.12,v+y,S+s*.06,v+y,S),r.stroke(),r.fillStyle=`rgba(162,200,214,${.06+A*.055})`;for(let x=1;x<4;x++){let P=p-(p-S)*x/4;r.beginPath(),r.ellipse(v+y*x/4+(x%2?10:-10),P,12*A,3*A,x%2?-.5:.5,0,V),r.fill()}}}r.restore()},dispose(){}}}var oe=`#version 300 es
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
}`;function ae(r,a,i,o,l,n){let{gl:t,loc:e}=r;t.disable(t.DEPTH_TEST),t.disable(t.BLEND),t.disable(t.CULL_FACE),t.useProgram(a),t.bindVertexArray(null),t.uniform1f(e(a,"uTime"),i),t.uniform1f(e(a,"uAspect"),r.width/r.height),t.uniform1i(e(a,"uKind"),o),t.uniform3fv(e(a,"uEye"),l),t.uniform3f(e(a,"uForward"),-n[2],-n[6],-n[10]),t.uniform3f(e(a,"uRight"),n[0],n[4],n[8]),t.uniform3f(e(a,"uUp"),n[1],n[5],n[9]),t.drawArrays(t.TRIANGLES,0,3)}var ie=`#version 300 es
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
}`,ne=`#version 300 es
precision highp float;precision highp int;in vec3 vWorld,vNormal;in vec2 vUv;in float vSeed,vVisibility;out vec4 outColor;
uniform vec3 uEye;uniform float uTime;
${$}
void main(){vec3 V=normalize(uEye-vWorld),N=normalize(vNormal);if(!gl_FrontFacing)N=-N;
 vec3 base=mix(vec3(.63,.28,.052),vec3(1.0,.75,.30),.5+.5*sin(vSeed*4.1));
 vec3 c=shadeSurface(base,N,V,normalize(vec3(-.6,.8,.6)),.23,.86,1.0);
 float crest=pow(max(0.0,sin(vUv.x*17.0-uTime*.34+vSeed*9.0)),24.0);
 float edge=pow(1.0-abs(dot(N,V)),3.0);c+=base*(.04+crest*.30+edge*.12);
 float distance=length(uEye-vWorld),near=smoothstep(2.0,8.0,distance),fog=exp(-distance*.0105);
 float alpha=vVisibility*near*(1.0-smoothstep(135.0,190.0,distance));c=mix(vec3(.019,.011,.007),c,fog);outColor=vec4(c,alpha);
}`;function se(r=160,a=8){let i=[],o=[],l=[];for(let n=0;n<=r;n++)for(let t=0;t<=a;t++){let e=t/a*Math.PI*2;i.push(n/r,Math.cos(e),Math.sin(e)),o.push(n/r,t/a)}for(let n=0;n<r;n++)for(let t=0;t<a;t++){let e=n*(a+1)+t,s=e+a+1;l.push(e,s,e+1,e+1,s,s+1)}return{positions:i,uvs:o,indices:l}}function le(){let r=[],a=[];for(let i=0;i<6;i++)for(let o=0;o<30;o++)r.push(i,o/29,i*1.731+o*.219,.009+o%5*.0014),a.push(0,0,0,0);return{a:r,b:a}}function fe(r,a,i,o,l,n){let t=(h,R)=>(h%R+R)%R,e=[t((r.x/a-.5)*92-o[0]+46,92)-46+o[0],t((.5-r.y/i)*72-o[1]+36,72)-36+o[1],t(-r.depth*48+l+176,208)-176],s=[0,0,0,0];for(let h=0;h<4;h++)s[h]=n[h]*e[0]+n[4+h]*e[1]+n[8+h]*e[2]+n[12+h];if(s[3]<1)return{x:-200,y:-200,scale:0,alpha:0};let m=Math.min(1,(s[3]-2)/6,(200-s[3])/35,(46-Math.abs(e[0]-o[0]))/5,(36-Math.abs(e[1]-o[1]))/5);return{x:(s[0]/s[3]+1)*a/2,y:(1-s[1]/s[3])*i/2,scale:Math.max(.3,Math.min(3.2,Math.pow(85/s[3],.7))),alpha:Math.max(0,m)}}function Ee(r,a){let i=Z(r,a,{exposure:1.04,bloom:a==="aurora"?.2:.14,vignette:.1,resolution:{maxPixels:14e5}});if(!i)return k(r,a);i.canvas.dataset.layered="true";let{gl:o,loc:l}=i,n,t,e;try{n=i.program(H,oe),a==="golden"&&(t=i.program(ie,ne),e=i.mesh(se(),le()))}catch{return i.dispose(),k(r,a)}let s=0,m=[0,1,24],h=new Float32Array(16),R=new Float32Array(16),f=new Float32Array(16),u=Y({rest:.72,flight:2.2,xLimit:1e6,yLimit:1e6});return{canvas:i.canvas,resize:i.resize,projectParticle:(E,b,c)=>fe(E,b,c,m,s,f),draw({time:E,width:b,height:c,camera:A}){if((b!==i.width||c!==i.height)&&i.resize({width:b,height:c,ratio:devicePixelRatio||1}),!i.begin())return;let{travel:_,input:v}=u.step(E,A),p=[v.x*3,v.y*1.7+(a==="aurora"?1:2),24];K(R,p,[p[0]+Math.sin(E*.035)*.25,p[1],-16]),j(h,1,b/c),q(f,h,R),s=_+v.z*5,m=p;let S=a==="aurora"?[p[0],p[1],p[2]-_-v.z*5]:p;ae(i,n,E,a==="aurora"?0:1,S,R),t&&(o.enable(o.DEPTH_TEST),o.depthMask(!0),o.disable(o.CULL_FACE),o.enable(o.BLEND),o.blendFunc(o.SRC_ALPHA,o.ONE_MINUS_SRC_ALPHA),o.useProgram(t),o.uniformMatrix4fv(l(t,"uViewProj"),!1,f),o.uniform3fv(l(t,"uEye"),p),o.uniform1f(l(t,"uTime"),E),o.uniform1f(l(t,"uTravel"),_+v.z*5),i.draw(e)),i.finish()},dispose:i.dispose}}export{H as a,$ as b,j as c,ue as d,K as e,q as f,Z as g,k as h,oe as i,ae as j,fe as k,Ee as l};
