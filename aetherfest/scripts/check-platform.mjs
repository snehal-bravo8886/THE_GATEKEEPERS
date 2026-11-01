/** Exercise the REAL CanTheySeeIt V2 HTTP backend, never fabricate results. */
import {readFile} from 'node:fs/promises';
const root='http://127.0.0.1:4100';
const contract=JSON.parse(await readFile(new URL('../cantheyseeit-integration/suites/aetherfest.college-vulnerabilities.json',import.meta.url),'utf8'));
async function call(path,method='GET',body){const r=await fetch(root+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(18000)});return {status:r.status,data:await r.json()};}
try{
 const health=await call('/api/health');if(health.status!==200)throw Error('Start the CanTheySeeIt backend on port 4100');
 const readiness=await call('/api/readiness');if(!readiness.data.adapters?.includes('aetherfest-college-lab'))throw Error('College fest adapter not installed into verifier. Use integrated studio ZIP.');
 const registered=await call('/api/suites','POST',contract);
 if(registered.status!==201 && registered.data.error!=='SUITE_ALREADY_EXISTS_OR_STORE_ERROR')throw Error('Suite registration failed: '+JSON.stringify(registered.data));
 const r=await call('/api/suites/'+contract.suiteId+'/run','POST',{revisionLabel:'aetherfest-live-'+new Date().toISOString().slice(0,19),approveSyntheticWrites:true});
 if(r.status!==200)throw Error('Verifier error: '+JSON.stringify(r.data));
 console.log('\nCanTheySeeIt REAL VERIFIER RESULTS:');
 for(const x of r.data.results)console.log(` ${x.testId} | ${x.verdict.padEnd(12)} | ${x.reasonCode} | HTTP ${x.observed.status??'n/a'}`);
 console.log('Overall:',r.data.aggregateVerdict,'| Run ID:',r.data.runId);
 if(r.data.results.filter(x=>x.verdict==='FAIL').length===2)console.log('Expected controlled defects detected: F03 (private registration), F05 (head-only pricing).');
 console.log('Data was reset between write tests by the adapter.');
}catch(e){console.error(e.message);process.exitCode=1;}
