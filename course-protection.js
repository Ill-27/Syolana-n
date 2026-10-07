// Deters ordinary copying. Access control and attribution remain server concerns.
// Keep editable fields and account controls usable; remove every listener on exit.
export function protectCourseText(doc=document){
  const body=doc.body;if(!body)return ()=>{};
  const original=body.classList.contains('syolana-course-protected');
  body.classList.add('syolana-course-protected');
  const editable=target=>target?.nodeType===1&&!!target.closest('input,textarea,[contenteditable="true"],[data-copy-allowed]');
  const block=e=>{if(editable(e.target))return;e.preventDefault();};
  const menu=e=>{if(editable(e.target)||e.target?.closest?.('button,a,select'))return;e.preventDefault();};
  const keys=e=>{if(editable(e.target))return;if((e.ctrlKey||e.metaKey)&&['c','x','a'].includes(e.key.toLowerCase()))e.preventDefault();};
  doc.addEventListener('copy',block,true);doc.addEventListener('cut',block,true);
  doc.addEventListener('selectstart',block,true);doc.addEventListener('contextmenu',menu,true);
  doc.addEventListener('keydown',keys,true);
  return ()=>{doc.removeEventListener('copy',block,true);doc.removeEventListener('cut',block,true);doc.removeEventListener('selectstart',block,true);doc.removeEventListener('contextmenu',menu,true);doc.removeEventListener('keydown',keys,true);if(!original)body.classList.remove('syolana-course-protected');};
}

