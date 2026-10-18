// A visual cover is not an access grant. The renderer still requires a fresh server permission.
export function startDesignLoading(theme='aurora'){
 if(window.__syolanaDesignBoot)return window.__syolanaDesignBoot;
 const root=document.documentElement,known=['living-sea','amber-forest','white-ocean-city','aurora','golden','moon','violet-bloom'];
 try{const saved=window.sessionStorage.getItem('syolana.design-poster');if(known.includes(saved))theme=saved;}catch{}
 if(!known.includes(theme))theme='aurora';
 root.dataset.syolanaDesign='pending';root.removeAttribute('data-syolana-plain');
 const style=document.createElement('style');style.dataset.syolanaStartStyle='true';style.textContent=`
html[data-syolana-design=pending]{background:#19172e!important}
html[data-syolana-design=pending] body{visibility:hidden!important}
#syolana-design-loading{visibility:visible!important;position:fixed!important;inset:0!important;z-index:2147483000!important;display:grid!important;place-items:center!important;box-sizing:border-box!important;padding:24px!important;background:#19172e center/cover no-repeat!important;background-image:var(--syolana-start-poster)!important;color:#fff!important;font:16px/1.5 system-ui,sans-serif!important;isolation:isolate!important}
#syolana-design-loading>section{max-width:400px;padding:24px;background:rgba(18,17,31,.9);border-radius:20px;text-align:center;color:#fff}
#syolana-design-loading [hidden]{display:none!important}
#syolana-design-loading button{font:inherit;padding:10px 14px;margin:6px;border:1px solid #c7badc;border-radius:12px;color:#fff;background:#393045;cursor:pointer}
`;document.head.append(style);
 const cover=document.createElement('div');cover.id='syolana-design-loading';cover.setAttribute('role','status');cover.setAttribute('aria-label','Загрузка оформления');cover.style.setProperty('--syolana-start-poster','url("https://syolana.com/themes/previews/'+theme+'.jpg")');
 const panel=document.createElement('section');panel.hidden=true;
 const text=document.createElement('p');text.textContent='Оформление загружается дольше обычного.';
 const retry=document.createElement('button');retry.type='button';retry.textContent='Повторить';retry.onclick=()=>location.reload();
 const content=document.createElement('button');content.type='button';content.textContent='Открыть материалы без оформления';content.onclick=()=>{root.dataset.syolanaDesign='off';root.setAttribute('data-syolana-plain','');finish();};panel.append(text,retry,content);cover.append(panel);
 let waiting,done=false;
 function attach(){if(done||!document.body)return;document.body.append(cover);waiting?.disconnect();}
 if(document.body)attach();else{waiting=new window.MutationObserver(attach);waiting.observe(root,{childList:true});}
 const timer=window.setTimeout(()=>{if(!done)panel.hidden=false;},10000);
 function finish(activeTheme){if(done)return;done=true;window.clearTimeout(timer);waiting?.disconnect();cover.remove();style.remove();if(known.includes(activeTheme))try{window.sessionStorage.setItem('syolana.design-poster',activeTheme);}catch{}delete window.__syolanaDesignBoot;}
 return window.__syolanaDesignBoot={finish,unavailable(){if(!done)panel.hidden=false;}};
}
export function finishDesignLoading(theme){window.__syolanaDesignBoot?.finish(theme);}
export function designStartHead(theme='aurora'){
 const value=JSON.stringify(theme).replaceAll('<','\\u003c');
 return '<script data-syolana-design-start>('+startDesignLoading.toString()+')('+value+');</script>';
}
