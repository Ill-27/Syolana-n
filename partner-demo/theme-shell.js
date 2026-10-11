const style=document.createElement('style');
style.textContent=`
  body{position:relative;background:#050610!important}
  #partner-theme-backdrop{position:fixed;inset:0;z-index:-6;background:radial-gradient(circle at 50% 10%,#26384b,#080912 58%,#030309);pointer-events:none}
  #starCanvas{position:fixed!important;inset:0!important;width:100vw!important;height:100vh!important;z-index:-5!important;display:block!important;pointer-events:none!important;opacity:.98}
  body>.site-header,body>main,body>.syolana-attribution,body>footer{position:relative;z-index:1}
  body>.glass,main .glass,.post{background:rgba(8,10,19,.64)!important;backdrop-filter:blur(15px) saturate(118%);-webkit-backdrop-filter:blur(15px) saturate(118%)}
  #partner-theme-helper{position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none}
`;
document.head.append(style);
const backdrop=document.createElement('div');backdrop.id='partner-theme-backdrop';document.body.prepend(backdrop);
const canvas=document.createElement('canvas');canvas.id='starCanvas';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
const helper=document.createElement('div');helper.id='partner-theme-helper';helper.setAttribute('aria-hidden','true');helper.innerHTML='<button id="theme-toggle" type="button"></button><span id="theme-name"></span><dialog id="theme-dialog"><div id="theme-list"></div></dialog>';document.body.append(helper);
let engine,pending='';
window.addEventListener('syolana:partner-theme',e=>{const id=e.detail?.theme;if(!id)return;pending=id;if(engine)engine.select(id).catch(()=>{});});
window.addEventListener('syolana:builder-theme',e=>{const id=e.detail?.theme;if(!id)return;pending=id;if(engine)engine.select(id).catch(()=>{});});
try{
  const {ThemeEngine}=await import('../themes.js?v=20261011-independent-1');engine=new ThemeEngine();await engine.init();
  try{const data=await fetch('./partner.json',{cache:'no-store'}).then(r=>r.ok?r.json():null);const saved=data?.demo?JSON.parse(localStorage.getItem('partner-demo.settings.'+data.id)||'null')?.theme:data?.theme;pending=pending||saved||'';}catch{}
  if(pending)await engine.select(pending).catch(()=>{});
}catch(error){console.warn('Partner live theme unavailable',error);}
