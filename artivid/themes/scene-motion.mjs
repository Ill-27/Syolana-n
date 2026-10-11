const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
// Integrate travel instead of multiplying total elapsed time by the current
// mode's speed. Switching modes therefore preserves the exact current pose.
export function createSceneMotion({rest=.4,flight=2.45,xLimit=1.45,yLimit=1}={}){
 let previous=null,travel=0,speed=rest;const input={x:0,y:0,z:0};
 return{step(time,camera){
  const dt=previous===null?0:clamp(time-previous,0,.1);
  if(previous===null)travel=time*rest;
  previous=time;speed+=((camera?flight:rest)-speed)*(1-Math.exp(-dt*1.2));travel+=speed*dt;
  const blend=1-Math.exp(-dt*4.2);
  for(const key of ['x','y','z']){const limit=key==='x'?xLimit:key==='y'?yLimit:1e6;input[key]+=(clamp(Number(camera?.[key])||0,-limit,limit)-input[key])*blend;}
  return{travel,input:{...input},speed};
 }};
}
