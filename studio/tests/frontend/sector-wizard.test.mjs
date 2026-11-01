import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
const root=resolve(import.meta.dirname,'../..');
const read=p=>readFile(resolve(root,p),'utf8');
test('four real-world categories are present, not inferred from free text',async()=>{
 const catalog=await read('src/sectorCatalog.ts');
 for(const id of ['restaurant','retail','clinic','campus'])assert.ok(catalog.includes(`id:'${id}'`),id);
 for(const item of ['table-orders','qr-links','retail-orders','retail-stock','clinic-appointments','clinic-clinician','campus-signups','campus-tickets'])assert.ok(catalog.includes(item),item);
 assert.match(catalog,/buildSectorSuggestions/);
 assert.match(catalog,/INVALID_SECTOR/);
 assert.match(catalog,/INVALID_FEATURES/);
});
test('the frontend has keyboard-accessible category selection, checkboxes, and URL mode as the default',async()=>{
 const [html,js,css]=await Promise.all(['dashboard/index.html','dashboard/app.js','dashboard/experience.css'].map(read));
 for(const id of ['workspace-sector-cards','workspace-sector-features','workspace-core-rules','workspace-link-url','workspace-plan-link'])assert.ok(html.includes(`id="${id}"`),id);
 assert.ok(html.includes('role="radiogroup"'));
 assert.match(js,/name="workspace-sector"/);
 assert.match(js,/data-sector-feature/);
 assert.match(js,/data-sector-core/);
 assert.match(js,/mode:'link'/);
 assert.match(js,/route\('workspace'\)/);
 assert.match(css,/\.sector-grid/);
 assert.match(css,/@media\(max-width:430px\)/);
});
test('the backend converts user-confirmed categories and rules into a plan without scanning arbitrary sites',async()=>{
 const [server,planner,catalog]=await Promise.all(['src/server.ts','src/sitePlanner.ts','src/sectorCatalog.ts'].map(read));
 assert.match(server,/app\.get\('\/api\/workspace\/sectors'/);
 assert.match(server,/selectedCoreRules/);
 assert.match(server,/selectedFeatures/);
 assert.match(server,/createLinkPlan\(parsed\.data\.websiteUrl/);
 assert.match(planner,/buildSectorSuggestions\(sectorId,featureIds,coreRuleIds\)/);
 assert.match(planner,/PLAN_ONLY/);
 assert.doesNotMatch(catalog,/fetch\s*\(|spawn\s*\(|exec\s*\(/);
 assert.match(planner,/mode==='SUPPORTED_LOCAL'/);
});
test('the previous ZIP workflow and saved run display remain in place',async()=>{
 const [html,js]=await Promise.all(['dashboard/index.html','dashboard/app.js'].map(read));
 for(const id of ['workspace-file','workspace-results','workspace-download','workspace-mode-zip'])assert.ok(html.includes(`id="${id}"`));
 assert.match(js,/\/api\/workspace\/verify-link/);
 assert.match(js,/\/api\/workspace\/verify/);
 assert.match(js,/renderWorkspaceResults/);
});
