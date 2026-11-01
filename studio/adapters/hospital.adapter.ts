/** Independent, fixed, synthetic-only hospital adapter. No runtime user-controlled hosts. */
import { isDeepStrictEqual } from 'node:util';
import type {TargetAdapter} from '../src/adapter.ts';
import type {TestCase} from '../src/contracts.ts';
type Json=Record<string,unknown>;
const identities={
 'patient-a':{email:'avery@care.example',password:'PatientA!26',role:'patient'},
 'patient-b':{email:'blake@care.example',password:'PatientB!26',role:'patient'},
 'clinician-1':{email:'doctor@care.example',password:'clinician-demo-26',role:'clinician'},
 'hospital-admin':{email:'admin@care.example',password:'admin-demo-26',role:'admin'}
} as const;
type Identity=keyof typeof identities;
const known:Record<string,{kind:'record'|'file'|'settings',owner?:string,marker?:string}>={
 'record-a-101':{kind:'record',owner:'patient-a',marker:'PATIENT_A_PRIVATE_5C4B'},
 'record-b-102':{kind:'record',owner:'patient-b',marker:'PATIENT_B_PRIVATE_6E9F'},
 'file-a-101':{kind:'file',owner:'patient-a',marker:'FILE_A_PRIVATE_8A63'},
 'file-b-102':{kind:'file',owner:'patient-b',marker:'FILE_B_PRIVATE_7E18'},
 'hospital-settings':{kind:'settings'}
};
const mutations:Record<string,Json>={
 'patient.contact.own':{contactNote:'APPROVED_SYNTHETIC_PATIENT_CHANGE'},
 'patient.contact.cross':{contactNote:'FORBIDDEN_SYNTHETIC_PATIENT_CHANGE'},
 'patient.clinical.denied':{clinicalNote:'FORBIDDEN_CLINICAL_EDIT'},
 'patient.owner.reassign':{ownerUserId:'patient-b'},
 'admin.settings.approved':{supportEmail:'reviewed-test@care.example'},
 'admin.settings.denied':{supportEmail:'forbidden-patient@care.example'}
};
const operations:Record<string,{kind:string,method:string}>={
 'patient.read':{kind:'record',method:'GET'},'patient.edit':{kind:'record',method:'PATCH'},
 'file.read':{kind:'file',method:'GET'},'admin.edit':{kind:'settings',method:'PATCH'}
};
const object=(value:unknown):value is Json=>value!==null&&typeof value==='object'&&!Array.isArray(value);
function check(t:TestCase){const record=known[t.resourceRef],op=operations[t.operationRef];
 if(!record||!op||record.kind!==op.kind||op.method!==t.method)throw new Error('UNAPPROVED_HOSPITAL_CASE');return record;
}
function endpoint(t:TestCase){const info=check(t);return info.kind==='record'?`/api/patient-records/${t.resourceRef}`:info.kind==='file'?`/api/patient-files/${t.resourceRef}`:'/api/clinical/settings';}
function extract(t:TestCase,response:unknown){const kind=check(t).kind;if(!object(response))throw new Error('INVALID_RECORD_RESPONSE');const r=response[kind==='record'?'record':kind==='file'?'file':'settings'];if(!object(r))throw new Error('INVALID_RECORD_RESPONSE');return structuredClone(r);}
export function createHospitalAdapter():TargetAdapter {
 const baseUrl='http://127.0.0.1:4300/';const tokens:Partial<Record<Identity,string>>={};let live=false;
 const approvedPaths=new Set<string>(['/api/patient-records/record-a-101','/api/patient-records/record-b-102','/api/patient-files/file-a-101','/api/patient-files/file-b-102','/api/clinical/settings']);
 async function request(path:string,{method='GET',actor,body}:{method?:'GET'|'POST',actor?:Identity,body?:unknown}={}){
  const r=await fetch(new URL(path,baseUrl),{method,redirect:'manual',signal:AbortSignal.timeout(2800),headers:{Accept:'application/json',...(actor&&tokens[actor]?{Authorization:`Bearer ${tokens[actor]}`}:{ }),...(body!==undefined?{'Content-Type':'application/json'}:{})},body:body===undefined?undefined:JSON.stringify(body)});
  if(r.status>=300&&r.status<400)throw new Error('REDIRECT_BLOCKED');return {status:r.status,data:await r.json() as unknown};
 }
 async function valid(id:Identity){const r=await request('/api/me',{actor:id});return r.status===200&&object(r.data)&&r.data.userId===id&&r.data.role===identities[id].role;}
 async function ownSnapshot(t:TestCase){const info=check(t);if(info.kind==='file')throw new Error('FILE_WRITE_UNSUPPORTED');
  const id=info.kind==='settings'?'hospital-admin':info.owner as Identity;
  const r=await request(endpoint(t),{actor:id});if(r.status!==200)throw new Error('NO_TRUSTED_SNAPSHOT');
  const value=extract(t,r.data);if(info.kind==='record'&&(value.recordId!==t.resourceRef||value.ownerUserId!==info.owner||value.privateMarker!==info.marker))throw new Error('WRONG_PRIVATE_RECORD');return value;
 }
 return {
  id:'carebridge-local-hospital-lab',baseUrl,syntheticOnly:true,fixtureRevision:'fictional-hospital-fixtures-v1',approvedPaths,
  async ready(){live=false;for(const id of Object.keys(identities) as Identity[])delete tokens[id];
   try{
    const health=await request('/api/health');if(health.status!==200||!object(health.data)||health.data.app!=='cantheyseeit-hospital-synthetic-lab')throw Error('WRONG_TARGET');
    for(const id of Object.keys(identities) as Identity[]){const identity=identities[id];const r=await request('/api/auth/token',{method:'POST',body:{email:identity.email,password:identity.password}});
     if(r.status!==200||!object(r.data)||typeof r.data.token!=='string'||r.data.token.length<20)throw Error('LOGIN_FAILED');tokens[id]=r.data.token;if(!await valid(id))throw Error('WRONG_IDENTITY');}
    for(const resourceRef of ['record-a-101','record-b-102','hospital-settings']){
     const t={testId:'baseline',actorRef:'patient-a',resourceRef,operationRef:resourceRef==='hospital-settings'?'admin.edit':'patient.read',method:resourceRef==='hospital-settings'?'PATCH':'GET',expectation:'ALLOW',requiredControls:[],acceptedDenialStatuses:[],...(resourceRef==='hospital-settings'?{mutationRef:'admin.settings.approved'}:{})} as TestCase;
     const state=await ownSnapshot(t);if(resourceRef==='hospital-settings'&&state.supportEmail!=='test-support@care.example')throw Error('DIRTY_ADMIN');
     if(resourceRef==='record-a-101'&&state.contactNote!=='Synthetic A initial')throw Error('DIRTY_A');
     if(resourceRef==='record-b-102'&&state.contactNote!=='Synthetic B initial')throw Error('DIRTY_B');
    }
    live=true;return {ready:true};
   }catch{return {ready:false,reason:'HOSPITAL_LAB_OFFLINE_OR_FIXTURES_DIRTY'};}
  },
  async validateActor(id){return live&&id in identities?await valid(id as Identity).catch(()=>false):false;},
  async authHeaders(id){if(!live||!(id in identities)||!tokens[id as Identity])throw Error('UNKNOWN_IDENTITY');return {Authorization:`Bearer ${tokens[id as Identity]}`};},
  async resolve(t){const path=endpoint(t);if(!approvedPaths.has(path))throw Error('PATH_NOT_ALLOWED');if(t.method==='GET')return {path,method:'GET'};
   const value=t.mutationRef?mutations[t.mutationRef]:undefined;if(!value)throw Error('UNAPPROVED_MUTATION');
   if(check(t).kind==='record'&&!t.mutationRef?.startsWith('patient.'))throw Error('BAD_MUTATION');
   if(check(t).kind==='settings'&&!t.mutationRef?.startsWith('admin.'))throw Error('BAD_MUTATION');
   return {path,method:'PATCH',body:structuredClone(value)};
  },
  matchesProtectedFixture(t,body){const info=check(t);if(info.kind==='settings'||!object(body))return false;
   const value=body[info.kind==='record'?'record':'file'];if(!object(value))return false;
   return value[info.kind==='record'?'recordId':'fileId']===t.resourceRef&&value.ownerUserId===info.owner&&value.privateMarker===info.marker;
  },
  async snapshot(t){return ownSnapshot(t);},
  compareState(t,before,after){if(!object(before)||!object(after))throw Error('BAD_STATE');const kind=check(t).kind;const idKey=kind==='record'?'recordId':'hospitalName';if(before[idKey]!==after[idKey])throw Error('WRONG_STATE');
   const changed=!isDeepStrictEqual(before,after);const mutation=t.mutationRef?mutations[t.mutationRef]:null;
   return {changed,intendedChange:changed&&Boolean(mutation&&isDeepStrictEqual({...before,...mutation},after))};
  },
  async restore(t,original){if(!object(original))throw Error('BAD_RESTORE');const r=await request('/__test/restore',{method:'POST',actor:'hospital-admin',body:{resourceId:t.resourceRef,original}});if(r.status!==200)throw Error('RESTORE_FAILED');}
 };
}
