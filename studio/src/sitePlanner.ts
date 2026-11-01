/** No scraping, crawling, network fetch, URL scanning or medical data retention.
 * Deterministic rule suggestions; plan != security finding. Exact trusted local integration required to run.
 */
import {randomUUID} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {SuiteSchema,type TestCase,type TestSuite} from './contracts.ts';
import {WorkspaceError} from './workspace.ts';
import {buildSectorSuggestions} from './sectorCatalog.ts';
const HOSPITAL_URL='http://127.0.0.1:4300/';
const sessions=new Map<string,{created:number;url:string;kind:string;mode:string}>();
const ttl=30*60*1000;
export const hospitalSelections=[
 {id:'privacy',title:'People should see only their own records',caseIds:['H01','H02','H03'],writes:false,category:'Private records'},
 {id:'my-edits',title:'People should edit only their own information',caseIds:['H01','H02','H05','H06'],writes:true,category:'Patient information'},
 {id:'admin',title:'Only administrators should change sensitive settings',caseIds:['H02','H09','H10'],writes:true,category:'Hospital administration'},
 {id:'visitors',title:'People who are not signed in should not see records',caseIds:['H01','H04'],writes:false,category:'Visitor privacy'},
 {id:'clinician',title:'Assigned clinicians can view records, but patients cannot edit clinical notes',caseIds:['H01','H07','H08'],writes:true,category:'Clinical roles'},
 {id:'files',title:'Patient files should stay private, even if someone knows the file ID',caseIds:['H01','H02','H11','H12'],writes:false,category:'Medical files'},
 {id:'protected-fields',title:'A patient must not change who owns a medical record',caseIds:['H01','H13'],writes:true,category:'Protected fields'}
] as const;
function validateUrl(input:string){if(typeof input!=='string'||input.length>400)throw new WorkspaceError('INVALID_LINK','Enter a normal website link, under 400 characters.');
 let u:URL;try{u=new URL(input);}catch{throw new WorkspaceError('INVALID_LINK','Enter a full website link beginning with https://, or a supported local test URL.');}
 if(u.username||u.password||u.hash||u.protocol!=='https:'&&u.protocol!=='http:'||u.hostname.length>250||u.port&&u.port.length>5)
   throw new WorkspaceError('INVALID_LINK','Only ordinary HTTP(S) website links without credentials or fragments are accepted.');
 if(u.protocol==='http:'&&u.hostname!=='127.0.0.1')throw new WorkspaceError('INVALID_LINK','For nonlocal websites, enter an HTTPS link. We will only prepare a plan, not send test requests.');
 return u.origin+'/';
}
const genericCases=[
 {id:'BASE-01',priority:'P0',title:'Can a person access their own private information?',requires:'Known synthetic owner, own record, valid login',why:'Positive control: without it a denial may just mean broken login.'},
 {id:'BASE-02',priority:'P0',title:'Can one person view another person’s private information?',requires:'Two independent test accounts and exact record-owner evidence',why:'Detects broken record ownership checks.'},
 {id:'BASE-03',priority:'P0',title:'Can someone edit another person’s information?',requires:'Disposable records, authorization, before-and-after snapshots, guaranteed reset',why:'A forbidden response alone does not prove records stayed unchanged.'},
 {id:'BASE-04',priority:'P0',title:'Can a normal user change administrator-only settings?',requires:'Known admin and normal test accounts, safe settings fixture',why:'Checks server-side role enforcement.'},
 {id:'BASE-05',priority:'P0',title:'Can someone who is logged out access a private resource?',requires:'Valid existing private fixture, truly anonymous session',why:'Checks private records are not publicly disclosed.'},
 {id:'BASE-06',priority:'P0',title:'Do expired or invalid logins ever produce a false PASS?',requires:'Test-only expired session capability',why:'An authentication failure must not be misreported as successful authorization.'}
];
export function inferPlan(websiteUrl:string,description:string,sectorId?:string,featureIds:string[]=[],coreRuleIds:string[]=[]){
 const url=validateUrl(websiteUrl);
 // Explicit finite selections take precedence over keyword guessing.
 if(sectorId){
  const selected=buildSectorSuggestions(sectorId,featureIds,coreRuleIds);
  const kind=sectorId==='clinic'?'hospital':'general';
  const mode=url===HOSPITAL_URL&&sectorId==='clinic'?'SUPPORTED_LOCAL':'PLAN_ONLY';
  const extras=selected.extraCases.map(x=>({...x,execution:(mode==='SUPPORTED_LOCAL'&&
    ({'clinic-files':'files','clinic-clinician':'clinician','clinic-notes':'clinician','clinic-ownership':'protected-fields'} as Record<string,string>)[x.featureId])?
    'AVAILABLE_ON_SAMPLE' as const:'NEEDS_MAPPING' as const}));
  const options=mode==='SUPPORTED_LOCAL'?hospitalSelections.map(x=>({id:x.id,title:x.title,category:x.category,writes:x.writes,checkCount:x.caseIds.length})):[];
  return {url,kind,mode,sectorId,sectorName:selected.sector.name,features:selected.features,
    selectedCoreRuleIds:selected.selectedCoreRuleIds,selectedFeatureIds:selected.selectedFeatureIds,
    rationale:`You selected ${selected.sector.name}. These checks are generated from your checkbox choices, not from an AI model.`,
    generalCases:selected.generalCases,extraCases:extras,options,
    notes:['The website link is only validated as text. No requests are sent to unfamiliar websites.',
      'These are suggested checks, NOT security findings. They require confirmed test identities and known resources.',
      mode==='SUPPORTED_LOCAL'?'Only the local CareBridge test instance can run its mapped synthetic checks.':'SETUP NEEDED: connect a reviewed synthetic staging adapter before running any live checks.']};
 }

 if(typeof description!=='string'||description.length>1200)throw new WorkspaceError('INVALID_DESCRIPTION','Describe your website in 1,200 characters or fewer. Never paste patient names or records.');
 const desc=description.toLowerCase(),urlText=new URL(url).hostname.toLowerCase();
 const kind=url===HOSPITAL_URL||/hospital|patient|clinical|clinician|doctor|medical|healthcare|medical file|medical record|ehr|health record/.test(desc+' '+urlText)?'hospital':'general';
 const mode=url===HOSPITAL_URL?'SUPPORTED_LOCAL':'PLAN_ONLY';
 const rationale=kind==='hospital'?'You described patient, hospital, or clinical information.':'We found no reliable specialist features in your description, so we begin with common website permissions.';
 const extras=[] as {id:string;title:string;why:string;requires:string;execution:'AVAILABLE_ON_SAMPLE'|'NEEDS_MAPPING'}[];
 const add=(id:string,title:string,why:string,requires:string,available=false)=>extras.push({id,title,why,requires,execution:available&&mode==='SUPPORTED_LOCAL'?'AVAILABLE_ON_SAMPLE':'NEEDS_MAPPING'});
 if(kind==='hospital'){
  add('clinician','Check assigned-clinician permissions','Hospital staff permissions should depend on actual assignment, not just a staff login.','Synthetic assigned and unassigned clinicians and patient records',true);
  add('files','Check private medical file downloads','File URLs and predictable IDs must not disclose another patient’s documents.','Synthetic file IDs, exact private markers and downloads',true);
  add('protected-fields','Prevent patients changing protected clinical fields','A patient editing personal details should not gain authority to rewrite ownership or clinical notes.','Disposable clinical fields and a reset',true);
  add('unassigned-clinician','Check unassigned clinician denial','Clinical role alone should not grant access to every patient.','An unassigned clinician session plus assignment data');
  add('record-list','Check patient search and listing privacy','Search results and pagination can leak records even if individual record routes deny access.','A documented patient search/list endpoint and two fixtures');
 }
 if(/appointment|booking|schedule/.test(desc))add('appointments','Check appointments are owner-only','Booking details may reveal a different patient’s private information.','Two synthetic appointments, patient sessions and route mapping');
 if(/upload|download|attachment|file|document|report/.test(desc)&&kind!=='hospital')add('documents','Check private downloads and attachments','Private links may be readable without authorization.','A synthetic file for each test identity');
 if(/upload|attachment/.test(desc))add('file-upload','Check who may upload or replace files','Write permissions may differ from read permissions.','Disposable upload endpoint and safe reset; no live uploads');
 if(/share|consent|delegate|caregiver|revoke/.test(desc))add('consent','Check sharing and consent revocation','A previously authorized viewer should lose access after consent is revoked.','Synthetic share grants and revocation workflow');
 if(/export|bulk|download all/.test(desc))add('bulk-export','Check bulk export ownership','Bulk export can bypass protections on single-record endpoints.','Scoped synthetic export endpoint and exact fixture assertions');
 if(/audit|history|log/.test(desc))add('audit','Check confidential activity logs','Audit history may leak private data or allow unauthorized edits.','Sanitized audit fixture and read-only log endpoint');
 if(/student|school|college|course|grade|exam/.test(desc)){
  add('grade-ownership','Check student grades remain private','One student should never retrieve another student’s result.','Synthetic student accounts and two grade fixtures');
  add('faculty-edit','Check instructor-only grade editing','A student should not be able to change a grade or academic decision.','Synthetic teacher role and disposable grade edit test');
 }
 if(/grocery|store|shop|cart|checkout|orders|ecommerce|retail/.test(desc)){
  add('order-owner','Check orders and baskets cannot cross customer accounts','Orders may contain private delivery and payment-related information.','Two synthetic customers and orders');
  add('staff-stock','Check stock and pricing changes are staff-only','Ordinary shoppers must not alter inventory or prices.','Synthetic staff role and reversible stock/price fixture');
 }
 if(/finance|invoice|billing|bank|account balance|payment/.test(desc)){
  add('financial-isolation','Check financial documents are owner-restricted','Another customer must not read a confidential invoice or account statement.','Synthetic invoices and account ownership');
  add('refund-role','Check high-impact financial actions are restricted','Refunds, transfers and billing changes require a confirmed privileged workflow.','Isolated mock payment environment; never move real money');
 }
 if(/tenant|organization|workspace|company|team membership/.test(desc))add('tenant-isolation','Check users cannot cross organization boundaries','Valid login to one tenant should not allow reading another organization’s records.','Two synthetic organizations and independent members');
 const notes=[
  'The link and description are interpreted locally as user-provided text; no request is sent to the website.',
  'Suggestions are NOT findings. They must be confirmed and connected to approved synthetic identities and resources.',
  mode==='SUPPORTED_LOCAL'?'This exact local CareBridge training lab can run the supported cases after it is started.':'This website is PLAN-ONLY. Do not enter real patient records, session tokens or production endpoints. A reviewed staging adapter is required for execution.'
 ];
 return {url,kind,mode,rationale,generalCases:genericCases,extraCases:extras,options:kind==='hospital'?hospitalSelections.map(x=>({id:x.id,title:x.title,category:x.category,writes:x.writes,checkCount:x.caseIds.length})):[],notes};
}
export function createLinkPlan(url:string,description:string,sectorId?:string,featureIds:string[]=[],coreRuleIds:string[]=[]){const plan=inferPlan(url,description,sectorId,featureIds,coreRuleIds);for(const [id,s] of sessions)if(Date.now()-s.created>ttl)sessions.delete(id);
 const planId=randomUUID();sessions.set(planId,{created:Date.now(),url:plan.url,kind:plan.kind,mode:plan.mode});return {planId,...plan};
}
export function planSession(id:string){const s=sessions.get(id);if(!s||Date.now()-s.created>ttl)throw new WorkspaceError('PLAN_EXPIRED','Start a new website plan before testing.',410);return s;}
export async function createHospitalSuite(planId:string,selected:string[]):Promise<TestSuite>{const s=planSession(planId);
 if(s.mode!=='SUPPORTED_LOCAL'||s.kind!=='hospital')throw new WorkspaceError('NEEDS_SETUP','An approved synthetic staging adapter is required for this website. The link was not scanned.',409);
 if(!Array.isArray(selected)||!selected.length||selected.length>hospitalSelections.length||new Set(selected).size!==selected.length||selected.some(id=>!hospitalSelections.some(x=>x.id===id)))throw new WorkspaceError('INVALID_RULES','Choose supported patient privacy checks.');
 const source=JSON.parse(await readFile(resolve(process.cwd(),'suites/hospital.patient-access.json'),'utf8')) as TestSuite;
 const needed=new Set(hospitalSelections.filter(x=>selected.includes(x.id)).flatMap(x=>[...x.caseIds]));
 const byId=new Map(source.cases.map(t=>[t.testId,t]));
 function includeDeps(id:string){for(const x of byId.get(id)?.requiredControls||[])if(!needed.has(x)){needed.add(x);includeDeps(x);}}
 [...needed].forEach(includeDeps);
 const cases=source.cases.filter(t=>needed.has(t.testId));
 const canonicalChoices=selected.slice().sort();
 const suiteId='carebridge-confirmed-'+canonicalChoices.join('-');
 const parsed=SuiteSchema.safeParse({suiteId,title:'My hospital privacy promises',originalRequirement:`User-confirmed patient privacy checks: ${canonicalChoices.join(', ')}. User-provided site description is not stored in the test ledger.`.slice(0,2000),targetProfileId:source.targetProfileId,confirmed:true,cases});
 if(!parsed.success)throw new WorkspaceError('INVALID_CONTRACT','The hospital checks could not be safely created.',500);return parsed.data;
}
