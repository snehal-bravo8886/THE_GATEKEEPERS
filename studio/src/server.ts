import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { z } from 'zod';
import { getAdapter, listAdapters } from './adapter.ts';
import { SuiteSchema } from './contracts.ts';
import { getSuite, listSuites, saveSuite, getRuns, saveRun } from './ledger.ts';
import { runSuite } from './engine.ts';
import { registerAdapter } from './adapter.ts';
import { createSproutStoneAdapter } from '../adapters/sprout-stone.adapter.ts';
import { createHospitalAdapter } from '../adapters/hospital.adapter.ts';
import { createAetherFestAdapter } from '../adapters/aetherfest.adapter.ts';
import { createLinkPlan, createHospitalSuite, planSession, hospitalSelections } from './sitePlanner.ts';
import { sectorCatalogForClient } from './sectorCatalog.ts';
import { registerSupportedZip, confirmUploadedSourceMatchesLocal, createSelectedSuite, rulesForClient, WorkspaceError } from './workspace.ts';
// No application adapter is imported until the team supplies and reviews one.
// After Snehal implements adapters/grocery.adapter.ts, import and register it HERE.

registerAdapter(createSproutStoneAdapter());
registerAdapter(createHospitalAdapter());
registerAdapter(createAetherFestAdapter());
const app = express();
app.use(express.json({ limit:'16kb' }));
app.disable('x-powered-by');
const activeTargets = new Set<string>(); // prevent concurrent runs corrupting shared test fixtures
const RunInput = z.object({ revisionLabel: z.string().min(1).max(100),
  approveSyntheticWrites: z.boolean().default(false) }).strict();
app.get('/api/health', (_req,res)=>res.json({ ok:true,service:'cantheyseeit-generic-verifier-v2' }));
app.get('/api/readiness',(_req,res)=>res.json({status:listAdapters().length?'ADAPTER_REGISTERED':'NEEDS_SETUP',adapters:listAdapters(),note:'Ready is checked again before each run.'}));
app.get('/api/suites', async(_req,res)=>res.json(await listSuites()));
app.post('/api/suites', async(req,res)=>{
  const parsed=SuiteSchema.safeParse(req.body);
  if (!parsed.success) {res.status(400).json({error:'INVALID_TEST_CONTRACT',details:parsed.error.issues.map(x=>x.message)});return;}
  if (!getAdapter(parsed.data.targetProfileId)) {res.status(409).json({error:'NEEDS_SETUP',reason:'Trusted local adapter not registered'});return;}
  try {await saveSuite(parsed.data);res.status(201).json({suiteId:parsed.data.suiteId,saved:true,checkCount:parsed.data.cases.length});}
  catch {res.status(409).json({error:'SUITE_ALREADY_EXISTS_OR_STORE_ERROR'});}
});
app.get('/api/suites/:id/runs',async(req,res)=>res.json(await getRuns(req.params.id)));
app.post('/api/suites/:id/run',async(req,res)=>{
  const data=RunInput.safeParse(req.body);
  if (!data.success){res.status(400).json({error:'INVALID_RUN_REQUEST'});return;}
  const suite=await getSuite(req.params.id);
  if(!suite){res.status(404).json({error:'SUITE_NOT_FOUND'});return;}
  const adapter=getAdapter(suite.targetProfileId);
  if(!adapter){res.status(409).json({error:'NEEDS_SETUP',reason:'Adapter unavailable'});return;}
  if (activeTargets.has(adapter.id)) {res.status(409).json({error:'RUN_ALREADY_IN_PROGRESS'});return;}
  activeTargets.add(adapter.id);
  try {
    const runs=await getRuns(suite.suiteId);
    const current=await runSuite(suite,adapter,data.data.revisionLabel,data.data.approveSyntheticWrites,runs.at(-1));
    await saveRun(current);
    res.json(current);
  }catch(e){
    const code=e instanceof Error && e.message.startsWith('NEEDS_SETUP')?'NEEDS_SETUP':'VERIFICATION_UNAVAILABLE';
    res.status(409).json({error:code,reason:code==='NEEDS_SETUP'?'Synthetic target is not ready':'Run could not be completed; no PASS is reported'});
  } finally { activeTargets.delete(adapter.id); }
});

// Safe UI connectivity probe. A registered adapter does not prove the target is live.
// This fixed URL is not user-controlled and never forwards credentials or test payloads.
app.get('/api/ui/lab-health', async (_req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:4200/api/health', {
      signal: AbortSignal.timeout(1700), redirect: 'manual'
    });
    if (!response.ok) throw new Error('LAB_UNAVAILABLE');
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object' || !('app' in data) || data.app !== 'sprout-stone-grocery-lab')
      throw new Error('WRONG_TARGET');
    res.json({ reachable: true, name: 'Sprout & Stone', origin: 'http://127.0.0.1:4200' });
  } catch {
    res.json({ reachable: false, name: 'Sprout & Stone', origin: 'http://127.0.0.1:4200' });
  }
});

