// Keep CSS dimensions independent of the physical render target.
export function sceneResolution({width,height,ratio=1},{maxPixels=2500000,mobileRatio=1.8,desktopRatio=2}={}){
 const cssWidth=Math.max(1,Number(width)||1),cssHeight=Math.max(1,Number(height)||1),requested=Number.isFinite(ratio)&&ratio>0?ratio:1;
 const pixelRatio=Math.min(requested,cssWidth<=760?mobileRatio:desktopRatio,Math.sqrt(maxPixels/(cssWidth*cssHeight)));
 return{cssWidth,cssHeight,pixelRatio,width:Math.max(1,Math.round(cssWidth*pixelRatio)),height:Math.max(1,Math.round(cssHeight*pixelRatio))};
}
