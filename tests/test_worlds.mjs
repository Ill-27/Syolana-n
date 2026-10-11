import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {sceneResolution} from '../themes/scene-quality.mjs';
import {petalGeometry,leafGeometry,stemGeometry,butterflyGeometry,butterflyBodyGeometry,portraitGeometry,botanicalInstances} from '../themes/botanical-world.mjs';
import {stringGeometry,stringInstances} from '../themes/celestial-world.mjs';
import {perspective,lookAt,multiply} from '../themes/world-gl.mjs';
import {createSceneMotion} from '../themes/scene-motion.mjs';
import {createSiteArchive} from '../site-export.mjs';

for(const geometry of [petalGeometry(),leafGeometry(),stemGeometry(),butterflyGeometry(),butterflyBodyGeometry(),stringGeometry()]){
 const count=geometry.positions.length/3;assert(Number.isInteger(count)&&count>0);assert.equal(geometry.uvs.length,count*2);
 if(geometry.normals)assert.equal(geometry.normals.length,count*3);
 assert(geometry.positions.every(Number.isFinite));assert(geometry.indices.every(i=>Number.isInteger(i)&&i>=0&&i<count));
 const zs=geometry.positions.filter((_,i)=>i%3===2);assert(Math.max(...zs)-Math.min(...zs)>0);
}
const portrait=portraitGeometry();assert.deepEqual(portrait.uvs.slice(0,4),[0,0,1/60,0]);
for(const kind of ['bloom','moon','lunar'])for(const [name,field]of Object.entries(botanicalInstances(kind))){if(name==='flowers')continue;assert.equal(field.a.length,field.b.length);assert.equal(field.a.length%4,0);assert(field.a.every(Number.isFinite)&&field.b.every(Number.isFinite));}
assert.equal(stringInstances().a.length/4,180);
for(const width of [360,709,1080,3840])for(const ratio of [.7,1,3]){
 const size=sceneResolution({width,height:width*2,ratio});assert(size.width*size.height<2510000);assert(size.pixelRatio<=ratio);assert(size.width>0&&size.height>0);
}
const p=new Float32Array(16),v=new Float32Array(16),vp=new Float32Array(16);perspective(p,1,16/9);lookAt(v,[0,2.5,24],[0,1.8,-20]);multiply(vp,p,v);assert([...vp].every(Number.isFinite));assert.equal(v[15],1);
const motion=createSceneMotion({rest:.2,flight:.7});let last=motion.step(0,null);for(let i=1;i<120;i++){const pose=motion.step(i/60,i>50?{x:1,y:1,z:2}:null);assert(pose.travel>=last.travel);assert(pose.travel-last.travel<.012);last=pose;}
const manifest=JSON.parse(await fs.readFile(new URL('../themes/manifest.json',import.meta.url),'utf8'));assert.equal(manifest.length,8);
for(const entry of manifest){const theme=(await import('../themes/'+entry.id+'.js')).default;assert.equal(theme.id,entry.id);assert(theme.renderer.startsWith('webgl'));assert.equal(typeof theme.createRenderer,'function');assert.equal(theme.particles,false);await fs.access(new URL('../themes/previews/'+entry.id+'.jpg',import.meta.url));}
const requested=[];const nativeFetch=async url=>{const parsed=new URL(url),path=decodeURIComponent(parsed.pathname.replace(/^\/project\//,''));requested.push(path);try{return new Response(await fs.readFile(new URL('../'+path,import.meta.url)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch{return new Response('',{status:404});}};
const archive=await createSiteArchive({settings:{version:1,name:'Сад',tagline:'Живой сад',description:'',theme:'violet-bloom',contacts:{},blocks:[{id:'welcome',type:'intro',title:'Сад',text:'Добро пожаловать'}]},posts:[]},{nativeFetch,baseURL:new URL('https://example.test/project/')});
assert(archive.size>100000);for(const path of ['themes/world-gl.mjs','themes/scene-quality.mjs','themes/botanical-world.mjs','themes/lunar-muse.js','themes/violet-bloom.js','themes/assets/lunar-muse.webp'])assert(requested.includes(path),path);
console.log('PASS: spatial geometry, projection, continuous motion, bounded resolution, eight themes and complete export dependencies.');
