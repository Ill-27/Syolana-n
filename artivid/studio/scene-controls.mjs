// Neutral editor controls. Licensed scenes are loaded from their existing host.
export function setupStudioScene(engine,setupFlightLayer){
 if(document.getElementById('studio-zen-exit'))return;
 const actions=document.createElement('div');actions.className='top-actions studio-scene-actions';
 const toggle=document.createElement('button');toggle.id='zen-toggle';toggle.type='button';toggle.className='icon-btn glass';toggle.title='Режим созерцания';toggle.setAttribute('aria-label',toggle.title);toggle.setAttribute('aria-pressed','false');toggle.textContent='◉';actions.append(toggle);
 (document.querySelector('.studio-head-actions')||document.querySelector('.studio-head'))?.append(actions);
 const exit=document.createElement('button');exit.id='studio-zen-exit';exit.type='button';exit.className='icon-btn glass';exit.title='Вернуться в редактор';exit.setAttribute('aria-label',exit.title);exit.textContent='×';exit.hidden=true;document.body.append(exit);
 const style=document.createElement('style');style.textContent=`
 .studio-scene-actions{display:flex;gap:10px}.studio-scene-actions .icon-btn,#studio-zen-exit{display:grid;place-items:center;width:48px;height:48px;min-width:48px;border:1px solid #ddd0ef45;border-radius:50%;color:inherit;background:rgba(var(--surface,9,9,23),.5);font:1.5rem system-ui;cursor:pointer}.studio-scene-actions svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
 body.zen{overflow:hidden}body.zen .studio-shell{visibility:hidden;pointer-events:none}body.zen #studio-theme-backdrop{display:none}#studio-zen-exit{position:fixed;right:max(20px,env(safe-area-inset-right));top:max(20px,env(safe-area-inset-top));z-index:1100}#studio-zen-exit[hidden]{display:none}
 #flight-layer{position:fixed;inset:0;z-index:1000;touch-action:none}#flight-layer[hidden]{display:none}#flight-layer .flight-hint{display:none}
 `;document.head.append(style);
 const layer=setupFlightLayer({theme:engine,offers:[]});
 let active=false,focusBefore=null;
 function set(value){active=value;document.body.classList.toggle('zen',active);engine.setZen(active);layer.hidden=!active;exit.hidden=!active;toggle.setAttribute('aria-pressed',String(active));if(active){focusBefore=document.activeElement;exit.focus();}else focusBefore?.focus?.();}
 toggle.addEventListener('click',()=>set(!active));exit.addEventListener('click',()=>set(false));document.addEventListener('keydown',e=>{if(active&&e.key==='Escape'){e.preventDefault();set(false);}});
}

export async function startStudioScene({engineURL,flightURL,themeKey='',initialTheme=''}={}){
 if(document.getElementById('starCanvas'))return;
 const style=document.createElement('style');style.textContent=`
 html,body{min-height:100%;background:transparent!important}body{position:relative}#starCanvas{position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:-1}#studio-theme-backdrop{position:fixed;inset:0;pointer-events:none;z-index:-6;background:radial-gradient(circle at 50% 10%,#26384b,#080912 58%,#030309)}#studio-theme-helper{position:fixed;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);opacity:0;pointer-events:none}.studio-shell{position:relative;z-index:1}.studio-shell>.glass,.studio-grid>.glass,.builder-preview,.builder-block{background:rgba(var(--surface,9,9,23),.53)!important;backdrop-filter:blur(12px) saturate(112%);-webkit-backdrop-filter:blur(12px) saturate(112%)}
 `;document.head.append(style);
 const backdrop=document.createElement('div');backdrop.id='studio-theme-backdrop';document.body.prepend(backdrop);
 const canvas=document.createElement('canvas');canvas.id='starCanvas';canvas.setAttribute('aria-hidden','true');document.body.prepend(canvas);
 const helper=document.createElement('div');helper.id='studio-theme-helper';helper.setAttribute('aria-hidden','true');helper.innerHTML='<button id="theme-toggle" type="button"></button><span id="theme-name"></span><dialog id="theme-dialog"><div id="theme-list"></div></dialog>';document.body.append(helper);
 const [{ThemeEngine},{setupFlightLayer}]=await Promise.all([import(engineURL),import(flightURL)]);
 const engine=new ThemeEngine();setupStudioScene(engine,setupFlightLayer);await engine.init();
 let selected=initialTheme;try{if(themeKey)selected=JSON.parse(localStorage.getItem(themeKey)||'null')?.theme||selected;}catch{}
 if(selected)await engine.select(selected);
 window.addEventListener('syolana:builder-theme',e=>{if(e.detail?.theme)engine.select(e.detail.theme).catch(()=>{});});
 window.addEventListener('syolana:theme-previews',()=>{document.getElementById('theme-dialog').setAttribute('open','');engine.startPreviews();});
 return engine;
}
