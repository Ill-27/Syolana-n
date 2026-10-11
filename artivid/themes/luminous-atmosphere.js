// Shared painted atmosphere for the three original particle worlds.
// Analytic motion has no frame-dependent random jumps or finite world edges.
const TAU=Math.PI*2;
function smoothCurve(ctx,start,end,curve,segments=28){
 const step=(end-start)/segments;let x=start,p=curve(x);ctx.moveTo(x,p.y);
 for(let i=1;i<=segments;i++){const next=start+step*i,q=curve(next);ctx.bezierCurveTo(x+step/3,p.y+p.slope*step/3,next-step/3,q.y-q.slope*step/3,next,q.y);x=next;p=q;}
}
export function createLuminousRenderer(ctx,kind){
 let width=1,height=1;
 const colors=kind==='golden'?['239,184,105','211,152,98','207,175,224']:kind==='moon'?['162,218,234','173,183,248','225,208,244']:['105,199,207','135,131,235','186,113,219'];
 function halo(x,y,r,color,strength){const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${strength})`);g.addColorStop(.45,`rgba(${color},${strength*.3})`);g.addColorStop(1,`rgba(${color},0)`);ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
 return{
  resize(size){width=size.width;height=size.height;},
  draw({time,width:w,height:h,camera}){
   width=w;height=h;const panX=(camera?.x||0)*w*.07,panY=(camera?.y||0)*h*.04;
   ctx.save();ctx.globalAlpha=1;
   halo(w*.64+Math.sin(time*.035)*w*.12-panX,h*.27-panY,Math.max(w,h)*.65,colors[0],kind==='golden'?.12:.14);
   halo(w*.22+Math.cos(time*.029)*w*.12-panX,h*.7-panY,Math.max(w,h)*.56,colors[2],.085);
   if(kind==='aurora'){
    ctx.globalCompositeOperation='screen';
    for(let layer=0;layer<6;layer++){
     const base=h*(.22+layer*.07),g=ctx.createLinearGradient(0,base-h*.28,0,base+h*.18);
     g.addColorStop(0,`rgba(${colors[layer%3]},0)`);g.addColorStop(.52,`rgba(${colors[layer%3]},.045)`);g.addColorStop(.76,`rgba(${colors[layer%3]},.1)`);g.addColorStop(1,`rgba(${colors[layer%3]},0)`);
     const curve=x=>{const a=(x+panX*.35)/w*4.15+time*.075+layer,b=(x+panX*.35)/w*9.92-time*.047;return{y:base+Math.sin(a)*h*.085+Math.sin(b)*h*.02-panY,slope:Math.cos(a)*h*.085*4.15/w+Math.cos(b)*h*.02*9.92/w}};
     ctx.fillStyle=g;ctx.beginPath();smoothCurve(ctx,-w*.25,w*1.25,curve);
     ctx.lineTo(w*1.25,-h*.2);ctx.lineTo(-w*.25,-h*.2);ctx.closePath();ctx.fill();
     ctx.beginPath();smoothCurve(ctx,-w*.25,w*1.25,curve);ctx.strokeStyle=`rgba(${colors[layer%3]},.045)`;ctx.lineWidth=h*.016;ctx.lineCap='round';ctx.shadowColor=`rgba(${colors[layer%3]},.15)`;ctx.shadowBlur=Math.min(18,h*.018);ctx.stroke();ctx.shadowBlur=0;
    }
   }else if(kind==='golden'){
    ctx.globalCompositeOperation='screen';
    for(let layer=0;layer<4;layer++){const y=h*(.56+layer*.075)-panY*.4;
     const g=ctx.createLinearGradient(0,y-h*.15,0,y+h*.16);g.addColorStop(0,'rgba(235,181,102,0)');g.addColorStop(.5,`rgba(235,181,102,${.04-layer*.006})`);g.addColorStop(1,'rgba(235,181,102,0)');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-w*.2,h*1.3);
     smoothCurve(ctx,-w*.25,w*1.25,x=>{const a=(x+panX*.35)/w*3.2+time*.055+layer*.65,b=(x+panX*.35)/w*7.54-time*.035;return{y:y+Math.sin(a)*h*.105+Math.sin(b)*h*.02,slope:Math.cos(a)*h*.105*3.2/w+Math.cos(b)*h*.02*7.54/w}});
     ctx.lineTo(w*1.25,h*1.3);ctx.lineTo(-w*.25,h*1.3);ctx.closePath();ctx.fill();}
   }else{
    const mx=w*.75+Math.sin(time*.021)*w*.018-panX*.18,my=h*.21-panY*.15,r=Math.min(w,h)*.045;
    halo(mx,my,r*7,'176,215,241',.13);
    const moon=ctx.createRadialGradient(mx-r*.3,my-r*.3,r*.12,mx,my,r);moon.addColorStop(0,'rgba(249,250,245,.82)');moon.addColorStop(.72,'rgba(207,223,239,.74)');moon.addColorStop(1,'rgba(145,168,197,.62)');ctx.fillStyle=moon;ctx.beginPath();ctx.arc(mx,my,r,0,TAU);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(mx,my,r,0,TAU);ctx.clip();for(let i=0;i<11;i++){const a=i*2.399,reach=r*(.16+(i%4)*.14),cr=r*(.047+(i%3)*.031),cx=mx+Math.cos(a)*reach,cy=my+Math.sin(a)*reach;const crater=ctx.createRadialGradient(cx-cr*.12,cy-cr*.15,0,cx,cy,cr);crater.addColorStop(0,'rgba(114,140,174,.18)');crater.addColorStop(1,'rgba(114,140,174,0)');ctx.fillStyle=crater;ctx.fillRect(cx-cr,cy-cr,cr*2,cr*2);}ctx.restore();
    // Slender plants sway through a repeating coordinate field at different depths.
    for(let i=0;i<24;i++){const depth=.3+(i%4)*.17,span=w+180,x=((i*167.31-panX*depth+span)%span)-90,y=h*1.03-panY*.2,top=y-h*(.16+(i%5)*.047),lean=Math.sin(time*.13+i)*13;
     ctx.strokeStyle=`rgba(146,192,205,${.04+depth*.07})`;ctx.lineWidth=.7+depth;ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x-12,y-h*.12,x+lean,top+h*.06,x+lean,top);ctx.stroke();
     ctx.fillStyle=`rgba(162,200,214,${.06+depth*.055})`;for(let j=1;j<4;j++){const py=y-(y-top)*j/4;ctx.beginPath();ctx.ellipse(x+lean*j/4+(j%2?10:-10),py,12*depth,3*depth,j%2?-.5:.5,0,TAU);ctx.fill();}}
   }
   ctx.restore();
  },dispose(){}
 };
}
