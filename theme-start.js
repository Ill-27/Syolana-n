(function(themes){
 if(!themes.length)return;
 const root=document.documentElement;
 let old='';try{old=JSON.parse(localStorage.getItem('syolana:theme'))||'';}catch{}
 const requested=new URLSearchParams(location.search).get('theme');
 const choices=themes.filter(t=>t.id!==old);
 const theme=themes.find(t=>t.id===requested)||(choices.length?choices:themes)[Math.floor(Math.random()*(choices.length||themes.length))];
 window.__syolanaInitialTheme=theme.id;
 root.dataset.theme=theme.id;root.dataset.themePending='true';
 for(const [name,value]of Object.entries(theme.style))if(value)root.style.setProperty('--'+name,value);
 const preview=theme.portrait&&innerHeight>innerWidth?theme.portrait:theme.preview;
 root.style.setProperty('--startup-poster','url("'+new URL(preview,document.baseURI).href+'")');
 root.style.setProperty('--startup-backdrop',theme.backdrop);
 const poster=document.createElement('link');poster.rel='preload';poster.as='image';poster.href=new URL(preview,document.baseURI).href;poster.fetchPriority='high';document.head.append(poster);
 if(theme.entry){const preload=document.createElement('link');preload.rel='modulepreload';preload.href=new URL(theme.entry,document.baseURI).href;document.head.append(preload);}
})(typeof __INITIAL_THEMES__==='undefined'?[]:__INITIAL_THEMES__);
