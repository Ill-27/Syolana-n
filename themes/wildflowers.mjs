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
 const g=patch(radius[0]<.04?6:10,radius[0]<.04?7:12,(u,v)=>{const a=u*Math.PI,b=v*TAU;return[center[0]+Math.sin(a)*Math.cos(b)*radius[0],center[1]+Math.sin(a)*Math.sin(b)*radius[1],center[2]+Math.cos(a)*radius[2]];},material);
 for(let i=0;i<g.positions.length;i+=3){const n=g.positions.slice(i,i+3).map((p,k)=>(p-center[k])/(radius[k]*radius[k])),l=Math.hypot(...n);g.normals.splice(i,3,...n.map(x=>x/l));}return g;
}
function tube(a,b,radius,material){
 const axis=b.map((v,i)=>v-a[i]),length=Math.hypot(...axis),n=axis.map(v=>v/length),ref=Math.abs(n[2])<.8?[0,0,1]:[0,1,0],side=[n[1]*ref[2]-n[2]*ref[1],n[2]*ref[0]-n[0]*ref[2],n[0]*ref[1]-n[1]*ref[0]],l=Math.hypot(...side),x=side.map(v=>v/l),y=[n[1]*x[2]-n[2]*x[1],n[2]*x[0]-n[0]*x[2],n[0]*x[1]-n[1]*x[0]];
 return patch(5,7,(u,v)=>{const t=v*TAU;return a.map((p,i)=>p+axis[i]*u+(x[i]*Math.cos(t)+y[i]*Math.sin(t))*radius);},material);
}
function closedPetal(sample,thickness,rows=18,cols=10){
 const items=[patch(rows,cols,sample),patch(rows,cols,(u,v)=>{const p=sample(u,1-v);return[p[0],p[1],p[2]-thickness];})];
 for(const side of [0,1])items.push(patch(rows,1,(u,v)=>{const p=sample(u,side);return[p[0],p[1],p[2]-v*thickness];}));
 for(const end of [0,1])items.push(patch(1,cols,(u,v)=>{const p=sample(end,v);return[p[0],p[1],p[2]-u*thickness];}));return items;
}
export function wildflowerGeometry(species=0){
 const items=[],counts=[19,8,12,4,5],count=counts[species],rings=species===2?2:1;
 for(let ring=0;ring<rings;ring++)for(let i=0;i<count;i++){
  const seed=i+species*31,angle=i/count*TAU+ring*.23+(random(seed+43)-.5)*.045,asym=(random(seed)-.5)*.07,length=[.99,1.05,.87,1.10,.78][species]*(ring?.69:1)*(1+(random(seed+117)-.5)*.12);
  const sample=(u,v)=>{
   const side=v*2-1,tip=Math.pow(u,8),round=Math.sqrt(Math.max(0,1-side*side)),lobes=species===1?.045*Math.cos(side*3*Math.PI):species===2?.13*Math.cos(side*5*Math.PI):species===0?.008*Math.cos(side*2*Math.PI):.012*Math.sin(side*7+seed);
   const r=.13+u*length-(1-round)*tip*[.07,.10,.06,.20,.20][species]+lobes*tip;
   const width=[.092,.42,.18,.75,.40][species]*Math.pow(Math.sin(Math.PI*u*.94),[.63,.58,.55,.50,.52][species])+.010,across=side*width;
   let height=.04+u*u*[.16,.29,.35,.46,.43][species]+across*across*[1.8,.6,1.2,.65,.8][species]+Math.sin(u*4+seed)*asym;
   height+=Math.sin(u*19+side*11+seed)*Math.sin(Math.PI*u)*[.003,.006,.014,.032,.003][species]+tip*side*.026*Math.sin(seed);
   return[across*Math.cos(angle)-r*Math.sin(angle),across*Math.sin(angle)+r*Math.cos(angle),height+ring*.11];
  };items.push(...closedPetal(sample,species===3?.006:.010));
 }
 const centerRadius=[.24,.18,.14,.14,.16][species];
 items.push(sphere([0,0,.095],[centerRadius,centerRadius,species===3?.075:.12],species===3?1:species===2?6:3));
 const pollenCount=[61,33,29,42,35][species];
 for(let i=0;i<pollenCount;i++){
  const angle=i*2.39996,ring=species===3,r=(ring?.23:centerRadius*.94)*Math.sqrt((i+.5)/pollenCount),x=Math.cos(angle)*r,y=Math.sin(angle)*r,z=ring?.16+random(i+541)*.13:.17+Math.sqrt(Math.max(0,1-r*r/(centerRadius*centerRadius)))*.11;
  items.push(sphere([x,y,z],species===3?[.017,.026,.017]:[.017,.017,.022],species===3?5:species===2?6:4));
  if(species!==0)items.push(tube([x*.8,y*.8,.06],[x,y,z-.01],.0065,species===3?5:species===2?6:3));
 }
 if(species===3){items.push(sphere([0,0,.175],[.13,.13,.028],1));for(let i=0;i<9;i++){const a=i/9*TAU;items.push(tube([0,0,.197],[Math.cos(a)*.118,Math.sin(a)*.118,.191],.0045,5));}}
 for(let i=0;i<(species===2?12:5);i++){const angle=i/(species===2?12:5)*TAU;items.push(patch(12,7,(u,v)=>{const side=(v*2-1)*Math.sin(u*Math.PI)*.075,r=.08+u*(species===2?.32:.43);return[side*Math.cos(angle)-r*Math.sin(angle),side*Math.sin(angle)+r*Math.cos(angle),-.025-u*.20];},1));}
 items.push(patch(22,9,(u,v)=>{const a=v*TAU,r=(.027-u*.008)*(species===1?.8:1);return[Math.sin(u*2.8)*.13+Math.cos(a)*r,-u*1.8,Math.sin(a)*r-.035-u*.19];},2));
 for(const side of [-1,1]){
  const narrow=species===1||species===2;
  items.push(patch(16,9,(u,v)=>{let width=Math.sin(Math.PI*u)*(narrow?.036:.105);if(species===3)width*=.6+.4*Math.sin(u*19)**2;const s=(v*2-1)*width;return[side*u*.53+s,-.82-u*.34,.04*Math.sin(u*Math.PI)-.19];},1));
  if(species===1)for(let j=1;j<5;j++)for(const direction of [-1,1])items.push(patch(8,4,(u,v)=>{const x=side*j*.095,y=-.82-j*.067;return[x+side*u*.14,y+direction*u*.14+(v*2-1)*Math.sin(u*Math.PI)*.012,-.19+u*.03];},1));
 }
 return merge(items);
}
export function wildflowerInstances(){
 const groups=Array.from({length:5},()=>({a:[],b:[]})),flowers=[];
 for(let i=0;i<120;i++){
  const ix=i%4,iy=Math.floor(i/4)%3,iz=Math.floor(i/12);
  const f=[(ix-1.5)*23+(random(i+20)-.5)*10,(iy-1)*24+(random(i+88)-.5)*10,14-iz*15.6+(random(i+92)-.5)*8,random(i+19)*TAU];
  const species=i%5,scale=(.62+random(i+73)*.49)*1.18;
  const near=[[-3,-5,4],[2,6,5],[-4,7,-9],[4,-1,10],[0,-9,-4]];
  if(i<5)f.splice(0,3,...near[i]);
  flowers.push([...f,scale]);groups[species].a.push(...f);groups[species].b.push(random(i+581)*TAU,random(i+761)*TAU,species,scale);
 }return{groups,flowers};
}
