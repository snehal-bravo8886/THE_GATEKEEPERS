import test from "node:test";
import assert from "node:assert/strict";
import { GROCERY_CASES, ONBOARDING_CASES } from "../fixtures/grocery-cases-proposed.mjs";
import { expectedWriteVerdict } from "../lib/grocery-write-oracle.mjs";

test("grocery cases have distinct IDs and cover GET, PATCH and protected-property scenarios", () => {
  assert.equal(GROCERY_CASES.length,12);
  assert.equal(new Set(GROCERY_CASES.map(x=>x.id)).size,12);
  assert.deepEqual(GROCERY_CASES.map(x=>x.id),Array.from({length:12},(_,i)=>"G"+String(i+1).padStart(2,"0")));
  assert.ok(GROCERY_CASES.some(x=>x.method==="GET"));
  assert.ok(GROCERY_CASES.some(x=>x.method==="PATCH"&&x.expected==="DENY"));
  assert.ok(GROCERY_CASES.some(x=>x.type==="PROPERTY_GUARD"));
  assert.ok(GROCERY_CASES.some(x=>x.type==="QA_FAULT"));
});
test("onboarding proposal covers consent, unsupported targets, idempotency and truthful provenance", () => {
  assert.equal(ONBOARDING_CASES.length,7);
  assert.equal(new Set(ONBOARDING_CASES.map(x=>x.id)).size,7);
  for (const expected of ["REJECT_WITHOUT_MUTATION","REJECT_WITHOUT_NETWORK","IDEMPOTENT","TRUTHFUL_PROVENANCE","NEW_PROFILE_USED_BY_RUNNER"]) {
    assert.ok(ONBOARDING_CASES.some(x=>x.expected===expected));
  }
});
const base = { expectedAccess:"DENY",authenticated:true,actorValid:true,
  fixtureValid:true,beforeVerified:true,afterVerified:true,observedStatus:403,
  stateChanged:false,intendedChangeOnly:false };
test("authorized denial + unchanged persisted state is PASS",()=>assert.equal(expectedWriteVerdict(base),"PASS"));
test("a forbidden mutation is FAIL even if the server returns 403",()=>assert.equal(expectedWriteVerdict({...base,stateChanged:true}),"FAIL"));
test("an expired session cannot produce a false PASS",()=>assert.equal(expectedWriteVerdict({...base,actorValid:false,observedStatus:401}),"INCONCLUSIVE"));
test("without before/after snapshots we cannot claim a safe denial",()=>assert.equal(expectedWriteVerdict({...base,afterVerified:false}),"INCONCLUSIVE"));
test("unexpected successful HTTP status with unchanged state is not evidence of valid denial",()=>assert.equal(expectedWriteVerdict({...base,observedStatus:200}),"INCONCLUSIVE"));
test("anonymous denial requires the configured 401 and no changes",()=>{
  assert.equal(expectedWriteVerdict({...base,authenticated:false,actorValid:false,observedStatus:401}),"PASS");
});
test("authorized PATCH passes only with exactly intended state change",()=>{
  const allowed={...base,expectedAccess:"ALLOW",observedStatus:200,stateChanged:true,intendedChangeOnly:true};
  assert.equal(expectedWriteVerdict(allowed),"PASS");
  assert.equal(expectedWriteVerdict({...allowed,intendedChangeOnly:false}),"INCONCLUSIVE");
  assert.equal(expectedWriteVerdict({...allowed,stateChanged:false}),"INCONCLUSIVE");
});
test("absent fixture or unverified before state makes the write check INCONCLUSIVE",()=>{
  assert.equal(expectedWriteVerdict({...base,fixtureValid:false}),"INCONCLUSIVE");
  assert.equal(expectedWriteVerdict({...base,beforeVerified:false}),"INCONCLUSIVE");
});
