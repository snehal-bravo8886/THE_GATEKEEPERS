/** ZIP-based, *supported-profile-only* onboarding. Never extracts or executes uploads. */
import { inflateRawSync } from 'node:zlib';
import { createHash, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import type { TestCase, TestSuite } from './contracts.ts';
import { SuiteSchema } from './contracts.ts';

export class WorkspaceError extends Error {
  constructor(public code: string, message: string, public httpStatus = 400) { super(message); }
}
function deny(code: string, reason: string, status=400): never { throw new WorkspaceError(code, reason, status); }
const hash = (b: Buffer | string) => createHash('sha256').update(b).digest('hex');
const MAX_ARCHIVE_BYTES=8*1024*1024;
const MAX_ENTRY_SIZE=4*1024*1024;
const MAX_TOTAL_UNPACKED=25*1024*1024;
const uploadSessions=new Map<string,{checksum:string;created:number;name:string;profileId:string; matchedSourceHash:string}>();
const EXPIRY=30*60*1000;
export const RULES = [
  {id:'orders.owner_read',title:'Customers can read only their own orders',description:'Verify both customers can see their own orders and cannot see another customer’s private order.',category:'Customer orders',caseIds:['S01','S02','S03'],writes:false},
  {id:'settings.owner_edit',title:'Only the shopkeeper can edit store settings',description:'Confirm the shopkeeper can update settings and customers cannot change them.',category:'Shop administration',caseIds:['S04','S05'],writes:true},
  {id:'addresses.owner_read',title:'Customers can read only their own addresses',description:'Check own-address access and reject cross-customer or anonymous reads.',category:'Delivery addresses',caseIds:['G01','G01B','G02','G03'],writes:false},
  {id:'addresses.owner_edit',title:'Customers can edit only their own addresses',description:'Check legitimate updates, rejected cross-customer edits and protected ownership fields.',category:'Delivery addresses',caseIds:['G01','G01B','G04','G05','G06','G10'],writes:true},
  {id:'inventory.owner_edit',title:'Only the shopkeeper can update inventory',description:'Ensure owner updates succeed while customer and anonymous edits cannot change stock.',category:'Shop administration',caseIds:['G07','G08','G09'],writes:true},
  {id:'visitors.private_read',title:'Visitors cannot see private delivery addresses',description:'Check a real anonymous request without a login against an existing private address.',category:'Visitor privacy',caseIds:['G01','G03'],writes:false}
] as const;
export type RuleId = typeof RULES[number]['id'];

function centralEntries(buffer: Buffer): Map<string,{offset:number;method:number;compressed:number;unpacked:number;flags:number}> {
  if (buffer.length<22||buffer.length>MAX_ARCHIVE_BYTES) deny('INVALID_ZIP','ZIP must be a real archive under 8 MB.');
  let eocd=-1;
  for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--) {
    if(buffer.readUInt32LE(i)===0x06054b50 && i+22+buffer.readUInt16LE(i+20)===buffer.length){eocd=i;break;}
  }
  if(eocd<0) deny('INVALID_ZIP','ZIP central directory not found (ZIP64 and multi-volume archives are unsupported).');
  const count=buffer.readUInt16LE(eocd+10), size=buffer.readUInt32LE(eocd+12), start=buffer.readUInt32LE(eocd+16);
  if(count===0||count>200||count===0xffff||start===0xffffffff||size===0xffffffff||
     buffer.readUInt16LE(eocd+8)!==count||buffer.readUInt16LE(eocd+4)!==0||buffer.readUInt16LE(eocd+6)!==0||
     start+size>eocd) deny('INVALID_ZIP','Archive is empty, oversized, or uses unsupported ZIP features.');
  const entries=new Map<string,{offset:number;method:number;compressed:number;unpacked:number;flags:number}>();
  let cursor=start, expanded=0;
  for(let i=0;i<count;i++){
    if(cursor+46>start+size||buffer.readUInt32LE(cursor)!==0x02014b50)deny('INVALID_ZIP','Malformed ZIP directory.');
    const flags=buffer.readUInt16LE(cursor+8),method=buffer.readUInt16LE(cursor+10);
    const compressed=buffer.readUInt32LE(cursor+20), unpacked=buffer.readUInt32LE(cursor+24);
    const nameLen=buffer.readUInt16LE(cursor+28),extras=buffer.readUInt16LE(cursor+30),comment=buffer.readUInt16LE(cursor+32);
    const attrs=buffer.readUInt32LE(cursor+38),offset=buffer.readUInt32LE(cursor+42);
    const end=cursor+46+nameLen+extras+comment;
    if(end>start+size||nameLen<1||nameLen>260)deny('INVALID_ZIP','Invalid ZIP entry bounds.');
    const name=buffer.subarray(cursor+46,cursor+46+nameLen).toString('utf8');
    if(name.includes('\\')||name.includes('\0')||name.startsWith('/')||name.split('/').some(p=>p==='..'||p==='.')||name.includes(':')||name.includes('//'))
      deny('UNSAFE_ZIP','Archive contains unsafe paths.');
    const mode=(attrs>>>16)&0xffff;
    if((mode & 0xf000)===0xa000)deny('UNSAFE_ZIP','Symbolic links are not permitted in uploaded ZIPs.');
    if((flags&1)!==0||(flags&8)!==0||![0,8].includes(method)||unpacked>MAX_ENTRY_SIZE || compressed>MAX_ARCHIVE_BYTES)
      deny('UNSUPPORTED_ZIP','Encrypted, data-descriptor, oversized or unsupported-compression entries are not accepted.');
    expanded+=unpacked;
    if(expanded>MAX_TOTAL_UNPACKED)deny('UNSAFE_ZIP','Archive has too much expanded content.');
    if(entries.has(name)) deny('UNSAFE_ZIP','Duplicate archive paths are not allowed.');
    entries.set(name,{offset,method,compressed,unpacked,flags});cursor=end;
  }
  if(cursor!==start+size)deny('INVALID_ZIP','Invalid ZIP central directory size.');
  return entries;
}
function readEntry(buffer:Buffer,entry:{offset:number;method:number;compressed:number;unpacked:number;flags:number}):Buffer{
  const at=entry.offset;
  if(at+30>buffer.length||buffer.readUInt32LE(at)!==0x04034b50)deny('INVALID_ZIP','Invalid local entry header.');
  const method=buffer.readUInt16LE(at+8),flags=buffer.readUInt16LE(at+6);
  if(method!==entry.method||flags!==entry.flags)deny('INVALID_ZIP','Conflicting ZIP headers.');
  const n=buffer.readUInt16LE(at+26),x=buffer.readUInt16LE(at+28);
  const a=at+30+n+x,b=a+entry.compressed;
  if(b>buffer.length)deny('INVALID_ZIP','ZIP entry data out of bounds.');
  const raw=buffer.subarray(a,b);
  try{
    const result=method===0?raw:inflateRawSync(raw,{maxOutputLength:entry.unpacked+1});
    if(result.length!==entry.unpacked)deny('INVALID_ZIP','Invalid unpacked size.');
    return result;
  }catch(e){if(e instanceof WorkspaceError)throw e;deny('INVALID_ZIP','Unable to safely decode ZIP entry.');}
}
const labRoot=resolve(process.cwd(),'lab/grocery-security-lab');
const requiredSource=['src/app.mjs','src/access.mjs','src/data.mjs','public/index.html'];
const festRoot=resolve(process.cwd(),'lab/aetherfest-college-lab');
const festRequiredSource=['src/server.mjs','src/permissions.mjs','src/data.mjs','public/index.html','public/app.js'];
export const FEST_RULES=[
{id:'fest.registration.owner_read',title:'Students should only view their own registrations',description:'Check two verified student sessions, then try accessing the other student’s private registration.',category:'Student privacy',caseIds:['F01','F02','F03'],writes:false},
{id:'fest.settings.head_edit',title:'Only the fest head should change ticket prices and site settings',description:'Compare real ticket pricing before and after an ordinary student attempts a restricted change.',category:'Event management',caseIds:['F04','F05'],writes:true}
] as const;

