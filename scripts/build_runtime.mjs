import {build} from 'esbuild';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const repositoryRoot=fileURLToPath(new URL('../',import.meta.url));
const root=fs.existsSync(path.join(repositoryRoot,'public-site/boot.js'))?path.join(repositoryRoot,'public-site'):repositoryRoot;
const {themeTypography}=await import(pathToFileURL(path.join(root,'themes/theme-typography.mjs')).href);
const out=path.join(root,'dist/public');
const result=await build({
 absWorkingDir:root,entryPoints:['boot.js','reader-ui.js'],outdir:path.join(out,'runtime'),
 bundle:true,splitting:true,format:'esm',platform:'browser',target:['es2022'],
 minify:true,charset:'utf8',legalComments:'none',metafile:true,
 entryNames:'[name]-[hash]',chunkNames:'chunk-[name]-[hash]',
 plugins:[{name:'local-module-identity',setup(api){
  api.onResolve({filter:/^\..*\?.*$/},args=>({path:path.resolve(args.resolveDir,args.path.split('?')[0])}));
  api.onLoad({filter:/\.(?:js|mjs)$/},args=>{
   let contents=fs.readFileSync(args.path,'utf8');
   let original=path.relative(root,args.path).split(path.sep).join('/');if(original.startsWith('dist/public/artivid/'))original=original.slice('dist/public/artivid/'.length);
   contents=contents.replace(/\bimport\.meta\.url\b/g,'new URL('+JSON.stringify(original)+',document.baseURI).href');
   return {contents,loader:'js'};
  });
 }}],
});
const entry=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='boot.js');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'themes/manifest.json'),'utf8'));
const initialThemes=await Promise.all(manifest.map(async item=>{
 const theme=(await import(pathToFileURL(path.join(root,'themes',item.id+'.js')).href)).default,ink=themeTypography(theme,0);
 const entry=Object.entries(result.metafile.outputs).find(([,v])=>v.entryPoint==='themes/'+item.id+'.js');
 return{id:item.id,portrait:item.id==='moon'?'themes/previews/moon-portrait.jpg?v='+createHash('sha256').update(fs.readFileSync(path.join(root,'themes/previews/moon-portrait.jpg'))).digest('hex').slice(0,12):undefined,preview:'themes/previews/'+item.id+'.jpg?v='+createHash('sha256').update(fs.readFileSync(path.join(root,'themes/previews',item.id+'.jpg'))).digest('hex').slice(0,12),backdrop:item.preview,entry:entry?.[0].replace(/^dist\/public\//,''),style:{accent:ink.panelLabel,dim:ink.panelMuted,surface:theme.surface,radius:theme.radius,'panel-bg':ink.panelBackground,'page-text':ink.pageText,'page-muted':ink.pageMuted,'page-heading':ink.pageHeading,'page-label':ink.pageLabel,'page-heading-shadow':ink.headingShadow,'panel-label':ink.panelLabel,'panel-border':theme.panel?.border,'panel-glow':theme.panel?.glow,'panel-text':ink.panelText,'panel-muted':ink.panelMuted}};
}));
async function firstPaint(themes){return(await build({stdin:{contents:fs.readFileSync(path.join(root,'theme-start.js'),'utf8'),loader:'js'},define:{__INITIAL_THEMES__:JSON.stringify(themes)},minify:true,write:false,charset:'utf8',legalComments:'none'})).outputFiles[0].text;}
const startup=await firstPaint(initialThemes);fs.writeFileSync(path.join(out,'theme-start.js'),startup);
function attachFirstPaint(html,code){html=html.replace(/<script[^>]*(?:src="theme-start\.js"|data-theme-start)[^>]*>[\s\S]*?<\/script>/g,'').replace(/<style data-theme-start>[\s\S]*?<\/style>/g,'');return html.replace(/<head>/,'<head><style data-theme-start>html{background:#030309}</style><script data-theme-start>'+code.replace(/<\/script/gi,'<\\/script')+'</script>');}
if(!entry)throw Error('Missing startup entry');
const script=entry[0].replace(/^dist\/public\//,'');
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
html=attachFirstPaint(html,startup);
html=html.replace(/<link rel="modulepreload" href="runtime\/[^"]+">/g,'').replace(/<link rel="stylesheet" href="runtime\/site-[^"]+">/g,'');
html=html.replace(/src="(?:boot\.js[^\"]*|runtime\/boot-[^\"]*)"/,'src="'+script+'"');
const preload=[script,...entry[1].imports.filter(x=>x.kind==='import-statement').map(x=>x.path.replace(/^dist\/public\//,''))];
const app=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='app.js');
if(app)preload.push(app[0].replace(/^dist\/public\//,''));
html=html.replace('</head>',[...new Set(preload)].map(file=>'<link rel="modulepreload" href="'+file+'">').join('\n')+'\n</head>');
const cssFiles=['styles.css','assets/fonts/fonts.css','workspace.css','managed-sites.css','startup.css'];
const css=await build({stdin:{contents:cssFiles.map(name=>'@import "./'+name+'";').join('\n'),resolveDir:root,loader:'css'},bundle:true,minify:true,write:false,external:['*.woff','*.woff2','*.svg','*.png','*.jpg'],legalComments:'none'});

let text=css.outputFiles[0].text;
text=text.replace(/url\((['"]?)(?:\.\/)?([^)'"\s]+)\1\)/g,(whole,quote,url)=>/^(?:data:|https?:|\/|\.\.\/)/.test(url)?whole:'url("../'+(fs.existsSync(path.join(root,'assets/fonts',url))?'assets/fonts/'+url:url)+'")');
const cssName='runtime/site-'+createHash('sha256').update(text).digest('hex').slice(0,16).toUpperCase()+'.css';
fs.writeFileSync(path.join(out,cssName),text);
html=html.replace(/\s*<link rel="stylesheet" href="(?:styles\.css|assets\/fonts\/fonts\.css|workspace\.css|managed-sites\.css)[^"]*"\s*\/?\s*>/g,'');
html=html.replace('</head>','<link rel="stylesheet" href="'+cssName+'">\n</head>');
fs.writeFileSync(path.join(out,'index.html'),html);
const readerEntry=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='dist/public/artivid/app.js');
const readerUI=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='reader-ui.js');
if(readerEntry&&readerUI){const file=path.join(out,'artivid/index.html');let readerHTML=fs.readFileSync(file,'utf8');readerHTML=readerHTML.replace(/<link rel="stylesheet" href="\.\.\/startup\.css"\s*\/?>/g,'');const js='../'+readerEntry[0].replace(/^dist\/public\//,'');const ui='../'+readerUI[0].replace(/^dist\/public\//,'');readerHTML=readerHTML.replace(/src="(?:app\.js[^"]*|\.\.\/runtime\/reader-app-[^"]*)"/,'src="'+js+'"');readerHTML=readerHTML.replace(/<script type="module" src="\.\.\/runtime\/reader-ui-[^"]+"><\/script>/g,'').replace(/<link rel="modulepreload" href="\.\.\/runtime\/[^"]+">/g,'');readerHTML=readerHTML.replace('</head>','<link rel="modulepreload" href="'+js+'"><link rel="stylesheet" href="../startup.css"></head>');readerHTML=readerHTML.replace('</body>','<script type="module" src="'+ui+'"></script></body>');fs.writeFileSync(file,readerHTML);}
const report={entry:script,css:cssName,outputs:Object.entries(result.metafile.outputs).map(([name,meta])=>({file:name.replace(/^dist\/public\//,''),bytes:meta.bytes,imports:meta.imports.map(x=>x.path.replace(/^dist\/public\//,''))}))};
fs.writeFileSync(path.join(root,'.runtime-build.json'),JSON.stringify(report,null,2));
console.log('Built immutable startup:',report.outputs.length,'modules,',script);
