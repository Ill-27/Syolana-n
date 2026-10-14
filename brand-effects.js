function installBrandStyles() {
  if(document.getElementById('syolana-brand-effects-style'))return;
  const style=document.createElement('style');
  style.id='syolana-brand-effects-style';
  style.textContent='.syolana-avito-float,.syolana-avito-float:visited,.syolana-avito-float:hover,.syolana-avito-float:focus-visible,.syolana-avito-float-label{color:#fffdfb!important;text-shadow:0 1px 8px rgba(0,0,0,.58)!important}';
  document.head.append(style);
}
installBrandStyles();
