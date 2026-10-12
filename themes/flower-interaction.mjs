const TAU=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const wrap=(v,n)=>((v%n)+n)%n;
export function quaternionMultiply(a,b){return[a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2]];}
const axis=(n,a)=>[n[0]*Math.sin(a/2),n[1]*Math.sin(a/2),n[2]*Math.sin(a/2),Math.cos(a/2)];
const inverse=q=>[-q[0],-q[1],-q[2],q[3]];
export function rotateVector(q,v){const t=[2*(q[1]*v[2]-q[2]*v[1]),2*(q[2]*v[0]-q[0]*v[2]),2*(q[0]*v[1]-q[1]*v[0])];return[v[0]+q[3]*t[0]+q[1]*t[2]-q[2]*t[1],v[1]+q[3]*t[1]+q[2]*t[0]-q[0]*t[2],v[2]+q[3]*t[2]+q[0]*t[1]-q[1]*t[0]];}
function blendRotation(a,b,t){let dot=a.reduce((s,v,i)=>s+v*b[i],0),end=b;if(dot<0){end=b.map(v=>-v);dot=-dot;}let q;if(dot>.9995)q=a.map((v,i)=>v+(end[i]-v)*t);else{const theta=Math.acos(clamp(dot,-1,1)),s=Math.sin(theta);q=a.map((v,i)=>(v*Math.sin((1-t)*theta)+end[i]*Math.sin(t*theta))/s);}const length=Math.hypot(...q);return q.map(v=>v/length);}
export function flowerBasePose(field,id,time,eye,travel){
 const f=field.flowers[id],detail=field.groups[id%5].b.slice(Math.floor(id/5)*4,Math.floor(id/5)*4+4),seed=f[3];
 return{id,species:id%5,seed,scale:f[4],position:[wrap(f[0]-eye[0]+46,92)-46+eye[0]+Math.sin(time*.19+seed)*.75,wrap(f[1]-eye[1]+36,72)-36+eye[1]+Math.sin(time*.27+seed)*1.1,wrap(f[2]+travel+120,156)-120+Math.sin(time*.23+seed)*.8],rotation:quaternionMultiply(quaternionMultiply(axis([0,0,1],seed+time*(.027+.013*Math.sin(seed))),axis([0,1,0],detail[0]+time*.033)),axis([1,0,0],detail[1]+Math.sin(time*.19+seed)*.21))};
}
export function createFlowerControl(field){
 const states=field.flowers.map(()=>({offset:[0,0,0],target:[0,0,0],rotation:[0,0,0,1],turn:[0,0,0,1],hold:null}));let selected=-1,poses=[],bases=[],env={eye:[0,2.5,24],height:960},previous=null;
 const release=()=>{if(selected<0)return;const state=states[selected],pose=poses[selected],base=bases[selected];if(pose&&base){state.offset=pose.position.map((v,i)=>v-base.position[i]);state.target=[...state.offset];state.rotation=quaternionMultiply(pose.rotation,inverse(base.rotation));state.turn=[...state.rotation];}state.hold=null;selected=-1;};
 return{get selected(){return selected;},get poses(){return poses;},select(id){if(id===selected||!states[id]||!poses[id])return selected;release();selected=id;states[id].hold={position:poses[id].position.map((v,i)=>v-states[id].offset[i]),rotation:quaternionMultiply(inverse(states[id].rotation),poses[id].rotation)};return selected;},clear:release,
  rotate(dx,dy){if(selected<0)return false;const s=states[selected],q=quaternionMultiply(axis([0,1,0],dx*5),axis([1,0,0],-dy*5));s.turn=quaternionMultiply(q,s.turn);const n=Math.hypot(...s.turn);s.turn=s.turn.map(v=>v/n);return true;},
  move(dx,dy,dz){if(selected<0)return false;const s=states[selected],pose=poses[selected],depth=Math.max(5,env.eye[2]-pose.position[2]),scale=260*2*Math.tan(.5)*depth/env.height;s.target[0]+=dx*scale;s.target[1]+=dy*scale;s.target[2]=clamp(s.target[2]+dz*6,-145-s.hold.position[2],env.eye[2]-5-s.hold.position[2]);return true;},
  step(time,eye,travel,height=960){env={eye,height};const dt=previous===null?0:clamp(time-previous,0,.1),blend=1-Math.exp(-dt*14);previous=time;bases=field.flowers.map((_,id)=>flowerBasePose(field,id,time,eye,travel));
   poses=bases.map((base,id)=>{const s=states[id],origin=s.hold||base;s.offset=s.offset.map((v,i)=>v+clamp((s.target[i]-v)*blend,-80*dt,80*dt));s.rotation=blendRotation(s.rotation,s.turn,blend);const position=origin.position.map((v,i)=>v+s.offset[i]);if(id!==selected){position[0]=wrap(position[0]-eye[0]+46,92)-46+eye[0];position[1]=wrap(position[1]-eye[1]+36,72)-36+eye[1];position[2]=wrap(position[2]+120,156)-120;}return{...base,position,rotation:quaternionMultiply(s.rotation,origin.rotation)};});return poses;
  },
 };
}
function triangleHit(o,d,p,ia,ib,ic){
 const ax=p[ia],ay=p[ia+1],az=p[ia+2],e1=[p[ib]-ax,p[ib+1]-ay,p[ib+2]-az],e2=[p[ic]-ax,p[ic+1]-ay,p[ic+2]-az],h=[d[1]*e2[2]-d[2]*e2[1],d[2]*e2[0]-d[0]*e2[2],d[0]*e2[1]-d[1]*e2[0]],det=e1[0]*h[0]+e1[1]*h[1]+e1[2]*h[2];if(Math.abs(det)<1e-9)return Infinity;
 const f=1/det,s=[o[0]-ax,o[1]-ay,o[2]-az],u=f*(s[0]*h[0]+s[1]*h[1]+s[2]*h[2]);if(u<0||u>1)return Infinity;const q=[s[1]*e1[2]-s[2]*e1[1],s[2]*e1[0]-s[0]*e1[2],s[0]*e1[1]-s[1]*e1[0]],v=f*(d[0]*q[0]+d[1]*q[1]+d[2]*q[2]);if(v<0||u+v>1)return Infinity;const t=f*(e2[0]*q[0]+e2[1]*q[1]+e2[2]*q[2]);return t>0?t:Infinity;
}
export function pickFlower(poses,geometry,{eye,view,width,height},x,y){
 const sx=(x/width*2-1)*Math.tan(.5)*width/height,sy=(1-y/height*2)*Math.tan(.5),ray=[0,1,2].map(i=>-view[i*4+2]+view[i*4]*sx+view[i*4+1]*sy),length=Math.hypot(...ray),d=ray.map(v=>v/length);let hit=-1,nearest=Infinity,small=-1,smallScore=Infinity;
 for(const pose of poses){
  const delta=pose.position.map((v,i)=>v-eye[i]),along=delta.reduce((sum,v,i)=>sum+v*d[i],0),radius=2*pose.scale;if(along<5||along>160)continue;
  const perpendicular=Math.max(0,delta.reduce((sum,v)=>sum+v*v,0)-along*along),touchRadius=Math.max(.4*pose.scale,18*2*Math.tan(.5)*along/height);
  if(perpendicular<touchRadius*touchRadius){const score=Math.sqrt(perpendicular)/touchRadius+along*.0005;if(score<smallScore){smallScore=score;small=pose.id;}}
  if(perpendicular>radius*radius)continue;
  const q=inverse(pose.rotation),o=rotateVector(q,delta.map(v=>-v)).map(v=>v/pose.scale),localD=rotateVector(q,d).map(v=>v/pose.scale),g=geometry[pose.species];
  for(let i=0;i<g.indices.length;i+=3){const t=triangleHit(o,localD,g.positions,g.indices[i]*3,g.indices[i+1]*3,g.indices[i+2]*3);if(t<nearest){nearest=t;hit=pose.id;}}
 }return hit>=0?hit:small;
}
