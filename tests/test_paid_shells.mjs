import assert from 'node:assert/strict';
import fs from 'node:fs';
import {protectCourseText} from '../course-protection.js';
import {validateCourse} from '../courses/es-a1/access.js';
const fixture={schema:'syolana.course.v1',courseId:'es-a1',priceRub:1000,rules:[],vocabulary:[],groups:[],alphabet:Array(27).fill(null),phonetics:Array(23).fill(null),phonemeDictionary:{},practice:[],variants:[],repetition:[],statistics:{}};
assert.equal(validateCourse(fixture),fixture);assert.throws(()=>validateCourse({...fixture,courseId:'en-a2'}));
for(const id of ['en-a2','es-a1']){
 const folder='dist/public/courses/'+id;
 assert(!fs.existsSync(folder+'/data.json'));
 assert.deepEqual(fs.readdirSync(folder).sort(),['access.js','audio.js','course.css','course.js','curriculum.js','presentation.js','trainers.js']);
}
const listeners=new Map(),classes=new Set();
const doc={body:{classList:{add:x=>classes.add(x),remove:x=>classes.delete(x),contains:x=>classes.has(x)}},addEventListener:(k,f)=>listeners.set(k,f),removeEventListener:k=>listeners.delete(k)};
const release=protectCourseText(doc);assert(classes.has('syolana-course-protected'));
const target=editable=>({nodeType:1,closest:selector=>editable?{}:null});
let blocked=false;listeners.get('copy')({target:target(false),preventDefault(){blocked=true;}});assert(blocked);
blocked=false;listeners.get('copy')({target:target(true),preventDefault(){blocked=true;}});assert(!blocked,'Inputs remain editable');
release();assert.equal(listeners.size,0);assert(!classes.has('syolana-course-protected'),'Other site pages regain normal copying');
console.log('PASS: both paid shells contain no paid data; course copying protection releases on exit and permits inputs.');