// Beginner workspace: reviewed ZIP -> limited policy selection -> existing verifier engine.
// No uploaded code is unpacked, installed, launched or used for arbitrary network access.
const WorkspaceRunInput = z.object({
  uploadId: z.string().uuid(),
  selectedRules: z.array(z.string().min(1).max(70)).min(1).max(6),
  originalPrompt: z.string().max(1200).optional(),
  approveSyntheticWrites: z.boolean(),
  revisionLabel: z.string().min(1).max(100)
}).strict();
function workspaceError(res:express.Response,e:unknown){
  if(e instanceof WorkspaceError){res.status(e.httpStatus).json({error:e.code,reason:e.message});return;}
  res.status(500).json({error:'WORKSPACE_UNAVAILABLE',reason:'The workspace request could not be completed.'});
}
app.get('/api/workspace/fest-sample-zip',(_req,res)=>res.download(resolve(process.cwd(),'demo-upload/AetherFest_Approved_Website.zip')));
app.get('/api/workspace/sample-zip',(_req,res)=>res.download(resolve(process.cwd(),'demo-upload/SproutStone_Approved_Website.zip')));
app.get('/api/workspace/options',(req,res)=>res.json({
  project:req.query.profileId==='aetherfest-college-lab'?'aetherfest-college-lab':'sprout-stone-local-grocery-lab',rules:rulesForClient(req.query.profileId==='aetherfest-college-lab'?'aetherfest-college-lab':undefined),
  constraints:'Approved Sprout & Stone ZIPs only. The ZIP is inspected, never executed. Start the matching local grocery lab separately on port 4200.'
}));
app.post('/api/workspace/upload', express.raw({type:'application/zip',limit:'8mb'}), async(req,res)=>{
  try {
    if(!Buffer.isBuffer(req.body)||req.body.length===0)throw new WorkspaceError('ZIP_REQUIRED','Please select a valid ZIP archive.');
    let filename=req.get('X-Archive-Name')||'';
    try{filename=decodeURIComponent(filename);}catch{throw new WorkspaceError('INVALID_FILENAME','Invalid ZIP filename.');}
    const approval=await registerSupportedZip(req.body,filename);
    res.status(201).json(approval);
  }catch(e){workspaceError(res,e);}
});
app.post('/api/workspace/verify',async(req,res)=>{
  const parsed=WorkspaceRunInput.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:'INVALID_WORKSPACE_INPUT',reason:'Confirm a ZIP, at least one permission rule, and a revision label.'});return;}
  const {uploadId,selectedRules,originalPrompt,approveSyntheticWrites,revisionLabel}=parsed.data;
  try {
    const source=await confirmUploadedSourceMatchesLocal(uploadId);
    const suite=await createSelectedSuite(selectedRules,originalPrompt,source.profileId);
    if(suite.cases.some(c=>c.method==='PATCH')&&!approveSyntheticWrites)
      throw new WorkspaceError('APPROVAL_REQUIRED','Approve disposable synthetic write checks before continuing.');
    const adapter=getAdapter(suite.targetProfileId);
    if(!adapter)throw new WorkspaceError('NEEDS_SETUP','The approved application adapter is not registered.',409);
    if(activeTargets.has(adapter.id))throw new WorkspaceError('RUN_ALREADY_IN_PROGRESS','Please wait for the current run.',409);
    activeTargets.add(adapter.id);
    try {
      if(!await getSuite(suite.suiteId)){
        try{await saveSuite(suite);}catch(e){if(!await getSuite(suite.suiteId))throw e;}
      }
      const prior=(await getRuns(suite.suiteId)).at(-1);
      const run=await runSuite(suite,adapter,revisionLabel,approveSyntheticWrites,prior);
      await saveRun(run);
      res.json({suite,run,selectedRules,source:'trusted-local-adapter'});
    }finally{activeTargets.delete(adapter.id);}
  }catch(e){
    if(e instanceof Error&&e.message.startsWith('NEEDS_SETUP')){
      res.status(409).json({error:'NEEDS_SETUP',reason:'The approved local test application is offline or has modified its synthetic fixtures. Start/reset it and retry.'});return;
    }
    workspaceError(res,e);
  }
});

app.get('/api/ui/fest-health',async(_req,res)=>{
  try{const r=await fetch('http://127.0.0.1:4400/api/health',{signal:AbortSignal.timeout(1400),redirect:'manual'});
    const j:unknown=await r.json();if(!r.ok||!j||typeof j!=='object'||!('app' in j)||j.app!=='aetherfest-college-lab')throw Error('WRONG_FEST');
    res.json({reachable:true,name:'AETHER College Fest',origin:'http://127.0.0.1:4400'});
  }catch{res.json({reachable:false,name:'AETHER College Fest',origin:'http://127.0.0.1:4400'});}
});

