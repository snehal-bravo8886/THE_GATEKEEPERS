/** Authorized LOCAL synthetic lab only. Exposes no real account credentials. */
const base='http://127.0.0.1:4400';
async function call(path,opts={}){const r=await fetch(base+path,{...opts,headers:{...(opts.token?{Authorization:'Bearer '+opts.token}:{}),...(opts.body?{'Content-Type':'application/json'}:{})}});return {status:r.status,body:await r.json()};}
async function login(email,password){const r=await call('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})});if(!r.body.token)throw Error('Login failed');return r.body.token;}
try{
 const head=await login('head@aetherfest.test','HeadDemo!26');
 const a=await login('aarav@aetherfest.test','StudentA!26');
 const b=await login('diya@aetherfest.test','StudentB!26');
 const before=await call('/api/fest',{token:b});
 const exposed=await call('/api/registrations/reg-b-1002',{token:a});
 const update=await call('/api/fest/settings',{method:'PATCH',token:b,body:JSON.stringify({ticketPrice:1})});
 const after=await call('/api/fest',{token:b});
 console.log('\nAETHER COLLEGE FEST — LOCAL DEMO\n');
 console.log('Bug 1: Student A reads B private registration.');
 console.log('  HTTP:',exposed.status,'| B record leaked:',exposed.body.registration?.ownerUserId==='student-b');
 console.log('Bug 2: Student B changes head-only price.');
 console.log('  HTTP:',update.status,'| Original price:',before.body.fest.ticketPrice,'| New price:',after.body.fest.ticketPrice);
 const reset=await call('/api/lab/reset',{method:'POST',token:head,body:'{}'});
 console.log('Synthetic fixture reset:',reset.body.reset===true);
 console.log('Expected in vulnerable mode: two security FAIL verdicts for F03 and F05.');
 console.log('Expected in secure mode: both are denied, and no protected data is changed.\n');
}catch(e){console.error('Start the local fest website first: node src/server.mjs\n'+e.message);process.exitCode=1;}
