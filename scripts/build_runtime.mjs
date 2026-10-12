import {build} from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist/public');
const result=await build({
 absWorkingDir:root,entryPoints:['boot.js','reader-ui.js',{in:'dist/public/artivid/app.js',out:'reader-app'}],outdir:path.join(out,'runtime'),
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
if(!entry)throw Error('Missing startup entry');
const script=entry[0].replace(/^dist\/public\//,'');
let html=fs.readFileSync(path.join(out,'index.html'),'utf8');
html=html.replace(/<link rel="modulepreload" href="runtime\/[^"]+">/g,'').replace(/<link rel="stylesheet" href="runtime\/site-[^"]+">/g,'');
html=html.replace(/src="(?:boot\.js[^\"]*|runtime\/boot-[^\"]*)"/,'src="'+script+'"');
const preload=[script,...entry[1].imports.filter(x=>x.kind==='import-statement').map(x=>x.path.replace(/^dist\/public\//,''))];
const app=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='app.js');
if(app)preload.push(app[0].replace(/^dist\/public\//,''));
html=html.replace('</head>',[...new Set(preload)].map(file=>'<link rel="modulepreload" href="'+file+'">').join('\n')+'\n</head>');
const cssFiles=['styles.css','assets/fonts/fonts.css','workspace.css','managed-sites.css','startup.css'];
const css=await build({stdin:{contents:cssFiles.map(name=>'@import "./'+name+'";').join('\n'),resolveDir:root,loader:'css'},bundle:true,minify:true,write:false,external:['*.woff','*.woff2','*.svg','*.png','*.jpg'],legalComments:'none'});
const {createHash}=await import('node:crypto');
let text=css.outputFiles[0].text;
text=text.replace(/url\((['"]?)(?:\.\/)?([^)'"\s]+)\1\)/g,(whole,quote,url)=>/^(?:data:|https?:|\/|\.\.\/)/.test(url)?whole:'url("../'+(fs.existsSync(path.join(root,'assets/fonts',url))?'assets/fonts/'+url:url)+'")');
const cssName='runtime/site-'+createHash('sha256').update(text).digest('hex').slice(0,16).toUpperCase()+'.css';
fs.writeFileSync(path.join(out,cssName),text);
html=html.replace(/\s*<link rel="stylesheet" href="(?:styles\.css|assets\/fonts\/fonts\.css|workspace\.css|managed-sites\.css)[^"]*"\s*\/?\s*>/g,'');
html=html.replace('</head>','<link rel="stylesheet" href="'+cssName+'">\n</head>');
fs.writeFileSync(path.join(out,'index.html'),html);
const readerEntry=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='dist/public/artivid/app.js');
const readerUI=Object.entries(result.metafile.outputs).find(([,value])=>value.entryPoint==='reader-ui.js');
if(readerEntry&&readerUI){const file=path.join(out,'artivid/index.html');let readerHTML=fs.readFileSync(file,'utf8');const js='../'+readerEntry[0].replace(/^dist\/public\//,'');const ui='../'+readerUI[0].replace(/^dist\/public\//,'');readerHTML=readerHTML.replace(/src="(?:app\.js[^"]*|\.\.\/runtime\/reader-app-[^"]*)"/,'src="'+js+'"');readerHTML=readerHTML.replace(/<script type="module" src="\.\.\/runtime\/reader-ui-[^"]+"><\/script>/g,'').replace(/<link rel="modulepreload" href="\.\.\/runtime\/[^"]+">/g,'');readerHTML=readerHTML.replace('</head>','<link rel="modulepreload" href="'+js+'"><link rel="stylesheet" href="../startup.css"></head>');readerHTML=readerHTML.replace('</body>','<script type="module" src="'+ui+'"></script></body>');fs.writeFileSync(file,readerHTML);}
const report={entry:script,css:cssName,outputs:Object.entries(result.metafile.outputs).map(([name,meta])=>({file:name.replace(/^dist\/public\//,''),bytes:meta.bytes,imports:meta.imports.map(x=>x.path.replace(/^dist\/public\//,''))}))};
fs.writeFileSync(path.join(root,'.runtime-build.json'),JSON.stringify(report,null,2));
console.log('Built immutable startup:',report.outputs.length,'modules,',script);
