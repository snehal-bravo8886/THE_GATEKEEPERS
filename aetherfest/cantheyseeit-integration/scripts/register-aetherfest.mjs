import {readFile} from 'node:fs/promises';
const input=JSON.parse(await readFile(new URL('../suites/aetherfest.college-vulnerabilities.json',import.meta.url),'utf8'));
const r=await fetch('http://127.0.0.1:4100/api/suites',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal:AbortSignal.timeout(5000)});
const data=await r.json();
if(r.status===201)console.log('REGISTERED AetherFest suite,',data.checkCount,'real tests.');
else if(r.status===409&&data.error==='SUITE_ALREADY_EXISTS_OR_STORE_ERROR')console.log('Already registered:',input.suiteId);
else {console.error('Cannot register:',r.status,data);process.exitCode=1;}
