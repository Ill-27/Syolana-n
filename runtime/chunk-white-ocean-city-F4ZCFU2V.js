import{a as ee}from"./chunk-chunk-UJKH6CY5.js";import{a as oe,b as te,c as re,d as ae,e as ne}from"./chunk-chunk-L2G2CYMI.js";import"./chunk-chunk-J3N7O54F.js";import"./chunk-chunk-AM55BNCL.js";import{a as J}from"./chunk-chunk-424P3C67.js";var U=Math.PI*2,je=new URL(new URL("themes/white-ocean-city.js",document.baseURI).href).origin,T=o=>new URL("../"+o,new URL("themes/white-ocean-city.js",document.baseURI).href).href;function se(o=73421){let r=o>>>0;return()=>(r=r*1664525+1013904223>>>0,r/4294967296)}function ie(o,r,a){let t=o.createShader(r);if(o.shaderSource(t,a),o.compileShader(t),!o.getShaderParameter(t,o.COMPILE_STATUS)){let f=o.getShaderInfoLog(t)||"Shader compilation failed";throw o.deleteShader(t),new Error(f)}return t}function V(o,r,a){let t=o.createProgram(),f=ie(o,o.VERTEX_SHADER,r),l=ie(o,o.FRAGMENT_SHADER,a);if(o.attachShader(t,f),o.attachShader(t,l),o.linkProgram(t),o.deleteShader(f),o.deleteShader(l),!o.getProgramParameter(t,o.LINK_STATUS)){let e=o.getProgramInfoLog(t)||"Program link failed";throw o.deleteProgram(t),new Error(e)}return t}function ge(o,r,a,t,f){let l=1/Math.tan(r/2);if(o.fill(0),o[0]=l/a,o[5]=l,o[11]=-1,o[15]=0,f!==1/0){let e=1/(t-f);o[10]=(f+t)*e,o[14]=2*f*t*e}else o[10]=-1,o[14]=-2*t;return o}function xe(o,r,a,t){let f,l,e,s,n,i,c,d,u,v;return c=r[0]-a[0],d=r[1]-a[1],u=r[2]-a[2],v=Math.hypot(c,d,u)||1,c/=v,d/=v,u/=v,f=t[1]*u-t[2]*d,l=t[2]*c-t[0]*u,e=t[0]*d-t[1]*c,v=Math.hypot(f,l,e)||1,f/=v,l/=v,e/=v,s=d*e-u*l,n=u*f-c*e,i=c*l-d*f,o[0]=f,o[1]=s,o[2]=c,o[3]=0,o[4]=l,o[5]=n,o[6]=d,o[7]=0,o[8]=e,o[9]=i,o[10]=u,o[11]=0,o[12]=-(f*r[0]+l*r[1]+e*r[2]),o[13]=-(s*r[0]+n*r[1]+i*r[2]),o[14]=-(c*r[0]+d*r[1]+u*r[2]),o[15]=1,o}function we(o,r,a){let t=new Float32Array(16);for(let f=0;f<4;f++)for(let l=0;l<4;l++)t[f*4+l]=r[l]*a[f*4]+r[4+l]*a[f*4+1]+r[8+l]*a[f*4+2]+r[12+l]*a[f*4+3];return o.set(t),o}var Te=`#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main(){
  vUv = aPosition * .5 + .5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`,Se=`#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform float uTime;
uniform float uAspect;
uniform float uZen;

${te}
${re}
void main(){
  vec3 rd=skyRay(vUv,uAspect);
  float h=max(0.0,rd.y);
  vec3 zenith=vec3(.17,.32,.41),upper=vec3(.39,.57,.66),haze=vec3(.83,.88,.86);
  vec3 dawn=vec3(.98,.82,.64);
  vec3 col=mix(haze,mix(upper,zenith,smoothstep(.12,.70,h)),1.0-exp(-h*3.0));
  vec3 sunDir=normalize(vec3(.36,.09,-1.0));
  float sunDot=max(dot(rd,sunDir),0.0);
  col+=dawn*pow(sunDot,96.0)*.24;
  vec2 vapour=smokeField(vec2(atan(rd.x,-rd.z),rd.y),uTime,0.0);
  vec3 cloud=mix(vec3(.95,.94,.90),vec3(.50,.62,.67),vapour.y*.74);
  col=mix(col,cloud,vapour.x*smoothstep(.012,.09,h)*.78);
  col=mix(col,haze,exp(-h*29.0)*(.38+.05*uZen));
  col=mix(haze,col,smoothstep(0.0,.009,h));
  outColor=vec4(col,1.0);
}`,Pe=`#version 300 es
layout(location=0) in vec3 aPosition;
layout(location=1) in vec3 aNormal;
layout(location=2) in vec3 iOffset;
layout(location=3) in vec3 iScale;
layout(location=4) in float iTone;
layout(location=5) in float iShape;
uniform mat4 uViewProj;
uniform vec3 uCamera;
uniform float uTravel;
uniform float uSpan;
out vec3 vNormal;
out vec3 vWorld;
out float vTone;
out float vShape;
out float vDistance;
out vec3 vLocal;
void main(){
  float z=mod(iOffset.z+uTravel,uSpan)-uSpan;
  vec3 local=aPosition;
  float y01=clamp(local.y+.5,0.0,1.0);
  if(iShape>0.5){
    // One uninterrupted pyramid-like peak. Shape 0 stays a clean architectural cut.
    float taper=mix(1.0,.018,smoothstep(.34,1.0,y01));
    local.xz*=taper;
  }
  vec3 world=vec3(iOffset.x,iOffset.y,z)+local*iScale;
  vWorld=world;
  vNormal=normalize(aNormal+vec3(0.0,(abs(aNormal.x)*iScale.x+abs(aNormal.z)*iScale.z)*.491/iScale.y*iShape,0.0));
  vTone=iTone;vShape=iShape;vDistance=distance(world,uCamera);vLocal=local;
  gl_Position=uViewProj*vec4(world,1.0);
}`,Re=`#version 300 es
precision highp float;
in vec3 vNormal;
in vec3 vWorld;
in float vTone;
in float vShape;
in float vDistance;
in vec3 vLocal;
out vec4 outColor;
uniform float uTime;
uniform float uZen;
float stoneNoise(vec3 p){return sin(p.x*.73+p.z*.31)*sin(p.y*.91-p.z*.17);}
void main(){
  vec3 n=normalize(vNormal),key=normalize(vec3(-.48,.80,.32)),warm=normalize(vec3(.70,.24,.18));
  float diff=max(dot(n,key),0.0),rim=pow(1.0-max(dot(n,normalize(vec3(.1,.45,.89))),0.0),2.2),up=max(n.y,0.0);
  vec3 base=mix(vec3(.68,.76,.77),vec3(.965,.955,.915),.57+.33*vTone);
  base*=.48+.54*diff+.13*up;
  base+=vec3(.13,.075,.035)*max(0.0,dot(n,warm))*.52+vec3(.055,.075,.078)*rim*.34;
  base*=1.0-.045*(.5+.5*stoneNoise(vWorld*.16))*(1.0-vTone);
  float fog=smoothstep(92.0,315.0,vDistance);
  base=mix(base,vec3(.72,.80,.81),fog*.94);
  base*=mix(.89,1.0,uZen);
  outColor=vec4(base,1.0);
}`,Le=`#version 300 es
layout(location=0) in vec2 aPosition;
uniform mat4 uViewProj;
uniform float uTime;
out vec3 vWorld;
out float vWave;
void main(){
  float x=aPosition.x,z=aPosition.y;
  float w1=sin(x*.073+z*.029+uTime*.42),w2=sin(x*.031-z*.061-uTime*.27),w3=sin((x+z)*.145+uTime*.19),w4=sin(x*.19-z*.113+uTime*.31);
  float y=-.46+w1*.18+w2*.12+w3*.055+w4*.028;
  vWave=y;vWorld=vec3(x,y,z);gl_Position=uViewProj*vec4(vWorld,1.0);
}`,Ce=`#version 300 es
precision highp float;
in vec3 vWorld;
in float vWave;
out vec4 outColor;
uniform vec3 uCamera;
uniform float uTime;
uniform float uZen;
void main(){
  vec3 dx=dFdx(vWorld),dy=dFdy(vWorld),n=normalize(cross(dx,dy));if(n.y<0.0)n=-n;
  vec3 viewDir=normalize(uCamera-vWorld),sunDir=normalize(vec3(-.52,.82,.27));
  float fres=pow(1.0-max(dot(n,viewDir),0.0),3.4),diffuse=max(dot(n,sunDir),0.0);
  float spec=max(dot(reflect(-sunDir,n),viewDir),0.0),glint=pow(spec,92.0),ribbon=pow(spec,16.0);
  vec3 col=mix(vec3(.075,.22,.28),vec3(.22,.43,.47),.28+.24*diffuse);
  col=mix(col,vec3(.63,.75,.77),.28+.52*fres);
  col+=vec3(.92,.73,.48)*glint*.72+vec3(.34,.31,.24)*ribbon*.11;
  col+=vec3(.05,.09,.10)*(.5+.5*sin(vWorld.x*.62+sin(vWorld.z*.27+uTime*.8)))*.08;
  float fog=smoothstep(105.0,380.0,distance(vWorld,uCamera));
  col*=mix(.94,1.0,uZen);
  col=mix(col,vec3(.83,.88,.86),fog);
  outColor=vec4(col,1.0);
}`,Fe=`#version 300 es
layout(location=0) in vec2 aPosition;
layout(location=1) in vec2 iCenter;
layout(location=2) in vec2 iSize;
layout(location=3) in float iPhase;
uniform mat4 uViewProj;
uniform float uTravel;
uniform float uSpan;
uniform float uTime;
out vec2 vLocal;
out float vPhase;
out float vDistance;
void main(){
  float z=mod(iCenter.y+uTravel,uSpan)-uSpan;
  float pulse=1.0+.055*sin(uTime*1.55+iPhase);
  vec2 local=aPosition;
  vec2 footprint=local*iSize*pulse;
  float ripple=sin((footprint.x+footprint.y)*.58-uTime*2.3+iPhase)*.026;
  vec3 world=vec3(iCenter.x+footprint.x,-.22+ripple,z+footprint.y);
  vLocal=local;
  vPhase=iPhase;
  vDistance=length(world.xz);
  gl_Position=uViewProj*vec4(world,1.0);
}`,ze=`#version 300 es
precision highp float;
in vec2 vLocal;
in float vPhase;
in float vDistance;
out vec4 outColor;
uniform float uTime;
void main(){
  vec2 q=abs(vLocal);
  float edge=pow(pow(q.x,6.0)+pow(q.y,6.0),1.0/6.0);
  float inner=smoothstep(.57,.70,edge);
  float outer=1.0-smoothstep(.84,1.0,edge);
  float ring=inner*outer;
  float broken=.55+.45*sin((vLocal.x*13.0+vLocal.y*17.0)+uTime*3.1+vPhase);
  float crest=.60+.40*sin(edge*28.0-uTime*4.2+vPhase*1.7);
  float alpha=ring*(.13+.29*broken*crest);
  alpha*=1.0-smoothstep(250.0,440.0,vDistance);
  vec3 col=mix(vec3(.72,.86,.87),vec3(.98,.99,.96),.55+.45*crest);
  outColor=vec4(col,alpha);
}`;function _e(){let o=[.5,-.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,-.5,.5,.5,.5,.5,-.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,-.5,-.5,-.5,.5,-.5,.5,-.5,-.5,-.5,-.5,-.5,.5,-.5,-.5,.5,.5,.5,.5,.5,-.5,.5,-.5,.5,.5,.5,.5,.5,-.5,-.5,-.5,.5,-.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,-.5,.5,-.5,.5,.5,-.5,.5,.5,.5,.5,-.5,.5,.5,.5,-.5,.5,-.5,.5,.5,-.5,-.5,.5,-.5,-.5,-.5,-.5,.5,-.5,.5,.5,-.5,-.5,-.5,-.5,.5,.5,-.5,.5,-.5,-.5],r=[];return[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]].forEach(a=>{for(let t=0;t<6;t++)r.push(...a)}),{positions:new Float32Array(o),normals:new Float32Array(r)}}function Ee(){let o=se(90317),r=540,a=[],t=(e,s,n,i,c,d,u=.6,v=0)=>a.push(e,s,n,i,c,d,u,v),f=(e,s,n,i,c,d,u=!1)=>{t(e,i*.5+.08,s,n,i,c,d,u?1:0)},l=(e,s,n,i)=>{for(let c=0;c<3;c++)t(e+n*c*2.35,3.5,s,1,7,1,i,0)};for(let e=12,s=0;e<r;e+=13.8,s++){for(let n of[-1,1]){let i=n*(25+o()*23),c=4.8+o()*8.6,d=5.8+o()*10.6,u=11+o()*39,v=.4+o()*.56;f(i,e+o()*5,c,u,d,v,o()>.5),o()>.48&&t(i,u*.08,e+d*.24,c*(1.04+o()*.34),1.25+o()*1.25,d*(1+o()*.28),Math.min(1,v+.05),0),o()>.63&&f(i+n*(c*.75+2.2+o()*3),e+1+o()*5,1.3+o()*2.4,9+o()*22,1.4+o()*2.9,.68+o()*.25,!0),o()>.79&&l(i+n*(c*.63+2.1),e-2+o()*5,n,.77)}for(let n of[-1,1])if(o()>.16){let i=n*(57+o()*54);f(i,e+o()*10,6+o()*14,19+o()*60,7+o()*15,.28+o()*.44,o()>.46)}}for(let e=90;e<r;e+=138){let s=Math.floor(e/138)%2?-1:1;f(s*38,e,11,64,11,.91,!0),f(s*38,e,6.2,82,6.2,.97,!0);for(let n=-2;n<=2;n++)t(s*38+n*3,2.8,e+10,1.05,5.6,1.05,.82,0)}return{span:r,data:new Float32Array(a),count:a.length/8}}function De(o){let r=o.data,a=[];for(let t=0;t<r.length;t+=8){let f=r[t],l=r[t+1],e=r[t+2],s=r[t+3],n=r[t+4],i=r[t+5];if(l-n*.5>.72||n<5.2||s<1.15||i<1.15)continue;let d=t/8*1.61803398875%6.28318;a.push(f,e,s*.64+2,i*.64+2,d)}return{data:new Float32Array(a),count:a.length/5}}function Ue(o=96,r=116){let a=[],t=[];for(let e=0;e<=r;e++){let s=e/r,n=34+-1934*Math.pow(s,1.65),i=190+(34-n)*1.9;for(let c=0;c<=o;c++){let d=c/o;a.push(-i+i*2*d,n)}}for(let e=0;e<r;e++)for(let s=0;s<o;s++){let n=e*(o+1)+s,i=n+1,c=(e+1)*(o+1)+s,d=c+1;t.push(n,c,i,i,c,d)}return{vertices:new Float32Array(a),indices:new Uint32Array(t)}}function Be(o,r,a,t,f){if(!(!o||!a||!t)){o.save(),o.lineCap="round",o.strokeStyle="rgba(248,250,247,.72)";for(let l=0;l<(f?7:4);l++){let e=(r*.17+l*.41)%1,s=a*(.18+l%3*.28+(e-.5)*.06),n=t*(.68-e*.43),i=5-e*2.8;o.lineWidth=1.1,o.beginPath(),o.moveTo(s-i,n),o.quadraticCurveTo(s-i*.45,n-i*.62,s,n),o.quadraticCurveTo(s+i*.45,n-i*.62,s+i,n),o.stroke()}o.restore()}}function ke(){let o=[];for(let r=0;r<14;r++){let a=document.createElement("canvas");a.width=128,a.height=72;let t=a.getContext("2d"),f=Math.sin(r/14*U),l=64,e=36,s=8+f*6.5;t.translate(l,e),t.shadowColor="rgba(195,220,222,.38)",t.shadowBlur=7;let n=t.createLinearGradient(0,-18,0,18);n.addColorStop(0,"#ffffff"),n.addColorStop(.5,"#edf4f2"),n.addColorStop(1,"#b9cbcc"),t.fillStyle=n,t.strokeStyle="rgba(154,176,178,.34)",t.lineWidth=.9,t.beginPath(),t.moveTo(-2,-1),t.bezierCurveTo(-15,-7,-27,-s,-45,-12-s*.24),t.bezierCurveTo(-32,3,-18,11,-2,5),t.closePath(),t.fill(),t.stroke(),t.beginPath(),t.moveTo(2,-1),t.bezierCurveTo(15,-7,27,-s,45,-12-s*.24),t.bezierCurveTo(32,3,18,11,2,5),t.closePath(),t.fill(),t.stroke(),t.shadowBlur=4;let i=t.createLinearGradient(0,-8,0,10);i.addColorStop(0,"#ffffff"),i.addColorStop(.6,"#eef4f2"),i.addColorStop(1,"#afc2c4"),t.fillStyle=i,t.beginPath(),t.ellipse(0,3,6.7,15.5,0,0,U),t.fill(),t.fillStyle="#fbfdfc",t.beginPath(),t.ellipse(0,-9.5,4.7,6,0,0,U),t.fill(),t.fillStyle="#d6e3e2",t.beginPath(),t.moveTo(-5,13),t.lineTo(-11,22),t.lineTo(-1,17),t.closePath(),t.fill(),t.beginPath(),t.moveTo(5,13),t.lineTo(11,22),t.lineTo(1,17),t.closePath(),t.fill(),t.globalAlpha=.72,t.fillStyle="#ffffff",t.beginPath(),t.ellipse(-2,-4,2.1,8,-.15,0,U),t.fill(),o.push(a)}return o}function Ve(){let o=se(41027),r=ke(),a=[],t=.55,f=(l,e)=>{let n=(o()<.5?-1:1)<0?.12+o()*.26:.62+o()*.26,i=.56+o()*.16,c=.47+(o()-.5)*.055,d=.27+o()*.075;a.push({born:l,duration:(e?2.85:3.25)+o()*1.05,sx:n,sy:i,ex:c,ey:d,size:18+o()*7,bank:(o()-.5)*.055,phase:o()*U,curve:(o()-.5)*.035}),t=l+(e?2.1:2.8)+o()*(e?2.1:2.8)};return{draw(l,e,s,n,i){if(!(!l||!s||!n)){e>=t&&a.length===0&&f(e,i);for(let c=a.length-1;c>=0;c--){let d=a[c],u=(e-d.born)/d.duration;if(u<0)continue;if(u>=1){a.splice(c,1);continue}let v=1-Math.pow(1-u,1.62),g=Math.sin(u*Math.PI),S=(d.sx+(d.ex-d.sx)*v+g*d.curve)*s,F=(d.sy+(d.ey-d.sy)*v-g*.018)*n,A=Math.max(.07,1-v),B=.2+A*1.02,P=d.size*B*(i?1.03:1),M=(Math.floor(e*19+d.phase*2.1)%r.length+r.length)%r.length,I=Math.min(1,u/.08),R=Math.min(1,(1-u)/.16),z=Math.min(I,R)*(.72+.24*A);l.save(),l.translate(S,F),l.rotate(d.bank+(d.ex-d.sx)*.035),l.globalAlpha=z,l.drawImage(r[M],-P*1.25,-P*.7,P*2.5,P*1.4),l.restore()}}}}}function Y(o){return{resize(){},draw({time:r,width:a,height:t,camera:f}){let l=!!f,e=o.createLinearGradient(0,0,0,t);e.addColorStop(0,"#718b9a"),e.addColorStop(.42,"#c6d0d0"),e.addColorStop(.58,"#b4c4c6"),e.addColorStop(1,"#1f3540"),o.fillStyle=e,o.fillRect(0,0,a,t);let s=t*.56;o.fillStyle="rgba(238,240,235,.82)";for(let i=0;i<28;i++){let c=i%2?-1:1,d=(i*47+r*(l?26:6))%900/900,u=.12+d*1.25,v=22*u,g=(60+i%7*18)*u,S=a*.5+c*(75+d*a*.58);o.fillRect(S-v*.5,s-g,v,g)}let n=o.createLinearGradient(0,s,0,t);n.addColorStop(0,"rgba(138,164,168,.78)"),n.addColorStop(1,"rgba(22,48,59,.96)"),o.fillStyle=n,o.fillRect(0,s,a,t-s),Be(o,r,a,t,l)},dispose(){}}}var le={title:"Звучание Белого города",loops:[{src:T("audio-library/nature/ocean_waves.ogg"),volume:.24},{src:T("audio-library/nature/wind_soft.ogg"),fallback:T("audio-library/compatible/nature/wind_soft.m4a"),volume:.14},{src:T("audio-library/ambience/night_air.ogg"),fallback:T("audio-library/compatible/ambience/night_air.m4a"),volume:.08}],oneShots:[{src:T("audio-library/nature/bird_wings_flutter.ogg"),fallback:T("audio-library/compatible/nature/bird_wings_flutter.m4a"),volume:.17,minDelay:11,maxDelay:27}]};function Me(){return oe(le)}function Ie(o){let r=o?.canvas;if(!r||!document.body)return Y(o);let a=document.createElement("canvas");a.className="theme-world-canvas white-ocean-world",a.setAttribute("aria-hidden","true"),Object.assign(a.style,{position:"fixed",inset:"0",width:"100%",height:"100%",zIndex:"-2",pointerEvents:"none",display:"block",transform:"translateZ(0)",backfaceVisibility:"hidden",willChange:"transform"}),r.parentNode?.insertBefore(a,r);let t=document.createElement("style");t.textContent='html[data-theme="white-ocean-city"] .aurora-layer{animation:none!important;opacity:0!important}html[data-theme="white-ocean-city"] .flight-hint{opacity:.72;color:#e4efed}html[data-theme="white-ocean-city"] .theme-sound-toggle svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}html[data-theme="white-ocean-city"] .theme-sound-toggle svg path:first-child{fill:currentColor;stroke:none}html[data-theme="white-ocean-city"] .theme-sound-toggle[data-enabled="true"]{color:#f1fbfa;box-shadow:0 0 0 1px #d9eeee55,0 0 28px #bde5e533}html[data-theme="white-ocean-city"] .flight-planet{color:#f5fbfa}html[data-theme="white-ocean-city"] .planet-orb{background:radial-gradient(circle at 32% 26%,rgba(245,252,250,.56),rgba(106,145,150,.26) 44%,rgba(20,38,45,.52) 82%);border-color:rgba(222,242,239,.48)}',document.head.append(t);let f=Me(),l=o.fillText,e=a.getContext("webgl2",{alpha:!1,antialias:!0,depth:!0,stencil:!1,powerPreference:"high-performance",preserveDrawingBuffer:!1});if(!e){a.remove();let m=Y(o),b=m.dispose;return m.dispose=()=>{b?.(),t.remove(),f.dispose(),o.fillText=l},m}let s,n,i,c;try{s=V(e,Te,Se),n=V(e,Pe,Re),i=V(e,Le,Ce),c=V(e,Fe,ze)}catch(m){console.warn("White Ocean City WebGL unavailable",m),a.remove();let b=Y(o),h=b.dispose;return b.dispose=()=>{h?.(),t.remove(),f.dispose(),o.fillText=l},b}let d=[],u=m=>(m&&d.push(m),m),v=u(e.createVertexArray()),g=u(e.createBuffer());e.bindVertexArray(v),e.bindBuffer(e.ARRAY_BUFFER,g),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,3,-1,-1,3]),e.STATIC_DRAW);let S=e.getAttribLocation(s,"aPosition");e.enableVertexAttribArray(S),e.vertexAttribPointer(S,2,e.FLOAT,!1,0,0);let F=_e(),A=Ee(),B=u(e.createVertexArray());e.bindVertexArray(B);let P=u(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,P),e.bufferData(e.ARRAY_BUFFER,F.positions,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,3,e.FLOAT,!1,0,0);let M=u(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,M),e.bufferData(e.ARRAY_BUFFER,F.normals,e.STATIC_DRAW),e.enableVertexAttribArray(1),e.vertexAttribPointer(1,3,e.FLOAT,!1,0,0);let I=u(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,I),e.bufferData(e.ARRAY_BUFFER,A.data,e.STATIC_DRAW);let R=32;e.enableVertexAttribArray(2),e.vertexAttribPointer(2,3,e.FLOAT,!1,R,0),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,3,e.FLOAT,!1,R,12),e.vertexAttribDivisor(3,1),e.enableVertexAttribArray(4),e.vertexAttribPointer(4,1,e.FLOAT,!1,R,24),e.vertexAttribDivisor(4,1),e.enableVertexAttribArray(5),e.vertexAttribPointer(5,1,e.FLOAT,!1,R,28),e.vertexAttribDivisor(5,1);let z=De(A),G=u(e.createVertexArray());e.bindVertexArray(G);let ce=u(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,ce),e.bufferData(e.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,1,1,-1,-1,1,1,-1,1]),e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let fe=u(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,fe),e.bufferData(e.ARRAY_BUFFER,z.data,e.STATIC_DRAW);let N=20;e.enableVertexAttribArray(1),e.vertexAttribPointer(1,2,e.FLOAT,!1,N,0),e.vertexAttribDivisor(1,1),e.enableVertexAttribArray(2),e.vertexAttribPointer(2,2,e.FLOAT,!1,N,8),e.vertexAttribDivisor(2,1),e.enableVertexAttribArray(3),e.vertexAttribPointer(3,1,e.FLOAT,!1,N,16),e.vertexAttribDivisor(3,1);let W=Ue(),j=u(e.createVertexArray());e.bindVertexArray(j);let de=u(e.createBuffer());e.bindBuffer(e.ARRAY_BUFFER,de),e.bufferData(e.ARRAY_BUFFER,W.vertices,e.STATIC_DRAW),e.enableVertexAttribArray(0),e.vertexAttribPointer(0,2,e.FLOAT,!1,0,0);let ue=u(e.createBuffer());e.bindBuffer(e.ELEMENT_ARRAY_BUFFER,ue),e.bufferData(e.ELEMENT_ARRAY_BUFFER,W.indices,e.STATIC_DRAW),e.bindVertexArray(null);let Z=new Float32Array(16),O=new Float32Array(16),k=new Float32Array(16),L=1,_=1,me=1,H=!1,ve=Ve(),E=document.querySelector(".flight-hint"),pe=E?.textContent||"";E&&(E.textContent="Перемещайтесь в пространстве с помощью мыши или жестов");let p={sky:{time:e.getUniformLocation(s,"uTime"),aspect:e.getUniformLocation(s,"uAspect"),zen:e.getUniformLocation(s,"uZen")},city:{vp:e.getUniformLocation(n,"uViewProj"),camera:e.getUniformLocation(n,"uCamera"),travel:e.getUniformLocation(n,"uTravel"),span:e.getUniformLocation(n,"uSpan"),time:e.getUniformLocation(n,"uTime"),zen:e.getUniformLocation(n,"uZen")},ocean:{vp:e.getUniformLocation(i,"uViewProj"),camera:e.getUniformLocation(i,"uCamera"),time:e.getUniformLocation(i,"uTime"),zen:e.getUniformLocation(i,"uZen")},foam:{vp:e.getUniformLocation(c,"uViewProj"),travel:e.getUniformLocation(c,"uTravel"),span:e.getUniformLocation(c,"uSpan"),time:e.getUniformLocation(c,"uTime")}},be=ae(e,s);function q({width:m,height:b,ratio:h=1}){L=Math.max(1,m),_=Math.max(1,b);let x=L<=760,y=J({width:L,height:_,ratio:h});me=y.pixelRatio;let C=y.width,D=y.height;(a.width!==C||a.height!==D)&&(a.width=C,a.height=D,e.viewport(0,0,C,D))}let he=ee({rest:.4,flight:2.45,xLimit:1.45,yLimit:1});function ye(m,b){let h=!!b,x=he.step(m,b),{x:y,y:C,z:D}=x.input,K=x.travel+D*24,X=Math.sin(m*.043)*2.8+Math.sin(m*.017+1.4)*1.3+y*10.2,Q=9.4+C*7.2+Math.sin(m*.041)*.52,w=[X,Q,14.5],Ae=[X+y*1.35+Math.sin(m*.028)*1.7,Q-4.35+C*.58+Math.sin(m*.023)*.4,-55],$=h?.91:1;ge(Z,$,L/_,.12,1800),xe(O,w,Ae,[0,1,0]),we(k,Z,O),e.disable(e.BLEND),e.disable(e.CULL_FACE),e.disable(e.DEPTH_TEST),e.useProgram(s),e.bindVertexArray(v),e.uniform1f(p.sky.time,m),e.uniform1f(p.sky.aspect,L/_),e.uniform1f(p.sky.zen,h?1:0),ne(e,be,O,$),e.drawArrays(e.TRIANGLES,0,3),e.enable(e.DEPTH_TEST),e.depthFunc(e.LEQUAL),e.clearDepth(1),e.clear(e.DEPTH_BUFFER_BIT),e.useProgram(i),e.bindVertexArray(j),e.uniformMatrix4fv(p.ocean.vp,!1,k),e.uniform3f(p.ocean.camera,w[0],w[1],w[2]),e.uniform1f(p.ocean.time,m),e.uniform1f(p.ocean.zen,h?1:0),e.drawElements(e.TRIANGLES,W.indices.length,e.UNSIGNED_INT,0),z.count&&(e.enable(e.BLEND),e.blendFunc(e.SRC_ALPHA,e.ONE_MINUS_SRC_ALPHA),e.depthMask(!1),e.useProgram(c),e.bindVertexArray(G),e.uniformMatrix4fv(p.foam.vp,!1,k),e.uniform1f(p.foam.travel,K),e.uniform1f(p.foam.span,A.span),e.uniform1f(p.foam.time,m),e.drawArraysInstanced(e.TRIANGLES,0,6,z.count),e.depthMask(!0),e.disable(e.BLEND)),e.enable(e.CULL_FACE),e.cullFace(e.BACK),e.useProgram(n),e.bindVertexArray(B),e.uniformMatrix4fv(p.city.vp,!1,k),e.uniform3f(p.city.camera,w[0],w[1],w[2]),e.uniform1f(p.city.travel,K),e.uniform1f(p.city.span,A.span),e.uniform1f(p.city.time,m),e.uniform1f(p.city.zen,h?1:0),e.drawArraysInstanced(e.TRIANGLES,0,F.positions.length/3,A.count),e.disable(e.CULL_FACE),e.bindVertexArray(null)}return{canvas:a,resize:q,draw({time:m,width:b,height:h,camera:x}){if(!H&&((b!==L||h!==_)&&q({width:b,height:h,ratio:window.devicePixelRatio||1}),ye(m,x),ve.draw(o,m,b,h,!!x),!x)){let y=o.createLinearGradient(0,0,0,h);y.addColorStop(0,"rgba(6,14,19,.11)"),y.addColorStop(.48,"rgba(5,13,18,.20)"),y.addColorStop(1,"rgba(3,9,13,.48)"),o.fillStyle=y,o.fillRect(0,0,b,h)}},dispose(){H=!0,a.remove(),t.remove(),f.dispose(),o.fillText=l,E&&(E.textContent=pe);try{e.deleteProgram(s),e.deleteProgram(n),e.deleteProgram(i),e.deleteProgram(c);for(let m of d)typeof WebGLVertexArrayObject<"u"&&m instanceof WebGLVertexArrayObject?e.deleteVertexArray(m):e.deleteBuffer(m);e.getExtension("WEBGL_lose_context")?.loseContext()}catch{}}}}var Ze={id:"white-ocean-city",renderer:"webgl-city",particles:!1,marks:!0,flightCards:!0,autoFlightCards:!0,continuousDepth:!0,flightBounds:{x:1.45,y:1},accent:"#dce9e8",dim:"#c7d3d3",surface:"17,28,33",panel:{bg:"rgba(22,41,48,.52)",border:"rgba(211,236,233,.27)",glow:"rgba(160,211,211,.17)",text:"#f4fbfa",muted:"#c7d7d5"},radius:"26px",buttonRadius:"26px",heading:'"Cormorant Garamond", Georgia, serif',body:'"Nunito", system-ui, sans-serif',colors:["#eef4f2","#d8e6e5","#b7ced0","#f4e9da"],backgrounds:["radial-gradient(ellipse at 76% 18%,rgba(235,197,153,.34),transparent 45%),radial-gradient(ellipse at 30% 8%,rgba(109,143,160,.30),transparent 58%)","radial-gradient(ellipse at 60% 35%,rgba(190,211,211,.16),transparent 55%)","linear-gradient(to bottom,rgba(67,91,103,.18),rgba(12,24,30,.42))"],soundscape:le,createRenderer:Ie};export{Ze as default};
