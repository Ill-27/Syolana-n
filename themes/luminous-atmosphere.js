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
    for(let layer=0;layer<3;layer++)for(let ray=0;ray<30;ray++){
     const x=(ray/29*1.6-.30)*w-panX*.25;
     const y=h*(.30+layer*.10)+Math.sin(ray*.24+time*.19+layer)*h*.12-panY*.3;
     ctx.save();ctx.translate(x,y);ctx.scale(w*.047,h*.30);
     const g=ctx.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(${colors[layer%3]},.033)`);g.addColorStop(.48,`rgba(${colors[layer%3]},.016)`);g.addColorStop(1,`rgba(${colors[layer%3]},0)`);
     ctx.fillStyle=g;ctx.fillRect(-1,-1,2,2);ctx.restore();
    }
   }else if(kind==='golden'){
    ctx.globalCompositeOperation='screen';
    for(let layer=0;layer<4;layer++)for(let strand=0;strand<20;strand++){
     const phase=strand/20*TAU+layer*.4,eyeX=(camera?.x||0)*3,eyeY=2+(camera?.y||0)*1.7;
     const z=((112-layer*29+time*.7+(camera?.z||0)*5)%156+156)%156-120;
     const baseY=((-12+layer*.9-eyeY+40)%80+80)%80-40+eyeY;
     const focal=h*.92;ctx.beginPath();let depth=50;
     for(let j=0;j<=110;j++){
      const wx=(j/110-.5)*300+eyeX,helix=phase+wx*.046+time*.23;
      const wy=baseY+Math.sin(wx*.042+time*.28+layer*.71)*7.2+Math.sin(wx*.094-time*.16+layer)*1.8+Math.cos(helix)*1.2;
      const wz=z+Math.sin(wx*.063+time*.18+layer)*7+Math.sin(helix)*2.8;depth=Math.max(5,24-wz);
      const px=w*.5+(wx-eyeX)*focal/depth,py=h*.5-(wy-eyeY)*focal/depth;
      if(j===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
     }
     const glint=.5+.5*Math.sin(time*.35+phase);ctx.strokeStyle=`rgba(239,${170+Math.round(glint*38)},${100+Math.round(glint*34)},${.08+.10*glint})`;ctx.lineWidth=Math.max(.35,Math.min(1.8,22/depth));ctx.stroke();
    }
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
