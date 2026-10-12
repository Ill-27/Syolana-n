const rgb=hex=>hex.match(/[a-f\d]{2}/gi).map(v=>parseInt(v,16));
const luminance=values=>values.map(v=>{const c=v/255;return c<=.04045?c/12.92:((c+.055)/1.055)**2.4;}).reduce((sum,c,i)=>sum+c*[.2126,.7152,.0722][i],0);
export function contrastRatio(a,b){const x=luminance(typeof a==='string'?rgb(a):a),y=luminance(typeof b==='string'?rgb(b):b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
const hex=values=>'#'+values.map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
function readable(ink,background,minimum=4.8){const c=rgb(ink);for(let t=0;t<=1;t+=.025){const next=c.map(v=>v+(255-v)*t);if(contrastRatio(next,background)>=minimum)return hex(next);}return '#ffffff';}
export function themeTypography(theme,time=0){
 const rgba=(theme.panel?.bg||`rgba(${theme.surface},.68)`).match(/[\d.]+/g).map(Number),alpha=Math.max(.68,rgba[3]||1),background=rgba.slice(0,3).map(v=>v*alpha+255*(1-alpha));
 const text=readable(theme.panel?.text||'#f8f6ff',background),muted=readable(theme.panel?.muted||theme.dim,background),label=readable(theme.accent,background);
 const palettes={'violet-bloom':['#42234e','#67416f','#56266d','#74338a'],'amber-forest':['#302015','#50321d','#673814','#603410'],'white-ocean-city':['#15353d','#31545b','#20464e','#20464e'],'living-sea':['#071e2a','#102d3a','#092838','#092838']};
 const light=!!palettes[theme.id]&&(!theme.pageToneAt||theme.pageToneAt(time)==='light'),page=light?palettes[theme.id]:[text,muted,label,label];
 return{panelBackground:`rgba(${rgba.slice(0,3).join(',')},${alpha})`,panelText:text,panelMuted:muted,panelLabel:label,
  pageText:page[0],pageMuted:page[1],pageHeading:page[2],pageLabel:page[3],
  headingShadow:light?'0 1px 2px rgba(255,255,255,.72), 0 2px 10px rgba(40,25,45,.10)':'0 1px 2px rgba(5,10,18,.95), 0 2px 12px rgba(5,10,18,.80)',
 };
}
