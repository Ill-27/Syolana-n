const SELECTOR='#page :is(h1,h2,h3,h4,h5,h6),#banner h2,#discovery-tip h3';
const states=new WeakMap(),observed=new Set();
let context,scheduled=false,installed=false;

export function headingSize(base,width,wordWidth){
 if(!(base>0&&width>0&&wordWidth>0))return base;
 return Math.min(base,Math.max(Math.min(base,18),Math.floor(base*(width-4)/wordWidth*10)/10));
}
function schedule(){
 if(scheduled)return;scheduled=true;
 requestAnimationFrame(()=>{scheduled=false;fitHeadings();});
}
const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
 if(entries.some(({target})=>target.isConnected&&states.get(target)?.width!==target.clientWidth))schedule();
}):null;

export function fitHeadings(){
 if(!installed){installed=true;window.addEventListener('resize',schedule,{passive:true});document.fonts?.ready?.then(schedule);document.fonts?.addEventListener?.('loadingdone',schedule);}
 const headings=[...document.querySelectorAll(SELECTOR)].filter(n=>!n.closest('.reader-text,.poem-text,.course-scroll,.partner-site-content'));
 for(const old of observed)if(!old.isConnected){observer?.unobserve(old);observed.delete(old);}
 for(const node of headings){
  if(!node.clientWidth)continue;
  let state=states.get(node);
  if(!state){state={original:node.style.getPropertyValue('font-size'),priority:node.style.getPropertyPriority('font-size')};states.set(node,state);}
  if(state.fitted){
   if(state.original)node.style.setProperty('font-size',state.original,state.priority);else node.style.removeProperty('font-size');
   state.fitted=false;
  }
  const style=getComputedStyle(node),base=parseFloat(style.fontSize);
  const width=node.clientWidth-(parseFloat(style.paddingLeft)||0)-(parseFloat(style.paddingRight)||0);
  state.width=node.clientWidth;
  if(!observed.has(node)){observed.add(node);observer?.observe(node);}
  if(!(base>0&&width>4))continue;
  context??=document.createElement('canvas').getContext('2d');
  if(!context)continue;
  context.font=[style.fontStyle,style.fontWeight,base+'px',style.fontFamily].join(' ');
  const letterSpacing=parseFloat(style.letterSpacing)||0;
  const lines=[...node.querySelectorAll('.banner-title-line')];
  const words=lines.length?lines.map(n=>n.textContent):node.textContent.trim().split(/\s+/u);
  const longest=Math.max(0,...words.map(word=>{
   const m=context.measureText(word);
   return Math.max(m.width,(m.actualBoundingBoxLeft||0)+(m.actualBoundingBoxRight||0))+Math.max(0,Array.from(word).length-1)*letterSpacing;
  }));
  const size=headingSize(base,width,longest);
  if(size<base-.1){node.style.setProperty('font-size',size+'px','important');state.fitted=true;}
 }
}
