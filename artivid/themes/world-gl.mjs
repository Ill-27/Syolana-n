import {sceneResolution} from './scene-quality.mjs?v=20261012-refined-1';
// Shared scene resources, colour response and soft optical bloom.
export const FULLSCREEN_VS=`#version 300 es
precision highp float;precision highp int;
out vec2 vUv;
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));vUv=p;gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
export const OPTICS_FS=`#version 300 es
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
}`;
export const LIGHT_GLSL=`
vec3 shadeSurface(vec3 base,vec3 N,vec3 V,vec3 L,float roughness,float metal,float ao){
 vec3 H=normalize(V+L);float nl=max(dot(N,L),0.0),nv=max(dot(N,V),.05),nh=max(dot(N,H),0.0),vh=max(dot(V,H),0.0);
 float a=roughness*roughness,a2=a*a,d=nh*nh*(a2-1.0)+1.0;
 float D=a2/(3.141593*d*d+.0001),k=(roughness+1.0)*(roughness+1.0)*.125;
 float G=nl/(nl*(1.0-k)+k)*nv/(nv*(1.0-k)+k);
 vec3 F0=mix(vec3(.04),base,metal),F=F0+(1.0-F0)*pow(1.0-vh,5.0);
 vec3 spec=D*G*F/max(.06,4.0*nl*nv);
 return base*(.20+.17*max(N.y,0.0))*ao+(base*(1.0-metal)*nl*.92+spec*nl*1.7)*ao;
}
`;
export function perspective(out,fov,aspect,near=.1,far=240){
 out.fill(0);const f=1/Math.tan(fov/2);out[0]=f/aspect;out[5]=f;out[10]=(far+near)/(near-far);out[11]=-1;out[14]=2*far*near/(near-far);return out;
}
export function orthographic(out,left,right,bottom,top,near,far){
 out.fill(0);out[0]=2/(right-left);out[5]=2/(top-bottom);out[10]=-2/(far-near);out[12]=-(right+left)/(right-left);out[13]=-(top+bottom)/(top-bottom);out[14]=-(far+near)/(far-near);out[15]=1;return out;
}
export function lookAt(out,eye,target){
 let zx=eye[0]-target[0],zy=eye[1]-target[1],zz=eye[2]-target[2],n=Math.hypot(zx,zy,zz)||1;zx/=n;zy/=n;zz/=n;
 let xx=zz,xy=0,xz=-zx;n=Math.hypot(xx,xz)||1;xx/=n;xz/=n;
 const yx=zy*xz,yy=zz*xx-zx*xz,yz=-zy*xx;
 out.set([xx,yx,zx,0,xy,yy,zy,0,xz,yz,zz,0,-xx*eye[0]-xz*eye[2],-yx*eye[0]-yy*eye[1]-yz*eye[2],-zx*eye[0]-zy*eye[1]-zz*eye[2],1]);return out;
}
export function multiply(out,a,b){for(let c=0;c<4;c++)for(let r=0;r<4;r++)out[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return out;}
export function createGLWorld(ctx,kind,{exposure=1,bloom=.3,vignette=.14,resolution={}}={}){
 const canvas=document.createElement('canvas');canvas.className='theme-world-canvas';canvas.dataset.world=kind;canvas.setAttribute('aria-hidden','true');
 canvas.style.cssText='position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:-2;';ctx.canvas.parentNode?.insertBefore(canvas,ctx.canvas);
 const gl=canvas.getContext('webgl2',{alpha:false,antialias:true,depth:true,stencil:false,powerPreference:'high-performance'});
 if(!gl){canvas.remove();return null;}
 const cleanup=[];let dead=false,W=1,H=1,ratio=1;
 const keep=(v,fn)=>{cleanup.push(()=>fn.call(gl,v));return v;};
 function program(vs,fs){
  const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(s);gl.deleteShader(s);throw Error(error);}return s;};
  const v=shader(gl.VERTEX_SHADER,vs);let f,p;
  try{f=shader(gl.FRAGMENT_SHADER,fs);p=gl.createProgram();gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));}
  catch(e){if(p)gl.deleteProgram(p);throw e;}finally{gl.deleteShader(v);if(f)gl.deleteShader(f);}
  keep(p,gl.deleteProgram);return p;
 }
 let post;
 try{post=program(FULLSCREEN_VS,OPTICS_FS);}catch(e){canvas.remove();for(const f of cleanup)f();return null;}
 const texture=keep(gl.createTexture(),gl.deleteTexture),fbo=keep(gl.createFramebuffer(),gl.deleteFramebuffer),depth=keep(gl.createRenderbuffer(),gl.deleteRenderbuffer);
 const floatTarget=!!gl.getExtension('EXT_color_buffer_float'),format=floatTarget?gl.RGBA16F:gl.RGBA8;
 const supported=gl.getInternalformatParameter(gl.RENDERBUFFER,format,gl.SAMPLES)||[],samples=[...supported].filter(n=>n<=4).sort((a,b)=>b-a)[0]||0;
 const msaa=samples?keep(gl.createFramebuffer(),gl.deleteFramebuffer):null,msaaColor=samples?keep(gl.createRenderbuffer(),gl.deleteRenderbuffer):null,msaaDepth=samples?keep(gl.createRenderbuffer(),gl.deleteRenderbuffer):null;
 gl.bindTexture(gl.TEXTURE_2D,texture);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
 const uniforms=new Map();
 function loc(p,name){let m=uniforms.get(p);if(!m){m=new Map();uniforms.set(p,m);}if(!m.has(name))m.set(name,gl.getUniformLocation(p,name));return m.get(name);}
 function mesh(geometry,instances=null){
  const vao=keep(gl.createVertexArray(),gl.deleteVertexArray);gl.bindVertexArray(vao);
  const attr=(data,location,size,divisor=0)=>{if(!data)return;const b=keep(gl.createBuffer(),gl.deleteBuffer);gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,data instanceof Float32Array?data:new Float32Array(data),gl.STATIC_DRAW);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,0,0);if(divisor)gl.vertexAttribDivisor(location,divisor);};
  attr(geometry.positions,0,3);attr(geometry.normals,1,3);attr(geometry.uvs,2,2);if(instances){attr(instances.a,3,4,1);attr(instances.b,4,4,1);}
  const index=keep(gl.createBuffer(),gl.deleteBuffer),data=geometry.indices.length>65535?new Uint32Array(geometry.indices):new Uint16Array(geometry.indices);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,data,gl.STATIC_DRAW);gl.bindVertexArray(null);
  return{vao,count:data.length,type:data instanceof Uint32Array?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT,instances:instances?instances.a.length/4:1};
 }
 function draw(m){gl.bindVertexArray(m.vao);gl.drawElementsInstanced(gl.TRIANGLES,m.count,m.type,0,m.instances);}
 function resize({width,height,ratio:r=1}){
  const size=sceneResolution({width,height,ratio:r},resolution);W=size.cssWidth;H=size.cssHeight;ratio=size.pixelRatio;
  const w=size.width,h=size.height;if(canvas.width===w&&canvas.height===h)return;
  canvas.width=w;canvas.height=h;gl.bindTexture(gl.TEXTURE_2D,texture);gl.texImage2D(gl.TEXTURE_2D,0,floatTarget?gl.RGBA16F:gl.RGBA,w,h,0,gl.RGBA,floatTarget?gl.HALF_FLOAT:gl.UNSIGNED_BYTE,null);
  gl.bindRenderbuffer(gl.RENDERBUFFER,depth);gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT24,w,h);gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,texture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,depth);
  if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Scene target unavailable');
  if(msaa){gl.bindFramebuffer(gl.FRAMEBUFFER,msaa);gl.bindRenderbuffer(gl.RENDERBUFFER,msaaColor);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,samples,format,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.RENDERBUFFER,msaaColor);gl.bindRenderbuffer(gl.RENDERBUFFER,msaaDepth);gl.renderbufferStorageMultisample(gl.RENDERBUFFER,samples,gl.DEPTH_COMPONENT24,w,h);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,msaaDepth);if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error('Scene sampling unavailable');}
  gl.bindFramebuffer(gl.FRAMEBUFFER,null);
 }
 function begin(){if(dead||gl.isContextLost())return false;gl.bindFramebuffer(gl.FRAMEBUFFER,msaa||fbo);gl.viewport(0,0,canvas.width,canvas.height);gl.depthMask(true);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);return true;}
 function finish(){if(msaa){gl.bindFramebuffer(gl.READ_FRAMEBUFFER,msaa);gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER,fbo);gl.blitFramebuffer(0,0,canvas.width,canvas.height,0,0,canvas.width,canvas.height,gl.COLOR_BUFFER_BIT,gl.NEAREST);}gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.viewport(0,0,canvas.width,canvas.height);gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.CULL_FACE);gl.depthMask(false);gl.useProgram(post);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);gl.uniform1i(loc(post,'uScene'),0);gl.uniform2f(loc(post,'uTexel'),1/canvas.width,1/canvas.height);gl.uniform1f(loc(post,'uBloom'),bloom);gl.uniform1f(loc(post,'uExposure'),exposure);gl.uniform1f(loc(post,'uVignette'),vignette);gl.bindVertexArray(null);gl.drawArrays(gl.TRIANGLES,0,3);}
 return{gl,canvas,keep,program,loc,mesh,draw,resize,begin,finish,get width(){return W;},get height(){return H;},get ratio(){return ratio;},dispose(){if(dead)return;dead=true;for(const f of cleanup.reverse())try{f();}catch{}canvas.remove();gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
