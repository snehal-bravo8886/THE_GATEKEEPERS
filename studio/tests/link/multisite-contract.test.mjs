import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const read=p=>readFile(resolve(root,p),'utf8');
test('hospital suite has 13 ordered, distinct, safe controlled test cases',async()=>{
 const s=JSON.parse(await read('suites/hospital.patient-access.json'));
 assert.equal(s.cases.length,13);assert.equal(new Set(s.cases.map(x=>x.testId)).size,13);
 assert.ok(s.cases.some(x=>x.testId==='H12'&&x.expectation==='DENY'&&x.operationRef==='file.read'));
 assert.ok(s.cases.some(x=>x.testId==='H13'&&x.mutationRef==='patient.owner.reassign'));
 for(const [i,c] of s.cases.entries())for(const dep of c.requiredControls)assert.ok(s.cases.findIndex(x=>x.testId===dep)<i,`Invalid prerequisite for ${c.testId}`);
 for(const c of s.cases)assert.ok(['GET','PATCH'].includes(c.method));
});
test('website link creates a plan without server-side arbitrary URL fetching or scanner execution',async()=>{
 const [p,api]=await Promise.all([read('src/sitePlanner.ts'),read('src/server.ts')]);
 assert.match(p,/PLAN_ONLY/);assert.match(p,/SUPPORTED_LOCAL/);
 assert.match(p,/const HOSPITAL_URL='http:\/\/127\.0\.0\.1:4300\/'/);
 assert.doesNotMatch(p,/fetch\s*\(|child_process|spawn\s*\(|exec\s*\(/);
 assert.match(api,/post\('\/api\/workspace\/plan-link'/);
 assert.match(api,/post\('\/api\/workspace\/verify-link'/);
 assert.match(api,/session\.url!=='http:\/\/127\.0\.0\.1:4300\/'/);
 assert.match(api,/registerAdapter\(createHospitalAdapter\(\)\)/);
});
test('planner suggests baseline plus domain-specific tests and labels those not yet supported',async()=>{
 const p=await read('src/sitePlanner.ts');
 for(const x of ['BASE-01','BASE-02','BASE-03','BASE-04','BASE-05','BASE-06','unassigned-clinician','record-list','consent','bulk-export','audit'])assert.ok(p.includes(x),x);
 assert.ok(p.includes('NEEDS_MAPPING'));
 assert.ok(p.includes('User-provided site description is not stored'));
});
test('frontend provides plain-language ZIP and link modes with correctly separated run paths',async()=>{
 const [html,js]=await Promise.all([read('dashboard/index.html'),read('dashboard/app.js')]);
 for(const id of ['workspace-mode-zip','workspace-mode-link','workspace-link-url','workspace-link-description','workspace-plan-link','workspace-use-hospital','workspace-link-plan','workspace-rules','workspace-run'])assert.ok(html.includes(`id="${id}"`));
 assert.match(js,/endpoint=ws\.mode==='link'\?'\/api\/workspace\/verify-link':'\/api\/workspace\/verify'/);
 assert.match(js,/ws\.linkPlan\.mode!=='SUPPORTED_LOCAL'/);
 assert.match(js,/plan\.mode==='SUPPORTED_LOCAL'/);
 assert.ok(js.includes('renderWorkspaceResults()'));
});
