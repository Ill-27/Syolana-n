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

/* Photographic depth planes, practical fire and projected penumbrae. */
class SyolanaCinema {
 constructor(container){this.canvas=container.querySelector('canvas');this.ctx=this.canvas.getContext('2d');this.time=0;this.beatTime=0;this.beat=-1;this.paragraph=-1;this.framePlates=[];this.planes=new Map();document.body.dataset.cinemaRenderer='photographic-depth';document.body.dataset.visiblePeople='0';}
 static smooth(x){x=Math.max(0,Math.min(1,x));return x*x*(3-2*x);}
 resize(w,h,dpr){this.w=w;this.h=h;this.dpr=dpr;}
 setParagraph(p,scene){this.paragraph=p;this.scene=scene;const beats=[-1,0,5,25,31,43,55,60,65,74,82,95,100,101,104,109,110,115,127,131],b=beats.filter(x=>p>=x).at(-1)??-1;if(b!==this.beat){this.beat=b;this.beatTime=this.time;return true;}return false;}
 plane(image,key,spec){const id=key+':'+spec.join(',');if(this.planes.has(id))return this.planes.get(id);const c=document.createElement('canvas'),ratio=Math.min(1,900/image.naturalWidth);c.width=Math.round(image.naturalWidth*ratio);c.height=Math.round(image.naturalHeight*ratio);const g=c.getContext('2d');g.drawImage(image,0,0,c.width,c.height);g.globalCompositeOperation='destination-in';const [x,y,rx,ry]=spec;g.translate(x*c.width,y*c.height);g.scale(rx*c.width,ry*c.height);const grad=g.createRadialGradient(0,0,.32,0,0,1);grad.addColorStop(0,'#000');grad.addColorStop(.64,'#000d');grad.addColorStop(1,'#0000');g.fillStyle=grad;g.fillRect(-1,-1,2,2);this.planes.set(id,c);return c;}
 depth(p){const c=this.ctx,w=this.w,h=this.h,t=this.time,age=t-this.beatTime,walking=[43,65,101,104].includes(this.beat)?Math.sin(Math.PI*SyolanaCinema.smooth(age/6)):0;for(const plate of this.framePlates){const image=this.images?.[plate.image],layout=this.layouts?.[plate.image];if(!image?.naturalWidth||!layout||plate.weight<.015)continue;for(const spec of layout.depth||[]){const depth=spec[4]||1,mask=this.plane(image,plate.image,spec),x=plate.rect[0]*w+(Math.sin(t*.12+depth)*w*.009+walking*w*.025)*depth,y=plate.rect[1]*h+Math.cos(t*.10+depth)*h*.004*depth;c.save();c.globalAlpha=plate.weight*.92;c.drawImage(mask,x,y,plate.rect[2]*w,plate.rect[3]*h);c.restore();}}}
 glow(x,y,r,color,a){if(a<=.0001||r<1)return;const c=this.ctx,g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${color},${a})`);g.addColorStop(.3,`rgba(${color},${a*.38})`);g.addColorStop(1,`rgba(${color},0)`);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 flame(x,y,width,height,phase,a){const c=this.ctx,t=this.time,lean=Math.sin(t*2.1+phase)*width*.40+Math.sin(t*3.8+phase)*width*.16,hh=height*(1+.13*Math.sin(t*2.6+phase));this.glow(x,y-hh*.32,hh*3.4,'255,159,52',a*.20);for(let j=0;j<3;j++){const s=1-j*.23,wx=width*s,hy=hh*s,tip=x+lean*s,g=c.createLinearGradient(x,y,x,y-hy);g.addColorStop(0,j===2?'#fff1bd':'#df641b');g.addColorStop(.4,j===2?'#ffe396':'#ffb443');g.addColorStop(1,'#ffd07900');c.fillStyle=g;c.globalAlpha=a*(j===2?.85:.58);c.beginPath();c.moveTo(x-wx,y);c.bezierCurveTo(x-wx*1.2,y-hy*.45,tip-wx*.25,y-hy*.8,tip,y-hy);c.bezierCurveTo(tip+wx*.2,y-hy*.6,x+wx*1.2,y-hy*.3,x+wx,y);c.closePath();c.fill();}c.globalAlpha=1;}
 shadows(p){const c=this.ctx,w=this.w,h=this.h,t=this.time,age=t-this.beatTime,passage=[43,65,101,104].includes(this.beat)?Math.sin(Math.PI*Math.min(1,age/6.2)):0;c.save();c.globalCompositeOperation='multiply';for(let i=0;i<2;i++){const x=w*(i?1.08:-.08)+Math.sin(t*.17+i)*w*.025+(i?-1:1)*passage*w*.20;this.glow(x,h*(.40+i*.18),w*(.42+passage*.08),'9,18,22',.22+p.shadow*.13);}const shadow=this.images?.['shadow-mask'];if(shadow?.naturalWidth&&this.paragraph>=0)for(const plate of this.framePlates){const at=this.layouts?.[plate.image]?.shadow;if(!at||plate.weight<.01)continue;const [x,y,sx,sy]=at,rx=(plate.rect[0]+x*plate.rect[2])*w,ry=(plate.rect[1]+y*plate.rect[3])*h,sway=Math.sin(t*.35)*.012+passage*.12;c.globalAlpha=plate.weight*(.24+p.shadow*.18);c.save();c.translate(rx,ry);c.transform(1,0,sway,1,Math.sin(t*.23)*w*.004,0);c.drawImage(shadow,-sx*plate.rect[2]*w*.5,-sy*plate.rect[3]*h,sx*plate.rect[2]*w,sy*plate.rect[3]*h);c.restore();}c.restore();c.globalAlpha=1;}
 practical(p){const c=this.ctx,w=this.w,h=this.h,t=this.time;c.save();c.globalCompositeOperation='screen';for(const plate of this.framePlates){const layout=this.layouts?.[plate.image];if(!layout||plate.weight<.01)continue;const xy=(x,y)=>[(plate.rect[0]+x*plate.rect[2])*w,(plate.rect[1]+y*plate.rect[3])*h],unit=plate.rect[3]*h;for(const [i,at]of (layout.candles||[]).entries()){const [x,y]=xy(...at);this.flame(x,y,unit*.005,unit*.043,i*1.77,plate.weight*.88);this.glow(x,y-unit*.03,unit*.20,'255,175,75',plate.weight*(.13+.025*Math.sin(t*1.4+i)));c.save();c.translate(x,y+unit*.09);c.scale(2.3,.16);this.glow(0,0,unit*.13,'255,178,78',plate.weight*.11);c.restore();}if(layout.fire){const [fx,fy,fw,fh]=layout.fire,[x,y]=xy(fx,fy),width=fw*plate.rect[2]*w,height=fh*unit;for(let i=0;i<8;i++)this.flame(x+(i/7-.5)*width,y+Math.sin(i*2)*unit*.005,width*.065,height*(.4+.6*Math.sin(i*2.1)**2),i*1.3,plate.weight*.64);this.glow(x,y-height*.4,width*1.1,'255,135,41',plate.weight*(.17+.025*Math.sin(t*.83)));for(let i=0;i<18;i++){const a=(t*(.22+i%4*.037)+i*.173)%1;this.glow(x+Math.sin(i*2.4+t*.6+a*5)*width*.42,y-a*height*2.2,2+i%4,'255,177,70',plate.weight*(1-a)*.63);}}if(layout.window){const [x0,y0,x1,y1]=layout.window,[x,y]=xy(x0,y0),[xx,yy]=xy(x1,y1);c.save();c.beginPath();c.rect(x,y,xx-x,yy-y);c.clip();for(let i=0;i<18;i++){const z=.3+(i%6)*.13,u=(t*(.028+z*.018)+i*.618)%1,dx=x+(xx-x)*((i*.381966+Math.sin(t*.07+i)*.01)%1),dy=y+(yy-y)*u;this.glow(dx,dy,2+z*5,'188,230,235',plate.weight*p.rain*.14);c.strokeStyle=`rgba(192,228,230,${plate.weight*p.rain*.12})`;c.lineWidth=1+z;c.beginPath();c.moveTo(dx,dy-12-z*32);c.bezierCurveTo(dx+3,dy-9,dx-3,dy-5,dx,dy);c.stroke();}c.restore();}}const magic=Math.max(p.magic,p.emerald*.45),count=this.w<760?26:42;for(let i=0;i<count;i++){const z=.18+(i%7)*.12,a=t*(.11+z*.14)+i*2.399,x=(.5+Math.sin(a*.57+i*.31)*.48)*w,y=(.5+Math.cos(a*.43+i*.73)*.46)*h,r=(i<4?13:3)+z*9;this.glow(x,y,r,i%4===0&&magic>.2?'98,241,177':'255,210,134',(.06+z*.11)*(i>26?magic:1)*(p.particleGain??1));}c.restore();}
 magic(p){const c=this.ctx,w=this.w,h=this.h,story=this.story||{},wave=story.wave,magic=Math.max(p.magic,p.emerald*.5);let origin=[w*.5,h*.75];const plate=this.framePlates.find(x=>x.image==='desk'&&x.weight>.4);if(plate)origin=[(plate.rect[0]+.51*plate.rect[2])*w,(plate.rect[1]+.73*plate.rect[3])*h];c.save();c.globalCompositeOperation='screen';if(magic>.02)this.glow(...origin,w*.24,'119,249,177',magic*.10);if(wave!=null&&wave<9.5){const u=SyolanaCinema.smooth(wave/5.2),a=Math.sin(Math.PI*Math.min(1,wave/9.5));for(let i=0;i<12;i++){const end=[w*(.03+(i%6)*.19),h*(i<6?.06:.94)],p1=[origin[0]+Math.sin(i*2.1)*w*.20,origin[1]-h*.17],p2=[end[0]-Math.cos(i)*w*.13,end[1]+h*.2];c.strokeStyle=`rgba(${i%3?'255,190,83':'110,246,181'},${a*.33})`;c.lineWidth=1.4+i%3;c.beginPath();for(let k=0;k<=35;k++){const v=k/35*u,b=1-v,x=b*b*b*origin[0]+3*b*b*v*p1[0]+3*b*v*v*p2[0]+v*v*v*end[0],y=b*b*b*origin[1]+3*b*b*v*p1[1]+3*b*v*v*p2[1]+v*v*v*end[1];k?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();}this.glow(...origin,w*(.10+u*.25),'255,195,99',a*.19);}const impact=story.impactAge;if(impact!=null&&impact>=.22&&impact<1.3){const u=(impact-.22)/1.08;this.glow(origin[0]+w*.13,origin[1]-h*.1,w*.18,'225,182,123',Math.sin(Math.PI*u)*.075);c.strokeStyle=`rgba(244,211,163,${(1-u)*.13})`;c.lineWidth=2;c.beginPath();c.ellipse(origin[0],origin[1],w*(.01+u*.16),h*(.003+u*.018),0,0,Math.PI*2);c.stroke();}const thunder=story.thunderAge;if(thunder!=null&&thunder<2.6)this.glow(w*.1,h*.3,w*.8,'165,208,229',Math.sin(Math.PI*thunder/2.6)*.08);c.restore();}
 render(dt,p,weights,rect,motion){if(!this.w)return;if(motion)this.time+=dt;this.ctx.setTransform(this.dpr,0,0,this.dpr,0,0);this.shadows(p);this.practical(p);this.magic(p);}
 destroy(){this.planes.clear();this.images=null;}
}

/* Syolana MM-04 — the approved teal-gold room, now with projected shadows and practical fire. */
class SyolanaDirector {
 constructor(){
  this.shots={
   'door-action':{image:'door',duration:18,scale:1.08,focusX:.52,focusY:.50,panX:0,panY:0,dx:.015,dy:0,z:3.9,cx:0,cy:0,angle:0,cast:.8,mask:0,rain:1},
   'aisle-depth':{image:'aisle',duration:19,scale:1.09,focusX:.50,focusY:.5,panX:0,panY:0,dx:.015,dy:-.014,z:3.9,cx:0,cy:0,angle:0,cast:.7,mask:0,rain:.6},
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
  this.programs=[['window-veil','candle-light','window-drift'],['window-deep','candle-light','window-drift','hearth-room'],['window-drift','hearth-room','window-veil','candle-near'],['document-shadow','window-veil','ink-light','candle-light','window-drift'],['window-veil','candle-light','aisle-depth','hearth-room','window-deep'],['ink-light','window-drift','document-shadow','candle-near'],['window-deep','hearth-room','window-veil','candle-light'],['window-drift','ink-light','hearth-near','window-deep'],['window-veil','hearth-room','window-drift','document-shadow','candle-light']];
  for(const shot of Object.values(this.shots))shot.duration=Math.max(16,shot.duration*1.28);
  this.scene=-1;this.key='window-veil';this.previous=null;this.elapsed=0;this.transition=3.4;this.blend=1;this.index=0;this.total=0;this.number=0;this.lastBeat=-1;this.camera=null;this.pinUntil=0;
 }
 change(key){if(this.key===key&&this.number)return;this.previous=(this.layers||[{key:this.key,weight:1,elapsed:this.elapsed}]).map(x=>({...x}));this.key=key;this.elapsed=0;this.blend=0;this.number++;}
 pin(key,seconds){this.change(key);this.pinUntil=this.total+seconds;}
 update(dt,scene,paragraph,motion){const beat=[0,5,25,31,55,60,74,95,100,101,104,109,110,115,127].filter(x=>paragraph>=x).at(-1)??-1;
  if(scene!==this.scene){this.scene=scene;this.index=0;this.change(this.programs[scene][0]);this.lastBeat=beat;}
  else if(beat!==this.lastBeat){this.lastBeat=beat;const focus={25:'document-shadow',31:'document-shadow',55:'window-deep',60:'hearth-room',74:'ink-light',95:'window-drift',100:'candle-light',101:'aisle-depth',104:'aisle-depth',109:'ink-light',110:'window-drift',115:'window-veil',127:'document-shadow'}[beat];if(focus&&scene>0&&this.elapsed>4.5){this.change(focus);const i=this.programs[scene].indexOf(focus);this.index=i<0?0:i;}}
  if(motion){this.total+=dt;this.elapsed+=dt;this.blend=Math.min(1,this.blend+dt/this.transition);const pacing=paragraph>=95&&paragraph<=100?.88:paragraph>=108&&paragraph<=110?1.35:1.10;if(this.elapsed>this.shots[this.key].duration*pacing&&this.total>=this.pinUntil){const p=this.programs[this.scene];this.index=(this.index+1)%p.length;this.change(p[this.index]);}}else this.blend=1;
  const ease=SyolanaCinema.smooth(this.blend),layers=[];if(this.previous&&ease<1)for(const old of this.previous)if(old.weight*(1-ease)>.001)layers.push({...old,elapsed:old.elapsed+(motion?dt:0),weight:old.weight*(1-ease)});layers.push({key:this.key,elapsed:this.elapsed,weight:ease});this.layers=layers;
  const camera={z:0,cx:0,cy:0,angle:0,cast:0,rain:0};for(const l of layers){const s=this.shots[l.key];for(const k of Object.keys(camera))camera[k]+=s[k]*l.weight;}this.camera=camera;return{layers,camera,key:this.key,number:this.number,elapsed:this.elapsed,total:this.total};
 }
 imageKey(spec,w,h){return spec.image==='hearth'&&w/h<.85?'hearth-portrait':spec.image;}
 plateTransform(layer,w,h,image){
  const s=this.shots[layer.key],u=Math.min(1,layer.elapsed/s.duration),ease=u*u*(3-2*u),scale=s.scale+ease*(s.image==='aisle'?.14:.085);
  const sw=image?.naturalWidth||1672,sh=image?.naturalHeight||941,sz=Math.max(w/sw,h/sh)*scale,iw=sw*sz,ih=sh*sz,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const portrait=sw<sh,fx=portrait ? .53 : (s.image==='candles'&&w/h<.85 ? .49 : s.focusX),fy=portrait ? .50 : s.focusY;
  const dx=clamp((.5-fx)*iw+(s.panX+s.dx*ease)*w,-(iw-w)/2+2,(iw-w)/2-2),dy=clamp((.5-fy)*ih+(s.panY+s.dy*ease)*h,-(ih-h)/2+2,(ih-h)/2-2);return{scale,dx,dy};
 }
}

/* Event dramaturgy follows phrases; ambient motion never advances the plot. */
class SyolanaStory {
 constructor(){this.time=0;this.events=new Map();this.history=new Set();this.frame={};this.paragraph=-1;this.counts={};}
 sync(fired){for(const id of fired||[])this.history.add(id);}
 trigger(name,paragraph,id){const kind=name==='paper'&&paragraph===25?'document':name==='door'?'arrival':name==='thunder'?'thunder':name==='wood'?'impact':name==='seal'?'seal':name==='ink'&&paragraph===109?'letters':name==='ink'&&paragraph===74?'inkchange':null;this.history.add(id);if(kind){this.events.set(kind,this.time);this.counts[kind]=(this.counts[kind]||0)+1;}return kind;}
 age(kind){return this.events.has(kind)?this.time-this.events.get(kind):null;}
 reset(){this.events.clear();this.history.clear();this.frame={};this.counts={};}
 compose(base,dt,paragraph,motion){if(motion)this.time+=dt;this.paragraph=paragraph;const sealAge=this.age('seal'),impactAge=this.age('impact'),documentAge=this.age('document'),lettersAge=this.age('letters');const envelope=(age,duration)=>age===null||age<0||age>duration?0:Math.sin(Math.PI*Math.min(1,age/duration));
  const preparing=paragraph>=108&&paragraph<=110&&(sealAge===null||sealAge>12)&&!this.history.has('cue-8');const pressure=paragraph>=95&&paragraph<=100?1:paragraph>=82&&paragraph<95?.45:0;
  const sealKnown=paragraph>110||(paragraph===110&&this.history.has('cue-8'));const gate=paragraph<110||paragraph>=115?0:sealKnown?(sealAge!==null&&sealAge<7?SyolanaCinema.smooth(sealAge/3):.72):0;
  const focus=envelope(documentAge,7),impact=envelope(impactAge,1.25),wave=motion&&sealAge!==null&&sealAge<10?sealAge:null;
  this.frame={thunderAge:this.age('thunder'),documentAge,impactAge,lettersAge,sealAge,wave,pressure,preparing,focus,impact,motion,settled:sealKnown};
  return{...base,magic:base.magic*gate,emerald:Math.max(envelope(this.age('inkchange'),2.2)*.8,lettersAge!==null&&paragraph===109?envelope(lettersAge,3)*.60:0,sealKnown&&paragraph<115?.22:0),warm:base.warm*(preparing?.78:1)+focus*.09+impact*.035,cold:Math.min(1,base.cold+pressure*.08),dim:Math.min(1,base.dim+pressure*.06),particleGain:preparing?.42:1,focus,pressure};
 }
}

/* One muted decoder is reserved for a rare, unrepeatable story action. */
class SyolanaMotionEvents {
 constructor(assets,onReady){this.assets=assets||{};this.onReady=onReady;this.clips=new Map();this.active=null;this.generation=0;this.disposed=false;this.stats={played:0,skipped:0};}
 prepare(name){if(this.disposed||!this.assets[name]||this.clips.has(name))return;const v=document.createElement('video');v.muted=true;v.defaultMuted=true;v.playsInline=true;v.preload='auto';v.setAttribute('playsinline','');v.setAttribute('muted','');v.crossOrigin='anonymous';v.src=this.assets[name].src;v.addEventListener('loadeddata',()=>{if(!this.disposed)this.onReady();},{once:true});v.addEventListener('error',()=>{if(this.active?.name===name)this.stop();},{once:true});this.clips.set(name,v);v.load();}
 nearby(paragraph,motion){if(!motion||this.disposed)return;for(const [name,spec]of Object.entries(this.assets)){if(paragraph>=spec.paragraph-7&&paragraph<=spec.paragraph+5)this.prepare(name);else if(this.active?.name!==name)this.release(name);}}
 trigger(cue,paragraph,id,motion){const name=Object.keys(this.assets).find(n=>this.assets[n].paragraph===paragraph&&this.assets[n].cue===cue);if(!name||!motion||this.disposed)return false;const video=this.clips.get(name);if(!video||video.readyState<2){this.stats.skipped++;return false;}this.stop();const gen=++this.generation;this.active={name,video,age:0,fade:0,done:false};video.currentTime=0;video.onended=()=>{if(this.active?.video===video){this.active.done=true;this.active.tail=0;}};video.play()?.catch(()=>{if(gen===this.generation)this.stop();});this.stats.played++;return true;}
 frame(dt,motion,paragraph){const a=this.active;if(!a)return null;if(!motion||document.hidden||Math.abs(paragraph-this.assets[a.name].paragraph)>5){this.stop();return null;}a.age+=dt;a.fade=Math.min(1,a.fade+dt/.8);if(a.done){a.tail+=dt;if(a.tail>1.8){this.stop();return null;}a.fade=Math.max(0,1-a.tail/1.8);}return{media:a.video,weight:a.fade,name:a.name,key:this.assets[a.name].image};}
 release(name){const v=this.clips.get(name);if(!v)return;v.pause();v.removeAttribute('src');v.load();this.clips.delete(name);}
 stop(){if(this.active){this.active.video.pause();this.active.video.onended=null;this.active=null;}this.generation++;}
 visibility(){if(document.hidden)this.stop();}
 destroy(){this.disposed=true;this.stop();for(const n of [...this.clips.keys()])this.release(n);this.clips.clear();}
}

/* Supplied streaming music, restrained mix changes and short phrase-bound events. */
class SyolanaSoundtrack {
 constructor(env){this.env=env;this.ctx=null;this.ready=null;this.buffers={};this.sources=new Set();this.voices=new Set();this.desired=false;this.enabled=false;this.pending=false;this.generation=0;this.phraseChanges=0;this.currentPiano=null;this.disposed=false;this.controller=new AbortController();this.mood={tension:.1,magic:0,theme:'calm'};this.musicPlayers=[];this.musicIndex=0;this.crossfading=false;}
 async request(url){const c=new AbortController(),relay=()=>c.abort(),timer=setTimeout(relay,6500);this.controller.signal.addEventListener('abort',relay,{once:true});try{const r=await fetch(url,{cache:'force-cache',credentials:'omit',signal:c.signal});if(!r.ok)throw Error('audio');return await r.arrayBuffer();}finally{clearTimeout(timer);this.controller.signal.removeEventListener('abort',relay);}}
 async loadBuffer(name){const asset=this.env.assets.audio[name],urls=typeof asset==='string'?[asset]:[asset.src,asset.fallback].filter(Boolean);for(const url of urls){try{let bytes;if(url.startsWith('data:')){const raw=atob(url.split(',')[1]);bytes=Uint8Array.from(raw,c=>c.charCodeAt(0)).buffer;}else bytes=await this.request(url);const b=await this.ctx.decodeAudioData(bytes);if(this.disposed)throw Error('disposed');this.buffers[name]=b;return b;}catch(e){if(this.disposed)throw e;}}throw Error('audio-unavailable');}
 async init(){if(this.ready)return this.ready;const A=window.AudioContext||window.webkitAudioContext;if(!A)throw Error('unsupported');this.ctx=new A({latencyHint:'playback'});this.master=this.ctx.createGain();this.master.gain.value=0;this.fxBus=this.ctx.createGain();this.fxBus.connect(this.master);this.master.connect(this.ctx.destination);const resume=this.ctx.resume();this.initMusic();this.ready=Promise.allSettled(Object.keys(this.env.assets.audio).map(n=>this.loadBuffer(n))).then(async result=>{await resume;if(!result.some(x=>x.status==='fulfilled'))throw Error('audio-unavailable');this.applyLevels();});return this.ready;}
 async enable(on=true){if(this.disposed)return;this.desired=on;const gen=++this.generation;clearTimeout(this.disableTimer);if(!on){this.enabled=false;this.pending=false;this.rampMaster(0);this.stopEffects();this.updateUI();this.disableTimer=setTimeout(async()=>{if(gen===this.generation&&!this.desired){this.pauseMusic();await this.ctx?.suspend().catch(()=>{});this.updateUI();}},360);return;}this.pending=true;this.updateUI();try{await this.init();if(gen!==this.generation||!this.desired||this.disposed)return;await this.ctx.resume();if(gen!==this.generation||this.disposed)return;this.enabled=true;this.applyLevels();this.rampMaster(1);this.env.prime();if(document.hidden)await this.ctx.suspend();this.startMusic();this.env.toast('Тихая музыка включена. Звуки событий прозвучат возле нужных фраз.');}catch{if(!this.disposed){this.enabled=false;this.desired=false;this.env.toast('Звуки сейчас недоступны. Историю можно продолжать читать.');}}finally{if(gen===this.generation){this.pending=false;this.updateUI();}}}
 updateUI(){if(!this.disposed)this.env.onState(this);}
 rampMaster(value){if(!this.ctx||!this.master)return;const p=this.master.gain,t=this.ctx.currentTime;p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);p.linearRampToValueAtTime(value,t+.28);}
 applyLevels(){if(this.ctx&&this.fxBus)this.fxBus.gain.setTargetAtTime(this.env.settings().fx/100,this.ctx.currentTime,.18);this.mixMusic();}
 initMusic(){if(!this.env.assets.music?.src)return;this.musicBus=this.ctx.createGain();this.musicBus.gain.value=0;this.musicFilter=this.ctx.createBiquadFilter();this.musicFilter.type='lowpass';this.musicFilter.Q.value=.35;this.musicFilter.frequency.value=6200;this.musicFilter.connect(this.musicBus);this.musicBus.connect(this.master);for(let i=0;i<2;i++){const media=new Audio();media.crossOrigin='anonymous';media.preload=i===0?'auto':'none';media.src=this.env.assets.music.src;media.setAttribute('playsinline','');const source=this.ctx.createMediaElementSource(media),gain=this.ctx.createGain();gain.gain.value=i===0?1:0;source.connect(gain);gain.connect(this.musicFilter);this.musicPlayers.push({media,source,gain});this.sources.add(source);}this.currentPiano={name:'The Teal Hour'};this.musicTimer=setInterval(()=>this.tickMusic(),500);this.startMusic();}
 startMusic(){if(this.disposed||!this.desired||document.hidden)return;const player=this.musicPlayers[this.musicIndex];if(player)player.media.play().catch(()=>{if(!this.disposed)document.body.dataset.musicState='unavailable';});}
 pauseMusic(){for(const p of this.musicPlayers)p.media.pause();}
 mixMusic(){if(!this.ctx||!this.musicBus)return;const t=this.ctx.currentTime,level=this.env.settings().music/100*(.91+(this.mood.magic||0)*.09-(this.mood.tension||0)*.08);this.musicLevel=level;this.musicBus.gain.cancelScheduledValues(t);this.musicBus.gain.setTargetAtTime(this.enabled?level:0,t,1.2);this.musicFilter.frequency.setTargetAtTime(6200-(this.mood.tension||0)*2100+(this.mood.magic||0)*900,t,3.5);}
 tickMusic(){if(!this.disposed&&this.musicPlayers.length){const active=this.musicPlayers[this.musicIndex].media;document.body.dataset.musicState=active.paused?'paused':'playing';document.body.dataset.musicTime=active.currentTime.toFixed(1);document.body.dataset.musicLevel=String(this.musicLevel||0);}
 if(!this.enabled||document.hidden||this.disposed||this.crossfading||this.musicPlayers.length!==2)return;const a=this.musicPlayers[this.musicIndex],remaining=a.media.duration-a.media.currentTime;if(!Number.isFinite(remaining)||remaining>5||remaining<=0)return;const oldIndex=this.musicIndex,b=this.musicPlayers[1-oldIndex],t=this.ctx.currentTime;this.crossfading=true;b.media.currentTime=0;b.gain.gain.cancelScheduledValues(t);b.gain.gain.setValueAtTime(0,t);b.media.play().then(()=>{if(this.disposed)return;const now=this.ctx.currentTime,d=Math.max(.8,Math.min(4.5,remaining-.2));a.gain.gain.setValueAtTime(1,now);a.gain.gain.linearRampToValueAtTime(0,now+d);b.gain.gain.linearRampToValueAtTime(1,now+d);this.musicIndex=1-oldIndex;this.crossfadeTimer=setTimeout(()=>{a.media.pause();a.media.currentTime=0;this.crossfading=false;},(d+.1)*1000);}).catch(()=>{this.crossfading=false;a.media.currentTime=0;a.media.play().catch(()=>{});});}

 setPreparation(){}
 moodTo(mood){if(this.mood.theme!==mood.theme)this.phraseChanges++;this.mood={...mood};this.mixMusic();}
 moment(){}
 play(name,pan=0,scale=1,delay=0){if(this.disposed||!this.enabled||!this.env.settings().effects||!this.buffers[name]||this.ctx.state!=='running'||document.hidden||this.voices.size>=3)return false;const t=this.ctx.currentTime+delay,s=this.ctx.createBufferSource(),g=this.ctx.createGain();s.buffer=this.buffers[name];s.loop=false;g.gain.value=({door:.85,cloth:.72,paper:.76,wood:.85,ink:.72,seal:.8,thunder:.74,raindrops:.65}[name]||.75)*scale;s.connect(g);let p;if(this.ctx.createStereoPanner){p=this.ctx.createStereoPanner();p.pan.value=Math.max(-.55,Math.min(.55,pan));g.connect(p);p.connect(this.fxBus);}else g.connect(this.fxBus);this.voices.add(s);s.onended=()=>{this.voices.delete(s);s.disconnect();g.disconnect();p?.disconnect();};if(this.musicBus){const gain=this.musicBus.gain,level=this.musicLevel||0;gain.cancelScheduledValues(this.ctx.currentTime);gain.setValueAtTime(gain.value,this.ctx.currentTime);gain.setTargetAtTime(level*.40,Math.max(this.ctx.currentTime,t-.1),.13);gain.setTargetAtTime(level,t+s.buffer.duration+.18,.8);}s.start(t);return true;}
 stopEffects(){for(const s of this.voices){try{s.stop();}catch{}}this.voices.clear();this.mixMusic();}
 async visibility(){if(!this.ctx||this.disposed)return;if(document.hidden){this.stopEffects();this.pauseMusic();await this.ctx.suspend().catch(()=>{});this.updateUI();}else if(this.desired&&this.enabled){await this.ctx.resume().catch(()=>{});this.startMusic();this.updateUI();}}
 destroy(){this.disposed=true;this.desired=false;this.enabled=false;this.generation++;clearTimeout(this.disableTimer);this.controller.abort();clearInterval(this.musicTimer);clearTimeout(this.crossfadeTimer);this.pauseMusic();for(const p of this.musicPlayers){p.source.disconnect();p.gain.disconnect();p.media.removeAttribute('src');p.media.load();}this.musicPlayers=[];this.sources.clear();this.musicBus?.disconnect();this.musicFilter?.disconnect();this.stopEffects();this.buffers={};this.fxBus?.disconnect();this.master?.disconnect();this.ctx?.close().catch(()=>{});}
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
document.body.dataset.engineVersion='MM07';
let disposed=false;const lifetime=new AbortController();
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
const ASSETS=JSON.parse($('#asset-data').textContent),SCENES=JSON.parse($('#scene-data').textContent),BOOK=JSON.parse($('#book-data').textContent);
const root=document.documentElement, reduced=matchMedia('(prefers-reduced-motion: reduce)');
const defaults={font:innerWidth<=760?19:20,line:1.9,shade:48,face:'sans',motion:!reduced.matches,effects:true,music:18,fx:24};
let storage=null;try{storage=localStorage;}catch{}
const readingStore=new SyolanaReadingStore(storage,BOOK),loaded=readingStore.load();
let settings={...defaults,...(loaded?.settings||{})},saved=loaded?.place||null;
if(loaded?.settings?.scoreRevision!=='MM07'){settings.music=18;settings.scoreRevision='MM07';}
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
  this.rain=Array.from({length:96},()=>({x:rand(),y:rand(),z:.2+rand()*.8,phase:rand()*6.28}));
  this.motes=Array.from({length:36},()=>({x:rand(),y:rand(),z:.15+rand()*.85,phase:rand()*6.28,speed:.4+rand()*.6}));
  this.clouds=Array.from({length:6},()=>({x:rand(),y:.05+rand()*.7,size:.25+rand()*.3,speed:.3+rand()*.6}));
  this.cinema=new SyolanaCinema(this.canvas.parentElement);this.events=new SyolanaMotionEvents(ASSETS.videos,()=>this.needs=true);this.resize();this.makeTextures();
  addEventListener('resize',()=>this.resize(),{passive:true,signal:lifetime.signal});
  if(matchMedia('(pointer:fine)').matches)addEventListener('pointermove',e=>{this.targetPointer.x=(e.clientX/innerWidth-.5)*2;this.targetPointer.y=(e.clientY/innerHeight-.5)*2;},{passive:true,signal:lifetime.signal});
  this.loadedAt={window:-100};
  this.ready=this.loadImage('window').then(()=>{if(disposed)return;this.needs=true;document.body.dataset.worldReady='true';document.body.dataset.imagesReady='1';this.preloadImages();this.events.prepare('door');}).catch(()=>{document.body.dataset.imageFallback='true';});
 }
 async loadImage(key){const im=new Image();im.crossOrigin='anonymous';const loaded=new Promise((ok,fail)=>{im.onload=ok;im.onerror=fail;});im.src=ASSETS.images[key];await loaded;await im.decode?.().catch(()=>{});this.images[key]=im;this.loadedAt[key]=this.t;this.needs=true;return im;}
 async preloadImages(){for(const key of this.imageKeys.filter(k=>k!=='window')){if(disposed)return;await new Promise(ok=>{if('requestIdleCallback'in window)requestIdleCallback(ok,{timeout:700});else setTimeout(ok,100);});try{await this.loadImage(key);document.body.dataset.imagesReady=String(Object.keys(this.images).length);}catch{document.body.dataset.imageFallback='true';}}}
 plateLayers(){const out=[];for(const layer of this.shot.layers){const wanted=this.director.imageKey(this.director.shots[layer.key],this.w,this.h);const ready=!!this.images[wanted],k=ready?(settings.motion?Math.min(1,Math.max(0,this.t-this.loadedAt[wanted])/1.4):1):0;if(k<1)out.push({...layer,image:'window',weight:layer.weight*(1-k)});if(k>0)out.push({...layer,image:wanted,weight:layer.weight*k});}return out;}
 resize(){if(disposed)return;const rect=this.canvas.parentElement.getBoundingClientRect();const w=Math.round(rect.width),h=Math.round(rect.height);if(this.w&&Math.abs(this.w-w)<2&&Math.abs(this.h-h)<100)return;
  this.w=w;this.h=h;const low=(navigator.deviceMemory||8)<=2;this.dpr=Math.min(devicePixelRatio||1,1,(low?900:1200)/Math.max(w,h));this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr);this.cinema?.resize(w,h,this.dpr);this.needs=true;
 }
 makeTextures(){this.haze=document.createElement('canvas');this.haze.width=this.haze.height=256;let c=this.haze.getContext('2d'),g=c.createRadialGradient(128,128,2,128,128,128);g.addColorStop(0,'rgba(173,175,202,.22)');g.addColorStop(.4,'rgba(142,150,186,.13)');g.addColorStop(1,'rgba(142,150,186,0)');c.fillStyle=g;c.fillRect(0,0,256,256);
  this.glow=document.createElement('canvas');this.glow.width=this.glow.height=64;c=this.glow.getContext('2d');g=c.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,231,183,.96)');g.addColorStop(.2,'rgba(255,204,127,.52)');g.addColorStop(1,'rgba(255,173,97,0)');c.fillStyle=g;c.fillRect(0,0,64,64);
 }
 setScene(index){this.scene=SCENES[index];this.target=this.keys.map(k=>k===this.scene.image?1:0);this.needs=true;}
 activate(){this.pulse=this.t;this.needs=true;}
 cover(im,weight,scale=1,dx=0,dy=0){const nw=im?.naturalWidth||im?.videoWidth,nh=im?.naturalHeight||im?.videoHeight;if(!nw||weight<.001)return;const c=this.ctx,w=this.w,h=this.h,s=Math.max(w/nw,h/nh)*scale;const iw=nw*s,ih=nh*s;c.globalAlpha=weight;c.drawImage(im,(w-iw)/2+dx,(h-ih)/2+dy,iw,ih);}
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
  this.cinema.framePlates=this.frameLayers.filter(l=>l.weight>.002).map(layer=>{const spec=this.director.shots[layer.key],imageKey=layer.image,im=this.images[imageKey],v=this.director.plateTransform(layer,w,h,im);let rect=[0,0,1,1];if(im?.naturalWidth){const sz=Math.max(w/im.naturalWidth,h/im.naturalHeight)*v.scale,iw=im.naturalWidth*sz,ih=im.naturalHeight*sz;rect=[((w-iw)/2+v.dx+px*9)/w,((h-ih)/2+v.dy+py*5)/h,iw/w,ih/h];}return{...layer,image:imageKey,shadow:spec.cast,rect};});
  this.cinema.images=this.images;this.cinema.layouts=ASSETS.layouts;this.cinema.depth(p);
  this.events.nearby(currentParagraph,animated);const eventFrame=this.events.frame(dt,animated,currentParagraph);if(eventFrame){const spec=this.director.shots[eventFrame.name==='door'?'door-action':'document-shadow'],v=this.director.plateTransform({key:eventFrame.name==='door'?'door-action':'document-shadow',elapsed:0},w,h,this.images[eventFrame.key]);this.cover(eventFrame.media,eventFrame.weight,v.scale,v.dx,v.dy);}
  c.globalAlpha=1;
  c.fillStyle=`rgba(5,29,36,${p.cold*.11})`;c.fillRect(0,0,w,h);
  c.fillStyle=`rgba(8,7,19,${p.dim*.11})`;c.fillRect(0,0,w,h);
  const exterior=0,inside=1;
  // Rain and clouds stay at the window in each camera angle, including reverse shots.
  const windows={'window':[0,0,.54,1],'hearth':[0,0,.30,.84],'hearth-portrait':[0,0,.53,.75],'candles':[0,0,.46,.87],'desk':[0,0,.66,.60],'door':[0,0,.45,.9],'aisle':[0,0,.36,.85]};
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

  this.cinema.shot=this.shot;this.cinema.story=this.story.frame;this.cinema.render(dt,p,this.weights,null,animated);this.canvas.dataset.plates=this.cinema.framePlates.map(p=>p.image).join(',');this.canvas.dataset.shot=this.shot.key;this.canvas.dataset.shotNumber=String(this.shot.number);this.canvas.dataset.shotElapsed=this.shot.elapsed.toFixed(2);this.canvas.dataset.event=eventFrame?.name||'';this.canvas.dataset.depthPlanes=String(this.cinema.planes.size);this.canvas.dataset.videoStats=JSON.stringify(this.events.stats);


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
 prime(line=scrollY+readerLine()){this.refresh();this.previousY=scrollY;for(const p of this.positions)if(p.y<line-45)this.fired.add(p.el.id);world.story.sync(this.fired);this.candidate=null;},
 suppress(ms=800){this.suppressUntil=performance.now()+ms;this.candidate=null;},
 fire(el,manual=false){if(disposed)return;if(!manual&&this.fired.has(el.id))return;const name=el.dataset.cue,paragraph=+el.closest('[data-paragraph]').dataset.paragraph,kind=world.story.trigger(name,paragraph,el.id),videoPlayed=world.events.trigger(name,paragraph,el.id,settings.motion),delay=videoPlayed?(name==='door'?3.6:2.2):kind==='impact'?.22:kind==='document'?.55:0;const played=sound.play(name,+(el.dataset.pan||0),1,delay);this.fired.add(el.id);this.lastFire=performance.now();if(videoPlayed)world.director.pin(name==='door'?'door-action':'document-shadow',name==='door'?8:10);else if(kind){world.director.pin(kind==='document'?'document-shadow':kind==='impact'?'candle-light':kind==='seal'?'window-deep':'ink-light',kind==='seal'?9:7);sound.moment(kind);}world.needs=true;document.body.dataset.lastCue=el.id;document.body.dataset.lastCueAudio=String(played);persist();},
 check(now){const delta=scrollY-this.previousY;this.previousY=scrollY;if(!reading||document.hidden||$$('dialog[open]').length||now<this.suppressUntil){this.candidate=null;return;}const line=scrollY+readerLine();
  if(delta< -2||delta>innerHeight*.25){this.candidate=null;if(delta>innerHeight*.25){this.prime(line);sound.stopEffects();world.events.stop();}return;}
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
function readerLine(){const top=Number(document.documentElement.dataset.readerSectionsBottom)||0;return top?top+Math.max(0,innerHeight-top-76)*.49:innerHeight*.49;}
function updateReading(){if(!metrics.paragraphs.length)return;const line=scrollY+readerLine();reading=line>=metrics.first-80&&line<=metrics.last+innerHeight*.45;
 // Leave actual clear space for fixed branding; no extra blur, panel or opacity.
 const topClip=Math.max(0,Math.min(metrics.contentHeight,scrollY+Math.max(92,Number(document.documentElement.dataset.readerSectionsBottom)||0)-metrics.contentTop));
 const bottomClip=Math.max(0,Math.min(metrics.contentHeight,metrics.contentTop+metrics.contentHeight-(scrollY+innerHeight-76)));
 pageContent.style.clipPath=`inset(${Math.round(topClip)}px 0 ${Math.round(bottomClip)}px 0)`;
 let lo=0,hi=metrics.paragraphs.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(metrics.paragraphs[mid].top<=line)lo=mid;else hi=mid-1;}currentParagraph=lo;
 let scene=0;for(let i=1;i<SCENES.length;i++){if(line>=metrics.scenes[i])scene=i;else break;}sceneTo(scene);
 if(world.cinema.setParagraph(line<metrics.first-80?-1:currentParagraph,currentScene))world.needs=true;
 const progress=Math.max(0,Math.min(1,(line-metrics.first)/(metrics.last-metrics.first)));$('#progress-fill').style.transform=`scaleX(${progress})`;$('#progress-text').textContent=Math.round(progress*100)+'%';document.body.dataset.progress=String(Math.round(progress*100));
 $('#reading-dock').hidden=!reading;
 if(reading){const m=metrics.paragraphs[currentParagraph];lastPlace={paragraph:currentParagraph,anchor:BOOK.anchors[currentParagraph],fraction:Math.max(0,Math.min(1,(line-m.top)/m.height))};$('#resume-reading').hidden=false;}
}
function navigateScene(index){const s=SCENES[Math.max(1,Math.min(SCENES.length-1,index))];const el=$('#p-'+s.paragraph);if(el){const r=el.getBoundingClientRect();scrollTo({top:scrollY+r.top+Math.min(60,r.height*.22)-readerLine(),behavior:reduced.matches?'instant':'smooth'});}cueEngine.suppress();}
$('#previous-scene').addEventListener('click',()=>navigateScene(currentScene-1));$('#next-scene').addEventListener('click',()=>navigateScene(currentScene+1));
addEventListener('scroll',()=>{clearTimeout(scrollTimer);scrollTimer=setTimeout(persist,240);},{passive:true,signal:lifetime.signal});addEventListener('resize',remeasure,{passive:true,signal:lifetime.signal});document.fonts?.ready.then(measure);

function syncSettings(){root.style.setProperty('--book-size',settings.font+'px');root.style.setProperty('--book-line',settings.line);root.style.setProperty('--shade',settings.shade/100);root.style.setProperty('--book-font',settings.face==='serif'?"Georgia,'Times New Roman',serif":'var(--body)');
 const values={'font-size':settings.font,'line-height':settings.line,shade:settings.shade,'music-volume':settings.music,'effects-volume':settings.fx};for(const[id,v]of Object.entries(values))$('#'+id).value=v;
 $('#font-value').textContent=settings.font+' px';$('#line-value').textContent=String(settings.line).replace('.',',');$('#shade-value').textContent=settings.shade+'%';$('#music-value').textContent=settings.music+'%';$('#effects-value').textContent=settings.fx+'%';$('#motion').checked=settings.motion;$('#effects').checked=settings.effects;
 $$('[data-font]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.font===settings.face)));sound.applyLevels();if(!settings.motion)world.events.stop();world.needs=true;remeasure();persist();}
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
function goPlace(place,reset=false){measure();const p=readingStore.locate(place);if(!p)return;const m=metrics.paragraphs[p.paragraph],line=m.top+m.height*p.fraction;cueEngine.suppress(900);if(reset){cueEngine.fired.clear();world.story.reset();cueEngine.prime(line);}scrollTo({top:Math.max(0,line-readerLine()),behavior:reduced.matches?'instant':'smooth'});lastPlace=p;persist();}
function goParagraph(paragraph,fraction=.22){goPlace({paragraph,fraction});}
if(saved)$('#resume-reading').hidden=false;
$('#resume-reading').addEventListener('click',e=>{e.preventDefault();if(lastPlace||saved)goPlace(lastPlace||saved);});
$('#start-reading').addEventListener('click',()=>{cueEngine.fired.clear();cueEngine.candidate=null;world.story.reset();});
installSyolanaReaderTools({book:BOOK,store:readingStore,place:()=>lastPlace,go:goParagraph,restore:place=>{saved=place;goPlace(place,true);$('#resume-reading').hidden=false;},open:openDialog,toast});
let raf=0,lastFrame=0,perfFrames=0,perfSum=0,perfMax=0,perfStart=0;
function frame(now){if(disposed||document.hidden)return;raf=requestAnimationFrame(frame);if(now-lastFrame<32)return;const dt=Math.min(.08,(now-(lastFrame||now))/1000);lastFrame=now;const begin=performance.now();updateReading();cueEngine.check(now);world.draw(now/1000,dt);const cost=performance.now()-begin;perfFrames++;perfSum+=cost;perfMax=Math.max(perfMax,cost);if(now-perfStart>4000){world.canvas.dataset.performance=JSON.stringify({samples:perfFrames,meanDrawMs:+(perfSum/perfFrames).toFixed(2),maxDrawMs:+perfMax.toFixed(2)});perfStart=now;perfFrames=perfSum=perfMax=0;}}
document.addEventListener('visibilitychange',()=>{sound.visibility();world.events.visibility();if(document.hidden){cancelAnimationFrame(raf);persist();cueEngine.candidate=null;}else{lastFrame=0;measure();cueEngine.prime();raf=requestAnimationFrame(frame)}},{signal:lifetime.signal});
addEventListener('pagehide',()=>{persist();sound.stopEffects();world.events.stop()},{signal:lifetime.signal});
syncSettings();measure();sound.moodTo(SCENES[0].music);world.ready.then(()=>{measure();updateReading()});raf=requestAnimationFrame(frame);
window.SyolanaImmersion={ready:true,destroy(){if(disposed)return;persist();disposed=true;lifetime.abort();cancelAnimationFrame(raf);clearTimeout(measureTimer);clearTimeout(scrollTimer);clearTimeout(toastTimer);sound.destroy();world.events.destroy();world.cinema.destroy();for(const c of document.querySelectorAll('.world canvas')){c.width=1;c.height=1;c.remove();}world.images={};pageContent.style.removeProperty('clip-path');document.body.dataset.worldReady='false';document.body.dataset.audioState='closed';}};
// Expose a small read-only QA summary without storing or transmitting reader data.
window.SyolanaPreview={version:'MM07',get state(){return{scene:currentScene,paragraph:currentParagraph,audio:sound.enabled,audioState:sound.ctx?.state||'off',musicStems:ASSETS.music?['teal-hour']:[],videoEvents:{...world.events.stats},activeVideo:world.events.active?.name||null,depthPlanes:world.cinema.planes.size,worldCanvasCount:document.querySelectorAll('.world canvas').length,cueCount:cueEngine.items.length,phraseChanges:sound.phraseChanges,bookmarkKey:readingStore.key,cuesPlayed:[...cueEngine.fired],motion:settings.motion,settings:{...settings},imageCount:Object.keys(world.images).length}},get audioContext(){return sound.ctx},get soundtrack(){return sound}};
})();

})();
