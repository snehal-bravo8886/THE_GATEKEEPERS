// Static contract checks — not a substitute for a live browser / running API test.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const read=p=>readFile(resolve(root,p),'utf8');
test('beginner-first experience has all four nontechnical choices',async()=>{
 const [html,js,styles]=await Promise.all(['dashboard/index.html','dashboard/app.js','dashboard/experience.css'].map(read));
 for (const phrase of [
  'People should only see their own private information',
  'People should only edit their own information',
  'Only admins should change important settings',
  'People who aren’t logged in shouldn’t see private information'
 ]) assert.ok(js.includes(phrase),`missing ${phrase}`);
 for(const id of ['workspace-use-sample','workspace-prompt','workspace-suggest','workspace-rules','workspace-file','workspace-download','workspace-human-headline'])assert.ok(html.includes(`id="${id}"`),id);
 assert.ok(html.includes('/experience.css'));
 assert.ok(styles.includes('.experience-rule-grid'));
});
test('each beginner promise maps to real reviewed rule IDs, including standalone guest privacy',async()=>{
 const [js,workspace,server]=await Promise.all(['dashboard/app.js','src/workspace.ts','src/server.ts'].map(read));
 for(const id of ['orders.owner_read','addresses.owner_read','addresses.owner_edit','settings.owner_edit','inventory.owner_edit','visitors.private_read']){
  assert.ok(js.includes(id),`UI missing ${id}`);assert.ok(workspace.includes(`id:'${id}'`),`backend missing ${id}`);
 }
 assert.ok(workspace.includes("caseIds:['G01','G03']"),'guest test needs valid positive prerequisite G01');
 assert.match(server,/max\(6\)/);
 assert.match(js,/selectedRules:\[\.\.\.ws\.selected\]/);
});
test('original prompt is optional and recorded in the confirmed requirement, never executed as a code instruction',async()=>{
 const [js,workspace,server]=await Promise.all(['dashboard/app.js','src/workspace.ts','src/server.ts'].map(read));
 assert.match(js,/originalPrompt:\$\('workspace-prompt'\)\.value\.trim\(\)/);
 assert.match(server,/originalPrompt: z\.string\(\)\.max\(1200\)\.optional\(\)/);
 assert.match(workspace,/Original description:/);
 assert.match(workspace,/Confirmed checks:/);
 assert.doesNotMatch(workspace,/spawn\(|exec\(|execFile\(/);
});
test('only API-returned results drive human findings; technical evidence can be expanded',async()=>{
 const [js,html]=await Promise.all(['dashboard/app.js','dashboard/index.html'].map(read));
 assert.match(js,/const \{run,suite\}=ws\.result/);
 assert.match(js,/result\.verdict==='FAIL'/);
 assert.match(js,/result\.observed\?\.status/);
 assert.match(js,/suggestedFixes/);
 assert.match(html,/See technical evidence|Technical evidence/);
 assert.match(js,/new Blob\(\[lines\.join/);
 assert.doesNotMatch(js,/makeDemoResult|demoVerdict/);
});
