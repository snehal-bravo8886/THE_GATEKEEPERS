/** Fictional hospital test lab. Deliberately vulnerable patient-file endpoint.
 * Fixed 127.0.0.1:4300 only; synthetic data and accounts only. NEVER expose publicly.
 */
import http from 'node:http';
import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
const PORT=4300;
const home=readFileSync(new URL('./public/index.html',import.meta.url));
const identities={
  'patient-a':{email:'avery@care.example',password:'PatientA!26',role:'patient'},
  'patient-b':{email:'blake@care.example',password:'PatientB!26',role:'patient'},
  'clinician-1':{email:'doctor@care.example',password:'clinician-demo-26',role:'clinician'},
  'hospital-admin':{email:'admin@care.example',password:'admin-demo-26',role:'admin'}
};
const initial={
 'record-a-101':{recordId:'record-a-101',ownerUserId:'patient-a',privateMarker:'PATIENT_A_PRIVATE_5C4B',contactNote:'Synthetic A initial',clinicalNote:'Synthetic follow-up note'},
 'record-b-102':{recordId:'record-b-102',ownerUserId:'patient-b',privateMarker:'PATIENT_B_PRIVATE_6E9F',contactNote:'Synthetic B initial',clinicalNote:'Synthetic routine note'},
 'file-a-101':{fileId:'file-a-101',ownerUserId:'patient-a',privateMarker:'FILE_A_PRIVATE_8A63',filename:'synthetic-a-report.txt',content:'TRAINING DATA - DO NOT USE FOR MEDICINE'},
 'file-b-102':{fileId:'file-b-102',ownerUserId:'patient-b',privateMarker:'FILE_B_PRIVATE_7E18',filename:'synthetic-b-report.txt',content:'TRAINING DATA - DO NOT USE FOR MEDICINE'},
 'hospital-settings':{hospitalName:'CareBridge Demo Clinic',supportEmail:'test-support@care.example',allowPatientSelfEdit:true}
};
let data=structuredClone(initial);
const sessions=new Map();
const send=(res,code,payload)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(payload));};
const reject=(res,code,msg)=>send(res,code,{error:{code:code===401?'UNAUTHENTICATED':code===403?'FORBIDDEN':'INVALID_REQUEST',message:msg}});
async function jsonBody(req){let text='';for await(const chunk of req){text+=chunk;if(text.length>4096)throw Error('too large');}return text?JSON.parse(text):{};}
function actor(req){const key=(req.headers.authorization||'').match(/^Bearer (\S+)$/)?.[1];return key?sessions.get(key):undefined;}
function assignedClinician(a,id){return a==='clinician-1' && id==='record-a-101';}
const server=http.createServer(async(req,res)=>{
 try{
  const path=new URL(req.url,'http://127.0.0.1').pathname;const method=req.method;
  if(method==='GET'&&path==='/'){res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(home);return;}
  if(method==='GET'&&path==='/api/health')return send(res,200,{app:'cantheyseeit-hospital-synthetic-lab',synthetic:true});
  if(method==='POST'&&path==='/api/auth/token'){
   const b=await jsonBody(req);const found=Object.entries(identities).find(([,v])=>v.email===b.email&&v.password===b.password);
   if(!found)return reject(res,401,'Invalid synthetic credentials');
   const token=randomBytes(24).toString('hex');sessions.set(token,found[0]);return send(res,200,{token});
  }
  const id=actor(req);if(!id)return reject(res,401,'Sign in to the training hospital');
  if(method==='GET'&&path==='/api/me')return send(res,200,{userId:id,role:identities[id].role});
  const recordMatch=path.match(/^\/api\/patient-records\/(record-[ab]-10[12])$/);
  if(recordMatch){const key=recordMatch[1],r=data[key];if(!r)return reject(res,404,'Unknown synthetic patient record');
   if(method==='GET')return id===r.ownerUserId||assignedClinician(id,key)?send(res,200,{record:r}):reject(res,403,'This is not your record');
   if(method==='PATCH'){
    const b=await jsonBody(req);const keys=Object.keys(b);
    if(keys.length!==1||!['contactNote','clinicalNote'].includes(keys[0])||typeof b[keys[0]]!=='string'||b[keys[0]].length>150)return reject(res,400,'Field cannot be changed');
    if(keys[0]==='contactNote'&&id!==r.ownerUserId)return reject(res,403,'Only the patient may change contact notes');
    if(keys[0]==='clinicalNote'&&!assignedClinician(id,key))return reject(res,403,'Only assigned clinician may change clinical notes');
    r[keys[0]]=b[keys[0]];return send(res,200,{record:r});
   }
  }
  const fileMatch=path.match(/^\/api\/patient-files\/(file-[ab]-10[12])$/);
  if(fileMatch && method==='GET'){
   const f=data[fileMatch[1]];
   // DELIBERATELY VULNERABLE training route: any authenticated patient can read other patient's file.
   return send(res,200,{file:f});
  }
  if(path==='/api/clinical/settings'){
   if(method==='GET')return id==='hospital-admin'?send(res,200,{settings:data['hospital-settings']}):reject(res,403,'Admin access required');
   if(method==='PATCH'){
    const b=await jsonBody(req);if(id!=='hospital-admin')return reject(res,403,'Admin access required');
    if(typeof b.supportEmail!=='string'||Object.keys(b).length!==1||b.supportEmail.length>120)return reject(res,400,'Invalid setting');
    data['hospital-settings'].supportEmail=b.supportEmail;return send(res,200,{settings:data['hospital-settings']});
   }
  }
  if(path==='/__test/restore' && method==='POST'){
   if(id!=='hospital-admin')return reject(res,403,'Admin fixture reset required');
   const b=await jsonBody(req);if(!Object.hasOwn(initial,b.resourceId))return reject(res,400,'Unknown fixture');
   if(JSON.stringify(Object.keys(b.original||{}).sort())!==JSON.stringify(Object.keys(initial[b.resourceId]).sort()))return reject(res,400,'Invalid snapshot shape');
   if(Object.keys(initial[b.resourceId]).some(k=>typeof b.original[k]!==typeof initial[b.resourceId][k]))return reject(res,400,'Invalid snapshot types');
   data[b.resourceId]=structuredClone(b.original);return send(res,200,{restored:true});
  }
  return reject(res,404,'No such API route');
 }catch{return reject(res,400,'Invalid synthetic request');}
});
server.on('error',error=>{console.error('Hospital lab could not bind to port 4300:',error.message);process.exitCode=1;});
server.listen(PORT,'127.0.0.1',()=>console.log('CareBridge synthetic hospital lab -> http://127.0.0.1:4300 (FICTIONAL DATA ONLY)'));
