import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=resolve(fileURLToPath(new URL('../../',import.meta.url)));
const base='http://127.0.0.1:4300';
let server;const headers={};
async function req(path,{method='GET',token,body}={}){
 const res=await fetch(base+path,{method,redirect:'manual',signal:AbortSignal.timeout(2500),headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});
 return {status:res.status,data:await res.json()};
}
test.before(async()=>{
 server=spawn(process.execPath,[resolve(root,'lab/hospital-synthetic-lab/server.mjs')],{stdio:'ignore'});
 for(let i=0;i<45;i++){
   try{const h=await req('/api/health');if(h.data.app==='cantheyseeit-hospital-synthetic-lab')return;}catch{}
   if(server.exitCode!==null)break;
   await delay(100);
 }
 throw Error('Fictional hospital lab not available on port 4300');
});
test.after(async()=>{server?.kill();await delay(50);});
test('local fictional hospital has a real beginner-readable website',async()=>{
 const r=await fetch(base+'/');const html=await r.text();
 assert.equal(r.status,200);assert.match(html,/CareBridge/);assert.match(html,/Patient A/);assert.match(html,/FAKE DATA/);
});
test('genuine test identities and fictional private records',async()=>{
 for(const [id,email,password] of [['patient-a','avery@care.example','PatientA!26'],['patient-b','blake@care.example','PatientB!26'],['clinician-1','doctor@care.example','clinician-demo-26'],['hospital-admin','admin@care.example','admin-demo-26']]){
  const r=await req('/api/auth/token',{method:'POST',body:{email,password}});assert.equal(r.status,200);
  headers[id]=r.data.token;const me=await req('/api/me',{token:headers[id]});assert.equal(me.data.userId,id);
 }
 const own=await req('/api/patient-records/record-a-101',{token:headers['patient-a']});
 assert.equal(own.status,200);assert.equal(own.data.record.privateMarker,'PATIENT_A_PRIVATE_5C4B');
});
test('other patient and logged-out user cannot read patient A record',async()=>{
 assert.equal((await req('/api/patient-records/record-a-101',{token:headers['patient-b']})).status,403);
 assert.equal((await req('/api/patient-records/record-a-101')).status,401);
});
test('assigned clinician may read, patient may not rewrite clinical notes',async()=>{
 assert.equal((await req('/api/patient-records/record-a-101',{token:headers['clinician-1']})).status,200);
 const edit=await req('/api/patient-records/record-a-101',{method:'PATCH',token:headers['patient-a'],body:{clinicalNote:'NOT ALLOWED'}});
 assert.equal(edit.status,403);
});
test('only owner can modify contact note and forbidden writes preserve data',async()=>{
 const path='/api/patient-records/record-a-101';const before=(await req(path,{token:headers['patient-a']})).data.record;
 assert.equal((await req(path,{method:'PATCH',token:headers['patient-b'],body:{contactNote:'FORBIDDEN'}})).status,403);
 assert.deepEqual((await req(path,{token:headers['patient-a']})).data.record,before);
 const good=await req(path,{method:'PATCH',token:headers['patient-a'],body:{contactNote:'ALLOWED SYNTHETIC'}});
 assert.equal(good.status,200);assert.equal(good.data.record.contactNote,'ALLOWED SYNTHETIC');
 const restored=await req('/__test/restore',{method:'POST',token:headers['hospital-admin'],body:{resourceId:'record-a-101',original:before}});
 assert.equal(restored.status,200);
 assert.deepEqual((await req(path,{token:headers['patient-a']})).data.record,before);
});
test('only hospital admin can modify settings, and protected record owner cannot be reassigned',async()=>{
 const denied=await req('/api/clinical/settings',{method:'PATCH',token:headers['patient-b'],body:{supportEmail:'forbidden@care.example'}});
 assert.equal(denied.status,403);
 const edit=await req('/api/patient-records/record-a-101',{method:'PATCH',token:headers['patient-a'],body:{ownerUserId:'patient-b'}});
 assert.equal(edit.status,400);
});
test('planted patient file privacy failure is independently observable',async()=>{
 const own=await req('/api/patient-files/file-a-101',{token:headers['patient-a']});
 const cross=await req('/api/patient-files/file-a-101',{token:headers['patient-b']});
 assert.equal(own.status,200);assert.equal(cross.status,200);
 assert.equal(cross.data.file.ownerUserId,'patient-a');assert.equal(cross.data.file.privateMarker,'FILE_A_PRIVATE_8A63');
});
