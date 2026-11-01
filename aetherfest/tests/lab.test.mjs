import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {setTimeout as delay} from 'node:timers/promises';
const base='http://127.0.0.1:4400';
async function req(path,{method='GET',token,body}={}){const r=await fetch(base+path,{method,headers:{...(token?{Authorization:'Bearer '+token}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(1800)});return {status:r.status,data:await r.json()};}
async function ready(){for(let i=0;i<40;i++){try{const r=await req('/api/health');if(r.data.app==='aetherfest-college-lab')return;}catch{}await delay(80);}throw Error('Lab failed to launch');}
async function login(email,password){const r=await req('/api/auth/login',{method:'POST',body:{email,password}});assert.equal(r.status,200);return r.data.token;}
async function withApp(mode,fn){const p=spawn(process.execPath,['src/server.mjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,FEST_MODE:mode},stdio:'ignore'});try{await ready();await fn();}finally{p.kill();await new Promise(resolve=>p.once('exit',resolve));await delay(80);}}
test('vulnerable training mode: cross-student registration read and head-only ticket edit both bypassed',async()=>{
 await withApp('vulnerable',async()=>{
  const a=await login('aarav@aetherfest.test','StudentA!26');const b=await login('diya@aetherfest.test','StudentB!26');const head=await login('head@aetherfest.test','HeadDemo!26');
  const own=await req('/api/registrations/reg-a-1001',{token:a});assert.equal(own.status,200);assert.equal(own.data.registration.ownerUserId,'student-a');
  const leak=await req('/api/registrations/reg-b-1002',{token:a});assert.equal(leak.status,200);assert.equal(leak.data.registration.privateMarker,'AETHER_PRIVATE_B_84PD2');
  const price=await req('/api/fest/settings',{method:'PATCH',token:b,body:{ticketPrice:1}});assert.equal(price.status,200);
  const seen=await req('/api/fest');assert.equal(seen.data.fest.ticketPrice,1);
  const noAdminRead=await req('/api/fest/settings',{token:b});assert.equal(noAdminRead.status,403);
  const anonymous=await req('/api/registrations/reg-b-1002');assert.equal(anonymous.status,401);
  const reset=await req('/api/lab/reset',{method:'POST',token:head,body:{}});assert.equal(reset.data.reset,true);
  assert.equal((await req('/api/fest')).data.fest.ticketPrice,499);
 });
});
test('secure mode: both unauthorized access paths are denied but head remains functional',async()=>{
 await withApp('secure',async()=>{
  const a=await login('aarav@aetherfest.test','StudentA!26');const b=await login('diya@aetherfest.test','StudentB!26');const head=await login('head@aetherfest.test','HeadDemo!26');
  assert.equal((await req('/api/registrations/reg-a-1001',{token:a})).status,200);
  assert.equal((await req('/api/registrations/reg-b-1002',{token:b})).status,200);
  assert.equal((await req('/api/registrations/reg-b-1002',{token:a})).status,403);
  assert.equal((await req('/api/fest/settings',{method:'PATCH',token:b,body:{ticketPrice:1}})).status,403);
  assert.equal((await req('/api/fest')).data.fest.ticketPrice,499);
  assert.equal((await req('/api/fest/settings',{method:'PATCH',token:head,body:{ticketPrice:549}})).status,200);
  assert.equal((await req('/api/fest')).data.fest.ticketPrice,549);
  assert.equal((await req('/api/lab/reset',{method:'POST',token:head,body:{}})).status,200);
 });
});
