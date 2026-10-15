import{a as H}from"./chunk-chunk-WXTUGFML.js";var w=new URL("../",new URL("themes/theme-audio.mjs",document.baseURI).href),E=o=>o;function T(o){let n=typeof o=="string"?{src:o}:o,a=new URL(E(n.src),w).href;return{...n,src:a,fallback:new URL(E(n.fallback||n.src.replace("audio-library/","audio-library/compatible/").replace(/\.ogg$/,".m4a")),w).href,loop:n.loop!==!1}}function U(o){let n=o.loops.map(T),a=Object.fromEntries(n.map((t,s)=>["layer"+s,t])),e=new H(a,{pause(){document.getElementById("audio")?.pause()}});e.controller=o.title,e.maxOutput=.6;let r=document.createElement("button");r.type="button",r.className="icon-btn glass theme-sound-toggle",r.hidden=!!document.getElementById?.("ambient-theme-sound-toggle"),r.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 10v4h4l5 4V6L8 10H4Z"/><path d="M16 9c1.7 1.5 1.7 4.5 0 6M18.5 6.8c3.5 3 3.5 7.4 0 10.4"/></svg>',document.querySelector(".top-actions")?.insertBefore(r,document.querySelector("#zen-toggle"));let y=!1,g=0,x=-1,d=new Set,p=()=>{r.dataset.enabled=String(e.enabled),r.setAttribute("aria-pressed",String(e.enabled)),r.title=e.enabled?"Выключить "+o.title.toLowerCase():"Включить "+o.title.toLowerCase(),r.setAttribute("aria-label",r.title)};p();let f=()=>{clearTimeout(g);for(let t of d)try{t.stop(),t.disconnect()}catch{}d.clear(),e.stop(),p()};async function b(t,s=0,i=0){let m=e.sequence,v=T({...t,loop:!1});try{let h=await e.load(v);if(y||!e.enabled||m!==e.sequence)return;let c=e.context.createBufferSource(),l=e.context.createGain(),u=e.context.createStereoPanner?.();c.buffer=h,l.gain.value=v.volume??.15,c.connect(l),u?(u.pan.value=i,l.connect(u),u.connect(e.master)):l.connect(e.master),d.add(c),c.onended=()=>{d.delete(c),c.disconnect(),l.disconnect(),u?.disconnect()},c.start(e.context.currentTime+s)}catch{}}let S=()=>{let t=o.oneShots?.[0];!t||!e.enabled||y||(g=setTimeout(()=>{b(t,0,Math.random()*1.2-.6),S()},1e3*(t.minDelay+Math.random()*(t.maxDelay-t.minDelay))))};r.onclick=async()=>{if(e.enabled&&e.context?.state==="suspended"){await e.context.resume();return}if(e.enabled){f();return}await e.toggle()&&(await e.scene(n.map((t,s)=>"layer"+s).join(","),o.title),e.enabled&&S()),p()};let k=t=>{t.detail?.enabled&&t.detail.controller!==e.controller?f():t.detail?.controller===e.controller&&p()},L=t=>{t.target?.tagName==="AUDIO"&&!t.target.paused&&f()};return window.addEventListener("syolana:sceneaudio",k),document.addEventListener("play",L,!0),{setWeather(t){if(!e.enabled)return;let s=[.13+.05*t.wind,.02+.13*t.wind,.15*t.rain];n.forEach((m,v)=>{let h=e.tracks.get(m.src);h&&h.gain.gain.setTargetAtTime(s[v]??m.volume,e.context.currentTime,.65)});let i=t.strike;i?.flash>.05&&i.id!==x&&o.thunder&&(x=i.id,b({...o.thunder,volume:(.16+.18*t.storm)*(1400/i.distance)},Math.max(.05,i.delay-i.age),i.pan))},dispose(){y=!0,f(),window.removeEventListener("syolana:sceneaudio",k),document.removeEventListener("play",L,!0),r.remove(),e.dispose()}}}var M=`
uniform vec3 uSkyForward,uSkyRight,uSkyUp;
uniform float uSkyTanHalfFov;
vec3 skyRay(vec2 uv,float aspect){
  vec2 screen=(uv*2.0-1.0)*vec2(aspect,1.0)*uSkyTanHalfFov;
  return normalize(uSkyForward+uSkyRight*screen.x+uSkyUp*screen.y);
}
`,A=`
float vapourHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
float vapourNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(mix(vapourHash(i),vapourHash(i+vec3(1,0,0)),f.x),mix(vapourHash(i+vec3(0,1,0)),vapourHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(vapourHash(i+vec3(0,0,1)),vapourHash(i+vec3(1,0,1)),f.x),mix(vapourHash(i+vec3(0,1,1)),vapourHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
float vapourFbm(vec3 p){float n=.54*vapourNoise(p);p=p*2.03+vec3(2.7,8.1,4.3);n+=.27*vapourNoise(p);p=p*2.01+vec3(9.3,1.7,6.5);return n+.14*vapourNoise(p);}
vec2 smokeField(vec2 p,float time,float storm){
  vec3 samplePoint=vec3(p*vec2(7.8,18.0)+vec2(time*.022,0),time*.007);
  float grain=vapourFbm(samplePoint),detail=vapourNoise(samplePoint*3.8+grain*2.0);
  p+=vec2(grain-.45,detail-.5)*.038;
  float density=0.0,shade=0.0;
  for(int i=0;i<18;i++){
    float s=float(i)+1.0;
    vec2 center=vec2(sin(s*2.19)*3.08,.14+(sin(s*.91)*.5+.5)*.27);
    center.x+=sin(time*.014+s*.7)*.11;
    center.y+=sin(time*.009+s)*.010;
    vec2 radius=vec2(.18+(sin(s*.47)*.5+.5)*.38,.032+(cos(s*1.31)*.5+.5)*.066);
    radius*=1.0+storm*.48;
    vec2 delta=(p-center)/radius;
    density+=exp(-dot(delta,delta)*1.6)*(.70+.26*sin(s*.73));
    vec2 under=(p-center+vec2(.008,.026))/radius;
    shade+=exp(-dot(under,under)*1.7)*.28;
  }
  float erosion=smoothstep(.20,.70,grain+detail*.17);
  float volume=density*(.40+erosion*.74);
  float lighting=clamp(shade*.56+(.60-grain)*.65+detail*.09,0.0,1.0);
  return vec2(1.0-exp(-volume*(1.45+storm*1.8)),lighting);
}
`;function N(o,n){return Object.fromEntries(["Forward","Right","Up","TanHalfFov"].map(a=>[a,o.getUniformLocation(n,"uSky"+a)]))}function C(o,n,a,e){o.uniform3f(n.Forward,-a[2],-a[6],-a[10]),o.uniform3f(n.Right,a[0],a[4],a[8]),o.uniform3f(n.Up,a[1],a[5],a[9]),o.uniform1f(n.TanHalfFov,Math.tan(e/2))}export{U as a,M as b,A as c,N as d,C as e};
