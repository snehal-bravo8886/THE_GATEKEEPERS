// Dependency-free frontend integration contract checks.
// These are STATIC checks; live browser and Express verification require npm install.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '../..');
const file = async rel => readFile(resolve(root, rel),'utf8');

test('dashboard has all navigable views and executable frontend files',async()=>{
 const html=await file('dashboard/index.html');
 const js=await file('dashboard/app.js');
 const css=await file('dashboard/styles.css');
 for(const page of ['overview','suites','verify','findings','history','connections','guide']){
  assert.match(html, new RegExp(`data-page="${page}"`));
  assert.match(html, new RegExp(`data-route="${page}"`));
 }
 assert.match(js,/function renderFindings\(/);
 assert.match(js,/function executeRun\(/);
 assert.match(css,/\.hero\{/);
});
test('dashboard reads actual API endpoints and displays only API-returned runs',async()=>{
 const js=await file('dashboard/app.js');
 const src=await file('src/server.ts');
 for(const path of ['/api/health','/api/readiness','/api/ui/lab-health','/api/suites']){
  assert.ok(js.includes(path),`frontend needs ${path}`);
  assert.ok(src.includes(path),`backend must provide ${path}`);
 }
 assert.match(js,/approveSyntheticWrites:approved/);
 assert.match(js,/r\.aggregateVerdict/);
 assert.match(js,/r\.results/);
 assert.match(js,/encodeURIComponent\(s\.suiteId\)/);
 assert.match(src,/express\.static\(dashboardDir/);
});
test('bundled suite presets exactly match uploaded and reviewed server contracts',async()=>{
 for(const name of ['sprout.g01-g10.json','sprout-known-vulnerabilities.json']){
  const current=await file(`dashboard/presets/${name}`);
  const source=await file(`suites/${name}`);
  assert.equal(current,source);
  const contract=JSON.parse(current);
  assert.equal(contract.confirmed,true);
  assert.equal(contract.targetProfileId,'sprout-stone-local-grocery-lab');
  assert.ok(contract.cases.some(x=>x.method==='PATCH'));
 }
});
test('frontend never embeds synthetic credentials and escapes server supplied content',async()=>{
 const js=await file('dashboard/app.js');const html=await file('dashboard/index.html');
 for(const secret of ['OwnerDemo!26','AppleA!26','BerryB!26','Bearer ']){
  assert.ok(!js.includes(secret),`No browser credentials: ${secret}`);
  assert.ok(!html.includes(secret),`No HTML credentials: ${secret}`);
 }
 assert.match(js,/const safe =/);
 assert.match(js,/safe\(t\.explanation\)/);
});
test('approved target probe has a fixed loopback-only origin and does not proxy arbitrary URLs',async()=>{
 const src=await file('src/server.ts');
 assert.match(src,/fetch\('http:\/\/127\.0\.0\.1:4200\/api\/health'/);
 assert.match(src,/redirect: 'manual'/);
 assert.doesNotMatch(src,/fetch\(req\.query/);
});