// Link-first experience: planning is offline and does NOT fetch/crawl arbitrary URLs.
// Live execution is separately restricted to one reviewed, local, synthetic hospital fixture.
const LinkPlanInput=z.object({
  websiteUrl:z.string().min(8).max(400),
  // Backward-compatible legacy description; the sector wizard doesn't use it.
  description:z.string().max(1200).optional().default(''),
  sectorId:z.enum(['restaurant','retail','clinic','campus']).optional(),
  selectedFeatures:z.array(z.string().max(80)).max(10).optional().default([]),
  selectedCoreRules:z.array(z.string().max(80)).max(4).optional().default([])
}).strict();
app.get('/api/workspace/sectors',(_req,res)=>res.json(sectorCatalogForClient()));
app.post('/api/workspace/plan-link',(req,res)=>{
  const parsed=LinkPlanInput.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:'INVALID_SITE_DESCRIPTION',reason:'Choose a website category, tick your rules, and enter a link.'});return;}
  try{res.json(createLinkPlan(parsed.data.websiteUrl,parsed.data.description,parsed.data.sectorId,parsed.data.selectedFeatures,parsed.data.selectedCoreRules));}
  catch(e){workspaceError(res,e);}
});
app.get('/api/ui/hospital-health',async(_req,res)=>{
  try{const response=await fetch('http://127.0.0.1:4300/api/health',{signal:AbortSignal.timeout(1400),redirect:'manual'});
    const json:unknown=await response.json();
    if(!response.ok||!json||typeof json!=='object'||!('app' in json)||json.app!=='cantheyseeit-hospital-synthetic-lab')throw Error('WRONG_HOSPITAL_LAB');
    res.json({reachable:true,name:'CareBridge fictional hospital',origin:'http://127.0.0.1:4300'});
  }catch{res.json({reachable:false,name:'CareBridge fictional hospital',origin:'http://127.0.0.1:4300'});}
});
const LinkVerifyInput=z.object({planId:z.string().uuid(),selectedRules:z.array(z.string()).min(1).max(hospitalSelections.length),
  revisionLabel:z.string().min(1).max(100),approveSyntheticWrites:z.boolean()}).strict();
app.post('/api/workspace/verify-link',async(req,res)=>{
  const parsed=LinkVerifyInput.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:'INVALID_VERIFY_REQUEST',reason:'Review your suggested rules and confirm your test setup.'});return;}
  try{
    const {planId,selectedRules,revisionLabel,approveSyntheticWrites}=parsed.data;
    // Recheck the immutable plan session: no change of URLs/hosts at verification time.
    const session=planSession(planId);
    if(session.url!=='http://127.0.0.1:4300/'||session.mode!=='SUPPORTED_LOCAL')throw new WorkspaceError('NEEDS_SETUP','This link is planning-only until a supported, authorized staging adapter is installed.',409);
    const suite=await createHospitalSuite(planId,selectedRules);
    if(suite.cases.some(x=>x.method==='PATCH')&&!approveSyntheticWrites)throw new WorkspaceError('APPROVAL_REQUIRED','Approve only disposable synthetic edits before running these checks.');
    const adapter=getAdapter(suite.targetProfileId);
    if(!adapter)throw new WorkspaceError('NEEDS_SETUP','The hospital adapter is not available.',409);
    if(activeTargets.has(adapter.id))throw new WorkspaceError('RUN_ALREADY_IN_PROGRESS','Another hospital test is already running.',409);
    activeTargets.add(adapter.id);
    try{
      if(!await getSuite(suite.suiteId)){try{await saveSuite(suite);}catch(e){if(!await getSuite(suite.suiteId))throw e;}}
      const prior=(await getRuns(suite.suiteId)).at(-1);
      const run=await runSuite(suite,adapter,revisionLabel,approveSyntheticWrites,prior);
      await saveRun(run);
      res.json({suite,run,selectedRules,source:'reviewed-local-synthetic-hospital-adapter'});
    }finally{activeTargets.delete(adapter.id);}
  }catch(e){if(e instanceof Error&&e.message.startsWith('NEEDS_SETUP')){res.status(409).json({error:'NEEDS_SETUP',reason:'Start the local hospital test lab or reset its synthetic fixtures.'});return;}workspaceError(res,e);}
});

// The dashboard runs on the SAME loopback origin as the verifier API:
// no public CORS allowance, browser bearer tokens, or additional backend needed.
const dashboardDir = resolve(dirname(fileURLToPath(import.meta.url)), '../dashboard');
app.use(express.static(dashboardDir, { dotfiles: 'deny', index: 'index.html', fallthrough: true }));

const PORT=Number(process.env.VERIFIER_PORT ?? 4100);
if (!Number.isInteger(PORT) || PORT !== 4100) throw new Error('Verifier must use approved loopback port 4100');
app.listen(PORT,'127.0.0.1',()=>console.log(`CanTheySeeIt dashboard + API: http://127.0.0.1:${PORT}; Sprout & Stone adapter registered (target checked per run)`));
