import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {loadCatalog,loadBook} from '../catalog.js';
const config=JSON.parse(await fs.readFile('config.json','utf8'));
globalThis.document={baseURI:'https://example.test/Syolana-n/'};
globalThis.location={protocol:'https:',origin:'https://example.test'};
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(await fs.readFile(path,'utf8'))});
const {SceneAudio}=await import('../scene-audio.js');
const engine=Object.create(SceneAudio.prototype);engine.library=config.sceneAudio;
let scenes=0;const used=new Set();
for(const b of await loadCatalog()) {
 if(b.external)continue;
 const first=await loadBook(b.id);
 for(let i=0;i<first.book.chapters.length;i++) {
  const book=await loadBook(b.id,i),raw=JSON.parse(await fs.readFile('books/'+first.book.chapters[i].id+'.json','utf8'));
  const source=raw.blocks.filter(b=>b.type==='stanza').flatMap(b=>b.ru||b.en).join(raw.type==='poetry'?'\n':'\n\n');
  assert.equal(book.chapter.blocks.map(b=>b.text).join(raw.type==='poetry'?'\n':'\n\n'),source,'Cues preserve every original line');
  assert(new Set(book.chapter.blocks.map(b=>b.color)).size>3);
  for(const block of book.chapter.blocks) {
   scenes++;
   const names=block.audio.split(',').map(s=>s.trim());
   assert(names.length>=2&&names.length<=4);
   assert(names.some(s=>s.startsWith('music/')),'Every current scene has a musical bed');
   const resolved=engine.resolve(block.audio);assert.equal(resolved.length,names.length);
   for(const name of names) {used.add(name);const entry=config.sceneAudio[name];assert(entry);await fs.access(entry.src);assert(entry.fallback);await fs.access(entry.fallback);}
  }
 }
}
assert.equal(scenes,45);assert.equal(used.size,50);
for(const entry of Object.values(config.sceneAudio))if(entry.src){await fs.access(entry.src);assert(entry.volume<=.2);}
assert.equal(config.sceneAudio['human/woman_scream_far.ogg'].loop,false);
assert.equal(config.sceneAudio['combat/gunshot_pistol.ogg'].loop,false);
assert.equal(engine.resolve('untrusted.ogg,https://untrusted.test/a.ogg').length,0);
assert.equal(engine.resolve('wonder').length,2);
console.log('PASS: 45 authored scenes, 50 valid sound sources + fallbacks, original text preserved, varying readable colors, no unknown audio URLs.');
