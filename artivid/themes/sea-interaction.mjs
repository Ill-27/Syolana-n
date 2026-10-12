const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const random=n=>{const x=Math.sin(n*127.1+17.7)*43758.5453;return x-Math.floor(x);};

// A reproducible, irregular storm: a short return stroke, a weaker second
// stroke, then thunder arriving at the speed of sound from the same location.
export function stormStrike(time,storm=1){
 const cycle=Math.floor(time/13),start=cycle*13+2.2+random(cycle+3)*5.5,age=time-start;
 const distance=950+random(cycle+11)*1700;
 const flash=storm>.45&&age>=0&&age<.7
  ? storm*(Math.exp(-age*28)+.55*Math.exp(-Math.pow((age-.19)/.028,2))+.20*Math.exp(-Math.pow((age-.34)/.042,2))) : 0;
 return{id:cycle,start,age,flash,delay:distance/343,distance,pan:(random(cycle+17)-.5)*1.5,seed:cycle+31};
}
export function lightningBranches(seed){
 const points=[[0,0]],branches=[];let x=0;
 for(let i=1;i<=17;i++){x+=(random(seed+i*3.1)-.5)*.11;points.push([x,i/17]);}
 branches.push(points);
 for(const i of [5,9,12]){const root=points[i],side=random(seed+i)>.5?1:-1,p=[root];
  for(let j=1;j<6;j++)p.push([root[0]+side*j*.034+(random(seed+i*9+j)-.5)*.04,root[1]+j*.035]);branches.push(p);}
 return branches;
}
export function fleetPosition(slot,time,routeZ,aspect){
 const phase=time*.016+slot*2.1,lane=Math.min(1,aspect*1.7);
 return{x:([-11,48,-62][slot]+Math.sin(phase)*[8,12,14][slot])*lane,z:routeZ-[145,290,365][slot]+Math.cos(phase)*[22,35,42][slot],yaw:[-.52,.28,-.22][slot]+Math.sin(phase*.7)*.065};
}
export function projectPoint(matrix,point){
 const q=[0,0,0,0];for(let row=0;row<4;row++)q[row]=matrix[row]*point[0]+matrix[4+row]*point[1]+matrix[8+row]*point[2]+matrix[12+row];
 return q[3]>.1?[(q[0]/q[3]+1)/2,(1-q[1]/q[3])/2,q[3]]:null;
}
function triangleDepth(point,a,b,c){
 if(!a||!b||!c)return Infinity;
 const den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<1e-10)return Infinity;
 const u=((b[1]-c[1])*(point[0]-c[0])+(c[0]-b[0])*(point[1]-c[1]))/den,v=((c[1]-a[1])*(point[0]-c[0])+(a[0]-c[0])*(point[1]-c[1]))/den;
 return u>=0&&v>=0&&u+v<=1?1/(u/a[2]+v/b[2]+(1-u-v)/c[2]):Infinity;
}
export function pickShip(ships,matrix,x,y,width,height){
 const point=[x/width,y/height];let hit=-1,depth=Infinity;
 for(const ship of ships){if(!ship)continue;
  const local=(xx,yy,zz)=>{
   const cy=Math.cos(ship.yaw),sy=Math.sin(ship.yaw),cp=Math.cos(ship.pitch||0),sp=Math.sin(ship.pitch||0),cr=Math.cos(ship.roll||0),sr=Math.sin(ship.roll||0);
   const X=(xx*cy+zz*sy)*ship.scale,Z=(-xx*sy+zz*cy)*ship.scale,Y=yy*ship.scale,Y1=Y*cp-Z*sp,Z1=Y*sp+Z*cp;
   return projectPoint(matrix,[ship.x+X*cr-Y1*sr,ship.y+X*sr+Y1*cr,ship.z+Z1]);
  };
  const quad=(a,b,c,d)=>{const p=[a,b,c,d].map(q=>local(...q));const z=Math.min(triangleDepth(point,p[0],p[1],p[2]),triangleDepth(point,p[0],p[2],p[3]));if(z<depth){depth=z;hit=ship.slot;}};
  // Test actual sail faces and the hull separately, so empty space under a
  // near ship's rigging cannot steal a tap on a smaller ship behind it.
  for(const m of ship.masts||[]){
   for(const [fy,fw,fh]of [[.44,1.90,.28],[.69,1.36,.18],[.86,.86,.12]]){
    const w=m.w*fw*.5,lo=m.h*(fy-fh*.5),hi=m.h*(fy+fh*.5),z=m.z-.12;quad([-w,lo,z],[w,lo,z],[w,hi,z],[-w,hi,z]);}
   quad([-.18,1.8,m.z],[.18,1.8,m.z],[.18,m.h+1.5,m.z],[-.18,m.h+1.5,m.z]);
  }
  for(const side of [-1,1])quad([side*4.7,-2,-11],[side*4.7,-2,10],[side*4.7,4.5,10],[side*4.7,4.5,-11]);
  quad([-4.7,4.5,10],[4.7,4.5,10],[4.7,-2,10],[-4.7,-2,10]);
 }return hit;
}

export function createFleetControl(){
 let selected=-1,last=null;const offsets=Array.from({length:3},()=>({x:0,z:0,tx:0,tz:0,yaw:null}));
 return{
  get selected(){return selected;},select(slot){selected=slot;return slot>=0;},clear(){selected=-1;},
  move(dx,dy,dz){if(selected<0)return false;const p=offsets[selected];p.tx+=dx*74;p.tz-=dy*100+dz*18;return true;},
  step(time){const dt=last===null?0:clamp(time-last,0,.1);last=time;const a=1-Math.exp(-dt*11);
   for(const p of offsets){const dx=p.tx-p.x,dz=p.tz-p.z,length=Math.hypot(dx,dz),blend=length>0?Math.min(a,dt*180/length):0;p.x+=dx*blend;p.z+=dz*blend;
    if(Math.hypot(dx,dz)>.04){const heading=Math.atan2(-dx,-dz);p.yaw=p.yaw===null?heading:p.yaw+Math.atan2(Math.sin(heading-p.yaw),Math.cos(heading-p.yaw))*(1-Math.exp(-dt*3.5));}}
  },pose(slot,base){const p=offsets[slot];return{x:base.x+p.x,z:base.z+p.z,yaw:p.yaw??base.yaw};}
 };
}