export async function registerSupportedZip(buffer:Buffer,filename:string){
  if(!/\.zip$/i.test(filename)||filename.length>180)deny('INVALID_FILENAME','Choose a ZIP file with a simple filename.');
  const entries=centralEntries(buffer);
  const paths=[...entries.keys()].filter(k=>k.endsWith('/target-manifest.json') || k==='target-manifest.json');
  if(paths.length!==1)deny('UNSUPPORTED_APP','This ZIP is not a recognized supported grocery application.',422);
  const path=paths[0],prefix=path.slice(0,-'target-manifest.json'.length);
  let manifest:any;
  try{manifest=JSON.parse(readEntry(buffer,entries.get(path)!).toString('utf8'));}
  catch{deny('UNSUPPORTED_APP','The supported application manifest is invalid.',422);}
  if(manifest?.projectId==='aetherfest-college-lab'){
    if(manifest?.testOnly!==true||manifest?.fixtures?.ownerA?.id!=='reg-a-1001'||manifest?.fixtures?.ownerB?.id!=='reg-b-1002')
      deny('UNSUPPORTED_APP','This is not the approved synthetic AETHER test project.',422);
    for(const rel of festRequiredSource){
      const z=entries.get(prefix+rel);if(!z)deny('UNSUPPORTED_APP',`Missing college fest source: ${rel}`,422);
      const trusted=await readFile(resolve(festRoot,rel));
      if(hash(trusted)!==hash(readEntry(buffer,z)))deny('ARCHIVE_SOURCE_MISMATCH',`The uploaded ${rel} is not the installed college fest version. ZIPs are never executed.`,422);
    }
    for(const [id,s] of uploadSessions){if(Date.now()-s.created>EXPIRY)uploadSessions.delete(id);}
    const id=randomUUID();
    const matchedSourceHash=hash(Buffer.from(festRequiredSource.map(p=>hash(readEntry(buffer,entries.get(prefix+p)!))).join(':')));
    uploadSessions.set(id,{checksum:hash(buffer),created:Date.now(),name:filename,profileId:'aetherfest-college-lab',matchedSourceHash});
    return {uploadId:id,fileName:filename,archiveSha256:hash(buffer),projectId:'aetherfest-college-lab',projectName:'AETHER — supported local college fest',matchedSourceHash,
      message:'Approved College Fest ZIP matched to installed local lab on port 4400. Source inspected; no uploaded code executed.'};
  }
  if(manifest?.projectId!=='sprout-stone-local-grocery-lab'||manifest?.testOnly!==true||
    manifest?.fixtures?.ownerA?.id!=='order-a-1001'||manifest?.fixtures?.ownerB?.id!=='order-b-1002')
    deny('UNSUPPORTED_APP','Only the approved synthetic Sprout & Stone integration is supported.',422);
  for(const rel of requiredSource){
    const z=entries.get(prefix+rel);
    if(!z)deny('UNSUPPORTED_APP',`Missing application file: ${rel}`,422);
    const trusted=await readFile(resolve(labRoot,rel));
    if(hash(trusted)!==hash(readEntry(buffer,z)))deny('ARCHIVE_SOURCE_MISMATCH',
      `The uploaded ${rel} does not match the installed approved local lab. The ZIP is never executed. Update the local lab or choose its matching ZIP.`,422);
  }
  // Do not save the uploaded archive or launch its code. It only selects a trusted local profile.
  for(const [id,s] of uploadSessions){if(Date.now()-s.created>EXPIRY)uploadSessions.delete(id);}
  const id=randomUUID();
  const matchedSourceHash=hash(Buffer.from(requiredSource.map(p=>hash(readEntry(buffer,entries.get(prefix+p)!))).join(':')));
  const checksum=hash(buffer);
  uploadSessions.set(id,{checksum,created:Date.now(),name:filename,profileId:'sprout-stone-local-grocery-lab',matchedSourceHash});
  return {uploadId:id,fileName:filename,archiveSha256:checksum,projectId:'sprout-stone-local-grocery-lab',
    projectName:'Sprout & Stone — supported local training lab',matchedSourceHash,
    message:'ZIP layout and approved source files verified. We do not execute the archive. Tests use the matching installed grocery lab on http://127.0.0.1:4200.'};
}
export function getApprovedUpload(id:string){
  const item=uploadSessions.get(id);
  if(!item||Date.now()-item.created>EXPIRY)deny('UPLOAD_EXPIRED','Upload the website ZIP again to continue.',410);
  return item;
}
export async function createSelectedSuite(ruleIds:string[], originalPrompt='', profileId='sprout-stone-local-grocery-lab'):Promise<TestSuite>{
  if(profileId==='aetherfest-college-lab'){
    if(!Array.isArray(ruleIds)||ruleIds.length<1||ruleIds.length>FEST_RULES.length||new Set(ruleIds).size!==ruleIds.length||ruleIds.some(id=>!FEST_RULES.some(r=>r.id===id)))deny('INVALID_RULES','Choose college-event permission checks.');
    const selected=FEST_RULES.filter(r=>ruleIds.includes(r.id));
    const template:TestSuite=JSON.parse(await readFile(resolve(process.cwd(),'suites/aetherfest.college-vulnerabilities.json'),'utf8'));
    const ids=new Set(selected.flatMap(r=>[...r.caseIds]));
    const byId=new Map(template.cases.map(c=>[c.testId,c]));
    function includePrereqs(id:string){for(const prerequisite of byId.get(id)?.requiredControls||[]){if(!ids.has(prerequisite)){ids.add(prerequisite);includePrereqs(prerequisite);}}}
    [...ids].forEach(includePrereqs);
    const cases=template.cases.filter(c=>ids.has(c.testId));
    const sig=hash(selected.map(r=>r.id).join('|')+'\n'+originalPrompt.slice(0,1200)).slice(0,18);
    const input={...template,suiteId:`workspace-aether-${sig}`,title:`College Events security checks · ${selected.length} rules`,originalRequirement:(originalPrompt.trim()?`User description: ${originalPrompt.slice(0,1200)} | `:'')+selected.map(r=>r.title).join('; '),cases};
    const parsed=SuiteSchema.safeParse(input);if(!parsed.success)deny('CONTRACT_GENERATION_FAILED','Invalid college fest test contract.',500);return parsed.data;
  }
  if(profileId!=='sprout-stone-local-grocery-lab')deny('UNKNOWN_TARGET','Unknown supported profile.');
  if(!Array.isArray(ruleIds)||ruleIds.length<1||ruleIds.length>RULES.length||new Set(ruleIds).size!==ruleIds.length||
     ruleIds.some(r=>!RULES.some(x=>x.id===r)))deny('INVALID_RULES','Select one or more supported permission rules.');
  const selected=RULES.filter(rule=>ruleIds.includes(rule.id));
  const [regular,known]=await Promise.all([
    readFile(resolve(process.cwd(),'suites/sprout.g01-g10.json'),'utf8').then(JSON.parse),
    readFile(resolve(process.cwd(),'suites/sprout-known-vulnerabilities.json'),'utf8').then(JSON.parse)
  ]);
  const source=[...regular.cases,...known.cases] as TestCase[];
  const desired=new Set(selected.flatMap(rule=>[...rule.caseIds]));
  // Keep fixture preconditions in their approved order and avoid invalid cross-suite dependencies.
  const dependencies=new Map(source.map(c=>[c.testId,c.requiredControls]));
  function includeControls(id:string){for(const dep of dependencies.get(id)||[]){if(!desired.has(dep)){desired.add(dep);includeControls(dep);}}}
  [...desired].forEach(includeControls);
  const cases=source.filter(c=>desired.has(c.testId));
  const requirement=originalPrompt.trim().slice(0,1200);
  const selectedSummary=selected.map(x=>x.title).join('; ');
  const signature=hash(selected.map(r=>r.id).join('|')+(requirement?'\n'+requirement:'')).slice(0,18);
  const input={suiteId:`workspace-sprout-${signature}`,title:`My security promises · ${selected.length} rule${selected.length===1?'':'s'}`,
    originalRequirement:(requirement?`Original description: ${requirement} | Confirmed checks: ${selectedSummary}`:selectedSummary).slice(0,2000),targetProfileId:'sprout-stone-local-grocery-lab',confirmed:true,cases};
  const parsed=SuiteSchema.safeParse(input);
  if(!parsed.success)deny('CONTRACT_GENERATION_FAILED','Could not build a valid verification contract.',500);
  return parsed.data;
}
export async function confirmUploadedSourceMatchesLocal(uploadId:string){
  const item=getApprovedUpload(uploadId);
  // Catch local source changes AFTER upload; never silently test a different revision.
  const localRoot=item.profileId==='aetherfest-college-lab'?festRoot:labRoot;
  const sourcePaths=item.profileId==='aetherfest-college-lab'?festRequiredSource:requiredSource;
  const source=await Promise.all(sourcePaths.map(async rel=>hash(await readFile(resolve(localRoot,rel)))));
  const current=hash(Buffer.from(source.join(':')));
  if(current!==item.matchedSourceHash)deny('SOURCE_CHANGED','The installed grocery application changed after ZIP approval. Upload a matching ZIP again.',409);
  return item;
}
export function rulesForClient(profileId='sprout-stone-local-grocery-lab'){return (profileId==='aetherfest-college-lab'?FEST_RULES:RULES).map(({id,title,description,category,caseIds,writes})=>({id,title,description,category,checkCount:caseIds.length,writes}));}
