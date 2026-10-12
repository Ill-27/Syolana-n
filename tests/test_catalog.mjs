import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const {loadCatalog,loadBook,readingColor}=await import('../artivid/catalog.js');
const {lessonFiles}=await import('../catalog.js');
globalThis.document={baseURI:'https://example.test/'};
globalThis.location={protocol:'https:',origin:'https://example.test'};
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(await fs.readFile('artivid/'+path,'utf8'))});
const books=await loadCatalog();assert.deepEqual(books.map(b=>b.id),['turgenev_sparrow','lermontov_demon_1']);
for(const book of books.filter(b=>!b.external)) {
 const first=await loadBook(book.id);assert(first.chapter.blocks.length>0);
 for(let i=0;i<first.book.chapters.length;i++) {
  const chapter=await loadBook(book.id,i);assert(chapter.chapter.blocks.every(b=>b.text&&/^#[\da-f]{6}$/i.test(b.color)));
 }
}
const demon=await loadBook('lermontov_demon_1',1);
assert.equal(demon.book.chapters.length,2);assert.equal(demon.chapter.title,'Часть II');
assert.equal(demon.book.poetry,true);assert.match(demon.chapter.blocks[0].text,/Отец/);
assert.equal(readingColor('javascript:alert(1)'),'#ece8f5');
await assert.rejects(()=>loadBook('../platform/server'),/не найдена/);
for(const path of Object.values(lessonFiles).filter(p=>!p.startsWith('api/')))await fs.access(path);
const config=JSON.parse(await fs.readFile('config.json','utf8'));
const details=JSON.parse(await fs.readFile('song-details.json','utf8'));
for(const song of config.songs) {await fs.access(song.src);assert.equal(song.sourceUrl,'#/song/'+song.id);assert.ok(details.songs.some(row=>row.id===song.id));}
console.log('PASS: current reader catalog, both Demon chapters, poetry, safe colors, lesson files, three real song files and sources.');
