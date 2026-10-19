// Fixed controls use one coordinate space, including wide layouts on mobile browsers.
export function floatingViewport(win){
 const right=win.document.documentElement.clientWidth||win.innerWidth,stable=right>=800,view=win.visualViewport;
 const top=stable?0:view?.offsetTop||0;
 return {top,bottom:top+(stable?win.innerHeight:view?.height||win.innerHeight),right,stable};
}

export function floatingRect(node,viewport,win=node.ownerDocument.defaultView){
 const rect=node.getBoundingClientRect();if(!viewport.stable)return rect;
 const css=win.getComputedStyle(node);if(css.position!=='fixed')return rect;
 const height=node.offsetHeight||rect.height,width=node.offsetWidth||rect.width;
 const insetBottom=parseFloat(css.bottom),insetTop=parseFloat(css.top),insetRight=parseFloat(css.right),insetLeft=parseFloat(css.left);
 const top=css.bottom!=='auto'&&Number.isFinite(insetBottom)?viewport.bottom-insetBottom-height:css.top!=='auto'&&Number.isFinite(insetTop)?viewport.top+insetTop:rect.top;
 const left=css.right!=='auto'&&Number.isFinite(insetRight)?viewport.right-insetRight-width:css.left!=='auto'&&Number.isFinite(insetLeft)?insetLeft:rect.left;
 return {top,left,width,height,right:left+width,bottom:top+height};
}
