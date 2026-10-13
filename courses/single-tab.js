// Transient coordination between paid tabs of this origin. No device record.
export function claimCourseTab({onReplaced,Channel=globalThis.BroadcastChannel,now=Date.now,id=globalThis.crypto?.randomUUID?.()}={}){
 if(typeof onReplaced!=='function')throw Error('Missing replacement callback');
 if(typeof Channel!=='function'||!id){queueMicrotask(()=>onReplaced('Этот браузер не поддерживает проверку одной вкладки. Откройте курс в актуальном браузере.'));return()=>{};}
 let closed=false;const stamp=now(),channel=new Channel('syolana-paid-course-tab-v1');
 const own={type:'claim',id,stamp};
 const compare=m=>m.stamp===stamp?String(m.id).localeCompare(id):m.stamp-stamp;
 const stop=()=>{if(closed)return;closed=true;channel.close();};
 channel.onmessage=event=>{
  const m=event.data;if(closed||m?.type!=='claim'||typeof m.id!=='string'||m.id===id||!Number.isSafeInteger(m.stamp))return;
  if(compare(m)>0){stop();onReplaced('Курс открыт в другой вкладке этого браузера. Здесь доступ завершён.');}
  else channel.postMessage(own);
 };
 channel.postMessage(own);return stop;
}
