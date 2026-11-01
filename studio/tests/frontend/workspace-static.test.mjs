import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const content=async p=>readFile(resolve(root,p),'utf8');
test('guided workflow is available while original pages remain',async()=>{
 const html=await content('dashboard/index.html');
 for(const id of ['workspace-file','workspace-rules','workspace-write-approval','workspace-run','workspace-results','workspace-results-list'])assert.ok(html.includes(`id="${id}"`),id);
 for(const page of ['workspace','overview','suites','verify','findings','history','connections','guide'])assert.ok(html.includes(`data-page="${page}"`),page);
 assert.match(html,/ZIP is inspected|code is inspected|never executed/);
});
test('frontend submits selected rules and uploaded bytes through safe same-origin endpoints',async()=>{
 const js=await content('dashboard/app.js');
 for(const endpoint of ['/api/workspace/options','/api/workspace/upload','/api/workspace/verify'])assert.ok(js.includes(endpoint),endpoint);
 for(const varname of ['selectedRules','approveSyntheticWrites','uploadId','revisionLabel'])assert.ok(js.includes(varname),varname);
 assert.match(js,/function renderWorkspaceResults/);
 assert.match(js,/safe\(result\.explanation\)/);
});
test('backend binds selected rules to reviewed cases and existing run engine',async()=>{
 const server=await content('src/server.ts'), workspace=await content('src/workspace.ts');
 assert.match(server,/await createSelectedSuite\(selectedRules,originalPrompt(?:,source\.profileId)?\)/);
 assert.match(server,/await runSuite\(suite,adapter/);
 assert.match(server,/await saveRun\(run\)/);
 assert.match(server,/express\.raw\(\{type:'application\/zip',limit:'8mb'\}\)/);
 assert.match(workspace,/Never extracts or executes uploads/);
 assert.match(workspace,/getApprovedUpload/);
 assert.match(workspace,/confirmUploadedSourceMatchesLocal/);
 assert.match(workspace,/ZIP entry|ZIP central directory/);
 assert.doesNotMatch(workspace,/spawn\(|exec\(|execFile\(|extractAll|writeFile\(/);
});
