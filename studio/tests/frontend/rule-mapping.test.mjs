import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const readJson=async p=>JSON.parse(await readFile(resolve(root,p),'utf8'));

test('all four user-friendly promises resolve to reviewed real case IDs with ordered prerequisites',async()=>{
 const [regular,known]=await Promise.all(['suites/sprout.g01-g10.json','suites/sprout-known-vulnerabilities.json'].map(readJson));
 const source=[...regular.cases,...known.cases];
 const combinations=[['S01','S02','S03','G01','G01B','G02','G03'],['G01','G01B','G04','G05','G06','G10'],['S04','S05','G07','G08','G09'],['G01','G03']];
 for(const initial of combinations){
   const ids=new Set(initial);
   const includePrerequisites=id=>{const c=source.find(x=>x.testId===id);assert.ok(c,`missing ${id}`);for(const pre of c.requiredControls){ids.add(pre);includePrerequisites(pre);}};
   for(const id of initial)includePrerequisites(id);
   for(const id of ids){
     const c=source.find(x=>x.testId===id);
     assert.ok(c,`missing ${id}`);
     for(const pre of c.requiredControls)assert.ok(ids.has(pre),`missing control ${pre} for ${id}`);
   }
 }
 assert.equal(source.find(x=>x.testId==='S03').expectation,'DENY');
 assert.equal(source.find(x=>x.testId==='S05').expectation,'DENY');
 assert.equal(source.find(x=>x.testId==='G03').actorRef,'anonymous');
});
