export const ATTRIBUTION_TEXT='Сайт создан на Syolana';
const ROOT=new URL('./',import.meta.url);
const BRAND_ROOT=/^(?:www\.)?syolana\.com$|^syolana(?:-pilot-[a-z0-9]+)?\.website\.yandexcloud\.net$/.test(ROOT.hostname)?ROOT:new URL('https://syolana.com/');
export function prepareAttribution(link){
 if(!link)return link;
 if(!document.querySelector('link[data-syolana-credit-style]')){
  const css=document.createElement('link');css.rel='stylesheet';css.href=new URL('partner-attribution.css',ROOT).href;css.dataset.syolanaCreditStyle='true';css.referrerPolicy='no-referrer';document.head.append(css);
 }
 link.title='syolana.com — автор оформления';link.href='https://syolana.com/';link.target='_blank';link.rel='noopener noreferrer';link.classList.add('syolana-credit');
 link.replaceChildren();
 const image=document.createElement('img');image.src=new URL('assets/logo.svg?v=20261014-passport-1',BRAND_ROOT).href;image.alt='';image.width=28;image.height=28;image.dataset.syolanaLogo='true';image.decoding='async';
 const text=document.createElement('span');text.textContent=ATTRIBUTION_TEXT;link.append(image,text);return link;
}
export function normalizePartnerFooter(link){
 const footer=link?.closest('footer');if(!footer)return prepareAttribution(link);
 if(!footer.classList.contains('partner-footer')){
  footer.classList.add('partner-footer');
  const meta=document.createElement('div');meta.className='partner-footer-meta';
  const nav=document.createElement('nav');nav.className='partner-footer-nav';nav.setAttribute('aria-label','Информация о сайте');
  for(const node of [...footer.children])if(node!==link){if(node.tagName==='A')nav.append(node);else meta.append(node);}
  if(nav.childElementCount)meta.append(nav);
  const row=document.createElement('p');row.className='partner-footer-credit';row.append(link);footer.append(meta,row);
 }
 return prepareAttribution(link);
}
