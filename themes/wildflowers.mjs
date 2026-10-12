const TAU=Math.PI*2;
const random=n=>{const x=Math.sin(n*127.1+19.7)*43758.5453;return x-Math.floor(x);};
function patch(rows,cols,sample,material=0){
 const positions=[],normals=[],uvs=[],indices=[];
 for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++){
  const u=i/rows,v=j/cols,e=.0004,p=sample(u,v),a=sample(Math.min(1,u+e),v).map((x,k)=>x-sample(Math.max(0,u-e),v)[k]),b=sample(u,Math.min(1,v+e)).map((x,k)=>x-sample(u,Math.max(0,v-e))[k]);
  const n=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],length=Math.hypot(...n);
  positions.push(...p);normals.push(...(length>1e-10?n.map(x=>x/length):[0,0,1]));uvs.push(u,v+material*2);
 }
 for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,a+1,b,b+1);}return{positions,normals,uvs,indices};
}
function merge(items){const out={positions:[],normals:[],uvs:[],indices:[]};for(const g of items){const offset=out.positions.length/3;for(const name of ['positions','normals','uvs'])out[name].push(...g[name]);out.indices.push(...g.indices.map(i=>i+offset));}return out;}
function sphere(center,radius,material){
 const g=patch(10,12,(u,v)=>{const a=u*Math.PI,b=v*TAU;return[center[0]+Math.sin(a)*Math.cos(b)*radius[0],center[1]+Math.sin(a)*Math.sin(b)*radius[1],center[2]+Math.cos(a)*radius[2]];},material);
 for(let i=0;i<g.positions.length;i+=3){const n=g.positions.slice(i,i+3).map((p,k)=>(p-center[k])/(radius[k]*radius[k])),l=Math.hypot(...n);g.normals.splice(i,3,...n.map(x=>x/l));}return g;
}
function tube(a,b,radius,material){return patch(6,6,(u,v)=>{const t=v*TAU;return[a[0]+(b[0]-a[0])*u+Math.cos(t)*radius,a[1]+(b[1]-a[1])*u,a[2]+(b[2]-a[2])*u+Math.sin(t)*radius];},material);}
export function wildflowerGeometry(species=0){
 const items=[],counts=[17,8,12,5,5],count=counts[species],rings=species===2?2:1;
 for(let ring=0;ring<rings;ring++)for(let i=0;i<count;i++){
  const angle=i/count*TAU+ring*.23,seed=i+species*31,asym=random(seed)*.07;
  const sample=(u,v)=>{
   const side=v*2-1,length=[.95,1.02,.85,1.08,.70][species]*(ring?.73:1),r=.16+u*length;
   let width=[.095,.39,.18,.53,.36][species]*Math.pow(Math.sin(Math.PI*u*.95),.62)+.018;
   if(species===1)width*=1-.07*Math.cos(side*3*Math.PI)*Math.pow(u,5);
   if(species===2)width*=1+.18*Math.sin(side*5*Math.PI)*Math.pow(u,5);
   const across=side*width;
   let height=.055+u*u*[.14,.32,.28,.55,.53][species]+across*across*[2.0,.7,1.3,.8,1.1][species]+Math.sin(u*4+seed)*asym;
   height+=Math.sin(u*17+side*9+seed)*Math.sin(Math.PI*u)*[.007,.010,.018,.038,.007][species];
   return[across*Math.cos(angle)-r*Math.sin(angle),across*Math.sin(angle)+r*Math.cos(angle),height+ring*.12];
  };
  items.push(patch(16,10,sample));
  const thick=.012;
  items.push(patch(16,10,(u,v)=>{const p=sample(u,1-v);return[p[0],p[1],p[2]-thick];}));
  for(const side of [0,1])items.push(patch(16,1,(u,v)=>{const p=sample(u,side);return[p[0],p[1],p[2]-v*thick];}));
 }
 const centerRadius=[.25,.17,.14,.21,.16][species];
 items.push(sphere([0,0,.08],[centerRadius,centerRadius,.14],species===3?5:3));
 for(let i=0;i<(species===0?31:19);i++){
  const angle=i*2.39996,r=(species===3?.23:centerRadius*.9)*Math.sqrt((i+.5)/(species===0?31:19)),x=Math.cos(angle)*r,y=Math.sin(angle)*r,z=.17+Math.sqrt(Math.max(0,1-r*r/(centerRadius*centerRadius)))*.12;
  items.push(sphere([x,y,z],[.025,.025,.025],4));
  if(species!==0)items.push(tube([x*.8,y*.8,.06],[x,y,z-.01],.009,3));
 }
 for(let i=0;i<5;i++){const angle=i/5*TAU;items.push(patch(10,6,(u,v)=>{const side=(v*2-1)*Math.sin(u*Math.PI)*.095,r=.10+u*.50;return[side*Math.cos(angle)-r*Math.sin(angle),side*Math.sin(angle)+r*Math.cos(angle),-.015-u*.22];},1));}
 items.push(patch(18,7,(u,v)=>{const a=v*TAU;return[Math.sin(u*2.8)*.13+Math.cos(a)*.023,-u*1.8,Math.sin(a)*.023-.035-u*.19];},2));
 for(const side of [-1,1])items.push(patch(12,7,(u,v)=>{const s=(v*2-1)*Math.sin(Math.PI*u)*.10;return[side*u*.55+s,-.75-u*.33,.03*Math.sin(u*Math.PI)-.16];},1));
 return merge(items);
}
export function wildflowerInstances(){
 const groups=Array.from({length:5},()=>({a:[],b:[]})),flowers=[];
 for(let i=0;i<120;i++){
  const ix=i%4,iy=Math.floor(i/4)%3,iz=Math.floor(i/12);
  const f=[(ix-1.5)*23+(random(i+20)-.5)*10,(iy-1)*24+(random(i+88)-.5)*10,14-iz*15.6+(random(i+92)-.5)*8,random(i+19)*TAU];
  const species=i%5,scale=.62+random(i+73)*.49;
  const near=[[-3,-5,4],[2,6,5],[-4,7,-9],[4,-1,10],[0,-9,-4]];
  if(i<5)f.splice(0,3,...near[i]);
  flowers.push([...f,scale]);groups[species].a.push(...f);groups[species].b.push(random(i+581)*TAU,random(i+761)*TAU,species,scale);
 }return{groups,flowers};
}
