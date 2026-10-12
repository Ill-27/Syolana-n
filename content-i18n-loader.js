const NativeMutationObserver=window.MutationObserver;
class GuardedMutationObserver extends NativeMutationObserver{
  constructor(callback){
    let last=-Infinity;
    super((records,observer)=>{
      const now=performance.now();
      if(now-last<160)return;
      last=now;
      callback(records,observer);
    });
  }
}
window.MutationObserver=GuardedMutationObserver;
try{
  await import('./content-i18n.js?v=20261012-i18n-3');
}finally{
  window.MutationObserver=NativeMutationObserver;
}
