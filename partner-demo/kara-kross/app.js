(() => {
'use strict';
const root = document.documentElement;
document.querySelectorAll('img[data-b64]').forEach(async img => {
try {
const raw = (await fetch(img.dataset.b64, {cache:'force-cache'}).then(r => r.text())).trim();
if (raw) img.src = 'data:image/webp;base64,' + raw;
} catch (_) {}
});
const body = document.body;
const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d', { alpha: false });
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
let W = 1, H = 1, DPR = 1, t = 0, pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
let worldMode = false;
const palette = ['#f2d0a0','#d99ca7','#b8817b','#f6e4c8'];
const particles = Array.from({length: reduce ? 120 : 420}, () => ({
x:(Math.random()-.5)*28,
y:(Math.random()-.5)*18,
z:Math.random()*34+3,
r:Math.random()*1.5+.25,
c:palette[(Math.random()*palette.length)|0],
s:Math.random()*.018+.004
}));
function resize(){
DPR = Math.min(devicePixelRatio || 1, 1.8);
W = innerWidth; H = innerHeight;
canvas.width = Math.round(W*DPR); canvas.height = Math.round(H*DPR);
canvas.style.width = W+'px'; canvas.style.height = H+'px';
ctx.setTransform(DPR,0,0,DPR,0,0);
}
addEventListener('resize', resize, {passive:true}); resize();
function project(x,y,z, camX, camY){
x -= camX; y -= camY;
const f = Math.min(W,H)*.85;
const zz = z + 4;
return [W*.5 + x/zz*f, H*.52 + y/zz*f, f/zz];
}
function drawGrid(camX,camY){
ctx.save();
ctx.lineWidth=.55;
for(let z=4;z<38;z+=2.2){
const a=project(-22,7.2,z,camX,camY), b=project(22,7.2,z,camX,camY);
ctx.strokeStyle=`rgba(233,190,148,${Math.max(.008,.12-z*.0027)})`;
ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
}
for(let x=-20;x<=20;x+=2.5){
const a=project(x,7.2,4,camX,camY), b=project(x,7.2,38,camX,camY);
ctx.strokeStyle='rgba(233,190,148,.035)';
ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();
}
ctx.restore();
}
function drawRing(cx,cy,z,r,phase,camX,camY){
ctx.beginPath();
for(let i=0;i<=80;i++){
const a=i/80*Math.PI*2;
const wobble=Math.sin(a*3+phase)*.18;
const p=project(cx+Math.cos(a)*(r+wobble),cy+Math.sin(a)*(r*.42),z+Math.sin(a+phase)*.7,camX,camY);
if(i===0)ctx.moveTo(p[0],p[1]); else ctx.lineTo(p[0],p[1]);
}
ctx.strokeStyle='rgba(241,199,153,.115)';ctx.lineWidth=1;ctx.stroke();
}
function render(){
if(!ctx) return;
t += reduce ? 0 : .012;
pointerX += (targetX-pointerX)*.055; pointerY += (targetY-pointerY)*.055;
root.style.setProperty('--mx', pointerX.toFixed(3));
root.style.setProperty('--my', pointerY.toFixed(3));
const scroll = scrollY / Math.max(1, document.body.scrollHeight-innerHeight);
root.style.setProperty('--scroll', scroll.toFixed(4));
const g=ctx.createLinearGradient(0,0,0,H);
g.addColorStop(0,'#1a1015');g.addColorStop(.55,'#0d090c');g.addColorStop(1,'#070607');
ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
const rg=ctx.createRadialGradient(W*(.72+pointerX*.035),H*.22,0,W*.72,H*.22,Math.max(W,H)*.75);
rg.addColorStop(0,'rgba(188,112,98,.19)');rg.addColorStop(.36,'rgba(105,55,62,.09)');rg.addColorStop(1,'rgba(0,0,0,0)');
ctx.fillStyle=rg;ctx.fillRect(0,0,W,H);
const camX = pointerX*1.7 + Math.sin(t*.18)*.42;
const camY = pointerY*1.05 + Math.cos(t*.15)*.2;
drawGrid(camX,camY);
drawRing(5,-1,11,6.2,t*.7,camX,camY);
drawRing(-6,1.8,18,7.8,-t*.45,camX,camY);
for(const p of particles){
if(!reduce){ p.z -= p.s*(worldMode?3.5:1.15); if(p.z<2.2)p.z=36; }
const q=project(p.x,p.y,p.z,camX,camY);
if(q[0]<-20||q[0]>W+20||q[1]<-20||q[1]>H+20) continue;
const a=Math.min(.52,.08+q[2]*.0075);
ctx.globalAlpha=a;ctx.fillStyle=p.c;
ctx.beginPath();ctx.arc(q[0],q[1],Math.min(3.2,p.r*q[2]*.018+.2),0,Math.PI*2);ctx.fill();
}
ctx.globalAlpha=1;
requestAnimationFrame(render);
}
requestAnimationFrame(render);
function point(clientX,clientY){
targetX = (clientX/W-.5)*2;
targetY = (clientY/H-.5)*2;
}
addEventListener('pointermove',e=>point(e.clientX,e.clientY),{passive:true});
addEventListener('touchmove',e=>{const x=e.touches[0]; if(x)point(x.clientX,x.clientY)}, {passive:true});
addEventListener('deviceorientation',e=>{
if(e.gamma==null||e.beta==null) return;
targetX=Math.max(-1,Math.min(1,e.gamma/28));
targetY=Math.max(-1,Math.min(1,(e.beta-45)/32));
},{passive:true});
const io = new IntersectionObserver(entries=>entries.forEach(e=>{
if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}
}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
document.querySelectorAll('[data-tilt]').forEach(el=>{
el.addEventListener('pointermove',e=>{
if(reduce) return;
const r=el.getBoundingClientRect(), x=(e.clientX-r.left)/r.width-.5, y=(e.clientY-r.top)/r.height-.5;
el.style.transform=`perspective(1200px) rotateX(${-y*5}deg) rotateY(${x*6}deg) translateY(-2px)`;
});
el.addEventListener('pointerleave',()=>el.style.transform='');
});
const worldToggle=document.getElementById('worldToggle');
const focusBtn=document.getElementById('focusBtn');
const exitWorld=document.getElementById('exitWorld');
function setWorld(on){
worldMode=on;body.classList.toggle('world-only',on);worldToggle.setAttribute('aria-pressed',String(on));
}
worldToggle.addEventListener('click',()=>setWorld(!worldMode));
focusBtn.addEventListener('click',()=>setWorld(true));
exitWorld.addEventListener('click',()=>setWorld(false));
addEventListener('keydown',e=>{if(e.key==='Escape')setWorld(false)});
})();