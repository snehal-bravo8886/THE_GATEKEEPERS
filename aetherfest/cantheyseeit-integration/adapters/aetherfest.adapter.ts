/** AETHER College Fest — trusted local adapter for CanTheySeeIt Generic Verifier V2.
 * Use on the locally installed synthetic lab only, never on a real institution.
 */
import {isDeepStrictEqual} from 'node:util';
import type {TargetAdapter} from '../src/adapter.ts';
import type {TestCase} from '../src/contracts.ts';

type Obj=Record<string,unknown>;
const base='http://127.0.0.1:4400/';
const users={
  head:{email:'head@aetherfest.test',password:'HeadDemo!26',role:'head'},
  'student-a':{email:'aarav@aetherfest.test',password:'StudentA!26',role:'student'},
  'student-b':{email:'diya@aetherfest.test',password:'StudentB!26',role:'student'}
} as const;
type Actor=keyof typeof users;
const registrations={
  'reg-a-1001':{owner:'student-a',marker:'AETHER_PRIVATE_A_26FG7'},
  'reg-b-1002':{owner:'student-b',marker:'AETHER_PRIVATE_B_84PD2'}
} as const;
const mutations:Record<string,Obj>={
  'fest.head.price':{ticketPrice:549},
  'fest.student.price':{ticketPrice:1}
};
function object(v:unknown):v is Obj{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function check(test:TestCase){
 if(test.operationRef==='registration.read' && test.method==='GET' && test.resourceRef in registrations)return 'registration';
 if(test.operationRef==='fest.settings.update' && test.method==='PATCH' && test.resourceRef==='fest-settings')return 'settings';
 throw Error('UNAPPROVED_FEST_TEST');
}
export function createAetherFestAdapter():TargetAdapter{
 const sessions:Partial<Record<Actor,string>>={};
 let ready=false;
 const approvedPaths=new Set(['/api/registrations/reg-a-1001','/api/registrations/reg-b-1002','/api/fest/settings']);
 async function request(path:string,opts:{method?:'GET'|'POST'|'PATCH';actor?:Actor;body?:unknown}={}){
  const result=await fetch(new URL(path,base),{method:opts.method||'GET',redirect:'manual',signal:AbortSignal.timeout(2400),headers:{'Accept':'application/json',...(opts.actor&&sessions[opts.actor]?{'Authorization':'Bearer '+sessions[opts.actor]}:{}),...(opts.body!==undefined?{'Content-Type':'application/json'}:{})},body:opts.body===undefined?undefined:JSON.stringify(opts.body)});
  if(result.status>=300&&result.status<400)throw Error('REDIRECT_BLOCKED');
  return {status:result.status,data:await result.json()};
 }
 async function validateActor(actor:Actor){const r=await request('/api/me',{actor});return r.status===200&&object(r.data)&&r.data.userId===actor&&r.data.role===users[actor].role;}
 async function snapshotSettings(){const r=await request('/api/fest/settings',{actor:'head'});if(r.status!==200||!object(r.data)||!object(r.data.settings)||!Number.isInteger(r.data.settings.ticketPrice))throw Error('UNTRUSTED_FEST_SNAPSHOT');return structuredClone(r.data.settings);}
 return {
  id:'aetherfest-college-lab',baseUrl:base,syntheticOnly:true,fixtureRevision:'aetherfest-seeded-v1',approvedPaths,
  async ready(){
   ready=false;
   for(const k of Object.keys(users) as Actor[])delete sessions[k];
   try{
    const h=await request('/api/health');if(h.status!==200||!object(h.data)||h.data.app!=='aetherfest-college-lab'||h.data.synthetic!==true)throw Error('WRONG_TARGET');
    for(const [id,c] of Object.entries(users) as [Actor,typeof users[Actor]][]){
     const r=await request('/api/auth/login',{method:'POST',body:{email:c.email,password:c.password}});
     if(r.status!==200||!object(r.data)||typeof r.data.token!=='string'||r.data.token.length<20)throw Error('LOGIN_FAILED');
     sessions[id]=r.data.token;if(!await validateActor(id))throw Error('IDENTITY_MISMATCH');
    }
    for(const [id,meta] of Object.entries(registrations)){
     const r=await request('/api/registrations/'+id,{actor:meta.owner as Actor});
     if(r.status!==200||!object(r.data)||!object(r.data.registration)||r.data.registration.registrationId!==id||r.data.registration.ownerUserId!==meta.owner||r.data.registration.privateMarker!==meta.marker)throw Error('OWNERSHIP_BASELINE_MISMATCH');
    }
    const settings=await snapshotSettings();
    if(settings.ticketPrice!==499||settings.earlyBirdPrice!==349||settings.festName!=='AETHER')throw Error('FEST_BASELINE_DIRTY');
    ready=true;return {ready:true};
   }catch{return {ready:false,reason:'FEST_LAB_OFFLINE_OR_BASELINE_DIRTY'};}
  },
  async validateActor(actorRef){if(!ready||!(actorRef in users))return false;try{return await validateActor(actorRef as Actor);}catch{return false;}},
  async authHeaders(actorRef){if(!ready||!(actorRef in users)||!sessions[actorRef as Actor])throw Error('INVALID_ACTOR');return {Authorization:'Bearer '+sessions[actorRef as Actor]};},
  async resolve(test){
   const kind=check(test);const path=kind==='registration'?'/api/registrations/'+test.resourceRef:'/api/fest/settings';
   if(!approvedPaths.has(path))throw Error('PATH_NOT_APPROVED');
   if(kind==='registration')return {path,method:'GET'};
   if(!test.mutationRef||!mutations[test.mutationRef])throw Error('INVALID_MUTATION');
   return {path,method:'PATCH',body:structuredClone(mutations[test.mutationRef])};
  },
  matchesProtectedFixture(test,body){
   if(check(test)!=='registration'||!object(body)||!object(body.registration))return false;
   const m=registrations[test.resourceRef as keyof typeof registrations];if(!m)return false;
   return body.registration.registrationId===test.resourceRef&&body.registration.ownerUserId===m.owner&&body.registration.privateMarker===m.marker;
  },
  async snapshot(test){if(check(test)!=='settings')throw Error('READ_SNAPSHOT_NOT_REQUIRED');return snapshotSettings();},
  compareState(test,before,after){
   if(check(test)!=='settings'||!object(before)||!object(after)||before.festName!=='AETHER'||after.festName!=='AETHER')throw Error('INVALID_SNAPSHOT');
   const changed=!isDeepStrictEqual(before,after);
   const expected=test.mutationRef?mutations[test.mutationRef]:undefined;
   return {changed,intendedChange:changed&&Boolean(expected&&isDeepStrictEqual({...before,...expected},after))};
  },
  async restore(test,original){
   if(check(test)!=='settings'||!object(original))throw Error('INVALID_RESTORE');
   const r=await request('/api/lab/reset',{method:'POST',actor:'head',body:{}});
   if(r.status!==200||!object(r.data)||r.data.reset!==true)throw Error('FEST_RESET_FAILED');
   const after=await snapshotSettings();if(!isDeepStrictEqual(original,after))throw Error('FEST_RESTORE_MISMATCH');
  }
 };
}
