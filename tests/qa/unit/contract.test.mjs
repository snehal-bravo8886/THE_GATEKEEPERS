import test from "node:test";
import assert from "node:assert/strict";
import { CASES, TEST_IDS, RECORDS, makeResult, makeRun, promiseInput } from "../fixtures/contract-v1.mjs";
import { auditGeneratedTests, auditNoSensitiveData, auditRun, expectedAggregate, comparableRuns } from "../lib/qa-contract.mjs";

test("five stable test IDs, policy and synthetic records are correct", () => {
  assert.equal(CASES.length, 5);
  assert.deepEqual(CASES.map((c) => c.testId), TEST_IDS);
  assert.equal(promiseInput().confirmedPolicy.policyType, "OWNER_ONLY_READ");
  assert.notEqual(RECORDS.aliceExam.marker, RECORDS.bobExam.marker);
  assert.deepEqual(auditGeneratedTests(CASES.map(c => ({...c, method:"GET", path: RECORDS[c.resourceRef].path}))), []);
});

test("generator audit catches an incorrect actor or unexpected status", () => {
  const generated = CASES.map(c => ({...c, method:"GET", path:RECORDS[c.resourceRef].path}));
  generated[2].actorRef = "alice";
  generated[4].allowedStatuses = [403];
  assert.match(auditGeneratedTests(generated).join(" "), /incorrect actorRef/);
  assert.match(auditGeneratedTests(generated).join(" "), /wrong accepted statuses/);
});

test("five valid results aggregate to PASS", () => {
  assert.equal(expectedAggregate(TEST_IDS.map(id => makeResult(id))), "PASS");
  assert.deepEqual(auditRun(makeRun()), []);
});
test("any confirmed FAIL outranks an unresolved test", () => {
  const results = TEST_IDS.map(id => makeResult(id));
  results[2] = makeResult(TEST_IDS[2], "FAIL", {observedStatus:200, reasonCode:"PROTECTED_MARKER_EXPOSED"});
  results[3] = makeResult(TEST_IDS[3], "INCONCLUSIVE", {observedStatus:500, reasonCode:"TARGET_SERVER_ERROR"});
  assert.equal(expectedAggregate(results), "FAIL");
});
test("INCONCLUSIVE or NOT_RUN can never aggregate to PASS", () => {
  const results = TEST_IDS.map(id => makeResult(id));
  results[2] = makeResult(TEST_IDS[2], "INCONCLUSIVE", {reasonCode:"AUTHENTICATED_DENIAL_UNVERIFIED"});
  assert.equal(expectedAggregate(results), "INCONCLUSIVE");
  results[2] = makeResult(TEST_IDS[2], null, {executionStatus:"NOT_RUN", observedStatus:null, prerequisitesValid:null, reasonCode:"NOT_RUN_DEPENDENCY_FAILED"});
  assert.equal(expectedAggregate(results), "INCONCLUSIVE");
});
test("false PASS and invalid NOT_RUN are rejected by run audit", () => {
  const run = makeRun();
  run.results[2].prerequisitesValid = false;
  assert.match(auditRun(run).join(" "), /false PASS/);
  run.results[2] = makeResult(TEST_IDS[2], null, {executionStatus:"NOT_RUN", observedStatus:403, prerequisitesValid:null, reasonCode:"NOT_RUN_DEPENDENCY_FAILED"});
  assert.match(auditRun(run).join(" "), /NOT_RUN requires null/);
});
test("token fields, raw responses and bearer credentials are not acceptable evidence", () => {
  assert.notEqual(auditNoSensitiveData({ evidence:{ token:"test-secret" }}).length, 0);
  assert.notEqual(auditNoSensitiveData({ reason:"Bearer abcdefghijklmnopqrst" }).length, 0);
  assert.notEqual(auditRun(makeRun({results:TEST_IDS.map((id,i) => i===0 ? makeResult(id,"PASS",{evidence:{rawResponseStored:false,rawBody:"private"}}) : makeResult(id))})).length,0);
});
test("comparable history requires same immutable promise and hash", () => {
  const a = makeRun(), b = makeRun({runId:"another-run",revisionLabel:"v2-regression"});
  assert.equal(comparableRuns(a,b),true);
  assert.equal(comparableRuns(a,{...b,contractHash:"sha256:"+"b".repeat(64)}),false);
  assert.equal(comparableRuns(a,{...b,promiseId:"another-promise"}),false);
});
