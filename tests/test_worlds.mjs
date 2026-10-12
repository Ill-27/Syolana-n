import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {sceneResolution} from '../themes/scene-quality.mjs';
import {petalGeometry,leafGeometry,stemGeometry,butterflyGeometry,butterflyBodyGeometry,botanicalInstances,wrapBotanicalPosition} from '../themes/botanical-world.mjs';
import {branchSegment} from '../themes/amber-forest.js';
import {shipRiggingGeometry} from '../themes/living-sea.js';
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
const garden=botanicalInstances();
for(const [name,field]of Object.entries(garden)){if(name==='flowers')continue;assert.equal(field.a.length,field.b.length);assert.equal(field.a.length%4,0);assert(field.a.every(Number.isFinite)&&field.b.every(Number.isFinite));}
assert.equal(garden.flowers.length,36);
assert.equal(wrapBotanicalPosition([0,0,-30],[0,2.5,24],10)[2],-20,'forward travel brings flowers toward the camera');
for(const x of [-500,-70,0,70,500])for(const y of [-500,-70,0,70,500]){
 const eye=[x,y,24];const centers=garden.flowers.map(f=>wrapBotanicalPosition(f,eye,123));
 assert(centers.every(p=>Math.abs(p[0]-x)<=46&&Math.abs(p[1]-y)<=36&&p[2]>=-120&&p[2]<36));
 assert(centers.some(p=>p[2]<-30&&Math.abs(p[0]-x)<(24-p[2])*.32&&Math.abs(p[1]-y)<(24-p[2])*.55),'flowers remain visible during unlimited lateral and vertical flight');
}
for(const end of [[3,12,4],[-2,8,6],[0,16,0]]){
 const start=[0,5,0],s=branchSegment(start,end,.1,.4),az=s[7],pitch=s[5],dir=[Math.cos(az)*Math.cos(pitch),Math.sin(pitch),Math.sin(az)*Math.cos(pitch)];
 for(let i=0;i<3;i++){assert(Math.abs(s[i]-dir[i]*s[4]/2-start[i])<1e-8);assert(Math.abs(s[i]+dir[i]*s[4]/2-end[i])<1e-8);}
}
for(let type=0;type<4;type++){const rig=shipRiggingGeometry(type);assert(rig.length%6===0);assert(rig.length<110);for(let i=0;i<rig.length;i+=3){assert(Math.abs(rig[i])<=2.65+1e-6);assert(rig[i+1]>=1.8);assert(rig[i+2]>=-12.81&&rig[i+2]<=5.84);}}
assert.equal(stringInstances().a.length/4,180);
for(const width of [360,709,1080,3840])for(const ratio of [.7,1,3]){
 const size=sceneResolution({width,height:width*2,ratio});assert(size.width*size.height<2510000);assert(size.pixelRatio<=ratio);assert(size.width>0&&size.height>0);
}
const p=new Float32Array(16),v=new Float32Array(16),vp=new Float32Array(16);perspective(p,1,16/9);lookAt(v,[0,2.5,24],[0,1.8,-20]);multiply(vp,p,v);assert([...vp].every(Number.isFinite));assert.equal(v[15],1);
const motion=createSceneMotion({rest:.2,flight:.7});let last=motion.step(0,null);for(let i=1;i<120;i++){const pose=motion.step(i/60,i>50?{x:1,y:1,z:2}:null);assert(pose.travel>=last.travel);assert(pose.travel-last.travel<.012);last=pose;}
const manifest=JSON.parse(await fs.readFile(new URL('../themes/manifest.json',import.meta.url),'utf8'));assert.equal(manifest.length,7);assert(!manifest.some(t=>t.id==='lunar-muse'));
for(const entry of manifest){const theme=(await import('../themes/'+entry.id+'.js')).default;assert.equal(theme.id,entry.id);assert.equal(typeof theme.createRenderer,'function');assert.equal(theme.particles,['aurora','golden','moon'].includes(entry.id));await fs.access(new URL('../themes/previews/'+entry.id+'.jpg',import.meta.url));}
for(const [id,renderer]of [['aurora','stars'],['golden','waves'],['moon','petals']])assert.equal((await import('../themes/'+id+'.js')).default.renderer,renderer);
const requested=[];const nativeFetch=async url=>{const parsed=new URL(url),path=decodeURIComponent(parsed.pathname.replace(/^\/project\//,''));requested.push(path);try{return new Response(await fs.readFile(new URL('../'+path,import.meta.url)),{headers:{'Content-Type':path.endsWith('.json')?'application/json':'application/octet-stream'}});}catch{return new Response('',{status:404});}};
const archive=await createSiteArchive({settings:{version:1,name:'Сад',tagline:'Живой сад',description:'',theme:'violet-bloom',contacts:{},blocks:[{id:'welcome',type:'intro',title:'Сад',text:'Добро пожаловать'}]},posts:[]},{nativeFetch,baseURL:new URL('https://example.test/project/')});
assert(archive.size>100000);for(const path of ['themes/world-gl.mjs','themes/scene-quality.mjs','themes/botanical-world.mjs','themes/violet-bloom.js'])assert(requested.includes(path),path);assert(!requested.some(path=>path.includes('lunar-muse')));
console.log('PASS: restored particle worlds, connected branches, attached rigging, infinite garden space, seven themes and complete export dependencies.');
