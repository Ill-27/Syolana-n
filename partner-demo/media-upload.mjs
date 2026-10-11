// Phone photos are reduced locally before upload; video is never re-encoded.
export async function prepareMediaUpload(file){
 const limit=2*1024*1024;
 if(!['image/jpeg','image/png','image/webp','video/mp4','video/webm'].includes(file.type))throw Error('Выберите JPG, PNG, WebP, MP4 или WebM.');
 if(file.size<=limit)return file;
 if(file.type.startsWith('video/'))throw Error('Для загрузки выберите короткое видео до 2 МБ. Более длинное видео можно разместить во ВКонтакте.');
 if(file.size>30*1024*1024)throw Error('Выберите фотографию до 30 МБ. Она автоматически уменьшится для сайта.');
 let image,objectUrl;
 try{
  if(typeof createImageBitmap==='function')image=await createImageBitmap(file);
  else{objectUrl=URL.createObjectURL(file);image=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error());img.src=objectUrl;});}
  const canvas=document.createElement('canvas'),scale=Math.min(1,1600/Math.max(image.width,image.height));
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const context=canvas.getContext('2d');if(!context)throw Error();context.drawImage(image,0,0,canvas.width,canvas.height);
  const type=file.type==='image/jpeg'?'image/jpeg':'image/webp';
  for(const quality of [.86,.74,.6]){
   const blob=await new Promise(resolve=>canvas.toBlob(resolve,type,quality));
   if(blob&&blob.size<=limit)return new File([blob],file.name.replace(/\.[^.]*$/,'')+(blob.type==='image/jpeg'?'.jpg':blob.type==='image/webp'?'.webp':'.png'),{type:blob.type,lastModified:file.lastModified});
  }
  throw Error();
 }catch{throw Error('Не удалось подготовить фото. Выберите другой файл или сохраните его в память телефона.');}
 finally{image?.close?.();if(objectUrl)URL.revokeObjectURL(objectUrl);}
}
