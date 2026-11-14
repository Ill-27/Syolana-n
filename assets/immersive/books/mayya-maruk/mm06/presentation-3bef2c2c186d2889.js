(()=>{
/* Stable book identity, validated portable bookmarks, and upgrade migration. */
class SyolanaReadingStore {
 constructor(storage,book){this.storage=storage;this.book=book;this.key='syolana:book:'+book.id+':v1';this.available=true;this.record=null;}
 read(key){try{return JSON.parse(this.storage?.getItem(key)||'null');}catch{return null;}}
 locate(place){if(!place||typeof place!=='object')return null;const anchors=this.book.anchors;let paragraph=typeof place.anchor==='string'?anchors.indexOf(place.anchor):-1;if(paragraph<0&&Number.isInteger(place.paragraph))paragraph=place.paragraph;if(paragraph<0||paragraph>=anchors.length)return null;return{paragraph,anchor:anchors[paragraph],fraction:Math.max(0,Math.min(1,Number(place.fraction)||0))};}
 load(){let r=this.read(this.key);if(!r||r.bookId!==this.book.id){r=null;for(const key of ['syolana-maruk-immersive-mm04','syolana-maruk-immersive-mm03','syolana-maruk-immersive-mm02','syolana-maruk-immersive-mm01']){const old=this.read(key);if(old?.settings||old?.place){r={schema:1,bookId:this.book.id,settings:old.settings||{},place:old.place};break;}}}if(!r)return null;this.record={...r,place:this.locate(r.place),fired:Array.isArray(r.fired)?r.fired.filter(x=>typeof x==='string'):[]};return this.record;}
 save(settings,place,fired=[]){this.record={schema:2,bookId:this.book.id,updatedAt:new Date().toISOString(),settings:{...settings},place:this.locate(place),fired:[...fired]};try{this.storage?.setItem(this.key,JSON.stringify(this.record));this.available=!!this.storage;return this.available;}catch{this.available=false;return false;}}
 export(place){const p=this.locate(place);if(!p)throw Error('no-place');return{format:'syolana-bookmark',schema:1,bookId:this.book.id,title:this.book.title,place:p};}
 import(data){if(!data||data.format!=='syolana-bookmark'||data.schema!==1||data.bookId!==this.book.id)throw Error('wrong-book');const place=this.locate(data.place);if(!place)throw Error('invalid-place');return place;}
}

/* Syolana MM-04 — articulated off-camera cast; only their projected shadows are visible. */
class SyolanaCinema {
 constructor(container){
  this.canvas=document.createElement('canvas');this.canvas.className='cinema-canvas';this.canvas.setAttribute('aria-hidden','true');container.append(this.canvas);this.ctx=this.canvas.getContext('2d');
  this.fx=document.createElement('canvas');this.fx.className='cinema-fx';this.fx.setAttribute('aria-hidden','true');container.append(this.fx);this.fctx=this.fx.getContext('2d');
  this.mask=document.createElement('canvas');this.mctx=this.mask.getContext('2d');this.time=0;this.beatTime=0;this.beat=-1;this.paragraph=-1;this.scene=0;this.poses=null;this.batches={sphere:[],cube:[],skirt:[]};this.framePlates=[];
  document.body.dataset.cinemaRenderer='projected-shadows';document.body.dataset.visiblePeople='0';
 }
 resize(w,h,dpr){this.w=w;this.h=h;this.dpr=Math.min(dpr,1);for(const c of [this.canvas,this.fx,this.mask]){c.width=Math.round(w*this.dpr);c.height=Math.round(h*this.dpr);}this.aspect=w/h;this.spread=Math.min(.77,this.aspect*.83);}
 static I(){return new Float32Array([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);}
 static mul(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)o[c*4+r]=a[r]*b[c*4]+a[4+r]*b[c*4+1]+a[8+r]*b[c*4+2]+a[12+r]*b[c*4+3];return o;}
 static T(x,y,z){const m=this.I();m[12]=x;m[13]=y;m[14]=z;return m;}
 static S(x,y,z){const m=this.I();m[0]=x;m[5]=y;m[10]=z;return m;}
 static R(x=0,y=0,z=0){const a=this.I(),b=this.I(),c=this.I();a[5]=Math.cos(x);a[6]=Math.sin(x);a[9]=-Math.sin(x);a[10]=Math.cos(x);b[0]=Math.cos(y);b[2]=-Math.sin(y);b[8]=Math.sin(y);b[10]=Math.cos(y);c[0]=Math.cos(z);c[1]=Math.sin(z);c[4]=-Math.sin(z);c[5]=Math.cos(z);return this.mul(b,this.mul(c,a));}
 static point(m,p){return[m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],m[2]*p[0]+m[6]*p[1]+m[10]*p[2]+m[14]];}
 static norm(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);}
 static cross(a,b){return[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
 static dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
 static mix(a,b,u){return a+(b-a)*u;}
 static smooth(u){u=Math.max(0,Math.min(1,u));return u*u*(3-2*u);}
 static vec(a,b,u){return a.map((v,i)=>v+(b[i]-v)*u);}
 setParagraph(p,scene){this.paragraph=p;this.scene=scene;const starts=[-1,0,5,8,15,25,31,43,55,60,65,74,82,95,100,101,104,109,110,112,115,127,131];let beat=-1;for(const b of starts){if(p>=b)beat=b;}if(beat!==this.beat){this.beat=beat;this.beatTime=this.time;return true;}return false;}
 add(kind,base,pos,scale,color,rot=[0,0,0]){const C=SyolanaCinema;const m=C.mul(base,C.mul(C.T(...pos),C.mul(C.R(...rot),C.S(...scale))));this.batches[kind].push({m,color});return m;}
 segment(base,a,b,rx,rz,color){const C=SyolanaCinema,d=b.map((v,i)=>v-a[i]),len=Math.hypot(...d);if(len<.002)return;const y=C.norm(d),x=C.norm(C.cross(y,Math.abs(y[2])>.9?[1,0,0]:[0,0,1])),z=C.cross(x,y),m=new Float32Array([x[0]*rx,x[1]*rx,x[2]*rx,0,y[0]*len*.58,y[1]*len*.58,y[2]*len*.58,0,z[0]*rz,z[1]*rz,z[2]*rz,0,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,1]);this.batches.sphere.push({m:C.mul(base,m),color});}
 arm(base,side,target,color,skin){const C=SyolanaCinema,S=[side*.205,1.49,.02],raw=target.map((v,i)=>v-S[i]);let d=Math.hypot(...raw);const dir=C.norm(raw);d=Math.min(.565,Math.max(.08,d));const H=S.map((v,i)=>v+dir[i]*d),a=(.30*.30-.285*.285+d*d)/(2*d),radius=Math.sqrt(Math.max(.001,.30*.30-a*a));const pole=[side,.04,-.23],dot=C.dot(pole,dir),perp=C.norm(pole.map((v,i)=>v-dir[i]*dot)),E=S.map((v,i)=>v+dir[i]*a+perp[i]*radius);this.segment(base,S,E,.063,.070,color);this.segment(base,E,H,.050,.055,color);this.add('sphere',base,H,[.043,.071,.027],skin,[.16,side*.22,-side*.18]);
  // A few restrained finger forms, kept small enough to remain human in silhouette.
  for(let i=0;i<3;i++)this.add('sphere',base,[H[0]+side*(i-1)*.014,H[1]-.055,H[2]+.008],[.009,.038,.010],skin,[.2,0,-side*.12]);return C.point(base,H);
 }
 actor(pose,female,t){const C=SyolanaCinema,scale=female?.965:1.025;let base=C.mul(C.T(pose.x,-1.04,pose.z),C.mul(C.R(0,pose.yaw,0),C.S(scale*.86,scale,scale*.94)));const breath=Math.sin(t*1.35+(female?1.3:0))*.006;const coat=female?[.26,.19,.28,.12]:[.075,.095,.14,.22],coat2=female?[.31,.24,.31,.1]:[.11,.13,.17,.16],skin=female?[.34,.29,.28,.12]:[.28,.27,.26,.12],hair=female?[.105,.073,.075,.12]:[.068,.065,.075,.16];
  // Realistic proportions: small head, clothed articulated body, soft material light.
  this.add('sphere',base,[0,1.245+breath,.015],[female?.177:.221,.275,.115],coat,[pose.lean,0,Math.sin(t*.43)*.012]);
  this.add('sphere',base,[0,1.005,.01],[female?.127:.168,.145,.105],coat2);
  if(female){this.add('skirt',base,[0,.49,.005],[.32,.475,.225],coat2,[Math.sin(t*.63)*.012,0,Math.sin(t*.41)*.012]);this.add('sphere',base,[0,1.51,.015],[.155,.045,.095],coat2);}
  else{this.add('skirt',base,[0,.84,.015],[.215,.22,.14],coat,[pose.lean*.4,Math.sin(t*.55)*.015,0]);for(const side of [-1,1]){const step=pose.walk*Math.sin(t*5.6+side*Math.PI*.5),hip=[side*.105,.88,0],knee=[side*.108,.47,step*.12],ankle=[side*.11,.10,step*.24];this.segment(base,hip,knee,.077,.085,coat);this.segment(base,knee,ankle,.060,.065,coat);this.add('sphere',base,[side*.11,.07,step*.24+.055],[.071,.07,.135],[.045,.038,.045,.35]);}this.add('cube',base,[0,1.04,.11],[.163,.022,.013],[.075,.051,.038,.28]);this.add('cube',base,[.015,1.04,.127],[.024,.024,.008],[.43,.31,.15,.6]);}
  const neck=[0,1.55+breath,.01];this.add('sphere',base,neck,[.060,.105,.055],skin);const headBase=C.mul(base,C.mul(C.T(0,1.68+breath,.022),C.R(pose.headX,pose.headY,Math.sin(t*.37)*.014)));
  this.add('sphere',headBase,[0,.035,0],[.090,.117,.090],skin);this.add('sphere',headBase,[0,-.035,.019],[.070,.066,.068],skin);this.add('sphere',headBase,[0,.067,-.026],[.094,.104,.080],hair);this.add('sphere',headBase,[0,.014,-.068],[.088,.076,.048],hair);
  if(female){this.add('sphere',headBase,[0,.015,-.111],[.071,.062,.056],hair);this.add('sphere',headBase,[-.077,.010,-.04],[.026,.105,.037],hair);}else{this.add('sphere',headBase,[-.074,.075,-.033],[.027,.050,.039],[.20,.19,.20,.14]);this.add('sphere',headBase,[.074,.075,-.033],[.027,.050,.039],[.20,.19,.20,.14]);}
  this.add('sphere',headBase,[0,.012,.080],[.021,.026,.027],skin);for(const s of [-1,1]){this.add('sphere',headBase,[s*.087,.01,0],[.016,.031,.019],skin);this.add('sphere',headBase,[s*.035,.048,.073],[.027,.009,.010],hair);}
  const palms=[];for(const side of [-1,1]){const hand=(side<0?pose.left:pose.right).slice();hand[1]+=breath;hand[0]+=Math.sin(t*.76+side+Number(female))*.012;palms.push(this.arm(base,side,hand,coat,skin));}
  return {base,hands:palms,head:C.point(base,[0,1.77,.02])};
 }
 targetPoses(){const t=this.time,C=SyolanaCinema,elapsed=this.time-this.beatTime,u=C.smooth(elapsed/3),s=this.spread;
  const m={x:s,z:.04,yaw:-.46,headX:-.025,headY:-.17,lean:0,walk:0,left:[-.23,.94,.14],right:[.24,.95,.12]},f={x:-s*.82,z:-.26,yaw:.36,headX:.025,headY:.13,lean:0,walk:0,left:[-.20,1.02,.27],right:[.25,1.07,.33]};
  if(this.beat<0){m.x=C.mix(s*1.5,s*.58,C.smooth(Math.min(this.time/7,1)));m.z=C.mix(-.78,-.20,C.smooth(Math.min(this.time/7,1)));m.yaw=-.65;m.walk=this.time<7?.7:0;m.left=[-.17,1.05,.2];f.z=-.9;return{m,f,exterior:true,door:Math.sin(t*.32)*.04};}
  if(this.beat===0){m.x=C.mix(s*1.35,s,u);m.z=C.mix(-.54,.04,u);m.yaw=C.mix(-1.0,-.46,u);m.walk=elapsed<3?Math.sin(Math.PI*Math.min(elapsed/3,1))*.95:0;m.right=[.26,1.14,.25];}
  if(this.beat===5){m.left=[-.45,C.mix(1.24,1.04,u),.43];m.right=[.15,1.2,.31];m.headX=.16;f.headX=.10;}
  if(this.beat===8){m.headY=-.28;m.left=[-.3,1.12,.32];f.headX=-.035;f.right=[.13,1.31,.14];}
  if(this.beat===15){m.left=[-.44,1.25,.42];m.headY=-.20;f.right=[.12,1.40,.18];f.headX=-.08;}
  if(this.beat>=25&&this.beat<43){m.left=[-.46,1.08,.50];m.headX=.18;f.right=[.36,1.18,.47];f.headX=.22;if(this.beat===31){f.right=[.35,1.31,.40];f.left=[.02,1.21,.40];m.left=[-.30,1.02,.24];}}
  if(this.beat>=43&&this.beat<65){m.x-=s*.16;f.x+=s*.23;f.lean=.07;f.right=[.66,1.39,.24];m.headX=.12;if(this.beat===43){f.x=C.mix(-s*.20,-s*.82,u);f.z=C.mix(-.05,-.26,u);f.walk=elapsed<3?.65:0;f.right=[.39,1.05,.46];f.headX=.14;}if(this.beat===60){m.left=[-.57,1.35,.25];m.headX=.19;}}
  if(this.beat===65){m.x+=s*.17*u;m.z-=u*.38;m.walk=elapsed<3?.55*Math.sin(Math.PI*Math.min(elapsed/3,1)):0;m.headY=-.30;f.right=[.37,1.12,.36];}
  if(this.beat===74){f.headX=.28;f.right=[.38,1.15,.49];m.headX=.20;m.left=[-.32,1.08,.35];}
  if(this.beat===82||this.beat===95){m.x-=s*.18;m.z=.21;m.lean=.14;m.headX=.11;m.left=[-.31,1.00,.53];m.right=[.20,1.01,.50];f.headX=-.06;f.right=[.26,1.16,.39];}
  if(this.beat===100){const slap=C.smooth(Math.max(0,this.story?.impactAge??0)/.22);f.right=[.33,C.mix(1.48,1.015,slap),C.mix(.19,.52,slap)];f.lean=.12;m.headX=-.06;m.left=[-.26,1.14,.26];}
  if(this.beat===101){m.x+=s*.55*u;m.z=-.78*u;m.yaw=-.10;m.headY=-.38;m.left=[-.16,1.07,-.10];m.right=[.17,1.05,-.10];m.walk=elapsed<3?.45:0;f.right=[.38,1.09,.46];}
  if(this.beat===104){f.x-=s*.55*u;f.z-=.38*u;f.walk=elapsed<3?.7:0;f.yaw=-.22;f.left=[-.46,1.01,.10];f.right=[.15,1.16,.38];m.headX=.16;}
  if(this.beat===109){f.left=[.12,1.18,.49];f.right=[.36,1.23,.49];f.headX=.30;m.x-=s*.10;m.z=.14;m.headX=.26;}
  if(this.beat===110){m.z=-.10*u;m.left=[-.37,1.40,.34];m.headY=C.mix(-.17,-.55,u);m.headX=-.08;f.z=-.26-u*.10;f.left=[-.21,1.30,.44];f.right=[.36,1.37,.41];f.headY=.26;}
  if(this.beat===112){m.left=[-.28,1.56,.31];m.headY=-.42;m.headX=-.10;f.right=[.30,1.22,.39];f.headY=.26;}
  if(this.beat>=115){m.left=[-.32,1.13,.37];m.headY=-.17;f.right=[.27,1.17,.37];f.headX=-.04;if(this.beat===127){m.left=[-.41,1.035,.51];m.headX=.12;}if(this.beat===131){m.left=[-.37,1.28,.39];m.headX=.09;f.headY=.22;}}
  // Conversational life continues when the reader pauses: weight, head and wrists.
  const cycle=Math.sin(t*.64);m.headY+=cycle*.035;m.headX+=Math.sin(t*.83)*.025;f.headY+=Math.sin(t*.59+1.9)*.045;f.headX+=Math.sin(t*.71+1)*.024;m.z+=Math.sin(t*.45)*.045;m.x+=Math.sin(t*.40)*.035;f.x+=Math.sin(t*.39)*.040;f.z+=Math.sin(t*.37+1.1)*.030;
  const speaking=Math.pow(Math.sin(t*.24),2),reply=1-speaking;
  m.headY+=Math.sin(t*.45)*.055;m.headX+=Math.sin(t*1.10)*.045*speaking;f.headX+=Math.sin(t*.94+1)*.042*reply;
  m.yaw+=Math.sin(t*.38)*.035;f.yaw+=Math.sin(t*.36+2)*.04;
  if(![31,55,60,100,104,109,110,112,127].includes(this.beat)){m.left[1]+=Math.sin(t*.86)*.14*speaking;m.left[2]+=Math.sin(t*.64)*.07*speaking;f.right[1]+=Math.sin(t*.80+1.7)*.13*reply;f.right[2]+=Math.sin(t*.59+2)*.05*reply;}
  else{m.left[1]+=Math.sin(t*.67)*.018;f.right[1]+=Math.sin(t*.82+1.7)*.022;}
  return{m,f,exterior:false,door:this.beat===0?(1-u)*1.1:0};
 }
 blendPose(old,target,k){if(!old)return JSON.parse(JSON.stringify(target));const out={};for(const name of ['m','f']){out[name]={};for(const key of Object.keys(target[name]))out[name][key]=Array.isArray(target[name][key])?SyolanaCinema.vec(old[name][key],target[name][key],k):SyolanaCinema.mix(old[name][key],target[name][key],k);}out.door=SyolanaCinema.mix(old.door||0,target.door,k);out.exterior=target.exterior;return out;}
 buildActors(dt){const C=SyolanaCinema;for(const a of Object.values(this.batches))a.length=0;this.poses=this.blendPose(this.poses,this.targetPoses(),1-Math.exp(-dt*3.0));const {m,f,exterior,door}=this.poses;
  this.male=this.actor(m,false,this.time);if(!exterior)this.female=this.actor(f,true,this.time+1.4);else this.female=null;
  const I=C.I(),elapsed=this.time-this.beatTime;
  if(!exterior){
   // Moving solid door at the arrival, kept off the central text axis.
   const doorX=this.spread*1.62;if(this.beat===0){this.add('cube',C.T(doorX,-.14,-.61),[-.19*Math.sin(door),0,.19*Math.cos(door)],[.21,.93,.035],[.13,.083,.065,.28],[0,-door,0]);
   this.add('sphere',I,[doorX-.21,0,-.55],[.018,.025,.026],[.50,.35,.16,.8]);}
   if(this.paragraph>=5){const u=this.beat===5?C.smooth(elapsed/2):1;const from=this.male.hands[0],to=[-.11,-.018,.52],pos=C.vec(from,to,u);for(let i=0;i<2;i++)this.add('sphere',I,[pos[0]+i*.058,pos[1]+i*.018,pos[2]],[.082,.025,.125],[.085,.060,.055,.35],[0,.3+i*.5,-.13]);}
   if(this.paragraph>=25){let pos=[.04,-.005,.56],rot=[-1.48,.12,.12];if(this.beat===25){const age=this.story?.documentAge,u=age==null?0:C.smooth(age/.55);pos=C.vec(this.male.hands[0],pos,u);rot=[C.mix(-.4,-1.48,u),.12,.12];}if(this.beat===31){pos=[this.female.hands[1][0]+.045,this.female.hands[1][1]+.045,this.female.hands[1][2]+.045];rot=[-.45,-.3,-.07];}if(this.beat===109){pos[0]=-.035;pos[1]=.03;}
    this.paperPoint=pos;const paper=C.mul(C.T(...pos),C.R(...rot));this.add('cube',paper,[0,0,0],[.155,.20,.003],[.57,.54,.46,.13]);this.add('sphere',paper,[.072,-.107,.012],[.035,.030,.009],[.35,.065,.071,.7]);for(let i=0;i<6;i++)this.add('cube',paper,[-.015,.12-i*.032,.006],[.088-(i%3)*.012,.0017,.001],[this.paragraph>=74?.21:.17,this.paragraph>=74?.50:.15,this.paragraph>=74?.32:.15,.05]);
   }else this.paperPoint=[0,0,.5];
  }
 }
 perspective(){const C=SyolanaCinema,f=1/Math.tan(40*Math.PI/360),near=.1,far=25;const p=new Float32Array([f/this.aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);const sh=this.shot?.camera||{cx:0,cy:0,z:3.9,angle:0};const cameraX=sh.cx*this.spread,camY=sh.cy,camZ=sh.z;this.eye=[cameraX,camY,camZ];this.vp=C.mul(p,C.mul(C.R(-.025,sh.angle,0),C.T(-cameraX,-camY,-camZ)));return this.vp;}
 project(p){const m=this.vp,x=m[0]*p[0]+m[4]*p[1]+m[8]*p[2]+m[12],y=m[1]*p[0]+m[5]*p[1]+m[9]*p[2]+m[13],w=m[3]*p[0]+m[7]*p[1]+m[11]*p[2]+m[15];return[(x/w*.5+.5)*this.w,(.5-y/w*.5)*this.h];}
 shadowPoint(q,surface){const L=this.light;if(surface==='wall'){const k=(-1.15-L[2])/(q[2]-L[2]);return q.map((v,i)=>L[i]+(v-L[i])*k);}const plane=surface==='desk'?-.05:-1.055,k=(plane-L[1])/(q[1]-L[1]);return q.map((v,i)=>L[i]+(v-L[i])*k);}
 ellipse(m,surface){const C=SyolanaCinema,pt=q=>this.project(this.shadowPoint(C.point(m,q),surface)),at=pt([0,0,0]),v=[];for(let i=0;i<3;i++){const q=[0,0,0];q[i]=1;const e=pt(q);v.push([e[0]-at[0],e[1]-at[1]]);}let xx=0,yy=0,xy=0;for(const q of v){xx+=q[0]*q[0];yy+=q[1]*q[1];xy+=q[0]*q[1];}const d=Math.sqrt((xx-yy)**2+4*xy*xy);return{at,r1:Math.sqrt(Math.max(.01,(xx+yy+d)/2)),r2:Math.sqrt(Math.max(.01,(xx+yy-d)/2)),angle:.5*Math.atan2(2*xy,xx-yy)};}
 silhouettePath(c,o,surface){const C=SyolanaCinema;c.beginPath();if(o.kind==='sphere'){const e=this.ellipse(o.m,surface);if(e.r1>this.w*5||!e.at.every(Number.isFinite))return false;c.ellipse(...e.at,e.r1,e.r2,e.angle,0,Math.PI*2);return true;}
  const points=[],project=q=>this.project(this.shadowPoint(C.point(o.m,q),surface));if(o.kind==='skirt'){for(let i=0;i<20;i++){const a=i/20*Math.PI*2;for(const y of [-1,1]){const r=y<0?1:.46;points.push(project([Math.cos(a)*r,y,Math.sin(a)*r]));}}}else for(const x of [-1,1])for(const y of [-1,1])for(const z of [-1,1])points.push(project([x,y,z]));
  points.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(points.some(q=>!q.every(Number.isFinite)))return false;const cross=(a,b,d)=>(b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0]),lo=[],hi=[];for(const q of points){while(lo.length>1&&cross(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q);}for(const q of points.slice().reverse()){while(hi.length>1&&cross(hi[hi.length-2],hi[hi.length-1],q)<=0)hi.pop();hi.push(q);}const hull=lo.slice(0,-1).concat(hi.slice(0,-1));if(!hull.length)return false;c.moveTo(...hull[0]);for(const q of hull.slice(1))c.lineTo(...q);c.closePath();return true;
 }
 renderShadows(){const c=this.ctx,m=this.mctx,w=this.w,h=this.h;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);if(this.paragraph<0)return;
  const objects=Object.entries(this.batches).flatMap(([kind,list])=>list.map(o=>({...o,kind}))).filter(o=>!(o.kind==='cube'&&Math.hypot(o.m[4],o.m[5],o.m[6])>.6));
  for(const surface of ['wall','floor','desk']){
   m.setTransform(this.dpr,0,0,this.dpr,0,0);m.globalCompositeOperation='source-over';m.clearRect(0,0,w,h);m.fillStyle='#071115';
   for(const o of objects){if(surface==='desk'&&(o.m[13]<-.20||o.m[14]<.15))continue;if(this.silhouettePath(m,o,surface))m.fill();}
   // The complete silhouette is composited once. Overlapping body parts never make visible puppet joints.
   for(const plate of this.framePlates){if(plate.weight<.004)continue;const xy=(x,y)=>[(plate.rect[0]+x*plate.rect[2])*w,(plate.rect[1]+y*plate.rect[3])*h],top=surface==='wall'?0:surface==='floor'?.69:.56,bottom=surface==='wall'?.84:1.4,a=xy(-.5,top),b=xy(1.5,bottom);c.save();c.beginPath();c.rect(a[0],a[1],b[0]-a[0],b[1]-a[1]);if(plate.image.startsWith('hearth')&&surface==='wall'){const portrait=plate.image==='hearth-portrait',aa=xy(portrait?.57:.63,portrait?.57:.45),bb=xy(.90,portrait?.75:.81);c.rect(aa[0],aa[1],bb[0]-aa[0],bb[1]-aa[1]);c.clip('evenodd');}else c.clip();c.globalAlpha=plate.weight*(this.aspect>1?(surface==='wall'?.42:surface==='floor'?.16:.20):(surface==='wall'?.64:surface==='floor'?.22:.28))*(plate.shadow??.8);c.filter=surface==='wall'?'blur(2px)':'blur(3px)';c.drawImage(this.mask,0,0,w,h);c.restore();}
  }
 }
 glow(c,x,y,r,color,alpha){if(r<=0||alpha<=0)return;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(.25,`rgba(${color},${alpha*.34})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 flame(c,x,y,width,height,phase,strength=1,halo=.08){const t=this.time,lean=Math.sin(t*2.1+phase)*width*.35+Math.sin(t*3.7+phase)*width*.12,tipY=y-height*(1+.09*Math.sin(t*2.8+phase)+.025*(this.lightPhase||0));c.save();c.globalCompositeOperation='screen';this.glow(c,x,y-height*.4,height*2.4,'255,166,58',halo*strength);
  for(let j=0;j<3;j++){const scale=1-j*.26,ww=width*scale,hh=(y-tipY)*scale,tx=x+lean*scale,g=c.createLinearGradient(x,y,x,y-hh);g.addColorStop(0,j===2?'rgba(255,247,196,.90)':'rgba(248,125,25,.45)');g.addColorStop(.4,j===2?'rgba(255,232,131,.85)':'rgba(255,187,56,.66)');g.addColorStop(1,'rgba(255,212,111,0)');c.fillStyle=g;c.beginPath();c.moveTo(x-ww*.5,y);c.bezierCurveTo(x-ww,y-hh*.38,tx-ww*.30,y-hh*.76,tx,y-hh);c.bezierCurveTo(tx+ww*.40,y-hh*.62,x+ww*.67,y-hh*.38,x+ww*.5,y);c.closePath();c.globalAlpha=strength;c.fill();}c.restore();
 }
 effects(p){const c=this.fctx,w=this.w,h=this.h,t=this.time;c.setTransform(this.dpr,0,0,this.dpr,0,0);c.clearRect(0,0,w,h);c.globalCompositeOperation='screen';
  // Emitters are authored in image coordinates; zoom and portrait framing preserve their exact positions.
  const candles={window:[],hearth:[[.655,.153],[.697,.199]],'hearth-portrait':[[.666,.415]],candles:[[.504,.407],[.592,.286],[.697,.468]],desk:[[.746,.300]]};
  for(const plate of this.framePlates){if(plate.weight<.004)continue;const xy=(x,y)=>[(plate.rect[0]+x*plate.rect[2])*w,(plate.rect[1]+y*plate.rect[3])*h],unit=plate.rect[3]*h,weight=plate.weight;
   for(const [i,at]of (candles[plate.image]||[]).entries()){const [x,y]=xy(...at);this.flame(c,x,y,unit*.009,unit*.040,i*1.7,weight);this.glow(c,x,y-unit*.025,unit*.18,'255,175,68',weight*(.12+.012*(this.lightPhase||0)));for(let k=0;k<3;k++){const yy=y+(k+1)*unit*.034;c.save();c.translate(x,yy);c.scale(2.6,.20);this.glow(c,0,0,unit*(.035+k*.018),'255,186,89',weight*.08);c.restore();}}
   if(plate.image.startsWith('hearth')){
    const portrait=plate.image==='hearth-portrait',[cx,base]=xy(portrait?.738:.765,portrait?.735:.786),fw=plate.rect[2]*w*(portrait?.26:.23),fh=unit*(portrait?.13:.23);this.glow(c,cx,base-fh*.4,Math.max(fw,fh)*1.9,'255,132,42',weight*((portrait?.04:.07)+.006*(this.lightPhase||0)));
    for(let i=0;i<9;i++){const x=cx+(i/8-.5)*fw,y=base+Math.sin(i*2.3)*unit*.007,hh=fh*(.44+.50*Math.pow(Math.sin(i*1.71+.3),2));this.flame(c,x,y,fw*.12,hh,i*.91,weight*.70,.009);}
    // Embers lift out of the fire, fade, then return to the log bed.
    for(let i=0;i<24;i++){const age=(t*(.19+(i%4)*.027)+i*.137)%1,x=cx+Math.sin(i*2.4+t*.35)*fw*.55+Math.sin(age*7+i)*fw*.05,y=base-age*fh*1.9;this.glow(c,x,y,2+(i%4)*1.8,'255,174,62',weight*(1-age)*.65);}
    for(let i=0;i<5;i++){const age=(t*.09+i*.23)%1;this.glow(c,cx+Math.sin(t*.22+i)*fw*.28,base-fh*(.6+age*2),fw*(.22+age*.32),'116,145,146',weight*.025*(1-age));}
   }
  }
  // Multiple depths of softly luminous motes. They carry light, never outlines of people.
  const magic=Math.max(p.magic,p.emerald*.55);for(let i=0;i<48;i++){const z=.18+(i%7)*.125,phase=t*(.19+z*.10)+i*2.399,x=(.5+Math.sin(phase*.57+i*.31)*.47)*w,y=(.5+Math.cos(phase*.43+i*.73)*.46)*h,r=i<7?14+z*22:4+z*12,green=i%4===0&&magic>.18,color=green?'97,255,189':'255,216,132',a=(i<7?.32+z*.40:.13+z*.22)*(i>31?.35+magic*.65:1)*(p.particleGain??1);this.glow(c,x,y,r,color,a);if(i%3===0){c.strokeStyle=`rgba(${color},${a*.24})`;c.lineWidth=.7+z;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x-Math.cos(phase)*12*z,y+9*z,x-Math.cos(phase)*24*z,y+14*z);c.stroke();}}
  // Broad, slowly travelling illumination, like a beam through suspended dust.
  for(let i=0;i<3;i++){const x=(.12+i*.37+Math.sin(t*.25+i)*.045)*w,y=h*(.23+i*.20);this.glow(c,x,y,w*(.22+i*.04),i===1?'45,183,177':'255,183,82',.055+(i===1?p.cold:p.warm)*.08);}
  let origin=[w*.50,h*.66];const detail=this.framePlates.find(x=>x.image==='desk'&&x.weight>.45);if(detail)origin=[(detail.rect[0]+.55*detail.rect[2])*w,(detail.rect[1]+.69*detail.rect[3])*h];
  // Quiet light remains after the event. The travelling wave occurs once per phrase trigger.
  if(magic>.025)this.glow(c,...origin,w*.26,'111,255,179',magic*.085);
  const wave=this.story?.wave;
  if(wave!==null&&wave!==undefined){const u=SyolanaCinema.smooth(Math.min(1,wave/5.8)),fade=Math.sin(Math.PI*Math.min(1,wave/10)),radius=(.02+u*1.4)*w;c.strokeStyle=`rgba(255,199,109,${fade*.28})`;c.lineWidth=3.2;c.beginPath();c.ellipse(origin[0],origin[1],radius,radius*.24,0,0,Math.PI*2);c.stroke();
   for(let i=0;i<5;i++){const edge=[w*(i/4),h*(i%2?.12:.89)],p0=origin,p1=[origin[0]+Math.sin(i)*w*.18,origin[1]-h*.19],p2=[edge[0]-Math.cos(i)*w*.14,edge[1]+h*.12],color=i%2?'100,246,185':'255,192,83';c.strokeStyle=`rgba(${color},${fade*.31})`;c.lineWidth=2.3+(i%3)*1.4;c.beginPath();for(let j=0;j<=45;j++){const v=j/45*u,iv=1-v,x=iv**3*p0[0]+3*iv*iv*v*p1[0]+3*iv*v*v*p2[0]+v**3*edge[0],y=iv**3*p0[1]+3*iv*iv*v*p1[1]+3*iv*v*v*p2[1]+v**3*edge[1];j?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}this.glow(c,...origin,w*.29,'193,255,176',fade*.13);
  }
  if((p.focus||0)>.01)this.glow(c,...origin,w*.25,'255,213,137',p.focus*.10);
  const impact=this.story?.impactAge;if(impact!=null&&impact>=.22&&impact<1.5){const u=(impact-.22)/1.28;c.strokeStyle=`rgba(245,221,178,${(1-u)*.19})`;c.lineWidth=1.5;c.beginPath();c.ellipse(origin[0],origin[1],u*w*.13+3,u*h*.022+1,0,0,Math.PI*2);c.stroke();}
  c.globalCompositeOperation='source-over';
 }
 render(dt,p,weights,imageRect,motion){if(!this.w)return;if(motion)this.time+=dt;else this.poses=null;this.buildActors(motion?Math.min(.2,dt):.2);this.perspective();const t=this.time;this.lightPhase=Math.sin(t*.62)*.58+Math.sin(t*1.3)*.18+Math.sin(t*.33)*.24;this.light=[-.35+this.lightPhase*.24+(p.pressure||0)*.10,1.75+this.lightPhase*.035,3.5];this.renderShadows();this.effects(p);if(this.time-(this.reportAt||-1)>.5){this.reportAt=this.time;this.canvas.dataset.mode='shadows-only';this.canvas.dataset.action=String(this.beat);this.canvas.dataset.clock=this.time.toFixed(2);this.canvas.dataset.people='0';this.canvas.dataset.shadowCount=this.poses.exterior?'0':'2';this.canvas.dataset.leftHand=this.female?.hands[1].map(v=>v.toFixed(3)).join(',')||'';this.canvas.dataset.light=this.light.map(v=>v.toFixed(3)).join(',');}}
}

/* Syolana MM-04 — the approved teal-gold room, now with projected shadows and practical fire. */
class SyolanaDirector {
 constructor(){
  this.shots={
   'window-veil':{image:'window',duration:15,scale:1.16,focusX:.46,focusY:.50,panX:-.025,panY:0,dx:.045,dy:-.014,z:3.95,cx:0,cy:.02,angle:0,cast:.72,mask:0,rain:1.10},
   'window-drift':{image:'window',duration:13,scale:1.30,focusX:.56,focusY:.50,panX:.02,panY:0,dx:-.045,dy:.014,z:3.95,cx:.04,cy:.02,angle:.01,cast:.78,mask:0,rain:1.05},
   'window-deep':{image:'window',duration:14,scale:1.09,focusX:.48,focusY:.50,panX:-.015,panY:0,dx:.035,dy:-.012,z:3.95,cx:-.03,cy:.02,angle:-.01,cast:.80,mask:0,rain:1.10},
   'candle-light':{image:'candles',duration:13,scale:1.12,focusX:.60,focusY:.50,panX:-.015,panY:0,dx:.045,dy:-.016,z:3.95,cx:.02,cy:.02,angle:0,cast:.82,mask:0,rain:.75},
   'candle-near':{image:'candles',duration:12,scale:1.27,focusX:.60,focusY:.50,panX:.018,panY:0,dx:-.04,dy:.014,z:3.95,cx:.03,cy:.02,angle:0,cast:.68,mask:0,rain:.70},
   'hearth-room':{image:'hearth',duration:15,scale:1.08,focusX:.69,focusY:.50,panX:-.02,panY:0,dx:.04,dy:-.012,z:3.95,cx:0,cy:.02,angle:0,cast:.93,mask:0,rain:.75},
   'hearth-near':{image:'hearth',duration:12,scale:1.25,focusX:.76,focusY:.55,panX:.01,panY:0,dx:-.03,dy:-.010,z:3.95,cx:.03,cy:.02,angle:0,cast:.82,mask:0,rain:.70},
   'document-shadow':{image:'desk',duration:12,scale:1.13,focusX:.57,focusY:.50,panX:-.02,panY:.005,dx:.04,dy:-.014,z:3.95,cx:0,cy:.02,angle:0,cast:.55,mask:0,rain:.70},
   'ink-light':{image:'desk',duration:11,scale:1.26,focusX:.55,focusY:.52,panX:.01,panY:0,dx:-.035,dy:-.012,z:3.95,cx:0,cy:.02,angle:0,cast:.48,mask:0,rain:.70}
  };
  this.programs=[['window-veil','candle-light','window-drift'],['window-deep','candle-light','window-drift','hearth-room'],['window-drift','hearth-room','window-veil','candle-near'],['document-shadow','window-veil','ink-light','candle-light','window-drift'],['window-veil','candle-light','window-drift','hearth-room','window-deep'],['ink-light','window-drift','document-shadow','candle-near'],['window-deep','hearth-room','window-veil','candle-light'],['window-drift','ink-light','hearth-near','window-deep'],['window-veil','hearth-room','window-drift','document-shadow','candle-light']];
  this.scene=-1;this.key='window-veil';this.previous=null;this.elapsed=0;this.transition=2.6;this.blend=1;this.index=0;this.total=0;this.number=0;this.lastBeat=-1;this.camera=null;this.pinUntil=0;
 }
 change(key){if(this.key===key&&this.number)return;this.previous=(this.layers||[{key:this.key,weight:1,elapsed:this.elapsed}]).map(x=>({...x}));this.key=key;this.elapsed=0;this.blend=0;this.number++;}
 pin(key,seconds){this.change(key);this.pinUntil=this.total+seconds;}
 update(dt,scene,paragraph,motion){const beat=[0,5,25,31,55,60,74,95,100,101,104,109,110,115,127].filter(x=>paragraph>=x).at(-1)??-1;
  if(scene!==this.scene){this.scene=scene;this.index=0;this.change(this.programs[scene][0]);this.lastBeat=beat;}
  else if(beat!==this.lastBeat){this.lastBeat=beat;const focus={25:'document-shadow',31:'document-shadow',55:'window-deep',60:'hearth-room',74:'ink-light',95:'window-drift',100:'candle-light',101:'hearth-room',104:'window-deep',109:'ink-light',110:'window-drift',115:'window-veil',127:'document-shadow'}[beat];if(focus&&scene>0&&this.elapsed>4.5){this.change(focus);const i=this.programs[scene].indexOf(focus);this.index=i<0?0:i;}}
  if(motion){this.total+=dt;this.elapsed+=dt;this.blend=Math.min(1,this.blend+dt/this.transition);const pacing=paragraph>=95&&paragraph<=100?.88:paragraph>=108&&paragraph<=110?1.35:1.10;if(this.elapsed>this.shots[this.key].duration*pacing&&this.total>=this.pinUntil){const p=this.programs[this.scene];this.index=(this.index+1)%p.length;this.change(p[this.index]);}}else this.blend=1;
  const ease=SyolanaCinema.smooth(this.blend),layers=[];if(this.previous&&ease<1)for(const old of this.previous)if(old.weight*(1-ease)>.001)layers.push({...old,elapsed:old.elapsed+(motion?dt:0),weight:old.weight*(1-ease)});layers.push({key:this.key,elapsed:this.elapsed,weight:ease});this.layers=layers;
  const camera={z:0,cx:0,cy:0,angle:0,cast:0,rain:0};for(const l of layers){const s=this.shots[l.key];for(const k of Object.keys(camera))camera[k]+=s[k]*l.weight;}this.camera=camera;return{layers,camera,key:this.key,number:this.number,elapsed:this.elapsed,total:this.total};
 }
 imageKey(spec,w,h){return spec.image==='hearth'&&w/h<.85?'hearth-portrait':spec.image;}
 plateTransform(layer,w,h,image){
  const s=this.shots[layer.key],u=Math.min(1,layer.elapsed/s.duration),ease=u*u*(3-2*u),scale=s.scale+ease*.055;
  const sw=image?.naturalWidth||1672,sh=image?.naturalHeight||941,sz=Math.max(w/sw,h/sh)*scale,iw=sw*sz,ih=sh*sz,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const portrait=sw<sh,fx=portrait ? .53 : (s.image==='candles'&&w/h<.85 ? .49 : s.focusX),fy=portrait ? .50 : s.focusY;
  const dx=clamp((.5-fx)*iw+(s.panX+s.dx*ease)*w,-(iw-w)/2+2,(iw-w)/2-2),dy=clamp((.5-fy)*ih+(s.panY+s.dy*ease)*h,-(ih-h)/2+2,(ih-h)/2-2);return{scale,dx,dy};
 }
}

/* Event dramaturgy follows phrases; ambient motion never advances the plot. */
class SyolanaStory {
 constructor(){this.time=0;this.events=new Map();this.history=new Set();this.frame={};this.paragraph=-1;this.counts={};}
 sync(fired){for(const id of fired||[])this.history.add(id);}
 trigger(name,paragraph,id){const kind=name==='paper'&&paragraph===25?'document':name==='wood'?'impact':name==='seal'?'seal':name==='ink'&&paragraph===109?'letters':null;this.history.add(id);if(kind){this.events.set(kind,this.time);this.counts[kind]=(this.counts[kind]||0)+1;}return kind;}
 age(kind){return this.events.has(kind)?this.time-this.events.get(kind):null;}
 reset(){this.events.clear();this.history.clear();this.frame={};this.counts={};}
 compose(base,dt,paragraph,motion){if(motion)this.time+=dt;this.paragraph=paragraph;const sealAge=this.age('seal'),impactAge=this.age('impact'),documentAge=this.age('document'),lettersAge=this.age('letters');const envelope=(age,duration)=>age===null||age<0||age>duration?0:Math.sin(Math.PI*Math.min(1,age/duration));
  const preparing=paragraph>=108&&paragraph<=110&&(sealAge===null||sealAge>12)&&!this.history.has('cue-8');const pressure=paragraph>=95&&paragraph<=100?1:paragraph>=82&&paragraph<95?.45:0;
  const sealKnown=paragraph>110||(paragraph===110&&this.history.has('cue-8'));const gate=paragraph<110?0:sealKnown?(sealAge!==null&&sealAge<7?SyolanaCinema.smooth(sealAge/3):.72):0;
  const focus=envelope(documentAge,7),impact=envelope(impactAge,1.25),wave=motion&&sealAge!==null&&sealAge<10?sealAge:null;
  this.frame={documentAge,impactAge,lettersAge,sealAge,wave,pressure,preparing,focus,impact,motion,settled:sealKnown};
  return{...base,magic:base.magic*gate,emerald:Math.max(base.emerald,lettersAge!==null&&paragraph===109?.60:0),warm:base.warm*(preparing?.78:1)+focus*.09+impact*.035,cold:Math.min(1,base.cold+pressure*.08),dim:Math.min(1,base.dim+pressure*.06),particleGain:preparing?.42:1,focus,pressure};
 }
}

/* Short owner-library events. No continuous noise bed or synthetic score. */
class SyolanaSoundtrack {
 constructor(env){this.env=env;this.ctx=null;this.ready=null;this.buffers={};this.sources=new Set();this.voices=new Set();this.desired=false;this.enabled=false;this.pending=false;this.generation=0;this.phraseChanges=0;this.currentPiano=null;this.disposed=false;this.controller=new AbortController();}
 async request(url){const c=new AbortController(),relay=()=>c.abort(),timer=setTimeout(relay,6500);this.controller.signal.addEventListener('abort',relay,{once:true});try{const r=await fetch(url,{cache:'force-cache',credentials:'omit',signal:c.signal});if(!r.ok)throw Error('audio');return await r.arrayBuffer();}finally{clearTimeout(timer);this.controller.signal.removeEventListener('abort',relay);}}
 async loadBuffer(name){const asset=this.env.assets.audio[name],urls=typeof asset==='string'?[asset]:[asset.src,asset.fallback].filter(Boolean);for(const url of urls){try{let bytes;if(url.startsWith('data:')){const raw=atob(url.split(',')[1]);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}else bytes=await this.request(url);const b=await this.ctx.decodeAudioData(bytes);if(this.disposed)throw Error('disposed');this.buffers[name]=b;return b;}catch(e){if(this.disposed)throw e;}}throw Error('audio-unavailable');}
 async init(){if(this.ready)return this.ready;const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error('unsupported');this.ctx=new A({latencyHint:'playback'});this.master=this.ctx.createGain();this.master.gain.value=0;this.fxBus=this.ctx.createGain();this.fxBus.connect(this.master);this.master.connect(this.ctx.destination);const resume=this.ctx.resume();this.ready=Promise.allSettled(Object.keys(this.env.assets.audio).map(n=>this.loadBuffer(n))).then(async result=>{await resume;if(!result.some(x=>x.status==='fulfilled'))throw Error('audio-unavailable');this.applyLevels();});return this.ready;}
 async enable(on=true){if(this.disposed)return;this.desired=on;const gen=++this.generation;clearTimeout(this.disableTimer);if(!on){this.enabled=false;this.pending=false;this.rampMaster(0);this.stopEffects();this.updateUI();this.disableTimer=setTimeout(async()=>{if(gen===this.generation&&!this.desired){await this.ctx?.suspend().catch(()=>{});this.updateUI();}},360);return;}this.pending=true;this.updateUI();try{await this.init();if(gen!==this.generation||!this.desired||this.disposed)return;await this.ctx.resume();if(gen!==this.generation||this.disposed)return;this.enabled=true;this.applyLevels();this.rampMaster(1);this.env.prime();if(document.hidden)await this.ctx.suspend();this.env.toast('Звуки включены. Они прозвучат только в моменты событий.');}catch{if(!this.disposed){this.enabled=false;this.desired=false;this.env.toast('Звуки сейчас недоступны. Историю можно продолжать читать.');}}finally{if(gen===this.generation){this.pending=false;this.updateUI();}}}
 updateUI(){if(!this.disposed)this.env.onState(this);}
 rampMaster(value){if(!this.ctx||!this.master)return;const p=this.master.gain,t=this.ctx.currentTime;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(value,t+.28);}
 applyLevels(){if(this.ctx&&this.fxBus)this.fxBus.gain.setTargetAtTime(this.env.settings().fx/100,this.ctx.currentTime,.18);}
 setPreparation(){}
 moodTo(){}
 moment(){}
 play(name,pan=0,scale=1,delay=0){if(this.disposed||!this.enabled||!this.env.settings().effects||!this.buffers[name]||this.ctx.state!=='running'||document.hidden||this.voices.size>=3)return false;const t=this.ctx.currentTime+delay,s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=this.buffers[name];s.loop=false;g.gain.value=({door:.85,cloth:.72,paper:.76,wood:.85,ink:.72,seal:.8,thunder:.74,raindrops:.65}[name]||.75)*scale;s.connect(g);let p;if(this.ctx.createStereoPanner){p=this.ctx.createStereoPanner();p.pan.value=Math.max(-.55,Math.min(.55,pan));g.connect(p);p.connect(this.fxBus);}else g.connect(this.fxBus);this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();p?.disconnect();};s.start(t);return true;}
 stopEffects(){for(const s of this.voices){try{s.stop();}catch{}}this.voices.clear();}
 async visibility(){if(!this.ctx||this.disposed)return;if(document.hidden){this.stopEffects();await this.ctx.suspend().catch(()=>{});}else if(this.desired&&this.enabled){await this.ctx.resume().catch(()=>{});this.updateUI();}}
 destroy(){this.disposed=true;this.desired=false;this.enabled=false;this.generation++;clearTimeout(this.disableTimer);this.controller.abort();this.stopEffects();this.buffers={};this.fxBus?.disconnect();this.master?.disconnect();this.ctx?.close().catch(()=>{});}
}

/* Local reading tools. Feedback is never transmitted until the reader shares it. */
function installSyolanaReaderTools(api){
 const $=s=>document.querySelector(s),paragraphs=[...document.querySelectorAll('.book-paragraph')],normalize=s=>s.normalize('NFKC').toLowerCase().replace(/ё/g,'е'),index=paragraphs.map((p,i)=>({p,i,text:p.textContent,normal:normalize(p.textContent)}));
 const download=(name,data,mime='application/json')=>{const url=URL.createObjectURL(new Blob([data],{type:mime})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);};
 const chapterFor=i=>[...api.book.chapters].reverse().find(c=>i>=c.paragraph)?.label||'Глава 1';
 function closeAll(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
 function open(id){closeAll();api.open(id);}
 $('#settings-search').addEventListener('click',()=>{open('search-dialog');$('#book-search').focus();});
 let searchTimer;function runSearch(){const q=normalize($('#book-search').value.trim());const out=$('#search-results');out.replaceChildren();if(q.length<2){$('#search-status').textContent='Введите хотя бы две буквы.';return;}const all=index.filter(x=>x.normal.includes(q));$('#search-status').textContent=all.length?'Найдено абзацев: '+all.length+(all.length>30?'. Показаны первые 30.':''):'Ничего не найдено.';for(const row of all.slice(0,30)){const at=row.normal.indexOf(q),start=Math.max(0,at-52),end=Math.min(row.text.length,at+q.length+85),button=document.createElement('button'),label=document.createElement('span'),snippet=document.createElement('span');button.type='button';button.className='search-result';label.className='search-location';label.textContent=chapterFor(row.i);snippet.textContent=(start?'…':'')+row.text.slice(start,end)+(end<row.text.length?'…':'');button.append(label,snippet);button.addEventListener('click',()=>{closeAll();api.go(row.i,.22);row.p.classList.add('search-found');setTimeout(()=>row.p.classList.remove('search-found'),6500);});out.append(button);}}
 $('#book-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(runSearch,100);});$('#book-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();$('#search-results button')?.click();}});
 document.querySelectorAll('[data-chapter-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();closeAll();api.go(+a.dataset.chapterLink,0);}));
 $('#settings-bookmark').addEventListener('click',()=>{open('bookmark-dialog');const place=api.place();$('#bookmark-position').textContent=place?chapterFor(place.paragraph)+' · '+Math.round(place.paragraph/(paragraphs.length-1)*100)+'% фрагмента':'Начало книги';});
 $('#save-bookmark').addEventListener('click',()=>{try{download('Syolana-Mayya-Maruk-bookmark.json',JSON.stringify(api.store.export(api.place()||{paragraph:0,fraction:0}),null,2));api.toast('Файл закладки сохранён. Его можно открыть в другом браузере.');}catch{api.toast('Не удалось сохранить закладку. Попробуйте ещё раз.');}});
 $('#load-bookmark').addEventListener('click',()=>$('#bookmark-file').click());$('#bookmark-file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{if(f.size>64000)throw Error('size');const place=api.store.import(JSON.parse(await f.text()));closeAll();api.restore(place);api.toast('Закладка открыта.');}catch{api.toast('Это не закладка данной книги или файл повреждён.');}finally{e.target.value='';}});
 function openFeedback(wants){open('feedback-dialog');if(wants)$('#feedback-wants').checked=true;}
 $('#interest-button').addEventListener('click',()=>openFeedback(true));$('#review-button').addEventListener('click',()=>openFeedback(false));
 const feedback=()=>({format:'syolana-reader-feedback',schema:1,book:api.book.title,author:api.book.author,version:api.book.version,preference:$('input[name="preference"]:checked')?.value||'undecided',comfort:+$('input[name="comfort"]:checked')?.value||null,comment:$('#feedback-note').value.trim().slice(0,800)});
 function feedbackText(){const d=feedback(),choice={immersive:'Хочу прочитать полную книгу в таком иммерсивном оформлении.',plain:'Для продолжения предпочитаю обычный текст.',undecided:'Пока не определился(ась) с форматом.'}[d.preference];return 'Отзыв об иммерсивном фрагменте Syolana\n'+d.author+' — «'+d.book+'»\n'+choice+(d.comfort?'\nУдобство чтения: '+d.comfort+' из 5.':'')+(d.comment?'\nКомментарий: '+d.comment:'')+'\nОбразец: '+d.version;}
 $('#feedback-form').addEventListener('submit',e=>e.preventDefault());$('#save-feedback').addEventListener('click',()=>{download('Syolana-Mayya-Maruk-reader-feedback.json',JSON.stringify(feedback(),null,2));api.toast('Отзыв сохранён в файл. Вы можете передать его автору.');});
 $('#copy-feedback').addEventListener('click',async()=>{const text=feedbackText();try{await navigator.clipboard.writeText(text);api.toast('Отзыв скопирован. Его можно отправить автору.');}catch{const box=$('#feedback-copy');box.hidden=false;box.value=text;box.focus();box.select();api.toast('Текст подготовлен для копирования.');}});
 $('#share-feedback').addEventListener('click',async()=>{if(navigator.share){try{await navigator.share({title:'Отзыв об иммерсивной книге',text:feedbackText()});}catch(e){if(e.name!=='AbortError')api.toast('Можно скопировать отзыв или сохранить его в файл.');}}else $('#copy-feedback').click();});
 return{download};
}

(()=>{'use strict';
let disposed=false;const lifetime=new AbortController();
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const ASSETS=JSON.parse($('#asset-data').textContent),SCENES=JSON.parse($('#scene-data').textContent),BOOK=JSON.parse($('#book-data').textContent);
const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
const defaults={font:innerWidth<=760?19:20,line:1.9,shade:48,face:'sans',motion:!reduced.matches,effects:true,music:0,fx:24};
let storage=null;try{storage=localStorage;}catch{}
const readingStore=new SyolanaReadingStore(storage,BOOK),loaded=readingStore.load();
let settings={...defaults,...(loaded?.settings||{})},saved=loaded?.place||null;
settings.font=Math.max(17,Math.min(27,+settings.font||defaults.font));settings.line=Math.max(1.6,Math.min(2.2,+settings.line||1.9));
settings.shade=Math.max(43,Math.min(76,+settings.shade||54));settings.music=Math.max(0,Math.min(50,+settings.music||0));settings.fx=Math.max(0,Math.min(60,+settings.fx||0));
settings.face=settings.face==='serif'?'serif':'sans';
let currentScene=0,currentParagraph=0,lastPlace=saved,reading=false,toastTimer;
function toast(text){clearTimeout(toastTimer);$('#toast').textContent=text;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,4200);}
function persist(){readingStore.save(settings,lastPlace,typeof cueEngine==='undefined'?[]:[...cueEngine.fired]);}

/* One fixed, diffused world. Branding and text never enter this canvas. */
class World{
 constructor(){this.canvas=$('#world-canvas');this.ctx=this.canvas.getContext('2d',{alpha:false});this.images={};this.weights=[1,0,0,0,0];this.target=[1,0,0,0,0];this.keys=['window','hearth','hearth-portrait','candles','desk'];this.imageKeys=Object.keys(ASSETS.images);this.director=new SyolanaDirector();this.story=new SyolanaStory();this.scene=SCENES[0];this.values={...this.scene.visual};this.pointer={x:0,y:0};this.targetPointer={x:0,y:0};this.t=0;this.last=0;this.needs=true;this.pulse=-100;
  let seed=271108;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646};
  this.rain=Array.from({length:150},()=>({x:rand(),y:rand(),z:.2+rand()*.8,phase:rand()*6.28}));
  this.motes=Array.from({length:60},()=>({x:rand(),y:rand(),z:.15+rand()*.85,phase:rand()*6.28,speed:.4+rand()*.6}));
  this.clouds=Array.from({length:10},()=>({x:rand(),y:.05+rand()*.7,size:.25+rand()*.3,speed:.3+rand()*.6}));
  this.cinema=new SyolanaCinema(this.canvas.parentElement);this.resize();this.makeTextures();
  addEventListener('resize',()=>this.resize(),{passive:true,signal:lifetime.signal});
  if(matchMedia('(pointer:fine)').matches)addEventListener('pointermove',e=>{this.targetPointer.x=(e.clientX/innerWidth-.5)*2;this.targetPointer.y=(e.clientY/innerHeight-.5)*2;},{passive:true,signal:lifetime.signal});
  this.loadedAt={window:-100};
  this.ready=this.loadImage('window').then(()=>{if(disposed)return;this.needs=true;document.body.dataset.worldReady='true';document.body.dataset.imagesReady='1';this.preloadImages();}).catch(()=>{document.body.dataset.imageFallback='true';});
 }
 async loadImage(key){const im=new Image(),loaded=new Promise((ok,fail)=>{im.onload=ok;im.onerror=fail;});im.src=ASSETS.images[key];await loaded;await im.decode?.().catch(()=>{});this.images[key]=im;this.loadedAt[key]=this.t;this.needs=true;return im;}
 async preloadImages(){for(const key of this.imageKeys.filter(k=>k!=='window')){if(disposed)return;await new Promise(ok=>{if('requestIdleCallback'in window)requestIdleCallback(ok,{timeout:700});else setTimeout(ok,100);});try{await this.loadImage(key);document.body.dataset.imagesReady=String(Object.keys(this.images).length);}catch{document.body.dataset.imageFallback='true';}}}
 plateLayers(){const out=[];for(const layer of this.shot.layers){const wanted=this.director.imageKey(this.director.shots[layer.key],this.w,this.h);const ready=!!this.images[wanted],k=ready?(settings.motion?Math.min(1,Math.max(0,this.t-this.loadedAt[wanted])/1.4):1):0;if(k<1)out.push({...layer,image:'window',weight:layer.weight*(1-k)});if(k>0)out.push({...layer,image:wanted,weight:layer.weight*k});}return out;}
 resize(){if(disposed)return;const rect=this.canvas.parentElement.getBoundingClientRect();const w=Math.round(rect.width),h=Math.round(rect.height);if(this.w&&Math.abs(this.w-w)<2&&Math.abs(this.h-h)<100)return;
  this.w=w;this.h=h;const low=(navigator.deviceMemory||8)<=2;this.dpr=Math.min(devicePixelRatio||1,1,(low?1080:1440)/Math.max(w,h));this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.cinema?.resize(w,h,this.dpr);this.needs=true;
 }
 makeTextures(){this.haze=document.createElement('canvas');this.haze.width=this.haze.height=256;let c=this.haze.getContext('2d'),g=c.createRadialGradient(128,128,2,128,128,128);g.addColorStop(0,'rgba(173,175,202,.22)');g.addColorStop(.4,'rgba(142,150,186,.13)');g.addColorStop(1,'rgba(142,150,186,0)');c.fillStyle=g;c.fillRect(0,0,256,256);
  this.glow=document.createElement('canvas');this.glow.width=this.glow.height=64;c=this.glow.getContext('2d');g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,231,183,.96)');g.addColorStop(.2,'rgba(255,204,127,.52)');g.addColorStop(1,'rgba(255,173,97,0)');c.fillStyle=g;c.fillRect(0,0,64,64);
 }
 setScene(index){this.scene=SCENES[index];this.target=this.keys.map(k=>k===this.scene.image?1:0);this.needs=true;}
 activate(){this.pulse=this.t;this.needs=true;}
 cover(im,weight,scale=1,dx=0,dy=0){if(!im?.naturalWidth||weight<.001)return;const c=this.ctx,w=this.w,h=this.h,s=Math.max(w/im.naturalWidth,h/im.naturalHeight)*scale;const iw=im.naturalWidth*s,ih=im.naturalHeight*s;c.globalAlpha=weight;c.drawImage(im,(w-iw)/2+dx,(h-ih)/2+dy,iw,ih);}
 spot(x,y,r,color,alpha){const c=this.ctx,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${alpha})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 draw(time,dt){if(!this.ctx)return;const animated=settings.motion;this.shot=this.director.update(dt,currentScene,currentParagraph,animated);let changed=false;const smooth=1-Math.exp(-dt/(reduced.matches ? .65 : 2.65));
  for(let i=0;i<this.weights.length;i++){const next=this.weights[i]+(this.target[i]-this.weights[i])*smooth;changed ||=Math.abs(next-this.target[i])>.001;this.weights[i]=next;}
  for(const key of Object.keys(this.values)){const target=this.scene.visual[key];this.values[key]+=(target-this.values[key])*smooth;changed ||=Math.abs(target-this.values[key])>.002;}
  if(!animated&&!this.needs&&!changed)return;
  this.needs=changed;const c=this.ctx,w=this.w,h=this.h,p=this.story.compose(this.values,dt,currentParagraph,animated),t=animated?this.t:14;sound.setPreparation(this.story.frame.preparing);this.frameLayers=this.plateLayers();
  if(time-(this.diagnosticAt||0)>.6){this.diagnosticAt=time;this.canvas.dataset.blend=this.weights.map(n=>n.toFixed(3)).join(',');this.canvas.dataset.clock=this.t.toFixed(2);this.canvas.dataset.story=JSON.stringify({wave:this.story.frame.wave,preparing:this.story.frame.preparing,counts:this.story.counts});}
  if(animated)this.t+=dt;
  this.pointer.x+=(this.targetPointer.x-this.pointer.x)*(1-Math.exp(-dt*2.5));this.pointer.y+=(this.targetPointer.y-this.pointer.y)*(1-Math.exp(-dt*2.5));
  const px=animated?this.pointer.x:0,py=animated?this.pointer.y:0;
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.globalAlpha=1;c.globalCompositeOperation='source-over';c.fillStyle='#000';c.fillRect(0,0,w,h);
  // Additive pre-multiplied scene blend: no dip through black between pictures.
  c.globalCompositeOperation='lighter';
  for(const layer of this.frameLayers){const imageKey=layer.image,v=this.director.plateTransform(layer,w,h,this.images[imageKey]);this.cover(this.images[imageKey],layer.weight,v.scale,v.dx+px*9,v.dy+py*5);}
  c.globalCompositeOperation='source-over';c.globalAlpha=1;
  c.fillStyle=`rgba(5,29,36,${p.cold*.11})`;c.fillRect(0,0,w,h);
  c.fillStyle=`rgba(8,7,19,${p.dim*.11})`;c.fillRect(0,0,w,h);
  const exterior=0,inside=1;
  // Rain and clouds stay at the window in each camera angle, including reverse shots.
  const windows={'window':[0,0,.54,1],'hearth':[0,0,.30,.84],'hearth-portrait':[0,0,.53,.75],'candles':[0,0,.46,.87],'desk':[0,0,.66,.60]};
  for(const layer of this.frameLayers){if(layer.weight<.004)continue;const spec=this.director.shots[layer.key],imageKey=layer.image,im=this.images[imageKey];if(!im?.naturalWidth)continue;const v=this.director.plateTransform(layer,w,h,im),ss=Math.max(w/im.naturalWidth,h/im.naturalHeight)*v.scale,iw=im.naturalWidth*ss,ih=im.naturalHeight*ss,x0=(w-iw)/2+v.dx+px*9,y0=(h-ih)/2+v.dy+py*5,rr=windows[imageKey];
   c.save();c.beginPath();c.rect(x0+rr[0]*iw,y0+rr[1]*ih,rr[2]*iw,rr[3]*ih);c.clip();
   for(const cloud of this.clouds){const xx=((cloud.x+t*.009*cloud.speed)%1.7-.35)*w,yy=cloud.y*h,size=cloud.size*w;c.globalAlpha=layer.weight*p.cloud*.65;c.drawImage(this.haze,xx-size*.5,yy-size*.35,size*1.6,size*.7);}c.globalAlpha=layer.weight;
   for(const r of this.rain){const z=r.z,xx=((r.x+t*.009*z)%1.15-.05)*w,yy=((r.y+t*(.10+z*.19))%1.18-.12)*h;c.strokeStyle=`rgba(207,235,244,${p.rain*spec.rain*(.28+.40*z)})`;c.lineWidth=.8+z*1.1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx-5*z,yy+12+z*25);c.stroke();}c.restore();
  }
  // Moving volumetric cones from warm lamps, not from an invented daytime sun.
  c.save();c.globalCompositeOperation='screen';
  for(let i=0;i<3;i++){const ax=(i===0?.12:i===1?.5:.86)*w+Math.sin(t*.20+i)*w*.045,ay=(i===1?.13:.37)*h;const endx=ax+Math.sin(t*.15+i)*w*.16;const g=c.createLinearGradient(ax,ay,endx,h);g.addColorStop(0,`rgba(250,211,166,${(.09+p.warm*.13)*(.6+inside*.4)})`);g.addColorStop(1,'rgba(208,190,226,0)');c.fillStyle=g;c.beginPath();c.moveTo(ax-7,ay);c.lineTo(ax+8,ay);c.lineTo(endx+w*.17,h);c.lineTo(endx-w*.12,h);c.closePath();c.fill();}
  this.spot(w*(.16+Math.sin(t*.04)*.015),h*.49,w*.36,'255,188,89',.12+p.warm*.27);
  this.spot(w*(.82+Math.sin(t*.034)*.02),h*.63,w*.35,'42,192,180',.10+p.cold*.22);
  if(p.magic>.01)this.spot(w*.27,h*.72,w*.51,'255,179,56',p.magic*(.30+.045*Math.sin(t*.37)));
  if(p.emerald>.01)this.spot(w*.72,h*.81,w*.36,'75,240,175',p.emerald*.32);
  // Dust in the lamplight; magical sparks become warmer and more numerous later.
  for(let i=0;i<this.motes.length;i++){const m=this.motes[i];if(i>39&&p.magic<.15&&p.emerald<.3)continue;const z=m.z,xx=((m.x+Math.sin(t*.16*m.speed+m.phase)*.11+t*.0028*z)%1.15-.05)*w+px*z*15,yy=((m.y-t*.010*z+Math.cos(t*.18+m.phase)*.06)%1.15+1.15)%1.15*h-h*.05;const radius=(2.6+z*4.9)*(1+p.magic*.6);c.globalAlpha=(.18+.32*z)*(i>39?Math.max(p.magic,p.emerald*.6):.85)*(.85+.15*Math.sin(t*.55+m.phase))*(p.particleGain??1);c.drawImage(this.glow,xx-radius*3,yy-radius*3,radius*6,radius*6);}
  c.globalAlpha=1;
  if(p.magic>.03){c.save();c.lineCap='round';c.setLineDash([5,24,2,44]);c.lineDashOffset=-t*7;for(let i=0;i<5;i++){c.strokeStyle=`rgba(241,177,102,${p.magic*.21})`;c.lineWidth=1.2;c.beginPath();c.moveTo(w*(.08+i*.045),h*.98);c.bezierCurveTo(w*(.04+i*.12),h*.58,w*(.05+i*.17),h*.39,w*(.1+i*.21),h*.09);c.stroke();}c.restore();}
  c.restore();
  // Soft, moving shelf shadows occupy the edges, never a flashing overlay.
  const shadow=.20+p.shadow*.24;
  this.spot(-w*.18+Math.sin(t*.13)*w*.075,h*.45,w*.67,'5,5,16',shadow);
  this.spot(w*1.18+Math.cos(t*.11)*w*.06,h*.6,w*.62,'5,5,16',shadow);
  const vignette=c.createRadialGradient(w*.5,h*.48,w*.15,w*.5,h*.48,Math.max(w,h)*.82);vignette.addColorStop(0,'rgba(12,9,23,0)');vignette.addColorStop(1,'rgba(12,9,23,.22)');c.fillStyle=vignette;c.fillRect(0,0,w,h);c.globalAlpha=1;
  this.cinema.framePlates=this.frameLayers.filter(l=>l.weight>.002).map(layer=>{const spec=this.director.shots[layer.key],imageKey=layer.image,im=this.images[imageKey],v=this.director.plateTransform(layer,w,h,im);let rect=[0,0,1,1];if(im?.naturalWidth){const sz=Math.max(w/im.naturalWidth,h/im.naturalHeight)*v.scale,iw=im.naturalWidth*sz,ih=im.naturalHeight*sz;rect=[((w-iw)/2+v.dx+px*9)/w,((h-ih)/2+v.dy+py*5)/h,iw/w,ih/h];}return{...layer,image:imageKey,shadow:spec.cast,rect};});
  this.cinema.shot=this.shot;this.cinema.story=this.story.frame;this.cinema.render(dt,p,this.weights,null,animated);this.canvas.dataset.plates=this.cinema.framePlates.map(p=>p.image).join(',');this.canvas.dataset.shot=this.shot.key;this.canvas.dataset.shotNumber=String(this.shot.number);this.canvas.dataset.shotElapsed=this.shot.elapsed.toFixed(2);


 }
}
const world=new World();

/* A sample-based adaptive score. Audio starts only after a deliberate gesture. */
function soundUI(s){if(disposed)return;const on=s.enabled;document.body.classList.toggle('sound-on',on);document.body.dataset.audioState=s.ctx?.state||'off';document.body.dataset.audioStems=String(s.sources.size);document.body.dataset.piano=s.currentPiano?.name||'';document.body.dataset.phraseChanges=String(s.phraseChanges);$('#sound-toggle').setAttribute('aria-pressed',String(on));$('#sound-toggle').setAttribute('aria-label',on?'Выключить звуки истории':'Включить звуки истории');$('#sound-toggle').setAttribute('aria-busy',String(s.pending));$('#sound-use').setAttribute('href',on?'#i-sound':'#i-mute');$('#cover-sound span').textContent=s.pending?'Подготавливаем звуки…':on?'Звуки включены':'Со звуками истории';$('#settings-sound').textContent=s.pending?'Подготавливаем…':on?'Выключить звук':'Включить звук';}
const sound=new SyolanaSoundtrack({assets:ASSETS,settings:()=>settings,toast,onState:soundUI,prime:()=>cueEngine.prime()});

/* Events belong to exact phrases, not paragraphs or long ambient loops. */
const cueEngine={
 items:$$('[data-cue]'),fired:new Set(loaded?.fired||[]),candidate:null,previousY:scrollY,lastFire:-10000,positions:[],suppressUntil:0,
 refresh(){this.positions=this.items.map(el=>{const rr=el.getClientRects(),r=rr[rr.length-1]||el.getBoundingClientRect();return{el,y:r.top+scrollY+r.height*.65};});},
 prime(line=scrollY+innerHeight*.49){this.refresh();this.previousY=scrollY;for(const p of this.positions)if(p.y<line-45)this.fired.add(p.el.id);world.story.sync(this.fired);this.candidate=null;},
 suppress(ms=800){this.suppressUntil=performance.now()+ms;this.candidate=null;},
 fire(el,manual=false){if(disposed)return;if(!manual&&this.fired.has(el.id))return;const name=el.dataset.cue,paragraph=+el.closest('[data-paragraph]').dataset.paragraph,kind=world.story.trigger(name,paragraph,el.id),delay=kind==='impact'?.22:kind==='document'?.55:0;const played=sound.play(name,+(el.dataset.pan||0),1,delay);this.fired.add(el.id);this.lastFire=performance.now();if(kind){world.director.pin(kind==='document'?'document-shadow':kind==='impact'?'candle-light':kind==='seal'?'window-deep':'ink-light',kind==='seal'?9:7);sound.moment(kind);}world.needs=true;document.body.dataset.lastCue=el.id;document.body.dataset.lastCueAudio=String(played);persist();},
 check(now){const delta=scrollY-this.previousY;this.previousY=scrollY;if(!reading||document.hidden||$$('dialog[open]').length||now<this.suppressUntil){this.candidate=null;return;}const line=scrollY+innerHeight*.49;
  if(delta< -2||delta>innerHeight*.25){this.candidate=null;if(delta>innerHeight*.25)this.prime(line);return;}
  const eligible=this.positions.find(p=>!this.fired.has(p.el.id)&&p.y>=line-55&&p.y<=line+16);if(!eligible){this.candidate=null;return;}
  if(!this.candidate||this.candidate.id!==eligible.el.id){this.candidate={id:eligible.el.id,since:now};return;}
  if(now-this.candidate.since>620&&now-this.lastFire>1100){this.fire(eligible.el);this.candidate=null;}
 }
};
for(const el of cueEngine.items){el.addEventListener('click',()=>cueEngine.fire(el,true));el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();cueEngine.fire(el,true);}});}
world.story.sync(cueEngine.fired);

const paragraphs=$$('.book-paragraph'),navlinks=$$('#scene-nav a'),pageContent=$('main'),metrics={paragraphs:[],scenes:[],first:0,last:1,contentTop:0,contentHeight:0};
function measure(){if(disposed)return;metrics.paragraphs=paragraphs.map(el=>{const r=el.getBoundingClientRect();return{top:r.top+scrollY,bottom:r.bottom+scrollY,height:r.height};});metrics.scenes=SCENES.map(s=>s.paragraph<0?0:metrics.paragraphs[s.paragraph].top);metrics.first=metrics.paragraphs[0].top;metrics.last=metrics.paragraphs.at(-1).bottom;const content=pageContent.getBoundingClientRect();metrics.contentTop=content.top+scrollY;metrics.contentHeight=content.height;cueEngine.refresh();world.needs=true;}
let measureTimer,scrollTimer;
function remeasure(){clearTimeout(measureTimer);measureTimer=setTimeout(measure,80);}
function sceneTo(index){index=Math.max(0,Math.min(SCENES.length-1,index));if(currentScene===index)return;currentScene=index;world.setScene(index);sound.moodTo(SCENES[index].music);$('#dock-scene').textContent=SCENES[index].label;document.body.dataset.scene=String(index);navlinks.forEach(a=>{const active=+a.dataset.sceneLink===index;a.classList.toggle('active',active);if(active)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});$('#previous-scene').disabled=index<=1;$('#next-scene').disabled=index>=SCENES.length-1;}
function updateReading(){if(!metrics.paragraphs.length)return;const line=scrollY+innerHeight*.49;reading=line>=metrics.first-80&&line<=metrics.last+innerHeight*.45;
 // Leave actual clear space for fixed branding; no extra blur, panel or opacity.
 const topClip=Math.max(0,Math.min(metrics.contentHeight,scrollY+92-metrics.contentTop));
 const bottomClip=Math.max(0,Math.min(metrics.contentHeight,metrics.contentTop+metrics.contentHeight-(scrollY+innerHeight-76)));
 pageContent.style.clipPath=`inset(${Math.round(topClip)}px 0 ${Math.round(bottomClip)}px 0)`;
 let lo=0,hi=metrics.paragraphs.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(metrics.paragraphs[mid].top<=line)lo=mid;else hi=mid-1;}currentParagraph=lo;
 let scene=0;for(let i=1;i<SCENES.length;i++){if(line>=metrics.scenes[i])scene=i;else break;}sceneTo(scene);
 if(world.cinema.setParagraph(line<metrics.first-80?-1:currentParagraph,currentScene))world.needs=true;
 const progress=Math.max(0,Math.min(1,(line-metrics.first)/(metrics.last-metrics.first)));$('#progress-fill').style.transform=`scaleX(${progress})`;$('#progress-text').textContent=Math.round(progress*100)+'%';document.body.dataset.progress=String(Math.round(progress*100));
 $('#reading-dock').hidden=!reading;
 if(reading){const m=metrics.paragraphs[currentParagraph];lastPlace={paragraph:currentParagraph,anchor:BOOK.anchors[currentParagraph],fraction:Math.max(0,Math.min(1,(line-m.top)/m.height))};$('#resume-reading').hidden=false;}
}
function navigateScene(index){const s=SCENES[Math.max(1,Math.min(SCENES.length-1,index))];const el=$('#p-'+s.paragraph);if(el){const r=el.getBoundingClientRect();scrollTo({top:scrollY+r.top+Math.min(60,r.height*.22)-innerHeight*.49,behavior:reduced.matches?'instant':'smooth'});}cueEngine.suppress();}
$('#previous-scene').addEventListener('click',()=>navigateScene(currentScene-1));$('#next-scene').addEventListener('click',()=>navigateScene(currentScene+1));
addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(persist,240);},{passive:true,signal:lifetime.signal});addEventListener('resize',remeasure,{passive:true,signal:lifetime.signal});document.fonts?.ready.then(measure);

function syncSettings(){root.style.setProperty('--book-size',settings.font+'px');root.style.setProperty('--book-line',settings.line);root.style.setProperty('--shade',settings.shade/100);root.style.setProperty('--book-font',settings.face==='serif'?"Georgia,'Times New Roman',serif":'var(--body)');
 const values={'font-size':settings.font,'line-height':settings.line,shade:settings.shade,'music-volume':settings.music,'effects-volume':settings.fx};for(const[id,v]of Object.entries(values))$('#'+id).value=v;
 $('#font-value').textContent=settings.font+' px';$('#line-value').textContent=String(settings.line).replace('.',',');$('#shade-value').textContent=settings.shade+'%';$('#music-value').textContent=settings.music+'%';$('#effects-value').textContent=settings.fx+'%';$('#motion').checked=settings.motion;$('#effects').checked=settings.effects;
 $$('[data-font]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.font===settings.face)));sound.applyLevels();world.needs=true;remeasure();persist();}
for(const[id,key]of Object.entries({'font-size':'font','line-height':'line',shade:'shade','music-volume':'music','effects-volume':'fx'}))$('#'+id).addEventListener('input',e=>{settings[key]=+e.target.value;syncSettings()});
$$('[data-font]').forEach(el=>el.addEventListener('click',()=>{settings.face=el.dataset.font;syncSettings()}));
$('#motion').addEventListener('change',e=>{settings.motion=e.target.checked;world.needs=true;persist()});$('#effects').addEventListener('change',e=>{settings.effects=e.target.checked;if(!settings.effects)sound.stopEffects();cueEngine.prime();persist()});
$('#reset-settings').addEventListener('click',()=>{settings={...defaults};syncSettings();toast('Исходные настройки восстановлены.');});
$('#sound-toggle').addEventListener('click',()=>sound.enable(!sound.desired));$('#settings-sound').addEventListener('click',()=>sound.enable(!sound.desired));$('#cover-sound').addEventListener('click',()=>sound.enable(true));
$('#fullscreen-button').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if(root.requestFullscreen)await root.requestFullscreen();else toast('Разверни страницу через меню браузера.');}catch{toast('Этот браузер не поддерживает полноэкранный режим.');}});
function openDialog(id){const dialog=$('#'+id);if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');cueEngine.candidate=null;}
$('#settings-contents').addEventListener('click',()=>{$('#settings-dialog').close();openDialog('contents-dialog')});
$$('[data-open-settings]').forEach(b=>b.addEventListener('click',()=>openDialog('settings-dialog')));$('#contents-button').addEventListener('click',()=>openDialog('contents-dialog'));$('#about-button').addEventListener('click',()=>openDialog('about-dialog'));
$$('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>b.closest('dialog').close()));
$$('dialog').forEach(dialog=>{dialog.addEventListener('click',e=>{if(e.target!==dialog)return;const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();});dialog.addEventListener('close',()=>{remeasure();cueEngine.prime()})});
$$('.contents-nav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();$('#contents-dialog').close();navigateScene(+a.dataset.sceneLink)}));
navlinks.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();navigateScene(+a.dataset.sceneLink)}));
function goPlace(place,reset=false){measure();const p=readingStore.locate(place);if(!p)return;const m=metrics.paragraphs[p.paragraph],line=m.top+m.height*p.fraction;cueEngine.suppress(900);if(reset){cueEngine.fired.clear();world.story.reset();cueEngine.prime(line);}scrollTo({top:Math.max(0,line-innerHeight*.49),behavior:reduced.matches?'instant':'smooth'});lastPlace=p;persist();}
function goParagraph(paragraph,fraction=.22){goPlace({paragraph,fraction});}
if(saved)$('#resume-reading').hidden=false;
$('#resume-reading').addEventListener('click',e=>{e.preventDefault();if(lastPlace||saved)goPlace(lastPlace||saved);});
$('#start-reading').addEventListener('click',()=>{cueEngine.fired.clear();cueEngine.candidate=null;world.story.reset();});
installSyolanaReaderTools({book:BOOK,store:readingStore,place:()=>lastPlace,go:goParagraph,restore:place=>{saved=place;goPlace(place,true);$('#resume-reading').hidden=false;},open:openDialog,toast});
let raf=0,lastFrame=0;
function frame(now){if(disposed||document.hidden)return;raf=requestAnimationFrame(frame);if(now-lastFrame<32)return;const dt=Math.min(.5,(now-(lastFrame||now))/1000);lastFrame=now;updateReading();cueEngine.check(now);world.draw(now/1000,dt);}
document.addEventListener('visibilitychange',()=>{sound.visibility();if(document.hidden){cancelAnimationFrame(raf);persist();cueEngine.candidate=null;}else{lastFrame=0;measure();cueEngine.prime();raf=requestAnimationFrame(frame)}},{signal:lifetime.signal});
addEventListener('pagehide',()=>{persist();sound.stopEffects()},{signal:lifetime.signal});
syncSettings();measure();sound.moodTo(SCENES[0].music);world.ready.then(()=>{measure();updateReading()});raf=requestAnimationFrame(frame);
window.SyolanaImmersion={ready:true,destroy(){if(disposed)return;persist();disposed=true;lifetime.abort();cancelAnimationFrame(raf);clearTimeout(measureTimer);clearTimeout(scrollTimer);clearTimeout(toastTimer);sound.destroy();for(const c of document.querySelectorAll('.world canvas')){c.width=1;c.height=1;c.remove();}world.images={};pageContent.style.removeProperty('clip-path');document.body.dataset.worldReady='false';document.body.dataset.audioState='closed';}};
// Expose a small read-only QA summary without storing or transmitting reader data.
window.SyolanaPreview={version:'MM06',get state(){return{scene:currentScene,paragraph:currentParagraph,audio:sound.enabled,audioState:sound.ctx?.state||'off',musicStems:[],cueCount:cueEngine.items.length,phraseChanges:sound.phraseChanges,bookmarkKey:readingStore.key,cuesPlayed:[...cueEngine.fired],motion:settings.motion,settings:{...settings},imageCount:Object.keys(world.images).length}},get audioContext(){return sound.ctx},get soundtrack(){return sound}};
})();

})();