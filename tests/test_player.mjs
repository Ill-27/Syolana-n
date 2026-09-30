// In-memory DOM/audio test doubles: verifies playlist logic, not real playback.
import assert from 'node:assert/strict';
class Node {
 constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.attributes={};this.textContent='';this.hidden=false;this.value='';}
 append(...nodes){this.children.push(...nodes)}setAttribute(k,v){this.attributes[k]=v}addEventListener(){}
 querySelectorAll(tag){return this.children.flatMap(c=>c instanceof Node?[...(c.tag===tag?[c]:[]),...c.querySelectorAll(tag)]:[])}
}
class Audio extends EventTarget{
 constructor(){super();this.paused=true;this.ended=false;this.duration=120;this.currentTime=0;this.volume=.65;this.error=null}
 load(){this.currentTime=0;this.ended=false}
 pause(){this.paused=true;this.dispatchEvent(new Event('pause'))}
 async play(){this.paused=false;this.ended=false;this.dispatchEvent(new Event('playing'))}
}
const elements=new Map();globalThis.document={baseURI:'https://example.test/',createElement:tag=>new Node(tag),getElementById:id=>{if(!elements.has(id))elements.set(id,id==='audio'?new Audio():new Node());return elements.get(id)}};
globalThis.location={protocol:'https:',origin:'https://example.test'};
Object.defineProperty(globalThis,'navigator',{value:{},configurable:true});globalThis.window={};const preferences=new Map();globalThis.localStorage={getItem:k=>preferences.get(k)||null,setItem:(k,v)=>preferences.set(k,v)};
const {Player}=await import('../player.js');const {chaptersFrom,safeURL}=await import('../utils.js');
const songs=[0,1,2,3].map(i=>({src:'/song-'+i+'.mp3',title:'Песня '+i,sourceUrl:'#/book/'+i}));
const p=new Player(songs);assert.equal(p.index,0);assert.equal(p.audio.paused,true,'No autoplay on load');
p.shuffle=true;p.repeat='all';p.resetBag();const heard=[p.index];for(let i=0;i<19;i++){p.next(false);heard.push(p.index)}
for(let i=0;i<heard.length;i+=4)assert.equal(new Set(heard.slice(i,i+4)).size,4,'No repeats inside shuffle round');
for(let i=1;i<heard.length;i++)assert.notEqual(heard[i],heard[i-1],'No immediate repeat at round boundary');
p.shuffle=false;p.repeat='off';p.select(3,false);p.next(true);assert.equal(p.index,3);assert.equal(p.audio.paused,true);assert.match(elements.get('player-status').textContent,/завершён/);
p.repeat='all';p.next(true);assert.equal(p.index,0);p.select(2,true);p.audio.currentTime=10;p.prev();assert.equal(p.audio.currentTime,0);assert.equal(p.index,2);
p.audio.currentTime=0;p.prev();assert.equal(p.index,0);
assert.equal(safeURL('javascript:alert(1)'), '');assert.equal(safeURL('http://insecure.example/'), '');
const chapters=chaptersFrom('Глава 1\nПервый абзац.\n\nВторой абзац.\nГлава 2\nТекст второй главы.');assert.equal(chapters.length,2);assert.equal(chapters[1].title,'Глава 2');assert.match(chapters[0].text,/Второй абзац/);
assert.equal(chaptersFrom('Обычная статья\nбез заголовков').length,1);
console.log('PASS: shuffle rounds, boundaries, repeat-off, repeat-all, previous, no autoplay, URL validation, TXT chapter parsing.');
