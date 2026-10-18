export function prepareStartupTypography(doc){
 const font=doc.fonts?.load?.('400 32px "Syolana Script"');
 const logo=doc.querySelector('#chrome .brand img');
 return Promise.allSettled([font,logo?.decode?.()]);
}

export async function finishStartupUI(doc,typography){
 const win=doc.defaultView;
 let timeout;
 const fallback=new Promise(resolve=>{timeout=win.setTimeout(resolve,10000);});
 try{
  await Promise.race([(async()=>{
   await typography;
   // The initial route may introduce reading fonts after the main module loads.
   doc.body.getBoundingClientRect();
   await doc.fonts?.ready;
  })(),fallback]);
 }finally{
  win.clearTimeout(timeout);
  win.__syolanaRevealUI?.();
  doc.documentElement.removeAttribute('data-ui-pending');
 }
}
